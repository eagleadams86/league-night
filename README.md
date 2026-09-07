# League Night

Run a darts league from your phone — and later a cornhole, shuffleboard or bowling one.
Players or teams, a season schedule, a standings table, live leg scoring and knock-out
tournaments, shared with everyone in the league: anyone who signs in to Google and has the
league's ID can follow it, and anyone with the admin key can run it.

**Live: https://eagleadams86.github.io/league-night/**

> **Status (7 September 2026): under construction.** The shell is up — the family's chrome,
> windows, offline support and guards — and the league features are landing in phases. What
> you see at the link above is a placeholder until phase 2 lands. This README grows with each
> phase.

## What it will do

- **Leagues.** Create one and you own it; share its ID and friends can follow it; share the
  admin key and they can run it with you. Owners can make co-admins, hand ownership on,
  rotate the key, or delete the league.
- **Players and teams.** Singles or doubles leagues, with per-player handicaps.
- **Seasons and fixtures.** A round-robin schedule generated for you, with byes for odd
  counts and an optional double round. Results are entered leg by leg, or scored live.
- **Standings.** Points, legs for and against, a form line, configurable tiebreakers, and an
  individual leaderboard in team leagues.
- **Live x01 scorer.** 501 and 301, double-out, bust detection, checkout hints, and the stats
  that fall out of it — 3-dart average, 180s, high checkout.
- **Tournaments.** Single and double elimination, seeded from the standings or at random,
  byes handled, best-of-N per round.
- **Invites.** A join link you can text, email or show as a QR code.
- **Everything the family has.** Four themes, offline, installable, backups, a read-only
  snapshot link, Find (⌘K), and a demo league that reaches every feature.

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
