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
- **A member may sort the teams out, and the server can only say so much** (2026-09-08).
  `setup` is a boolean on the LEAGUE DOCUMENT — not in `state`, for the same reason as `owner`:
  it is about this cloud copy, and `state` travels into backups and share links where it means
  nothing. While it is on, the rules let a member update the league if `diff().affectedKeys()`
  says the document changed only `state`/`rev`/`updatedAt` and `state` changed only
  `players`/`teams`/`tombstones`. **That is the whole promise: no result, fixture, season,
  bracket or league setting can move — and it cannot say WHICH player.** Rules have no
  per-element list diff, so a member who went digging could rename or move somebody else during
  setup; the UI is what keeps it to teams and their own membership. Charles chose that trade
  knowingly. `resource.data.get('setup', false)` reads an absent flag as OFF, which is why a
  league that predates this needs no data edit. `diff()` and not four `==` comparisons because
  four list equalities walk `matches` element by element and push a big league past the
  per-request expression budget, failing in a way nobody can read.
- **`pushSetup` is not `pushNow` with a wider gate.** It builds the outgoing state with
  `setupState(mine, theirs)` — the CLOUD's own copy with three lists swapped in — so the rule
  passes because the client BUILT it that way, never because a merge happened to agree.
  `mergeList`'s order is stable here only while tombstones stop a stale copy re-adding a match,
  and that is exactly the undocumented dependency `setupState` removes. It writes `{state, rev,
  updatedAt}`: the same three words as the rule, in both files. And it re-reads `setup` INSIDE
  the transaction, because the flag can close between the tap and the write and a refusal the
  reader can read beats a `permission-denied` they cannot.
- **`canEdit()` is byte-identical and must stay so.** ~50 call sites, and it gates every result
  in the app. Team Setup is a SECOND predicate, `canSetUp()`; a predicate that becomes true in
  more places than it was is a bug you cannot see.
- **One account is one player, and one player is one account** (2026-09-08).
  `leagues/{id}/roster/{playerId}` is create-only and **its document id IS the player** — that
  is the entire uniqueness index, and it gives one account per player server-side. One player
  per account comes from the member document, which has one `playerId` field. What is enforced
  only **by agreement** is that the two name each other: checked at create and never after. So
  `members[].playerId` is what an account ASKED for and `claim` (set by `reconcileClaims`) is
  what the roster CONFIRMS — every half-written switch, abandoned row and duplicate reads as
  "not claimed" rather than as two people. The agreement is required of everyone, including an
  admin assigning somebody else, which makes the write ORDER load-bearing: the member document
  first, then the row.
- **A member who is not an admin ASKS; an admin's tap is the only bridge into the league**
  (2026-09-08). `state` is one opaque map to the rules — they can say "may write all of it" or
  "none of it" and nothing between — so a member writes what they want into
  `leagues/{id}/requests/{uid}`, and `applyRequest` turns it into an ordinary `save()`. Four
  decisions inside that a reader will want to undo: the queue is its **own subcollection and
  not fields on `members/{uid}`**, because dismissal is an admin's act and putting it in the
  members rule is one predicate away from an admin writing another member's `role` (and it
  would broadcast down the whole-collection members listener every viewer runs); `allow list`
  IS granted there where it is `false` on `leagues`, because **a League ID is a capability and
  a uid is not** — `/members` already hands out every uid; `requestVerdict` re-derives what a
  member is entitled to change **from the league and the members snapshot**, never from the
  request, which is the check the rules cannot make; and the request goes in **`deleteLeague`'s
  one batch** with the members, or a deleted league leaves every request undeletable forever.
- **A lineup that was never recorded is not an empty one** (2026-09-08). `m.lineup` is written
  only when somebody set it: an absent key means nobody has said and the team's own actives are
  the guess, a recorded `[]` means somebody said and said nobody. Every reader tests
  `Array.isArray`, never `.length` and never the parent's truthiness. Two more that look like
  tidy-ups and are not: **`LINEUP_MAX` is a constant 8 and never the live `settings.teamSize`**,
  because lowering a setting must not drop names off a night already thrown (the picker enforces
  `teamSize`; the boundary does not), and **an id naming no player SURVIVES `normalizeLeague`**,
  because `mergeLeague` normalizes each side alone and stripping it would lose a new player
  whenever the other copy's match carried the higher `u` — unknown ids are dropped where they
  are drawn, exactly as `leg.by` already does.
- **A sub is a name on a card who is not on that team, and there is no other record of one.**
  Nothing downstream reads a lineup: `standings`, `matchScore` and `dartsPlayerStats` all key
  off the leg, so a sub is credited because `leg.by` names them and all the card does is let
  them be ticked there at all. Which is why **`newLeg` pre-fills `by` only from a side with ONE
  name down** — a squad makes `by[side].length !== 1`, and `dartsPlayerStats` then credits legs
  played and won and silently drops every average, 180 and checkout for that team's season.
