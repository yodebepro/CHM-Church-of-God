/* CHM CHURCH OF GOD — Global duplicate-card prevention
   Keeps the original public card, transfers newly published media/file links into it,
   and removes any repeated copy injected below or elsewhere on the page. */
(function(){
  'use strict';

  const CARD_SELECTORS = [
    '.ministry-card','.department-card','.team-card','.leader-card',
    '.event-card','.sermon-card','.gallery-card','.announcement-card',
    '.location-card','.member-card','.feature-card','.media-card',
    '[data-chm-record-id]'
  ].join(',');

  const TITLE_SELECTORS = [
    '.min-title','.department-title','.team-name','.leader-name',
    '.event-title','.sermon-title','.gallery-title','.announcement-title',
    '.location-title','.card-title','h3','h4'
  ].join(',');

  function norm(v){
    return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  }
  function titleOf(card){
    const el=card.querySelector(TITLE_SELECTORS);
    return norm(el?.textContent||card.dataset?.chmRecordId||'');
  }
  function mediaNode(card){
    return card.querySelector(
      '.chm-sync-media-active,.chm-sync-media,.leader-img-placeholder,'+
      '.leader-photo,.team-photo,.gallery-img,.event-img,.sermon-img,'+
      '.department-img,.min-icon img,.card-image,img,video,audio'
    );
  }
  function hasRealMedia(card){
    const n=mediaNode(card);
    if(!n)return false;
    if(n.matches?.('img,video,audio'))return !!(n.currentSrc||n.src);
    return !!n.querySelector?.('img[src],video[src],video source[src],audio[src],audio source[src]');
  }
  function copyMedia(from,to){
    if(!from||!to||!hasRealMedia(from)||hasRealMedia(to))return;
    const source=mediaNode(from);
    if(!source)return;
    let target=mediaNode(to);
    if(target&&target.classList?.contains('min-icon')){
      target.innerHTML=source.outerHTML;
      target.classList.add('chm-sync-media-active');
      return;
    }
    const clone=source.cloneNode(true);
    if(target&&target.parentNode)target.parentNode.replaceChild(clone,target);
    else to.insertBefore(clone,to.firstChild);
  }
  function copyFileLinks(from,to){
    from.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href');
      if(!href||href==='#')return;
      if(to.querySelector(`a[href="${CSS.escape(href)}"]`))return;
      const text=(a.textContent||'').toLowerCase();
      if(/file|download|open|watch|listen|attachment|pdf|document/.test(text)){
        to.appendChild(a.cloneNode(true));
      }
    });
  }
  function preferred(cards){
    // Prefer the original/static card; if only one has media, preserve it as the source.
    return cards.find(c=>!c.classList.contains('chm-sync-filled')&&!c.classList.contains('cms-card')&&!c.dataset.chmGenerated)
      || cards[0];
  }
  function clean(){
    const cards=Array.from(document.querySelectorAll(CARD_SELECTORS))
      .filter(c=>!c.closest('header,nav,footer,.admin-sidebar,.modal'));
    const groups=new Map();
    cards.forEach(card=>{
      const key=titleOf(card);
      if(!key)return;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(card);
    });
    groups.forEach(group=>{
      if(group.length<2)return;
      const keep=preferred(group);
      group.forEach(card=>{
        if(card===keep)return;
        copyMedia(card,keep);
        copyFileLinks(card,keep);
        card.remove();
      });
    });

    // Remove empty legacy feed containers after their duplicate cards are removed.
    document.querySelectorAll(
      '[data-cms-live],.chm-cms-live-home,.chm-cms-generated-section,'+
      '.chm-generated-proper-section,.chm-home-admin-feed'
    ).forEach(el=>{
      if(!el.querySelector(CARD_SELECTORS)||!el.textContent.trim())el.remove();
    });
  }

  document.addEventListener('DOMContentLoaded',()=>{
    clean();
    setTimeout(clean,250);
    setTimeout(clean,900);
    setTimeout(clean,2200);
    if(window.MutationObserver){
      let timer;
      const obs=new MutationObserver(()=>{
        clearTimeout(timer);
        timer=setTimeout(clean,80);
      });
      obs.observe(document.body,{childList:true,subtree:true});
      setTimeout(()=>obs.disconnect(),12000);
    }
  });
})();
