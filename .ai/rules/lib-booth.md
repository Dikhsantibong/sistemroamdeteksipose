---
paths:
  - 'resources/js/lib/booth/**'
  - resources/js/lib/booth/swipe.ts
  - resources/js/lib/booth/voice-commands.ts
---

# Lib Booth

## Gesture thresholds are distance-adaptive; voice matches all alternatives
Do not reintroduce a fixed pixel/fraction distance for swipes. The customer's distance from the tablet is unknown and changes constantly, so `detectSwipe` measures travel in multiples of the detected hand width (clamped between `minimumTravel` and `maximumTravel`). A fixed threshold is either untriggerable from three metres away or fires on every twitch up close.

Track the palm centre (mean of landmarks 0, 5, 9, 13, 17), never a single landmark: one point jitters by roughly the size of the gesture itself at distance.

For voice, always scan every alternative the engine returns, not `results[i][0]`. Chrome ranks a single syllable like "next" close to a coin toss and frequently puts "text" or "nest" first. Exact vocabulary hits must fire regardless of the reported confidence; the confidence setting only guards fuzzy (edit-distance) matches.

## Swipe detection judges the flick, not the whole trail
`detectSwipe` walks backwards from the newest sample to find the SHORTEST recent stretch covering the required distance, then checks direction consistency on that stretch only.

Do not go back to evaluating the whole trail. A hand hovers in frame for most of the window and only flicks at the end; judging everything let the stationary jitter dominate the consistency ratio, and no real gesture ever passed. That was the bug behind "gesture doesn't work at all".

Consequences to preserve: the trail window (1000ms) is deliberately longer than `maximumDurationMs` (700ms) so there is history to search, and `CONSISTENCY_SHARE` can stay strict (0.75) because only the flick is measured — that is what keeps a wave from paging through poses.

## Voice: the top alternative decides the count, never the maximum
`extractCommandsFromAlternatives` returns the commands from the highest ranked alternative that heard any, and consults lower ones only when the top heard nothing.

Do not switch it back to "whichever alternative found the most". The alternatives are competing transcriptions of the SAME audio and routinely disagree on repetition — one spoken "next" often comes back as "next" at the top and "next next" further down — so taking the maximum over-counts systematically and makes a single command jump two poses.

Near-miss matching compares phonetic keys (see `phoneticKey`), not spellings, with a distance limit of 1 below 7 characters. Raising that limit lets "test", "best" and "rest" match "next". When adding vocabulary, prefer distinctive words: "neck" and "net" were removed precisely because they are ordinary speech.
