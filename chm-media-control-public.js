/* CHM Public Media Destination Sync
   Routes Listen Live records only to listen-live.html and Watch Live records only to watch-live.html.
   Reads site-data.json plus tab-specific JSON exports uploaded to GitHub. */
(function(){
'use strict';

const RADIO_URL='https://c13.radioboss.fm:8254/stream';

function extractUrl(raw){
  const s=String(raw||'').trim();
  const m=s.match(/<iframe[^>]+src=["']([^"']+)["']/i)||s.match(/<source[^>]+src=["']([^"']+)["']/i);
  return m?m[1]:s;
}
function yt(u){const m=extractUrl(u).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{6,})/i);return m?m[1]:''}
function vm(u){const m=extractUrl(u).match(/vimeo\.com\/(?:video\/)?(\d+)/i);return m?m[1]:''}
function drive(u){const m=extractUrl(u).match(/(?:file\/d\/|videos\/d\/|[?&]id=)([\w-]{10,})/i);return m?m[1]:''}
function isHls(u){return /\.m3u8(?:[?#].*)?$/i.test(extractUrl(u))}
function isM3u(u){return /\.m3u(?:[?#].*)?$/i.test(extractUrl(u))}
function isVideo(u){return /\.(mp4|webm|ogv|mov|m4v)(?:[?#].*)?$/i.test(extractUrl(u))}
function isAudio(u){return /\.(mp3|wav|ogg|m4a|aac|flac)(?:[?#].*)?$/i.test(extractUrl(u))}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

async function fetchJson(name){
  try{const r=await fetch(name+'?_='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}
  return null;
}
function recordsOf(j){
  if(!j)return[];
  if(Array.isArray(j))return j;
  return Array.isArray(j.media_sources)?j.media_sources:[];
}
async function loadSources(){
  const [site,all,listen,watch]=await Promise.all([
    fetchJson('site-data.json'),
    fetchJson('chm-media-sources.json'),
    fetchJson('chm-listen-sources.json'),
    fetchJson('chm-watch-sources.json')
  ]);
  const map=new Map();
  [recordsOf(site),recordsOf(all),recordsOf(listen),recordsOf(watch)].flat().forEach(x=>{
    if(!x)return;
    const key=x.id||`${x.destination}|${x.title}|${x.url||x.mediaUrl||''}`;
    const old=map.get(key);
    if(!old||Number(x._updatedAt||0)>=Number(old._updatedAt||0))map.set(key,x);
  });
  try{
    const local=JSON.parse(localStorage.getItem('chm_sitedata')||'{}');
    recordsOf(local).forEach(x=>{
      const key=x.id||`${x.destination}|${x.title}|${x.url||x.mediaUrl||''}`;
      const old=map.get(key);
      if(!old||Number(x._updatedAt||0)>=Number(old._updatedAt||0))map.set(key,x);
    });
  }catch(e){}
  let arr=[...map.values()].filter(x=>(x._status||x.status||'published')==='published'&&!x.archived);
  let radio=arr.find(x=>x.id==='chm-live-service'||(x.destination==='listen'&&/CHM Live Service/i.test(x.title||'')));
  if(!radio){
    radio={id:'chm-live-service',title:'CHM Live Service',description:'CHM Church of God · Live Broadcast',destination:'listen',url:RADIO_URL,order:1,isPrimary:true,primary:true,status:'published'};
    arr.unshift(radio);
  }else{
    radio.destination='listen';radio.order=1;radio.isPrimary=true;radio.primary=true;
    radio.url=radio.url||radio.audioUrl||radio.mediaUrl||RADIO_URL;
  }
  return arr;
}
function sourceUrl(x){return extractUrl(x.url||x.permanentUrl||x.embedUrl||x.mediaUrl||x.videoUrl||x.audioUrl||'')}
function embedUrl(u,autoplay){
  const y=yt(u);if(y)return`https://www.youtube-nocookie.com/embed/${y}?rel=0&playsinline=1&autoplay=${autoplay?1:0}&mute=${autoplay?1:0}`;
  const v=vm(u);if(v)return`https://player.vimeo.com/video/${v}?autoplay=${autoplay?1:0}`;
  const d=drive(u);if(d)return`https://drive.google.com/file/d/${d}/preview`;
  return extractUrl(u);
}
function loadHls(cb){
  if(window.Hls)return cb();
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@latest';s.onload=cb;s.onerror=cb;document.head.appendChild(s);
}
function mountWatch(host,x){
  const u=sourceUrl(x);if(!u)return;
  host.innerHTML='';host.style.position='absolute';host.style.inset='0';host.style.padding='0';host.style.height='100%';
  if(yt(u)||vm(u)||drive(u)||(/^https?:\/\//i.test(u)&&!isVideo(u)&&!isHls(u)&&!isAudio(u)&&!isM3u(u))){
    const f=document.createElement('iframe');f.src=embedUrl(u,true);f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.style.cssText='width:100%;height:100%;border:0;background:#000';host.appendChild(f);return;
  }
  const v=document.createElement('video');v.controls=true;v.autoplay=x.autoplay!==false;v.muted=x.muted!==false;v.playsInline=true;v.style.cssText='width:100%;height:100%;object-fit:contain;background:#000';host.appendChild(v);
  if(isHls(u)){
    if(v.canPlayType('application/vnd.apple.mpegurl'))v.src=u;
    else loadHls(()=>{if(window.Hls&&Hls.isSupported()){const h=new Hls();h.loadSource(u);h.attachMedia(v)}else v.src=u});
  }else v.src=u;
  v.play().catch(()=>{});
}
async function renderWatch(){
  if(!/watch-live\.html/i.test(location.pathname))return;
  const all=await loadSources();
  const list=all.filter(x=>x.destination==='watch').sort((a,b)=>(Number(b.isPrimary||b.primary)-Number(a.isPrimary||a.primary))||(Number(a.order)||999)-(Number(b.order)||999));
  const x=list[0];if(!x)return;
  const frame=document.getElementById('cmsYouTubeFrame');
  if(frame){
    const ratio=frame.parentElement;frame.remove();
    let host=document.getElementById('chmWatchDestination');
    if(!host){host=document.createElement('div');host.id='chmWatchDestination';ratio.appendChild(host)}
    mountWatch(host,x);
  }
  const label=document.querySelector('.live-label span,[data-live-title]');
  if(label)label.textContent='● LIVE — '+(x.title||'CHM Church of God');
}
async function resolveAudio(x){
  let u=sourceUrl(x);const d=drive(u);
  if(d)return`https://drive.google.com/uc?export=download&id=${d}`;
  if(isM3u(u)){
    try{const r=await fetch(u,{cache:'no-store'}),txt=await r.text();return txt.split(/\r?\n/).map(s=>s.trim()).find(s=>s&&!s.startsWith('#'))||u}catch(e){}
  }
  return u;
}
let activeAudio=null,activeList=[];
async function playListen(index){
  const x=activeList[index];if(!x)return;
  const u=await resolveAudio(x);if(!u)return;
  let a=document.getElementById('chmDynamicAudio');
  if(!a){a=document.createElement('audio');a.id='chmDynamicAudio';a.preload='auto';a.style.display='none';document.body.appendChild(a)}
  activeAudio=a;
  if(isHls(u)){
    if(a.canPlayType('application/vnd.apple.mpegurl'))a.src=u;
    else loadHls(()=>{if(window.Hls&&Hls.isSupported()){const h=new Hls();h.loadSource(u);h.attachMedia(a)}else a.src=u});
  }else a.src=u;
  a.volume=(Number(document.getElementById('volumeSlider')?.value||80))/100;
  a.play().catch(()=>{});
  document.getElementById('trackTitle').textContent=x.title||'CHM Live Service';
  document.getElementById('trackSub').textContent=x.description||x.artist||'CHM Church of God · Live Broadcast';
  document.querySelectorAll('.playlist-item').forEach((el,i)=>{el.classList.toggle('playing',i===index);const n=el.querySelector('.playlist-num');if(n)n.textContent=i===index?'▶':i+1});
}
async function renderListen(){
  if(!/listen-live\.html/i.test(location.pathname))return;
  const all=await loadSources();
  activeList=all.filter(x=>x.destination==='listen').sort((a,b)=>(Number(b.isPrimary||b.primary)-Number(a.isPrimary||a.primary))||(Number(a.order)||999)-(Number(b.order)||999));
  const radioIndex=activeList.findIndex(x=>x.id==='chm-live-service'||/CHM Live Service/i.test(x.title||''));
  if(radioIndex>0){const [r]=activeList.splice(radioIndex,1);activeList.unshift(r)}
  const host=document.querySelector('.playlist-card');
  if(host){
    host.innerHTML='<div class="playlist-header">🎵 CHM Radio & Audio</div>'+activeList.map((x,i)=>`<div class="playlist-item ${i===0?'playing':''}" data-index="${i}"><div class="playlist-num">${i===0?'▶':i+1}</div><div class="playlist-info"><div class="playlist-title">${safe(x.title||'Audio Source')}</div><div class="playlist-meta">${safe(x.description||x.artist||x.category||'Audio')}</div></div><div class="playlist-duration">${safe(x.duration||(i===0?'● LIVE':'▶'))}</div></div>`).join('');
    host.querySelectorAll('.playlist-item').forEach(el=>el.addEventListener('click',()=>playListen(Number(el.dataset.index))));
  }
  window.togglePlay=function(){if(!activeAudio)return playListen(0);if(activeAudio.paused)activeAudio.play().catch(()=>{});else activeAudio.pause()};
  window.setVolume=function(v){if(activeAudio)activeAudio.volume=Number(v)/100};
  window.seekBack=function(){if(activeAudio&&Number.isFinite(activeAudio.currentTime))activeAudio.currentTime=Math.max(0,activeAudio.currentTime-15)};
  window.seekFwd=function(){if(activeAudio&&Number.isFinite(activeAudio.currentTime))activeAudio.currentTime+=15};
  window.prevTrack=function(){const i=Math.max(0,activeList.findIndex(x=>x.title===document.getElementById('trackTitle').textContent)-1);playListen(i)};
  window.nextTrack=function(){const i=activeList.findIndex(x=>x.title===document.getElementById('trackTitle').textContent);playListen(Math.min(activeList.length-1,i+1))};
  playListen(0);
}
document.addEventListener('DOMContentLoaded',()=>{renderWatch();renderListen()});
})();