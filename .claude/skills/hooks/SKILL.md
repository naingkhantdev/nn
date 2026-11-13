---
name: hooks
description: Sets up automation hooks: git hooks (pre-commit, commit-msg, pre-push) and AI agent hooks (e.g. Claude Code PreToolUse/PostToolUse in settings.json). Use when the user wants something to run automatically on an event.
---

# hooks

## Choose the hook type
- **Git hooks** — use a shared, versioned setup (e.g. husky, lefthook or pre-commit) so the whole team gets them, not just `.git/hooks`.
- **Agent hooks** — for Claude Code, add hooks in `.claude/settings.json` under `hooks` (events such as PreToolUse, PostToolUse, Stop, SessionStart) with a matcher and a command.

## Steps
1. Ask: which event, what should run, and should a failure block the action or only warn?
2. Keep hooks fast (a few seconds). Run only on changed files when possible.
3. Put the logic in a script under `scripts/hooks/` so it can be tested by itself.
4. Print clear messages that say what failed and how to fix it.
5. Document the hooks in the README, including how to skip one in an emergency.

## Rules
- Never add hooks that send data to outside services without the user's approval.
- Do not make hooks that silently change files the user did not expect.

## In this project
- Agent hooks already exist in `.claude/settings.json`: PreToolUse `block-secrets.mjs`, PostToolUse `format.mjs` + `check-rules.mjs`, Stop `check.mjs`.
- Hook scripts live in `tools/hooks/` (not `scripts/hooks/`), share input parsing via `tools/hooks/read-input.mjs`, and are tested by `tools/hooks/hooks.test.mjs` (`npm run test:hooks`).
- Add new hooks there, beside the existing ones, rather than starting a second hooks folder.
