/* CHM sermon media compatibility */
(function(){
 function yt(u){const m=String(u||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{6,})/i);return m?m[1]:''}
 function drive(u){const m=String(u||'').match(/(?:file\/d\/|videos\/d\/|[?&]id=)([\w-]{10,})/i);return m?m[1]:''}
 window.CHMOpenSermonMedia=function(url,type){const y=yt(url),d=drive(url);if(y){window.open('https://www.youtube.com/watch?v='+y,'_blank');return}if(d){if(type==='audio')window.open('https://drive.google.com/uc?export=download&id='+d,'_blank');else window.open('https://drive.google.com/file/d/'+d+'/preview','_blank');return}window.open(url,'_blank')}
})();