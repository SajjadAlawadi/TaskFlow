import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../ThemeContext.jsx';

const GREEN = '#34D399';
const RED   = '#F87171';

const uid = () => Math.random().toString(36).slice(2, 10);

const SEED = [{
  id: 's0', type: 'info',
  content: 'Shell connected · /bin/bash\nRun any shell command — output appears here.\n\nTry: ls, pwd, git status\n\nDB query:\ncurl -s -X POST http://localhost:3001/api/db/query \\\n  -H "Content-Type: application/json" \\\n  -d \'{"sql":"SELECT * FROM tasks WHERE status=\'\\\'\'in-progress\'\\\'\'"}\' | jq',
}];

const CLAUDE_SEED = [{
  id: 'c0', type: 'claude',
  content: "Hey! Connected to the Claude CLI.\n\nI can also query the SQLite DB — try:\n• \"What tasks are in progress?\"\n• \"Mark the CIFS fix as done\"\n• \"Add a new task to DevOps\"\n\nDB is at data/taskflow.db  ·  query endpoint: POST /api/db/query",
}];

function InfoBubble({ content, theme }) {
  return (
    <div style={{
      padding: '9px 13px', fontSize: 12, lineHeight: 1.6, color: theme.MUTED,
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      background: `${theme.MUTED}0d`, border: `1px solid ${theme.BORDER}`, borderRadius: 8,
    }}>
      {content}
    </div>
  );
}

function CommandBubble({ content, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: GREEN, fontFamily: 'monospace', fontSize: 13, marginTop: 1, flexShrink: 0 }}>$</span>
      <div style={{
        flex: 1, padding: '8px 12px', fontSize: 13, lineHeight: 1.5, color: theme.TEXT,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.18)',
        borderRadius: '8px 8px 8px 2px', fontFamily: 'monospace',
      }}>
        {content}
      </div>
    </div>
  );
}

function OutputBubble({ content, exitCode, theme }) {
  const isErr = exitCode !== 0;
  return (
    <div style={{
      padding: '9px 13px', fontSize: 12, lineHeight: 1.6,
      color: isErr ? RED : theme.TEXT,
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      background: isErr ? 'rgba(248,113,113,.05)' : theme.SURFACE,
      border: `1px solid ${isErr ? 'rgba(248,113,113,.2)' : theme.BORDER}`,
      borderRadius: '8px 8px 8px 2px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    }}>
      {content}
    </div>
  );
}

function UserBubble({ content, theme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '88%', padding: '9px 13px', fontSize: 13, lineHeight: 1.55,
        color: theme.TEXT, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.22)',
        borderRadius: '10px 10px 2px 10px',
      }}>
        {content}
      </div>
    </div>
  );
}

