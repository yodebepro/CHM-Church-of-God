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
    leaders:[], leadership:[], announcements:[], events:[], sermons:[],
    gallery:[], media_library:[], ministries:[], sacred_ministries:[],
    departments:[], teams:[], page_content:[], navigation_items:[],
    footer_items:[], locations:[], prayer_requests:[], prayerRequests:[],
    messages:[], giving:[], givingReports:[], members:[],
    site_config:{ colors:{}, church_info:{}, service_times:{}, hero:{},
      page_home:{}, page_about:{}, page_footer:{}, page_give:{},
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
  // CHM one-click publishing fix:
  // Keep uploaded images/media inside site-data.json so it does not disappear on refresh.
  // For very large videos, use Firebase Storage / Google Cloud later; but images and small media now persist.
  return obj;
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
  const finalStatus = status || fields._status || fields.status || 'draft';
  const media = fields.mediaUrl || fields.imageUrl || fields.photoUrl || fields.thumbnailUrl || fields.url || '';

  const doc = {
    ...fields,
    _status: finalStatus,
    status: finalStatus,
    archived: finalStatus === 'archived',
    mediaUrl: media,
    imageUrl: fields.imageUrl || media,
    photoUrl: fields.photoUrl || media,
    thumbnailUrl: fields.thumbnailUrl || media,
    _updatedAt: now,
    updatedAt: now
  };

  if (!id) { id = genId(); doc._createdAt = now; doc.createdAt = now; }
  doc.id = id;

  const idx = d[col].findIndex(x=>x.id===id);
  if (idx>=0) d[col][idx]=doc; else d[col].unshift(doc);

  // Save immediately so it does not disappear on refresh.
  await saveLocal();

  // Also mirror it for public page loaders in the same browser.
  try {
    const feed = JSON.parse(localStorage.getItem('chm_public_feed') || '{}');
    if (!feed[col]) feed[col] = [];
    const fidx = feed[col].findIndex(x=>x.id===id);
    if (fidx>=0) feed[col][fidx] = doc; else feed[col].unshift(doc);
    localStorage.setItem('chm_public_feed', JSON.stringify(feed));
  } catch(e) {}

  return doc;
}

