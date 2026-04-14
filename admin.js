/* CHM CHURCH OF GOD — Admin CMS v3 | Cathedral Dusk */
const ADMIN_USER='admin',ADMIN_PASS='CHM@2024',SESSION_KEY='chm_admin_session';
function isLoggedIn(){return sessionStorage.getItem(SESSION_KEY)==='true';}
function requireAuth(){if(!isLoggedIn())window.location.href='login.html';}
function logout(){sessionStorage.removeItem(SESSION_KEY);window.location.href='login.html';}

let db=null,firebaseReady=false;
async function initFirebase(){
  try{
    if(typeof firebaseConfig==='undefined'||firebaseConfig.apiKey.includes('PASTE_YOUR')){updateFirebaseStatus(false);return false;}
    if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
    db=firebase.firestore();
    await db.collection('_ping').doc('chm').set({t:Date.now()});
    firebaseReady=true;updateFirebaseStatus(true);return true;
  }catch(e){updateFirebaseStatus(false);return false;}
}
function updateFirebaseStatus(ok){
  document.querySelectorAll('.firebase-status').forEach(el=>{
    el.innerHTML=ok?'🟢 Firebase Connected — publishes reach all visitors':'🟡 Offline — changes are local only';
    el.className='firebase-status '+(ok?'status-online':'status-offline');
  });
}

async function cmsGet(col){
  if(firebaseReady){try{const s=await db.collection(col).get();return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b._updatedAt||0)-(a._updatedAt||0));}catch(e){}}
  return lsGet(col);
}
async function cmsSave(col,id,data,status='draft'){
  const now=Date.now();const doc={...data,_status:status,_updatedAt:now};
  if(!id){id=genId();doc._createdAt=now;}
  if(firebaseReady){try{await db.collection(col).doc(id).set(doc,{merge:true});}catch(e){}}
  const local=lsGet(col);const idx=local.findIndex(x=>x.id===id);const item={...doc,id};
  if(idx>=0)local[idx]=item;else local.unshift(item);lsSet(col,local);return item;
}
async function cmsPublish(col,id){
  const now=Date.now();
  if(firebaseReady){try{await db.collection(col).doc(id).update({_status:'published',_publishedAt:now,_updatedAt:now});}catch(e){}}
  const local=lsGet(col);const idx=local.findIndex(x=>x.id===id);
  if(idx>=0){local[idx]._status='published';local[idx]._publishedAt=now;lsSet(col,local);}
}
async function cmsUnpublish(col,id){
  if(firebaseReady){try{await db.collection(col).doc(id).update({_status:'draft',_updatedAt:Date.now()});}catch(e){}}
  const local=lsGet(col);const idx=local.findIndex(x=>x.id===id);
  if(idx>=0){local[idx]._status='draft';lsSet(col,local);}
}
async function cmsArchive(col,id){
  if(firebaseReady){try{await db.collection(col).doc(id).update({_status:'archived',_updatedAt:Date.now()});}catch(e){}}
  const local=lsGet(col);const idx=local.findIndex(x=>x.id===id);
  if(idx>=0){local[idx]._status='archived';lsSet(col,local);}
}
async function cmsDelete(col,id){
  if(firebaseReady){try{await db.collection(col).doc(id).delete();}catch(e){}}
  lsSet(col,lsGet(col).filter(x=>x.id!==id));
}
async function cfgSave(section,data){
  if(firebaseReady){try{await db.collection('site_config').doc(section).set({...data,_updatedAt:Date.now()},{merge:true});}catch(e){}}
  localStorage.setItem('chm_cfg_'+section,JSON.stringify(data));
}
async function cfgGet(section){
  if(firebaseReady){try{const d=await db.collection('site_config').doc(section).get();if(d.exists)return d.data();}catch(e){}}
  try{return JSON.parse(localStorage.getItem('chm_cfg_'+section))||{};}catch{return{};}
}
function lsGet(k){try{return JSON.parse(localStorage.getItem('chm_'+k))||[];}catch{return[];}}
function lsSet(k,d){localStorage.setItem('chm_'+k,JSON.stringify(d));}
function getData(k){return lsGet(k);}function setData(k,d){lsSet(k,d);}
function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function statusBadge(s){
  const m={published:'badge-green',draft:'badge-yellow',archived:'badge-gray',active:'badge-green',inactive:'badge-gray',pinned:'badge-gold',new:'badge-yellow',read:'badge-gray',prayed:'badge-green',unread:'badge-yellow'};
  return `<span class="badge ${m[s]||'badge-gray'}">${s||'draft'}</span>`;
}
function buildRowActions(col,id,st,rf){
  const p=st==='published';
  return `<div class="td-actions">
    ${p?`<button class="action-btn arch" onclick="cmsUnpublish('${col}','${id}').then(()=>{showToast('Unpublished');${rf}()})">⏸ Unpublish</button>`
       :`<button class="action-btn approve" onclick="cmsPublish('${col}','${id}').then(()=>{showToast('🌐 Published! Now live on website');${rf}()})">🌐 Publish</button>`}
    <button class="action-btn edit" onclick="${rf}_edit('${id}')">✏️ Edit</button>
    <button class="action-btn arch" onclick="cmsArchive('${col}','${id}').then(()=>{showToast('Archived');${rf}()})">📦</button>
    <button class="action-btn delete" onclick="confirmDelete(()=>cmsDelete('${col}','${id}').then(()=>{showToast('Deleted','error');${rf}()}))">🗑</button>
  </div>`;
}

function showToast(msg,type='success'){
  let c=document.getElementById('tc');
  if(!c){c=document.createElement('div');c.id='tc';c.className='toast-container';document.body.appendChild(c);}
  const t=document.createElement('div');t.className=`toast ${type}`;
  const ic={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  t.innerHTML=`<span>${ic[type]||'✅'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.cssText+='transition:.3s;opacity:0;transform:translateX(110%)';setTimeout(()=>t.remove(),320);},3800);
}
function openModal(id){const m=document.getElementById(id);if(m){m.classList.add('open');document.body.style.overflow='hidden';}}
function closeModal(id){const m=document.getElementById(id);if(m){m.classList.remove('open');document.body.style.overflow='';}}
document.addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay')){e.target.classList.remove('open');document.body.style.overflow='';}});
function confirmDelete(cb){if(window.confirm('Delete this item? This cannot be undone.'))cb();}

document.addEventListener('DOMContentLoaded',async()=>{
  await initFirebase();
  const ham=document.getElementById('hamburger');const sidebar=document.getElementById('sidebar');
  if(ham&&sidebar){
    ham.addEventListener('click',()=>sidebar.classList.toggle('open'));
    document.addEventListener('click',e=>{if(!sidebar.contains(e.target)&&!ham.contains(e.target))sidebar.classList.remove('open');});
  }
  const page=location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(l=>{if(l.getAttribute('href')===page)l.classList.add('active');});
  document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',logout));
  document.querySelectorAll('[data-modal-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.modalClose)));
  document.querySelectorAll('[data-modal-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.modalOpen)));
});
