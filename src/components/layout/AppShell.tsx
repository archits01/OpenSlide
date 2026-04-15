"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { useIsMobile } from "@/hooks/useIsMobile";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor = pathname.startsWith("/editor/");
  const isPublicView = pathname.startsWith("/view/");
  const isMobile = useIsMobile();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Editor + public view: render children only, no shell
  if (isEditor || isPublicView) {
    return <>{children}</>;
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--app-bg)" }}>
        {/* Mobile top bar */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{ height: 56, background: "var(--app-bg)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 10, color: "rgba(255,255,255,0.8)" }}
          >
            <HugeiconsIcon icon={Menu01Icon} size={20} />
          </button>
          <span
            className="text-[18px] tracking-[-0.025em] select-none"
            style={{ fontFamily: "var(--font-geist-sans)", color: "white", fontWeight: 750 }}
          >
            <span style={{ color: "var(--accent)", fontWeight: 550 }}>Open</span>
            <span>Slide</span>
          </span>
          {/* Spacer to balance the hamburger on the left */}
          <div style={{ width: 36 }} />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* Drawer */}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Sidebar collapsed={false} onToggleCollapse={() => setDrawerOpen(false)} />
        </MobileDrawer>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--app-bg)" }}>
      <motion.div
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
        className="flex-shrink-0 h-full overflow-hidden"
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </motion.div>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
