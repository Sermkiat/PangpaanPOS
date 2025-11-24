// Disabled SW: network-only to avoid cache staleness
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => null),
  );
});
self.addEventListener("fetch", (event) => {
  // Just pass through to network
  return;
});
