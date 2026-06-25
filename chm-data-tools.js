/* ============================================================
   CHM DATA TOOLS — Import / Export / Push to GitHub
   Adds a floating 📦 toolbar to every admin page so content
   saved locally can be exported and uploaded to GitHub to
   become globally visible on the public website.
   ============================================================ */
(function() {
  'use strict';

  var style = document.createElement('style');
  style.textContent = '#chm-dt-bar{position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:flex-end}'
    +'#chm-dt-toggle{width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#0a1f44,#1a3a6b);color:#c8913a;border:2px solid #c8913a;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transition:.2s}'
    +'#chm-dt-toggle:hover{transform:scale(1.08)}'
    +'#chm-dt-panel{background:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 8px 32px rgba(0,0,0,.22);border:1px solid #e5e7eb;min-width:270px;display:none;flex-direction:column;gap:8px}'
    +'#chm-dt-panel.open{display:flex}'
    +'#chm-dt-panel h4{margin:0 0 4px;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#6b7280}'
    +'.dbt{display:flex;align-items:center;gap:9px;padding:9px 14px;border-radius:9px;border:none;cursor:pointer;font-size:.85rem;font-weight:600;width:100%;text-align:left;transition:.15s}'
    +'.dbt:hover{filter:brightness(.93)}'
    +'.dbt .di{font-size:1.1rem;flex-shrink:0}'
    +'.dbt-exp{background:#e0f2fe;color:#0369a1}'
    +'.dbt-imp{background:#f0fdf4;color:#15803d}'
    +'.dbt-push{background:#fef3c7;color:#92400e}'
    +'.dbt-clr{background:#fef2f2;color:#991b1b}'
    +'#dt-status{font-size:.76rem;padding:6px 10px;border-radius:7px;display:none;margin-top:2px;line-height:1.4}'
    +'#dt-status.ok{background:#dcfce7;color:#166534}'
    +'#dt-status.warn{background:#fef9c3;color:#713f12}'
    +'#dt-status.err{background:#fee2e2;color:#991b1b}'
    +'#dt-status.info{background:#e0f2fe;color:#0c4a6e}'
    +'#dt-file{display:none}';
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.id = 'chm-dt-bar';
  bar.innerHTML = '<div id="chm-dt-panel">'
    +'<h4>&#128196; Data Tools</h4>'
    +'<button class="dbt dbt-exp" id="dt-export"><span class="di">&#128228;</span> Export site-data.json</button>'
    +'<button class="dbt dbt-imp" id="dt-import"><span class="di">&#128229;</span> Import site-data.json</button>'
    +'<button class="dbt dbt-push" id="dt-push"><span class="di">&#128640;</span> Push to GitHub (publish globally)</button>'
    +'<button class="dbt dbt-clr" id="dt-clear"><span class="di">&#128465;</span> Clear local cache</button>'
    +'<div id="dt-status"></div>'
    +'<input type="file" id="dt-file" accept=".json">'
    +'</div>'
    +'<button id="chm-dt-toggle" title="Data Tools">&#128230;</button>';
  document.body.appendChild(bar);

  var panel  = document.getElementById('chm-dt-panel');
  var toggle = document.getElementById('chm-dt-toggle');
  var status = document.getElementById('dt-status');
  var fileIn = document.getElementById('dt-file');

  function showStatus(msg, type) {
    status.innerHTML = msg;
    status.className = type || 'info';
    status.style.display = 'block';
    if (type === 'ok') setTimeout(function(){ status.style.display='none'; }, 5000);
  }

  toggle.addEventListener('click', function() {
    panel.classList.toggle('open');
    toggle.innerHTML = panel.classList.contains('open') ? '&#10005;' : '&#128230;';
  });

  /* ── EXPORT ─────────────────────────────────────────────────── */
  document.getElementById('dt-export').addEventListener('click', function() {
    try {
      var raw = localStorage.getItem('chm_sitedata');
      if (!raw) { showStatus('&#9888; No local data yet — add some content first.', 'warn'); return; }
      var data = JSON.parse(raw);
      data._exported = new Date().toISOString();
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], {type:'application/json'});
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = 'site-data.json';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      showStatus('&#10003; site-data.json downloaded!<br>Upload it to your GitHub repo root to publish globally.', 'ok');
    } catch(e) { showStatus('&#10007; Export failed: '+e.message, 'err'); }
  });

  /* ── IMPORT ─────────────────────────────────────────────────── */
  document.getElementById('dt-import').addEventListener('click', function() { fileIn.click(); });
  fileIn.addEventListener('change', function() {
    var file = fileIn.files[0]; if (!file) return;
    showStatus('Reading file...', 'info');
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        localStorage.setItem('chm_sitedata', JSON.stringify(data.collections || data));
        showStatus('&#10003; Imported! Reloading...', 'ok');
        setTimeout(function(){ location.reload(); }, 1200);
      } catch(err) { showStatus('&#10007; Import failed: '+err.message, 'err'); }
    };
    reader.readAsText(file);
    fileIn.value = '';
  });

  /* ── PUSH TO GITHUB ─────────────────────────────────────────── */
  document.getElementById('dt-push').addEventListener('click', async function() {
    var token  = localStorage.getItem('chm_gh_token')  || '';
    var owner  = localStorage.getItem('chm_gh_owner')  || 'yodebepro';
    var repo   = localStorage.getItem('chm_gh_repo')   || 'CHM-Church-of-God';
    var branch = localStorage.getItem('chm_gh_branch') || 'main';
    if (!token) { showStatus('&#9888; No GitHub token. Go to <a href="github-setup.html">github-setup.html</a> to add it.', 'warn'); return; }
    var raw = localStorage.getItem('chm_sitedata');
    if (!raw) { showStatus('&#9888; No local data to push.', 'warn'); return; }
    showStatus('&#128640; Pushing to GitHub...', 'info');
    try {
      var data = JSON.parse(raw);
      data._updated = new Date().toISOString();
      var getR = await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/contents/site-data.json',
        {headers:{Authorization:'token '+token,Accept:'application/vnd.github.v3+json'}});
      var sha = getR.ok ? (await getR.json()).sha || '' : '';
      var content = btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2))));
      var putR = await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/contents/site-data.json',
        {method:'PUT',headers:{Authorization:'token '+token,'Content-Type':'application/json',Accept:'application/vnd.github.v3+json'},
         body:JSON.stringify({message:'CMS update '+new Date().toISOString(),content,sha,branch})});
      if (putR.ok) {
        localStorage.setItem('chm_sitedata', JSON.stringify(data));
        showStatus('&#127760; Published! Live in ~60s.<br><a href="https://'+owner+'.github.io/'+repo+'/" target="_blank">View Site</a>', 'ok');
      } else {
        var err = await putR.json().catch(function(){return {};});
        showStatus('&#10007; GitHub error: '+(err.message||putR.status), 'err');
      }
    } catch(e) { showStatus('&#10007; Network error: '+e.message, 'err'); }
  });

  /* ── CLEAR CACHE ────────────────────────────────────────────── */
  document.getElementById('dt-clear').addEventListener('click', function() {
    if (!confirm('Clear ALL local CMS data?\nMake sure you exported your JSON first!')) return;
    localStorage.removeItem('chm_sitedata');
    localStorage.removeItem('chm_sd_bk');
    showStatus('&#10003; Cache cleared. Reloading...', 'ok');
    setTimeout(function(){ location.reload(); }, 1000);
  });

})();
