// Service worker: a script the browser runs in the background, separate from
// the page. It sits between the app and the network and can answer requests
// from a local cache. That's what makes the app work with no signal.
//
// UPDATE RULE: any time you change ANY file in site/, bump VERSION.
// The browser re-checks sw.js on each visit; a changed byte means "new
// worker" -> it re-downloads everything into a fresh cache and deletes the old.
const VERSION = "v3";
const CACHE = `shopfrac-${VERSION}`;
const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "cards.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

// install: runs once per new version. Download every file into the cache.
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting(); // take over right away instead of waiting for tabs to close
});

// activate: clean out caches from older versions.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// fetch: cache-first. Serve from cache if we have it, otherwise hit the network.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request))
  );
});
