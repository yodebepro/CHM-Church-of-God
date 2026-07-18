/* CHM ALL-SECTIONS ADMIN ↔ PUBLIC GLOBAL SYNC
   Preserves current filenames and layout. Adds consistent media-field handling,
   named JSON export, one-click global publish, and proper public placement.
*/
(function(){
'use strict';
if(window.CHMAllSectionsSyncLoaded)return;window.CHMAllSectionsSyncLoaded=true;
const DEF={owner:'yodebepro',repo:'CHM-Church-of-God',branch:'main'};
const NAMES={
 announcements:'chm-announcements.json',events:'chm-events.json',sermons:'chm-sermons.json',gallery:'chm-gallery.json',
 departments:'chm-departments.json',leaders:'chm-leaders.json',leadership:'chm-leaders.json',teams:'chm-teams.json',
 ministries:'chm-ministries.json',about:'chm-about.json',page_content:'chm-page-content.json',navigation_items:'chm-navigation.json',
 members:'chm-members.json',prayer_requests:'chm-prayer-requests.json',prayerRequests:'chm-prayer-requests.json',
 messages:'chm-messages.json',giving:'chm-giving-records.json',givingReports:'chm-giving-records.json',locations:'chm-locations.json'
};
const PRIVATE=new Set(['members','prayer_requests','prayerRequests','messages','giving','givingReports']);
function gh(){return{token:localStorage.getItem('chm_gh_token')||'',owner:localStorage.getItem('chm_gh_owner')||DEF.owner,repo:localStorage.getItem('chm_gh_repo')||DEF.repo,branch:localStorage.getItem('chm_gh_branch')||DEF.branch}}
function published(x){return String(x?._status||x?.status||'draft').toLowerCase()==='published'&&x?.archived!==true}
function media(x){return x?.photo||x?.imageUrl||x?.photoUrl||x?.thumbnailUrl||x?.mediaUrl||x?.url||x?.videoUrl||x?.audioUrl||''}
function attachment(x){return x?.attachmentUrl||x?.fileUrl||''}
function normalize(col,x,status){x={...(x||{})};const m=media(x);const now=Date.now();x.id=x.id||Date.now().toString(36)+Math.random().toString(36).slice(2,8);x.collection=col;x._status=status||x._status||x.status||'draft';x.status=x._status;x.archived=x._status==='archived';x._updatedAt=now;x.updatedAt=now;if(x._status==='published'){x._publishedAt=now;x.publishedAt=now}if(m){if(!x.mediaUrl)x.mediaUrl=m;if(!x.imageUrl&&!/\.(mp4|webm|mov|mp3|wav|ogg|m4a)(\?|$)/i.test(m))x.imageUrl=m;if(!x.photoUrl&&!/\.(mp4|webm|mov|mp3|wav|ogg|m4a)(\?|$)/i.test(m))x.photoUrl=m;if(!x.photo&&!/\.(mp4|webm|mov|mp3|wav|ogg|m4a)(\?|$)/i.test(m))x.photo=m;if(!x.url)x.url=m}return x}
function b64utf8(s){return btoa(unescape(encodeURIComponent(s)))}
async function apiGet(path){const g=gh();const r=await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}?ref=${g.branch}`,{headers:{Authorization:`token ${g.token}`,Accept:'application/vnd.github+json'}});return r.ok?await r.json():null}
async function apiPut(path,content,message){const g=gh();if(!g.token)throw new Error('GitHub token is not configured. Open github-setup.html once.');const old=await apiGet(path);const body={message:message||`CHM CMS update ${path}`,content,branch:g.branch};if(old?.sha)body.sha=old.sha;const r=await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}`,{method:'PUT',headers:{Authorization:`token ${g.token}`,'Content-Type':'application/json',Accept:'application/vnd.github+json'},body:JSON.stringify(body)});if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message||`GitHub write failed (${r.status})`)}return await r.json()}
async function loadAll(){if(window.CHMTrueCMS?.loadSiteData)return await window.CHMTrueCMS.loadSiteData();if(window.loadData)return await window.loadData();try{return JSON.parse(localStorage.getItem('chm_sitedata')||'{}')}catch(e){return{}}}
async function saveAll(d){d._updated=new Date().toISOString();localStorage.setItem('chm_sitedata',JSON.stringify(d));localStorage.setItem('chm_sd_bk',JSON.stringify(d));if(window.CHMTrueCMS?.saveLocal)return await window.CHMTrueCMS.saveLocal(d);if(window.saveLocal)return await window.saveLocal(d);window._data=d;return d}
function sectionPayload(col,d){let key=col;if(col==='leadership')key='leaders';if(col==='prayerRequests')key='prayer_requests';if(col==='givingReports')key='giving';const arr=(d[col]||d[key]||[]).map(x=>normalize(key,x,x._status||x.status));const payload={_version:3,_app:'CHM Church of God',_section:key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),_collection:key,_exportedAt:new Date().toISOString(),_note:`Upload as ${NAMES[col]||NAMES[key]||('chm-'+key+'.json')} to GitHub repo root — auto-loaded by the corresponding page`};payload[key]=arr;payload.hero=d.hero||[];if(key==='about')payload.site_config={page_about:d.site_config?.page_about||{}};return payload}
async function publishNamed(col,d){const name=NAMES[col];if(!name)return;const payload=sectionPayload(col,d);await apiPut(name,b64utf8(JSON.stringify(payload,null,2)),`CHM CMS publish ${name}`)}
async function publishAll(col,d){await saveAll(d);await apiPut('site-data.json',b64utf8(JSON.stringify(d,null,2)),'CHM CMS publish site-data.json');await publishNamed(col,d);return true}
window.CHMAllSections={gh,published,media,normalize,loadAll,saveAll,publishAll,publishNamed,privateCollections:PRIVATE};

