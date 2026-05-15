/* CHM CHURCH OF GOD — CMS Public Loader v5
   Reads site-data.json from GitHub — works on ALL devices globally */
(function() {
  'use strict';

  var OWNER  = 'yodebepro';
  var REPO   = 'CHM-Church-of-God';
  var BRANCH = 'main';

  var siteData = null;

  /* ── Fetch site-data.json from GitHub ─────────────────────── */
  async function load() {
    var ts = '?_=' + Date.now();
    var urls = [
      'https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/'+BRANCH+'/site-data.json'+ts,
      'https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/refs/heads/'+BRANCH+'/site-data.json'+ts,
      'https://cdn.jsdelivr.net/gh/'+OWNER+'/'+REPO+'@'+BRANCH+'/site-data.json'+ts
    ];

    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache: 'no-store', headers: { 'Pragma': 'no-cache' } });
        if (res.ok) {
          var text = await res.text();
          siteData = JSON.parse(text);
          try { localStorage.setItem('chm_sd_bk', text); } catch(e) {}
          applyAll();
          return;
        }
      } catch(e) {}
    }

    // Fallback: localStorage backup
    try {
      var bk = localStorage.getItem('chm_sd_bk') || localStorage.getItem('chm_sitedata');
      if (bk) { siteData = JSON.parse(bk); applyAll(); }
    } catch(e) {}
  }

  function published(col) {
    return (siteData && siteData[col] || []).filter(function(x){ return x._status==='published'; });
  }
  function cfg(key) {
    return (siteData && siteData.site_config && siteData.site_config[key]) || {};
  }

  /* ── Apply everything ──────────────────────────────────────── */
  function applyAll() {
    applyTheme();
    applyInfo();

    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page===''||page==='index.html')  doHome();
    if (page==='leaders.html')           doLeaders();
    if (page==='announcements.html')     doAnnouncements();
    if (page==='events.html')            doEvents();
    if (page==='sermons.html')           doSermons();
    if (page==='gallery.html')           doGallery();
    if (page==='ministries.html')        doMinistries();
    if (page==='about.html')             doAbout();
  }

  /* ── Theme ─────────────────────────────────────────────────── */
  function applyTheme() {
    var c = cfg('colors');
    var r = document.documentElement.style;
    if (c.navy) r.setProperty('--navy', c.navy);
    if (c.gold) r.setProperty('--gold', c.gold);
    var bg = c.bgCss || c.bg;
    if (bg) document.body.style.background = bg;
    if (c.footerBg || c.footerText) {
      each('.site-footer', function(el){
        if (c.footerBg)   el.style.setProperty('background', c.footerBg, 'important');
        if (c.footerText) el.style.setProperty('color', c.footerText, 'important');
      });
    }
  }

  /* ── Church info ───────────────────────────────────────────── */
  function applyInfo() {
    var info  = cfg('church_info');
    var times = cfg('service_times');
    var hero  = cfg('hero');

    if (info.addr)  each('[data-cms="address"]', function(el){ el.textContent=info.addr; });
    if (info.phone) each('[data-cms="phone"]',   function(el){ el.textContent=info.phone; });
    if (info.email) each('[data-cms="email"]',   function(el){ el.textContent=info.email; });
    if (info.about) each('.footer-about',        function(el){ el.textContent=info.about; });
    if (times.sun)  each('[data-cms="time-sun"]',function(el){ el.textContent=times.sun; });
    if (times.wed)  each('[data-cms="time-wed"]',function(el){ el.textContent=times.wed; });
    if (times.fri)  each('[data-cms="time-fri"]',function(el){ el.textContent=times.fri; });

    var vid = hero.videoUrl || '';
    if (vid) injectHeroVideo(vid);
  }

  function injectHeroVideo(url) {
    var heroEl = document.querySelector('.hero');
    if (!heroEl || heroEl.querySelector('.cms-hero-video')) return;
    var v = document.createElement('video');
    v.className='cms-hero-video'; v.autoplay=true; v.muted=true; v.loop=true; v.playsInline=true;
    v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.4;pointer-events:none;';
    v.innerHTML='<source src="'+url+'" type="video/mp4"/>';
    heroEl.style.position='relative';
    heroEl.insertBefore(v, heroEl.firstChild);
  }

  /* ── HOME ──────────────────────────────────────────────────── */
  function doHome() {
    var h = cfg('page_home');
    if (h.eyebrow) { var el=qs('.hero-eyebrow'); if(el) el.innerHTML=h.eyebrow; }
    if (h.title)   { var el=qs('.hero-title');   if(el) el.innerHTML=h.title; }
    if (h.verse)   { var el=qs('.hero-verse');   if(el) el.innerHTML=h.verse; }
  }

  /* ── LEADERS ───────────────────────────────────────────────── */
  function doLeaders() {
    var leaders = published('leaders');
    if (!leaders.length) return; // keep static fallback

    var grid = document.getElementById('cms-leaders-grid');
    if (!grid) return;

    // Show the dynamic grid
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
    grid.style.gap = '2rem';
    grid.style.marginBottom = '3rem';

    grid.innerHTML = leaders.map(function(l) {
      var name = ((l.first||'') + ' ' + (l.last||'')).trim();

      var photoHtml = l.photo
        ? '<img src="' + l.photo + '" alt="' + esc(name) + '" '
          + 'style="width:100%;height:100%;object-fit:cover;display:block;" '
          + 'onerror="this.parentElement.innerHTML=\'<div class=&quot;leader-img-placeholder&quot;>👤</div>\'">'
        : '<div class="leader-img-placeholder">👤</div>';

      return '<div class="leader-card">'
        + '<div style="overflow:hidden;">' + photoHtml + '</div>'
        + '<div class="leader-body">'
        + '<h4 class="leader-name">' + esc(name) + '</h4>'
        + '<div class="leader-title">' + esc(l.role||'') + '</div>'
        + (l.dept ? '<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem;">' + esc(l.dept) + '</div>' : '')
        + (l.bio  ? '<p class="leader-bio">' + esc(l.bio) + '</p>' : '')
        + (l.email? '<p style="font-size:.75rem;color:var(--gold);margin-top:.5rem;">✉️ ' + esc(l.email) + '</p>' : '')
        + '</div></div>';
    }).join('');

    // Hide static placeholders now that we have real data
    each('.grid-4', function(el){
      if (el.id !== 'cms-leaders-grid') el.style.display = 'none';
    });
    each('.grid-3', function(el){
      if (el.id !== 'cms-leaders-grid') el.style.display = 'none';
    });
  }

  /* ── ANNOUNCEMENTS ─────────────────────────────────────────── */
  function doAnnouncements() {
    var items = published('announcements');
    if (!items.length) return;
    var el = qs('#cms-announcements-grid');
    if (!el) return;
    el.innerHTML = items.map(function(a){
      return '<div class="ann-card" style="background:#fff;border-radius:14px;padding:1.4rem;border-left:4px solid var(--gold);box-shadow:0 2px 8px rgba(0,0,0,.07);">'
        + '<div style="font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;">' + esc(a.category||'Announcement') + '</div>'
        + '<h4 style="font-size:1.05rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">' + esc(a.title||'') + '</h4>'
        + '<p style="font-size:.87rem;color:#374151;line-height:1.7;">' + esc(a.body||'') + '</p>'
        + (a.date?'<div style="font-size:.74rem;color:#9ca3af;margin-top:.65rem;">'+esc(a.date)+'</div>':'')
        + '</div>';
    }).join('');
  }

  /* ── EVENTS ────────────────────────────────────────────────── */
  function doEvents() {
    var items = published('events');
    if (!items.length) return;
    var el = qs('#cms-events-grid');
    if (!el) return;
    var months=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.innerHTML = items.map(function(e){
      var p = (e.date||'').split('-');
      return '<div style="background:#fff;border-radius:14px;padding:1.4rem;box-shadow:0 2px 8px rgba(0,0,0,.07);display:flex;gap:1.1rem;align-items:flex-start;">'
        + '<div style="text-align:center;min-width:50px;background:var(--navy);color:#fff;border-radius:10px;padding:.55rem .4rem;flex-shrink:0;">'
        + '<div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:var(--gold);">' + (p[1]?months[+p[1]]:'') + '</div>'
        + '<div style="font-size:1.45rem;font-weight:900;line-height:1;">' + (p[2]||'—') + '</div>'
        + '<div style="font-size:.6rem;color:rgba(255,255,255,.5);">' + (p[0]||'') + '</div></div>'
        + '<div><div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--gold);margin-bottom:.3rem;">' + esc(e.category||'Event') + '</div>'
        + '<h4 style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:.35rem;">' + esc(e.name||'') + '</h4>'
        + (e.time?'<div style="font-size:.8rem;color:#6b7280;">🕐 '+esc(e.time)+'</div>':'')
        + (e.location?'<div style="font-size:.8rem;color:#6b7280;">📍 '+esc(e.location)+'</div>':'')
        + (e.desc?'<p style="font-size:.82rem;color:#6b7280;margin-top:.35rem;">'+esc(e.desc)+'</p>':'')
        + '</div></div>';
    }).join('');
  }

  /* ── SERMONS ───────────────────────────────────────────────── */
  function doSermons() {
    var items = published('sermons');
    if (!items.length) return;
    var el = qs('#cms-sermons-grid');
    if (!el) return;
    el.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1.5rem;';
    el.innerHTML = items.map(function(s){
      return '<div style="background:#fff;border-radius:16px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.08);">'
        + '<div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);margin-bottom:.35rem;">' + esc(s.series||'Sermon') + (s.date?' · '+esc(s.date):'') + '</div>'
        + '<h4 style="font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:.3rem;">' + esc(s.title||'') + '</h4>'
        + (s.speaker?'<div style="font-size:.82rem;color:#6b7280;margin-bottom:.4rem;">🎙 '+esc(s.speaker)+'</div>':'')
        + (s.scripture?'<div style="font-size:.8rem;color:var(--gold);margin-bottom:.7rem;">📖 '+esc(s.scripture)+'</div>':'')
        + (s.desc?'<p style="font-size:.83rem;color:#6b7280;line-height:1.6;margin-bottom:.8rem;">'+esc(s.desc)+'</p>':'')
        + '<div style="display:flex;gap:.5rem;flex-wrap:wrap;">'
        + (s.video?'<a href="'+s.video+'" target="_blank" style="padding:.42rem .95rem;background:var(--navy);color:var(--gold);border-radius:50px;font-size:.78rem;font-weight:700;text-decoration:none;">▶ Watch</a>':'')
        + (s.audio?'<a href="'+s.audio+'" target="_blank" style="padding:.42rem .95rem;background:#f4f5f7;color:var(--navy);border-radius:50px;font-size:.78rem;font-weight:700;text-decoration:none;">🎵 Listen</a>':'')
        + '</div></div>';
    }).join('');
  }

  /* ── GALLERY ───────────────────────────────────────────────── */
  function doGallery() {
    var items = published('gallery');
    if (!items.length) return;
    var el = qs('#cms-gallery-grid');
    if (!el) return;
    el.innerHTML = items.map(function(g,i){
      return '<div class="gallery-item '+(i===0||i===3?'wide':'')+'">'
        + '<img src="'+g.url+'" alt="'+esc(g.title||'')+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"/>'
        + '<div class="gallery-overlay"><span class="gallery-caption">'+esc(g.title||'')+'</span></div></div>';
    }).join('');
  }

  /* ── MINISTRIES ────────────────────────────────────────────── */
  function doMinistries() {
    var items = published('ministries');
    if (!items.length) return;
    var el = qs('#cms-ministries-grid');
    if (!el) return;
    el.innerHTML = items.map(function(m){
      return '<div class="ministry-card">'
        + '<div class="min-icon">'+(m.icon||'⛪')+'</div>'
        + '<h3 class="min-title">'+esc(m.name||'')+'</h3>'
        + '<p class="min-desc">'+esc(m.desc||'')+'</p>'
        + (m.leader?'<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">👤 '+esc(m.leader)+'</p>':'')
        + (m.meeting?'<p style="font-size:.78rem;color:#9ca3af;">🕐 '+esc(m.meeting)+'</p>':'')
        + '</div>';
    }).join('');
  }

  /* ── ABOUT ─────────────────────────────────────────────────── */
  function doAbout() {
    var a = cfg('page_about');
    if (a.mission) setText('#cms-mission', a.mission);
    if (a.vision)  setText('#cms-vision',  a.vision);
    if (a.story)   setText('#cms-story',   a.story);
  }

  /* ── HELPERS ───────────────────────────────────────────────── */
  function qs(sel)       { return document.querySelector(sel); }
  function each(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
  function setText(sel, val) { var el=qs(sel); if(el) el.textContent=val; }
  function esc(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ── START ─────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }

})();
