const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const sourcePath = path.resolve(process.env.DB_PATH || path.join(process.env.DATA_DIR || 'data', 'ngo.sqlite'));
const backupPath = path.resolve(process.argv[2] || path.join(path.dirname(sourcePath), `ngo-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`));

if (sourcePath === backupPath) throw new Error('Backup destination must differ from DB_PATH.');
fs.mkdirSync(path.dirname(backupPath), { recursive: true });

(async () => {
  const db = new Database(sourcePath, { readonly: true });
  try {
    await db.backup(backupPath);
    console.log(`SQLite backup created at ${backupPath}`);
  } finally {
    db.close();
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});