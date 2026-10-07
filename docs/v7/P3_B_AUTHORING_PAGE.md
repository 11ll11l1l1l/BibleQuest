# P3-B feature-local curriculum authoring page

`src/features/curriculum-authoring/index.js` is the Lane B presentation surface over the feature-local authoring controller. It deliberately remains unregistered in the global router until the shared navigation owner provides an approved entry point.

The page supports hierarchy selection and draft creation/editing for tracks, modules, lessons, lesson revisions, and the canonical seven lesson steps. Dynamic content is escaped before rendering, active operations disable the authoring fieldset to reduce duplicate submissions, account/congregation changes invalidate feature state, and cleanup removes listeners and disposes the controller.

Publication is presentation-only readiness. The page can show whether the selected revision has the complete draft hierarchy and seven canonical steps, but it exposes no client Publish/Archive/Withdraw mutation. The atomic backend dependency remains #1168. ONE 2 ONE assignment creation remains excluded until the race-safe authoritative boundary in #1170 is resolved.

The page takes navigation callbacks (`onBack`, `onAccount`, `onCongregation`) rather than changing routes itself. This preserves the single shared router/session/congregation owners while giving Lane A a ready feature surface to mount once global wiring is reconciled.
