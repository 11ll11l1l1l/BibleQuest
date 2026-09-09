# BibleQuest v3 Congregation Recognition contract

## Recovered scope

Inventory #72 requires recognition load, award, display and permission handling. Retained recognition code and later leader-dashboard corrections establish two related but separate behaviors:

- congregation members can view congregation recognition data backed by trusted activity, earned congregation badges and visible recognition rows;
- persisted special recognition is created only by congregation `leader`, `pastor` or `admin` roles. A later privacy/permission correction explicitly removed `facilitator` from this authority.

The retained manual award catalog is fixed to nine presets: Consistency Award, Scripture Explorer, Encourager, Journey Finisher, Comeback Award, Group Helper, Reflection Award, Most Improved and Pastor / Leader Recognition. A leader may optionally supply a custom title up to 120 characters and an optional note up to 1200 characters.

## Ownership

- `src/app/congregation-recognition.js` is the sole v3 client owner for recognition scope normalization, active-recipient validation, preset normalization, client permission projection and award orchestration.
- `src/core/api.js` remains the sole browser Supabase boundary. It reads active congregation directory, visible `bible_member_recognitions`, congregation `bible_user_badges`, and active `bible_badge_catalog`, and performs the retained RLS-protected recognition insert.
- `src/app/congregation-membership.js` remains the authenticated congregation-membership owner.
- `src/features/congregation-recognition/index.js` is presentation only.
- `src/app/leaderboards.js` remains the sole ranking/period/lane owner. #72 must not recalculate scores or take ownership from #71.

## Permission and privacy boundary

All cloud operations require an authenticated, non-local-preview account and an active congregation membership. Visible recognition and earned congregation badges are congregation-readable under existing RLS. Manual persisted awards are permitted only to `leader`, `pastor`, and `admin`; `member` and `facilitator` fail closed in the client before the insert, and database RLS independently enforces the same authority plus active-recipient membership and `awarded_by = auth.uid()`.

The award target must be an active member in the currently loaded congregation. The client chooses `award_code` and icon only from the recovered preset catalog. `awarded_by` comes from the authenticated session. The database generates the row id and timestamp.

Historical visible recognition whose recipient later left the congregation may remain readable under the retained database policy, but the v3 presentation does not expose a stale public display name; it renders that target as `Former member`. Earned badge projections are restricted to the current active congregation directory.

Recognition describes participation and learning, not spiritual worth. Private notes, answers, reflections, Couple Journey data, Transform/Psychometrics results, credentials and other private study data are outside this feature.

## Non-goals

#72 does not own score-event submission, leaderboard ranking, XP, achievement calculation, presence, teams, assignments, notification delivery, ministry analytics, content moderation, or recognition edit/delete workflows. Production v2, `main`, production Supabase and production Cloudflare remain untouched during the rebuild.
