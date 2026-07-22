/* CHM targeted repair: sermon media, event/announcement tabs, exact leadership mirrors */
(function(){
'use strict';
const PAGE=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const pub=x=>String(x?._status||x?.status||'draft').toLowerCase()==='published'&&x?.archived!==true;
const media=x=>x?.photo||x?.imageUrl||x?.photoUrl||x?.thumbnailUrl||x?.mediaUrl||x?.videoUrl||x?.video||x?.audioUrl||x?.audio||x?.url||'';
async function get(name){try{const r=await fetch(name+'?_='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}}
function arr(obj,key){return Array.isArray(obj?.[key])?obj[key]:[]}
function byLatest(items){const m=new Map();items.forEach(x=>{const k=x.id||norm((x.slot||x.role||x.title||x.name||'')+'|'+(x.date||''));const old=m.get(k);const nt=Number(x._updatedAt||x.updatedAt||x._publishedAt||0);const ot=Number(old?._updatedAt||old?.updatedAt||old?._publishedAt||0);if(!old||nt>=ot)m.set(k,x)});return [...m.values()]}

async function loadCollection(key,file){
  const [named,site]=await Promise.all([get(file),get('site-data.json')]);
  // Named section is the source of truth after GitHub upload; site-data is fallback.
  return byLatest([...arr(site,key),...arr(named,key)]);
}

function ytEmbed(url){
  const s=String(url||'');
  const m=s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i);
  return m?'https://www.youtube-nocookie.com/embed/'+m[1]+'?rel=0':'';
}
function videoMarkup(url){
  if(!url)return'';
  const yt=ytEmbed(url);if(yt)return `<iframe src="${esc(yt)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
  if(/vimeo\.com/i.test(url)){const m=String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/i);if(m)return `<iframe src="https://player.vimeo.com/video/${m[1]}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`}
  return `<video controls playsinline preload="metadata"><source src="${esc(url)}"></video>`;
}
function sermonCard(s){
  const v=s.video||s.videoUrl||'';const a=s.audio||s.audioUrl||'';const ph=s.thumbnailUrl||s.imageUrl||s.photo||'';
  return `<article class="sermon-card reveal" data-category="${esc((s.series||'sermon').toLowerCase())}">
    <div class="sermon-thumb">${ph?`<img src="${esc(ph)}" alt="${esc(s.title||'Sermon')}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:''}<div class="sermon-thumb-icon">${esc(s.icon||'🎙')}</div>${v?'<span class="sermon-type-badge badge-video">▶ Video</span>':(a?'<span class="sermon-type-badge badge-audio">🎵 Audio</span>':'')}</div>
    <div class="sermon-body"><div class="sermon-series">${esc(s.series||'')}</div><h3 class="sermon-title">${esc(s.title||'')}</h3><p class="sermon-excerpt">${esc(s.desc||s.description||'')}</p><div class="sermon-meta">${s.speaker?'👤 '+esc(s.speaker)+' · ':''}${s.date?'📅 '+esc(s.date)+' · ':''}${s.scripture?'📖 '+esc(s.scripture):''}</div><div class="sermon-actions">${v?`<button class="btn btn-gold btn-tiny" data-play-video="${esc(v)}">▶ Watch</button>`:''}${a?`<audio controls preload="none" src="${esc(a)}"></audio>`:''}</div></div>
  </article>`;
}
async function renderSermons(){
  let items=(await loadCollection('sermons','chm-sermons.json')).filter(pub).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  if(!items.length)return;
  const grid=document.getElementById('sermonGrid');if(!grid)return;
  Array.from(grid.children).forEach(c=>{if(c.id!=='cms-sermons-injected')c.style.display='none'});
  let host=document.getElementById('cms-sermons-injected');if(!host){host=document.createElement('div');host.id='cms-sermons-injected';grid.prepend(host)}
  host.style.display='contents';host.innerHTML=items.map(sermonCard).join('');
  const featured=document.querySelector('.featured-sermon');const f=items[0];if(featured&&f){
    const v=f.video||f.videoUrl||'',a=f.audio||f.audioUrl||'';
    featured.innerHTML=`<div class="featured-thumb">${f.thumbnailUrl||f.imageUrl?`<img src="${esc(f.thumbnailUrl||f.imageUrl)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:''}<span style="position:relative;z-index:1;font-size:4rem">${esc(f.icon||'🎙')}</span></div><div class="featured-body"><div class="featured-label">Latest Sermon</div><div class="featured-title">${esc(f.title||'')}</div><div class="featured-excerpt">${esc(f.desc||f.description||'')}</div><div class="featured-info">${f.speaker?'<span>👤 '+esc(f.speaker)+'</span>':''}${f.date?'<span>📅 '+esc(f.date)+'</span>':''}${f.scripture?'<span>📖 '+esc(f.scripture)+'</span>':''}</div><div style="display:flex;gap:.75rem;flex-wrap:wrap">${v?`<button class="btn btn-gold" data-play-video="${esc(v)}">▶ Watch</button>`:''}${a?`<audio controls preload="none" src="${esc(a)}"></audio>`:''}</div></div>`;
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-play-video]');if(!b)return;const url=b.getAttribute('data-play-video');let modal=document.getElementById('chmSermonPlayer');if(!modal){modal=document.createElement('div');modal.id='chmSermonPlayer';modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px';modal.innerHTML='<button aria-label="Close" style="position:absolute;top:18px;right:24px;font-size:32px;background:none;border:0;color:white;cursor:pointer">×</button><div style="width:min(1000px,94vw);aspect-ratio:16/9;background:#000"></div>';modal.querySelector('button').onclick=()=>{modal.remove()};document.body.appendChild(modal)}const box=modal.lastElementChild;box.innerHTML=videoMarkup(url);box.querySelectorAll('iframe,video').forEach(x=>x.style.cssText='width:100%;height:100%;border:0;background:#000');},true);
}
function eventCard(e){const d=String(e.date||'').split('-');const mon=['','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][Number(d[1])]||'';return `<article class="event-card reveal"><div class="event-date-col"><div class="event-month">${esc(mon)}</div><div class="event-day">${esc(d[2]||'--')}</div><div class="event-year">${esc(d[0]||'')}</div></div><div class="event-body"><div class="event-cat">${esc(e.category||'Event')}</div><h3 class="event-title">${esc(e.name||e.title||'')}</h3><div class="event-meta">${e.location?'<span>📍 '+esc(e.location)+'</span>':''}${e.time?'<span>⏰ '+esc(e.time)+'</span>':''}</div>${e.desc?'<p style="font-size:.84rem;color:var(--text-muted);margin-top:.6rem">'+esc(e.desc)+'</p>':''}</div></article>`}
async function renderEvents(){
  const items=(await loadCollection('events','chm-events.json')).filter(pub);
  if(!items.length)return;
  for(const type of ['upcoming','recurring','past']){
    const pane=document.getElementById(type);if(!pane)continue;const subset=items.filter(x=>(x.type||'upcoming')===type);
    if(!subset.length)continue;
    pane.innerHTML=`<div class="chm-live-events" style="display:flex;flex-direction:column;gap:1.1rem">${subset.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).map(eventCard).join('')}</div>`;
  }
}
function annCard(a,pin){return `<article class="ann-card ${pin?'pinned':''}">${pin?'<div class="ann-pin">📌</div>':''}<div class="ann-cat">${esc(a.category||'Announcement')}</div><h3 class="ann-title">${esc(a.title||'')}</h3><p class="ann-body">${esc(a.body||a.summary||'')}</p>${a.date?'<div class="ann-date">Posted: '+esc(a.date)+'</div>':''}</article>`}
async function renderAnnouncements(){
  const all=await loadCollection('announcements','chm-announcements.json');if(!all.length)return;
  const current=all.filter(x=>pub(x)&&!x.pinned&&String(x._status||x.status)!=='pinned');
  const pinned=all.filter(x=>pub(x)&&(x.pinned||String(x._status||x.status)==='pinned'));
  const archived=all.filter(x=>String(x._status||x.status)==='archived'||x.archived===true);
  const map=[['active-ann',current],['pinned-ann',pinned],['archived-ann',archived]];
  map.forEach(([id,list])=>{const pane=document.getElementById(id);if(!pane||!list.length)return;pane.innerHTML=`<div class="grid-2 chm-live-announcements">${list.map(x=>annCard(x,id==='pinned-ann')).join('')}</div>`});
}
const SLOT_ALIAS={seniorpastor:'senior-pastor',leadpastor:'senior-pastor',firstlady:'first-lady',associatepastor:'associate-pastor',executivepastor:'executive-pastor',worshipdirector:'worship-director',worshippastor:'worship-director',outreachdirector:'outreach-director',youthpastor:'youth-pastor'};
function slot(x){const raw=String(x.slot||'').toLowerCase().replace(/_/g,'-');if(raw)return raw;for(const v of [x.role,x.title,x.position,x.department]){const k=norm(v);if(SLOT_ALIAS[k])return SLOT_ALIAS[k]}return''}
function fillLeader(card,x){if(!card||!x)return;const u=media(x);if(!u)return;let box=card.querySelector('.leader-img-placeholder,.leader-photo');if(!box){box=document.createElement('div');box.className='leader-img-placeholder';card.prepend(box)}box.innerHTML=/\.(mp4|webm|mov)(\?|$)/i.test(u)?`<video muted loop autoplay playsinline src="${esc(u)}"></video>`:`<img src="${esc(u)}" alt="${esc([x.first,x.last].filter(Boolean).join(' ')||x.role||'Leader')}">`;box.classList.add('chm-exact-mirror')}
async function renderLeadership(){
  const named=await get('chm-leaders.json')||{};const site=await get('site-data.json')||{};
  // Exact named section wins; site data only fills a missing slot.
  const records=[...arr(named,'leaders'),...arr(named,'leadership'),...arr(site,'leaders'),...arr(site,'leadership')].filter(pub);
  const best=new Map();records.forEach(x=>{const s=slot(x);if(!s||best.has(s))return;best.set(s,x)});
  if(PAGE==='index.html'||PAGE===''){
    for(const s of ['senior-pastor','executive-pastor','worship-director','outreach-director'])fillLeader(document.querySelector(`[data-home-leader-slot="${s}"]`),best.get(s));
  }
  if(PAGE==='about.html'){
    const ids={'senior-pastor':'about-slot-senior-pastor','first-lady':'about-slot-first-lady','associate-pastor':'about-slot-associate-pastor','youth-pastor':'about-slot-youth-pastor'};
    Object.entries(ids).forEach(([s,id])=>fillLeader(document.getElementById(id),best.get(s)));
  }
}
function css(){const s=document.createElement('style');s.textContent='.chm-exact-mirror{padding:0!important;overflow:hidden!important}.chm-exact-mirror img,.chm-exact-mirror video{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important}.sermon-actions audio{width:100%;max-width:260px}.sermon-thumb iframe,.sermon-thumb video{width:100%;height:100%}#chmSermonPlayer iframe,#chmSermonPlayer video{width:100%;height:100%}';document.head.appendChild(s)}
async function run(){css();if(PAGE==='sermons.html')await renderSermons();if(PAGE==='events.html')await renderEvents();if(PAGE==='announcements.html')await renderAnnouncements();if(PAGE==='index.html'||PAGE===''||PAGE==='about.html')await renderLeadership()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,700));else setTimeout(run,700);
})();