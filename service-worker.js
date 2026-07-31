// NovaCenter SW — v15
const CACHE='novacenter-v15';
const FONT_CACHE='novacenter-fonts-v1';
const FONT_HOSTS=['fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.add('./').catch(()=>{})).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==FONT_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(FONT_HOSTS.includes(url.hostname)){e.respondWith(caches.open(FONT_CACHE).then(fc=>fc.match(e.request).then(cached=>{if(cached)return cached;return fetch(e.request).then(res=>{if(res&&res.ok)fc.put(e.request,res.clone());return res;}).catch(()=>cached);})));return;}e.respondWith(caches.match(e.request).then(cached=>{if(cached)return cached;return fetch(e.request).then(res=>{if(res&&res.ok){const clone=res.clone();caches.open(CACHE).then(c=>c.put(e.request,clone));}return res;}).catch(()=>caches.match('./'));}));});
