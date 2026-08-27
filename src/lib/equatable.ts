/**
 * Post-process output Dart quicktype plain → tambah dukungan `Equatable`.
 * quicktype tak punya opsi equatable, jadi kita transform teksnya:
 *  - sisip import package:equatable
 *  - tiap `class X {` → `class X extends Equatable {`
 *  - sisip `@override List<Object?> get props => [..];` dari param konstruktor
 *
 * Hanya dipakai untuk output plain (bukan Freezed / json_serializable yang
 * sudah punya kesetaraan sendiri). ponytail: parser berbasis brace-count, cukup
 * untuk bentuk output quicktype; bukan parser Dart umum.
 */
export function applyEquatable(dart: string): string {
  let out = "";
  let i = 0;
  let transformed = false;
  while (i < dart.length) {
    const m = /class\s+(\w+)\s*\{/g;
    m.lastIndex = i;
    const match = m.exec(dart);
    if (!match) {
      out += dart.slice(i);
      break;
    }
    transformed = true;
    out += dart.slice(i, match.index);

    // cari brace penutup class (hitung kedalaman)
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let j = bodyStart;
    for (; j < dart.length && depth > 0; j++) {
      if (dart[j] === "{") depth++;
      else if (dart[j] === "}") depth--;
    }
    const body = dart.slice(bodyStart, j - 1); // tanpa `}` terakhir
    const name = match[1];

    // nama field dari param konstruktor: `this.field`
    const props: string[] = [];
    for (const p of body.matchAll(/this\.(\w+)/g)) {
      if (!props.includes(p[1])) props.push(p[1]);
    }
    const propsLine =
      props.length > 0
        ? `\n    @override\n    List<Object?> get props => [${props.join(", ")}];\n`
        : "";

    out += `class ${name} extends Equatable {${body}${propsLine}}`;
    i = j;
  }

  if (!transformed) return dart;

  const imp = "import 'package:equatable/equatable.dart';";
  if (out.includes(imp)) return out;
  // taruh setelah blok import terakhir bila ada, kalau tidak di paling atas.
  const lastImport = out.lastIndexOf("import ");
  if (lastImport === -1) return `${imp}\n\n${out}`;
  const eol = out.indexOf("\n", lastImport);
  return out.slice(0, eol + 1) + imp + "\n" + out.slice(eol + 1);
}
