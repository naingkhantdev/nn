---
name: write-a-skill
description: Guides the user through creating a new Agent Skill from scratch: scope, trigger description, SKILL.md instructions, reference files and testing. Use when the user wants to write or create a custom skill.
---

# write-a-skill

## Steps
1. **Interview** — what job should the skill do? When should it trigger? Ask for 2–3 real example requests.
2. **Name** — short kebab-case (e.g. `team-code-review`).
3. **Create the folder**:
   ```
   .claude/skills/<name>/
   ├── SKILL.md
   ├── references/      # optional: long docs, read only when needed
   └── scripts/         # optional: helper scripts the skill runs
   ```
4. **Frontmatter** — `name` plus a `description` that says WHAT it does and WHEN to use it, with the trigger words users will actually type. This is what decides whether the skill is used.
5. **Body** — imperative steps, rules and a short example. Keep it under about 200 lines; move the rest into references/.
6. **Test** — try the example requests. Does it trigger? Is the output right? Also try a request that should NOT trigger it.
7. **Iterate** — tighten the description and steps based on the results.

## Rules
- One skill = one clear job.
- Explain the "why" behind important rules so the AI can handle edge cases.
