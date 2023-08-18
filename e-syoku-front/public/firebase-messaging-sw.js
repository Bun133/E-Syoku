// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: 'AIzaSyDCXNVHP51utc9_rvtocvsXoTR7_9GMHUU',
    authDomain: 'e-syoku.firebaseapp.com',
    databaseURL: 'https://e-syoku-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'e-syoku',
    storageBucket: 'e-syoku.appspot.com',
    messagingSenderId: '80991591009',
    appId: '1:80991591009:web:a5741bed5924738507e820',
    measurementId: 'G-3899ZFCT6J',
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const title = payload.data.title ?? "E-Syokuからの通知"
    const body = payload.data.body ?? ""
    const icon = payload.data.imageUrl ?? undefined

    self.registration.showNotification(title, {
        body: body,
        icon: icon,
        data: payload.data
    })
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close()
    const data = event.notification.data
    const url = data.pathname ?? "https://e-syoku.web.app/"
    event.waitUntil(clients.openWindow(url))
})