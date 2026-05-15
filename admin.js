/* CHM CHURCH OF GOD — Admin CMS | Global Publishing via GitHub API */
const ADMIN_USER = 'admin', ADMIN_PASS = 'CHM@2024', SESSION_KEY = 'chm_admin_v5';

// ── AUTH ───────────────────────────────────────────────────────
function isLoggedIn(){ return sessionStorage.getItem(SESSION_KEY)==='true'; }
function requireAuth(){ if(!isLoggedIn()) window.location.href='login.html'; }
function logout(){ sessionStorage.removeItem(SESSION_KEY); window.location.href='login.html'; }

// ── GITHUB CONFIG ──────────────────────────────────────────────
const GH = {
  get token()  { return localStorage.getItem('chm_gh_token')  || ''; },
  get owner()  { return localStorage.getItem('chm_gh_owner')  || 'yodebepro'; },
  get repo()   { return localStorage.getItem('chm_gh_repo')   || 'CHM-Church-of-God'; },
  get branch() { return localStorage.getItem('chm_gh_branch') || 'main'; }
};

// ── LOAD site-data.json ────────────────────────────────────────
let _data = null;

async function loadData() {
  if (_data) return _data;
  // Try GitHub first (always fresh)
  const urls = [
    `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/site-data.json?_=${Date.now()}`,
    `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/refs/heads/${GH.branch}/site-data.json?_=${Date.now()}`
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache:'no-store' });
      if (r.ok) { _data = await r.json(); return _data; }
    } catch(e) {}
  }
  // Fallback: localStorage
  try { _data = JSON.parse(localStorage.getItem('chm_sitedata')) || empty(); }
  catch { _data = empty(); }
  return _data;
}

function empty() {
  return {
    _version:1, leaders:[], announcements:[], events:[], sermons:[],
    gallery:[], ministries:[], prayer_requests:[], messages:[], giving:[], members:[],
    site_config:{ colors:{}, church_info:{}, service_times:{}, hero:{},
      page_home:{}, page_about:{}, page_footer:{}, navigation:{}, footer_nav:{}, social:{}, watch_live:{} }
  };
}

// ── SAVE site-data.json TO GITHUB ─────────────────────────────
async function pushToGitHub() {
  if (!_data) return false;
  _data._updated = new Date().toISOString();

  // Always save locally as mirror
  try { localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e) {}

  if (!GH.token) {
    updateStatus('⚠️ No GitHub token — changes are LOCAL only. Open <a href="github-setup.html">GitHub Setup</a> to fix this.', 'warn');
    return false;
  }

  updateStatus('⏳ Publishing to GitHub…', 'info');

  try {
    // Get current file SHA
    const getR = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`, {
      headers: { 'Authorization': `token ${GH.token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    let sha = '';
    if (getR.ok) sha = (await getR.json()).sha || '';

    // Commit updated data
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(_data, null, 2))));
    const putR = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GH.token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
      body: JSON.stringify({ message: 'CMS: ' + new Date().toISOString(), content, sha, branch: GH.branch })
    });

    if (putR.ok) {
      updateStatus('🟢 Published globally — live on ALL devices within 60 seconds', 'ok');
      return true;
    } else {
      const err = await putR.json().catch(()=>({}));
      updateStatus('❌ GitHub error: ' + (err.message||putR.status) + ' — check your token in <a href="github-setup.html">GitHub Setup</a>', 'error');
      return false;
    }
  } catch(e) {
    updateStatus('❌ Network error: ' + e.message, 'error');
    return false;
  }
}

function updateStatus(msg, type) {
  document.querySelectorAll('.gh-status, .firebase-status').forEach(el => {
    el.innerHTML = msg;
    el.className = (el.classList.contains('firebase-status') ? 'firebase-status ' : 'gh-status gh-') + type;
  });
}

// ── CRUD ───────────────────────────────────────────────────────
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

async function cmsGet(col) {
  const d = await loadData();
  return ((d[col]||[]).slice()).sort((a,b) => (b._updatedAt||0)-(a._updatedAt||0));
}

async function cmsSave(col, id, fields, status='draft') {
  const d = await loadData();
  if (!d[col]) d[col] = [];
  const now = Date.now();
  const doc = { ...fields, _status:status, _updatedAt:now };
  if (!id) { id = genId(); doc._createdAt = now; }
  doc.id = id;
  const idx = d[col].findIndex(x => x.id===id);
  if (idx>=0) d[col][idx]=doc; else d[col].unshift(doc);
}

async function cmsPublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x => x.id===id);
  if (idx>=0) { d[col][idx]._status='published'; d[col][idx]._publishedAt=Date.now(); }
  const ok = await pushToGitHub();
  toast(ok ? '🌐 Published globally! Live on ALL devices within 60 seconds.' : 'Saved locally only — set up GitHub token to go global.', ok?'success':'warning');
}

async function cmsUnpublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x => x.id===id);
  if (idx>=0) d[col][idx]._status='draft';
  await pushToGitHub();
  toast('Hidden from website', 'warning');
}

