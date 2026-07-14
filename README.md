# 🇱🇰 Lanka Career Hub

Sri Lanka's premier job vacancy platform — connecting job seekers with opportunities across all 25 districts.

## Features

- **31 Job Categories** — IT, Healthcare, Banking, Education, and more
- **25 Districts** — Filter jobs by any district in Sri Lanka
- **Work Types** — Remote, Work From Home, Online, Internship, Hybrid, On-site
- **Email Login** — User registration and authentication
- **Bot Integration** — Facebook job bot webhook API
- **Live Job Count** — Real-time vacancy statistics
- **Modern UI** — Navy & Gold theme with smooth animations

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your settings (FB page URL, API key, etc.)

# Start the server
npm start
```

Open http://localhost:3000

## Bot Integration

Your Facebook job bot can post vacancies to the website using the webhook API:

```
POST /api/webhook/jobs
Header: X-API-Key: your-bot-api-key

Body:
{
  "title": "Software Engineer",
  "company": "Tech Company",
  "description": "Job description here...",
  "district": "Colombo",
  "category": "it-software",
  "work_type": "remote",
  "salary": "LKR 200,000",
  "deadline": "2026-08-01",
  "apply_link": "https://apply-here.com",
  "fb_post_id": "optional-fb-post-id"
}
```

### Category IDs

`it-software`, `it-hardware`, `accounting`, `banking`, `sales`, `hr`, `management`, `office-admin`, `civil-eng`, `telecom`, `customer-relations`, `logistics`, `engineering`, `manufacturing`, `media`, `hospitality`, `travel`, `sports`, `medical`, `legal`, `quality`, `apparel`, `ticketing`, `education`, `research`, `agriculture`, `security`, `fashion`, `intl-dev`, `kpo-bpo`, `imports-exports`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `JWT_SECRET` | Secret key for auth tokens |
| `BOT_API_KEY` | API key for bot webhook |
| `FACEBOOK_PAGE_URL` | Your Facebook page URL |
| `CONTACT_EMAIL` | Contact email |
| `CONTACT_PHONE` | Contact phone number |

## Tech Stack

- **Backend:** Node.js, Express, SQLite
- **Frontend:** HTML, CSS, Tailwind CSS, JavaScript
- **Auth:** JWT + bcrypt
- **Database:** better-sqlite3
