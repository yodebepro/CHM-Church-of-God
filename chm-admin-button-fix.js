(function(){
  if(window.CHMAdminButtonFixLoaded) return;
  window.CHMAdminButtonFixLoaded = true;

  function qs(s,r){ r=r||document; return r?r.querySelector(s):null; }
  function qsa(s,r){ r=r||document; return r?Array.from(r.querySelectorAll(s)):[]; }

  function setStatus(msg,type){
    var el=qs('[data-cms-status]')||qs('.cms-global-status')||qs('.gh-status')||qs('.firebase-status');
    if(!el){el=document.createElement('div');el.className='cms-global-status';el.setAttribute('data-cms-status','true');(qs('main')||document.body).prepend(el);}
    el.innerHTML=msg;
    el.style.color=type==='error'?'#b91c1c':type==='success'?'#15803d':type==='warning'?'#854d0e':'#0a1f44';
  }

  function collectionFromPage(form){
    var section=qs('#section',form); if(section&&section.value)return section.value;
    var root=qs('[data-blueprint-crud]');
    if(root){var key=root.getAttribute('data-blueprint-crud')||'';var map={adm_home:'page_content',adm_about:'page_content',adm_give:'page_content',adm_teams:'teams',adm_departments:'departments',adm_sacred:'ministries',adm_locations:'locations',adm_media_settings:'media_library',adm_navigation:'navigation_items',adm_footer:'footer_items',adm_languages:'page_content',adm_uploads:'media_library',adm_blueprint:'page_content'};return map[key]||key.replace(/^adm_/,'')||'page_content';}
    var name=(location.pathname.split('/').pop()||'').replace('.html','').toLowerCase();
    var map={'adm-announcements':'announcements','adm-events':'events','adm-sermons':'sermons','adm-gallery':'gallery','adm-leaders':'leaders','adm-ministries':'ministries','adm-departments':'departments','adm-teams':'teams','adm-locations':'locations','members':'members','messages':'messages','giving':'givingReports','prayer-requests':'prayer_requests'};
    return map[name]||'page_content';
  }

  function formFields(form){
    if(!form)return{id:'',title:'',category:'',summary:'',body:'',mediaUrl:''};
    var fd={}; try{fd=Object.fromEntries(new FormData(form).entries());}catch(e){}
    return{id:fd.id||fd._id||'',title:fd.title||fd.name||fd.label||qs('#title',form)?.value||'',category:fd.category||fd.role||qs('#category',form)?.value||'',summary:fd.summary||fd.subtitle||qs('#summary',form)?.value||'',body:fd.body||fd.content||qs('#body',form)?.value||'',mediaUrl:fd.mediaUrl||fd.imageUrl||fd.photoUrl||qs('#mediaUrl',form)?.value||''};
  }

  function fileFromForm(form){
    return (form&&qs('input[type="file"]',form)?.files?.[0])||qs('#mediaFile')?.files?.[0]||null;
  }

  async function ensure(){if(window.CHMTrueCMS)return true;setStatus('CMS engine loading. Please wait a moment and try again.','warning');return false;}

  async function uploadFile(form,fields,col){
    var file=fileFromForm(form); if(!file)return fields;
    setStatus('Uploading file…','info');
    if(window.CHMTrueCMS?.uploadMedia){var url=await window.CHMTrueCMS.uploadMedia(file,col);fields.mediaUrl=url;fields.imageUrl=fields.imageUrl||url;fields.photoUrl=fields.photoUrl||url;fields.thumbnailUrl=fields.thumbnailUrl||url;}
    else if(window.uploadFileToCloud){var url=await window.uploadFileToCloud(file);fields.mediaUrl=url;fields.imageUrl=fields.imageUrl||url;}
    return fields;
  }

  async function doSave(form){
    if(!form){setStatus('No form found.','error');return;}
    if(!(await ensure()))return;
    var col=collectionFromPage(form);var fields=formFields(form);
    fields=await uploadFile(form,fields,col);
    setStatus('Saving draft…','info');
    if(window.CHMTrueCMS?.saveItem)await window.CHMTrueCMS.saveItem(col,fields,'draft');
    else if(window.cmsSave)await window.cmsSave(col,fields.id||'',fields,'draft');
    setStatus('✅ Draft saved.','success');
    if(window.loadRecords)window.loadRecords();
  }

  async function doPublish(form){
    if(!form){setStatus('No form found.','error');return;}
    if(!(await ensure()))return;
    var col=collectionFromPage(form);var fields=formFields(form);
    if(!fields.title){setStatus('Please enter a title before publishing.','error');return;}
    fields=await uploadFile(form,fields,col);
    setStatus('Publishing globally…','info');
    if(window.CHMTrueCMS?.publishNew){
      if(fields.id&&window.CHMTrueCMS.saveItem&&window.CHMTrueCMS.publishItem){var saved=await window.CHMTrueCMS.saveItem(col,fields,'published');await window.CHMTrueCMS.publishItem(col,saved.id||fields.id);}
      else await window.CHMTrueCMS.publishNew(col,fields,null);
    }else if(window.cmsSave&&window.cmsPublish){var saved=await window.cmsSave(col,fields.id||'',fields,'published');await window.cmsPublish(col,saved?.id||fields.id);}
    setStatus('✅ Published globally. Public pages will update shortly.','success');
    try{form.reset();}catch(e){}
    if(window.loadRecords)window.loadRecords();
  }

  window.publishNow=async function(){
    var form=qs('#globalForm')||qs('#bpForm')||qs('form');
    if(!form)return setStatus('No form found.','error');
    try{await doPublish(form);}catch(e){setStatus('Publish failed: '+(e.message||e),'error');alert('Publish failed: '+(e.message||e));}
  };
  window.saveDraft=async function(){
    var form=qs('#globalForm')||qs('#bpForm')||qs('form');
    if(!form)return setStatus('No form found.','error');
    try{await doSave(form);}catch(e){setStatus('Save failed: '+(e.message||e),'error');}
  };

  /* KEY FIX: Only intercept buttons that do NOT already have onclick wired in HTML.
     Pages like adm-leaders, adm-events etc. already have their own onclick handlers.
     Overwriting them caused "Cannot read properties of null (reading 'querySelector')" */
  function repair(){
    var hasOwnSaveFns = ['lSave','dSave','mnSave','tSave','aSave','eSave','sSave','gSave']
      .some(function(fn){ return typeof window[fn]==='function'; });

    qsa('button').forEach(function(btn){
      if(btn.getAttribute('onclick')) return; // already has own handler — never touch
      if(hasOwnSaveFns) return;               // page has custom save system — leave alone
      var txt=(btn.textContent||'').toLowerCase().trim();
      if(txt.includes('publish globally')||txt==='publish'||txt.includes('publish / post')){
        btn.type='button';
        btn.onclick=function(e){e.preventDefault();var form=btn.closest('form')||qs('#globalForm')||qs('#bpForm');doPublish(form).catch(function(err){setStatus('Publish failed: '+(err.message||err),'error');alert('Publish failed: '+(err.message||err));});};
      }
      if(txt.includes('save draft')){
        btn.type='button';
        btn.onclick=function(e){e.preventDefault();var form=btn.closest('form')||qs('#globalForm')||qs('#bpForm');doSave(form).catch(function(err){setStatus('Save failed: '+(err.message||err),'error');});};
      }
    });

    if(hasOwnSaveFns) return;
    var pub=qs('#bpPublish'),save=qs('#bpSaveDraft');
    if(pub&&!pub.getAttribute('onclick')){pub.type='button';pub.onclick=function(e){e.preventDefault();doPublish(pub.closest('form')||qs('#bpForm')).catch(function(err){alert('Publish failed: '+(err.message||err));});};}
    if(save&&!save.getAttribute('onclick')){save.type='button';save.onclick=function(e){e.preventDefault();doSave(save.closest('form')||qs('#bpForm')).catch(function(err){setStatus('Save failed: '+(err.message||err),'error');});};}
  }

  document.addEventListener('DOMContentLoaded',function(){repair();setTimeout(repair,500);setTimeout(repair,1500);});
  document.addEventListener('click',function(){setTimeout(repair,100);},true);
})();
