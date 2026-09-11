import { authStorage } from './storage.js';

const SUPABASE_MODULE='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';
const CONFIG=Object.freeze({
  supabaseUrl:'https://zkfmgezvzugchcwppreq.supabase.co',
  publishableKey:'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq'
});
const LOCAL_HOSTS=new Set(['localhost','127.0.0.1','::1']);
const PRESENCE_FIELDS='assignment_id,congregation_id,user_id,display_name,completed_at';
const PRIVATE_RESPONSE_FIELDS='assignment_id,user_id,status,submission,leader_feedback,completed_at,updated_at';

function localPreview(){return LOCAL_HOSTS.has(location.hostname)}

export function createAssignmentResponsesApi(){
  let clientPromise=null;
  const getClient=async()=>{
    if(localPreview())throw new Error('Assignment response review is disabled in local preview.');
    if(!clientPromise){
      clientPromise=import(SUPABASE_MODULE).then(module=>module.createClient(
        CONFIG.supabaseUrl,
        CONFIG.publishableKey,
        {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:authStorage}}
      ));
    }
    return clientPromise;
  };

  return Object.freeze({
    async loadPresence(congregationId,assignmentId){
      const client=await getClient();
      const {data,error}=await client.from('bible_assignment_response_presence')
        .select(PRESENCE_FIELDS)
        .eq('congregation_id',String(congregationId))
        .eq('assignment_id',String(assignmentId))
        .order('completed_at',{ascending:true});
      if(error)throw error;
      return data||[];
    },
    async loadPrivateResponses(assignmentId){
      const client=await getClient();
      const {data,error}=await client.from('bible_assignment_progress')
        .select(PRIVATE_RESPONSE_FIELDS)
        .eq('assignment_id',String(assignmentId))
        .eq('status','completed')
        .order('completed_at',{ascending:true});
      if(error)throw error;
      return data||[];
    }
  });
}
