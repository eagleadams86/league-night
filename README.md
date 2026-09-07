# League Night

Run a darts league from your phone — and later a cornhole, shuffleboard or bowling one.
Players or teams, a season schedule, a standings table, live leg scoring and knock-out
tournaments, shared with everyone in the league: anyone who signs in to Google and has the
league's ID can follow it, and anyone with the admin key can run it.

**Live: https://eagleadams86.github.io/league-night/**

> **Status (7 September 2026): everything is built and the cloud is switched on.** Players and
> teams, seasons with generated fixtures, leg-by-leg and live scoring, the standings table,
> knock-out tournaments, invites by link, email, text and QR code, and sharing a league across
> devices through Google sign-in — all live. The Firebase project is `league-night-dff31`; the
> console steps that made it are under *Setting up the cloud* below.

## What it does today

- **Leagues.** Create one (singles or teams), or load the two demo leagues to see everything
  working. A device can hold several; switch between them in the header.
- **Players and teams.** Add, rename, retire; a per-player handicap comes off the start of every
  leg they throw. Teams hold up to eight players.
- **Seasons and fixtures.** Start a season and generate a round robin — byes for an odd count, an
  optional double round, one round a week or any spacing — or add matches one at a time.
- **Scoring.** Tap a match, add a leg, tap who won it. The match ends itself when the format says
  so (best of five, or a fixed count). Optional per-leg figures: darts thrown, checkout, 180s,
  140+ and 100+. Forfeits, voids and reopening. Every tap is saved as it lands.
- **Live scoring.** Open a leg live and score it visit by visit on a keypad: the remaining
  scores, whose throw it is, a checkout hint from the conventional chart, bust detection
  (under, one left, or a finish no double can make), and a finish that asks how many darts it
  took — offering only the counts that can do it. Undo takes the last visit back. The averages,
  180s and checkouts fall out of it. A handicap comes off the player's start.
- **Standings.** Points for a win, draw and loss; leg difference, legs for, head-to-head and wins
  as tiebreakers in the order you choose; form and a trend line per side; and in a team league an
  individual table of every player's own legs.
- **Tournaments.** Single or double elimination, seeded from the standings, at random or in roster
  order, byes to the top seeds, best of one to seven per match, a second final if the losers'
  champion wins the first. Each bracket match is scored the same way as a league match.
- **Everything the family has.** Four themes, offline, installable, backups per league, a CSV of
  the matches, a read-only snapshot link, Find (⌘K), and on a phone a bottom bar with the five
  views a thumb away.

## Sharing a league

A league starts life in the browser it was made in. Once the cloud side is set up, its owner
can **Share** it from the League tab, and from then on:

- **The League ID** (`LN-` and eight letters or numbers) is how others find it. Anyone who signs
  in to Google and enters it can follow the league — the table, the fixtures, the tournaments —
  on their own phone, live. Leagues can never be listed, so an ID is a key, not a hint.
- **The Admin Key** (sixteen letters or numbers) is how others get to run it. Enter it once and
  your Google account becomes an admin: you can score matches, run seasons and draw
  tournaments. The key is compared on the server, in a document nobody can read.
- **The owner** is whoever shared the league. Only the owner can make or unmake admins, remove
  members, hand ownership to another member, make a new Admin Key, or delete the league.
- **Both keys are kept by your password manager**, never by the app's sync, backups or share
  links: the Invite card is a real login form whose username is the League ID and whose
  password is the Admin Key, so iCloud Keychain or your browser carries the pair to your next
  phone end to end encrypted. The app never learns whether it was saved.
- **Every change is a transaction.** Two admins scoring two matches at once both land; the
  same match scored on two phones resolves to the later tap. Offline, a change is saved on the
  phone and goes up on its own when the network is back.
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

## What is coming

- **Other games.** Cornhole, shuffleboard, bowling and golf — one entry each in the game
  registry; the league engine already knows nothing about darts.
- **A live x01 scorer for cricket**, the second darts format. Dart by dart, with bust detection and checkout hints, feeding the
  averages, 180s and high checkouts automatically.

### Inviting people

Once a league is shared, the Invite card on the League tab offers the join link four ways:
the phone's own share sheet (or Copy on a desktop), Email, Text, and a **QR code drawn in the
app** — no library, nothing fetched. The link is the app's own address with the League ID in
the fragment (`#join=LN-…`), so it reaches no server log; tick *Include the Admin Key* and it
carries the key too, and whoever opens it becomes an admin. A link is taken off the address bar
the moment it is opened, so the key never sits in the history.

The QR encoder covers versions 1 to 6 (up to 106 characters), which is what a join link needs
and no more; it is pinned in the test suite against an independent encoder's output, a
Reed–Solomon syndrome check and the structural facts every reader relies on.

## Accessibility and Paper

Every view and window was audited with axe-core under Playwright at 1280px in Midnight and at
375px in Light, both demo leagues, plus the privacy page, with no violations at WCAG 2.2 AA or
axe's best-practice level (7 September 2026). Beyond what a tool can see: status is never
carried by colour alone (a form tile is a letter, a chosen side a tick, a thrower a pill),
every dialog closes on Escape and a click outside, the tab strip takes arrow keys, and the
column letters of the table are spelled out beneath it rather than hidden in a hover title.
On paper every round prints open and a bracket wraps instead of clipping.

A league that grows past 300 KB is offered **Trim Closed Seasons** on the League tab: every
live-scored leg in a closed season keeps its figures and loses the visit-by-visit record,
and no table changes. The cloud holds one document of at most 1 MiB per league.

## Running it locally

```bash
python3 -m http.server 8024
```

Then open `http://localhost:8024/` for the app and `/tests.html` for the suite. The suite only
runs on localhost: it boots the real app in a hidden frame, which must never happen on the
published site.

## Privacy

Nothing is uploaded until you sign in. A league you create or join is stored in a Firebase
project the author pays for, readable by anyone signed in to Google who knows its ID. Your
League ID and Admin Key are kept by your browser's password manager, never by the app's
sync, backups or share links. The [privacy policy](privacy.html) has the details.

## Provenance

An independent personal project by Charles Adams, MIT licensed — see `NOTICE` and `LICENSE`.
Built from the [family starter](https://github.com/eagleadams86/starter).
