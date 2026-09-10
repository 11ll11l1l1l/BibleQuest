const clean=value=>String(value??'').trim();
const fail=(message,code)=>{const error=new Error(message);error.code=code;return error};

function initialState(){return {status:'ready',error:'',recoveryCode:'',codeSaved:false}}

export function createResetRecoveryService({account}={}){
  if(!account||typeof account.resetPassword!=='function')throw new Error('Reset Recovery requires the verified Account owner.');
  let state=initialState();
  const snapshot=()=>Object.freeze({...state});
  const reset=()=>{state=initialState();return snapshot()};

  async function submit(input={}){
    if(state.status==='submitting')throw fail('Account recovery is already submitting.','BQ_RESET_BUSY');
    state={status:'submitting',error:'',recoveryCode:'',codeSaved:false};
    try{
      const result=await account.resetPassword({
        email:input?.email,
        recoveryCode:input?.recoveryCode,
        newPassword:input?.newPassword,
        confirmPassword:input?.confirmPassword
      });
      const recoveryCode=clean(result?.recovery_code);
      if(!recoveryCode)throw fail('Password reset completed without a replacement recovery code.','BQ_RESET_CODE_MISSING');
      state={status:'success',error:'',recoveryCode,codeSaved:false};
      return snapshot();
    }catch(error){
      state={status:'error',error:error?.message||'Account recovery failed.',recoveryCode:'',codeSaved:false};
      throw error;
    }
  }

  function cancel(){
    if(state.status==='submitting')throw fail('A submitted recovery request cannot be cancelled while it is processing.','BQ_RESET_BUSY');
    state={status:'cancelled',error:'',recoveryCode:'',codeSaved:false};
    return snapshot();
  }

  function acknowledgeSaved(saved){
    if(state.status!=='success')throw fail('A replacement recovery code is not ready to acknowledge.','BQ_RESET_NOT_SUCCESS');
    state={...state,codeSaved:saved===true};
    return snapshot();
  }

  function clear(){return reset()}

  return Object.freeze({submit,cancel,acknowledgeSaved,clear,getState:snapshot});
}
