'use client';

import { useEffect, useState, useCallback } from 'react';

interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/user/api-keys');
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    setCreating(true);
    const res = await fetch('/api/user/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Default' }),
    });
    if (res.ok) {
      const data = await res.json() as { rawKey: string };
      setNewKey(data.rawKey);
      await load();
    }
    setCreating(false);
  }

  async function revoke(id: string) {
    setRevoking(id);
    await fetch('/api/user/api-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNewKey(null);
    await load();
    setRevoking(null);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
        API Keys
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>
        Use API keys to let external apps create presentations in your account via the MCP protocol.
      </p>

      {newKey && (
        <div style={{
          padding: '14px', background: 'var(--warn-soft)', border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)', marginBottom: '24px',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--warn)', fontWeight: 500 }}>
            Copy this key now — you won&apos;t see it again
          </p>
          <code style={{
            display: 'block', padding: '10px', background: 'var(--bg)', borderRadius: 'var(--r-sm)',
            fontSize: '13px', wordBreak: 'break-all', color: 'var(--text)',
          }}>
            {newKey}
          </code>
        </div>
      )}

      <button
        onClick={create}
        disabled={creating}
        style={{
          padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 'var(--r-md)', fontSize: '14px', cursor: creating ? 'wait' : 'pointer',
          marginBottom: '24px',
        }}
      >
        {creating ? 'Generating\u2026' : 'Generate New Key'}
      </button>

      {loading ? (
        <p style={{ color: 'var(--text3)' }}>Loading\u2026</p>
      ) : keys.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: '14px' }}>No API keys yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {keys.map((k) => (
            <div key={k.id} style={{
              padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
              background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <code style={{ fontSize: '13px', color: 'var(--text)' }}>{k.prefix}</code>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text3)' }}>
                  {k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'Never used'}
                  {' \u00b7 '}Created {new Date(k.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => revoke(k.id)}
                disabled={revoking === k.id}
                style={{
                  padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  fontSize: '13px', background: 'transparent', color: 'var(--red)', cursor: 'pointer',
                }}
              >
                {revoking === k.id ? 'Revoking\u2026' : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '32px', padding: '16px', background: 'var(--bg2)', borderRadius: 'var(--r-lg)' }}>
        <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
          Usage
        </p>
        <pre style={{ margin: 0, fontSize: '12px', color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
{`# List available tools
curl -X POST https://your-app.com/api/mcp/tools/list \\
  -H "Authorization: Bearer sk-os-..." \\
  -H "Content-Type: application/json"

# Create a slide
curl -X POST https://your-app.com/api/mcp/tools/call \\
  -H "Authorization: Bearer sk-os-..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"create_slide","arguments":{"title":"Hello","content":"<p>World</p>"}}'`}
        </pre>
      </div>
    </div>
  );
}
