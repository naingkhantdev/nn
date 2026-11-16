---
name: commit-craft
description: "Writes clear Conventional Commit messages from the staged diff, splitting unrelated changes when needed. Use when the user wants to commit or asks for a commit message."
---

# commit-craft

## Steps
1. Run `git diff --staged` (and `git status`) to see exactly what will be committed.
2. If the staged changes contain unrelated work, suggest splitting them into separate commits.
3. Write the message in Conventional Commit format:
   ```
   <type>(<scope>): <summary, imperative, max 72 chars>

   <body: WHY the change was made, and what changed at a high level>

   <footer: BREAKING CHANGE: ..., Refs #123>
   ```
   Types: feat, fix, refactor, perf, docs, test, build, ci, chore.
4. Follow the repo's existing style if `git log --oneline -20` shows a different convention.
5. Show the message to the user before committing.

## Rules
- The summary describes the change, not the process ("fix login timeout", not "updated files").
- Never commit secrets. Warn if the diff contains keys or .env values.

## In this project
- Match the existing style: `feat: add ...`, `fix: ...` (see `git log --oneline`).
- Never add AI co-author trailers, "Generated with Codex", or other AI attribution. Commits are authored solely by the repository owner.
