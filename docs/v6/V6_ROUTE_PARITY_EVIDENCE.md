# V6 route parity evidence

Baseline: `7420bbba789ce21e02ac667f98558681e71d2a28`
Candidate base: `16d41b9b299917d1dd602706029e7ea49600af8d`

Source comparison found no baseline user-facing route removed from V6. Current V6 adds `ministry-announcements`.

Built-browser coverage currently omits four live routes from its canonical direct-deep-link set: `bible-quest`, `explorer`, `challenges`, and `ministry-announcements`. These must be added and pass against built output before the route/feature parity row can be promoted.
