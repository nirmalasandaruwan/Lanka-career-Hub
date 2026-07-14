const { DISTRICTS, CATEGORIES, WORK_TYPES } = require('./constants');

const WORK_TYPE_ALIASES = {
  onsite: 'onsite',
  'on-site': 'onsite',
  'on site': 'onsite',
  office: 'onsite',
  remote: 'remote',
  wfh: 'work-from-home',
  'work from home': 'work-from-home',
  'work-from-home': 'work-from-home',
  online: 'online',
  internship: 'internship',
  intern: 'internship',
  hybrid: 'hybrid'
};

function normalizeDistrict(input) {
  if (!input) return { district: 'Colombo', warning: 'district_missing_defaulted_colombo' };
  const trimmed = String(input).trim();
  const found = DISTRICTS.find(d => d.toLowerCase() === trimmed.toLowerCase());
  if (found) return { district: found };
  return { district: 'Colombo', warning: `invalid_district_${trimmed}_defaulted_colombo` };
}

function normalizeCategory(input) {
  if (!input) return { category: 'office-admin', warning: 'category_missing_defaulted_office_admin' };
  const raw = String(input).trim().toLowerCase();

  let found = CATEGORIES.find(c => c.id === raw || c.name.toLowerCase() === raw);
  if (!found) {
    found = CATEGORIES.find(c =>
      c.name.toLowerCase().includes(raw) ||
      c.id.includes(raw) ||
      raw.includes(c.id)
    );
  }
  if (found) return { category: found.id };
  return { category: 'office-admin', warning: `invalid_category_${input}_defaulted_office_admin` };
}

function normalizeWorkType(input) {
  if (!input) return { work_type: 'onsite' };
  const raw = String(input).trim().toLowerCase();
  const mapped = WORK_TYPE_ALIASES[raw];
  if (mapped) return { work_type: mapped };
  const found = WORK_TYPES.find(w => w.id === raw || w.name.toLowerCase() === raw);
  if (found) return { work_type: found.id };
  return { work_type: 'onsite', warning: `invalid_work_type_${input}_defaulted_onsite` };
}

function normalizeJobPayload(body) {
  const warnings = [];
  const title = String(body.title || '').trim();
  const company = String(body.company || '').trim();
  let description = String(body.description || '').trim();

  if (!description) {
    description = [title, company].filter(Boolean).join(' — ') || 'Job vacancy';
    warnings.push('description_missing_auto_filled');
  }

  const districtResult = normalizeDistrict(body.district);
  const categoryResult = normalizeCategory(body.category);
  const workTypeResult = normalizeWorkType(body.work_type);

  [districtResult, categoryResult, workTypeResult].forEach(r => {
    if (r.warning) warnings.push(r.warning);
  });

  return {
    ok: Boolean(title && company),
    missing: [
      !title && 'title',
      !company && 'company'
    ].filter(Boolean),
    job: {
      title,
      company,
      description,
      district: districtResult.district,
      category: categoryResult.category,
      work_type: workTypeResult.work_type,
      salary: body.salary ? String(body.salary).trim() : null,
      deadline: body.deadline ? String(body.deadline).trim() : null,
      apply_link: body.apply_link ? String(body.apply_link).trim() : null,
      fb_post_id: body.fb_post_id ? String(body.fb_post_id).trim() : null
    },
    warnings
  };
}

module.exports = { normalizeJobPayload, normalizeDistrict, normalizeCategory, normalizeWorkType };
