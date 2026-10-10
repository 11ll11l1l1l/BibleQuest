/**
 * Manual Lane Z: read-only source-bound devotional cover queue.
 * This is not the visual-assets publication audit; it deliberately does not
 * count unverified sidecars or generation attempts as completed cover art.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const DEVOTIONAL_DIR = 'content/v7/devotionals';
const RECORD_DIR = 'data/v7/visual-assets/records';
const INITIAL_SCENES = 'data/v7/visual-assets/lane-z-initial-30-source-briefs.json';

const GUIDEBOOK_DIR = 'docs/v7/unfinished-artwork-guide';
const SCENE_FIELD = /^\*\*(?:Mandatory scene|Generate this exact story|Visual action \(mandatory\)|Unique scene|Required unique scene|Required scene|Generate only this moment|Distinct human interaction|Unique remembrance cue):\*\* (.+)$/m;
const GUIDE_FILES = Object.freeze([
  '01-first-story-shots.md', '02-second-story-shots.md', '03-third-narrative-shots.md',
  '04-prayer-wisdom-shots.md', '05-next-hour-action-shots.md', '06-faithful-action-shots.md',
  '07-reflection-practice-shots.md', '08-prayer-moments-shots.md', '09-trustworthy-sharing-shots.md',
  '10-remembrance-cue-shots.md', '11-original-backfill-shots.md'
]);

/** The source-specific construction guide, not the older cyclic fallback, owns every V7 original cover. */
async function lockedSourceBoundBriefs(root, contentFiles, initialBriefs) {
  const catalog = new Map(contentFiles.flatMap(f => f.items || []).map(item => [item.id, item]));
  const initial = new Map(initialBriefs.map(brief => [brief.devotionalId, brief]));
  const guideIds = new Set();
  const selected = [...initialBriefs];
  for (const chapter of GUIDE_FILES) {
    const text = await readFile(join(root, GUIDEBOOK_DIR, chapter), 'utf8');
    const sections = text.split(/(?=^### devotional\.biblequest\.)/m).slice(1);
    if (!sections.length) throw new Error('Empty mandatory artwork guide chapter: '+chapter);
    for (const block of sections) {
      const match = block.match(/^### (devotional\.biblequest\.[a-z0-9_]+\.\d+)\s+—\s+(.+)$/m);
      if (!match) throw new Error('Malformed guidebook content-ID heading in '+chapter);
      const id = match[1], title = match[2].trim(), item = catalog.get(id);
      if (guideIds.has(id)) throw new Error('Duplicate guidebook scene ID: '+id);
      guideIds.add(id);
      if (!item || item.source?.kind !== 'first_party' || !eligible(item)) throw new Error('Guidebook content missing/rights-ineligible: '+id);
      if (title !== item.sourceContent?.title) throw new Error('Stale guidebook title: '+id);
      if (!block.includes(item.revision)) throw new Error('Stale guidebook revision: '+id);
      const scene = block.match(SCENE_FIELD)?.[1]?.trim();
      if (!scene || scene.length < 80) throw new Error('Guidebook scene missing or insufficient: '+id);
      // Initial 30 remain exactly bound to their independently maintained source JSON.
      if (initial.has(id)) {
        if (initial.get(id).scene !== scene) throw new Error('First-30 scene drift: '+id);
        continue;
      }
      if (!block.includes(item.source.checksum) || !block.includes(item.sourceContent.body))
        throw new Error('Guidebook source checksum/body stale: '+id);
      const lines=block.split('\n');
      const framing=lines.find(line=>/^\*\*(?:Framing|Camera\/light|Frame\/lighting|Visual geometry|Scene craft|Photography|Composition):\*\*/.test(line))
        || 'Eye-level natural editorial composition preserving the guidebook scene';
      const light=lines.find(line=>/^\*\*(?:Light|Lighting|Camera\/light|Frame\/lighting|Scene craft):\*\*/.test(line))
        || 'Naturalistic soft light as described by the exact per-ID construction guide';
      const safeLine=lines.find(line=>/(?:safe|quiet|overlay|title)/i.test(line) && /\b(?:bottom|left|right)\b/i.test(line));
      const safe=safeLine?.match(/\b(bottom|left|right)\b/i)?.[1]?.toLowerCase() || 'bottom';
      selected.push({
        devotionalId:id, sourceRevision:item.revision, sourceTitle:title,
        sourceBodyAnchor:item.sourceContent.body.slice(0,40),
        scene, composition:framing.replace(/\*\*/g,'').trim(), lighting:light.replace(/\*\*/g,'').trim(),
        textSafeRegion:safe, altText:'Documentary-style original scene: '+scene,
        visualFingerprint:'locked-v7-guide:'+id
      });
    }
  }
  for (const [id,item] of catalog) if (eligible(item) && item.source?.kind === 'first_party' && !guideIds.has(id))
    throw new Error('Missing mandatory V7 image guidebook shot: '+id);
  if (guideIds.size !== 300 || selected.length !== 300)
    throw new Error('Expected exactly 300 locked source-bound guide shots, got '+guideIds.size+'/' + selected.length);
  return selected;
}

const VALID_ID = /^devotional\.[a-z0-9._-]+$/;
const OWNED = ['display', 'modify'];

const SCENES = Object.freeze([
  'a kitchen table with a folded letter and one softly lit window',
  'an urban commuter standing on a rain-washed station platform',
  'a parent quietly preparing breakfast before the household wakes',
  'an apprentice tending a single green shoot on a small balcony',
  'two friends talking face to face on a public park bench',
  'a nurse leaving a busy hospital after an evening shift',
  'a lone cyclist stopping beneath trees beside a village road',
  'hands repairing a cracked ceramic bowl at a wooden workbench',
  'a student organizing scattered notes at a sunlit library desk',
  'a family setting an extra place at the dinner table',
  'a traveler looking down a winding alley from a market entrance',
  'a neighbor helping carry groceries through a quiet courtyard',
  'an artist washing brushes after completing a small canvas',
  'a gardener lifting a fragile sapling into fresh soil',
  'a person pausing beside a footbridge after a long walk',
  'a small fishing boat tied safely to its mooring after rain',
  'a baker opening the shutters before sunrise',
  'an old friend writing a thoughtful note at a café',
  'a child and grandparent caring for plants by a garden wall',
  'a mechanic checking a repaired bicycle wheel in soft daylight',
  'a worker taking a reflective pause on a rooftop terrace',
  'two siblings sharing a warm drink beside an open doorway',
  'a person placing one stone at a time along a garden path',
  'a teacher erasing a chalkboard at the end of the school day',
  'a volunteer arranging clean blankets in a community center',
  'a musician carefully restringing an acoustic guitar',
  'a coastal pedestrian sheltering under a simple blue umbrella',
  'a person reopening a long-closed notebook at home',
  'an elderly couple walking together through a local garden',
  'a young adult planting herbs in recycled pottery by a window',
]);
const VIEWS = ['wide establishing scene with an intimate focal gesture',
  'eye-level environmental portrait with natural negative space',
  'close tactile detail anchored by a human presence',
  'quiet over-the-shoulder view with believable depth',
  'cinematic 3/4 portrait with contextual architecture',
  'medium distance observational frame with expressive posture'];
const LIGHT = ['overcast morning daylight', 'soft side-lit golden morning',
  'muted late-afternoon sunlight', 'blue-hour ambient window light',
  'gentle diffused daylight after rain', 'warm domestic lamp and cool exterior'];
const PALETTE = ['stone blue and warm linen', 'earth brown and pale sage',
  'dusty teal and neutral cream', 'muted slate and amber', 'forest green and soft clay',
  'indigo shadows and pale gold'];

function token(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function eligible(item) {
  return item.source?.kind === 'first_party'
    && item.rights?.status === 'verified'
    && OWNED.every(use => item.rights.allowedUses?.includes(use));
}
function coverPath(id) {
  const suffix = token(id.replace(/^devotional\./, ''));
  return '/v7/images/devotional/bqv7-devotional-' + suffix + '-01.webp';
}
function themeFor(item) {
  return (item.taxonomyLinks || []).filter(t => ['emotion','need','topic'].includes(t.kind))
    .slice(0,4).map(t => t.id).join(', ');
}
export function buildLaneZCoverQueue(contentFiles, visualRecords = [], sourceBriefs = []) {
  const items = new Map(), records = new Map(), briefs = new Map(), identities = new Set();
  for (const brief of sourceBriefs) {
    if (briefs.has(brief.devotionalId) || !VALID_ID.test(brief.devotionalId))
      throw new Error('Duplicate/invalid source-bound scene brief: ' + brief.devotionalId);
    for (const key of ['sourceRevision','sourceTitle','sourceBodyAnchor','scene','composition','lighting','visualFingerprint','textSafeRegion','altText']) {
      if (typeof brief[key] !== 'string' || brief[key].trim().length < (key==='scene'?80:key==='sourceRevision'?2:3))
        throw new Error('Incomplete scene brief '+brief.devotionalId+': '+key);
    }
    if (identities.has(brief.visualFingerprint)) throw new Error('Duplicate source-bound visual fingerprint: '+brief.visualFingerprint);
    identities.add(brief.visualFingerprint);
    briefs.set(brief.devotionalId,brief);
  }
  for (const source of contentFiles) {
    if (!Array.isArray(source.items)) throw new Error('Missing devotional items: ' + source.path);
    for (const item of source.items) {
      if (item.type !== 'devotional') continue;
      if (!VALID_ID.test(item.id) || items.has(item.id)) throw new Error('Duplicate/invalid devotional ID: ' + item.id);
      items.set(item.id, { item, sourcePath: source.path });
    }
  }
  for (const record of visualRecords) {
    if (record.contentType !== 'devotional' || record.visualRole !== 'devotional_cover') continue;
    if (!items.has(record.contentId)) throw new Error('Unknown devotional cover contentId: ' + record.contentId);
    const matches = records.get(record.contentId) || [];
    matches.push(record);
    records.set(record.contentId, matches);
  }
  for (const id of briefs.keys()) {
    const source=items.get(id)?.item;
    if (!source || !eligible(source)) throw new Error('Brief references missing/rights-ineligible devotional: '+id);
    const brief=briefs.get(id);
    const title=String(source.sourceContent?.title||'').trim();
    const body=String(source.sourceContent?.body||'');
    if (brief.sourceRevision!==source.revision || brief.sourceTitle!==title || !body.includes(brief.sourceBodyAnchor))
      throw new Error('Stale source-bound scene brief for '+id);
  }
  const sorted = [...items.values()].sort((a,b) => a.item.id.localeCompare(b.item.id,'en'));
  const queue = sorted.map(({item,sourcePath},index) => {
    const art = records.get(item.id) || [];
    const candidate = art.length > 0;
    const title = String(item.sourceContent?.title || '').trim();
    if (!title) throw new Error('Missing source devotional title: ' + item.id);
    const ownable = eligible(item);
    const brief = briefs.get(item.id);
    const scene = brief?.scene || SCENES[index % SCENES.length];
    const view = brief?.composition || VIEWS[Math.floor(index / SCENES.length) % VIEWS.length];
    const light = brief?.lighting || LIGHT[Math.floor(index / (SCENES.length * VIEWS.length)) % LIGHT.length];
    const palette = PALETTE[(index + Math.floor(index / SCENES.length)) % PALETTE.length];
    const body = String(item.sourceContent?.body || '').replace(/\s+/g,' ').trim();
    const prompt = [
      'Create exactly ONE standalone original 4:5 portrait devotional cover image (not a grid, collage, UI mockup or poster).',
      'BibleQuest content ID: ' + item.id + '. Editorial subject: ' + title + '.',
      'Devotional message for narrative guidance only: ' + body.slice(0,550),
      'Scene direction: ' + scene + '; ' + view + '; ' + light + '; ' + palette + '.',
      'Premium cinematic editorial realism, psychologically specific, purposeful storytelling, natural anatomy, diverse contemporary life, restrained color, focal safe for phone crop.',
      'Reserve a naturally low-detail '+(brief?.textSafeRegion||'bottom')+' region for a live localized title overlay. NO rendered text, letters, books with legible printing, verse quotations, numbers, watermark, UI, logo, celebrity or copied stock photograph.',
      'Use source meaning; do not assume the scene itself verifies any Scripture. Avoid generic mountains, sunsets, stock prayer hands and repetitive crosses.'
    ].join(' ');
    return {
      order: index + 1, devotionalId: item.id, sourcePath, revision: item.revision || null,
      title, topicTags: themeFor(item), rightsEligible: ownable, sourceBodyExcerpt: body.slice(0,260),
      visualIdentity: brief?.visualFingerprint || 'lane-z:' + String(index+1).padStart(3,'0') + ':' + token(title),
      artDirectionSource: brief ? (brief.visualFingerprint.startsWith('locked-v7-guide:') ? 'locked_construction_guidebook' : 'human_source_bound_first30') : 'deterministic_fallback_needs_editorial_review',
      sourceBodyAnchor: brief?.sourceBodyAnchor || null,
      textSafeRegion: brief?.textSafeRegion || 'bottom',
      altTextDraft: brief?.altText || null,
      scene, view, light, palette, prompt, expectedCleanPath: coverPath(item.id),
      existingAssetIds: art.map(x => x.assetId).sort(),
      // Neither 'production_ready' sidecar claims nor prompt generation establish
      // byte-level and visual certification; separate audit evidence required.
      verifiedComplete: false,
      state: !ownable ? 'hold_rights' : candidate ? 'existing_asset_requires_independent_audit' : 'not_generated'
    };
  });
  return {
    schemaVersion: 1, lane: 'Z', runMode: 'manual_only',
    provenance: 'content/v7/devotionals plus current visual sidecars',
    status: 'planning_only_no_visual_approval',
    counts: {
      devotionalRecords: queue.length,
      eligible: queue.filter(r=>r.rightsEligible).length,
      existingCoverRecords: queue.filter(r=>r.existingAssetIds.length>0).length,
      verifiedComplete: 0, // deliberately not inferred from metadata claims
      notGenerated: queue.filter(r=>r.state==='not_generated').length,
      requiresAudit: queue.filter(r=>r.state==='existing_asset_requires_independent_audit').length,
      rightsHold: queue.filter(r=>r.state==='hold_rights').length
    },
    queue
  };
}
export async function readLaneZCoverQueue(root = ROOT) {
  const names = (await readdir(join(root,DEVOTIONAL_DIR))).filter(x=>x.endsWith('.json')).sort();
  const files = await Promise.all(names.map(async name => ({
    path: DEVOTIONAL_DIR+'/'+name,
    items: JSON.parse(await readFile(join(root,DEVOTIONAL_DIR,name),'utf8')).items
  })));
  const recordNames = (await readdir(join(root,RECORD_DIR))).filter(n=>n.endsWith('.json')&&!n.endsWith('-derivatives.json'));
  const records = await Promise.all(recordNames.map(async n=>
    JSON.parse(await readFile(join(root,RECORD_DIR,n),'utf8'))));
  const briefFile=JSON.parse(await readFile(join(root,INITIAL_SCENES),'utf8'));
  if (briefFile.schemaVersion!==1 || !Array.isArray(briefFile.entries))
    throw new Error('Invalid source-bound Lane Z scene brief catalog');
  const sourceBoundBriefs = await lockedSourceBoundBriefs(root,files,briefFile.entries);
  return buildLaneZCoverQueue(files,records,sourceBoundBriefs);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await readLaneZCoverQueue();
  const all = process.argv.includes('--all');
  const limitArg = process.argv.find(a=>a.startsWith('--limit='));
  const idArg = process.argv.find(a=>a.startsWith('--id='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 1;
  if (!all && (!Number.isInteger(limit) || limit < 1 || limit > 300)) throw new Error('Invalid --limit');
  if (idArg && (all || limitArg)) throw new Error('Select one devotional ID or a batch, not both');
  const selected = idArg
    ? result.queue.filter(x=>x.devotionalId === idArg.slice('--id='.length) && x.rightsEligible)
    : all ? result.queue : result.queue.filter(x=>x.rightsEligible && x.state!=='hold_rights').slice(0,limit);
  if (idArg && selected.length !== 1) throw new Error('Unknown or rights-ineligible devotional ID');
  // The default is ONE source-bound image, not a 10-panel contact sheet.
  console.log(JSON.stringify({...result,queue:selected},null,2));
}
