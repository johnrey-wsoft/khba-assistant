"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabase/client";

import { getUserQueryOptions } from "@/queries/user.query";
import { isAdminRole, type AccessRole } from "@/constants/access-role.constant";

export const useAuth = () => {
  const supabase = getSupabaseClient();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    ...getUserQueryOptions(),
    enabled: !!user,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);

  const currentProfile = user ? (profile ?? null) : null;
  const role: AccessRole | null = currentProfile?.accessRole ?? null;

  return {
    session,
    user,
    profile: currentProfile,
    // RBAC: null until the profile loads; isAdmin is a convenience for gating UI.
    role,
    isAdmin: isAdminRole(role),
    isLoading: isAuthLoading || (!!user && isProfileLoading),
  };
};
