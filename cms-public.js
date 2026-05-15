  /* ── LEADERS ───────────────────────────────────────────────── */
  function doLeaders() {
    var leaders = published('leaders');
    if (!leaders.length) return; // keep static placeholders if none published

    // Inject each published leader into their matching slot card
    leaders.forEach(function(l) {
      var slotId = 'slot-' + (l.slot || '');
      var card = document.getElementById(slotId);

      var name = ((l.first||'') + ' ' + (l.last||'')).trim();
      var photoHtml = l.photo && !l.photo.includes('[photo-stored-locally]')
        ? '<img src="' + l.photo + '" alt="' + esc(name) + '" '
          + 'style="width:100%;aspect-ratio:1;object-fit:cover;display:block;" '
          + 'onerror="this.parentElement.innerHTML='<div class=&quot;leader-img-placeholder&quot;>&#128100;</div>'">'
        : '<div class="leader-img-placeholder">&#128100;</div>';

      if (card) {
        // Update the existing slot card with real data
        card.innerHTML = '<div style="overflow:hidden;">' + photoHtml + '</div>'
          + '<div class="leader-body">'
          + '<h4 class="leader-name">' + esc(name) + '</h4>'
          + '<div class="leader-title">' + esc(l.role||'') + '</div>'
          + (l.dept ? '<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem;">' + esc(l.dept) + '</div>' : '')
          + (l.bio  ? '<p class="leader-bio">' + esc(l.bio) + '</p>' : '')
          + (l.email? '<p style="font-size:.75rem;color:var(--gold);margin-top:.5rem;">&#9993; ' + esc(l.email) + '</p>' : '')
          + '</div>';
      }
    });

    // Also show any extra leaders (no slot) in cms-leaders-grid
    var extra = leaders.filter(function(l){ return !l.slot || !document.getElementById('slot-'+l.slot); });
    if (extra.length) {
      var grid = document.getElementById('cms-leaders-grid');
      if (grid) {
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
        grid.style.gap = '2rem';
        grid.style.marginBottom = '2rem';
        grid.innerHTML += extra.map(function(l) {
          var name = ((l.first||'') + ' ' + (l.last||'')).trim();
          var photoHtml = l.photo && !l.photo.includes('[photo-stored-locally]')
            ? '<img src="' + l.photo + '" alt="' + esc(name) + '" style="width:100%;aspect-ratio:1;object-fit:cover;">'
            : '<div class="leader-img-placeholder">&#128100;</div>';
          return '<div class="leader-card"><div style="overflow:hidden;">' + photoHtml + '</div>'
            + '<div class="leader-body"><h4 class="leader-name">' + esc(name) + '</h4>'
            + '<div class="leader-title">' + esc(l.role||'') + '</div>'
            + (l.bio ? '<p class="leader-bio">' + esc(l.bio) + '</p>' : '')
            + '</div></div>';
        }).join('');
      }
    }
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
