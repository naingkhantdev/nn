# Mochi Island Phase 1 Implementation Plan (React)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, cute two-person island web app that both people install to their Home Screen (owner on Android Chrome, her on iPhone Safari), at $0 and with no payment card.

**Architecture:** One Vite + React + TypeScript PWA talks directly to Cloud Firestore, and security rules enforce the two-person allowlist and all important behaviour. A small Cloudflare Worker sends fixed-text FCM notifications, because Cloud Functions needs a card. Browser differences (shake, push, install state) sit behind small modules in `src/platform/`.

**Tech Stack:** Vite, React 19, TypeScript, React Router, Firebase JS SDK (Auth, Firestore, Messaging), `vite-plugin-pwa`, `@fontsource` fonts, Firebase Hosting, Cloudflare Workers (TypeScript, `jose`), Vitest, React Testing Library, `@firebase/rules-unit-testing`, Playwright WebKit.

**Spec:** `docs/superpowers/specs/2026-11-06-mochi-island-design.md` (read the "Stack change" section first).

**Supersedes:** the Flutter plan, kept for reference in `docs/superpowers/plans/2026-11-06-mochi-island-phase-1-flutter.md`. Behaviour, data model, and review focus are unchanged.

## Global Constraints

- $0 running cost and no payment card on any account. Never use Cloud Storage for Firebase, Cloud Functions, or any Blaze feature.
- Exactly two users. No sign-up screen. Firestore rules refuse everyone else.
- No activity signals: no location, online or last-seen status, read-tracking, or anything showing she "has not replied". Mochi never dies or gets sick, and there is no "misses you" state.
- She can leave at any time and delete her data from inside the app.
- All art, names, and styling are original. No Barbie or other brand references.
- All app text lives in `src/copy/copy.ts`. The one exception is the Worker's fixed notification text in `worker/src/copy.ts`. The owner reviews all Burmese before she sees it.
- Bundle a Burmese Unicode font. Never use Zawgyi.
- Day resets use Myanmar time (UTC+6:30).
- A Firestore document holding a photo stays under 1 MiB. Target about 300 KB per photo. No video and no voice in Phase 1.
- Tap always works in place of shake. The app is fully usable with no push.
- Sulks fade after 24 hours. Feelings fade after 8 hours. A sulk start sends one notification and no reminders. Setting a feeling sends none.
- Deploys, and anything sent to her, need the owner's confirmation.
- Secrets never enter git. The FCM service account key exists only as a Worker secret. The Firebase web config is public by design and may be committed.
- Follow `CLAUDE.md`: no Claude attribution or `Co-Authored-By` trailers in commits.

## Review Focus

1. **Link opened inside Messenger, Viber, or another in-app browser.** Show a friendly "open this in Safari" guide with a copy-link button. Test in Task 7.
2. **Weak or lost connection.** Show cached content and a calm Mochi message. Sends report failure and allow retry with the text kept. Nothing hangs on a spinner. Test in Task 10.
3. **Phone clock wrong, or opening a star around Myanmar midnight.** The server decides the day. A refused rule shows "come back tomorrow", not an error. Test in Task 11.
4. **Long Burmese text and emoji.** Star text up to 1000 characters and reasons up to 200 fit, scroll, and render. Over-limit text gets a friendly message before sending. Test in Task 10.
5. **Huge or undecodable photos** such as 12 MP or HEIC. Show progress, keep the UI responsive, fail kindly, keep the text. Test in Task 10.

---

## File Structure

```
CLAUDE.md
.claude/settings.json                 permissions and hooks
.claude/skills/{add-island-place,mochi-style,deploy-mochi,free-tier-check}/SKILL.md
index.html                            loader (inline SVG Mochi), meta tags
vite.config.ts                        React, PWA plugin, Vitest config
public/icons/*, public/firebase-messaging-sw.js
firebase.json, firestore.rules, firestore.indexes.json, .firebaserc
src/main.tsx, src/App.tsx             startup, router, auth gate
src/copy/copy.ts                      ALL app text
src/core/time.ts                      Myanmar day and fade calculations
src/core/firebase.ts                  app, auth, db instances (emulator in dev when VITE_USE_EMULATOR)
src/core/members.ts                   useMembers, useOtherUid, useFeatures
src/core/clock.ts                     ClockContext (now()) for testable time
src/core/theme.css                    colour tokens, type, motion
src/core/notifyClient.ts
src/platform/{shake,push,install}.ts
src/features/auth/                    login, choose-phrase, authRepository
src/features/install/                 install guide
src/features/island/                  island screen, SVG scene, weather, places
src/features/mochi/                   Mochi SVG, house, local mood
src/features/stars/                   write, open, keepsakes, photo compression
src/features/feelings/                feeling picker, bubble, treats
src/features/sulk/                    logic, repository, screens, game
src/features/settings/                settings, about, check-up, delete
src/test/setup.ts                     RTL + jsdom setup
test-rules/                           Firestore rules tests (Vitest + emulator)
worker/                               Cloudflare Worker
e2e/                                  Playwright WebKit smoke test
tools/hooks/                          Node hook scripts and tests
```

