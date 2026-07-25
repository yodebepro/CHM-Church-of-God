
const MC='media_sources';
let currentDest='listen';
const NOTES={
 listen:'Listen Live uses an audio playlist. “CHM Live Service” remains protected as item #1. Add other audio streams, uploaded files, Google Drive audio, MP3, M3U, or M3U8 sources beneath it.',
 watch:'Watch Live uses a video/stream player. Add permanent live links, YouTube, Vimeo, Google Drive, M3U8/HLS, M3U, MP4/WebM, iframe URLs, or full iframe embed code.',
 media:'General Media stores reusable media sources without changing the default Listen Live or Watch Live player.'
};
function cleanMediaUrl(v){const s=String(v||'').trim(),m=s.match(/<iframe[^>]+src=["']([^"']+)["']/i)||s.match(/<source[^>]+src=["']([^"']+)["']/i);return m?m[1]:s}
function nurl(x){return x.url||x.permanentUrl||x.embedUrl||x.mediaUrl||x.videoUrl||x.audioUrl||''}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function switchMediaTab(dest){
 currentDest=dest;document.getElementById('mDest').value=dest;
 document.querySelectorAll('.media-tab').forEach(b=>b.classList.toggle('active',b.dataset.dest===dest));
 document.getElementById('listenFields').style.display=dest==='listen'?'block':'none';
 document.getElementById('watchFields').style.display=dest==='watch'?'block':'none';
 document.getElementById('destNote').textContent=NOTES[dest];
 document.getElementById('mTitle').textContent='Add '+(dest==='listen'?'Listen Live':dest==='watch'?'Watch Live':'General Media')+' Source';
 document.getElementById('savedTitle').textContent='Saved '+(dest==='listen'?'Listen Live':dest==='watch'?'Watch Live':'General Media')+' Sources';
 await mLoad();mClear(false);
}
async function mLoad(){
 const d=await loadData();
 const a=(d[MC]||[]).filter(x=>(x.destination||'media')===currentDest).sort((x,y)=>(Number(y.isPrimary||y.primary)-Number(x.isPrimary||x.primary))||(Number(x.order)||999)-(Number(y.order)||999));
 document.getElementById('savedCount').textContent=a.length;
 const rows=document.getElementById('mRows');
 rows.innerHTML='';
 if(!a.length){
   rows.innerHTML='<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted)">No saved sources for this section.</td></tr>';
   return;
 }
 a.forEach(x=>{
   const tr=document.createElement('tr');
   const tdTitle=document.createElement('td');
   tdTitle.innerHTML='<strong>'+esc(x.title||'Untitled')+'</strong> '+(x.id==='chm-live-service'?'<span class="protected">Protected #1</span>':'')+'<br><small>'+esc(x.category||x.description||'')+'</small>';
   const tdOrder=document.createElement('td');tdOrder.textContent=String(x.order||'')+((x.isPrimary||x.primary)?' · Default':'');
   const tdStatus=document.createElement('td');tdStatus.innerHTML='<span class="pill">'+esc(x._status||x.status||'draft')+'</span>';
   const tdActions=document.createElement('td');
   const edit=document.createElement('button');edit.className='act act-edit';edit.textContent='Edit';edit.onclick=()=>mEdit(x.id);tdActions.appendChild(edit);
   const archive=document.createElement('button');archive.className='act act-archive';archive.textContent='Archive';archive.style.marginLeft='.35rem';archive.onclick=()=>mStatus(x.id,'archived');tdActions.appendChild(archive);
   if(x.id!=='chm-live-service'){
     const del=document.createElement('button');del.className='act act-delete';del.textContent='Delete';del.style.marginLeft='.35rem';del.onclick=()=>mDelete(x.id);tdActions.appendChild(del);
   }
   tr.append(tdTitle,tdOrder,tdStatus,tdActions);rows.appendChild(tr);
 });
}
function mClear(resetDest=true){
 ['mId','mName','mCategory','mUrl','mArtist','mDuration','mPoster','mDesc'].forEach(i=>{const e=document.getElementById(i);if(e)e.value=''});
 document.getElementById('mFile').value='';document.getElementById('mOrder').value=currentDest==='listen'?2:1;document.getElementById('mPrimary').checked=false;
 document.getElementById('mAutoplay').checked=true;document.getElementById('mMuted').checked=true;
 document.getElementById('mStreamType').value='Auto Detect';
 document.getElementById('mTitle').textContent='Add '+(currentDest==='listen'?'Listen Live':currentDest==='watch'?'Watch Live':'General Media')+' Source';
}
async function mSave(status){
 let url=cleanMediaUrl(document.getElementById('mUrl').value);
 const f=document.getElementById('mFile').files[0];if(f)url=await CHMTrueCMS.uploadMedia(f,'media');
 const title=document.getElementById('mName').value.trim();
 if(!title||!url){alert('Title and source link or uploaded file are required.');return}
 const d=await loadData();if(!Array.isArray(d[MC]))d[MC]=[];
 const id=document.getElementById('mId').value||Date.now().toString(36);
 const isProtected=id==='chm-live-service';
 const isPrimary=isProtected?true:document.getElementById('mPrimary').checked;
 if(isPrimary)d[MC].forEach(x=>{if(x.destination===currentDest&&x.id!==id){x.isPrimary=false;x.primary=false}});
 const old=d[MC].find(x=>x.id===id)||{};
 const obj={...old,id,title,category:document.getElementById('mCategory').value,destination:currentDest,url,permanentUrl:url,embedUrl:url,mediaUrl:url,videoUrl:url,audioUrl:url,artist:document.getElementById('mArtist').value,duration:document.getElementById('mDuration').value,streamType:document.getElementById('mStreamType').value,posterUrl:document.getElementById('mPoster').value,autoplay:document.getElementById('mAutoplay').checked,muted:document.getElementById('mMuted').checked,description:document.getElementById('mDesc').value,order:isProtected?1:(Number(document.getElementById('mOrder').value)||1),isPrimary,primary:isPrimary,_status:status,status,archived:status==='archived',_updatedAt:Date.now()};
 const i=d[MC].findIndex(x=>x.id===id);if(i>=0)d[MC][i]=obj;else d[MC].push(obj);
 await saveLocal(d);
 if(status==='published'){try{await CHMTrueCMS.pushSiteData()}catch(e){alert('Saved on this page. GitHub push requires a valid token.')}} 
 await mLoad();mClear(false);
 alert(status==='published'?'Published and saved.':'Draft saved.');
}
async function mEdit(id){
 const d=await loadData(),x=(d[MC]||[]).find(x=>x.id===id);if(!x)return;
 if((x.destination||'media')!==currentDest)await switchMediaTab(x.destination||'media');
 document.getElementById('mId').value=x.id;document.getElementById('mName').value=x.title||'';document.getElementById('mCategory').value=x.category||'';document.getElementById('mUrl').value=nurl(x);document.getElementById('mArtist').value=x.artist||'';document.getElementById('mDuration').value=x.duration||'';document.getElementById('mPoster').value=x.posterUrl||'';document.getElementById('mDesc').value=x.description||'';document.getElementById('mOrder').value=x.order||1;document.getElementById('mPrimary').checked=!!(x.isPrimary||x.primary);document.getElementById('mAutoplay').checked=x.autoplay!==false;document.getElementById('mMuted').checked=x.muted!==false;document.getElementById('mStreamType').value=x.streamType||'Auto Detect';document.getElementById('mTitle').textContent='Edit '+(currentDest==='listen'?'Listen Live':currentDest==='watch'?'Watch Live':'General Media')+' Source';
}
async function mStatus(id,s){const d=await loadData(),x=(d[MC]||[]).find(x=>x.id===id);if(x){x._status=x.status=s;x.archived=s==='archived';x._updatedAt=Date.now();await saveLocal(d);await mLoad()}}
async function mDelete(id){if(id==='chm-live-service')return alert('CHM Live Service #1 is protected.');if(!confirm('Delete this source?'))return;const d=await loadData();d[MC]=(d[MC]||[]).filter(x=>x.id!==id);await saveLocal(d);await mLoad()}
function downloadJson(name,obj){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
async function mExportCurrent(){const d=await loadData();downloadJson(`chm-${currentDest}-sources.json`,{media_sources:(d[MC]||[]).filter(x=>(x.destination||'media')===currentDest)})}
async function mExportAll(){const d=await loadData();downloadJson('chm-media-sources.json',{media_sources:d[MC]||[]})}
async function mImportJSON(f){if(!f)return;try{const j=JSON.parse(await f.text()),incoming=j.media_sources||j;if(!Array.isArray(incoming))throw new Error('JSON must contain a media_sources array.');const d=await loadData();if(!Array.isArray(d[MC]))d[MC]=[];for(const x of incoming){const i=d[MC].findIndex(y=>y.id===x.id);if(i>=0)d[MC][i]=x;else d[MC].push(x)}await saveLocal(d);await mLoad();alert('JSON imported and saved.')}catch(e){alert('Import failed: '+e.message)}finally{document.getElementById('mImport').value=''}}
async function pushAllMedia(){try{await CHMTrueCMS.pushSiteData();alert('All media settings pushed to GitHub.')}catch(e){alert('Push failed: '+e.message)}}
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.media-tab').forEach(btn=>btn.addEventListener('click',()=>switchMediaTab(btn.dataset.dest)));switchMediaTab('listen');});
