import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const policy = JSON.parse(readFileSync(new URL('../docs/v6/V6_CONTENT_MEDIA_PROVENANCE_POLICY.json', import.meta.url), 'utf8'));
const baseline = String(policy?.baseline?.sha || '');
if (!/^[0-9a-f]{40}$/.test(baseline)) throw new Error('Content/media provenance policy requires an exact V5 baseline SHA.');

try {
  execFileSync('git', ['cat-file', '-e', baseline + '^{commit}'], { stdio: 'ignore' });
} catch {
  throw new Error('V5 provenance baseline is missing locally. Fetch exact commit ' + baseline + ' before running this gate.');
}

const output = execFileSync('git', ['diff', '--name-status', '--find-renames', baseline, 'HEAD', '--'], {
  encoding: 'utf8',
});
const prefixes = Array.isArray(policy?.trackedDelta?.pathPrefixes) ? policy.trackedDelta.pathPrefixes : [];
const mediaExtensions = new Set((policy?.trackedDelta?.mediaExtensions || []).map(value => String(value).toLowerCase()));
const forbiddenBinary = new Set((policy?.trackedDelta?.forbiddenUnreviewedAudioVideoExtensions || []).map(value => String(value).toLowerCase()));
const reviewed = new Map((policy.reviewedChanges || []).map(entry => [entry.path, entry]));

function changedPath(line) {
  const parts = line.split('\t');
  const status = parts[0] || '';
  if (!status || status.startsWith('D')) return null;
  return status.startsWith('R') || status.startsWith('C') ? parts[2] : parts[1];
}

function tracked(path) {
  if (!path) return false;
  return prefixes.some(prefix => path.startsWith(prefix)) || mediaExtensions.has(extname(path).toLowerCase());
}

const changed = output.split(/\r?\n/).filter(Boolean).map(changedPath).filter(Boolean);
const relevant = [...new Set(changed.filter(tracked))].sort();
const reviewedPaths = [...reviewed.keys()].sort();

if (JSON.stringify(relevant) !== JSON.stringify(reviewedPaths)) {
  const missing = relevant.filter(path => !reviewed.has(path));
  const stale = reviewedPaths.filter(path => !relevant.includes(path));
  throw new Error(
    'V6 content/media provenance inventory is stale.'
    + (missing.length ? ' Unreviewed: ' + missing.join(', ') + '.' : '')
    + (stale.length ? ' No longer changed: ' + stale.join(', ') + '.' : ''),
  );
}

for (const path of relevant) {
  const entry = reviewed.get(path);
  if (!entry || entry.redistribution !== 'allowed' || !String(entry.provenanceKind || '').trim() || !String(entry.evidence || '').trim()) {
    throw new Error(path + ' lacks reviewed provenance/redistribution evidence.');
  }
  if (forbiddenBinary.has(extname(path).toLowerCase())) {
    throw new Error('V6 may not add/modify hosted audio/video binary without a dedicated exact-file rights manifest: ' + path);
  }
}

for (const surface of policy.runtimeExternalMedia || []) {
  if (!String(surface?.id || '').trim() || surface.bibleQuestHostsOrTransformsThirdPartyBytes !== false) {
    throw new Error('External media surface must explicitly prove BibleQuest does not host/transform provider bytes.');
  }
  if (!Array.isArray(surface.evidence) || surface.evidence.length < 1) {
    throw new Error('External media surface lacks evidence references: ' + surface.id);
  }
}

console.log('PASS V6 content/media provenance delta:', relevant.length, 'reviewed changed path(s); no unreviewed hosted audio/video delta.');
