/* 數學速解尋寶記 — 離線快取 Service Worker
   策略：先回快取（現場零網路也能玩），背景同步更新（有網路時自動抓新版）。
   ※ 之後每次更新 App，請把下面的版本字串改掉（如 v3.2），平板連網重整兩次即會換新版。 */
const CACHE = "math-treasure-v3.3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const cached = await c.match(e.request, { ignoreSearch: true });
      const network = fetch(e.request)
        .then(res => {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        })
        .catch(() => null);
      // 有快取就先回快取（速度快、離線可用），沒有才等網路
      return cached || network.then(r => r || new Response("離線中，且尚未快取此資源", { status: 503 }));
    })
  );
});
