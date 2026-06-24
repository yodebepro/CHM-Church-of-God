/* CHM CHURCH OF GOD — CMS Public Renderer v6
   Reads published content from site-data.json and injects it into every public page.
   Strategy: show localStorage content INSTANTLY, then refresh from GitHub in background. */
(function () {
  'use strict';

  var OWNER  = 'yodebepro';
  var REPO   = 'CHM-Church-of-God';
  var BRANCH = 'main';
  var siteData = null;

  /* ── LOAD ──────────────────────────────────────────────────────
     Step 1: Show localStorage content immediately (zero delay, works offline)
     Step 2: Fetch fresh data from GitHub (updates in background)             */
  async function load() {

    // STEP 1 — Instant display from localStorage
    var localRaw = localStorage.getItem('chm_sitedata') || localStorage.getItem('chm_sd_bk');
    if (localRaw) {
      try {
        var localData = JSON.parse(localRaw);
        if (localData && Object.keys(localData).length > 2) {
          siteData = localData;
          applyAll(); // Show immediately — don't wait for GitHub
        }
      } catch(e) {}
    }

    // STEP 2 — Fetch from GitHub (background refresh)
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
          var freshData = JSON.parse(text);

          // Merge: restore any photos from localStorage that GitHub might be missing
          freshData = mergePhotos(freshData);

          siteData = freshData;
          try { localStorage.setItem('chm_sd_bk', JSON.stringify(freshData)); } catch(e) {}
          applyAll(); // Re-apply with fresh data
          return;
        }
      } catch(e) {}
    }
    // GitHub unreachable — localStorage content already shown above
  }

  /* Restore photos from localStorage when GitHub data has placeholder markers */
  function mergePhotos(fresh) {
    try {
      var localRaw = localStorage.getItem('chm_sitedata') || localStorage.getItem('chm_sd_bk');
      if (!localRaw) return fresh;
      var ld = JSON.parse(localRaw);
      var cols = ['leaders','announcements','events','sermons','gallery','ministries','teams','departments','locations'];
      var fields = ['photo','image','imageUrl','mediaUrl','photoUrl','thumbnailUrl','audio','video','url'];
      cols.forEach(function(col) {
        if (!fresh[col] || !ld[col]) return;
        fresh[col] = fresh[col].map(function(item) {
          var li = ld[col].find(function(x) { return x.id === item.id; });
          if (!li) return item;
          fields.forEach(function(f) {
            // If GitHub item is missing a field OR has a placeholder, restore from localStorage
            if ((!item[f] || item[f] === '' || (typeof item[f]==='string' && item[f].includes('stored')))
                && li[f] && li[f] !== '') {
              item[f] = li[f];
            }
          });
          return item;
        });
      });
    } catch(e) {}
    return fresh;
  }

  /* Return only published items from a collection */
  function published(col) {
    return (siteData && siteData[col] || []).filter(function(x) {
      var s = String(x._status || x.status || 'draft').toLowerCase();
      return (s === 'published' || s === 'live') && x.archived !== true;
    });
  }

  function cfg(key) { return (siteData && siteData.site_config && siteData.site_config[key]) || {}; }
  function qs(sel)  { return document.querySelector(sel); }
  function each(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
  function setText(sel, val) { var el = qs(sel); if (el) el.textContent = val; }

  /* Safe HTML escape */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* Extract best photo URL — accepts https:// AND base64 data: URLs */
  function photo(item) {
    var p = item.photo || item.image || item.imageUrl || item.photoUrl
          || item.mediaUrl || item.thumbnailUrl || item.url || '';
    if (!p) return '';
    // Reject only explicit placeholder strings
    if (p.includes('[photo-stored') || p.includes('[stored-locally]') ||
        p.includes('[media-in-local') || p.includes('[stored]')) return '';
    return p; // Accepts both https:// and data:image/... base64
  }

  /* Build photo <img> inside navy placeholder — photo fills box, navy shows if load fails */
  function photoHtml(item, style) {
    var src = photo(item);
    if (!src) return '<div class="leader-img-placeholder">&#128100;</div>';
    // Keep the navy gradient div; img overlays absolutely so if it fails, silhouette shows
    return '<div class="leader-img-placeholder" style="position:relative;">'
      +'<img src="'+esc(src)+'" '
      +'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;" '
      +'onerror="this.remove()">'
      +'</div>';
  }

  /* ── ROUTE ─────────────────────────────────────────────────── */
  function applyAll() {
    applyTheme();
    applyInfo();
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page===''||page==='index.html') doHome();
    if (page==='leaders.html')          doLeaders();
    if (page==='announcements.html')    doAnnouncements();
    if (page==='events.html')           doEvents();
    if (page==='sermons.html')          doSermons();
    if (page==='gallery.html')          doGallery();
    if (page==='ministries.html')       doMinistries();
    if (page==='departments.html')      doDepartments();
    if (page==='teams.html')            doTeams();
    if (page==='locations.html')        doLocations();
    if (page==='about.html')            doAboutFull();
  }

  /* ── THEME ─────────────────────────────────────────────────── */
  function applyTheme() {
    var c = cfg('colors'); if (!c) return;
    var r = document.documentElement.style;
    if (c.navy) r.setProperty('--navy', c.navy);
    if (c.gold) r.setProperty('--gold', c.gold);
    var bg = c.bgCss || c.bg; if (bg) document.body.style.background = bg;
    each('.site-footer', function(el) {
      if (c.footerBg)   el.style.setProperty('background', c.footerBg, 'important');
      if (c.footerText) el.style.setProperty('color', c.footerText, 'important');
    });
  }

  /* ── CHURCH INFO ───────────────────────────────────────────── */
  function applyInfo() {
    var info = cfg('church_info'), times = cfg('service_times'), heroCfg = cfg('hero');
    if (info.addr)  each('[data-cms="address"]',  function(el){ el.textContent=info.addr; });
    if (info.phone) each('[data-cms="phone"]',    function(el){ el.textContent=info.phone; });
    if (info.email) each('[data-cms="email"]',    function(el){ el.textContent=info.email; });
    if (info.about) each('.footer-about',         function(el){ el.textContent=info.about; });
    if (times.sun)  each('[data-cms="time-sun"]', function(el){ el.textContent=times.sun; });
    if (times.wed)  each('[data-cms="time-wed"]', function(el){ el.textContent=times.wed; });
    if (times.fri)  each('[data-cms="time-fri"]', function(el){ el.textContent=times.fri; });

    // Hero background video — check both hero[] collection and site_config.hero
    var vid = heroCfg.videoUrl || heroCfg.video || '';
    if (!vid) {
      var heroItems = published('hero');
      if (heroItems.length) vid = heroItems[0].mediaUrl || heroItems[0].videoUrl || heroItems[0].video || heroItems[0].url || '';
    }
    if (vid) injectHeroVideo(vid);
  }

  function injectHeroVideo(url) {
    var heroEl = qs('.hero') || qs('.page-hero') || qs('[data-hero]');
    if (!heroEl) return;
    if (heroEl.querySelector('.cms-hero-video')) return; // already injected
    var v = document.createElement('video');
    v.className = 'cms-hero-video'; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.35;pointer-events:none;';
    v.innerHTML = '<source src="'+esc(url)+'" type="video/mp4"/>';
    heroEl.style.position = 'relative';
    heroEl.insertBefore(v, heroEl.firstChild);
    Array.from(heroEl.children).forEach(function(ch) {
      if (ch !== v) { ch.style.position = ch.style.position || 'relative'; ch.style.zIndex = ch.style.zIndex || '1'; }
    });
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
    // Merge both collections, deduplicate by slot (1 entry per slot)
    var raw = (published('leaders') || []).concat(published('leadership') || []);
    if (!raw.length) return;

    // Dedupe: keep first entry with a real photo per slot; if none has photo, keep first
    var slotMap = {};
    raw.forEach(function(l) {
      var key = (l.slot || '').trim().toLowerCase();
      if (!key) return;
      if (!slotMap[key]) { slotMap[key] = l; return; }
      // Replace if the new entry has a photo and the existing doesn't
      var hasPhoto = photo(l);
      if (hasPhoto && !photo(slotMap[key])) slotMap[key] = l;
    });
    var leaders = Object.values ? Object.values(slotMap) : Object.keys(slotMap).map(function(k){return slotMap[k];});

    /* Helper: full name from any available field */
    function ldrName(l) {
      return ((l.first||l.name||'') + ' ' + (l.last||'')).trim() || l.role || 'Leader';
    }

    /* Build inner HTML for a leader card — photo overlays navy frame */
    function cardInner(l) {
      return photoHtml(l)
        + '<div class="leader-body">'
        + '<h4 class="leader-name">' + esc(ldrName(l)) + '</h4>'
        + '<div class="leader-title">' + esc(l.role || l.title || '') + '</div>'
        + (l.bio ? '<p class="leader-bio">' + esc(l.bio) + '</p>' : '')
        + '</div>';
    }

    // 1. Fill named slot cards that exist on this page
    var filled = {};
    leaders.forEach(function(l) {
      var key = (l.slot || '').trim().toLowerCase();
      if (!key) return;
      var card = document.getElementById('slot-' + key);
      if (!card) return;
      card.innerHTML = cardInner(l);
      filled[key] = true;
    });

    // 2. Leaders whose slot ID is not on this page → overflow grid (same card style)
    var extras = leaders.filter(function(l) {
      return !filled[(l.slot || '').trim().toLowerCase()];
    });
    if (!extras.length) return;
    var grid = document.getElementById('cms-leaders-grid');
    if (!grid) return;
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:2rem;margin-bottom:2rem;';
    grid.innerHTML = extras.map(function(l) {
      return '<div class="leader-card">' + cardInner(l) + '</div>';
    }).join('');
  }

    /* ── ANNOUNCEMENTS ─────────────────────────────────────────── */
  function doAnnouncements() {
    var items = published('announcements'); if (!items.length) return;
    var el = document.getElementById('cms-announcements-grid'); if (!el) return;
    // Use ann-card class to match the existing announcements page card design exactly
    el.className = 'grid-2';
    el.style.cssText = 'margin-bottom:1.5rem;';
    // Hide static cards when CMS content is available
    var staticGrid = document.getElementById('cms-static-ann');
    if (staticGrid) { staticGrid.style.display = 'none'; }
    // Also hide any ann-card elements not inside our CMS container
    if (el.parentElement) {
      Array.prototype.forEach.call(el.parentElement.children, function(child) {
        if (child !== el && child.id !== 'cms-announcements-grid') child.style.display = 'none';
      });
    }
    el.innerHTML = items.map(function(a) {
      var ph = photo(a);
      var isPinned = a.pinned || a.category === 'Important' || a.category === 'Giving Campaign';
      return '<div class="ann-card '+(isPinned?'pinned':'')+' reveal">'
        +(isPinned?'<div class="ann-pin">&#128204;</div>':'')
        +(ph?'<div style="overflow:hidden;border-radius:10px;margin-bottom:.85rem;height:160px;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div class="ann-cat">'+esc(a.category||'Announcement')+'</div>'
        +'<h3 class="ann-title">'+esc(a.title||'')+'</h3>'
        +'<p class="ann-body">'+esc(a.body||a.summary||'')+'</p>'
        +(a.date?'<div class="ann-date">'+esc(a.date)+'</div>':'')
        +'</div>';
    }).join('');
  }

  /* ── EVENTS ────────────────────────────────────────────────── */
  function doEvents() {
    var items = published('events'); if (!items.length) return;
    var el = document.getElementById('cms-events-grid'); if (!el) return;
    // Hide static event-card siblings when CMS items exist
    if (el.parentElement) {
      Array.prototype.forEach.call(el.parentElement.children, function(child) {
        if (child !== el) {
          if (child.classList && (child.classList.contains('event-card') || child.style)) {
            child.style.display = 'none';
          }
        }
      });
    }
    el.style.cssText = 'display:flex;flex-direction:column;gap:1rem;margin-bottom:1rem;';
    var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.innerHTML = items.map(function(ev) {
      var p = (ev.date||'').split('-');
      var mon = p[1] ? months[+p[1]] : '';
      var day = p[2] || '--';
      var yr  = p[0] || '';
      var ph  = photo(ev);
      var cat = (ev.category||'Event').toLowerCase();
      return '<div class="event-card reveal" data-category="'+esc(cat)+'">'
        +'<div class="event-date-col"><div class="event-month">'+esc(mon)+'</div><div class="event-day">'+esc(day)+'</div><div class="event-year">'+esc(yr)+'</div></div>'
        +'<div class="event-body">'
        +(ph?'<div style="overflow:hidden;border-radius:10px;margin-bottom:.75rem;height:140px;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div class="event-cat">'+esc(ev.category||'Event')+'</div>'
        +'<h3 class="event-title">'+esc(ev.name||ev.title||'')+'</h3>'
        +'<div class="event-meta">'
        +(ev.location?'<span>&#128205; '+esc(ev.location)+'</span>':'')
        +(ev.time?'<span>&#9200; '+esc(ev.time)+'</span>':'')
        +'</div>'
        +(ev.desc||ev.body?'<p class="event-desc" style="font-size:.84rem;color:#6b7280;margin-top:.5rem;line-height:1.6;">'+esc(ev.desc||ev.body||'')+'</p>':'')
        +'</div></div>';
    }).join('');
  }

  /* ── SERMONS ───────────────────────────────────────────────── */
  function doSermons() {
    var items = published('sermons'); if (!items.length) return;

    // Featured / latest
    var f = items[0];
    var featEl = qs('.featured-sermon');
    if (featEl && f) {
      var isYT = (f.video||'').includes('youtube')||(f.video||'').includes('youtu.be');
      var watchHref = isYT ? f.video : 'watch-live.html';
      var ph = photo(f);
      featEl.innerHTML =
        '<div class="featured-thumb">'
        +(ph?'<img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'"/>':'')
        +'<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:1rem;">'
        +'<span>'+esc(f.icon||'&#128293;')+'</span>'
        +(f.video?'<a href="'+esc(watchHref)+'" target="_blank" style="width:60px;height:60px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--navy);text-decoration:none;">&#9654;</a>':'')
        +'</div></div>'
        +'<div class="featured-body">'
        +'<div class="featured-label">&#11088; Latest &middot; '+(f.video?'Video':'Audio')+' Sermon</div>'
        +'<div class="featured-title">'+esc(f.title||'')+'</div>'
        +'<div class="featured-excerpt">'+esc(f.desc||f.body||'')+'</div>'
        +'<div class="featured-info">'
        +(f.speaker?'<span>&#128100; '+esc(f.speaker)+'</span>':'')
        +(f.date?'<span>&#128197; '+esc(f.date)+'</span>':'')
        +(f.scripture?'<span>&#128214; '+esc(f.scripture)+'</span>':'')
        +'</div>'
        +'<div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem;">'
        +(f.video?'<a href="'+esc(watchHref)+'" target="_blank" class="btn btn-gold">&#9654; Watch</a>':'')
        +(f.audio?'<a href="'+esc(f.audio)+'" target="_blank" class="btn btn-outline">&#127925; Audio Only</a>':'')
        +'</div></div>';
    }

    // Sermon grid — inject CMS cards, hide all static sermon-card children
    var grid = document.getElementById('sermonGrid');
    var cmsTarget = document.getElementById('cms-sermons-injected');
    if (!grid || !cmsTarget) return;
    // Hide static cards so only CMS content shows
    Array.prototype.forEach.call(grid.children, function(child) {
      if (child.id !== 'cms-sermons-injected') child.style.display = 'none';
    });
    cmsTarget.innerHTML = items.map(function(s) {
      // Use existing sermon-card CSS class to match page design perfectly
      var isYT = (s.video||'').includes('youtube')||(s.video||'').includes('youtu.be');
      var watchHref = isYT ? s.video : 'watch-live.html';
      var ph = photo(s);
      var cat = (s.series||s.category||'preaching').toLowerCase().replace(/[^a-z]/g,'-');
      return '<div class="sermon-card reveal" data-category="'+esc(cat)+'">'
        +'<div class="sermon-thumb">'
        +(ph
          ?'<img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" onerror="this.remove()"/>'
          :'')
        +'<div class="sermon-thumb-icon" style="position:relative;z-index:1;font-size:2.5rem;display:flex;align-items:center;justify-content:center;height:100%;">'+esc(s.icon||'&#128293;')+'</div>'
        +(s.video?'<div class="sermon-play-overlay" style="z-index:2;"><a href="'+esc(watchHref)+'" target="_blank" class="sermon-play-btn" style="text-decoration:none;color:inherit;">&#9654;</a></div>':'')
        +(s.video?'<span class="sermon-type-badge badge-video">&#9654; Video</span>':(s.audio?'<span class="sermon-type-badge badge-audio">&#127925; Audio</span>':''))
        +'</div>'
        +'<div class="sermon-body">'
        +'<div class="sermon-series">'+esc(s.series||'')+'</div>'
        +'<h3 class="sermon-title">'+esc(s.title||'')+'</h3>'
        +(s.desc||s.body?'<p class="sermon-excerpt">'+esc((s.desc||s.body||'').slice(0,120))+'</p>':'')
        +'<div class="sermon-meta">'
        +(s.speaker?'<span>&#128100; '+esc(s.speaker)+'</span>':'')
        +(s.date?'<span>&#128197; '+esc(s.date)+'</span>':'')
        +(s.scripture?'<span>&#128214; '+esc(s.scripture)+'</span>':'')
        +'</div>'
        +'<div class="sermon-actions" style="display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap;">'
        +(s.video?'<a href="'+esc(watchHref)+'" target="_blank" class="btn btn-gold" style="font-size:.78rem;padding:.42rem .95rem;">&#9654; Watch</a>':'')
        +(s.audio?'<a href="'+esc(s.audio)+'" target="_blank" class="btn btn-outline" style="font-size:.78rem;padding:.42rem .95rem;">&#127925; Listen</a>':'')
        +'</div>'
        +'</div></div>';
    }).join('');
  }

  /* ── GALLERY ───────────────────────────────────────────────── */
  function doGallery() {
    var items = published('gallery'); if (!items.length) return;
    // Inject directly into the real masonry grid – replaces static emoji placeholders
    var grid = document.getElementById('galleryGrid'); if (!grid) return;
    grid.innerHTML = items.map(function(g) {
      var src = photo(g); if (!src) return '';
      var cat   = (g.category||g.cat||'worship').toLowerCase();
      var title = esc(g.title||g.name||'');
      var desc  = esc((g.desc||g.body||'').slice(0,80));
      return '<div class="masonry-item reveal" data-cat="'+cat+'">'
        +'<div class="masonry-img" style="position:relative;overflow:hidden;">'
        +'<img src="'+esc(src)+'" alt="'+title+'" loading="lazy" '
        +'style="width:100%;height:100%;object-fit:cover;display:block;'
        +'position:absolute;top:0;left:0;" '
        +'onerror="this.closest('.masonry-item').style.display='none'"/>'
        +'<div class="masonry-overlay">'
        +'<span class="masonry-caption">'+title+'</span>'
        +(desc?'<p style="font-size:.74rem;color:rgba(255,255,255,.8);margin:.2rem 0 0;">'+desc+'</p>':'')
        +'</div></div></div>';
    }).filter(Boolean).join('');
  }

  /* ── MINISTRIES ────────────────────────────────────────────── */
  function doMinistries() {
    var items = published('ministries'); if (!items.length) return;
    var el = document.getElementById('cms-ministries-grid'); if (!el) return;
    // Hide ALL static ministry sections (section-headers + grid-3 divs with ministry cards)
    each('.section-header', function(h) {
      if (!h.contains(el)) h.style.display = 'none';
    });
    each('.grid-3', function(g) {
      if (g.querySelector && g.querySelector('.ministry-card')) g.style.display = 'none';
    });
    // Render CMS ministries in a matching grid
    el.className = 'grid-3 reveal';
    el.style.cssText = 'margin-bottom:2rem;';
    el.innerHTML = items.map(function(m) {
      var ph = photo(m);
      var cat = (m.category||m.cat||'core').toLowerCase().replace(/[^a-z]/g,'-');
      return '<div class="ministry-card reveal" data-category="'+esc(cat)+'">'
        +(ph?'<div style="overflow:hidden;height:140px;border-radius:10px 10px 0 0;margin:-1.5rem -1.5rem 1rem;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div class="min-icon">'+esc(m.icon||'&#9962;')+'</div>'
        +'<h3 class="min-title">'+esc(m.name||m.title||'')+'</h3>'
        +'<p class="min-desc">'+esc(m.desc||m.body||'')+'</p>'
        +(m.leader?'<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">&#128100; '+esc(m.leader)+'</p>':'')
        +(m.meeting?'<p style="font-size:.78rem;color:#9ca3af;margin-top:.3rem;">&#128336; '+esc(m.meeting)+'</p>':'')
        +'</div>';
    }).join('');
  }

  /* ── DEPARTMENTS ───────────────────────────────────────────── */
  function doDepartments() {
    var items = published('departments'); if (!items.length) return;
    var el = document.getElementById('cms-departments-grid'); if (!el) return;
    each('.cms-static-depts', function(e){ e.style.display='none'; });
    el.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;';
    items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
    el.innerHTML = items.map(function(d) {
      var ph = photo(d);
      return '<div style="background:#fff;border-radius:14px;padding:1.75rem;box-shadow:0 2px 10px rgba(0,0,0,.08);">'
        +(ph?'<div style="overflow:hidden;height:120px;border-radius:10px;margin:-1.75rem -1.75rem 1rem;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div style="font-size:2rem;margin-bottom:.5rem;">'+esc(d.icon||'&#9962;')+'</div>'
        +'<h3 style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">'+esc(d.name||d.title||'')+'</h3>'
        +'<p style="font-size:.85rem;color:#6b7280;line-height:1.7;">'+esc(d.desc||d.body||'')+'</p>'
        +(d.leader?'<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">&#128100; '+esc(d.leader)+'</p>':'')
        +'</div>';
    }).join('');
  }

  /* ── TEAMS ─────────────────────────────────────────────────── */
  function doTeams() {
    var items = published('teams'); if (!items.length) return;
    var grid = document.getElementById('cms-teams-grid');
    if (!grid) {
      // Auto-create if missing from HTML
      grid = document.createElement('div');
      grid.id = 'cms-teams-grid';
      var ref = qs('#chm-footer') || qs('.site-footer') || qs('footer');
      if (ref) ref.parentNode.insertBefore(grid, ref);
      else document.body.appendChild(grid);
    }
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;margin-bottom:3rem;';
    each('.cms-static-teams', function(e){ e.style.display='none'; });
    items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
    grid.innerHTML = items.map(function(t) {
      var ph = photo(t);
      return '<div style="background:#fff;border-radius:14px;padding:1.5rem;box-shadow:0 2px 10px rgba(0,0,0,.08);">'
        +(ph?'<div style="overflow:hidden;height:100px;border-radius:10px;margin-bottom:1rem;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div style="font-size:2rem;margin-bottom:.6rem;">'+esc(t.icon||'&#128101;')+'</div>'
        +'<h3 style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">'+esc(t.name||t.title||'')+'</h3>'
        +'<p style="font-size:.85rem;color:#6b7280;line-height:1.6;">'+esc(t.desc||t.body||'')+'</p>'
        +(t.category?'<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);margin-top:.6rem;">'+esc(t.category)+'</div>':'')
        +'</div>';
    }).join('');
  }

  /* ── LOCATIONS ─────────────────────────────────────────────── */
  function doLocations() {
    var items = published('locations'); if (!items.length) return;
    var grid = document.getElementById('cms-locations-grid');
    if (!grid) {
      grid = document.createElement('div');
      grid.id = 'cms-locations-grid';
      var ref = qs('#chm-footer') || qs('.site-footer') || qs('footer');
      if (ref) ref.parentNode.insertBefore(grid, ref);
      else document.body.appendChild(grid);
    }
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;margin-bottom:3rem;';
    each('.cms-static-locations', function(e){ e.style.display='none'; });
    grid.innerHTML = items.map(function(loc) {
      var ph = photo(loc);
      return '<div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">'
        +(ph?'<div style="height:160px;overflow:hidden;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div style="padding:1.4rem;">'
        +'<h3 style="font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">'+esc(loc.name||loc.title||'Location')+'</h3>'
        +(loc.address?'<p style="font-size:.85rem;color:#6b7280;margin-bottom:.4rem;">&#128205; '+esc(loc.address)+'</p>':'')
        +(loc.phone?'<p style="font-size:.85rem;color:#6b7280;margin-bottom:.4rem;">&#128222; '+esc(loc.phone)+'</p>':'')
        +(loc.hours?'<p style="font-size:.85rem;color:#6b7280;margin-bottom:.4rem;">&#128336; '+esc(loc.hours)+'</p>':'')
        +(loc.desc||loc.body?'<p style="font-size:.84rem;color:#374151;line-height:1.6;margin-top:.5rem;">'+esc(loc.desc||loc.body||'')+'</p>':'')
        +'</div></div>';
    }).join('');
  }

  /* ── ABOUT ─────────────────────────────────────────────────── */
  function doAboutFull() {
    var a = cfg('page_about');
    if (a.storyP1)    setText('#cms-story-p1', a.storyP1);
    if (a.storyP2)    setText('#cms-story-p2', a.storyP2);
    if (a.mission)    setText('#cms-mission',   a.mission);
    if (a.vision)     setText('#cms-vision',    a.vision);
    if (a.values && a.values.length) {
      var vEl = qs('#cms-values');
      if (vEl) vEl.innerHTML = a.values.map(function(v) {
        return '<div style="display:flex;align-items:center;gap:.75rem;color:rgba(255,255,255,.8);font-size:.9rem;">'
          +'<span style="color:var(--gold);">&#10006;</span> '+esc(v)+'</div>';
      }).join('');
    }
    if (a.beliefs && a.beliefs.length) {
      var bEl = qs('#cms-beliefs-grid');
      if (bEl) bEl.innerHTML = a.beliefs.map(function(b, i) {
        var num = (i+1<10?'0':'')+(i+1);
        return '<div class="belief-card"><div class="belief-num">'+num+'</div>'
          +'<div class="belief-title">'+esc(b.title||'')+'</div>'
          +'<p class="belief-text">'+esc(b.text||'')+'</p></div>';
      }).join('');
    }
    // Also inject published leaders into about page slots
    published('leaders').forEach(function(l) {
      var card = qs('#about-slot-'+(l.slot||''));
      if (!card) return;
      var name = ((l.first||'')+' '+(l.last||'')).trim();
      card.innerHTML = photoHtml(l, 'width:100%;aspect-ratio:1;object-fit:cover;')
        +'<div class="leader-body"><h4 class="leader-name">'+esc(name)+'</h4>'
        +'<div class="leader-title">'+esc(l.role||'')+'</div>'
        +(l.bio?'<p class="leader-bio">'+esc(l.bio)+'</p>':'')+'</div>';
    });
  }

  /* Also keep doAbout alias for legacy calls */
  function doAbout() { doAboutFull(); }

  /* ── START ─────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }

})();
