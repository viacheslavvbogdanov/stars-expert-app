//This is the service worker with the Advanced caching

const CACHE = "pwabuilder-adv-cache";
const precacheFiles = [
  /* Add an array of files to precache for your app */
  'img/icon192.png',
  'img/icon512.png',
  'img/icon2048.png',
  'img/profile_image.png',
  'img/whitebox.png',
  'fonts/caveat/Wnz6HAc5bAfYB2Q7aDYYiAzcPDKo.woff2',
  'fonts/caveat/Wnz6HAc5bAfYB2Q7YjYYiAzcPDKo.woff2',
  'fonts/caveat/Wnz6HAc5bAfYB2Q7ZjYYiAzcPA.woff2',
  'lib/angular-gettext.min.js',
  'lib/jquery-3.3.1.min.js',
  'lib/lib-jitsi-meet.min.js',
  'lib/qrcode.min.js',
  'lib/sentry-bundle.min.js',
  'lib/speakingurl.min.js',
  'lib/web3.min.js',
  'lib/ionicuirouter/ionicUIRouter.js',
  'lib/firebase/firebase-app.js',
  'lib/firebase/firebase-auth.js',
  'lib/firebase/firebase-database.js',
  'lib/firebase/firebase-firestore.js',
  'lib/firebase/firebase-functions.js',
  'lib/firebase/firebase-messaging.js',
  'lib/firebase/firebase-storage.js',
  'lib/ionic/js/ionic.bundle.js',
  'lib/ionic/fonts/ionicons.ttf',

];

// TODO: replace the following with the correct offline fallback page i.e.: const offlineFallbackPage = "offline.html";
const offlineFallbackPage = "offline.html";

const networkFirstPaths = [
  /* Add an array of regex of paths that should go network first */
  // Example: /\/api\/.*/
];

const avoidCachingPaths = [
  /* Add an array of regex of paths that shouldn't be cached */
  // Example: /\/api\/.*/
];

function pathComparer(requestUrl, pathRegEx) {
  return requestUrl.match(new RegExp(pathRegEx));
}

function comparePaths(requestUrl, pathsArray) {
  if (requestUrl) {
    for (let index = 0; index < pathsArray.length; index++) {
      const pathRegEx = pathsArray[index];
      if (pathComparer(requestUrl, pathRegEx)) {
        return true;
      }
    }
  }

  return false;
}

self.addEventListener("install", function (event) {
  console.log("[PWA Builder] Install Event processing");

  console.log("[PWA Builder] Skip waiting on install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA Builder] Caching pages during install");

      return cache.addAll(precacheFiles).then(function () {
        return cache.add(offlineFallbackPage);
      });
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA Builder] Claiming clients for current page");
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  if (comparePaths(event.request.url, networkFirstPaths)) {
    networkFirstFetch(event);
  } else {
    cacheFirstFetch(event);
  }
});

function cacheFirstFetch(event) {
  event.respondWith(
    fromCache(event.request).then(
      function (response) {
        // The response was found in the cache so we responde with it and update the entry

        // This is where we call the server to get the newest version of the
        // file to use the next time we show view
        event.waitUntil(
          fetch(event.request).then(function (response) {
            return updateCache(event.request, response);
          })
        );

        return response;
      },
      function () {
        // The response was not found in the cache so we look for it on the server
        return fetch(event.request)
          .then(function (response) {
            // If request was success, add or update it in the cache
            event.waitUntil(updateCache(event.request, response.clone()));

            return response;
          })
          .catch(function (error) {
            // The following validates that the request was for a navigation to a new document
            if (event.request.destination !== "document" || event.request.mode !== "navigate") {
              return;
            }

            console.log("[PWA Builder] Network request failed and no cache." + error);
            // Use the precached offline page as fallback
            return caches.open(CACHE).then(function (cache) {
              cache.match(offlineFallbackPage);
            });
          });
      }
    )
  );
}

function networkFirstFetch(event) {
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // If request was success, add or update it in the cache
        event.waitUntil(updateCache(event.request, response.clone()));
        return response;
      })
      .catch(function (error) {
        console.log("[PWA Builder] Network request Failed. Serving content from cache: " + error);
        return fromCache(event.request);
      })
  );
}

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return error page
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  if (!comparePaths(request.url, avoidCachingPaths)) {
    return caches.open(CACHE).then(function (cache) {
      return cache.put(request, response);
    });
  }

  return Promise.resolve();
}

// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
// importScripts('/__/firebase/5.0.0/firebase-app.js');
// importScripts('/__/firebase/5.0.0/firebase-messaging.js');
// importScripts('/__/firebase/init.js');

// * Here is is the code snippet to initialize Firebase Messaging in the Service
// * Worker when your app is not hosted on Firebase Hosting.
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/5.3.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.3.1/firebase-messaging.js');
// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'messagingSenderId': '917892951649'
});
// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();


// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function(payload) {
  console.warn('[sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Somebody Calling';
  const notificationOptions = {
    body: 'Background Message body. Payload:'+payload,
    icon: '/img/icon512.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});
