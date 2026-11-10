# Mochi Island Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, cute two-person island app that runs as an Android APK for the owner and an installed Home Screen web app for her, at $0 and with no payment card.

**Architecture:** One Flutter codebase (Dart, with Java for the Android host) talks directly to Cloud Firestore, and security rules enforce the two-person allowlist and all important behaviour. A small Cloudflare Worker sends fixed-text FCM notifications, because Cloud Functions needs a card. Platform differences (shake, push, install state) sit behind small interfaces with conditional imports.

**Tech Stack:** Flutter stable (web and Android), Riverpod, Firebase Auth, Cloud Firestore, Firebase Cloud Messaging, Firebase Hosting, Cloudflare Workers (TypeScript, `jose`), Vitest, `@firebase/rules-unit-testing`, Playwright WebKit, `fake_cloud_firestore`.

**Spec:** `docs/superpowers/specs/2026-11-06-mochi-island-design.md`

## Global Constraints

- $0 running cost and no payment card on any account. Never use Cloud Storage for Firebase, Cloud Functions, or any Blaze feature.
- Exactly two users. No sign-up screen. Firestore rules refuse everyone else.
- No activity signals: no location, online or last-seen status, read-tracking, or anything showing she "has not replied". Mochi never dies or gets sick, and there is no "misses you" state.
- She can leave at any time and delete her data from inside the app.
- All art, names, and styling are original. No Barbie or other brand references.
- All app text lives in `lib/copy/copy.dart`. The one exception is the Worker's fixed notification text in `worker/src/copy.ts`, because the Worker cannot import Dart. The owner reviews all Burmese before she sees it.
- Bundle a Burmese Unicode font. Never use Zawgyi.
- Day resets use Myanmar time (UTC+6:30).
- A Firestore document holding a photo stays under 1 MiB. Target about 300 KB per photo. No video and no voice in Phase 1.
- Tap always works in place of shake. The app is fully usable with no push.
- Sulks fade after 24 hours. Feelings fade after 8 hours. A sulk start sends one notification and no reminders. Setting a feeling sends none.
- Deploys, and anything sent to her, need the owner's confirmation.
- Secrets never enter git. The FCM service account key exists only as a Worker secret.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Link opened inside Messenger, Viber, or another in-app browser.** Add to Home Screen is not available there, so she should see a friendly "open this in Safari" guide with a copy-link button, not a broken install flow. Test in Task 7.
2. **Weak or lost connection.** Screens should show cached content and a calm Mochi message. Sends should report failure and allow retry with the text kept. Nothing hangs on a spinner. Test in Task 10.
3. **Phone clock wrong, or opening a star right around Myanmar midnight.** The server decides the day. If the rule refuses, she sees "come back tomorrow" and no error, and the client never relies on its own clock to grant a star. Test in Task 11.
4. **Long Burmese text and emoji.** Star text of up to 1000 characters and reasons of up to 200 must fit, scroll, and render correctly. Text at the limit is accepted, and text over the limit gets a friendly message before sending. Test in Task 10.
5. **Huge or undecodable photos** such as a 12 MP image or HEIC. Show progress, do not freeze the UI, and on failure say so kindly and keep the written text. Test in Task 10.

---

## File Structure

```
.claude/settings.json              permissions and hooks
.claude/skills/{add-island-place,mochi-style,deploy-mochi,free-tier-check}/SKILL.md
.mcp.json                          Dart and Firebase MCP servers
CLAUDE.md
android/                           Flutter host (Java)
web/index.html, manifest.json      loader, PWA metadata
web/firebase-messaging-sw.js       background push
assets/fonts/                      Noto Sans Myanmar, Baloo 2
firebase.json, firestore.rules, firestore.indexes.json
lib/main.dart, lib/app.dart        startup and auth gate
lib/copy/copy.dart                 ALL app text
lib/core/time.dart                 Myanmar day and fade calculations
lib/core/providers.dart            db, auth, clock, member providers
lib/core/members.dart              members and feature flags
lib/core/theme.dart                colours, type, motion
lib/platform/{shake,push,install}_*.dart   interface, web, and io versions
lib/features/auth/                 login, choose-phrase
lib/features/install/              install guide
lib/features/island/               island screen and painters
lib/features/mochi/                Mochi painter, house, local mood
lib/features/stars/                write, open, keepsakes, photo compression
lib/features/feelings/             feeling picker, bubble, treats
lib/features/sulk/                 logic, repository, screens, game
lib/features/settings/             settings, about, check-up, delete
test/                              mirrors lib/
test-rules/                        Node project: Firestore rules tests
worker/                            Cloudflare Worker
web-smoke/                         Playwright WebKit smoke test
tools/hooks/                       Node hook scripts and tests
```

## Firestore Data Model

All access requires membership unless stated.

| Path | Fields | Access |
|---|---|---|
| `config/members` | `uids: [a, b]` | read by members. Console-only write. |
| `config/features` | `sulk: bool` | read by members. Console-only write. |
| `profiles/{uid}` | `displayName`, `phraseChosen: bool` | read by members. Owner of doc writes and deletes. |
| `feelings/{uid}` | `feeling`, `setAt` (= request.time, server timestamp). Expiry is `setAt + 8h`, calculated and never stored. | read by members. Owner of doc writes and deletes. |
| `treats/{id}` | `fromUid`, `toUid`, `kind` | sender creates. Only recipient reads and deletes. |
| `stars/{id}` | `fromUid`, `toUid`, `text`, `hasPhoto`, `createdAt` | writer and recipient read. Writer creates. Either deletes. No update. |
| `starPhotos/{starId}` | `fromUid`, `toUid`, `data: bytes` (max 900000) | same as its star. |
| `openedStars/{uid}/items/{starId}` | `openedAt` | only `uid`. Never readable by the writer. |
| `openedStars/{uid}/days/{dayNumber}` | `starId` | only `uid`. Create-only. One per Myanmar day. |
| `sulks/{id}` | `sulkerUid`, `level`, `reason`, `startedAt` (server timestamp), `endedAt`. Expiry is `startedAt + 24h`, calculated and never stored, because a client cannot write a server time plus an offset. | read by members. See Task 15. |
| `sulks/{id}/comforts/{cid}` | `fromUid`, `kind`, `text`, `at` | read by members. Non-sulker creates while active. |
| `sulkPointers/{uid}` | `activeSulkId`, `startedAt` (server timestamp) | read by members. Owner of doc writes. |
| `devices/{uid}` | `token` | owner of doc only. The Worker reads through its service account. |

