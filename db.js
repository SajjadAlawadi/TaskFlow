import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir  = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dir, 'data');
const DB_PATH = join(DB_DIR, 'taskflow.db');

mkdirSync(DB_DIR, { recursive: true });

let _db;

function save() {
  writeFileSync(DB_PATH, Buffer.from(_db.export()));
}

/** Run a SQL string, return rows as objects (SELECT) or { changes } (mutations). */
export function runSql(sql) {
  const trimmed = sql.trim();
  const isRead  = /^(select|pragma|explain)/i.test(trimmed);

  if (isRead) {
    const results = _db.exec(trimmed);
    if (!results.length) return { rows: [], count: 0 };
    const { columns, values } = results[0];
    const rows = values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
    return { rows, count: rows.length };
  } else {
    _db.run(trimmed);
    const changes = _db.getRowsModified();
    save();
    return { changes };
  }
}

/** Return all projects + tasks as JS objects. */
export function getState() {
  const projects = runSql('SELECT * FROM projects ORDER BY rowid').rows;
  const tasks    = runSql(`
    SELECT id, project_id AS projectId, title, description,
           priority, status, created_at AS createdAt, updated_at AS updatedAt
    FROM tasks ORDER BY rowid
  `).rows;
  return { projects, tasks };
}

/** Replace full state (projects + tasks arrays from the frontend). */
export function syncState({ projects = [], tasks = [] }) {
  _db.run('DELETE FROM tasks');
  _db.run('DELETE FROM projects');

  const ip = _db.prepare('INSERT INTO projects VALUES (?, ?, ?)');
  const it = _db.prepare('INSERT INTO tasks    VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (const p of projects) {
    ip.run([p.id, p.name, p.color]);
  }
  for (const t of tasks) {
    it.run([t.id, t.projectId, t.title, t.description ?? '', t.priority, t.status, t.createdAt, t.updatedAt]);
  }
  ip.free();
  it.free();
  save();
}

/** Initialise — call once at server startup and await the result. */
export async function initDb() {
  const SQL = await initSqlJs({
    locateFile: f => join(__dir, 'node_modules/sql.js/dist/', f),
  });

  if (existsSync(DB_PATH)) {
    _db = new SQL.Database(readFileSync(DB_PATH));
    console.log('✦ DB loaded from data/taskflow.db');
  } else {
    _db = new SQL.Database();
    _db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id    TEXT PRIMARY KEY,
        name  TEXT NOT NULL,
        color TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id          TEXT PRIMARY KEY,
        project_id  TEXT NOT NULL,
        title       TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority    TEXT NOT NULL DEFAULT 'medium',
        status      TEXT NOT NULL DEFAULT 'todo',
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL
      );
    `);
    save();
    console.log('✦ DB created at data/taskflow.db');
  }
}

