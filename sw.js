/* Properties 714 — Service Worker v2 */
var CACHE='p714-v2';
var STATIC=['/','/ acquisitions/','/deals/','/reports/','/messages/','/settings/','/super-admin/','/js/config.js','/js/auth.js','/js/donna.js','/manifest.json'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(STATIC);}).catch(function(){}));self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}));self.clients.claim();});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=e.request.url;
  if(url.includes('supabase.co')||url.includes('anthropic.com')||url.includes('fonts.googleapis')||url.includes('jsdelivr'))return;
  e.respondWith(fetch(e.request).then(function(r){var clone=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,clone);});return r;}).catch(function(){return caches.match(e.request);}));
});
