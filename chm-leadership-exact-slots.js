/* CHM CHURCH OF GOD — Exact Leadership Slot Renderer */
(function(){
  'use strict';
  const SLOT_ALIASES={seniorpastor:'senior-pastor',leadpastor:'senior-pastor',founder:'senior-pastor',firstlady:'first-lady',copastor:'first-lady',associatepastor:'associate-pastor',executivepastor:'executive-pastor',worshipdirector:'worship-director',worshippastor:'worship-director',prayerdirector:'prayer-director',youthpastor:'youth-pastor',childrensdirector:'childrens-director',childrendirector:'childrens-director',outreachdirector:'outreach-director',mediadirector:'media-director',financedirector:'finance-director',educationdirector:'education-director',elder1:'elder-1',elder2:'elder-2',elder3:'elder-3',deacon1:'deacon-1',deacon2:'deacon-2'};
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const published=x=>String(x?._status||x?.status||'draft').toLowerCase()==='published'&&x?.archived!==true;
  const media=x=>x?.photo||x?.imageUrl||x?.photoUrl||x?.thumbnailUrl||x?.mediaUrl||x?.videoUrl||x?.audioUrl||x?.url||'';
  const fullName=x=>x?.title||x?.name||[x?.first,x?.last].filter(Boolean).join(' ')||'';
  function slotOf(x){
    let raw=String(x?.slot||'').trim().toLowerCase().replace(/_/g,'-');
    if(raw&&document.getElementById('slot-'+raw))return raw;
    const key=norm(raw||x?.role||x?.title||x?.position||x?.department);
    if(SLOT_ALIASES[key])return SLOT_ALIASES[key];
    const roleKey=norm(x?.role||x?.title||x?.position||'');
    const found=Array.from(document.querySelectorAll('.leader-card[id^="slot-"]')).find(c=>{
      const idKey=norm(c.id.replace(/^slot-/,''));
      const nameKey=norm(c.querySelector('.leader-name')?.textContent||'');
      const titleKey=norm(c.querySelector('.leader-title')?.textContent||'');
      return roleKey&&(roleKey===idKey||roleKey===nameKey||roleKey.includes(idKey)||idKey.includes(roleKey)||roleKey.includes(nameKey)||nameKey.includes(roleKey)||roleKey.includes(titleKey)||titleKey.includes(roleKey));
    });
    return found?found.id.replace(/^slot-/,''):'';
  }
  function mediaMarkup(url,name){
    const safe=String(name||'Leader').replace(/"/g,'&quot;');
    if(/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url))return `<video controls playsinline preload="metadata" aria-label="${safe}"><source src="${url}"></video>`;
    if(/\.(mp3|wav|ogg|m4a)(\?|#|$)/i.test(url))return `<audio controls preload="metadata" aria-label="${safe}"><source src="${url}"></audio>`;
    return `<img src="${url}" alt="${safe}" loading="lazy">`;
  }
  function fillExact(item){
    const slot=slotOf(item),card=slot?document.getElementById('slot-'+slot):null;
    if(!card)return;
    card.dataset.chmLeadershipSlot=slot;card.dataset.chmRecordId=String(item.id||slot);
    const url=media(item);let box=card.querySelector('.leader-img-placeholder,.leader-photo');
    if(!box){box=document.createElement('div');box.className='leader-img-placeholder';card.insertBefore(box,card.firstChild)}
    if(url){box.innerHTML=mediaMarkup(url,fullName(item));box.classList.add('chm-exact-leader-media')}
    const name=fullName(item),role=item.role||item.title||item.position||'',dept=item.dept||item.department||item.de||'',bio=item.bio||item.description||item.summary||'';
    const nameEl=card.querySelector('.leader-name');if(nameEl&&name)nameEl.textContent=name;
    const titleEl=card.querySelector('.leader-title');if(titleEl&&(role||dept))titleEl.textContent=dept||role;
    const bioEl=card.querySelector('.leader-bio');if(bioEl&&bio)bioEl.textContent=bio;
    const file=item.attachmentUrl||item.fileUrl||'';
    if(file){let a=card.querySelector('.chm-leader-file-link');if(!a){a=document.createElement('a');a.className='chm-leader-file-link';a.target='_blank';a.rel='noopener';a.textContent='📎 Open Leadership File ↗';card.querySelector('.leader-body')?.appendChild(a)}a.href=file}
  }
  function removeMisplaced(items){
    const allowed=new Set(items.map(media).filter(Boolean));
    document.querySelectorAll('.chm-generated-proper-section,.chm-cms-generated-section,.chm-home-admin-feed,[data-cms-live],.chm-cms-live-home,.cms-card,.chm-cms-card,.chm-admin-public-filled').forEach(el=>{
      if(el.closest('.leader-card[id^="slot-"]'))return;
      const hasLeadershipMedia=Array.from(el.querySelectorAll('img[src],video[src],video source[src],audio[src],audio source[src]')).some(n=>allowed.has(n.getAttribute('src')));
      const text=norm(el.textContent),hasLeaderName=items.some(x=>text&&text.includes(norm(fullName(x))));
      if(hasLeadershipMedia||hasLeaderName)el.remove();
    });
    allowed.forEach(url=>document.querySelectorAll('img[src],video[src],video source[src],audio[src],audio source[src]').forEach(n=>{
      if(n.getAttribute('src')!==url||n.closest('.leader-card[id^="slot-"]'))return;
      const wrapper=n.closest('article,section,.feature-card,.cms-card,.chm-cms-card,div');
      if(wrapper&&!wrapper.closest('header,nav,footer'))wrapper.remove();else n.remove();
    }));
  }
  async function readJson(file){try{const r=await fetch(file+'?_='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}}
  async function run(){
    const site=await readJson('site-data.json')||{},named=await readJson('chm-leaders.json')||{};
    const list=[...(Array.isArray(site.leaders)?site.leaders:[]),...(Array.isArray(site.leadership)?site.leadership:[]),...(Array.isArray(named.leaders)?named.leaders:[]),...(Array.isArray(named.leadership)?named.leadership:[])].filter(published);
    const bySlot=new Map();list.forEach(x=>{const slot=slotOf(x);if(slot)bySlot.set(slot,x)});
    const final=Array.from(bySlot.values());final.forEach(fillExact);removeMisplaced(final);setTimeout(()=>removeMisplaced(final),300);setTimeout(()=>removeMisplaced(final),1200);
  }
  document.addEventListener('DOMContentLoaded',run);
})();
