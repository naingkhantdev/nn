---
name: human-gate
description: "Check authorization for production changes, destructive operations, payments, or external messages, and obtain any missing approval immediately before the concrete action."
---

# Human approval

Read `AGENTS.md` and the current conversation to establish what the user has already authorized. Complete reversible preparation and verification before presenting an action for approval.

## Check before acting

- Production deploys and changes to DNS, firewall, or IAM.
- Destructive data operations, force-pushes, or history rewrites.
- Shared-environment database migrations.
- Payments, external messages, or public posts.
- Credential rotation or secret-management changes.

## If authorization is missing

State the exact command or change, target environment, impact, and rollback limits. Ask for approval for that concrete action and explain which project rule requires it. Wait for an explicit answer; silence is not approval. If declined, do not attempt the same action through another route.

Authorization remains valid for the action and scope the user approved. Do not request it again for the same unchanged action, infer broader permission, or treat ordinary reversible edits as requiring a new approval.

## Mochi Island

- `firebase deploy`, `wrangler deploy`, `wrangler secret`, and `git push` require the owner's explicit confirmation for the concrete action.
- Follow `deploy-mochi` for release preparation and separate deploy targets.
- Never enable paid Firebase features or services requiring a payment card.
- Never expose credentials as part of an approval request.
