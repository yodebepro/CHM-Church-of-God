
(function(){
if(window.CHMTrueCMSEngineLoaded)return; window.CHMTrueCMSEngineLoaded=true;
const DEFAULT={owner:'yodebepro',repo:'CHM-Church-of-God',branch:'main'};
window.CHM_CMS_COLLECTIONS={hero:'hero',leaders:'leaders',gallery:'gallery',events:'events',announcements:'announcements',sermons:'sermons',ministries:'ministries',departments:'departments',teams:'teams',locations:'locations',pages:'page_content'};
function gh(){return{token:localStorage.getItem('chm_gh_token')||'',owner:localStorage.getItem('chm_gh_owner')||DEFAULT.owner,repo:localStorage.getItem('chm_gh_repo')||DEFAULT.repo,branch:localStorage.getItem('chm_gh_branch')||DEFAULT.branch};}
function status(m,t='info'){document.querySelectorAll('.gh-status,.cms-global-status,.firebase-status,[data-cms-status]').forEach(e=>{e.innerHTML=m;e.style.color=t==='success'?'#15803d':t==='error'?'#b91c1c':t==='warning'?'#854d0e':'#0a1f44';}); if(window.toast)try{window.toast(m.replace(/<[^>]+>/g,''),t==='success'?'success':t==='error'?'error':'warning')}catch(e){}}
async function b64(file){return await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||String(r.result));r.onerror=rej;r.readAsDataURL(file);});}
async function dataurl(file){return await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=rej;r.readAsDataURL(file);});}
function safe(n){return String(n||'upload.bin').replace(/[^a-zA-Z0-9._-]/g,'-').replace(/-+/g,'-').slice(0,120)||'upload.bin';}
function folder(f){const t=f.type||''; if(t.startsWith('image/'))return'images'; if(t.startsWith('video/'))return'videos'; if(t.startsWith('audio/'))return'audio'; return'files';}
function raw(path){const g=gh();return`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${g.branch}/${path}`;}
async function getFile(path){const g=gh();const r=await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}?ref=${g.branch}`,{headers:{Authorization:`token ${g.token}`,Accept:'application/vnd.github.v3+json'}});return r.ok?await r.json():null;}
async function putFile(path,content,message){const g=gh(); if(!g.token)throw new Error('Missing GitHub token. Open github-setup.html and save the token once.'); let sha=''; const ex=await getFile(path); if(ex&&ex.sha)sha=ex.sha; const r=await fetch(`https://api.github.com/repos/${g.owner}/${g.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}`,{method:'PUT',headers:{Authorization:`token ${g.token}`,'Content-Type':'application/json',Accept:'application/vnd.github.v3+json'},body:JSON.stringify({message:message||('CHM CMS update: '+path),content,sha:sha||undefined,branch:g.branch})}); if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.message||('GitHub write failed: '+r.status));} return await r.json();}
function empty(){return{_version:3,_updated:'',hero:[],leaders:[],leadership:[],announcements:[],events:[],sermons:[],gallery:[],media_library:[],ministries:[],departments:[],teams:[],locations:[],page_content:[],navigation_items:[],footer_items:[],prayer_requests:[],messages:[],givingReports:[],giving:[],members:[],site_config:{colors:{},church_info:{},hero:{},service_times:{},page_home:{},page_about:{},page_footer:{},navigation:{},footer_nav:{},social:{},watch_live:{}}};}
function ensure(d){['hero','leaders','leadership','announcements','events','sermons','gallery','media_library','ministries','departments','teams','locations','page_content','navigation_items','footer_items','prayer_requests','messages','givingReports','giving','members'].forEach(c=>{if(!Array.isArray(d[c]))d[c]=[]}); if(!d.site_config)d.site_config={}; return d;}
async function load(){if(window._data)return window._data; const g=gh(); const local=localStorage.getItem('chm_sitedata'); if(local)try{window._data=JSON.parse(local)}catch(e){}; for(const u of[`https://raw.githubusercontent.com/${g.owner}/${g.repo}/${g.branch}/site-data.json?_=${Date.now()}`,`https://cdn.jsdelivr.net/gh/${g.owner}/${g.repo}@${g.branch}/site-data.json?_=${Date.now()}`]){try{const r=await fetch(u,{cache:'no-store'});if(r.ok){const fresh=await r.json(); if(!window._data||(fresh._updated||'')>=(window._data._updated||'')){window._data=ensure(fresh); localStorage.setItem('chm_sitedata',JSON.stringify(window._data));} return window._data;}}catch(e){}} if(!window._data)window._data=empty(); return ensure(window._data);}
async function saveLocal(d){d=d||window._data||await load(); d._updated=new Date().toISOString(); ensure(d); window._data=d; localStorage.setItem('chm_sitedata',JSON.stringify(d)); localStorage.setItem('chm_sd_bk',JSON.stringify(d)); return d;}
async function push(){const d=await saveLocal(); const content=btoa(unescape(encodeURIComponent(JSON.stringify(d,null,2)))); await putFile('site-data.json',content,'CHM CMS: publish site data'); status('✅ Published globally. Public pages will update shortly.','success'); return true;}
async function upload(file, section='general') {
  if (!file) return '';

  const MB = file.size / (1024 * 1024);

  /* ─── Size guard ─────────────────────────────────────────────── */
  if (MB > 100) {
    throw new Error(
      'File is ' + MB.toFixed(1) + ' MB — too large to embed. '
      + 'For videos/audio over 100 MB, paste a direct URL (YouTube, '
      + 'SoundCloud, Vimeo, Google Drive direct link) instead.'
    );
  }

  /* Large-file warning (console only — caller handles UI) */
  if (MB > 10) {
    console.warn('[CHM upload] Large file ' + MB.toFixed(1) + ' MB — '
      + 'will be embedded as base64 in JSON. '
      + 'Consider hosting large videos on YouTube/Vimeo.');
  }

  /* Convert to base64 data URL — works for images, audio, video */
  return await dataurl(file);
}
function norm(col,item,status='published'){const now=Date.now(); const media=item.mediaUrl||item.imageUrl||item.photoUrl||item.thumbnailUrl||item.videoUrl||item.audioUrl||''; return{...item,id:item.id||(Date.now().toString(36)+Math.random().toString(36).slice(2,7)),collection:col,_status:status,status,archived:status==='archived',mediaUrl:media,imageUrl:item.imageUrl||media,photoUrl:item.photoUrl||media,thumbnailUrl:item.thumbnailUrl||media,_updatedAt:now,updatedAt:now,_publishedAt:status==='published'?now:(item._publishedAt||''),publishedAt:status==='published'?now:(item.publishedAt||'')};}
function mirror(col,item){try{const f=JSON.parse(localStorage.getItem('chm_public_feed')||'{}'); if(!f[col])f[col]=[]; const i=f[col].findIndex(x=>x.id===item.id); if(i>=0)f[col][i]=item; else f[col].unshift(item); localStorage.setItem('chm_public_feed',JSON.stringify(f));}catch(e){}}
async function saveItem(col,item,status='draft'){const d=ensure(await load()); const doc=norm(col,item,status); const i=d[col].findIndex(x=>x.id===doc.id); if(i>=0)d[col][i]=doc; else d[col].unshift(doc); await saveLocal(d); mirror(col,doc); return doc;}
async function publishItem(col,id){const d=ensure(await load()); const i=(d[col]||[]).findIndex(x=>x.id===id); if(i<0)throw new Error('Item not found.'); d[col][i]=norm(col,d[col][i],'published'); await saveLocal(d); mirror(col,d[col][i]); return await push();}
async function publishNew(col,fields,file){status('Publishing globally...','info'); let media=fields.mediaUrl||fields.imageUrl||''; if(file)media=await upload(file,col); const item=await saveItem(col,{...fields,mediaUrl:media,imageUrl:media},'published'); await push(); return item;}
window.loadData=load; window.saveLocal=saveLocal; window.pushToGitHub=push; window.uploadFileToCloud = async (file, el) => {
  if (!file) return null;

  const mb  = (file.size / 1024 / 1024).toFixed(1);
  const type = file.type.startsWith('video/') ? 'Video'
             : file.type.startsWith('audio/') ? 'Audio'
             : 'Photo';

  try {
    /* Size pre-check before reading the file */
    if (parseFloat(mb) > 100) {
      const msg = '❌ ' + type + ' is ' + mb + ' MB (too large to embed). '
        + 'Please paste a direct URL instead:<br>'
        + '<small>YouTube share link, SoundCloud URL, Google Drive direct link, etc.</small>';
      if (el) el.innerHTML = msg;
      return null;
    }

    if (el) {
      el.innerHTML = (parseFloat(mb) > 10 ? '⏳ ' : '⏳ ')
        + 'Loading ' + type + ': <b>' + file.name + '</b> (' + mb + ' MB)…'
        + (parseFloat(mb) > 10
          ? '<br><small>Large file — this may take a few seconds…</small>'
          : '');
    }

    const url = await upload(file, 'admin');

    if (el) {
      el.innerHTML = '✅ ' + type + ' loaded: <b>' + file.name + '</b> (' + mb + ' MB)<br>'
        + 'Save the form then click <b>📤 Export JSON</b> → upload to GitHub → '
        + 'goes live globally 🌐';
    }
    return url;

  } catch (e) {
    if (el) {
      el.innerHTML = '❌ ' + e.message + '<br>'
        + '<small>Tip: For large videos, paste a YouTube or Vimeo URL in the URL field instead.</small>';
    }
    return null;
  }
}; window.uploadPhoto=window.uploadFileToCloud;
window.cmsSave=async(col,id,fields,status='draft')=>await saveItem(col,{...fields,id},status);
window.cmsPublish=async(col,id)=>await publishItem(col,id);
window.cmsArchive=async(col,id)=>{const d=ensure(await load()); const i=(d[col]||[]).findIndex(x=>x.id===id); if(i>=0)d[col][i]=norm(col,d[col][i],'archived'); await saveLocal(d); return await push();};
window.cmsDelete=async(col,id)=>{const d=ensure(await load()); if(Array.isArray(d[col]))d[col]=d[col].filter(x=>x.id!==id); await saveLocal(d); return await push();};
window.cfgSave=async(section,fields)=>{const d=ensure(await load()); if(!d.site_config)d.site_config={}; d.site_config[section]={...fields,_updatedAt:Date.now(),updatedAt:Date.now()}; await saveLocal(d); return await push();};
window.cfgGet=async(section)=>((await load()).site_config||{})[section]||{};
window.CHMTrueCMS={loadSiteData:load,saveLocal,pushSiteData:push,uploadMedia:upload,saveItem,publishItem,publishNew,setStatus:status,getGH:gh};
})();


