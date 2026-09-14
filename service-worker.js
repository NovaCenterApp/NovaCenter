// NovaCenter SW — v18
const CACHE = 'novacenter-v18';
const FONT_CACHE = 'novacenter-fonts-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  // Pre-cache index.html on install
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.add('./').catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ includeUncontrolled: true, type: 'window' }))
      .then(clients => clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' })))
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Fonts: cache-first (they never change)
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(FONT_CACHE).then(fc =>
        fc.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res && res.ok) fc.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // HTML (index): network-first, fallback to cache
  // Always tries to get the latest version, uses cached if offline
  if (url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) {
          // Update cache with fresh copy
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline: serve from cache
        return caches.match(e.request).then(cached => cached || caches.match('./'));
      })
    );
    return;
  }

  // Everything else: cache-first (icons, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./'));
    })
  );
});
