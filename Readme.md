# 🌸 EmpowerHer: Empowering Homepreneurs

**EmpowerHer** is a simplified, highly accessible web platform designed specifically for women—particularly those who are starting home-based businesses, seeking micro-employment, or wanting to learn new digital and business skills, but may not be highly tech-savvy. 

With a warm, welcoming design and simplified workflows, EmpowerHer breaks down technological barriers to help women achieve financial independence and connect with a supportive community.

---

## 🌟 Key Features

### 1. 🔑 Super Simple Authentication
* **Phone & Password Login:** Sign up or log in quickly with just a mobile number and a password.
* **Google Sign-In:** One-click integration for even faster access.
* **Friendly UX:** Includes password visibility toggles, clear input labels, and helpful visual icons to prevent errors.

### 2. 🏠 Encouraging Dashboard (`dashboard.html`)
* **Time-of-day Greeting:** Greets the user dynamically (e.g., *"Good morning, sister! Ready to grow today?"*).
* **Encouragement Banner:** Features regular motivational quotes and success highlights.
* **Activity Overview:** Visual stats showing courses completed, active job applications, and community points.
* **Simple Navigation:** Large, color-coded buttons with clear emojis for easy moving between sections.

### 3. 💼 Micro-Employment Job Board (`jobs.html`)
* **Visual Search & Filters:** Filter job listings easily using visual emoji tags (e.g., Cooking 🍲, Teaching 📚, Craft 🧶, Stitching 👗).
* **Transparent Pricing:** Compensation is clearly highlighted in green pills (e.g., `₹8,000 / month`, `₹300 / hour`).
* **One-Click Application:** Simplified forms to apply directly from the home or from mobile devices.

### 4. 📚 Micro-Learning Hub (`learn.html`)
* **Bite-Sized Lessons:** Focuses on short, practical modules tailored for home business owners (e.g., *"How to use Google Pay safely"*, *"Pricing your Tiffin Service"*).
* **Progress Tracking:** A simple visual progress bar showing how much of each course has been completed.
* **Gamified Encouragement:** Displays an animated streak tracker (e.g., 🔥 "3 Day Streak") to keep users motivated.

### 5. 👥 Supportive Community (`community.html`)
* **Social Post Feed:** Write simple posts, like, and comment on other homepreneurs' success stories and questions.
* **Mentor Matching:** Direct connections to verified mentors (e.g., business guides, craft experts) for guidance.
* **Community Events:** A schedule of upcoming group meetings and workshops.

---

## 🎨 Design Philosophy for Accessibility

To ensure the platform is comfortable for women who are not well-aware of modern technology:
* **Large Tap Targets:** Interactive elements, buttons, and form inputs have a minimum size of `44px` to make mobile clicking easy and prevent mistakes.
* **Visual Emojis:** Crucial labels and headings are accompanied by descriptive emojis to clarify their purpose instantly.
* **Warm & Calm Colors:** Built using soft, modern pastel gradients and custom HSL palettes (using the **Nunito** font) rather than harsh, generic solid colors.
* **Minimized Input Friction:** Reduced typing requirements by offering select pills, clear lists, and direct action buttons.

---

## 🛠️ Technology Stack

* **Frontend:** Vanilla HTML5, CSS3 (Custom Variables & Animations), JavaScript (ES6+).
* **Backend:** Node.js, Express.js.
* **Database:** PostgreSQL on [Neon Serverless](https://neon.tech/) (`@neondatabase/serverless`).
* **Environment Configuration:** Dotenv for environment variables.
* **Deployment Support:** Pre-configured `render.yaml` for instant hosting on Render.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your computer.

### 2. Install Dependencies
Clone or download the project folder, open your terminal in the directory, and run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a file named `.env` in the root directory (or edit the existing one) and add the following keys:
```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
DATABASE_URL=your_neon_postgresql_connection_string_here
```
> [!NOTE]
> If you don't have a Neon Database URL, create a free project at [Neon](https://console.neon.tech) and copy your connection string.

### 4. Run the Server
* **For Development (with Auto-Reload):**
  ```bash
  npm run dev
  ```
* **For Production:**
  ```bash
  npm start
  ```

### 5. Database Initialization & Seeding
The backend is designed to initialize the PostgreSQL database automatically upon startup. 
* If the tables do not exist, they will be created automatically.
* If the `jobs` table is empty on startup, the system will **automatically seed** the database with sample jobs, courses, mentors, and demo users.
* To force-seed the database manually at any time, run:
  ```bash
  npm run seed
  ```

---

## 📁 Project Structure

```text
EmpowerHer/
├── db/
│   ├── database.js     # Neon PostgreSQL connection client and schemas
│   └── seed.js         # Auto-seeding script with starter jobs & courses
├── middleware/
│   └── auth.js         # JWT verification middleware
├── routes/
│   ├── auth.js         # User registration, login, and Google login routes
│   ├── jobs.js         # Jobs retrieval and application submission routes
│   ├── learn.js        # Course retrieval and progress update routes
│   └── community.js    # Posts, comments, likes, and mentor matching routes
├── .env                # Local environment configuration variables
├── community.html      # Community discussion page
├── dashboard.html      # Main landing & user hub page
├── index.html          # Authentication page (Login/Register)
├── jobs.html           # Jobs listing & filter board
├── learn.html          # Learning progress and course hub
├── package.json        # Node.js dependencies and run scripts
├── render.yaml         # Hosting configuration for Render deployment
├── server.js           # Express.js application initialization
└── Readme.md           # This project guide
```

---

## 📡 Backend API Endpoints

### Authentication
* `POST /api/auth/register` - Register a new user with mobile number.
* `POST /api/auth/login` - Authenticate a user with mobile number and password.
* `POST /api/auth/google` - Authenticate a user via Google OAuth ID Token.
* `GET /api/auth/me` - Fetch the current authenticated user's profile details.

### Jobs & Applications
* `GET /api/jobs` - Retrieve all available jobs.
* `POST /api/jobs/:id/apply` - Submit an application for a specific job.

### Education & Progress
* `GET /api/courses` - Retrieve all learning modules.
* `GET /api/courses/progress` - Fetch the authenticated user's completion progress.
* `POST /api/courses/:id/complete` - Mark a course module as completed.

### Community Feed & Mentors
* `GET /api/posts` - Fetch the interactive community post feed.
* `POST /api/posts` - Submit a new text update to the community feed.
* `POST /api/posts/:id/like` - Like or unlike a community post.
* `GET /api/posts/:id/comments` - Retrieve comments for a post.
* `POST /api/posts/:id/comments` - Add a new comment to a post.
* `GET /api/posts/mentors/all` - Retrieve the list of verified guides/mentors.

### System Health
* `GET /api/health` - Health check status verification.
