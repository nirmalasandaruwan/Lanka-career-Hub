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

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await store.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const { district, category, work_type, search, page = 1, limit = 12 } = req.query;
    const { jobs, total } = await store.getJobs({
      district, category, work_type, search,
      page: Number(page), limit: Number(limit)
    });
    res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching jobs' });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await store.getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching job' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const count = await store.countJobs();
    res.json({ ok: true, service: 'Lanka Career Hub', jobs: count });
  } catch (error) {
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.post('/api/webhook/jobs', botAuth, async (req, res) => {
  try {
    const normalized = normalizeJobPayload(req.body);

    if (!normalized.ok) {
      return res.status(400).json({
        error: `Missing required fields: ${normalized.missing.join(', ')}`,
        warnings: normalized.warnings
      });
    }

    const jobData = normalized.job;

    if (jobData.fb_post_id) {
      const existing = await store.getJobByFbPostId(jobData.fb_post_id);
      if (existing) {
        return res.json({ id: existing.id, message: 'Job already exists', duplicate: true });
      }
    }

    const job = await store.createJob({
      ...jobData,
      source: 'facebook-bot'
    });

    res.status(201).json({
      id: job.id,
      message: 'Job posted successfully',
      warnings: normalized.warnings.length ? normalized.warnings : undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error saving job' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
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

    const existingUser = await store.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const user = await store.createUser({ email, password: hash, name });
    const token = jwt.sign({ id: user.id, email, name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user.id, email, name } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await store.getUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`\n 🚀 Lanka Career Hub API is running on port ${PORT}\n`);
});