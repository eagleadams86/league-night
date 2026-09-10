# League Night — rules for Claude sessions

A league tracker for darts, table shuffleboard, pool and cornhole, and later other pub and club
games (bowling, golf). Players or teams, a season schedule, standings, live scoring and
knock-out tournaments — shared with everyone in the league. Deployed via GitHub Pages:
https://eagleadams86.github.io/league-night/

Built from the family starter (`~/claude-starter`) on 2026-09-07. Everything the starter
carries — the CSP, the Auto theme default, the header row, the help window and info dot,
Find (⌘K), Back Up & Restore, the delete-all window, the share codec, the service worker,
the SCHEMA halt and the test harness — is the family's, and the comments beside each block
say so. **This file records only what League Night decides that the family has not.** The
full plan is at `~/.claude/plans/my-friends-are-going-zany-riddle.md`.

## What is new here, and why

- **A CLUB is the people; a LEAGUE is one competition at one game** (2026-09-10). `state.league`
  became `state.club` and holds only the roster's owner-facing name; the game and every setting
  moved onto `state.leagues[]`, one entry per competition. `SCHEMA` went to **8**. What a reader
  needs before touching any of it:
  - **The Firestore collection is still `leagues/{id}` and the ID prefix is still `LN-`.** That is
    a LEGACY NAME for what is now a club, kept on purpose: renaming the path would orphan every
    real cloud document and there is no server-side migration available here. Same call as
    `leg.frames` still holding rounds at cornhole. `normalizeLeague` and `mergeLeague` keep their
    names for the same reason (and `mergeLeague` is `window.lnMerge`, read by the sync module).
  - **`state.league` → `state.club` was not cosmetic.** `state.league` beside a new
    `state.leagues[]` is a lethal ambiguity in a 10,000-line file, and the rename is what stops it.
  - **THE MIGRATION IS GATED ON SHAPE, NEVER ON `schema < 8`.** `boot()` stamps `schema: SCHEMA`
    onto a share payload built by an OLDER app before handing it to the boundary, `__plant` passes
    raws with no schema at all, and the suite's fixtures carry schema 1 — a number gate would skip
    every one of them and redden a hundred literals. `migrateRaw` gates each half on the thing it
    converts (`!Array.isArray(raw.leagues) && raw.league`, and per player `p.hcps == null &&
    p.hcp != null`), which is also why every old-shape fixture in the suite still works, as a
    migration fixture. It never mutates its argument.
  - **THE MIGRATED LEAGUE'S ID IS DERIVED FROM THE CLUB'S AND NEVER MINTED** — `firstLeagueId()`,
    shared with `blankClub`. `uid()` is random, so two devices migrating the same old cloud state
    would mint two different ids, `mergeList` would keep both, and the club would silently split
    its matches across two leagues that are the same league, with nothing on screen and no way
    back. Derived, both devices converge.
  - **`mergeLeague` normalizes BOTH sides with the UNION of their leagues visible, and this one
    loses data without it.** It normalizes each side alone, so a copy that has not yet received a
    new cornhole league would re-point that league's matches at `leagues[0]` (darts), `frames()`
    would find darts has no `rounds`, and every round record on those legs would be DELETED — then
    committed by `mergeList` if that side carried the higher `u`. `gamesIn()` reads both raws'
    leagues first and hands the union to both calls as `opts.knownGames`. **`lgRef` KEEPS an id
    the union recognises rather than repairing it**, and that ordering is the whole fix: the
    repair happens before any game is resolved, so a union consulted only afterwards comes too
    late. A test named for it goes red without either half.
  - **`match.leagueId` is stored and is the source of truth**, not derived by walking to the
    season — orphan matches exist and the first-season-adopts-them rule had to survive, per league.
    A match inside a season or a bracket takes THAT one's league whatever it claims: the two cannot
    disagree, and a fixture that drifted would be drawn on one table and folded by another game's
    rules. A dangling id lands on `leagues[0]` and the match is never dropped.
  - **A club always has at least one league.** `blankClub` mints one, `normalizeLeague` mints one
    if the list comes out empty, `applyTombstones` keeps the newest survivor when another device's
    tombstone would take the last, and the delete refuses the last outright. Every `leagues[0]`
    fallback in the file leans on this, and it is what lets `currentLeague()` promise never to
    return null — which is what kept 69 `G()` and 19 `S()` call sites unchanged.
  - **`player.hcp` became `player.hcps`, one figure per GAME**, each clamped to ITS OWN game's
    range, keyed on `GAMES` and not on the club's own leagues (so deleting and recreating a darts
    league does not wipe everybody's figure). ABSENT rather than empty, `avail`'s rule one level
    up. It also dissolved `copyPlan.sameGame`: the darts-60-becomes-a-shuffleboard-10 failure is
    fixed at the root rather than guarded against, because no figure changes game. `bothTeams`
    went with it — the team RECORD is the CLUB's while `format` is each league's, so teams always
    travel. (Since the per-league membership change the same day, WHO IS IN a team is each
    league's answer; the copy takes one league's pairings — see the first bullet.)
  - **ANYTHING HOLDING ONE SPECIFIC MATCH RESOLVES ITS GAME FROM THE MATCH, NEVER FROM `G()`.**
    `G()` now means "the game of the league in the picker". Reach a pool match while the picker
    sits on darts — through Find, a bracket, or a stale pick after a merge — and the sheet would
    fold a rack under the x01 rules, with nothing on screen to say so and the leg STORED.
    `gameOf(m)`, `settingsOf(m)`, `hcpIn(m, p)` and `matchFormatFor(m)` read the match's own
    league; `newLeg`, `spotFor` and `openLive`'s record-planting all use them, because those
    WRITE. Belt and braces: `openMatch` and `openLive` move `leaguePick` to the match's league, so
    the picker can never disagree with what is on screen.
  - **`leaguePick` is VIEW state beside `seasonPick`** — never in `state`, so it rides into no
    backup and no share link. Changing league clears the season pick, because a season id belongs
    to one league.
  - **`legsIn(st, seasonId, lg)`'s third argument is NOT optional**, and a null `seasonId` means
    "this league, every season" and never "every league" — folding a rack into a darts player's
    average is a figure that changed with nothing on screen to say so. Same for `sidesOf`,
    `sideName` and `leagueMatches`, whose no-seasons fallback is now PER LEAGUE.
  - **`CLUBS_MAX` (20, per account) and `LEAGUES_MAX` (50, per club) are different numbers.** They
    were one constant before the split. The second mirrors `validSize` in `firestore.rules`, and a
    test pins the two files against each other.
  - **The rules deploy was ADDITIVE**: `game` became optional (the `setup` treatment), its
    immutability line went, and `validSize` gained a **guarded** `leagues` cap — guarded because
    `size()` on a missing key is an evaluation error, which would deny every un-upgraded client.
    Strictly more permissive than what it replaced, so the ordering was free; paste first anyway.
    The Team Setup member clause needed no change and gets `leagues` protection for free, because
    `hasOnly(['players','teams','tombstones'])` is key-agnostic.
