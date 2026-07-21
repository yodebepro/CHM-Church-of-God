/* CHM — Homepage Leadership Reflection Fix
   Mirrors published Senior Pastor, Executive Pastor, Worship Director, and Outreach Director
   into the exact four blue cards on the homepage. */
(function(){
'use strict';
const WANTED=['senior-pastor','executive-pastor','worship-director','outreach-director'];
const ROLE_ALIASES={
  seniorpastor:'senior-pastor',leadpastor:'senior-pastor',
  executivepastor:'executive-pastor',executiveleadership:'executive-pastor',
  worshipdirector:'worship-director',worshippastor:'worship-director',worshiparts:'worship-director',
  outreachdirector:'outreach-director',missionsoutreach:'outreach-director'
};
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function published(x){return String(x?._status||x?.status||'draft').toLowerCase()==='published'&&x?.archived!==true}
function media(x){return x?.photo||x?.imageUrl||x?.photoUrl||x?.thumbnailUrl||x?.mediaUrl||x?.videoUrl||x?.url||''}
function slotOf(x){
  const raw=String(x?.slot||'').trim().toLowerCase().replace(/_/g,'-');
  if(WANTED.includes(raw))return raw;
  const keys=[x?.role,x?.title,x?.position,x?.category,x?.dept,x?.department].map(norm).filter(Boolean);
  for(const k of keys){if(ROLE_ALIASES[k])return ROLE_ALIASES[k]}
  return '';
}
function recordTime(x){return Number(x?._updatedAt||x?.updatedAt||x?._publishedAt||0)}
function cardFor(slot){
  const exact=document.querySelector(`[data-home-leader-slot="${slot}"]`);if(exact)return exact;
  const cards=Array.from(document.querySelectorAll('#home-leadership-grid .leader-card,.leaders-preview .leader-card,.leader-card'));
  return cards.find(c=>{
    const n=norm(c.querySelector('.leader-name')?.textContent||'');
    return n===norm(slot)||n.includes(norm(slot))||norm(slot).includes(n);
  })||null;
}
function markup(url,name){
  if(/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url))return `<video muted loop autoplay playsinline><source src="${url}"></video>`;
  return `<img src="${url}" alt="${String(name||'Church leader').replace(/"/g,'&quot;')}" loading="lazy">`;
}
function fill(card,item,slot){
  if(!card)return;
  card.dataset.homeLeaderSlot=slot;
  const u=media(item);if(!u)return;
  let box=card.querySelector('.leader-img-placeholder,.leader-photo');
  if(!box){box=document.createElement('div');box.className='leader-img-placeholder';card.insertBefore(box,card.firstChild)}
  box.innerHTML=markup(u,[item.first,item.last].filter(Boolean).join(' ')||item.title||item.role);
  box.classList.add('chm-home-leader-media');
}
async function getJson(name){try{const r=await fetch(name+'?_='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}}
async function run(){
  const site=await getJson('site-data.json')||{};
  const named=await getJson('chm-leaders.json')||{};
  const all=[...(site.leaders||[]),...(site.leadership||[]),...(named.leaders||[]),...(named.leadership||[])].filter(published);
  const best=new Map();
  all.forEach(x=>{const s=slotOf(x);if(!WANTED.includes(s))return;const old=best.get(s);if(!old||recordTime(x)>=recordTime(old))best.set(s,x)});
  WANTED.forEach(s=>{const x=best.get(s);if(x)fill(cardFor(s),x,s)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();