import assert from 'node:assert/strict';
import { workflowInvokesNode } from '../scripts/v3-workflow-contract.mjs';

assert.equal(workflowInvokesNode('run: node tests/example.mjs','tests/example.mjs'),true);
assert.equal(workflowInvokesNode('run: timeout 240s node tests/example.mjs','tests/example.mjs'),true);
assert.equal(workflowInvokesNode('run: for script in scripts/a.mjs scripts/b.mjs; do node "$script"; done','scripts/b.mjs'),true);
assert.equal(workflowInvokesNode('run: for test in tests/a.mjs tests/b.mjs; do timeout 240s node "$test"; done','tests/b.mjs'),true);
assert.equal(workflowInvokesNode('# run: node tests/example.mjs','tests/example.mjs'),false);
assert.equal(workflowInvokesNode('run: for test in tests/example.mjs; do echo "$test"; done','tests/example.mjs'),false);
assert.equal(workflowInvokesNode('run: node tests/example.mjs.backup','tests/example.mjs'),false);
assert.equal(workflowInvokesNode('run: for other in tests/example.mjs; do node "$test"; done','tests/example.mjs'),false);

console.log('BibleQuest v3 workflow invocation contract edge regression passed.');
