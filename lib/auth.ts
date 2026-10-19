"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { isTransientAuthError } from "./authSession";
import { supabase } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "tutor" | "student" | "parent";
  linkedId: number | null;   // tutor_id or student_id; null for admin
  fullName: string | null;
  mustResetPassword: boolean;
}

interface ProfileRow {
  role: string;
  linked_id: number | null;
  full_name: string | null;
  force_password_reset: boolean | null;
}

function toAuthUser(session: Session, profile: ProfileRow): AuthUser {
  return {
    id:                session.user.id,
    email:             session.user.email ?? "",
    role:              profile.role as AuthUser["role"],
    linkedId:          profile.linked_id ?? null,
    fullName:          profile.full_name ?? null,
    mustResetPassword: profile.force_password_reset === true,
  };
}

function sameUser(a: AuthUser, b: AuthUser): boolean {
  return a.id === b.id
    && a.email === b.email
    && a.role === b.role
    && a.linkedId === b.linkedId
    && a.fullName === b.fullName
    && a.mustResetPassword === b.mustResetPassword;
}

/**
 * Reads the current Supabase auth session and the user's profile row.
 * Does NOT enforce redirect — portals fall back to dev IDs when unauthenticated.
 * Call signOut() to log the user out of this browser only.
 *
 * authLoaded stays false until the session is actually known. A null user
 * with authLoaded means there is no session, or the profile row is missing.
 * Token refreshes do not clear the user or refetch the profile.
 */
export function useAuth() {
  const [user, setUser]                 = useState<AuthUser | null>(null);
  const [authLoaded, setLoaded]         = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    let active = true;
    let hasProfile = false;
    let profileAttempts = 0;
    let generation = 0;

    function markSignedOut() {
      generation += 1;
      hasProfile = false;
      setUser(null);
      setProfileMissing(false);
      setSessionMissing(true);
      setLoaded(true);
    }

    async function loadProfile(session: Session) {
      const gen = generation;
      const attempt = ++profileAttempts;
      const { data, error } = await supabase
        .from("profiles")
        .select("role, linked_id, full_name, force_password_reset")
        .eq("id", session.user.id)
        .single();

      if (!active || gen !== generation || attempt !== profileAttempts) return;

      const profile = data as ProfileRow | null;
      if (profile) {
        hasProfile = true;
        const next = toAuthUser(session, profile);
        setUser((current) => (current && sameUser(current, next) ? current : next));
        setProfileMissing(false);
        setSessionMissing(false);
        setLoaded(true);
        return;
      }

      // PGRST116 is "0 rows" from .single(). Anything else is a blip.
      const code = error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";
      if (code === "PGRST116") {
        hasProfile = false;
        setUser(null);
        setProfileMissing(true);
        setSessionMissing(false);
        setLoaded(true);
        return;
      }

      if (profileAttempts < 3 && gen === generation) {
        const scheduledGen = gen;
        window.setTimeout(() => {
          if (active && scheduledGen === generation) void loadProfile(session);
        }, 700 * profileAttempts);
      }
    }

    function confirmSignedOut() {
      window.setTimeout(() => {
        void supabase.auth.getSession().then(({ data: { session: current }, error }) => {
          if (!active) return;
          if (current) {
            if (!hasProfile) {
              profileAttempts = 0;
              void loadProfile(current);
            }
            return;
          }
          // An expired access token plus a network blip is not a sign-out.
          // The refresh token is still in the cookie; the next tick retries.
          if (isTransientAuthError(error)) return;
          markSignedOut();
        });
      }, 0);
    }

    function onAuthEvent(event: AuthChangeEvent, session: Session | null) {
      // A refresh already wrote the new cookies. Replacing `user` here
      // re-runs portal loaders and, if the profile read blips, looks like
      // a sign-out. Keep the loaded profile.
      if (event === "TOKEN_REFRESHED") {
        if (session && !hasProfile) {
          profileAttempts = 0;
          void loadProfile(session);
        }
        return;
      }

      if (event === "SIGNED_OUT" || !session) {
        confirmSignedOut();
        return;
      }

      profileAttempts = 0;
      void loadProfile(session);
    }

    // Defer out of the callback. supabase-js holds its auth lock while the
    // listener runs; calling getSession or a query from inside it deadlocks
    // and the refresh never finishes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(() => {
        if (!active) return;
        onAuthEvent(event, session);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, authLoaded, sessionMissing, profileMissing };
}

export async function signOut(): Promise<void> {
  // Default scope is global, which revokes every refresh token for this
  // user. Signing out of one browser was ending the tutor's other devices,
  // including the one left open for the nightly parent-update check.
  await supabase.auth.signOut({ scope: "local" });
}
