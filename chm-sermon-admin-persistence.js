/* CHM Sermon Admin persistence safeguard */
(function(){
'use strict';
async function fetchJson(n){try{const r=await fetch(n+'?_='+Date.now(),{cache:'no-store'});if(r.ok)return await r.json()}catch(e){}return null}
function arr(j){if(!j)return[];if(Array.isArray(j))return j;return Array.isArray(j.sermons)?j.sermons:[]}
async function hydrate(){
  let local={};try{local=JSON.parse(localStorage.getItem('chm_sitedata')||'{}')}catch(e){}
  const [site,named]=await Promise.all([fetchJson('site-data.json'),fetchJson('chm-sermons.json')]);
  const map=new Map();
  [arr(site),arr(named),arr(local)].flat().forEach(x=>{if(!x)return;const k=x.id||`${x.title}|${x.date||''}`;const old=map.get(k);if(!old||Number(x._updatedAt||0)>=Number(old._updatedAt||0))map.set(k,x)});
  local={...(site||{}),...local,sermons:[...map.values()]};
  localStorage.setItem('chm_sitedata',JSON.stringify(local));
  if(typeof window.sLoad==='function')await window.sLoad();
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(hydrate,150));
window.addEventListener('focus',()=>setTimeout(hydrate,100));
})();