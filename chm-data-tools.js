/* ================================================================
   CHM DATA TOOLS  v3  —  Export / Import / Push per Department
   ----------------------------------------------------------------
   Adds a prominent top banner + floating button on every admin page.
   Exports include base64 images (like your store JSON), so photos
   travel globally when you upload the file to GitHub.
   ================================================================ */
(function () {
  'use strict';

  /* ── Department map: filename → display info ─────────────────── */
  var PAGE_MAP = {
    'adm-gallery.html':        { label: 'Gallery',        icon: '🖼️',  col: 'gallery' },
    'adm-announcements.html':  { label: 'Announcements',  icon: '📣',  col: 'announcements' },
    'adm-events.html':         { label: 'Events',         icon: '📅',  col: 'events' },
    'adm-sermons.html':        { label: 'Sermons',        icon: '🎙️',  col: 'sermons' },
    'adm-leaders.html':        { label: 'Leadership',     icon: '👤',  col: 'leaders' },
    'adm-ministries.html':     { label: 'Ministries',     icon: '⛪',  col: 'ministries' },
    'adm-departments.html':    { label: 'Departments',    icon: '🏛️',  col: 'departments' },
    'adm-teams.html':          { label: 'Teams',          icon: '👥',  col: 'teams' },
    'adm-home.html':           { label: 'Home / Hero',    icon: '🏠',  col: 'hero' },
    'adm-about.html':          { label: 'About',          icon: '📖',  col: 'about' },
    'adm-give.html':           { label: 'Giving',         icon: '💛',  col: 'give' },
    'adm-locations.html':      { label: 'Locations',      icon: '📍',  col: 'locations' },
    'adm-sacred.html':         { label: 'Sacred Ordinances', icon: '✝️', col: 'sacred' },
    'adm-footer.html':         { label: 'Footer',         icon: '📝',  col: 'footer' },
    'adm-navigation.html':     { label: 'Navigation',     icon: '🧭',  col: 'navigation' },
    'adm-uploads.html':        { label: 'Media Uploads',  icon: '📁',  col: 'uploads' },
    'adm-languages.html':      { label: 'Languages',      icon: '🌐',  col: 'languages' },
    'adm-media-settings.html': { label: 'Media Settings', icon: '⚙️',  col: 'mediaSettings' },
    'adm-blueprint.html':      { label: 'Blueprint',      icon: '🗂️',  col: 'blueprint' }
  };

  var pageName = location.pathname.split('/').pop() || '';
  var dept = PAGE_MAP[pageName] || { label: 'Site Data', icon: '📂', col: null };

  /* ── Inject styles ───────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = `
  /* ─── TOP EXPORT BANNER ─── */
  #chm-export-bar {
    background: linear-gradient(135deg, #0a1f44 0%, #162f60 100%);
    border-bottom: 3px solid #c8913a;
    padding: 14px 20px;
    display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
    font-family: system-ui, sans-serif;
    position: sticky; top: 0; z-index: 9000;
    box-shadow: 0 4px 20px rgba(0,0,0,.4);
  }
  #chm-export-bar .eb-dept {
    color: #c8913a; font-weight: 800; font-size: .95rem;
    letter-spacing: .04em; margin-right: 6px;
  }
  #chm-export-bar .eb-hint {
    color: rgba(255,255,255,.55); font-size: .75rem; flex: 1;
    min-width: 160px;
  }
  .eb-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 9px; border: none;
    font-size: .82rem; font-weight: 700; cursor: pointer;
    transition: filter .15s, transform .1s; white-space: nowrap;
    text-decoration: none;
  }
  .eb-btn:hover  { filter: brightness(1.12); transform: translateY(-1px); }
  .eb-btn:active { transform: translateY(0); }
  .eb-export { background: #c8913a; color: #0a1f44; }
  .eb-import { background: #22c55e; color: #fff; }
  .eb-push   { background: #3b82f6; color: #fff; }

  /* ─── STATUS TOAST ─── */
  #chm-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #0a1f44; color: #fff; border-left: 4px solid #c8913a;
    padding: 12px 22px; border-radius: 10px; font-size: .85rem;
    font-family: system-ui, sans-serif; font-weight: 600;
    box-shadow: 0 6px 24px rgba(0,0,0,.35); z-index: 99999;
    display: none; max-width: 90vw; text-align: center;
    animation: chm-fadein .25s ease;
  }
  #chm-toast.ok   { border-color: #22c55e; }
  #chm-toast.err  { border-color: #ef4444; }
  #chm-toast.warn { border-color: #f59e0b; }
  @keyframes chm-fadein { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  /* ─── FLOATING PILL ─── */
  #chm-dt-pill {
    position: fixed; bottom: 22px; right: 20px; z-index: 9500;
    display: flex; gap: 6px; align-items: center;
  }
  .dt-pill-btn {
    width: 44px; height: 44px; border-radius: 50%;
    border: 2px solid rgba(200,145,58,.7); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; transition: transform .15s, border-color .15s;
    box-shadow: 0 3px 12px rgba(0,0,0,.3);
  }
  .dt-pill-btn:hover { transform: scale(1.12); border-color: #c8913a; }
  .dt-pill-exp  { background: #c8913a; }
  .dt-pill-imp  { background: #22c55e; }
  .dt-pill-push { background: #3b82f6; }

  /* hidden file input */
  #chm-file-imp { display: none; }
  `;
  document.head.appendChild(css);

  /* ── Build top banner ────────────────────────────────────────── */
  var bar = document.createElement('div');
  bar.id = 'chm-export-bar';
  bar.innerHTML = `
    <span class="eb-dept">${dept.icon} ${dept.label}</span>
    <span class="eb-hint">📤 Export → upload to GitHub → goes live globally&nbsp;(images included)</span>
    <button class="eb-btn eb-export" id="eb-export-btn">📤 Export JSON</button>
    <button class="eb-btn eb-import" id="eb-import-btn">📥 Import JSON</button>
    <button class="eb-btn eb-push"   id="eb-push-btn">🚀 Push to GitHub</button>
  `;
  document.body.insertBefore(bar, document.body.firstChild);

  /* ── Floating quick-access pills ────────────────────────────── */
  var pill = document.createElement('div');
  pill.id = 'chm-dt-pill';
  pill.innerHTML = `
    <button class="dt-pill-btn dt-pill-exp"  id="pill-exp"  title="Export JSON">📤</button>
    <button class="dt-pill-btn dt-pill-imp"  id="pill-imp"  title="Import JSON">📥</button>
    <button class="dt-pill-btn dt-pill-push" id="pill-push" title="Push to GitHub">🚀</button>
  `;
  document.body.appendChild(pill);

  /* ── Hidden file input ───────────────────────────────────────── */
  var fileIn = document.createElement('input');
  fileIn.type = 'file'; fileIn.accept = '.json'; fileIn.id = 'chm-file-imp';
  document.body.appendChild(fileIn);

  /* ── Toast notification ──────────────────────────────────────── */
  var toast = document.createElement('div');
  toast.id = 'chm-toast';
  document.body.appendChild(toast);
  var toastTimer;
  function showToast(msg, type, dur) {
    clearTimeout(toastTimer);
    toast.innerHTML = msg;
    toast.className = type || '';
    toast.style.display = 'block';
    if (dur !== 0) toastTimer = setTimeout(function(){ toast.style.display='none'; }, dur || 5000);
  }

  /* ════════════════════════════════════════════════════════════
     EXPORT  —  full site-data including base64 images, like
     your store JSON so photos travel globally with the file
     ════════════════════════════════════════════════════════════ */
  function doExport() {
    try {
      var raw = localStorage.getItem('chm_sitedata');
      if (!raw) { showToast('⚠️ No local data yet — add content first, then export.', 'warn'); return; }

      var data = JSON.parse(raw);

      /* Add metadata header (same pattern as your store JSON) */
      var out = {
        _version:   3,
        _app:       'CHM Church of God',
        _dept:      dept.label,
        _col:       dept.col,
        _exportedAt: new Date().toISOString(),
        _note:      'Upload as site-data.json to GitHub repo root to publish globally'
      };

      /* Copy every collection — base64 images travel with the file */
      Object.keys(data).forEach(function(k) { out[k] = data[k]; });

      var json = JSON.stringify(out, null, 2);
      var kb   = Math.round(json.length / 1024);
      var blob = new Blob([json], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = 'site-data.json';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);

      showToast('✅ site-data.json exported (' + kb + ' KB with photos)<br>'
        + '→ Upload it to GitHub as <b>site-data.json</b> in the repo root<br>'
        + '→ Wait ~60 s → your site updates globally 🌐', 'ok', 8000);
    } catch(e) {
      showToast('❌ Export failed: ' + e.message, 'err');
    }
  }

  /* ════════════════════════════════════════════════════════════
     IMPORT  —  load a previously exported site-data.json
     Merges collections so you never lose data from another section
     ════════════════════════════════════════════════════════════ */
  function doImport(file) {
    if (!file) return;
    showToast('⏳ Reading JSON file…', '', 0);
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var incoming = JSON.parse(e.target.result);

        /* Strip our metadata wrapper keys before saving */
        ['_version','_app','_dept','_col','_exportedAt','_note','_updated','_exported'].forEach(function(k){
          delete incoming[k];
        });

        /* Merge with existing localStorage data
           so importing Gallery doesn't wipe Leaders, etc. */
        var existingRaw = localStorage.getItem('chm_sitedata') || '{}';
        var existing = {};
        try { existing = JSON.parse(existingRaw); } catch(_){}

        var merged = Object.assign({}, existing, incoming);
        localStorage.setItem('chm_sitedata', JSON.stringify(merged));

        showToast('✅ Imported successfully! Reloading page…', 'ok', 3000);
        setTimeout(function(){ location.reload(); }, 1500);
      } catch(err) {
        showToast('❌ Import failed: ' + err.message, 'err');
      }
    };
    reader.readAsText(file);
    fileIn.value = '';
  }

  /* ════════════════════════════════════════════════════════════
     PUSH TO GITHUB  —  sends site-data.json directly to the
     GitHub API (token must be saved in github-setup.html)
     ════════════════════════════════════════════════════════════ */
  async function doPush() {
    var token  = localStorage.getItem('chm_gh_token')  || '';
    var owner  = localStorage.getItem('chm_gh_owner')  || 'yodebepro';
    var repo   = localStorage.getItem('chm_gh_repo')   || 'CHM-Church-of-God';
    var branch = localStorage.getItem('chm_gh_branch') || 'main';

    if (!token) {
      showToast('⚠️ No GitHub token found.<br>Go to <b>github-setup.html</b> to save your token first.', 'warn', 7000);
      return;
    }

    var raw = localStorage.getItem('chm_sitedata');
    if (!raw) { showToast('⚠️ No local data to push.', 'warn'); return; }

    showToast('🚀 Connecting to GitHub…', '', 0);

    try {
      var data = JSON.parse(raw);
      data._updated = new Date().toISOString();

      /* Strip large base64 images before API push (GitHub file-size limit)
         External http/https photo URLs are kept — they work globally already */
      var stripped = JSON.parse(JSON.stringify(data));
      var IMAGE_FIELDS = ['photo','image','imageUrl','mediaUrl','photoUrl','thumbnailUrl','video','audio','heroImage','bannerImage'];
      var COLLECTIONS  = ['leaders','announcements','events','sermons','gallery','ministries','departments','teams','locations','hero','about'];
      COLLECTIONS.forEach(function(col) {
        if (!stripped[col]) return;
        stripped[col] = stripped[col].map(function(item) {
          var clean = Object.assign({}, item);
          IMAGE_FIELDS.forEach(function(f) {
            if (clean[f] && typeof clean[f] === 'string' && clean[f].startsWith('data:')) {
              clean[f] = '__local_only__'; /* marker — cms-public.js restores from localStorage */
            }
          });
          /* Also strip images arrays */
          if (clean.images && Array.isArray(clean.images)) {
            clean.images = clean.images.map(function(img) {
              return (typeof img === 'string' && img.startsWith('data:')) ? '__local_only__' : img;
            });
          }
          return clean;
        });
      });

      /* Get current file SHA */
      var getR = await fetch(
        'https://api.github.com/repos/'+owner+'/'+repo+'/contents/site-data.json',
        { headers: { Authorization: 'token '+token, Accept: 'application/vnd.github.v3+json' } }
      );
      var sha = getR.ok ? (await getR.json()).sha || '' : '';

      /* Push the file */
      var content = btoa(unescape(encodeURIComponent(JSON.stringify(stripped, null, 2))));
      var putR = await fetch(
        'https://api.github.com/repos/'+owner+'/'+repo+'/contents/site-data.json',
        {
          method: 'PUT',
          headers: { Authorization: 'token '+token, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' },
          body: JSON.stringify({ message: 'CMS update [' + dept.label + '] ' + new Date().toISOString(), content, sha, branch })
        }
      );

      if (putR.ok) {
        localStorage.setItem('chm_sitedata', JSON.stringify(data)); /* keep full copy locally */
        showToast('🌐 Published to GitHub!<br>Live in ~60 seconds →'
          + ' <a href="https://'+owner+'.github.io/'+repo+'/" target="_blank" style="color:#c8913a">View Site</a><br>'
          + '<small style="opacity:.7">Note: base64 photos stay local; use Export→Upload for photos to go global</small>', 'ok', 10000);
      } else {
        var err = await putR.json().catch(function(){ return {}; });
        showToast('❌ GitHub error: ' + (err.message || putR.status), 'err');
      }
    } catch(e) {
      showToast('❌ Network error: ' + e.message, 'err');
    }
  }

  /* ── Wire up all buttons ─────────────────────────────────────── */
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }

  bind('eb-export-btn', doExport);
  bind('eb-import-btn', function(){ fileIn.click(); });
  bind('eb-push-btn',   doPush);
  bind('pill-exp',  doExport);
  bind('pill-imp',  function(){ fileIn.click(); });
  bind('pill-push', doPush);

  fileIn.addEventListener('change', function(){ doImport(fileIn.files[0]); });

  /* ── Show startup hint (first visit only) ────────────────────── */
  var hintKey = 'chm_dt_hint_seen';
  if (!sessionStorage.getItem(hintKey)) {
    setTimeout(function(){
      showToast('💡 <b>Workflow:</b> Add content → click <b>📤 Export JSON</b> → '
        + 'upload <b>site-data.json</b> to GitHub → goes live globally 🌐', '', 6000);
      sessionStorage.setItem(hintKey, '1');
    }, 2000);
  }

})();
