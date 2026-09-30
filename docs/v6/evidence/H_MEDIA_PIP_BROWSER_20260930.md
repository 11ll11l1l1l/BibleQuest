# V6 Media Picture-in-Picture acceptance — 2026-09-30

Accepted integration commit: `e2c6b11824404fd8f0a12655cec25d3d2df23d55`

Implementation/evidence PR: #918  
Exact tested PR head: `aecead5319ef204f9b68ee9bc3ceb16c3e48c3ba`

## Exact-head evidence

The exact PR head passed:

- V6 Phase 1 Build Gate — workflow run `36717977136`;
- BibleQuest inherited regression — workflow run `36717977206`.

Phase-1 included the dedicated `Media Picture-in-Picture Chromium acceptance` step and that step passed.

## What is accepted

BibleQuest's YouTube provider uses the official IFrame API. The provider does not expose a programmatic Picture-in-Picture command, so the V6 adapter intentionally does **not** claim a programmatic PiP capability.

The browser acceptance proves that:

- the ready YouTube iframe receives exactly one `picture-in-picture` permission token;
- existing YouTube iframe permissions such as autoplay and fullscreen are preserved;
- a normal provider load reaches the ready state in Chromium;
- a BibleQuest programmatic PiP request for YouTube fails through the explicit provider-capability boundary rather than invoking a nonexistent provider API;
- teardown destroys/releases the provider iframe without leaking it.

This satisfies the requirement that PiP works where the provider/browser surface supports it and degrades safely where the provider API does not expose programmatic control.

## Limits

This is not a claim that BibleQuest can force YouTube into PiP. YouTube/browser-native PiP UI remains provider/browser controlled. BibleQuest only grants the required iframe permission and keeps unsupported programmatic control fail-closed.
