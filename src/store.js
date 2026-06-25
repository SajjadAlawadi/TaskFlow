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

export function loadState() {
  return { projects: [], tasks: [] };
}

export function saveState(state) {
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
