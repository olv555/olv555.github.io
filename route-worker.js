// Navigation fallback for static preview servers as well as the Node server.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'&&url.origin===self.location.origin&&/^\/portfolio0[1-8]\/?$/.test(url.pathname)){
    event.respondWith(fetch(new URL('/index.html',self.location.origin),{cache:'no-cache'}));
  }
});

