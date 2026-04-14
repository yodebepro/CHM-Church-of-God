/* CHM CHURCH OF GOD — Main JS */

const NAV_HTML = `
<div class="header-inner" id="headerInner">
  <div class="container">
    <a href="index.html" class="logo">
      <img src="assets/logo-dark.png" alt="CHM Church of God" class="logo-img" style="height:54px;width:auto;display:block;object-fit:contain;"/>
    </a>
    <nav class="main-nav">
      <div class="nav-item"><a href="index.html" class="nav-link">Home</a></div>
      <div class="nav-item">
        <a href="about.html" class="nav-link">About <span class="arrow">▾</span></a>
        <div class="dropdown">
          <a href="about.html">Our Story & Beliefs</a>
          <a href="leaders.html">Leadership</a>
          <a href="locations.html">Locations</a>
        </div>
      </div>
      <div class="nav-item">
        <a href="ministries.html" class="nav-link">Ministries <span class="arrow">▾</span></a>
        <div class="dropdown">
          <a href="ministries.html">All Ministries</a>
          <a href="teams.html">Teams</a>
          <a href="departments.html">Departments</a>
        </div>
      </div>
      <div class="nav-item">
        <a href="watch-live.html" class="nav-link">Media <span class="arrow">▾</span></a>
        <div class="dropdown">
          <a href="watch-live.html">Watch Live</a>
          <a href="listen-live.html">Listen Live</a>
          <a href="sermons.html">Sermons</a>
          <a href="gallery.html">Gallery</a>
        </div>
      </div>
      <div class="nav-item">
        <a href="events.html" class="nav-link">Events <span class="arrow">▾</span></a>
        <div class="dropdown">
          <a href="events.html">All Events</a>
          <a href="announcements.html">Announcements</a>
        </div>
      </div>
      <div class="nav-item"><a href="give.html" class="nav-link">Give</a></div>
    </nav>
    <div class="lang-btn-wrap">
      <button class="lang-btn">🌐 EN <span class="arrow">▾</span></button>
      <div class="lang-panel" id="langPanel">
        <div class="lang-option active" data-lang="en" data-flag="🇺🇸">🇺🇸 English</div>
        <div class="lang-option" data-lang="ht" data-flag="🇭🇹">🇭🇹 Kreyòl</div>
        <div class="lang-option" data-lang="fr" data-flag="🇫🇷">🇫🇷 Français</div>
        <div class="lang-option" data-lang="es" data-flag="🇪🇸">🇪🇸 Español</div>
        <div class="lang-option" data-lang="zh" data-flag="🇨🇳">🇨🇳 中文</div>
        <div class="lang-option" data-lang="hi" data-flag="🇮🇳">🇮🇳 हिन्दी</div>
        <div class="lang-option" data-lang="pt" data-flag="🇧🇷">🇧🇷 Português</div>
        <div class="lang-option" data-lang="ar" data-flag="🇸🇦">🇸🇦 العربية</div>
        <div class="lang-option" data-lang="sw" data-flag="🇰🇪">🇰🇪 Swahili</div>
        <div class="lang-option" data-lang="af" data-flag="🇿🇦">🇿🇦 Afrikaans</div>
        <div class="lang-option" data-lang="ha" data-flag="🇳🇬">🇳🇬 Hausa</div>
      </div>
    </div>
    <a href="connect.html" class="btn btn-primary btn-sm header-cta">Connect</a>
    <button class="menu-toggle" id="menuToggle" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</div>
`;