Mochi's mood is stored locally only, so it cannot reveal activity.

---

### Task 1: Project scaffold and environment

**Files:**
- Create: Flutter project in `D:\World`, `.gitignore`, `assets/fonts/*`
- Modify: `pubspec.yaml`
- Test: `test/smoke_test.dart`

**Interfaces:**
- Produces: package `mochi_island`, an initial git repository on branch `main`.

Current state: Flutter 3.22.2 with Dart 3.4.3, Android SDK present with a toolchain warning, `git`, `node 22`, `firebase 15.32` installed.

- [ ] **Step 1: Owner confirmation, then update Flutter.** Flutter 3.22.2 is old and current Firebase packages will likely not resolve. It is a machine-wide install, so confirm with the owner, then run `flutter upgrade` and `flutter doctor --android-licenses`.

Expected: `flutter doctor` shows `[√]` for Flutter and Android toolchain. The Visual Studio warning does not matter.

- [ ] **Step 2: Create the repository and project.**

```bash
git init -b main
flutter create . --project-name mochi_island --org app.mochiisland --platforms android,web --android-language java
```

Add to `.gitignore`: `*service-account*.json`, `.dev.vars`, `.wrangler/`, `node_modules/`, `.env*`, `*.jks`, `key.properties`.

- [ ] **Step 3: Add packages and fonts.** `flutter pub add flutter_riverpod firebase_core firebase_auth cloud_firestore firebase_messaging image_picker image sensors_plus shared_preferences web http` and `flutter pub add --dev fake_cloud_firestore firebase_auth_mocks`. Download Noto Sans Myanmar and Baloo 2 (both OFL) into `assets/fonts/` with their licence files and declare them in `pubspec.yaml`.

- [ ] **Step 4: Write `test/smoke_test.dart`** asserting that the app widget renders a known key. Run `flutter test`.

Expected: PASS.

- [ ] **Step 5: Verify both targets build.** Run `flutter build web --release` and `flutter build apk --debug`.

Expected: both succeed.

- [ ] **Step 6: Commit** with `chore: scaffold Flutter project`, including the spec and this plan.

---

### Task 2: Agentic setup

**Files:**
- Create: `CLAUDE.md`, `.claude/settings.json`, `.mcp.json`, `.claude/skills/*/SKILL.md`, `tools/hooks/{format-dart,block-secrets,check-dart,check-rules}.mjs`
- Test: `tools/hooks/hooks.test.mjs`

**Interfaces:**
- Produces: hook scripts read Claude Code hook JSON from stdin, and exit `2` with the reason on stderr to block or report.

Use the `update-config` skill for the hook and permission JSON format, and `anthropic-skills:skill-creator` for skill format. Use Node scripts, not shell scripts, so hooks run reliably on Windows.

- [ ] **Step 1: Write failing tests** with `node:test`, running each script with piped JSON:

```js
test('blocks a write to a service account file', () => {
  assert.equal(run('block-secrets.mjs', {tool_input: {file_path: 'x-service-account.json', content: '{}'}}).status, 2);
});
test('blocks content containing a private key', () => {
  assert.equal(run('block-secrets.mjs', {tool_input: {file_path: 'a.ts', content: '-----BEGIN PRIVATE KEY-----'}}).status, 2);
});
test('blocks git add of a secret file', () => {
  assert.equal(run('block-secrets.mjs', {tool_input: {command: 'git add foo-service-account.json'}}).status, 2);
});
test('allows a normal Dart write', () => {
  assert.equal(run('block-secrets.mjs', {tool_input: {file_path: 'lib/a.dart', content: 'x'}}).status, 0);
});
test('check-dart allows stopping when stop_hook_active is true', () => {
  assert.equal(run('check-dart.mjs', {stop_hook_active: true}).status, 0);
});
```

- [ ] **Step 2: Run `node --test tools/hooks/`.** Expected: FAIL because the scripts do not exist.

- [ ] **Step 3: Implement the scripts.**
  - `format-dart.mjs` runs `dart format` on an edited `.dart` file.
  - `block-secrets.mjs` applies the tested patterns to file paths, written content, and Bash commands.
  - `check-dart.mjs` uses `git status --porcelain`. If Dart files changed, it runs `flutter analyze`, and `flutter test` when `lib/` or `test/` changed. It exits 2 with the output on failure, and exits 0 when `stop_hook_active` is true.
  - `check-rules.mjs` runs `npm --prefix test-rules test` when `firestore.rules` or `test-rules/` changed, and exits 0 when `test-rules/` does not exist yet.

- [ ] **Step 4: Run `node --test tools/hooks/`.** Expected: PASS.

