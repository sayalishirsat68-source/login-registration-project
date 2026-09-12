const path = require('path');
const bcrypt = require('bcryptjs');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { db, dataDirectory, now } = require('./database');
const { requireAuth, userView } = require('./middleware/authMiddleware');
const { requireRole } = require('./middleware/roleMiddleware');
const { validateRegistration, validateLogin, validatePasswordChange, normalizeEmail } = require('./validators/authValidator');

const app = express();
const frontendDir = path.join(__dirname, '../frontend');
const PORT = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const adminPassword = process.env.ADMIN_PASSWORD || (production ? null : 'admin123');
if (!adminPassword) throw new Error('ADMIN_PASSWORD must be set in production.');
if (production && !process.env.SESSION_SECRET) throw new Error('SESSION_SECRET must be set in production.');

const clean = value => value === null || value === undefined ? '' : String(value).trim();
const email = value => clean(value).toLowerCase();
const required = (body, fields) => fields.every(field => clean(body[field]));
const error = (res, status, message) => res.status(status).json({ message });
const projectView = project => ({ id: project.id, title: project.title, description: project.description, status: project.status, startDate: project.start_date, endDate: project.end_date, location: project.location, imageUrl: project.image_url });
const normalizeOrigin = value => clean(value).replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');

class SQLiteSessionStore extends session.Store {
  get(id, callback) {
    try {
      const row = db.prepare('SELECT expires_at, session_json FROM sessions WHERE session_id = ?').get(id);
      if (!row || (row.expires_at && row.expires_at <= Date.now())) {
        if (row) this.destroy(id, () => {});
        return callback(null, null);
      }
      callback(null, JSON.parse(row.session_json));
    } catch (err) { callback(err); }
  }

  set(id, sessionData, callback) {
    try {
      const expiresAt = sessionData.cookie && sessionData.cookie.expires ? new Date(sessionData.cookie.expires).getTime() : null;
      db.prepare('INSERT INTO sessions (session_id, expires_at, session_json) VALUES (?, ?, ?) ON CONFLICT(session_id) DO UPDATE SET expires_at = excluded.expires_at, session_json = excluded.session_json').run(id, expiresAt, JSON.stringify(sessionData));
      callback(null);
    } catch (err) { callback(err); }
  }

  destroy(id, callback) {
    try { db.prepare('DELETE FROM sessions WHERE session_id = ?').run(id); callback(null); } catch (err) { callback(err); }
  }

  touch(id, sessionData, callback) {
    try {
      const expiresAt = sessionData.cookie && sessionData.cookie.expires ? new Date(sessionData.cookie.expires).getTime() : null;
      db.prepare('UPDATE sessions SET expires_at = ? WHERE session_id = ?').run(expiresAt, id);
      callback(null);
    } catch (err) { callback(err); }
  }
}

function audit(req, action, resource, resourceId = null) {
  db.prepare('INSERT INTO audit_logs (user_id, action, resource, resource_id, created_at) VALUES (?, ?, ?, ?, ?)').run(req.session.user.user_id, action, resource, resourceId, now());
}

const authenticated = requireAuth;
const adminOnly = requireRole('Admin');

