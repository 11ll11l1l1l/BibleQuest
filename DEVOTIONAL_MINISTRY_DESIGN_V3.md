# BibleQuest v3 Devotional and Ministry Design

Updated: 2026-09-07 JST

This document defines the later ministry workflow requested for BibleQuest. It is a design contract only. It does **not** promote any feature-parity row until the corresponding implementation and accumulated regression gates pass.

## Purpose

BibleQuest must support a simple pastor-to-members ministry flow without turning Bible study into a social feed. A Pastor or Admin can publish a freeform Message, Devotional, or Task to congregation members. Members can read the post and, when a Task asks for a response, submit their own answer privately.

The design must preserve one principle throughout: **member response content is pastoral/private data, not community-visible content.**

## First-class post types

### Message

A freeform announcement, encouragement, reminder, pastoral note, or other congregation communication.

Required core fields:
- stable post id
- congregation id
- author id
- author role snapshot
- type = `message`
- title or short heading (optional)
- freeform body
- created / published timestamps
- status: draft / published / archived

### Devotional

A freeform devotional post intended for Scripture reading, reflection, encouragement, and application.

Required core fields:
- all common post fields
- type = `devotional`
- freeform body
- optional Scripture references
- optional reflection prompt(s)
- optional suggested action / prayer prompt

A devotional is a first-class content type. It must not be reduced to a generic assignment label.

### Task

A freeform ministry post that asks members to respond or complete an activity.

Required core fields:
- all common post fields
- type = `task`
- freeform instructions/body
- one or more prompts/questions
- optional due date
- response mode defined by the task, initially text/freeform

Tasks should feel like normal pastoral messaging with questions attached rather than a rigid school-form builder.

## Authoring experience

Pastor/Admin should use a freeform composer. The composer may provide lightweight helpers for title, Scripture reference, prompts, due date, and post type, but the body remains normal freeform writing.

The same authoring surface should eventually feed:
- Ministry Hub (#76)
- Inbox / received ministry posts (#77)
- Workspace / author drafts and response review (#78)
- Assignments (#73)
- Advanced assignments (#74)
- Assignment push workflow (#75)

These later surfaces must share one ministry data/service boundary rather than each inventing its own message or task model.

## Member receiving flow

1. Pastor/Admin publishes a Message, Devotional, or Task to a congregation.
2. Eligible congregation members receive it in the BibleQuest ministry Inbox / Ministry Hub.
3. A member opens the post.
4. Messages and Devotionals are read normally.
5. A Task additionally shows its question/prompt and the member's own response state.
6. The member submits or updates their response according to the task's allowed lifecycle.
7. The member may see aggregate completion information such as `18 members answered` when enabled.
8. The member must never receive another member's response body through the client API.

## Response privacy contract

### Member

A normal member may read:
- the published post
- their own task response
- their own response status/timestamps
- an allowed aggregate count of submitted responses

A normal member may **not** read:
- another member's response body
- another member's private draft
- an answer list containing names plus answers
- hidden pastoral/admin notes

### Pastor/Admin

Authorized Pastor/Admin roles may read:
- individual member responses for their congregation
- response status and timestamps
- aggregate completion counts
- later pastoral review metadata when implemented

### Enforcement

Privacy is a server-side authorization requirement, not a UI convention.

When implemented with Supabase/Postgres:
- Row Level Security must prevent member-to-member response reads.
- Member list/read APIs must never return peer response bodies.
- Aggregate completion count should come from a dedicated authorized aggregate query/view/RPC rather than fetching all responses and hiding them in the browser.
- Pastor/Admin response reads must verify both role and congregation scope.
- Client-side hidden elements are never considered access control.

## Suggested data boundaries

Exact schema may change during implementation, but ownership should remain conceptually separated:

- `ministry_posts` — Message / Devotional / Task content and publication state
- `ministry_task_prompts` — structured prompts when a Task contains one or more questions
- `ministry_responses` — one member's private response payload/status for one task
- optional later `ministry_delivery` — delivery/read state if Inbox needs explicit per-member tracking

Do not duplicate post bodies into each recipient row unless an offline/snapshot requirement later justifies it.

## Service ownership

Future implementation should retain one source of truth:

- Core/API boundary: only the verified API/service layer talks directly to Supabase tables/RPCs.
- Ministry application owner: owns post library, composer lifecycle, publish/archive, task-response lifecycle, aggregate counts, and role-aware operations.
- Ministry UI: presentation and user events only; no direct Supabase, localStorage, RLS assumptions, or privacy filtering.
- Session/congregation owners remain authoritative for identity, role, and congregation membership.

## Devotional relationship to Guided Study

Pastor-authored Devotionals and the built-in Guided Study library are related but not the same feature:
- Guided Study is curated built-in study content driven by the verified lesson engine.
- Devotional is pastor-authored congregation content delivered through Ministry.
- A later Devotional may optionally link to a built-in Guided Study, passage, or Task, but must not copy the Guided Study engine or bypass Ministry privacy/delivery rules.

## Aggregate completion visibility

For a Task, ordinary members may see a count such as `18 answered`.

The aggregate must:
- expose only a number by default
- not expose answer bodies
- not expose identities unless a later explicit feature is separately designed and authorized
- use the same eligibility definition consistently (submitted/completed, not merely opened)

## Delivery and notification

The initial Ministry implementation can use the in-app Inbox/Hub as the authoritative receiving surface. Assignment push / external notification behavior belongs to #75 and should layer on top of the same post/task identity rather than create a second assignment system.

## Audit and safety expectations

Later implementation should preserve:
- stable authorship and timestamps
- archive rather than destructive silent replacement for already-published ministry content where practical
- clear distinction between draft and published content
- content reporting/moderation integration when #87–88 are implemented
- no claim that a devotional or response is a spiritual score, divine approval, or moral ranking

## Parity mapping

This future ministry work primarily maps to:
- #66 Congregation membership / roles
- #73 Assignments
- #74 Advanced assignments
- #75 Assignment push workflow
- #76 Ministry Hub
- #77 Inbox
- #78 Workspace

The Devotional post type is a required product behavior across those later rows even though it does not currently have its own separate inventory row.

## Implementation gate

Do not call this workflow complete until tests prove at minimum:
1. Pastor/Admin can draft and publish each post type.
2. Members receive only eligible congregation posts.
3. A member can submit their own Task response.
4. A member cannot query another member's response body, including by direct API call.
5. Pastor/Admin can review member responses within authorized congregation scope.
6. Members can see the permitted aggregate answer count without peer response content.
7. Role/congregation changes do not leave stale unauthorized access.
8. Mobile Inbox, reading, response, and Pastor review workflows pass accumulated regression.
