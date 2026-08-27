import type { HeaderPair, HttpMethod, TargetLang, ConvertOptions } from "../types.ts";
import { classNameFromUrl } from "./classNameFromUrl.ts";
import { makeZip, type ZipEntry } from "./zipStore.ts";
import { sendRequest } from "./sendRequest.ts";
import type { ConvertRequest, ConvertResponse } from "../workers/quicktype.worker.ts";

export interface ExportItem {
  name: string; // nama request (fallback classNameFromUrl)
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
}

const EXT: Record<TargetLang, string> = {
  dart: "dart",
  kotlin: "kt",
  swift: "swift",
  typescript: "ts",
  go: "go",
  python: "py",
  java: "java",
  csharp: "cs",
  rust: "rs",
};

function snake(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase() || "model";
}

/** Konversi satu JSON → kode via worker (satu worker sekali pakai per panggilan). */
function convertOne(json: string, className: string, options: ConvertOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../workers/quicktype.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<ConvertResponse>) => {
      worker.terminate();
      if ("code" in e.data) resolve(e.data.code);
      else reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message));
    };
    worker.postMessage({ samples: [json], className, options } satisfies ConvertRequest);
  });
}

/** File index/collection berisi daftar endpoint, dalam bahasa target. */
function indexFile(lang: TargetLang, rows: { className: string; method: string; url: string }[]): ZipEntry {
  const list = rows.map((r) => ({ name: r.className, method: r.method, url: r.url }));
  if (lang === "dart") {
    const items = list
      .map((r) => `  Endpoint(name: '${r.name}', method: '${r.method}', url: '${r.url}'),`)
      .join("\n");
    return {
      name: "endpoints.dart",
      data: `class Endpoint {\n  final String name;\n  final String method;\n  final String url;\n  const Endpoint({required this.name, required this.method, required this.url});\n}\n\nconst endpoints = <Endpoint>[\n${items}\n];\n`,
    };
  }
  if (lang === "kotlin") {
    const items = list.map((r) => `    Endpoint("${r.name}", "${r.method}", "${r.url}"),`).join("\n");
    return {
      name: "Endpoints.kt",
      data: `data class Endpoint(val name: String, val method: String, val url: String)\n\nval endpoints = listOf(\n${items}\n)\n`,
    };
  }
  if (lang === "swift") {
    const items = list
      .map((r) => `    Endpoint(name: "${r.name}", method: "${r.method}", url: "${r.url}"),`)
      .join("\n");
    return {
      name: "Endpoints.swift",
      data: `struct Endpoint {\n    let name: String\n    let method: String\n    let url: String\n}\n\nlet endpoints: [Endpoint] = [\n${items}\n]\n`,
    };
  }
  if (lang === "typescript") {
    return {
      name: "endpoints.ts",
      data: `export interface Endpoint {\n  name: string;\n  method: string;\n  url: string;\n}\n\nexport const endpoints: Endpoint[] = ${JSON.stringify(list, null, 2)};\n`,
    };
  }
  // go/python/java/csharp/rust: index bahasa-netral (JSON) — model per-endpoint tetap di bahasa target.
  return { name: "endpoints.json", data: JSON.stringify(list, null, 2) + "\n" };
}

export interface ExportResult {
  blob: Blob;
  errors: { name: string; error: string }[];
  exported: number;
}

/**
 * Pipeline export folder → zip. Tiap endpoint: re-fetch live → JSON → kode target.
 * Endpoint gagal ditandai di `errors`, tak menggagalkan batch. Selalu sertakan
 * file index endpoint. Nama file model: snake(className)_model.<ext>.
 */