const FOOTER_HTML = `
<div class="container">
  <div class="footer-grid">
    <div>
      <div class="footer-logo">
        <img src="assets/logo-dark.png" alt="CHM Church of God" style="height:70px;width:auto;object-fit:contain;margin-bottom:.75rem;display:block;"/>
      </div>
      <p class="footer-about">A vibrant, Spirit-filled community serving West Orange, NJ and the world through prayer, holiness, and the transforming power of Jesus Christ.</p>
      <div class="footer-social">
        <a href="#" class="social-btn" aria-label="Facebook">📘</a>
        <a href="#" class="social-btn" aria-label="YouTube">▶️</a>
        <a href="#" class="social-btn" aria-label="Instagram">📸</a>
        <a href="#" class="social-btn" aria-label="Twitter">🐦</a>
      </div>
    </div>
    <div class="footer-col">
      <h5>Explore</h5>
      <div class="footer-links">
        <a href="about.html">About Us</a>
        <a href="ministries.html">Ministries</a>
        <a href="teams.html">Teams</a>
        <a href="departments.html">Departments</a>
        <a href="leaders.html">Leadership</a>
        <a href="locations.html">Locations</a>
      </div>
    </div>
    <div class="footer-col">
      <h5>Media</h5>
      <div class="footer-links">
        <a href="watch-live.html">Watch Live</a>
        <a href="listen-live.html">Listen Live</a>
        <a href="sermons.html">Sermons</a>
        <a href="gallery.html">Gallery</a>
        <a href="events.html">Events</a>
        <a href="announcements.html">Announcements</a>
      </div>
    </div>
    <div class="footer-col">
      <h5>Contact</h5>
      <div class="footer-contact">
        <div class="footer-contact-item"><span class="footer-contact-icon">📍</span><span>330 Pleasant Valley Way<br>West Orange, NJ 07052</span></div>
        <div class="footer-contact-item"><span class="footer-contact-icon">📞</span><span>973-855-2396</span></div>
        <div class="footer-contact-item"><span class="footer-contact-icon">✉️</span><span>yodebepro@gmail.com</span></div>
      </div>
      <div style="margin-top:1.25rem;display:flex;flex-direction:column;gap:.5rem">
        <a href="give.html" class="btn btn-primary btn-sm">Give Online</a>
        <a href="prayer-request.html" class="btn btn-outline btn-sm">Prayer Request</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 CHM Church of God. All rights reserved.</span>
    <span><a href="#">Privacy Policy</a> · <a href="#">Terms</a></span>
  </div>
</div>`;

const CHAT_HTML = `
<button class="chat-toggle" id="chatToggle">💬</button>
<div class="chat-box" id="chatBox">
  <div class="chat-head">
    <div class="chat-head-icon">✝</div>
    <div>
      <div class="chat-head-name">CHM Welcome Desk</div>
      <div class="chat-head-status">Usually responds instantly</div>
    </div>
  </div>
  <div class="chat-msgs" id="chatMsgs">
    <div class="chat-msg bot">Welcome to CHM Church of God! 🙏 How can I help you today?</div>
  </div>
  <div class="chat-input-row">
    <input class="chat-input" id="chatInput" type="text" placeholder="Type a message..." />
    <button class="chat-send" id="chatSend">➤</button>
  </div>
</div>`;

const BOT_RESPONSES = {
  default: ["I'll connect you with our team shortly! You can also call us at 973-855-2396.","Thank you for reaching out! Check our website or call 973-855-2396 for assistance."],
  service: ["We have services Sunday 8AM & 11AM, Wednesday 7PM, and Friday 7PM. All are welcome!"],
  give: ["You can give online at our Give page, via Zelle, or in person. Visit our Give page for all options."],
  prayer: ["We'd be honored to pray with you! Visit our Prayer Request page or call 973-855-2396."],
  location: ["We're located at 330 Pleasant Valley Way, West Orange, NJ 07052. We'd love to see you!"],
  pastor: ["Our senior leadership includes our Pastor and dedicated ministry leaders. Visit our Leaders page to learn more."],
};

function getBotReply(msg) {
  const m = msg.toLowerCase();
  if(m.includes('service')||m.includes('sunday')||m.includes('time')) return BOT_RESPONSES.service[0];
  if(m.includes('give')||m.includes('tithe')||m.includes('donat')) return BOT_RESPONSES.give[0];
  if(m.includes('pray')) return BOT_RESPONSES.prayer[0];
  if(m.includes('location')||m.includes('address')||m.includes('where')) return BOT_RESPONSES.location[0];
  if(m.includes('pastor')||m.includes('leader')) return BOT_RESPONSES.pastor[0];
  return BOT_RESPONSES.default[Math.floor(Math.random()*BOT_RESPONSES.default.length)];
}

