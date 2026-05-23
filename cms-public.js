/* CHM CHURCH OF GOD — CMS Public Loader v5 (Complete)
   Reads site-data.json from GitHub → updates every public page globally */
(function() {
  'use strict';

  var OWNER  = 'yodebepro';
  var REPO   = 'CHM-Church-of-God';
  var BRANCH = 'main';
  var siteData = null;

  async function load() {
    var ts = '?_=' + Date.now();
    var urls = [
      'https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/'+BRANCH+'/site-data.json'+ts,
      'https://raw.githubusercontent.com/'+OWNER+'/'+REPO+'/refs/heads/'+BRANCH+'/site-data.json'+ts,
      'https://cdn.jsdelivr.net/gh/'+OWNER+'/'+REPO+'@'+BRANCH+'/site-data.json'+ts
    ];
    for (var i=0; i<urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache:'no-store', headers:{'Pragma':'no-cache'} });
        if (res.ok) {
          var text = await res.text();
          siteData = JSON.parse(text);
          try { localStorage.setItem('chm_sd_bk', text); } catch(e) {}
          applyAll(); return;
        }
      } catch(e) {}
    }
    // Fallback: localStorage
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
    if (page==='departments.html')       doDepartments();
    if (page==='teams.html')             doTeams();
    if (page==='about.html')             doAboutFull();
  }

  function applyTheme() {
    var c = cfg('colors'); if (!c) return;
    var r = document.documentElement.style;
    if (c.navy) r.setProperty('--navy', c.navy);
    if (c.gold) r.setProperty('--gold', c.gold);
    var bg = c.bgCss || c.bg; if (bg) document.body.style.background = bg;
    if (c.footerBg || c.footerText) each('.site-footer', function(el){
      if (c.footerBg)   el.style.setProperty('background', c.footerBg, 'important');
      if (c.footerText) el.style.setProperty('color', c.footerText, 'important');
    });
  }

  function applyInfo() {
    var info=cfg('church_info'), times=cfg('service_times'), hero=cfg('hero');
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
    heroEl.style.position='relative'; heroEl.insertBefore(v, heroEl.firstChild);
  }

  function doHome() {
    var h = cfg('page_home');
    if (h.eyebrow) { var el=qs('.hero-eyebrow'); if(el) el.innerHTML=h.eyebrow; }
    if (h.title)   { var el=qs('.hero-title');   if(el) el.innerHTML=h.title; }
    if (h.verse)   { var el=qs('.hero-verse');   if(el) el.innerHTML=h.verse; }
  }

  /* ── LEADERS ─────────────────────────────────────────────────── */
  function doLeaders() {
    var leaders = published('leaders');
    if (!leaders.length) return;
    leaders.forEach(function(l) {
      var slotId = 'slot-' + (l.slot||'');
      var card = document.getElementById(slotId);
      var name = ((l.first||'')+' '+(l.last||'')).trim();
      var src = (l.photo && !l.photo.includes('[photo-stored')) ? l.photo : '';
      var photoHtml = src
        ? '<img src="'+esc(src)+'" alt="'+esc(name)+'" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;" onerror="this.parentElement.innerHTML=\'<div class=&quot;leader-img-placeholder&quot;>&#128100;</div>\'">'
        : '<div class="leader-img-placeholder">&#128100;</div>';
      if (card) {
        card.innerHTML = '<div style="overflow:hidden;">'+photoHtml+'</div>'
          +'<div class="leader-body"><h4 class="leader-name">'+esc(name)+'</h4>'
          +'<div class="leader-title">'+esc(l.role||'')+'</div>'
          +(l.dept?'<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem;">'+esc(l.dept)+'</div>':'')
          +(l.bio?'<p class="leader-bio">'+esc(l.bio)+'</p>':'')
          +(l.email?'<p style="font-size:.75rem;color:var(--gold);margin-top:.5rem;">&#9993; '+esc(l.email)+'</p>':'')
          +'</div>';
      }
    });
    var extra = leaders.filter(function(l){ return !l.slot || !document.getElementById('slot-'+l.slot); });
    if (extra.length) {
      var grid = document.getElementById('cms-leaders-grid');
      if (grid) {
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:2rem;margin-bottom:2rem;';
        grid.innerHTML += extra.map(function(l) {
          var name=((l.first||'')+' '+(l.last||'')).trim();
          var src=(l.photo&&!l.photo.includes('[photo-stored'))?l.photo:'';
          var ph=src?'<img src="'+esc(src)+'" style="width:100%;aspect-ratio:1;object-fit:cover;">':'<div class="leader-img-placeholder">&#128100;</div>';
          return '<div class="leader-card"><div style="overflow:hidden;">'+ph+'</div>'
            +'<div class="leader-body"><h4 class="leader-name">'+esc(name)+'</h4>'
            +'<div class="leader-title">'+esc(l.role||'')+'</div>'
            +(l.bio?'<p class="leader-bio">'+esc(l.bio)+'</p>':'')+'</div></div>';
        }).join('');
      }
    }
  }

  /* ── ANNOUNCEMENTS ───────────────────────────────────────────── */
  function doAnnouncements() {
    var items = published('announcements'); if (!items.length) return;
    var el = qs('#cms-announcements-grid'); if (!el) return;
    each('.cms-static-anns', function(e){ e.style.display='none'; });
    el.innerHTML = items.map(function(a){
      return '<div class="ann-card" style="background:#fff;border-radius:14px;padding:1.4rem;border-left:4px solid var(--gold);box-shadow:0 2px 8px rgba(0,0,0,.07);">'
        +'<div style="font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;">'+esc(a.category||'Announcement')+'</div>'
        +'<h4 style="font-size:1.05rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">'+esc(a.title||'')+'</h4>'
        +'<p style="font-size:.87rem;color:#374151;line-height:1.7;">'+esc(a.body||'')+'</p>'
        +(a.date?'<div style="font-size:.74rem;color:#9ca3af;margin-top:.65rem;">'+esc(a.date)+'</div>':'')
        +'</div>';
    }).join('');
  }

  /* ── EVENTS ──────────────────────────────────────────────────── */
  function doEvents() {
    var items = published('events'); if (!items.length) return;
    var el = qs('#cms-events-grid'); if (!el) return;
    each('.cms-static-events', function(e){ e.style.display='none'; });
    el.style.display='grid'; el.style.gridTemplateColumns='1fr'; el.style.gap='1.5rem';
    var months=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.innerHTML = items.map(function(e){
      var p=(e.date||'').split('-');
      return '<div style="background:#fff;border-radius:14px;padding:1.4rem;box-shadow:0 2px 8px rgba(0,0,0,.07);display:flex;gap:1.1rem;align-items:flex-start;">'
        +'<div style="text-align:center;min-width:50px;background:var(--navy);color:#fff;border-radius:10px;padding:.55rem .4rem;flex-shrink:0;">'
        +'<div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:var(--gold);">'+(p[1]?months[+p[1]]:'')+'</div>'
        +'<div style="font-size:1.45rem;font-weight:900;line-height:1;">'+(p[2]||'--')+'</div>'
        +'<div style="font-size:.6rem;color:rgba(255,255,255,.5);">'+(p[0]||'')+'</div></div>'
        +'<div><div style="font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--gold);margin-bottom:.3rem;">'+esc(e.category||'Event')+'</div>'
        +'<h4 style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:.35rem;">'+esc(e.name||'')+'</h4>'
        +(e.time?'<div style="font-size:.8rem;color:#6b7280;">&#128336; '+esc(e.time)+'</div>':'')
        +(e.location?'<div style="font-size:.8rem;color:#6b7280;">&#128205; '+esc(e.location)+'</div>':'')
        +(e.desc?'<p style="font-size:.82rem;color:#6b7280;margin-top:.35rem;">'+esc(e.desc)+'</p>':'')
        +'</div></div>';
    }).join('');
  }

  /* ── SERMONS ─────────────────────────────────────────────────── */
  function doSermons() {
    var items = published('sermons'); if (!items.length) return;
    // Featured / Latest Sermon
    var f = items[0];
    var featEl = qs('.featured-sermon');
    if (featEl && f) {
      var isYT = (f.video||'').includes('youtube') || (f.video||'').includes('youtu.be');
      var watchHref = isYT ? f.video : 'watch-live.html';
      featEl.innerHTML =
        '<div class="featured-thumb"><div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:1rem;">'
        +'<span>'+(f.icon||'&#128293;')+'</span>'
        +(f.video?'<a href="'+esc(watchHref)+'" target="_blank" style="width:60px;height:60px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--navy);text-decoration:none;">&#9654;</a>':'')
        +'</div></div>'
        +'<div class="featured-body">'
        +'<div class="featured-label">&#11088; Latest &middot; '+(f.video?'Video':'Audio')+' Sermon</div>'
        +'<div class="featured-title">'+esc(f.title||'')+'</div>'
        +'<div class="featured-excerpt">'+esc(f.desc||'')+'</div>'
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
    // All Sermons Grid
    var grid = document.getElementById('sermonGrid') || qs('#cms-sermons-grid');
    if (grid) {
      grid.innerHTML = items.map(function(s){
        var isYT=(s.video||'').includes('youtube')||(s.video||'').includes('youtu.be');
        var watchHref=isYT?s.video:'watch-live.html';
        return '<div class="sermon-card reveal" data-category="'+(s.series||'preaching').toLowerCase().replace(/\s+/g,'-')+'">'
          +'<div class="sermon-thumb">'
          +(s.video?'<span class="sermon-type-badge badge-video">&#9654; Video</span>':'')
          +(s.audio&&!s.video?'<span class="sermon-type-badge badge-audio">&#127925; Audio</span>':'')
          +'<div class="sermon-thumb-icon">'+(s.icon||'&#128293;')+'</div>'
          +(s.video?'<div class="sermon-play-overlay"><a href="'+esc(watchHref)+'" target="_blank" class="sermon-play-btn" style="text-decoration:none;color:inherit;">&#9654;</a></div>':'')
          +'</div>'
          +'<div class="sermon-body">'
          +'<div class="sermon-series">'+esc(s.series||'')+'</div>'
          +'<h3 class="sermon-title">'+esc(s.title||'')+'</h3>'
          +'<p class="sermon-excerpt">'+esc((s.desc||'').slice(0,130))+'...</p>'
          +'<div class="sermon-meta">'
          +(s.date?'<span>&#128197; '+esc(s.date)+'</span>':'')
          +(s.scripture?'<span>&#128214; '+esc(s.scripture)+'</span>':'')
          +'</div>'
          +'<div style="display:flex;gap:.5rem;margin-top:.75rem;flex-wrap:wrap;">'
          +(s.video?'<a href="'+esc(watchHref)+'" target="_blank" style="padding:.38rem .9rem;background:var(--navy);color:var(--gold);border-radius:50px;font-size:.75rem;font-weight:700;text-decoration:none;">&#9654; Watch</a>':'')
          +(s.audio?'<a href="'+esc(s.audio)+'" target="_blank" style="padding:.38rem .9rem;background:#f4f5f7;color:var(--navy);border-radius:50px;font-size:.75rem;font-weight:700;text-decoration:none;">&#127925;</a>':'')
          +'</div></div></div>';
      }).join('');
    }
  }

  /* ── GALLERY ─────────────────────────────────────────────────── */
  function doGallery() {
    var items = published('gallery'); if (!items.length) return;
    var el = qs('#cms-gallery-grid'); if (!el) return;
    el.innerHTML = items.map(function(g,i){
      return '<div class="gallery-item '+(i===0||i===3?'wide':'')+'">'
        +'<img src="'+esc(g.url)+'" alt="'+esc(g.title||'')+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"/>'
        +'<div class="gallery-overlay"><span class="gallery-caption">'+esc(g.title||'')+'</span></div></div>';
    }).join('');
  }

  /* ── MINISTRIES ──────────────────────────────────────────────── */
  function doMinistries() {
    var items = published('ministries'); if (!items.length) return;
    var el = qs('#cms-ministries-grid'); if (!el) return;
    el.innerHTML = items.map(function(m){
      return '<div class="ministry-card">'
        +'<div class="min-icon">'+(m.icon||'&#9962;')+'</div>'
        +'<h3 class="min-title">'+esc(m.name||'')+'</h3>'
        +'<p class="min-desc">'+esc(m.desc||'')+'</p>'
        +(m.leader?'<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">&#128100; '+esc(m.leader)+'</p>':'')
        +(m.meeting?'<p style="font-size:.78rem;color:#9ca3af;">&#128336; '+esc(m.meeting)+'</p>':'')
        +'</div>';
    }).join('');
  }


  /* ── TEAMS ───────────────────────────────────────────────────── */
  function doTeams() {
    var items = published('teams'); if (!items.length) return;
    var grid = qs('#cms-teams-grid'); if (!grid) return;
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;';
    each('.cms-static-teams', function(el){ el.style.display='none'; });
    items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
    grid.innerHTML = items.map(function(t){
      var src=(t.photo&&!t.photo.includes('[photo-stored'))?t.photo:'';
      return '<div class="min-card" style="background:#fff;border-radius:14px;padding:1.5rem;box-shadow:0 2px 10px rgba(0,0,0,.08);">'
        +(src?'<div style="overflow:hidden;height:100px;border-radius:10px;margin-bottom:1rem;"><img src="'+esc(src)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'')
        +'<div style="font-size:2rem;margin-bottom:.6rem;">'+esc(t.icon||'&#128101;')+'</div>'
        +'<h3 style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:.5rem;">'+esc(t.name||'')+'</h3>'
        +'<p style="font-size:.85rem;color:#6b7280;line-height:1.6;">'+esc(t.desc||'')+'</p>'
        +(t.category?'<div style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);margin-top:.6rem;">'+esc(t.category)+'</div>':'')
        +'</div>';
    }).join('');
  }

  /* ── DEPARTMENTS ─────────────────────────────────────────────── */
  function doDepartments() {
    var items = published('departments'); if (!items.length) return;
    var grid = qs('#cms-departments-grid'); if (!grid) return;
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem;margin-top:3rem;';
    each('.cms-static-depts', function(el){ el.style.display='none'; });
    items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
    grid.innerHTML = items.map(function(d){
      var src=(d.photo&&!d.photo.includes('[photo-stored'))?d.photo:'';
      var photoHtml=src?'<div style="overflow:hidden;height:120px;border-radius:10px 10px 0 0;margin:-1.75rem -1.75rem 1rem;"><img src="'+esc(src)+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.remove()"/></div>':'';
      return '<div class="dept-card">'+photoHtml
        +'<div class="dept-icon">'+esc(d.icon||'&#9962;')+'</div>'
        +'<h3 class="dept-title">'+esc(d.name||'')+'</h3>'
        +'<p class="dept-desc">'+esc(d.desc||'')+'</p>'
        +(d.leader?'<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">&#128100; '+esc(d.leader)+'</p>':'')
        +'</div>';
    }).join('');
  }

  /* ── ABOUT ───────────────────────────────────────────────────── */
  function doAbout() {
    var a = cfg('page_about');
    if (a.mission) setText('#cms-mission', a.mission);
    if (a.vision)  setText('#cms-vision',  a.vision);
    if (a.story)   setText('#cms-story',   a.story);
  }

  function doAboutFull() {
    var a = cfg('page_about');
    // Story
    if (a.storyTitle) setText('#cms-story-title', a.storyTitle);
    if (a.storyP1)    setText('#cms-story-p1',    a.storyP1);
    if (a.storyP2)    setText('#cms-story-p2',    a.storyP2);
    if (a.mission)    setText('#cms-mission',      a.mission);
    if (a.vision)     setText('#cms-vision',       a.vision);
    // Values
    if (a.values && a.values.length) {
      var vEl = qs('#cms-values');
      if (vEl) vEl.innerHTML = a.values.map(function(v){
        return '<div style="display:flex;align-items:center;gap:.75rem;color:rgba(255,255,255,.8);font-size:.9rem;">'
          +'<span style="color:var(--gold);">&#10006;</span> '+esc(v)+'</div>';
      }).join('');
    }
    // Beliefs
    if (a.beliefs && a.beliefs.length) {
      var bEl = qs('#cms-beliefs-grid');
      if (bEl) bEl.innerHTML = a.beliefs.map(function(b,i){
        var num = (i+1 < 10 ? '0' : '') + (i+1);
        return '<div class="belief-card reveal"><div class="belief-num">'+num+'</div>'
          +'<div class="belief-title">'+esc(b.title||'')+'</div>'
          +'<p class="belief-text">'+esc(b.text||'')+'</p></div>';
      }).join('');
    }
    // Stats
    if (a.stat1n) { var el=qs('#cms-stat-1-n'); if(el) el.textContent=a.stat1n; }
    if (a.stat1l) { var el=qs('#cms-stat-1-l'); if(el) el.textContent=a.stat1l; }
    if (a.stat2n) { var el=qs('#cms-stat-2-n'); if(el) el.textContent=a.stat2n; }
    if (a.stat2l) { var el=qs('#cms-stat-2-l'); if(el) el.textContent=a.stat2l; }
    if (a.stat3n) { var el=qs('#cms-stat-3-n'); if(el) el.textContent=a.stat3n; }
    if (a.stat3l) { var el=qs('#cms-stat-3-l'); if(el) el.textContent=a.stat3l; }
    // About page leadership
    var leaders = published('leaders');
    leaders.forEach(function(l){
      var slot = qs('#about-slot-' + (l.slot||''));
      if (!slot) return;
      var name = ((l.first||'')+' '+(l.last||'')).trim();
      var src = (l.photo&&!l.photo.includes('[photo-stored'))?l.photo:'';
      slot.innerHTML = (src ? '<img src="'+esc(src)+'" style="width:100%;aspect-ratio:1;object-fit:cover;" onerror="this.outerHTML='<div class=&quot;leader-img-placeholder&quot;>&#128100;</div>'">'
                            : '<div class="leader-img-placeholder">&#128100;</div>')
        +'<div class="leader-body"><h4 class="leader-name">'+esc(name)+'</h4>'
        +'<div class="leader-title">'+esc(l.role||'')+'</div>'
        +'<p class="leader-bio">'+esc(l.bio||'')+'</p></div>';
    });
  }


  /* ── HELPERS ─────────────────────────────────────────────────── */
  function qs(sel)       { return document.querySelector(sel); }
  function each(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
  function setText(sel, val) { var el=qs(sel); if(el) el.textContent=val; }
  function esc(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function photo(url, altText, style) {
    // Check localStorage fallback for [photo-stored-locally] placeholder
    var src = (url && !url.includes('[photo-stored')) ? url : '';
    if (!src) return '<div class="leader-img-placeholder">&#128100;</div>';
    return '<img src="'+esc(src)+'" alt="'+esc(altText||'')+'" style="'+(style||'width:100%;height:100%;object-fit:cover;')+'" onerror="this.parentElement.innerHTML=\'<div class=&quot;leader-img-placeholder&quot;>&#128100;</div>\'">';
  }

  /* ── START ───────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }

})();
