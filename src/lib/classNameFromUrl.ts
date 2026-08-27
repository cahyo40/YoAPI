/**
 * Turunkan nama class Dart dari path URI.
 * Ambil segment path terakhir non-numerik → PascalCase → singularize naif.
 * `/users/123` → "User", `/api/v2/blog-posts` → "BlogPost", `/` → "Model".
 */
export function classNameFromUrl(url: string): string {
  let parts: string[];
  try {
    parts = new URL(url).pathname.split("/").filter(Boolean);
  } catch {
    return "Model";
  }

  let seg = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!/^\d+$/.test(parts[i])) {
      seg = parts[i];
      break;
    }
  }

  const pascal = seg
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

  // ponytail: singularize naif (trailing "s"). Ganti lib pluralize kalau banyak keluhan.
  const singular = pascal.replace(/s$/, "");
  return singular || "Model";
}
