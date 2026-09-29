import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('supabase/functions/bq-assignment/index.ts','utf8');
const line=source.split('\n').find(item=>item.startsWith('async function assignmentRecipient('));
assert.ok(line,'Trusted assignment recipient helper must exist.');
const js=line.replace('admin:ReturnType<typeof adminClient>','admin').replace('assignment:any','assignment').replace('userId:string','userId');
const assignmentRecipient=eval(`(${js})`);
assert.equal(typeof assignmentRecipient,'function');

const rows={team:new Set(),group:new Set(),teams:new Map([['team-1',{id:'team-1',congregation_id:'c1',active:true}],['team-foreign',{id:'team-foreign',congregation_id:'c2',active:true}]]),groups:new Map([['group-1',{id:'group-1',congregation_id:'c1',active:true}],['group-foreign',{id:'group-foreign',congregation_id:'c2',active:true}]])};
const admin={from(table){return{select(){this.table=table;return this},eq(column,value){this[column]=value;return this},async maybeSingle(){if(this.table==='bible_teams'||this.table==='bible_groups'){const row=rows[this.table==='bible_teams'?'teams':'groups'].get(this.id);return{data:row&&row.congregation_id===this.congregation_id&&row.active===this.active?{id:row.id}:null,error:null}}if(this.table==='bible_team_members')return{data:rows.team.has(`${this.team_id}:${this.user_id}`)?{user_id:this.user_id}:null,error:null};if(this.table==='bible_group_members')return{data:rows.group.has(`${this.group_id}:${this.user_id}`)&&this.active===true?{user_id:this.user_id}:null,error:null};throw new Error(`Unexpected table ${this.table}`)}}}};

const all={target_scope:'all',target_id:null};
const member={target_scope:'member',target_id:'member-1'};
const team={congregation_id:'c1',target_scope:'team',target_id:'team-1'};
const group={congregation_id:'c1',target_scope:'group',target_id:'group-1'};

assert.equal(await assignmentRecipient(admin,all,'leader-1'),true,'All-audience assignments include ministry users because all active members are recipients.');
assert.equal(await assignmentRecipient(admin,member,'member-1'),true);
assert.equal(await assignmentRecipient(admin,member,'leader-1'),false,'Ministry visibility must not make a leader a recipient of another member assignment.');
rows.team.add('team-1:member-1');
assert.equal(await assignmentRecipient(admin,team,'member-1'),true);
assert.equal(await assignmentRecipient(admin,team,'leader-1'),false,'Non-member ministry users must not complete team-targeted assignments.');
rows.team.add('team-foreign:member-1');
assert.equal(await assignmentRecipient(admin,{...team,target_id:'team-foreign'},'member-1'),false,'A team membership cannot satisfy an assignment target in another congregation.');
rows.group.add('group-1:member-1');
assert.equal(await assignmentRecipient(admin,group,'member-1'),true);
assert.equal(await assignmentRecipient(admin,group,'leader-1'),false,'Non-member ministry users must not complete group-targeted assignments.');
rows.group.add('group-foreign:member-1');
assert.equal(await assignmentRecipient(admin,{...group,target_id:'group-foreign'},'member-1'),false,'A group membership cannot satisfy an assignment target in another congregation.');
assert.ok(source.includes("if(action==='start'||action==='complete'){if(!(await assignmentRecipient(admin,assignment,user.id)))"),'Start/complete must enforce recipient eligibility at the trusted boundary.');
assert.equal(source.includes('assignmentVisible(admin,assignment,user.id,member.role)'),false,'Start/complete must not reuse ministry-wide read visibility.');

console.log('BibleQuest v3 assignment response authorization edge regression passed.');
