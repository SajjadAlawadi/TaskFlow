import { useState, useEffect, useRef } from 'react';
import { STATUS, PRIORITY } from '../store.js';
import { useTheme } from '../ThemeContext.jsx';

export default function TaskModal({ task, projects, defaultProjectId, onSave, onDelete, onClose }) {
  const { theme } = useTheme();
  const { BG, SURFACE, BORDER, MUTED, TEXT, AMBER } = theme;

  const [title,       setTitle]       = useState(task?.title       || '');
  const [description, setDescription] = useState(task?.description || '');
  const [projectId,   setProjectId]   = useState(task?.projectId   || defaultProjectId || 'inbox');
  const [priority,    setPriority]    = useState(task?.priority    || 'medium');
  const [status,      setStatus]      = useState(task?.status      || 'todo');
  const [confirmDel,  setConfirmDel]  = useState(false);
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description, projectId, priority, status });
  };

  const inputStyle = {
    width: '100%', background: BG, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: TEXT, outline: 'none',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
          width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
          padding: 24,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT }}>
            {task ? 'Edit Task' : 'New Task'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 20, padding: '0 2px', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Title */}
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); }}
          placeholder="Task title"
          style={{ ...inputStyle, padding: '10px 14px', fontSize: 16, marginBottom: 12 }}
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          style={{ ...inputStyle, padding: '10px 14px', fontSize: 13, resize: 'vertical', marginBottom: 16 }}
        />

        {/* Project */}
        <Field label="Project" muted={MUTED}>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            style={{ ...inputStyle, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        {/* Priority */}
        <Field label="Priority" muted={MUTED}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['low', 'medium', 'high'].map(p => {
              const pm = PRIORITY[p];
              const active = priority === p;
              return (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 7, cursor: 'pointer', fontSize: 12,
                  border: `1px solid ${active ? pm.color : BORDER}`,
                  background: active ? pm.bg : 'transparent',
                  color: active ? pm.color : MUTED,
                  fontWeight: active ? 600 : 400,
                }}>
                  {pm.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Status */}
        <Field label="Status" muted={MUTED}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['todo', 'in-progress', 'done'].map(s => {
              const sm = STATUS[s];
              const active = status === s;
              return (
                <button key={s} onClick={() => setStatus(s)} style={{
                  flex: 1, padding: '7px 4px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
                  border: `1px solid ${active ? sm.color : BORDER}`,
                  background: active ? `${sm.color}18` : 'transparent',
                  color: active ? sm.color : MUTED,
                  fontWeight: active ? 600 : 400,
                }}>
                  {sm.icon} {sm.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Save */}
        <button
          onClick={save}
          disabled={!title.trim()}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
            cursor: title.trim() ? 'pointer' : 'default',
            background: title.trim() ? AMBER : BORDER,
            color: title.trim() ? BG : MUTED,
            fontSize: 14, fontWeight: 600, marginTop: 4,
          }}
        >
          {task ? 'Save changes' : 'Add task'}
        </button>

        {/* Delete */}
        {task && (
          confirmDel ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => onDelete(task.id)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                border: '1px solid #EF4444', background: 'rgba(239,68,68,.1)', color: '#EF4444', fontWeight: 600,
              }}>
                Confirm delete
              </button>
              <button onClick={() => setConfirmDel(false)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED,
              }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} style={{
              width: '100%', padding: '8px 0', marginTop: 8,
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#EF4444', fontSize: 13,
            }}>
              Delete task
            </button>
          )
        )}
      </div>
    </div>
  );
}

function Field({ label, muted, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        fontSize: 11, color: muted, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.07em',
        display: 'block', marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
