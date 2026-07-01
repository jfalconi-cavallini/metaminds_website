"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "tutor" | "student";
  linkedId: number | null;   // tutor_id or student_id; null for admin
  fullName: string | null;
}

/**
 * Reads the current Supabase auth session and the user's profile row.
 * Does NOT enforce redirect — portals fall back to dev IDs when unauthenticated.
 * Call signOut() to log the user out.
 */
export function useAuth() {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [authLoaded, setLoaded] = useState(false);

  useEffect(() => {
    async function resolve() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoaded(true); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, linked_id, full_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUser({
          id:       session.user.id,
          email:    session.user.email ?? "",
          role:     profile.role as AuthUser["role"],
          linkedId: profile.linked_id ?? null,
          fullName: profile.full_name ?? null,
        });
      }
      setLoaded(true);
    }
    resolve();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      resolve();
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, authLoaded };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
