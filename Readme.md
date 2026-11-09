# 🌸 EmpowerHer: Empowering Homepreneurs

**EmpowerHer** is an accessible, modern full-stack web platform designed specifically for women—particularly homemakers starting home-based businesses, seeking flexible micro-employment, or learning new digital and business skills. 

With a warm, welcoming design and simplified workflows, EmpowerHer breaks down technological barriers to help women achieve financial independence, build confidence, and connect with a supportive community.

---

## 🌟 Key Features

### 1. 🔑 Simple & Secure Authentication
* **Phone & Password Login:** Fast mobile-first registration and login.
* **Google One-Click Sign-In:** Integrated Google OAuth 2.0 authentication.
* **Safety & Account Protection:** Automatic ban status validation and login timestamp tracking.
* **Friendly UX:** Clear input labels, password visibility toggles, and gentle inline validation.

### 2. 🏠 Homepreneur Dashboard & Profile Hub (`dashboard.html`)
* **Dynamic Time-of-Day Greeting:** Personalized welcomes (e.g., *"Good morning, sister! Ready to grow today?"*).
* **Encouragement Banner:** Motivational quotes and uplifting success stories.
* **Comprehensive User Profile Modal:**
  - View and update full name, bio, and location.
  - **Skill Tag Selection:** 10 one-tap presets (Cooking, Tailoring, Digital Marketing, Tutoring, Handicrafts, etc.) plus custom skill additions.
  - **Smart Profile Completion:** Dynamic 0–100% completion calculation with live progress bar.
  - **My Applications:** Track submitted job applications and their review statuses in real time.
  - **My Courses:** View active learning modules and completion progress.

### 3. 💼 Micro-Employment Job Board (`jobs.html`)
* **Category Tag Filters:** Filter opportunities with visual tags (Cooking 🍲, Teaching 📚, Craft 🧶, Stitching 👗, Beauty 💄, etc.).
* **Transparent Pricing:** Compensation is clearly highlighted (e.g., `₹8,000 / month`, `₹300 / hour`).
* **One-Click Application:** Simplified modal form to apply instantly from mobile or desktop.

### 4. 📚 Micro-Learning Hub (`learn.html`)
* **Bite-Sized Practical Lessons:** Short, focused video lessons tailored for home business owners (e.g., *"How to use UPI safely"*, *"Pricing your Tiffin Service"*).
* **Progress Tracking:** Animated progress bars showing course completion percentage.
* **Gamified Encouragement:** Animated streak tracker (e.g., 🔥 "3 Day Streak") to build consistent learning habits.

### 5. 👥 Supportive Community (`community.html`)
* **Interactive Social Feed:** Share stories, ask questions, like posts, and post comments.
* **Mentor Matching:** Direct connections to verified mentors and community leaders for guidance.
* **Community Events:** Listing of upcoming virtual meetups, webinars, and skill workshops.

### 6. 🔐 Admin & Super Admin Management Portal (`admin.html`)
A dedicated, role-based administrative command center:
* **Interactive Analytics Dashboard:**
  - Key metric cards: Total Users, Active Jobs, Total Applications, Community Posts, Total Admins.
  - **Clickable Stat Cards:** Click any card to navigate directly to its management section.
  - **Chart.js Visualizations:** 7-day registration and application trend line chart, plus an application status breakdown doughnut chart.
  - **Today's Activity Highlights:** Today's logins, new user signups, and pending review counts.
* **User Management:**
  - Searchable, paginated user table.
  - User detail modal showing profile completion, skills, bio, location, and application history.
  - Instant **Ban / Unban** toggle controls with safety confirmation modals.
* **Job Postings Management:**
  - Full CRUD: Create, view, edit, and delete job listings with category, pay, requirements, and timing tags.
* **Application Review Workflow:**
  - Filter applications by status (`Pending`, `Approved`, `Rejected`) or search by applicant name/job title.
  - One-click status updates (`Approve` / `Reject` / `Pending`).
* **Community Moderation:**
  - Review all user posts, track likes/comments, and remove inappropriate content.
* **Admin Access Management (Super Admin Exclusive):**
  - View all admin accounts.
  - Create new admin accounts with unique ID and credentials.
  - Revoke and delete admin accounts.
* **Admin Audit Logging System:**
  - Immutable activity audit log recording every admin action (approving applications, banning users, deleting jobs/posts, creating admins).
  - Searchable and filterable by action type and admin ID, visible to all administrators.

---

## 🎨 Design Philosophy for Accessibility

