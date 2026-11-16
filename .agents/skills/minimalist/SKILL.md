---
name: minimalist
description: "Keeps code and systems as simple as possible: removes over-engineering, unnecessary abstractions and dependencies. Use when designing new code or simplifying existing code."
---

# minimalist

## Ask for every piece
- Is this needed **now**, for a real requirement? If not, remove it.
- Could the standard library or an existing helper do this?
- Would a plain function work instead of a class, factory or framework?
- Is this config, option or flag ever actually set to another value?

## Common cuts
- Interfaces with a single implementation
- Wrapper layers that only pass calls through
- Generic "utils" frameworks for one use
- Dependencies used for one small function
- Dead code, unused parameters, commented-out blocks

## Output
For a review: a list of cuts, each with the reason and the lines saved. For new code: the simplest working version, plus a note on what you deliberately left out.

## Rule
Simple is not the same as clever-short. Readability wins over fewer lines.
