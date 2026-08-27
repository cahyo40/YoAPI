export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HeaderPair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  params: HeaderPair[];
  body: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  sizeBytes: number;
}

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  at: number;
  body?: string; // body response (T9.2) — untuk diff; opsional (entri lama tak punya)
}

export type TargetLang =
  | "dart"
  | "kotlin"
  | "swift"
  | "typescript"
  | "go"
  | "python"
  | "java"
  | "csharp"
  | "rust";

export interface ConvertOptions {
  target: TargetLang;
  // Dart-only
  freezed: boolean;
  nullSafety: boolean;
  jsonAnnotation: boolean; // json_serializable
  copyWith: boolean;
  equatable: boolean; // hanya berlaku untuk output plain (tanpa freezed/json_serializable)
  // Per-bahasa lain (satu toggle high-value tiap bahasa)
  pythonPydantic: boolean; // Python: pydantic BaseModel (bukan dataclass)
  javaLombok: boolean; // Java: anotasi Lombok (@Data dll)
  csharpSystemText: boolean; // C#: System.Text.Json (bukan Newtonsoft)
  rustDerive: boolean; // Rust: derive Debug + Clone
}
