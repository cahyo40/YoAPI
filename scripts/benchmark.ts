// Benchmark T3.4: fetch 10 public APIs → quicktype Dart → dart analyze.
// Jalankan: node --experimental-strip-types scripts/benchmark.ts
// ponytail: pakai proxy tak perlu di node (tak ada CORS); fetch langsung.
import { quicktype, InputData, jsonInputForTargetLanguage } from "quicktype-core";
import { classNameFromUrl } from "../src/lib/classNameFromUrl.ts";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const APIS = [
  "https://jsonplaceholder.typicode.com/users/1",
  "https://jsonplaceholder.typicode.com/posts/1",
  "https://jsonplaceholder.typicode.com/comments/1",
  "https://jsonplaceholder.typicode.com/todos/1",
  "https://api.github.com/users/octocat",
  "https://api.github.com/repos/facebook/react",
  "https://pokeapi.co/api/v2/pokemon/ditto",
  "https://dog.ceo/api/breeds/image/random",
  "https://api.github.com/repos/flutter/flutter",
  "https://restcountries.com/v3.1/name/japan",
];

async function toDart(json: string, className: string): Promise<string> {
  const input = jsonInputForTargetLanguage("dart");
  await input.addSource({ name: className, samples: [json] });
  const data = new InputData();
  data.addInput(input);
  const { lines } = await quicktype({
    inputData: data,
    lang: "dart",
    rendererOptions: { "null-safety": "true" },
  });
  return lines.join("\n");
}

const dir = mkdtempSync(join(tmpdir(), "yoapi-bench-"));
let ok = 0;
const results: string[] = [];

for (const url of APIS) {
  const name = classNameFromUrl(url);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "yoapi-bench" } });
    const json = await res.text();
    JSON.parse(json); // pastikan valid
    const dart = await toDart(json, name);
    const file = join(dir, `${name.toLowerCase()}.dart`);
    writeFileSync(file, dart);
    // dart analyze: exit 0 = tak ada error/warning fatal.
    execFileSync("dart", ["analyze", file], { stdio: "pipe" });
    ok++;
    results.push(`✔ ${name.padEnd(14)} ${url}`);
  } catch (e: any) {
    const msg = (e.stdout?.toString() || e.message || "").split("\n").slice(0, 3).join(" ");
    results.push(`x ${name.padEnd(14)} ${url}\n    ${msg}`);
  }
}

rmSync(dir, { recursive: true, force: true });
console.log(results.join("\n"));
const pct = Math.round((ok / APIS.length) * 100);
console.log(`\n${ok}/${APIS.length} valid (${pct}%) — target >= 90%`);
process.exit(pct >= 90 ? 0 : 1);
