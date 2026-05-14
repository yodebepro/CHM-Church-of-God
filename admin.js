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


/* ===== CHM PUBLIC PUBLISH SYNC PATCH ===== */
function chmNormalizePublicDoc(col, item){
  const status = item._status || item.status || 'draft';
  const media = item.mediaUrl || item.imageUrl || item.photoUrl || item.thumbnailUrl || '';
  return {
    ...item,
    collection: col,
    _status: status,
    status: status,
    archived: status === 'archived' || item.archived === true,
    mediaUrl: media,
    imageUrl: item.imageUrl || media,
    photoUrl: item.photoUrl || media,
    thumbnailUrl: item.thumbnailUrl || media,
    title: item.title || item.name || item.label || 'Untitled',
    summary: item.summary || item.subtitle || item.description || '',
    body: item.body || item.content || item.message || ''
  };
}
function chmMirrorPublicItem(col,item){
  try{
    const key='chm_public_feed';
    const feed=JSON.parse(localStorage.getItem(key)||'{}');
    if(!feed[col]) feed[col]=[];
    const normalized=chmNormalizePublicDoc(col,item);
    const idx=feed[col].findIndex(x=>x.id===normalized.id);
    if(idx>=0) feed[col][idx]=normalized; else feed[col].unshift(normalized);
    localStorage.setItem(key,JSON.stringify(feed));
  }catch(e){}
}
async function chmSaveAndMirror(col,id,data,status='draft'){
  const now=Date.now();
  const finalStatus = status || data._status || data.status || 'draft';
  const doc = chmNormalizePublicDoc(col, {
    ...data,
    id: id || genId(),
    _status: finalStatus,
    status: finalStatus,
    archived: finalStatus === 'archived',
    _updatedAt: now,
    updatedAt: now
  });
  if(!id){ doc._createdAt=now; doc.createdAt=now; }
  if(fbReady){ try{ await db.collection(col).doc(doc.id).set(doc,{merge:true}); }catch(e){ console.warn('Firebase save failed', e); } }
  const local=lsGet(col), idx=local.findIndex(x=>x.id===doc.id);
  if(idx>=0) local[idx]=doc; else local.unshift(doc);
  lsSet(col,local);
  chmMirrorPublicItem(col,doc);
  return doc;
}

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



/* ═══════════════════════════════════════════
   CHM BLUEPRINT CMS EXTENSION v5
   Adds full blueprint modules, publish workflow, Firebase Storage upload,
   site/page color controls, menus, and global public publishing.
═══════════════════════════════════════════ */
const CHM_BLUEPRINT_COLLECTIONS = {
  adm_home: { col:'page_home', title:'Home Page', icon:'🏠', fields:['title','subtitle','body','buttonText','buttonUrl','mediaUrl','textColor','backgroundColor'] },
  adm_about: { col:'page_about', title:'About Page', icon:'ℹ️', fields:['title','subtitle','body','mediaUrl','textColor','backgroundColor'] },
  adm_give: { col:'page_give', title:'Give Page', icon:'💰', fields:['title','subtitle','body','buttonText','buttonUrl','mediaUrl','textColor','backgroundColor'] },
  adm_teams: { col:'teams', title:'Church Teams', icon:'🧩', fields:['title','category','leader','summary','body','mediaUrl','textColor','backgroundColor'] },
  adm_departments: { col:'departments', title:'Departments', icon:'🏛️', fields:['title','category','leader','summary','body','mediaUrl','textColor','backgroundColor'] },
  adm_sacred: { col:'sacred_ministries', title:'Sacred Ministries', icon:'✝️', fields:['title','category','leader','summary','body','mediaUrl','textColor','backgroundColor'] },
  adm_locations: { col:'locations', title:'Locations / Campuses', icon:'🌐', fields:['title','address','country','state','city','phone','email','leader','summary','body','mediaUrl','mapUrl','textColor','backgroundColor'] },
  adm_media_settings: { col:'media_settings', title:'Live Video / Radio / Media', icon:'📡', fields:['title','streamType','videoUrl','audioUrl','youtubeUrl','facebookUrl','summary','body','mediaUrl','textColor','backgroundColor'] },
  adm_navigation: { col:'navigation_items', title:'Navigation & Dropdown Menus', icon:'🧭', fields:['title','parentMenu','label','url','sortOrder','summary','body'] },
  adm_footer: { col:'footer_items', title:'Footer & Bottom Page Content', icon:'⬇️', fields:['title','column','label','url','summary','body','textColor','backgroundColor'] },
  adm_languages: { col:'languages', title:'Translation Languages', icon:'🌐', fields:['title','languageCode','label','summary','body'] },
  adm_uploads: { col:'media_library', title:'Media Upload Library', icon:'⬆️', fields:['title','category','summary','body','mediaUrl','fileType'] },
  adm_blueprint: { col:'blueprint_sections', title:'Blueprint Sections', icon:'📘', fields:['title','category','summary','body','mediaUrl','textColor','backgroundColor'] }
};