Unit and component tests sit next to their source as `*.test.ts(x)`. Repository tests that touch Firestore run against the emulator in `test-rules/` style, under `src/**/*.emu.test.ts`, via `npm run test:emu`.

## Firestore Data Model

Unchanged from the Flutter plan:

| Path | Fields | Access |
|---|---|---|
| `config/members` | `uids: [a, b]` | read by members. Console-only write. |
| `config/features` | `sulk: bool` | read by members. Console-only write. |
| `profiles/{uid}` | `displayName`, `phraseChosen: bool` | read by members. Owner of doc writes and deletes. |
| `feelings/{uid}` | `feeling`, `setAt` (= request.time). Expiry `setAt + 8h`, calculated. | read by members. Owner of doc writes and deletes. |
| `treats/{id}` | `fromUid`, `toUid`, `kind` | sender creates. Only recipient reads and deletes. |
| `stars/{id}` | `fromUid`, `toUid`, `text`, `hasPhoto`, `createdAt` | writer and recipient read. Writer creates. Either deletes. No update. |
| `starPhotos/{starId}` | `fromUid`, `toUid`, `data: bytes` (max 900000) | same as its star. |
| `openedStars/{uid}/items/{starId}` | `openedAt` | only `uid`. |
| `openedStars/{uid}/days/{dayNumber}` | `starId` | only `uid`. Create-only. One per Myanmar day. |
| `sulks/{id}` | `sulkerUid`, `level`, `reason`, `startedAt`, `endedAt`. Expiry `startedAt + 24h`, calculated. | read by members. See Task 15. |
| `sulks/{id}/comforts/{cid}` | `fromUid`, `kind`, `text`, `at` | read by members. Non-sulker creates while active. |
| `sulkPointers/{uid}` | `activeSulkId`, `startedAt` | read by members. Owner of doc writes. |
| `devices/{uid}` | `token` | owner of doc only. The Worker reads through its service account. |

Mochi's mood is stored in `localStorage` only, so it cannot reveal activity.

---

### Task 1: Project scaffold

**Files:** Vite project in `D:\mochi-island`, `.gitignore`, `vite.config.ts`, `src/test/setup.ts`, `src/App.test.tsx`

- [ ] **Step 1:** `npm create vite@latest . -- --template react-ts`, then `npm install`.
- [ ] **Step 2:** Add packages: `firebase react-router @fontsource/noto-sans-myanmar @fontsource/baloo-2`; dev: `vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-plugin-pwa prettier`. Add `.gitignore` entries: `*service-account*.json`, `.dev.vars`, `.wrangler/`, `.env*.local`, `*-debug.log`, `test-results/`, `playwright-report/`.
- [ ] **Step 3:** Scripts: `dev`, `build` (`tsc -b && vite build`), `test` (`vitest run`), `typecheck`, `lint`, `format`.
- [ ] **Step 4:** Write `src/App.test.tsx` asserting the app renders an element with `data-testid="app-root"`. Run `npm test`. Expected: FAIL, then implement minimal `App`, then PASS.
- [ ] **Step 5:** `npm run build`. Expected: succeeds.
- [ ] **Step 6:** Commit `chore: scaffold React project`, including the spec and this plan.

### Task 2: Agentic setup

As the Flutter plan's Task 2, with these differences: `format.mjs` runs Prettier on edited `.ts/.tsx/.css` files; `check.mjs` (Stop hook) runs `npm run typecheck` and `npm test` when `src/` changed; `check-rules.mjs` unchanged; `.mcp.json` has only the Firebase MCP server. `CLAUDE.md` keeps the no-attribution rule at the top. Skills: `mochi-style`, `add-island-place`, `free-tier-check`, `deploy-mochi` (test, build, then deploy rules, Hosting, Worker, each with owner confirmation). Commit `chore: add agent setup, hooks, and skills`.

### Task 3: Firebase project and membership rules

