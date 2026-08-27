import type { HeaderPair, HttpMethod } from "../types.ts";

export interface PostmanRequest {
  name: string;
  method: HttpMethod;
  url: string; // base URL tanpa query (query masuk ke params)
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
}
export interface ParsedPostman {
  name: string;
  items: PostmanRequest[];
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function toMethod(m: unknown): HttpMethod {
  const up = String(m ?? "GET").toUpperCase();
  return (METHODS as string[]).includes(up) ? (up as HttpMethod) : "GET";
}

// Postman url bisa string atau objek {raw, query[]}. Ambil base (tanpa "?") + params.
function parseUrl(url: any): { base: string; params: HeaderPair[] } {
  const raw = typeof url === "string" ? url : (url?.raw ?? "");
  const base = raw.split("?")[0];
  const params: HeaderPair[] = [];
  if (url && typeof url === "object" && Array.isArray(url.query)) {
    for (const q of url.query) {
      if (!q?.key) continue;
      params.push({ key: q.key, value: dec(q.value ?? ""), enabled: !q.disabled });
    }
  }
  return { base, params };
}

function parseHeaders(header: any): HeaderPair[] {
  if (!Array.isArray(header)) return [];
  return header
    .filter((h) => h?.key)
    .map((h) => ({ key: h.key, value: h.value ?? "", enabled: !h.disabled }));
}

function bodyRaw(body: any): string {
  // Hanya mode "raw" yang didukung; formdata/urlencoded diabaikan (lihat modal).
  return body && body.mode === "raw" ? (body.raw ?? "") : "";
}

// Item Postman bisa berupa request atau folder (punya `item[]`). Flatten rekursif.
function collect(items: any[], out: PostmanRequest[]) {
  for (const it of items ?? []) {
    if (Array.isArray(it?.item)) {
      collect(it.item, out); // folder → turun
    } else if (it?.request) {
      const req = it.request;
      const { base, params } = parseUrl(req.url);
      out.push({
        name: it.name || base || "Untitled",
        method: toMethod(req.method),
        url: base,
        headers: parseHeaders(req.header),
        params,
        body: bodyRaw(req.body),
      });
    }
  }
}

/** Parse Postman Collection v2.x JSON → folder name + daftar request. Throw bila bukan koleksi valid. */
export function parsePostman(raw: string): ParsedPostman {
  const json = JSON.parse(raw); // SyntaxError ditangani pemanggil
  if (!json || !Array.isArray(json.item)) {
    throw new Error("Bukan Postman Collection (field `item` tak ditemukan).");
  }
  const items: PostmanRequest[] = [];
  collect(json.item, items);
  return { name: json.info?.name?.trim() || "Imported Collection", items };
}

function dec(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
}
