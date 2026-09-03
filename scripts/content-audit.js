const fs = require('fs');
const vm = require('vm');

function loadScript(path) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path, 'utf8'), sandbox, { filename: path });
  return sandbox.window;
}

const core = loadScript('data/questions.js');
const links = loadScript('data/connections.js');
const errors = [];
const warnings = [];

function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }

function auditMultipleChoice(items, label, options = {}) {
  if (!Array.isArray(items) || !items.length) {
    fail(`${label}: expected a non-empty array`);
    return;
  }
  const ids = new Set();
  for (const [index, item] of items.entries()) {
    const at = `${label}[${index}]`;
    if (!text(item.id)) fail(`${at}: missing id`);
    else if (ids.has(item.id)) fail(`${at}: duplicate id ${item.id}`);
    else ids.add(item.id);

    if (!text(item.q)) fail(`${at}: missing question text`);
    if (!Array.isArray(item.choices) || item.choices.length < 2) fail(`${at}: needs at least two choices`);
    else {
      if (item.choices.some(choice => !text(choice))) fail(`${at}: contains an empty choice`);
      const normalized = item.choices.map(choice => choice.trim().toLowerCase());
      if (new Set(normalized).size !== normalized.length) fail(`${at}: contains duplicate choices`);
      if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.choices.length) fail(`${at}: answer index is out of range`);
    }
    if (!text(item.why)) fail(`${at}: missing explanation`);

    if (options.core) {
      if (!text(item.book)) fail(`${at}: missing Bible book`);
      if (!text(item.ref)) fail(`${at}: missing Scripture reference`);
      if (!['basic', 'context', 'connection'].includes(item.mode)) fail(`${at}: unsupported mode ${item.mode}`);
      if (!Number.isInteger(item.level) || item.level < 1 || item.level > 5) fail(`${at}: invalid difficulty level`);
      if (!text(item.source)) warn(`${at}: source label missing`);
    }

    if (options.connection) {
      if (!text(item.theme)) fail(`${at}: missing theme`);
      if (!text(item.kind)) fail(`${at}: missing connection classification`);
      if (!text(item.left?.ref) || !text(item.right?.ref)) fail(`${at}: both Scripture references are required`);
      if (!text(item.left?.label) || !text(item.right?.label)) fail(`${at}: both passage summaries are required`);
      if (item.left?.ref === item.right?.ref) fail(`${at}: left/right references must differ`);
    }
  }
}

auditMultipleChoice(core.BQ_QUESTIONS, 'BQ_QUESTIONS', { core: true });
auditMultipleChoice(links.BQ_CONNECTIONS, 'BQ_CONNECTIONS', { connection: true });

if (!Array.isArray(core.BQ_DETECTIVES) || !core.BQ_DETECTIVES.length) fail('BQ_DETECTIVES: missing or empty');
else {
  const ids = new Set();
  for (const [index, item] of core.BQ_DETECTIVES.entries()) {
    const at = `BQ_DETECTIVES[${index}]`;
    if (!text(item.id) || ids.has(item.id)) fail(`${at}: missing/duplicate id`); else ids.add(item.id);
    if (!Array.isArray(item.clues) || item.clues.length < 2 || item.clues.some(x => !text(x))) fail(`${at}: needs at least two non-empty clues`);
    if (!text(item.answer)) fail(`${at}: missing answer`);
    if (!text(item.ref)) fail(`${at}: missing Scripture reference`);
  }
}

if (!Array.isArray(core.BQ_TIMELINES) || !core.BQ_TIMELINES.length) fail('BQ_TIMELINES: missing or empty');
else {
  const ids = new Set();
  for (const [index, item] of core.BQ_TIMELINES.entries()) {
    const at = `BQ_TIMELINES[${index}]`;
    if (!text(item.id) || ids.has(item.id)) fail(`${at}: missing/duplicate id`); else ids.add(item.id);
    if (!text(item.title)) fail(`${at}: missing title`);
    if (!Array.isArray(item.items) || item.items.length < 3 || item.items.some(x => !text(x))) fail(`${at}: needs at least three ordered events`);
    else if (new Set(item.items.map(x => x.trim().toLowerCase())).size !== item.items.length) fail(`${at}: contains duplicate timeline events`);
  }
}

const allIds = [
  ...(core.BQ_QUESTIONS || []).map(x => x.id),
  ...(core.BQ_DETECTIVES || []).map(x => x.id),
  ...(core.BQ_TIMELINES || []).map(x => x.id),
  ...(links.BQ_CONNECTIONS || []).map(x => x.id)
].filter(Boolean);
if (new Set(allIds).size !== allIds.length) fail('Global content IDs are not unique across packs');

for (const message of warnings) console.warn(`WARN: ${message}`);
if (errors.length) {
  for (const message of errors) console.error(`ERROR: ${message}`);
  console.error(`\nContent audit failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`Content audit passed: ${core.BQ_QUESTIONS.length} core questions, ${core.BQ_DETECTIVES.length} detectives, ${core.BQ_TIMELINES.length} timelines, ${links.BQ_CONNECTIONS.length} Scripture connections.`);