async function cmsArchive(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x => x.id===id);
  if (idx>=0) d[col][idx]._status='archived';
  await pushToGitHub();
  toast('Archived');
}

async function cmsDelete(col, id) {
  const d = await loadData();
  if (d[col]) d[col] = d[col].filter(x => x.id!==id);
  await pushToGitHub();
}

async function cfgSave(section, fields) {
  const d = await loadData();
  if (!d.site_config) d.site_config = {};
  d.site_config[section] = { ...fields, _updatedAt:Date.now() };
  await pushToGitHub();
}

async function cfgGet(section) {
  const d = await loadData();
  return (d.site_config||{})[section] || {};
}

// ── IMAGE UPLOAD ───────────────────────────────────────────────
async function uploadPhoto(file, statusEl) {
  if (!file) return null;
  statusEl.textContent = '⏳ Processing photo…';

  // Read as base64
  const b64full = await new Promise((res,rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  // Try ImgBB if key saved
  const imgbbKey = localStorage.getItem('chm_imgbb_key');
  if (imgbbKey) {
    try {
      const fd = new FormData();
      fd.append('image', b64full.split(',')[1]);
      fd.append('key', imgbbKey);
      const r = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body:fd });
      const d = await r.json();
      if (d.success) {
        statusEl.innerHTML = '✅ Photo uploaded to ImgBB!';
        return d.data.url;
      }
    } catch(e) {}
  }

  // Fallback: inline base64 (works for images under ~250KB)
  if (file.size < 260*1024) {
    statusEl.textContent = '✅ Photo ready (' + Math.round(file.size/1024) + ' KB)';
    return b64full;
  }

  statusEl.innerHTML = '⚠️ Photo is ' + Math.round(file.size/1024) + ' KB — too large for inline storage.<br/>'
    + 'Options: <strong>(1)</strong> Use a smaller/compressed photo under 250 KB, '
    + '<strong>(2)</strong> Get a free key at <a href="https://imgbb.com/api" target="_blank" style="color:var(--gold)">imgbb.com/api</a> → save it in <a href="settings.html">Settings</a>.';
  return null;
}

// ── UI HELPERS ─────────────────────────────────────────────────
function badge(s) {
  const styles = {published:'badge-published',draft:'badge-draft',archived:'badge-archived',pinned:'badge-pinned',active:'badge-green',new:'badge-draft',read:'badge-archived',prayed:'badge-green',unread:'badge-draft'};
  const icons  = {published:'🌐',draft:'📝',archived:'📦',pinned:'📌',active:'✅',new:'🆕',read:'✓',prayed:'🙏',unread:'📩'};
  return `<span class="badge ${styles[s]||'badge-archived'}">${icons[s]||''} ${s||'draft'}</span>`;
}
function rowActions(col,id,st,rf) {
  return `<div class="row-actions">
    ${st==='published'
      ? `<button class="act act-unpublish" onclick="cmsUnpublish('${col}','${id}').then(()=>${rf}())">⏸</button>`
      : `<button class="act act-publish"   onclick="cmsPublish('${col}','${id}').then(()=>${rf}())">🌐 Publish</button>`}
    <button class="act act-edit"   onclick="${rf}_edit('${id}')">✏️</button>
    <button class="act act-archive" onclick="cmsArchive('${col}','${id}').then(()=>{toast('Archived');${rf}()})">📦</button>
    <button class="act act-delete"  onclick="confirmDel(()=>cmsDelete('${col}','${id}').then(()=>{toast('Deleted','error');${rf}()}))">🗑</button>
  </div>`;
}
function confirmDel(cb) { if(window.confirm('Delete this item? Cannot be undone.')) cb(); }
function toast(msg, type='success') {
  let c = document.getElementById('tc');
  if (!c) { c=document.createElement('div'); c.id='tc'; c.className='toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast '+type;
  t.innerHTML = `<span>${{success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'}[type]||'✅'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.cssText+='transition:.3s;opacity:0;transform:translateX(110%)'; setTimeout(()=>t.remove(),320); },4500);
}
function openModal(id)  { const m=document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden';} }
function closeModal(id) { const m=document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow='';} }
document.addEventListener('click', e => { if(e.target.classList.contains('modal-overlay')){e.target.classList.remove('open');document.body.style.overflow='';} });

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  // Show GitHub status
  updateStatus(
    GH.token
      ? '🟢 GitHub connected — publishes go live globally'
      : '⚠️ No GitHub token — changes are LOCAL only. <a href="github-setup.html" style="color:var(--gold);font-weight:700;">Click here to set up global publishing →</a>',
    GH.token ? 'ok' : 'warn'
  );

  // Hamburger
  const ham=document.getElementById('hamburger'), sb=document.getElementById('sidebar');
  if(ham&&sb){ ham.addEventListener('click',()=>sb.classList.toggle('open'));
    document.addEventListener('click',e=>{ if(sb&&!sb.contains(e.target)&&ham&&!ham.contains(e.target))sb.classList.remove('open'); }); }

  // Active link
  const page=location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(l=>{ if(l.getAttribute('href')===page)l.classList.add('active'); });

  document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',logout));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';}) });
});