Built specifically for users who may have varying levels of digital literacy:
* **Large Tap Targets:** Interactive buttons, inputs, and cards have a minimum size of `44px` for comfortable mobile usage.
* **Visual Iconography & Emojis:** Crucial labels, sections, and tags feature illustrative emojis for immediate visual recognition.
* **Calm & Warm Palette:** Soft pastel gradients, warm backgrounds (`#FDF8F4`), emerald primary accents (`#2A9D8F`), and terracotta secondary highlights (`#E76F51`) using the accessible **Nunito** typography.
* **Minimized Typing Friction:** Pill-based filters, select controls, and clear one-click actions reduce keyboard entry.

---

## 🏗️ Architecture & Hybrid Deployment

EmpowerHer uses a decoupled, modern architecture:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       Frontend (Vercel)         │       │        Backend (Render)         │
│  - Static CDN Edge Hosting      │ ────> │  - Node.js / Express Server     │
│  - HTML5 / CSS3 / Vanilla JS    │ HTTP  │  - REST API Routes              │
│  - Reverse-Proxy (/api rewrites)│       │  - JWT Auth & Admin Middleware  │
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                                           ▼
                                          ┌─────────────────────────────────┐
                                          │      Database (Neon Cloud)      │
                                          │  - Serverless PostgreSQL        │
                                          │  - Connection Pooling           │
                                          └─────────────────────────────────┘
```

* **Frontend:** Hosted on **Vercel** (`https://empower-her-three.vercel.app`) with static edge caching, clean URLs, and reverse proxy rewrites to bypass cross-origin friction.
* **Backend API:** Hosted on **Render** (`https://empowerher-api-jcaw.onrender.com`) running Express.js with dynamic CORS handling (`origin: true`, credentials enabled).
* **Database:** Serverless PostgreSQL hosted on **[Neon](https://neon.tech/)**, utilizing `@neondatabase/serverless` for connection pooling.
* **Centralized Configuration:** Managed through `config.js` with automatic localhost vs. cloud backend detection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Variables, Flexbox/Grid, Animations), Vanilla JavaScript (ES6+), Chart.js |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon Serverless) |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs`, Google OAuth 2.0 (`google-auth-library`) |
| **Hosting** | Vercel (Frontend), Render (Backend API) |
| **Configuration** | `dotenv`, `cors`, `vercel.json`, `render.yaml` |

---

## ⚙️ Setup & Local Installation

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Git](https://git-scm.com/)

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Omnaxis/EmpowerHer.git
cd EmpowerHer
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root directory:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
DATABASE_URL=your_neon_postgresql_connection_string_here
SUPER_ADMIN_ID=your_secure_id_here
SUPER_ADMIN_PASSWORD=your_secure_password_here
```
> [!IMPORTANT]
> The `.env` file is strictly protected by `.gitignore` and must never be committed to public repositories.

### 4. Run the Application
* **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```
* **Production Mode:**
  ```bash
  npm start
  ```

### 5. Automatic Database Initialization & Seeding
* Tables are automatically verified and created on startup (`initDb`).
* If the database is fresh, starter jobs, courses, mentors, and demo users are automatically seeded.
* The Super Admin account is automatically verified and seeded on first run using your `.env` credentials.
* To manually force-seed the database at any time:
  ```bash
  npm run seed
  ```

---

## 📁 Project Structure

```text
EmpowerHer/
├── db/
│   ├── database.js          # Neon PostgreSQL connection pooling, DDL schemas, and queries
│   ├── seed.js              # Initial database seeder for jobs, courses, and mentors
│   └── seedAdmin.js         # Super Admin initializer (reads from environment variables)
├── middleware/
│   ├── auth.js              # User JWT authentication middleware
│   └── adminAuth.js         # Admin JWT & Role verification middleware (Admin / Super Admin)
├── public/                  # Vercel deployment root & static frontend assets
│   ├── admin.html           # Full-featured Admin & Super Admin command portal
│   ├── community.html       # Community discussions, events, and mentor directory
│   ├── config.js            # Centralized API endpoint routing & backend URL resolution
│   ├── dashboard.html       # Homepreneur dashboard with profile & skill completion hub
│   ├── index.html           # Authentication portal (Login & Register with Google Sign-In)
│   ├── jobs.html            # Micro-employment job board & application flow
│   ├── learn.html           # Micro-course learning catalog and streak tracker
│   └── index.js             # Vercel serverless entrypoint
├── routes/
│   ├── admin.js             # Admin APIs (dashboard metrics, user/job/app/admin CRUD, audit logs)
│   ├── auth.js              # User auth (register, login, Google OAuth, profile management)
│   ├── community.js         # Community posts, likes, comments, and mentor matching
│   ├── jobs.js              # Job listings and applicant submissions
│   └── learn.js             # Learning courses and user progress tracking
├── .env                     # Local environment secrets (ignored by Git)
├── .gitignore               # Excludes secrets (.env) and database caches
├── config.js                # Root frontend configuration
├── package.json             # Node dependencies and scripts
├── render.yaml              # Infrastructure-as-code for Render backend deployment
├── server.js                # Express application, CORS rules, and static route fallbacks
├── vercel.json              # Vercel deployment rules, clean URLs, and API reverse-proxy
└── Readme.md                # Comprehensive project documentation
```

---

## 📡 Backend API Reference

### 🔐 User Authentication & Profile
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user with name, mobile, and password | No |
| `POST` | `/api/auth/login` | Authenticate with mobile and password | No |
| `POST` | `/api/auth/google` | Authenticate via Google OAuth credential token | No |
| `GET` | `/api/auth/me` | Fetch active user profile, applications, and courses | Yes (User) |
| `PUT` | `/api/auth/profile` | Update profile info (full name, bio, location, skills) | Yes (User) |

### 💼 Jobs & Applications
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/jobs` | Retrieve all active job listings (supports category filter) | No |
| `POST` | `/api/jobs/:id/apply` | Submit an application for a specific job | Yes (User) |

