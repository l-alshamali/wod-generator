// WOD Generator — Service Worker: يخلي البرنامج يشتغل بدون إنترنت بعد أول زيارة
var CACHE='wod-offline-v1';
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(['./']).catch(function(){});
  }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  // فحص الدخول (Supabase) يظل مباشر — عنده fail-open خاص فيه داخل التطبيق
  if(url.hostname.indexOf('supabase')>=0)return;
  if(req.mode==='navigate'||url.pathname.slice(-5)==='.html'||url.pathname.slice(-1)==='/'){
    // الصفحات: نت أولاً (عشان التحديثات توصل) وإذا ما في نت → من الكاش
    e.respondWith(fetch(req).then(function(r){
      var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});return r;
    }).catch(function(){
      return caches.match(req).then(function(m){return m||caches.match('./');});
    }));
  }else{
    // الخطوط وغيرها: كاش أولاً وإذا مو موجود → نت ثم خزّن
    e.respondWith(caches.match(req).then(function(m){
      return m||fetch(req).then(function(r){
        var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});return r;
      });
    }).catch(function(){return new Response('',{status:504});}));
  }
});
