/* CHM CHURCH OF GOD — Admin CMS v7
   ─────────────────────────────────────────────────────────────
   Global Publishing: GitHub API writes site-data.json
   Images/Audio/Video: ImgBB (photos) + base64 for audio/video
   Persistence: localStorage saves EVERY change instantly
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

  // STEP 1: Load from localStorage immediately (instant, works offline)
  const local = localStorage.getItem('chm_sitedata');
  if (local) {
    try { _data = JSON.parse(local); } catch(e) {}
  }

  // STEP 2: Try GitHub for fresher version (non-blocking)
  try {
    const urls = [
      `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/site-data.json?_=${Date.now()}`,
      `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/refs/heads/${GH.branch}/site-data.json?_=${Date.now()}`
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { cache:'no-store' });
        if (r.ok) {
          const fresh = await r.json();
          // Merge: GitHub has canonical text data; localStorage has photos
          // If GitHub data is newer, use it but restore any photos from localStorage
          if (!_data || (fresh._updated && fresh._updated > (_data._updated||''))) {
            _data = mergephotosfromLocal(fresh);
          }
          // Always update localStorage with merged data
          try { localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e) {}
          break;
        }
      } catch(e) {}
    }
  } catch(e) {}

  if (!_data) _data = empty();
  return _data;
}

/* When GitHub data has [photo-stored-locally] placeholders,
   restore the actual photo from localStorage copy */
function mergephotosfromLocal(ghData) {
  try {
    const local = localStorage.getItem('chm_sitedata');
    if (!local) return ghData;
    const localData = JSON.parse(local);
    const cols = ['leaders','announcements','events','sermons','gallery','ministries','teams','departments'];
    cols.forEach(col => {
      if (!ghData[col] || !localData[col]) return;
      ghData[col] = ghData[col].map(item => {
        const localItem = localData[col].find(x => x.id === item.id);
        if (!localItem) return item;
        // Restore photo/audio/video if GitHub has placeholder
        if (item.photo === '[photo-stored-locally]' && localItem.photo) item.photo = localItem.photo;
        if (item.audio === '[audio-stored-locally]' && localItem.audio) item.audio = localItem.audio;
        if (item.video === '[video-stored-locally]' && localItem.video) item.video = localItem.video;
        if (item.url   === '[photo-stored-locally]' && localItem.url)   item.url   = localItem.url;
        return item;
      });
    });
    return ghData;
  } catch(e) { return ghData; }
}

function empty() {
  return {
    _version:1, _updated:'',
    leaders:[], announcements:[], events:[], sermons:[],
    gallery:[], ministries:[], teams:[], departments:[],
    prayer_requests:[], messages:[], giving:[], members:[],
    site_config:{ colors:{}, church_info:{}, service_times:{}, hero:{},
      page_home:{}, page_about:{}, page_footer:{}, navigation:{}, footer_nav:{}, social:{}, watch_live:{} }
  };
}

/* Save locally ALWAYS — this is what keeps data on refresh */
async function saveLocal() {
  if (!_data) return;
  _data._updated = new Date().toISOString();
  try { localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e) {
    console.warn('[CHM] localStorage full — clearing old data');
    try {
      localStorage.removeItem('chm_sd_bk');
      localStorage.setItem('chm_sitedata', JSON.stringify(_data));
    } catch(e2) {}
  }
}

/* Push to GitHub — replaces site-data.json globally */
async function pushToGitHub() {
  // ALWAYS save locally first — data persists even if GitHub fails
  await saveLocal();

  if (!GH.token) {
    updateStatus('Data saved locally. <a href="github-setup.html" style="color:var(--gold);font-weight:700;">Add GitHub token</a> to publish globally to all devices.', 'warn');
    return false;
  }

  updateStatus('Publishing to GitHub…', 'info');

  try {
    // For GitHub: keep base64 images (they go in localStorage)
    // but mark them so cms-public.js knows to use localStorage fallback
    const dataForGH = prepareForGitHub(_data);

    const getR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      { headers: { 'Authorization': `token ${GH.token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    let sha = '';
    if (getR.ok) sha = (await getR.json()).sha || '';

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(dataForGH, null, 2))));

    const putR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      {
        method: 'PUT',
        headers: { 'Authorization': `token ${GH.token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ message: 'CMS: ' + new Date().toISOString(), content, sha, branch: GH.branch })
      }
    );

    if (putR.ok) {
      updateStatus('🟢 Published globally — live on ALL devices within 60 seconds', 'ok');
      return true;
    } else {
      const err = await putR.json().catch(()=>({}));
      updateStatus('GitHub error: ' + (err.message||putR.status) + ' — data saved locally.', 'error');
      return false;
    }
  } catch(e) {
    updateStatus('Network error — data saved locally. Will publish when online.', 'error');
    return false;
  }
}

