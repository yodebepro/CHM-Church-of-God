/* CHM CHURCH OF GOD — Admin CMS v8 | One-Click Global Publishing
   ─────────────────────────────────────────────────────────────
   Photos  → ImgBB (free, permanent global URL) OR base64 local
   Audio   → base64 stored in site-data.json
   Video   → base64 or YouTube/external link
   Data    → site-data.json on GitHub (global) + localStorage (local backup)
   ─────────────────────────────────────────────────────────────*/

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

// ── DATA ───────────────────────────────────────────────────────
let _data = null;

async function loadData() {
  if (_data) return _data;

  // Load localStorage first (instant — always available)
  const local = localStorage.getItem('chm_sitedata');
  if (local) try { _data = JSON.parse(local); } catch(e) {}

  // Try GitHub for fresher data
  const urls = [
    `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/site-data.json?_=${Date.now()}`,
    `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/refs/heads/${GH.branch}/site-data.json?_=${Date.now()}`
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache:'no-store' });
      if (r.ok) {
        const fresh = await r.json();
        // Use GitHub data if newer, but keep local photos if GitHub stripped them
        if (!_data || (fresh._updated||'') >= (_data._updated||'')) {
          _data = mergeLocalPhotos(fresh);
        }
        try { localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e) {}
        return _data;
      }
    } catch(e) {}
  }

  if (!_data) _data = emptyData();
  return _data;
}

/* If GitHub data has items missing photos but localStorage has them, restore them */
function mergeLocalPhotos(fresh) {
  try {
    const local = localStorage.getItem('chm_sitedata');
    if (!local) return fresh;
    const ld = JSON.parse(local);
    const cols = ['leaders','announcements','events','sermons','gallery','ministries','teams','departments','locations'];
    cols.forEach(col => {
      if (!fresh[col] || !ld[col]) return;
      fresh[col] = fresh[col].map(item => {
        const li = ld[col].find(x => x.id === item.id);
        if (!li) return item;
        ['photo','image','audio','video','url','mediaUrl','imageUrl'].forEach(f => {
          if ((!item[f] || item[f] === '') && li[f]) item[f] = li[f];
        });
        return item;
      });
    });
  } catch(e) {}
  return fresh;
}

function emptyData() {
  return {
    _version:1, _updated:'',
    leaders:[], announcements:[], events:[], sermons:[],
    gallery:[], ministries:[], teams:[], departments:[], locations:[],
    prayer_requests:[], messages:[], giving:[], members:[],
    site_config:{ colors:{}, church_info:{}, service_times:{}, hero:{},
      page_home:{}, page_about:{}, page_footer:{}, navigation:{}, footer_nav:{}, social:{}, watch_live:{} }
  };
}

async function saveLocal() {
  if (!_data) return;
  _data._updated = new Date().toISOString();
  try { localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e) {
    // localStorage full — clear backup and retry
    try { localStorage.removeItem('chm_sd_bk'); localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e2) {}
  }
}

async function pushToGitHub() {
  await saveLocal(); // ALWAYS save locally first

  if (!GH.token) {
    updateStatus('⚠️ No GitHub token — data saved on this device only. <a href="github-setup.html" style="color:var(--gold);font-weight:700;">Click to set up global publishing →</a>', 'warn');
    return false;
  }

  updateStatus('⏳ Publishing to GitHub…', 'info');

  try {
    const getR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      { headers: { 'Authorization': `token ${GH.token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    let sha = '';
    if (getR.ok) sha = (await getR.json()).sha || '';

    // Push ALL data including photos to GitHub (no stripping)
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(_data, null, 2))));

    const putR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      {
        method: 'PUT',
        headers: { 'Authorization': `token ${GH.token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ message: 'CMS publish: ' + new Date().toISOString(), content, sha, branch: GH.branch })
      }
    );

    if (putR.ok) {
      updateStatus('🌐 Published globally — live on ALL devices within 60 seconds', 'ok');
      return true;
    } else {
      const err = await putR.json().catch(()=>({}));
      // If file too large (base64 photos), strip photos and try again
      if (putR.status === 422 || (err.message||'').includes('too large')) {
        return await pushToGitHubStripped();
      }
      updateStatus('❌ GitHub error: ' + (err.message||putR.status), 'error');
      return false;
    }
  } catch(e) {
    updateStatus('❌ Network error — data saved locally.', 'error');
    return false;
  }
}

