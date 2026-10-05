# Lane B — ONE 2 ONE built-artifact smoke

Starting integration: `8d7be8200de741b8f049f3c6659ef81e06b25829`.

The exact-SHA V7 browser gate covered representative narrow widths and broad canonical routes but omitted the integrated ONE 2 ONE route family. Add a separate Lane-B-specific Playwright smoke against the exact built artifact instead of expanding the large legacy browser harness.

The smoke covers the ONE 2 ONE entry route at 320/360/390/412/430px and direct 390px deep links for authoring, assignment, pair, assigned track/module, and pinned lesson routes. It rejects startup failures, lazy-module failures, browser page errors, route drift, and horizontal overflow.

This is deliberately signed-out route/layout evidence. It does not claim authenticated journey completion, live Supabase/RLS evidence, publication/assignment mutation success, or production certification. Connected backend inspection found no available environment with the V7 ONE 2 ONE schema/RPCs deployed, so no database writes or paid development branch were created.