# League Night — rules for Claude sessions

A league tracker for darts and, later, other pub and club games (cornhole, shuffleboard,
bowling, golf). Players or teams, a season schedule, standings, live leg scoring and
knock-out tournaments — shared with everyone in the league. Deployed via GitHub Pages:
https://eagleadams86.github.io/league-night/

Built from the family starter (`~/claude-starter`) on 2026-09-07. Everything the starter
carries — the CSP, the Auto theme default, the header row, the help window and info dot,
Find (⌘K), Back Up & Restore, the delete-all window, the share codec, the service worker,
the SCHEMA halt and the test harness — is the family's, and the comments beside each block
say so. **This file records only what League Night decides that the family has not.** The
full plan is at `~/.claude/plans/my-friends-are-going-zany-riddle.md`.

## What is new here, and why

- **A league is ONE Firestore document that many Google accounts can read and a few can
  manage.** Every sibling with sync stores one private document per account; this app has a
  League ID (the read capability — anyone signed in who knows it can open the league) and an
  Admin Key (the write capability — presenting it once promotes your account to admin). The
  rules are in `firestore.rules` and are argued clause by clause in the plan. Two things a
  reader will want to "fix" and must not: `allow list: if false` on `leagues` (the ID must
  never be enumerable, or the ID is not a capability), and every `get()` in the rules guarded
  by `exists()` (an unguarded get on a missing document errors rather than denying, and an
  `||` chain only forgives that error when its other side is true).
- **Both keys are carried by the password manager, never by the app.** The League ID and the
  Admin Key live in `localStorage` behind `type="password"` fields (Money Map's Twelve Data
  key pattern, see `credential-carried-by-password-manager` in memory) and reach no
  `state`, no backup, no share link and no readable Firestore document.
- **Every cloud write is a transaction with a `rev` counter and a two-way merge.** No "which
  copy wins" dialog: `mergeLeague(mine, theirs)` is pure, per-entity newest-`u` wins,
  deletions are tombstones, and the rules refuse any update whose `rev` is not exactly one
  ahead. `nextU()` is monotonic so a phone with a slow clock cannot lose an edit.
- **The engines are pure and game-agnostic.** `roundRobin`, `standings`/`rankSides`,
  `buildSingle`/`buildDouble`/`resolve*`, and the x01 scorer know nothing about darts beyond
  what `GAMES.darts` tells them. A new game is one entry in `GAMES` and nothing else.
- **Bracket matches are ordinary matches** carrying `bracketId` and `slot`, resolved into a
  tree at render time, so two boards scoring two bracket games at once never collide.
- **The phone gets a bottom tab bar** (under 760px) — the first in the family. The header row
  is untouched; the bar is a `<nav>` with `aria-current`, not a second tablist, and it hides
  while any dialog is open because iOS re-anchors a fixed bar above the keyboard.
- **Dev port 8024**, recorded in `.claude/launch.json` AND `~/.claude/launch.json`. 8021 is
  not free (held by something outside these repos); 8024 is the first past the family band.

## Status

