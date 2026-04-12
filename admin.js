/* CHM CHURCH OF GOD — Admin Panel JS */

/* ── AUTH ─────────────────────────────────────── */
const ADMIN_USER = 'chmadmin';
const ADMIN_PASS = 'CHMGod2026!';
const SESSION_KEY = 'chm_admin_session';

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}
function requireAuth() {
  if (!isLoggedIn()) { window.location.href = 'login.html'; }
}
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

/* ── SIDEBAR TOGGLE ───────────────────────────── */
function initSidebar() {
  const ham = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  if (ham && sidebar) {
    ham.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !ham.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
  // Mark active link
  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
}

/* ── TOAST ────────────────────────────────────── */
function showToast(msg, type='success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success:'✅', error:'❌', warning:'⚠️' };
  toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(100%)'; toast.style.transition='.3s'; setTimeout(()=>toast.remove(), 300); }, 3000);
}

/* ── MODAL ────────────────────────────────────── */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow='hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow=''; }
}
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow='';
  }
});

/* ── LOCAL STORAGE DATA ───────────────────────── */
function getData(key) {
  try { return JSON.parse(localStorage.getItem('chm_' + key)) || []; }
  catch { return []; }
}
function setData(key, data) {
  localStorage.setItem('chm_' + key, JSON.stringify(data));
}
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ── CONFIRM DELETE ───────────────────────────── */
function confirmDelete(msg, callback) {
  if (window.confirm(msg || 'Are you sure you want to delete this item?')) {
    callback();
  }
}

/* ── COUNTER ANIMATION ────────────────────────── */
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 30);
  });
}

/* ── SEARCH TABLE ─────────────────────────────── */
function initTableSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    table.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

/* ── INIT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  animateCounters();
  // Logout buttons
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', logout);
  });
  // Modal close buttons
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });
  // Modal open buttons
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
  });
});
