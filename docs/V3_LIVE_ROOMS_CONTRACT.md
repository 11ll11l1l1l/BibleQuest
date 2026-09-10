# BibleQuest v3 Live Rooms contract

Capability #43 restores the retained Live Rooms lifecycle without importing the legacy global runtime.

## Recovered parity boundary

- Live Rooms are account-backed and available only outside local preview.
- A user must be an active member of the room's congregation to create or join.
- Facilitator, Leader, Pastor, and Admin are ministry-capable host roles through the existing Congregation Membership owner and backend RLS.
- Hosts create a `live-room` shared session with a short room code and join their own participant row.
- Members join an unended room by code and idempotently join its participant row.
- Room and participant changes use the retained Supabase realtime publication through the central API boundary.
- Disconnect retains only the current in-memory room identity so the route can reconnect; reconnect reloads canonical room state from the backend, revalidates congregation membership, idempotently rejoins the participant, and replaces participant state.
- Explicit Leave clears the room, participant list, connection state, and realtime subscription. Host End updates the room to `ended` and then clears local room state.
- An ended or missing room cannot be reactivated from retained client state.

## Ownership

- `src/core/api.js` remains the only Supabase/browser remote-data owner. It owns Live Room CRUD/read, participant read/join, and realtime channel creation/removal.
- `src/app/live-rooms.js` is the single Live Rooms lifecycle/state owner. It owns code normalization, room normalization, membership checks through Congregation Membership, reconnect, disconnect, leave/end cleanup, and participant presentation state.
- `src/features/live-rooms/index.js` is presentation/event forwarding only.
- `src/app/congregation-membership.js` remains the role/membership authority. Live Rooms does not duplicate role policy.

## Security and scope

The retained database schema/RLS/migrations remain authoritative. This milestone does not deploy or mutate production Supabase. Browser code does not receive scoring authority and does not bypass existing participant/response hardening. The old `live-rooms.js`, direct `localStorage`, direct Supabase calls, and `window.BQ*` globals are reference-only and are not v3 implementation.

The recovered inventory acceptance for #43 is lifecycle-only: create/join/leave, reconnect, and no stale room state. Quiz/poll/verse-hunt/discussion scoring behavior is adjacent legacy functionality and is not silently folded into this milestone.
