# Lane A4 — Library strong-contrast measurement

Date: 2026-10-07

## Scope

Close the deterministic measured-contrast portion of the V7 Library changed-surface accessibility row without changing content, backend, tenant, routing, or release ownership.

## Defect found

The inherited accessibility stylesheet predates the V6 black theme. Its higher-specificity strong-contrast selectors force light-theme literals onto the black V6 surface:

- panel paragraph/status foreground `#4f5f55` over `#101212` computes to about **2.78:1**;
- body foreground `#17291f` over `#080909` computes to about **1.30:1**.

Those values are below the 4.5:1 target used by this A4 browser evidence for normal text.

## Fix

The final V6 black-theme layer now rebinds the legacy strong-contrast selectors to the dark semantic palette:

- body → `--bq-text`;
- panel paragraph, brand secondary text, and bottom-nav text → `--bq-text-secondary`;
- inherited `--muted` / `--line` aliases → V6 dark semantic tokens.

The normal black theme is unchanged when strong contrast is not selected.

## Browser evidence

The existing real built-artifact Library Chromium matrix now computes foreground/background luminance from rendered CSS and requires at least 4.5:1 for:

- Library heading;
- Library introductory text;
- search label;
- search input text;
- primary action text;
- secondary action text;
- Library status text.

The matrix still runs at 320/390/430 px for en/tl/ceb with xlarge text, strong contrast, and reduced motion. It continues to use the real signed-out built route with no injected Library service or fabricated publication data.

## Boundary

This closes only deterministic rendered text/control-text contrast for the named signed-out Library states once the exact PR-head workflow passes. It does **not** claim:

- human screen-reader/assistive-tool announcement quality;
- populated approved Library content or text-scaling observation;
- authenticated ONE 2 ONE accessibility;
- physical-device, installed-PWA, deployed-environment, or final release-candidate certification;
- editorial, rights, translation, or publication approval.