- **A player's own answer is the one shown; a note an admin made stands only until the player
  answers for themselves.** That sentence is on the card, and `availFor` is it in code. Two
  sinks on purpose: `members/{uid}.avail` for an account (self-written, no admin needed — the
  existing self-update rule already allows it) and `player.avail` in the league for the many
  players who will never sign in. It returns `null` and never `'n'`, and **availability gates
  nothing** — it sorts and annotates the list of people who could stand in, so a stale note
  costs a hint and never a result.
- **The availability toggles are the one block in the app a viewer may use.** They must never
  carry `.no-edit`, which `html[data-readonly] .no-edit` hides: what a player says about their
  own night is theirs to say and never enters the league.
- **The engines are pure and game-agnostic.** `roundRobin`, `standings`/`rankSides`,
  `buildSingle`/`buildDouble`/`resolve*`, and the x01 scorer know nothing about darts beyond
  what `GAMES.darts` tells them. A new game is one entry in `GAMES` and nothing else.
- **Bracket matches are ordinary matches** carrying `bracketId` and `slot`, resolved into a
  tree at render time, so two boards scoring two bracket games at once never collide.
- **The phone gets a bottom tab bar** (under 760px) — the first in the family. The bar is a
  `<nav>` with `aria-current`, not a second tablist, and it hides while any dialog is open
  because iOS re-anchors a fixed bar above the keyboard.
- **The phone header is the name above one line of controls that scrolls sideways**
  (2026-09-08). The header used to wrap to three or four rows on a phone and was left
  `position: static` for it; the controls live in a `.headctl` wrapper now, `flex-wrap: nowrap`
  with `overflow-x: auto` under 759.98px, and the row is back to ~87px and sticky. Three things
  go with it, all of them the family's: **the name is NOT in the scroller** (that is the whole
  reason the wrapper exists), **the wrapper states `gap: 12px` itself** — a nested control row
  does not inherit `.headbar`'s, which is how the four apps that nest theirs all ended up at 8px
  in the 2026-08-23 sweep — and the scroller carries **4px of padding against a −4px margin** so
  a focus ring has room without anything on the page moving. **759.98px is the same number as
  the bottom bar on purpose**: this app has one definition of a phone, and the suite asserts
  there are exactly two media blocks at that width so a third cannot arrive unread.
- **The tab row pins, and here that is a DESKTOP affordance** — Money Map, Flow Metrics and
  Sprint Predictability grew the 📌 first and a change belongs in all four. Under 760px the tab
  strip is not on the page at all (the bottom bar is), so the row and its button go together and
  `pinStuck()` answers by RECTANGLE: a `display: none` row still computes `position: sticky`.
  Everything else is the family's — `data-pin` on `<html>` set before first paint, `ln-pin`, off
  by default, `--pin-top` MEASURED from the header's rectangle, the margin becoming padding so
  toggling costs no reflow, `--bg` and never `--surface`, and z-index 12 under the header's 20.
- **Dev port 8024**, recorded in `.claude/launch.json` AND `~/.claude/launch.json`. 8021 is
  not free (held by something outside these repos); 8024 is the first past the family band.

## Status

Phases 1, 2, 3 and 5 are built (2026-09-07): the scaffold, the pure engine (`roundRobin`,
`standings`/`rankSides`, the bracket resolvers, the x01 fold and checkout table, `mergeLeague`),
the five views with the bottom bar, the scorer sheet, the editors, both demo leagues, the
tournaments, and the whole sharing model — the sync module, `firestore.rules`, the Invite and
Members cards, the join window and the password-manager key forms. **The cloud is switched on**:
`FIREBASE_CONFIG` points at `league-night-dff31` and `GOOGLE_CLIENT_ID` is set (the README's
"Setting up the cloud" keeps the console steps). Sharing still cannot be verified end to end from
here — only from two real Google accounts — so anything below about roles, claims and ownership is
argued from the rules rather than observed.

Phase 7 (polish, 2026-09-07 evening): axe clean across every view, window
and both demo leagues in two themes plus the privacy page (`axe.mjs` lived in the session
scratchpad — re-create it from axe-core under Playwright when auditing again; the audit below
rebuilt it and it was clean again); `compactSeason`
+ the Trim button past 300 KB; rounds open for print; the column-letter key under the table.
Phases 4 (the live x01 sheet, `openLive`/`liveCommit` over the pure fold) and
6 (invites: `joinLink`, Web Share, mailto/sms, the in-app QR encoder capped at version 6, and
`#join=` arrival that strips the fragment at once) landed the same day. **Every phase is built;
nothing is outstanding.** The README tracks what is live.

