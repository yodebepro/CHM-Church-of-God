/* ================================================================
   CHM DATA TOOLS  v4  —  Per-Department Named JSON Files
   ----------------------------------------------------------------
   Every admin page exports / pushes its OWN named file:
     Announcements → chm-announcements.json
     Gallery       → chm-gallery.json
     Leaders       → chm-leaders.json   … etc.
   
   GitHub can now tell them apart.
   cms-public.js loads the section-specific file first, then
   falls back to site-data.json so nothing breaks.
   ================================================================ */
(function () {
  'use strict';

  /* ── Department map ──────────────────────────────────────────── */
  var PAGE_MAP = {
    'adm-announcements.html': { label:'Announcements',     icon:'📢', col:'announcements' },
    'adm-events.html':        { label:'Events',            icon:'📅', col:'events'        },
    'adm-sermons.html':       { label:'Sermons',           icon:'🎙️', col:'sermons'       },
    'adm-gallery.html':       { label:'Gallery',           icon:'🖼️', col:'gallery'       },
    'adm-departments.html':   { label:'Departments',       icon:'🏢', col:'departments'   },
    'adm-leaders.html':       { label:'Leadership',        icon:'👤', col:'leaders'       },
    'adm-teams.html':         { label:'Teams',             icon:'👥', col:'teams'         },
    'adm-ministries.html':    { label:'Ministries',        icon:'⛪', col:'ministries'    },
    'adm-about.html':         { label:'About',             icon:'📖', col:'about'         },
    'adm-home.html':          { label:'Home / Hero',       icon:'🏠', col:'hero'          },
    'adm-give.html':          { label:'Giving',            icon:'💛', col:'give'          },
    'adm-locations.html':     { label:'Locations',         icon:'📍', col:'locations'     },
    'adm-sacred.html':        { label:'Sacred Ordinances', icon:'✝️', col:'sacred'        },
    'adm-footer.html':        { label:'Footer',            icon:'📝', col:'footer'        },
    'adm-navigation.html':    { label:'Navigation',        icon:'🧭', col:'navigation'    },
    'adm-uploads.html':       { label:'Media Uploads',     icon:'📁', col:'uploads'       },
    'adm-languages.html':     { label:'Languages',         icon:'🌐', col:'languages'     },
    'adm-media-settings.html':{ label:'Media Settings',    icon:'⚙️', col:'mediaSettings' },
    'adm-blueprint.html':     { label:'Blueprint',         icon:'🗂️', col:'blueprint'     }
  };

  var pageName = location.pathname.split('/').pop() || '';
  var dept = PAGE_MAP[pageName] || { label:'Site', icon:'📂', col:null };
  var colName = dept.col;
  var sectionFile = colName ? 'chm-' + colName + '.json' : 'site-data.json';

  /* ── CSS ─────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    '#chm-export-bar{background:linear-gradient(135deg,#0a1f44,#162f60);',
    'border-bottom:3px solid #c8913a;padding:10px 16px;display:flex;',
    'align-items:center;flex-wrap:wrap;gap:8px;font-family:system-ui,sans-serif;',
    'position:sticky;top:0;z-index:9000;box-shadow:0 4px 20px rgba(0,0,0,.4);}',

    '#chm-export-bar .eb-dept{color:#c8913a;font-weight:800;font-size:.9rem;',
    'letter-spacing:.04em;margin-right:4px;white-space:nowrap;}',

    '.eb-fname{color:rgba(255,255,255,.5);font-size:.72rem;',
    'font-family:monospace;background:rgba(255,255,255,.08);',
    'padding:2px 7px;border-radius:4px;margin-right:8px;white-space:nowrap;}',

    '.eb-btn{display:inline-flex;align-items:center;gap:6px;',
    'padding:8px 14px;border-radius:8px;border:none;',
    'font-size:.8rem;font-weight:700;cursor:pointer;transition:.15s;white-space:nowrap;}',
    '.eb-btn:hover{filter:brightness(1.12);transform:translateY(-1px);}',
    '.eb-export{background:#c8913a;color:#0a1f44;}',
    '.eb-import{background:#22c55e;color:#fff;}',
    '.eb-push  {background:#3b82f6;color:#fff;}',
    '.eb-all   {background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.25);}',

    '#chm-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);',
    'background:#0a1f44;color:#fff;border-left:4px solid #c8913a;',
    'padding:12px 22px;border-radius:10px;font-size:.84rem;',
    'font-family:system-ui,sans-serif;font-weight:600;',
    'box-shadow:0 6px 24px rgba(0,0,0,.35);z-index:99999;',
    'display:none;max-width:92vw;text-align:center;line-height:1.5;}',
    '#chm-toast.ok  {border-color:#22c55e;}',
    '#chm-toast.err {border-color:#ef4444;}',
    '#chm-toast.warn{border-color:#f59e0b;}',

    '.dt-pill-wrap{position:fixed;bottom:22px;right:20px;z-index:9500;',
    'display:flex;gap:6px;}',
    '.dt-pill{width:42px;height:42px;border-radius:50%;border:2px solid rgba(200,145,58,.6);',
    'cursor:pointer;display:flex;align-items:center;justify-content:center;',
    'font-size:1rem;transition:.15s;box-shadow:0 3px 12px rgba(0,0,0,.3);}',
    '.dt-pill:hover{transform:scale(1.1);border-color:#c8913a;}',
    '.dt-exp {background:#c8913a;}.dt-imp{background:#22c55e;}',
    '.dt-push{background:#3b82f6;}.dt-all{background:#6366f1;}',

    '#dt-file-in{display:none;}'
  ].join('');
  document.head.appendChild(css);

  /* ── Top banner ──────────────────────────────────────────────── */
  var bar = document.createElement('div');
  bar.id = 'chm-export-bar';
  bar.innerHTML = [
    '<span class="eb-dept">', dept.icon,' ',dept.label,'</span>',
    '<span class="eb-fname">', sectionFile, '</span>',

    '<button class="eb-btn eb-export" id="eb-exp">',
      '📤 Export <b>', sectionFile, '</b>',
    '</button>',

    '<button class="eb-btn eb-import" id="eb-imp">',
      '📥 Import JSON',
    '</button>',

    '<button class="eb-btn eb-push" id="eb-push">',
      '🚀 Push <b>', sectionFile, '</b> → GitHub',
    '</button>',

    '<button class="eb-btn eb-all" id="eb-all">',
      '🌐 Export <i>all</i> (site-data.json)',
    '</button>'
  ].join('');
  document.body.insertBefore(bar, document.body.firstChild);

  /* ── Floating pills ──────────────────────────────────────────── */
  var pills = document.createElement('div');
  pills.className = 'dt-pill-wrap';
  pills.innerHTML = [
    '<button class="dt-pill dt-exp"  id="pill-exp"  title="Export '+sectionFile+'">📤</button>',
    '<button class="dt-pill dt-imp"  id="pill-imp"  title="Import JSON">📥</button>',
    '<button class="dt-pill dt-push" id="pill-push" title="Push to GitHub">🚀</button>',
    '<button class="dt-pill dt-all"  id="pill-all"  title="Export full site-data.json">🌐</button>'
  ].join('');
  document.body.appendChild(pills);

  /* ── File input ──────────────────────────────────────────────── */
  var fileIn = document.createElement('input');
  fileIn.type = 'file';
  fileIn.accept = '.json';
  fileIn.id = 'dt-file-in';
  document.body.appendChild(fileIn);

  /* ── Toast ───────────────────────────────────────────────────── */
  var toast = document.createElement('div');
  toast.id = 'chm-toast';
  document.body.appendChild(toast);
  var _tt;
  function showToast(msg, type, dur) {
    clearTimeout(_tt);
    toast.innerHTML = msg;
    toast.className = type || '';
    toast.style.display = 'block';
    if (dur !== 0) _tt = setTimeout(function () { toast.style.display = 'none'; }, dur || 5000);
  }

  /* ── Build section-only export object ───────────────────────── */
  function buildSectionData(allData, full) {
    if (full || !colName) {
      var d = Object.assign({}, allData);
      d._exportedAt = new Date().toISOString();
      d._note = 'Full site data — upload as site-data.json to GitHub';
      return { data: d, filename: 'site-data.json' };
    }
    var out = {
      _version: 3,
      _app: 'CHM Church of God',
      _section: dept.label,
      _collection: colName,
      _exportedAt: new Date().toISOString(),
      _note: 'Upload as ' + sectionFile + ' to GitHub repo root — auto-loaded by ' + dept.label + ' page'
    };
    /* Include this section's data */
    if (allData[colName]) out[colName] = allData[colName];
    /* Also include shared data so the file is self-contained */
    ['settings','navigation','footer','hero','about'].forEach(function (k) {
      if (allData[k] && k !== colName) out[k] = allData[k];
    });
    return { data: out, filename: sectionFile };
  }

  /* ── EXPORT ──────────────────────────────────────────────────── */
  function doExport(full) {
    try {
      var raw = localStorage.getItem('chm_sitedata');
      if (!raw) { showToast('⚠️ No local data yet — add content first.', 'warn'); return; }
      var allData = JSON.parse(raw);
      var result = buildSectionData(allData, full);
      var json = JSON.stringify(result.data, null, 2);
      var kb   = Math.round(json.length / 1024);
      var blob = new Blob([json], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = result.filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showToast(
        '✅ <b>' + result.filename + '</b> exported (' + kb + ' KB)<br>' +
        '→ Upload to GitHub root as <b>' + result.filename + '</b><br>' +
        '→ The ' + dept.label + ' page will auto-load it 🌐', 'ok', 9000);
    } catch (e) { showToast('❌ Export failed: ' + e.message, 'err'); }
  }

  /* ── IMPORT ──────────────────────────────────────────────────── */
  function doImport(file) {
    if (!file) return;
    showToast('⏳ Reading ' + file.name + '…', '', 0);
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var incoming = JSON.parse(e.target.result);
        /* Strip metadata wrapper keys */
        ['_version','_app','_section','_collection','_exportedAt','_note',
         '_updated','_exported'].forEach(function (k) { delete incoming[k]; });
        /* Merge with existing localStorage data */
        var existing = {};
        try { existing = JSON.parse(localStorage.getItem('chm_sitedata') || '{}'); } catch(_){}
        var merged = Object.assign({}, existing, incoming);
        localStorage.setItem('chm_sitedata', JSON.stringify(merged));
        showToast('✅ ' + file.name + ' imported! Reloading…', 'ok', 3000);
        setTimeout(function () { location.reload(); }, 1500);
      } catch (err) { showToast('❌ Import failed: ' + err.message, 'err'); }
    };
    reader.readAsText(file);
    fileIn.value = '';
  }

  /* ── PUSH TO GITHUB ──────────────────────────────────────────── */
  async function doPush(full) {
    var token  = localStorage.getItem('chm_gh_token')  || '';
    var owner  = localStorage.getItem('chm_gh_owner')  || 'yodebepro';
    var repo   = localStorage.getItem('chm_gh_repo')   || 'CHM-Church-of-God';
    var branch = localStorage.getItem('chm_gh_branch') || 'main';
    if (!token) {
      showToast('⚠️ No GitHub token. Go to <b>github-setup.html</b> first.', 'warn', 7000);
      return;
    }
    var raw = localStorage.getItem('chm_sitedata');
    if (!raw) { showToast('⚠️ No local data to push.', 'warn'); return; }

    var allData = JSON.parse(raw);
    var result  = buildSectionData(allData, full);
    var repoFile = result.filename;

    showToast('🚀 Connecting to GitHub… pushing <b>' + repoFile + '</b>', '', 0);

    try {
      var pushData = JSON.parse(JSON.stringify(result.data));
      pushData._updatedAt = new Date().toISOString();

      /* Strip base64 images (GitHub API has size limits) */
      var IMG_FIELDS = ['photo','image','imageUrl','mediaUrl','photoUrl','thumbnailUrl',
                        'video','audio','heroImage','bannerImage'];
      var COLLECTIONS = ['leaders','announcements','events','sermons','gallery',
                         'ministries','departments','teams','locations','hero','about'];
      COLLECTIONS.forEach(function (col) {
        if (!pushData[col]) return;
        pushData[col] = pushData[col].map(function (item) {
          var c = Object.assign({}, item);
          IMG_FIELDS.forEach(function (f) {
            if (c[f] && typeof c[f]==='string' && c[f].startsWith('data:'))
              c[f] = '__local_only__';
          });
          if (c.images && Array.isArray(c.images))
            c.images = c.images.map(function (img) {
              return (typeof img==='string' && img.startsWith('data:')) ? '__local_only__' : img;
            });
          return c;
        });
      });

      /* Get current file SHA */
      var getR = await fetch(
        'https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+repoFile,
        { headers: { Authorization:'token '+token, Accept:'application/vnd.github.v3+json' } }
      );
      var sha = getR.ok ? (await getR.json()).sha || '' : '';

      /* Push the file */
      var content = btoa(unescape(encodeURIComponent(JSON.stringify(pushData, null, 2))));
      var putR = await fetch(
        'https://api.github.com/repos/'+owner+'/'+repo+'/contents/'+repoFile,
        {
          method: 'PUT',
          headers: { Authorization:'token '+token, 'Content-Type':'application/json',
                     Accept:'application/vnd.github.v3+json' },
          body: JSON.stringify({
            message: 'CMS update [' + dept.label + '] ' + new Date().toISOString(),
            content, sha, branch
          })
        }
      );

      if (putR.ok) {
        showToast(
          '🌐 <b>' + repoFile + '</b> published!<br>' +
          'Live in ~60 s → <a href="https://'+owner+'.github.io/'+repo+'/" ' +
          'target="_blank" style="color:#c8913a">View Site</a><br>' +
          '<small style="opacity:.7">Tip: For photos/videos use Export→Upload (base64 stays intact)</small>',
          'ok', 12000);
      } else {
        var err = await putR.json().catch(function(){return{};});
        showToast('❌ GitHub error: ' + (err.message || putR.status), 'err');
      }
    } catch (e) { showToast('❌ Network error: ' + e.message, 'err'); }
  }

  /* ── Wire buttons ────────────────────────────────────────────── */
  function bind(id, fn) { var el=document.getElementById(id); if(el) el.addEventListener('click',fn); }
  bind('eb-exp',  function(){ doExport(false); });
  bind('eb-imp',  function(){ fileIn.click(); });
  bind('eb-push', function(){ doPush(false); });
  bind('eb-all',  function(){ doExport(true); });
  bind('pill-exp',  function(){ doExport(false); });
  bind('pill-imp',  function(){ fileIn.click(); });
  bind('pill-push', function(){ doPush(false); });
  bind('pill-all',  function(){ doExport(true); });
  fileIn.addEventListener('change', function(){ doImport(fileIn.files[0]); });

  /* ── First-visit hint ────────────────────────────────────────── */
  if (!sessionStorage.getItem('chm_dt4_seen')) {
    setTimeout(function(){
      showToast('💡 Export <b>'+sectionFile+'</b> → upload to GitHub → '+dept.label+' page auto-loads it 🌐', '', 5000);
      sessionStorage.setItem('chm_dt4_seen','1');
    }, 2500);
  }

})();
