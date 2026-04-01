// Service Worker Firebase Cloud Messaging — planio-v2
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyBsH79Y5mJ-2fszESFb329sMjuuXGkkO_U",
  authDomain:        "planio-v2-4bd57.firebaseapp.com",
  projectId:         "planio-v2-4bd57",
  storageBucket:     "planio-v2-4bd57.firebasestorage.app",
  messagingSenderId: "440367252697",
  appId:             "1:440367252697:web:107b01ed118dceaa7e6ac8"
});

const messaging = firebase.messaging();

// Notification en arrière-plan
messaging.onBackgroundMessage(payload => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || "Planio 💬", {
    body:  n.body  || "",
    icon:  "/planio-v2/icon-192.png",
    badge: "/planio-v2/icon-192.png",
    tag:   payload.data?.type || "chat",
    data:  payload.data || {}
  });
});

// Clic sur la notification → ouvre l'app
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes("planio-v2") && "focus" in c) return c.focus();
      }
      return clients.openWindow("https://isuka-san.github.io/planio-v2/");
    })
  );
});