function seedAdmin() {
  if (db.prepare('SELECT user_id FROM users WHERE email = ?').get('admin@ngo.org')) return;
  db.prepare('INSERT INTO users (full_name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Administrator', 'admin@ngo.org', bcrypt.hashSync(adminPassword, 12), 'Admin', 'active', now());
  if (!production) console.warn('Development admin created: admin@ngo.org. Set ADMIN_PASSWORD before deployment.');
}
seedAdmin();

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(helmet({ contentSecurityPolicy: false }));
app.use((req, res, next) => {
  const configuredOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGIN]
    .flatMap(value => String(value || '').split(','))
    .map(normalizeOrigin)
    .filter(Boolean)
    .map(value => value.replace(/\/$/, ''));

  const devOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  const allowedOrigins = new Set([...configuredOrigins, ...devOrigins]);
  const requestOrigin = req.headers.origin ? normalizeOrigin(req.headers.origin) : null;
  const isVercelOrigin = requestOrigin && /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(requestOrigin);

  if (requestOrigin && !allowedOrigins.has(requestOrigin) && !isVercelOrigin) {
    return error(res, 403, 'Origin is not allowed.');
  }

  if (requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: process.env.BODY_LIMIT || '100kb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '100kb' }));
app.use(session({
  store: new SQLiteSessionStore(),
  secret: process.env.SESSION_SECRET || (production ? undefined : 'local-development-session-secret'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    secure: production || process.env.COOKIE_SECURE === 'true',
    maxAge: 8 * 60 * 60 * 1000
  }
}));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-8', legacyHeaders: false }));
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

app.get('/healthz', (req, res) => res.json({ status: 'ok', database: 'sqlite', time: now() }));

app.post('/api/register', authLimit, async (req, res, next) => {
  const validation = validateRegistration(req.body);
  if (!validation.valid) return res.status(400).json({ success: false, message: 'Validation failed.', errors: validation.errors });

  const { fullName, email: userEmail, password, role } = validation.value;
  try {
    const safeRole = role === 'Admin' ? 'Member' : role || 'Member';
    const result = db.prepare('INSERT INTO users (full_name, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(fullName, userEmail, await bcrypt.hash(password, 12), safeRole, 'active', now());
    const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'User registered successfully!', user: userView(user) });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ success: false, message: 'This email is already registered.' });
    next(err);
  }
});

