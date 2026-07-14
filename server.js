require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('./database/store');
const { DISTRICTS, CATEGORIES, WORK_TYPES } = require('./config/constants');
const { normalizeJobPayload } = require('./config/bot-normalize');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'lanka-career-hub-dev-secret';
const BOT_API_KEY = process.env.BOT_API_KEY || 'lanka-bot-key-change-me';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login required' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function botAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key !== BOT_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
}

app.get('/api/config', (req, res) => {
  res.json({
    districts: DISTRICTS,
    categories: CATEGORIES,
    workTypes: WORK_TYPES,
    facebookPage: process.env.FACEBOOK_PAGE_URL || 'https://web.facebook.com/lankacareerhub/',
    contactEmail: process.env.CONTACT_EMAIL || 'lankacareerhub@gmail.com',
    contactPhone: process.env.CONTACT_PHONE || '0767640067'
  });
});

app.get('/api/stats', (req, res) => {
  res.json(store.getStats());
});

app.get('/api/jobs', (req, res) => {
  const { district, category, work_type, search, page = 1, limit = 12 } = req.query;
  const { jobs, total } = store.getJobs({
    district, category, work_type, search,
    page: Number(page), limit: Number(limit)
  });
  res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = store.getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Lanka Career Hub', jobs: store.countJobs() });
});

app.post('/api/webhook/jobs', botAuth, (req, res) => {
  const normalized = normalizeJobPayload(req.body);

  if (!normalized.ok) {
    return res.status(400).json({
      error: `Missing required fields: ${normalized.missing.join(', ')}`,
      warnings: normalized.warnings
    });
  }

  const jobData = normalized.job;

  if (jobData.fb_post_id) {
    const existing = store.getJobByFbPostId(jobData.fb_post_id);
    if (existing) {
      return res.json({ id: existing.id, message: 'Job already exists', duplicate: true });
    }
  }

  const job = store.createJob({
    ...jobData,
    source: 'facebook-bot'
  });

  res.status(201).json({
    id: job.id,
    message: 'Job posted successfully',
    warnings: normalized.warnings.length ? normalized.warnings : undefined
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (store.getUserByEmail(email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = store.createUser({ email, password: hash, name });
  const token = jwt.sign({ id: user.id, email, name }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ token, user: { id: user.id, email, name } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = store.getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

function seedJobs() {
  if (store.countJobs() > 0) return;

  const samples = [
    { title: 'Senior Software Engineer', company: 'Tech Lanka Pvt Ltd', description: 'We are looking for an experienced software engineer to join our dynamic team. Must have 3+ years experience in Node.js, React, and cloud technologies.', district: 'Colombo', category: 'it-software', work_type: 'hybrid', salary: 'LKR 250,000 - 400,000', deadline: '2026-07-30' },
    { title: 'Marketing Executive', company: 'Brand Solutions SL', description: 'Creative marketing professional needed to manage digital campaigns and social media presence for leading brands.', district: 'Gampaha', category: 'sales', work_type: 'onsite', salary: 'LKR 80,000 - 120,000', deadline: '2026-07-25' },
    { title: 'Remote Full Stack Developer', company: 'Global Tech Remote', description: 'Work from anywhere! Join our international team building cutting-edge web applications. Flexible hours.', district: 'Colombo', category: 'it-software', work_type: 'remote', salary: 'USD 2,000 - 3,500', deadline: '2026-08-15' },
    { title: 'Nursing Officer', company: 'National Hospital Kandy', description: 'Registered nurse required for general ward. Government hospital benefits included.', district: 'Kandy', category: 'medical', work_type: 'onsite', salary: 'As per government scale', deadline: '2026-07-20' },
    { title: 'Hotel Management Trainee', company: 'Cinnamon Hotels', description: 'Internship program for hospitality management students. 6-month paid internship with accommodation.', district: 'Galle', category: 'hospitality', work_type: 'internship', salary: 'LKR 35,000 + benefits', deadline: '2026-08-01' },
    { title: 'Accountant', company: 'Finance First Ltd', description: 'Qualified accountant (ACA/ACCA) with 2+ years experience in financial reporting and tax compliance.', district: 'Colombo', category: 'accounting', work_type: 'onsite', salary: 'LKR 150,000 - 200,000', deadline: '2026-07-28' },
    { title: 'Online English Teacher', company: 'EduConnect Lanka', description: 'Teach English online to international students. Flexible schedule, work from home. TEFL certification preferred.', district: 'Kurunegala', category: 'education', work_type: 'online', salary: 'LKR 60,000 - 100,000', deadline: '2026-08-10' },
    { title: 'Civil Engineer', company: 'BuildRight Construction', description: 'Site engineer for highway construction project. BSc in Civil Engineering required.', district: 'Matara', category: 'civil-eng', work_type: 'onsite', salary: 'LKR 120,000 - 180,000', deadline: '2026-07-22' },
    { title: 'BPO Customer Support', company: 'CallCenter Pro', description: 'Customer support agents for international clients. Night shift allowance. Training provided.', district: 'Batticaloa', category: 'kpo-bpo', work_type: 'work-from-home', salary: 'LKR 45,000 - 70,000', deadline: '2026-08-05' },
    { title: 'Graphic Designer', company: 'Creative Studio Jaffna', description: 'Talented graphic designer for branding, social media, and print design projects.', district: 'Jaffna', category: 'it-software', work_type: 'hybrid', salary: 'LKR 70,000 - 100,000', deadline: '2026-07-31' },
    { title: 'Warehouse Supervisor', company: 'LogiTrans Lanka', description: 'Manage warehouse operations, inventory, and team of 15 staff members.', district: 'Gampaha', category: 'logistics', work_type: 'onsite', salary: 'LKR 90,000 - 130,000', deadline: '2026-08-08' },
    { title: 'Data Analyst Intern', company: 'Analytics Hub', description: '3-month internship in data analysis using Python, SQL, and Power BI. Great learning opportunity.', district: 'Colombo', category: 'management', work_type: 'internship', salary: 'LKR 30,000', deadline: '2026-07-18' }
  ];

  samples.forEach(job => store.createJob({ ...job, source: 'sample' }));
  console.log(`Seeded ${samples.length} sample jobs`);
}

seedJobs();

app.listen(PORT, () => {
  console.log(`\n  🇱🇰 Lanka Career Hub running at http://localhost:${PORT}\n`);
});
