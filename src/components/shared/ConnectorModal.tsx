'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Connection {
  provider: string;
  status: 'active' | 'broken';
  metadata: { email?: string; login?: string } | null;
}

interface ConnectorDef {
  id: string;
  label: string;
  description: string;
  iconUrl: string;
  action: 'connect' | 'built-in';
  badge?: 'New' | 'Soon';
  recommended?: boolean;
}

const ALL_CONNECTORS: ConnectorDef[] = [
  // Recommended
  { id: 'github', label: 'GitHub', description: 'Import repos, READMEs, and code into slides', iconUrl: '/images/connectors/github.png', action: 'connect', recommended: true },
  { id: 'gmail', label: 'Gmail', description: 'Email decks directly from the editor', iconUrl: '/images/connectors/gmail.png', action: 'connect', recommended: true },
  // Apps
  { id: 'export_pdf', label: 'Export PDF', description: 'Export decks as PDF or PPTX attachments', iconUrl: '/images/connectors/acrobat.svg', action: 'built-in' },
  { id: 'google_drive', label: 'Google Drive', description: 'Access your files and import documents', iconUrl: '/images/connectors/google-drive.png', action: 'connect' },
  { id: 'google_sheets', label: 'Google Sheets', description: 'Pull data and charts into slides', iconUrl: '/images/connectors/google-sheets.png', action: 'connect' },
  { id: 'notion', label: 'Notion', description: 'Turn Notion pages into presentations', iconUrl: '/images/connectors/notion.png', action: 'connect', badge: 'Soon' },
  { id: 'slack', label: 'Slack', description: 'Share decks to channels and threads', iconUrl: '/images/connectors/slack.png', action: 'connect', badge: 'Soon' },
];

interface ConnectorModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectorModal({ open, onClose }: ConnectorModalProps) {
  const [search, setSearch] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/connections');
      if (res.ok) setConnections(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) { load(); setSearch(''); }
  }, [open, load]);

  // Listen for OAuth popup success
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin === window.location.origin && e.data?.type === 'oauth_success') load();
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [load]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  function handleConnect(id: string) {
    const c = ALL_CONNECTORS.find((x) => x.id === id);
    if (c?.badge === 'Soon') return;
    const returnTo = window.location.pathname;
    const url = `/api/auth/connect/${id}?returnTo=${encodeURIComponent(returnTo)}`;
    const popup = window.open(url, `oauth_${id}`, 'width=600,height=700,left=200,top=100');
    if (!popup) window.location.href = url;
  }

  async function handleDisconnect(id: string) {
    setDisconnecting(id);
    try {
      await fetch('/api/user/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: id }),
      });
      await load();
    } finally {
      setDisconnecting(null);
    }
  }

  // Filter by search
  const filtered = ALL_CONNECTORS.filter((c) =>
    !search || c.label.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  );
  const recommended = filtered.filter((c) => c.recommended);
  const apps = filtered.filter((c) => !c.recommended);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            style={{
              width: '90vw', maxWidth: '780px',
              maxHeight: '80vh',
              background: '#1a1a1c',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>
                Connectors
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', borderRadius: '8px', fontSize: '18px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '16px 24px 0',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              gap: '16px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.06)', borderRadius: '8px',
                padding: '6px 12px', width: '200px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: 'white', fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
              {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>Loading…</p>
              ) : (
                <>
                  {/* Recommended */}
                  {recommended.length > 0 && (
                    <>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Recommended
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
                        {recommended.map((c) => (
                          <ConnectorCard
                            key={c.id}
                            connector={c}
                            connection={connections.find((x) => x.provider === c.id)}
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnect}
                            isDisconnecting={disconnecting === c.id}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* All Apps */}
                  {apps.length > 0 && (
                    <>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Apps
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {apps.map((c) => (
                          <ConnectorCard
                            key={c.id}
                            connector={c}
                            connection={connections.find((x) => x.provider === c.id)}
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnect}
                            isDisconnecting={disconnecting === c.id}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {filtered.length === 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                      No connectors match &quot;{search}&quot;
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Individual connector card ── */

function ConnectorCard({
  connector: c,
  connection: conn,
  onConnect,
  onDisconnect,
  isDisconnecting,
}: {
  connector: ConnectorDef;
  connection?: Connection;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  isDisconnecting: boolean;
}) {
  const isConnected = conn?.status === 'active';
  const isBroken = conn?.status === 'broken';
  const isSoon = c.badge === 'Soon';
  const isBuiltIn = c.action === 'built-in';
  const isClickable = !isSoon && !isBuiltIn && !isConnected;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        padding: '16px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '12px',
        opacity: isSoon ? 0.45 : 1,
        border: isConnected ? '1px solid rgba(34,197,94,0.3)' : isBroken ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
        position: 'relative',
      }}
    >
      {/* Top-right action */}
      <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', gap: 6, alignItems: 'center' }}>
        {(isConnected || isBroken) && !isBuiltIn && (
          <button
            onClick={() => { if (!isDisconnecting) onDisconnect(c.id); }}
            disabled={isDisconnecting}
            style={{
              fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: 5,
              border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
              color: isDisconnecting ? 'rgba(255,255,255,0.25)' : 'rgba(239,68,68,0.8)',
              cursor: isDisconnecting ? 'default' : 'pointer', lineHeight: '16px',
              transition: 'color 100ms, border-color 100ms',
            }}
            onMouseEnter={(e) => { if (!isDisconnecting) { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isDisconnecting ? 'rgba(255,255,255,0.25)' : 'rgba(239,68,68,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            {isDisconnecting ? '…' : 'Disconnect'}
          </button>
        )}
        {(!isConnected || isBroken) && !isBuiltIn && !isSoon && (
          <button
            onClick={() => onConnect(c.id)}
            style={{
              fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: 5,
              border: 'none', background: isBroken ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)',
              color: isBroken ? '#ef4444' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', lineHeight: '16px',
              transition: 'background 100ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isBroken ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.16)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isBroken ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.1)'; }}
          >
            {isBroken ? 'Reconnect' : 'Connect'}
          </button>
        )}
        {isConnected && !isBroken && !isBuiltIn && (
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#22c55e' }}>Connected</span>
        )}
        {isBuiltIn && (
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Built-in</span>
        )}
        {isSoon && (
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Soon</span>
        )}
      </div>

      {/* Icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        cursor: isClickable ? 'pointer' : 'default',
      }}
        onClick={() => { if (isClickable) onConnect(c.id); }}
      >
        <img src={c.iconUrl} alt="" width={22} height={22} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '80px', cursor: isClickable ? 'pointer' : 'default' }}
        onClick={() => { if (isClickable) onConnect(c.id); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>{c.label}</span>
          {c.badge && !isSoon && (
            <span style={{
              fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
              padding: '1px 6px', borderRadius: '4px',
              background: 'rgba(99,102,241,0.2)', color: '#818cf8',
              letterSpacing: '0.04em',
            }}>
              {c.badge}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>
          {conn?.metadata?.email ?? conn?.metadata?.login ?? c.description}
        </p>
      </div>
    </div>
  );
}
