import { isIP } from "node:net";

/**
 * Tolak IP privat/loopback/link-local/ULA — dipakai proxy SETELAH resolusi DNS
 * (bukan string-match hostname) untuk cegah SSRF & DNS rebinding.
 */
export function isBlockedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local + metadata 169.254.169.254
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (v === 6) {
    const lc = ip.toLowerCase();
    if (lc === "::1" || lc === "::") return true;
    if (lc.startsWith("fc") || lc.startsWith("fd")) return true; // ULA fc00::/7
    if (lc.startsWith("fe80")) return true; // link-local
    if (lc.startsWith("::ffff:")) return isBlockedIp(lc.slice(7)); // IPv4-mapped
    return false;
  }
  return true; // bukan IP valid → tolak
}
