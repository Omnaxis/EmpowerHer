const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query, queryOne } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client();

// --- Public Auth Configuration (e.g., Google OAuth Client ID) ---
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, fullName: user.fullName, mobile: user.mobile, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, mobile, password } = req.body;
    if (!fullName || !mobile || !password) return res.status(400).json({ error: 'Full name, mobile, and password are required.' });
    if (!/^\d{10}$/.test(mobile)) return res.status(400).json({ error: 'Mobile number must be exactly 10 digits.' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

    const existing = await queryOne('SELECT id FROM users WHERE mobile = $1', [mobile]);
    if (existing) return res.status(409).json({ error: 'An account with this mobile number already exists.' });

    const hashed = bcrypt.hashSync(password, 10);
    const result = await queryOne(
      `INSERT INTO users ("fullName", mobile, password, "profileCompletion") VALUES ($1, $2, $3, $4) RETURNING *`,
      [fullName, mobile, hashed, 30]
    );
    const user = result;
    const token = generateToken(user);

    res.status(201).json({ message: 'Account created!', token, user: { id: user.id, fullName: user.fullName, mobile: user.mobile, profileCompletion: user.profileCompletion } });
  } catch (err) { console.error('Register error:', err); res.status(500).json({ error: 'Server error during registration.' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) return res.status(400).json({ error: 'Mobile and password are required.' });

    const user = await queryOne('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (!user) return res.status(401).json({ error: 'No account found with this mobile number.' });
    if (!user.password) return res.status(401).json({ error: 'This account uses Google Sign-In.' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Incorrect password.' });

    if (user.banned) return res.status(403).json({ error: 'Your account has been suspended. Contact support for assistance.' });

    await query('UPDATE users SET "lastLogin" = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    res.json({ message: 'Login successful!', token, user: { id: user.id, fullName: user.fullName, mobile: user.mobile, profileCompletion: user.profileCompletion } });
  } catch (err) { console.error('Login error:', err); res.status(500).json({ error: 'Server error during login.' }); }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential is required.' });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Google OAuth is not configured on the server. Please add GOOGLE_CLIENT_ID to the environment variables.' });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    const fullName = name || (email ? email.split('@')[0] : 'Homepreneur');

    let user = await queryOne('SELECT * FROM users WHERE "googleId" = $1', [googleId]);
    if (!user && email) user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);

    if (!user) {
      user = await queryOne(
        `INSERT INTO users ("fullName", email, "googleId", avatar, "profileCompletion") VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [fullName, email || null, googleId, picture || '', 40]
      );
    } else if (!user.googleId) {
      await query('UPDATE users SET "googleId" = $1, avatar = $2 WHERE id = $3', [googleId, picture || '', user.id]);
      user = await queryOne('SELECT * FROM users WHERE id = $1', [user.id]);
    }

    if (user.banned) return res.status(403).json({ error: 'Your account has been suspended. Contact support for assistance.' });

    await query('UPDATE users SET "lastLogin" = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    res.json({ message: 'Google login successful!', token, user: { id: user.id, fullName: user.fullName, email: user.email, avatar: user.avatar, profileCompletion: user.profileCompletion } });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: err.message || 'Google authentication failed.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne(
      `SELECT id, "fullName", mobile, email, avatar, skills, bio, location, "profileCompletion", "createdAt" FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const [appCount, postCount, apps, progress] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM applications WHERE "userId" = $1', [req.user.id]),
      queryOne('SELECT COUNT(*) as count FROM posts WHERE "userId" = $1', [req.user.id]),
      query(
        `SELECT a.id, a.status, a."appliedAt", j.title, j.category, j.pay, j.icon
         FROM applications a JOIN jobs j ON a."jobId" = j.id
         WHERE a."userId" = $1 ORDER BY a."appliedAt" DESC`,
        [req.user.id]
      ),
      query(
        `SELECT up.completed, up."completedAt", c.title, c.category, c.duration
         FROM user_progress up JOIN courses c ON up."courseId" = c.id
         WHERE up."userId" = $1`,
        [req.user.id]
      )
    ]);

    res.json({
      user: {
        ...user,
        applicationCount: parseInt(appCount?.count) || 0,
        postCount: parseInt(postCount?.count) || 0,
        applications: apps || [],
        courses: progress || []
      }
    });
  } catch (err) { console.error('Me error:', err); res.status(500).json({ error: 'Server error.' }); }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, mobile, email, skills, bio, location } = req.body;
    const userId = req.user.id;

    const existing = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
    if (!existing) return res.status(404).json({ error: 'User not found.' });

    const newName = fullName !== undefined ? fullName.trim() : existing.fullName;
    const newSkills = skills !== undefined ? skills.trim() : (existing.skills || '');
    const newBio = bio !== undefined ? bio.trim() : (existing.bio || '');
    const newLoc = location !== undefined ? location.trim() : (existing.location || '');

    if (!newName) {
      return res.status(400).json({ error: 'Full name cannot be empty.' });
    }

    // Handle mobile number update
    let newMobile = existing.mobile;
    if (mobile !== undefined && mobile !== null) {
      const trimmedMobile = mobile.toString().trim();
      if (trimmedMobile) {
        if (!/^\d{10}$/.test(trimmedMobile)) {
          return res.status(400).json({ error: 'Mobile number must be exactly 10 digits.' });
        }
        const mobileConflict = await queryOne('SELECT id FROM users WHERE mobile = $1 AND id != $2', [trimmedMobile, userId]);
        if (mobileConflict) {
          return res.status(409).json({ error: 'An account with this mobile number already exists.' });
        }
        newMobile = trimmedMobile;
      }
    }

    // Handle email update (allow linking email if user registered with phone)
    let newEmail = existing.email;
    if (email !== undefined && email !== null) {
      const trimmedEmail = email.toString().trim();
      if (trimmedEmail && trimmedEmail !== existing.email) {
        // If account is linked to Google, keep the authenticated Google email
        if (existing.googleId && existing.email) {
          newEmail = existing.email;
        } else {
          const emailConflict = await queryOne('SELECT id FROM users WHERE email = $1 AND id != $2', [trimmedEmail, userId]);
          if (emailConflict) {
            return res.status(409).json({ error: 'An account with this email address already exists.' });
          }
          newEmail = trimmedEmail;
        }
      }
    }

    // Smart completion calculation (0 - 100%)
    let completion = 30; // base for account creation
    if (newName.length >= 3) completion += 10;
    if (newMobile) completion += 15;
    if (newEmail) completion += 10;
    if (newSkills.length > 0) completion += 20;
    if (newBio.length >= 5) completion += 10;
    if (newLoc.length >= 2) completion += 5;
    completion = Math.min(completion, 100);

    const updated = await queryOne(
      `UPDATE users
       SET "fullName" = $1, mobile = $2, email = $3, skills = $4, bio = $5, location = $6, "profileCompletion" = $7
       WHERE id = $8
       RETURNING id, "fullName", mobile, email, avatar, skills, bio, location, "profileCompletion", "createdAt"`,
      [newName, newMobile, newEmail, newSkills, newBio, newLoc, completion, userId]
    );

    res.json({
      message: 'Profile updated successfully! 🎉',
      user: updated
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

module.exports = router;
