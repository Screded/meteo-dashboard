const CACHE = "meteo-shell-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  const isPage = e.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");

  if (isPage) {
    // Network-first : on voit toujours la derniere version, le cache sert de secours hors ligne
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match("./index.html")))
    );
  } else {
    // Cache-first pour les icones et le manifest
    e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
  }
});
