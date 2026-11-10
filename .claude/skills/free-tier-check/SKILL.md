---
name: free-tier-check
description: Review a Mochi Island change against the free Firebase Spark and Cloudflare Workers limits. Use before committing changes that touch Firestore reads/writes, listeners, photos, hosting, or the Worker.
---

# Free-tier check

Report each item as OK or a problem with file:line.

1. **No Blaze features.** No Cloud Storage (`firebase/storage`), Cloud Functions, Extensions, or anything that asks for a card.
2. **Narrow listeners.** Every `onSnapshot` targets one doc or a query filtered to the current user (`toUid == me`, a specific doc id). No listening to whole collections.
3. **Media out of listened docs.** Photo bytes live only in `starPhotos/{id}`, fetched with `getDoc` when opened, never in a listener.
4. **Photo size.** Compressed under 900000 bytes (target ~300 KB) before writing.
5. **Write volume.** No writes on timers, scroll, or animation frames. Fades are calculated, not written.
6. **Spark budget.** Estimate reads/writes per active day for two users; should be far under 50k reads / 20k writes.
7. **Worker.** One FCM send per request, Google access token cached, no per-request JWT signing when the cache is warm (10 ms CPU limit).
8. **Hosting.** Build output reasonable (images compressed, fonts subset where possible).
