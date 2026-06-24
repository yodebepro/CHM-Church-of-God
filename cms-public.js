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

  /* Build photo <img> or placeholder */
  function photoHtml(item, style) {
    var src = photo(item);
    style = style || 'width:100%;aspect-ratio:1;object-fit:cover;display:block;';
    if (!src) return '<div class="leader-img-placeholder">&#128100;</div>';
    return '<img src="'+esc(src)+'" style="'+style+'" '
      +'onerror="this.parentElement.innerHTML=\'<div class=&quot;leader-img-placeholder&quot;>&#128100;</div>\'">';
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
    var leaders = published('leaders');
    if (!leaders.length) return;

    // Inject each leader into their named slot card
    leaders.forEach(function(l) {
      var card = document.getElementById('slot-'+(l.slot||''));
      if (!card) return;
      var name = ((l.first||'')+' '+(l.last||'')).trim();
      card.innerHTML =
        '<div style="overflow:hidden;">'+ photoHtml(l, 'width:100%;aspect-ratio:1;object-fit:cover;display:block;') +'</div>'
        +'<div class="leader-body">'
        +'<h4 class="leader-name">'+esc(name)+'</h4>'
        +'<div class="leader-title">'+esc(l.role||l.title||'')+'</div>'
        +(l.dept?'<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.3rem;">'+esc(l.dept)+'</div>':'')
        +(l.bio?'<p class="leader-bio">'+esc(l.bio)+'</p>':'')
        +(l.email?'<p style="font-size:.75rem;color:var(--gold);margin-top:.4rem;">&#9993; '+esc(l.email)+'</p>':'')
        +'</div>';
    });

    // Any leader without a matching slot → overflow grid
    var extras = leaders.filter(function(l) {
      return !l.slot || !document.getElementById('slot-'+l.slot);
    });
    if (!extras.length) return;
    var grid = document.getElementById('cms-leaders-grid');
    if (!grid) return;
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:2rem;margin-bottom:2rem;';
    grid.innerHTML = extras.map(function(l) {
      var name = ((l.first||'')+' '+(l.last||'')).trim();
      return '<div class="leader-card">'
        +'<div style="overflow:hidden;">'+ photoHtml(l) +'</div>'
        +'<div class="leader-body"><h4 class="leader-name">'+esc(name)+'</h4>'
        +'<div class="leader-title">'+esc(l.role||'')+'</div>'
        +(l.bio?'<p class="leader-bio">'+esc(l.bio)+'</p>':'')+'</div></div>';
    }).join('');
  }

  /* ── ANNOUNCEMENTS ─────────────────────────────────────────── */
  function doAnnouncements() {
    var items = published('announcements'); if (!items.length) return;
    var el = document.getElementById('cms-announcements-grid'); if (!el) return;
    each('.cms-static-anns', function(e){ e.style.display='none'; });
    el.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;';
    el.innerHTML = items.map(function(a) {
      var ph = photo(a);
      return '<div style="background:#fff;border-radius:14px;padding:1.4rem;border-left:4px solid var(--gold);box-shadow:0 2px 8px rgba(0,0,0,.07);">'
        +(ph?'<div style="overflow:hidden;border-radius:10px;margin-bottom:.85rem;height:160px;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div style="font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;">'+esc(a.category||'Announcement')+'</div>'
        +'<h4 style="font-size:1.05rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">'+esc(a.title||'')+'</h4>'
        +'<p style="font-size:.87rem;color:#374151;line-height:1.7;">'+esc(a.body||a.summary||'')+'</p>'
        +(a.date?'<div style="font-size:.74rem;color:#9ca3af;margin-top:.65rem;">'+esc(a.date)+'</div>':'')
        +'</div>';
    }).join('');
  }

  /* ── EVENTS ────────────────────────────────────────────────── */
  function doEvents() {
    var items = published('events'); if (!items.length) return;
    var el = document.getElementById('cms-events-grid'); if (!el) return;
    each('.cms-static-events', function(e){ e.style.display='none'; });
    el.style.cssText = 'display:grid;gap:1.5rem;';
    var months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.innerHTML = items.map(function(ev) {
      var p = (ev.date||'').split('-');
      var ph = photo(ev);
      return '<div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.07);">'
        +(ph?'<div style="height:140px;overflow:hidden;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div style="padding:1.4rem;display:flex;gap:1.1rem;align-items:flex-start;">'
        +'<div style="text-align:center;min-width:50px;background:var(--navy);color:#fff;border-radius:10px;padding:.55rem .4rem;flex-shrink:0;">'
        +'<div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:var(--gold);">'+(p[1]?months[+p[1]]:'')+'</div>'
        +'<div style="font-size:1.45rem;font-weight:900;line-height:1;">'+(p[2]||'--')+'</div>'
        +'<div style="font-size:.6rem;color:rgba(255,255,255,.5);">'+(p[0]||'')+'</div></div>'
        +'<div><div style="font-size:.68rem;font-weight:800;text-transform:uppercase;color:var(--gold);margin-bottom:.3rem;">'+esc(ev.category||'Event')+'</div>'
        +'<h4 style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:.35rem;">'+esc(ev.name||ev.title||'')+'</h4>'
        +(ev.time?'<div style="font-size:.8rem;color:#6b7280;">&#128336; '+esc(ev.time)+'</div>':'')
        +(ev.location?'<div style="font-size:.8rem;color:#6b7280;">&#128205; '+esc(ev.location)+'</div>':'')
        +(ev.desc||ev.body?'<p style="font-size:.82rem;color:#6b7280;margin-top:.35rem;">'+esc(ev.desc||ev.body||'')+'</p>':'')
        +'</div></div></div>';
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

    // All sermons grid
    var grid = qs('#sermonGrid') || document.getElementById('cms-sermons-grid');
    if (!grid) return;
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;';
    grid.innerHTML = items.map(function(s) {
      var isYT = (s.video||'').includes('youtube')||(s.video||'').includes('youtu.be');
      var watchHref = isYT ? s.video : 'watch-live.html';
      var ph = photo(s);
      return '<div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">'
        +(ph
          ?'<div style="height:160px;overflow:hidden;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;"/></div>'
          :'<div style="height:80px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;background:#f4f5f7;">'+esc(s.icon||'&#128293;')+'</div>')
        +'<div style="padding:1.5rem;">'
        +'<div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);margin-bottom:.35rem;">'+esc(s.series||'Sermon')+(s.date?' &middot; '+esc(s.date):'')+'</div>'
        +'<h4 style="font-size:1.1rem;font-weight:700;color:var(--navy);margin-bottom:.3rem;">'+esc(s.title||'')+'</h4>'
        +(s.speaker?'<div style="font-size:.82rem;color:#6b7280;margin-bottom:.4rem;">&#127897; '+esc(s.speaker)+'</div>':'')
        +(s.scripture?'<div style="font-size:.8rem;color:var(--gold);margin-bottom:.7rem;">&#128214; '+esc(s.scripture)+'</div>':'')
        +(s.desc||s.body?'<p style="font-size:.83rem;color:#6b7280;line-height:1.6;margin-bottom:.8rem;">'+esc(s.desc||s.body||'')+'</p>':'')
        +'<div style="display:flex;gap:.5rem;flex-wrap:wrap;">'
        +(s.video?'<a href="'+esc(watchHref)+'" target="_blank" style="padding:.42rem .95rem;background:var(--navy);color:var(--gold);border-radius:50px;font-size:.78rem;font-weight:700;text-decoration:none;">&#9654; Watch</a>':'')
        +(s.audio?'<a href="'+esc(s.audio)+'" target="_blank" style="padding:.42rem .95rem;background:#f4f5f7;color:var(--navy);border-radius:50px;font-size:.78rem;font-weight:700;text-decoration:none;">&#127925; Listen</a>':'')
        +'</div></div></div>';
    }).join('');
  }

  /* ── GALLERY ───────────────────────────────────────────────── */
  function doGallery() {
    var items = published('gallery'); if (!items.length) return;
    var el = document.getElementById('cms-gallery-grid'); if (!el) return;
    el.innerHTML = items.map(function(g, i) {
      var src = photo(g); if (!src) return '';
      return '<div class="gallery-item '+(i===0||i===3?'wide':'')+'">'
        +'<img src="'+esc(src)+'" alt="'+esc(g.title||g.name||'')+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"/>'
        +'<div class="gallery-overlay"><span class="gallery-caption">'+esc(g.title||g.name||'')+'</span></div></div>';
    }).join('');
  }

  /* ── MINISTRIES ────────────────────────────────────────────── */
  function doMinistries() {
    var items = published('ministries'); if (!items.length) return;
    var el = document.getElementById('cms-ministries-grid'); if (!el) return;
    each('.cms-static-mins', function(e){ e.style.display='none'; });
    el.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;';
    el.innerHTML = items.map(function(m) {
      var ph = photo(m);
      return '<div style="background:#fff;border-radius:14px;padding:1.5rem;box-shadow:0 2px 10px rgba(0,0,0,.08);text-align:center;">'
        +(ph?'<div style="overflow:hidden;height:120px;border-radius:10px;margin-bottom:.85rem;"><img src="'+esc(ph)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div style="font-size:2rem;margin-bottom:.6rem;">'+esc(m.icon||'&#9962;')+'</div>'
        +'<h3 style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">'+esc(m.name||m.title||'')+'</h3>'
        +'<p style="font-size:.85rem;color:#6b7280;line-height:1.6;">'+esc(m.desc||m.body||'')+'</p>'
        +(m.leader?'<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">&#128100; '+esc(m.leader)+'</p>':'')
        +(m.meeting?'<p style="font-size:.78rem;color:#9ca3af;">&#128336; '+esc(m.meeting)+'</p>':'')
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
