// yoapi server — serve index.html + proxy CORS. Node stdlib, no deps.
// jalan: node server.mjs  → http://localhost:8000
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { request as httpsReq } from "node:https";
import { request as httpReq } from "node:http";

const PORT = 8000;

function proxy(target, method, headers, body, res) {
  let u;
  try { u = new URL(target); } catch { res.writeHead(400); return res.end("bad url"); }
  const lib = u.protocol === "https:" ? httpsReq : httpReq;
  // ponytail: forward hanya content-type; skip host/origin biar target tak nolak.
  const fwd = {};
  if (headers["content-type"]) fwd["content-type"] = headers["content-type"];
  const preq = lib(u, { method, headers: fwd }, pres => {
    res.writeHead(pres.statusCode, { ...pres.headers, "access-control-allow-origin": "*" });
    pres.pipe(res);
  });
  preq.on("error", e => { res.writeHead(502); res.end("proxy error: " + e.message); });
  if (body) preq.write(body);
  preq.end();
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/proxy") {
    const target = url.searchParams.get("url");
    if (!target) { res.writeHead(400); return res.end("missing url"); }
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => proxy(target, req.method, req.headers, chunks.length ? Buffer.concat(chunks) : null, res));
    return;
  }

  // static: hanya index.html
  try {
    const html = await readFile(new URL("./index.html", import.meta.url));
    res.writeHead(200, { "content-type": "text/html" });
    res.end(html);
  } catch {
    res.writeHead(404); res.end("not found");
  }
}).listen(PORT, () => console.log(`yoapi → http://localhost:${PORT}`));
