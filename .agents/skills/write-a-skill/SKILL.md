---
name: write-a-skill
description: "Create or update a project Codex skill with a focused trigger, reusable instructions, and only the supporting resources its workflow needs."
---

# Write a Codex skill

1. Use the user's requirements and existing examples to identify one reusable job. Ask for examples only when a material part of the scope is missing.
2. Choose a lowercase kebab-case name under 64 characters. Inspect any existing skill before changing it.
3. For this project, create `.agents/skills/<name>/SKILL.md`. Use UTF-8 and begin with YAML frontmatter containing `name` and a concise `description` of what the skill does and when to select it. Quote descriptions containing YAML punctuation such as a colon followed by a space.
4. Keep the body focused on project knowledge and workflow decisions. Add `references/`, `scripts/`, or `assets/` only when needed; link each resource at the step that uses it.
5. Respect `AGENTS.md`, current user authorization, and Flutter command restrictions. A skill must not grant permissions, silently expand the task, or override an explicit user instruction.
6. Validate frontmatter, referenced paths, and any new scripts. When useful, exercise a representative request and an out-of-scope request, without performing unapproved external actions.
7. Report the files changed and how to invoke the skill: `$skill-name <request>`. Matching tasks can also select it automatically. If it does not appear, restart Codex.

Use the installed `skill-creator` workflow when available for authoring and validation. Optional UI metadata belongs in `agents/openai.yaml`; consult its current schema before adding it. Do not invent Claude-only settings or slash commands for Codex.
