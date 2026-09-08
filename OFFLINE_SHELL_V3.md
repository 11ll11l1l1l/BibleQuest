# BibleQuest v3 Offline Shell Contract

## Scope

#98 makes the already-loaded v3 application shell reloadable without network access. It does not make Bible content packs, account/cloud operations, media, or arbitrary fetch responses offline-capable.

## Ownership

1. `src/app/offline-shell.js` is the single page-side service-worker registration and shell-warmup owner.
2. `offline-shell-sw.js` is the single Cache Storage and shell-fetch owner.
3. Bootstrap only composes and starts the offline-shell owner; it does not register workers or touch Cache Storage directly.
4. #97 `src/app/pwa-install.js` remains the sole install-prompt owner and has no offline responsibility.
5. #99 alone may add an opened-Bible-pack cache. #98 must not cache pack/API/fetch data merely because it is same-origin.

## Cache boundary

- The first online load reports the already-requested same-origin document/script/style/image resources to the worker.
- Resource warming excludes generic `fetch`/XHR resources so Bible packs and API payloads cannot enter the #98 shell cache accidentally.
- Runtime interception is limited to same-origin, in-scope navigation plus script/style/image/font requests.
- Network is tried first while online and successful shell responses refresh the cache.
- If network fails, navigation and shell assets fall back to the cache.
- The `bq-net-probe` Client Diagnostics request is never intercepted or cached, so offline diagnostics remain truthful.
- Cache names are versioned and only older BibleQuest offline-shell caches are removed during activation.

## Lifecycle

- Registration uses deployment-relative `offline-shell-sw.js` with deployment-relative `./` scope.
- Install uses `skipWaiting`; activate removes superseded shell caches and claims clients.
- Shell warming is explicitly acknowledged to the page owner before it reports `ready`.
- Disposing the page owner clears page subscribers only; it deliberately does not unregister the persistent worker.
- Unsupported browsers fail soft and leave the normal online application usable.

## Acceptance

- Architecture validation proves that only the two #98 owners contain the offline/service-worker responsibilities and that #97 remains separate.
- Edge regression verifies registration, resource filtering, warmup acknowledgement, idempotent start, unsupported behavior, and disposal.
- Browser regression loads the real app once online, confirms the shell cache is populated, switches Chromium offline, reloads, and confirms the single v3 shell still boots at 390px without horizontal overflow.
- The test also proves the Client Diagnostics cache-busting probe is absent from the shell cache.
