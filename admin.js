/* CHM CHURCH OF GOD — Admin CMS v4 | Complete Site Control */
const ADMIN_USER='admin', ADMIN_PASS='CHM@2024', SESSION_KEY='chm_admin_v4';

// ── AUTH ──────────────────────────────────────────────────────
function isLoggedIn(){ return sessionStorage.getItem(SESSION_KEY)==='true'; }
function requireAuth(){ if(!isLoggedIn()) window.location.href='login.html'; }
function logout(){ sessionStorage.removeItem(SESSION_KEY); window.location.href='login.html'; }

// ── FIREBASE ──────────────────────────────────────────────────
let db=null, fbReady=false;
async function initFirebase(){
  try{
    if(typeof firebaseConfig==='undefined'||firebaseConfig.apiKey.includes('PASTE_YOUR')){
      setFBStatus(false); return false;
    }
    if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    await db.collection('_ping').doc('chm').set({t:Date.now()});
    fbReady=true; setFBStatus(true); return true;
  }catch(e){ setFBStatus(false); return false; }
}
function setFBStatus(ok){
  document.querySelectorAll('.firebase-status').forEach(el=>{
    el.innerHTML = ok
      ? '🟢 Firebase Live — all publishes reach every visitor'
      : '🟡 Offline mode — set up Firebase for live publishing';
    el.className = 'firebase-status '+(ok?'status-online':'status-offline');
  });
}

// ── CRUD ──────────────────────────────────────────────────────
async function cmsGet(col){
  if(fbReady){ try{ const s=await db.collection(col).get(); return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b._updatedAt||0)-(a._updatedAt||0)); }catch(e){} }
  return lsGet(col);
}
async function cmsSave(col,id,data,status='draft'){
  const now=Date.now(), doc={...data,_status:status,_updatedAt:now};
  if(!id){ id=genId(); doc._createdAt=now; }
  if(fbReady){ try{ await db.collection(col).doc(id).set(doc,{merge:true}); }catch(e){} }
  const local=lsGet(col), idx=local.findIndex(x=>x.id===id), item={...doc,id};
  if(idx>=0) local[idx]=item; else local.unshift(item);
  lsSet(col,local); return item;
}
async function cmsPublish(col,id){
  const now=Date.now();
  if(fbReady){ try{ await db.collection(col).doc(id).update({_status:'published',_publishedAt:now,_updatedAt:now}); }catch(e){} }
  const local=lsGet(col), idx=local.findIndex(x=>x.id===id);
  if(idx>=0){ local[idx]._status='published'; local[idx]._publishedAt=now; lsSet(col,local); }
}
async function cmsUnpublish(col,id){
  if(fbReady){ try{ await db.collection(col).doc(id).update({_status:'draft',_updatedAt:Date.now()}); }catch(e){} }
  const local=lsGet(col), idx=local.findIndex(x=>x.id===id);
  if(idx>=0){ local[idx]._status='draft'; lsSet(col,local); }
}
async function cmsArchive(col,id){
  if(fbReady){ try{ await db.collection(col).doc(id).update({_status:'archived',_updatedAt:Date.now()}); }catch(e){} }
  const local=lsGet(col), idx=local.findIndex(x=>x.id===id);
  if(idx>=0){ local[idx]._status='archived'; lsSet(col,local); }
}
async function cmsDelete(col,id){
  if(fbReady){ try{ await db.collection(col).doc(id).delete(); }catch(e){} }
  lsSet(col, lsGet(col).filter(x=>x.id!==id));
}
async function cfgSave(section,data){
  const full={...data,_updatedAt:Date.now()};
  if(fbReady){ try{ await db.collection('site_config').doc(section).set(full,{merge:true}); }catch(e){} }
  localStorage.setItem('chm_cfg_'+section, JSON.stringify(full));
}
async function cfgGet(section){
  if(fbReady){ try{ const d=await db.collection('site_config').doc(section).get(); if(d.exists) return d.data(); }catch(e){} }
  try{ return JSON.parse(localStorage.getItem('chm_cfg_'+section))||{}; }catch{ return {}; }
}