### 📚 Learning & Progress
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/courses` | Retrieve all available micro-learning modules | No |
| `GET` | `/api/courses/progress` | Get user course progress and daily completion streak | Yes (User) |
| `POST` | `/api/courses/:id/complete` | Mark a course module as completed | Yes (User) |

### 👥 Community & Mentorship
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/posts` | Retrieve community feed posts (supports authorization) | Optional |
| `POST` | `/api/posts` | Create a new community post | Yes (User) |
| `POST` | `/api/posts/:id/like` | Toggle like/unlike on a post | Yes (User) |
| `GET` | `/api/posts/:id/comments` | Retrieve comments for a specific post | No |
| `POST` | `/api/posts/:id/comments` | Post a comment on a discussion thread | Yes (User) |
| `GET` | `/api/posts/mentors/all` | List all verified guides and mentors | No |

### 🛡️ Admin Portal (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/admin/login` | Authenticate admin/superadmin and return 12-hour JWT | No |
| `GET` | `/api/admin/dashboard/stats` | Analytics summary, 7-day registration/application trends, today metrics | Yes (Admin) |
| `GET` | `/api/admin/users` | Paginated and searchable user list | Yes (Admin) |
| `GET` | `/api/admin/users/:id` | Detailed user profile, applied jobs, and course history | Yes (Admin) |
| `PUT` | `/api/admin/users/:id/ban` | Ban or unban a user account (logged to audit trail) | Yes (Admin) |
| `GET` | `/api/admin/jobs` | Retrieve all jobs for administration | Yes (Admin) |
| `POST` | `/api/admin/jobs` | Create a new job opportunity | Yes (Admin) |
| `PUT` | `/api/admin/jobs/:id` | Update an existing job listing | Yes (Admin) |
| `DELETE` | `/api/admin/jobs/:id` | Delete a job listing | Yes (Admin) |
| `GET` | `/api/admin/applications` | Paginated applications list with status filters | Yes (Admin) |
| `PUT` | `/api/admin/applications/:id/status` | Update application status (`pending`, `approved`, `rejected`) | Yes (Admin) |
| `GET` | `/api/admin/posts` | Retrieve all community posts with author details | Yes (Admin) |
| `DELETE` | `/api/admin/posts/:id` | Delete an inappropriate community post | Yes (Admin) |
| `GET` | `/api/admin/admins` | List all registered admin accounts | Yes (Super Admin) |
| `POST` | `/api/admin/admins` | Create a new admin account | Yes (Super Admin) |
| `DELETE` | `/api/admin/admins/:id` | Revoke and delete an admin account | Yes (Super Admin) |
| `GET` | `/api/admin/logs` | Searchable, paginated audit trail of all administrative actions | Yes (Admin) |

### 🩺 System Health
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service uptime and timestamp verification | No |

---

## 🔒 Security & Privacy Best Practices

* **Zero Credential Exposure:** Secret keys, database credentials, and super admin passwords are kept strictly in server-side environment variables and are never bundled into client scripts.
* **Separation of Concerns:** Database transactions are isolated on Render; client files on Vercel never interact with database drivers directly.
* **Auditability:** Every administrative modification (banning users, changing application status, removing posts, creating admins) writes a permanent record to the `admin_logs` database table.
* **Password Encryption:** All passwords (user and admin) are salted and hashed using `bcryptjs` with standard work factors.
* **Strict Role Enforcement:** Sensitive actions such as creating or revoking admin access are enforced at the middleware layer (`requireSuperAdmin`).

---

## 📄 License
This project is licensed under the [ISC License](LICENSE).