function ClaudeBubble({ content, theme }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: theme.AMBER_BG, border: `1px solid ${theme.AMBER_RING}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: theme.AMBER,
      }}>✦</div>
      <div style={{
        maxWidth: '88%', padding: '9px 13px', fontSize: 13, lineHeight: 1.55,
        color: theme.TEXT, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        background: theme.SURFACE, border: `1px solid ${theme.BORDER}`,
        borderRadius: '10px 10px 10px 2px',
      }}>
        {content}
      </div>
    </div>
  );
}

function ThinkingDots({ amber, theme }) {
  const color = amber ? theme.AMBER : theme.MUTED;
  return (
    <div style={{ display: 'flex', gap: 5, padding: '10px 13px', background: theme.SURFACE, border: `1px solid ${theme.BORDER}`, borderRadius: 8, width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: color, animation: `tdot 1.2s ${i * .2}s ease-in-out infinite` }} />
      ))}
    </div>
  );
}

export default function ChatPanel({ width }) {
  const { theme } = useTheme();
  const { BG, SURFACE, BORDER, MUTED, TEXT, AMBER } = theme;

  const [mode,          setMode]          = useState('claude');
  const [termEntries,   setTermEntries]   = useState(SEED);
  const [claudeEntries, setClaudeEntries] = useState(CLAUDE_SEED);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [termEntries, claudeEntries, loading]);
  useEffect(() => { setInput(''); inputRef.current?.focus(); }, [mode]);

  const runTerminal = async (command) => {
    setTermEntries(e => [...e, { id: uid(), type: 'command', content: command }]);
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:3001/api/terminal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) });
      const data = await res.json();
      setTermEntries(e => [...e, { id: uid(), type: 'output', content: data.output, exitCode: data.exitCode }]);
    } catch (err) {
      setTermEntries(e => [...e, { id: uid(), type: 'output', content: `fetch error: ${err.message}`, exitCode: 1 }]);
    }
    setLoading(false);
  };

  const runClaude = async (prompt) => {
    setClaudeEntries(e => [...e, { id: uid(), type: 'user', content: prompt }]);
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:3001/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      setClaudeEntries(e => [...e, { id: uid(), type: 'claude', content: data.output, exitCode: data.exitCode }]);
    } catch (err) {
      setClaudeEntries(e => [...e, { id: uid(), type: 'claude', content: `Error: ${err.message}`, exitCode: 1 }]);
    }
    setLoading(false);
  };

  const submit = async () => {
    if (!input.trim() || loading) return;
    const value = input.trim();
    setInput('');
    if (mode === 'terminal') await runTerminal(value);
    else                     await runClaude(value);
    inputRef.current?.focus();
  };

  const entries    = mode === 'terminal' ? termEntries : claudeEntries;
  const isTerminal = mode === 'terminal';
  const promptColor = isTerminal ? GREEN : AMBER;

  return (
    <div style={{ width: width ?? 340, flexShrink: 0, display: 'flex', flexDirection: 'column', background: BG, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FBBF24', display: 'inline-block' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: GREEN,    display: 'inline-block' }} />
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 7, padding: 2, marginLeft: 6 }}>
          {['terminal', 'claude'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '3px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              background: mode === m ? (m === 'claude' ? theme.AMBER_BG : BORDER) : 'transparent',
              color:      mode === m ? (m === 'claude' ? AMBER : TEXT) : MUTED,
              transition: 'all .15s',
            }}>
              {m === 'terminal' ? '$ sh' : '✦ claude'}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: MUTED, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '2px 8px' }}>
          :3001
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(e => {
          if (e.type === 'info')    return <InfoBubble    key={e.id} content={e.content} theme={theme} />;
          if (e.type === 'command') return <CommandBubble key={e.id} content={e.content} theme={theme} />;
          if (e.type === 'output')  return <OutputBubble  key={e.id} content={e.content} exitCode={e.exitCode} theme={theme} />;
          if (e.type === 'user')    return <UserBubble    key={e.id} content={e.content} theme={theme} />;
          if (e.type === 'claude')  return <ClaudeBubble  key={e.id} content={e.content} theme={theme} />;
          return null;
        })}
        {loading && <ThinkingDots amber={!isTerminal} theme={theme} />}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ color: promptColor, fontFamily: 'monospace', fontSize: 14, flexShrink: 0 }}>
            {isTerminal ? '$' : '✦'}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={isTerminal ? 'enter command…' : 'ask claude…'}
            disabled={loading}
            autoFocus
            style={{
              flex: 1, background: 'transparent', border: 'none', color: TEXT, fontSize: 13, outline: 'none',
              fontFamily: isTerminal ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
            }}
          />
          <button
            onClick={submit}
            disabled={loading || !input.trim()}
            style={{
              background: !loading && input.trim() ? promptColor : 'transparent',
              border: 'none', borderRadius: 6, padding: '3px 10px',
              color: !loading && input.trim() ? BG : MUTED,
              cursor: !loading && input.trim() ? 'pointer' : 'default',
              fontSize: 12, fontWeight: 700, transition: 'all .15s', flexShrink: 0,
            }}
          >↵</button>
        </div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 6, textAlign: 'center' }}>
          {isTerminal ? 'Enter to run · stdout + stderr combined' : 'Enter to send · powered by claude CLI'}
        </div>
      </div>
    </div>
  );
}
