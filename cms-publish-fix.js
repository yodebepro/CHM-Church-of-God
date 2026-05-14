
/* CHM PUBLIC PUBLISH VISIBILITY FIX v2
   Places published admin content inside existing public page sections/cards
   instead of adding a new block at the bottom of the page.
*/
(function(){
  const PAGE_MAP = {
    "index": ["announcements","events","sermons","gallery","leaders","leadership","ministries","teams","departments","sacred_ministries","locations","blueprint_sections"],
    "announcements": ["announcements"],
    "events": ["events"],
    "sermons": ["sermons"],
    "gallery": ["gallery","media_library"],
    "leaders": ["leaders","leadership"],
    "ministries": ["ministries","sacred_ministries"],
    "teams": ["teams"],
    "departments": ["departments"],
    "locations": ["locations"],
    "about": ["page_about","leaders","leadership"],
    "give": ["page_give"],
    "watch-live": ["media_settings","media_library"],
    "listen-live": ["media_settings","sermons"]
  };

  function pageName(){
    const f=(location.pathname.split('/').pop()||'index.html').replace('.html','');
    return f==='' ? 'index' : f;
  }

  function isPublished(x){
    const s=(x._status || x.status || 'draft').toLowerCase();
    return s === 'published' && x.archived !== true;
  }

  function safe(v){ return v==null ? '' : String(v); }
  function mediaOf(item){ return item.mediaUrl || item.imageUrl || item.photoUrl || item.thumbnailUrl || ""; }

  function normalize(item,col){
    const media = mediaOf(item);
    return {
      ...item,
      collection: col || item.collection || '',
      mediaUrl: media,
      imageUrl: item.imageUrl || media,
      title: item.title || item.name || item.label || 'Untitled',
      summary: item.summary || item.subtitle || item.description || '',
      body: item.body || item.content || item.message || ''
    };
  }

  async function getFirebaseItems(cols){
    const out=[];
    try{
      if(typeof firebaseConfig==="undefined" || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("PASTE_YOUR")) return out;
      if(typeof firebase==="undefined" || !firebase.firestore) return out;
      if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const db=firebase.firestore();
      for(const col of cols){
        try{
          const snap=await db.collection(col).get();
          snap.forEach(d=>{
            const item=normalize({id:d.id,...d.data()},col);
            if(isPublished(item)) out.push(item);
          });
        }catch(e){}
      }
    }catch(e){}
    return out;
  }

  function getLocalItems(cols){
    const out=[];
    try{
      const feed=JSON.parse(localStorage.getItem("chm_public_feed")||"{}");
      cols.forEach(col=>(feed[col]||[]).forEach(x=>{ 
        const item=normalize(x,col);
        if(isPublished(item)) out.push(item); 
      }));
    }catch(e){}
    cols.forEach(col=>{
      try{
        const arr=JSON.parse(localStorage.getItem("chm_"+col)||"[]");
        arr.forEach(x=>{ 
          const item=normalize(x,col);
          if(isPublished(item)) out.push(item); 
        });
      }catch(e){}
    });
    return out;
  }

  function unique(items){
    const seen=new Set();
    return items.filter(x=>{
      const k=(x.collection||"")+"-"+(x.id||x.title||JSON.stringify(x).slice(0,30));
      if(seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function fillCard(card,item){
    if(!card || !item) return;
    const title = safe(item.title);
    const summary = safe(item.summary);
    const body = safe(item.body);
    const media = mediaOf(item);
    const cat = safe(item.category || item.parentMenu || item.collection || 'Published');

    card.classList.add('chm-cms-filled');
    card.setAttribute('data-cms-filled','true');

    let mediaBox = card.querySelector('img, video, .gallery-img, .gallery-image, .media-img, .media-thumb, .image-placeholder, .placeholder, .photo-placeholder, .sermon-img, .leader-photo, .card-image, .feature-icon, .gallery-icon, .media-icon, .icon');
    if(media){
      if(mediaBox && mediaBox.tagName && mediaBox.tagName.toLowerCase()==='img'){
        mediaBox.src = media;
        mediaBox.alt = title;
        mediaBox.style.objectFit = 'cover';
      } else if(mediaBox){
        mediaBox.innerHTML = `<img src="${media}" alt="${title}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block">`;
      } else {
        card.insertAdjacentHTML('afterbegin', `<div class="chm-cms-media"><img src="${media}" alt="${title}"></div>`);
      }
    }

    const titleEl = card.querySelector('h1,h2,h3,h4,.title,.card-title,.gallery-title,.sermon-title,.leader-name');
    if(titleEl) titleEl.textContent = title;
    else if(title) card.insertAdjacentHTML('beforeend', `<h3>${title}</h3>`);

    const tagEl = card.querySelector('.tag,.badge,.category,.gallery-category');
    if(tagEl) tagEl.textContent = cat;

    const textEl = card.querySelector('p,.summary,.description,.card-text,.gallery-desc,.sermon-desc,.leader-bio');
    if(textEl) textEl.textContent = summary || body;
    else if(summary || body) card.insertAdjacentHTML('beforeend', `<p>${summary || body}</p>`);

    if(item.textColor) card.style.setProperty('color', item.textColor, 'important');
    if(item.backgroundColor) card.style.setProperty('background', item.backgroundColor, 'important');
  }

  function cardHtml(item){
    const media = mediaOf(item);
    const title = safe(item.title);
    const summary = safe(item.summary);
    const body = safe(item.body);
    const cat = safe(item.category || item.parentMenu || item.collection || 'Published');
    return `<article class="feature-card chm-cms-filled" data-cms-filled="true" style="${item.textColor?`color:${item.textColor}!important;`:''}${item.backgroundColor?`background:${item.backgroundColor}!important;`:''}">
      ${media ? `<div class="chm-cms-media"><img src="${media}" alt="${title}"></div>` : ""}
      <span class="tag">${cat}</span>
      <h3>${title}</h3>
      ${summary ? `<p>${summary}</p>` : ""}
      ${body ? `<p>${body}</p>` : ""}
    </article>`;
  }

  function findBestContainer(){
    const p=pageName();
    const selectorsByPage = {
      gallery: ['.gallery-grid','.masonry-grid','.media-grid','.feature-grid','.grid-3','.cards-grid'],
      leaders: ['.leaders-grid','.team-grid','.feature-grid','.grid-3','.cards-grid'],
      ministries: ['.ministries-grid','.feature-grid','.grid-3','.cards-grid'],
      announcements: ['.announcements-grid','.feature-grid','.grid-3','.cards-grid'],
      events: ['.events-grid','.feature-grid','.grid-3','.cards-grid'],
      sermons: ['.sermons-grid','.feature-grid','.grid-3','.cards-grid'],
      teams: ['.teams-grid','.feature-grid','.grid-3','.cards-grid'],
      departments: ['.departments-grid','.feature-grid','.grid-3','.cards-grid'],
      locations: ['.locations-grid','.feature-grid','.grid-3','.cards-grid']
    };
    const selectors = selectorsByPage[p] || ['.feature-grid','.grid-3','.cards-grid','.gallery-grid','.media-grid'];
    for(const sel of selectors){
      const el=document.querySelector(sel);
      if(el) return el;
    }
    return null;
  }

  function existingCards(container){
    if(!container) return [];
    return Array.from(container.children).filter(el=>{
      const tag=el.tagName ? el.tagName.toLowerCase() : '';
      return tag==='article' || tag==='div' || el.className;
    });
  }

  function renderIntoExistingSection(items){
    if(!items.length) return;
    const container = findBestContainer();
    if(container){
      const cards = existingCards(container);
      items.forEach((item,i)=>{
        if(cards[i]) fillCard(cards[i], item);
        else container.insertAdjacentHTML('beforeend', cardHtml(item));
      });
      document.querySelectorAll('.chm-published-section').forEach(el=>el.remove());
      return;
    }

    let host=document.querySelector("[data-cms-live]");
    if(!host){
      host=document.createElement("section");
      host.className="section chm-published-section";
      host.setAttribute("data-cms-live","true");
      const footer=document.querySelector("footer");
      if(footer && footer.parentNode) footer.parentNode.insertBefore(host, footer);
      else document.body.appendChild(host);
    }
    const label = pageName()==="index" ? "Latest Published Updates" : "Published Content";
    host.innerHTML=`<div class="container"><div class="section-header text-center">
      <span class="section-label">Live From Admin Panel</span><h2>${label}</h2><div class="gold-line centered"></div>
      </div><div class="feature-grid">${items.map(cardHtml).join("")}</div></div>`;
  }

  async function boot(){
    const cols=PAGE_MAP[pageName()] || [];
    if(!cols.length) return;
    const remote=await getFirebaseItems(cols);
    const local=getLocalItems(cols);
    const items=unique([...remote,...local]).sort((a,b)=>(b._updatedAt||b.updatedAt||0)-(a._updatedAt||a.updatedAt||0));
    renderIntoExistingSection(items);
  }

  document.addEventListener("DOMContentLoaded",boot);
})();
