const CACHE_NAME = "campusloop-shell-v10";
const STATIC_SHELL = [
  "/",
  "/feeds",
  "/chat",
  "/discover",
  "/colleges",
  "/communities",
  "/notifications",
  "/manifest.json",
  "/favicon.svg",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install: Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL).catch((err) => {
        console.warn("PWA: Pre-caching some assets failed:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older cache versions and claim immediate control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: High-Performance Caching Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Hexclave auth handlers
  if (request.method !== "GET" || url.pathname.startsWith("/handler/")) {
    return;
  }

  // 1. Static Assets, Web Fonts & Next.js Bundles: Cache-first with Background Network Update
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com" ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".avif") ||
    url.hostname.includes("giphy.com") ||
    url.hostname.includes("images.unsplash.com")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Read-Only API Endpoints: Network-first with Cache Fallback (Stale-While-Revalidate)
  if (
    url.pathname.startsWith("/api/colleges") ||
    url.pathname.startsWith("/api/communities") ||
    url.pathname.startsWith("/api/feed") ||
    url.pathname.startsWith("/api/profile/") ||
    url.pathname.startsWith("/api/dating/profiles")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(JSON.stringify({ error: "Offline", offline: true }), {
              headers: { "Content-Type": "application/json", "Retry-After": "5" },
              status: 503,
              statusText: "Offline",
            });
          });
        })
    );
    return;
  }

  // 3. Navigation / HTML Pages: Network-first with Dedicated App-Shell Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          // Main Student App isolated shell
          const appShell = await caches.match("/feeds");
          if (appShell) return appShell;
          return caches.match("/");
        })
    );
  }
});

// ─── Web Push: decrypt (done by the browser), notify, badge ───
//
// The server encrypts the notification into the push (RFC 8291), so
// `event.data` normally holds { title, body, url, type, tag, icon, unreadCount, id }.
// A payload-less push (tickle) falls back to fetching the newest unread
// notification over the student's own session.

async function setBadge(count) {
  try {
    if (typeof count !== "number") return;
    if (count > 0 && "setAppBadge" in self.navigator) await self.navigator.setAppBadge(count);
    else if (count <= 0 && "clearAppBadge" in self.navigator) await self.navigator.clearAppBadge();
  } catch {}
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = null;

      if (event.data) {
        try {
          payload = event.data.json();
        } catch {
          payload = null;
        }
      }

      if (!payload) {
        try {
          const res = await fetch("/api/notifications/latest", { credentials: "include", cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            payload = data.notification;
            if (payload && typeof payload.unreadCount !== "number") payload.unreadCount = data.unreadCount;
          }
        } catch {
          payload = null;
        }
      }

      await setBadge(payload?.unreadCount);

      // Open tabs refresh their list and badge straight away instead of
      // waiting for the next poll.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) client.postMessage({ type: "campusloop:push", payload });

      const title = payload?.title || "CampusLoop";
      // A browser push must always show a notification (userVisibleOnly).
      await self.registration.showNotification(title, {
        body: payload?.body || "You have a new campus notification",
        icon: payload?.icon || "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: payload?.tag || payload?.type || "campusloop",
        renotify: true,
        timestamp: Date.now(),
        data: { url: payload?.url || "/notifications", id: payload?.id || null },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = new URL(data.url || "/notifications", self.location.origin);
  // Never navigate off-site from a notification.
  const targetUrl = target.origin === self.location.origin ? target.href : `${self.location.origin}/notifications`;

  event.waitUntil(
    (async () => {
      // Tapping counts as reading it, so the badge and the list stay in step.
      if (data.id) {
        fetch("/api/notifications", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: data.id }),
        }).catch(() => {});
      }

      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const sameOrigin = windows.filter((c) => c.url.startsWith(self.location.origin));

      // 1. A tab already on that page: just bring it forward.
      const exact = sameOrigin.find((c) => c.url === targetUrl);
      if (exact) {
        await exact.focus();
        return;
      }

      // 2. Any CampusLoop tab: focus it and move it to the page.
      const existing = sameOrigin.find((c) => c.focused) || sameOrigin[0];
      if (existing) {
        try {
          const focused = await existing.focus();
          const navigated = await (focused || existing).navigate(targetUrl);
          if (navigated) return;
        } catch {}
      }

      // 3. No usable tab (or it is not controlled by this worker): open one.
      await self.clients.openWindow(targetUrl);
    })()
  );
});

// The browser rotated the subscription (key change, expiry). Re-subscribe with
// the same server key and tell the server, so pushes keep arriving.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const options = event.oldSubscription?.options;
        const subscription =
          event.newSubscription ||
          (options?.applicationServerKey
            ? await self.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: options.applicationServerKey,
              })
            : null);
        if (!subscription) return;
        await fetch("/api/push/subscribe", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {}
    })()
  );
});