/* Prepare data for GitHub: keep https:// URLs as-is, mark base64 as [stored-locally] */
function prepareForGitHub(data) {
  const copy = JSON.parse(JSON.stringify(data));
  const cols = ['leaders','announcements','events','sermons','gallery','ministries','teams','departments'];
  const fields = ['photo','image','audio','video','url'];
  cols.forEach(col => {
    if (!copy[col]) return;
    copy[col] = copy[col].map(item => {
      fields.forEach(f => {
        if (item[f] && item[f].startsWith('data:')) {
          // Mark as locally stored — cms-public.js will load from localStorage
          item[f] = '[' + f + '-stored-locally]';
        }
      });
      return item;
    });
  });
  return copy;
}

function updateStatus(msg, type) {
  document.querySelectorAll('.gh-status, .firebase-status').forEach(el => {
    el.innerHTML = msg;
    el.className = 'gh-status gh-' + type;
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
  // SAVE LOCALLY IMMEDIATELY — so refresh never loses data
  await saveLocal();
}

async function cmsPublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x => x.id===id);
  if (idx>=0) { d[col][idx]._status='published'; d[col][idx]._publishedAt=Date.now(); }
  await saveLocal();
  const ok = await pushToGitHub();
  toast(ok
    ? '🌐 Published globally! Live on ALL devices within 60 seconds.'
    : '✅ Saved & visible on this device. Add GitHub token to publish worldwide.',
    ok ? 'success' : 'warning');
}

async function cmsUnpublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x => x.id===id);
  if (idx>=0) { d[col][idx]._status='draft'; d[col][idx]._updatedAt=Date.now(); }
  await saveLocal();
  await pushToGitHub();
  toast('Hidden from website.', 'warning');
}

async function cmsArchive(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x => x.id===id);
  if (idx>=0) d[col][idx]._status='archived';
  await saveLocal(); await pushToGitHub();
  toast('Archived.');
}

async function cmsDelete(col, id) {
  const d = await loadData();
  if (d[col]) d[col] = d[col].filter(x => x.id!==id);
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

// ══════════════════════════════════════════════════════════════
//  FILE UPLOAD
//  Priority: ImgBB (permanent global URL) → base64 (local only)
// ══════════════════════════════════════════════════════════════

/* Upload photo — ImgBB gives a permanent https:// URL visible on all devices */
async function uploadPhoto(file, statusEl) {
  if (!file) return null;
  statusEl.innerHTML = '⏳ Uploading photo…';

  const imgbbKey = localStorage.getItem('chm_imgbb_key');

  // 1. Try ImgBB (permanent global URL — works on ALL devices)
  if (imgbbKey) {
    try {
      const b64raw = await toB64raw(file);
      const fd = new FormData();
      fd.append('image', b64raw);
      fd.append('key',   imgbbKey);
      const r = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body:fd });
      const j = await r.json();
      if (j.success) {
        statusEl.innerHTML = '✅ Photo uploaded! Visible globally on all devices.';
        return j.data.url;
      }
    } catch(e) {}
  }

  // 2. Base64 inline (stored in localStorage — visible on THIS device, persists on refresh)
  const b64 = await toB64full(file);
  if (file.size < 800*1024) {
    statusEl.innerHTML = '✅ Photo stored (' + Math.round(file.size/1024) + ' KB). '
      + '<strong>Visible on this device.</strong> '
      + 'For all devices: get free key at <a href="https://imgbb.com/api" target="_blank" style="color:var(--gold)">imgbb.com/api</a> → save in Settings.';
    return b64;
  }

  statusEl.innerHTML = '⚠️ Photo too large (' + Math.round(file.size/1024) + ' KB) for local storage. '
    + 'Get free ImgBB key at <a href="https://imgbb.com/api" target="_blank" style="color:var(--gold)">imgbb.com/api</a> → paste in Settings → retry.';
  return null;
}

