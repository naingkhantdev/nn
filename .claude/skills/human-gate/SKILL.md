---
name: human-gate
description: Requires explicit human approval before risky or irreversible actions such as production deploys, data deletion, payments or sending messages. Use whenever an action is hard to undo or affects people outside the session.
---

# human-gate

## Actions that ALWAYS need approval
- Deploying to production; changing DNS, firewall or IAM
- Deleting or overwriting data, `DROP`/`TRUNCATE`, `rm -rf`, force-push, history rewrites
- Database migrations on shared environments
- Spending money, sending emails or messages, posting publicly
- Rotating or exposing credentials

## How to ask
Before the action, stop and show:
1. **What** exactly will run (the exact command or change)
2. **Where** (environment, target)
3. **Impact** and **how to undo it** (or "cannot be undone")
4. Then ask: "Proceed? (yes/no)"

## Rules
- Only an explicit "yes" counts. Silence or "looks fine" about something else is not approval.
- Approval covers this one action only, not similar actions later.
- If refused, do not retry in another way. Ask what the user wants instead.

## In this project
- `firebase deploy`, `wrangler deploy`, `wrangler secret` and `git push` always need the owner's confirmation (see the `deploy-mochi` skill).
- Never enable a Blaze/paid Firebase feature or anything that needs a card.
