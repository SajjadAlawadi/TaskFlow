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

/** Upsert full state (projects + tasks arrays from the frontend). */
export function syncState({ projects = [], tasks = [] }) {
  const ip = _db.prepare('INSERT OR REPLACE INTO projects VALUES (?, ?, ?)');
  const it = _db.prepare('INSERT OR REPLACE INTO tasks    VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

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
    seed();
    save();
    console.log('✦ DB created and seeded at data/taskflow.db');
  }
}

function seed() {
  const t = Date.now();
  const ip = _db.prepare('INSERT INTO projects VALUES (?, ?, ?)');
  const it = _db.prepare('INSERT INTO tasks    VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  [
    ['inbox',    'Inbox',       '#7D8590'],
    ['p_work',   'Work',        '#6366F1'],
    ['p_devops', 'DevOps',      '#10B981'],
    ['p_side',   'Side Hustle', '#F97316'],
    ['p_life',   'Personal',    '#EC4899'],
  ].forEach(r => ip.run(r));

  [
    ['t01','p_work',  'Fix case-sensitive map key lookup bug',       'yuuvis-importer config binding — keys need lowercasing before lookup','high',  'in-progress'],
    ['t02','p_work',  'Review Spring Boot config binding PR #47',    '@ConfigurationProperties binding with nested map-of-lists',          'high',  'in-progress'],
    ['t03','p_work',  'Write unit tests for invoice parser',         '',                                                                   'medium','todo'],
    ['t04','p_work',  'Update API docs for v2.3',                    'Swagger + README — new endpoint descriptions',                       'medium','todo'],
    ['t05','p_work',  'Q3 sprint retrospective report',              '',                                                                   'low',   'done'],
    ['t06','p_work',  'Refactor supplier invoice producer service',  'Split into smaller services, improve error handling',                'low',   'todo'],
    ['t07','p_devops','Fix Docker Compose CIFS/SMB volume mount',    'Permission failure on yuuvis-supplier-invoice-producer-qa',          'high',  'in-progress'],
    ['t08','p_devops','Set up GitLab CI/CD for yuuvis-importer',     'develop → release → main, Maven versions plugin',                   'high',  'done'],
    ['t09','p_devops','Configure Jenkins release job',               'Maven release automation — confirm-before-push gate required',       'medium','todo'],
    ['t10','p_devops','Evaluate Aider vs OpenHands for team use',    'Compare agentic coding tools for Java/Spring workflow',              'medium','todo'],
    ['t11','p_devops','Add health-check to supplier service',        '',                                                                   'low',   'todo'],
    ['t12','p_side',  'Record Continue.dev + Groq tutorial',         'German-language YouTube — Spring Boot AI tooling for devs',          'high',  'in-progress'],
    ['t13','p_side',  'Write script: AI coding tools comparison',    'Cline vs Aider vs OpenHands — targeted at Java devs',                'high',  'todo'],
    ['t14','p_side',  'Set up YouTube channel branding',             'Logo, banner, channel description in German',                        'medium','done'],
    ['t15','p_side',  'Create landing page for digital products',    'Products €9–€29 — Spring Boot templates, prompt packs',              'medium','todo'],
    ['t16','p_side',  'Draft 90-day content calendar',               '3-phase plan: build → grow → monetise',                             'low',   'done'],
    ['t17','p_life',  'Plan camping trip to the Alps',               'Bernese Oberland or Dolomites — late summer',                        'medium','todo'],
    ['t18','p_life',  'Buy camping gear (grill + tent)',             '',                                                                   'medium','in-progress'],
    ['t19','p_life',  'Research Mediterranean route from Basel',     'Nice via A5/A8 ~5h from Rheinfelden',                                'low',   'todo'],
    ['t20','p_life',  'Schedule car service appointment',            '',                                                                   'low',   'done'],
    ['t21','inbox',   'Explore AWS Solutions Architect cert',        '',                                                                   'low',   'todo'],
  ].forEach(([id, pid, title, desc, pri, sta]) => it.run([id, pid, title, desc, pri, sta, t, t]));

  ip.free();
  it.free();
}