async function chmUploadFile(file, folder='uploads'){
  if(!file) return '';
  if(fbReady && typeof firebase !== 'undefined' && firebase.storage){
    try{
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
      const path = `chm/${folder}/${Date.now()}_${safe}`;
      const ref = firebase.storage().ref().child(path);
      const snap = await ref.put(file);
      return await snap.ref.getDownloadURL();
    }catch(e){
      toast('Firebase Storage upload failed. Falling back to local preview only.','warning');
    }
  }
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

function chmFieldHtml(name, value=''){
  const label = name.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
  const esc = (value||'').toString().replace(/"/g,'&quot;');
  if(name==='body' || name==='summary'){
    return `<label class="form-label">${label}</label><textarea class="form-input" name="${name}" rows="${name==='body'?8:3}">${value||''}</textarea>`;
  }
  if(name.toLowerCase().includes('color')){
    return `<label class="form-label">${label}</label><input class="form-input" type="color" name="${name}" value="${esc || '#0a1f44'}"/>`;
  }
  if(name.toLowerCase().includes('url') || name==='mediaUrl' || name==='mapUrl'){
    return `<label class="form-label">${label}</label><input class="form-input" type="url" name="${name}" value="${esc}" placeholder="https://..."/>`;
  }
  return `<label class="form-label">${label}</label><input class="form-input" name="${name}" value="${esc}" placeholder="${label}"/>`;
}

function chmStatusSelect(value='draft'){
  return `<label class="form-label">Status</label><select class="form-input" name="_status">
    <option value="draft" ${value==='draft'?'selected':''}>Draft</option>
    <option value="published" ${value==='published'?'selected':''}>Published</option>
    <option value="archived" ${value==='archived'?'selected':''}>Archived</option>
  </select>`;
}

function chmGetFormData(form){
  const data = Object.fromEntries(new FormData(form).entries());
  return data;
}

function chmRenderAdminShell(cfg){
  const root = document.querySelector('[data-blueprint-crud]');
  if(!root) return;
  root.innerHTML = `
    <div class="content-header">
      <div>
        <span class="eyebrow">${cfg.icon||'📌'} CHM CMS</span>
        <h1>${cfg.title}</h1>
        <p>Full control: add, upload, edit, save, publish/post, archive, remove, and push globally to public pages through Firebase when connected.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" data-open="bpModal">＋ Add New</button>
        <button class="btn btn-secondary" onclick="chmRefreshBlueprint()">↻ Refresh</button>
      </div>
    </div>
    <div class="firebase-status status-offline">🟡 Checking…</div>
    <div class="stat-grid" style="margin-top:1rem">
      <div class="stat-card"><div class="stat-label">Module</div><div class="stat-value">${cfg.title}</div></div>
      <div class="stat-card"><div class="stat-label">Collection</div><div class="stat-value">${cfg.col}</div></div>
      <div class="stat-card"><div class="stat-label">Publish</div><div class="stat-value">Global</div></div>
      <div class="stat-card"><div class="stat-label">Storage</div><div class="stat-value">Upload/URL</div></div>
    </div>
    <div class="panel" style="margin-top:1.5rem">
      <div class="panel-header">
        <h2>Published / Draft / Archived Records</h2>
        <p>Only items marked Published appear on public pages.</p>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Title</th><th>Category/Menu</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody id="bpRows"><tr><td colspan="5">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="modal-overlay" id="bpModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2 id="bpModalTitle">Add / Edit ${cfg.title}</h2>
          <button class="modal-close" data-close="bpModal">×</button>
        </div>
        <form id="bpForm" class="modal-body">
          <input type="hidden" name="id"/>
          <div class="form-grid">
            ${cfg.fields.map(f=>`<div class="form-group ${f==='body' || f==='summary' ? 'full' : ''}">${chmFieldHtml(f)}</div>`).join('')}
            <div class="form-group full">
              <label class="form-label">Upload Image / Video / Audio / File</label>
              <input class="form-input" type="file" name="_file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx"/>
              <small>When Firebase Storage is configured, this uploads globally. Otherwise it saves a local preview only.</small>
            </div>
            <div class="form-group">${chmStatusSelect('draft')}</div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" data-close="bpModal">Cancel</button>
            <button class="btn btn-outline" type="button" id="bpSaveDraft">Save Draft</button>
            <button class="btn btn-primary" type="button" id="bpPublish">Publish / Post</button>
            <button class="btn btn-warning" type="button" id="bpArchive">Archive</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function chmRefreshBlueprint(){
  const root = document.querySelector('[data-blueprint-crud]');
  if(!root) return;
  const key = root.dataset.blueprintCrud;
  const cfg = CHM_BLUEPRINT_COLLECTIONS[key];
  if(!cfg) return;
  const items = await cmsGet(cfg.col);
  const rows = document.getElementById('bpRows');
  if(!rows) return;
  rows.innerHTML = items.length ? items.map(item=>{
    const cat = item.category || item.parentMenu || item.column || item.streamType || item.country || '';
    const updated = item._updatedAt ? new Date(item._updatedAt).toLocaleString() : '—';
    return `<tr>
      <td><strong>${item.title || item.label || 'Untitled'}</strong><br><small>${(item.summary||item.body||'').toString().slice(0,120)}</small></td>
      <td>${cat || '—'}</td>
      <td>${badge(item._status||'draft')}</td>
      <td>${updated}</td>
      <td>${rowActions(cfg.col,item.id,item._status||'draft','chmRefreshBlueprint')}<button class="act act-edit" onclick="chmBlueprintEdit('${key}','${item.id}')">📝 Full Edit</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="5">No records yet. Click Add New.</td></tr>`;
}

async function chmBlueprintEdit(key,id){
  const cfg = CHM_BLUEPRINT_COLLECTIONS[key];
  const items = await cmsGet(cfg.col);
  const item = items.find(x=>x.id===id);
  if(!item) return;
  const form = document.getElementById('bpForm');
  if(!form) return;
  form.reset();
  form.elements.id.value = item.id;
  cfg.fields.forEach(f=>{ if(form.elements[f]) form.elements[f].value = item[f] || ''; });
  if(form.elements._status) form.elements._status.value = item._status || 'draft';
  openModal('bpModal');
}

async function chmBlueprintSubmit(status){
  const root = document.querySelector('[data-blueprint-crud]');
  const cfg = CHM_BLUEPRINT_COLLECTIONS[root.dataset.blueprintCrud];
  const form = document.getElementById('bpForm');
  const data = chmGetFormData(form);
  const id = data.id; delete data.id;
  data._status = status || data._status || 'draft';
  const file = form.elements._file?.files?.[0];
  if(file){
    const url = await chmUploadFile(file, cfg.col);
    data.mediaUrl = url;
    data.fileName = file.name;
    data.fileType = file.type;
  }
  await cmsSave(cfg.col,id,data,data._status);
  toast(data._status==='published'?'Published globally':'Saved','success');
  closeModal('bpModal');
  form.reset();
  await chmRefreshBlueprint();
}

document.addEventListener('DOMContentLoaded', async()=>{
  const root = document.querySelector('[data-blueprint-crud]');
  if(!root) return;
  const cfg = CHM_BLUEPRINT_COLLECTIONS[root.dataset.blueprintCrud];
  if(!cfg) return;
  await initFirebase();
  chmRenderAdminShell(cfg);
  await chmRefreshBlueprint();
  document.getElementById('bpSaveDraft')?.addEventListener('click',()=>chmBlueprintSubmit('draft'));
  document.getElementById('bpPublish')?.addEventListener('click',()=>chmBlueprintSubmit('published'));
  document.getElementById('bpArchive')?.addEventListener('click',()=>chmBlueprintSubmit('archived'));
});


/* ===== CHM OVERRIDES: ensure public page sees published admin changes ===== */
cmsSave = async function(col,id,data,status='draft'){ return chmSaveAndMirror(col,id,data,status); };
cmsPublish = async function(col,id){
  const items = lsGet(col);
  const item = items.find(x=>x.id===id) || {id};
  await chmSaveAndMirror(col,id,{...item,_publishedAt:Date.now(),publishedAt:Date.now()},'published');
};
cmsArchive = async function(col,id){
  const items = lsGet(col);
  const item = items.find(x=>x.id===id) || {id};
  await chmSaveAndMirror(col,id,item,'archived');
};