- [ ] **Step 5: Wire the settings.** In `.claude/settings.json`:
  - `PreToolUse` on `Edit|Write|Bash` runs `block-secrets`.
  - `PostToolUse` on `Edit|Write` runs `format-dart` and `check-rules`.
  - `Stop` runs `check-dart`, with a 300-second timeout.
  - Allow: read-only `flutter`, `dart`, `git status`, `git diff`, `git log`, and test commands.
  - Ask: `firebase deploy`, `wrangler deploy`, `wrangler secret`, `git push`.

- [ ] **Step 6: Add MCP servers to `.mcp.json`** using `dart mcp-server` and `npx -y firebase-tools@latest mcp`. Check that each starts on this machine. Drop any that does not work and record that in `CLAUDE.md`.

- [ ] **Step 7: Write `CLAUDE.md`** under 80 lines: purpose, anti-goals verbatim from the spec, stack and free-tier limits, commands, folder layout, the data model pointer, and a Burmese copy-review rule.

- [ ] **Step 8: Write the four skills.**
  - `mochi-style`: colours, motion, Mochi's voice, anti-goals. Fill in the final colours after Task 5.
  - `add-island-place`: the checklist for a new place: `IslandPlace` entry, screen, copy, rules and tests, deletion coverage, and `free-tier-check`.
  - `free-tier-check`: reviews a change for narrow listeners, media kept out of listened documents, and no Blaze feature.
  - `deploy-mochi`: test, then build APK, then deploy rules, Hosting, and Worker, each with owner confirmation.

- [ ] **Step 9: Commit** with `chore: add agent setup, hooks, and skills`.

---

### Task 3: Firebase project and membership rules

**Files:**
- Create: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `lib/firebase_options.dart`, `test-rules/package.json`, `test-rules/helpers.ts`, `test-rules/members.test.ts`

**Interfaces:**
- Produces: rules functions `isMember()`, `isSelf(uid)`, `myanmarDay()`. Test helpers `asOwner()`, `asHer()`, `asStranger()`, seeded with `config/members.uids = ['owner', 'her']`.

- [ ] **Step 1: Owner action.** Run `firebase login`. Create Firebase project `mochi-island`, or `mochi-island-<short suffix>` if taken, on the Spark plan with no card. Create Firestore in `asia-southeast1`, which cannot be changed later. Enable the Email/Password sign-in method. Run `dart pub global activate flutterfire_cli` and `flutterfire configure --platforms=android,web`.

- [ ] **Step 2: Write failing rules tests** in `test-rules/members.test.ts`, run by `firebase emulators:exec --only firestore --project demo-mochi "vitest run"`:

```ts
it('stranger cannot read any collection', () => assertFails(getDoc(doc(asStranger(), 'profiles/owner'))));
it('signed-out user cannot read', () => assertFails(getDoc(doc(signedOut(), 'config/members'))));
it('member reads config', () => assertSucceeds(getDoc(doc(asHer(), 'config/members'))));
it('member cannot write config', () => assertFails(setDoc(doc(asOwner(), 'config/members'), {uids: ['owner']})));
it('member cannot add unknown collection', () => assertFails(setDoc(doc(asOwner(), 'other/x'), {a: 1})));
it('profile writable only by its owner', async () => {
  await assertSucceeds(setDoc(doc(asHer(), 'profiles/her'), {displayName: 'A', phraseChosen: true}));
  await assertFails(setDoc(doc(asOwner(), 'profiles/her'), {displayName: 'B', phraseChosen: true}));
});
```

- [ ] **Step 3: Run `npm --prefix test-rules test`.** Expected: FAIL.

- [ ] **Step 4: Implement rules.** Default deny, plus these helpers, which later tasks reuse. The day calculation must match `myanmarDayNumber` in Dart:

```
function isMember() { return request.auth != null &&
  request.auth.uid in get(/databases/$(database)/documents/config/members).data.uids; }
function isSelf(uid) { return isMember() && request.auth.uid == uid; }
function myanmarDay() { return math.floor((request.time.toMillis() + 23400000) / 86400000); }
```

- [ ] **Step 5: Run the tests.** Expected: PASS.

- [ ] **Step 6: Owner action, then deploy.** Create two accounts in the Firebase console: `<username>@mochi-island.invalid` with a temporary phrase of at least 6 characters. If the console refuses that domain, use `@mochi-island.example` and use the same domain in Task 6. Create `config/members` with both UIDs and `config/features` with `sulk: false`. After confirmation run `firebase deploy --only firestore`.

- [ ] **Step 7: Commit** with `feat: add Firebase project and membership rules`.

---

### Task 4: Notification Worker and CPU check

**Files:**
- Create: `worker/wrangler.toml`, `worker/package.json`, `worker/src/{index,notify,google,copy}.ts`, `worker/test/notify.test.ts`

**Interfaces:**
- Produces: `POST /notify`, with header `Authorization: Bearer <Firebase ID token>` and body `{"type": NotifyType}`. Types are `star_new | treat_sent | sulk_started | sulk_comforted | sulk_forgiven`. Returns `204`, or `204` with no send if the other person has no token. `401` for bad tokens, `403` for non-members, `400` for unknown types, `429` when rate-limited.
- `handleNotify(req: Request, deps: Deps): Promise<Response>`, where `Deps = { verifyIdToken, getMemberUids, getDeviceToken, sendFcm, rateLimit }`.

- [ ] **Step 1: Write failing tests** with fake deps: bad token gives 401; non-member gives 403; unknown type gives 400; the send always targets the other member's token; the body text comes only from `copy.ts`, so client-supplied `title` or `body` fields are ignored; no token gives 204 without a send; an FCM `UNREGISTERED` response gives 204; the 31st call in an hour gives 429.

- [ ] **Step 2: Run `npm --prefix worker test`.** Expected: FAIL.

