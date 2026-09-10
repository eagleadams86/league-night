# League Night

Run your club's darts, table shuffleboard, pool and cornhole leagues from your phone — and later
its bowling or golf one. Players or teams, a season schedule, a standings table, live scoring and
knock-out tournaments, shared with everyone in the club: anyone who signs in to Google and has the
club's ID can follow it, and anyone with the admin key can run it.

**Live: https://eagleadams86.github.io/league-night/**

> **Status (10 September 2026): everything is built, the cloud is switched on, and a club can now
> run several leagues at once.** Players and teams, seasons with generated fixtures, leg-by-leg and
> live scoring, the standings table, knock-out tournaments, invites by link, email, text and QR
> code, and sharing across devices through Google sign-in — all live. **Table shuffleboard joined
> darts on 8 September, American 8-ball on 9 September and cornhole the same day.** On
> **10 September the people came apart from the game**: a **club** is the roster, and inside it a
> **league** is one competition at one game, so the same friends play darts on a Tuesday and
> shuffleboard on a Wednesday under one ID and one invite. **A team's line-up came apart from it
> the same day** — one "The Anchor", with different people in it in each league. Anything made
> before either change opens with no figure moved and nothing to re-enter.
> The Firebase project is `league-night-dff31`; the console steps that made it are under
> *Setting up the cloud* below.

## What it does today

- **A club, its leagues, and their seasons.** A **club** is the people: one roster, one Club ID,
  one invite, one admin key. Inside it, a **league** is one competition at one game — Tuesday
  darts, Wednesday shuffleboard, a summer pool ladder — with its own rules, its own seasons and its
  own table. They can all run at once, and anyone on the club's roster can play in any of them.
  Everything about people is the club's; everything about how a game is scored is the league's.
- **Four games.** A league is **darts**, **table shuffleboard**, **pool** (American 8-ball) or
  **cornhole**, chosen when the league is created and fixed after that — every result already
  recorded was folded under that game's rules, so a league that changed game would be re-scoring
  its own history. To play something else, add another league. Everything below works the same
  whichever it is — the schedule, the standings, the tournaments, the sharing — because the engine
  only ever sees "sides" and asks the game what a result holds. At darts the unit is a **leg**; at
  shuffleboard it is a **game** to 15 or 21; at pool it is a **rack**; at cornhole it is a **game**
  to 21, played in rounds.
- **Cornhole picks how a game ends.** **First to 21** takes the round that reaches or passes it;
  **exact 21** sends a side that would go over back to **11**; **win by 2** plays on until somebody
  is two clear. A game already played remembers the rule it was played under, so changing the
  league's mind never re-scores a night.
- **The same friends, a second club.** You need this only for a genuinely *different* group of
  people who happen to overlap — the same friends at another game is another league inside the club
  you already have. *Create a Club* offers **The Same Players**: pick one of your clubs, tick who
  should come, and they are on the roster before you have added a single fixture. Names travel, and
  the **teams** they are in — taking the pairings from the source's first league played in teams.
  **Handicaps come across whole, game by game** — a figure is filed under
  the game it was given at, so a darts 60 arrives as a darts 60 and only a darts league reads it.
  Anyone retired in the old club arrives playing in the new one, and a line under the list says
  exactly what is about to happen before you press Create.
  It is a **copy and not a link**: everyone arrives as a new player in the new club, so renaming
  somebody here does not rename them there, and a name an account has claimed in one club is
  not claimed in the other.
- **Clubs.** Create one — a name, then its first league's name, game and format — or load the five
  demo clubs to see everything working. **The first demo runs two leagues at once** on one roster,
  darts and shuffleboard, which is the club/league split with something in it. A device can hold
  several clubs; switch between them in the header.
- **Teams, and who is in them.** A **team** is the club's — one "The Anchor", one name, one
  history across every game it plays. **Who is in it is each league's answer**, so the same four
  friends pair up one way at darts and another at cornhole, on one roster. The Teams card carries
  a league picker and shows one at a time; a new league played in teams starts with everybody
  unpaired and offers to copy another league's pairings if they happen to match. A team only turns
  up in a league's fixtures once somebody is in it there.
