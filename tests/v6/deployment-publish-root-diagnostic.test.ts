import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyDeployedArtifact } from '../../scripts/v6-deployment-verify.mjs';

const exactSha = 'a'.repeat(40);
const exactArtifact = 'b'.repeat(64);

test('deployment verifier fails fast with a publish-root diagnostic when metadata resolves to HTML', async () => {
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
    /Cloudflare Pages appears to be serving an HTML fallback or a different publish root; verify the Pages build output directory publishes dist-v6 unchanged/,
  );

  assert.ok(fetches <= 2, `HTML fallback should fail without the 18-attempt propagation wait; got ${fetches} fetches`);
});
