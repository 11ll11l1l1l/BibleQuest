# BibleQuest v3 Content Reporting Contract

Capability #87 rebuilds the old in-app content report flow without carrying forward legacy runtime ownership.

## Recovered old behavior

The retained implementation allowed a user to report the currently visible BibleQuest learning/content entry, select a bounded report reason, add an optional note, submit the exact content context to the existing `bible_content_reports` backend, and receive an explicit success or error result. Submission required an authenticated user and a current congregation membership. Later retained behavior made reporting broadly available on app content while excluding Reader, Transform, and Psychometrics surfaces.

The retained database contract allows content types `question`, `statement`, `answer`, `explanation`, `story`, `reader`, and `other`; reasons `doctrinal`, `accuracy`, `wording`, `inappropriate`, `duplicate`, `source`, and `other`; content keys up to 180 characters; source up to 120; reference up to 160; content text up to 4000; and an optional note up to 1200. The old UI briefly exposed a `technical` reason that the database never allowed, so v3 follows the database contract and does not reproduce that incompatible value.

## v3 ownership

1. `src/app/content-reporting.js` is the single #87 reporting orchestration owner. It validates the report context, reason, note, authenticated user, and current congregation membership before submitting.
2. `src/core/api.js` remains the only Supabase implementation boundary and owns the single insert into `public.bible_content_reports`.
3. `src/app/session.js` remains the only auth/session owner. Reporting reads session state through that service and cannot access Supabase auth directly.
4. `src/app/congregation-membership.js` remains the only congregation membership/role owner. Reporting reloads current memberships and requires the selected congregation to remain present before submission.
5. `src/ui/content-reporting.js` is presentation/interaction only. It collects a bounded snapshot of explicitly reportable BibleQuest content and forwards it to the reporting owner.
6. `src/ui/content-reporting.css` owns responsive presentation. The launcher and dialog controls remain usable on the 390px mobile path.

## Backend and security contract

The existing retained migration `supabase/migrations/20260905_content_review_and_reports.sql` already provides the required table and RLS policy. Inserts are allowed only when `reporter_id = auth.uid()` and the reporter is a congregation member of `congregation_id`. #87 adds no migration and does not authorize any production deployment or backend mutation outside a normal user report insert.

The browser may supply the content snapshot, reason, note, reporter ID, and selected congregation ID, but backend RLS remains authoritative for whether the insert is allowed. The client does not grant review/moderation permissions.

## Privacy and reportable surfaces

The old generic DOM scan could encounter unrelated application text. The clean v3 runtime narrows that behavior to known BibleQuest-authored/curated learning/content routes and does not scan form fields, response containers, note containers, explicit user-content markers, or editable content. Private/account/community/workspace/couples/congregation administration surfaces are not reportable through #87.

The initial reportable route set is Home, Daily Mission, Learn, Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning, Open Review, Games, Media, and My Mission. Reader, Transform, and Psychometrics remain excluded as recovered from the later old behavior. Any future reportable surface must be added deliberately with regression coverage rather than through MutationObserver or unrestricted DOM surveillance.

The submitted payload contains only the selected reportable content text, a stable content key, content type/source/reference, and a minimal `{route,title}` context payload. It must not include a user's form values, private notes, saved reflections, account information, or arbitrary whole-screen text.

## Validation and result behavior

- Signed-out submission fails with `BQ_CONTENT_REPORT_AUTH_REQUIRED`.
- A missing/currently invalid congregation selection fails closed with `BQ_CONTENT_REPORT_MEMBERSHIP_REQUIRED`.
- Unsupported content types, malformed/bounded content, and overlong fields fail with `BQ_CONTENT_REPORT_INVALID`.
- Unsupported reasons fail with `BQ_CONTENT_REPORT_REASON_INVALID`.
- A successful backend insert must return a report ID before the UI declares success.
- Backend/RLS/network errors remain visible as submission errors; the client does not convert them into success.
- Repeated reports are not locally deduplicated because no recovered #87 contract established client-side idempotency.

## Explicitly out of scope

Capability #87 does not implement #88 content moderation, leader review decisions, #91 Content Review workbench, admin tooling, report queues, report status editing, notifications, automatic doctrinal judgments, XP, scoring, or production schema deployment.

Legacy `window.BQ*` reporting globals, direct Supabase calls outside `src/core/api.js`, MutationObserver feature injection, unrestricted DOM surveillance, direct local/session storage, and competing session/congregation ownership are forbidden.
