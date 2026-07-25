/* CHM Media Control hard tab fix
   This script is deliberately independent from the page's older inline handlers. */
(function(){
'use strict';

const RADIO_URL='https://c13.radioboss.fm:8254/stream';
const LABELS={
  listen:{title:'Add Listen Live Source',saved:'Saved Listen Live Sources',note:'Listen Live uses an audio playlist. CHM Live Service remains protected as item #1.'},
  watch:{title:'Add Watch Live Source',saved:'Saved Watch Live Sources',note:'Watch Live uses video and livestream settings, including permanent links, M3U/M3U8/HLS, YouTube, Vimeo, Google Drive, MP4/WebM, and iframe embeds.'},
  media:{title:'Add General Media Source',saved:'Saved General Media Sources',note:'General Media stores reusable sources without replacing the default Listen Live or Watch Live source.'}
};

function $(id){return document.getElementById(id)}
function safeJsonParse(v){try{return JSON.parse(v)}catch(e){return null}}
async function remoteData(){
  try{const r=await fetch('site-data.json?_='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}
  return {};
}
async function ensureRadio(){
  const remote=await remoteData();
  const local=safeJsonParse(localStorage.getItem('chm_sitedata'))||{};
  const d=Object.keys(local).length?local:remote;
  if(!Array.isArray(d.media_sources))d.media_sources=[];
  let radio=d.media_sources.find(x=>x.id==='chm-live-service'||(x.destination==='listen'&&/CHM Live Service/i.test(x.title||'')));
  if(!radio){
    radio={id:'chm-live-service',title:'CHM Live Service',description:'CHM Church of God · Live Broadcast',category:'CHM Live',destination:'listen',url:RADIO_URL,mediaUrl:RADIO_URL,audioUrl:RADIO_URL,permanentUrl:RADIO_URL,order:1,isPrimary:true,primary:true,_status:'published',status:'published',archived:false};
    d.media_sources.unshift(radio);
  }else{
    radio.id='chm-live-service';radio.title='CHM Live Service';radio.description=radio.description||'CHM Church of God · Live Broadcast';
    radio.destination='listen';radio.url=radio.url||RADIO_URL;radio.mediaUrl=radio.mediaUrl||radio.url;radio.audioUrl=radio.audioUrl||radio.url;radio.permanentUrl=radio.permanentUrl||radio.url;
    radio.order=1;radio.isPrimary=true;radio.primary=true;radio._status=radio.status='published';radio.archived=false;
  }
  d.media_sources.forEach(x=>{if(x!==radio&&x.destination==='listen'){x.isPrimary=false;x.primary=false}});
  localStorage.setItem('chm_sitedata',JSON.stringify(d));
  return d;
}

function setTab(dest){
  window.currentDest=dest;
  if($('mDest'))$('mDest').value=dest;

  document.querySelectorAll('.media-tab').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.dest===dest);
    btn.setAttribute('aria-selected',btn.dataset.dest===dest?'true':'false');
  });

  if($('listenFields'))$('listenFields').style.display=dest==='listen'?'block':'none';
  if($('watchFields'))$('watchFields').style.display=dest==='watch'?'block':'none';

  const mTitle=$('mTitle'),saved=$('savedTitle'),note=$('destNote');
  if(mTitle)mTitle.textContent=LABELS[dest].title;
  if(saved)saved.textContent=LABELS[dest].saved;
  if(note)note.textContent=LABELS[dest].note;

  if(typeof window.mLoad==='function'){
    Promise.resolve(window.mLoad()).catch(()=>renderFallback(dest));
  }else renderFallback(dest);
}

async function renderFallback(dest){
  const d=await ensureRadio();
  const rows=$('mRows');if(!rows)return;
  const list=(d.media_sources||[]).filter(x=>(x.destination||'media')===dest).sort((a,b)=>(Number(b.isPrimary||b.primary)-Number(a.isPrimary||a.primary))||(Number(a.order)||999)-(Number(b.order)||999));
  if($('savedCount'))$('savedCount').textContent=String(list.length);
  rows.innerHTML=list.length?list.map(x=>`<tr><td><strong>${String(x.title||'Untitled')}</strong>${x.id==='chm-live-service'?' <span class="protected">Protected #1</span>':''}<br><small>${String(x.category||x.description||'')}</small></td><td>${x.order||''}${(x.isPrimary||x.primary)?' · Default':''}</td><td><span class="pill">${x.status||x._status||'draft'}</span></td><td>${x.id==='chm-live-service'?'<button type="button" class="act act-edit" data-edit="'+x.id+'">Edit</button>':'<button type="button" class="act act-edit" data-edit="'+x.id+'">Edit</button>'}</td></tr>`).join(''):'<tr><td colspan="4" style="text-align:center;padding:2rem">No saved sources for this section.</td></tr>';
  rows.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{if(typeof window.mEdit==='function')window.mEdit(b.dataset.edit)}));
}

function download(name,obj){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));
  a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
async function exportCurrent(){
  const d=await ensureRadio(),dest=window.currentDest||'listen';
  download(`chm-${dest}-sources.json`,{media_sources:(d.media_sources||[]).filter(x=>(x.destination||'media')===dest)});
}
async function exportAll(){const d=await ensureRadio();download('chm-media-sources.json',{media_sources:d.media_sources||[]})}
async function importJson(file){
  if(!file)return;
  try{
    const j=JSON.parse(await file.text()),incoming=j.media_sources||j;
    if(!Array.isArray(incoming))throw new Error('JSON must contain a media_sources array.');
    const d=await ensureRadio();
    for(const x of incoming){
      if(x.id==='chm-live-service')continue;
      const i=d.media_sources.findIndex(y=>y.id===x.id);
      if(i>=0)d.media_sources[i]=x;else d.media_sources.push(x);
    }
    localStorage.setItem('chm_sitedata',JSON.stringify(d));
    await ensureRadio();
    setTab(window.currentDest||'listen');
    alert('JSON imported and saved.');
  }catch(e){alert('Import failed: '+e.message)}
}

document.addEventListener('DOMContentLoaded',async()=>{
  await ensureRadio();

  const map={tabListen:'listen',tabWatch:'watch',tabGeneral:'media'};
  Object.entries(map).forEach(([id,dest])=>{
    const b=$(id);if(!b)return;
    b.onclick=null;
    b.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();setTab(dest)},true);
  });

  $('exportCurrentTop')?.addEventListener('click',exportCurrent);
  $('exportAllTop')?.addEventListener('click',exportAll);
  $('importTop')?.addEventListener('click',()=>$('mImportTop')?.click());
  $('mImportTop')?.addEventListener('change',e=>importJson(e.target.files?.[0]));

  // Also repair the lower JSON buttons by binding directly.
  document.querySelectorAll('button').forEach(btn=>{
    const t=(btn.textContent||'').toLowerCase();
    if(t.includes('export current tab'))btn.addEventListener('click',exportCurrent);
    else if(t.includes('export all media'))btn.addEventListener('click',exportAll);
  });

  setTab('listen');
});
})();
