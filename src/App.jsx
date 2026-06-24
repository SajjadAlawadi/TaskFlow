import { useState, useEffect, useCallback, useRef } from 'react';
import { loadState, saveState, fetchServerState, uid, PROJECT_COLORS } from './store.js';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import TaskList from './components/TaskList.jsx';
import TaskModal from './components/TaskModal.jsx';
import ChatPanel from './components/ChatPanel.jsx';

function ResizeHandle({ onMouseDown, theme }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 4, flexShrink: 0, cursor: 'col-resize', zIndex: 10,
        background: hovered ? theme.AMBER : theme.BORDER,
        opacity: hovered ? 0.8 : 1,
        transition: 'background .15s',
        userSelect: 'none',
      }}
    />
  );
}

function AppInner() {
  const { theme } = useTheme();

  const [sidebarW, setSidebarW] = useState(220);
  const [chatW,    setChatW]    = useState(340);
  const drag = useRef(null);

  useEffect(() => {
    const onMove = e => {
      if (!drag.current) return;
      const delta = e.clientX - drag.current.startX;
      if (drag.current.handle === 'sidebar') {
        setSidebarW(Math.max(160, Math.min(400, drag.current.startW + delta)));
      } else {
        setChatW(Math.max(240, Math.min(600, drag.current.startW - delta)));
      }
    };
    const onUp = () => { drag.current = null; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const [state, setState] = useState(() => loadState());
  const { projects, tasks } = state;

  const [selProj, setSelProj] = useState('all');
  const [selStat, setSelStat] = useState('all');
  const [modal,   setModal]   = useState({ open: false, task: null, defaultProjectId: 'inbox' });

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    fetchServerState().then(s => { if (s?.projects?.length) setState(s); });
  }, []);

  const syncFromServer = useCallback(async () => {
    const s = await fetchServerState();
    if (s?.projects?.length) setState(s);
  }, []);

  const addProject = useCallback((name) => {
    const color = PROJECT_COLORS[
      projects.filter(p => p.id !== 'inbox').length % PROJECT_COLORS.length
    ];
    setState(s => ({ ...s, projects: [...s.projects, { id: uid(), name, color }] }));
  }, [projects]);

  const deleteProject = useCallback((id) => {
    setState(s => ({
      projects: s.projects.filter(p => p.id !== id),
      tasks: s.tasks.map(t => t.projectId === id ? { ...t, projectId: 'inbox' } : t),
    }));
    setSelProj(prev => prev === id ? 'all' : prev);
  }, []);

  const updateTask = useCallback((id, changes) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...changes, updatedAt: Date.now() } : t),
    }));
  }, []);

  const cycleStatus = useCallback((task) => {
    const order = ['todo', 'in-progress', 'done'];
    const next  = order[(order.indexOf(task.status) + 1) % order.length];
    updateTask(task.id, { status: next });
  }, [updateTask]);

  const openCreate = useCallback((defaultProjectId) => {
    setModal({ open: true, task: null, defaultProjectId: defaultProjectId !== 'all' ? defaultProjectId : 'inbox' });
  }, []);

  const openEdit = useCallback((task) => {
    setModal({ open: true, task, defaultProjectId: task.projectId });
  }, []);

  const closeModal = useCallback(() => {
    setModal(m => ({ ...m, open: false }));
  }, []);

  const handleSave = useCallback((data) => {
    if (modal.task) {
      updateTask(modal.task.id, data);
    } else {
      setState(s => ({
        ...s,
        tasks: [...s.tasks, { id: uid(), ...data, createdAt: Date.now(), updatedAt: Date.now() }],
      }));
    }
    closeModal();
  }, [modal.task, updateTask, closeModal]);

  const handleDelete = useCallback((id) => {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
    closeModal();
  }, [closeModal]);

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: theme.BG, color: theme.TEXT,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: 'hidden',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.SCROLLBAR}; border-radius: 4px; }
        input, textarea, select, button { font-family: inherit; }
        input::placeholder, textarea::placeholder { color: ${theme.MUTED}; }
        @keyframes tdot { 0%,80%,100% { opacity:.25; transform:scale(.75) } 40% { opacity:1; transform:scale(1.05) } }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>

      <Sidebar
        width={sidebarW}
        projects={projects}
        tasks={tasks}
        selProj={selProj}
        onSelectProj={setSelProj}
        onAddProject={addProject}
        onDeleteProject={deleteProject}
        onSync={syncFromServer}
      />
      <ResizeHandle
        theme={theme}
        onMouseDown={e => { drag.current = { handle: 'sidebar', startX: e.clientX, startW: sidebarW }; document.body.style.cursor = 'col-resize'; }}
      />
      <TaskList
        tasks={tasks}
        projects={projects}
        selProj={selProj}
        selStat={selStat}
        onSelStat={setSelStat}
        onCycle={cycleStatus}
        onOpenEdit={openEdit}
        onOpenCreate={() => openCreate(selProj)}
      />
      <ResizeHandle
        theme={theme}
        onMouseDown={e => { drag.current = { handle: 'chat', startX: e.clientX, startW: chatW }; document.body.style.cursor = 'col-resize'; }}
      />
      <ChatPanel width={chatW} />
      {modal.open && (
        <TaskModal
          task={modal.task}
          projects={projects}
          defaultProjectId={modal.defaultProjectId}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
