/**
 * EXAMPLE — add this to your GitHub bot after Facebook post succeeds.
 * Copy integrations/lanka-career-hub.js into your bot repo (or npm path).
 */

const { syncJobToWebsite } = require('./lanka-career-hub');

async function postJobToFacebook(job) {
  // ... your existing FB Graph API code ...
  const fbPostId = '1234567890'; // from FB API response: response.id or post_id
  return fbPostId;
}

async function handleNewJob(job) {
  const fbPostId = await postJobToFacebook(job);

  // Safe — never throws, FB flow is already done
  await syncJobToWebsite({
    title: job.title,
    company: job.company,
    description: job.description,
    district: job.district,
    category: job.category,
    work_type: job.work_type,
    salary: job.salary,
    deadline: job.deadline,
    apply_link: job.apply_link,
    fb_post_id: fbPostId
  });
}

module.exports = { handleNewJob };
