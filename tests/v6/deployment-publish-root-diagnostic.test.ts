import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyDeployedArtifact } from '../../scripts/v6-deployment-verify.mjs';

const exactSha = 'a'.repeat(40);
const exactArtifact = 'b'.repeat(64);

test('deployment verifier fails fast when Pages metadata resolves to HTML fallback', async () => {
  let fetches = 0;
  const fetchImpl = async () => {
    fetches += 1;
    return new Response('<!doctype html><html><body>BibleQuest shell</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  };

  await assert.rejects(
    verifyDeployedArtifact({
      deploymentUrl: 'https://preview.mybiblequest.pages.dev',
      expectedSha: exactSha,
      expectedArtifactSha256: exactArtifact,
      fetchImpl,
    }),
    /Cloudflare Pages appears to be serving an HTML fallback or a different publish root/,
  );

  assert.ok(fetches <= 2, `HTML fallback should fail immediately, got ${fetches} metadata fetches`);
});