- **A TEAM is the club's; WHO IS IN IT is each league's** (2026-09-10, the same day as the
  split and reversing one of its decisions). `player.teamId` became `player.teams`, a map of
  `{ [leagueId]: teamId }`. `SCHEMA` **9**. The team RECORD did not change at all — one "The
  Anchor", one name, one history across every game — which is what makes the rest cheap:
  - **`firestore.rules` DID NOT CHANGE, and that is the design earning its keep.** Membership
    rides inside `players[]`, which the Team Setup clause already whitelists; putting it on
    `state.leagues[]` would have been denied outright and a new top-level list would have needed
    a genuinely-widening deploy. The request queue needed nothing either: **the only team thing a
    request carries is a RENAME**, and a name is club-level — so `requestVerdict` only loosened
    to "a team you are in in ANY league" (`inAnyTeam`). First change since the cloud went on that
    needed nothing pasted into the console.
  - **THE VALUE IS CHECKED AND THE KEY IS NOT, and a reader will want to make them match.**
    A `teamId` naming no team is dropped, as it always was — `mergeList` only ever ADDS teams and
    the one way a team leaves is a tombstone, so a missing team genuinely is no team. A **league**
    arrives on one side before the other every time somebody makes one, so an unknown league key
    SURVIVES: `mergeLeague` normalizes each side alone, and dropping it would wipe everybody's
    cornhole pairing and let `mergeList` commit that if those player records carried the higher
    `u`. Unknown leagues are dropped where they are DRAWN — the `m.lineup` rule, not the `lgRef`
    one. `PLAYER_TEAMS_MAX` is **64 and deliberately NOT `LEAGUES_MAX`**: a device holding the
    maximum leagues plus one that has not arrived yet must not have the not-yet-arrived entry be
    the one dropped, which is the exact loss the survival rule exists to prevent.
  - **The emptiness test runs AFTER the value filter**, or a player whose only team was just
    tombstoned carries `teams: {}` into every backup for ever. Keys are written **club's leagues
    first, in the club's own order**, so two devices serialise byte for byte.
  - **The migration stamps the old club-wide team under EVERY league, singles ones included.**
    `format` is per league and MUTABLE, so a migration that read it would produce different data
    on two devices depending on when each ran. It also keeps `copyPlan`'s promise that a club
    which gains a team league later finds its teams already there — and it is why ~38 old-shape
    fixtures in the suite still work untouched.
  - **`normalizeLeague`'s empty-leagues fallback now DERIVES its id** from the club's, as
    `blankClub` and `migrateRaw` do. It minted a random one, which left the migration with
    nowhere to stamp a membership on a state whose leagues were lost.
  - **`sidesOf`'s teams branch is the teams with somebody in THAT league** — derived, no stored
    field. It **does not look at `active`** and never has: a team whose every player has retired
    is still a side, or the last retirement would drop it out of the fixture generator
    mid-season. `sidesForSeason` still brings back any side that PLAYED.
  - **A SUB IS PER LEAGUE NOW.** "A name on a card who is not on that team" is a league's
    answer, so `lineupFor`, `lineupRows` and both sub pills take `teamIn(state, m, p)` — the
    MATCH's league, never `teamOf`'s picked one.
  - **The team editor FREEZES the league it is arranging** on `teamCtx = { id, lg }` at open, so
    a picker that moved cannot redirect a tick, and its legend names that league.
  - **`copyPlayers` decides ONCE which of a player's memberships travels** — the source league
    whose GAME matches the new club's, if it is played in teams, else the source's first
    teams-format league — and hands `copyPlan.teamFrom` to the builder. Preferring a
    teams-format league matters because the migration stamped memberships under singles leagues
    too, and those are leftovers. Re-deriving it in the builder is how a team gets minted that
    nobody joins.
  - **DELETING A LEAGUE was promised before it existed** (fixed 2026-09-10, PR #14). The boundary
    half shipped with the split — `'league'` in the tombstone kinds, and `applyTombstones`'
    carefully-commented keep-the-last-league rule — and the BUTTON never did, so `HELP.leagues`
    described a feature the app did not have and nothing could ever produce that tombstone.
    `#lr_delete` sits at the foot of the League Rules card, not on a Leagues row: a row you press
    to SELECT is one slip away from the wrong league. It refuses while the league holds a season,
    a fixture or a tournament — the season rule one level up — and the refusal NAMES what is in
    the way (`listWords`). Hidden entirely at one league, the `lr_dOutRow` rule, and the handler
    still refuses because another device can delete one between a render and a press. It clears
    that league's entry from every player's `teams` and touches them, so the clearing wins the
    merge on a device that has not seen the tombstone.
  - **Two live bugs from the split died here**: `playerChanged` wrote
    `p.teamId = isTeams() && … : null`, so editing anybody with a SINGLES league picked wiped
    their team with nothing on screen to see; and `csvMatches`/`searchApp` called
    `sideName(st, id)` with no league, so in any club whose FIRST league is singles every
    teams-league match in the export and in Find was named "—". `mtLineup`'s cap read `S()` for a
    specific match and now reads `settingsOf(m)`.
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
- **A `setDoc` onto an existing roster row is an UPDATE, and `allow update: if false`.** So a
  row left behind by anything made that name permanently unclaimable — and the catch reported
  it as somebody else's, which the client had not checked and which was false. `claimPlayer`
  now asks `lnHolderOf(next)` (a row AND a member document that agree) before it decides
  anybody holds a name, clears a leftover at the target first, and an owner or admin sweeps
  rows that agree with nobody. **A row on its own is not a holder.**
- **Adoption stops the moment somebody says for themselves who they are** (`claimSettled`).
  Un-claiming raced its own listeners: the roster snapshot arrives with the row gone while
  the member snapshot has not yet delivered the cleared document, so `adoptClaim` read a
  `playerId` on its way out and put the row straight back.
- **An account lets go of a claim on what the roster SHOWS, never on a refusal.** A
  `permission-denied` on the roster create means EITHER somebody beat us to it OR the rules
  for that collection are not published yet, and the client cannot tell those apart. Only one
  of them is a reason to un-link an account, so neither does: `reapMyRoster` clears the link
  when a row it can see names somebody else. The first draft cleared on the error code, which
  would have quietly un-linked every account in the league the first time a build shipped
  ahead of its rules.
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
- **A TABLE OF NOUGHTS HAS TO SAY WHY IT IS NOUGHT** (2026-09-10). Every player figure comes
  from `leg.by` and from nothing else — a doubles game cannot say whose bag went in, so the app
  asks. A scorer who taps the winners and never ticks the names therefore gets a table of
  noughts, which is correct and looked exactly like a broken app: the individual table's note
  explained why three COLUMNS were em-dashes while saying nothing about the count itself.
  Charles reported it as "no player stats". Three places say it now, and each says it where the
  reader is: the individual table's note leads with the cause and the fix, the player window
  names the player, and the leg row says it beside the tick that would fix it. Once some legs
  are ticked the note counts what is still missing rather than going quiet. **This is the
  [[empty-state-must-not-explain-why]] rule INVERTED** — the reason here is certain, and
  withholding it is what made the figures look wrong.
- **A sub is a name on a card who is not on that team, and there is no other record of one.**
  Nothing downstream reads a lineup: `standings`, `matchScore` and `dartsPlayerStats` all key
  off the leg, so a sub is credited because `leg.by` names them and all the card does is let
  them be ticked there at all. Which is why **`newLeg` pre-fills `by` only from a side with ONE
  name down** — a squad makes `by[side].length !== 1`, and `dartsPlayerStats` then credits legs
  played and won and silently drops every average, 180 and checkout for that team's season.
- **A sign-in that finds a league OPENS it, and only when the screen is empty** (2026-09-08).
  `onSignedIn` had always downloaded the account's leagues and registered them with
  `current: false` — correct, because a sign-in must never move somebody off the league they are
  looking at, and wrong on the one device where it mattered: a new phone or a cleared browser was
  left on the welcome card with its own leagues sitting behind it in the picker, and the only way
  in was to type a League ID the account had just handed over. (A RELOAD cured it, because
  `normalizeDevice` falls `current` back to `leagues[0]`, which is why nothing about it was
  discoverable.) `lnOpenLatest(preferred)` is the whole fix and its first line is the guard:
  `if (viewOnly || state) return null`. `preferred` is `users/{uid}.current` — the league this
  account was last in, written by `cloudOpen` on a switch and by `noteUserLeague` on an arrival —
  and the fallback is the END of the device list, because both lists are appended to. Each
  candidate is `loadLeague`d before it is opened, so a record naming data that is gone falls
  through rather than raising openLeague's "no longer on this device" at somebody who was only
  signing in. **Every write to `users/{uid}` now MERGES**: a plain `setDoc` replaces the document,
  and the league list and `current` are written on different schedules, so whichever landed last
  would have dropped the other's field. The account document still holds ids and names only —
  never a key, and the rules there validate nothing, so the app is the only thing keeping one out.
- **The welcome card has a FIFTH door, and it is the only conditional one.** *Sign In* is for
  somebody coming back, and `renderWelcome` derives it from `!virgin || !!cloudUser` — an account
  already behind the page has nothing to sign in to. It is on `SIGNIN_DOORS` like every other
  route to a popup (that list is now six), and its handler awaits nothing, because an `await`
  before `requireSignIn` spends the gesture the popup opens inside.
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
- **The same players, in another CLUB** (2026-09-08, re-aimed 2026-09-10). It was built because
  one league was one game; since the split, the same friends at another game is another LEAGUE in
  the club they are already in, and this window is only for a genuinely different group who
  overlap. *Create a Club* copies a roster across. `copyPlan`
  decides and `copyPlayers` builds — **and the split is load-bearing**: the live note in the
  window runs `copyPlan` on every tick, so the sentence on screen IS the plan the button
  executes and cannot promise eight players while seven arrive. Both expect NORMALIZED states,
  which is what keeps the planner cheap enough to run per keystroke.
  - **THE COPIED PLAYERS GET NEW IDS, and the reason is duplicate ids inside ONE league** — not
    tombstones, which `touch()` handles on its own. Copy A into B, then A into C and B into C,
    and C holds two players carrying one id: `playerById` returns whichever `.find` hits first,
    and `leagues/{id}/roster/{playerId}` — whose document id IS the player id and which is the
    whole one-account-one-player index — is then one row for two people. Do not "simplify" this
    by keeping the source id; a shared id would also be a cross-league identity nothing
    maintains, and it buys nothing, because a claim is per-league by construction.
  - **There is deliberately no `fromId` provenance field.** A stored field with no reader is a
    claim the boundary has to defend for ever. Hence also **no SCHEMA bump**: the feature stores
    nothing new.
  - **A copied player is written out FIELD BY FIELD, never `Object.assign({}, p)`.** A spread
    carries `avail` and every field a later allowlist adds. `avail` is ABSENT rather than null —
    its keys are the source league's match nights, they annotate nothing in the new league, and
    they would spend its `AVAIL_MAX` budget before anybody answered for a night it plays.
  - **`hcps` travels WHOLE, game by game** (since the split; it used to travel only between two
    leagues at the same game). `int()` clamps rather than refuses, so one shared figure carried
    across would have landed a darts 60 as a shuffleboard head start of **10** — the maximum, a
    real advantage nobody was given and indistinguishable afterwards from a setting. Keying by
    game made that impossible rather than guarded-against; the suite's test is still named for it.
    Shallow-COPIED, never shared, and applied AFTER `touch()` so the key lands where the boundary
    puts it — this output is never normalized on the way out and `eq` compares with
    `JSON.stringify`, where a reordered object is a different object.
  - **`copyPlayers` does NOT normalize on the way out.** `saveLocal` stringifies `state` exactly
    as it is, so the output has to be boundary-clean already — and a defensive normalize would
    turn the test that proves it into a test of nothing.
  - **The window offers a league this account only FOLLOWS, and never the demo.** Copying names
    out of a league writes nothing to it, so this path calls neither `canEdit()` nor `canSetUp()`
    and must not; the demo's people are invented and `loadDemo` rebuilds them. A device holding
    only the demo shows no fieldset at all.
  - **Nobody is pre-selected, even with one league to pick.** Enter in the name box fires Create,
    so a pre-selected source with everyone ticked would make one keystroke create a league with
    twenty people in it.
  - **`lg_copyWrap` ships `hidden` in the MARKUP**, not only from `openCreate` — the smoke walk
    `showModal()`s every dialog without calling it, and would draw an empty `<select>`.
  - **`.picklist` is `overflow: hidden auto`, never `overflow-y: auto` alone**: setting one axis
    to auto computes the OTHER to auto too, and the browser reserved a 15px horizontal gutter
    under a grid that never needs one — a painted bar with nothing to scroll to.
  - **A UI test must plant the source in `localStorage` itself.** `__plant` writes neither the
    device record nor storage, and `loadLeague` reads storage. `withSource` in the suite removes
    every key that was not there on the way in and restores `ln-device` to the exact string it
    held — without that, a fixture league turns up in the real header picker on localhost, and
    the suite's own "writes nothing to storage" line had to be qualified to stay true.
- **The engines are pure and game-agnostic.** `roundRobin`, `standings`/`rankSides`,
  `buildSingle`/`buildDouble`/`resolve*`, and the x01 scorer know nothing about darts beyond
  what `GAMES.darts` tells them. **Shuffleboard proved it** (2026-09-08): not one line of the
  schedule, the standings, the tiebreaks, the brackets, the merge or the sharing changed.
- **What a SECOND game actually cost, and what it did not** (2026-09-08). The engine was free.
  Everything that had to change was a place the app said "leg" or "darts" out loud, and each one
  is now a key on the game rather than a word in the markup — `unit`, `formatLabel`, `doubleOut`,
  `detail`, `handicap.pill`, `handicap.note`. Read that list before adding cornhole: the contract
  is eleven keys and the tests pin that every game supplies all of them.
- **What the THIRD game cost, and the one thing it asked of the engine** (2026-09-09). American
  8-ball. The registry entry, a pure fold and a pad were the shuffleboard job again and cost
  nothing new. **What was new is `handicap.scope`**, because a pool handicap is *racks on the
  wire* — given in the MATCH, not in the leg — and that is the first thing any game has ever
  asked the shared engine for. It is a key inside `handicap` rather than a twelfth contract key,
  and **every reader tests for the scope it wants (`=== 'leg'`, `=== 'match'`) and never for the
  one it does not**: a fourth game that declared neither would otherwise inherit whichever branch
  the `else` happened to be. A test pins that every game declares one.
  - **`match.spot` is frozen when the match gets its first leg**, in the Add-leg handler and NOT
    in `newLeg` (which returns a leg and must mutate nothing). Same bargain `leg.start` makes one
    level down: a handicap edited afterwards never rewrites a match already played. The invariant
    is one sentence — **a match has a wire exactly when it has legs** — so the wire is deleted
    when the last leg goes and when a forfeit clears them, and a nought wire is not written at all.
  - **`matchScore` adds the wire on the LEGS branch only.** A forfeit's stored score is a result,
    not a count of racks; the confirm calls it "a full score and no racks", and a wire there would
    either pass that full score or hand a wired player a forfeit they lost.
  - **`matchDone`'s fixed branch counts legs DECIDED, not the score.** A head start is legs given
    and a fixed count is legs to play, so reading the score ended a fixed-four match after two
    real racks. Identical arithmetic for every wire-free match, which is every game but one.
  - **The wire is in `lf`/`la`/`ld`, and that is deliberate**: the match card and the table must
    show the same number for one match. Which makes it a figure that changed and must be SHOWN —
    `#mtWire` sits *between* the score and the format line, and `HELP.standings` forked for the
    first time because that is where a reader goes to ask why "racks for" exceeds racks played.
    The key sentence is assembled from `handicap.note`, so the explanation went in the note and
    NOT into a scope branch in the renderer.
  - **`lvOnly`/`LIVE_PARTS` replaced each sheet hiding the others' rows by name.** With three
    games that list is quadratic and a game left off one branch ships with two pads on screen and
    every test green. Hide the lot, then each sheet shows its own.
  - **`turns()` follows `frames()` and not `visits()`.** `visits()` returns `[]`, which is truthy,
    so an empty darts record survives the boundary to this day and reads as scored live. It also
    carries the running total, so no stored visit can pot balls a side has not got, a `won` that
    does not clear the group is dropped, and nothing after the rack ended is kept.
- **What the FOURTH game cost: SHARING a scorer** (2026-09-09). A round of cornhole *is* a frame
  of shuffleboard — one side scores it, by the difference, counting up to a target — so the two
  share `roundState`/`roundScore`/`roundUndo`/`roundLegStats` rather than the fold being copied.
  Everything that differs lives in **`rounds`**, a sub-object on the game in the same spirit as
  `handicap`, and each game's `rounds` carries its own BOUND copy of the four (`bindRounds()` runs
  just after the `GAMES` literal), so **no call site passes the rules and none can pass the wrong
  ones**. `frameState` and its three siblings survive as shuffleboard-bound wrappers with unchanged
  signatures and unchanged return KEYS — the suite compares with `JSON.stringify`, where a
  reordered object is a different object, which is why the token key is a computed key in the
  literal and not an assignment after it. A golden-value capture of the whole shuffleboard demo,
  taken on `main` before the refactor, came back byte-identical after.
  - **`rounds` is NOT a twelfth `GAME_CONTRACT` key.** Darts and 8-ball have no round scorer and
    the contract test asserts every game supplies every key. It gets its own check instead.
  - **`fit` is the rule that does not transfer, and nobody would rederive it.** At shuffleboard
    `h * 4 <= t` is *arithmetic* — every counted weight is worth 1 to 4. Cornhole scores by
    CANCELLATION, so two bags in the hole (6) against one in and one on (4) nets 2 with `h = 2`,
    and the sum is simply false. Carrying it across refuses a round that was really played, and
    the pad's backspace clamp would have *silently lowered* the count. Readers test `=== true`.
  - **THE TWO 4s.** At shuffleboard the token's VALUE and its COUNT are both 4; at cornhole they
    are 3 and 4. `liveHang >= n` and `int(x.h, 0, n, 0)` are the COUNT; every `* 4` and `/ 4` is
    the VALUE. They coincided at one game, which is why nothing told them apart.
  - **`hammer` became `next`, and the sense is INVERTED between the two games.** At shuffleboard
    the side the sheet points at holds the last weight, which is worth having; at cornhole it
    throws first, and the last bag is the other side's. The wrapper aliases `next` back to
    `hammer` for shuffleboard's readers, and the cornhole demo's bias runs the other way.
  - **`HELP` forks on the GAME'S IDENTITY, never on `liveScorer`.** Two games share a sheet now,
    so forking on the scorer would have handed cornhole shuffleboard's five explanations — hangers,
    weights and a hammer, at a game played with bags — word for word, with nothing on screen to see.
    A test asserts every game has its own body in every forked topic.
  - **A margin of 1 is NOT the same as no margin.** Targets differ whenever anyone has a head
    start, so a side can win while BEHIND on points (targets of 5 and 15, and 5–12 is a win). The
    guard short-circuits on a falsy `marg` and never compares when it is absent.
  - **A record belongs to a game that has a scorer for it.** `frames()` now needs the game's
    `rounds`, and darts has none — so it DROPS a round record on a darts leg rather than reaching
    for shuffleboard's numbers. A darts leg used to keep one, and `legIsLive` then read true.
  - **`leg.frames` is still the stored key at cornhole**, holding rounds. Renaming a stored key is
    a migration for no gain; it is written down so it reads as a decision rather than drift.
  - **A bust is a figure that changed and must be SHOWN.** `sbCommit` toasts it from a
    before/after compare, the way `liveCommit` does at darts.
  - **The demo alternates SINGLES and DOUBLES games**, as `demoPlay` already did for the darts
    pairs league. A pure-doubles demo would credit played and won and nothing else — every figure
    column an em-dash for everybody — and teach a reader the app is broken.
  - **`handicap.pill` exists because the standings table used to sniff the LABEL.** It drew a
    minus when `label.split(' ')[0]` was "start". A second game whose label was not would have
    been drawn wrong with nothing on screen to see. A game says how its own figure reads.
    `handicap.note` is the same fix for the table key's sentence.
  - **`formatLabel` is not `capUnit(unit.one)`.** At shuffleboard the unit is "game", and the box
    beside the format box is already labelled *Game* (it holds "Shuffleboard"). Two fields called
    Game is the bug you only see on screen; a game names its own field.
  - **`FRAME_MAX` is declared ABOVE the registry** because the registry's own literal reads it.
    A `const` is in its temporal dead zone until its line RUNS, so the first draft threw on page
    load with the whole suite green behind it — the September boot-time TDZ wearing a new coat.
    Every value a top-level literal reads is declared before that literal.
  - **A HELP entry may be a FUNCTION, and every body is still a LITERAL.** The function CHOOSES
    between two written-out texts; it never builds one. `helpBody` takes `innerHTML`, and no test
    can tell "the unit word from the registry" from "whatever arrived over Firestore" — so two
    games are two paragraphs, written twice, and the suite still refuses `esc(`, `state.` or `$(`
    anywhere in the table.
  - **Nothing in the pure engine may call a rendering helper.** `frameScore`'s error text was
    written through `plural()`, which is a `const` arrow a thousand lines further down the file.
    It happened to work and was one call site away from the TDZ above.