- [ ] **Step 3: Implement.** Verify ID tokens with `jose` against Google's public JWKS, checking `aud` and `iss`. Sign the service-account JWT with Web Crypto RS256. Cache the Google access token in a module global and in Workers KV until 5 minutes before expiry, to minimise signing. Read members and device tokens through the Firestore REST API. Allow CORS only for the Hosting origins. Rate limit in memory, at 30 per user per hour. Notification text is in `copy.ts`, written as Mochi speaking.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Owner action.** Create a free Cloudflare account with no card, and download a Firebase service account key outside the repository. Then, after confirmation, `npx wrangler secret put FCM_SERVICE_ACCOUNT` and `npx wrangler deploy`, and delete the local key.

- [ ] **Step 6: Risk check: CPU limit.** Using a real ID token, send 20 requests with a cold cache for at least the first, while watching `npx wrangler tail`.

Expected: no `1102` errors and no `exceededCpu` outcomes. **If it fails, stop and return to the owner with options.** Do not move to a paid plan. The app works without push.

- [ ] **Step 7: Commit** with `feat: add notification worker`.

---

### Task 5: Visual foundation, Mochi, and web loader

**Files:**
- Create: `lib/copy/copy.dart`, `lib/core/{theme,time,providers,members}.dart`, `lib/features/mochi/mochi_painter.dart`, `web-smoke/{package.json,smoke.spec.ts}`
- Modify: `web/index.html`, `web/manifest.json`, `web/icons/*`
- Test: `test/core/time_test.dart`, `test/features/mochi/mochi_painter_test.dart`

**Interfaces:**
- Produces:
  - `int myanmarDayNumber(DateTime utc)`
  - `enum MochiExpression { idle, happy, sleepy, hungry, tired, bored, homesick, sulking, dancing }`
  - `class MochiView extends StatelessWidget { MochiView({required MochiExpression expression, double size = 160}); }`
  - `class Copy` with static members for all text
  - Providers: `firestoreProvider`, `authProvider`, `clockProvider` (`DateTime Function()`), `memberUidsProvider`, `otherUidProvider`, `featuresProvider` (exposes `sulkEnabled`)

- [ ] **Step 1: Write failing tests.**

```dart
test('23:59 Myanmar and 00:00 Myanmar are different days', () {
  expect(myanmarDayNumber(DateTime.utc(2026, 11, 6, 17, 29)) + 1,
      myanmarDayNumber(DateTime.utc(2026, 11, 6, 17, 30)));
});
```

Also add a test that every `MochiExpression` renders without error.

- [ ] **Step 2: Run `flutter test test/core test/features/mochi`.** Expected: FAIL.

- [ ] **Step 3: Implement the theme, time, providers, and Mochi.** Draw Mochi with `CustomPainter`, as a soft squishy shape with simple blinking and bouncing. Choose an original soft palette with its own identity, not a copy of the pink site. Keep painters light: no blur filters or large shadows. Update `mochi-style`.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Add the web shell.** `web/index.html` shows an inline CSS and SVG Mochi waking up immediately, and removes it on `flutter-first-frame`. `manifest.json` has `display: standalone`, the name Mochi Island, theme colours, and original icons. Add `apple-mobile-web-app-capable`, `apple-touch-icon`, and viewport tags.

- [ ] **Step 6: Risk check: Safari-like rendering.** `web-smoke/smoke.spec.ts` uses Playwright WebKit with the iPhone 13 device preset against a served `build/web`. It asserts that `flutter-view` appears within 30 seconds and there are no uncaught page errors, and it saves a screenshot containing Burmese test text.

Run: `flutter build web --release; npm --prefix web-smoke test`

Expected: PASS. Open the screenshot and confirm Burmese stacks correctly, with no boxes or broken vowels. This approximates an iPhone and does not replace one.

- [ ] **Step 7: Commit** with `feat: add theme, Mochi, and web loader`.

---

### Task 6: Login and choosing a phrase

**Files:**
- Create: `lib/app.dart`, `lib/features/auth/{auth_repository,login_screen,choose_phrase_screen}.dart`
- Test: `test/features/auth/*_test.dart`

**Interfaces:**
- Produces: `AuthRepository.signIn(username, phrase)`, `changePhrase(newPhrase)`, `reauthenticate(phrase)`, `signOut()`. `String usernameToEmail(String)` lowercases, trims, and appends `@mochi-island.invalid`. `AppGate` routes signed out to Login, `phraseChosen != true` to ChoosePhrase, and otherwise to Island.

- [ ] **Step 1: Write failing tests:** `usernameToEmail(' Agnes ')`-style input normalises to lowercase; wrong phrase shows the friendly `Copy.wrongPhrase` and stays on the screen; no network shows `Copy.offline`; a user with `phraseChosen: false` or no profile is routed to ChoosePhrase; a phrase shorter than 6 characters is refused; a successful change writes `phraseChosen: true` and routes to Island.

- [ ] **Step 2: Run `flutter test test/features/auth`.** Expected: FAIL.

- [ ] **Step 3: Implement.** The login card is cute, with Mochi and no sign-up link. ChoosePhrase explains kindly that this makes the phrase hers alone.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Commit** with `feat: add secret login and choose-phrase flow`.

---

### Task 7: Install guide and support check

**Files:**
- Create: `lib/platform/install_state.dart` (with `_web` and `_io` versions), `lib/features/install/install_guide_screen.dart`
- Modify: `lib/app.dart`
- Test: `test/platform/install_state_test.dart`, `test/features/install/install_guide_test.dart`

