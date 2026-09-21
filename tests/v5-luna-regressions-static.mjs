import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const index=read('index.html');
const guards=read('src/app/v5-luna-regression-guards.js');
const ministry=read('src/app/ministry-hub.js');
const bootstrap=read('src/app/bootstrap.js');

// BQ-001: Daily Journey must show explicit in-app validation, identify the
// textarea as invalid, connect it to the message, and focus the field.
assert(guards.includes("const DAILY_SAVE = '[data-daily-save]'"),'BQ-001 guard must target Daily Journey save action');
assert(guards.includes('Please enter a response before saving this step.'),'BQ-001 must expose visible required-response guidance');
assert(guards.includes("textarea.setAttribute('aria-invalid', 'true')"),'BQ-001 must expose invalid state accessibly');
assert(guards.includes("textarea.setAttribute('aria-describedby'"),'BQ-001 must associate validation guidance with the textarea');
assert(guards.includes('textarea.focus()'),'BQ-001 must return focus to the invalid response field');
assert(guards.includes("document.addEventListener('invalid'"),'BQ-001 must handle native constraint-validation failures');

// BQ-002: Ministry Hub Calendar must delegate directly to the verified
// Calendar route, and the bootstrap route table must still own that route.
assert(/id:'calendar',[^\n]*route:'calendar',available:true/.test(ministry),'BQ-002 Ministry Hub Calendar must remain available at the calendar route');
assert(bootstrap.includes("'ministry-hub':()=>ministryHubPage({hub:ministryHub,onNavigate:navigateGeneral"),'BQ-002 Ministry Hub must delegate tool routes to the app router');
assert(bootstrap.includes("calendar:()=>calendarPage({calendar,onBack:()=>router.navigate('more')"),'BQ-002 verified Calendar route must remain registered');

// BQ-003 now has real state recovery rather than a warning-only workaround.
const games=read('src/app/games.js');
const gamesView=read('src/features/games/index.js');
assert(games.includes("const ACTIVE_ROUND_KEY='games-active-round'"),'BQ-003 must persist the active standard quiz round.');
assert(games.includes('restoreActiveRound(storage.read(ACTIVE_ROUND_KEY,null))'),'BQ-003 must restore an active quiz during service recreation.');
assert(games.includes('persistActiveRound();'),'BQ-003 must checkpoint quiz transitions.');
assert(gamesView.includes('render(games.getState())'),'BQ-003 Play mount must render restored state instead of clearing it.');
assert(!guards.includes("window.addEventListener('beforeunload'"),'BQ-003 must not retain the obsolete reload-warning workaround.');

// Integration: the architecture requires exactly one script entry
// (index.html boots only bootstrap.js). These guards must be imported and
// explicitly invoked by bootstrap.js itself, not loaded as a second
// top-level <script> - that was the actual bug this test previously
// enshrined instead of catching.
const guardTag='<script type="module" src="src/app/v5-luna-regression-guards.js"></script>';
assert(!index.includes(guardTag),'Luna regression guards must not be a second top-level <script> entry - index.html must boot exactly one script.');
assert(bootstrap.includes("import { installV5LunaRegressionGuards } from './v5-luna-regression-guards.js';"),'bootstrap.js must import the Luna regression guards installer.');
assert(bootstrap.includes('installV5LunaRegressionGuards();'),'bootstrap.js must actually call the Luna regression guards installer during boot.');
assert(!guards.includes("if (typeof window !== 'undefined' && typeof document !== 'undefined')"),'The guards module must not self-install on import - bootstrap.js is the single, explicit caller.');

console.log('V5 Luna regression static checks passed: BQ-001 validation, BQ-002 Calendar route, BQ-003 exact quiz resume.');
