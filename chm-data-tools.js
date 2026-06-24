/* ============================================================
   CHM DATA TOOLS — Import / Export / Push
   Adds a floating toolbar to every admin page so content
   created locally can be exported as site-data.json and
   uploaded to GitHub to become globally visible.
   ============================================================ */

(function() {
  'use strict';

  /* ── Inject CSS ───────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [
    '#chm-data-bar{position:fixed;bottom:20px;right:20px;z-index:99999;',
    'display:flex;flex-direction:column;gap:8px;align-items:flex-end;}',

    '#chm-data-toggle{width:50px;height:50px;border-radius:50%;',
    'background:linear-gradient(135deg,#0a1f44,#1a3a6b);color:#c8913a;',
    'border:2px solid #c8913a;font-size:1.3rem;cursor:pointer;',
    'box-shadow:0 4px 18px rgba(0,0,0,.35);display:flex;',
    'align-items:center;justify-content:center;transition:.2s;}',
    '#chm-data-toggle:hover{transform:scale(1.08);}',

    '#chm-data-panel{background:#fff;border-radius:14px;padding:14px 16px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.22);border:1px solid #e5e7eb;',
    'min-width:270px;display:none;flex-direction:column;gap:8px;}',
    '#chm-data-panel.open{display:flex;}',

    '#chm-data-panel h4{margin:0 0 4px;font-size:.78rem;font-weight:800;',
    'text-transform:uppercase;letter-spacing:.1em;color:#6b7280;}',

    '.dbt{display:flex;align-items:center;gap:9px;padding:9px 14px;',
    'border-radius:9px;border:none;cursor:pointer;font-size:.85rem;',
    'font-weight:600;width:100%;text-align:left;transition:.15s;}',
    '.dbt:hover{filter:brightness(.93);}',
    '.dbt .dbt-icon{font-size:1.1rem;flex-shrink:0;}',
    '.dbt .dbt-lbl{flex:1;}',

    '.dbt-export{background:#e0f2fe;color:#0369a1;}',
    '.dbt-import{background:#f0fdf4;color:#15803d;}',
    '.dbt-push  {background:#fef3c7;color:#92400e;}',
    '.dbt-clear {background:#fef2f2;color:#991b1b;}',

    '#dbt-status{font-size:.76rem;padding:6px 10px;border-radius:7px;',
    'display:none;margin-top:2px;line-height:1.4;}',
    '#dbt-status.ok   {background:#dcfce7;color:#166534;}',
    '#dbt-status.warn {background:#fef9c3;color:#713f12;}',
    '#dbt-status.err  {background:#fee2e2;color:#991b1b;}',
    '#dbt-status.info {background:#e0f2fe;color:#0c4a6e;}',

    '#dbt-file-input{display:none;}'
  ].join('');
  document.head.appendChild(style);

  /* ── Build DOM ────────────────────────────────────────────── */
  var bar = document.createElement('div');
  bar.id = 'chm-data-bar';
  bar.innerHTML = [
    '<div id="chm-data-panel">',
      '<h4>&#128196; Data Tools</h4>',

      '<button class="dbt dbt-export" id="dbt-export">',
        '<span class="dbt-icon">&#128228;</span>',
        '<span class="dbt-lbl">Export site-data.json</span>',
      '</button>',

      '<button class="dbt dbt-import" id="dbt-import">',
        '<span class="dbt-icon">&#128229;</span>',
        '<span class="dbt-lbl">Import site-data.json</span>',
      '</button>',

      '<button class="dbt dbt-push" id="dbt-push">',
        '<span class="dbt-icon">&#128640;</span>',
        '<span class="dbt-lbl">Push to GitHub (publish globally)</span>',
      '</button>',

      '<button class="dbt dbt-clear" id="dbt-clear">',
        '<span class="dbt-icon">&#128465;</span>',
        '<span class="dbt-lbl">Clear local cache</span>',
      '</button>',

      '<div id="dbt-status"></div>',
      '<input type="file" id="dbt-file-input" accept=".json">',
    '</div>',
    '<button id="chm-data-toggle" title="Data Tools">&#128230;</button>'
  ].join('');
  document.body.appendChild(bar);

  var panel  = document.getElementById('chm-data-panel');
  var toggle = document.getElementById('chm-data-toggle');
  var status = document.getElementById('dbt-status');
  var fileIn = document.getElementById('dbt-file-input');

  function showStatus(msg, type) {
    status.innerHTML = msg;
    status.className = type || 'info';
    status.style.display = 'block';
    if (type === 'ok') setTimeout(function() { status.style.display='none'; }, 4000);
  }

  toggle.addEventListener('click', function() {
    panel.classList.toggle('open');
    toggle.textContent = panel.classList.contains('open') ? '✕' : '📦';
  });

  /* ── EXPORT ───────────────────────────────────────────────── */
  document.getElementById('dbt-export').addEventListener('click', function() {
    try {
      // Get the full site-data from localStorage
      var raw = localStorage.getItem('chm_sitedata');
      if (!raw) {
        showStatus('⚠ No local data found yet — add some content first.', 'warn');
        return;
      }
      var data = JSON.parse(raw);
      data._exported = new Date().toISOString();
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], {type: 'application/json'});
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = 'site-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus('✅ site-data.json downloaded!<br>Upload it to your GitHub repo root to publish globally.', 'ok');
    } catch(e) {
      showStatus('❌ Export failed: ' + e.message, 'err');
    }
  });

  /* ── IMPORT ───────────────────────────────────────────────── */
  document.getElementById('dbt-import').addEventListener('click', function() {
    fileIn.click();
  });

  fileIn.addEventListener('change', function() {
    var file = fileIn.files[0];
    if (!file) return;
    showStatus('Reading file...', 'info');
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        // Accept either raw site-data.json or wrapped export
        var toSave = data.collections || data;
        localStorage.setItem('chm_sitedata', JSON.stringify(toSave));
        showStatus('✅ Imported! Reloading page...', 'ok');
        setTimeout(function() { location.reload(); }, 1200);
      } catch(err) {
        showStatus('❌ Import failed: ' + err.message, 'err');
      }
    };
    reader.readAsText(file);
    fileIn.value = ''; // reset so same file can be re-imported
  });

  /* ── PUSH TO GITHUB ───────────────────────────────────────── */
  document.getElementById('dbt-push').addEventListener('click', async function() {
    var token  = localStorage.getItem('chm_gh_token')  || '';
    var owner  = localStorage.getItem('chm_gh_owner')  || 'yodebepro';
    var repo   = localStorage.getItem('chm_gh_repo')   || 'CHM-Church-of-God';
    var branch = localStorage.getItem('chm_gh_branch') || 'main';

    if (!token) {
      showStatus('⚠ No GitHub token set.<br>Go to <a href="github-setup.html" style="color:#0369a1">github-setup.html</a> to add your token.', 'warn');
      return;
    }

    var raw = localStorage.getItem('chm_sitedata');
    if (!raw) { showStatus('⚠ No local data to push.', 'warn'); return; }

    showStatus('🚀 Pushing to GitHub...', 'info');
    try {
      var data    = JSON.parse(raw);
      data._updated = new Date().toISOString();

      // Get current SHA
      var getR = await fetch(
        'https://api.github.com/repos/'+owner+'/'+repo+'/contents/site-data.json',
        { headers:{ 'Authorization':'token '+token, 'Accept':'application/vnd.github.v3+json' } }
      );
      var sha = '';
      if (getR.ok) sha = (await getR.json()).sha || '';

      var content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
      var putR = await fetch(
        'https://api.github.com/repos/'+owner+'/'+repo+'/contents/site-data.json',
        {
          method: 'PUT',
          headers:{ 'Authorization':'token '+token, 'Content-Type':'application/json', 'Accept':'application/vnd.github.v3+json' },
          body: JSON.stringify({ message:'CMS update: '+new Date().toISOString(), content, sha, branch })
        }
      );

      if (putR.ok) {
        localStorage.setItem('chm_sitedata', JSON.stringify(data));
        showStatus('🌐 Published! Live globally within ~60 seconds.<br>URL: <a href="https://'+owner+'.github.io/'+repo+'/" target="_blank" style="color:#0369a1">View Site</a>', 'ok');
      } else {
        var err = await putR.json().catch(function(){return {};});
        showStatus('❌ GitHub error: ' + (err.message || putR.status), 'err');
      }
    } catch(e) {
      showStatus('❌ Network error: ' + e.message, 'err');
    }
  });

  /* ── CLEAR CACHE ──────────────────────────────────────────── */
  document.getElementById('dbt-clear').addEventListener('click', function() {
    if (!confirm('Clear ALL local CMS data? This cannot be undone.\n\nMake sure you exported your JSON first!')) return;
    localStorage.removeItem('chm_sitedata');
    localStorage.removeItem('chm_public_feed');
    showStatus('✅ Local cache cleared. Reloading...', 'ok');
    setTimeout(function() { location.reload(); }, 1000);
  });

})();
