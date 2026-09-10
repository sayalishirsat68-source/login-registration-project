const fs = require('fs');
const path = require('path');

const migrationsDirectory = path.join(__dirname, 'migrations');

function migrationFiles() {
  return fs.readdirSync(migrationsDirectory)
    .filter(file => /^\d+_.+\.sql$/.test(file))
    .sort((left, right) => Number(left.split('_')[0]) - Number(right.split('_')[0]));
}

function migrateDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map(row => row.version));
  const files = migrationFiles();

  if (applied.size === 0 && db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get()) {
    const baseline = files.find(file => file.startsWith('001_'));
    if (baseline) {
      db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(1, baseline, new Date().toISOString());
      applied.add(1);
    }
  }

  for (const file of files) {
    const version = Number(file.split('_')[0]);
    if (applied.has(version)) continue;
    const sql = fs.readFileSync(path.join(migrationsDirectory, file), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(version, file, new Date().toISOString());
    })();
  }

  return db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version').all();
}

module.exports = { migrateDatabase };