'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BottomSheet } from './BottomSheet';
import { useIsMobile } from '@/hooks/useIsMobile';
import { QUICK_CONNECTORS, FOOTER_PREVIEW_ICONS, FOOTER_OVERFLOW_COUNT } from '@/lib/connectors';
import type { Connector } from '@/lib/types';

interface Connection {
  provider: string;
  status: 'active' | 'broken';
  metadata: { email?: string; login?: string } | null;
}

interface ConnectorPopoverProps {
  open: boolean;
  onClose: () => void;
  onOpenModal: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const ROW_DIVIDER = '1px solid rgba(255,255,255,0.06)';

export function ConnectorPopover({ open, onClose, onOpenModal, anchorRef }: ConnectorPopoverProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; maxListHeight: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const POPOVER_WIDTH = 352;

  // Compute position — always opens below the anchor button
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    function computePos() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = rect.bottom + 8;
      const left = Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 12);
      // How much vertical space is left below the anchor (minus footer ~44px + padding)
      const maxListHeight = Math.max(120, window.innerHeight - top - 44 - 16);
      setPos({ left, top, maxListHeight });
    }
    computePos();
    window.addEventListener('resize', computePos);
    return () => window.removeEventListener('resize', computePos);
  }, [open, anchorRef]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/connections');
      if (res.ok) setConnections(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  async function handleDisconnect(e: React.MouseEvent, providerId: string) {
    e.stopPropagation();
    setDisconnecting(providerId);
    try {
      await fetch('/api/user/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      await load();
    } finally {
      setDisconnecting(null);
    }
  }

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

  function handleConnect(c: Connector) {
    if (c.status === 'soon') return;
    const returnTo = window.location.pathname;
    const url = `/api/auth/connect/${c.id}?returnTo=${encodeURIComponent(returnTo)}`;
    const popup = window.open(url, `oauth_${c.id}`, 'width=600,height=700,left=200,top=100');
    if (!popup) window.location.href = url;
  }

  const providerList = (
    <>
      <div style={{ maxHeight: pos ? `${pos.maxListHeight}px` : '280px', overflowY: 'auto' }}>
        {loading ? (
          <>
            {QUICK_CONNECTORS.map((_, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                height: 42, padding: '0 14px',
                borderBottom: idx === QUICK_CONNECTORS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.08)', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
                <div style={{ flex: 1, height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.08)', maxWidth: 90, animation: 'pulse 1.4s ease-in-out infinite' }} />
                <div style={{ width: 48, height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              </div>
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          </>
        ) : (
          QUICK_CONNECTORS.map((c, idx) => {
            const conn = connections.find((x) => x.provider === c.id);
            const isConnected = conn?.status === 'active';
            const identifier = conn?.metadata?.email ?? conn?.metadata?.login;
            const isSoon = c.status === 'soon';
            const isBeta = c.status === 'beta';
            const isClickable = !isSoon && !isConnected;
            const isLast = idx === QUICK_CONNECTORS.length - 1;

            let actionText = c.action === 'install' ? 'Install' : 'Connect';
            if (isConnected) actionText = identifier ?? 'Connected';
            else if (isSoon) actionText = '';

            const badgeLabel = isBeta ? 'Beta' : isSoon ? 'Soon' : null;

            const isDisconnecting = disconnecting === c.id;

            return (
              <div
                key={c.id}
                onClick={() => { if (isClickable) handleConnect(c); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 42,
                  padding: '0 14px',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'background 100ms',
                  opacity: isSoon ? 0.4 : 1,
                  borderBottom: isLast ? 'none' : ROW_DIVIDER,
                }}
                onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <img src={c.iconUrl} alt="" width={24} height={24} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: 14,
                    color: '#F0F0F0',
                    fontWeight: 500,
                    letterSpacing: '-0.005em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}>
                    {c.label}
                  </span>
                  {badgeLabel && (
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.45)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      padding: '1px 6px',
                      borderRadius: 4,
                      lineHeight: '14px',
                      marginLeft: -4,
                      flexShrink: 0,
                    }}>{badgeLabel}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                  {isConnected && (
                    <button
                      onClick={(e) => void handleDisconnect(e, c.id)}
                      disabled={isDisconnecting}
                      style={{
                        fontSize: 11.5, fontWeight: 500, padding: '3px 8px', borderRadius: 5,
                        border: '1px solid rgba(255,255,255,0.10)', background: 'transparent',
                        color: isDisconnecting ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.7)',
                        cursor: isDisconnecting ? 'default' : 'pointer',
                        transition: 'color 100ms, border-color 100ms',
                      }}
                      onMouseEnter={(e) => { if (!isDisconnecting) { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; } }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = isDisconnecting ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; }}
                    >
                      {isDisconnecting ? '…' : 'Disconnect'}
                    </button>
                  )}
                  <span style={{
                    fontSize: 13,
                    color: isConnected ? '#22c55e' : '#6B6B75',
                    fontWeight: 400,
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {actionText}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          height: 44,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'background 100ms',
        }}
        onClick={() => { onClose(); onOpenModal(); }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: '#6B6B75', fontWeight: 400, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 14, color: '#A0A0A8', fontWeight: 500 }}>Add connectors</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {FOOTER_PREVIEW_ICONS.map((url, i) => (
            <img
              key={url}
              src={url}
              alt=""
              width={16}
              height={16}
              style={{
                marginLeft: i === 0 ? 0 : -6,
                opacity: 0.7,
                borderRadius: 3,
                background: '#1E1E20',
              }}
            />
          ))}
          {FOOTER_OVERFLOW_COUNT > 0 && (
            <span style={{ fontSize: 11.5, color: '#6B6B75', marginLeft: 8, fontWeight: 400 }}>
              +{FOOTER_OVERFLOW_COUNT}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose}>
        <div style={{ paddingBottom: 16 }}>
          <p style={{ margin: '0 14px 8px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
            Connectors
          </p>
          {providerList}
        </div>
      </BottomSheet>
    );
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.97, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: POPOVER_WIDTH,
            background: '#1E1E20',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {providerList}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
