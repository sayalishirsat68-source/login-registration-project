/**
 * NGO Portal - Shared Client JavaScript
 * Handles user authentication state, navigation menu synchronization, and notification banners
 */

const localHosts = ['localhost', '127.0.0.1'];
const isLocalHost = localHosts.includes(window.location.hostname);
const isRenderHost = window.location.hostname.endsWith('.onrender.com');
const isLocalDevelopment = isLocalHost || window.location.protocol === 'file:';
const defaultApiUrl = isLocalDevelopment
  ? 'http://localhost:3000'
  : isRenderHost
    ? ''
    : 'https://login-registration-project.onrender.com';
const apiBaseUrl = String(window.NGO_API_URL || window.VITE_API_URL || defaultApiUrl).replace(/\/$/, '');
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

function addPublicNavigationStyles() {
  if (document.getElementById('public-navigation-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'public-navigation-styles';
  styles.textContent = `
    body { overflow-x: hidden; }
    #frontend-view img { max-width: 100%; }
    .stats-section { flex-wrap: wrap; }
    .navbar .site-nav {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    footer,
    .footer {
      background: #23415a !important;
      color: #fff !important;
    }
    footer p,
    footer h4,
    .footer p,
    .footer h4 {
      color: inherit;
    }
    .hope-content-section {
      width: min(1120px, 90%);
      margin: 56px auto;
      padding: 0;
    }
    .hope-section-heading {
      max-width: 720px;
      margin-bottom: 24px;
    }
    .hope-section-heading h2 {
      margin: 0 0 10px;
      color: #1f3a52;
      font-size: clamp(24px, 3vw, 34px);
      line-height: 1.2;
    }
    .hope-section-heading p,
    .hope-content-section > p {
      color: #5d6873;
      line-height: 1.75;
    }
    .hope-card-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }
    .hope-card {
      padding: 24px;
      background: #fff;
      border: 1px solid #dfe8e2;
      border-top: 4px solid #198754;
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(31, 58, 82, 0.07);
    }
    .hope-card h3 {
      margin: 0 0 8px;
      color: #1f3a52;
      font-size: 19px;
    }
    .hope-card p,
    .hope-card li {
      color: #5d6873;
      font-size: 14px;
      line-height: 1.7;
    }
    .hope-card ul {
      margin: 12px 0 0;
      padding-left: 18px;
    }
    .hope-steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      counter-reset: hope-step;
    }
    .hope-step {
      position: relative;
      padding: 22px 22px 22px 62px;
      background: #f0f8f2;
      border-radius: 8px;
    }
    .hope-step::before {
      counter-increment: hope-step;
      content: counter(hope-step);
      position: absolute;
      top: 20px;
      left: 20px;
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #198754;
      color: #fff;
      font-weight: 700;
    }
    .hope-step h3 { margin: 0 0 6px; color: #1f3a52; font-size: 17px; }
    .hope-step p { margin: 0; color: #5d6873; font-size: 14px; line-height: 1.65; }
    .hope-cta {
      width: min(1120px, 90%);
      margin: 56px auto;
      padding: 34px;
      background: #23415a;
      color: #fff;
      border-radius: 8px;
      text-align: center;
    }
    .hope-cta h2 { margin: 0 0 8px; font-size: 28px; }
    .hope-cta p { max-width: 680px; margin: 0 auto 20px; color: #d9e6ef; line-height: 1.7; }
    .hope-cta a {
      display: inline-block;
      margin: 4px 6px;
      padding: 10px 18px;
      border-radius: 4px;
      background: #198754;
      color: #fff;
      font-weight: 700;
      text-decoration: none;
    }
    .hope-cta a.secondary { background: #fff; color: #1f3a52; }
    .hope-faq {
      border-top: 1px solid #dfe8e2;
    }
    .hope-faq details {
      padding: 16px 0;
      border-bottom: 1px solid #dfe8e2;
    }
    .hope-faq summary { cursor: pointer; color: #1f3a52; font-weight: 700; }
    .hope-faq p { margin: 10px 0 0; color: #5d6873; line-height: 1.7; }
    @media (max-width: 760px) {
      .stats-section { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      .hope-content-section { margin: 38px auto; }
      .hope-card-grid,
      .hope-steps { grid-template-columns: 1fr; }
      .hope-cta { margin: 38px auto; padding: 28px 20px; }
    }
    .navbar .site-nav-links {
      display: flex;
      align-items: center;
      gap: 18px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .navbar .site-nav-links li { list-style: none; position: relative; }
    .navbar .site-nav-links a,
    .navbar .site-nav-dropdown-toggle {
      color: inherit;
      background: none;
      border: 0;
      cursor: pointer;
      font: inherit;
      text-decoration: none;
      white-space: nowrap;
    }
    .navbar .site-nav-dropdown-toggle::after {
      content: '\\25BE';
      display: inline-block;
      margin-left: 6px;
      font-size: 0.8em;
      transition: transform 0.2s ease;
    }
    .navbar .site-nav-dropdown:hover .site-nav-dropdown-toggle::after,
    .navbar .site-nav-dropdown-toggle[aria-expanded="true"]::after {
      transform: rotate(180deg);
    }
    .navbar .site-nav-submenu {
      display: none;
      position: absolute;
      top: calc(100% + 12px);
      left: 50%;
      min-width: 170px;
      padding: 8px 0;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14);
      transform: translateX(-50%);
      z-index: 1100;
    }
    .navbar .site-nav-dropdown:hover .site-nav-submenu,
    .navbar .site-nav-submenu.is-open { display: block; }
    .navbar .site-nav-submenu a {
      display: block;
      padding: 9px 16px;
    }
    .navbar .site-nav-submenu a:hover { background: #f0fdf4; }
    .navbar .site-nav-donate {
      display: inline-block;
      padding: 7px 14px;
      border-radius: 4px;
      background: #198754;
      color: #fff !important;
      font-weight: 600;
    }
    .navbar .site-nav-toggle {
      display: none;
      padding: 6px 9px;
      border: 1px solid currentColor;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
    }
    @media (max-width: 768px) {
      .navbar .site-nav-toggle { display: block; }
      .navbar .site-nav { position: relative; }
      .navbar .site-nav-links {
        display: none;
        position: absolute;
        top: calc(100% + 15px);
        right: 0;
        min-width: 190px;
        padding: 8px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.14);
      }
      .navbar .site-nav-links.is-open { display: block; }
      .navbar .site-nav-links li { margin: 0; }
      .navbar .site-nav-links a,
      .navbar .site-nav-dropdown-toggle {
        display: block;
        width: 100%;
        padding: 9px 10px;
        text-align: left;
      }
      .navbar .site-nav-submenu {
        position: static;
        min-width: 0;
        padding: 0 0 4px 12px;
        box-shadow: none;
        transform: none;
      }
    }
  `;
  document.head.appendChild(styles);
}

function initializePublicNavigation() {
  let navbar = document.querySelector('.navbar');
  if (!navbar) {
    navbar = document.createElement('header');
    navbar.className = 'navbar';
    document.body.prepend(navbar);
  }

  navbar.innerHTML = `
    <div class="logo"><span class="brand-mark" aria-hidden="true">SS</span> Hope Hand NGO</div>
    <nav class="site-nav" aria-label="Primary navigation">
      <button class="site-nav-toggle" type="button" aria-expanded="false" aria-label="Open navigation">&#9776;</button>
      <ul class="site-nav-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="projects.html">Our Work</a></li>
        <li class="site-nav-dropdown">
          <button class="site-nav-dropdown-toggle" type="button" aria-expanded="false">About Us</button>
          <ul class="site-nav-submenu">
            <li><a href="projects.html">Our Project</a></li>
            <li><a href="media.html">Our Media</a></li>
            <li><a href="features.html">Our Features</a></li>
            <li><a href="join us.html">Join Us</a></li>
          </ul>
        </li>
        <li><a href="blog.html">Blog</a></li>
        <li><a href="contact us.html">Contact Us</a></li>
        <li><a class="site-nav-donate" href="donate.html">Donate</a></li>
      </ul>
    </nav>
  `;

  const menuToggle = navbar.querySelector('.site-nav-toggle');
  const menu = navbar.querySelector('.site-nav-links');
  const dropdownToggle = navbar.querySelector('.site-nav-dropdown-toggle');
  const submenu = navbar.querySelector('.site-nav-submenu');

  menuToggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  dropdownToggle.addEventListener('click', () => {
    const isOpen = submenu.classList.toggle('is-open');
    dropdownToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', event => {
    if (!navbar.contains(event.target)) {
      menu.classList.remove('is-open');
      submenu.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      dropdownToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function initializePublicFooter() {
  const footer = document.querySelector('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-column">
      <p>&copy; 2026 Hope Hand NGO. Every project brings life and dignity to those in need.</p>
    </div>
  `;
}

// Update only existing authentication controls; public navigation never exposes them.
function updateNavAuthState() {
  const user = getCurrentUser();
  document.querySelectorAll('.auth-nav-item').forEach(authItem => {
    if (!user) {
      authItem.remove();
      return;
    }

    authItem.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-left: 8px;">
        <span style="font-size: 13px; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-weight: 600;">
          ${user.full_name} (${user.role})
        </span>
        <button onclick="logoutUser()" style="background: #ef4444; color: white; border: none; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer;">
          Logout
        </button>
      </div>
    `;
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
  addPublicNavigationStyles();
  initializePublicNavigation();
  initializePublicFooter();
  updateNavAuthState();
  const authenticated = await bootstrapAuthState();

  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (['login.html', 'register.html'].includes(currentPage) && authenticated) {
    window.location.href = 'about us.html';
  }
});
