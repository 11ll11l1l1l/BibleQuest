import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','ui','media-visual-polish.css'),'utf8');
const mediaCss=fs.readFileSync(path.join(root,'src','ui','media-library.css'),'utf8');
const recordingsCss=fs.readFileSync(path.join(root,'src','ui','recordings.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const recordingsLink='<link rel="stylesheet" href="src/ui/recordings.css">';
const mediaLink='<link rel="stylesheet" href="src/ui/media-library.css">';
const polishLink='<link rel="stylesheet" href="src/ui/media-visual-polish.css">';
assert(index.includes(recordingsLink),'Missing established Recordings stylesheet link.');
assert(index.includes(mediaLink),'Missing established Media Library stylesheet link.');
assert(index.includes(polishLink),'Missing Media visual polish stylesheet link.');
assert(index.indexOf(recordingsLink)<index.indexOf(polishLink),'Media visual polish must load after Recordings base CSS.');
assert(index.indexOf(mediaLink)<index.indexOf(polishLink),'Media visual polish must load after Media Library base CSS.');

assert(css.includes('Presentation only: no playback, media source, routing, persistence, permission,'),'Media visual layer must declare its presentation-only boundary.');
for(const selector of ['.bq-media-head h1,','.bq-media-tabs button,','.bq-media-card,','.bq-recording-card{','.bq-media-player-shell,','.bq-media-frame,']){
  assert(css.includes(selector),`Media visual layer is missing expected decorative surface ${selector}`);
}

const forbidden=/\b(?:display|position|grid-template(?:-columns|-rows)?|grid-column|grid-row|flex(?:-direction|-basis|-grow|-shrink)?|width|height|min-width|min-height|max-width|max-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|overflow(?:-[xy])?|aspect-ratio|transform|transition|cursor|pointer-events|z-index|order|font(?:-size|-weight|-family)?|line-height|resize|touch-action|text-align)\s*:/i;
assert(!forbidden.test(css),'Media visual polish must not introduce layout, typography geometry, motion or interaction declarations.');
assert(!/@media\s*\(max-width|@media\s*\(min-width/i.test(css),'Media visual polish must not introduce or change responsive breakpoints.');
assert(!/url\s*\(/i.test(css),'Media visual polish must not add remote or file-backed runtime dependencies.');
assert(!/animation\s*:|@keyframes/i.test(css),'Media visual polish must not add animation behavior.');
assert(css.includes('@media(prefers-contrast:more)'),'Media visual polish must keep an explicit higher-contrast presentation path.');

assert(mediaCss.includes('.bq-media-layout{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr);gap:16px;align-items:start}'),'Media Library layout ownership must remain in media-library.css.');
assert(mediaCss.includes('.bq-media-tabs button,.bq-media-controls button{min-height:44px;'),'Media Library touch-target ownership must remain in media-library.css.');
assert(mediaCss.includes('@media(max-width:760px)'),'Media Library responsive breakpoint ownership must remain in media-library.css.');
assert(recordingsCss.includes('.bq-recordings-layout{display:grid;grid-template-columns:minmax(240px,.8fr) minmax(0,1.2fr);gap:16px;align-items:start}'),'Recordings layout ownership must remain in recordings.css.');
assert(recordingsCss.includes('.bq-recording-controls button{min-height:44px;min-width:64px}'),'Recordings touch-target ownership must remain in recordings.css.');
assert(recordingsCss.includes('@media(max-width:720px)'),'Recordings responsive breakpoint ownership must remain in recordings.css.');

console.log('BibleQuest v3 Media and Recordings visual polish static contract passed.');
