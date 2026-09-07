'use strict';
/* THE ESCAPE HATCH, AND IT EXISTS BEFORE IT IS NEEDED.

   A bad page is fixed by pushing a new one. A bad service worker is RESIDENT and
   can keep serving itself, so the fix has to be a worker too. If sw.js ever ships
   broken:

       cp sw-kill.js sw.js && git commit && git push

   Every installed copy then clears this app's caches, unregisters itself and
   reloads its own windows onto the real page.

   Deliberately kept in the repo unused. Writing it under pressure, against a
   worker that is actively breaking the app, is the worst possible moment. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    /* ONLY this app's caches. The origin is shared with every sibling app and
       their caches are not ours to delete. */
    for (const k of await caches.keys()) {
      if (k.startsWith('ln-shell-')) await caches.delete(k);
    }
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
  })());
});