// Fallback: push without large base64 blobs if site-data.json is too large
async function pushToGitHubStripped() {
  try {
    const cleanData = JSON.parse(JSON.stringify(_data));
    const cols = ['leaders','announcements','events','sermons','gallery','ministries','teams','departments','locations'];
    cols.forEach(col => {
      if (!cleanData[col]) return;
      cleanData[col] = cleanData[col].map(item => {
        const copy = {...item};
        ['photo','image','audio','video','url','mediaUrl','imageUrl'].forEach(f => {
          if (copy[f] && copy[f].startsWith('data:')) copy[f] = '[media-in-local-storage]';
        });
        return copy;
      });
    });

    const getR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      { headers: { 'Authorization': `token ${GH.token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    let sha = '';
    if (getR.ok) sha = (await getR.json()).sha || '';

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(cleanData, null, 2))));
    const putR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      {
        method: 'PUT',
        headers: { 'Authorization': `token ${GH.token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ message: 'CMS publish (compact): ' + new Date().toISOString(), content, sha, branch: GH.branch })
      }
    );

    if (putR.ok) {
      updateStatus('🌐 Published globally (photos stored locally — get ImgBB key in Settings for global photos)', 'ok');
      return true;
    }
  } catch(e) {}
  updateStatus('❌ Publish failed — data saved locally.', 'error');
  return false;
}

function updateStatus(msg, type) {
  document.querySelectorAll('.gh-status,.firebase-status,[data-cms-status]').forEach(el => {
    el.innerHTML = msg;
    el.className = (el.classList.contains('firebase-status') ? 'firebase-status' : 'gh-status') + ' gh-' + type;
  });
}

// ── CRUD ───────────────────────────────────────────────────────
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

async function cmsGet(col) {
  const d = await loadData();
  return ((d[col]||[]).slice()).sort((a,b)=>(b._updatedAt||0)-(a._updatedAt||0));
}

async function cmsSave(col, id, fields, status='draft') {
  const d = await loadData();
  if (!d[col]) d[col] = [];
  const now = Date.now();
  const doc = { ...fields, _status:status, _updatedAt:now };
  if (!id) { id = genId(); doc._createdAt = now; }
  doc.id = id;
  const idx = d[col].findIndex(x=>x.id===id);
  if (idx>=0) d[col][idx]=doc; else d[col].unshift(doc);
  await saveLocal(); // Save immediately — persists on refresh
}

async function cmsPublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x=>x.id===id);
  if (idx>=0) { d[col][idx]._status='published'; d[col][idx]._publishedAt=Date.now(); }
  await saveLocal();
  const ok = await pushToGitHub();
  toast(ok
    ? '🌐 Published globally! Live on ALL devices within 60 seconds.'
    : '✅ Saved on this device. Set up GitHub token (github-setup.html) to publish worldwide.',
    ok ? 'success' : 'warning');
}

async function cmsUnpublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x=>x.id===id);
  if (idx>=0) { d[col][idx]._status='draft'; d[col][idx]._updatedAt=Date.now(); }
  await saveLocal(); await pushToGitHub();
  toast('Hidden from website.', 'warning');
}

async function cmsArchive(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x=>x.id===id);
  if (idx>=0) d[col][idx]._status='archived';
  await saveLocal(); await pushToGitHub(); toast('Archived.');
}

async function cmsDelete(col, id) {
  const d = await loadData();
  if (d[col]) d[col] = d[col].filter(x=>x.id!==id);
  await saveLocal(); await pushToGitHub();
}

async function cfgSave(section, fields) {
  const d = await loadData();
  if (!d.site_config) d.site_config = {};
  d.site_config[section] = { ...fields, _updatedAt:Date.now() };
  await saveLocal(); await pushToGitHub();
}

async function cfgGet(section) {
  const d = await loadData();
  return (d.site_config||{})[section] || {};
}

// ── PHOTO / MEDIA UPLOAD ───────────────────────────────────────
/* Priority: ImgBB (permanent global URL) → base64 (local, persists on refresh) */
async function uploadPhoto(file, statusEl) {
  if (!file) return null;
  if (statusEl) statusEl.innerHTML = '⏳ Processing photo…';

  // 1. Try ImgBB (free, permanent, global — works on ALL devices)
  const imgbbKey = localStorage.getItem('chm_imgbb_key');
  if (imgbbKey) {
    try {
      if (statusEl) statusEl.innerHTML = '⏳ Uploading to ImgBB…';
      const b64 = await fileToB64Raw(file);
      const fd = new FormData();
      fd.append('image', b64);
      fd.append('key',   imgbbKey);
      const r = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body:fd });
      const j = await r.json();
      if (j.success) {
        if (statusEl) statusEl.innerHTML = '✅ Photo uploaded! Visible on ALL devices globally.';
        return j.data.url;  // permanent https:// URL
      }
    } catch(e) {}
  }

  // 2. Try GitHub file upload (if token available — uploads to repo as binary)
  if (GH.token) {
    try {
      if (statusEl) statusEl.innerHTML = '⏳ Uploading to GitHub…';
      const b64 = await fileToB64Raw(file);
      const path = `uploads/photos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
      const getR = await fetch(
        `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}`,
        { headers: { 'Authorization': `token ${GH.token}`, 'Accept': 'application/vnd.github.v3+json' } }
      );
      const sha = getR.ok ? ((await getR.json()).sha||'') : '';
      const putR = await fetch(
        `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `token ${GH.token}`, 'Content-Type':'application/json', 'Accept': 'application/vnd.github.v3+json' },
          body: JSON.stringify({ message: 'Photo upload', content: b64, sha: sha||undefined, branch: GH.branch })
        }
      );
      if (putR.ok) {
        const url = `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/${path}`;
        if (statusEl) statusEl.innerHTML = '✅ Photo uploaded to GitHub! Visible globally.';
        return url;
      }
    } catch(e) {}
  }

  // 3. Fallback: base64 (stored in localStorage — visible on THIS device, persists on refresh)
  try {
    const b64full = await fileToB64Full(file);
    if (statusEl) {
      statusEl.innerHTML = '✅ Photo stored (' + Math.round(file.size/1024) + ' KB).'
        + (imgbbKey ? '' : ' <a href="settings.html" style="color:var(--gold)">Add ImgBB key in Settings</a> for global sharing.');
    }
    return b64full;
  } catch(e) {
    if (statusEl) statusEl.innerHTML = '❌ Upload failed.';
    return null;
  }
}

