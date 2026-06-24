const KEY    = 'taskflow_state';
const SERVER = 'http://localhost:3001';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const PROJECT_COLORS = [
  '#6366F1', '#10B981', '#F97316', '#EC4899',
  '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6',
];

export const THEME = {
  BG:      '#0D1117',
  SURFACE: '#161B22',
  BORDER:  '#21262D',
  MUTED:   '#8B949E',
  TEXT:    '#E6EDF3',
  AMBER:   '#F0A500',
};

export const PRIORITY = {
  high:   { label: 'high',   color: '#F87171', bg: 'rgba(248,113,113,0.10)' },
  medium: { label: 'medium', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)'  },
  low:    { label: 'low',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)' },
};

export const STATUS = {
  'todo':        { icon: '○', label: 'Todo',        color: '#6B7280' },
  'in-progress': { icon: '◑', label: 'In Progress', color: '#60A5FA' },
  'done':        { icon: '✓', label: 'Done',        color: '#34D399' },
};

const SEED_PROJECTS = [
  { id: 'inbox',    name: 'Inbox',       color: '#7D8590' },
  { id: 'p_work',   name: 'Work',        color: '#6366F1' },
  { id: 'p_devops', name: 'DevOps',      color: '#10B981' },
  { id: 'p_side',   name: 'Side Hustle', color: '#F97316' },
  { id: 'p_life',   name: 'Personal',    color: '#EC4899' },
];

function makeSeedTasks() {
  const t = Date.now();
  const T = (projectId, status, priority, title, description = '') => ({
    id: uid(), projectId, status, priority, title, description, createdAt: t, updatedAt: t,
  });
  return [
    T('p_work',   'in-progress', 'high',   'Fix case-sensitive map key lookup bug',        'yuuvis-importer config binding — keys need lowercasing before lookup'),
    T('p_work',   'in-progress', 'high',   'Review Spring Boot config binding PR #47',     '@ConfigurationProperties binding with nested map-of-lists'),
    T('p_work',   'todo',        'medium', 'Write unit tests for invoice parser'),
    T('p_work',   'todo',        'medium', 'Update API docs for v2.3',                     'Swagger + README — new endpoint descriptions'),
    T('p_work',   'done',        'low',    'Q3 sprint retrospective report'),
    T('p_work',   'todo',        'low',    'Refactor supplier invoice producer service',   'Split into smaller services, improve error handling'),
    T('p_devops', 'in-progress', 'high',   'Fix Docker Compose CIFS/SMB volume mount',    'Permission failure on yuuvis-supplier-invoice-producer-qa'),
    T('p_devops', 'done',        'high',   'Set up GitLab CI/CD for yuuvis-importer',     'develop → release → main, Maven versions plugin'),
    T('p_devops', 'todo',        'medium', 'Configure Jenkins release job',                'Maven release automation — confirm-before-push gate required'),
    T('p_devops', 'todo',        'medium', 'Evaluate Aider vs OpenHands for team use',    'Compare agentic coding tools for Java/Spring workflow'),
    T('p_devops', 'todo',        'low',    'Add health-check to supplier service'),
    T('p_side',   'in-progress', 'high',   'Record Continue.dev + Groq tutorial',         'German-language YouTube — Spring Boot AI tooling for devs'),
    T('p_side',   'todo',        'high',   'Write script: AI coding tools comparison',    'Cline vs Aider vs OpenHands — targeted at Java devs'),
    T('p_side',   'done',        'medium', 'Set up YouTube channel branding',             'Logo, banner, channel description in German'),
    T('p_side',   'todo',        'medium', 'Create landing page for digital products',    'Products €9–€29 — Spring Boot templates, prompt packs'),
    T('p_side',   'done',        'low',    'Draft 90-day content calendar',               '3-phase plan: build → grow → monetise'),
    T('p_life',   'todo',        'medium', 'Plan camping trip to the Alps',               'Bernese Oberland or Dolomites — late summer'),
    T('p_life',   'in-progress', 'medium', 'Buy camping gear (grill + tent)'),
    T('p_life',   'todo',        'low',    'Research Mediterranean route from Basel',     'Nice via A5/A8 ~5h from Rheinfelden'),
    T('p_life',   'done',        'low',    'Schedule car service appointment'),
    T('inbox',    'todo',        'low',    'Explore AWS Solutions Architect cert'),
  ];
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { projects: SEED_PROJECTS, tasks: makeSeedTasks() };
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  // Fire-and-forget sync to SQLite
  fetch(`${SERVER}/api/sync`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(state),
  }).catch(() => {});
}

export async function fetchServerState() {
  try {
    const res = await fetch(`${SERVER}/api/state`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
