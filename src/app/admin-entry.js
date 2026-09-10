import { createStore } from './store.js';
import { createSessionService } from './session.js';
import { createAdminConsoleService } from './admin-console.js';
import { createAdminOperationsService } from './admin-operations.js';
import { createApi } from '../core/api.js';
import { adminConsolePage } from '../features/admin-console/index.js';

const root=document.getElementById('admin-app');
if(!root)throw new Error('Admin Console root is missing.');

const store=createStore({session:Object.freeze({status:'booting',authenticated:false,remoteAvailable:true,user:null,expiresAt:null,error:''})});
const api=createApi();
const session=createSessionService({auth:api.auth,store});
await session.boot();
const admin=createAdminConsoleService({api:api.adminConsole,session});
const accountDeletion=createAdminOperationsService({api:api.adminOperations,session});
const page=adminConsolePage({admin,accountDeletion,onBack:()=>{location.href='./#more'},onAccount:()=>{location.href='./#account'},onOperations:()=>{location.href='./admin-operations.html'}});
document.title=`${page.title} · BibleQuest`;
root.innerHTML=page.html;
const cleanup=page.mount?.(root)||(()=>{});
addEventListener('pagehide',()=>{cleanup();session.dispose()},{once:true});