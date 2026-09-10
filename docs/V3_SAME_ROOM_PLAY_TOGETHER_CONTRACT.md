# BibleQuest v3 Same-room Play Together contract

Milestone #42 restores local pass-and-play only: 2–6 players, rotating turns, an in-session scoreboard, and a finish state.

Ownership remains in `src/app/games.js`; `src/features/games/index.js` renders and delegates. Same-room scores are ephemeral, do not persist, and do not award profile XP. This milestone does not add networking, room IDs, realtime presence, cross-device play, or any #43 Live Rooms behavior.
