// BibleQuest V4 Tranche 11 presentation contract.
// Account, Notes, Transform, Personality, Psychometrics and Accessibility retain their existing feature owners.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='9718e1ac706cf29b5b709aafa02c3b82adc45854';
const preserved=[
  'src/features/account/index.js',
  'src/features/private-notes/index.js',
  'src/features/cloud-notes/index.js',
  'src/features/transform/index.js',
  'src/features/personality-profile/index.js',
  'src/features/psychometrics/index.js',
  'src/features/accessibility/index.js'
];
for(const relative of preserved){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged during Tranche 11 presentation work.`);
}

const css=fs.readFileSync(path.join(root,'src/ui/trust-reflection-v4.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('src/ui/trust-reflection-v4.css'),'Tranche 11 V4 stylesheet must be activated from index.html.');
for(const selector of ['.bq-account-panel','[data-private-notes-view]','[data-cloud-notes-view]','[data-transform-page]','[data-personality-profile-page]','[data-psychometrics-page]','.bq-accessibility-page']){
  assert.ok(css.includes(selector),`Tranche 11 styles must explicitly cover ${selector}.`);
}
assert.ok(css.includes('@media(prefers-contrast:more)'),'Tranche 11 must preserve stronger-contrast presentation.');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Tranche 11 must preserve reduced-motion presentation.');
assert.ok(!/https?:\/\//.test(css),'Tranche 11 must not introduce remote presentation assets.');
assert.ok(css.includes('.bq-cloud-notes-boundary')&&css.includes('border-left:4px'),'Cloud/private boundary must remain structurally visible, not color-only.');
assert.ok(css.includes('.bq-recovery-code')&&css.includes('border:2px dashed'),'Recovery code must remain structurally prominent.');
assert.ok(css.includes('.bq-transform-scale button[aria-pressed="true"]'),'Selected reflection/assessment answers must have a non-transient structural state.');
assert.ok(css.includes('.bq-accessibility-status:not(:empty)'),'Accessibility saved/effective state must remain visibly distinct.');

const hooks={
  'src/features/account/index.js':['data-account-login','data-account-signup','data-account-recovery','data-device-remove','data-issue-recovery'],
  'src/features/private-notes/index.js':['data-note-new','data-note-open','data-note-form','data-note-export'],
  'src/features/cloud-notes/index.js':['data-cloud-new','data-cloud-open','data-cloud-form','data-cloud-reload'],
  'src/features/transform/index.js':['data-transform-mode-basic','data-transform-mode-full','data-transform-rating','data-transform-reflection-save'],
  'src/features/personality-profile/index.js':['data-personality-profile-page','data-personality-transform','data-personality-clear'],
  'src/features/psychometrics/index.js':['data-psychometrics-page','data-psych-open','data-psych-answer','data-psych-next'],
  'src/features/accessibility/index.js':['data-accessibility-page','data-accessibility-setting','data-accessibility-reset']
};
for(const [relative,required] of Object.entries(hooks)){
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  for(const hook of required)assert.ok(source.includes(hook),`${relative} must preserve ${hook}.`);
}

console.log('BibleQuest v4 Tranche 11 trust/reflection static presentation contract passed.');
