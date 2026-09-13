const CACHE_NAME = "lifehub-v76";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=76",
  "./app.js?v=76",
  "./supabase-config.js?v=76",
  "./auth-cloud.js?v=76",
  "./manifest.webmanifest?v=76",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "icons/favicon-32.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
  );
});