// ── LOCAL STORAGE ─────────────────────────────────────────────
function lsGet(k){ try{ return JSON.parse(localStorage.getItem('chm_'+k))||[]; }catch{ return []; } }
function lsSet(k,d){ localStorage.setItem('chm_'+k, JSON.stringify(d)); }
function genId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// ── STATUS BADGE ──────────────────────────────────────────────
function badge(s){
  const m={published:'badge-published',draft:'badge-draft',archived:'badge-archived',pinned:'badge-pinned',active:'badge-green',inactive:'badge-archived',new:'badge-draft',read:'badge-archived',prayed:'badge-green',unread:'badge-draft'};
  const icons={published:'🌐',draft:'📝',archived:'📦',pinned:'📌',active:'✅',inactive:'—',new:'🆕',read:'✓',prayed:'🙏',unread:'📩'};
  return `<span class="badge ${m[s]||'badge-archived'}">${icons[s]||''} ${s||'draft'}</span>`;
}

// ── ROW ACTIONS ───────────────────────────────────────────────
function rowActions(col,id,st,rf){
  const pub = st==='published';
  return `<div class="row-actions">
    ${pub
      ? `<button class="act act-unpublish" onclick="cmsUnpublish('${col}','${id}').then(()=>{toast('Unpublished');${rf}()})">⏸ Unpublish</button>`
      : `<button class="act act-publish" onclick="cmsPublish('${col}','${id}').then(()=>{toast('🌐 Published! Live on website','success');${rf}()})">🌐 Publish</button>`}
    <button class="act act-edit" onclick="${rf}_edit('${id}')">✏️ Edit</button>
    <button class="act act-archive" onclick="cmsArchive('${col}','${id}').then(()=>{toast('Archived');${rf}()})">📦</button>
    <button class="act act-delete" onclick="confirmDel(()=>cmsDelete('${col}','${id}').then(()=>{toast('Deleted','error');${rf}()}))">🗑</button>
  </div>`;
}
function confirmDel(cb){ if(window.confirm('Delete this item? This cannot be undone.')) cb(); }

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg, type='success'){
  let c=document.getElementById('tc');
  if(!c){ c=document.createElement('div'); c.id='tc'; c.className='toast-container'; document.body.appendChild(c); }
  const t=document.createElement('div'); t.className=`toast ${type}`;
  const ic={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  t.innerHTML=`<span>${ic[type]||'✅'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.cssText+='transition:.28s;opacity:0;transform:translateX(110%)'; setTimeout(()=>t.remove(),300); }, 3600);
}

// ── MODAL ─────────────────────────────────────────────────────
function openModal(id){ const m=document.getElementById(id); if(m){ m.classList.add('open'); document.body.style.overflow='hidden'; } }
function closeModal(id){ const m=document.getElementById(id); if(m){ m.classList.remove('open'); document.body.style.overflow=''; } }
document.addEventListener('click',e=>{ if(e.target.classList.contains('modal-overlay')){ e.target.classList.remove('open'); document.body.style.overflow=''; } });

// ── SIDEBAR ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async()=>{
  await initFirebase();
  const ham=document.getElementById('hamburger'), sb=document.getElementById('sidebar');
  if(ham&&sb){
    ham.addEventListener('click',()=>sb.classList.toggle('open'));
    document.addEventListener('click',e=>{ if(sb&&!sb.contains(e.target)&&ham&&!ham.contains(e.target)) sb.classList.remove('open'); });
  }
  const page=location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(l=>{ if(l.getAttribute('href')===page) l.classList.add('active'); });
  document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',logout));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
  // ESC to close modals
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>{ m.classList.remove('open'); document.body.style.overflow=''; }); });
});
