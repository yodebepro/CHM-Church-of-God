/* CHM — About Editor Tabs Fix */
(function(){
'use strict';
function activate(name,btn){
  document.querySelectorAll('.tab-nav .tab-btn').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false')});
  document.querySelectorAll('.tab-pane').forEach(p=>{p.classList.remove('active');p.hidden=true});
  const pane=document.getElementById('tab-'+name);if(!pane)return;
  pane.hidden=false;pane.classList.add('active');
  if(btn){btn.classList.add('active');btn.setAttribute('aria-selected','true')}
  try{sessionStorage.setItem('chm_about_active_tab',name)}catch(e){}
}
function init(){
  const nav=document.querySelector('.tab-nav');if(!nav)return;
  const buttons=Array.from(nav.querySelectorAll('.tab-btn'));
  buttons.forEach(btn=>{
    btn.type='button';
    const m=(btn.getAttribute('onclick')||'').match(/switchTab\(this,'([^']+)'\)/);
    const name=btn.dataset.tab||m?.[1];if(!name)return;
    btn.dataset.tab=name;btn.removeAttribute('onclick');
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();activate(name,btn)});
    btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(name,btn)}});
  });
  const saved=(()=>{try{return sessionStorage.getItem('chm_about_active_tab')}catch(e){return''}})();
  const first=buttons.find(b=>b.dataset.tab===saved)||buttons.find(b=>b.classList.contains('active'))||buttons[0];
  if(first)activate(first.dataset.tab,first);
  window.switchTab=function(btn,name){activate(name,btn)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();