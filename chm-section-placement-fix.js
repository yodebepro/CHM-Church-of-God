
/* ============================================================
   CHM TRUE CMS — SECTION PLACEMENT FIX
   This script places globally-published CMS content into the
   correct public page section/card spots instead of leaving
   placeholders or adding items to the wrong place.
============================================================ */
(function(){
  const OWNER = localStorage.getItem('chm_gh_owner') || 'yodebepro';
  const REPO = localStorage.getItem('chm_gh_repo') || 'CHM-Church-of-God';
  const BRANCH = localStorage.getItem('chm_gh_branch') || 'main';

  const CONFIG = {
    'leaders': {
      cols: ['leaders','leadership'],
      cards: '.leader-card',
      containers: ['.grid-4', '.leaders-grid', '.team-grid', '.feature-grid'],
      titleSel: '.leader-name,h3,h4',
      subSel: '.leader-title,.title,.category',
      bodySel: '.leader-bio,p',
      mediaSel: '.leader-img-placeholder,.leader-photo,.card-image,img'
    },
    'gallery': {
      cols: ['gallery','media_library'],
      cards: '.gallery-card,.media-card,.feature-card,.card',
      containers: ['.gallery-grid','.media-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.gallery-title,.card-title,h3,h4',
      subSel: '.gallery-category,.tag,.badge,.category',
      bodySel: '.gallery-desc,.card-text,p',
      mediaSel: '.gallery-img,.gallery-image,.media-thumb,.image-placeholder,.placeholder,img'
    },
    'events': {
      cols: ['events'],
      cards: '.event-card,.feature-card,.card',
      containers: ['.events-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.event-title,.card-title,h3,h4',
      subSel: '.event-cat,.tag,.badge,.category',
      bodySel: '.event-desc,.card-text,p',
      mediaSel: '.event-img,.event-image,.image-placeholder,.placeholder,img'
    },
    'announcements': {
      cols: ['announcements'],
      cards: '.ann-card,.announcement-card,.feature-card,.card',
      containers: ['.announcements-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.ann-title,.card-title,h3,h4',
      subSel: '.ann-cat,.tag,.badge,.category',
      bodySel: '.ann-body,.card-text,p',
      mediaSel: '.ann-img,.image-placeholder,.placeholder,img'
    },
    'sermons': {
      cols: ['sermons'],
      cards: '.sermon-card,.feature-card,.card',
      containers: ['.sermons-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.sermon-title,.card-title,h3,h4',
      subSel: '.sermon-speaker,.tag,.badge,.category',
      bodySel: '.sermon-desc,.card-text,p',
      mediaSel: '.sermon-img,.sermon-image,.image-placeholder,.placeholder,img'
    },
    'ministries': {
      cols: ['ministries','sacred_ministries'],
      cards: '.ministry-card,.feature-card,.card',
      containers: ['.ministries-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.min-title,.card-title,h3,h4',
      subSel: '.tag,.badge,.category',
      bodySel: '.min-desc,.card-text,p',
      mediaSel: '.min-icon,.ministry-img,.image-placeholder,.placeholder,img'
    },
    'departments': {
      cols: ['departments'],
      cards: '.ministry-card,.department-card,.feature-card,.card',
      containers: ['.departments-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.min-title,.department-title,.card-title,h3,h4',
      subSel: '.tag,.badge,.category',
      bodySel: '.min-desc,.department-desc,.card-text,p',
      mediaSel: '.min-icon,.department-img,.image-placeholder,.placeholder,img'
    },
    'teams': {
      cols: ['teams'],
      cards: '.leader-card,.team-card,.feature-card,.card',
      containers: ['.teams-grid','.team-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.leader-name,.team-name,.card-title,h3,h4',
      subSel: '.leader-title,.team-role,.tag,.badge,.category',
      bodySel: '.leader-bio,.team-bio,.card-text,p',
      mediaSel: '.leader-img-placeholder,.team-photo,.image-placeholder,.placeholder,img'
    },
    'locations': {
      cols: ['locations'],
      cards: '.location-card,.feature-card,.card',
      containers: ['.locations-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.location-title,.card-title,h3,h4',
      subSel: '.location-address,.tag,.badge,.category',
      bodySel: '.location-desc,.card-text,p',
      mediaSel: '.location-img,.image-placeholder,.placeholder,img'
    },
    'about': {
      cols: ['page_content'],
      cards: '.about-card,.feature-card,.card',
      containers: ['.about-grid','.feature-grid','.grid-3','.grid-4'],
      titleSel: '.card-title,h3,h4',
      subSel: '.tag,.badge,.category',
      bodySel: '.card-text,p',
      mediaSel: '.image-placeholder,.placeholder,img'
    },
    'give': {
      cols: ['page_content'],
      cards: '.give-card,.feature-card,.card',
      containers: ['.give-grid,.feature-grid,.grid-3,.grid-4'],
      titleSel: '.card-title,h3,h4',
      subSel: '.tag,.badge,.category',
      bodySel: '.card-text,p',
      mediaSel: '.image-placeholder,.placeholder,img'
    }
  };

  function pageName(){
    const f = (location.pathname.split('/').pop() || 'index.html').replace('.html','').toLowerCase();
    return f === '' ? 'index' : f;
  }

  function isPublished(item){
    const s = String(item._status || item.status || 'draft').toLowerCase();
    return s === 'published' && item.archived !== true;
  }

  function mediaOf(item){
    return item.mediaUrl || item.imageUrl || item.photoUrl || item.thumbnailUrl || item.videoUrl || item.audioUrl || '';
  }

  function textOf(v){ return v == null ? '' : String(v); }

  function isVideo(url){
    return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || '');
  }

  async function loadData(){
    const urls = [
      `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/site-data.json?_=${Date.now()}`,
      `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}/site-data.json?_=${Date.now()}`
    ];

    for (const u of urls){
      try{
        const r = await fetch(u, {cache:'no-store'});
        if(r.ok){
          const d = await r.json();
          localStorage.setItem('chm_sd_bk', JSON.stringify(d));
          return d;
        }
      }catch(e){}
    }

    try{
      return JSON.parse(localStorage.getItem('chm_sd_bk') || localStorage.getItem('chm_sitedata') || '{}');
    }catch(e){
      return {};
    }
  }

  function getItems(data, cols){
    let out = [];
    cols.forEach(col => {
      if(Array.isArray(data[col])){
        out = out.concat(data[col].filter(isPublished).map(x => ({...x, collection: col})));
      }
    });
    return out.sort((a,b)=>(b._updatedAt||b.updatedAt||b._publishedAt||0)-(a._updatedAt||a.updatedAt||a._publishedAt||0));
  }

  function applyHero(data){
    const heroItems = Array.isArray(data.hero) ? data.hero.filter(isPublished) : [];
    const hero = heroItems[0] || (data.site_config && data.site_config.hero);
    if(!hero) return;

    const media = mediaOf(hero);
    const heroEl = document.querySelector('.hero, .page-hero, [data-hero]');
    if(heroEl && media){
      let vid = heroEl.querySelector('.chm-cms-hero-video');
      if(!vid){
        vid = document.createElement('video');
        vid.className = 'chm-cms-hero-video';
        vid.autoplay = true;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.setAttribute('playsinline','');
        vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.46;pointer-events:none;';
        heroEl.style.position = 'relative';
        heroEl.style.overflow = 'hidden';
        heroEl.insertBefore(vid, heroEl.firstChild);
      }
      vid.innerHTML = `<source src="${media}" type="video/mp4">`;
      Array.from(heroEl.children).forEach(ch=>{
        if(ch !== vid){
          ch.style.position = ch.style.position || 'relative';
          ch.style.zIndex = ch.style.zIndex || '1';
        }
      });
    }

    const title = hero.title || hero.name || '';
    const body = hero.summary || hero.body || hero.description || '';
    if(title){
      const el = document.querySelector('.hero-title,.hero h1,[data-cms="hero-title"]');
      if(el) el.textContent = title;
    }
    if(body){
      const el = document.querySelector('.hero-subtitle,.hero p,[data-cms="hero-text"]');
      if(el) el.textContent = body;
    }
  }

  function makeMediaHtml(url, title){
    if(!url) return '';
    if(isVideo(url)) return `<video src="${url}" controls playsinline style="width:100%;height:100%;object-fit:cover;display:block"></video>`;
    return `<img src="${url}" alt="${title || ''}" style="width:100%;height:100%;object-fit:cover;display:block">`;
  }

  function setMedia(card, cfg, item){
    const url = mediaOf(item);
    if(!url) return;
    let box = card.querySelector(cfg.mediaSel);
    if(!box){
      box = document.createElement('div');
      box.className = pageName() === 'leaders' || pageName() === 'teams' ? 'leader-img-placeholder' : 'chm-cms-media-box';
      card.insertBefore(box, card.firstChild);
    }

    if(box.tagName && box.tagName.toLowerCase() === 'img'){
      box.src = url;
      box.alt = item.title || item.name || '';
      box.style.objectFit = 'cover';
      box.style.width = '100%';
      box.style.height = '100%';
      return;
    }

    box.innerHTML = makeMediaHtml(url, item.title || item.name || '');
    box.classList.add('chm-cms-media-filled');
  }

  function fillText(card, selector, value, fallbackClass){
    if(!value) return;
    const el = card.querySelector(selector);
    if(el) el.textContent = value;
    else {
      const n = document.createElement(fallbackClass === 'title' ? 'h3' : 'p');
      n.textContent = value;
      card.appendChild(n);
    }
  }

  function fillCard(card, cfg, item){
    if(!card || !item) return;
    card.classList.add('chm-cms-section-filled');
    setMedia(card, cfg, item);
    fillText(card, cfg.titleSel, item.title || item.name || item.label || 'Untitled', 'title');
    fillText(card, cfg.subSel, item.category || item.role || item.subtitle || item.collection || '', 'sub');
    fillText(card, cfg.bodySel, item.summary || item.body || item.description || item.content || '', 'body');
  }

  function cardHtml(item, cfg){
    const url = mediaOf(item);
    const title = textOf(item.title || item.name || item.label || 'Untitled');
    const sub = textOf(item.category || item.role || item.subtitle || item.collection || '');
    const body = textOf(item.summary || item.body || item.description || item.content || '');
    const media = url ? `<div class="chm-cms-media-box">${makeMediaHtml(url, title)}</div>` : '';
    return `<article class="feature-card chm-cms-section-filled">${media}<span class="tag">${sub}</span><h3>${title}</h3>${body?`<p>${body}</p>`:''}</article>`;
  }

  function findContainer(cfg){
    for(const sel of cfg.containers || []){
      const el = document.querySelector(sel);
      if(el) return el;
    }
    return null;
  }

  function renderSection(items, cfg){
    if(!items.length) return;
    const container = findContainer(cfg);

    if(container){
      const existing = Array.from(container.querySelectorAll(':scope > *')).filter(x => x.nodeType === 1);
      items.forEach((item, idx) => {
        if(existing[idx]) fillCard(existing[idx], cfg, item);
        else container.insertAdjacentHTML('beforeend', cardHtml(item, cfg));
      });
      return;
    }

    // Create page section only if no correct section exists.
    const host = document.createElement('section');
    host.className = 'section chm-cms-generated-section';
    host.innerHTML = `<div class="container"><div class="section-header center"><span class="section-label">Published From Admin</span><h2 class="section-title">Latest Updates</h2><div class="gold-line center"></div></div><div class="grid-4">${items.map(x=>cardHtml(x,cfg)).join('')}</div></div>`;
    const footer = document.querySelector('footer');
    if(footer && footer.parentNode) footer.parentNode.insertBefore(host, footer);
    else document.body.appendChild(host);
  }

  function injectCss(){
    if(document.getElementById('chmSectionPlacementCss')) return;
    const s = document.createElement('style');
    s.id = 'chmSectionPlacementCss';
    s.textContent = `
      .chm-cms-media-box{width:100%;height:230px;border-radius:14px;overflow:hidden;background:#0a1f44;margin-bottom:1rem}
      .leader-img-placeholder.chm-cms-media-filled{aspect-ratio:1;width:100%;height:auto;border-radius:0;overflow:hidden}
      .leader-img-placeholder.chm-cms-media-filled img{width:100%;height:100%;object-fit:cover;display:block}
      .chm-cms-section-filled{overflow:hidden}
      .chm-cms-section-filled .leader-img-placeholder img,
      .chm-cms-section-filled .chm-cms-media-box img,
      .chm-cms-section-filled .chm-cms-media-box video{width:100%;height:100%;object-fit:cover;display:block}
    `;
    document.head.appendChild(s);
  }

  async function boot(){
    injectCss();
    const data = await loadData();
    applyHero(data);

    const pg = pageName();
    if(pg === 'index') return; // homepage keeps its existing sections and hero handling

    const cfg = CONFIG[pg];
    if(!cfg) return;

    const items = getItems(data, cfg.cols);
    renderSection(items, cfg);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
