/* ================================================================
   CHM CHURCH OF GOD — CMS Public Loader v4 (Bulletproof)
   Reads from site-data.json on GitHub → updates every public page
   Works globally on ALL devices. Falls back to localStorage.
================================================================ */
(function() {
  'use strict';

  var OWNER  = 'yodebepro';
  var REPO   = 'CHM-Church-of-God';
  var BRANCH = 'main';

  /* Try multiple URL formats — GitHub CDN can be picky */
  function getUrls() {
    var ts = Date.now();
    return [
      'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/site-data.json?_=' + ts,
      'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/refs/heads/' + BRANCH + '/site-data.json?_=' + ts,
      'https://cdn.jsdelivr.net/gh/' + OWNER + '/' + REPO + '@' + BRANCH + '/site-data.json?_=' + ts
    ];
  }

  var siteData = null;

  /* ── FETCH DATA ────────────────────────────────────────────── */
  async function fetchSiteData() {
    var urls = getUrls();
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (res.ok) {
          var text = await res.text();
          var json = JSON.parse(text);
          siteData = json;
          /* Mirror for offline fallback */
          try { localStorage.setItem('chm_sd_mirror', text); } catch(e) {}
          console.log('[CHM CMS] Loaded from GitHub (' + urls[i].split('?')[0].split('/').pop() + ')');
          return true;
        }
      } catch(e) {
        console.log('[CHM CMS] URL ' + i + ' failed: ' + e.message);
      }
    }
    /* All URLs failed — use localStorage mirror */
    try {
      var saved = localStorage.getItem('chm_sd_mirror') || localStorage.getItem('chm_sitedata');
      if (saved) {
        siteData = JSON.parse(saved);
        console.log('[CHM CMS] Loaded from localStorage mirror');
        return true;
      }
    } catch(e) {}
    console.log('[CHM CMS] No data available');
    return false;
  }

  function col(name) {
    if (!siteData || !siteData[name]) return [];
    return siteData[name].filter(function(x) { return x._status === 'published'; });
  }

  function cfg(section) {
    if (!siteData || !siteData.site_config) return {};
    return siteData.site_config[section] || {};
  }

  /* ── MAIN ──────────────────────────────────────────────────── */
  async function run() {
    var ok = await fetchSiteData();
    if (!ok) return;

    applyTheme();
    applyInfo();

    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    if (page === '' || page === 'index.html')   doHome();
    if (page === 'leaders.html')                doLeaders();
    if (page === 'announcements.html')          doAnnouncements();
    if (page === 'events.html')                 doEvents();
    if (page === 'sermons.html')                doSermons();
    if (page === 'gallery.html')                doGallery();
    if (page === 'ministries.html')             doMinistries();
    if (page === 'about.html')                  doAbout();
    if (page === 'watch-live.html')             doWatchLive();
  }

  /* ── THEME ─────────────────────────────────────────────────── */
  function applyTheme() {
    var c = cfg('colors');
    if (!c) return;
    var r = document.documentElement.style;
    if (c.navy) r.setProperty('--navy', c.navy);
    if (c.gold) r.setProperty('--gold', c.gold);
    if (c.text) r.setProperty('--text', c.text);
    var bg = c.bgCss || c.bg;
    if (bg) document.body.style.background = bg;
    document.querySelectorAll('.site-footer').forEach(function(el) {
      if (c.footerBg)   el.style.setProperty('background', c.footerBg, 'important');
      if (c.footerText) el.style.setProperty('color',      c.footerText,'important');
    });
  }

  /* ── CHURCH INFO ───────────────────────────────────────────── */
  function applyInfo() {
    var info  = cfg('church_info');
    var times = cfg('service_times');
    var hero  = cfg('hero');

    q('[data-cms="address"]', function(el){ el.textContent = info.addr  || el.textContent; });
    q('[data-cms="phone"]',   function(el){ el.textContent = info.phone || el.textContent; });
    q('[data-cms="email"]',   function(el){ el.textContent = info.email || el.textContent; });
    q('.footer-about',        function(el){ if(info.about) el.textContent = info.about; });
    q('[data-cms="time-sun"]',function(el){ if(times.sun) el.textContent = times.sun; });
    q('[data-cms="time-wed"]',function(el){ if(times.wed) el.textContent = times.wed; });
    q('[data-cms="time-fri"]',function(el){ if(times.fri) el.textContent = times.fri; });

    /* Hero background video */
    var vidUrl = (hero && hero.videoUrl) ? hero.videoUrl : '';
    if (vidUrl) injectVideo(vidUrl);
  }

  function injectVideo(url) {
    var heroEl = document.querySelector('.hero');
    if (!heroEl || heroEl.querySelector('.cms-hero-video')) return;
    var v = document.createElement('video');
    v.className = 'cms-hero-video';
    v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('playsinline','');
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.4;pointer-events:none;';
    var s = document.createElement('source');
    s.src = url; s.type = 'video/mp4';
    v.appendChild(s);
    heroEl.style.position = 'relative';
    heroEl.insertBefore(v, heroEl.firstChild);
  }

  /* ── HOME ──────────────────────────────────────────────────── */
  function doHome() {
    var h = cfg('page_home');
    if (h.eyebrow) set('.hero-eyebrow', h.eyebrow);
    if (h.title)   html('.hero-title',  h.title);
    if (h.verse)   html('.hero-verse',  h.verse);
  }

  /* ── LEADERS ───────────────────────────────────────────────── */
  function doLeaders() {
    var leaders = col('leaders');
    if (!leaders.length) return;
    var grid = document.getElementById('cms-leaders-grid');
    if (!grid) return;
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
    grid.style.gap = '2rem';
    grid.style.marginBottom = '4rem';
    grid.innerHTML = leaders.map(function(l) {
      var name = ((l.first || '') + ' ' + (l.last || '')).trim();
      var photo = l.photo
        ? '<img src="' + esc(l.photo) + '" alt="' + esc(name) + '" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;" onerror="this.parentElement.innerHTML=\'<div style=&quot;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:3rem;background:#f4f5f7;&quot;>👤</div>\'">'
        : '<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:3rem;background:#f4f5f7;">👤</div>';
      return '<div class="leader-card" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">'
        + '<div style="overflow:hidden;">' + photo + '</div>'
        + '<div style="padding:1.25rem;">'
        + '<h4 style="font-size:1.1rem;font-weight:700;color:#0a1f44;margin-bottom:.25rem;">' + esc(name) + '</h4>'
        + '<div style="font-size:.8rem;font-weight:700;color:#c8913a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">' + esc(l.role || '') + '</div>'
        + (l.dept ? '<div style="font-size:.78rem;color:#6b7280;margin-bottom:.5rem;">' + esc(l.dept) + '</div>' : '')
        + (l.bio  ? '<p style="font-size:.83rem;color:#374151;line-height:1.6;">' + esc(l.bio) + '</p>' : '')
        + '</div></div>';
    }).join('');
    /* Hide static placeholder leaders once CMS ones are loaded */
    document.querySelectorAll('.grid-4:not(#cms-leaders-grid)').forEach(function(el){ el.style.display='none'; });
  }

  /* ── ANNOUNCEMENTS ─────────────────────────────────────────── */
  function doAnnouncements() {
    var items = col('announcements');
    if (!items.length) return;
    var el = document.getElementById('cms-announcements-grid');
    if (!el) return;
    el.innerHTML = items.map(function(a) {
      return '<div class="ann-card" style="background:#fff;border-radius:14px;padding:1.5rem;border-left:4px solid #c8913a;box-shadow:0 2px 8px rgba(0,0,0,.07);">'
        + '<div style="font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#c8913a;margin-bottom:.5rem;">' + esc(a.category || 'Announcement') + '</div>'
        + '<h4 style="font-size:1.1rem;font-weight:700;color:#0a1f44;margin-bottom:.6rem;">' + esc(a.title || '') + '</h4>'
        + '<p style="font-size:.88rem;color:#374151;line-height:1.7;">' + esc(a.body || '') + '</p>'
        + (a.date ? '<div style="font-size:.75rem;color:#9ca3af;margin-top:.75rem;">' + esc(a.date) + '</div>' : '')
        + '</div>';
    }).join('');
  }

  /* ── EVENTS ────────────────────────────────────────────────── */
  function doEvents() {
    var items = col('events');
    if (!items.length) return;
    var el = document.getElementById('cms-events-grid');
    if (!el) return;
    var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.innerHTML = items.map(function(e) {
      var p = (e.date || '').split('-');
      return '<div class="event-card" style="background:#fff;border-radius:14px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.07);display:flex;gap:1.25rem;align-items:flex-start;">'
        + '<div style="text-align:center;min-width:52px;background:#0a1f44;color:#fff;border-radius:10px;padding:.6rem .5rem;flex-shrink:0;">'
        + '<div style="font-size:.65rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#c8913a;">' + (p[1] ? months[+p[1]] : '') + '</div>'
        + '<div style="font-size:1.5rem;font-weight:900;line-height:1;">' + (p[2] || '—') + '</div>'
        + '<div style="font-size:.62rem;color:rgba(255,255,255,.5);">' + (p[0] || '') + '</div>'
        + '</div>'
        + '<div style="flex:1;">'
        + '<div style="font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#c8913a;margin-bottom:.3rem;">' + esc(e.category || 'Event') + '</div>'
        + '<h4 style="font-size:1rem;font-weight:700;color:#0a1f44;margin-bottom:.4rem;">' + esc(e.name || '') + '</h4>'
        + (e.time     ? '<div style="font-size:.8rem;color:#6b7280;">🕐 ' + esc(e.time) + '</div>' : '')
        + (e.location ? '<div style="font-size:.8rem;color:#6b7280;">📍 ' + esc(e.location) + '</div>' : '')
        + (e.desc     ? '<p style="font-size:.82rem;color:#6b7280;margin-top:.4rem;">' + esc(e.desc) + '</p>' : '')
        + '</div></div>';
    }).join('');
  }

  /* ── SERMONS ───────────────────────────────────────────────── */
  function doSermons() {
    var items = col('sermons');
    if (!items.length) return;
    var el = document.getElementById('cms-sermons-grid');
    if (!el) return;
    el.style.display = 'grid';
    el.style.gridTemplateColumns = 'repeat(auto-fill,minmax(280px,1fr))';
    el.style.gap = '1.5rem';
    el.innerHTML = items.map(function(s) {
      return '<div style="background:#fff;border-radius:16px;padding:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.08);">'
        + '<div style="font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#c8913a;margin-bottom:.4rem;">' + esc(s.series || 'Sermon') + (s.date ? ' · ' + esc(s.date) : '') + '</div>'
        + '<h4 style="font-size:1.1rem;font-weight:700;color:#0a1f44;margin-bottom:.35rem;">' + esc(s.title || '') + '</h4>'
        + (s.speaker   ? '<div style="font-size:.82rem;color:#6b7280;margin-bottom:.4rem;">🎙 ' + esc(s.speaker) + '</div>' : '')
        + (s.scripture ? '<div style="font-size:.8rem;color:#c8913a;margin-bottom:.75rem;">📖 ' + esc(s.scripture) + '</div>' : '')
        + (s.desc      ? '<p style="font-size:.83rem;color:#6b7280;line-height:1.6;margin-bottom:.85rem;">' + esc(s.desc) + '</p>' : '')
        + '<div style="display:flex;gap:.5rem;flex-wrap:wrap;">'
        + (s.video ? '<a href="' + esc(s.video) + '" target="_blank" style="display:inline-block;padding:.45rem 1rem;background:#0a1f44;color:#c8913a;border-radius:50px;font-size:.78rem;font-weight:700;text-decoration:none;">▶ Watch</a>' : '')
        + (s.audio ? '<a href="' + esc(s.audio) + '" target="_blank" style="display:inline-block;padding:.45rem 1rem;background:#f4f5f7;color:#0a1f44;border-radius:50px;font-size:.78rem;font-weight:700;text-decoration:none;">🎵 Listen</a>' : '')
        + '</div></div>';
    }).join('');
  }

  /* ── GALLERY ───────────────────────────────────────────────── */
  function doGallery() {
    var items = col('gallery');
    if (!items.length) return;
    var el = document.getElementById('cms-gallery-grid');
    if (!el) return;
    el.innerHTML = items.map(function(g, i) {
      return '<div class="gallery-item ' + (i===0||i===3?'wide':'') + '" style="overflow:hidden;border-radius:12px;cursor:pointer;" onclick="if(window.openLightbox)openLightbox(\'' + esc(g.url) + '\',\'' + esc(g.title||'') + '\')">'
        + '<img src="' + esc(g.url) + '" alt="' + esc(g.title||'') + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display=\'none\'"/>'
        + '<div class="gallery-overlay"><span class="gallery-caption">' + esc(g.title||'') + '</span></div>'
        + '</div>';
    }).join('');
  }

  /* ── MINISTRIES ────────────────────────────────────────────── */
  function doMinistries() {
    var items = col('ministries');
    if (!items.length) return;
    var el = document.getElementById('cms-ministries-grid');
    if (!el) return;
    el.innerHTML = items.map(function(m) {
      return '<div class="ministry-card" style="background:#fff;border-radius:16px;padding:1.75rem;box-shadow:0 2px 12px rgba(0,0,0,.08);text-align:center;">'
        + '<div style="font-size:2.5rem;margin-bottom:.75rem;">' + (m.icon||'⛪') + '</div>'
        + '<h3 style="font-size:1.15rem;font-weight:700;color:#0a1f44;margin-bottom:.5rem;">' + esc(m.name||'') + '</h3>'
        + '<p style="font-size:.85rem;color:#6b7280;line-height:1.7;">' + esc(m.desc||'') + '</p>'
        + (m.leader  ? '<p style="font-size:.78rem;font-weight:700;color:#c8913a;margin-top:.75rem;">👤 ' + esc(m.leader) + '</p>' : '')
        + (m.meeting ? '<p style="font-size:.78rem;color:#9ca3af;">🕐 ' + esc(m.meeting) + '</p>' : '')
        + '</div>';
    }).join('');
  }

  /* ── ABOUT ─────────────────────────────────────────────────── */
  function doAbout() {
    var a = cfg('page_about');
    if (a.mission) set('#cms-mission', a.mission);
    if (a.vision)  set('#cms-vision',  a.vision);
    if (a.story)   set('#cms-story',   a.story);
  }

  /* ── WATCH LIVE ────────────────────────────────────────────── */
  function doWatchLive() {
    var live = cfg('watch_live');
    if (live && live.youtubeId) {
      var frame = document.getElementById('cmsYouTubeFrame');
      if (frame) {
        frame.src = 'https://www.youtube.com/embed/' + live.youtubeId
          + '?rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=1';
      }
    }
  }

  /* ── HELPERS ───────────────────────────────────────────────── */
  function q(selector, fn) {
    document.querySelectorAll(selector).forEach(fn);
  }
  function set(selector, text) {
    var el = document.querySelector(selector);
    if (el) el.textContent = text;
  }
  function html(selector, markup) {
    var el = document.querySelector(selector);
    if (el) el.innerHTML = markup;
  }
  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ── START ─────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();
