/* CHM — True CMS Hero Export/Push Synchronization Fix */
(function(){
'use strict';
function heroFormSettings(){
  const section=document.getElementById('section');
  if(!section||section.value!=='hero')return null;
  const url=String(document.getElementById('mediaUrl')?.value||'').trim();
  return {videoUrl:url,video:url,sourceType:window.CHMHeroVideo?CHMHeroVideo.identify(url).type:'direct',muted:document.getElementById('heroMuted')?.checked!==false,volume:Number(document.getElementById('heroVolume')?.value||0)/100,loop:document.getElementById('heroLoop')?.checked!==false,autoplay:true,_updatedAt:Date.now(),updatedAt:Date.now()};
}
async function syncHeroForm(){
  const s=heroFormSettings();if(!s||!s.videoUrl)return;
  const d=await CHMTrueCMS.loadSiteData();d.site_config=d.site_config||{};d.site_config.hero={...(d.site_config.hero||{}),...s};await CHMTrueCMS.saveLocal(d);
}
const oldExport=window.cmsExportJSON;
window.cmsExportJSON=async function(){await syncHeroForm();return oldExport?oldExport():undefined};
const oldPush=window.cmsPushAll;
window.cmsPushAll=async function(){await syncHeroForm();return oldPush?oldPush():undefined};
const oldImport=window.cmsImportJSON;
window.cmsImportJSON=async function(file){
  if(!file)return;
  try{
    const d=JSON.parse(await file.text());d.site_config=d.site_config||{};d.site_config.hero=d.site_config.hero||{};
    if(d.site_config.hero.videoUrl||d.site_config.hero.video){d.site_config.hero._updatedAt=Date.now();d.site_config.hero.updatedAt=Date.now()}
    await CHMTrueCMS.saveLocal(d);
    const msg=document.getElementById('cmsToolMsg');if(msg)msg.textContent='✅ JSON imported, including the current Hero video. Reloading…';
    setTimeout(()=>location.reload(),700);
  }catch(e){const msg=document.getElementById('cmsToolMsg');if(msg)msg.textContent='❌ '+e.message;else alert(e.message)}
};
})();