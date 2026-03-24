
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      // Fallback to your logo if a specific icon isn't provided
      icon: data.icon || '/logo.png', 
      badge: '/logo.png', // A small monochrome icon used on Android
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard', // Where to take the user when they click
      },
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Error processing push event:', error);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/dashboard';

  // This logic checks if the user already has the app open in a tab.
  // If they do, it focuses that tab. If not, it opens a new one.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});