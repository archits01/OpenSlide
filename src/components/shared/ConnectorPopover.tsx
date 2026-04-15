'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomSheet } from './BottomSheet';
import { useIsMobile } from '@/hooks/useIsMobile';

interface Connection {
  provider: string;
  status: 'active' | 'broken';
  metadata: { email?: string; login?: string } | null;
}

interface ProviderDef {
  id: string;
  label: string;
  iconUrl: string;
  badge?: string;
}

const QUICK_PROVIDERS: ProviderDef[] = [
  { id: 'github', label: 'GitHub', iconUrl: '/images/connectors/github.png' },
  { id: 'gmail', label: 'Gmail', iconUrl: '/images/connectors/gmail.png' },
  { id: 'google_drive', label: 'Google Drive', iconUrl: '/images/connectors/google-drive.png' },
  { id: 'google_sheets', label: 'Google Sheets', iconUrl: '/images/connectors/google-sheets.png' },
  { id: 'notion', label: 'Notion', iconUrl: '/images/connectors/notion.png', badge: 'Soon' },
  { id: 'slack', label: 'Slack', iconUrl: '/images/connectors/slack.png', badge: 'Soon' },
];

interface ConnectorPopoverProps {
  open: boolean;
  onClose: () => void;
  onOpenModal: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function ConnectorPopover({ open, onClose, onOpenModal, anchorRef }: ConnectorPopoverProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/connections');
      if (res.ok) setConnections(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin === window.location.origin && e.data?.type === 'oauth_success') load();
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [load]);

  function handleConnect(id: string) {
    const p = QUICK_PROVIDERS.find((x) => x.id === id);
    if (p?.badge === 'Soon') return;
    const returnTo = window.location.pathname;
    const url = `/api/auth/connect/${id}?returnTo=${encodeURIComponent(returnTo)}`;
    const popup = window.open(url, `oauth_${id}`, 'width=600,height=700,left=200,top=100');
    if (!popup) window.location.href = url;
  }

  const providerList = (
    <>
      {/* Provider list */}
      <div style={{ padding: '4px 0' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>Loading…</div>
        ) : (
          QUICK_PROVIDERS.map((p) => {
            const conn = connections.find((c) => c.provider === p.id);
            const isConnected = conn?.status === 'active';
            const identifier = conn?.metadata?.email ?? conn?.metadata?.login;
            const isSoon = p.badge === 'Soon';
            const isClickable = !isSoon && !isConnected;

            let actionText = 'Connect';
            if (isConnected) actionText = identifier ?? 'Connected';
            else if (isSoon) actionText = '';

            return (
              <div
                key={p.id}
                onClick={() => { if (isClickable) handleConnect(p.id); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 18px',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'background 100ms',
                  opacity: isSoon ? 0.4 : 1,
                }}
                onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={p.iconUrl} alt="" width={20} height={20} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '15px', color: 'white', fontWeight: 500, letterSpacing: '-0.01em' }}>{p.label}</span>
                  {p.badge && (
                    <span style={{
                      fontSize: '11px', color: 'rgba(255,255,255,0.35)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      padding: '1px 7px', borderRadius: '4px', lineHeight: '18px',
                      fontWeight: 500,
                    }}>{p.badge}</span>
                  )}
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                  {actionText}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '10px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', transition: 'background 100ms',
        }}
        onClick={() => { onClose(); onOpenModal(); }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>+</span>
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Add connectors</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <img src="/images/connectors/notion.png" alt="" width={14} height={14} style={{ opacity: 0.4 }} />
          <img src="/images/connectors/google-sheets.png" alt="" width={14} height={14} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginLeft: '2px' }}>+4</span>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <div style={{ paddingBottom: 16 }}>
          <p style={{ margin: '0 18px 4px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
            Connectors
          </p>
          {providerList}
        </div>
      </BottomSheet>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '6px',
            width: '360px',
            background: '#1e1e20',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {providerList}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
