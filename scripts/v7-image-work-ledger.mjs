/**
 * V7 image-work ledger: transactional at the Git merge boundary.
 * Use a fresh integration head and one serialized ledger writer; if a PR
 * conflicts, rebase and re-run audit before merging. An image is never
 * accepted simply because five strings say PASS: the canonical pixel,
 * rights, Scripture and release gates still apply.
 *
 * commands:
 *  status
 *  next <scene|rights|technical|uniqueness|coordinator>
 *  claim <family> <canonicalId> <CLEAN|TYPE|THUMB> <attemptId> <producer> <sourceRevision> <sceneRevision>
 *  submit <attemptId> <repoRelativeCandidatePath>
 *  qa <attemptId> <role> <PASS|FAIL|HOLD> <evidenceLinkOrReason>
 *  audit
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dimensionsOfImage } from './v7-lane-z-cover-integrity.mjs';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const LEDGER = join(ROOT, 'data/v7/visual-assets/production-ledger.json');
const STAGING = 'data/v7/visual-assets/qa-candidates/';
const ROLES = Object.freeze(['scene', 'rights', 'technical', 'uniqueness', 'coordinator']);
const TYPES = new Set(['emotion', 'need', 'hero', 'devotional', 'book', 'past_teaching']);
const VARIANTS = new Set(['CLEAN', 'TYPE', 'THUMB']);
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,119}$/;
const SAFE_URL = /^https:\/\/github\.com\/11ll11l1l1l\/BibleQuest\/(?:pull|issues|actions|blob|commit)\//;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const keyOf = r => r.family + ':' + r.contentId + ':' + r.variant;

export function minimumSize(family, variant) {
  if (variant === 'THUMB') {
    if (family === 'emotion') return { width: 320, height: 320, aspect: 1 };
    if (family === 'hero') return { width: 640, height: 360, aspect: 16 / 9 };
    return { width: 384, height: 480, aspect: 4 / 5 };
  }
  if (family === 'emotion') return { width: 1024, height: 1024, aspect: 1 };
  if (family === 'hero') return { width: 1536, height: 864, aspect: 16 / 9 };
  return { width: 768, height: 960, aspect: 4 / 5 };
}

export function verifyGeometry(bytes, family, variant) {
  const measure = dimensionsOfImage(bytes);
  if (!['png', 'webp'].includes(measure.format))
    throw new Error('V7 artwork requires real PNG or WebP bytes, not SVG/JPEG');
  const min = minimumSize(family, variant);
  const ratioError = Math.abs(measure.width / measure.height / min.aspect - 1);
  if (measure.width < min.width || measure.height < min.height || ratioError > 0.025)
    throw new Error('image too small or wrong aspect: actual ' + measure.width + 'x' +
      measure.height + '; minimum ' + min.width + 'x' + min.height + ' aspect ' + min.aspect);
  if (bytes.length > 10_000_000) throw new Error('image exceeds 10 MB');
  return {...measure, bytes:bytes.length, sha256:sha(bytes)};
}

function safeStagedPath(attemptId, path) {
  const ext = path.endsWith('.png') ? 'png' : path.endsWith('.webp') ? 'webp' : '';
  if (!ext || path !== STAGING + attemptId + '.' + ext) throw new Error('candidate must be a unique file under ' + STAGING + attemptId);
  const full = resolve(ROOT, path);
  if (!full.startsWith(ROOT + sep) || relative(ROOT, full).startsWith('..'))
    throw new Error('candidate path traversal');
  return full;
}

export function selectNext(entries, role) {
  if (!ROLES.includes(role)) throw new Error('unknown QA role');
  // HOLD/FAIL is terminal for this reviewer on this attempt: always move on.
  return entries.filter(e => ['external_pending', 'qa_pending'].includes(e.status) && !e.qa?.[role])
    .sort((a,b) => (a.claimedAt || '').localeCompare(b.claimedAt || '') || a.attemptId.localeCompare(b.attemptId))[0] || null;
}

export function validateLedger(ledger) {
  if (ledger?.schemaVersion !== 1 || !Array.isArray(ledger?.entries)) throw new Error('ledger schema invalid');
  const attempts = new Set(), live = new Set(), seenScenes = new Set();
  for (const row of ledger.entries) {
    if (!TYPES.has(row.family) || !VARIANTS.has(row.variant) ||
      !ID.test(row.attemptId) || !ID.test(row.contentId) || !ID.test(row.producer) ||
      !row.sourceRevision || !row.sceneRevision || !row.status)
      throw new Error('invalid ledger entry: ' + JSON.stringify(row));
    if (attempts.has(row.attemptId)) throw new Error('duplicate attemptId: ' + row.attemptId);
    attempts.add(row.attemptId);
    const k = keyOf(row);
    const fingerprint = k + ':' + row.sceneRevision;
    if (seenScenes.has(fingerprint)) throw new Error('reused scene revision for ' + k);
    seenScenes.add(fingerprint);
    if (!['rejected', 'failed_technical'].includes(row.status)) {
      if (live.has(k)) throw new Error('duplicate in-flight/accepted slot: ' + k);
      live.add(k);
    }
    if (['rejected', 'failed_technical'].includes(row.status) && row.candidatePath)
      throw new Error('failed candidate path retained: ' + row.attemptId);
    if (row.status === 'qa_passed' &&
      ROLES.some(role => row.qa?.[role]?.verdict !== 'PASS' || !SAFE_URL.test(row.qa[role].evidence)))
      throw new Error('unproved five-role QA: ' + row.attemptId);
  }
  return true;
}

async function readLedger() {
  const body = JSON.parse(await readFile(LEDGER, 'utf8'));
  validateLedger(body);
  return body;
}
async function saveLedger(ledger) {
  validateLedger(ledger);
  await writeFile(LEDGER, JSON.stringify(ledger, null, 2) + '\n');
}
async function recordedCandidateExists(family, contentId, variant) {
  const path = join(ROOT, 'data/v7/visual-assets/records');
  for (const name of await readdir(path)) {
    if (!name.endsWith('.json')) continue;
    const r = JSON.parse(await readFile(join(path,name),'utf8'));
    if (r.contentType !== family || r.contentId !== contentId || !['production_ready','candidate_qa_pending'].includes(r.status)) continue;
    if (variant === 'CLEAN' || (r.variants || []).some(v => (v.kind || '').toUpperCase() ===
      ({TYPE:'WITH_TEXT',THUMB:'THUMBNAIL'}[variant] || variant))) return true;
  }
  return false;
}
async function rejectAndDelete(row, reason, status='rejected') {
  // Pre-2026-10-11 merged Lane-Z candidates live outside the new staging
  // area. Delete those exact unapproved binaries and their own sidecars,
  // never any shared or approved variant.
  if (row.externalRecordPath) {
    const recordFile=resolve(ROOT,row.externalRecordPath);
    const expected='data/v7/visual-assets/records/';
    if (!row.externalRecordPath.startsWith(expected) ||
      !/^data\/v7\/visual-assets\/records\/[a-z0-9-]+\.json$/.test(row.externalRecordPath))
      throw new Error('unsafe legacy candidate record path');
    const record=JSON.parse(await readFile(recordFile,'utf8'));
    if (record.status!=='candidate_qa_pending' ||
      record.contentId!==row.contentId || record.contentType!==row.family ||
      !/^\/v7\/images\/devotional\/bqv7-devotional-[a-z0-9-]+\.png$/.test(record.imagePath))
      throw new Error('legacy candidate no longer independently deletable');
    const src=join(ROOT,'public',record.imagePath.slice(1));
    const bytes=await readFile(src);
    if (sha(bytes)!==record.sha256) throw new Error('legacy candidate bytes differ from sidecar');
    for (const name of await readdir(join(ROOT,expected))) {
      if (name===row.externalRecordPath.split('/').at(-1) || !name.endsWith('.json')) continue;
      const other=JSON.parse(await readFile(join(ROOT,expected,name),'utf8'));
      if (other.imagePath===record.imagePath ||
        (other.status==='production_ready' && other.sha256===record.sha256))
        throw new Error('legacy candidate binary is referenced by another asset; quarantine, do not delete');
    }
    await unlink(src);
    await unlink(recordFile);
    row.failedMeasuredBytesSha256=record.sha256;
    row.externalRecordPath=null;
  }
  if (row.candidatePath) {
    const full = safeStagedPath(row.attemptId, row.candidatePath);
    await unlink(full); // Fail closed: do not claim deletion if it failed.
  }
  row.candidatePath = null;
  row.status = status;
  row.failure = reason.slice(0, 800);
  row.closedAt = new Date().toISOString();
}
export async function runLedger(command, args, root=ROOT) {
  if (root !== ROOT) throw new Error('noncanonical ledger root prohibited');
  const ledger = await readLedger(), rows = ledger.entries;
  if (command === 'status') return {
    totalAttempts:rows.length,
    byStatus:Object.fromEntries([...new Set(rows.map(r=>r.status))].map(s=>[s,rows.filter(r=>r.status===s).length])),
    entries:rows.map(({candidatePath,...r})=>({...r,candidatePath}))
  };
  if (command === 'next') return selectNext(rows,args[0]);
  if (command === 'inventory') {
    // The ledger includes all new work; existing merged records are also
    // displayed so future chats can inspect legacy work before generating.
    const dir=join(ROOT,'data/v7/visual-assets/records');
    const existing=[];
    for (const name of (await readdir(dir)).filter(n=>n.endsWith('.json')).sort()) {
      const record=JSON.parse(await readFile(join(dir,name),'utf8'));
      if (!TYPES.has(record.contentType)) continue;
      existing.push({assetId:record.assetId || null,contentType:record.contentType,
        contentId:record.contentId || null,variant:record.visualRole || 'bundle',
        status:record.status || 'unknown',sourceRevision:record.sourceRevision || null,
        imagePath:record.imagePath || null,sidecar:'data/v7/visual-assets/records/'+name});
    }
    return {trackedAttempts:rows.length,existingMergedRecords:existing.length,
      sourceOfTruthWarning:'Also check all OPEN candidate PRs; Git working tree alone cannot see their images.',
      ledgerEntries:rows,existing};
  }
  if (command === 'audit') {
    // Detect missing accepted/pending bytes and undeleted rejects.
    const missing = [];
    for (const r of rows) {
      if (r.candidatePath) {
        const full = safeStagedPath(r.attemptId,r.candidatePath);
        try {
          const bytes=await readFile(full);
          if (r.sha256 && sha(bytes)!==r.sha256) missing.push(r.attemptId+':sha_mismatch');
        } catch {missing.push(r.attemptId+':bytes_missing');}
      }
      if (['rejected','failed_technical'].includes(r.status)) {
        for(const ext of ['png','webp']) {
          try { await readFile(join(ROOT,STAGING+r.attemptId+'.'+ext)); missing.push(r.attemptId+':rejected_bytes_still_present'); }
          catch (err) { if (err.code!=='ENOENT') throw err; }
        }
      }
    }
    // Unclaimed staged files are waste/duplicate risks and cannot survive QA.
    try {
      const dir=join(ROOT,STAGING);
      for(const name of await readdir(dir)) {
        if(!/^[a-zA-Z0-9._-]+\\.(?:png|webp)$/.test(name)) {
          missing.push('unrecognized_candidate_file:'+name); continue;
        }
        const candidate=STAGING+name;
        if(!rows.some(x=>x.candidatePath===candidate))
          missing.push('unclaimed_staged_file:'+candidate);
      }
    } catch(err) {if(err.code!=='ENOENT') throw err;}
    return {pass:missing.length===0,attempts:rows.length,problems:missing};
  }
  if (command === 'claim') {
    const [family, contentId, variant, attemptId, producer, sourceRevision, sceneRevision] = args;
    if (!TYPES.has(family) || !ID.test(contentId||'') || !VARIANTS.has(variant) ||
      !ID.test(attemptId||'') || !ID.test(producer||'') || !sourceRevision || !sceneRevision)
      throw new Error('claim arguments invalid');
    if (rows.some(r=>r.attemptId===attemptId)) throw new Error('attempt already used');
    const key=family+':'+contentId+':'+variant;
    if (rows.some(r=>keyOf(r)===key && !['rejected','failed_technical'].includes(r.status)))
      throw new Error('existing active/approved attempt: '+key);
    if (rows.some(r=>keyOf(r)===key && r.sceneRevision===sceneRevision))
      throw new Error('rejected scene cannot be retried without new sceneRevision');
    if (await recordedCandidateExists(family,contentId,variant))
      throw new Error('existing production/pending record; QA or repair the existing candidate before creating more');
    rows.push({family,contentId,variant,attemptId,producer,sourceRevision,sceneRevision,
      status:'claimed',claimedAt:new Date().toISOString(),qa:{}});
  } else if (command === 'submit') {
    const [attemptId, candidatePath]=args;
    const r=rows.find(x=>x.attemptId===attemptId);
    if (!r || r.status!=='claimed') throw new Error('unclaimed or already submitted attempt');
    const full=safeStagedPath(attemptId,candidatePath);
    const bytes=await readFile(full);
    r.candidatePath=candidatePath;
    try {
      const measured=verifyGeometry(bytes,r.family,r.variant);
      if (candidatePath.split('.').at(-1)!==measured.format)
        throw new Error('extension is not actual encoding');
      r.measured=measured;
      r.sha256=measured.sha256;
      r.status='qa_pending';
    } catch(err) {
      r.failedMeasuredBytesSha256=sha(bytes);
      await rejectAndDelete(r, 'automatic geometry/format QA: '+err.message,'failed_technical');
    }
  } else if (command === 'requeue') {
    const [attemptId,role,proof]=args;
    const r=rows.find(x=>x.attemptId===attemptId);
    if (!r || !ROLES.includes(role) || r.qa?.[role]?.verdict!=='HOLD' ||
      !SAFE_URL.test(proof || '')) throw new Error('only HOLD can requeue with new GitHub evidence');
    r.reviewHistory ??= [];
    r.reviewHistory.push({role,...r.qa[role],reopenedByEvidence:proof});
    delete r.qa[role];
  } else if (command === 'qa') {
    const [attemptId,role,verdict,evidence]=args;
    const r=rows.find(x=>x.attemptId===attemptId);
    if (!r || !['qa_pending','external_pending'].includes(r.status)) throw new Error('no QA-pending attempt');
    if (!ROLES.includes(role) || !['PASS','FAIL','HOLD'].includes(verdict)
      || typeof evidence!=='string' || evidence.length<10) throw new Error('QA arguments invalid');
    if (r.qa?.[role]) throw new Error('role already reviewed attempt');
    if (verdict==='PASS' && !SAFE_URL.test(evidence))
      throw new Error('PASS requires a GitHub source evidence link, not a self-declared checkbox');
    if (verdict==='PASS') {
      // Every QA PASS must observe the same actual image bytes. This is
      // identity/geometry verification, NOT a substitute for pixel inspection.
      if (r.externalRecordPath) {
        const record=JSON.parse(await readFile(resolve(ROOT,r.externalRecordPath),'utf8'));
        if (record.status!=='candidate_qa_pending' ||
          record.contentId!==r.contentId || record.contentType!==r.family ||
          !/^\\/v7\\/images\\/devotional\\/bqv7-devotional-[a-z0-9-]+\\.png$/.test(record.imagePath))
          throw new Error('external candidate record is stale or unsafe');
        const bytes=await readFile(join(ROOT,'public',record.imagePath.slice(1)));
        const measure=verifyGeometry(bytes,r.family,r.variant);
        if (measure.sha256!==record.sha256 || measure.width!==record.width ||
          measure.height!==record.height || record.fileBytes!==bytes.length)
          throw new Error('external candidate exact bytes do not match the source record');
        if (r.sha256 && r.sha256!==measure.sha256)
          throw new Error('candidate bytes changed between reviews');
        r.sha256=measure.sha256;
        r.measured=measure;
      } else {
        if (!r.candidatePath || !r.sha256) throw new Error('no candidate binary for QA PASS');
        const bytes=await readFile(safeStagedPath(r.attemptId,r.candidatePath));
        const measured=verifyGeometry(bytes,r.family,r.variant);
        if (measured.sha256!==r.sha256) throw new Error('candidate bytes changed between reviews');
      }
    }
    r.qa ??= {};
    r.qa[role]={verdict,evidence,recordedAt:new Date().toISOString()};
    if (verdict==='FAIL') await rejectAndDelete(r,role+': '+evidence);
    else if (ROLES.every(k=>r.qa[k]?.verdict==='PASS')) r.status='qa_passed';
    // HOLD does not block other submissions: next(role) advances to the next candidate.
  } else throw new Error('commands: status | inventory | next role | claim ... | submit ... | qa ... | requeue ... | audit');
  await saveLedger(ledger);
  return command==='qa' ? {attemptId:args[0],status:rows.find(r=>r.attemptId===args[0])?.status,
    next:selectNext(rows,args[1])?.attemptId||null} : {status:'saved',command};
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const result=await runLedger(process.argv[2],process.argv.slice(3));
    console.log(JSON.stringify(result,null,2));
    if (process.argv[2]==='audit' && result.pass===false) process.exitCode=1;
  } catch(err) {console.error(err.message);process.exitCode=1;}
}
