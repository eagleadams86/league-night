'use strict';
/* League Night — the offline service worker.
   ==========================================================================
   Transcribed from Golf Handicap, which took it from Sprint Predictability and
   Flow Metrics, which took it from financial-plan. THE TWO FACTS THAT MAKE THIS
   THE MOST SECURITY-SENSITIVE FILE IN THE APP are worth repeating rather than
   linking to:

   1. THE PAGE'S CSP DOES NOT APPLY HERE. A worker takes its policy from the HTTP
      response headers of its OWN script, and GitHub Pages cannot set headers —
      so this code runs with NO Content-Security-Policy at all, and it runs
      resident, surviving reloads. That is why it is deliberately tiny, has no
      dynamic import, no eval, and never fetches anything cross-origin. Weigh
      anything added here as if it were running unsandboxed, because it is. Keep
      it short enough to read in one sitting.

   2. CACHE STORAGE IS ORIGIN-WIDE, NOT PER APP. Every app shares
      eagleadams86.github.io and `caches` is keyed by ORIGIN — so any page on
      that origin can read anything cached here, and the sibling workers
      (`gh-shell-`, `sv-shell-`, `td-shell-`, `fin-shell-`) sit in the same
      store. The answer is the rule below: ONLY FILES ALREADY PUBLIC IN THIS REPO
      ARE EVER CACHED. Nothing an attacker could read from the cache is anything
      they could not read from GitHub, and the data stays in localStorage, which
      every page on the origin could already reach — so installing this changes
      that threat model not at all. It cuts the other way too: any same-origin
      page can also WRITE into this cache, so an XSS hole in a sibling app could
      poison the offline shell and the poison outlives the hole. No per-cache ACL
      exists; the defence is the origin policy itself — a CSP on every page and
      no third-party script anywhere.

   The scope is this file's own directory. Widening it would need a
   `Service-Worker-Allowed` header, which Pages cannot send, so this worker
   structurally cannot reach the sibling apps.

   STRATEGY: NETWORK-FIRST, ALWAYS — the cache is a fallback for a network that
   actually failed, never a first choice. That is the whole answer to the failure
   this family can least afford: stale cached code reading data whose shape has
   since moved. You can only be served cached code on a visit where the network
   genuinely did not answer, so a change landing while you are online is
   impossible to miss. The braces to that belt is SCHEMA / haltForNewerData() in
   index.html — a saved copy from a newer build is refused rather than rebuilt.

   IF THIS EVER GOES WRONG: a bad page is fixed by pushing a new one, but a bad
   worker is resident and can keep serving itself. `cp sw-kill.js sw.js`, commit,
   push — every installed copy then clears this app's caches, unregisters itself
   and reloads its windows. sw-kill.js exists BEFORE it is needed on purpose.

   TESTING IT LOCALLY WILL MISLEAD YOU. The browser holds its own copy of this
   script and a byte-identical one fires no `install`, so edits appear to do
   nothing and an emptied cache appears not to refill. `await reg.update()`
   before judging any of it, and unregister a dev worker before trusting a suite
   run — otherwise you are testing the cache, not the disk. */

const CACHE = 'ln-shell-v1';
const PREFIX = 'ln-shell-';

/* Only files this repo already publishes. Adding one means editing tests.html
   too, which pins this list by exact equality — that is the security review, by
   design. The justification lives ABOVE the array rather than between the
   entries: the suite pulls every quoted string out of it straight from the
   source, comments and all, so a note inside with an apostrophe in the prose
   hands that check a fake entry. */
const SHELL = [
  './',
  'theme.css',
  'privacy.html',
  'favicon.ico',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png'
];

const ROOT = new URL('./', self.location).pathname;
const SHELL_PATHS = new Set(SHELL.map((p) => new URL(p, self.location).pathname));

/* Matches on the PATH, not the URL, because the markup asks for
   `favicon.ico?v=1`: keyed on the full URL the precached favicon would never be
   the entry that answers. index.html folds onto './' for the same reason. */
function shellKey(url) {
  let p = url.pathname;
  if (p === ROOT + 'index.html') p = ROOT;
  return SHELL_PATHS.has(p) ? p : null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Fetches the missing entries ONE BY ONE rather than with cache.addAll, which is
   all-or-nothing: a single 404 rejects the whole precache, install fails, and
   there is no offline at all while the app looks perfectly healthy online.
   And `install` fires ONCE per script version, so if the cache is later evicted
   nothing would rebuild it and offline would decay to "whatever the last online
   visit happened to request" — hence the page pings this on every load. The
   repair must be able to run without a new worker version to hang it on. */
async function topUp() {
  const cache = await caches.open(CACHE);
  await Promise.all(SHELL.map(async (p) => {
    const url = new URL(p, self.location);
    const key = self.location.origin + url.pathname;
    if (await cache.match(key)) return;
    try {
      const res = await fetch(url, { cache: 'reload' });
      if (res && res.ok && res.type === 'basic') await cache.put(key, res);
    } catch (_) { /* offline while installing — topUp runs again on the next load */ }
  }));
}

self.addEventListener('install', (e) => {
  e.waitUntil(topUp().then(() => self.skipWaiting()));
});

self.addEventListener('message', (e) => {
  if (e.origin && e.origin !== self.location.origin) return;
  if (!e.data || e.data.type !== 'shell-check') return;
  e.waitUntil(topUp());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    /* ONLY this app's caches. The origin is shared and a sibling's cache is not
       ours to delete. */
    for (const k of await caches.keys()) {
      if (k !== CACHE && k.startsWith(PREFIX)) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;
  const key = shellKey(url);
  if (!key) return;
  e.respondWith(networkFirst(req, key));
});

async function networkFirst(req, key) {
  const cache = await caches.open(CACHE);
  const cacheKey = self.location.origin + key;
  const cached = await cache.match(cacheKey);
  /* `no-cache`, and that argument is the whole difference between network-first
     and network-first-in-name-only. A plain `fetch(req)` inherits the cache
     mode of the request the PAGE made — `default` for a script or a stylesheet
     on an ordinary reload — so the browser's own HTTP cache answers it without
     a byte leaving the machine, this handler passes that copy on as if it were
     the network's, and `cache.put` then writes it back over the offline copy.
     Pages sends `max-age=600` on everything, so a deploy can go unseen for ten
     minutes and only a hard reload, which bypasses this worker entirely, shows
     it. Found on the task dashboard on 2026-08-24, where the content changes
     hourly and the staleness was visible; the same bare fetch was in all six
     workers, and `topUp()` in each of them already knew to say `cache:`.
     `no-cache` rather than `reload`: it still goes to the server every time,
     but as a conditional request, so an unchanged file comes back a 304 and
     costs nothing. Offline it rejects exactly as before and the cache answers,
     which is the only time a cached copy should ever be what you see. */
  const fresh = fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res && res.ok && res.type === 'basic') cache.put(cacheKey, res.clone());
    if (res && !res.ok && cached) return cached;
    return res;
  });
  if (!cached) return fresh;
  /* A five-second race, not a straight fallback: a network that is merely SLOW
     should still win if it answers, but a captive portal that never resolves
     must not hang the page for ever. */
  return Promise.race([fresh, wait(5000).then(() => cached)]).catch(() => cached);
}