export async function exportFolder(
  items: ExportItem[],
  target: TargetLang,
  dartOptions: Omit<ConvertOptions, "target">
): Promise<ExportResult> {
  const options: ConvertOptions = { ...dartOptions, target };
  const entries: ZipEntry[] = [];
  const errors: { name: string; error: string }[] = [];
  const indexRows: { className: string; method: string; url: string }[] = [];
  const usedNames = new Set<string>();

  for (const it of items) {
    const className = it.name?.trim() ? pascalize(it.name) : classNameFromUrl(it.url);
    let base = snake(className);
    while (usedNames.has(base)) base += "_x"; // hindari tabrakan nama file
    usedNames.add(base);
    indexRows.push({ className, method: it.method, url: it.url });

    // Request body (POST/PUT/PATCH): export JSON mentah + model bila JSON valid.
    // Simetris dengan response — nama pakai suffix _request.
    if (it.body.trim()) {
      entries.push({ name: `${base}_request.json`, data: pretty(it.body) });
      try {
        JSON.parse(it.body);
        const reqCode = await convertOne(it.body, `${className}Request`, options);
        entries.push({ name: `${base}_request_model.${EXT[target]}`, data: reqCode });
      } catch {
        // body bukan JSON (mis. form-urlencoded) → cukup simpan mentah, jangan gagalkan
      }
    }

    const res = await sendRequest({
      method: it.method,
      url: it.url,
      headers: it.headers,
      params: it.params,
      body: it.body,
    });
    if (!res.ok || !res.response) {
      errors.push({ name: className, error: res.error ?? "gagal fetch" });
      continue;
    }

    const raw = res.response.body;
    entries.push({ name: `${base}_response.json`, data: pretty(raw) });

    try {
      JSON.parse(raw); // hanya konversi bila JSON valid
      const code = await convertOne(raw, className, options);
      entries.push({ name: `${base}_model.${EXT[target]}`, data: code });
    } catch (e: any) {
      errors.push({ name: className, error: `response non-JSON / konversi gagal: ${e?.message ?? ""}` });
    }
  }

  entries.push(indexFile(target, indexRows));
  entries.push(readmeFile(target, indexRows, errors));
  return { blob: makeZip(entries), errors, exported: entries.length };
}

const LANG_LABEL: Record<TargetLang, string> = {
  dart: "Dart",
  kotlin: "Kotlin",
  swift: "Swift",
  typescript: "TypeScript",
  go: "Go",
  python: "Python",
  java: "Java",
  csharp: "C#",
  rust: "Rust",
};

const LANG_USAGE: Record<TargetLang, string> = {
  dart: "Jika model pakai Freezed / json_serializable, jalankan:\n\n```sh\ndart run build_runner build\n```",
  kotlin: "Tambahkan kotlinx.serialization bila perlu (de)serialisasi JSON.",
  swift: "Model mengadopsi `Codable` — pakai `JSONDecoder().decode(...)`.",
  typescript: "Import interface, parse dengan `JSON.parse` (tambahkan validasi runtime bila perlu).",
  go: "Struct sudah ber-tag `json:` — pakai `json.Unmarshal(data, &v)`.",
  python: "Model dataclass — deserialisasi lewat `Foo.from_dict(json.loads(data))`.",
  java: "Pakai Jackson/Gson: `mapper.readValue(json, Foo.class)`.",
  csharp: "Pakai `System.Text.Json`: `JsonSerializer.Deserialize<Foo>(json)`.",
  rust: "Struct turunan `serde::Deserialize` — pakai `serde_json::from_str(&data)`.",
};

/** README.md ringkas: daftar endpoint + cara pakai model per bahasa. */
function readmeFile(
  lang: TargetLang,
  rows: { className: string; method: string; url: string }[],
  errors: { name: string; error: string }[]
): ZipEntry {
  const list = rows
    .map((r) => `- \`${r.className}\` — ${r.method} ${r.url} → \`${snake(r.className)}_model.${EXT[lang]}\``)
    .join("\n");
  const usage = LANG_USAGE[lang];
  const failed =
    errors.length > 0
      ? `\n## Endpoint gagal\n\n${errors.map((e) => `- ${e.name}: ${e.error}`).join("\n")}\n`
      : "";
  return {
    name: "README.md",
    data: `# Export YoApi — ${LANG_LABEL[lang]}\n\nBerisi model ${LANG_LABEL[lang]} + JSON mentah (request & response) untuk tiap endpoint, plus daftar endpoint.\n\n## Endpoint\n\n${list}\n\n## Isi\n\n- \`*_model.${EXT[lang]}\` — model dari response\n- \`*_response.json\` — response mentah\n- \`*_request.json\` — body request mentah (POST/PUT/PATCH)\n- \`*_request_model.${EXT[lang]}\` — model dari body request (bila body JSON)\n- file daftar endpoint (\`endpoints.*\`)\n\n## Cara pakai\n\n${usage}\n${failed}`,
  };
}

function pretty(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

function pascalize(s: string): string {
  return (
    s
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("") || "Model"
  );
}
