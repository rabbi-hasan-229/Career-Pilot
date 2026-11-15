self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() || '' };
  }

  const title = typeof payload.title === 'string' ? payload.title : 'Career Pilot';
  const options = {
    body: typeof payload.body === 'string' ? payload.body : 'Your roadmap is ready when you are.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: typeof payload.url === 'string' ? payload.url : '/' },
    tag: typeof payload.tag === 'string' ? payload.tag : 'career-pilot-reminder',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const candidate = new URL(event.notification.data?.url || '/', self.location.origin);
  const target = (candidate.origin === self.location.origin ? candidate : new URL('/', self.location.origin)).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.focus();
        if ('navigate' in client && client.url !== target) await client.navigate(target);
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
