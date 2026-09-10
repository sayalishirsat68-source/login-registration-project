/**
 * NGO Portal - Shared Client JavaScript
 * Handles user authentication state, navigation menu synchronization, and notification banners
 */

const apiBaseUrl = String(window.NGO_API_URL || window.VITE_API_URL || '').replace(/\/$/, '');
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options = {}) => {
  const requestUrl = typeof input === 'string' ? input : input.url;
  if (!requestUrl.startsWith('/api/')) return nativeFetch(input, options);

  const requestOptions = { ...options, credentials: 'include' };
  return nativeFetch(`${apiBaseUrl}${requestUrl}`, requestOptions);
};

function protectedRouteGuard({ redirectTo = 'login.html', allowedRoles = null } = {}) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return false;
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role) && user.role !== 'Admin') {
    window.location.href = redirectTo;
    return false;
  }

  return true;
}

// Helper to get active user
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('ngo_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Save active user
function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('ngo_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ngo_user');
  }
  updateNavAuthState();
}

async function bootstrapAuthState() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      setCurrentUser(null);
      return false;
    }
    const data = await response.json();
    if (data && data.user) {
      setCurrentUser(data.user);
      return true;
    }
    setCurrentUser(null);
    return false;
  } catch (error) {
    setCurrentUser(null);
    return false;
  }
}

// User logout
async function logoutUser() {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (e) {
    // Clear the local display state even if the server is unavailable.
  }
  localStorage.removeItem('ngo_user');
  showToast('You have been logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 800);
}

// Update navbar with user login state
function updateNavAuthState() {
  const user = getCurrentUser();
  const navLinks = document.querySelectorAll('.nav-links, .menu-links');

  navLinks.forEach(nav => {
    let authItem = nav.querySelector('.auth-nav-item');
    if (!authItem) {
      authItem = document.createElement('li');
      authItem.className = 'auth-nav-item';
      nav.appendChild(authItem);
    }

    if (user) {
      authItem.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-left: 8px;">
          <span style="font-size: 13px; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-weight: 600;">
            👤 ${user.full_name} (${user.role})
          </span>
          <button onclick="logoutUser()" style="background: #ef4444; color: white; border: none; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
            Logout
          </button>
        </div>
      `;
    } else {
      authItem.innerHTML = `
        <a href="login.html" style="background: #198754; color: #fff; padding: 6px 14px; border-radius: 4px; font-weight: 600; text-decoration: none; font-size: 14px; display: inline-block;">
          Login / Register
        </a>
      `;
    }
  });
}

// Simple toast notification system
function showToast(message, type = 'success') {
  let toast = document.getElementById('ngo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ngo-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      padding: 14px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      box-shadow: 0 10px 25px rgba(0,0,0,0.18);
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(20px);
      pointer-events: none;
      max-width: 380px;
    `;
    document.body.appendChild(toast);
  }

  const colors = {
    success: '#15803d',
    error: '#b91c1c',
    info: '#0369a1',
    warning: '#b45309'
  };

  toast.style.backgroundColor = colors[type] || colors.success;
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
  }, 4000);
}

// Auto-run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  updateNavAuthState();
  const authenticated = await bootstrapAuthState();

  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (['login.html', 'register.html'].includes(currentPage) && authenticated) {
    window.location.href = 'about us.html';
  }
});
