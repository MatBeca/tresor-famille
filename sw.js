// Cache de l'application pour un démarrage rapide et hors ligne. Les données passent par Firebase.
const CACHE = 'pepite-v123';
const SHELL = ['./', './index.html', './app.js', './articles.js', './legal.js', './pepites.js', './games.js', './img/matthieu.jpg', './app.css', './config.js', './vendor/idiomorph.esm.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './fonts/fredoka-latin-500-normal.woff2', './fonts/fredoka-latin-600-normal.woff2', './fonts/fredoka-latin-700-normal.woff2', './fonts/nunito-latin-600-normal.woff2', './fonts/nunito-latin-700-normal.woff2', './fonts/nunito-latin-800-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  const mine = u.origin === location.origin || u.hostname === 'www.gstatic.com' || u.hostname.endsWith('fonts.googleapis.com') || u.hostname.endsWith('fonts.gstatic.com');
  if (e.request.method !== 'GET' || !mine) return;
  // La vidéo du tuto passe directement par le réseau (lecture par morceaux, trop lourde pour le cache).
  if (u.pathname.endsWith('.mp4')) return;
  // Même origine : on revalide toujours auprès du serveur (GitHub Pages met 10 min de cache HTTP), sinon une vieille version peut rester affichée.
  const req = u.origin === location.origin ? new Request(e.request, { cache: 'no-cache' }) : e.request;
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});

// Notifications envoyées par la tâche planifiée (récap du lundi, argent reçu à valider, grands moments).
self.addEventListener('push', e => {
  let m = {};
  try { m = e.data ? e.data.json() : {}; } catch (err) { m = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(m.title || 'Pépite', {
    body: m.body || '', icon: './icons/icon-192.png', badge: './icons/favicon-48.png', tag: m.tag || 'pepite', data: { url: m.url || './' }, lang: 'fr'
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
