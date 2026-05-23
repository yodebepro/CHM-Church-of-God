/* CHM CHURCH OF GOD — Direct Contact & Connect Handler
   All buttons send directly to inbox — no email app opens.
   Powered by EmailJS */

(function() {
  'use strict';

  var CHM_PHONE = '973-855-2396';
  var CHM_EMAIL = 'yodebepro@gmail.com';

  /* Intercept Connect / Contact button clicks site-wide */
  function interceptConnectButtons() {
    /* Selectors that should trigger contact modal instead of navigating */
    var triggers = [
      'a[href="connect.html"]',
      'a[href="contact.html"]',
      '.connect-btn',
      '.connect-button',
      'a[data-contact]',
      'button[data-contact]',
      '.header-cta'
    ];

    triggers.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        /* Don't intercept — just make sure they go to contact.html */
        if (el.getAttribute('href') === 'connect.html') {
          el.setAttribute('href', 'contact.html');
        }
      });
    });
  }

  /* Footer email links — make them open contact page not mailto: */
  function fixFooterEmailLinks() {
    document.querySelectorAll('a[href^="mailto:"]').forEach(function(el) {
      var email = el.getAttribute('href');
      if (!email || email === 'mailto:') {
        /* Empty mailto — replace with contact page */
        el.setAttribute('href', 'contact.html');
        el.removeAttribute('target');
      }
      /* Non-empty mailto links are fine — leave them */
    });
  }

  /* Init on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      interceptConnectButtons();
      fixFooterEmailLinks();
    });
  } else {
    interceptConnectButtons();
    fixFooterEmailLinks();
  }

})();
