import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDb, getState, syncState, runSql } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;
const PROD = process.env.NODE_ENV === 'production';

if (PROD) {
  app.use(express.static(join(__dirname, 'dist')));
} else {
  app.use(cors({ origin: 'http://localhost:5173' }));
}
app.use(express.json());

// ── DB state ──────────────────────────────────────────────────────────────────

app.get('/api/state', (req, res) => {
  res.json(getState());
});

app.post('/api/sync', (req, res) => {
  const { projects = [], tasks = [] } = req.body;
  syncState({ projects, tasks });
  res.json({ ok: true, projects: projects.length, tasks: tasks.length });
});

// ── Raw SQL (for Claude / terminal use) ───────────────────────────────────────

app.post('/api/db/query', (req, res) => {
  const { sql } = req.body;
  if (!sql?.trim()) return res.json({ rows: [], changes: 0 });
  try {
    res.json(runSql(sql));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Terminal ──────────────────────────────────────────────────────────────────

app.post('/api/terminal', (req, res) => {
  const { command, cwd } = req.body;
  if (!command?.trim()) return res.json({ output: '', exitCode: 0 });

  exec(command, { cwd: cwd || process.cwd(), timeout: 10000, shell: '/bin/bash' }, (err, stdout, stderr) => {
    const output = [stdout, stderr].filter(Boolean).join('');
    res.json({ output: output || '(no output)', exitCode: err?.code ?? 0 });
  });
});

// ── Claude CLI proxy ──────────────────────────────────────────────────────────

app.post('/api/claude', (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) return res.json({ output: '', exitCode: 0 });

  const child = spawn('claude', ['--print'], {
    env: { ...process.env, TERM: 'dumb' },
    cwd: process.cwd(),
  });

  child.stdin.write(prompt);
  child.stdin.end();

  let out = '', err = '', done = false;
  const reply = (body) => { if (!done) { done = true; res.json(body); } };
  child.stdout.on('data', d => out += d.toString());
  child.stderr.on('data', d => err += d.toString());
  child.on('close', code => reply({ output: out || err || '(no output)', exitCode: code ?? 0 }));
  child.on('error', e  => reply({ output: `Failed to spawn claude: ${e.message}`, exitCode: 1 }));
});

// ── SPA fallback (production only) ────────────────────────────────────────────

if (PROD) {
  app.get('*', (req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));
}

// ── Start ─────────────────────────────────────────────────────────────────────

await initDb();

app.listen(PORT, () => {
  console.log(`\n✦ TaskFlow server at http://localhost:${PORT}`);
  if (!PROD) console.log(`  Frontend:   http://localhost:5173`);
  console.log(`  DB file:    data/taskflow.db`);
  console.log(`  Query API:  POST /api/db/query  { "sql": "SELECT ..." }\n`);
});