- **Table shuffleboard, and what a frame is** (2026-09-08). A `leg` at shuffleboard is one GAME,
  a race to 15 or 21, and `leg.start` — the number darts counts DOWN from — is the target it
  counts UP to. That is why `start` needed no second field and why a handicap is still one
  subtraction: a head start of 4 in a game to 15 is a target of 11.
  - **`leg.frames` is the record, and `{ s, t, h }` is one frame**: the side that scored it,
    what it was worth, and how many HANGERS were among those points. Exactly one side scores a
    frame. **`{ s: null, t: 0 }` is a frame nobody scored** — every weight off the end — and it
    has to be recordable or the frame count and the hammer both drift from the night played.
  - **Hangers are counted WITH the frame, never typed after it.** A hanger is four of those
    points, so `h * 4 > t` is two figures that disagree and `frameScore` refuses it; the sheet's
    stepper cannot go past what the total will hold, and lowering the total brings it down.
  - **The winner is the first side to REACH OR PASS its target**, and the frame that gets them
    there can carry them past it — the score stands as it fell. `frameScore` will not add a frame
    to a game that is over, and `frameState` ignores one that arrived anyway.
  - **The hammer starts where the scorer put it (`leg.first`) and alternates every frame.** It is
    not "whoever scored last": that is a house rule, and a wrong claim about it is worse than no
    claim. The sheet offers the choice for frame one only, exactly as darts offers who throws first.
  - **`legIsLive(leg)` is the game-agnostic "was this scored live"**, and every reader uses it.
    `leg.visits` on its own was the test in three places. `openLive` plants ONLY its own game's
    empty record — a darts leg that grew a `frames: []` would read as scored live and lose its
    Details boxes to a record nothing writes to.
  - **`compactSeason` trims both records** and the suite pins that no figure moves at either game
    — points, hangers and the best frame survive a shuffleboard trim the way `scored` survives a
    darts one.
  - **The blank frame is a WORD in the *Scored by* row, not a glyph on the keypad.** It began as
    `⊘` with an aria-label, which is unexplained to everyone who can see. Three answers to one
    question belong together, and the keypad's last row is `⌫` and a double-width `0` so no cell
    is dead space.
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