Phases 1, 2, 3 and 5 are built (2026-09-07): the scaffold, the pure engine (`roundRobin`,
`standings`/`rankSides`, the bracket resolvers, the x01 fold and checkout table, `mergeLeague`),
the five views with the bottom bar, the scorer sheet, the editors, both demo leagues, the
tournaments, and the whole sharing model — the sync module, `firestore.rules`, the Invite and
Members cards, the join window and the password-manager key forms. **Sharing is dark until
Charles creates the Firebase project and pastes `FIREBASE_CONFIG` and `GOOGLE_CLIENT_ID`** (the
README's "Setting up the cloud"); it cannot be verified end to end from here, only from two real
Google accounts. Phases 4 (the live x01 sheet, `openLive`/`liveCommit` over the pure fold) and
6 (invites: `joinLink`, Web Share, mailto/sms, the in-app QR encoder capped at version 6, and
`#join=` arrival that strips the fragment at once) landed the same day. Still to come: 7 polish
(the axe pass, print CSS, `compactSeason`). The README tracks what is live.

**The QR encoder** matches the Python `qrcode` library module for module on four fixtures
(forced masks). A second library, segno, inserts a whole zero byte after the terminator before
the pad codewords — a quirk, not the standard's worked examples — so it agrees only on the
exact-fit case. The top-left format copy runs bit 14 at (8,0) along the row and UP column 8 to
bit 0 at (0,8); the first draft had the column half upside down and only an exact-fit fixture
showed it.

## The sharing model, in the code

- `window.ln*` is the contract between the classic script and the module: the module reads the
  league through `lnGet`/`lnEntry`/`lnDevice`, and hands results back through `lnAdopt` (this
  device's own push came back merged), `lnRemote` (another device's push arrived), `lnRegisterCloud`
  (a league joined or shared), `lnSetRole`, `lnMembers`, `lnMe`, `lnCloudGone`.
- **`save()` is an edit, `saveLocal()` is not.** save() counts (`editSeq`), marks a shared league
  `dirty` and asks for a push; the module's own adoptions go through saveLocal(), or nothing would
  ever come clean. A push that lands while `editSeq` moved on merges instead of adopting and
  pushes again.
- **A push is `runTransaction`**: read, `mergeLeague(mine, cloud.state)`, `update` with
  `rev + 1`. The rules refuse any other rev. `pushNow` refuses for a viewer and for anything
  that is not a League ID (the demo).
- **The Admin Key** lives in `ln-key-<id>`, never in `state`; the Invite card and the join
  window are real forms (username = League ID, password = Admin Key) for the password manager.
- **The owner writes their own member record without a key.** The first published rules
  required `keyMatches()` for any admin record, so every Share stopped at the third write
  (Charles hit it within the hour). `shareLeague()` is idempotent for the same reason: a second
  press repairs a league that stopped halfway instead of failing on `rev == 0`.
- **The Back Up window's danger zone is the family's Delete All Data** — every league on THIS
  device, shared ones left in the cloud. Deleting ONE league, or a shared league for everyone,
  is the owner's button on the League tab. One `clearDialog`, two modes, the heading says which.
- **The league name is edited in its box, inside `rulesChanged`** — a second `change` listener
  would run after `render()` had put the old name back.
- **Deleting a league is one `writeBatch`** — members, the key, the claim, the league — because
  the subcollection rules `get()` the league and would be undeletable after it went.
- **The demo ids carry an O** and so fail `LEAGUE_ID_RE`; that is what keeps them off the cloud.

## Things a tidy-up would break

- **A place in a bracket holds one of THREE things**: a side id, `null` (a bye — nobody, for
  good) or `undefined` (not decided yet). `resolveCell` marks a cell `pending` only when a SIDE is
  unknown; a cell with both sides known and no result has `winner: null` and is playable. The
  first draft treated the two nulls alike and let a side through against an opponent who simply
  had not played yet — and the demo generator found nothing to play.
- **Scoring exactly what is left with no double to finish on is a BUST, not a refusal**
  (`x01Visit`: 159 on 159 under double-out). Only a finish that IS possible in some count but not
  in the count given is an error, and the sheet never offers that count.
- **A bracket match plays to the BRACKET's best-of** (`matchFormatFor`), not the league's.
  `matchDone` takes a match format, never the settings object.
- **Standings `status`**: a match is `played` only once `matchDone` says so; legs entered on a
  match still short of that leave it `scheduled` and it counts for nothing. Forfeits store a
  score and no legs; voids keep their legs and count for nothing.
- **`__plant` in the test hooks updates the device entry's name** — the header picker reads the
  device record, not `state`, and a test that plants a hostile league name reads the picker.
- **The demo is two leagues** (one format each) with ids that are NOT valid League IDs (they carry
  an O), so they can never be pushed to the cloud. `buildDemoSingles` trims bracket legs to the
  bracket's best of three after `demoPlay`, which played them to the league's best of five.
- **`tests.html` reads its markup from `</head>`**, not `<body>` — a CSS comment in the head says
  `<body>` first.

## Editing rules

- `theme.css` is a byte-copy of the pack's. Never edit it here; when the pack moves, copy the
  fresh file in. The pack's `check_consumers.py` lists this repo.
- The suite pins `EXPECTED` in `tests.html` — bump it when adding a test; removing one fails
  the build on purpose. Tests refuse to run off localhost. Run them headless with Playwright
  (the Browser pane throttles a hidden tab's timers), see `local-headless-suite-runs` in memory.
- A new stored field goes into `normalizeLeague`'s allowlist AND bumps `SCHEMA` in the same
  commit, or the boundary strips it.
- Names are the only free text (40 chars, capped in code); there is no notes field anywhere,
  and none is to be added.
- Escape everything rendered with `esc()`. A league name or a player name arrives from
  Firestore written by another account: it is untrusted input on the shared origin.
- Keep README.md current in the same commit as the change it describes.
