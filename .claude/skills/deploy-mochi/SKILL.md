---
name: deploy-mochi
description: Checklist and commands to test and deploy Mochi Island (Firestore rules, Hosting, Cloudflare Worker). Use when the owner asks to deploy or release.
---

# Deploy Mochi Island

Every deploy step needs the owner's explicit confirmation, one at a time. Never deploy Burmese text the owner has not approved.

1. **Test everything.** All must pass:
   - `npm run typecheck`, `npm test`, `npm run test:hooks`
   - `npm --prefix test-rules test`
   - `npm --prefix worker test`
2. **Build.** `npm run build`. Check `dist/` exists and the PWA manifest is present.
3. **Rules** (confirm first): `firebase deploy --only firestore --project mochi-island-mk`
4. **Hosting** (confirm first): `firebase deploy --only hosting --project mochi-island-mk`. Site: https://mochi-island-mk.web.app
5. **Worker** (confirm first): `npx --prefix worker wrangler deploy`. Secrets only via `wrangler secret put`, never in files.
6. **Smoke check.** Open the site on the owner's Android Chrome; log in; open the island.
7. Report what was deployed and anything skipped.
