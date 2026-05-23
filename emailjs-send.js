/* CHM CHURCH OF GOD — EmailJS Direct Send v1
   Sends all forms directly to inbox — no email app ever opens.
   Load this on every public page that has a form. */

(function() {
  'use strict';

  var EJS = {
    get service()  { return localStorage.getItem('chm_ejs_service')  || ''; },
    get template() { return localStorage.getItem('chm_ejs_template') || ''; },
    get key()      { return localStorage.getItem('chm_ejs_key')      || ''; },
    get email()    { return localStorage.getItem('chm_ejs_email')    || 'yodebepro@gmail.com'; },
    get ready()    { return !!(this.service && this.template && this.key); }
  };

  /* Initialize EmailJS */
  function initEJS() {
    if (!EJS.ready) return false;
    if (typeof emailjs !== 'undefined') {
      emailjs.init(EJS.key);
      return true;
    }
    return false;
  }

  /* Core send function — used by all forms */
  window.ejsSend = async function(params) {
    if (!initEJS()) {
      console.log('[CHM EmailJS] Not configured — check emailjs-setup.html');
      return { ok: false, reason: 'not_configured' };
    }
    try {
      await emailjs.send(EJS.service, EJS.template, {
        from_name:  params.name  || 'Website Visitor',
        from_email: params.email || 'noreply@chmchurch.org',
        phone:      params.phone || '',
        subject:    params.subject || 'Message from CHM Website',
        message:    params.message || '',
        to_email:   EJS.email
      });
      return { ok: true };
    } catch(e) {
      console.error('[CHM EmailJS] Send error:', e);
      return { ok: false, reason: e.text || e.message || 'send_error' };
    }
  };

  window.ejsReady = function() { return EJS.ready; };
  window.ejsEmail = function() { return EJS.email; };

})();
