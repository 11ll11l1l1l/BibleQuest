import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/features/daily-mission/index.js',import.meta.url),'utf8');

for(const token of[
  'data-daily-text-form novalidate',
  'aria-required="true"',
  'aria-describedby="daily-response-error"',
  "if(!response)",
  "setAttribute?.('aria-invalid','true')",
  'Write a response before saving this step.',
  'field?.focus?.()',
  "removeAttribute?.('aria-invalid')"
])assert.ok(source.includes(token),`Daily Journey required-response feedback lost: ${token}`);

console.log('V5 Daily Journey required-response presentation contract: PASS');
