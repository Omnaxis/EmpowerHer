const { neon } = require('@neondatabase/serverless');

let sql = null;

function getSQL() {
  if (sql) return sql;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Get your connection string from https://console.neon.tech');
  }
  sql = neon(process.env.DATABASE_URL);
  return sql;
}

// Helper: run a parameterized query and return rows
async function query(text, params = []) {
  const sql = getSQL();
  const rows = await sql.query(text, params);
  return rows;
}

// Helper: run a query and return the first row
async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

// Initialize all tables (uses tagged template literals for DDL)
async function initDb() {
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      "fullName" TEXT NOT NULL,
      mobile TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      "googleId" TEXT UNIQUE,
      avatar TEXT DEFAULT '',
      skills TEXT DEFAULT '',
      "profileCompletion" INTEGER DEFAULT 30,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      pay TEXT NOT NULL,
      description TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      requirements TEXT NOT NULL,
      icon TEXT DEFAULT '',
      "badgeClass" TEXT DEFAULT '',
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES users(id),
      "jobId" INTEGER NOT NULL REFERENCES jobs(id),
      status TEXT DEFAULT 'pending',
      "appliedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("userId", "jobId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id),
      "userId" INTEGER NOT NULL REFERENCES users(id),
      UNIQUE("postId", "userId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      "postId" INTEGER NOT NULL REFERENCES posts(id),
      "userId" INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      duration TEXT NOT NULL,
      level TEXT NOT NULL,
      color TEXT DEFAULT '#264653'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_progress (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES users(id),
      "courseId" INTEGER NOT NULL REFERENCES courses(id),
      completed INTEGER DEFAULT 0,
      "completedAt" TIMESTAMP,
      UNIQUE("userId", "courseId")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS mentors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      icon TEXT DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      "adminId" TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      "createdBy" INTEGER REFERENCES admins(id),
      "createdAt" TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add banned column to users if not exists
  await sql`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='banned') THEN
        ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT false;
      END IF;
    END $$
  `;

  // Add lastLogin column to users if not exists
  await sql`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastLogin') THEN
        ALTER TABLE users ADD COLUMN "lastLogin" TIMESTAMP DEFAULT NOW();
      END IF;
    END $$
  `;

  console.log('✅ All database tables initialized');
}

module.exports = { getSQL, query, queryOne, initDb };