- **Players and teams.** Add, rename, retire; a per-player handicap applies to every singles
  match they play — a team match never carries one. At darts it comes off the starting score (a
  deduction of 40 makes a 501 leg a 461 one); at shuffleboard it is a **head start** off the
  target (a head start of 4 makes a game to 15 a game to 11); at cornhole the same, off 21, and
  capped at 8 so the target stays above both the 11 a bust drops you to and the 12 one perfect
  round scores; at pool it is **racks on the wire**,
  racks given at the start of every match, which is the only handicap that is given in the match
  rather than in the leg. A wire is fixed when the match gets its first rack, so changing somebody's
  handicap never rewrites a match already under way, and it counts in the score and in the racks
  for and against. Teams hold up to eight players.
- **Subs, and who can make the night.** Every match has a card: who is actually throwing for
  each team tonight. Until somebody sets it the app assumes the team's own players. Anyone on a
  card who is not on that team *in that league* is a sub — the app keeps no other record of one:
  a sub's legs count for the team they stood in for *and* for their own record, because every
  figure is worked out from who threw the leg. Players say for themselves whether they can make
  a night — playing, can't make it, or happy to stand in for another team — and an admin can
  note it for anyone who does not use the app. A player's own answer is the one shown. It sorts
  the list of people who could fill a gap; it never decides who plays.
- **Seasons and fixtures.** Start a season and generate a round robin — byes for an odd count, an
  optional double round, one round a week or any spacing — or add matches one at a time.
- **Scoring.** Tap a match, add a leg (or a game), tap who won it. The match ends itself when the
  format says so (best of five, or a fixed count — and a fixed count plays every leg of itself
  whatever anyone was given on the wire). Optional figures per leg: at darts, darts thrown,
  checkout, 180s, 140+ and 100+; at shuffleboard, points scored, hangers and the best frame; at
  pool, balls left, visits and whether it was a break and run; at cornhole, points scored, bags in
  the hole and the best round. Forfeits, voids and reopening. Every tap is saved as it lands.
- **Live scoring, darts.** Open a leg live and score it visit by visit on a keypad: the remaining
  scores, whose throw it is, a checkout hint from the conventional chart, bust detection
  (under, one left, or a finish no double can make), and a finish that asks how many darts it
  took — offering only the counts that can do it. Undo takes the last visit back. The averages,
  180s and checkouts fall out of it. A handicap comes off the player's start.
- **Live scoring, shuffleboard.** Open a game live and score it **frame by frame**: type what the
  frame was worth and tap who scored it — or *Nobody*, for a frame where every weight came off
  the board. Hangers are counted with the frame rather than typed afterwards, so the points and
  the Hangers column can never disagree. The running totals count up to each side's target, the
  **hammer** starts where you put it and alternates every frame, and the game ends itself the
  moment a side reaches or passes its target. Undo takes the last frame back. Points per game,
  hangers and the best frame fall out of it.
- **Live scoring, pool.** Open a rack live and score it **visit by visit**: tap how many of your
  own went down, then *Missed*, *Potted the 8* or *Lost the 8*. Each side's count of balls still
  to clear runs down as the rack goes on, the table changes hands after every visit from whoever
  broke, and the **8 comes last** — claiming it with your group still on the table is refused,
  while potting it early loses the rack, which is a thing that happens rather than a mistake to
  argue with. Losing the black and fouling it away are one record, because from the scorer's
  chair they are one thing. Undo takes the last visit back. Balls per visit and break and runs
  fall out of it.
- **Live scoring, cornhole.** The same sheet shuffleboard uses, in cornhole's own words: type the
  **round's net score**, tap who scored it — or *Nobody* — and step the count of bags that went in
  the hole. Scoring is **cancellation**, so only the difference counts and only one side scores a
  round. Whoever scored the last round **throws first** in the next, which is the worse end of it;
  a round nobody scored changes nothing. Under *exact 21* going over is announced — "Bust — The Bag
  Pit goes back to 11" — rather than points quietly leaving the board. Points per game, bags in the
  hole and the best round fall out of it.
- **Standings.** Points for a win, draw and loss; leg (or game) difference, legs for,
  head-to-head and wins as tiebreakers in the order you choose; form and a trend line per side;
  and in a team league an individual table of every player's own legs. The last three columns are
  the game's own: **3-dart average, 180s and high out** at darts, **points per game, hangers and
  best frame** at shuffleboard, **balls per visit, break and runs and what they left when they
  were beaten** at pool, **points per game, in the hole and best round** at cornhole. Racks given on the wire count in the racks for and against, so the number
  in the table and the number on the match card are the same number — the key under the table
  says so.
