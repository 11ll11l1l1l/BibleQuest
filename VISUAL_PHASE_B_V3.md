# BibleQuest v3 — Visual Phase B Contract

Status: active Priority 1 product-quality contract
Updated: 2026-09-11 JST

## Relationship to earlier visual work

The verified tranche-based visual program through tranche 16 is **Visual Phase A: first-pass replacement/presentation polish**. Its exact-SHA evidence remains valid and must be preserved.

Phase A completion does **not** mean the requested final visual quality is complete.

Visual Phase B is the active artwork-quality program required by `DEVELOPMENT_PRIORITY_V3.md`.

## Objective

Upgrade remaining minimal, placeholder, generic, text-like or emoji-like presentation into a coherent polished BibleQuest visual language while keeping the existing application structure recognizable.

Phase B may introduce real asset files such as SVG, PNG or WebP for:

- feature and navigation icons where appropriate;
- section/world/background illustrations;
- hero/decorative artwork;
- game/learning visual assets;
- textures and non-behavioral decorative elements.

CSS-only button decoration is not sufficient where the underlying need is recognizable artwork or illustration.

## Automatic generated-asset authorization

If a selected Phase B improvement requires an AI-generated visual asset:

1. generate it;
2. choose the best suitable result;
3. optimize it for web/mobile use;
4. store it in the correct project asset location;
5. implement it in the actual UI;
6. verify containment, readability, contrast, touch behavior and performance;
7. run focused and accumulated regressions appropriate to the changed product SHA.

**Do not stop to ask the user to approve the generated image before implementation.**

A generated asset that is not wired into the product does not count as completed work.

## Boundaries

Preserve unless a separately selected product milestone explicitly changes them:

- information architecture and route ownership;
- primary navigation structure;
- feature ownership and state transitions;
- persistence/storage/API/Supabase contracts;
- gameplay/scoring/reward semantics;
- Scripture/source semantics;
- accessibility behavior;
- responsive/mobile usability;
- PWA/offline/service-worker ownership.

Small layout adjustments are allowed when necessary to correctly host the new artwork without changing the core interaction model.

## Execution model

Where practical, complete a user-facing surface as one unit:

functional correctness → artwork/icon/background implementation → focused verification → exact-SHA accumulated verification at the milestone checkpoint.

Do not reopen already-good surfaces merely to generate work. Prioritize surfaces where the current presentation still materially looks minimal, placeholder, inconsistent or under-designed.

## Evidence rule

Every changed product SHA earns its own evidence. Preserve Phase A evidence as historical verification and record Phase B checkpoints separately rather than rewriting the old tranche history.
