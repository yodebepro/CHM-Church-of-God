/* CHM CHURCH OF GOD — CMS Public Loader v2
   Reads published content from site-data.json (GitHub)
   Works on ALL computers/devices — no localStorage dependency */

(function() {
  const REPO_OWNER = 'yodebepro';
  const REPO_NAME  = 'CHM-Church-of-God';
  const BRANCH     = 'main';
  const DATA_URL   = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/refs/heads/${BRANCH}/site-data.json`;

  let siteData = null;

  async function load() {
    try {
      const res = await fetch(DATA_URL + '?t=' + Date.now());
      if (res.ok) siteData = await res.json();
    } catch(e) {
      // Fallback: try local copy
      try { siteData = JSON.parse(localStorage.getItem('chm_sitedata')); } catch {}
    }
    if (!siteData) return;
    applyAll();
  }

  function getCollection(col) {
    return (siteData[col] || []).filter(x => x._status === 'published');
  }

  function getCfg(section) {
    return (siteData.site_config || {})[section] || {};
  }

  function applyAll() {
    applyTheme();
    applyChurchInfo();
    const page = location.pathname.split('/').pop() || 'index.html';
    if (page===''||page==='index.html') loadHome();
    if (page==='leaders.html')          loadLeaders();
    if (page==='announcements.html')    loadAnnouncements();
    if (page==='events.html')           loadEvents();
    if (page==='sermons.html')          loadSermons();
    if (page==='gallery.html')          loadGallery();
    if (page==='ministries.html')       loadMinistries();
    if (page==='about.html')            loadAbout();
  }

  function applyTheme() {
    const c = getCfg('colors');
    if (c.navy)  document.documentElement.style.setProperty('--navy', c.navy);
    if (c.gold)  document.documentElement.style.setProperty('--gold', c.gold);
    if (c.bgCss||c.bg) document.body.style.background = c.bgCss||c.bg;
    if (c.footerBg||c.footerText) {
      document.querySelectorAll('.site-footer').forEach(el => {
        if (c.footerBg)   el.style.background = c.footerBg;
        if (c.footerText) el.style.color = c.footerText;
      });
    }
  }

  function applyChurchInfo() {
    const info  = getCfg('church_info');
    const times = getCfg('service_times');
    const hero  = getCfg('hero');
    if (info.addr)  document.querySelectorAll('[data-cms="address"]').forEach(el=>el.textContent=info.addr);
    if (info.phone) document.querySelectorAll('[data-cms="phone"]').forEach(el=>el.textContent=info.phone);
    if (info.email) document.querySelectorAll('[data-cms="email"]').forEach(el=>el.textContent=info.email);
    if (info.about) document.querySelectorAll('.footer-about').forEach(el=>el.textContent=info.about);
    if (times.sun)  document.querySelectorAll('[data-cms="time-sun"]').forEach(el=>el.textContent=times.sun);
    if (times.wed)  document.querySelectorAll('[data-cms="time-wed"]').forEach(el=>el.textContent=times.wed);
    if (times.fri)  document.querySelectorAll('[data-cms="time-fri"]').forEach(el=>el.textContent=times.fri);
    const vid = hero.videoUrl || localStorage.getItem('chm_hero_video');
    if (vid) injectHeroVideo(vid);
  }

  function injectHeroVideo(url) {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-video-bg')) return;
    const v = document.createElement('video');
    v.autoplay=true; v.muted=true; v.loop=true; v.playsInline=true;
    v.className='hero-video-bg';
    v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.45;pointer-events:none;';
    v.innerHTML=`<source src="${url}" type="video/mp4"/>`;
    hero.insertBefore(v, hero.firstChild);
  }

  function loadHome() {
    const h = getCfg('page_home');
    if (h.eyebrow){const el=document.querySelector('.hero-eyebrow');if(el)el.innerHTML=h.eyebrow;}
    if (h.title)  {const el=document.querySelector('.hero-title');  if(el)el.innerHTML=h.title;}
    if (h.verse)  {const el=document.querySelector('.hero-verse');  if(el)el.innerHTML=h.verse;}
  }

  function loadLeaders() {
    const data = getCollection('leaders');
    if (!data.length) return;
    const grid = document.getElementById('cms-leaders-grid');
    if (!grid) return;
    grid.style.display = 'grid';
    grid.innerHTML = data.map(l => `
      <div class="leader-card">
        ${l.photo
          ? `<img src="${l.photo}" alt="${l.first||''} ${l.last||''}" style="width:100%;aspect-ratio:1;object-fit:cover;" onerror="this.outerHTML='<div class=&quot;leader-img-placeholder&quot;>👤</div>'">`
          : `<div class="leader-img-placeholder">👤</div>`}
        <div class="leader-body">
          <h4 class="leader-name">${l.first||''} ${l.last||''}</h4>
          <div class="leader-title">${l.role||''}</div>
          <p class="leader-bio">${l.bio||''}</p>
        </div>
      </div>`).join('');
    // Hide static placeholder leaders
    document.querySelectorAll('.grid-4').forEach(el=>{if(el.id!=='cms-leaders-grid')el.style.display='none';});
  }

  function loadAnnouncements() {
    const data = getCollection('announcements');
    if (!data.length) return;
    const el = document.getElementById('cms-announcements-grid');
    if (!el) return;
    el.innerHTML = data.map(a=>`
      <div class="ann-card ${a._status==='pinned'?'pinned':''}">
        ${a._status==='pinned'?'<span class="ann-pin">📌</span>':''}
        <div class="ann-cat">${a.category||'Announcement'}</div>
        <h4 class="ann-title">${a.title||''}</h4>
        <p class="ann-body">${a.body||''}</p>
        <div class="ann-date">${a.date||''}</div>
      </div>`).join('');
  }

  function loadEvents() {
    const data = getCollection('events');
    if (!data.length) return;
    const el = document.getElementById('cms-events-grid');
    if (!el) return;
    const months=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    el.innerHTML = data.map(e=>{
      const p=(e.date||'').split('-');
      return `<div class="event-card">
        <div class="event-date-col">
          <div class="event-month">${p[1]?months[+p[1]]:''}</div>
          <div class="event-day">${p[2]||e.date||'—'}</div>
          <div class="event-year">${p[0]||''}</div>
        </div>
        <div class="event-body">
          <div class="event-cat">${e.category||e.type||'Event'}</div>
          <h4 class="event-title">${e.name||''}</h4>
          <div class="event-meta">${e.time?`<span>🕐 ${e.time}</span>`:''}${e.location?`<span>📍 ${e.location}</span>`:''}</div>
          ${e.desc?`<p style="font-size:.84rem;color:var(--text-muted);margin-top:.5rem;">${e.desc}</p>`:''}
        </div>
      </div>`;
    }).join('');
  }

  function loadSermons() {
    const data = getCollection('sermons');
    if (!data.length) return;
    const el = document.getElementById('cms-sermons-grid');
    if (!el) return;
    el.innerHTML = data.map(s=>`
      <div class="card"><div class="card-body">
        <div style="font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;">${s.series||'Sermon'}${s.date?' · '+s.date:''}</div>
        <h4 style="font-family:var(--font-display);font-size:1.15rem;color:var(--navy);margin-bottom:.3rem;">${s.title}</h4>
        ${s.speaker?`<div style="font-size:.82rem;color:var(--text-muted);margin-bottom:.5rem;">🎙 ${s.speaker}</div>`:''}
        ${s.scripture?`<div style="font-size:.8rem;color:var(--gold);margin-bottom:.75rem;">📖 ${s.scripture}</div>`:''}
        ${s.desc?`<p style="font-size:.84rem;color:var(--text-muted);margin-bottom:.75rem;">${s.desc}</p>`:''}
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;">
          ${s.video?`<a href="${s.video}" target="_blank" class="btn btn-primary btn-sm">▶ Watch</a>`:''}
          ${s.audio?`<a href="${s.audio}" target="_blank" class="btn btn-outline btn-sm">🎵 Listen</a>`:''}
        </div>
      </div></div>`).join('');
  }

  function loadGallery() {
    const data = getCollection('gallery');
    if (!data.length) return;
    const el = document.getElementById('cms-gallery-grid');
    if (!el) return;
    el.innerHTML = data.map((g,i)=>`
      <div class="gallery-item ${i===0||i===3?'wide':''}">
        <img src="${g.url}" alt="${g.title||''}" loading="lazy" onerror="this.parentElement.style.display='none'"/>
        <div class="gallery-overlay"><span class="gallery-caption">${g.title||''}</span></div>
      </div>`).join('');
  }

  function loadMinistries() {
    const data = getCollection('ministries');
    if (!data.length) return;
    const el = document.getElementById('cms-ministries-grid');
    if (!el) return;
    el.innerHTML = data.map(m=>`
      <div class="ministry-card">
        <div class="min-icon">${m.icon||'⛪'}</div>
        <h3 class="min-title">${m.name}</h3>
        <p class="min-desc">${m.desc||''}</p>
        ${m.leader?`<p style="font-size:.78rem;font-weight:700;color:var(--gold);margin-top:.75rem;">👤 ${m.leader}</p>`:''}
        ${m.meeting?`<p style="font-size:.78rem;color:var(--text-muted);">🕐 ${m.meeting}</p>`:''}
      </div>`).join('');
  }

  function loadAbout() {
    const a = getCfg('page_about');
    if (a.mission){const el=document.getElementById('cms-mission');if(el)el.textContent=a.mission;}
    if (a.vision) {const el=document.getElementById('cms-vision'); if(el)el.textContent=a.vision;}
    if (a.story)  {const el=document.getElementById('cms-story');  if(el)el.textContent=a.story;}
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
