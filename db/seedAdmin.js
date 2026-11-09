require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, queryOne, initDb } = require('./database');

async function seedSuperAdmin() {
  await initDb();
  
  const adminId = process.env.SUPER_ADMIN_ID;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  
  if (!adminId || !password) {
    return;
  }

  const existing = await queryOne('SELECT id FROM admins WHERE "adminId" = $1', [adminId]);
  if (existing) {
    return;
  }

  const hashed = bcrypt.hashSync(password, 12);
  await query(
    'INSERT INTO admins ("adminId", password, role) VALUES ($1, $2, $3)',
    [adminId, hashed, 'superadmin']
  );
  console.log('✅ Super admin configured successfully');
}

if (require.main === module) {
  seedSuperAdmin().catch(err => {
    console.error('Seed admin error:', err);
    process.exit(1);
  });
}

module.exports = seedSuperAdmin;
