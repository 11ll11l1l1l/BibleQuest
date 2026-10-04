const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS='id,congregation_id,mentor_id,mentee_id,initiated_by,state,mentor_accepted_at,mentee_accepted_at,ended_at,updated_at';
const ACTIONS=new Set(['accept','decline','end']);

function requireContext(context) {
  if(!UUID.test(context?.userId)||!UUID.test(context?.congregationId))throw new Error('Valid account and congregation IDs are required.');
}
function requireId(value,message) {
  const id=String(value||'').trim();
  if(!UUID.test(id))throw new Error(message);
  return id;
}
function assertScopedRow(row,id,context) {
  if(!row||row.id!==id||row.congregation_id!==context.congregationId
      ||(row.mentor_id!==context.userId&&row.mentee_id!==context.userId)) {
    throw new Error('The ONE 2 ONE relationship response was outside the active account or congregation.');
  }
  return row;
}

export function createDiscipleshipPairRepository(getClient) {
  async function authenticatedClient(context) {
    requireContext(context);
    const client=await getClient();
    const {data,error}=await client.auth.getUser();
    if(error)throw error;
    if(data?.user?.id!==context.userId)throw new Error('The authenticated account changed. Reload ONE 2 ONE.');
    return client;
  }
  async function scopedQuery(context) {
    const client=await authenticatedClient(context);
    return {query:client.from('v7_mentor_pairs').select(COLUMNS)
      .eq('congregation_id',context.congregationId)
      .or(`mentor_id.eq.${context.userId},mentee_id.eq.${context.userId}`)};
  }
  return Object.freeze({
    async listPairs(context) {
      const {data,error}=await (await scopedQuery(context)).query.order('updated_at',{ascending:false}).limit(100);
      if(error)throw error;
      return data||[];
    },
    async getPair(id,context) {
      const pairId=requireId(id,'A valid pair ID is required.');
      const {data,error}=await (await scopedQuery(context)).query.eq('id',pairId).maybeSingle();
      if(error)throw error;
      return data;
    },
    async invitePair({mentorId,menteeId},context) {
      const mentor=requireId(mentorId,'A valid mentor ID is required.');
      const mentee=requireId(menteeId,'A valid mentee ID is required.');
      if(mentor===mentee)throw new Error('Mentor and mentee must be different accounts.');
      const client=await authenticatedClient(context);
      if(context.userId!==mentor&&context.userId!==mentee)throw new Error('Only a named participant can initiate a ONE 2 ONE relationship.');
      const {data,error}=await client.from('v7_mentor_pairs').insert({
        congregation_id:context.congregationId,
        mentor_id:mentor,
        mentee_id:mentee,
        initiated_by:context.userId,
        state:'invited',
      }).select(COLUMNS).single();
      if(error)throw error;
      return assertScopedRow(data,data?.id,context);
    },
    async transitionPair(id,action,context) {
      const pairId=requireId(id,'A valid pair ID is required.');
      const lifecycle=String(action||'').trim().toLowerCase();
      if(!ACTIONS.has(lifecycle))throw new Error('Unsupported ONE 2 ONE relationship action.');
      const client=await authenticatedClient(context);
      const {data,error}=await client.rpc('bible_v7_transition_mentor_pair',{p_pair_id:pairId,p_action:lifecycle});
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      return assertScopedRow(row,pairId,context);
    }
  });
}
