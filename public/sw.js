// YoApi service worker — app-shell cache for installability + basic offline.
// ponytail: cache-first for static assets only; API/proxy calls always hit network.
// Upgrade to Workbox precache manifest if offline coverage needs to be exhaustive.
const CACHE = "yoapi-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg", "/pwa-192x192.png", "/pwa-512x512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // never cache mutations
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return; // proxy/API → network only

  // Navigations: network-first, fall back to cached shell when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }
  // Static assets: cache-first, populate on miss.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })),
  );
});
