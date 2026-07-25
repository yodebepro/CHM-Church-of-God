/* CHM Sermon JSON Restore — authoritative final renderer
   Loads chm-sermons.json uploaded to GitHub and restores the public Sermon Library.
   This script runs last and does not change Watch Live or Listen Live. */
(function(){
'use strict';

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function norm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function pub(x){const s=String(x?._status||x?.status||'published').toLowerCase();return s==='published'&&!x?.archived}
async function get(name){try{const r=await fetch(name+'?_='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}return null}
function arr(j){if(!j)return[];if(Array.isArray(j))return j;return Array.isArray(j.sermons)?j.sermons:[]}
function media(x){
  return {
    video:x.video||x.videoUrl||x.watchUrl||'',
    audio:x.audio||x.audioUrl||'',
    any:x.mediaUrl||x.url||''
  };
}
function yt(url){const m=String(url||'').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{6,})/i);return m?m[1]:''}
function vm(url){const m=String(url||'').match(/vimeo\.com\/(?:video\/)?(\d+)/i);return m?m[1]:''}
function drive(url){const m=String(url||'').match(/(?:file\/d\/|videos\/d\/|[?&]id=)([\w-]{10,})/i);return m?m[1]:''}
function kindOf(x){
  const m=media(x),u=m.video||m.audio||m.any;
  if(m.audio||/\.(mp3|wav|ogg|m4a|aac)(?:[?#].*)?$/i.test(u))return'audio';
  return'video';
}
function playableUrl(x){
  const m=media(x);
  return kindOf(x)==='audio'?(m.audio||m.any):(m.video||m.any);
}
function playerMarkup(url,kind){
  if(!url)return'';
  const y=yt(url);if(y)return `<iframe src="https://www.youtube-nocookie.com/embed/${y}?rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  const v=vm(url);if(v)return `<iframe src="https://player.vimeo.com/video/${v}" allow="autoplay; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  const d=drive(url);
  if(d){
    if(kind==='audio')return `<audio controls preload="metadata" src="https://drive.google.com/uc?export=download&id=${d}"></audio>`;
    return `<iframe src="https://drive.google.com/file/d/${d}/preview" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  }
  if(kind==='audio')return `<audio controls preload="metadata" src="${esc(url)}"></audio>`;
  return `<video controls playsinline preload="metadata" src="${esc(url)}"></video>`;
}
function card(x){
  const kind=kindOf(x),u=playableUrl(x),cat=x.category||x.series||'Preaching';
  return `<article class="sermon-card chm-json-sermon" data-category="${esc(norm(cat))}" data-series="${esc(norm(x.series||cat))}" data-format="${kind}">
    <div class="sermon-thumbnail chm-json-player">${u?playerMarkup(u,kind):`<div class="sermon-icon">${esc(x.icon||'🎙')}</div>`}</div>
    <div class="sermon-content">
      <span class="sermon-category">${esc(cat)}</span>
      <h3>${esc(x.title||'Sermon')}</h3>
      <p>${esc(x.desc||x.description||x.summary||'')}</p>
      <div class="sermon-meta">${esc([x.speaker,x.date,x.duration,x.scripture].filter(Boolean).join(' · '))}</div>
    </div>
  </article>`;
}
function featured(x){
  const kind=kindOf(x),u=playableUrl(x);
  return `<div class="featured-thumb chm-json-featured-player">${u?playerMarkup(u,kind):`<span style="font-size:4rem">${esc(x.icon||'🎙')}</span>`}</div>
  <div class="featured-body">
    <div class="featured-label">Latest · ${kind==='audio'?'Audio':'Video'} Sermon</div>
    <div class="featured-title">${esc(x.title||'Sermon')}</div>
    <div class="featured-excerpt">${esc(x.desc||x.description||x.summary||'')}</div>
    <div class="featured-info">${[x.speaker,x.date,x.duration,x.scripture].filter(Boolean).map(v=>`<span>${esc(v)}</span>`).join('')}</div>
  </div>`;
}
async function loadAll(){
  const [named,site]=await Promise.all([get('chm-sermons.json'),get('site-data.json')]);
  let local=null;try{local=JSON.parse(localStorage.getItem('chm_sitedata')||'null')}catch(e){}
  const sources=[arr(site),arr(named),arr(local)];
  const map=new Map();
  sources.flat().forEach(x=>{
    if(!x)return;
    const k=x.id||`${x.title||''}|${x.date||''}`;
    const old=map.get(k);
    if(!old||Number(x._updatedAt||0)>=Number(old._updatedAt||0))map.set(k,x);
  });
  return [...map.values()].filter(pub).sort((a,b)=>String(b.date||b._updatedAt||'').localeCompare(String(a.date||a._updatedAt||'')));
}
function wireFilters(grid){
  const search=document.querySelector('.search-bar');
  const sels=[...document.querySelectorAll('.filter-select')],cat=sels[0],fmt=sels[1];
  let series='all';
  function apply(){
    const q=norm(search?.value),c=norm(cat?.value||'all'),f=norm(fmt?.value||'all');
    grid.querySelectorAll('.sermon-card').forEach(card=>{
      const text=norm(card.textContent),cc=norm(card.dataset.category),ss=norm(card.dataset.series),ff=norm(card.dataset.format);
      const okQ=!q||text.includes(q),okC=!c||c==='all'||cc.includes(c)||ss.includes(c)||text.includes(c);
      const okF=!f||f==='all'||f==='allformats'||ff===f;
      const okS=series==='all'||cc.includes(series)||ss.includes(series)||text.includes(series);
      card.style.display=okQ&&okC&&okF&&okS?'':'none';
    });
  }
  if(search){search.oninput=apply}
  if(cat){cat.onchange=apply}
  if(fmt){fmt.onchange=apply}
  document.querySelectorAll('.series-chip').forEach(ch=>{
    ch.onclick=()=>{document.querySelectorAll('.series-chip').forEach(x=>x.classList.remove('active'));ch.classList.add('active');const label=norm(ch.querySelector('.series-chip-name')?.textContent);series=label==='allsermons'?'all':label;apply()};
    ch.style.cursor='pointer';
  });
  apply();
}
async function run(){
  if(!/sermons\.html(?:$|[?#])/i.test(location.pathname+location.search))return;
  const items=await loadAll();if(!items.length)return;
  const grid=document.getElementById('sermonGrid');if(!grid)return;
  grid.querySelectorAll('.chm-json-sermon,.chm-live-sermon,.chm-dynamic-sermon,.chm-sync-filled').forEach(e=>e.remove());
  const host=document.getElementById('cms-sermons-injected');
  if(host){host.innerHTML='';host.style.display='none'}
  grid.insertAdjacentHTML('afterbegin',items.map(card).join(''));
  const feat=document.querySelector('.featured-sermon');if(feat)feat.innerHTML=featured(items[0]);
  wireFilters(grid);
  const s=document.createElement('style');s.textContent=`
  .chm-json-player iframe,.chm-json-player video{width:100%;height:220px;border:0;display:block;background:#102857}
  .chm-json-player audio{width:calc(100% - 24px);margin:90px 12px}
  .chm-json-featured-player iframe,.chm-json-featured-player video{position:absolute;inset:0;width:100%;height:100%;border:0;background:#102857}
  .chm-json-featured-player audio{width:calc(100% - 40px);margin:45% 20px 0}
  `;document.head.appendChild(s);
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(run,350));
})();
