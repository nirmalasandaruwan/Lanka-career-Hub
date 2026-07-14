const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const CATEGORIES = [
  { id: 'it-software', name: 'IT-Sware/DB/QA/Web/Graphics/GIS', icon: '💻' },
  { id: 'it-hardware', name: 'IT-HWare/Networks/Systems', icon: '🖥️' },
  { id: 'accounting', name: 'Accounting/Auditing/Finance', icon: '📊' },
  { id: 'banking', name: 'Banking & Finance/Insurance', icon: '🏦' },
  { id: 'sales', name: 'Sales/Marketing/Merchandising', icon: '📈' },
  { id: 'hr', name: 'HR/Training', icon: '👥' },
  { id: 'management', name: 'Corporate Management/Analysts', icon: '💼' },
  { id: 'office-admin', name: 'Office Admin/Secretary/Receptionist', icon: '📋' },
  { id: 'civil-eng', name: 'Civil Eng/Interior Design/Architecture', icon: '🏗️' },
  { id: 'telecom', name: 'IT-Telecoms', icon: '📡' },
  { id: 'customer-relations', name: 'Customer Relations/Public Relations', icon: '🤝' },
  { id: 'logistics', name: 'Logistics/Warehouse/Transport', icon: '🚚' },
  { id: 'engineering', name: 'Eng-Mech/Auto/Elec', icon: '⚙️' },
  { id: 'manufacturing', name: 'Manufacturing/Operations', icon: '🏭' },
  { id: 'media', name: 'Media/Advert/Communication', icon: '📺' },
  { id: 'hospitality', name: 'Hotel/Restaurant/Hospitality', icon: '🏨' },
  { id: 'travel', name: 'Travel/Tourism', icon: '✈️' },
  { id: 'sports', name: 'Sports/Fitness/Recreation', icon: '⚽' },
  { id: 'medical', name: 'Medical/Nursing/Healthcare', icon: '🏥' },
  { id: 'legal', name: 'Legal/Law', icon: '⚖️' },
  { id: 'quality', name: 'Supervision/Quality Control', icon: '✅' },
  { id: 'apparel', name: 'Apparel/Clothing', icon: '👔' },
  { id: 'ticketing', name: 'Ticketing/Airline/Marine', icon: '🎫' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'research', name: 'R&D/Science/Research', icon: '🔬' },
  { id: 'agriculture', name: 'Agriculture/Dairy/Environment', icon: '🌾' },
  { id: 'security', name: 'Security', icon: '🛡️' },
  { id: 'fashion', name: 'Fashion/Design/Beauty', icon: '✨' },
  { id: 'intl-dev', name: 'International Development', icon: '🌍' },
  { id: 'kpo-bpo', name: 'KPO/BPO', icon: '📞' },
  { id: 'imports-exports', name: 'Imports/Exports', icon: '🚢' }
];

const WORK_TYPES = [
  { id: 'onsite', name: 'On-site', icon: '🏢' },
  { id: 'remote', name: 'Remote', icon: '🏠' },
  { id: 'work-from-home', name: 'Work From Home', icon: '💻' },
  { id: 'online', name: 'Online', icon: '🌐' },
  { id: 'internship', name: 'Internship', icon: '🎓' },
  { id: 'hybrid', name: 'Hybrid', icon: '🔄' }
];

module.exports = { DISTRICTS, CATEGORIES, WORK_TYPES };