**Per-league team membership (2026-09-10, the same day)** is the current shape:
`player.teams = { [leagueId]: teamId }`, `SCHEMA` **9**, `EXPECTED` **424**, and **no
`firestore.rules` change at all**. The doubles demo club runs two teams leagues with the pairs
shuffled between them. Read the first bullet of "What is new here" before touching the boundary,
`sidesOf`, a sub pill or the copy window.

**The club/league split (2026-09-10)** is what it sits on: `state.club` + `state.leagues[]`. **`firestore.rules` in the repo is AHEAD of the console until
Charles pastes it** — the change is strictly more permissive than what it replaces, so nothing
breaks while it is un-pasted, but a club created without a `game` field cannot be written until it
is. The five demos are five CLUBS named for their people, and the first
(`LN-DEMODEMO`, *The Anchor*) runs **two leagues at once** — Tuesday Singles at darts and
Wednesday Board at shuffleboard, on one roster, with Hannah and Nia carrying a figure at each.
The golden fold of all five was byte-identical to the previous build apart from the intended
`hcp` → `hcps` rename. Read the first bullet of "What is new here" before touching the boundary,
the merge or anything that reads `G()`.

**Cornhole (2026-09-09)** is the fourth entry in `GAMES` and the fifth demo league
(`LN-DEMOCORN`, four teams of two, a lineup card, a sub, the last round scored round by round).
SCHEMA went to **7** for `leg.bust` and `leg.marg` (it is 8 since the club/league split). It is the first game
that shares another game's scorer — see the `rounds` bullet above before touching `roundState`,
`frames()` or `renderLiveRounds`.