(function(){
if(window.CHMCollectionAliasSyncLoaded)return;window.CHMCollectionAliasSyncLoaded=true;
const aliasMap={leadership:'leaders',leaders:'leadership',prayerRequests:'prayer_requests',prayer_requests:'prayerRequests',giving:'givingReports',givingReports:'giving',media_library:'gallery'};
async function syncAlias(collection,item){try{if(!window.CHMTrueCMS||!window.CHMTrueCMS.loadSiteData)return;const alias=aliasMap[collection];if(!alias)return;const data=await window.CHMTrueCMS.loadSiteData();if(!Array.isArray(data[alias]))data[alias]=[];const idx=data[alias].findIndex(x=>x.id===item.id);const clone={...item,collection:alias};if(idx>=0)data[alias][idx]=clone;else data[alias].unshift(clone);await window.CHMTrueCMS.saveLocal(data)}catch(e){}}
const oldSave=window.cmsSave;if(typeof oldSave==='function'){window.cmsSave=async function(col,id,fields,status){const item=await oldSave(col,id,fields,status);await syncAlias(col,item||{...fields,id});return item}}
if(window.CHMTrueCMS&&window.CHMTrueCMS.saveItem){const oldSaveItem=window.CHMTrueCMS.saveItem;window.CHMTrueCMS.saveItem=async function(col,item,status){const saved=await oldSaveItem(col,item,status);await syncAlias(col,saved||item);return saved}}
})();