/* Patch current CMS functions without removing existing behavior. */
function patchAdmin(){
 const oldSave=window.cmsSave;
 if(typeof oldSave==='function'&&!oldSave.__allSections){const fn=async function(col,id,fields,status='draft'){fields=normalize(col,{...(fields||{}),id:id||fields?.id},status);let saved=await oldSave(col,id,fields,status);saved=normalize(col,saved||fields,status);const d=await loadAll();if(!Array.isArray(d[col]))d[col]=[];const i=d[col].findIndex(x=>x.id===saved.id);if(i>=0)d[col][i]=saved;else d[col].unshift(saved);await saveAll(d);return saved};fn.__allSections=true;window.cmsSave=fn}
 const oldPub=window.cmsPublish;
 if(typeof oldPub==='function'&&!oldPub.__allSections){const fn=async function(col,id){let result;try{result=await oldPub(col,id)}catch(e){}const d=await loadAll();if(!Array.isArray(d[col]))d[col]=[];const i=d[col].findIndex(x=>x.id===id);if(i>=0)d[col][i]=normalize(col,d[col][i],'published');await publishAll(col,d);return result||true};fn.__allSections=true;window.cmsPublish=fn}
 if(window.CHMTrueCMS?.saveItem&&!window.CHMTrueCMS.saveItem.__allSections){const old=window.CHMTrueCMS.saveItem;const fn=async function(col,item,status='draft'){let saved=await old(col,normalize(col,item,status),status);saved=normalize(col,saved||item,status);const d=await loadAll();if(!Array.isArray(d[col]))d[col]=[];const i=d[col].findIndex(x=>x.id===saved.id);if(i>=0)d[col][i]=saved;else d[col].unshift(saved);await saveAll(d);return saved};fn.__allSections=true;window.CHMTrueCMS.saveItem=fn}
 if(window.CHMTrueCMS?.publishItem&&!window.CHMTrueCMS.publishItem.__allSections){const old=window.CHMTrueCMS.publishItem;const fn=async function(col,id){try{await old(col,id)}catch(e){}const d=await loadAll();const i=(d[col]||[]).findIndex(x=>x.id===id);if(i>=0)d[col][i]=normalize(col,d[col][i],'published');await publishAll(col,d);return true};fn.__allSections=true;window.CHMTrueCMS.publishItem=fn}
}
setTimeout(patchAdmin,0);setTimeout(patchAdmin,700);setTimeout(patchAdmin,1800);