**8-ball (2026-09-09)** is the third entry in `GAMES` and the fourth demo league (`LN-DEMOPOOL`,
singles, two players on the wire, the last round scored rack by rack). SCHEMA went to **6** for
`leg.turns` and `match.spot`. The pure `poolState`/`poolShot`/`poolUndo`/`poolLegStats` fold sits
beside the other two and is pinned the same way. It is the only game whose
handicap is a match-level one — see the `handicap.scope` bullet above before touching
`matchScore`, `matchDone` or `spotFor`.

**The roster copy (2026-09-08)** rides in the Create a League window: `copyPlan`/`copyPlayers`
beside `setupState`, `PLAYERS_MAX`/`TEAMS_MAX` mirroring `firestore.rules`, and a suite group
*bringing the same players into another league*. No SCHEMA bump — it stores nothing new.

**Shuffleboard (2026-09-08)** is the second entry in `GAMES` and the third demo league
(`LN-DEMOBORD`, singles, head starts, the last round scored frame by frame). SCHEMA went to 5 for
`leg.frames`. The pure `frameState`/`frameScore`/`frameUndo`/`frameLegStats` fold sits beside the
x01 one and is pinned the same way.

**Two tests fail in the desktop app's Browser pane and pass in CI** — *on a phone the bar is
really there* (`sheetW` 360 of 375) and *the controls are ONE line* (`headerH` 125 of ≤100). They
fail identically on `main`, so a run that shows only those two is a clean run. Check a baseline
before believing a phone-geometry failure here.

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

