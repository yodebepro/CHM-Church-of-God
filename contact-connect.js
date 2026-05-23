
/* CHM CONTACT DIRECT CONNECT FIX */
(function(){
  const CHM_EMAIL = "theworldprayerline@outlook.com";

  function attachContactActions(){

    const selectors = [
      'a[href="#contact"]',
      'a[href*="contact"]',
      '.contact-btn',
      '.btn-contact',
      '.connect-btn',
      '.connect-button',
      'button[data-contact]',
      'a[data-contact]'
    ];

    selectors.forEach(sel=>{
      document.querySelectorAll(sel).forEach(el=>{
        el.addEventListener('click', function(){
          const subject = encodeURIComponent("CHM Church Contact");
          const body = encodeURIComponent("Hello CHM Church of God,\n\n");
          window.location.href = `mailto:${CHM_EMAIL}?subject=${subject}&body=${body}`;
        });
      });
    });

    document.querySelectorAll('form').forEach(form=>{
      const txt = (form.innerText || '').toLowerCase();
      const action = (form.getAttribute('action') || '').toLowerCase();

      if(
        txt.includes('contact') ||
        txt.includes('prayer') ||
        txt.includes('message') ||
        action.includes('contact')
      ){
        form.addEventListener('submit', function(e){
          e.preventDefault();

          const fd = new FormData(form);
          let body = "";

          for(const [k,v] of fd.entries()){
            body += `${k}: ${v}\n`;
          }

          const subject = encodeURIComponent("CHM Website Message");
          const emailBody = encodeURIComponent(body);

          window.location.href = `mailto:${CHM_EMAIL}?subject=${subject}&body=${emailBody}`;

          try{
            form.reset();
          }catch(err){}
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', attachContactActions);
})();
