const VERSION = "v12";
const CACHE = "huawen-" + VERSION;
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML: network-first (always get the newest build when online, fall back to cache offline)
// everything else: cache-first (fast, offline-safe)
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(()=>{});
          return res;
        })
        .catch(() => caches.match("./index.html").then(hit => hit || caches.match("./")))
    );
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
