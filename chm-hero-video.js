/* CHM CHURCH OF GOD — Universal Hero Background Video v1
   Supports uploaded/direct video, Google Drive share/play links, YouTube, and Vimeo.
   Reads site_config.hero from site-data.json and local CMS data. */
(function(){
'use strict';
if(window.CHMHeroVideo)return;
function driveId(url){
  const s=String(url||'');
  const patterns=[/\/d\/([a-zA-Z0-9_-]{10,})/,/[?&]id=([a-zA-Z0-9_-]{10,})/,/videos\/d\/([a-zA-Z0-9_-]{10,})/];
  for(const p of patterns){const m=s.match(p);if(m)return m[1]}
  return '';
}
function youtubeId(url){const s=String(url||'');const m=s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i);return m?m[1]:''}
function vimeoId(url){const m=String(url||'').match(/vimeo\.com\/(?:video\/)?(\d+)/i);return m?m[1]:''}
function identify(url){
  url=String(url||'').trim();
  const did=driveId(url); if(did)return{type:'drive',original:url,id:did,direct:'https://drive.google.com/uc?export=download&id='+did,embed:'https://drive.google.com/file/d/'+did+'/preview?autoplay=1&mute=1'};
  const yid=youtubeId(url); if(yid)return{type:'youtube',original:url,id:yid,embed:'https://www.youtube-nocookie.com/embed/'+yid+'?autoplay=1&mute=1&loop=1&playlist='+yid+'&controls=0&modestbranding=1&playsinline=1'};
  const vid=vimeoId(url); if(vid)return{type:'vimeo',original:url,id:vid,embed:'https://player.vimeo.com/video/'+vid+'?autoplay=1&muted=1&loop=1&background=1'};
  return{type:'direct',original:url,direct:url};
}
function removeExisting(host){host.querySelectorAll('.hero-video-bg,.chm-hero-drive-bg,.chm-hero-embed-bg,[data-chm-hero-video]').forEach(e=>e.remove())}
function styleMedia(el){el.setAttribute('data-chm-hero-video','1');el.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.48;pointer-events:none;border:0;background:#0a1f44;';}
function makeIframe(src){const f=document.createElement('iframe');f.src=src;f.allow='autoplay; encrypted-media; fullscreen';f.setAttribute('allowfullscreen','');f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.className='chm-hero-embed-bg';styleMedia(f);return f}
function render(host,url,opts={}){
  if(!host||!url)return null;removeExisting(host);if(getComputedStyle(host).position==='static')host.style.position='relative';
  const info=identify(url);
  if(info.type==='drive'){
    const v=document.createElement('video');v.className='hero-video-bg';v.autoplay=true;v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.src=info.direct;styleMedia(v);
    let fell=false;const fallback=()=>{if(fell)return;fell=true;v.remove();host.insertBefore(makeIframe(info.embed),host.firstChild)};
    v.addEventListener('error',fallback,{once:true});
    const timer=setTimeout(()=>{if(v.readyState<2)fallback()},5000);
    v.addEventListener('canplay',()=>{clearTimeout(timer);v.play().catch(()=>{})},{once:true});
    host.insertBefore(v,host.firstChild);return v;
  }
  if(info.type==='youtube'||info.type==='vimeo'){const f=makeIframe(info.embed);host.insertBefore(f,host.firstChild);return f}
  const v=document.createElement('video');v.className='hero-video-bg';v.autoplay=true;v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.src=info.direct;styleMedia(v);host.insertBefore(v,host.firstChild);v.play().catch(()=>{});return v;
}
function preview(host,url){if(!host)return;host.innerHTML='';if(!url)return;const info=identify(url);if(info.type==='drive'||info.type==='youtube'||info.type==='vimeo'){const f=document.createElement('iframe');f.src=info.embed;f.allow='autoplay; encrypted-media; fullscreen';f.setAttribute('allowfullscreen','');f.style.cssText='width:100%;aspect-ratio:16/9;border:0;border-radius:10px;background:#000';host.appendChild(f)}else{const v=document.createElement('video');v.src=info.direct;v.controls=true;v.autoplay=true;v.muted=true;v.loop=true;v.playsInline=true;v.style.cssText='width:100%;aspect-ratio:16/9;border-radius:10px;background:#000;object-fit:contain';host.appendChild(v);v.play().catch(()=>{})}}
async function loadConfig(){
  let local={};try{local=JSON.parse(localStorage.getItem('chm_sitedata')||'{}')}catch(e){}
  let hero=local?.site_config?.hero||{};
  try{const r=await fetch('site-data.json?_='+Date.now(),{cache:'no-store'});if(r.ok){const d=await r.json();hero={...hero,...(d?.site_config?.hero||{})}}}catch(e){}
  return hero;
}
async function auto(){const host=document.querySelector('.hero');if(!host)return;const h=await loadConfig();const url=h.videoUrl||h.video||h.heroVideoUrl||'';if(url)render(host,url)}
window.CHMHeroVideo={identify,render,preview,loadConfig,auto};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
})();