- **THE SIGN-IN POPUP OPENS INSIDE THE GESTURE OR IT DOES NOT COME BACK** (2026-09-08). This app
  signs in from FIVE controls where its three siblings sign in from one — the header button, which
  is the only thing `armSync` was wired to. Press an unwarmed one on a phone and the SDK import is
  still in flight when `requestAccessToken()` runs, so the activation is gone; iOS Safari opens
  that as a plain new TAB with no opener, Google completes the sign-in, finds nobody to hand the
  token to, and leaves a blank `accounts.google.com` while the app waits for ever. Charles hit it
  with eleven dead tabs behind him. Three rules came out of it, and adding a sixth door means
  revisiting all three: every control that can reach `share`, `join` or `claim` goes in
  `SIGNIN_DOORS`; `requireSignIn()` awaits `ensureInit()` ONLY behind `if (!tokenClient)`, so the
  warm path reaches the popup with no `await` in front of it (an async body runs synchronously to
  its first one); and when the activation has gone anyway, `popupIsAffordable()` says so and asks
  for a second press rather than opening a window that cannot return. **Warming stays on those
  controls and never on `document` or `body`** — the privacy page says Google is not fetched until
  the reader reaches for one of them, and a page-wide listener would make that false.

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
- **The demo is five CLUBS**, named for their people (darts singles — which also runs a second,
  shuffleboard league — darts teams, shuffleboard, 8-ball, cornhole), with ids that are NOT valid
  League IDs (they carry an O), so they can never be pushed to the cloud. `buildDemoSingles` trims bracket legs to the
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
- **A MATCH PLAYED BEFORE A SEASON STAYS OUT OF IT** (2026-09-10; it used to be swept in, and
  that was the wrong fix). `leagueMatches()` returned every league match while a league had no
  seasons and only the chosen season's once it had one, so a match added early VANISHED the
  moment a season started. The sweep hid the disappearance by taking the CATEGORY away — and a
  pre-season friendly is a real category. Charles found it the day it bit him.
  - `NO_SEASON` (`'~none'`, a tilde so it can never be a real id) is a pickable scope beside a
    season id. `leagueMatches` has three answers now: no seasons at all → everything; NO_SEASON →
    the matches in no season; a real id → that season's. A friendly is in no season's table BY
    CONSTRUCTION — nothing returns it for a real season id.
  - **It still counts for the PLAYERS who played it**, exactly as a cup match already did:
    `legsIn(st, null, lg)` asks for the whole league rather than one season. "Doesn't count"
    means the table. One rule, not two.
  - The Matches picker offers **Friendlies** (only when the league has any); **Standings does
    not**, because there is no table for matches that count for no table, and each picker stays
    truthful about its own tab.
  - `#mt_season` on the match window is how a match moves either way. **There was no way to move
    a match between seasons at all before this**, which is also why the sweep was dangerous:
    there would have been no way back out. A bracket match takes its season from its bracket and
    is not offered the box.
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
