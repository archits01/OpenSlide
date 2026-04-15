'use client';

import { useState, useEffect } from 'react';

interface ConnectCardProps {
  provider: string;
  connectUrl: string;
  message: string;
  onConnected?: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  gmail: 'Gmail',
  github: 'GitHub',
};

export function ConnectCard({ provider, connectUrl, message, onConnected }: ConnectCardProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.origin === window.location.origin &&
        event.data?.type === 'oauth_success' &&
        event.data?.provider === provider
      ) {
        setStatus('connected');
        onConnected?.();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [provider, onConnected]);

  function handleConnect() {
    const popup = window.open(
      connectUrl,
      `oauth_${provider}`,
      'width=600,height=700,left=200,top=100'
    );

    if (!popup) {
      window.location.href = `${connectUrl}&returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setStatus('connecting');
  }

  const label = PROVIDER_LABELS[provider] ?? provider;

  if (status === 'connected') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'var(--green-soft)',
          border: '1px solid var(--green)',
          borderRadius: 'var(--r-md)',
          color: 'var(--green)',
          fontSize: '14px',
        }}
      >
        <span>✓</span>
        <span>{label} connected</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px 16px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        maxWidth: '360px',
      }}
    >
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)' }}>{message}</p>
      <button
        onClick={handleConnect}
        disabled={status === 'connecting'}
        style={{
          padding: '8px 16px',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--r-md)',
          fontSize: '14px',
          cursor: status === 'connecting' ? 'wait' : 'pointer',
          opacity: status === 'connecting' ? 0.7 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {status === 'connecting' ? 'Connecting…' : `Connect ${label}`}
      </button>
    </div>
  );
}
