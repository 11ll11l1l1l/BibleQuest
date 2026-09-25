import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { renderGamesErrorView, renderGamesLoadingView } from '../../src/features/games/views/status.js';

const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]??char));
const routeSource=await readFile(new URL('../../src/features/games/index.js',import.meta.url),'utf8');

test('Games route delegates loading and error presentation to bounded status views',()=>{
  assert.match(routeSource,/renderGamesLoadingView/);
  assert.match(routeSource,/renderGamesErrorView/);
  assert.doesNotMatch(routeSource,/error\?\.message/);
  assert.doesNotMatch(routeSource,/toSafeFailure\(error\)/);
});

test('Games loading view keeps status semantics and escapes activity text',()=>{
  const html=renderGamesLoadingView({text:'Loading <secret>',escapeHtml});
  assert.match(html,/role="status"/);
  assert.match(html,/Loading &lt;secret&gt;/);
  assert.doesNotMatch(html,/Loading <secret>/);
});

test('Games error view does not expose arbitrary thrown error text',()=>{
  const html=renderGamesErrorView({error:new Error('token=private-secret'),escapeHtml});
  assert.match(html,/role="alert"/);
  assert.match(html,/data-game-error="unknown"/);
  assert.match(html,/Something went wrong\. Try again\./);
  assert.doesNotMatch(html,/private-secret/);
  assert.match(html,/data-game-launcher>Back to games/);
});

test('Games error view uses shared status-specific safe copy',()=>{
  const html=renderGamesErrorView({error:{status:401,message:'backend detail'},escapeHtml});
  assert.match(html,/data-game-error="unauthorized"/);
  assert.match(html,/Sign in again to continue\./);
  assert.doesNotMatch(html,/backend detail/);
});
