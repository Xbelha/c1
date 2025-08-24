// A unique name for the cache
const CACHE_NAME = 'macis-bakery-cache-v2';

// Essential files for the app shell
const essentialUrlsToCache = [
  '.',
  'index.html',
  'script.js',
  'Products.json',
  'thank-you.html',
  'thank-you.css',
  'thank-you.js',
  'manifest.json'
];

// Non-essential external assets
const nonEssentialUrlsToCache = [
  'https://macis-leipzig.de/wp-content/uploads/2019/03/cropped-macis_Logo_Leipzig_Druck_4c-192x192.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Playfair+Display:wght@700&display=swap'
];

// Event listener for the 'install' event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        
        // Cache essential files. If this fails, the SW install fails.
        const essentialCachePromise = cache.addAll(essentialUrlsToCache);
        
        // Cache non-essential files individually. Failures here won't stop the install.
        const nonEssentialCachePromise = Promise.all(
          nonEssentialUrlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Failed to cache non-essential asset: ${url}`, err);
            });
          })
        );
        
        return Promise.all([essentialCachePromise, nonEssentialCachePromise]);
      })
  );
});

// The 'fetch' and 'activate' event listeners can remain the same.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the request is in the cache, return the cached response
        if (response) {
          return response;
        }
        // Otherwise, fetch the request from the network
        return fetch(event.request);
      }
    )
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});