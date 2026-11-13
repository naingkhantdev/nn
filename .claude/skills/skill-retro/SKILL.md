---
name: skill-retro
description: Runs a retrospective on how an Agent Skill performed in real sessions and improves its SKILL.md. Use after a skill was used, especially when it misfired, was skipped or produced poor output.
---

# skill-retro

## Steps
1. Collect cases: sessions where the skill ran, should have run but did not, or ran when it should not have.
2. For each case, classify the problem:
   - **Trigger** — the description was too vague or too broad
   - **Instructions** — steps unclear, missing or wrong
   - **Scope** — the skill tries to do too much
   - **Output** — wrong format or quality
3. Propose specific edits to SKILL.md and show them as a diff. Explain each change in one line.
4. Add the failing cases as examples or tests so the same problem does not return.
5. Log the retro in `<skill-folder>/RETRO.md`: date, findings, changes made.

## Rules
- Change one thing at a time when you can, so the effect is clear.
- Keep SKILL.md short; move long detail into reference files.
