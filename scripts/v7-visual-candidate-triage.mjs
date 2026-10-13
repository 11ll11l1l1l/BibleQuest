/**
 * Discover complete, unapproved three-file image candidates and prove their
 * local binary integrity before the built-app Chromium check. This module
 * never promotes a candidate or edits the release registry.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyV7ManualCandidate } from './v7-manual-candidate-integrity.mjs';
import { candidateQuarantineReason } from './v7-visual-candidate-policy.mjs';

import { validateLedger, verifyGeometry } from './v7-image-work-ledger.mjs';
import { LIBRARY_EMOTIONS, LIBRARY_NEEDS } from '../src/features/library/emotion-taxonomy.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const recordName = /^bqv7-(?:emotion|need)-[a-z0-9-]+-[0-9]{2,}\.json$/;

export async function triageV7ArtworkCandidates(root = ROOT, verify = verifyV7ManualCandidate) {
  const dir = join(root, 'data/v7/visual-assets/records');
  const approved = [];
  const rejected = [];
  const pending = [];
  for (const name of (await readdir(dir)).filter(x => recordName.test(x)).sort()) {
    const assetId = name.slice(0, -'.json'.length);
    let record;
    try {
      record = JSON.parse(await readFile(join(dir, name), 'utf8'));
    } catch (error) {
      rejected.push({ assetId, reason: 'unreadable candidate sidecar: ' + error.message });
      continue;
    }
    // Audited published masters are handled by the separate release auditor.
    if (record.status === 'production_ready') continue;
    // Partial records remain in the backfill queue. Never misreport them as
    // three-file candidates or as failures of the release itself.
    if (record.schemaVersion !== 2 || !Array.isArray(record.variants)
      || record.variants.length !== 3
      || !['emotion', 'need'].includes(record.contentType)) continue;
    try {
      // Do not trust a hash-only PASS when the record already documents a
      // known unsafe or visually defective candidate.
      const quarantine = candidateQuarantineReason(record);
      if (quarantine) throw new Error('candidate quarantined: ' + quarantine);
      // The verifier reads three distinct real file bytes, SHA-256, dimensions,
      // source taxonomy/wording, permitted provenance, and safe image paths.
      const measured = await verify(root, assetId);
      if (measured.technicalIntegrity !== 'PASS' || measured.assetId !== assetId
        || measured.files?.length !== 3
        || new Set(measured.files.map(file => file.kind)).size !== 3)
        throw new Error('three independently verified files required');
      approved.push({ assetId, contentType: record.contentType, status: record.status,
        files: measured.files, publicationApproved: false });
    } catch (error) {
      rejected.push({ assetId, reason: error.message });
    }
    pending.push(assetId);
  }
  return { technicallyVerified: approved, rejected, threeFileCandidates: pending,
    publicationApproved: false };
}

// One-master intake has its own evidence path; never pretend it is a legacy
// three-file bundle or add unapproved staging bytes to the production registry.
export async function triageV7SingleMasters(root = ROOT) {
  const ledger = JSON.parse(await readFile(join(root,'data/v7/visual-assets/production-ledger.json'),'utf8'));
  validateLedger(ledger);
  const technicallyVerified=[], rejected=[];
  for(const row of ledger.entries) {
    if(!['qa_pending','qa_passed'].includes(row.status) || row.variant !== 'CLEAN' || !row.candidatePath) continue;
    if(!['emotion','need','devotional'].includes(row.family)) continue;
    try {
      const path=`data/v7/visual-assets/qa-candidates/${row.attemptId}.`;
      if(![path+'png',path+'webp'].includes(row.candidatePath)) throw Error('unsafe single-master path');
      let item, sourceBlob;
      if(row.family === 'devotional') {
        if(!/^content\/v7\/devotionals\/[a-z0-9-]+\.json$/.test(row.sourcePath || ''))
          throw Error('unsafe devotional source path');
        const source=await readFile(join(root,row.sourcePath));
        sourceBlob=createHash('sha1').update(Buffer.from('blob '+source.length+'\0')).update(source).digest('hex');
        const bundle=JSON.parse(source.toString('utf8'));
        const matches=(bundle.items || []).filter(value=>value.id===row.contentId);
        if(matches.length!==1) throw Error('unknown or duplicate devotional ID');
        const canonical=matches[0];
        const digest='sha256:'+createHash('sha256').update(`${canonical.sourceContent.title}\n${canonical.sourceContent.body || ''}`,'utf8').digest('hex');
        if(canonical.type!=='devotional' || canonical.source?.kind!=='first_party'
          || canonical.rights?.status!=='verified'
          || !['display','translate'].every(use=>canonical.rights.allowedUses?.includes(use)))
          throw Error('devotional source rights incomplete');
        if(digest!==canonical.source.checksum || digest!==row.sourceChecksum
          || row.sourceRevision!==canonical.source.revision || canonical.revision!==row.sourceRevision)
          throw Error('single-master source revision changed');
        if(row.sourceContent?.title!==canonical.sourceContent.title
          || row.sourceContent?.body!==canonical.sourceContent.body)
          throw Error('devotional source content changed');
        if(typeof row.reference!=='string'
          || !/^(?:[1-3] )?[A-Z][a-z]+(?: [A-Z][a-z]+)* [1-9][0-9]*:[1-9][0-9]*(?:-[1-9][0-9]*)?$/.test(row.reference)
          || !canonical.sourceContent.body.includes(row.reference)) throw Error('unknown canonical reference');
        const labels={en:canonical.sourceContent.title};
        for(const locale of ['tl','ceb','ilo']) {
          const translations=(canonical.translations || []).filter(value=>value.locale===locale);
          if(translations.length!==1 || translations[0].reviewStatus!=='reviewed'
            || translations[0].translatedFromRevision!==canonical.revision
            || !translations[0].content?.title) throw Error('devotional translation stale or missing');
          labels[locale]=translations[0].content.title;
        }
        item={labels};
      } else {
        if(row.sourcePath !== 'src/features/library/emotion-taxonomy.js') throw Error('unsupported live wording source');
        const source=await readFile(join(root,row.sourcePath));
        sourceBlob=createHash('sha1').update(Buffer.from('blob '+source.length+'\0')).update(source).digest('hex');
        if(row.sourceChecksum !== 'gitblob:'+sourceBlob || row.sourceRevision !== 'taxonomy-'+sourceBlob)
          throw Error('single-master source revision changed');
        item=(row.family==='need'?LIBRARY_NEEDS:LIBRARY_EMOTIONS).find(item=>item.id===row.contentId);
        if(!item || !item.scripture.includes(row.reference)) throw Error('unknown canonical ID or reference');
      }
      if(row.generation?.provider !== 'OpenAI image generation' || row.generation.thirdPartyInputs !== false
        || !/^[a-f0-9]{64}$/.test(row.generation.originalSha256 || '')) throw Error('master provenance incomplete');
      if(!row.focalPoint || ['x','y'].some(k=>typeof row.focalPoint[k]!=='number'
        || !Number.isFinite(row.focalPoint[k]) || row.focalPoint[k]<0 || row.focalPoint[k]>1)) throw Error('invalid master focal point');
      const bytes=await readFile(join(root,row.candidatePath)), measured=verifyGeometry(bytes,row.family,'CLEAN');
      if(!row.candidatePath.endsWith('.'+measured.format) || measured.sha256!==row.sha256
        || ['width','height','bytes','sha256'].some(k=>row.measured?.[k]!==measured[k]))
        throw Error('single-master bytes differ from submitted identity');
      if(row.producerPreflight?.noBakedText!==true || row.producerPreflight?.singleScene!==true)
        throw Error('single-master preflight missing');
      technicallyVerified.push({assetId:row.attemptId,contentType:row.family,contentId:row.contentId,
        src:'/v7/images/qa-only/'+row.attemptId+'.'+measured.format,sourcePath:row.candidatePath,
        sha256:measured.sha256,width:measured.width,height:measured.height,
        focalPoint:row.focalPoint,labels:item.labels,reference:row.reference,
        sourceBlob,publicationApproved:false});
    } catch(error) {rejected.push({assetId:row.attemptId,reason:error.message});}
  }
  return {technicallyVerified,rejected,publicationApproved:false};
}
