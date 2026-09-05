# Transform rollback notes — 2026-09-05

Production decision: quarantine Transform completely instead of continuing incremental repairs.

Observed: the user reproduced an app crash in a fresh Android browser after (1) the original assessment runtime, (2) state repair + observer-loop fixes, and (3) a separate lightweight safe Transform runtime. Repository inspection also showed several global DOM-observer layers in the wider shell. Without a real-device console/trace, attributing the remaining Android failure to one specific line would be overclaiming.

Release action: remove every Transform runtime/style and the temporary operational-hardening layer from production boot and active PWA cache. Keep Transform data untouched. Intercept any residual Transform entry and show a small fail-closed notice. Return bottom navigation to four tabs.

Re-enable Transform only after a new implementation passes an actual Android-browser test through the same UI entry point used by production.
