/** Format JSON dengan indentasi 2 spasi; kembalikan apa adanya bila bukan JSON valid. */
export function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}