An audit pass the same evening (2026-09-07) read the whole app through for holes, bugs, dead
comments and doc drift and fixed eleven things. Each has a test named for what went wrong, in the
suite's group *the 2026-09-07 audit*; the rules they left behind are the last three bullets of
"What is new here" and the last five of "Things a tidy-up would break". Do not re-audit those.

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
- **A join link is parsed LENIENTLY** (`parseJoinHash`): the first link Charles sent arrived
  with the message's words glued onto the fragment by a share sheet. The words come first and
  the link last in every message, `navigator.share` gets the words without the link, and the
  parser takes the first thing shaped like an ID after `#join=`.
- **The league name is edited in its box, inside `rulesChanged`** — a second `change` listener
  would run after `render()` had put the old name back.
- **Deleting a league is one `writeBatch`** — members, the key, the claim, the requests, the
  roster, the league — because the subcollection rules `get()` the league and would be
  undeletable after it went. **Nothing may be added under a league without this line.**
- **The demo ids carry an O** and so fail `LEAGUE_ID_RE`; that is what keeps them off the cloud.

- **Trim Closed Seasons must not move a figure, and the leg has to carry the points for
  that to be true.** An average is scored ÷ darts; `darts` was written onto a trimmed leg and the
  points were not, so the side that LOST a live leg dropped out of its player's average the moment
  a closed season was trimmed — while the button, the help and the README all promised nothing
  would change. `compactSeason` writes `scored` per side now, `legSideStats` hands it back, and
  `dartsPlayerStats` counts a trimmed leg exactly as it counted the live one. `scored` is on
  `normalizeLeague`'s allowlist by name and NOT in `legFields`, because `legFields` is what the
  Details boxes offer a scorer to type; SCHEMA went to 3 in the same commit.
- **`int()` clamps UP, so it can invent a value that was never there.** `Number(null)` is 0, which
  is finite, so `int(start.a, 1, 9999, 0)` turned a leg with no starting score into a leg starting
  on 1. Leg starts go through `startAt()` instead, which answers null for anything that is not a
  real start. Ask of every other boundary helper whether its floor can manufacture a figure.
- **A quick key is a visit like any other and must go through the same gate.** 26, 41, 45, 60 and
  100 are all real checkouts, several of them in one or two darts; the quick keys committed at a
  flat three and never showed the finish row, so a checkout scored that way lied about the darts
  it took. Anything new on the keypad routes through the `total === rem && canFinish` check.

## Things a tidy-up would break

- **`memberForPlayer` reads `claim` and NEVER `playerId`.** `.find` on `playerId` cannot express
  a conflict, so it silently picked one — and two accounts were pointing at one player in the
  live league, which meant `availFor` guessed and `requestVerdict` returned `apply` to both of
  them for a rename of the same player.

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
- **The pin block sits BELOW `const $`** and that placement is load-bearing: `applyPin()` runs at
  the foot of it to hang the observer and dress the button, and `$` is in its temporal dead zone
  until the line that declares it. Moving the block up throws at boot, which leaves the page
  drawn and every handler unattached — see [[league-night-harness-traps]] for the shape.
- **A control that is not RENDERED has an all-zero rectangle**, whose top of 0 reads as a second
  line the row has not got. The suite's phone probe filters `getClientRects().length` before it
  measures the header, because `#syncBtn` is hidden in every harness run (no cloud config).
- **The first season adopts the matches that came before it, and only the first.**
  `leagueMatches()` returns every league match while there are no seasons and only the chosen
  season's once there is one, so a match added early vanished from the Matches tab and the table
  the moment a season was started. It belongs to the league's first season; a later season takes
  nothing.
- **A forfeit deletes the legs, so it asks first when there are any.** Void keeps its legs and
  already asked; forfeit stores a score and none, and took them without a word.
- **The owner is a field on the LEAGUE DOCUMENT and never on `state`** — a uid has no business in
  a backup or a share link. `window.lnOwner(id, uid)` is how the module tells the classic side
  whose league it is; without it every member but the owner saw the owner listed as an ordinary
  admin, on a card that says the owner decides who may run the league.
- **A shared snapshot may take a copy OUT and put nothing in.** Restore ran `adoptLeague()`,
  whose `save()` the `viewOnly` guard threw away — the league on screen changed, the snapshot
  banner started naming it, and nothing had been written anywhere. The button and its paragraph
  are hidden in a snapshot and the import handler refuses behind them, and the danger zone goes
  with the Delete All button rather than opening onto nothing.

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
