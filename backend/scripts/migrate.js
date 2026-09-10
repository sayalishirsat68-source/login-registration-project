const { db } = require('../database');

try {
  const migrations = db.prepare('SELECT version, name, applied_at FROM schema_migrations ORDER BY version').all();
  console.table(migrations);
} finally {
  db.close();
}