---
name: code-tour
description: Creates a step-by-step guided tour of a codebase or one feature flow, pointing at real files and lines. Use when onboarding someone or explaining how a part of the code works.
---

# code-tour

## Steps
1. Ask (or decide) the scope: the whole project overview, or one flow (e.g. "user login").
2. Read the entry points first (main, routes, app root), then follow the real call path.
3. Write `docs/tours/<tour-name>.md` with 5–12 stops. Each stop has:
   - **File:** `path/to/file.ext:line`
   - **What it is:** one sentence
   - **Why it matters:** how it connects to the next stop
4. Start with a short map: main folders and what each one is for.
5. End with "Where to go next" and the common places people change code.

## Rules
- Every file path and line must really exist. Check it before writing.
- Explain the "why", not just the "what".