async function cmsPublish(col, id) {
  const d = await loadData();
  const idx = (d[col]||[]).findIndex(x=>x.id===id);

  if (idx>=0) {
    const now = Date.now();
    const item = d[col][idx];
    const media = item.mediaUrl || item.imageUrl || item.photoUrl || item.thumbnailUrl || item.url || '';

    d[col][idx] = {
      ...item,
      _status:'published',
      status:'published',
      archived:false,
      mediaUrl:media,
      imageUrl:item.imageUrl || media,
      photoUrl:item.photoUrl || media,
      thumbnailUrl:item.thumbnailUrl || media,
      _publishedAt:now,
      publishedAt:now,
      _updatedAt:now,
      updatedAt:now
    };

    // Save immediately so refresh keeps it.
    await saveLocal();

    // Mirror for public pages right away.
    try {
      const feed = JSON.parse(localStorage.getItem('chm_public_feed') || '{}');
      if (!feed[col]) feed[col] = [];
      const fidx = feed[col].findIndex(x=>x.id===id);
      if (fidx>=0) feed[col][fidx] = d[col][idx]; else feed[col].unshift(d[col][idx]);
      localStorage.setItem('chm_public_feed', JSON.stringify(feed));
    } catch(e) {}
  }

  // One-click global publish: push to GitHub immediately if token is configured.
  const ok = await pushToGitHub();
  toast(ok ? 'Published globally! Live on ALL devices within 60 seconds.' : 'Published and saved on this website. Add GitHub token in setup for global publishing.', ok ? 'success' : 'warning');
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
  if (idx>=0) {
    d[col][idx]._status='archived';
    d[col][idx].status='archived';
    d[col][idx].archived=true;
    d[col][idx]._updatedAt=Date.now();
    d[col][idx].updatedAt=Date.now();
  }
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


// ── GOOGLE CLOUD MEDIA UPLOAD ──────────────────────────────────
// This calls your private backend endpoint. The Google JSON key must stay on the backend,
// never inside HTML, JavaScript, GitHub, or public files.
async function uploadFileToCloud(file, statusEl) {
  if (!file) return null;
  if (statusEl) statusEl.textContent = 'Uploading...';

  // First try private backend if available.
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      if (statusEl) statusEl.innerHTML = 'Uploaded globally: <small>' + data.url.slice(0,70) + '...</small>';
      return data.url;
    }
  } catch (err) {}

  // GitHub Pages fallback: save file as data URL so it remains visible after refresh.
  // This works best for images/small media. Large videos should use Firebase Storage / Cloud later.
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (statusEl) statusEl.innerHTML = 'Saved into website data. Click Publish/Post to make it live.';
      resolve(reader.result);
    };
    reader.onerror = () => {
      if (statusEl) statusEl.innerHTML = 'Upload failed.';
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

// ── PHOTO UPLOAD ───────────────────────────────────────────────
async function uploadPhoto(file, statusEl) {
  // Upload the actual image file to Google Cloud Storage, then return its public URL.
  return await uploadFileToCloud(file, statusEl);
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


/* CHM ONE-CLICK PUBLISH SAFEGUARD
   Any admin button that says Publish/Post will save locally and push site-data.json in one click.
*/
document.addEventListener('click', async function(e){
  const btn = e.target.closest('button');
  if(!btn) return;
  const label = (btn.innerText || btn.value || '').toLowerCase();
  if(label.includes('publish') || label.includes('post')){
    setTimeout(async ()=>{
      try { await saveLocal(); await pushToGitHub(); } catch(err) {}
    }, 600);
  }
}, true);



/* ════════════════════════════════════════════════════════════════
   CHM ONE-CLICK GLOBAL PUBLISHING ENGINE
   Uses the GitHub token stored in github-setup.html to:
   1) upload images/videos/audio/docs to /uploads in the GitHub repo
   2) save URLs into site-data.json
   3) publish site-data.json in the same one-click workflow
   Result: public website sees updates globally after GitHub Pages refreshes.
════════════════════════════════════════════════════════════════ */
async function chmReadFileAsBase64(file) {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = String(r.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function chmSafeFileName(name) {
  return String(name || 'upload.bin')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function chmRawUrl(path) {
  return `https://raw.githubusercontent.com/${GH.owner}/${GH.repo}/${GH.branch}/${path}`;
}

async function chmPutGitHubFile(path, base64Content, message) {
  if (!GH.token) throw new Error('Missing GitHub token. Open github-setup.html once and save your token.');
  let sha = '';
  const getR = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}`, {
    headers: { 'Authorization': `token ${GH.token}`, 'Accept':'application/vnd.github.v3+json' }
  });
  if (getR.ok) {
    const j = await getR.json();
    sha = j.sha || '';
  }

  const putR = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GH.token}`,
      'Content-Type': 'application/json',
      'Accept':'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message: message || ('CHM CMS upload: ' + path),
      content: base64Content,
      sha: sha || undefined,
      branch: GH.branch
    })
  });

  if (!putR.ok) {
    const err = await putR.json().catch(()=>({}));
    throw new Error(err.message || ('GitHub upload failed: ' + putR.status));
  }
  return await putR.json();
}

/* Override upload: GitHub global first, local fallback only if token is absent */
uploadFileToCloud = async function(file, statusEl) {
  if (!file) return null;

  if (statusEl) statusEl.textContent = 'Uploading globally...';

  // TRUE GLOBAL PUBLISH: upload file into the GitHub repo /uploads folder.
  if (GH.token) {
    try {
      const extSafe = chmSafeFileName(file.name);
      const folder = (file.type || '').startsWith('video/') ? 'videos'
                  : (file.type || '').startsWith('audio/') ? 'audio'
                  : (file.type || '').startsWith('image/') ? 'images'
                  : 'files';
      const path = `uploads/${folder}/${Date.now()}-${extSafe}`;
      const base64 = await chmReadFileAsBase64(file);
      await chmPutGitHubFile(path, base64, 'CHM CMS media upload: ' + extSafe);
      const url = chmRawUrl(path);
      if (statusEl) statusEl.innerHTML = '✅ Uploaded globally. URL saved.';
      return url;
    } catch (e) {
      if (statusEl) statusEl.innerHTML = '⚠️ Global upload failed: ' + e.message + '<br>Saving local preview instead.';
    }
  }

  // Fallback: persists in this browser only. Admin will still warn that token is needed for global.
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (statusEl) statusEl.innerHTML = 'Saved locally. Add GitHub token for global media publishing.';
      resolve(reader.result);
    };
    reader.onerror = () => {
      if (statusEl) statusEl.innerHTML = 'Upload failed.';
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
};

