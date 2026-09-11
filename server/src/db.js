const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const projectRoot = path.resolve(__dirname, '../..');
const configuredPath = process.env.DB_PATH || './server/data/statuses.db';
const dbPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(projectRoot, configuredPath);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
    )
`);

const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(name => name.endsWith('.sql'))
    .sort();

const isApplied = db.prepare('SELECT 1 FROM migrations WHERE name = ?');
const markApplied = db.prepare(
    'INSERT INTO migrations (name, applied_at) VALUES (?, ?)'
);

for (const fileName of migrationFiles) {
    if (isApplied.get(fileName)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, fileName), 'utf8');
    const applyMigration = db.transaction(() => {
        db.exec(sql);
        markApplied.run(fileName, new Date().toISOString());
    });

    applyMigration();
    console.log(`✅ Миграция ${fileName} применена`);
}

console.log(`✅ SQLite подключена: ${dbPath}`);

module.exports = db;
