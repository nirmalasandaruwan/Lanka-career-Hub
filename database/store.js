const mongoose = require('mongoose');

// MongoDB Cloud එකට Connect වීම
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Cloud Database Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- ඩේටා සේව් වෙන විදිහ (Schemas) ---

const jobSchema = new mongoose.Schema({
  id: String,
  title: String,
  company: String,
  description: String,
  apply_link: String,
  fb_post_id: String,
  district: String,
  category: String,
  work_type: String,
  is_active: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  id: String,
  email: String,
  password: String,
  name: String,
  created_at: { type: Date, default: Date.now }
});

const Job = mongoose.model('Job', jobSchema);
const User = mongoose.model('User', userSchema);

// --- ප්‍රධාන ෆන්ක්ෂන් ටික ---

const store = {
  async getJobs({ district, category, work_type, search, page = 1, limit = 12, activeOnly = true } = {}) {
    let query = {};
    if (activeOnly) query.is_active = { $ne: 0 };
    if (district && district !== 'all') query.district = district;
    if (category && category !== 'all') query.category = category;
    if (work_type && work_type !== 'all') query.work_type = work_type;
    
    if (search) {
      const term = new RegExp(search, 'i');
      query.$or = [
        { title: term },
        { company: term },
        { description: term }
      ];
    }

    const offset = (page - 1) * limit;
    
    // Cloud එකෙන් ඩේටා ගේනවා
    const jobs = await Job.find(query)
                          .sort({ created_at: -1 })
                          .skip(offset)
                          .limit(limit)
                          .lean();
                          
    const total = await Job.countDocuments(query);
    return { jobs, total };
  },

  async getJobById(id) {
    return await Job.findOne({ id: String(id), is_active: { $ne: 0 } }).lean();
  },

  async getJobByFbPostId(fbPostId) {
    if (!fbPostId) return null;
    return await Job.findOne({ fb_post_id: fbPostId, is_active: { $ne: 0 } }).lean();
  },

  async createJob(data) {
    const newJob = new Job({
      id: Date.now().toString(), // අලුතින් ID එකක් හදනවා
      ...data,
      is_active: 1
    });
    await newJob.save();
    return newJob.toObject();
  },

  async countJobs() {
    return await Job.countDocuments();
  },

  async getStats() {
    const jobs = await Job.find({ is_active: { $ne: 0 } }).lean();
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

  async getUserByEmail(email) {
    return await User.findOne({ email }).lean();
  },

  async createUser({ email, password, name }) {
    const newUser = new User({
      id: Date.now().toString(),
      email,
      password,
      name
    });
    await newUser.save();
    return newUser.toObject();
  }
};

module.exports = store;