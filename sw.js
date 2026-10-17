// Black & Gold Dispatch service worker: SCAFFOLD ONLY. Nothing subscribes or sends until a push provider is configured.
// Later: generate VAPID keys, subscribe in alerts UI via registration.pushManager.subscribe({userVisibleOnly:true, applicationServerKey}),
// store the subscription on a server, and send with the Web Push protocol (e.g. the open-source "web-push" library) or a hosted service.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Black & Gold Dispatch', { body: d.body || '', data: { url: d.url || '/' }, tag: d.type || 'news' }));
});
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.openWindow(e.notification.data.url || '/')); });
