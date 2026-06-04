
(function(){
  if(window.CHMAdminButtonFixLoaded) return;
  window.CHMAdminButtonFixLoaded = true;

  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return Array.from(r.querySelectorAll(s))}
  function setStatus(msg,type='info'){
    let el=qs('[data-cms-status]')||qs('.cms-global-status')||qs('.gh-status')||qs('.firebase-status');
    if(!el){
      el=document.createElement('div');
      el.className='cms-global-status';
      el.setAttribute('data-cms-status','true');
      (qs('main')||document.body).prepend(el);
    }
    el.innerHTML=msg;
    el.style.color=type==='error'?'#b91c1c':type==='success'?'#15803d':type==='warning'?'#854d0e':'#0a1f44';
  }

  function collectionFromPage(form){
    const section = qs('#section', form);
    if(section && section.value) return section.value;

    const root = qs('[data-blueprint-crud]');
    if(root){
      const key=root.getAttribute('data-blueprint-crud')||'';
      const map={
        adm_home:'page_content',adm_about:'page_content',adm_give:'page_content',
        adm_teams:'teams',adm_departments:'departments',adm_sacred:'ministries',
        adm_locations:'locations',adm_media_settings:'media_library',
        adm_navigation:'navigation_items',adm_footer:'footer_items',
        adm_languages:'page_content',adm_uploads:'media_library',adm_blueprint:'page_content'
      };
      return map[key]||key.replace(/^adm_/,'')||'page_content';
    }

    const name=(location.pathname.split('/').pop()||'').replace('.html','').toLowerCase();
    const map={
      'adm-announcements':'announcements','adm-events':'events','adm-sermons':'sermons',
      'adm-gallery':'gallery','adm-leaders':'leaders','adm-ministries':'ministries',
      'adm-departments':'departments','adm-teams':'teams','adm-locations':'locations',
      'members':'members','messages':'messages','giving':'givingReports',
      'prayer-requests':'prayer_requests'
    };
    return map[name]||'page_content';
  }

  function formFields(form){
    const fd=Object.fromEntries(new FormData(form).entries());
    return {
      id: fd.id||fd._id||'',
      title: fd.title||fd.name||fd.label||qs('#title',form)?.value||'',
      category: fd.category||fd.role||fd.parentMenu||fd.section||fd.column||qs('#category',form)?.value||'',
      summary: fd.summary||fd.subtitle||fd.description||qs('#summary',form)?.value||'',
      body: fd.body||fd.content||fd.message||qs('#body',form)?.value||'',
      mediaUrl: fd.mediaUrl||fd.imageUrl||fd.photoUrl||fd.videoUrl||fd.audioUrl||qs('#mediaUrl',form)?.value||''
    };
  }

  function fileFromForm(form){
    return qs('input[type="file"]',form)?.files?.[0] || qs('#mediaFile')?.files?.[0] || null;
  }

  async function ensure(){
    if(window.CHMTrueCMS) return true;
    setStatus('CMS engine is still loading. Please wait and press again.','warning');
    return false;
  }

  async function uploadFile(form, fields, col){
    const file=fileFromForm(form);
    if(!file) return fields;
    setStatus('Uploading file globally...','info');
    if(window.CHMTrueCMS?.uploadMedia){
      const url=await window.CHMTrueCMS.uploadMedia(file,col);
      fields.mediaUrl=url; fields.imageUrl=fields.imageUrl||url; fields.photoUrl=fields.photoUrl||url; fields.thumbnailUrl=fields.thumbnailUrl||url;
    }else if(window.uploadFileToCloud){
      const url=await window.uploadFileToCloud(file);
      fields.mediaUrl=url; fields.imageUrl=fields.imageUrl||url;
    }
    return fields;
  }

  async function doSave(form){
    if(!(await ensure())) return;
    const col=collectionFromPage(form);
    let fields=formFields(form);
    fields=await uploadFile(form,fields,col);
    setStatus('Saving draft...','info');
    if(window.CHMTrueCMS?.saveItem) await window.CHMTrueCMS.saveItem(col,fields,'draft');
    else if(window.cmsSave) await window.cmsSave(col,fields.id||'',fields,'draft');
    setStatus('✅ Draft saved successfully.','success');
    if(window.loadRecords) window.loadRecords();
    if(window.chmRefreshBlueprint) window.chmRefreshBlueprint();
  }

  async function doPublish(form){
    if(!(await ensure())) return;
    const col=collectionFromPage(form);
    let fields=formFields(form);
    if(!fields.title){
      setStatus('Please enter a title/name before publishing.','error');
      (qs('[name="title"]',form)||qs('#title',form)||form).focus?.();
      return;
    }
    fields=await uploadFile(form,fields,col);
    setStatus('Publishing globally...','info');

    if(window.CHMTrueCMS?.publishNew){
      if(fields.id && window.CHMTrueCMS.saveItem && window.CHMTrueCMS.publishItem){
        const saved=await window.CHMTrueCMS.saveItem(col,fields,'published');
        await window.CHMTrueCMS.publishItem(col,saved.id||fields.id);
      }else{
        await window.CHMTrueCMS.publishNew(col,fields,null);
      }
    }else if(window.cmsSave && window.cmsPublish){
      const saved=await window.cmsSave(col,fields.id||'',fields,'published');
      await window.cmsPublish(col,saved?.id||fields.id);
    }

    setStatus('✅ Published globally. Public pages will update shortly.','success');
    try{form.reset()}catch(e){}
    if(window.loadRecords) window.loadRecords();
    if(window.chmRefreshBlueprint) window.chmRefreshBlueprint();
  }

  window.publishNow = async function(){
    const form=qs('#globalForm')||qs('#bpForm')||qs('form');
    if(!form) return setStatus('No form was found.','error');
    try{await doPublish(form)}catch(e){setStatus('Publish failed: '+(e.message||e),'error');alert('Publish failed: '+(e.message||e))}
  };

  window.saveDraft = async function(){
    const form=qs('#globalForm')||qs('#bpForm')||qs('form');
    if(!form) return setStatus('No form was found.','error');
    try{await doSave(form)}catch(e){setStatus('Save failed: '+(e.message||e),'error');alert('Save failed: '+(e.message||e))}
  };

  function repair(){
    qsa('button').forEach(btn=>{
      const txt=(btn.textContent||btn.value||'').toLowerCase().trim();
      if(txt.includes('publish globally') || txt==='publish' || txt.includes('publish / post')){
        btn.type='button';
        btn.onclick=function(e){
          e.preventDefault();
          const form=btn.closest('form')||qs('#globalForm')||qs('#bpForm')||qs('form');
          doPublish(form).catch(err=>{setStatus('Publish failed: '+(err.message||err),'error');alert('Publish failed: '+(err.message||err))});
        };
      }
      if(txt.includes('save draft')){
        btn.type='button';
        btn.onclick=function(e){
          e.preventDefault();
          const form=btn.closest('form')||qs('#globalForm')||qs('#bpForm')||qs('form');
          doSave(form).catch(err=>{setStatus('Save failed: '+(err.message||err),'error');alert('Save failed: '+(err.message||err))});
        };
      }
    });

    const pub=qs('#bpPublish'), save=qs('#bpSaveDraft');
    if(pub){pub.type='button'; pub.onclick=(e)=>{e.preventDefault(); doPublish(pub.closest('form')||qs('#bpForm')).catch(err=>alert('Publish failed: '+(err.message||err)))}}
    if(save){save.type='button'; save.onclick=(e)=>{e.preventDefault(); doSave(save.closest('form')||qs('#bpForm')).catch(err=>alert('Save failed: '+(err.message||err)))}}
  }

  document.addEventListener('DOMContentLoaded',()=>{repair(); setTimeout(repair,500); setTimeout(repair,1500);});
  document.addEventListener('click',()=>setTimeout(repair,100),true);
})();