- **Tournaments.** Single or double elimination, seeded from the standings, at random or in roster
  order, byes to the top seeds, best of one to seven per match, a second final if the losers'
  champion wins the first. Each bracket match is scored the same way as a league match.
- **Everything the family has.** Four themes, offline, installable, backups per club, a CSV of
  the matches, a read-only snapshot link — of the whole club, one league, or one season — Find
  (⌘K), and on a phone a bottom bar with the five views a thumb away.
- **Chrome that stays out of the way.** On a phone the app's name holds the top of the screen and
  the header's controls sit on one line that scrolls sideways rather than stacking three deep. On
  a desktop the 📌 at the end of the tab row holds the tabs at the top while the page scrolls
  under them; it is off until you press it, and remembered.

## Sharing a club

A club starts life in the browser it was made in. Once the cloud side is set up, its owner
can **Share** it from the Club tab, and from then on — **one ID and one key cover every league
in it**:

- **The Club ID** (`LN-` and eight letters or numbers) is how others find it. Anyone who signs
  in to Google and enters it can follow the club — every league's table, fixtures and tournaments
  — on their own phone, live. Clubs can never be listed, so an ID is a key, not a hint.
- **The Admin Key** (sixteen letters or numbers) is how others get to run it. Enter it once and
  your Google account becomes an admin: you can score matches, run seasons and draw
  tournaments. The key is compared on the server, in a document nobody can read.
- **The owner** is whoever shared the league. Only the owner can make or unmake admins, remove
  members, hand ownership to another member, make a new Admin Key, or delete the league.
- **Both keys are handed to your password manager**, and never to the app's sync, backups or
  share links: the Invite card is a real login form whose username is the Club ID and whose
  password is the Admin Key, so iCloud Keychain or your browser carries the pair to your next
  phone end to end encrypted. The app never learns whether it was saved. It does keep its own copy
  of the key in this browser's local storage, under a key of its own, so it can show it to you —
  what it never does is put it inside the league, where it would ride into every backup, every
  share link and every member's copy.
- **Signing back in opens your league — there is no ID to type twice.** Your Google account
  carries the leagues you are in, so a new phone, or a browser that has been cleared, needs only
  **Sign In** on the welcome screen: the leagues come back, and the app opens on the one you were
  in last. *Join a League* is for a league you have not joined yet. Signing in never moves you off
  a league you already have open.
- **Every change is a transaction.** Two admins scoring two matches at once both land; the
  same match scored on two phones resolves to the later tap. Offline, a change is saved on the
  phone and goes up on its own when the network is back.
- **Team Setup: members sort the teams out themselves.** While an admin has Team Setup open,
  anyone in the league can make a team, rename one, and put themselves in or take themselves
  out — no asking, no waiting. Nothing else in the league can be changed by them: not a
  result, not a fixture, not a season, not a tournament and not a setting, and the server is
  what says so rather than the app. Close it once the teams are settled, and open it again
  between seasons. It starts open for a brand-new league, and the app offers to close it the
  moment you generate a season's fixtures.
- **One account is one player, and one player is one account.** Say which player you are and
  that name is yours: nobody else can claim it, and you cannot be two people. Tap your own
  name on the Players tab, or pick it on the Club tab. While Team Setup is open you claim
  it directly; once it has closed, claiming is a request like any other. An admin can always
  say who is who, in case somebody claimed the wrong name or never got round to it.
- **A member can ask for their own name, and their team's.** The league is one record and only
  its admins write it, so what a member types is kept beside the league and changes nothing
  until an admin taps **Apply**. The Club tab carries a count of what is waiting, and each row
  shows the name as it stands against the one asked for — a request overtaken by an admin, or
  from somebody no longer on that player, offers only *Dismiss*. Saying whether you can make a
  night needs no approval: that answer is kept with your account rather than in the league.
- **Removing a member is honest about what it does:** they come off the list, and anyone who
  still has the ID can rejoin as a viewer. A league that must be closed to someone is a new
  league with a new ID.

`firestore.rules` in this repo is the checked-in copy of the security rules and argues every
clause. It must be pasted into the Firebase console before anyone signs in.

### Setting up the cloud