document.addEventListener('DOMContentLoaded', () => {
  // Inject header
  const hEl = document.getElementById('chm-header');
  if(hEl) { hEl.innerHTML = NAV_HTML; hEl.style.position='fixed'; hEl.style.top='0'; hEl.style.left='0'; hEl.style.right='0'; hEl.style.zIndex='1000'; }

  // Inject footer
  const fEl = document.getElementById('chm-footer');
  if(fEl) fEl.innerHTML = FOOTER_HTML;

  // Inject chat
  const cEl = document.getElementById('chm-chat');
  if(cEl) cEl.innerHTML = CHAT_HTML;

  // Header scroll
  const hi = document.getElementById('headerInner');
  window.addEventListener('scroll', () => {
    if(hi) hi.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Mobile menu — toggles main-nav (no duplicate flat list)
  const mt = document.getElementById('menuToggle');
  const mn = document.querySelector('.main-nav');
  if(mt && mn) {
    mt.addEventListener('click', () => {
      mn.classList.toggle('mob-open');
      mt.classList.toggle('is-open');
    });
    // On mobile, clicking a nav-link with a dropdown: toggle dropdown instead of navigate
    mn.querySelectorAll('.nav-item').forEach(item => {
      const link = item.querySelector('.nav-link');
      const dd = item.querySelector('.dropdown');
      if(dd && link) {
        link.addEventListener('click', e => {
          if(window.innerWidth <= 900) {
            e.preventDefault();
            item.classList.toggle('mob-dd-open');
          }
        });
      }
    });
    // Close on outside click
    document.addEventListener('click', e => {
      if(!mt.contains(e.target) && !mn.contains(e.target)) {
        mn.classList.remove('mob-open');
        mt.classList.remove('is-open');
        mn.querySelectorAll('.nav-item').forEach(i => i.classList.remove('mob-dd-open'));
      }
    });
    // Close when a dropdown leaf link is clicked
    mn.querySelectorAll('.dropdown a').forEach(a => a.addEventListener('click', () => {
      mn.classList.remove('mob-open');
      mt.classList.remove('is-open');
      mn.querySelectorAll('.nav-item').forEach(i => i.classList.remove('mob-dd-open'));
    }));
    // Close when a top-level non-dropdown nav-link is clicked
    mn.querySelectorAll('.nav-item:not(:has(.dropdown)) .nav-link').forEach(a => a.addEventListener('click', () => {
      mn.classList.remove('mob-open');
      mt.classList.remove('is-open');
    }));
  }

  // Active nav
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if(href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  // ── GOOGLE TRANSLATE INTEGRATION ──────────────────────────────────────────
  // Clear any existing translation cookie on every page load.
  // This ensures: refresh → English, navigate to new page → English.
  (function() {
    var exp = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    document.cookie = 'googtrans=; ' + exp;
    document.cookie = 'googtrans=; domain=.' + location.hostname + '; ' + exp;
  })();

  // Hide the Google Translate banner that appears after translation
  (function injectGTStyle() {
    var s = document.createElement('style');
    s.textContent = '.goog-te-banner-frame{display:none!important}body{top:0!important;position:static!important}.goog-te-menu-value:hover{text-decoration:none}.goog-te-gadget{display:none!important}';
    document.head.appendChild(s);
  })();

  // Inject hidden GT widget + script
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'en',
      autoDisplay: false,
      includedLanguages: 'ht,fr,es,zh-CN,hi,pt,ar,sw,af,ha'
    }, 'chm-gt-element');
  };
  (function() {
    var d = document.createElement('div');
    d.id = 'chm-gt-element';
    d.style.display = 'none';
    document.body.appendChild(d);
    var s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.head.appendChild(s);
  })();

  // GT language code map (CHM code → Google Translate code)
  const GT_LANG = {ht:'ht',fr:'fr',es:'es',zh:'zh-CN',hi:'hi',pt:'pt',ar:'ar',sw:'sw',af:'af',ha:'ha'};

  function chmTranslatePage(lang) {
    if (lang === 'en') {
      // Restore English: clear cookie and reload (clean reset)
      var exp = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
      document.cookie = 'googtrans=; ' + exp;
      document.cookie = 'googtrans=; domain=.' + location.hostname + '; ' + exp;
      location.reload();
      return;
    }
    var gtLang = GT_LANG[lang] || lang;
    // Poll until GT widget is ready (max ~6 seconds)
    var tries = 0;
    var poll = setInterval(function() {
      var sel = document.querySelector('.goog-te-combo');
      if (sel || tries > 30) {
        clearInterval(poll);
        if (sel) {
          sel.value = gtLang;
          var ev = document.createEvent('HTMLEvents');
          ev.initEvent('change', true, true);
          sel.dispatchEvent(ev);
        }
      }
      tries++;
    }, 200);
  }

  // Language dropdown handler
  const langOpts = document.querySelectorAll('.lang-option');
  const langBtnEl = document.querySelector('.lang-btn');
  langOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.lang;
      const flag = opt.dataset.flag;
      const label = lang.toUpperCase();
      // Update button face
      if (langBtnEl) langBtnEl.innerHTML = `${flag} ${label} <span class="arrow">▾</span>`;
      // Update active state
      langOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      // Translate
      chmTranslatePage(lang);
    });
  });

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  if(reveals.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) { e.target.classList.add('revealed'); ro.unobserve(e.target); }});
    }, {threshold:.1});
    reveals.forEach(el => ro.observe(el));
  }

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      const parent = btn.closest('[data-tabs]') || btn.parentElement.closest('.tabs')?.parentElement;
      if(parent) {
        parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      } else {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      }
      btn.classList.add('active');
      const pane = document.getElementById(target);
      if(pane) pane.classList.add('active');
    });
  });

  // Accordion
  document.querySelectorAll('.accordion-header').forEach(h => {
    h.addEventListener('click', () => {
      const item = h.parentElement;
      const open = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if(!open) item.classList.add('open');
    });
  });

  // Filter chips
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.closest('.filter-chips');
      if(group) group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter || 'all';
      const targetGroup = chip.dataset.target || chip.closest('section')?.id;
      const items = document.querySelectorAll('[data-category]');
      items.forEach(item => {
        if(filter === 'all' || item.dataset.category === filter) item.style.display='';
        else item.style.display='none';
      });
    });
  });

  // Source buttons
  document.querySelectorAll('.source-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.source-btns');
      if(group) group.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Give amounts
  document.querySelectorAll('.give-amt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.give-amt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const customInput = document.getElementById('customAmount');
      if(customInput) customInput.value = btn.dataset.amount || '';
    });
  });

  // Counter animation
  document.querySelectorAll('[data-count]').forEach(el => {
    const io = new IntersectionObserver(entries => {
      if(entries[0].isIntersecting) {
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let count = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
          count = Math.min(count + step, target);
          el.textContent = count + suffix;
          if(count >= target) clearInterval(timer);
        }, 25);
        io.unobserve(el);
      }
    }, {threshold:.5});
    io.observe(el);
  });

  // Form submissions
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const success = form.nextElementSibling;
      if(success && success.classList.contains('form-success')) {
        form.style.display = 'none';
        success.classList.add('show');
      } else {
        const btn = form.querySelector('[type=submit]');
        if(btn) { const orig = btn.textContent; btn.textContent = '✓ Submitted!'; setTimeout(() => btn.textContent = orig, 3000); }
      }
    });
  });

  // Chat
  const chatToggle = document.getElementById('chatToggle');
  const chatBox = document.getElementById('chatBox');
  const chatMsgs = document.getElementById('chatMsgs');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');

  function addMsg(text, type) {
    if(!chatMsgs) return;
    const m = document.createElement('div');
    m.className = `chat-msg ${type}`;
    m.textContent = text;
    chatMsgs.appendChild(m);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function sendChat() {
    const msg = chatInput?.value.trim();
    if(!msg) return;
    addMsg(msg, 'user');
    chatInput.value = '';
    setTimeout(() => addMsg(getBotReply(msg), 'bot'), 700);
  }

  if(chatToggle) chatToggle.addEventListener('click', () => chatBox?.classList.toggle('open'));
  if(chatSend) chatSend.addEventListener('click', sendChat);
  if(chatInput) chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendChat(); });

  // ── HERO VIDEO BACKGROUND (set by admin in admin/settings.html) ───────────
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    const heroVideoUrl = localStorage.getItem('chm_hero_video');
    if (heroVideoUrl) {
      const vid = document.createElement('video');
      vid.autoplay = true; vid.muted = true; vid.loop = true; vid.playsInline = true;
      vid.setAttribute('playsinline', ''); vid.setAttribute('muted', '');
      vid.className = 'hero-video-bg';
      vid.innerHTML = `<source src="${heroVideoUrl}" type="video/mp4"/>`;
      vid.onerror = () => vid.remove(); // remove if video fails
      heroEl.insertBefore(vid, heroEl.firstChild);
    }
  }

  // Radio toggle
  const radioToggle = document.querySelector('.radio-toggle');
  if(radioToggle) {
    let playing = false;
    radioToggle.addEventListener('click', () => {
      playing = !playing;
      radioToggle.textContent = playing ? '⏸' : '▶';
      radioToggle.style.background = playing ? '#ef4444' : 'var(--gold)';
    });
  }
});

