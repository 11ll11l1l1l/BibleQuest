const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const displayTitle=note=>note.title||note.body.trim().split(/\n/)[0].slice(0,60)||'Untitled note';
const displayDate=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleString():'Unknown date'};

export function privateNotesPage({notes,onLearn}){
  return{
    title:'Private Notes',
    html:`<section class="bq-panel bq-private-notes" data-private-notes-view></section>`,
    mount(root){
      const view=root.querySelector('[data-private-notes-view]');
      let editingId=null,message='';

      const launcher=()=>{
        const items=notes.list();
        view.innerHTML=`<div class="bq-private-notes-head"><div><p class="bq-eyebrow">PRIVATE · THIS DEVICE</p><h1>Private Notes</h1><p>Keep personal Bible-study notes on this device. v3.27 does not upload or sync these notes to an account.</p></div><span class="bq-private-notes-count">${items.length} note${items.length===1?'':'s'}</span></div>${message?`<p class="bq-private-notes-message" role="status">${esc(message)}</p>`:''}<div class="bq-private-notes-actions"><button type="button" class="bq-primary-button" data-note-new>New note</button><button type="button" class="bq-secondary-button" data-note-export ${items.length?'':'disabled'}>Export JSON</button><button type="button" class="bq-secondary-button" data-note-learn>Back to Learn</button></div>${items.length?`<div class="bq-private-notes-list">${items.map(note=>`<button type="button" class="bq-private-note-card" data-note-open="${esc(note.id)}"><span><b>${esc(displayTitle(note))}</b><small>Updated ${esc(displayDate(note.updatedAt))}</small></span><i aria-hidden="true">›</i></button>`).join('')}</div>`:'<div class="bq-private-notes-empty"><b>No private notes yet</b><p>Create a note for observations, questions, prayer points, or study reminders.</p></div>'}`;
        bindLauncher();
      };
      const editor=(note=null)=>{
        editingId=note?.id||null;
        view.innerHTML=`<div class="bq-private-notes-head"><div><p class="bq-eyebrow">${note?'EDIT PRIVATE NOTE':'NEW PRIVATE NOTE'}</p><h1>${note?'Edit note':'New note'}</h1><p>Saved locally on this device only.</p></div></div><form class="bq-private-note-form" data-note-form><label>Title <input name="title" maxlength="120" autocomplete="off" value="${esc(note?.title||'')}" placeholder="Optional title"></label><label>Note <textarea name="body" maxlength="12000" rows="12" placeholder="Write your private note here…">${esc(note?.body||'')}</textarea></label><p class="bq-private-notes-message" data-note-message role="status"></p><div class="bq-private-notes-actions"><button type="submit" class="bq-primary-button">Save note</button><button type="button" class="bq-secondary-button" data-note-cancel>Cancel</button>${note?'<button type="button" class="bq-secondary-button bq-private-note-delete" data-note-delete>Delete note</button>':''}</div></form>`;
        bindEditor();
        view.querySelector('textarea')?.focus();
      };
      const setFormMessage=text=>{const node=view.querySelector('[data-note-message]');if(node)node.textContent=text};
      function bindLauncher(){
        view.querySelector('[data-note-new]')?.addEventListener('click',()=>editor(),{once:true});
        view.querySelector('[data-note-learn]')?.addEventListener('click',()=>onLearn?.(),{once:true});
        view.querySelectorAll('[data-note-open]').forEach(button=>button.addEventListener('click',()=>{try{editor(notes.get(button.dataset.noteOpen))}catch(error){message=error?.message||'Could not open that note.';launcher()}},{once:true}));
        view.querySelector('[data-note-export]')?.addEventListener('click',()=>{
          try{
            const blob=new Blob([notes.exportJson()],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
            link.href=url;link.download=`biblequest-private-notes-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);message='Export created. Keep the JSON file somewhere private.';launcher();
          }catch(error){message=error?.message||'Could not export private notes.';launcher()}
        },{once:true});
      }
      function bindEditor(){
        const form=view.querySelector('[data-note-form]');
        form?.addEventListener('submit',event=>{
          event.preventDefault();const data=new FormData(form);
          try{const payload={title:data.get('title'),body:data.get('body')};if(editingId)notes.update(editingId,payload);else notes.create(payload);editingId=null;message='Private note saved on this device.';launcher()}catch(error){setFormMessage(error?.message||'Could not save this note.')}
        });
        view.querySelector('[data-note-cancel]')?.addEventListener('click',()=>{editingId=null;message='';launcher()},{once:true});
        view.querySelector('[data-note-delete]')?.addEventListener('click',()=>{if(!editingId||!window.confirm('Delete this private note from this device?'))return;try{notes.remove(editingId);editingId=null;message='Private note deleted.';launcher()}catch(error){setFormMessage(error?.message||'Could not delete this note.')}},{once:true});
      }
      launcher();return()=>{editingId=null};
    }
  }
}
