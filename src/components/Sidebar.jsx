import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeContext.jsx';

function NavItem({ label, dot, icon, count, active, onClick, onDelete, theme }) {
  const [hovered, setHovered] = useState(false);
  const { BG, BORDER, MUTED, TEXT, HOVER } = theme;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        textAlign: 'left', padding: '6px 10px', margin: '1px 0',
        borderRadius: 6, border: 'none', cursor: 'pointer',
        background: active ? BORDER : hovered ? HOVER : 'transparent',
        color: active ? TEXT : MUTED,
        fontSize: 13, fontWeight: active ? 500 : 400,
      }}
    >
      {icon && <span style={{ fontSize: 12, opacity: .7 }}>{icon}</span>}
      {dot  && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {hovered && onDelete && (
        <span
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title="Delete project"
          style={{ fontSize: 14, lineHeight: 1, color: MUTED, padding: '0 2px', opacity: .7 }}
        >×</span>
      )}
      {count > 0 && (
        <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: BORDER, color: MUTED }}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ width, projects, tasks, selProj, onSelectProj, onAddProject, onDeleteProject, onSync }) {
  const { theme, mode, toggle } = useTheme();
  const { BG, SURFACE, BORDER, MUTED, TEXT, AMBER, HOVER, AMBER_BG, AMBER_RING } = theme;

  const [adding,  setAdding]  = useState(false);
  const [newName, setNewName] = useState('');
  const [syncing, setSyncing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const confirm = () => {
    const name = newName.trim();
    if (name) onAddProject(name);
    setAdding(false);
    setNewName('');
  };

  const cancel = () => { setAdding(false); setNewName(''); };

  const handleSync = async () => {
    setSyncing(true);
    await onSync?.();
    setSyncing(false);
  };

  return (
    <aside style={{
      width: width ?? 220, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: BG, overflow: 'hidden',
    }}>
      {/* Logo + theme toggle */}
      <div style={{ padding: '14px 14px 12px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: AMBER_BG, border: `1px solid ${AMBER_RING}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: AMBER, fontSize: 13,
          }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>TaskFlow</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>task manager</div>
          </div>
          {/* Light / dark toggle */}
          <button
            onClick={toggle}
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: MUTED, fontSize: 13, flexShrink: 0,
            }}
          >
            {mode === 'dark' ? '☀' : '◐'}
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', padding: '4px 6px 6px' }}>
          Views
        </div>
        <NavItem
          label="All Tasks"
          icon="◈"
          count={tasks.length}
          active={selProj === 'all'}
          onClick={() => onSelectProj('all')}
          theme={theme}
        />

        <div style={{ fontSize: 10, color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', padding: '12px 6px 6px', marginTop: 2 }}>
          Projects
        </div>
        {projects.map(p => (
          <NavItem
            key={p.id}
            label={p.name}
            dot={p.color}
            count={tasks.filter(t => t.projectId === p.id).length}
            active={selProj === p.id}
            onClick={() => onSelectProj(p.id)}
            theme={theme}
            onDelete={p.id !== 'inbox' ? () => {
              if (window.confirm(`Delete "${p.name}"? All its tasks will move to Inbox.`)) {
                onDeleteProject(p.id);
              }
            } : null}
          />
        ))}

        {/* New project */}
        {adding ? (
          <div style={{ padding: '4px 4px' }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
              onBlur={cancel}
              placeholder="Project name…"
              style={{
                width: '100%', background: BG,
                border: `1px solid ${AMBER}`, borderRadius: 6,
                padding: '6px 10px', color: TEXT, fontSize: 13, outline: 'none',
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              width: '100%', padding: '6px 10px', margin: '4px 0',
              borderRadius: 6, border: 'none', cursor: 'pointer',
              background: 'transparent', color: MUTED, fontSize: 13,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New project
          </button>
        )}
      </div>

      {/* Footer: sync */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${BORDER}` }}>
        <button
          onClick={handleSync}
          disabled={syncing}
          title="Pull latest state from SQLite DB"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            width: '100%', padding: '6px 10px', borderRadius: 6,
            border: `1px solid ${BORDER}`, cursor: syncing ? 'default' : 'pointer',
            background: 'transparent', color: MUTED, fontSize: 12,
          }}
        >
          <span style={{ display: 'inline-block', animation: syncing ? 'spin .8s linear infinite' : 'none' }}>↻</span>
          {syncing ? 'Syncing…' : 'Sync from DB'}
          <span style={{ marginLeft: 'auto', fontSize: 10, opacity: .5 }}>SQLite</span>
        </button>
      </div>
    </aside>
  );
}
