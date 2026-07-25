/* CHM refresh-safe named JSON persistence v2 */
(function(){
 async function fetchJSON(n){try{const r=await fetch(n+'?_='+Date.now(),{cache:'no-store'});return r.ok?await r.json():null}catch(e){return null}}
 const named={sermons:'chm-sermons.json',gallery:'chm-gallery.json',departments:'chm-departments.json',teams:'chm-teams.json'};
 async function mergeNamed(){
   if(typeof loadData!=='function'||typeof saveLocal!=='function')return;
   const d=await loadData(); let changed=false;
   for(const [col,file] of Object.entries(named)){
     const j=await fetchJSON(file); const arr=Array.isArray(j?.[col])?j[col]:[];
     if(arr.length){
       const map=new Map((d[col]||[]).map(x=>[x.id||((x.title||x.name||'')+'|'+(x.date||'')),x]));
       arr.forEach(x=>{const k=x.id||((x.title||x.name||'')+'|'+(x.date||'')); if(!map.has(k)){map.set(k,x);changed=true}});
       d[col]=Array.from(map.values());
     }
   }
   if(changed)await saveLocal(d);
 }
 document.addEventListener('DOMContentLoaded',async()=>{try{window._data=null;await mergeNamed();for(const n of ['sLoad','gLoad','dLoad','tLoad','msgLoad','prLoad','gvLoad'])if(typeof window[n]==='function')await window[n]()}catch(e){console.warn('[CHM persistence]',e)}});
})();