const CACHE_NAME = 'hourglass-v1';
const APP_SHELL = ['./', './index.html', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

/* Cache-first for the app shell itself; everything else (Firebase, fonts, etc.)
   goes straight to the network since that data needs to stay live. */
self.addEventListener('fetch', function(event){
  var url = event.request.url;
  var isAppShell = APP_SHELL.some(function(p){ return url.indexOf(p.replace('./','')) !== -1; }) || event.request.mode === 'navigate';
  if(!isAppShell || event.request.method !== 'GET'){ return; }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if(response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || networkFetch;
    })
  );
});
