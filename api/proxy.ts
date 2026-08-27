import { lookup } from "node:dns/promises";
import { isBlockedIp } from "./ssrf.js"; // .js: Vercel Node ESM resolve, esbuild map ke ssrf.ts

// ponytail: rate-limit in-memory (reset tiap cold start), cukup untuk MVP.
// upgrade → Upstash Redis saat traffic naik / butuh konsisten antar-instance.
const RATE_LIMIT = Number(process.env.PROXY_RATE_LIMIT_PER_MIN || 60);
const hits = new Map<string, { count: number; resetAt: number }>();

const TIMEOUT_MS = 25_000; // di bawah batas Vercel 30 dtk
const MAX_BYTES = 10 * 1024 * 1024; // cap response 10 MB

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  rec.count++;
  return rec.count > RATE_LIMIT;
}

interface ProxyRequest {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

// Vercel Node function signature (req/res mirip Node http).
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate limit exceeded" });
    return;
  }

  const { url, method = "GET", headers = {}, body }: ProxyRequest = req.body ?? {};
  if (!url) {
    res.status(400).json({ error: "missing url" });
    return;
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    res.status(400).json({ error: "invalid url" });
    return;
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    res.status(400).json({ error: "only http/https allowed" });
    return;
  }

  // Resolve hostname, tolak jika mengarah ke IP internal (SSRF guard).
  try {
    const resolved = await lookup(target.hostname, { all: true });
    if (resolved.some((r) => isBlockedIp(r.address))) {
      res.status(403).json({ error: "target resolves to a blocked (private) address" });
      return;
    }
  } catch {
    res.status(502).json({ error: "dns resolution failed" });
    return;
  }

  // Hanya forward content-type; buang host/origin agar target tak menolak.
  const fwdHeaders: Record<string, string> = {};
  if (headers["Content-Type"] || headers["content-type"]) {
    fwdHeaders["content-type"] = headers["Content-Type"] || headers["content-type"];
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const upstream = await fetch(target.toString(), {
      method,
      headers: fwdHeaders,
      body: ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
      signal: ac.signal,
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      res.status(413).json({ error: "response too large (>10MB)" });
      return;
    }

    res.status(200).json({
      status: upstream.status,
      statusText: upstream.statusText,
      headers: Object.fromEntries(upstream.headers.entries()),
      body: buf.toString("utf-8"),
      timeMs: Date.now() - started,
      sizeBytes: buf.byteLength,
    });
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "upstream timeout" : `fetch failed: ${e?.message}`;
    res.status(502).json({ error: msg });
  } finally {
    clearTimeout(timer);
  }
}
