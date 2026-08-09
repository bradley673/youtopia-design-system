/* Daily Scoreboard — service worker: offline cache + push notifications */
"use strict";

const CACHE = "ds-cache-v1";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/badge-96.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for same-origin GETs; offline fallback to cached shell.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((cached) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || (req.mode === "navigate" ? caches.match("./index.html") : undefined));
      return cached || fresh;
    })
  );
});

/* ---------- Push ---------- */

function readConfig() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open("ds-push", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onerror = () => resolve(null);
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction("kv", "readonly");
          const get = tx.objectStore("kv").get("cfg");
          get.onsuccess = () => resolve(get.result || null);
          get.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let title = "Daily Scoreboard";
      let body = "Check today's progress.";
      let tag = "ds-general";

      // Payload directly on the push (if the server sent one)
      if (event.data) {
        try {
          const d = event.data.json();
          if (d && d.title) { title = d.title; body = d.body || ""; tag = d.tag || tag; }
        } catch { /* not JSON */ }
      } else {
        // Bare push: fetch the pending notification from the reminder server
        const cfg = await readConfig();
        if (cfg && cfg.workerUrl && cfg.id) {
          try {
            const res = await fetch(
              cfg.workerUrl + "/notification?id=" + encodeURIComponent(cfg.id),
              { cache: "no-store" }
            );
            if (res.ok) {
              const d = await res.json();
              if (d && d.title) { title = d.title; body = d.body || ""; tag = d.tag || tag; }
            }
          } catch { /* fall through to generic */ }
        }
      }

      // iOS requires every push to show a notification
      await self.registration.showNotification(title, {
        body,
        tag,
        icon: "./icons/icon-192.png",
        badge: "./icons/badge-96.png",
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("./");
    })
  );
});
