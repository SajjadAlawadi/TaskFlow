import { useState } from 'react';
import { STATUS, PRIORITY } from '../store.js';
import { useTheme } from '../ThemeContext.jsx';

export default function TaskCard({ task, project, showProject, onCycle, onClick }) {
  const { theme } = useTheme();
  const { SURFACE, BORDER, MUTED, TEXT, HOVER } = theme;

  const [hovered, setHovered] = useState(false);
  const sm   = STATUS[task.status]     || STATUS.todo;
  const pm   = PRIORITY[task.priority] || PRIORITY.medium;
  const done = task.status === 'done';

  return (
    <div
      onClick={() => onClick(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? HOVER : SURFACE,
        borderRadius: 8,
        border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${project?.color || MUTED}`,
        padding: '11px 16px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        opacity: done ? .5 : 1,
        transition: 'background .12s, opacity .15s',
        cursor: 'pointer',
      }}
    >
      {/* Status icon */}
      <button
        onClick={e => { e.stopPropagation(); onCycle(task); }}
        title="Cycle status"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: sm.color, fontSize: 16, padding: 0,
          marginTop: 2, lineHeight: 1, flexShrink: 0,
        }}
      >
        {sm.icon}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, lineHeight: 1.4,
          textDecoration: done ? 'line-through' : 'none',
          color: done ? MUTED : TEXT,
        }}>
          {task.title}
        </div>

        {task.description && (
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3, lineHeight: 1.4 }}>
            {task.description}
          </div>
        )}

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
          {showProject && project && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 4,
              background: `${project.color}18`, color: project.color, fontWeight: 500,
            }}>
              {project.name}
            </span>
          )}
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 4,
            background: pm.bg, color: pm.color, fontWeight: 500,
          }}>
            {pm.label}
          </span>
          <span style={{ fontSize: 11, color: sm.color }}>{sm.label}</span>
        </div>
      </div>
    </div>
  );
}
