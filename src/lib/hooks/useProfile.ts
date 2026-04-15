"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

export type Profile = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

// ─── In-memory cache (shared across all hook consumers) ──────────────────────
let cachedProfile: Profile | null = null;
let fetchPromise: Promise<Profile | null> | null = null;
const listeners = new Set<(p: Profile | null) => void>();

async function fetchProfile(): Promise<Profile | null> {
  try {
    const res = await fetch("/api/profile");
    if (!res.ok) return null;
    const { profile } = await res.json();
    return profile ?? null;
  } catch {
    return null;
  }
}

function broadcast(p: Profile | null) {
  listeners.forEach((fn) => fn(p));
}

// ─── Context (optional — wrap app in ProfileProvider for shared state) ────────
const ProfileContext = createContext<ProfileContextValue | null>(null);

// ─── Hook ────────────────────────────────────────────────────────────────────
// If used inside a ProfileProvider, shares state. Otherwise standalone.
export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  const standalone = useProfileStandalone();
  return ctx ?? standalone;
}

function useProfileStandalone(): ProfileContextValue {
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);

  // Subscribe to broadcasts from other hook instances
  useEffect(() => {
    const handler = (p: Profile | null) => {
      setProfile(p);
      setLoading(false);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    cachedProfile = null;
    fetchPromise = null;
    const p = await fetchProfile();
    cachedProfile = p;
    broadcast(p);
  }, []);

  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    // Deduplicate concurrent fetches
    if (!fetchPromise) {
      fetchPromise = fetchProfile();
    }

    fetchPromise.then((p) => {
      cachedProfile = p;
      broadcast(p);
    });
  }, []);

  return { profile, loading, refresh };
}

// ─── Clear cache on sign-out (call this from your sign-out handler) ──────────
export function clearProfileCache() {
  cachedProfile = null;
  fetchPromise = null;
}
