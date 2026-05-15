/* CHM CHURCH OF GOD — Admin CMS | Global Publishing + Persistent Storage */
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

// ── DATA (in-memory + localStorage + GitHub) ───────────────────
let _data = null;

/* Load: GitHub first → localStorage fallback */
async function loadData() {
  if (_data) return _data;

  // Try localStorage FIRST for instant load (prevents blank screen on refresh)
  const localCopy = localStorage.getItem('chm_sitedata');
  if (localCopy) {
    try { _data = JSON.parse(localCopy); } catch(e) {}
  }

  // Then try GitHub for fresher data (non-blocking update)
  const urls = [
    `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/site-data.json?_=${Date.now()}`,
    `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/refs/heads/${GH.branch}/site-data.json?_=${Date.now()}`
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, { cache:'no-store' });
      if (r.ok) {
        const fresh = await r.json();
        // Only use GitHub data if it's newer or we have no local copy
        if (!_data || (fresh._updated && fresh._updated > (_data._updated||''))) {
          _data = fresh;
          // Save fresh GitHub data to localStorage immediately
          try { localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e) {}
        }
        return _data;
      }
    } catch(e) {}
  }

  // Both failed — use localStorage copy or empty
  if (!_data) _data = empty();
  return _data;
}

function empty() {
  return {
    _version:1, _updated:'',
    leaders:[], announcements:[], events:[], sermons:[],
    gallery:[], ministries:[], prayer_requests:[], messages:[],
    giving:[], members:[],
    site_config:{ colors:{}, church_info:{}, service_times:{}, hero:{},
      page_home:{}, page_about:{}, page_footer:{},
      navigation:{}, footer_nav:{}, social:{}, watch_live:{} }
  };
}

/* Save: ALWAYS write to localStorage immediately, then push to GitHub */
async function saveLocal() {
  if (!_data) return;
  _data._updated = new Date().toISOString();
  try { localStorage.setItem('chm_sitedata', JSON.stringify(_data)); } catch(e) {}
}

async function pushToGitHub() {
  await saveLocal(); // Always save locally first — this is what persists on refresh

  if (!GH.token) {
    updateStatus('No GitHub token — changes saved locally. Open <a href="github-setup.html">github-setup.html</a> to publish globally.', 'warn');
    return false;
  }

  updateStatus('Publishing to GitHub...', 'info');

  try {
    // Get SHA of current file
    const getR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      { headers: { 'Authorization': `token ${GH.token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    let sha = '';
    if (getR.ok) sha = (await getR.json()).sha || '';

    // Strip large base64 images before pushing to GitHub (keep URL references only)
    const dataToSave = stripBase64ForGitHub(_data);

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(dataToSave, null, 2))));
    const putR = await fetch(
      `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/site-data.json`,
      {
        method: 'PUT',
        headers: { 'Authorization': `token ${GH.token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
        body: JSON.stringify({ message: 'CMS: ' + new Date().toISOString(), content, sha, branch: GH.branch })
      }
    );

    if (putR.ok) {
      updateStatus('Published globally — live on ALL devices within 60 seconds', 'ok');
      return true;
    } else {
      const err = await putR.json().catch(()=>({}));
      updateStatus('GitHub error: ' + (err.message || putR.status), 'error');
      return false;
    }
  } catch(e) {
    updateStatus('Network error: ' + e.message, 'error');
    return false;
  }
}

/* Strip base64 data URLs from objects before sending to GitHub
   (keeps all http/https URLs, removes data: URLs which are huge) */
function stripBase64ForGitHub(obj) {
  const json = JSON.stringify(obj);
  // Replace any data:image/... base64 strings with a placeholder note
  const stripped = json.replace(/"data:image\/[^"]{0,1000000}"/g, '"[photo-stored-locally]"');
  try { return JSON.parse(stripped); } catch(e) { return obj; }
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
  // Save to localStorage immediately so it persists on refresh
  await saveLocal();
}

async function cmsPublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x=>x.id===id);
  if (idx>=0) { d[col][idx]._status='published'; d[col][idx]._publishedAt=Date.now(); }
  await saveLocal();
  const ok = await pushToGitHub();
  toast(ok?'Published globally! Live on ALL devices within 60 seconds.':'Saved locally. Set up GitHub token to go global.', ok?'success':'warning');
}

async function cmsUnpublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x=>x.id===id);
  if (idx>=0) d[col][idx]._status='draft';
  await saveLocal();
  const ok = await pushToGitHub();
  toast(ok?'Hidden from website.':'Updated locally.', 'warning');
}

