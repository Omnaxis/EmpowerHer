const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../db/database');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/adminAuth');

const router = express.Router();

function generateAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, adminId: admin.adminId, role: admin.role, isAdmin: true },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// ─── Admin Action Logger ────────────────────────────────────────
async function logAdminAction(admin, action, targetType, targetId, details) {
  try {
    if (!admin) return;
    await query(
      `INSERT INTO admin_logs ("adminRefId", "adminId", "adminRole", action, "targetType", "targetId", details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [admin.id || null, admin.adminId || 'System', admin.role || 'admin', action, targetType, targetId || null, details]
    );
  } catch (err) {
    console.error('Failed to write admin log:', err);
  }
}

// ─── POST /login ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password) {
      return res.status(400).json({ error: 'Admin ID and password are required.' });
    }

    const admin = await queryOne('SELECT * FROM admins WHERE "adminId" = $1', [adminId]);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const valid = bcrypt.compareSync(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = generateAdminToken(admin);

    await logAdminAction(admin, 'ADMIN_LOGIN', 'auth', admin.id, `Admin "${admin.adminId}" (${admin.role}) signed in to portal`);

    res.json({
      message: 'Admin login successful!',
      token,
      admin: { id: admin.id, adminId: admin.adminId, role: admin.role }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during admin login.' });
  }
});

// ─── GET /dashboard/stats ───────────────────────────────────────
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      users,
      jobs,
      applications,
      posts,
      courses,
      bannedUsers,
      newUsersToday,
      loginsToday,
      applicationsToday,
      appStatusCounts,
      recentUsers,
      recentApplications,
      recentPosts
    ] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM users'),
      queryOne('SELECT COUNT(*) as count FROM jobs'),
      queryOne('SELECT COUNT(*) as count FROM applications'),
      queryOne('SELECT COUNT(*) as count FROM posts'),
      queryOne('SELECT COUNT(*) as count FROM courses'),
      queryOne('SELECT COUNT(*) as count FROM users WHERE banned = true'),
      queryOne('SELECT COUNT(*) as count FROM users WHERE DATE("createdAt") = CURRENT_DATE'),
      queryOne('SELECT COUNT(*) as count FROM users WHERE DATE("lastLogin") = CURRENT_DATE'),
      queryOne('SELECT COUNT(*) as count FROM applications WHERE DATE("appliedAt") = CURRENT_DATE'),
      query('SELECT status, COUNT(*) as count FROM applications GROUP BY status'),
      query(`
        SELECT u.id, u."fullName", u.mobile, u.email, u.skills, u."profileCompletion", u.banned, u."createdAt", u."lastLogin",
               (SELECT COUNT(*) FROM applications WHERE "userId" = u.id) as "applicationCount"
        FROM users u ORDER BY u."createdAt" DESC LIMIT 5
      `),
      query(`
        SELECT a.id, a.status, a."appliedAt",
               u.id as "userId", u."fullName" as "userName", u.mobile as "userMobile", u.email as "userEmail",
               j.id as "jobId", j.title as "jobTitle", j.category as "jobCategory", j.pay as "jobPay"
        FROM applications a
        JOIN users u ON u.id = a."userId"
        JOIN jobs j ON j.id = a."jobId"
        ORDER BY a."appliedAt" DESC LIMIT 5
      `),
      query(`
        SELECT p.id, p.content, p.likes, p."createdAt",
               u."fullName" as "userName", u.avatar as "userAvatar",
               (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as "commentCount"
        FROM posts p
        JOIN users u ON u.id = p."userId"
        ORDER BY p."createdAt" DESC LIMIT 5
      `)
    ]);

    // Build 7-day registration and application trends
    const [userTrends, appTrends] = await Promise.all([
      query(`
        SELECT TO_CHAR(DATE("createdAt"), 'YYYY-MM-DD') as day, COUNT(*) as count
        FROM users
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE("createdAt")
      `),
      query(`
        SELECT TO_CHAR(DATE("appliedAt"), 'YYYY-MM-DD') as day, COUNT(*) as count
        FROM applications
        WHERE "appliedAt" >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE("appliedAt")
      `)
    ]);

    // Normalize last 7 days so days with 0 counts still appear
    const userMap = {};
    (userTrends || []).forEach(r => { userMap[r.day] = parseInt(r.count) || 0; });
    const appMap = {};
    (appTrends || []).forEach(r => { appMap[r.day] = parseInt(r.count) || 0; });

    const past7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      past7Days.push({
        date: dayStr,
        label,
        users: userMap[dayStr] || 0,
        applications: appMap[dayStr] || 0
      });
    }

    // Format app status counts into a nice object { pending: x, approved: y, rejected: z }
    const statusObj = { pending: 0, approved: 0, rejected: 0 };
    (appStatusCounts || []).forEach(s => {
      if (statusObj.hasOwnProperty(s.status)) {
        statusObj[s.status] = parseInt(s.count) || 0;
      }
    });

    res.json({
      totalUsers: parseInt(users?.count) || 0,
      totalJobs: parseInt(jobs?.count) || 0,
      totalApplications: parseInt(applications?.count) || 0,
      totalPosts: parseInt(posts?.count) || 0,
      totalCourses: parseInt(courses?.count) || 0,
      bannedUsers: parseInt(bannedUsers?.count) || 0,
      newUsersToday: parseInt(newUsersToday?.count) || 0,
      loginsToday: parseInt(loginsToday?.count) || 0,
      applicationsToday: parseInt(applicationsToday?.count) || 0,
      statusBreakdown: statusObj,
      chartTrends: past7Days,
      recentUsers: recentUsers || [],
      recentApplications: recentApplications || [],
      recentPosts: recentPosts || []
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Server error fetching dashboard stats.' });
  }
});

// ─── GET /users ─────────────────────────────────────────────────
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE (u."fullName" ILIKE $1 OR u.mobile ILIKE $1 OR u.email ILIKE $1)`;
    }

    const countResult = await queryOne(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count) || 0;

    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const users = await query(
      `SELECT u.id, u."fullName", u.mobile, u.email, u.avatar, u.skills, u."profileCompletion", u.banned, u."createdAt",
              (SELECT COUNT(*) FROM applications a WHERE a."userId" = u.id) as "applicationCount",
              (SELECT COUNT(*) FROM posts p WHERE p."userId" = u.id) as "postCount"
       FROM users u
       ${whereClause}
       ORDER BY u."createdAt" DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...params, limit, offset]
    );

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// ─── GET /users/:id ─────────────────────────────────────────────
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID.' });

    const user = await queryOne(
      `SELECT id, "fullName", mobile, email, avatar, skills, "profileCompletion", banned, "createdAt" FROM users WHERE id = $1`,
      [userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const [applications, posts, progress] = await Promise.all([
      query(
        `SELECT a.id, a.status, a."appliedAt",
                j.id as "jobId", j.title as "jobTitle", j.category as "jobCategory", j.pay as "jobPay"
         FROM applications a
         JOIN jobs j ON j.id = a."jobId"
         WHERE a."userId" = $1
         ORDER BY a."appliedAt" DESC`,
        [userId]
      ),
      query(
        `SELECT id, content, likes, "createdAt" FROM posts WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
        [userId]
      ),
      query(
        `SELECT up.completed, up."completedAt",
                c.id as "courseId", c.title as "courseTitle", c.category as "courseCategory"
         FROM user_progress up
         JOIN courses c ON c.id = up."courseId"
         WHERE up."userId" = $1`,
        [userId]
      )
    ]);

    res.json({ user, applications, posts, courseProgress: progress });
  } catch (err) {
    console.error('Get user detail error:', err);
    res.status(500).json({ error: 'Server error fetching user details.' });
  }
});

