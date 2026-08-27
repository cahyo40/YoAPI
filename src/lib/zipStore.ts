// Hand-rolled ZIP writer, metode "store" (STORED, tanpa kompresi) + CRC32.
// Tanpa dependency — cukup untuk bundle teks (model + JSON + index) yang kecil.
// ponytail: naikkan ke DEFLATE bila ukuran zip jadi masalah (butuh implementasi
// deflate atau CompressionStream).

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string; // path relatif di dalam zip (pakai "/" untuk folder)
  data: string; // konten teks (UTF-8)
}

// DOS date/time — pakai epoch tetap (1980-01-01) agar output deterministik & testable.
const DOS_TIME = 0;
const DOS_DATE = 0x21; // (1980-1980)<<9 | 1<<5 | 1

function u16(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}
function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

/** Bangun arsip ZIP (stored) dari daftar entry → Blob siap-download. */
export function makeZip(entries: ZipEntry[]): Blob {
  const enc = new TextEncoder();
  const chunks: number[][] = [];
  const central: number[][] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = Array.from(enc.encode(e.name));
    const dataBytes = enc.encode(e.data);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header
    const local = [
      ...u32(0x04034b50),
      ...u16(20), // version needed
      ...u16(0), // flags
      ...u16(0), // method 0 = stored
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(crc),
      ...u32(size), // compressed = uncompressed (stored)
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0), // extra len
      ...nameBytes,
    ];
    chunks.push(local, Array.from(dataBytes));

    // Central directory record (dipakai nanti)
    central.push([
      ...u32(0x02014b50),
      ...u16(20), // version made by
      ...u16(20), // version needed
      ...u16(0),
      ...u16(0),
      ...u16(DOS_TIME),
      ...u16(DOS_DATE),
      ...u32(crc),
      ...u32(size),
      ...u32(size),
      ...u16(nameBytes.length),
      ...u16(0), // extra
      ...u16(0), // comment
      ...u16(0), // disk number
      ...u16(0), // internal attrs
      ...u32(0), // external attrs
      ...u32(offset), // offset of local header
      ...nameBytes,
    ]);

    offset += local.length + size;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const c of central) centralSize += c.length;

  const eocd = [
    ...u32(0x06054b50),
    ...u16(0), // disk
    ...u16(0), // central dir disk
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(centralSize),
    ...u32(centralStart),
    ...u16(0), // comment len
  ];

  const parts = [...chunks, ...central, eocd].map((a) => Uint8Array.from(a));
  return new Blob(parts, { type: "application/zip" });
}