**Interfaces:**
- Produces: `enum InstallAdvice { installed, inAppBrowser, iosSafariAddToHome, otherBrowser }`; `InstallAdvice adviceFor({required String userAgent, required bool standalone})`; `IosVersion? parseIosVersion(String userAgent)`; `bool supportsWebPush(IosVersion?)`, which is true for 16.4 and above. `AppGate` shows the guide before login when advice is `inAppBrowser` or `iosSafariAddToHome`.

- [ ] **Step 1: Write failing tests** with real user-agent strings:

```dart
expect(adviceFor(userAgent: iphoneSafari, standalone: true), InstallAdvice.installed);
expect(adviceFor(userAgent: iphoneSafari, standalone: false), InstallAdvice.iosSafariAddToHome);
expect(adviceFor(userAgent: iphoneMessengerFBAN, standalone: false), InstallAdvice.inAppBrowser);
expect(adviceFor(userAgent: iphoneViber, standalone: false), InstallAdvice.inAppBrowser);
expect(adviceFor(userAgent: iphoneInstagram, standalone: false), InstallAdvice.inAppBrowser);
expect(parseIosVersion(iphone16_3), IosVersion(16, 3));
expect(supportsWebPush(IosVersion(16, 3)), isFalse);
expect(supportsWebPush(IosVersion(16, 4)), isTrue);
expect(supportsWebPush(null), isFalse);
```

Add widget tests: the in-app browser page has a copy-link button; below iOS 16.4 shows the kind notice and a continue option; `otherBrowser` proceeds to login.

- [ ] **Step 2: Run the tests.** Expected: FAIL.

- [ ] **Step 3: Implement.** Web reads `navigator.userAgent`, `navigator.standalone`, and `display-mode: standalone`. The guide has illustrated steps: Share, Add to Home Screen, open the icon.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Commit** with `feat: add install guide and iOS support check`.

---

### Task 8: Island home

**Files:**
- Create: `lib/features/island/{island_screen,island_painter,weather_layer,places}.dart`
- Test: `test/features/island/island_screen_test.dart`

**Interfaces:**
- Consumes: `MochiView`, `featuresProvider`.
- Produces:
  - `enum Weather { sunny, cloudy, rain, storm, rainbow }`
  - `class WeatherLayer extends StatelessWidget { WeatherLayer({required Weather weather}); }`
  - `enum IslandPlace { mochiHouse, starJar, feelings, sulkCloud, snailPost, lantern, garden, bottle }`
  - `bool isOpen(IslandPlace, Features)`
  - `IslandScreen` reads `currentWeatherProvider`. Task 8 defines it as always sunny, and Task 16 replaces its body.
  - `placeScreens`: a map in `places.dart` from `IslandPlace` to a screen builder. Open places without a real screen yet use a simple placeholder. Tasks 9, 11, 12, and 16 register their screens here, and Task 14 connects the Settings entry.

- [ ] **Step 1: Write failing tests:** Mochi's house and the jar navigate when tapped; `sulkCloud` opens only when `sulkEnabled` is true, otherwise it shows the "still being built" sheet; later places show "still being built"; each place has a semantics label and a tap target of at least 48 by 48; layout works at 320×568 and 430×932 without overflow; a Settings entry exists.

- [ ] **Step 2: Run `flutter test test/features/island`.** Expected: FAIL.

- [ ] **Step 3: Implement.** Paint the island and animate gentle waves, clouds, and blinking from one `AnimationController`. Stop animating when the app is hidden. Start light, per the spec's conservative animation rule.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Run `flutter build web --release; npm --prefix web-smoke test`.** Expected: PASS. Check the island screenshot.

- [ ] **Step 6: Commit** with `feat: add island home`.

---

### Task 9: Mochi's house

**Files:**
- Create: `lib/features/mochi/{mochi_mood,mochi_house_screen}.dart`
- Test: `test/features/mochi/mochi_mood_test.dart`

**Interfaces:**
- Produces: `MochiExpression moodFor({required DateTime myanmarNow, DateTime? lastPetted, DateTime? lastFed})`. A local store using `shared_preferences`, keys `lastPetted` and `lastFed`.

- [ ] **Step 1: Write failing tests:** late night gives `sleepy`; petted within 5 minutes gives `happy`, overriding sleepy; fed within 5 minutes gives `happy`; otherwise `idle`; a very long gap since petting never gives `sulking` or anything sad; the house screen makes no Firestore writes when petting, checked against a `FakeFirebaseFirestore`.

- [ ] **Step 2: Run `flutter test test/features/mochi`.** Expected: FAIL.

- [ ] **Step 3: Implement** `moodFor` as a pure function with sleepy from 23:00 to 06:00 Myanmar time. The screen has petting and feeding with squish animations.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Commit** with `feat: add Mochi's house`.

---

### Task 10: Writing stars

**Files:**
- Create: `lib/core/notify_client.dart`, `lib/features/stars/{star,star_repository,photo_compress,write_star_screen}.dart`, `test-rules/stars.test.ts`
- Modify: `firestore.rules`, `firestore.indexes.json`
- Test: `test/features/stars/*_test.dart`

**Interfaces:**
- Consumes: `otherUidProvider`.
- Produces:
  - `class Star { String id, fromUid, toUid, text; bool hasPhoto; DateTime? createdAt; }`
  - `StarRepository.send({required String text, Uint8List? photo}): Future<void>`
  - `Stream<List<Star>> written()`
  - `Future<Uint8List> compressPhoto(Uint8List input)`, which throws `PhotoFailed`
  - `const maxStarText = 1000`, `const maxPhotoBytes = 900000`
  - `enum NotifyType { starNew, treatSent, sulkStarted, sulkComforted, sulkForgiven }`, mapping to the Worker's type strings
  - `NotifyClient.send(NotifyType)` calls the Worker, ignoring all failures. `StarRepository.send` calls it with `starNew`.

