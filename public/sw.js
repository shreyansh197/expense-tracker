const CACHE_NAME = "expenstream-icons-74b974f1";
const SHELL_CACHE = "expenstream-shell-v1";
const FONT_CACHE = "expenstream-fonts-v1";

const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32.png",
  "/favicon.ico",
  "/manifest.json",
];

// Google Font CSS entries to precache on install — triggers font file download
// next/font/google self-hosts woff2 under /_next/static/media/ (covered by static handler)
// These external endpoints are kept as insurance for legacy offline scenarios
const FONT_PRECACHE_URLS = [
  "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap",
];

// App shell: HTML entry point for offline navigation
const SHELL_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
      caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
      // Precache font CSS so terrain fonts are available offline from first launch
      caches.open(FONT_CACHE).then((cache) =>
        Promise.allSettled(
          FONT_PRECACHE_URLS.map((url) =>
            fetch(url, { mode: "cors" }).then((res) => {
              if (res.ok) return cache.put(url, res);
            }),
          ),
        ),
      ),
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

  // Network-first for icons, favicon, and manifest so PWA icon updates propagate
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request)),
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
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request)),
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
