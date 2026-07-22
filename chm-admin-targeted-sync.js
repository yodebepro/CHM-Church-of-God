/* CHM admin targeted sync repair */
(function(){
'use strict';
async function syncCollection(col){
  if(!window.CHMTrueCMS)throw new Error('CMS publishing engine is not loaded.');
  const d=await CHMTrueCMS.loadSiteData();
  await CHMTrueCMS.saveLocal(d);
  return await CHMTrueCMS.pushSiteData(col);
}
window.CHMRepairSync=syncCollection;
window.CHMRepairUpload=async function(file,section,statusEl){
  if(!file)return'';
  try{if(statusEl)statusEl.textContent='Uploading '+file.name+'…';const url=await CHMTrueCMS.uploadMedia(file,section);if(statusEl)statusEl.textContent='✅ Uploaded. Save Draft or Publish Globally.';return url}catch(e){if(statusEl)statusEl.textContent='❌ '+e.message;throw e}
};
})();