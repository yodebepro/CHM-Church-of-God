
/* CHM PUBLIC PUBLISH VISIBILITY FIX */
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
  function card(item){
    const media = item.mediaUrl || item.imageUrl || item.photoUrl || item.thumbnailUrl || "";
    const title = safe(item.title || item.name || item.label || "Untitled");
    const summary = safe(item.summary || item.subtitle || item.description || "");
    const body = safe(item.body || item.content || item.message || "");
    const cat = safe(item.category || item.parentMenu || item.collection || "Published");
    const style = `${item.textColor ? `color:${item.textColor}!important;` : ""}${item.backgroundColor ? `background:${item.backgroundColor}!important;` : ""}`;
    return `<article class="feature-card chm-live-card" style="${style}">
      <span class="tag">${cat}</span>
      <h3>${title}</h3>
      ${summary ? `<p>${summary}</p>` : ""}
      ${body ? `<p>${body}</p>` : ""}
      ${media ? `<div style="margin-top:1rem"><img src="${media}" alt="${title}" style="width:100%;max-height:330px;object-fit:cover;border-radius:14px;box-shadow:0 8px 26px rgba(10,31,68,.15)"></div>` : ""}
    </article>`;
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
          snap.forEach(d=>{ const item={id:d.id,collection:col,...d.data()}; if(isPublished(item)) out.push(item); });
        }catch(e){}
      }
    }catch(e){}
    return out;
  }
  function getLocalItems(cols){
    const out=[];
    try{
      const feed=JSON.parse(localStorage.getItem("chm_public_feed")||"{}");
      cols.forEach(col=>(feed[col]||[]).forEach(x=>{ if(isPublished(x)) out.push({...x,collection:col}); }));
    }catch(e){}
    cols.forEach(col=>{
      try{
        const arr=JSON.parse(localStorage.getItem("chm_"+col)||"[]");
        arr.forEach(x=>{ if(isPublished(x)) out.push({...x,collection:col}); });
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
  function render(items){
    if(!items.length) return;
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
      </div><div class="feature-grid">${items.map(card).join("")}</div></div>`;
  }
  async function boot(){
    const cols=PAGE_MAP[pageName()] || [];
    if(!cols.length) return;
    const remote=await getFirebaseItems(cols);
    const local=getLocalItems(cols);
    const items=unique([...remote,...local]).sort((a,b)=>(b._updatedAt||b.updatedAt||0)-(a._updatedAt||a.updatedAt||0));
    render(items);
  }
  document.addEventListener("DOMContentLoaded",boot);
})();
