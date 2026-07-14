let currentPage = 1;
let currentFilters = { district: 'all', category: 'all', work_type: 'all', search: '' };

async function initJobsPage() {
  await loadConfig();
  populateFilters();
  loadJobs();
  setupFilterListeners();
}

function populateFilters() {
  const districtSelect = document.getElementById('filter-district');
  const categorySelect = document.getElementById('filter-category');

  if (districtSelect && config) {
    config.districts.forEach(d => {
      districtSelect.innerHTML += `<option value="${d}">${d}</option>`;
    });
  }

  if (categorySelect && config) {
    config.categories.forEach(c => {
      categorySelect.innerHTML += `<option value="${c.id}">${c.icon} ${c.name}</option>`;
    });
  }

  const workTypeContainer = document.getElementById('work-type-pills');
  if (workTypeContainer && config) {
    workTypeContainer.innerHTML = config.workTypes.map(wt => `
      <button class="work-type-pill" data-type="${wt.id}">${wt.icon} ${wt.name}</button>
    `).join('');
  }
}

function setupFilterListeners() {
  document.getElementById('filter-district')?.addEventListener('change', (e) => {
    currentFilters.district = e.target.value;
    currentPage = 1;
    loadJobs();
  });

  document.getElementById('filter-category')?.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    currentPage = 1;
    loadJobs();
  });

  document.getElementById('work-type-pills')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.work-type-pill');
    if (!pill) return;
    document.querySelectorAll('.work-type-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentFilters.work_type = pill.dataset.type;
    currentPage = 1;
    loadJobs();
  });

  let searchTimeout;
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value;
      currentPage = 1;
      loadJobs();
    }, 400);
  });

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    currentFilters = { district: 'all', category: 'all', work_type: 'all', search: '' };
    currentPage = 1;
    const districtEl = document.getElementById('filter-district');
    const categoryEl = document.getElementById('filter-category');
    const searchEl = document.getElementById('search-input');
    if (districtEl) districtEl.value = 'all';
    if (categoryEl) categoryEl.value = 'all';
    if (searchEl) searchEl.value = '';
    document.querySelectorAll('.work-type-pill').forEach(p => p.classList.remove('active'));
    loadJobs();
  });
}

async function loadJobs() {
  const grid = document.getElementById('jobs-grid');
  const countEl = document.getElementById('jobs-count');
  if (!grid) return;

  grid.innerHTML = Array(6).fill('<div class="skeleton h-48 rounded-2xl"></div>').join('');

  const params = new URLSearchParams({
    page: currentPage,
    limit: 12,
    ...Object.fromEntries(Object.entries(currentFilters).filter(([, v]) => v && v !== 'all'))
  });

  try {
    const res = await fetch(`${API}/api/jobs?${params}`);
    const data = await res.json();

    if (countEl) {
      countEl.textContent = `${data.total} Job${data.total !== 1 ? 's' : ''} Found`;
    }

    if (data.jobs.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-bold text-white mb-2">No jobs found</h3>
          <p class="text-slate-400">Try adjusting your filters or search terms</p>
        </div>
      `;
    } else {
      grid.innerHTML = data.jobs.map(job => renderJobCard(job)).join('');
      initScrollAnimations();
    }

    renderPagination(data.page, data.pages);
  } catch (e) {
    grid.innerHTML = '<div class="col-span-full text-center text-red-400 py-8">Failed to load jobs. Please try again.</div>';
  }
}

function renderPagination(page, pages) {
  const container = document.getElementById('pagination');
  if (!container || pages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';
  if (page > 1) html += `<button class="page-btn" onclick="goToPage(${page - 1})">←</button>`;

  for (let i = 1; i <= pages; i++) {
    if (pages > 7 && i > 3 && i < pages - 2 && Math.abs(i - page) > 1) {
      if (i === 4 || i === pages - 3) html += '<span class="text-slate-500 px-2">...</span>';
      continue;
    }
    html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (page < pages) html += `<button class="page-btn" onclick="goToPage(${page + 1})">→</button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  loadJobs();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterByCategory(categoryId) {
  window.location.href = `/jobs.html?category=${categoryId}`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('jobs-grid')) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('category')) currentFilters.category = params.get('category');
    if (params.get('district')) currentFilters.district = params.get('district');
    if (params.get('work_type')) currentFilters.work_type = params.get('work_type');
    if (params.get('search')) currentFilters.search = params.get('search');
    initJobsPage().then(() => {
      if (currentFilters.category !== 'all') {
        const el = document.getElementById('filter-category');
        if (el) el.value = currentFilters.category;
      }
      if (currentFilters.district !== 'all') {
        const el = document.getElementById('filter-district');
        if (el) el.value = currentFilters.district;
      }
      if (currentFilters.work_type !== 'all') {
        document.querySelector(`.work-type-pill[data-type="${currentFilters.work_type}"]`)?.classList.add('active');
      }
      if (currentFilters.search) {
        const searchEl = document.getElementById('search-input');
        if (searchEl) searchEl.value = currentFilters.search;
      }
    });
  }
});
