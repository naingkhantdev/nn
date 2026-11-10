---
name: mochi-style
description: Visual, motion, and writing rules for Mochi Island. Use before drawing art, choosing colours, animating, or writing any text the users will see.
---

# Mochi style

## Feel
Soft, squishy, gentle, a little silly. A gift between friends, never a couples app or a declaration of love.

## Colours
Tokens live in `src/core/theme.css` as CSS custom properties. Use tokens, never raw hex in components.
<!-- Final palette is recorded here after Task 5. -->

## Motion
- Animate only `transform` and `opacity`. No blur filters, no large shadows (iPhone Safari must stay smooth).
- Idle motion is slow and small: waves, drifting clouds, blinking, a soft bounce.
- Reactions (pet, feed, star unfold) are quick squishes: ~200-400 ms, ease-out, slight overshoot.
- Pause loops on `visibilitychange`. Honour `prefers-reduced-motion` with still frames.

## Mochi's voice
- Mochi speaks in short, warm, playful lines. First person, simple words.
- Mainly Burmese (Unicode, never Zawgyi). The owner reviews every Burmese line before she sees it.
- All text goes in `src/copy/copy.ts`; Worker notification text in `worker/src/copy.ts`.

## Never
- Guilt or pressure: no "you haven't replied", no "Mochi misses you", Mochi never sick, sad from neglect, or dying.
- Activity signals: no last-seen, online dots, read receipts, timestamps on feelings.
- Brand references (no Barbie or anything borrowed). All art original.
