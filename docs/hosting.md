# Free hosting: Mochi Island

Status: **Firestore rules, indexes, and Hosting deployed on 2026-11-19.**
The optional notification Worker is not deployed. Android and iPhone sign-in
smoke checks are still pending. This document remains the plan for future
deployments.
Cost: **$0, no card.** Everything below fits on free plans.

| Piece | Free service | Already configured in |
|---|---|---|
| Web app (PWA) | Firebase Hosting (Spark) → https://mochi-island-mk.web.app | `firebase.json`, `.firebaserc` |
| Sign-in | Firebase Auth, email + password | `src/core/firebaseConfig.ts` |
| Data | Firestore, `asia-southeast1` | `firestore.rules`, `firestore.indexes.json` |
| Push (optional) | Cloudflare Worker `mochi-island-notify` (free) | `worker/wrangler.toml` |

Never turn on Blaze, Cloud Storage or Cloud Functions. If a console screen asks for a card, stop: that feature isn't free.

## One-time setup (owner does these)

1. **Firebase project** `mochi-island-mk` exists on the Spark plan.
   - Firestore database created in `asia-southeast1`.
   - Authentication → Sign-in method → **Email/Password** enabled.
   - Create the two accounts (owner and her). Put both UIDs in the Firestore doc
     `config/members` as `{ uids: ["<owner uid>", "<her uid>"] }`.
2. **Log in to the CLIs** (in Claude Code, type these with a leading `!`):
   - `firebase login`
   - `npx --prefix worker wrangler login`
3. **Install dependencies:** `npm install` and `npm --prefix worker install`.
   (Both installs done on 2026-11-13.)

## Deploy (each step needs the owner's "yes")

The full checklist is in the `deploy-mochi` skill (`.claude/skills/deploy-mochi/SKILL.md`). In short:

1. Run the checks: `npm run typecheck`, `npm test`, `npm run test:hooks`, `npm --prefix test-rules test`, `npm --prefix worker test`.
2. Build: `npm run build` → `dist/`.
3. Rules: `firebase deploy --only firestore --project mochi-island-mk`
4. App: `firebase deploy --only hosting --project mochi-island-mk`
5. Push Worker (optional, the app works without push):
   - `npx --prefix worker wrangler secret put FCM_SERVICE_ACCOUNT`, then paste the Firebase service-account JSON.
     It lives only as a Worker secret, never in a file or git.
   - `npx --prefix worker wrangler deploy` prints the URL `https://mochi-island-notify.<account>.workers.dev`.
   - Firebase console → Project settings → Cloud Messaging → Web Push certificates → **Generate key pair**.
     Put the public key in `.env.production.local` as `VITE_FCM_VAPID_KEY=...`. Without it the app never offers push.
   - Put the Worker URL in `.env.production.local` as `VITE_NOTIFY_URL=...`, then rebuild and redeploy hosting.
   - Push end-to-end check (plan Task 13, step 5): sign in as the owner on Android Chrome and as her on a second
     installed copy, then send a star each way. Both phones should show Mochi's notification, and refusing
     permission must leave the app usable.
     If the URL is not on the default `web.app` / `firebaseapp.com` domains, add the site's origin to `ALLOWED_ORIGINS` in `worker/wrangler.toml`.
6. Smoke check: open the site on Android Chrome, sign in, open the island. Then on iPhone Safari use Share → Add to Home Screen.

## Free-tier limits to keep in mind

- Firestore: 50k reads / 20k writes per day, 1 GiB stored. Keep listeners narrow. Photos < 900000 bytes, never in listened docs.
- Hosting: 10 GB stored, 360 MB/day transfer.
- Worker: 100k requests/day, 10 ms CPU per request.

Before committing anything that touches these, use the `free-tier-check` skill.
