---
name: zero-hallucination-coder
description: "Writes code that only uses APIs, functions and packages verified to exist in this project or its installed dependencies. Use when correctness matters or when working with unfamiliar libraries."
---

# zero-hallucination-coder

## Before writing code
1. Check that every import, function, method and config key exists:
   - In the project: search for it and read its definition
   - In dependencies: check the installed version (lockfile) and read its types, docs or source in node_modules / site-packages
2. If you cannot verify something, say so. Never guess an API signature.

## While writing
- Match the existing patterns in the codebase.
- Do not invent environment variables, file paths, CLI flags or package names.
- Do not add a new dependency without saying so and checking that it exists on the registry.

## After writing
List the APIs you relied on and where you verified each one (file:line or doc link). Clearly mark anything unverified.

## Never say
"This should work" or "tested" unless it was actually run. Say what was and was not run.
