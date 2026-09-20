import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const roots = [
  resolve(root, 'src/v6'),
  resolve(root, 'tests/v6'),
  resolve(root, 'scripts'),
];
const sourceExtensions = new Set(['.ts', '.tsx', '.mjs']);
const scriptName = /^v6-.*\.mjs$/;

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (directory.endsWith('/scripts') || directory.endsWith('\\scripts')) continue;
      files.push(...await walk(absolute));
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = extname(entry.name).toLowerCase();
    if (!sourceExtensions.has(extension)) continue;
    if ((directory.endsWith('/scripts') || directory.endsWith('\\scripts')) && !scriptName.test(basename(entry.name))) continue;
    files.push(absolute);
  }
  return files;
}

const files = [];
for (const directory of roots) files.push(...await walk(directory));
files.sort();

const failures = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  const display = relative(root, file).replaceAll('\\', '/');
  if (content.includes('\r')) failures.push(`${display}: CRLF line endings are not allowed`);
  if (content.includes('\t')) failures.push(`${display}: tab characters are not allowed`);
  if (!content.endsWith('\n')) failures.push(`${display}: file must end with a newline`);

  const lines = content.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    if (/[ \t]+$/.test(lines[index])) {
      failures.push(`${display}:${index + 1}: trailing whitespace`);
    }
  }
}

if (!files.length) failures.push('no V6 source/test/tooling files were discovered for format policy');

if (failures.length) {
  console.error('V6 format policy failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`PASS V6 format policy (${files.length} files)`);
}
