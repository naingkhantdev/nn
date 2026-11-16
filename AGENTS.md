# AGENTS.md

## Project

Mochi Island is a private island PWA for two people, built with Vite, React,
TypeScript, React Router, and Firebase. It runs on Android Chrome and iPhone
Safari. This checkout uses React; the older Flutter plan is historical.

- Design: `docs/superpowers/specs/2026-11-06-mochi-island-design.md`.
- Current plan and data model: `docs/superpowers/plans/2026-11-10-mochi-island-phase-1-react.md`.
- Hosting instructions and recorded status: `docs/hosting.md`.

## Working agreements

- Read the relevant source and any more specific `AGENTS.md` before editing.
- Modify only source files and task-relevant documentation or agent instructions.
- Keep changes minimal. Avoid unrelated formatting and preserve existing work.
- Verify APIs, paths, and installed package versions before relying on them.
- Report changed file names, checks actually run, and anything still unverified.
- Never add AI co-author trailers or generated-by attribution to commits, pull
  requests, or code. Commits are authored solely by the repository owner
  (`naingkhantdev`).

## Product boundaries

- No pressure or guilt: no unreplied indicators, neglect penalties, or "misses
  you" states. Mochi never dies or gets sick.
- No surveillance: no location, online/last-seen indicators, visible read
  tracking, or hidden analytics.
- Users must be able to leave and delete their data from inside the app.
- Keep art, names, and styling original; no borrowed brands.

## Services and budget

- Cost stays $0 with no payment card. Firebase project: `mochi-island-mk`,
  Spark plan, Firestore region `asia-southeast1`.
- Never enable Blaze, Cloud Storage, Cloud Functions, or another paid feature.
- Store photos in separate Firestore documents under 900000 bytes, targeting
  about 300 KB; never include photo bytes in listened documents.
- Keep listeners narrow. Project budgets: 50k reads and 20k writes per day,
  1 GiB stored; Cloudflare Worker budget: 10 ms CPU and 100k requests per day.
  Verify current provider limits before a capacity or deployment decision.
- Push uses the Cloudflare Worker. FCM credentials belong only in Worker
  secrets; never put credentials or service-account files in code or logs.
- `firebase deploy`, `wrangler deploy`, `wrangler secret`, and `git push` need
  the owner's explicit confirmation for the concrete action. Prepare and
  verify the work first; honor authorization already given for that action.

## Layout and implementation

- `src/copy/copy.ts`: all app text; `worker/src/copy.ts`: Worker text.
- `src/core/`: Firebase, members, clock, Myanmar time, services, and theme.
- `src/platform/`: shake, push, and install detection.
- `src/features/<area>/`: feature code and adjacent `*.test.ts(x)` files.
- `test-rules/`: Firestore rule tests; `worker/`: notification Worker;
  `e2e/`: browser tests; `tools/hooks/`: existing hook scripts.
- App text is English. User input supports Burmese Unicode with bundled Noto
  Sans Myanmar; never use Zawgyi.
- Days reset at Myanmar midnight (UTC+6:30), determined by server
  `request.time`, not the phone clock.
- Tap must work as an alternative to shake. The app works without push.
- Sulks fade after 24 hours and feelings after 8 hours; calculate fades instead
  of storing updates. Starting a sulk sends one notification; feelings send none.
- Use tokens from `src/core/theme.css`. Animate only `transform` and `opacity`,
  avoid blur filters, and honor `prefers-reduced-motion`.
- Wrap every `localStorage` access in try/catch.

## Verification

Choose checks that cover the changed behavior; documentation-only changes do
not require the application test suite.

- Types: `npm run typecheck`.
- App tests: `npm test`; lint: `npm run lint`; production build: `npm run build`.
- Hook scripts: `npm run test:hooks`.
- Firestore rules: `npm --prefix test-rules test` (requires the emulator).
- Worker: `npm --prefix worker test`.
- Browser flows: `npm run test:e2e`.
- Local development, when needed: `npm run dev`.

Do not claim a check passed unless its actual output establishes that result.

## Codex skills

Project skills live in `.agents/skills/<name>/SKILL.md`. Read a matching skill
when the task needs its workflow. Explicit invocation uses `$skill-name`, for
example `$free-tier-check review this change` or `$code-tour explain login`.

- Implementation: `karpathy-coder`, `minimalist`, `zero-hallucination-coder`.
- Mochi features and design: `add-island-place`, `mochi-style`.
- Reviews: `free-tier-check`, `security-guidance`, `agent-run-forensics`.
- Delivery: `commit-craft`, `deploy-mochi`, `human-gate`, `handoff`.
- Documentation and tooling: `code-tour`, `hooks`, `write-a-skill`, `skill-retro`.

Explicit user instructions take precedence over skill guidelines. Skills do
not grant deployment, secret-management, or command-execution permission.
The existing `.claude/settings.json` hooks and permissions are Claude-specific;
this skill setup does not activate them in Codex. For a requested hook migration,
use the `hooks` skill and verify Codex event payloads before reusing scripts.

## Flutter and Dart work

If a task touches Flutter/Dart source, preserve these user rules:

- Do not manually create, edit, delete, or patch generated files such as
  `*.g.dart`, `*.freezed.dart`, `*.mocks.dart`, generated routers, or generated
  API files unless the user explicitly asks.
- Do not independently run `flutter analyze`, `flutter format`, `dart analyze`,
  `flutter test`, `flutter run`, `flutter pub run build_runner build`, or
  `dart run build_runner build`. Analysis, testing, running, formatting, and
  code generation require an explicit user request; otherwise provide the
  exact command for the user to run.
- When generation is needed, ask the user to run
  `dart run build_runner build --delete-conflicting-outputs` and wait for output.
- Preferred Flutter architecture:
  `VO -> responses -> api -> data_agent -> data_agent_impl -> repository -> repo_provider -> goRouter -> UI`.
- Edit source only, keep changes minimal, avoid unrelated formatting, and
  list changed file names.
