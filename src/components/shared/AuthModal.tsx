"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SignInPage } from "@/components/ui/sign-in";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lazy Supabase ref — avoids calling createClient() during SSR prerender
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    const supabase = getSupabase();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Account created — check your email to confirm before signing in.");
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
    }

    onSuccess();
    onClose();
  }

  async function handleGoogleAuth() {
    setError(null);
    const { error: oauthError } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
    // If no error, browser navigates to Google — no further action needed
  }

  function handleResetPassword() {
    alert("Reset password — email support@openslides.ai");
  }

  function toggleMode() {
    setError(null);
    setMode((prev) => (prev === "signup" ? "signin" : "signup"));
  }

  if (!mounted) return null;

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="auth-window-shell relative overflow-hidden"
            style={{
              background: "var(--app-bg)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 30px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button — 44×44 tap target on mobile, 36×36 on desktop */}
            <button
              onClick={onClose}
              aria-label="Close sign in"
              className="absolute top-3 right-3 md:top-4 md:right-4 z-[110] flex items-center justify-center transition-all duration-150 w-11 h-11 md:w-9 md:h-9 rounded-[10px]"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
              }}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            {/* Error pill — on mobile, pushed below the close button to avoid overlap */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key={error}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-[68px] md:top-4 left-1/2 -translate-x-1/2 z-[110] px-4 py-2 rounded-full text-xs md:text-sm"
                  style={{
                    background: "var(--red-soft)",
                    color: "var(--red)",
                    border: "1px solid var(--red)",
                    backdropFilter: "blur(8px)",
                    maxWidth: "min(90%, 380px)",
                    textAlign: "center",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <SignInPage
              title={
                <span className="font-light text-foreground tracking-tighter">
                  {mode === "signup" ? "Create Account" : "Welcome"}
                </span>
              }
              description={
                mode === "signup"
                  ? "Start building beautiful presentations in seconds"
                  : "Sign in to continue to OpenSlide"
              }
              heroImageSrc="/images/sign-in-hero.png"
              onSignIn={handleSignIn}
              onGoogleSignIn={handleGoogleAuth}
              onResetPassword={handleResetPassword}
              onCreateAccount={toggleMode}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