uploadPhoto = async function(file, statusEl) {
  return await uploadFileToCloud(file, statusEl);
};

/* Keep site-data JSON clean. Media is stored in /uploads as URLs when token is set. */
stripBase64ForGitHub = function(obj) {
  if (GH.token) {
    // If token is set, data URLs should not normally exist. Keep small strings but protect GitHub from huge accidental video base64.
    try {
      const text = JSON.stringify(obj);
      const stripped = text.replace(/"data:(video|audio)\/[^"]+"/g, '""');
      return JSON.parse(stripped);
    } catch(e) { return obj; }
  }
  return obj;
};

/* Make publish one-click: data is saved, media URL already inserted, site-data pushed immediately */
const chmOriginalCmsSave = cmsSave;
cmsSave = async function(col, id, fields, status='draft') {
  const d = await loadData();
  if (!d[col]) d[col] = [];
  const now = Date.now();
  const finalStatus = status || fields._status || fields.status || 'draft';
  const media = fields.mediaUrl || fields.imageUrl || fields.photoUrl || fields.thumbnailUrl || fields.url || '';

  const doc = {
    ...fields,
    id: id || genId(),
    _status: finalStatus,
    status: finalStatus,
    archived: finalStatus === 'archived',
    mediaUrl: media,
    imageUrl: fields.imageUrl || media,
    photoUrl: fields.photoUrl || media,
    thumbnailUrl: fields.thumbnailUrl || media,
    _updatedAt: now,
    updatedAt: now
  };
  if (!id) { doc._createdAt = now; doc.createdAt = now; }

  const idx = d[col].findIndex(x => x.id === doc.id);
  if (idx >= 0) d[col][idx] = doc; else d[col].unshift(doc);

  await saveLocal();

  try {
    const feed = JSON.parse(localStorage.getItem('chm_public_feed') || '{}');
    if (!feed[col]) feed[col] = [];
    const fidx = feed[col].findIndex(x => x.id === doc.id);
    if (fidx >= 0) feed[col][fidx] = doc; else feed[col].unshift(doc);
    localStorage.setItem('chm_public_feed', JSON.stringify(feed));
  } catch(e) {}

  return doc;
};

cmsPublish = async function(col, id) {
  const d = await loadData();
  const idx = (d[col] || []).findIndex(x => x.id === id);
  if (idx >= 0) {
    const now = Date.now();
    const item = d[col][idx];
    const media = item.mediaUrl || item.imageUrl || item.photoUrl || item.thumbnailUrl || item.url || '';
    d[col][idx] = {
      ...item,
      _status: 'published',
      status: 'published',
      archived: false,
      mediaUrl: media,
      imageUrl: item.imageUrl || media,
      photoUrl: item.photoUrl || media,
      thumbnailUrl: item.thumbnailUrl || media,
      _publishedAt: now,
      publishedAt: now,
      _updatedAt: now,
      updatedAt: now
    };
    await saveLocal();
  }

  const ok = await pushToGitHub();
  if (ok) {
    toast('✅ Published globally in one click. It will appear on all devices after GitHub Pages refreshes.', 'success');
  } else {
    toast('Saved locally, but not global yet. Open github-setup.html once and save a GitHub token.', 'warning');
  }
};

cfgSave = async function(section, fields) {
  const d = await loadData();
  if (!d.site_config) d.site_config = {};
  d.site_config[section] = { ...fields, _updatedAt:Date.now(), updatedAt:Date.now() };
  await saveLocal();
  const ok = await pushToGitHub();
  toast(ok ? 'Settings published globally.' : 'Settings saved locally. Add GitHub token for global publishing.', ok ? 'success' : 'warning');
};
