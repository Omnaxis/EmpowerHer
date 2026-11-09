/**
 * 🌸 EmpowerHer - Centralized Frontend API Configuration
 * 
 * When deploying the frontend on Vercel and the backend on Render:
 * 1. RENDER_BACKEND_URL: Set this to your live Render backend URL.
 *    (e.g., 'https://empowerher-api.onrender.com')
 * 2. If running locally (localhost / 127.0.0.1), it automatically uses the local server.
 * 3. You can also override this anytime in your browser console via:
 *    localStorage.setItem('API_BASE_OVERRIDE', 'https://your-custom-backend.onrender.com')
 */

const APP_CONFIG = {
  // 🔗 Enter your live Render backend URL here:
  RENDER_BACKEND_URL: 'https://empowerher-api-jcaw.onrender.com',
};

// Automatically resolve the active API Base URL
(function() {
  let apiBase = '';

  // 1. Check for manual override stored in localStorage
  try {
    const override = localStorage.getItem('API_BASE_OVERRIDE');
    if (override) {
      window.API_BASE = override.replace(/\/+$/, '');
      console.log('🔧 [EmpowerHer] Using API_BASE override:', window.API_BASE);
      return;
    }
  } catch (e) {}

  // 2. Localhost check: If running locally, use relative path (same server)
  const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.localhost')
  );

  if (isLocalhost) {
    apiBase = '';
  } else {
    // 3. Deployed on Vercel or other external host -> use Render backend URL
    apiBase = APP_CONFIG.RENDER_BACKEND_URL ? APP_CONFIG.RENDER_BACKEND_URL.replace(/\/+$/, '') : '';
  }

  window.API_BASE = apiBase;
  console.log('🌸 [EmpowerHer] API Base URL:', window.API_BASE || '(relative / same-origin)');
})();

// ─── AUTH & SESSION HELPERS (Supports tab-isolated sessions & persistent login) ───
window.getAuthToken = function() {
  return sessionStorage.getItem('empowerher_token') || localStorage.getItem('empowerher_token') || null;
};

window.getAuthUser = function() {
  try {
    const raw = sessionStorage.getItem('empowerher_user') || localStorage.getItem('empowerher_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

window.setAuthSession = function(token, user, remember = true) {
  if (remember) {
    sessionStorage.removeItem('empowerher_token');
    sessionStorage.removeItem('empowerher_user');
    localStorage.setItem('empowerher_token', token);
    localStorage.setItem('empowerher_user', typeof user === 'string' ? user : JSON.stringify(user));
  } else {
    localStorage.removeItem('empowerher_token');
    localStorage.removeItem('empowerher_user');
    sessionStorage.setItem('empowerher_token', token);
    sessionStorage.setItem('empowerher_user', typeof user === 'string' ? user : JSON.stringify(user));
  }
};

window.clearUserAuth = function() {
  sessionStorage.removeItem('empowerher_token');
  sessionStorage.removeItem('empowerher_user');
  localStorage.removeItem('empowerher_token');
  localStorage.removeItem('empowerher_user');
};

// Admin Session Helpers
window.getAdminToken = function() {
  return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || null;
};

window.getAdminUser = function() {
  try {
    const raw = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

window.setAdminSession = function(token, user, remember = true) {
  if (remember) {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', typeof user === 'string' ? user : JSON.stringify(user));
  } else {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    sessionStorage.setItem('adminToken', token);
    sessionStorage.setItem('adminUser', typeof user === 'string' ? user : JSON.stringify(user));
  }
};

window.clearAdminAuth = function() {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminUser');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