The sync module at the foot of `index.html` carries `FIREBASE_CONFIG` (Firebase's public client
config for `league-night-dff31`, not a secret) and `GOOGLE_CLIENT_ID`; set either to null and the
app is fully local with nothing cloud-only offered. These are the steps that created them, kept
for the day the project is rebuilt or a sibling app needs the same:

1. **Create a Firebase project** (its own — one project per app is the family's rule, so a
   rules mistake in one app can never reach another). Add a *web app* to it and copy the
   `firebaseConfig` object into `FIREBASE_CONFIG`.
2. **Authentication → Sign-in method:** enable **Google** and nothing else. Anonymous must stay
   off — the rules treat any signed-in account as able to read a league by its ID.
3. **Authentication → Settings → Authorized domains:** add `eagleadams86.github.io`.
4. **Firestore Database:** create it (production mode), then **Rules → paste `firestore.rules`
   from this repo → Publish.** Do this before the first sign-in.
5. **Google Cloud Console → APIs & Services → Credentials → the OAuth 2.0 client named "Web
   client (auto created by Google Service)":** copy its client ID into `GOOGLE_CLIENT_ID`, and
   under **Authorized JavaScript origins** add `https://eagleadams86.github.io` and
   `http://localhost:8024` — exact, port included, or Google refuses with `origin_mismatch`.
6. Commit the two constants. The config is Firebase's public client config, not a secret;
   access is enforced by the rules.

Checking the console side from a terminal, without opening it (nothing here is a secret):

```bash
curl -s "https://identitytoolkit.googleapis.com/v1/projects?key=AIzaSyDSXLL8gh0nAmuYUy4z5-rSHEMUDgLCtI0"
```

Healthy: a JSON body whose `authorizedDomains` includes `eagleadams86.github.io`.

```bash
curl -s "https://firestore.googleapis.com/v1/projects/league-night-dff31/databases/(default)/documents/leagues/probe?key=AIzaSyDSXLL8gh0nAmuYUy4z5-rSHEMUDgLCtI0"
```

Healthy: `PERMISSION_DENIED` — the database exists and refuses an anonymous read. A probe can
never tell the published rules from the default deny-all; only a real signed-in session can.

Then prove it with two Google accounts: one shares a league, the other joins with the ID and
sees the table; the second enters the Admin Key and can score; the first makes the second the
owner; a viewer's attempt to score is refused on the sync button with the rules' own message.

## If something goes wrong

The whole league lives in one Firebase project, **`league-night-dff31`**, and everything below
is at `console.firebase.google.com`. There is deliberately no owner's view inside the app: a
club can never be listed, which is what makes an unguessable Club ID a key rather than a
hint, and a cross-league view would have to live in the page's own JavaScript.

- **The rules are the kill switch.** Firestore Database → Rules. Pasting the previous
  `firestore.rules` from this repo's git history closes the members' write path in seconds —
  no deploy, no release, no data lost. Everything an owner or an admin can do keeps working.
- **A disputed claim.** Firestore Database → Data → `leagues/{id}/roster` holds one document
  per claimed player, keyed by the player's id and naming the account that holds it;
  `leagues/{id}/members` holds what each account asked for. The app shows a claim only when
  the two agree, so a mismatch reads as "not claimed" rather than as two people. Deleting a
  roster document frees that name for whoever it really is.
- **A club that has grown too big.** The rules cap what one club may hold — 500 players,
  250 teams, 50 leagues, 100 seasons, 2,000 matches, 200 tournaments — and the Club tab meters the
  bytes against the 1,000 KB a club may hold. Closing old seasons trims them.
- **Cost.** Billing → Usage, and a budget alert on the project. **The twenty-clubs-per-account
  limit is enforced in the browser only** — it is a speed bump against an accident, not a
  control. The budget alert is the control. (Twenty clubs per account and fifty leagues per club
  are different numbers; the second is in `firestore.rules` too.)
- **An old tab.** A browser still running a previous build writes the older kind of player
  link and no roster document, so the new app reads it as unclaimed rather than as a second
  claimant. It fixes itself when that tab is reloaded.

## Inviting people

Once a club is shared, the Invite card on the Club tab offers the join link four ways:
the phone's own share sheet (or Copy on a desktop), Email, Text, and a **QR code drawn in the
app** — no library, nothing fetched. The link is the app's own address with the Club ID in
the fragment (`#join=LN-…`), so it reaches no server log; tick *Include the Admin Key* and it
carries the key too, and whoever opens it becomes an admin. A link is taken off the address bar
the moment it is opened, so the key never sits in the history.

