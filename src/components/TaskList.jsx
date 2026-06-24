import { useMemo } from 'react';
import TaskCard from './TaskCard.jsx';
import { useTheme } from '../ThemeContext.jsx';

const STATUS_ORDER = ['in-progress', 'todo', 'done'];

export default function TaskList({ tasks, projects, selProj, selStat, onSelStat, onCycle, onOpenEdit, onOpenCreate }) {
  const { theme } = useTheme();
  const { BG, BORDER, MUTED, TEXT, AMBER } = theme;

  const getProj    = id => projects.find(p => p.id === id);
  const selProjObj = selProj !== 'all' ? getProj(selProj) : null;

  const base = useMemo(
    () => tasks.filter(t => selProj === 'all' || t.projectId === selProj),
    [tasks, selProj],
  );

  const counts = useMemo(() => ({
    all:           base.length,
    todo:          base.filter(t => t.status === 'todo').length,
    'in-progress': base.filter(t => t.status === 'in-progress').length,
    done:          base.filter(t => t.status === 'done').length,
  }), [base]);

  const visible = useMemo(() => {
    const filtered = selStat === 'all' ? base : base.filter(t => t.status === selStat);
    return [...filtered].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }, [base, selStat]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      {/* Header */}
      <div style={{
        padding: '14px 24px', borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        background: BG,
      }}>
        {selProjObj && (
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: selProjObj.color, flexShrink: 0 }} />
        )}
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT }}>
          {selProj === 'all' ? 'All Tasks' : selProjObj?.name || 'Tasks'}
        </h2>
        <span style={{ fontSize: 11, color: MUTED, background: BORDER, borderRadius: 10, padding: '2px 8px' }}>
          {visible.length}
        </span>

        {/* Status filter tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {[
            ['all',         'All'],
            ['todo',        'Todo'],
            ['in-progress', 'In Progress'],
            ['done',        'Done'],
          ].map(([s, label]) => {
            const active = selStat === s;
            return (
              <button
                key={s}
                onClick={() => onSelStat(s)}
                style={{
                  padding: '4px 11px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                  background: active ? `${AMBER}18` : 'transparent',
                  color: active ? AMBER : MUTED,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}{' '}
                <span style={{ fontSize: 10, opacity: .65 }}>{counts[s]}</span>
              </button>
            );
          })}
        </div>

        {/* Add task */}
        <button
          onClick={onOpenCreate}
          style={{
            background: AMBER, border: 'none', borderRadius: 7,
            padding: '6px 14px', color: BG, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Add task
        </button>
      </div>

      {/* Task list body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', background: BG }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: MUTED, paddingTop: 80 }}>
            <div style={{ fontSize: 34, opacity: .2, marginBottom: 14 }}>✦</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>No tasks here</div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: .6 }}>Click + Add task to get started</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                project={getProj(t.projectId)}
                showProject={selProj === 'all'}
                onCycle={onCycle}
                onClick={onOpenEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
