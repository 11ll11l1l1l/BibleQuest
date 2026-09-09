# BibleQuest v3 Community Bridge Contract

Inventory row #67 restores the cross-feature connection that the retained `community-bridge.js` proved, without restoring its unsafe storage interception or prematurely implementing later Community capabilities.

## Recovered evidence

- The retained bridge connected learning and Couples activity to a shared Community surface.
- The retained Community surface linked roster, group play, badges, and leaderboards.
- In v3, Progress, Couples, congregation membership, Journey Groups, and Encouragements already have separate verified owners. The bridge must compose those owners instead of reading browser storage or cloud tables itself.

## Exact #67 scope

- `src/app/community-bridge.js` is the sole read-only cross-feature projection owner.
- It composes the verified Session, Congregation Membership, Journey Groups, and Encouragements owners.
- It exposes only congregation ID/name/role, group ID/name/role/member counts, and a total encouragement count.
- It rejects groups outside the account's active congregation memberships and encouragement rows outside the projected groups.
- `src/features/community/index.js` provides one Community route with navigation to Membership & role, Journey Groups, and Encouragements.
- Signed-out and local-preview states do not reuse stale community data or contact the cloud.

## Explicit exclusions

#67 does not intercept `Storage.prototype`, persist another community state, award points, submit score events, calculate rankings, display leaderboards or congregation badges, expose group member/sender identities, or transfer private notes, answers, reflections, Couple Journey data, credentials, XP, or study state.

Presence (#68), Team Center (#69), trusted score events (#70), leaderboards (#71), recognition (#72), assignments (#73–75), Ministry Hub (#76), notifications (#77), Workspace (#78), and linked activities (#79) remain separate Not started capabilities.

No Supabase migration, Edge Function, production deployment, v2 change, or `main` change belongs to this milestone.
