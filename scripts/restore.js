const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const sourcePath = path.resolve(process.argv[2] || '');
const targetPath = path.resolve(process.env.DB_PATH || path.join(process.env.DATA_DIR || 'data', 'ngo.sqlite'));

if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('Usage: npm run db:restore -- <backup-file>');
if (sourcePath === targetPath) throw new Error('Restore source must differ from DB_PATH.');
fs.mkdirSync(path.dirname(targetPath), { recursive: true });

(async () => {
  const backup = new Database(sourcePath, { readonly: true });
  try {
    await backup.backup(targetPath);
    console.log(`SQLite database restored to ${targetPath}`);
  } finally {
    backup.close();
  }
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});