async function uploadAudio(file, statusEl) {
  if (!file) return null;
  if (statusEl) statusEl.innerHTML = '⏳ Processing audio…';
  if (file.size > 15*1024*1024) {
    if (statusEl) statusEl.innerHTML = '⚠️ Over 15 MB. Upload to <a href="https://soundcloud.com" target="_blank">SoundCloud</a> and paste the link.';
    return null;
  }
  const b64 = await fileToB64Full(file);
  if (statusEl) statusEl.innerHTML = '✅ Audio ready (' + Math.round(file.size/1024) + ' KB).';
  return b64;
}

async function uploadVideo(file, statusEl) {
  if (!file) return null;
  if (statusEl) statusEl.innerHTML = '⏳ Processing video…';
  if (file.size > 50*1024*1024) {
    if (statusEl) statusEl.innerHTML = '⚠️ Over 50 MB. Upload to <a href="https://youtube.com" target="_blank">YouTube</a> and paste the link.';
    return null;
  }
  const b64 = await fileToB64Full(file);
  if (statusEl) statusEl.innerHTML = '✅ Video stored (' + Math.round(file.size/1024/1024*10)/10 + ' MB).';
  return b64;
}

// Same as uploadPhoto — used by adm-departments, adm-ministries, adm-teams etc.
window.uploadFileToCloud = uploadPhoto;

function fileToB64Raw(file) {
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(file); });
}
function fileToB64Full(file) {
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}

// ── UI ─────────────────────────────────────────────────────────
function badge(s) {
  const st={published:'badge-published',draft:'badge-draft',archived:'badge-archived',pinned:'badge-pinned',active:'badge-green',new:'badge-draft',read:'badge-archived',prayed:'badge-green',unread:'badge-draft'};
  const ic={published:'🌐',draft:'📝',archived:'📦',pinned:'📌',active:'✅',new:'🆕',read:'✓',prayed:'🙏',unread:'📩'};
  return `<span class="badge ${st[s]||'badge-archived'}">${ic[s]||''} ${s||'draft'}</span>`;
}
function confirmDel(cb) { if(window.confirm('Delete this item? Cannot be undone.')) cb(); }
function toast(msg, type='success') {
  let c=document.getElementById('tc');
  if(!c){c=document.createElement('div');c.id='tc';c.className='toast-container';document.body.appendChild(c);}
  const t=document.createElement('div'); t.className='toast '+type;
  t.innerHTML=`<span>${{success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'}[type]||'✅'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.cssText+='transition:.3s;opacity:0;transform:translateX(110%)';setTimeout(()=>t.remove(),320);},6000);
}
function openModal(id)  {const m=document.getElementById(id);if(m){m.classList.add('open');document.body.style.overflow='hidden';}}
function closeModal(id) {const m=document.getElementById(id);if(m){m.classList.remove('open');document.body.style.overflow='';}}
document.addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay')){e.target.classList.remove('open');document.body.style.overflow='';}});

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  const ghOk    = !!GH.token;
  const imgbbOk = !!localStorage.getItem('chm_imgbb_key');

  if (ghOk && imgbbOk) {
    updateStatus('🌐 Fully connected — one click publishes text AND photos to all devices', 'ok');
  } else if (ghOk) {
    updateStatus('🌐 GitHub connected. <a href="settings.html" style="color:var(--gold)">Add ImgBB key in Settings</a> for global photos.', 'ok');
  } else {
    updateStatus('⚠️ Not connected globally. <a href="github-setup.html" style="color:var(--gold);font-weight:700;">Set up GitHub token to publish globally →</a>', 'warn');
  }

  const ham=document.getElementById('hamburger'), sb=document.getElementById('sidebar');
  if(ham&&sb){
    ham.addEventListener('click',()=>sb.classList.toggle('open'));
    document.addEventListener('click',e=>{if(sb&&!sb.contains(e.target)&&ham&&!ham.contains(e.target))sb.classList.remove('open');});
  }

  const page=location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(l=>{if(l.getAttribute('href')===page)l.classList.add('active');});
  document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',logout));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';});
  });
});
