---
name: handoff
description: Writes a complete handoff note so another agent or person can continue the work without losing context. Use when ending a session, switching agents or handing a task to someone else.
---

# handoff

## Write `HANDOFF.md` (or `handoffs/<date>-<topic>.md`)
1. **Goal** — what we are trying to achieve, and why
2. **Status** — done / in progress / not started
3. **What changed** — files touched, and branch / commit
4. **Decisions made** — and the reasons (including rejected options)
5. **Open problems** — errors with exact messages, and what was already tried
6. **Next steps** — an ordered, concrete list; the very first action should be obvious
7. **How to verify** — commands to run, and what success looks like
8. **Gotchas** — anything surprising the next person must know

## Rules
- Write for a reader with ZERO context.
- Use exact paths, commands and error text, not vague descriptions.
- Never include secrets.
