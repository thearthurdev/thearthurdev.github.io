'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "favicon.ico": "ebe2500858e7573996c245dd7a43ae34",
"favicon.png": "760481c6383a512e08787a70712f717d",
"images/social_share_image.png": "ea0adf40f30b0ccb98bb8998a4aaae16",
"version.json": "c5d2c4ee9066cae605fa69f74e59e7df",
"icons/Icon-192.png": "77de680d752070e678118abeb2acc289",
"icons/Icon-512.png": "f96fe590b673a73b023a341bf5536a8f",
"manifest.json": "b58a780cddb07f726cb3afabbec11473",
"main.dart.js": "c8d0c119ba940a28d198cc0f047b0fbb",
"assets/NOTICES": "6a46989199dff850e70d20b46a0db554",
"assets/fonts/MaterialIcons-Regular.otf": "4e6447691c9509f7acdbf8a931a85ca1",
"assets/AssetManifest.json": "3bdea2e00d08a8f6f65c2390faeea004",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "b14fcf3ee94e3ace300b192e9e7c8c5d",
"assets/assets/images/play_store_button.png": "db9b21a1c41f3dcd9731e1e7acfdbb57",
"assets/assets/images/playa_device_laptop.png": "d95e3d17697dd7a4431545f8900220a0",
"assets/assets/images/arthurdev_logo.png": "38c925979f3a3bff93c68302f2928938",
"assets/assets/images/sneak_peak_device.png": "c318c6c954968f9c35a9ab690013162f",
"assets/assets/images/playa_device_phone.png": "0f31948a8dc4bc780adf36862aa89b87",
"assets/assets/images/mobwear_device.png": "170ebee2c485d7d5d9dd4ef2d5be6592",
"assets/assets/images/profile_pic.png": "6d00f5e91249df656986cdc6615d77c9",
"assets/assets/images/mobwear_logo.png": "deaf560b8b9f24a1a44f326e56b29d38",
"assets/assets/fonts/custom_icons.ttf": "151636c18962e2e51b93be45e86baa8f",
"assets/assets/fonts/my_icons.ttf": "82800b77d253d0a01dc199e02e839cf6",
"assets/assets/fonts/heebo_medium.ttf": "b4e0045784568bc212a3bb6de08891ff",
"assets/assets/fonts/montserrat_bold.ttf": "ade91f473255991f410f61857696434b",
"assets/assets/fonts/bree_serif_regular.ttf": "14aaff013398c35430cc935d1e4dcd99",
"assets/assets/fonts/righteous_regular.ttf": "77fa00996ecb4104c7880b8749c7c4e0",
"assets/assets/fonts/squadaone_regular.ttf": "87175716a375582a2339426aa94382b3",
"assets/FontManifest.json": "a6a16a264f7abdd05c95ffeeccf63b72",
"index.html": "781f501d6d3d140b33f2bf8d624d35a5",
"/": "781f501d6d3d140b33f2bf8d624d35a5"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
