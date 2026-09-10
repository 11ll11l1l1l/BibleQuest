import { createStore } from './store.js';
import { createSessionService } from './session.js';
import { createAccountService } from './account.js';
import { createResetRecoveryService } from './reset-recovery.js';
import { createApi } from '../core/api.js';
import { storage } from '../core/storage.js';
import { resetRecoveryPage } from '../features/reset-recovery/index.js';

const root=document.getElementById('reset-app');
if(!root)throw new Error('Reset Recovery root is missing.');

const store=createStore({session:Object.freeze({status:'booting',authenticated:false,remoteAvailable:true,user:null,expiresAt:null,error:''})});
const api=createApi();
const session=createSessionService({auth:api.auth,store});
const account=createAccountService({api,session,storage});
const recovery=createResetRecoveryService({account});
const page=resetRecoveryPage({
  recovery,
  onCancel:()=>location.replace('./#account'),
  onHome:()=>location.replace('./#account')
});

document.title=`${page.title} · BibleQuest`;
root.innerHTML=page.html;
const cleanup=page.mount?.(root)||(()=>{});
addEventListener('pagehide',()=>{cleanup();session.dispose()},{once:true});