- [ ] **Step 1: Owner action.** `firebase login`. Create project `mochi-island` (or with suffix) on Spark, no card. Firestore in `asia-southeast1`. Enable Email/Password sign-in. Register a Web app and copy its config into `src/core/firebase.ts`.
- [ ] **Steps 2-5:** Same rules tests and helpers as the Flutter plan (`isMember()`, `isSelf(uid)`, `myanmarDay()`), run with `firebase emulators:exec --only firestore --project demo-mochi "vitest run"` from `test-rules/`. FAIL, implement, PASS.
- [ ] **Step 6: Owner action, then deploy.** Create the two `<username>@mochi-island.invalid` accounts, `config/members`, `config/features { sulk: false }`. After confirmation, `firebase deploy --only firestore`.
- [ ] **Step 7:** Commit `feat: add Firebase project and membership rules`.

### Task 4: Notification Worker and CPU check

Identical to the Flutter plan's Task 4. CORS allows only the Hosting origins (`https://<project>.web.app`, `https://<project>.firebaseapp.com`) and `http://localhost:5173` in dev.

### Task 5: Visual foundation, Mochi, and loader

**Produces:** `myanmarDayNumber(utcMillis: number): number`; `type MochiExpression = 'idle' | 'happy' | 'sleepy' | 'hungry' | 'tired' | 'bored' | 'homesick' | 'sulking' | 'dancing'`; `<Mochi expression size />` as inline SVG with CSS blink and bounce; `copy` object; `ClockContext`; `useMembers`, `useOtherUid`, `useFeatures`.

- [ ] **Step 1:** Failing tests: 23:59 and 00:00 Myanmar time are different days (`Date.UTC(2026, 10, 6, 17, 29)` vs `17, 30`); every expression renders.
- [ ] **Steps 2-4:** FAIL, implement, PASS. Original soft palette as CSS custom properties. Animate only `transform` and `opacity`, no filters or big shadows. Respect `prefers-reduced-motion`.
- [ ] **Step 5:** `index.html` shows an inline CSS and SVG Mochi waking up while JS loads. `vite-plugin-pwa` manifest: `display: standalone`, name Mochi Island, theme colours, original icons. Add `apple-mobile-web-app-capable`, `apple-touch-icon`, viewport `viewport-fit=cover`.
- [ ] **Step 6: Risk check.** `e2e/smoke.spec.ts` with Playwright WebKit, iPhone 13 preset, against `vite preview`: the app root appears within 15 s, no page errors, screenshot with Burmese test text. Check the screenshot by eye.
- [ ] **Step 7:** Commit `feat: add theme, Mochi, and loader`.

### Tasks 6 to 17

Same behaviour, tests, and commits as the Flutter plan's Tasks 6 to 17, translated as follows:

| Flutter plan | React plan |
|---|---|
| widget tests | React Testing Library tests with mocked repositories |
| `fake_cloud_firestore` | Firestore emulator (`*.emu.test.ts`) |
| `shared_preferences` | `localStorage`, wrapped in try/catch |
| `CustomPainter` | inline SVG + CSS animation |
| `compute` for photos | `createImageBitmap` + `OffscreenCanvas` in a Web Worker when available, else canvas on main thread with yields; `canvas.toBlob('image/jpeg', q)` |
| `sensors_plus` / `_io` files | removed; web only |
| `AnimationController` | one `requestAnimationFrame` loop or CSS keyframes, paused on `visibilitychange` |
| `clockProvider` | `ClockContext` |
| APK steps | installed Android Chrome PWA |

Notes for specific tasks:
- **Task 6:** `usernameToEmail` in `authRepository.ts`. Routes: signed out goes to `/login`, `phraseChosen !== true` goes to `/choose-phrase`, otherwise `/`.
- **Task 7:** `adviceFor({ userAgent, standalone })` reads `navigator.standalone` and `matchMedia('(display-mode: standalone)')`. Copy-link uses `navigator.clipboard` with a select-text fallback.
- **Task 10:** HEIC that the browser cannot decode throws `PhotoFailed`. Store photo bytes as Firestore `Bytes`.
- **Task 13:** Only the web path. `getToken` with the VAPID key and the registered `firebase-messaging-sw.js`. End-to-end: two installed PWAs (Android Chrome for owner, and a second browser profile or device as her).
- **Task 17:** batched deletes of at most 500 against the emulator.

### Task 18: Release and handover

As the Flutter plan's Task 18, except the release step is `npm run build` then `firebase deploy --only hosting,firestore`, plus the Worker. The owner installs the site to their Android Home Screen from Chrome. `docs/handover.md` in Burmese as before.