// ─── PUT /users/:id/ban ─────────────────────────────────────────
router.put('/users/:id/ban', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID.' });

    const { banned } = req.body;
    if (typeof banned !== 'boolean') {
      return res.status(400).json({ error: 'banned field must be a boolean.' });
    }

    const user = await queryOne('SELECT id, "fullName" FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await query('UPDATE users SET banned = $1 WHERE id = $2', [banned, userId]);

    await logAdminAction(
      req.admin,
      banned ? 'BAN_USER' : 'UNBAN_USER',
      'user',
      userId,
      `${banned ? 'Banned' : 'Unbanned'} user "${user.fullName}" (ID: #${userId})`
    );

    res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully.`, banned });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ error: 'Server error updating user ban status.' });
  }
});

// ─── GET /applications ──────────────────────────────────────────
router.get('/applications', authenticateAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const search = req.query.search || '';

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`a.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(u."fullName" ILIKE $${paramIndex} OR j.title ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await queryOne(
      `SELECT COUNT(*) as count
       FROM applications a
       JOIN users u ON u.id = a."userId"
       JOIN jobs j ON j.id = a."jobId"
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count) || 0;

    const applications = await query(
      `SELECT a.id, a.status, a."appliedAt",
              u.id as "userId", u."fullName" as "userName", u.mobile as "userMobile", u.email as "userEmail",
              j.id as "jobId", j.title as "jobTitle", j.category as "jobCategory", j.pay as "jobPay"
       FROM applications a
       JOIN users u ON u.id = a."userId"
       JOIN jobs j ON j.id = a."jobId"
       ${whereClause}
       ORDER BY a."appliedAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Server error fetching applications.' });
  }
});

// ─── PUT /applications/:id/status ───────────────────────────────
router.put('/applications/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const appId = parseInt(req.params.id);
    if (isNaN(appId)) return res.status(400).json({ error: 'Invalid application ID.' });

    const { status } = req.body;
    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const app = await queryOne(
      `SELECT a.id, u."fullName" as "userName", j.title as "jobTitle"
       FROM applications a
       JOIN users u ON u.id = a."userId"
       JOIN jobs j ON j.id = a."jobId"
       WHERE a.id = $1`,
      [appId]
    );
    if (!app) return res.status(404).json({ error: 'Application not found.' });

    await query('UPDATE applications SET status = $1 WHERE id = $2', [status, appId]);

    await logAdminAction(
      req.admin,
      status === 'approved' ? 'APPROVE_APPLICATION' : status === 'rejected' ? 'REJECT_APPLICATION' : 'UPDATE_APPLICATION_STATUS',
      'application',
      appId,
      `Changed application #${appId} for "${app.userName}" on job "${app.jobTitle}" to "${status}"`
    );

    res.json({ message: `Application status updated to ${status}.`, status });
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({ error: 'Server error updating application status.' });
  }
});

