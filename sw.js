/* Hilal Fırça İş Takip – çevrimdışı önbellek */
const SURUM = 'hf-istakip-1';
const DOSYALAR = ['./', './index.html', './manifest.webmanifest', './ikon-192.png', './ikon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== SURUM).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    // Önce ağ (en fazla 4 sn), olmazsa kayıtlı sürüm: internet dalgalıyken de hızlı açılır
    e.respondWith(new Promise(resolve => {
      let bitti = false;
      const yedek = () => caches.match('./index.html').then(r => r || caches.match('./'));
      const zam = setTimeout(() => { if (!bitti) { bitti = true; resolve(yedek()); } }, 4000);
      fetch(e.request).then(r => {
        if (r && r.ok) { const k = r.clone(); caches.open(SURUM).then(c => c.put('./index.html', k)); }
        if (!bitti) { bitti = true; clearTimeout(zam); resolve(r); }
      }).catch(() => { if (!bitti) { bitti = true; clearTimeout(zam); resolve(yedek()); } });
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(m => m || fetch(e.request).then(r => {
    if (r && r.ok) { const k = r.clone(); caches.open(SURUM).then(c => c.put(e.request, k)); }
    return r;
  })));
});
