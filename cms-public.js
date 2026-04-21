/* ================================================================
   CHM CHURCH OF GOD — CMS Public Loader v1.0
   This file reads published content from Firebase and injects it
   into every public page. Admin changes appear here when published.
================================================================ */

(function() {

  let db = null;
  const LS_PREFIX = 'chm_';

  /* ── Connect to Firebase ───────────────────────────────────── */
  async function init() {
    try {
      if (typeof firebaseConfig === 'undefined' || firebaseConfig.apiKey.includes('PASTE_YOUR')) {
        loadFromLocalStorage();
        return;
      }
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      loadFromFirebase();
    } catch(e) {
      loadFromLocalStorage();
    }
  }

  /* ── Get data (Firebase or localStorage) ───────────────────── */
  async function getData(collection) {
    if (db) {
      try {
        const snap = await db.collection(collection).where('_status','==','published').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch(e) {}
    }
    try {
      const all = JSON.parse(localStorage.getItem(LS_PREFIX + collection)) || [];
      return all.filter(x => x._status === 'published');
    } catch { return []; }
  }

  async function getCfg(section) {
    if (db) {
      try {
        const d = await db.collection('site_config').doc(section).get();
        if (d.exists) return d.data();
      } catch(e) {}
    }
    try { return JSON.parse(localStorage.getItem('chm_cfg_' + section)) || {}; } catch { return {}; }
  }

  /* ── Load all content ──────────────────────────────────────── */
  async function loadFromFirebase() { await loadAll(); }
  function loadFromLocalStorage() { loadAll(); }

  async function loadAll() {
    const page = window.location.pathname.split('/').pop() || 'index.html';

    // Apply colors/theme to every page
    applyTheme();

    // Apply church info to every page
    applyChurchInfo();

    // Page-specific content
    if (page === '' || page === 'index.html')    loadHomePage();
    if (page === 'leaders.html')                 loadLeaders();
    if (page === 'announcements.html')           loadAnnouncements();
    if (page === 'events.html')                  loadEvents();
    if (page === 'sermons.html')                 loadSermons();
    if (page === 'gallery.html')                 loadGallery();
    if (page === 'ministries.html')              loadMinistries();
    if (page === 'about.html')                   loadAbout();
  }

  /* ── THEME / COLORS ────────────────────────────────────────── */
  async function applyTheme() {
    const c = await getCfg('colors');
    if (!c || !Object.keys(c).length) return;
    const r = document.documentElement.style;
    if (c.navy)  r.setProperty('--navy',  c.navy);
    if (c.gold)  r.setProperty('--gold',  c.gold);
    if (c.text)  r.setProperty('--text',  c.text);
    const bg = c.bgCss || c.bg;
    if (bg) document.body.style.background = bg;

    // Footer colors
    if (c.footerBg || c.footerText) {
      document.querySelectorAll('.site-footer').forEach(el => {
        if (c.footerBg)   el.style.background = c.footerBg;
        if (c.footerText) el.style.color       = c.footerText;
      });
    }
  }

  /* ── CHURCH INFO ───────────────────────────────────────────── */
  async function applyChurchInfo() {
    const info  = await getCfg('church_info');
    const times = await getCfg('service_times');
    const hero  = await getCfg('hero');

    if (info.addr)  document.querySelectorAll('[data-cms="address"]').forEach(el => el.textContent = info.addr);
    if (info.phone) document.querySelectorAll('[data-cms="phone"]').forEach(el => el.textContent = info.phone);
    if (info.email) document.querySelectorAll('[data-cms="email"]').forEach(el => el.textContent = info.email);
    if (info.about) document.querySelectorAll('.footer-about').forEach(el => el.textContent = info.about);

    if (times.sun) document.querySelectorAll('[data-cms="time-sun"]').forEach(el => el.textContent = times.sun);
    if (times.wed) document.querySelectorAll('[data-cms="time-wed"]').forEach(el => el.textContent = times.wed);
    if (times.fri) document.querySelectorAll('[data-cms="time-fri"]').forEach(el => el.textContent = times.fri);

    // Hero background video
    const vidUrl = (hero && hero.videoUrl) ? hero.videoUrl : localStorage.getItem('chm_hero_video');
    if (vidUrl) injectHeroVideo(vidUrl);
  }

  function injectHeroVideo(url) {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-video-bg')) return;
    const v = document.createElement('video');
    v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    v.className = 'hero-video-bg';
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.45;pointer-events:none;';
    v.innerHTML = `<source src="${url}" type="video/mp4"/>`;
    hero.insertBefore(v, hero.firstChild);
  }

  /* ── HOME PAGE ─────────────────────────────────────────────── */
  async function loadHomePage() {
    const h = await getCfg('page_home');
    if (h.eyebrow) { const el = document.querySelector('.hero-eyebrow'); if(el) el.innerHTML = h.eyebrow; }
    if (h.title)   { const el = document.querySelector('.hero-title');   if(el) el.innerHTML = h.title; }
    if (h.verse)   { const el = document.querySelector('.hero-verse');   if(el) el.innerHTML = h.verse; }

    // Load latest 3 announcements into homepage if container exists
    const annEl = document.getElementById('cms-home-announcements');
    if (annEl) {
      const data = await getData('announcements');
      if (data.length) {
        annEl.innerHTML = data.slice(0,3).map(a => `
          <div class="ann-card ${a._status==='pinned'?'pinned':''}">
            ${a._status==='pinned'?'<span class="ann-pin">📌</span>':''}
            <div class="ann-cat">${a.category||'Announcement'}</div>
            <h4 class="ann-title">${a.title}</h4>
            <p class="ann-body">${(a.body||'').slice(0,120)}…</p>
            <div class="ann-date">${a.date||''}</div>
          </div>`).join('');
      }
    }
  }

  /* ── LEADERS ───────────────────────────────────────────────── */
  async function loadLeaders() {
    const data = await getData('leaders');
    if (!data.length) return; // Keep static fallback if no leaders published yet

    const grid = document.getElementById('cms-leaders-grid');
    if (!grid) return;

    grid.style.display = 'grid';
    grid.innerHTML = data.map(l => {
      const photoHtml = l.photo
        ? `<img src="${l.photo}" alt="${l.first} ${l.last}" style="width:100%;aspect-ratio:1;object-fit:cover;" onerror="this.parentElement.innerHTML='<div class=&quot;leader-img-placeholder&quot;>👤</div>'">`
        : `<div class="leader-img-placeholder">👤</div>`;

      return `<div class="leader-card">
        <div class="leader-photo-wrap" style="overflow:hidden;">${photoHtml}</div>
        <div class="leader-body">
          <h4 class="leader-name">${l.first||''} ${l.last||''}</h4>
          <div class="leader-title">${l.role||''}</div>
          <p class="leader-bio">${l.bio||''}</p>
          ${l.email?`<p style="font-size:.78rem;color:var(--gold);margin-top:.5rem;">✉️ ${l.email}</p>`:''}
        </div>
      </div>`;
    }).join('');
  }

  /* ── ANNOUNCEMENTS ─────────────────────────────────────────── */
  async function loadAnnouncements() {
    const data = await getData('announcements');
    if (!data.length) return;

    const grid = document.getElementById('cms-announcements-grid');
    if (!grid) return;

    grid.innerHTML = data.map(a => `
      <div class="ann-card ${a._status==='pinned'?'pinned':''}">
        ${a._status==='pinned'?'<span class="ann-pin">📌</span>':''}
        <div class="ann-cat">${a.category||'Announcement'}</div>
        <h4 class="ann-title">${a.title}</h4>
        <p class="ann-body">${a.body||''}</p>
        <div class="ann-date">${a.date||''}</div>
      </div>`).join('');
  }

  /* ── EVENTS ────────────────────────────────────────────────── */
  async function loadEvents() {
    const data = await getData('events');
    if (!data.length) return;

    const grid = document.getElementById('cms-events-grid');
    if (!grid) return;

    grid.innerHTML = data.map(e => {
      const dateParts = (e.date||'').split('-');
      const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month = dateParts[1] ? monthNames[parseInt(dateParts[1])] : '';
      const day   = dateParts[2] || e.date || '—';
      const year  = dateParts[0] || '';

      return `<div class="event-card">
        <div class="event-date-col">
          <div class="event-month">${month}</div>
          <div class="event-day">${day}</div>
          <div class="event-year">${year}</div>
        </div>
        <div class="event-body">
          <div class="event-cat">${e.category||e.type||'Event'}</div>
          <h4 class="event-title">${e.name||''}</h4>
          <div class="event-meta">
            ${e.time?`<span>🕐 ${e.time}</span>`:''}
            ${e.location?`<span>📍 ${e.location}</span>`:''}
          </div>
          ${e.desc?`<p style="font-size:.84rem;color:var(--text-muted);margin-top:.5rem;">${e.desc}</p>`:''}
        </div>
      </div>`;
    }).join('');
  }

  /* ── SERMONS ───────────────────────────────────────────────── */
  async function loadSermons() {
    const data = await getData('sermons');
    if (!data.length) return;

    const grid = document.getElementById('cms-sermons-grid');
    if (!grid) return;

    grid.innerHTML = data.map(s => `
      <div class="card">
        <div class="card-body">
          <div style="font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;">${s.series||'Sermon'} ${s.date?'· '+s.date:''}</div>
          <h4 style="font-family:var(--font-display);font-size:1.15rem;color:var(--navy);margin-bottom:.3rem;">${s.title}</h4>
          ${s.speaker?`<div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.5rem;">🎙 ${s.speaker}</div>`:''}
          ${s.scripture?`<div style="font-size:.8rem;color:var(--gold);margin-bottom:.75rem;">📖 ${s.scripture}</div>`:''}
          ${s.desc?`<p style="font-size:.84rem;color:var(--text-muted);margin-bottom:.75rem;">${s.desc}</p>`:''}
          <div style="display:flex;gap:.6rem;flex-wrap:wrap;">
            ${s.video?`<a href="${s.video}" target="_blank" class="btn btn-primary btn-sm">▶ Watch</a>`:''}
            ${s.audio?`<a href="${s.audio}" target="_blank" class="btn btn-outline btn-sm">🎵 Listen</a>`:''}
          </div>
        </div>
      </div>`).join('');
  }

  /* ── GALLERY ───────────────────────────────────────────────── */
  async function loadGallery() {
    const data = await getData('gallery');
    if (!data.length) return;

    const grid = document.getElementById('cms-gallery-grid');
    if (!grid) return;

    grid.innerHTML = data.map((g,i) => `
      <div class="gallery-item ${i===0||i===3?'wide':''}" onclick="openLightbox('${g.url}','${(g.title||'').replace(/'/g,"\\'")}')">
        <img src="${g.url}" alt="${g.title||''}" loading="lazy" onerror="this.parentElement.style.display='none'"/>
        <div class="gallery-overlay"><span class="gallery-caption">${g.title||''}</span></div>
      </div>`).join('');
  }

  /* ── MINISTRIES ────────────────────────────────────────────── */
  async function loadMinistries() {
    const data = await getData('ministries');
    if (!data.length) return;

    const grid = document.getElementById('cms-ministries-grid');
    if (!grid) return;

    grid.innerHTML = data.map(m => `
      <div class="ministry-card">
        <div class="min-icon">${m.icon||'⛪'}</div>
        <h3 class="min-title">${m.name}</h3>
        <p class="min-desc">${m.desc||''}</p>
        ${m.leader?`<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">👤 ${m.leader}</p>`:''}
        ${m.meeting?`<p style="font-size:.78rem;color:var(--text-muted);">🕐 ${m.meeting}</p>`:''}
      </div>`).join('');
  }

  /* ── ABOUT ─────────────────────────────────────────────────── */
  async function loadAbout() {
    const a = await getCfg('page_about');
    if (a.mission) { const el = document.getElementById('cms-mission'); if(el) el.textContent = a.mission; }
    if (a.vision)  { const el = document.getElementById('cms-vision');  if(el) el.textContent = a.vision; }
    if (a.story)   { const el = document.getElementById('cms-story');   if(el) el.textContent = a.story; }
  }

  /* ── INIT ──────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
