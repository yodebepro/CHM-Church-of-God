
/* CHM DIRECT WEBSITE EMAIL SEND
   Sends contact/prayer messages directly from the website without opening the visitor's email app.
   Uses FormSubmit AJAX endpoint. First use may require inbox confirmation from FormSubmit.
*/
(function(){
  const CHM_ENDPOINT = "https://formsubmit.co/ajax/theworldprayerline@outlook.com";

  function isContactElement(el){
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').toLowerCase();
    const href = (el.getAttribute('href') || '').toLowerCase();
    const cls = (el.className || '').toString().toLowerCase();
    return (
      text.includes('contact') ||
      text.includes('connect') ||
      text.includes('prayer') ||
      href.includes('contact') ||
      href.includes('prayer') ||
      href.startsWith('mailto:') ||
      cls.includes('contact') ||
      cls.includes('connect') ||
      cls.includes('prayer')
    );
  }

  function makeModal(){
    let modal = document.getElementById('chmDirectContactModal');
    if(modal) return modal;

    modal = document.createElement('div');
    modal.id = 'chmDirectContactModal';
    modal.innerHTML = `
      <div class="chm-direct-overlay">
        <div class="chm-direct-box">
          <button class="chm-direct-close" type="button">×</button>
          <h2>Contact CHM Church of God</h2>
          <p>Your message will be sent directly to the church inbox.</p>
          <form id="chmDirectContactForm">
            <input name="name" placeholder="Full Name" required>
            <input name="email" type="email" placeholder="Your Email" required>
            <input name="phone" placeholder="Phone Number">
            <input name="subject" placeholder="Subject" value="CHM Website Contact">
            <textarea name="message" placeholder="Write your message or prayer request here" required></textarea>
            <input type="hidden" name="_captcha" value="false">
            <input type="hidden" name="_template" value="table">
            <input type="hidden" name="_subject" value="CHM Website Message">
            <button type="submit">Send Message</button>
            <div class="chm-direct-status" aria-live="polite"></div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    if(!document.getElementById('chmDirectContactStyles')){
      const style = document.createElement('style');
      style.id = 'chmDirectContactStyles';
      style.textContent = `
        #chmDirectContactModal{display:none;position:fixed;inset:0;z-index:999999;font-family:inherit}
        #chmDirectContactModal.open{display:block}
        .chm-direct-overlay{position:absolute;inset:0;background:rgba(5,18,41,.68);display:flex;align-items:center;justify-content:center;padding:20px}
        .chm-direct-box{width:min(540px,94vw);background:#fff;border-radius:22px;padding:26px;box-shadow:0 25px 80px rgba(0,0,0,.28);position:relative;color:#0a1f44}
        .chm-direct-box h2{margin:0 0 8px;color:#0a1f44}
        .chm-direct-box p{margin:0 0 18px;color:#526173}
        .chm-direct-close{position:absolute;right:16px;top:12px;border:0;background:transparent;font-size:32px;line-height:1;cursor:pointer;color:#0a1f44}
        #chmDirectContactForm{display:grid;gap:12px}
        #chmDirectContactForm input,#chmDirectContactForm textarea{width:100%;padding:13px 14px;border:1px solid #d8e0ec;border-radius:12px;font:inherit}
        #chmDirectContactForm textarea{min-height:140px;resize:vertical}
        #chmDirectContactForm button[type="submit"]{background:#0a1f44;color:#fff;border:0;border-radius:14px;padding:14px 18px;font-weight:800;cursor:pointer}
        .chm-direct-status{font-weight:700;color:#0a1f44;min-height:22px}
        .chm-direct-status.success{color:#0f7a3d}
        .chm-direct-status.error{color:#b42318}
      `;
      document.head.appendChild(style);
    }

    modal.querySelector('.chm-direct-close').addEventListener('click', ()=>modal.classList.remove('open'));
    modal.querySelector('.chm-direct-overlay').addEventListener('click', (e)=>{
      if(e.target.classList.contains('chm-direct-overlay')) modal.classList.remove('open');
    });

    const form = modal.querySelector('#chmDirectContactForm');
    const status = modal.querySelector('.chm-direct-status');

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      status.className = 'chm-direct-status';
      status.textContent = 'Sending...';

      const data = Object.fromEntries(new FormData(form).entries());

      try{
        const res = await fetch(CHM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if(!res.ok) throw new Error('Message could not be sent.');

        status.className = 'chm-direct-status success';
        status.textContent = 'Message sent successfully.';
        form.reset();
        setTimeout(()=>modal.classList.remove('open'), 1800);
      }catch(err){
        status.className = 'chm-direct-status error';
        status.textContent = 'Message could not be sent. Please try again later.';
      }
    });

    return modal;
  }

  function openContactForm(subject){
    const modal = makeModal();
    const subjectInput = modal.querySelector('input[name="subject"]');
    const hiddenSubject = modal.querySelector('input[name="_subject"]');
    if(subject){
      subjectInput.value = subject;
      hiddenSubject.value = subject;
    }
    modal.classList.add('open');
  }

  function attachDirectButtons(){
    document.querySelectorAll('a,button,input[type="button"],input[type="submit"]').forEach(el=>{
      if(isContactElement(el)){
        el.addEventListener('click', function(e){
          const href = (el.getAttribute('href') || '').toLowerCase();
          const isPageLink = href.endsWith('contact.html') || href.endsWith('prayer-request.html');

          if(href.startsWith('mailto:') || el.tagName.toLowerCase()==='button' || el.type==='submit' || href==='' || href==='#' || href.includes('#contact')){
            e.preventDefault();
            openContactForm((el.innerText || '').toLowerCase().includes('prayer') ? 'CHM Prayer Request' : 'CHM Website Contact');
          }
        }, true);
      }
    });
  }

  function attachForms(){
    document.querySelectorAll('form').forEach(form=>{
      const text = (form.innerText || '').toLowerCase();
      const action = (form.getAttribute('action') || '').toLowerCase();

      if(text.includes('contact') || text.includes('message') || text.includes('prayer') || action.includes('contact') || action.includes('mailto')){
        form.removeAttribute('action');
        form.removeAttribute('method');

        form.addEventListener('submit', async function(e){
          e.preventDefault();

          let status = form.querySelector('.chm-form-status');
          if(!status){
            status = document.createElement('div');
            status.className = 'chm-form-status';
            status.style.fontWeight = '700';
            status.style.marginTop = '12px';
            form.appendChild(status);
          }

          status.style.color = '#0a1f44';
          status.textContent = 'Sending...';

          const data = Object.fromEntries(new FormData(form).entries());
          if(!data._subject) data._subject = text.includes('prayer') ? 'CHM Prayer Request' : 'CHM Website Message';
          data._captcha = 'false';
          data._template = 'table';

          try{
            const res = await fetch(CHM_ENDPOINT, {
              method:'POST',
              headers:{'Content-Type':'application/json','Accept':'application/json'},
              body: JSON.stringify(data)
            });

            if(!res.ok) throw new Error('Send failed');

            status.style.color = '#0f7a3d';
            status.textContent = 'Message sent successfully.';
            form.reset();
          }catch(err){
            status.style.color = '#b42318';
            status.textContent = 'Message could not be sent. Please try again later.';
          }
        }, true);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    attachDirectButtons();
    attachForms();
  });
})();
