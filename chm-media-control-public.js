/* CHM public media source renderer v2
   Keeps CHM Live Service as Listen Live item #1 and supports common Watch Live sources:
   YouTube/Vimeo, Google Drive, direct MP4/WebM/MP3, HLS/M3U8, iframe/embed code and permanent URLs. */
(function(){
'use strict';

function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function extractUrl(raw){
  const s=String(raw||'').trim();
  const m=s.match(/<iframe[^>]+src=["']([^"']+)["']/i)||s.match(/<source[^>]+src=["']([^"']+)["']/i);
  return m?m[1]:s;
}
function yt(u){
  u=extractUrl(u);
  const m=u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{6,})/i);
  return m?m[1]:'';
}
function vm(u){const m=extractUrl(u).match(/vimeo\.com\/(?:video\/)?(\d+)/i);return m?m[1]:''}
function drive(u){const m=extractUrl(u).match(/(?:file\/d\/|videos\/d\/|[?&]id=)([\w-]{10,})/i);return m?m[1]:''}
function isHls(u){return /\.m3u8(?:[?#].*)?$/i.test(extractUrl(u))}
function isM3u(u){return /\.m3u(?:[?#].*)?$/i.test(extractUrl(u))}
function isVideo(u){return /\.(mp4|webm|ogv|mov|m4v)(?:[?#].*)?$/i.test(extractUrl(u))}
function isAudio(u){return /\.(mp3|wav|ogg|m4a|aac|flac)(?:[?#].*)?$/i.test(extractUrl(u))||/soundcloud/i.test(u)}
function embed(u,autoplay=true){
  u=extractUrl(u);
  const y=yt(u);if(y)return'https://www.youtube-nocookie.com/embed/'+y+'?rel=0&playsinline=1&autoplay='+(autoplay?1:0)+'&mute='+(autoplay?1:0);
  const v=vm(u);if(v)return'https://player.vimeo.com/video/'+v+'?autoplay='+(autoplay?1:0);
  const d=drive(u);if(d)return'https://drive.google.com/file/d/'+d+'/preview';
  return u;
}
async function load(){
  let d={};
  try{const r=await fetch('site-data.json?_='+Date.now(),{cache:'no-store'});if(r.ok)d=await r.json()}catch(e){}
  try{
    const l=JSON.parse(localStorage.getItem('chm_sitedata')||'{}');
    if(Number(l._updatedAt||l._updated||0)>Number(d._updatedAt||d._updated||0))d=l
  }catch(e){}
  const list=(d.media_sources||[]).filter(x=>(x._status||x.status)==='published'&&!x.archived);
  return {data:d,list};
}
function ensureHls(cb){
  if(window.Hls)return cb();
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/hls.js@latest';
  s.onload=cb;s.onerror=cb;document.head.appendChild(s);
}
function mountVideo(host,url,autoplay=true){
  host.innerHTML='';
  const u=extractUrl(url);
  if(yt(u)||vm(u)||drive(u)||(/^https?:\/\//i.test(u)&&!isVideo(u)&&!isHls(u)&&!isAudio(u)&&!isM3u(u))){
    const f=document.createElement('iframe');
    f.src=embed(u,autoplay);f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen=true;f.style.cssText='width:100%;height:100%;border:0;background:#000';
    host.appendChild(f);return;
  }
  const v=document.createElement('video');
  v.controls=true;v.playsInline=true;v.autoplay=autoplay;v.muted=autoplay;
  v.style.cssText='width:100%;height:100%;object-fit:contain;background:#000';
  host.appendChild(v);
  if(isHls(u)){
    if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=u;v.play().catch(()=>{})}
    else ensureHls(()=>{if(window.Hls&&Hls.isSupported()){const h=new Hls();h.loadSource(u);h.attachMedia(v);h.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}))}else{v.src=u}})
  }else{v.src=u;v.play().catch(()=>{})}
}
async function watch(){
  if(!/watch-live\.html/i.test(location.pathname))return;
  const {data,list}=await load();
  const a=list.filter(x=>x.destination==='watch').sort((x,y)=>(Number(y.isPrimary||y.primary)-Number(x.isPrimary||x.primary))||(Number(x.order)||999)-(Number(y.order)||999));
  const fallback=data?.site_config?.media_settings?.watchLiveUrl||data?.media_settings?.watchLiveUrl||'';
  const x=a[0]||{title:'CHM Church of God',url:fallback};
  const u=extractUrl(x.url||x.mediaUrl||x.videoUrl||x.embedUrl||x.permanentUrl||'');
  if(!u)return;
  const frame=document.getElementById('cmsYouTubeFrame');
  if(frame){
    const host=frame.parentElement;
    frame.remove();
    const mount=document.createElement('div');mount.id='chmWatchLiveMount';mount.style.cssText='width:100%;height:100%;min-height:420px;background:#000';
    host.appendChild(mount);mountVideo(mount,u,true);
  }else{
    const host=document.querySelector('.live-player,.video-player,.stream-player,[data-live-player]');
    if(host)mountVideo(host,u,true);
  }
  const label=document.querySelector('.live-label span,[data-live-title]');
  if(label)label.textContent='● LIVE — '+(x.title||'CHM Church of God');
}
async function resolveAudioUrl(raw){
  const u=extractUrl(raw),d=drive(u);
  if(d)return'https://drive.google.com/uc?export=download&id='+d;
  if(isM3u(u)){
    try{
      const r=await fetch(u,{cache:'no-store'}),txt=await r.text();
      const first=txt.split(/\r?\n/).map(s=>s.trim()).find(s=>s&&!s.startsWith('#'));
      return first||u;
    }catch(e){return u}
  }
  return u;
}
async function playAudioRecord(x){
  const u=await resolveAudioUrl(x.url||x.mediaUrl||x.audioUrl||x.permanentUrl||'');
  let a=document.getElementById('chmDynamicAudio');
  if(!a){
    a=document.createElement('audio');a.id='chmDynamicAudio';a.controls=true;a.autoplay=true;
    a.style.cssText='width:100%;margin-top:18px';
    document.querySelector('.audio-player')?.appendChild(a)
  }
  if(isHls(u)){
    if(a.canPlayType('application/vnd.apple.mpegurl'))a.src=u;
    else ensureHls(()=>{if(window.Hls&&Hls.isSupported()){const h=new Hls();h.loadSource(u);h.attachMedia(a)}else a.src=u})
  }else a.src=u;
  a.play().catch(()=>window.open(embed(u,false),'_blank'));
  document.getElementById('trackTitle')?.replaceChildren(document.createTextNode(x.title||'CHM Live Service'));
  document.getElementById('trackSub')?.replaceChildren(document.createTextNode(x.description||x.subtitle||'CHM Church of God · Live Broadcast'));
}
async function listen(){
  if(!/listen-live\.html/i.test(location.pathname))return;
  const {data,list}=await load();
  let a=list.filter(x=>x.destination==='listen').sort((x,y)=>(Number(y.isPrimary||y.primary)-Number(x.isPrimary||x.primary))||(Number(x.order)||999)-(Number(y.order)||999));
  const savedPrimary=a.find(x=>x.isPrimary||x.primary)||a.find(x=>/chm live service/i.test(x.title||''));
  const configUrl=data?.site_config?.media_settings?.listenLiveUrl||data?.media_settings?.listenLiveUrl||'';
  const primary=savedPrimary||{
    id:'chm-live-service',title:'CHM Live Service',
    description:'CHM Church of God · Live Broadcast',destination:'listen',
    url:configUrl,isPrimary:true,order:1,_status:'published'
  };
  a=a.filter(x=>x!==savedPrimary&&x.id!=='chm-live-service');
  a=[primary,...a];
  const host=document.querySelector('.playlist-card');
  if(host){
    host.innerHTML='<div class="playlist-header">🎵 CHM Sunday Service Stream</div>'+a.map((x,i)=>`<div class="playlist-item ${i===0?'playing':''}" data-id="${safe(x.id||'')}" data-index="${i}"><div class="playlist-num">${i===0?'▶':i+1}</div><div class="playlist-info"><div class="playlist-title">${safe(x.title||'Audio Source')}</div><div class="playlist-meta">${safe(x.description||x.category||'Audio')}</div></div><div class="playlist-duration">${i===0?'● LIVE':'▶'}</div></div>`).join('');
    host.querySelectorAll('.playlist-item').forEach((el,i)=>el.addEventListener('click',()=>playAudioRecord(a[i])));
  }
  // CHM Live Service is always the first selected source on entry.
  document.getElementById('trackTitle')?.replaceChildren(document.createTextNode(primary.title||'CHM Live Service'));
  document.getElementById('trackSub')?.replaceChildren(document.createTextNode(primary.description||'CHM Church of God · Live Broadcast'));
  if(primary.url||primary.mediaUrl||primary.audioUrl)playAudioRecord(primary);
}
window.CHMPlayMediaSource=function(el){const i=Number(el.dataset.index||0);return false};
document.addEventListener('DOMContentLoaded',()=>{watch();listen()});
})();