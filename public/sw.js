// JARVIS Industrial PWA Service Worker //
const CACHE_NAME = "jarvis-tactile-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg"
];

// In-worker active alarms registry
let activeAlarms = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Alarm checker tick
setInterval(() => {
  const now = Date.now();
  if (activeAlarms && activeAlarms.length > 0) {
    const dueAlarms = activeAlarms.filter((a) => a.triggerTime <= now && !a.fired);
    dueAlarms.forEach((alarm) => {
      alarm.fired = true;
      self.registration.showNotification(`[JARVIS ALARM] ${alarm.label || "Timer Alert"}`, {
        body: `Time reached: ${new Date(alarm.triggerTime).toLocaleTimeString()}. Tap to acknowledge.`,
        icon: "/icon-192.svg",
        badge: "/icon-192.svg",
        vibrate: [500, 200, 500, 200, 1000],
        tag: `alarm-${alarm.id}`,
        renotify: true,
        data: { url: "/", alarmId: alarm.id },
        actions: [
          { action: "stop", title: "STOP" },
          { action: "snooze", title: "SNOOZE 5M" }
        ]
      });

      // Broadcast to client if open
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "ALARM_TRIGGERED", alarm });
        });
      });
    });

    // Keep unfired or recently fired
    activeAlarms = activeAlarms.filter((a) => a.triggerTime > now);
  }
}, 1000);

// Message communication from client
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "REGISTER_ALARM") {
    activeAlarms.push(data.alarm);
    event.ports[0]?.postMessage({ status: "OK", count: activeAlarms.length });
  } else if (data.type === "CANCEL_ALARM") {
    activeAlarms = activeAlarms.filter((a) => a.id !== data.alarmId);
    event.ports[0]?.postMessage({ status: "CANCELLED", count: activeAlarms.length });
  } else if (data.type === "SYNC_ALARMS") {
    activeAlarms = data.alarms || [];
  }
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "snooze") {
    const snoozeTime = Date.now() + 5 * 60 * 1000;
    activeAlarms.push({
      id: "snooze-" + Date.now(),
      label: "Snooze: " + (event.notification.title || "Alarm"),
      triggerTime: snoozeTime,
      fired: false
    });
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data?.url || "/");
      }
    })
  );
});

// Push Notifications
self.addEventListener("push", (event) => {
  let payload = { title: "JARVIS Command Receipt", body: "Task executed successfully." };
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      vibrate: [200, 100, 200]
    })
  );
});
