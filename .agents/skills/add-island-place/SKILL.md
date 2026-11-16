---
name: add-island-place
description: "Checklist for adding a new place to Mochi Island\u0027s island screen (e.g. Snail Post, Lantern, Garden). Use when adding or opening an island place."
---

# Add an island place

1. Add or confirm the entries in `IslandPlaceId` and `islandPlaces` in `src/features/island/places.ts`, with a semantics label and a tap target of at least 48x48.
2. Gate it in `isOpen(place, features)`. New places stay "still being built" until a feature flag in `config/features` opens them.
3. Create the screen under `src/features/<place>/` and register it in `placeScreens` in `src/features/island/PlaceScreen.tsx`.
4. Put every string in `src/copy/copy.ts`, in English.
5. Firestore: add the collection to the data model table in the plan, write rules with membership checks, and add tests in `test-rules/` (stranger refused, other member limited correctly).
6. Deletion: locate the account/data-deletion flow and cover the new data in its tests. The plan names `deleteEverythingOf`, but it is not implemented in this checkout; report that gap and keep a persistent-data feature gated until its deletion path is implemented.
7. Check the anti-goals in `mochi-style`: no activity signals, no guilt.
8. Run the `free-tier-check` skill on the change.
9. Test at 320x568 and 430x932 with no overflow.
