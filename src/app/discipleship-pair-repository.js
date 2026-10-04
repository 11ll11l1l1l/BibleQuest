const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS='id,congregation_id,mentor_id,mentee_id,state';

// Read foundation only. RLS remains the database authority; curriculum and
// mutation adapters are separate P1/P3 work.
export function createDiscipleshipPairRepository(getClient) {
  async function scopedQuery(context) {
    if(!UUID.test(context?.userId)||!UUID.test(context?.congregationId))throw new Error('Valid account and congregation IDs are required.');
    const client=await getClient();
    const {data,error}=await client.auth.getUser();
    if(error)throw error;
    if(data?.user?.id!==context.userId)throw new Error('The authenticated account changed. Reload ONE 2 ONE.');
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
      if(!UUID.test(id))throw new Error('A valid pair ID is required.');
      const {data,error}=await (await scopedQuery(context)).query.eq('id',id).maybeSingle();
      if(error)throw error;
      return data;
    }
  });
}
