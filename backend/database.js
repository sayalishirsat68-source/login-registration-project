const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();
const { migrateDatabase } = require('./migrate');

const vercelRuntime = process.env.VERCEL === '1';
const dataDirectory = process.env.DATA_DIR || (vercelRuntime ? '/tmp/ngo-data' : path.join(__dirname, 'data'));
fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = process.env.DB_PATH || path.join(dataDirectory, 'ngo.sqlite');
const db = new Database(databasePath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Member',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending Review',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name TEXT NOT NULL,
    donor_email TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    cause TEXT NOT NULL DEFAULT 'General Fund',
    status TEXT NOT NULL DEFAULT 'pending',
    currency TEXT NOT NULL DEFAULT 'USD',
    provider_id TEXT,
    provider_status TEXT,
    receipt_number TEXT,
    verified_at TEXT,
    updated_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS about_story (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    story_text TEXT NOT NULL,
    story_image TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS about_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS about_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS about_team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    bio TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS press_releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media_coverage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ongoing',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    location TEXT NOT NULL,
    image_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    expires_at INTEGER,
    session_json TEXT NOT NULL
  );
`);

migrateDatabase(db);

const donationColumns = new Set(db.prepare('PRAGMA table_info(donations)').all().map(column => column.name));
for (const column of ['provider_id', 'provider_status', 'receipt_number', 'verified_at', 'updated_at']) {
  if (!donationColumns.has(column)) db.exec(`ALTER TABLE donations ADD COLUMN ${column} TEXT`);
}

const now = () => new Date().toISOString();

const seed = db.transaction(() => {
  const insertVolunteer = db.prepare(`INSERT OR IGNORE INTO volunteers
    (id, full_name, email, phone, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertVolunteer.run(1, 'Rahul Sharma', 'rahul.s@example.com', '9876543210', 'I am a software engineer and would love to help teach digital literacy skills to young students.', 'Pending Review', '2026-03-01T10:00:00.000Z');
  insertVolunteer.run(2, 'Anita Desai', 'anita.desai@example.com', '9812345678', 'Interested in weekend meal distribution and organizing health awareness camps in rural communities.', 'Approved', '2026-03-04T14:30:00.000Z');

  db.prepare(`INSERT OR IGNORE INTO inquiries (id, name, email, phone, subject, message, created_at)
    VALUES (1, 'Vikram Patel', 'vikram.p@example.com', '9123456789', 'Partnership Inquiry for Corporate CSR', ?, '2026-03-05T09:15:00.000Z')`)
    .run('We represent an IT firm looking to sponsor 10 digital classrooms under your Girls Education drive.');

  const insertDonation = db.prepare(`INSERT OR IGNORE INTO donations
    (id, donor_name, donor_email, amount, cause, status, currency, provider_status, receipt_number, verified_at, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, ?, ?)`);
  insertDonation.run(1, 'Rohan Gupta', 'rohan.g@example.com', 2500, 'Girls Education', 'paid', 'INR', 'NGO-000001-202603', '2026-03-02T11:00:00.000Z', '2026-03-02T11:00:00.000Z', '2026-03-02T11:00:00.000Z');
  insertDonation.run(2, 'Sneha Kulkarni', 'sneha.k@example.com', 5000, 'Child Nutrition', 'paid', 'INR', 'NGO-000002-202603', '2026-03-06T16:20:00.000Z', '2026-03-06T16:20:00.000Z', '2026-03-06T16:20:00.000Z');
  insertDonation.run(3, 'Aarav Mehta', 'aarav@example.com', 1000, 'Elderly Care', 'paid', 'INR', 'NGO-000003-202603', '2026-03-08T08:45:00.000Z', '2026-03-08T08:45:00.000Z', '2026-03-08T08:45:00.000Z');

  db.prepare(`INSERT OR IGNORE INTO about_story (id, story_text, story_image) VALUES (1, ?, ?)`)
    .run('Founded in 2015, our journey started with a small group of passionate volunteers addressing local community issues. Over the years, we have grown into a fully dedicated NGO, reaching thousands of individuals across multiple regions and driving lasting social change.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80');

  const insertValue = db.prepare('INSERT OR IGNORE INTO about_values (id, name, description) VALUES (?, ?, ?)');
  insertValue.run(1, 'Integrity', 'Operating transparently and responsibly in all actions.');
  insertValue.run(2, 'Respect', 'Valuing the diversity and dignity of every individual.');
  insertValue.run(3, 'Empathy', 'Understanding and addressing the challenges faced by our communities.');

  const insertProgram = db.prepare('INSERT OR IGNORE INTO about_programs (id, name, description) VALUES (?, ?, ?)');
  insertProgram.run(1, 'Education & Child Support', 'Providing school supplies, scholarships, and free tutoring.');
  insertProgram.run(2, 'Health & Nutrition', 'Organizing regular free health checkup camps and clean water distribution.');
  insertProgram.run(3, 'Welfare & Development', 'Offering skill development and vocational training for women.');

  const insertTeam = db.prepare('INSERT OR IGNORE INTO about_team (id, name, designation, bio) VALUES (?, ?, ?, ?)');
  insertTeam.run(1, 'John Doe', 'Founder & Executive Director', 'John has over 12 years of experience managing non-profit organizations and overseeing community welfare projects globally.');
  insertTeam.run(2, 'Jane Smith', 'Program Coordinator', 'Jane coordinates field operations, ensuring all resources reach the targeted communities efficiently.');

  const insertPress = db.prepare('INSERT OR IGNORE INTO press_releases (id, title, date, description) VALUES (?, ?, ?, ?)');
  insertPress.run(1, 'NGO Launched Digital Classrooms Initiative', '2026-01-15', 'Supporting underprivileged children with tablets and interactive multimedia learning kits in 15 rural schools.');
  insertPress.run(2, 'Annual Healthcare Camp Treats 5,000+ Villagers', '2026-02-20', 'Free cardiology, dental, and general diagnostic camps conducted with partner medical teams.');

  const insertCoverage = db.prepare('INSERT OR IGNORE INTO media_coverage (id, title, url) VALUES (?, ?, ?)');
  insertCoverage.run(1, 'National Daily: The Grassroots Movement Transforming Education', 'https://example.com/press/education-feature');
  insertCoverage.run(2, 'Social Impact Awards 2025: Best Community Outreach', 'https://example.com/awards/ngo-spotlight');

  const insertGallery = db.prepare('INSERT OR IGNORE INTO gallery_images (id, url) VALUES (?, ?)');
  insertGallery.run(1, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80');
  insertGallery.run(2, 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80');
  insertGallery.run(3, 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80');
  insertGallery.run(4, 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=600&q=80');

  const insertProject = db.prepare(`INSERT OR IGNORE INTO projects
    (id, title, description, status, start_date, end_date, location, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertProject.run(1, 'Digital Classrooms for Rural Girls', 'Providing solar-powered digital tablets and certified educational curricula to primary schools.', 'Ongoing', '2026-01-10', '2026-08-15', 'Community Center Alpha, Pune', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80');
  insertProject.run(2, 'Clean Drinking Water Filtration Project', 'Installation of high-capacity RO filtration plants delivering 20,000 liters of safe drinking water daily.', 'Completed', '2025-03-01', '2025-11-20', 'Rural Sector South, Nashik', 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=600&q=80');
  insertProject.run(3, 'Mobile Health Clinics for Senior Citizens', 'Scheduled weekly wellness visits with medical supplies, free diagnostic kits, and geriatric care.', 'Upcoming', '2026-10-01', '2027-02-28', 'Metro Suburbs, Mumbai', 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80');
});

seed();

module.exports = { db, dataDirectory, now };