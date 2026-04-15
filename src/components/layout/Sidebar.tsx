"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GridViewIcon,
  Presentation01Icon,
  File01Icon,
  FolderOpenIcon,
  BrushIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  Settings01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { SettingsModal } from "@/components/shared/SettingsModal";
import { useProfile, clearProfileCache } from "@/lib/hooks/useProfile";
import {
  InfoCard,
  InfoCardContent,
  InfoCardTitle,
  InfoCardDescription,
  InfoCardMedia,
  InfoCardFooter,
  InfoCardDismiss,
  InfoCardAction,
} from "@/components/shared/InfoCard";
interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function WordMark() {
  return (
    <span
      className="text-[20px] tracking-[-0.025em] select-none"
      style={{
        fontFamily: "var(--font-geist-sans)",
        color: "white",
        fontWeight: 750,
      }}
    >
      <span style={{ color: "var(--accent)", fontWeight: 550 }}>Open</span>
      <span>Slide</span>
    </span>
  );
}

function NavItem({
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] tracking-[-0.01em] transition-all duration-150 overflow-hidden"
      style={{
        color: active ? "white" : "rgba(255,255,255,0.85)",
        background: active ? "rgba(255,255,255,0.1)" : "transparent",
        fontWeight: active ? 600 : 500,
        transition: "all 200ms cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
          (e.currentTarget as HTMLButtonElement).style.color = "white";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
        }
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] rounded-r-full"
          style={{ width: 4, background: "linear-gradient(to bottom, var(--accent), #D4673F)" }}
        />
      )}
      <span style={{ color: active ? "var(--accent)" : "inherit" }}>{icon}</span>
      <span className="text-left">{label}</span>
      {badge && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-0.5"
          style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <div className="my-2" style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { profile, refresh: refreshProfile } = useProfile();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        clearProfileCache();
        refreshProfile();
      } else if (!session?.user) {
        clearProfileCache();
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PROTECTED = ["/presentations", "/docs", "/assets", "/brand", "/settings"];
  function navTo(href: string) {
    if (!user && PROTECTED.includes(href)) {
      router.push("/?auth=1");
    } else {
      router.push(href);
    }
  }

  if (collapsed) {
    const collapsedNav = [
      { icon: <HugeiconsIcon icon={GridViewIcon} size={20} strokeWidth={2} />, label: "Explore", href: "/" },
      { icon: <HugeiconsIcon icon={Presentation01Icon} size={20} strokeWidth={2} />, label: "Presentations", href: "/presentations" },
      { icon: <HugeiconsIcon icon={File01Icon} size={20} strokeWidth={2} />, label: "Docs", href: "/docs" },
      { icon: <HugeiconsIcon icon={FolderOpenIcon} size={20} strokeWidth={2} />, label: "Assets", href: "/assets" },
      { icon: <HugeiconsIcon icon={BrushIcon} size={20} strokeWidth={2} />, label: "Brand Kit", href: "/brand" },
    ];

    return (
      <div className="flex flex-col items-center py-4 gap-1.5" style={{ width: 60, background: "var(--app-bg)" }}>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-[var(--r-md)] transition-colors mb-2"
          style={{ color: "rgba(255,255,255,0.8)" }}
          title="Expand sidebar"
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
        >
          <HugeiconsIcon icon={PanelRightCloseIcon} size={18} strokeWidth={2.5} />
        </button>
        {collapsedNav.map(({ icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <button
              key={href}
              title={label}
              onClick={() => navTo(href)}
              className="flex items-center justify-center rounded-xl transition-all duration-150"
              style={{
                width: 44,
                height: 44,
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color: isActive ? "var(--accent)" : "rgba(255,255,255,0.85)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                }
              }}
            >
              {icon}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full py-4"
      style={{ width: 220, minWidth: 220, flexShrink: 0, background: "var(--app-bg)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 mb-3 mt-1">
        <WordMark />
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-[var(--r-sm)] transition-colors"
          style={{ color: "rgba(255,255,255,0.85)" }}
          title="Collapse sidebar"
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
        >
          <HugeiconsIcon icon={PanelLeftOpenIcon} size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Nav */}
      <div className="px-3 flex flex-col gap-0.5">
        <NavItem
          icon={<HugeiconsIcon icon={GridViewIcon} size={18} strokeWidth={2} />}
          label="Explore"
          active={pathname === "/"}
          onClick={() => router.push("/")}
        />
        <NavItem
          icon={<HugeiconsIcon icon={Presentation01Icon} size={18} strokeWidth={2} />}
          label="Presentations"
          active={pathname === "/presentations"}
          onClick={() => navTo("/presentations")}
        />
        <NavItem
          icon={<HugeiconsIcon icon={File01Icon} size={18} strokeWidth={2} />}
          label="Docs"
          active={pathname === "/docs"}
          onClick={() => navTo("/docs")}
        />
        <NavItem
          icon={<HugeiconsIcon icon={FolderOpenIcon} size={18} strokeWidth={2} />}
          label="Assets"
          active={pathname === "/assets"}
          onClick={() => navTo("/assets")}
        />
        <NavItem
          icon={<HugeiconsIcon icon={BrushIcon} size={18} strokeWidth={2} />}
          label="Brand Kit"
          active={pathname === "/brand"}
          onClick={() => navTo("/brand")}
        />
      </div>

      {/* Bottom: info card + avatar / sign in */}
      <div className="mt-auto px-2 pt-3 overflow-hidden">
        {user ? (
          <>
            <div className="mb-2">
              <InfoCard
                storageKey="openslide-pro-card"
                dismissType="forever"
              >
                <InfoCardContent>
                  <InfoCardTitle
                    style={{ fontSize: 12, color: "white", letterSpacing: "-0.01em" }}
                  >
                    Upgrade to Pro
                  </InfoCardTitle>
                  <InfoCardDescription
                    style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}
                  >
                    Unlimited slides, custom themes &amp; exports.
                  </InfoCardDescription>
                  <InfoCardMedia
                    fadeColor="#0a0a0a"
                    shrinkHeight={75}
                    expandHeight={130}
                    media={[
                      { src: "https://cd-misc.s3.us-east-2.amazonaws.com/sidebar/third.webp" },
                      { src: "https://cd-misc.s3.us-east-2.amazonaws.com/sidebar/second.webp" },
                      { src: "https://cd-misc.s3.us-east-2.amazonaws.com/sidebar/first.webp" },
                    ]}
                  />
                  <InfoCardFooter
                    style={{ color: "rgba(255,255,255,0.55)", paddingTop: 6 }}
                  >
                    <InfoCardDismiss
                      style={{ color: "rgba(255,255,255,0.55)", fontSize: 11.5 }}
                      className="hover:text-white transition-colors"
                    >
                      Dismiss
                    </InfoCardDismiss>
                    <InfoCardAction>
                      <Link
                        href="/?upgrade=1"
                        className="flex items-center gap-1 transition-colors"
                        style={{ color: "var(--accent-text)", fontSize: 11.5, fontWeight: 500 }}
                      >
                        Upgrade <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} />
                      </Link>
                    </InfoCardAction>
                  </InfoCardFooter>
                </InfoCardContent>
              </InfoCard>
            </div>
            <Divider />
            <div
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--r-md)] cursor-pointer transition-all duration-150"
              style={{ color: "rgba(255,255,255,0.7)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLDivElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
                (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.7)";
              }}
            >
              {/* Avatar */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  position: "relative",
                  width: 30,
                  height: 30,
                  background: profile?.avatarUrl ? "transparent" : "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  (profile?.fullName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: "white", lineHeight: 1.3 }}>
                  {profile?.fullName ?? user.email?.split("@")[0] ?? "User"}
                </p>
                {user.email && (
                  <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>
                    {user.email}
                  </p>
                )}
              </div>
              <button
                title="Settings"
                onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
                className="p-1 rounded-[var(--r-sm)] transition-colors flex-shrink-0"
                style={{ color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >
                <HugeiconsIcon icon={Settings01Icon} size={15} />
              </button>
            </div>
          </>
        ) : (
          <div
            onClick={() => router.push("/?auth=1")}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--r-md)] cursor-pointer transition-all duration-150"
            style={{ color: "var(--text2)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.04)";
              (e.currentTarget as HTMLDivElement).style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "transparent";
              (e.currentTarget as HTMLDivElement).style.color = "var(--text2)";
            }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 30,
                height: 30,
                background: "var(--bg2)",
                color: "var(--text3)",
              }}
            >
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
            </div>
            <p className="text-[13px] font-medium" style={{ color: "inherit", lineHeight: 1.3 }}>
              Sign in
            </p>
          </div>
        )}
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
