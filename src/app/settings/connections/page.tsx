'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Connection {
  provider: string;
  status: 'active' | 'broken';
  metadata: { email?: string; login?: string } | null;
  createdAt: string;
}

const PROVIDERS = [
  { id: 'github', label: 'GitHub', description: 'Import repos and code as slides', authRequired: true },
  { id: 'gmail', label: 'Gmail', description: 'Email decks directly from the editor', authRequired: true },
  { id: 'google_drive', label: 'Google Drive', description: 'Access your files and import documents', authRequired: true },
  { id: 'google_sheets', label: 'Google Sheets', description: 'Pull data and charts into slides', authRequired: true },
  { id: 'export_pdf', label: 'Export PDF', description: 'Export decks as PDF/PPTX for attachments', authRequired: false },
];

function ConnectionsInner() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/user/connections');
    if (res.ok) setConnections(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin === window.location.origin && e.data?.type === 'oauth_success') load();
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [load]);

  async function disconnect(provider: string) {
    setDisconnecting(provider);
    await fetch('/api/user/connections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    await load();
    setDisconnecting(null);
  }

  function handleConnect(providerId: string) {
    const url = `/api/auth/connect/${providerId}?returnTo=/settings/connections`;
    const popup = window.open(url, `oauth_${providerId}`, 'width=600,height=700,left=200,top=100');
    if (!popup) window.location.href = url;
  }

  const justConnected = searchParams.get('connected');

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
        Connectors
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '28px' }}>
        Connect external accounts to use them in the editor.
      </p>

      {justConnected && (
        <div style={{
          padding: '10px 14px', background: 'var(--green-soft)', border: '1px solid var(--green)',
          borderRadius: 'var(--r-md)', color: 'var(--green)', fontSize: '14px', marginBottom: '20px',
        }}>
          {PROVIDERS.find(p => p.id === justConnected)?.label ?? justConnected} connected
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text3)' }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          {PROVIDERS.map((p) => {
            const conn = connections.find((c) => c.provider === p.id);
            const isConnected = conn?.status === 'active';
            const isBroken = conn?.status === 'broken';
            const identifier = conn?.metadata?.email ?? conn?.metadata?.login;

            return (
              <div key={p.id} style={{
                padding: '14px 16px', background: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text)' }}>{p.label}</span>
                    {!p.authRequired && (
                      <span style={{ fontSize: '11px', color: 'var(--text3)', background: 'var(--bg2)', padding: '1px 6px', borderRadius: '4px' }}>Built-in</span>
                    )}
                    {isBroken && (
                      <span style={{ fontSize: '11px', color: 'var(--red)', background: 'var(--red-soft)', padding: '1px 6px', borderRadius: '4px' }}>Reconnect needed</span>
                    )}
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text2)' }}>
                    {identifier ? `Connected as ${identifier}` : p.description}
                  </p>
                </div>
                {p.authRequired && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {(isConnected || isBroken) && (
                      <button onClick={() => disconnect(p.id)} disabled={disconnecting === p.id}
                        style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '13px', background: 'transparent', color: 'var(--text2)', cursor: 'pointer' }}>
                        {disconnecting === p.id ? '…' : 'Disconnect'}
                      </button>
                    )}
                    {(!isConnected || isBroken) && (
                      <button onClick={() => handleConnect(p.id)}
                        style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', fontSize: '13px', cursor: 'pointer' }}>
                        {isBroken ? 'Reconnect' : 'Connect'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return <Suspense><ConnectionsInner /></Suspense>;
}