async function cmsArchive(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x=>x.id===id);
  if (idx>=0) d[col][idx]._status='archived';
  await saveLocal();
  await pushToGitHub();
  toast('Archived.');
}

async function cmsDelete(col, id) {
  const d = await loadData();
  if (d[col]) d[col] = d[col].filter(x=>x.id!==id);
  await saveLocal();
  await pushToGitHub();
}

async function cfgSave(section, fields) {
  const d = await loadData();
  if (!d.site_config) d.site_config = {};
  d.site_config[section] = { ...fields, _updatedAt:Date.now() };
  await saveLocal();
  await pushToGitHub();
}

async function cfgGet(section) {
  const d = await loadData();
  return (d.site_config||{})[section] || {};
}

// ── PHOTO UPLOAD ───────────────────────────────────────────────
async function uploadPhoto(file, statusEl) {
  if (!file) return null;
  statusEl.textContent = 'Processing photo...';

  const b64full = await new Promise((res,rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  // Try ImgBB first (best — gives permanent URL, no size issues)
  const imgbbKey = localStorage.getItem('chm_imgbb_key');
  if (imgbbKey) {
    try {
      const fd = new FormData();
      fd.append('image', b64full.split(',')[1]);
      fd.append('key', imgbbKey);
      const r = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body:fd });
      const d = await r.json();
      if (d.success) {
        statusEl.innerHTML = 'Photo uploaded to ImgBB! URL: <small>' + d.data.url.slice(0,40) + '...</small>';
        return d.data.url;
      }
    } catch(e) {}
  }

  // For images under 500KB: store as base64 in localStorage (persists locally)
  if (file.size < 500*1024) {
    try {
      statusEl.innerHTML = 'Photo stored locally (' + Math.round(file.size/1024) + ' KB). Visible on this device. '
        + 'For global sharing: get a free key at <a href="https://imgbb.com/api" target="_blank" style="color:var(--gold)">imgbb.com/api</a> and save it in Settings.';
      return b64full;
    } catch(e) {}
  }

  statusEl.innerHTML = 'Photo too large (' + Math.round(file.size/1024) + ' KB).<br/>'
    + '<strong>Get a free ImgBB key:</strong> <a href="https://imgbb.com/api" target="_blank" style="color:var(--gold)">imgbb.com/api</a> → save in Settings → photos go global!';
  return null;
}

// ── UI HELPERS ─────────────────────────────────────────────────
function badge(s) {
  const styles={published:'badge-published',draft:'badge-draft',archived:'badge-archived',pinned:'badge-pinned',active:'badge-green',new:'badge-draft',read:'badge-archived',prayed:'badge-green',unread:'badge-draft'};
  const icons={published:'[Live]',draft:'[Draft]',archived:'[Archived]',pinned:'[Pinned]',active:'[Active]',new:'[New]',read:'[Read]',prayed:'[Prayed]',unread:'[Unread]'};
  return `<span class="badge ${styles[s]||'badge-archived'}">${icons[s]||''} ${s||'draft'}</span>`;
}

function confirmDel(cb) { if(window.confirm('Delete this item? Cannot be undone.')) cb(); }

function toast(msg, type='success') {
  let c = document.getElementById('tc');
  if (!c) { c=document.createElement('div'); c.id='tc'; c.className='toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = `<span>${{success:'OK',error:'ERR',warning:'WARN',info:'...'}[type]||'OK'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.cssText+='transition:.3s;opacity:0;transform:translateX(110%)'; setTimeout(()=>t.remove(),320); }, 5000);
}

function openModal(id)  { const m=document.getElementById(id); if(m){m.classList.add('open');document.body.style.overflow='hidden';} }
function closeModal(id) { const m=document.getElementById(id); if(m){m.classList.remove('open');document.body.style.overflow='';} }
document.addEventListener('click', e=>{ if(e.target.classList.contains('modal-overlay')){e.target.classList.remove('open');document.body.style.overflow='';} });

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  updateStatus(
    GH.token
      ? 'GitHub connected — publishes go live globally'
      : 'No GitHub token — changes saved locally. <a href="github-setup.html" style="color:var(--gold);font-weight:700;">Set up global publishing</a>',
    GH.token ? 'ok' : 'warn'
  );
  const ham=document.getElementById('hamburger'), sb=document.getElementById('sidebar');
  if(ham&&sb){ ham.addEventListener('click',()=>sb.classList.toggle('open'));
    document.addEventListener('click',e=>{ if(sb&&!sb.contains(e.target)&&ham&&!ham.contains(e.target))sb.classList.remove('open'); }); }
  const page=location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(l=>{ if(l.getAttribute('href')===page)l.classList.add('active'); });
  document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',logout));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.open)));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';}) });
});
