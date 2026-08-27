import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
} from "quicktype-core";
import type { ConvertOptions } from "../types.ts";
import { applyEquatable } from "../lib/equatable.ts";
import { improveNames } from "../lib/improveNames.ts";

export interface ConvertRequest {
  samples: string[]; // 1+ contoh JSON dari endpoint sama → model gabungan (T8.2)
  className: string;
  options: ConvertOptions;
}
export type ConvertResponse = { code: string } | { error: string };

function rendererOptionsFor(o: ConvertOptions): Record<string, string> {
  const r: Record<string, string> = {};
  if (o.target === "dart") {
    if (o.nullSafety) r["null-safety"] = "true";
    if (o.freezed) r["use-freezed"] = "true";
    if (o.jsonAnnotation) r["use-json-annotation"] = "true";
    if (o.copyWith) r["copy-with"] = "true";
  } else if (o.target === "python") {
    if (o.pythonPydantic) r["pydantic-base-model"] = "true";
  } else if (o.target === "java") {
    if (o.javaLombok) r["lombok"] = "true";
  } else if (o.target === "csharp") {
    if (o.csharpSystemText) r["framework"] = "SystemTextJson";
  } else if (o.target === "rust") {
    if (o.rustDerive) {
      r["derive-debug"] = "true";
      r["derive-clone"] = "true";
    }
  }
  return r;
}

async function convert(req: ConvertRequest): Promise<string> {
  // TargetLang ("dart"|"kotlin"|"swift"|"typescript") = nama bahasa quicktype apa adanya.
  const lang = req.options.target;
  const input = jsonInputForTargetLanguage(lang);
  await input.addSource({ name: req.className, samples: req.samples });
  const inputData = new InputData();
  inputData.addInput(input);

  const { lines } = await quicktype({
    inputData,
    lang,
    rendererOptions: rendererOptionsFor(req.options),
  });
  let code = lines.join("\n");

  // Perbaiki nama nested class acak quicktype (PurpleY → Y) untuk semua bahasa (T8.1).
  code = improveNames(code);

  // Equatable hanya untuk output Dart plain: freezed & json_serializable sudah
  // punya kesetaraan/anotasi sendiri, jangan campur.
  const o = req.options;
  if (o.target === "dart" && o.equatable && !o.freezed && !o.jsonAnnotation) {
    code = applyEquatable(code);
  }
  return code;
}

self.onmessage = async (e: MessageEvent<ConvertRequest>) => {
  try {
    for (const s of e.data.samples) JSON.parse(s); // validasi tiap sampel
    const code = await convert(e.data);
    self.postMessage({ code } satisfies ConvertResponse);
  } catch (err: any) {
    self.postMessage({ error: err?.message ?? "conversion failed" } satisfies ConvertResponse);
  }
};
