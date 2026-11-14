// Personal task data and signed-in pages are always fetched from the server.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>new Response(`<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#006ba6"><title>نبض تیم مدیریت — اتصال اینترنت</title><body style="font:16px Tahoma;background:#f3f8fc;color:#006ba6;padding:50px 24px;line-height:2"><h1>اتصال اینترنت برقرار نیست</h1><p>برای دیدن آخرین وضعیت تسک‌ها، به اینترنت وصل شوید و دوباره تلاش کنید.</p><button onclick="location.reload()" style="padding:12px 20px;background:#006ba6;color:white;border:0;border-radius:9px">تلاش دوباره</button></body></html>`,{status:503,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})));
});
