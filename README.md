# League Night

Run a darts league from your phone — and later a cornhole, shuffleboard or bowling one.
Players or teams, a season schedule, a standings table, live leg scoring and knock-out
tournaments, shared with everyone in the league: anyone who signs in to Google and has the
league's ID can follow it, and anyone with the admin key can run it.

**Live: https://eagleadams86.github.io/league-night/**

> **Status (7 September 2026): the league itself works, on one device.** Players and teams,
> seasons with generated fixtures, leg-by-leg scoring, the standings table and knock-out
> tournaments are all live. Sharing a league across devices — sign-in, the League ID and Admin
> Key, invites and QR codes — and the live dart-by-dart scorer are the next phases. Until then a
> league lives in the browser it was made in, like every other app in this family.

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
- **Standings.** Points for a win, draw and loss; leg difference, legs for, head-to-head and wins
  as tiebreakers in the order you choose; form and a trend line per side; and in a team league an
  individual table of every player's own legs.
- **Tournaments.** Single or double elimination, seeded from the standings, at random or in roster
  order, byes to the top seeds, best of one to seven per match, a second final if the losers'
  champion wins the first. Each bracket match is scored the same way as a league match.
- **Everything the family has.** Four themes, offline, installable, backups per league, a CSV of
  the matches, a read-only snapshot link, Find (⌘K), and on a phone a bottom bar with the five
  views a thumb away.

## What is coming

- **Sharing a league.** Sign in to Google; a League ID lets anyone signed in follow the league
  and an Admin Key lets them run it. Owners can make co-admins, hand ownership on, rotate the
  key, or delete the league. Invites by text, email or QR code.
- **A live x01 scorer.** Dart by dart, with bust detection and checkout hints, feeding the
  averages, 180s and high checkouts automatically.
- **Other games.** Cornhole, shuffleboard, bowling and golf — one entry each in the game registry;
  the league engine already knows nothing about darts.

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
