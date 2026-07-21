/* CHM CHURCH OF GOD — Universal Hero Background Video v2
   Supports uploaded/direct video, Google Drive share/play links, YouTube, and Vimeo.
   Reads site_config.hero from site-data.json and respects muted, volume, and loop settings. */
(function(){
'use strict';
function driveId(url){
  const s=String(url||'');
  const patterns=[/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i,/docs\.google\.com\/videos\/d\/([a-zA-Z0-9_-]{10,})/i,/\/d\/([a-zA-Z0-9_-]{10,})/i,/[?&]id=([a-zA-Z0-9_-]{10,})/i];
  for(const p of patterns){const m=s.match(p);if(m)return m[1]} return '';
}
function youtubeId(url){const m=String(url||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/i);return m?m[1]:''}
function vimeoId(url){const m=String(url||'').match(/vimeo\.com\/(?:video\/)?(\d+)/i);return m?m[1]:''}
function bool(v,fallback){if(v===undefined||v===null||v==='')return fallback;if(typeof v==='boolean')return v;return !/^(false|0|no|off)$/i.test(String(v))}
function volume(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0}
function normalizeOptions(raw={}){return{muted:bool(raw.muted,true),loop:bool(raw.loop,true),volume:volume(raw.volume??0),autoplay:bool(raw.autoplay,true)}}
function identify(url,opts={}){
  url=String(url||'').trim();const o=normalizeOptions(opts);const mute=o.muted?1:0,loop=o.loop?1:0;
  const did=driveId(url);if(did)return{type:'drive',original:url,id:did,directCandidates:['https://drive.google.com/uc?export=download&id='+did,'https://drive.usercontent.google.com/download?id='+did+'&export=download&confirm=t'],embed:'https://drive.google.com/file/d/'+did+'/preview?autoplay='+(o.autoplay?1:0)+'&mute='+mute};
  const yid=youtubeId(url);if(yid)return{type:'youtube',original:url,id:yid,embed:'https://www.youtube-nocookie.com/embed/'+yid+'?autoplay='+(o.autoplay?1:0)+'&mute='+mute+'&loop='+loop+'&playlist='+yid+'&controls=0&modestbranding=1&playsinline=1'};
  const vid=vimeoId(url);if(vid)return{type:'vimeo',original:url,id:vid,embed:'https://player.vimeo.com/video/'+vid+'?autoplay='+(o.autoplay?1:0)+'&muted='+mute+'&loop='+loop+'&background=1'};
  return{type:'direct',original:url,direct:url};
}
function removeExisting(host){host.querySelectorAll('.hero-video-bg,.chm-hero-drive-bg,.chm-hero-embed-bg,[data-chm-hero-video]').forEach(e=>e.remove())}
function styleMedia(el){el.setAttribute('data-chm-hero-video','1');el.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:.48;pointer-events:none;border:0;background:#0a1f44;'}
function makeIframe(src){const f=document.createElement('iframe');f.src=src;f.allow='autoplay; encrypted-media; fullscreen';f.setAttribute('allowfullscreen','');f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.className='chm-hero-embed-bg';styleMedia(f);return f}
function applyVideoSettings(v,o){v.autoplay=o.autoplay;v.muted=o.muted;v.defaultMuted=o.muted;v.loop=o.loop;v.playsInline=true;v.preload='auto';v.volume=o.muted?0:o.volume;v.setAttribute('playsinline','');if(o.muted)v.setAttribute('muted','');else v.removeAttribute('muted')}
function tryPlay(v,o){if(!o.autoplay)return;const p=v.play();if(p&&p.catch)p.catch(()=>{if(!o.muted){v.muted=true;v.defaultMuted=true;v.play().catch(()=>{});const restore=()=>{v.muted=false;v.defaultMuted=false;v.volume=o.volume;document.removeEventListener('pointerdown',restore,true);document.removeEventListener('keydown',restore,true)};document.addEventListener('pointerdown',restore,true);document.addEventListener('keydown',restore,true)}})}
function render(host,url,opts={}){
  if(!host||!url)return null;removeExisting(host);if(getComputedStyle(host).position==='static')host.style.position='relative';const o=normalizeOptions(opts),info=identify(url,o);
  if(info.type==='drive'){
    const v=document.createElement('video');v.className='hero-video-bg';applyVideoSettings(v,o);styleMedia(v);let candidate=0,finished=false;
    const fallback=()=>{if(finished)return;if(candidate<info.directCandidates.length){v.src=info.directCandidates[candidate++];v.load();tryPlay(v,o);return}finished=true;v.remove();host.insertBefore(makeIframe(info.embed),host.firstChild)};
    v.addEventListener('error',fallback);v.addEventListener('stalled',()=>{if(v.readyState<2)fallback()});v.addEventListener('canplay',()=>{finished=true;tryPlay(v,o)},{once:true});host.insertBefore(v,host.firstChild);fallback();setTimeout(()=>{if(!finished&&v.readyState<2)fallback()},6000);return v;
  }
  if(info.type==='youtube'||info.type==='vimeo'){const f=makeIframe(info.embed);host.insertBefore(f,host.firstChild);return f}
  const v=document.createElement('video');v.className='hero-video-bg';applyVideoSettings(v,o);v.src=info.direct;styleMedia(v);host.insertBefore(v,host.firstChild);tryPlay(v,o);return v;
}
function preview(host,url,opts={}){if(!host)return;host.innerHTML='';if(!url)return;const o=normalizeOptions(opts),info=identify(url,o);if(info.type==='drive'||info.type==='youtube'||info.type==='vimeo'){const f=document.createElement('iframe');f.src=info.embed;f.allow='autoplay; encrypted-media; fullscreen';f.setAttribute('allowfullscreen','');f.style.cssText='width:100%;aspect-ratio:16/9;border:0;border-radius:10px;background:#000';host.appendChild(f)}else{const v=document.createElement('video');v.src=info.direct;v.controls=true;applyVideoSettings(v,o);v.style.cssText='width:100%;aspect-ratio:16/9;border-radius:10px;background:#000;object-fit:contain';host.appendChild(v);tryPlay(v,o)}}
async function loadConfig(){let local={};try{local=JSON.parse(localStorage.getItem('chm_sitedata')||'{}')}catch(e){}let hero=local?.site_config?.hero||{};try{const r=await fetch('site-data.json?_='+Date.now(),{cache:'no-store'});if(r.ok){const d=await r.json(),remote=d?.site_config?.hero||{};hero=Number(remote?._updatedAt||0)>=Number(hero?._updatedAt||0)?{...hero,...remote}:{...remote,...hero}}}catch(e){}return hero}
async function auto(){const host=document.querySelector('.hero');if(!host)return;const h=await loadConfig(),url=h.videoUrl||h.video||h.heroVideoUrl||'';if(url)render(host,url,h)}
window.CHMHeroVideo={driveId,identify,render,preview,loadConfig,normalizeOptions,auto};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
})();