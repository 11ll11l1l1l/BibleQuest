# BibleQuest v3 Bible World artwork contract

Capability #45 restores the retained Bible World visual reveal without recreating the legacy media injector.

## Recovered parity boundary

- The exact retained assets are `assets/world-locked.webp` and `assets/world-revealed.webp`.
- The two images are layered in the same responsive 16:9 frame. The locked/clouded artwork is the base layer; the revealed artwork is clipped from left to right according to learning evidence.
- Reveal percentage is the rounded arithmetic mean of the existing eight Adaptive Learning mastery categories: Genesis, Exodus, History, Wisdom, Prophets, Gospels, Acts, and Letters.
- Scripture and Bible World regions remain available regardless of reveal percentage. Artwork reveal is presentation feedback, not an unlock gate.
- If either image cannot load, the artwork layer is replaced by a textual fallback while the Bible World region map, Reader handoffs, and Review handoffs remain usable.

## Ownership

- `src/app/adaptive-learning.js` remains the mastery/evidence owner.
- `src/app/bible-world.js` remains the Bible World projection owner. It exposes the retained artwork paths and computes the read-only reveal percentage from Adaptive mastery.
- `src/features/bible-world/index.js` owns presentation-only image load failure state for the current mount. It does not persist failure state or own media loading infrastructure.
- `src/ui/bible-world.css` owns the responsive 16:9 layering and clipping presentation.

## Safety and scope

The historical `quest-media.js` implementation is reference-only. #45 does not restore direct `localStorage`, `MutationObserver`, `window.BQMedia`, DOM injection, a second mastery store, or a global media runtime. The artwork introduces no XP, scoring, streak, progress event, or backend operation. Missing artwork must never block Scripture access or turn the Bible World route into an error state.
