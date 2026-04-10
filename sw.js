/* Properties 714 — Service Worker v1 */
var CACHE='p714-v1';
var STATIC=[
  '/',
  '/acquisitions/',
  '/deals/',
  '/reports/',
  '/messages/',
  '/settings/',
  '/js/config.js',
  '/js/auth.js',
  '/js/donna.js',
  '/css/app.css',
  '/manifest.json'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){return c.addAll(STATIC);})
    .catch(function(){})
  );
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  // Skip non-GET and Supabase/API calls
  if(e.request.method!=='GET')return;
  var url=e.request.url;
  if(url.includes('supabase.co')||url.includes('anthropic.com')||url.includes('fonts.googleapis'))return;

  e.respondWith(
    fetch(e.request)
    .then(function(r){
      var clone=r.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,clone);});
      return r;
    })
    .catch(function(){
      return caches.match(e.request);
    })
  );
});
