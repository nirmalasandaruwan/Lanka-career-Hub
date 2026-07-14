const API = '';

let config = null;

function getTheme() {
  return localStorage.getItem('lch_theme') || 'dark';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('lch_theme', theme);
  updateThemeUI(theme);
}

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function updateThemeUI(theme) {
  const floatBtn = document.getElementById('theme-toggle-float');
  if (floatBtn) floatBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  setTheme(getTheme());
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

async function loadConfig() {
  if (config) return config;
  const res = await fetch(`${API}/api/config`);
  config = await res.json();
  return config;
}

function getToken() {
  return localStorage.getItem('lch_token');
}

function getUser() {
  const u = localStorage.getItem('lch_user');
  return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
  localStorage.setItem('lch_token', token);
  localStorage.setItem('lch_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('lch_token');
  localStorage.removeItem('lch_user');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function updateNavAuth() {
  const user = getUser();
  const authBtns = document.getElementById('nav-auth');
  const userMenu = document.getElementById('nav-user');
  if (!authBtns) return;

  if (user) {
    authBtns.classList.add('hidden');
    if (userMenu) {
      userMenu.classList.remove('hidden');
      const nameEl = userMenu.querySelector('.user-name');
      if (nameEl) nameEl.textContent = user.name;
    }
  } else {
    authBtns.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
  }
}

function logout() {
  clearAuth();
  window.location.href = '/';
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeBtn = document.getElementById('mobile-menu-close');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
    closeBtn?.addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });

  updateNavAuth();
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in').forEach(el => {
    observer.observe(el);
  });
}

function animateCounter(el, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(start + (target - start) * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/api/stats`);
    const stats = await res.json();

    const totalEl = document.getElementById('stat-total');
    const recentEl = document.getElementById('stat-recent');
    const districtEl = document.getElementById('stat-districts');
    const categoryEl = document.getElementById('stat-categories');

    if (totalEl) animateCounter(totalEl, stats.total);
    if (recentEl) animateCounter(recentEl, stats.recent);
    if (districtEl) animateCounter(districtEl, stats.byDistrict.length);
    if (categoryEl) animateCounter(categoryEl, stats.byCategory.length);
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

function getCategoryName(id) {
  if (!config) return id;
  const cat = config.categories.find(c => c.id === id);
  return cat ? cat.name : id;
}

function getWorkTypeName(id) {
  if (!config) return id;
  const wt = config.workTypes.find(w => w.id === id);
  return wt ? wt.name : id;
}

function getWorkTypeBadgeClass(type) {
  const map = {
    remote: 'badge-remote',
    'work-from-home': 'badge-remote',
    online: 'badge-remote',
    internship: 'badge-internship'
  };
  return map[type] || 'badge-district';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

function renderJobCard(job) {
  const wtClass = getWorkTypeBadgeClass(job.work_type);
  return `
    <div class="glass-card job-card fade-up" onclick="openJobModal(${job.id})">
      <div class="flex flex-wrap gap-2 mb-3">
        <span class="job-badge badge-district">📍 ${job.district}</span>
        <span class="job-badge badge-category">${getCategoryName(job.category)}</span>
        <span class="job-badge ${wtClass}">${getWorkTypeName(job.work_type)}</span>
      </div>
      <h3 class="text-lg font-bold text-white mb-1 font-display">${job.title}</h3>
      <p class="text-sm text-slate-400 mb-3">${job.company}</p>
      <p class="text-sm text-slate-300 line-clamp-2 mb-4">${job.description}</p>
      <div class="flex items-center justify-between text-sm">
        ${job.salary ? `<span class="text-gold-gradient font-semibold">${job.salary}</span>` : '<span></span>'}
        <span class="text-slate-500">${timeAgo(job.created_at)}</span>
      </div>
    </div>
  `;
}

async function openJobModal(id) {
  try {
    const res = await fetch(`${API}/api/jobs/${id}`);
    const job = await res.json();
    const modal = document.getElementById('job-modal');
    const content = document.getElementById('job-modal-content');
    if (!modal || !content) return;

    const wtClass = getWorkTypeBadgeClass(job.work_type);
    content.innerHTML = `
      <div class="flex flex-wrap gap-2 mb-4">
        <span class="job-badge badge-district">📍 ${job.district}</span>
        <span class="job-badge badge-category">${getCategoryName(job.category)}</span>
        <span class="job-badge ${wtClass}">${getWorkTypeName(job.work_type)}</span>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2 font-display">${job.title}</h2>
      <p class="text-lg text-slate-400 mb-4">${job.company}</p>
      ${job.salary ? `<p class="text-gold-gradient font-bold text-lg mb-4">${job.salary}</p>` : ''}
      <div class="text-slate-300 leading-relaxed mb-6 whitespace-pre-line">${job.description}</div>
      <div class="flex flex-wrap gap-4 text-sm text-slate-400 mb-6">
        ${job.deadline ? `<span>📅 Deadline: ${formatDate(job.deadline)}</span>` : ''}
        <span>🕐 Posted: ${formatDate(job.created_at)}</span>
      </div>
      ${job.apply_link ? `<a href="${job.apply_link}" target="_blank" class="btn-gold inline-block">Apply Now →</a>` : ''}
    `;
    modal.classList.add('active');
  } catch (e) {
    console.error('Failed to load job:', e);
  }
}

function closeJobModal() {
  document.getElementById('job-modal')?.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initNavbar();
  initScrollAnimations();
  await loadConfig();
});
