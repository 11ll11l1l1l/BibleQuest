const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS='id,congregation_id,mentor_id,mentee_id,state,mentor_accepted_at,mentee_accepted_at,ended_at';

// Pair reads/invitations remain RLS-scoped; lifecycle updates use the existing RPC.
export function createDiscipleshipPairRepository(getClient) {
  async function scopedClient(context) {
    if(!UUID.test(context?.userId)||!UUID.test(context?.congregationId))throw new Error('Valid account and congregation IDs are required.');
    const client=await getClient();
    const {data,error}=await client.auth.getUser();
    if(error)throw error;
    if(data?.user?.id!==context.userId)throw new Error('The authenticated account changed. Reload ONE 2 ONE.');
    return client;
  }
  async function scopedQuery(context) {
    const client=await scopedClient(context);
    return {query:client.from('v7_mentor_pairs').select(COLUMNS)
      .eq('congregation_id',context.congregationId)
      .or(`mentor_id.eq.${context.userId},mentee_id.eq.${context.userId}`)};
  }
  return Object.freeze({
    async listPairCandidates(context) {
      const client=await scopedClient(context);
      const {data,error}=await client.from('bible_congregation_members').select('user_id,display_name,congregation_id,active')
        .eq('congregation_id',context.congregationId).eq('active',true).neq('user_id',context.userId).order('display_name').limit(500);
      if(error)throw error;
      return data||[];
    },
    async invitePair(input,context) {
      if(!UUID.test(input?.mentorId)||!UUID.test(input?.menteeId)||input.mentorId===input.menteeId
          ||![input.mentorId,input.menteeId].includes(context?.userId))throw new Error('A valid participant-owned invitation is required.');
      const client=await scopedClient(context);
      const {data,error}=await client.from('v7_mentor_pairs').insert({congregation_id:context.congregationId,
        mentor_id:input.mentorId,mentee_id:input.menteeId,initiated_by:context.userId,state:'invited'}).select(COLUMNS).single();
      if(error)throw error;
      return data;
    },
    async transitionPair(id,action,context) {
      if(!UUID.test(id)||!['accept','decline','end'].includes(action))throw new Error('A valid pair lifecycle action is required.');
      const client=await scopedClient(context);
      const {data,error}=await client.rpc('bible_v7_transition_mentor_pair',{p_pair_id:id,p_action:action});
      if(error)throw error;
      if(Array.isArray(data)){if(data.length!==1)throw new Error('Pair lifecycle acknowledgement is invalid.');return data[0];}
      return data;
    },
    async listPairs(context) {
      const {data,error}=await (await scopedQuery(context)).query.order('updated_at',{ascending:false}).limit(100);
      if(error)throw error;
      return data||[];
    },
    async getPair(id,context) {
      if(!UUID.test(id))throw new Error('A valid pair ID is required.');
      const {data,error}=await (await scopedQuery(context)).query.eq('id',id).maybeSingle();
      if(error)throw error;
      return data;
    }
  });
}