- [ ] **Step 1: Write failing rules tests.** A writer creates a star to the other member; cannot forge `fromUid`; cannot send to a stranger; a 1001-character text fails and 1000 succeeds; Burmese text at the limit passes; the writer and recipient can read a star but a stranger cannot; nobody can update; a photo of 900001 bytes fails; a writer cannot read `openedStars/{recipient}/items/*` or `days/*`.

- [ ] **Step 2: Write failing Dart tests.** Compressing a 4000×3000 image gives under 400 KB and a longest side of at most 1280; undecodable bytes throw `PhotoFailed`; on `PhotoFailed` or a failed send the write screen keeps the typed text and shows `Copy.photoFailed` or `Copy.sendFailed` with retry; a long Burmese star scrolls without overflow; the character counter refuses over 1000 before sending; `send` writes the star and photo atomically in a batch; a notify failure does not fail the send.

- [ ] **Step 3: Run `npm --prefix test-rules test` and `flutter test test/features/stars`.** Expected: FAIL.

- [ ] **Step 4: Implement.** Compress with quality stepping from 80 down to 50 until under 400 KB, resizing the longest side to 1280 first. Show progress. Do the work off the main thread on Android using `compute`, and yield between steps on the web so the UI stays responsive. Store photos as Firestore `Blob`s.

- [ ] **Step 5: Run the tests.** Expected: PASS.

- [ ] **Step 6: Commit** with `feat: add star writing`.

---

### Task 11: Opening stars and keepsakes

**Files:**
- Create: `lib/platform/shake.dart` (with `_web` and `_io` versions), `lib/features/stars/{star_jar_screen,star_unfold,keepsakes_screen,jar_state}.dart`
- Modify: `firestore.rules`, `test-rules/stars.test.ts`, `lib/features/stars/star_repository.dart`
- Test: `test/features/stars/jar_state_test.dart`, `test/features/stars/star_jar_screen_test.dart`

**Interfaces:**
- Produces:
  - `abstract class ShakeDetector { Future<bool> requestPermission(); Stream<void> get shakes; }`
  - `sealed JarState = JarEmpty | JarReady(Star next) | JarDoneToday`
  - `StarRepository.openToday(Star): Future<OpenResult>`, where `OpenResult` is `opened` or `alreadyOpenedToday`
  - `JarState jarStateFor(List<Star> received, Set<String> opened, bool doneToday)`

- [ ] **Step 1: Write failing rules tests.** Recipient creates `items/{starId}` and `days/{myanmarDay()}` in a batch; a second star on the same Myanmar day fails; the next day succeeds; a `dayNumber` that differs from the server's day fails even if the client's clock says otherwise; writer cannot create an item for the recipient; `items` without its `days` doc fails. Use `myanmarDay()` via `existsAfter` to require the pair.

- [ ] **Step 2: Write failing Dart tests.** `jarStateFor` returns the oldest unopened star; empty when none; `JarDoneToday` when done; a refused open gives `alreadyOpenedToday` and shows `Copy.comeBackTomorrow`, not an error; tapping the jar opens a star with `requestPermission` never called; denying shake permission leaves tap working; the empty jar writes nothing and sends nothing; the writer's screen exposes no opened information.

- [ ] **Step 3: Run the tests.** Expected: FAIL.

- [ ] **Step 4: Implement.** Web uses `DeviceMotionEvent.requestPermission()` from a tap on a clear "shake mode" button, when that function exists. Shake threshold: acceleration above 15 m/s² twice within 800 ms. `_io` uses `sensors_plus`. `openToday` runs the batch and treats permission-denied as `alreadyOpenedToday`. The unfold animation fires on success. Keepsakes load photos only when opened.

- [ ] **Step 5: Run the tests.** Expected: PASS.

- [ ] **Step 6: Commit** with `feat: add star jar and keepsakes`.

---

### Task 12: How I Feel Now

**Files:**
- Create: `lib/features/feelings/{feeling,feeling_repository,feeling_picker,feeling_bubble,treats}.dart`, `test-rules/feelings.test.ts`
- Modify: `firestore.rules`, `lib/features/island/island_screen.dart`
- Test: `test/features/feelings/*_test.dart`

**Interfaces:**
- Produces:
  - `enum Feeling { sleepy, hungry, happy, tired, bored, missingHome }`
  - `const feelingFade = Duration(hours: 8)`
  - `Feeling? activeFeeling(FeelingDoc?, DateTime now)`
  - `FeelingRepository.set(Feeling)`, `clear()`
  - `TreatKind treatFor(Feeling)`: hungry gives `snack`, sleepy gives `blanket`, others give `hug`, `sweet`, or `sticker`
  - `MochiExpression expressionFor(Feeling)`

- [ ] **Step 1: Write failing rules tests.** Self writes own feeling; other member cannot; `setAt` must equal `request.time`; invalid feeling fails; sender creates a treat; only the recipient reads and deletes; the sender cannot read it after sending.

- [ ] **Step 2: Write failing Dart tests.** A feeling at 7h59m shows and at 8h does not; "nothing right now" deletes the doc; the bubble displays no time; setting a feeling calls no `NotifyClient`; sending a treat calls `NotifyClient.send(NotifyType.treatSent)`; no feeling history is written anywhere; the recipient sees a treat once and it is then deleted.

- [ ] **Step 3: Run the tests.** Expected: FAIL.

- [ ] **Step 4: Implement.** Listen only to `feelings/{otherUid}`, your own feeling doc, and treats addressed to you. Own Mochi expression follows own feeling. Connect the existing `IslandPlace.feelings` entry to the picker.

- [ ] **Step 5: Run the tests.** Expected: PASS.

