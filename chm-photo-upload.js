/* ================================================================
   CHM PHOTO UPLOAD  v2  —  Photo / Video / Audio from Computer
   ----------------------------------------------------------------
   Adds a "📁 Upload File" button next to every photo/media URL
   field on every admin page. Files are converted to base64 and
   stored in the JSON. Export JSON → upload to GitHub → global.
   Size limit: 100 MB (paste a URL for larger videos).
   ================================================================ */
(function () {
  'use strict';

  var UPLOAD_CSS = `
  .chm-photo-wrap { position: relative; }
  .chm-photo-preview {
    width: 100%; max-height: 200px; object-fit: cover;
    border-radius: 10px; margin-top: 6px; display: none;
    border: 2px solid #c8913a;
  }
  .chm-photo-preview.visible { display: block; }
  .chm-file-btn {
    display: inline-flex; align-items: center; gap: 6px; margin-top: 6px;
    padding: 7px 14px; border-radius: 8px;
    background: #0a1f44; color: #c8913a; border: 1.5px solid #c8913a;
    font-size: .8rem; font-weight: 700; cursor: pointer; transition: .15s;
  }
  .chm-file-btn:hover { background: #162f60; }
  .chm-file-input { display: none; }
  .chm-upload-hint {
    font-size: .72rem; color: #9ca3af; margin-top: 3px;
    display: block; line-height: 1.5;
  }
  `;

  var styleEl = document.createElement('style');
  styleEl.textContent = UPLOAD_CSS;
  document.head.appendChild(styleEl);

  /* ─── Upgrade a single URL/text input field ─────────────────── */
  function upgradeField(input) {
    if (input.dataset.chmUpgraded) return;
    input.dataset.chmUpgraded = '1';

    var wrap = input.parentElement;
    wrap.classList.add('chm-photo-wrap');

    /* Preview of existing URL */
    var preview = document.createElement('img');
    preview.className = 'chm-photo-preview';
    preview.alt = 'Preview';
    function refreshPreview(src) {
      if (src && (src.startsWith('data:') || src.startsWith('http'))) {
        preview.src = src;
        preview.classList.add('visible');
      } else {
        preview.classList.remove('visible');
        preview.src = '';
      }
    }
    refreshPreview(input.value);
    input.addEventListener('input', function () { refreshPreview(this.value); });

    /* Status line */
    var hint = document.createElement('span');
    hint.className = 'chm-upload-hint';
    hint.textContent = 'Upload a photo, video, or audio file — or paste a direct URL above';

    /* Hidden file input — accepts all media */
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*,audio/*';
    fileInput.className = 'chm-file-input';

    /* Upload button label */
    var btn = document.createElement('label');
    btn.className = 'chm-file-btn';
    btn.innerHTML = '📁 Upload Photo / Video / Audio';
    btn.appendChild(fileInput);

    fileInput.addEventListener('change', function () {
      var f = fileInput.files[0];
      if (!f) return;

      var mb       = (f.size / 1024 / 1024).toFixed(1);
      var fileType = f.type.startsWith('video/') ? 'Video'
                   : f.type.startsWith('audio/') ? 'Audio'
                   : 'Photo';

      /* Hard size limit */
      if (parseFloat(mb) > 100) {
        hint.innerHTML = '❌ ' + fileType + ' is ' + mb + ' MB — too large to embed.<br>'
          + '<b>Paste a direct URL instead</b> (YouTube, Vimeo, SoundCloud, Google Drive).';
        fileInput.value = '';
        return;
      }

      hint.innerHTML = '⏳ Loading ' + fileType + ': <b>' + f.name + '</b> (' + mb + ' MB)…'
        + (parseFloat(mb) > 10 ? ' <small>Large file, please wait…</small>' : '');

      var reader = new FileReader();

      reader.onload = function (e) {
        input.value = e.target.result;
        refreshPreview(e.target.result);
        input.dispatchEvent(new Event('input',  { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        hint.innerHTML = '✅ ' + fileType + ' <b>' + f.name + '</b> (' + mb + ' MB) embedded.<br>'
          + 'Save the form → <b>📤 Export JSON</b> → upload to GitHub → live globally 🌐';
      };

      reader.onerror = function () {
        hint.innerHTML = '❌ Could not read <b>' + f.name + '</b>.<br>'
          + 'Try a smaller file, or paste a URL instead.';
        fileInput.value = '';
      };

      reader.readAsDataURL(f);
    });

    wrap.appendChild(btn);
    wrap.appendChild(preview);
    wrap.appendChild(hint);
  }

  /* ─── Detect photo/media URL fields ─────────────────────────── */
  var PHOTO_PATTERNS = [
    /photo/i, /image/i, /^img/i, /media/i, /thumbnail/i,
    /banner/i, /hero/i, /cover/i, /avatar/i, /picture/i,
    /video/i, /audio/i, /url$/i
  ];

  function isMediaField(inp) {
    if (inp.type === 'file') return false;
    var name = (inp.name || inp.id || inp.placeholder || '').toLowerCase();
    return PHOTO_PATTERNS.some(function (p) { return p.test(name); });
  }

  function upgradeAll() {
    document.querySelectorAll(
      'input[type="text"], input[type="url"], input:not([type])'
    ).forEach(function (inp) {
      if (isMediaField(inp)) upgradeField(inp);
    });
  }

  document.addEventListener('DOMContentLoaded', upgradeAll);
  setTimeout(upgradeAll, 800);
  setTimeout(upgradeAll, 2000);

  if (window.MutationObserver) {
    var obs = new MutationObserver(function () { upgradeAll(); });
    document.addEventListener('DOMContentLoaded', function () {
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { obs.disconnect(); }, 15000);
    });
  }

})();
