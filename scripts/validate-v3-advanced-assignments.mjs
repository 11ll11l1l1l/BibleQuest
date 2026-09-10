import fs from 'node:fs';

const read=file=>fs.readFileSync(file,'utf8');
const failures=[];
const fail=message=>failures.push(message);
const owner=read('src/app/assignments.js');
const ui=read('src/features/assignments/index.js');
const api=read('src/core/api.js');
const server=read('supabase/functions/bq-assignment/index.ts');
const contract=read('ADVANCED_ASSIGNMENTS_V3.md');
const workflow=read('.github/workflows/v3-regression.yml');

for(const token of['scheduleAt','reminderAt','recurrenceRule','requiredReflection','minQuizScore','evidenceType','dueState','recurrenceGeneration:false'])if(!owner.includes(token))fail(`Assignments owner missing #74 contract token: ${token}`);
for(const code of['BQ_ASSIGNMENT_NOT_OPEN','BQ_ASSIGNMENT_REFLECTION_REQUIRED','BQ_ASSIGNMENT_CONFIRMATION_REQUIRED','BQ_ASSIGNMENT_QUIZ_SCORE_INVALID','BQ_ASSIGNMENT_QUIZ_SCORE_REQUIRED'])if(!owner.includes(code))fail(`Assignments owner missing fail-closed #74 guard: ${code}`);
if(!owner.includes("const EVIDENCE_TYPES=Object.freeze(['none','text','confirmation'])"))fail('Assignments owner must retain the recovered evidence types.');
if(/linkedActivity|linked_activity/.test(owner))fail('#74 Assignments owner must not ingest linked activity; launching belongs to #79.');

for(const token of['data-assignment-advanced-meta','data-assignment-scheduled','name="quizScore"','name="confirmed"','recurrence is stored'])if(!ui.includes(token))fail(`Assignments UI missing #74 presentation contract: ${token}`);
if(/linkedActivity|linked_activity|data-assignment-create|action:['"]create/.test(ui))fail('#74 member UI must not implement leader create/publish or #79 linked activity.');

for(const field of['schedule_at','recurrence_rule','reminder_at','required_reflection','min_quiz_score','evidence_type'])if(!api.includes(field))fail(`Central API assignment projection missing #74 field: ${field}`);
if(!api.includes("async complete(congregationId,assignmentId,submission,quizScore=null)"))fail('Central API must carry optional quiz score through the existing trusted completion call.');
const fields=(api.match(/const ASSIGNMENT_FIELDS='([^']+)'/)||[])[1]||'';
if(fields.includes('linked_activity'))fail('#74 API projection must keep linked_activity out until #79.');
if(/from\('bible_assignment_progress'\)\.\s*(insert|upsert|update|delete)/.test(api))fail('Browser API must not directly mutate assignment progress.');
if(/from\('bible_score_events'\)\.\s*(insert|upsert|update|delete)/.test(api))fail('Browser API must not directly author trusted assignment score events.');

for(const token of['assignment.schedule_at','assignment.required_reflection','assignment.evidence_type','assignment.min_quiz_score','recurrence_status'])if(!server.includes(token))fail(`Retained trusted assignment function missing #74 server contract: ${token}`);
if(!server.includes("'rule_saved_scheduler_not_enabled'"))fail('Retained server contract must preserve recurrence-without-scheduler boundary.');

for(const phrase of['recurrenceGeneration','confirmation','#79','production Supabase'])if(!contract.includes(phrase))fail(`Advanced Assignments contract missing explicit boundary: ${phrase}`);
if(!workflow.includes('scripts/validate-v3-advanced-assignments.mjs'))fail('Accumulated workflow must execute the #74 architecture validator.');
if(!workflow.includes('tests/v3-advanced-assignments-edge.mjs'))fail('Accumulated workflow must execute the #74 edge regression.');
if(!workflow.includes('tests/v3-advanced-assignments-smoke.mjs'))fail('Accumulated workflow must execute the #74 browser regression.');

if(failures.length){console.error(`BibleQuest v3 Advanced Assignments validation FAILED (${failures.length})`);for(const message of failures)console.error(`- ${message}`);process.exit(1)}
console.log('BibleQuest v3 Advanced Assignments architecture validation passed.');
