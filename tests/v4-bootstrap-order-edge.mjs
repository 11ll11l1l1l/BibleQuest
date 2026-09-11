// Static regression test for the known BibleQuest bootstrap failure class:
// a service instantiated in src/app/bootstrap.js before one of its own
// dependencies has been declared. This is a temporal-dead-zone
// ReferenceError at module-evaluation time, and it has caused two real
// startup-crashing regressions. This test parses the actual source and
// asserts every identifier *referenced* (not merely used as an object-literal
// key, and not a property access target) inside a service's constructor call
// was declared by an earlier `const`/`let` in the same file.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const file = path.resolve(import.meta.dirname, '..', 'src', 'app', 'bootstrap.js');
const source = fs.readFileSync(file, 'utf8');
const lines = source.split('\n');

const declaredAt = new Map();
const declRe = /^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/;
lines.forEach((line, index) => {
  const match = declRe.exec(line);
  if (match && !declaredAt.has(match[1])) declaredAt.set(match[1], index + 1);
});

assert.ok(declaredAt.size > 20, 'Expected bootstrap.js to declare a substantial number of services; parser likely broke on a source-format change.');

// Returns true if `dep` appears in `text` as a genuine identifier reference:
// not immediately preceded by `.` (property access) and not immediately
// followed by `:` (object-literal key position, e.g. `session:Object.freeze(...)`).
function referencesIdentifier(text, dep) {
  const tokenRe = new RegExp(`(^|[^\\w$.])${dep}($|[^\\w$:])`);
  let index = 0;
  while (index < text.length) {
    const idx = text.indexOf(dep, index);
    if (idx === -1) return false;
    const before = idx > 0 ? text[idx - 1] : '';
    const after = idx + dep.length < text.length ? text[idx + dep.length] : '';
    const boundaryBefore = !/[\w$.]/.test(before);
    const boundaryAfter = !/[\w$]/.test(after);
    const isPropertyAccess = before === '.';
    const isObjectKey = boundaryAfter && after === ':';
    if (boundaryBefore && boundaryAfter && !isPropertyAccess && !isObjectKey) return true;
    index = idx + dep.length;
  }
  return false;
}

const failures = [];
lines.forEach((line, index) => {
  const declMatch = declRe.exec(line);
  if (!declMatch) return;
  const [, name] = declMatch;
  const thisLine = index + 1;
  const rhs = line.slice(line.indexOf('=') + 1);
  if (!/create[A-Za-z]*\(/.test(rhs)) return; // only check constructor-style declarations
  for (const [dep, depLine] of declaredAt) {
    if (dep === name) continue;
    if (depLine >= thisLine && referencesIdentifier(rhs, dep)) {
      failures.push(`Line ${thisLine}: '${name}' references '${dep}', but '${dep}' is not declared until line ${depLine}. This is the exact temporal-dead-zone crash class that has broken app startup twice before.`);
    }
  }
});

if (failures.length) {
  failures.forEach(message => console.error(`- ${message}`));
  assert.fail(`bootstrap.js has ${failures.length} dependency-ordering violation(s). See messages above.`);
}

console.log('BibleQuest v4 bootstrap dependency-ordering regression passed.');
