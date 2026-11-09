require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Serve static frontend files ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/posts', require('./routes/community'));
app.use('/api/courses', require('./routes/learn'));
app.use('/api/admin', require('./routes/admin'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Frontend Fallback (serves HTML/assets whether on Vercel, Render, or Localhost) ---
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const reqPath = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
  const publicFile = path.join(__dirname, 'public', reqPath.endsWith('.html') ? reqPath : reqPath + '.html');
  const rootFile = path.join(__dirname, reqPath.endsWith('.html') ? reqPath : reqPath + '.html');
  const exactPublic = path.join(__dirname, 'public', reqPath);
  const exactRoot = path.join(__dirname, reqPath);

  if (fs.existsSync(exactPublic) && fs.statSync(exactPublic).isFile()) return res.sendFile(exactPublic);
  if (fs.existsSync(exactRoot) && fs.statSync(exactRoot).isFile()) return res.sendFile(exactRoot);
  if (fs.existsSync(publicFile)) return res.sendFile(publicFile);
  if (fs.existsSync(rootFile)) return res.sendFile(rootFile);

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Error handling middleware ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// --- Initialize DB and start server ---
async function start() {
  if (!process.env.DATABASE_URL) {
    console.log('⚡ No DATABASE_URL found. Running in frontend static/proxy mode.');
    return;
  }

  try {
    const { initDb, queryOne } = require('./db/database');

    // Create all tables
    await initDb();

    // Auto-seed if empty
    const result = await queryOne('SELECT COUNT(*) as count FROM jobs');
    const jobCount = parseInt(result?.count) || 0;
    if (jobCount === 0) {
      console.log('📦 First run detected. Seeding database...');
      const seed = require('./db/seed');
      await seed();
    }

    // Auto-seed super admin
    try {
      const seedAdmin = require('./db/seedAdmin');
      await seedAdmin();
    } catch (err) {
      console.warn('⚠️ Super admin auto-seed notice:', err.message);
    }
  } catch (err) {
    console.warn('⚠️ Database initialization notice:', err.message);
  }
}

// Only listen on port if not running in a serverless environment (like Vercel)
if (!process.env.VERCEL) {
  start().then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 EmpowerHer server running at http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`🌐 Frontend at http://localhost:${PORT}/index.html`);
      console.log(`🔐 Admin Portal at http://localhost:${PORT}/admin.html\n`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
  });
}

module.exports = app;
