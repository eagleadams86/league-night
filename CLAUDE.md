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

Phase 1 (scaffold) is done: the starter renamed, the dartboard mark, port 8024, both
workflows, the theme-pack consumer entry. The app is still the starter's "named numbers"
placeholder until phase 2 replaces the middle. Phases, in order: 2a engine (pure, tested),
2b views + demo, 3a Firebase create/join/read, 3b roles, 4 live scorer + handicaps,
5 tournaments, 6 invites + QR, 7 polish. The README tracks what is live.

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