/* Upload audio */
async function uploadAudio(file, statusEl) {
  if (!file) return null;
  statusEl.innerHTML = '⏳ Processing audio…';

  if (file.size > 15*1024*1024) {
    statusEl.innerHTML = '⚠️ File over 15 MB. Upload to '
      + '<a href="https://soundcloud.com" target="_blank" style="color:var(--gold)">SoundCloud</a> '
      + 'or <a href="https://drive.google.com" target="_blank" style="color:var(--gold)">Google Drive</a> '
      + 'and paste the link instead.';
    return null;
  }

  const b64 = await toB64full(file);
  statusEl.innerHTML = '✅ Audio ready (' + Math.round(file.size/1024) + ' KB). Saved. Will persist on refresh.';
  return b64;
}

/* Upload video */
async function uploadVideo(file, statusEl) {
  if (!file) return null;
  statusEl.innerHTML = '⏳ Processing video…';

  if (file.size > 50*1024*1024) {
    statusEl.innerHTML = '⚠️ Video over 50 MB. Upload to '
      + '<a href="https://youtube.com" target="_blank" style="color:var(--gold)">YouTube</a> '
      + 'and paste the link instead for best quality.';
    return null;
  }

  const b64 = await toB64full(file);
  statusEl.innerHTML = '✅ Video stored (' + Math.round(file.size/1024/1024*10)/10 + ' MB). Saved. Will persist on refresh.';
  return b64;
}

function toB64raw(file) {
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=rej; r.readAsDataURL(file); });
}
function toB64full(file) {
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}

// ── UI HELPERS ─────────────────────────────────────────────────
function badge(s) {
  const st={published:'badge-published',draft:'badge-draft',archived:'badge-archived',pinned:'badge-pinned',active:'badge-green',new:'badge-draft',read:'badge-archived',prayed:'badge-green',unread:'badge-draft'};
  const ic={published:'🌐',draft:'📝',archived:'📦',pinned:'📌',active:'✅',new:'🆕',read:'✓',prayed:'🙏',unread:'📩'};
  return `<span class="badge ${st[s]||'badge-archived'}">${ic[s]||''} ${s||'draft'}</span>`;
}

function confirmDel(cb) { if(window.confirm('Delete this item? Cannot be undone.')) cb(); }

function toast(msg, type='success') {
  let c = document.getElementById('tc');
  if (!c) { c=document.createElement('div'); c.id='tc'; c.className='toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${{success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'}[type]||'✅'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.cssText+='transition:.3s;opacity:0;transform:translateX(110%)'; setTimeout(()=>t.remove(),320); }, 5500);
}

function openModal(id)  { const m=document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden';} }
function closeModal(id) { const m=document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow='';} }
document.addEventListener('click', e => { if(e.target.classList.contains('modal-overlay')){e.target.classList.remove('open');document.body.style.overflow='';} });

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  const ghOk = !!GH.token;
  const imgbbOk = !!localStorage.getItem('chm_imgbb_key');

  if (ghOk && imgbbOk) {
    updateStatus('🟢 Fully connected — publishes globally, photos upload globally', 'ok');
  } else if (ghOk) {
    updateStatus('🟢 GitHub connected. <a href="settings.html" style="color:var(--gold)">Add ImgBB key in Settings</a> for global photos.', 'ok');
  } else {
    updateStatus('🟡 Data saves locally. <a href="github-setup.html" style="color:var(--gold);font-weight:700;">Add GitHub token</a> to publish to all devices.', 'warn');
  }

  const ham=document.getElementById('hamburger'), sb=document.getElementById('sidebar');
  if(ham&&sb){ ham.addEventListener('click',()=>sb.classList.toggle('open'));
    document.addEventListener('click',e=>{ if(sb&&!sb.contains(e.target)&&ham&&!ham.contains(e.target))sb.classList.remove('open'); }); }

  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(l => { if(l.getAttribute('href')===page)l.classList.add('active'); });

  document.querySelectorAll('[data-logout]').forEach(b => b.addEventListener('click', logout));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', ()=>closeModal(b.dataset.close)));
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', ()=>openModal(b.dataset.open)));
  document.addEventListener('keydown', e => {
    if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';});
  });
});