// ─── GET /jobs ──────────────────────────────────────────────────
router.get('/jobs', authenticateAdmin, async (req, res) => {
  try {
    const jobs = await query(
      `SELECT j.*,
              (SELECT COUNT(*) FROM applications a WHERE a."jobId" = j.id) as "applicationCount"
       FROM jobs j
       ORDER BY j."createdAt" DESC`
    );
    res.json({ jobs });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ error: 'Server error fetching jobs.' });
  }
});

// ─── POST /jobs ─────────────────────────────────────────────────
router.post('/jobs', authenticateAdmin, async (req, res) => {
  try {
    const { title, category, pay, description, time, location, requirements, icon, badgeClass } = req.body;
    if (!title || !category || !pay || !description || !time || !location || !requirements) {
      return res.status(400).json({ error: 'title, category, pay, description, time, location, and requirements are required.' });
    }

    const job = await queryOne(
      `INSERT INTO jobs (title, category, pay, description, time, location, requirements, icon, "badgeClass")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, category, pay, description, time, location, requirements, icon || '', badgeClass || '']
    );

    await logAdminAction(req.admin, 'CREATE_JOB', 'job', job.id, `Created job "${job.title}" (${job.category}, ${job.pay})`);

    res.status(201).json({ message: 'Job created successfully.', job });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ error: 'Server error creating job.' });
  }
});

// ─── PUT /jobs/:id ──────────────────────────────────────────────
router.put('/jobs/:id', authenticateAdmin, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) return res.status(400).json({ error: 'Invalid job ID.' });

    const existing = await queryOne('SELECT id FROM jobs WHERE id = $1', [jobId]);
    if (!existing) return res.status(404).json({ error: 'Job not found.' });

    const { title, category, pay, description, time, location, requirements, icon, badgeClass } = req.body;

    const job = await queryOne(
      `UPDATE jobs SET
        title = COALESCE($1, title),
        category = COALESCE($2, category),
        pay = COALESCE($3, pay),
        description = COALESCE($4, description),
        time = COALESCE($5, time),
        location = COALESCE($6, location),
        requirements = COALESCE($7, requirements),
        icon = COALESCE($8, icon),
        "badgeClass" = COALESCE($9, "badgeClass")
       WHERE id = $10 RETURNING *`,
      [title, category, pay, description, time, location, requirements, icon, badgeClass, jobId]
    );

    await logAdminAction(req.admin, 'UPDATE_JOB', 'job', jobId, `Updated job "${job.title}" (ID: #${jobId})`);

    res.json({ message: 'Job updated successfully.', job });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ error: 'Server error updating job.' });
  }
});

// ─── DELETE /jobs/:id ───────────────────────────────────────────
router.delete('/jobs/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) return res.status(400).json({ error: 'Invalid job ID.' });

    const existing = await queryOne('SELECT id, title FROM jobs WHERE id = $1', [jobId]);
    if (!existing) return res.status(404).json({ error: 'Job not found.' });

    // Delete related applications first
    await query('DELETE FROM applications WHERE "jobId" = $1', [jobId]);
    await query('DELETE FROM jobs WHERE id = $1', [jobId]);

    await logAdminAction(req.admin, 'DELETE_JOB', 'job', jobId, `Deleted job "${existing.title}" (ID: #${jobId}) and all its applications`);

    res.json({ message: 'Job and its applications deleted successfully.' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ error: 'Server error deleting job.' });
  }
});

