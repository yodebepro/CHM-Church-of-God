/* ================================================================
   CHM PHOTO UPLOAD  — lets admins upload actual image files
   instead of pasting URLs. Converts to base64 and stores in the
   JSON so photos travel globally when you export & upload to GitHub.
   ================================================================ */
(function () {
  'use strict';

  var UPLOAD_CSS = `
  .chm-photo-wrap { position:relative; }
  .chm-photo-preview {
    width:100%; max-height:180px; object-fit:cover;
    border-radius:10px; margin-top:6px; display:none;
    border:2px solid #c8913a;
  }
  .chm-photo-preview.visible { display:block; }
  .chm-file-btn {
    display:inline-flex; align-items:center; gap:6px;
    margin-top:6px; padding:7px 14px; border-radius:8px;
    background:#0a1f44; color:#c8913a; border:1.5px solid #c8913a;
    font-size:.8rem; font-weight:700; cursor:pointer; transition:.15s;
  }
  .chm-file-btn:hover { background:#162f60; }
  .chm-file-input { display:none; }
  .chm-photo-hint {
    font-size:.72rem; color:#9ca3af; margin-top:3px; display:block;
  }
  `;

  /* Inject styles once */
  var styleEl = document.createElement('style');
  styleEl.textContent = UPLOAD_CSS;
  document.head.appendChild(styleEl);

  /* ─── Upgrade every photo / image URL field ─────────────────── */
  function upgradeField(input) {
    if (input.dataset.chmUpgraded) return;
    input.dataset.chmUpgraded = '1';

    var wrap = input.parentElement;
    wrap.style.position = 'relative';
    wrap.classList.add('chm-photo-wrap');

    /* Preview of current URL if it's a base64 or valid http image */
    var preview = document.createElement('img');
    preview.className = 'chm-photo-preview';
    preview.alt = 'Photo preview';
    function updatePreview(src) {
      if (src && (src.startsWith('data:') || src.startsWith('http'))) {
        preview.src = src;
        preview.classList.add('visible');
      } else {
        preview.classList.remove('visible');
        preview.src = '';
      }
    }
    updatePreview(input.value);
    input.addEventListener('input', function () { updatePreview(this.value); });

    /* File upload button */
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.className = 'chm-file-input';

    var btn = document.createElement('label');
    btn.className = 'chm-file-btn';
    btn.textContent = '📁 Upload Photo / Video';
    btn.appendChild(fileInput);

    var hint = document.createElement('span');
    hint.className = 'chm-photo-hint';
    hint.textContent = 'File is saved as base64 inside the JSON → exports & uploads globally';

    fileInput.addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      var isVideo = file.type.startsWith('video/');
      hint.textContent = 'Converting ' + (isVideo ? 'video' : 'photo') + '… (' + Math.round(file.size / 1024) + ' KB)';

      var reader = new FileReader();
      reader.onload = function (e) {
        input.value = e.target.result;      // base64 data URL
        updatePreview(e.target.result);
        hint.textContent = '✅ ' + (isVideo ? 'Video' : 'Photo') + ' loaded as base64 — save the form then Export JSON → upload to GitHub';
        /* Trigger any existing change listeners (auto-save) */
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      reader.onerror = function () {
        hint.textContent = '❌ Could not read file. Try a smaller image.';
      };
      reader.readAsDataURL(file);
    });

    wrap.appendChild(btn);
    wrap.appendChild(preview);
    wrap.appendChild(hint);
  }

  /* ─── Find all photo URL inputs on the page ─────────────────── */
  var PHOTO_PATTERNS = [
    /photo/i, /image/i, /img/i, /media/i, /thumbnail/i,
    /banner/i, /hero/i, /cover/i, /avatar/i, /pic/i
  ];

  function isPhotoField(input) {
    if (input.type === 'file') return false;
    var name = (input.name || input.id || input.placeholder || '').toLowerCase();
    return PHOTO_PATTERNS.some(function (p) { return p.test(name); });
  }

  function upgradeAll() {
    document.querySelectorAll('input[type="text"], input[type="url"], input:not([type])').forEach(function (inp) {
      if (isPhotoField(inp)) upgradeField(inp);
    });
  }

  /* Run on load + watch for dynamically added fields */
  document.addEventListener('DOMContentLoaded', upgradeAll);
  setTimeout(upgradeAll, 1000); // catch late-rendered form fields

  var observer = new MutationObserver(function () { upgradeAll(); });
  observer.observe(document.body, { childList: true, subtree: true });

})();