- [ ] **Step 6: Commit** with `feat: add How I Feel Now`.

---

### Task 13: Push on Android and web

**Files:**
- Create: `lib/platform/push.dart` (with `_web` and `_io` versions), `web/firebase-messaging-sw.js`, `lib/features/settings/notification_prompt.dart`
- Modify: `android/app/src/main/AndroidManifest.xml`, `firestore.rules`, `test-rules/members.test.ts`, `lib/app.dart`
- Test: `test/platform/push_test.dart`

**Interfaces:**
- Consumes: `supportsWebPush`, Worker `/notify`.
- Produces: `abstract class PushService { Future<PushResult> enable(); Future<void> disable(); }`, with `PushResult` being `enabled`, `denied`, or `unsupported`. Stored at `devices/{uid}.token`.

- [ ] **Step 1: Write failing tests.** Rules: only the doc's owner can read or write `devices/{uid}`. Dart: Mochi's explanation appears first and no permission is requested until she taps; `denied` shows the remove-and-re-add note and the app continues; `unsupported` shows no prompt; disabling deletes the token doc; the prompt is not shown again automatically after a refusal.

- [ ] **Step 2: Run the tests.** Expected: FAIL.

- [ ] **Step 3: Implement.** **Owner action:** generate a Web Push VAPID key in the Firebase console. Add `POST_NOTIFICATIONS` for Android. Keep the token updated on refresh. Register the FCM service worker alongside Flutter's.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: End-to-end on Android.** Log in as the owner in the APK and as the second account in the installed Android Chrome web app. Send a star from each.

Expected: both devices show the Mochi-voiced notification. Declining permission still leaves the app usable.

- [ ] **Step 6: Commit** with `feat: add push notifications`.

---

### Task 14: Settings, About, and Mochi's Check-up

**Files:**
- Create: `lib/features/settings/{settings_screen,about_screen,checkup_screen,checkup}.dart`
- Test: `test/features/settings/*_test.dart`

**Interfaces:**
- Produces: `enum CheckStatus { ok, needsAttention, unsupported }`; `Future<Map<CheckItem, CheckStatus>> runCheckup(CheckupDeps)` with `CheckItem { notifications, motion, photos, fonts }`.

- [ ] **Step 1: Write failing tests.** The checkup reports each item independently and one throwing check does not stop the rest; it makes no Firestore writes and no network sends; About contains `Copy.privacyAdmin`, which says plainly that the owner can technically read stored data through the console; Settings has the notification toggle, change phrase, Check-up, About, sign out, and a delete entry.

- [ ] **Step 2: Run the tests.** Expected: FAIL.

- [ ] **Step 3: Implement.** Check fonts by measuring Burmese glyphs. Results stay on screen only.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Commit** with `feat: add settings, about, and check-up`.

---

### Task 15: Sulk logic and rules

**Files:**
- Create: `lib/features/sulk/{sulk,sulk_logic,sulk_repository}.dart`, `test-rules/sulks.test.ts`
- Modify: `firestore.rules`, `firestore.indexes.json`
- Test: `test/features/sulk/sulk_logic_test.dart`, `test/features/sulk/sulk_repository_test.dart`

**Interfaces:**
- Produces:
  - `enum SulkLevel { little, lot, dontTalk }`
  - `const sulkFade = Duration(hours: 24)`, `const maxReason = 200`
  - `class Sulk { String id, sulkerUid; SulkLevel level; String reason; DateTime startedAt; DateTime? endedAt; int comforts; DateTime get expiresAt; bool isActive(DateTime now); }`, where `expiresAt` is `startedAt + sulkFade` and a pending server timestamp counts as now
  - `Weather weatherFor(List<Sulk> sulks, DateTime now, {bool justForgiven = false})`
  - `SulkStats statsFor(List<Sulk> all, DateTime now)` with `int thisMonth`, `Duration longest`
  - `SulkRepository.start(level, reason)`, `forgive(id)`, `comfort(id, kind, text)`, `Stream<List<Sulk>> active()`

- [ ] **Step 1: Write failing rules tests.**
  - Create: only with own `sulkerUid`; `startedAt == request.time`; no `expiresAt` field; `endedAt == null`; valid level; reason at most 200; batched with own pointer.
  - One active: a second start fails while the pointer's `startedAt + 24h` is in the future and its sulk has not ended, and succeeds once 24 hours have passed or the sulk was forgiven. Forgiving deletes the pointer in the same batch. Both people can sulk at the same time.
  - Forgive: the sulker can update only `endedAt`, to `request.time`, and only while active, and the other person cannot. Nothing else can be changed.
  - Comfort: the non-sulker can add only while active. The sulker cannot comfort themselves.
  - Either member can delete sulks, comforts, and pointers.

- [ ] **Step 2: Write failing Dart tests.**

```dart
expect(weatherFor([sulk(level: SulkLevel.little)], now), Weather.cloudy);
expect(weatherFor([sulk(level: SulkLevel.lot)], now), Weather.rain);
expect(weatherFor([sulk(level: SulkLevel.dontTalk)], now), Weather.storm);
expect(weatherFor([sulk(level: SulkLevel.dontTalk, comforts: 4)], now), Weather.rain);
expect(weatherFor([sulk(level: SulkLevel.little, comforts: 99)], now), Weather.cloudy); // never sunny until forgiven
expect(weatherFor([sulk(startedAt: now.subtract(Duration(hours: 24)))], now), Weather.sunny); // faded
expect(weatherFor([sulk(level: SulkLevel.little), sulk(level: SulkLevel.dontTalk)], now), Weather.storm); // heavier wins
expect(statsFor([faded24h, forgiven2h], now).longest, Duration(hours: 24)); // counts up to fade
```

