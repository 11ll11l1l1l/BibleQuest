# V6 exact-SHA Cloudflare deployment verification

Status: repository-side verifier ready; automatic PR enforcement intentionally deferred.

## Purpose

V6 must prove that a Cloudflare Pages deployment is byte-for-byte the Vite `dist-v6` artifact produced from one exact source SHA. The verifier checks:

- approved `*.mybiblequest.pages.dev` HTTPS origin only;
- full 40-character source SHA in `bq-build.json`;
- matching `sourceSha` in `bq-artifact-integrity.json`;
- every declared deployed file byte length and SHA-256;
- aggregate artifact digest and total bytes.

Run the **V6 Deployed Artifact Verification** workflow manually with the exact Cloudflare preview URL and, optionally, the full source SHA.

## Why automatic PR enforcement is not enabled yet

The historical #533 proof showed that the current Cloudflare Pages Git project deploys the legacy repository/root output instead of the Vite `dist-v6` artifact. Turning the verifier on for every PR before fixing that project setting would create a permanently failing gate unrelated to the PR's code.

Before enabling the `pull_request` trigger, the Cloudflare Pages project must build V6 and publish `dist-v6`. The account-side project should use the V6 build command and output directory that correspond to this repository's accepted Vite build. After that external setting is confirmed, enable PR preview discovery/enforcement and require this workflow for V6 integration.

No deployment is considered exact-SHA certified until this verifier succeeds against the deployed URL.