/* ── CHM CMS LOADER — loads live published content from Firebase ── */
(function(){
  function initCMS(){
    if(typeof firebase==='undefined'||typeof firebaseConfig==='undefined'||firebaseConfig.apiKey.includes('PASTE_YOUR'))return;
    try{
      if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
      const db=firebase.firestore();
      loadContent(db);
    }catch(e){}
  }
  async function loadContent(db){
    try{
      // Colors
      const c=(await db.collection('site_config').doc('colors').get()).data()||{};
      if(c.navy)document.documentElement.style.setProperty('--navy',c.navy);
      if(c.gold)document.documentElement.style.setProperty('--gold',c.gold);
      if(c.text)document.documentElement.style.setProperty('--text',c.text);
      if(c.bgCss||c.bg)document.body.style.background=c.bgCss||c.bg;

      // Church info
      const i=(await db.collection('site_config').doc('church_info').get()).data()||{};
      if(i.addr)document.querySelectorAll('[data-cms="address"]').forEach(el=>el.textContent=i.addr);
      if(i.phone)document.querySelectorAll('[data-cms="phone"]').forEach(el=>el.textContent=i.phone);
      if(i.email)document.querySelectorAll('[data-cms="email"]').forEach(el=>el.textContent=i.email);

      // Service times
      const t=(await db.collection('site_config').doc('service_times').get()).data()||{};
      if(t.sun)document.querySelectorAll('[data-cms="time-sun"]').forEach(el=>el.textContent=t.sun);
      if(t.wed)document.querySelectorAll('[data-cms="time-wed"]').forEach(el=>el.textContent=t.wed);
      if(t.fri)document.querySelectorAll('[data-cms="time-fri"]').forEach(el=>el.textContent=t.fri);
      if(t.sat)document.querySelectorAll('[data-cms="time-sat"]').forEach(el=>el.textContent=t.sat);

      // Hero video
      const hd=(await db.collection('site_config').doc('hero').get()).data()||{};
      const vid=hd.videoUrl||localStorage.getItem('chm_hero_video')||'';
      if(vid)injectHeroVideo(vid);

      // Homepage content
      const pg=window.location.pathname.split('/').pop()||'index.html';
      if(pg===''||pg==='index.html'){
        const h=(await db.collection('site_config').doc('page_home').get()).data()||{};
        if(h.eyebrow){const el=document.querySelector('.hero-eyebrow');if(el)el.innerHTML=h.eyebrow;}
        if(h.title){const el=document.querySelector('.hero-title');if(el)el.innerHTML=h.title;}
        if(h.verse){const el=document.querySelector('.hero-verse');if(el)el.innerHTML=h.verse;}
      }

      // Footer content
      const f=(await db.collection('site_config').doc('page_footer').get()).data()||{};
      if(f.about)document.querySelectorAll('.footer-about').forEach(el=>el.textContent=f.about);
      if(f.copy)document.querySelectorAll('[data-cms="copyright"]').forEach(el=>el.textContent=f.copy);
      if(f.bg)document.querySelectorAll('.site-footer').forEach(el=>el.style.background=f.bg);
      if(f.text)document.querySelectorAll('.site-footer').forEach(el=>el.style.color=f.text);
    }catch(e){}
  }
  function injectHeroVideo(url){
    const hero=document.querySelector('.hero');
    if(!hero||hero.querySelector('.hero-video-bg'))return;
    const v=document.createElement('video');
    v.autoplay=true;v.muted=true;v.loop=true;v.playsInline=true;v.className='hero-video-bg';
    v.innerHTML=`<source src="${url}" type="video/mp4"/>`;
    hero.insertBefore(v,hero.firstChild);
  }
  document.addEventListener('DOMContentLoaded',function(){
    // localStorage fallback for hero video
    const vid=localStorage.getItem('chm_hero_video');
    if(vid)injectHeroVideo(vid);
    if(typeof firebase!=='undefined')initCMS();
  });
})();
