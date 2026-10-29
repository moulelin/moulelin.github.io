// Minimal service worker so the Fancy page can be added to the home screen as an app.
// Only page loads go through it, always from the network, so updates show up immediately;
// audio and Firebase requests are left to the browser.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(function () {
    return new Response('<meta charset="utf-8"><p style="font:18px sans-serif;text-align:center;margin-top:40vh">网络断开了，吉祥在等你回来 🐾</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }));
});
