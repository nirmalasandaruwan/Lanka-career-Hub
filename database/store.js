const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const jobsFile = path.join(dataDir, 'jobs.json');
const usersFile = path.join(dataDir, 'users.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function read(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function nextId(items) {
  return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

const store = {
  getJobs({ district, category, work_type, search, page = 1, limit = 12, activeOnly = true } = {}) {
    let jobs = read(jobsFile);
    if (activeOnly) jobs = jobs.filter(j => j.is_active !== 0);

    if (district && district !== 'all') jobs = jobs.filter(j => j.district === district);
    if (category && category !== 'all') jobs = jobs.filter(j => j.category === category);
    if (work_type && work_type !== 'all') jobs = jobs.filter(j => j.work_type === work_type);
    if (search) {
      const term = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(term) ||
        j.company.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term)
      );
    }

    jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = jobs.length;
    const offset = (page - 1) * limit;
    return { jobs: jobs.slice(offset, offset + limit), total };
  },

  getJobById(id) {
    return read(jobsFile).find(j => j.id === Number(id) && j.is_active !== 0) || null;
  },

  getJobByFbPostId(fbPostId) {
    if (!fbPostId) return null;
    return read(jobsFile).find(j => j.fb_post_id === fbPostId && j.is_active !== 0) || null;
  },

  createJob(data) {
    const jobs = read(jobsFile);
    const job = {
      id: nextId(jobs),
      ...data,
      is_active: 1,
      created_at: new Date().toISOString()
    };
    jobs.push(job);
    write(jobsFile, jobs);
    return job;
  },

  countJobs() {
    return read(jobsFile).length;
  },

  getStats() {
    const jobs = read(jobsFile).filter(j => j.is_active !== 0);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const groupBy = (field) => {
      const map = {};
      jobs.forEach(j => { map[j[field]] = (map[j[field]] || 0) + 1; });
      return Object.entries(map)
        .map(([key, count]) => ({ [field]: key, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      total: jobs.length,
      recent: jobs.filter(j => new Date(j.created_at).getTime() >= weekAgo).length,
      byDistrict: groupBy('district').map(r => ({ district: r.district, count: r.count })),
      byCategory: groupBy('category').map(r => ({ category: r.category, count: r.count })),
      byWorkType: groupBy('work_type').map(r => ({ work_type: r.work_type, count: r.count }))
    };
  },

  getUserByEmail(email) {
    return read(usersFile).find(u => u.email === email) || null;
  },

  createUser({ email, password, name }) {
    const users = read(usersFile);
    const user = {
      id: nextId(users),
      email,
      password,
      name,
      created_at: new Date().toISOString()
    };
    users.push(user);
    write(usersFile, users);
    return user;
  }
};

module.exports = store;
