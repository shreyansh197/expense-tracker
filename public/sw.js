const CACHE_NAME = "expenstream-icons-74b974f1";
const SHELL_CACHE = "expenstream-shell-v2";
const FONT_CACHE = "expenstream-fonts-v1";

// Max entries for the general cache to prevent unbounded growth
const MAX_CACHE_ENTRIES = 200;

const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
  "/favicon.ico",
  "/manifest.json",
];

// Google Font CSS entries are no longer precached on install.
// next/font/google self-hosts woff2 under /_next/static/media/ (covered by static handler).
// The font cache handler below still caches any runtime font requests.

// App shell: HTML entry point for offline navigation
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
    ]),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keepCaches = new Set([CACHE_NAME, SHELL_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !keepCaches.has(key))
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Skip non-GET and Supabase API calls
  if (request.method !== "GET" || request.url.includes("supabase.co")) {
    return;
  }

  const url = new URL(request.url);

  // Stale-while-revalidate for icons, favicon, and manifest:
  // Serve from cache immediately (versioned URLs guarantee freshness),
  // fetch an update in the background so the next load gets the latest.
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);
        // Return cached immediately if available, otherwise await network
        return cached ?? networkFetch;
      }),
    );
    return;
  }

  // Navigation requests: network-first with app shell fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Google Fonts: cache-first so terrain fonts (Lora, Jakarta, JBMono) work offline
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(FONT_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Static assets (_next/static): cache-first for immutable hashed files
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for same-origin assets
        if (
          response.ok &&
          response.status === 200 &&
          request.url.startsWith(self.location.origin)
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
            // Evict oldest entries if cache exceeds max size
            cache.keys().then((keys) => {
              if (keys.length > MAX_CACHE_ENTRIES) {
                cache.delete(keys[0]);
              }
            });
          });
        }
        return response;
      })
      .catch(() =>
        caches.open(CACHE_NAME).then((cache) =>
          cache.match(request).then((cached) => {
            if (cached) {
              // LRU: re-put to move to end of key order
              cache.put(request, cached.clone());
            }
            return cached;
          }),
        ),
      ),
  );
});

// ─── Web Push Notifications ────────────────────────────────────────────────
// Push events are sent by the server via the Web Push protocol (VAPID).
// The SW wakes up to show the notification even if the app is closed.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "ExpenStream",
      body: event.data.text() || "You have a new notification",
      icon: "/icons/icon-192.png",
      data: { url: "/" },
    };
  }

  const { title, body, icon, tag, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title || "ExpenStream", {
      body: body || "",
      icon: icon || "/icons/icon-192.png",
      tag: tag || "expenstream-push",
      data: data || { url: "/" },
    }),
  );
});

// Handle notification clicks — open/focus the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

// ─── Skip Waiting on demand (triggered from UpdateBanner) ──────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Background Sync ───────────────────────────────────────────────────────
// When the browser regains connectivity, it fires a 'sync' event for any
// registered tags. The app registers "mutation-push" when enqueuing offline
// mutations. We notify the client to trigger its sync engine push.
self.addEventListener("sync", (event) => {
  if (event.tag === "mutation-push") {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          for (const client of clients) {
            client.postMessage({ type: "SYNC_PUSH_REQUESTED" });
          }
        }),
    );
  }
});