// ─── GET /posts ─────────────────────────────────────────────────
router.get('/posts', authenticateAdmin, async (req, res) => {
  try {
    const posts = await query(
      `SELECT p.id, p.content, p.likes, p."createdAt",
              u.id as "userId", u."fullName" as "userName", u.avatar as "userAvatar"
       FROM posts p
       JOIN users u ON u.id = p."userId"
       ORDER BY p."createdAt" DESC`
    );
    res.json({ posts });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Server error fetching posts.' });
  }
});

// ─── DELETE /posts/:id ──────────────────────────────────────────
router.delete('/posts/:id', authenticateAdmin, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) return res.status(400).json({ error: 'Invalid post ID.' });

    const existing = await queryOne('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!existing) return res.status(404).json({ error: 'Post not found.' });

    // Delete related likes and comments first
    await query('DELETE FROM post_likes WHERE "postId" = $1', [postId]);
    await query('DELETE FROM comments WHERE "postId" = $1', [postId]);
    await query('DELETE FROM posts WHERE id = $1', [postId]);

    await logAdminAction(req.admin, 'DELETE_POST', 'post', postId, `Deleted community post #${postId} ("${(existing.content || '').substring(0, 40)}...")`);

    res.json({ message: 'Post and its likes/comments deleted successfully.' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Server error deleting post.' });
  }
});

// ─── GET /admins ────────────────────────────────────────────────
router.get('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await query(
      `SELECT id, "adminId", role, "createdBy", "createdAt" FROM admins ORDER BY "createdAt" DESC`
    );
    res.json({ admins });
  } catch (err) {
    console.error('Get admins error:', err);
    res.status(500).json({ error: 'Server error fetching admins.' });
  }
});

// ─── POST /admins ───────────────────────────────────────────────
router.post('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { adminId, password } = req.body;
    if (!adminId || !password) {
      return res.status(400).json({ error: 'adminId and password are required.' });
    }

    const existing = await queryOne('SELECT id FROM admins WHERE "adminId" = $1', [adminId]);
    if (existing) {
      return res.status(409).json({ error: 'An admin with this ID already exists.' });
    }

    const hashed = bcrypt.hashSync(password, 12);
    const admin = await queryOne(
      `INSERT INTO admins ("adminId", password, role, "createdBy") VALUES ($1, $2, $3, $4) RETURNING id, "adminId", role, "createdBy", "createdAt"`,
      [adminId, hashed, 'admin', req.admin.id]
    );

    await logAdminAction(req.admin, 'CREATE_ADMIN', 'admin', admin.id, `Created new admin "${adminId}"`);

    res.status(201).json({ message: 'Admin created successfully.', admin });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Server error creating admin.' });
  }
});

// ─── DELETE /admins/:id ─────────────────────────────────────────
router.delete('/admins/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    if (isNaN(adminId)) return res.status(400).json({ error: 'Invalid admin ID.' });

    // Cannot delete self
    if (adminId === req.admin.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    const target = await queryOne('SELECT id, role, "adminId" FROM admins WHERE id = $1', [adminId]);
    if (!target) return res.status(404).json({ error: 'Admin not found.' });

    // Cannot delete other super admins
    if (target.role === 'superadmin') {
      return res.status(403).json({ error: 'Cannot delete a super admin account.' });
    }

    await query('DELETE FROM admins WHERE id = $1', [adminId]);

    await logAdminAction(req.admin, 'DELETE_ADMIN', 'admin', adminId, `Deleted admin "${target.adminId}" (ID: #${adminId})`);

    res.json({ message: 'Admin deleted successfully.' });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ error: 'Server error deleting admin.' });
  }
});

// ─── GET /logs (Visible to all Admins and Super Admins) ───────────
router.get('/logs', authenticateAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const action = req.query.action || '';
    const search = req.query.search || '';

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(action);
    }
    if (search) {
      conditions.push(`("adminId" ILIKE $${paramIndex} OR details ILIKE $${paramIndex} OR "targetType" ILIKE $${paramIndex} OR action ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await queryOne(`SELECT COUNT(*) as count FROM admin_logs ${whereClause}`, params);
    const total = parseInt(countResult?.count) || 0;

    const logs = await query(
      `SELECT * FROM admin_logs ${whereClause} ORDER BY "createdAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Server error fetching admin logs.' });
  }
});

module.exports = router;
