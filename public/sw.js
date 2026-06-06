const CACHE_NAME = "mh-nursalam-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/logo.svg",
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Only intercept normal HTTP GET requests
  if (e.request.method !== "GET") return;

  // Intercept requests belonging to our domain only (prevent API key/external endpoint caching bugs)
  const isInternal = e.request.url.startsWith(self.location.origin);
  const isApiRequest = e.request.url.includes("/api/");

  if (!isInternal || isApiRequest) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Dynamic fetch of fresh copy to update cache for next load (stale-while-revalidate)
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          return networkResponse;
        })
        .catch(() => {
          // If network failed and user was heading to a separate sub-page routing, fallback to index
          if (e.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