Add: `start` calls `NotifyClient.send(NotifyType.sulkStarted)` exactly once; no reminder path exists; a fade writes nothing and sends nothing.

- [ ] **Step 3: Run the tests.** Expected: FAIL.

- [ ] **Step 4: Implement.** Severity: `little` is 3, `lot` is 6, `dontTalk` is 10. Subtract one per comfort, with a floor of 1. Severity 1 to 3 gives `cloudy`, 4 to 6 gives `rain`, and 7 and above gives `storm`. Take the highest across active sulks. `justForgiven` with no active sulks gives `rainbow`.

- [ ] **Step 5: Run the tests.** Expected: PASS.

- [ ] **Step 6: Commit** with `feat: add sulk logic and rules`.

---

### Task 16: Sulk screens and comfort game

**Files:**
- Create: `lib/features/sulk/{start_sulk_sheet,sulk_screen,comfort_game,sulk_history_screen}.dart`
- Modify: `lib/features/island/{island_screen,weather_layer}.dart`
- Test: `test/features/sulk/sulk_screens_test.dart`

**Interfaces:**
- Consumes: Task 15's `SulkRepository`, `weatherFor`, `statsFor`; `featuresProvider`; `MochiView`.
- Produces: the real `currentWeatherProvider`, which replaces the always-sunny version.

- [ ] **Step 1: Write failing tests.** With `sulkEnabled` false the sulk place is closed; when true, three levels and an optional reason are offered; the sulker sees Forgive and not comfort controls; the other person sees comfort controls and no Forgive; popping all raindrops and hugging Mochi records one `game` comfort; forgiving shows the rainbow and dancing Mochi; history shows the shared month total and longest, with no per-person ranking; an expired sulk returns the island to sunny on the next tick, without a message.

- [ ] **Step 2: Run `flutter test test/features/sulk`.** Expected: FAIL.

- [ ] **Step 3: Implement.** Mochi puffs and turns its back. Re-evaluate weather once a minute using `clockProvider`. Notifications: `NotifyType.sulkComforted` per comfort, `NotifyType.sulkForgiven` on forgive. Keep raindrops to 12 or fewer, for the web.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Commit** with `feat: add sulk screens and comfort game`.

---

### Task 17: Delete everything and the quiet island

**Files:**
- Create: `lib/features/settings/{delete_account,delete_screen}.dart`
- Modify: `lib/features/island/island_screen.dart`, `firestore.rules`, `test-rules/*.test.ts`
- Test: `test/features/settings/delete_account_test.dart`

**Interfaces:**
- Consumes: all collections in the data model.
- Produces: `Future<void> deleteEverythingOf({required FirebaseFirestore db, required String uid})`, then `AuthRepository` deletes the account. `partnerPresentProvider` is false when `profiles/{otherUid}` is missing.

- [ ] **Step 1: Write failing tests** with `FakeFirebaseFirestore`, seeded for both people. After deletion, these are gone: stars from or to her, including those in the owner's keepsakes; their photos; her opened items and days; all sulks of both people with comforts; both pointers; her feeling; treats addressed to her; her device; her profile. A treat she sent cannot be read by her, by rule, and holds only a `kind` and no writing, so the other person's app deletes it without showing it once her profile is missing. Test this too. These remain: `config/*` and the owner's profile and device. Also: 1200 seeded stars delete fully across batches of at most 500; running it twice does not fail; an interruption partway can be retried; the account is deleted only after data deletion succeeds; a wrong phrase at reauth deletes nothing; no notification is sent; the owner's screen with no partner profile shows the quiet island and no message; a dangling opened item does not crash keepsakes. Add rules tests confirming that a recipient can delete stars and photos written by the other person.

- [ ] **Step 2: Run the tests.** Expected: FAIL.

- [ ] **Step 3: Implement.** Ask for the phrase and show a plain confirmation of exactly what will be deleted. Data goes first, then the Auth account, because the rules refuse her afterwards.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Commit** with `feat: add delete-everything and quiet island`.

---

### Task 18: Burmese review, release, and handover

**Files:**
- Create: `docs/handover.md`
- Modify: `lib/copy/copy.dart`, `worker/src/copy.ts`, `web/manifest.json`

- [ ] **Step 1: Run everything.** `flutter analyze`, `flutter test`, `npm --prefix test-rules test`, `npm --prefix worker test`, `node --test tools/hooks/`.

Expected: all pass with no analyzer errors.

- [ ] **Step 2: Owner action: Burmese review.** The owner reads all of `copy.dart` and `worker/src/copy.ts`, and fixes or approves them. Nothing goes to her before this.

- [ ] **Step 3: Pre-handover check on Android.** Run through the handover list as both accounts on the owner's phone, using the APK and Chrome. Confirm `config/features.sulk` is false.

- [ ] **Step 4: After owner confirmation, deploy** using `deploy-mochi`: rules, Hosting, Worker, and the release APK installed on the owner's phone.

- [ ] **Step 5: Write `docs/handover.md`** for the owner, in Burmese:
  - **Step 1 handover:** preferably in person. Open in Safari, add to Home Screen, enter the private-joke phrase, choose her own, offer notifications. If something is wrong, ask only for what she chooses to show from Mochi's Check-up.
  - **Step 2 handover:** when the basics work, set `config/features.sulk` to true in the console. Her app picks it up without reinstalling. If shake, push, or speed fall short, fix those first. Simplify animation before reconsidering Flutter.
  - **Resetting a forgotten phrase:** console password reset and setting her `phraseChosen` to false.

- [ ] **Step 6: Commit** with `docs: add handover guide and approved Burmese copy`.
