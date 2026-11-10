# CLAUDE.md

## Git

- Never add Claude as a contributor or co-author. Do not add `Co-Authored-By: Claude ...` trailers to commit messages.
- Do not add "Generated with Claude Code" or any other Claude/Anthropic attribution to commit messages, pull request descriptions, or code.
- Commits are authored solely by the repository owner (naingkhantdev).

## What this is

Mochi Island: a private, cute island web app for exactly two people (the owner and her). Installed to the Home Screen as a PWA: Android Chrome for the owner, iPhone Safari for her. Design: `docs/superpowers/specs/2026-11-06-mochi-island-design.md`. Plan: `docs/superpowers/plans/2026-11-10-mochi-island-phase-1-react.md` (data model is there).

## Anti-goals (the app has failed if any is true)

- **It pressures her.** Nothing shows she "has not replied"; no guilt mechanics; Mochi never dies or gets sick; no "misses you" state.
- **It watches her.** No location, online/last-seen status, read-tracking shown to the owner, or hidden analytics.
- **She has no way out.** She can leave and delete her data from inside the app.
- **It looks like someone else's product.** All art, names, styling original. No Barbie or brand references.

## Stack and free-tier limits ($0, no card, ever)

- Vite + React + TypeScript PWA, React Router, Firebase JS SDK (Auth, Firestore, Messaging), Firebase Hosting.
- Firebase project `mochi-island-mk`, Spark plan, Firestore in `asia-southeast1`.
- Never use Cloud Storage, Cloud Functions, or any Blaze feature. Photos go in Firestore docs (< 900000 bytes, target ~300 KB), never in listened docs.
- Spark: 50k reads / 20k writes per day, 1 GiB stored. Keep listeners narrow.
- Push is sent by a Cloudflare Worker (free: 10 ms CPU, 100k req/day). FCM key lives only as a Worker secret.

## Commands

- `npm run dev` / `npm run build` / `npm test` / `npm run typecheck`
- `npm run test:hooks` (hook scripts), `npm --prefix test-rules test` (rules, emulator), `npm --prefix worker test`
- Deploys (`firebase deploy`, `wrangler deploy`, `wrangler secret`) and `git push` always need the owner's confirmation.

## Layout

- `src/copy/copy.ts`: ALL app text. Worker text in `worker/src/copy.ts`.
- `src/core/`: firebase, time (Myanmar day, UTC+6:30), clock, members, theme.
- `src/platform/`: shake, push, install detection.
- `src/features/<area>/`: auth, install, island, mochi, stars, feelings, sulk, settings. Tests sit beside source as `*.test.ts(x)`.
- `test-rules/`, `worker/`, `e2e/`, `tools/hooks/`.

## Rules of the house

- Burmese text: Unicode only, never Zawgyi. The owner reviews all Burmese before she sees it.
- Day resets at Myanmar midnight, decided by the server (`request.time`), never the phone clock.
- Tap always works instead of shake; the app is fully usable without push.
- Sulks fade after 24 h, feelings after 8 h; both are calculated, never stored. A sulk start sends one notification; setting a feeling sends none.
- Animate only `transform` and `opacity`; no blur filters. Respect `prefers-reduced-motion`.
- Wrap every `localStorage` access in try/catch.