app.post('/api/login', authLimit, async (req, res, next) => {
  const validation = validateLogin(req.body);
  if (!validation.valid) return res.status(400).json({ success: false, message: 'Validation failed.', errors: validation.errors });

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(validation.value.email, 'active');
    if (!user || !(await bcrypt.compare(validation.value.password, user.password_hash))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = userView(user);
      res.json({ success: true, message: 'Login successful!', user: req.session.user });
    });
  } catch (err) { next(err); }
});
app.post('/api/logout', (req, res, next) => req.session.destroy(err => err ? next(err) : (res.clearCookie('connect.sid'), res.json({ message: 'Logged out successfully.' }))));
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ success: true, user: req.session.user }));
app.get('/api/me', authenticated, (req, res) => res.json({ user: req.session.user }));
app.get('/api/users', requireRole('Admin'), (req, res) => res.json({ users: db.prepare('SELECT user_id, full_name, email, role, status, created_at FROM users ORDER BY user_id DESC').all() }));
app.patch('/api/me/password', authenticated, async (req, res, next) => {
  const validation = validatePasswordChange(req.body);
  if (!validation.valid) return error(res, 400, Object.values(validation.errors)[0]);

  const { currentPassword, newPassword } = validation.value;
  try {
    const user = db.prepare('SELECT password_hash FROM users WHERE user_id = ?').get(req.session.user.user_id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) return error(res, 401, 'Current password is incorrect.');
    const userId = req.session.user.user_id;
    db.prepare('UPDATE users SET password_hash = ? WHERE user_id = ?').run(await bcrypt.hash(newPassword, 12), userId);
    audit(req, 'password_change', 'user', userId);
    req.session.regenerate(err => {
      if (err) return next(err);
      const refreshedUser = db.prepare('SELECT user_id, full_name, email, role, status FROM users WHERE user_id = ?').get(userId);
      if (!refreshedUser) return error(res, 500, 'Unable to refresh session.');
      req.session.user = userView(refreshedUser);
      res.json({ message: 'Password updated successfully.' });
    });
  } catch (err) { next(err); }
});
app.patch('/api/users/:id/status', adminOnly, (req, res) => {
  const userId = Number(req.params.id);
  const status = clean(req.body.status);
  if (!['active', 'inactive'].includes(status)) return error(res, 400, 'Status must be active or inactive.');
  if (userId === req.session.user.user_id && status !== 'active') return error(res, 400, 'You cannot deactivate your own account.');
  const target = db.prepare('SELECT user_id, role, status FROM users WHERE user_id = ?').get(userId);
  if (!target) return error(res, 404, 'User not found.');
  if (target.role === 'Admin' && status === 'inactive') {
    const activeAdmins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'Admin' AND status = 'active'").get().count;
    if (activeAdmins <= 1) return error(res, 400, 'At least one active administrator is required.');
  }
  db.prepare('UPDATE users SET status = ? WHERE user_id = ?').run(status, userId);
  audit(req, 'status_update', 'user', userId);
  res.json({ message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully.` });
});

app.get('/api/volunteers', adminOnly, (req, res) => res.json({ volunteers: db.prepare('SELECT * FROM volunteers ORDER BY created_at DESC').all() }));
app.post('/api/volunteers', (req, res) => {
  if (!required(req.body, ['full_name', 'email', 'phone', 'message'])) return error(res, 400, 'All fields are required to apply as a volunteer.');
  const result = db.prepare("INSERT INTO volunteers (full_name, email, phone, message, status, created_at) VALUES (?, ?, ?, ?, 'Pending Review', ?)").run(clean(req.body.full_name), email(req.body.email), clean(req.body.phone), clean(req.body.message), now());
  res.status(201).json({ message: 'Thank you for applying to volunteer! Our team will contact you shortly.', volunteer: db.prepare('SELECT * FROM volunteers WHERE id = ?').get(result.lastInsertRowid) });
});
app.patch('/api/volunteers/:id/status', adminOnly, (req, res) => {
  const status = clean(req.body.status);
  if (!['Pending Review', 'Approved', 'Rejected'].includes(status)) return error(res, 400, 'Invalid volunteer status.');
  const result = db.prepare('UPDATE volunteers SET status = ? WHERE id = ?').run(status, Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Volunteer not found.');
  audit(req, 'status_update', 'volunteer', req.params.id);
  res.json({ message: 'Volunteer status updated.' });
});
app.get('/api/contact', adminOnly, (req, res) => res.json({ inquiries: db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all() }));
app.post('/api/contact', (req, res) => {
  if (!required(req.body, ['name', 'email', 'message'])) return error(res, 400, 'Name, email, and message are required.');
  const result = db.prepare('INSERT INTO inquiries (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(clean(req.body.name), email(req.body.email), clean(req.body.phone), clean(req.body.subject) || 'General Inquiry', clean(req.body.message), now());
  res.status(201).json({ message: 'Your message has been sent successfully. We will be in touch soon!', inquiry: db.prepare('SELECT * FROM inquiries WHERE id = ?').get(result.lastInsertRowid) });
});

app.get('/api/donations', (req, res) => {
  const donations = db.prepare("SELECT id, donor_name, amount, cause, status, currency, provider_id, provider_status, receipt_number, created_at, verified_at FROM donations ORDER BY created_at DESC").all();
  const totalAmount = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE status = 'paid'").get().total;
  res.json({ donations, totalCount: donations.filter(donation => donation.status === 'paid').length, totalAmount });
});
app.post('/api/donations', (req, res) => {
  if (!required(req.body, ['donor_name', 'donor_email', 'amount'])) return error(res, 400, 'Name, email, and amount are required.');
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) return error(res, 400, 'Please enter a valid donation amount.');
  const currency = clean(req.body.currency) || 'USD';
  const result = db.prepare("INSERT INTO donations (donor_name, donor_email, amount, cause, status, currency, provider_status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, 'pending', ?, ?)").run(clean(req.body.donor_name), email(req.body.donor_email), amount, clean(req.body.cause) || 'General Fund', currency, now(), now());
  const donation = db.prepare('SELECT id, donor_name, donor_email, amount, cause, status, currency, provider_status, receipt_number, created_at, verified_at FROM donations WHERE id = ?').get(result.lastInsertRowid);
  const totalRaised = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE status = 'paid'").get().total;
  res.status(201).json({ message: 'Donation submitted and awaiting verification.', donation, totalRaised });
});
app.patch('/api/donations/:id/verify', adminOnly, (req, res) => {
  const donationId = Number(req.params.id);
  const donation = db.prepare('SELECT * FROM donations WHERE id = ?').get(donationId);
  if (!donation) return error(res, 404, 'Donation not found.');

  const providerStatus = clean(req.body.provider_status || '').toLowerCase();
  const paidStatuses = new Set(['paid', 'succeeded', 'captured', 'completed', 'settled']);
  if (!paidStatuses.has(providerStatus)) return error(res, 400, 'Donation must be verified as a successful paid payment before it can be recorded.');

  const receiptNumber = donation.receipt_number || `NGO-${String(donationId).padStart(6, '0')}-${Date.now().toString().slice(-6)}`;
  const providerId = clean(req.body.provider_id) || donation.provider_id || `manual-${donationId}`;
  const currency = clean(req.body.currency) || donation.currency || 'USD';
  const timestamp = now();

  db.prepare("UPDATE donations SET status = 'paid', currency = ?, provider_id = ?, provider_status = ?, receipt_number = ?, verified_at = ?, updated_at = ? WHERE id = ?").run(currency, providerId, providerStatus, receiptNumber, timestamp, timestamp, donationId);
  audit(req, 'verify', 'donation', donationId);

  const updatedDonation = db.prepare('SELECT id, donor_name, donor_email, amount, cause, status, currency, provider_id, provider_status, receipt_number, created_at, verified_at FROM donations WHERE id = ?').get(donationId);
  res.json({ message: 'Donation verified and receipt generated.', donation: updatedDonation });
});
app.get('/api/stats', (req, res) => {
  const total = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations WHERE status = 'paid'").get().total;
  res.json({ campaignsHosted: 3067, studentsReceived: '10,000+', patientsTreated: '50,000+', activeVolunteers: db.prepare('SELECT COUNT(*) AS count FROM volunteers').get().count + 2000, totalRaised: total + 50000, registeredUsersCount: db.prepare('SELECT COUNT(*) AS count FROM users').get().count });
});

app.get('/api/about', (req, res) => res.json({
  ...db.prepare('SELECT story_text AS storyText, story_image AS storyImage FROM about_story WHERE id = 1').get(),
  values: db.prepare('SELECT id, name, description FROM about_values ORDER BY id').all(),
  programs: db.prepare('SELECT id, name, description FROM about_programs ORDER BY id').all(),
  team: db.prepare('SELECT id, name, designation, bio FROM about_team ORDER BY id').all()
}));
app.put('/api/about/story', adminOnly, (req, res) => {
  db.prepare("UPDATE about_story SET story_text = COALESCE(NULLIF(?, ''), story_text), story_image = COALESCE(NULLIF(?, ''), story_image) WHERE id = 1").run(clean(req.body.storyText), clean(req.body.storyImage));
  audit(req, 'update', 'about_story');
  res.json({ message: 'Story section updated successfully!' });
});

function aboutCrud(table, label) {
  app.post(`/api/about/${table}`, adminOnly, (req, res) => {
    if (!clean(req.body.name)) return error(res, 400, `${label} name is required`);
    const description = clean(req.body.description) || `Targeted ${label.toLowerCase()} providing resources and direct field assistance.`;
    const result = db.prepare(`INSERT INTO about_${table} (name, description) VALUES (?, ?)`).run(clean(req.body.name), description);
    audit(req, 'create', table, result.lastInsertRowid);
    res.status(201).json({ message: `${label} added successfully!`, [table === 'values' ? 'value' : 'program']: { id: result.lastInsertRowid, name: clean(req.body.name), description } });
  });
  app.put(`/api/about/${table}/:id`, adminOnly, (req, res) => {
    const result = db.prepare(`UPDATE about_${table} SET name = COALESCE(NULLIF(?, ''), name), description = COALESCE(NULLIF(?, ''), description) WHERE id = ?`).run(clean(req.body.name), clean(req.body.description), Number(req.params.id));
    if (!result.changes) return error(res, 404, `${label} not found`);
    audit(req, 'update', table, req.params.id);
    res.json({ message: `${label} updated successfully` });
  });
  app.delete(`/api/about/${table}/:id`, adminOnly, (req, res) => {
    const result = db.prepare(`DELETE FROM about_${table} WHERE id = ?`).run(Number(req.params.id));
    if (!result.changes) return error(res, 404, `${label} not found`);
    audit(req, 'delete', table, req.params.id);
    res.json({ message: `${label} deleted successfully` });
  });
}
aboutCrud('values', 'Core value');
aboutCrud('programs', 'Program');
app.post('/api/about/team', adminOnly, (req, res) => {
  if (!required(req.body, ['name', 'designation'])) return error(res, 400, 'Name and designation are required');
  const bio = clean(req.body.bio) || 'Dedicated team member driving grassroots social welfare and community outreach.';
  const result = db.prepare('INSERT INTO about_team (name, designation, bio) VALUES (?, ?, ?)').run(clean(req.body.name), clean(req.body.designation), bio);
  audit(req, 'create', 'team', result.lastInsertRowid);
  res.status(201).json({ message: 'Team member added successfully!', member: { id: result.lastInsertRowid, name: clean(req.body.name), designation: clean(req.body.designation), bio } });
});
app.put('/api/about/team/:id', adminOnly, (req, res) => {
  const result = db.prepare("UPDATE about_team SET name = COALESCE(NULLIF(?, ''), name), designation = COALESCE(NULLIF(?, ''), designation), bio = COALESCE(NULLIF(?, ''), bio) WHERE id = ?").run(clean(req.body.name), clean(req.body.designation), clean(req.body.bio), Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Team member not found');
  audit(req, 'update', 'team', req.params.id);
  res.json({ message: 'Team member updated successfully' });
});
app.delete('/api/about/team/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM about_team WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Team member not found');
  audit(req, 'delete', 'team', req.params.id);
  res.json({ message: 'Team member deleted' });
});

app.get('/api/media', (req, res) => res.json({
  pressReleases: db.prepare('SELECT id, title, date, description FROM press_releases ORDER BY date DESC, id DESC').all(),
  mediaCoverage: db.prepare('SELECT id, title, url FROM media_coverage ORDER BY id DESC').all(),
  galleryImages: db.prepare('SELECT id, url, caption FROM gallery_images ORDER BY id DESC').all()
}));
app.post('/api/media/press', adminOnly, (req, res) => {
  if (!required(req.body, ['title', 'date', 'description'])) return error(res, 400, 'Title, date, and description are required');
  const result = db.prepare('INSERT INTO press_releases (title, date, description) VALUES (?, ?, ?)').run(clean(req.body.title), clean(req.body.date), clean(req.body.description));
  audit(req, 'create', 'press_release', result.lastInsertRowid);
  res.status(201).json({ message: 'Press release published successfully', item: { id: result.lastInsertRowid, title: clean(req.body.title), date: clean(req.body.date), description: clean(req.body.description) } });
});
app.delete('/api/media/press/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM press_releases WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Press release not found');
  audit(req, 'delete', 'press_release', req.params.id);
  res.json({ message: 'Press release removed' });
});
app.post('/api/media/coverage', adminOnly, (req, res) => {
  if (!required(req.body, ['title', 'url'])) return error(res, 400, 'Title and URL are required');
  const result = db.prepare('INSERT INTO media_coverage (title, url) VALUES (?, ?)').run(clean(req.body.title), clean(req.body.url));
  audit(req, 'create', 'media_coverage', result.lastInsertRowid);
  res.status(201).json({ message: 'Media coverage entry added', item: { id: result.lastInsertRowid, title: clean(req.body.title), url: clean(req.body.url) } });
});
app.delete('/api/media/coverage/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM media_coverage WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Media coverage not found');
  audit(req, 'delete', 'media_coverage', req.params.id);
  res.json({ message: 'Media coverage entry removed' });
});
app.post('/api/media/gallery', adminOnly, (req, res) => {
  if (!clean(req.body.url)) return error(res, 400, 'Image URL is required');
  const result = db.prepare('INSERT INTO gallery_images (url, caption) VALUES (?, ?)').run(clean(req.body.url), clean(req.body.caption));
  audit(req, 'create', 'gallery_image', result.lastInsertRowid);
  res.status(201).json({ message: 'Gallery image uploaded successfully', item: { id: result.lastInsertRowid, url: clean(req.body.url), caption: clean(req.body.caption) } });
});
app.delete('/api/media/gallery/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM gallery_images WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Gallery image not found');
  audit(req, 'delete', 'gallery_image', req.params.id);
  res.json({ message: 'Gallery image removed' });
});

app.get('/api/projects', (req, res) => res.json({ projects: db.prepare('SELECT * FROM projects ORDER BY id DESC').all().map(projectView) }));
app.post('/api/projects', adminOnly, (req, res) => {
  if (!required(req.body, ['title', 'description'])) return error(res, 400, 'Title and description are required');
  const values = [clean(req.body.title), clean(req.body.description), clean(req.body.status) || 'Ongoing', clean(req.body.startDate) || now().slice(0, 10), clean(req.body.endDate) || 'Ongoing', clean(req.body.location) || 'Pune, India', clean(req.body.imageUrl) || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80'];
  const result = db.prepare('INSERT INTO projects (title, description, status, start_date, end_date, location, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)').run(...values);
  audit(req, 'create', 'project', result.lastInsertRowid);
  res.status(201).json({ message: 'Project added successfully', project: projectView(db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)) });
});
app.put('/api/projects/:id', adminOnly, (req, res) => {
  const result = db.prepare("UPDATE projects SET title = COALESCE(NULLIF(?, ''), title), description = COALESCE(NULLIF(?, ''), description), status = COALESCE(NULLIF(?, ''), status), start_date = COALESCE(NULLIF(?, ''), start_date), end_date = COALESCE(NULLIF(?, ''), end_date), location = COALESCE(NULLIF(?, ''), location), image_url = COALESCE(NULLIF(?, ''), image_url) WHERE id = ?").run(clean(req.body.title), clean(req.body.description), clean(req.body.status), clean(req.body.startDate), clean(req.body.endDate), clean(req.body.location), clean(req.body.imageUrl), Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Project not found');
  audit(req, 'update', 'project', req.params.id);
  res.json({ message: 'Project updated successfully', project: projectView(db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(req.params.id))) });
});
app.delete('/api/projects/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) return error(res, 404, 'Project not found');
  audit(req, 'delete', 'project', req.params.id);
  res.json({ message: 'Project removed' });
});

const aliases = [
  [['/', '/index', '/index.html', '/ngo', '/ngo.html'], 'index.html'],
  [['/about', '/about.html', '/about%20us.html', '/about us.html'], 'about us.html'],
  [['/campaign', '/campaign.html', '/compaign', '/compaign.html'], 'compaign.html'],
  [['/contact', '/contact.html', '/contact-us.html', '/contact%20us.html', '/contact us.html'], 'contact us.html'],
  [['/join', '/join.html', '/join-us.html', '/join%20us.html', '/join us.html', '/contact-join.html'], 'join us.html'],
  [['/projects', '/projects.html', '/work', '/work.html'], 'projects.html'],
  [['/features', '/features.html'], 'features.html'], [['/media', '/media.html'], 'media.html'],
  [['/donate', '/donate.html'], 'donate.html'], [['/blog', '/blog.html'], 'blog.html'],
  [['/login', '/login.html'], 'login.html'], [['/register', '/register.html'], 'register.html']
];
aliases.forEach(([paths, target]) => paths.forEach(route => app.get(route, (req, res) => res.sendFile(path.join(frontendDir, target)))));
app.use(express.static(frontendDir));
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return error(res, 413, 'Request body is too large.');
  console.error(`${req.method} ${req.path}:`, err.message);
  if (res.headersSent) return next(err);
  error(res, 500, 'Internal server error.');
});

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`NGO Portal Server running at http://0.0.0.0:${PORT}`));
  const shutdown = () => server.close(() => db.close());
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
module.exports = app;