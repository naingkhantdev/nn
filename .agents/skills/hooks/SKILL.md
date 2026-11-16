---
name: hooks
description: "Set up or migrate Codex lifecycle hooks and shared Git hooks when the user requests event-driven automation in this project."
---

# Hooks for Codex

## Choose the runtime

- For Git events, use a versioned shared setup appropriate to the repository.
- For Codex events, consult the current [Codex hooks guide](https://learn.chatgpt.com/docs/hooks). Project hooks belong in `.codex/hooks.json` or inline `[hooks]` in `.codex/config.toml`; choose one representation for the layer.
- Check which events, matchers, tool names, input/output shapes, and trust requirements the installed Codex client supports before writing configuration. Do not copy Claude settings into Codex unchanged.

## This project

Existing Claude hooks are configured in `.claude/settings.json`: `block-secrets.mjs`, `format.mjs`, `check-rules.mjs`, and `check.mjs`. Their shared reader is `tools/hooks/read-input.mjs`; tests are in `tools/hooks/hooks.test.mjs`.

Installing the Codex skills does not register these hooks. The scripts currently consume Claude-shaped tool input, including `tool_input.file_path`, `content`, `new_string`, and `command`. A Codex migration must verify and adapt the actual payloads, edit operations, and blocking behavior; renaming an environment variable is insufficient.

## Workflow

1. Use the requested event, action, and blocking/warning behavior; clarify only missing details that affect the result.
2. Keep reusable logic under `tools/hooks/`. Add a runtime adapter there when needed and preserve the existing Claude integration unless removal was requested.
3. Resolve script paths from the repository root, including on Windows and when Codex starts in a subdirectory.
4. Keep hooks fast and scoped to affected files. Do not add surprise formatting, secret access, external transmission, or Flutter commands prohibited by `AGENTS.md`.
5. Verify allowed and rejected inputs and an actual Codex invocation. Run `npm run test:hooks` when the scripts change; distinguish script-test results from runtime integration evidence.
6. Document the active configuration, trust/setup steps, and how to disable it. Do not claim enforcement until Codex has loaded and exercised the hook.
