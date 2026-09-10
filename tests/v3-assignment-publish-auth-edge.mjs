import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('supabase/functions/bq-assignment/index.ts','utf8');
let handler=null;
let scenario=null;

class Query{
  constructor(table){this.table=table;this.filters=[];this.inserted=null}
  select(){return this}
  eq(column,value){this.filters.push([column,value]);return this}
  order(){return Promise.resolve({data:this.rows(),error:null})}
  maybeSingle(){const rows=this.rows();return Promise.resolve({data:rows[0]||null,error:null})}
  insert(row){this.inserted=row;scenario.inserts.push({table:this.table,row});return this}
  single(){if(this.inserted)return Promise.resolve({data:{id:'assignment-created',...this.inserted},error:null});const rows=this.rows();return Promise.resolve({data:rows[0]||null,error:null})}
  rows(){return (scenario.tables[this.table]||[]).filter(row=>this.filters.every(([key,value])=>row[key]===value))}
}

const admin={from(table){return new Query(table)}};
const membershipKey=(congregationId,userId)=>`${congregationId}:${userId}`;
const memberships=new Map();
const setMembership=(congregationId,userId,role,active=true)=>memberships.set(membershipKey(congregationId,userId),active?{user_id:userId,congregation_id:congregationId,role,active:true}:null);

function reset(role='leader'){
  memberships.clear();
  setMembership('c1','publisher',role,true);
  setMembership('c1','member-good','member',true);
  setMembership('c2','member-foreign','member',true);
  scenario={
    user:{id:'publisher'},
    body:null,
    inserts:[],
    tables:{
      bible_congregation_members:[
        {user_id:'publisher',display_name:'Publisher',role,congregation_id:'c1',active:true,joined_at:'2026-01-01'},
        {user_id:'member-good',display_name:'Member Good',role:'member',congregation_id:'c1',active:true,joined_at:'2026-01-02'},
        {user_id:'member-inactive',display_name:'Member Inactive',role:'member',congregation_id:'c1',active:false,joined_at:'2026-01-03'},
        {user_id:'member-foreign',display_name:'Member Foreign',role:'member',congregation_id:'c2',active:true,joined_at:'2026-01-04'}
      ],
      bible_teams:[
        {id:'team-good',name:'Team Good',team_type:'study',congregation_id:'c1',active:true,created_at:'2026-01-01'},
        {id:'team-inactive',name:'Team Inactive',team_type:'study',congregation_id:'c1',active:false,created_at:'2026-01-02'},
        {id:'team-foreign',name:'Team Foreign',team_type:'study',congregation_id:'c2',active:true,created_at:'2026-01-03'}
      ],
      bible_groups:[
        {id:'group-good',name:'Group Good',congregation_id:'c1',active:true,created_at:'2026-01-01'},
        {id:'group-inactive',name:'Group Inactive',congregation_id:'c1',active:false,created_at:'2026-01-02'},
        {id:'group-foreign',name:'Group Foreign',congregation_id:'c2',active:true,created_at:'2026-01-03'}
      ],
      bible_assignments:[]
    }
  };
}

const executable=source
  .replace(/^import .*?;\n/,'')
  .replace('const categoryFor=(type:string)=>','const categoryFor=(type)=>')
  .replace('} as Record<string,string>)','})')
  .replace('const text=(v:unknown,max=500)=>','const text=(v,max=500)=>')
  .replace('async function assignmentRecipient(admin:ReturnType<typeof adminClient>,assignment:any,userId:string)','async function assignmentRecipient(admin,assignment,userId)')
  .replace('function iso(v:unknown)','function iso(v)')
  .replace('async(req:Request)=>','async(req)=>')
  .replaceAll('(x:unknown)=>','(x)=>')
  .replace('Deno.serve(','captureServe(');

vm.runInNewContext(executable,{
  activeMembership:async(_admin,congregationId,userId)=>memberships.get(membershipKey(congregationId,userId))||null,
  adminClient:()=>admin,
  asResponse:err=>({status:500,body:{error:String(err?.message||err)}}),
  corsHeaders:{},
  json:(body,status=200)=>({status,body}),
  parseJson:async()=>scenario.body,
  requireUser:async()=>scenario.user,
  captureServe:fn=>{handler=fn},
  Response,Set,String,Number,Boolean,Array,Promise,Date,Math
},{filename:'supabase/functions/bq-assignment/index.ts'});

assert.equal(typeof handler,'function','The production bq-assignment request handler must be captured and executed.');
const post=async body=>{scenario.body=body;return handler({method:'POST'})};
const createBody=(targetScope='all',targetId=null)=>({action:'create',congregationId:'c1',title:'Faith practice',assignmentType:'custom',targetScope,targetId,points:5});

reset('member');
let response=await post({action:'targets',congregationId:'c1'});
assert.equal(response.status,403,'Ordinary members must be denied trusted target discovery.');
response=await post(createBody());
assert.equal(response.status,403,'Ordinary members must be denied trusted assignment creation.');
assert.equal(scenario.inserts.length,0,'Denied publishers must not reach assignment insertion.');

for(const role of ['facilitator','leader','pastor','admin']){
  reset(role);
  response=await post({action:'targets',congregationId:'c1'});
  assert.equal(response.status,200,`${role} must be allowed trusted target discovery.`);
  assert.deepEqual(Array.from(response.body.members,item=>item.id),['publisher','member-good'],`${role} target members must be active and congregation-scoped.`);
  assert.deepEqual(Array.from(response.body.teams,item=>item.id),['team-good'],`${role} target teams must be active and congregation-scoped.`);
  assert.deepEqual(Array.from(response.body.groups,item=>item.id),['group-good'],`${role} target groups must be active and congregation-scoped.`);
  response=await post(createBody());
  assert.equal(response.status,200,`${role} must be allowed trusted assignment creation.`);
  assert.equal(scenario.inserts.filter(item=>item.table==='bible_assignments').length,1,`${role} create must insert exactly one assignment.`);
}

for(const [scope,targetId,label] of [
  ['member','member-foreign','foreign member'],
  ['member','member-inactive','inactive member'],
  ['team','team-foreign','foreign team'],
  ['team','team-inactive','inactive team'],
  ['group','group-foreign','foreign group'],
  ['group','group-inactive','inactive group']
]){
  reset('leader');
  response=await post(createBody(scope,targetId));
  assert.equal(response.status,400,`${label} must be rejected by the trusted create boundary.`);
  assert.equal(scenario.inserts.length,0,`${label} rejection must happen before assignment insertion.`);
}

for(const [scope,targetId] of [['member','member-good'],['team','team-good'],['group','group-good']]){
  reset('leader');
  response=await post(createBody(scope,targetId));
  assert.equal(response.status,200,`Valid same-congregation active ${scope} target must be accepted.`);
  const inserted=scenario.inserts.find(item=>item.table==='bible_assignments');
  assert.ok(inserted,`Valid ${scope} target must reach assignment insertion.`);
  assert.equal(inserted.row.target_scope,scope);
  assert.equal(inserted.row.target_id,targetId);
}

reset('leader');
response=await post(createBody('member',null));
assert.equal(response.status,400,'Missing non-all target must fail closed.');
assert.equal(scenario.inserts.length,0,'Missing target must fail before insertion.');

console.log('BibleQuest v3 assignment publish authorization trusted-boundary regression passed.');
