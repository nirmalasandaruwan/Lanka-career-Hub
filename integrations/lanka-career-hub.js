/**
 * Lanka Career Hub — safe bot sync (won't break your FB posting flow)
 *
 * GitHub Actions / live bot env:
 *   LANKA_CAREER_HUB_URL=https://your-website.com
 *   LANKA_CAREER_HUB_API_KEY=your-secret-key
 */

const WEBSITE_URL = process.env.LANKA_CAREER_HUB_URL || process.env.WEBSITE_URL || 'http://localhost:3000';
const API_KEY = process.env.LANKA_CAREER_HUB_API_KEY || process.env.BOT_API_KEY || 'lanka-bot-key-change-me';
const TIMEOUT_MS = Number(process.env.LANKA_CAREER_HUB_TIMEOUT_MS || 15000);

function buildPayload(job) {
  return {
    title: job.title,
    company: job.company,
    description: job.description || job.details || job.body || '',
    district: job.district || job.location || 'Colombo',
    category: job.category || job.job_category || 'office-admin',
    work_type: job.work_type || job.workType || 'onsite',
    salary: job.salary || null,
    deadline: job.deadline || job.closing_date || null,
    apply_link: job.apply_link || job.applyLink || job.url || null,
    fb_post_id: job.fb_post_id || job.fbPostId || job.post_id || null
  };
}

async function postJobToWebsite(job) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${WEBSITE_URL}/api/webhook/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(buildPayload(job)),
      signal: controller.signal
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Website post failed (${res.status})`);
    }
    return { ok: true, ...data };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Safe sync — never throws. FB posting continues even if website is down.
 * Call this right after a successful Facebook post.
 */
async function syncJobToWebsite(job, options = {}) {
  try {
    const result = await postJobToWebsite(job);
    if (!result.duplicate) {
      console.log(`[Lanka Career Hub] Job synced: #${result.id} — ${job.title}`);
    }
    return result;
  } catch (err) {
    const message = err.name === 'AbortError' ? 'Website sync timed out' : err.message;
    console.warn(`[Lanka Career Hub] Sync skipped (FB post OK): ${message}`);
    if (options.throwOnError) throw new Error(message);
    return { ok: false, error: message };
  }
}

module.exports = { postJobToWebsite, syncJobToWebsite, buildPayload, WEBSITE_URL, API_KEY };
