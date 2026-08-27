import test from "node:test";
import assert from "node:assert/strict";
import { crc32, makeZip } from "./zipStore.ts";

const enc = new TextEncoder();

test("crc32 nilai kanonik", () => {
  assert.equal(crc32(enc.encode("")), 0);
  // vektor uji CRC-32 standar
  assert.equal(crc32(enc.encode("123456789")) >>> 0, 0xcbf43926);
});

test("makeZip: signature, jumlah entry, EOCD", async () => {
  const blob = makeZip([
    { name: "a.txt", data: "hello" },
    { name: "sub/b.json", data: "{}" },
  ]);
  const buf = new Uint8Array(await blob.arrayBuffer());
  // local file header signature di awal
  assert.deepEqual([...buf.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  // EOCD signature di akhir (fixed 22 byte, tanpa comment)
  const eocd = buf.slice(buf.length - 22);
  assert.deepEqual([...eocd.slice(0, 4)], [0x50, 0x4b, 0x05, 0x06]);
  // jumlah entry (offset 10-11 di EOCD) = 2
  assert.equal(eocd[10] | (eocd[11] << 8), 2);
});