/* PUBLIC MAPPING */
const PAGES={
 announcements:{cols:['announcements'],files:['chm-announcements.json'],containers:['#announcementsGrid','.announcements-grid','[data-cms-section="announcements"]','.feature-grid','.grid-3','.grid-4']},
 events:{cols:['events'],files:['chm-events.json'],containers:['#eventsGrid','.events-grid','[data-cms-section="events"]','.feature-grid','.grid-3','.grid-4']},
 sermons:{cols:['sermons'],files:['chm-sermons.json'],containers:['#sermonsGrid','.sermons-grid','[data-cms-section="sermons"]','.feature-grid','.grid-3','.grid-4']},
 gallery:{cols:['gallery'],files:['chm-gallery.json'],containers:['#galleryGrid','.gallery-grid','[data-cms-section="gallery"]','.media-grid','.feature-grid','.grid-3','.grid-4']},
 leaders:{cols:['leaders','leadership'],files:['chm-leaders.json'],containers:['#cms-leaders-grid','.leaders-grid','[data-cms-section="leaders"]','.team-grid','.grid-4','.feature-grid']},
 departments:{cols:['departments'],files:['chm-departments.json'],containers:['#departmentsGrid','.departments-grid','[data-cms-section="departments"]','.feature-grid','.grid-3','.grid-4']},
 teams:{cols:['teams'],files:['chm-teams.json'],containers:['#teamsGrid','.teams-grid','[data-cms-section="teams"]','.team-grid','.feature-grid','.grid-3','.grid-4']},
 ministries:{cols:['ministries'],files:['chm-ministries.json'],containers:['#ministriesGrid','.ministries-grid','[data-cms-section="ministries"]','.feature-grid','.grid-3','.grid-4']},
 locations:{cols:['locations'],files:['chm-locations.json'],containers:['#locationsGrid','.locations-grid','[data-cms-section="locations"]','.feature-grid','.grid-3','.grid-4']}
};
function page(){const f=(location.pathname.split('/').pop()||'index.html').replace('.html','').toLowerCase();return f||'index'}
async function fetchJSON(name){try{const r=await fetch(name+'?_='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}}
async function publicData(cfg){let d=await fetchJSON('site-data.json')||{};for(const file of cfg?.files||[]){const j=await fetchJSON(file);if(j){for(const col of cfg.cols||[]){const key=col==='leadership'?'leaders':col;if(Array.isArray(j[key]))d[key]=j[key]}}}return d}
function title(x){return x.title||x.name||([x.first,x.last].filter(Boolean).join(' '))||x.label||'Untitled'}
function subtitle(x){return x.role||x.category||x.dept||x.department||x.type||x.slot||''}
function body(x){return x.bio||x.desc||x.description||x.summary||x.body||x.content||x.message||''}
function mediaHtml(u,t){if(!u)return'';if(/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u))return`<video src="${u}" controls playsinline></video>`;if(/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(u))return`<audio src="${u}" controls></audio>`;return`<img src="${u}" alt="${String(t).replace(/"/g,'&quot;')}">`}
function findContainer(cfg){for(const s of cfg.containers){const e=document.querySelector(s);if(e)return e}return null}
function candidateCards(c){return Array.from(c.children).filter(e=>e.nodeType===1&&!e.matches('script,style'))}
function slotMatch(cards,x){const slot=String(x.slot||x.role||x.category||'').toLowerCase().replace(/[^a-z0-9]/g,'');if(!slot)return null;return cards.find(c=>{const h=(c.id+' '+c.className+' '+c.textContent).toLowerCase().replace(/[^a-z0-9]/g,'');return h.includes(slot)})||null}
function nameMatch(cards,x){const n=String(title(x)||'').toLowerCase().replace(/[^a-z0-9]/g,'');if(!n)return null;return cards.find(c=>{const te=c.querySelector('.min-title,.department-title,.team-name,.card-title,h3,h4');const h=String(te?.textContent||c.textContent||'').toLowerCase().replace(/[^a-z0-9]/g,'');return h===n||h.includes(n)||n.includes(h)})||null}
function fillCard(c,x,isLeader){c.classList.add('chm-sync-filled');const u=media(x),t=title(x),s=subtitle(x),b=body(x);let mediaBox=c.querySelector('.leader-img-placeholder,.leader-photo,.team-photo,.gallery-img,.event-img,.sermon-img,.min-icon,.department-img,.image-placeholder,.placeholder,.card-image,img');if(u){if(!mediaBox){mediaBox=document.createElement('div');mediaBox.className=isLeader?'leader-img-placeholder':'chm-sync-media';c.insertBefore(mediaBox,c.firstChild)}if(mediaBox.tagName?.toLowerCase()==='img'){mediaBox.src=u;mediaBox.alt=t}else{mediaBox.innerHTML=mediaHtml(u,t);mediaBox.classList.add('chm-sync-media-active')}}let te=c.querySelector('.leader-name,.team-name,.event-title,.sermon-title,.gallery-title,.min-title,.department-title,.card-title,h3,h4');if(te)te.textContent=t;else{te=document.createElement('h3');te.textContent=t;c.appendChild(te)}let se=c.querySelector('.leader-title,.team-role,.tag,.badge,.category');if(s){if(se)se.textContent=s;else{se=document.createElement('div');se.className='tag';se.textContent=s;c.appendChild(se)}}let be=c.querySelector('.leader-bio,.team-bio,.event-desc,.sermon-desc,.gallery-desc,.min-desc,.department-desc,.card-text,p');if(b){if(be)be.textContent=b;else{be=document.createElement('p');be.textContent=b;c.appendChild(be)}}const a=attachment(x);if(a){let link=c.querySelector('.chm-ministry-file-link');if(!link){link=document.createElement('a');link.className='chm-ministry-file-link';link.target='_blank';link.rel='noopener';link.textContent='📎 Open Ministry File ↗';c.appendChild(link)}link.href=a}}
function card(x){return`<article class="feature-card chm-sync-filled">${media(x)?`<div class="chm-sync-media">${mediaHtml(media(x),title(x))}</div>`:''}${subtitle(x)?`<span class="tag">${subtitle(x)}</span>`:''}<h3>${title(x)}</h3>${body(x)?`<p>${body(x)}</p>`:''}${attachment(x)?`<a class="chm-ministry-file-link" href="${attachment(x)}" target="_blank" rel="noopener">📎 Open Ministry File ↗</a>`:''}</article>`}
function ministryCardName(card){
  const el=card.querySelector('.min-title,.card-title,h3,h4');
  return String(el?.textContent||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
}
function ministryCategoryGrid(name){
  const wanted=String(name||'').trim().toLowerCase();
  if(!wanted)return null;
  const headings=Array.from(document.querySelectorAll('.section-header,.ministry-category-header,[data-ministry-category]'));
  for(const h of headings){
    const text=String(h.textContent||'').trim().toLowerCase();
    if(text.includes(wanted)){
      let n=h.nextElementSibling;
      while(n){
        if(n.matches?.('.grid-3,.grid-4,.ministries-grid,[data-cms-section="ministries"]'))return n;
        if(n.matches?.('.section-header,.ministry-category-header'))break;
        n=n.nextElementSibling;
      }
    }
  }
  return null;
}
function ensureCustomMinistrySection(category,subtitle){
  const key=String(category||'Additional Ministries').trim();
  let grid=ministryCategoryGrid(key);
  if(grid)return grid;
  const section=document.createElement('div');
  section.className='chm-custom-ministry-category';
  section.setAttribute('data-custom-ministry-category',key);
  section.innerHTML=`<div class="section-header" style="margin-bottom:1.5rem">
    <span class="section-label">${subtitle||'Custom Ministry Section'}</span>
    <h2 class="section-title">${key}</h2>
    <div class="gold-line"></div>
  </div>
  <div class="grid-3 chm-custom-ministry-grid"></div>`;
  const footer=document.querySelector('footer');
  const host=document.querySelector('main .container,.section .container,main')||document.body;
  if(footer&&footer.parentNode)footer.parentNode.insertBefore(section,footer);
  else host.appendChild(section);
  return section.querySelector('.chm-custom-ministry-grid');
}
function recordKey(x){
  return String(x?.id||`${title(x)}|${x?.category||''}`).trim().toLowerCase().replace(/[^a-z0-9|_-]/g,'');
}
function existingRecordCard(cards,x,p){
  const id=recordKey(x);
  let target=cards.find(c=>c.dataset?.chmRecordId===id);
  if(target)return target;
  if(p==='leaders')target=slotMatch(cards,x)||nameMatch(cards,x);
  else target=nameMatch(cards,x);
  return target||null;
}
function markRecord(cardEl,x){
  if(cardEl&&cardEl.dataset)cardEl.dataset.chmRecordId=recordKey(x);
}
async function renderPage(){
  const p=page();const cfg=PAGES[p];if(!cfg)return;
  const d=await publicData(cfg);let list=[];
  for(const col of cfg.cols){
    const key=col==='leadership'?'leaders':col;
    if(Array.isArray(d[key]))list=list.concat(d[key].filter(published));
  }
  const seen=new Set();
  list=list.filter(x=>{
    const k=recordKey(x);
    if(seen.has(k))return false;
    seen.add(k);return true;
  }).sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999));
  if(!list.length)return;

  if(p==='ministries'){
    const allCards=Array.from(document.querySelectorAll('.ministry-card,.feature-card[data-category]'));
    list.forEach(x=>{
      const target=existingRecordCard(allCards,x,p);
      if(target){
        fillCard(target,x,false);markRecord(target,x);return;
      }
      const category=x.category||'Additional Ministries';
      const grid=ensureCustomMinistrySection(category,x.sectionSubtitle||x.categorySubtitle||'Custom Ministry Section');
      if(grid&&!grid.querySelector(`[data-chm-record-id="${recordKey(x)}"]`)){
        grid.insertAdjacentHTML('beforeend',card(x));
        const added=grid.lastElementChild;markRecord(added,x);
      }
    });
    return;
  }

  const c=findContainer(cfg);if(!c)return;
  const cards=candidateCards(c);
  list.forEach(x=>{
    const target=existingRecordCard(cards,x,p);
    if(target){fillCard(target,x,p==='leaders');markRecord(target,x);return;}
    if(!c.querySelector(`[data-chm-record-id="${recordKey(x)}"]`)){
      c.insertAdjacentHTML('beforeend',card(x));
      const added=c.lastElementChild;markRecord(added,x);
    }
  });
}
async function applyAboutAndSettings(){const d=await fetchJSON('site-data.json')||{};const p=page();if(p==='about'){const a=d.site_config?.page_about||{};const map={heroTitle:'.page-hero h1,.hero h1',heroEye:'.page-hero p,.hero p',storyTitle:'[data-cms="story-title"],.story-title',storyP1:'[data-cms="story-p1"]',storyP2:'[data-cms="story-p2"]',mission:'[data-cms="mission"]',vision:'[data-cms="vision"]'};for(const[k,s]of Object.entries(map)){const e=document.querySelector(s);if(e&&a[k])e.textContent=a[k]}}
 const colors=d.site_config?.colors||{};const root=document.documentElement;for(const[k,v]of Object.entries(colors)){if(v)root.style.setProperty('--'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v)}
 const nav=d.navigation_items||[];if(nav.some(published)){const host=document.querySelector('nav ul,.nav-links,.main-nav');if(host){host.innerHTML=nav.filter(published).sort((a,b)=>(a.order||0)-(b.order||0)).map(n=>`<a href="${n.url||n.href||'#'}">${n.label||n.title||n.name||'Link'}</a>`).join('')}}
}
function css(){if(document.getElementById('chmAllSyncCss'))return;const s=document.createElement('style');s.id='chmAllSyncCss';s.textContent='.chm-sync-media{width:100%;height:230px;overflow:hidden;background:#102857;margin-bottom:1rem}.chm-sync-media img,.chm-sync-media video,.chm-sync-media-active img,.chm-sync-media-active video,.leader-img-placeholder img{width:100%;height:100%;object-fit:cover;display:block}.chm-sync-filled{overflow:hidden}.leader-img-placeholder.chm-sync-media-active{aspect-ratio:1;width:100%;height:auto;overflow:hidden}.min-icon.chm-sync-media-active{width:100%;height:190px;overflow:hidden;border-radius:12px;margin-bottom:1rem;font-size:0}.min-icon.chm-sync-media-active img,.min-icon.chm-sync-media-active video{width:100%;height:100%;object-fit:cover}.chm-ministry-file-link{display:inline-flex;margin-top:.75rem;padding:.55rem .8rem;border-radius:999px;background:rgba(200,145,58,.12);color:var(--navy);font-size:.76rem;font-weight:800;text-decoration:none}.chm-ministry-file-link:hover{background:var(--gold);color:var(--navy)}';document.head.appendChild(s)}
document.addEventListener('DOMContentLoaded',()=>{css();renderPage();applyAboutAndSettings()});
})();
(function(){document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent="\n/* Ministry card photo replacement and duplicate prevention */\n.ministry-card .min-icon.chm-sync-media-active{\n  width:100%!important;\n  height:220px!important;\n  min-height:220px!important;\n  border-radius:12px!important;\n  overflow:hidden!important;\n  display:block!important;\n  margin:0 0 1rem!important;\n  padding:0!important;\n  background:#102857!important;\n}\n.ministry-card .min-icon.chm-sync-media-active img,\n.ministry-card .min-icon.chm-sync-media-active video{\n  width:100%!important;\n  height:100%!important;\n  object-fit:cover!important;\n  display:block!important;\n}\n#cms-ministries-grid:empty{display:none!important}\n.chm-custom-ministry-category{margin:3rem auto;max-width:1200px;padding:0 1rem}\n";document.head.appendChild(s);});})();
