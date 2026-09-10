import { createStore } from './store.js';
import { createSessionService } from './session.js';
import { createAdminOperationsService } from './admin-operations.js';
import { createApi } from '../core/api.js';
import { adminOperationsPage } from '../features/admin-operations/index.js';

const root=document.getElementById('admin-operations-app');
if(!root)throw new Error('Admin Operations root is missing.');

const store=createStore({session:Object.freeze({status:'booting',authenticated:false,remoteAvailable:true,user:null,expiresAt:null,error:''})});
const api=createApi();
const session=createSessionService({auth:api.auth,store});
await session.boot();
const operations=createAdminOperationsService({api:api.adminOperations,session});
const page=adminOperationsPage({operations,onBack:()=>{location.href='./admin.html'},onAccount:()=>{location.href='./#account'}});
document.title=`${page.title} · BibleQuest`;
root.innerHTML=page.html;
const cleanup=page.mount?.(root)||(()=>{});
addEventListener('pagehide',()=>{cleanup();session.dispose()},{once:true});
