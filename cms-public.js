/* ================================================================
   CHM CHURCH OF GOD — CMS Public Loader v3
   Reads from site-data.json on GitHub (global, all devices)
   Falls back to localStorage if GitHub unreachable
================================================================ */
(function() {
  'use strict';

  const OWNER  = 'yodebepro';
  const REPO   = 'CHM-Church-of-God';
  const BRANCH = 'main';
  // Two URL formats — try both to handle GitHub CDN quirks
  const URLS = [
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/site-data.json`,
    `https://raw.githubusercontent.com/${OWNER}/${REPO}/refs/heads/${BRANCH}/site-data.json`
  ];

  var data = null;

  /* ── FETCH site-data.json ────────────────────────────────── */
  async function fetchData() {
    for (var i = 0; i < URLS.length; i++) {
      try {
        var res = await fetch(URLS[i] + '?_=' + Date.now(), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          data = await res.json();
          // Mirror to localStorage as backup
          try { localStorage.setItem('chm_sitedata_mirror', JSON.stringify(data)); } catch(e) {}
          return true;
        }
      } catch(e) {}
    }
    // Fallback to localStorage mirror
    try {
      var saved = localStorage.getItem('chm_sitedata_mirror') || localStorage.getItem('chm_sitedata');
      if (saved) { data = JSON.parse(saved); return true; }
    } catch(e) {}
    return false;
  }

  function getCol(col) {
    if (!data || !data[col]) return [];
    return data[col].filter(function(x) { return x._status === 'published'; });
  }

  function getCfg(section) {
    if (!data || !data.site_config) return {};
    return data.site_config[section] || {};
  }

  /* ── INIT ────────────────────────────────────────────────── */
  async function init() {
    var ok = await fetchData();
    if (!ok) return;
    applyAll();
  }

  function applyAll() {
    applyTheme();
    applyChurchInfo();
    var page = location.pathname.split('/').pop() || 'index.html';
    if (page === '' || page === 'index.html') loadHome();
    if (page === 'leaders.html')              loadLeaders();
    if (page === 'announcements.html')        loadAnnouncements();
    if (page === 'events.html')               loadEvents();
    if (page === 'sermons.html')              loadSermons();
    if (page === 'gallery.html')              loadGallery();
    if (page === 'ministries.html')           loadMinistries();
    if (page === 'about.html')               loadAbout();
    if (page === 'watch-live.html')          loadWatchLive();
  }

  /* ── THEME ───────────────────────────────────────────────── */
  function applyTheme() {
    var c = getCfg('colors');
    var r = document.documentElement.style;
    if (c.navy) r.setProperty('--navy', c.navy);
    if (c.gold) r.setProperty('--gold', c.gold);
    var bg = c.bgCss || c.bg;
    if (bg) document.body.style.background = bg;
    if (c.footerBg || c.footerText) {
      document.querySelectorAll('.site-footer').forEach(function(el) {
        if (c.footerBg)   el.style.background = c.footerBg;
        if (c.footerText) el.style.color = c.footerText;
      });
    }
  }

  /* ── CHURCH INFO ─────────────────────────────────────────── */
  function applyChurchInfo() {
    var info  = getCfg('church_info');
    var times = getCfg('service_times');
    var hero  = getCfg('hero');
    if (info.addr)  document.querySelectorAll('[data-cms="address"]').forEach(function(el){ el.textContent = info.addr; });
    if (info.phone) document.querySelectorAll('[data-cms="phone"]').forEach(function(el){ el.textContent = info.phone; });
    if (info.email) document.querySelectorAll('[data-cms="email"]').forEach(function(el){ el.textContent = info.email; });
    if (info.about) document.querySelectorAll('.footer-about').forEach(function(el){ el.textContent = info.about; });
    if (times.sun) document.querySelectorAll('[data-cms="time-sun"]').forEach(function(el){ el.textContent = times.sun; });
    if (times.wed) document.querySelectorAll('[data-cms="time-wed"]').forEach(function(el){ el.textContent = times.wed; });
    if (times.fri) document.querySelectorAll('[data-cms="time-fri"]').forEach(function(el){ el.textContent = times.fri; });
    // Hero background video
    var vid = (hero && hero.videoUrl) || '';
    if (vid) injectHeroVideo(vid);
  }

  function injectHeroVideo(url) {
    var hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-video-bg')) return;
    var v = document.createElement('video');
    v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    v.className = 'hero-video-bg';
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.45;pointer-events:none;';
    v.innerHTML = '<source src="' + url + '" type="video/mp4"/>';
    hero.style.position = 'relative';
    hero.insertBefore(v, hero.firstChild);
  }

  /* ── HOME ────────────────────────────────────────────────── */
  function loadHome() {
    var h = getCfg('page_home');
    if (h.eyebrow) { var el = document.querySelector('.hero-eyebrow'); if(el) el.innerHTML = h.eyebrow; }
    if (h.title)   { var el = document.querySelector('.hero-title');   if(el) el.innerHTML = h.title; }
    if (h.verse)   { var el = document.querySelector('.hero-verse');   if(el) el.innerHTML = h.verse; }
  }

  /* ── WATCH LIVE ──────────────────────────────────────────── */
  function loadWatchLive() {
    // Admin can set a custom YouTube video ID via site_config
    var live = getCfg('watch_live');
    if (live.youtubeId) {
      var frame = document.getElementById('cmsYouTubeFrame');
      if (frame) {
        frame.src = 'https://www.youtube.com/embed/' + live.youtubeId +
          '?rel=0&modestbranding=1&iv_load_policy=3&disablekb=1';
      }
    }
  }

  /* ── LEADERS ─────────────────────────────────────────────── */
  function loadLeaders() {
    var leaders = getCol('leaders');
    if (!leaders.length) return;
    var grid = document.getElementById('cms-leaders-grid');
    if (!grid) return;
    grid.style.display = 'grid';
    grid.innerHTML = leaders.map(function(l) {
      var photo = l.photo
        ? '<img src="'+l.photo+'" alt="'+(l.first||'')+' '+(l.last||'')+'" style="width:100%;aspect-ratio:1;object-fit:cover;" onerror="this.outerHTML=\'<div class=&quot;leader-img-placeholder&quot;>👤</div>\'">'
        : '<div class="leader-img-placeholder">👤</div>';
      return '<div class="leader-card"><div class="leader-photo-wrap" style="overflow:hidden;">' + photo + '</div>'
        + '<div class="leader-body"><h4 class="leader-name">'+(l.first||'')+' '+(l.last||'')+'</h4>'
        + '<div class="leader-title">'+(l.role||'')+'</div>'
        + '<p class="leader-bio">'+(l.bio||'')+'</p>'
        + (l.email ? '<p style="font-size:.78rem;color:var(--gold);margin-top:.5rem;">✉️ '+l.email+'</p>' : '')
        + '</div></div>';
    }).join('');
    // Hide static placeholder leaders
    document.querySelectorAll('.grid-4:not(#cms-leaders-grid), .grid-3:not(#cms-leaders-grid)').forEach(function(el){ el.style.display='none'; });
  }

  /* ── ANNOUNCEMENTS ───────────────────────────────────────── */
  function loadAnnouncements() {
    var items = getCol('announcements');
    if (!items.length) return;
    var el = document.getElementById('cms-announcements-grid');
    if (!el) return;
    el.innerHTML = items.map(function(a) {
      return '<div class="ann-card '+(a._status==='pinned'?'pinned':'')+'">'
        + (a._status==='pinned' ? '<span class="ann-pin">📌</span>' : '')
        + '<div class="ann-cat">'+(a.category||'Announcement')+'</div>'
        + '<h4 class="ann-title">'+(a.title||'')+'</h4>'
        + '<p class="ann-body">'+(a.body||'')+'</p>'
        + '<div class="ann-date">'+(a.date||'')+'</div></div>';
    }).join('');
  }

  /* ── EVENTS ──────────────────────────────────────────────── */
  function loadEvents() {
    var items = getCol('events');
    if (!items.length) return;
    var el = document.getElementById('cms-events-grid');
    if (!el) return;
    var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.innerHTML = items.map(function(e) {
      var p = (e.date||'').split('-');
      return '<div class="event-card">'
        + '<div class="event-date-col"><div class="event-month">'+(p[1]?months[+p[1]]:'')+' </div>'
        + '<div class="event-day">'+(p[2]||e.date||'—')+'</div><div class="event-year">'+(p[0]||'')+'</div></div>'
        + '<div class="event-body"><div class="event-cat">'+(e.category||e.type||'Event')+'</div>'
        + '<h4 class="event-title">'+(e.name||'')+'</h4>'
        + '<div class="event-meta">'+(e.time?'<span>🕐 '+e.time+'</span>':'')+(e.location?'<span>📍 '+e.location+'</span>':'')+'</div>'
        + (e.desc?'<p style="font-size:.84rem;color:var(--text-muted);margin-top:.5rem;">'+e.desc+'</p>':'')
        + '</div></div>';
    }).join('');
  }

  /* ── SERMONS ─────────────────────────────────────────────── */
  function loadSermons() {
    var items = getCol('sermons');
    if (!items.length) return;
    var el = document.getElementById('cms-sermons-grid');
    if (!el) return;
    el.innerHTML = items.map(function(s) {
      return '<div class="card"><div class="card-body">'
        + '<div style="font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;">'+(s.series||'Sermon')+(s.date?' · '+s.date:'')+'</div>'
        + '<h4 style="font-family:var(--font-display);font-size:1.15rem;color:var(--navy);margin-bottom:.3rem;">'+(s.title||'')+'</h4>'
        + (s.speaker?'<div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.5rem;">🎙 '+s.speaker+'</div>':'')
        + (s.scripture?'<div style="font-size:.8rem;color:var(--gold);margin-bottom:.75rem;">📖 '+s.scripture+'</div>':'')
        + (s.desc?'<p style="font-size:.84rem;color:var(--text-muted);margin-bottom:.75rem;">'+s.desc+'</p>':'')
        + '<div style="display:flex;gap:.6rem;flex-wrap:wrap;">'
        + (s.video?'<a href="'+s.video+'" target="_blank" class="btn btn-primary btn-sm">▶ Watch</a>':'')
        + (s.audio?'<a href="'+s.audio+'" target="_blank" class="btn btn-outline btn-sm">🎵 Listen</a>':'')
        + '</div></div></div>';
    }).join('');
  }

  /* ── GALLERY ─────────────────────────────────────────────── */
  function loadGallery() {
    var items = getCol('gallery');
    if (!items.length) return;
    var el = document.getElementById('cms-gallery-grid');
    if (!el) return;
    el.innerHTML = items.map(function(g, i) {
      return '<div class="gallery-item '+(i===0||i===3?'wide':'')+'">'
        + '<img src="'+g.url+'" alt="'+(g.title||'')+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"/>'
        + '<div class="gallery-overlay"><span class="gallery-caption">'+(g.title||'')+'</span></div></div>';
    }).join('');
  }

  /* ── MINISTRIES ──────────────────────────────────────────── */
  function loadMinistries() {
    var items = getCol('ministries');
    if (!items.length) return;
    var el = document.getElementById('cms-ministries-grid');
    if (!el) return;
    el.innerHTML = items.map(function(m) {
      return '<div class="ministry-card">'
        + '<div class="min-icon">'+(m.icon||'⛪')+'</div>'
        + '<h3 class="min-title">'+(m.name||'')+'</h3>'
        + '<p class="min-desc">'+(m.desc||'')+'</p>'
        + (m.leader?'<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">👤 '+m.leader+'</p>':'')
        + (m.meeting?'<p style="font-size:.78rem;color:var(--text-muted);">🕐 '+m.meeting+'</p>':'')
        + '</div>';
    }).join('');
  }

  /* ── ABOUT ───────────────────────────────────────────────── */
  function loadAbout() {
    var a = getCfg('page_about');
    if (a.mission) { var el=document.getElementById('cms-mission'); if(el) el.textContent=a.mission; }
    if (a.vision)  { var el=document.getElementById('cms-vision');  if(el) el.textContent=a.vision; }
    if (a.story)   { var el=document.getElementById('cms-story');   if(el) el.textContent=a.story; }
  }

  /* ── START ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
