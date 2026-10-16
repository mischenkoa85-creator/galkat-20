/* Service worker журналу СЕС площадки 11: оболонка застосунку відкривається без зв’язку.
   Звіти й фото сюди не потрапляють — вони чекають у черзі IndexedDB (app.js) і надсилаються POST-запитом напряму.
   Після зміни файлів сайту збільште номер у CACHE і ?v= в index.html. */
const CACHE = 'ses11-v3';
const SHELL = ['./', './index.html', './app.css?v=3', './config.js?v=3', './data.js?v=3', './app.js?v=3', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ses11-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* спершу з кешу (швидко на даху), паралельно оновлюю кеш із мережі; Apps Script і Open-Meteo — повз кеш */
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const font = /^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !font) return;
  const key = r.mode === 'navigate' ? './index.html' : r;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key);
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || (r.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