The QR encoder covers versions 1 to 6 (up to 106 characters), which is what a join link needs
and no more; it is pinned in the test suite against an independent encoder's output, a
Reed–Solomon syndrome check and the structural facts every reader relies on.

## Adding a second league

On the **Club** tab, press **＋ New League**. It asks for a name, a game and whether it is played
as singles or in teams, and it is running immediately, on the roster you already have — no second
ID, no second invite, nobody typed in twice.

A league picker appears beside the season picker on **Standings**, **Matches** and **Tournament**
the moment a club has two, and choosing one moves all three. A club with a single league looks
exactly as it did before, picker and all hidden.

**A league's game never changes.** Every result already recorded was folded under that game's
rules, so a league that changed game would be re-scoring its own history. Its name, its format and
its rules can all change until its first match is recorded. A league can be deleted while it is
empty; once it holds a season or a match it stays, and a club always keeps at least one.

**Handicaps are per player, per game.** A darts start deduction, a shuffleboard or cornhole head
start and a pool wire are three different things, and nobody would want one number standing for
all three. The player window shows one box per game the club actually plays — so a club that only
throws darts still reads exactly one, as it always did.

**Teams are per player, per league.** The same asymmetry, one step over: a handicap belongs to a
GAME (two darts leagues share one) and a line-up belongs to a LEAGUE (two darts leagues can pair
people up differently). The player window shows one team box per league played in teams. A **sub**
is a name on a card who is not on that team *in that league*, so the same person can be a regular
at darts and a stand-in at cornhole.

## What is coming

- **More games.** Bowling and golf — one entry each in the game registry, the way shuffleboard,
  pool and cornhole were added; the league engine knows nothing about any of them. Cornhole shares
  its scorer with shuffleboard, because a round of one is a frame of the other; a game that scores
  the same way as one already here costs a `rounds` entry and its own words.
- **Cricket**, the second darts format, with a live scorer of its own beside the x01 one.

## Accessibility and Paper

Every view and window was audited with axe-core under Playwright at 1280px in Midnight and at
375px in Light, the demo clubs, plus the privacy page, with no violations at WCAG 2.2 AA or
axe's best-practice level (re-run 10 September 2026 across all five tabs and every dialog forced
open — a closed dialog is invisible to axe, and an unnamed box inside one passes a whole-page run). Beyond what a tool can see: status is never
carried by colour alone (a form tile is a letter, a chosen side a tick, a thrower a pill),
every dialog closes on Escape and a click outside, the tab strip takes arrow keys and hands the
next Tab to the 📌 beside it, and the
column letters of the table are spelled out beneath it rather than hidden in a hover title —
and so is its one other abbreviation, the figure marking a player's handicap (a deduction at
darts, a head start at shuffleboard or cornhole, racks on the wire at pool, and the key says
which).
On paper every round prints open and a bracket wraps instead of clipping.

A club that grows past 300 KB is offered **Trim Closed Seasons** on the Club tab: every
live-scored leg, game or rack in a closed season keeps its figures — at darts the darts, the
checkout, the 180s and the points scored, which is what an average is made of; at shuffleboard the
points, the hangers and the best frame; at pool the balls left, the visits and the break and runs;
at cornhole the points, the bags in the hole and the best round — and loses only the record of how
it was scored. No table changes, at any of the four games. The cloud holds one document of at most 1 MiB per club.

## Running it locally

```bash
python3 -m http.server 8024
```

Then open `http://localhost:8024/` for the app and `/tests.html` for the suite. The suite only
runs on localhost: it boots the real app in a hidden frame, which must never happen on the
published site.

## Privacy

Nothing is uploaded until you sign in, and Google's code is not fetched until you ask to share or
join a league. A league you create or join is stored in a Firebase project the author pays for,
readable by anyone signed in to Google who knows its ID. Your Club ID and Admin Key go to your
browser's password manager and never into the app's sync, backups or share links. The
[privacy policy](privacy.html) has the details.

## Provenance

An independent personal project by Charles Adams, MIT licensed — see `NOTICE` and `LICENSE`.
Built from the [family starter](https://github.com/eagleadams86/starter).
