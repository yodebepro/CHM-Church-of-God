
/* CHM CHURCH OF GOD — Blueprint Public Live Loader v5 */
(function(){
  const collections = {
    ministries:'ministries',
    teams:'teams',
    departments:'departments',
    leaders:'leaders',
    leadership:'leaders',
    announcements:'announcements',
    events:'events',
    sermons:'sermons',
    gallery:'gallery',
    locations:'locations',
    give:'page_give',
    about:'page_about',
    home:'page_home',
    'watch-live':'media_settings',
    'listen-live':'media_settings'
  };
  function pageKey(){
    const f = (location.pathname.split('/').pop()||'index.html').replace('.html','');
    return f==='index' || f==='' ? 'home' : f;
  }
  function fbConfigured(){
    return typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PASTE_YOUR');
  }
  async function init(){
    if(!fbConfigured() || typeof firebase === 'undefined' || !firebase.firestore) return;
    try{
      if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const db = firebase.firestore();
      await applyConfig(db);
      await injectPublished(db);
    }catch(e){ console.warn('[CHM live CMS] Firebase unavailable:', e.message); }
  }
  async function applyConfig(db){
    try{
      const confs = await db.collection('site_config').get();
      let colors = {};
      confs.forEach(d=>{ if(d.id==='colors') colors=d.data(); });
      const r=document.documentElement;
      if(colors.primaryColor) r.style.setProperty('--navy',colors.primaryColor);
      if(colors.secondaryColor) r.style.setProperty('--navy-mid',colors.secondaryColor);
      if(colors.accentColor) r.style.setProperty('--gold',colors.accentColor);
      if(colors.textColor) r.style.setProperty('--text',colors.textColor);
      if(colors.backgroundColor) document.body.style.background = colors.backgroundColor;
      if(colors.footerTextColor){
        const style=document.createElement('style');
        style.textContent=`footer *, .footer *{color:${colors.footerTextColor}!important}`;
        document.head.appendChild(style);
      }
      if(colors.footerBgColor){
        const style=document.createElement('style');
        style.textContent=`footer, .footer{background:${colors.footerBgColor}!important}`;
        document.head.appendChild(style);
      }
    }catch(e){}
  }
  function card(item){
    const img = item.mediaUrl ? `<div style="margin-top:1rem"><img src="${item.mediaUrl}" alt="${item.title||''}" style="width:100%;border-radius:14px;max-height:260px;object-fit:cover"></div>` : '';
    const style = `${item.textColor?`color:${item.textColor};`:''}${item.backgroundColor?`background:${item.backgroundColor};`:''}`;
    return `<article class="feature-card cms-card" style="${style}">
      <span class="tag">${item.category||item.parentMenu||item.streamType||'Published'}</span>
      <h3>${item.title||item.label||'Untitled'}</h3>
      <p>${item.summary||''}</p>
      ${item.body?`<p>${item.body}</p>`:''}
      ${img}
      ${item.buttonUrl?`<a class="btn btn-primary" href="${item.buttonUrl}">${item.buttonText||'Learn More'}</a>`:''}
    </article>`;
  }
  async function getPublished(db,col){
    const s=await db.collection(col).get();
    return s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x._status||x.status)==='published' && x._status!=='archived');
  }
  async function injectPublished(db){
    const key=pageKey();
    const col=collections[key];
    if(!col) return;
    const items=await getPublished(db,col);
    if(!items.length) return;
    const host = document.querySelector('[data-cms-live]') || document.querySelector('main') || document.body;
    const section=document.createElement('section');
    section.className='section cms-live-section';
    section.innerHTML = `<div class="container"><div class="section-header text-center"><span class="section-label">Live CMS Updates</span><h2>Published ${key.replace('-', ' ')}</h2><div class="gold-line centered"></div></div><div class="feature-grid">${items.map(card).join('')}</div></div>`;
    host.appendChild(section);
  }
  document.addEventListener('DOMContentLoaded',init);
})();
