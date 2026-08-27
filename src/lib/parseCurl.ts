import type { HeaderPair, HttpMethod } from "../types.ts";

export interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  body: string;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/** Pecah baris shell jadi token, hormati quote & backslash-newline (multiline cURL). */
function tokenize(input: string): string[] {
  const s = input.replace(/\\\r?\n/g, " "); // sambung baris yang di-escape
  const out: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  let has = false; // token sudah dimulai (bedakan "" dari tak ada token)
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === "\\" && quote === '"' && i + 1 < s.length) cur += s[++i];
      else cur += c;
    } else if (c === '"' || c === "'") {
      quote = c;
      has = true;
    } else if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      if (has) out.push(cur), (cur = ""), (has = false);
    } else {
      cur += c;
      has = true;
    }
  }
  if (has) out.push(cur);
  return out;
}

/** Parse perintah cURL → konfigurasi request. Dukung -X, -H, -d/--data, -b, -u, url berquote. */
export function parseCurl(raw: string): ParsedCurl {
  const tokens = tokenize(raw.trim());
  if (tokens[0] === "curl") tokens.shift();

  let method: HttpMethod | null = null;
  let url = "";
  const headers: HeaderPair[] = [];
  let body = "";

  const val = (inline: string | null) =>
    inline !== null ? inline : (tokens[++cursor] ?? "");
  let cursor = 0;
  for (cursor = 0; cursor < tokens.length; cursor++) {
    const t = tokens[cursor];
    // flag gabungan --data=xxx / -Hxxx
    const eq = t.startsWith("--") ? t.indexOf("=") : -1;
    const flag = eq > -1 ? t.slice(0, eq) : t;
    const inline = eq > -1 ? t.slice(eq + 1) : null;

    if (flag === "-X" || flag === "--request") {
      const m = val(inline).toUpperCase();
      if (METHODS.includes(m)) method = m as HttpMethod;
    } else if (flag === "-H" || flag === "--header") {
      const h = val(inline);
      const idx = h.indexOf(":");
      if (idx > -1) {
        headers.push({ key: h.slice(0, idx).trim(), value: h.slice(idx + 1).trim(), enabled: true });
      }
    } else if (["-d", "--data", "--data-raw", "--data-binary", "--data-ascii"].includes(flag)) {
      body = val(inline);
    } else if (flag === "-b" || flag === "--cookie") {
      headers.push({ key: "Cookie", value: val(inline), enabled: true });
    } else if (flag === "-u" || flag === "--user") {
      const cred = val(inline);
      headers.push({ key: "Authorization", value: `Basic ${btoa(cred)}`, enabled: true });
    } else if (flag === "--url") {
      url = val(inline);
    } else if (t.startsWith("-")) {
      // flag tanpa argumen yang kita abaikan (-s, -k, --compressed, -L, dst.)
    } else if (!url) {
      url = t;
    }
  }

  if (!method) method = body ? "POST" : "GET";
  return { method, url, headers, body };
}
