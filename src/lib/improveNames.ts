// quicktype menamai class anonim yang muncul di union dengan awalan kata sifat
// urut ("Purple", "Fluffy", ...) → nama seperti `PurpleY`, `FluffyM` yang tak
// bermakna. Kita buang awalan itu dan turunkan nama dari key induk (sisa nama),
// beri nomor bila tabrakan. Transform berbasis teks (identifier = token unik),
// jadi aman untuk Dart/Kotlin/Swift/TypeScript.
// ponytail: daftar kata sifat mengikuti quicktype; bila mereka ubah kamusnya,
// perbarui ADJ. Nama tanpa suffix key (mis. bare "Purple") dibiarkan.

const ADJ = [
  "Purple", "Fluffy", "Tentacled", "Sticky", "Indigo", "Indecent", "Hilarious",
  "Ambitious", "Cunning", "Magenta", "Frisky", "Mischievous", "Braggadocious",
  "Aquamarine", "Sedate", "Nervous", "Cyan", "Impolite",
];

const ADJ_RE = new RegExp(`^(${ADJ.join("|")})([A-Z]\\w*)$`);

/** Kumpulkan nama class/interface/struct lalu petakan nama berawalan-adjektiva
 * ke nama turunan-key. Return peta {oldName: newName}. */
function buildRenames(names: string[]): Record<string, string> {
  // key induk → daftar nama lama yang berbagi key itu
  const byBase: Record<string, string[]> = {};
  for (const n of names) {
    const m = ADJ_RE.exec(n);
    if (!m) continue;
    const base = m[2];
    (byBase[base] ??= []).push(n);
  }
  const existing = new Set(names);
  const map: Record<string, string> = {};
  for (const [base, olds] of Object.entries(byBase)) {
    olds.forEach((old, i) => {
      // satu-satunya → pakai base; banyak → base, base2, base3...
      let cand = i === 0 ? base : `${base}${i + 1}`;
      while ((existing.has(cand) && cand !== old) || Object.values(map).includes(cand)) {
        cand += "_";
      }
      map[old] = cand;
    });
  }
  return map;
}

const DECL_RE = /\b(?:class|interface|struct|enum)\s+([A-Za-z_]\w*)/g;

/** Perbaiki penamaan nested class hasil quicktype pada kode `lang` apa pun. */
export function improveNames(code: string): string {
  const names: string[] = [];
  for (const m of code.matchAll(DECL_RE)) names.push(m[1]);
  const renames = buildRenames([...new Set(names)]);
  if (Object.keys(renames).length === 0) return code;

  let out = code;
  // Ganti dari nama terpanjang dulu agar `PurpleY` tak keburu terpotong prefiksnya.
  for (const [oldName, newName] of Object.entries(renames).sort((a, b) => b[0].length - a[0].length)) {
    out = out.replace(new RegExp(`\\b${oldName}\\b`, "g"), newName);
  }
  return out;
}
