"use client";

import * as React from "react";
import {
  getStoredRole,
  getStoredUserId,
  setStoredRole,
  setStoredUserId,
  logout as authLogout,
  getUsers,
  type Role,
  type User,
} from "@/lib/auth";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import { dbGetProfile, dbGetProfiles } from "@/lib/db";

interface AuthContextValue {
  user: User;
  role: Role;
  isLoggedIn: boolean;
  setRole: (role: Role) => void;
  login: (userId: string) => void;
  logout: () => void;
  allUsers: User[];
  /** Recharge la liste des profils (utile après création d’un élève). */
  refetchProfiles: () => Promise<void>;
  /** true quand la source des données est Supabase (auth + profils) */
  useSupabase: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function profileToUser(p: { id: string; name: string; email: string; role: string; must_change_password?: boolean }): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as Role,
    mustChangePassword: p.must_change_password ?? false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [supabaseUser, setSupabaseUser] = React.useState<User | null>(null);
  const [allProfiles, setAllProfiles] = React.useState<User[]>([]);
  const [sessionUserId, setSessionUserId] = React.useState<string | null>(null);
  const [sessionUserName, setSessionUserName] = React.useState("");
  const [sessionUserEmail, setSessionUserEmail] = React.useState("");
  const [sessionMustChangePassword, setSessionMustChangePassword] = React.useState(false);
  const supabase = React.useMemo(() => getSupabaseClientOrNull(), []);

  const setSessionAndProfile = React.useCallback(
    (session: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } } | null) => {
      if (!session?.user) {
        setSessionUserId(null);
        setSessionUserName("");
        setSessionUserEmail("");
        setSessionMustChangePassword(false);
        setSupabaseUser(null);
        return;
      }
      setSessionUserId(session.user.id);
      setSessionUserName((session.user.user_metadata?.name as string) ?? session.user.email ?? "");
      setSessionUserEmail(session.user.email ?? "");
      setSessionMustChangePassword(session.user.user_metadata?.must_change_password === true);
      dbGetProfile(supabase!, session.user.id).then((profile) => {
        if (profile) setSupabaseUser(profileToUser(profile));
        else setSupabaseUser(null);
      });
    },
    [supabase]
  );

  React.useEffect(() => {
    if (!supabase) {
      setUserIdState(getStoredUserId());
      setMounted(true);
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setMounted(true);
      setSessionAndProfile(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setSessionAndProfile(session);
    });
    const loadProfiles = () =>
      dbGetProfiles(supabase).then((list) => {
        if (!cancelled) setAllProfiles(list.map(profileToUser));
      });
    loadProfiles();
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, setSessionAndProfile]);

  const refetchProfiles = React.useCallback(async () => {
    if (!supabase) return;
    const list = await dbGetProfiles(supabase);
    setAllProfiles(list.map(profileToUser));
  }, [supabase]);

  const login = React.useCallback((id: string) => {
    if (supabase) return;
    const u = getUsers().find((x) => x.id === id);
    if (u) setStoredRole(u.role);
    setStoredUserId(id);
    setUserIdState(id);
  }, [supabase]);

  const logout = React.useCallback(() => {
    if (supabase) {
      supabase.auth.signOut();
      setSupabaseUser(null);
      return;
    }
    authLogout();
    setUserIdState(null);
  }, [supabase]);

  const setRole = React.useCallback((newRole: Role) => {
    setStoredRole(newRole);
  }, []);

  const useSupabase = !!supabase;
  // Liste des utilisateurs/élèves : uniquement depuis la base (Supabase). Pas de localStorage.
  const allUsers = useSupabase ? allProfiles : [];
  // Dès qu'on a une session Supabase, on est "connecté" (même si le profil n'est pas encore chargé)
  const currentUserId = useSupabase
    ? (sessionUserId ?? supabaseUser?.id ?? null)
    : (mounted ? getStoredUserId() : userId);
  const defaultUser: User = { id: "", name: "", email: "", role: "student", mustChangePassword: false };
  // Résolution du user connecté : profil session si dispo, sinon user minimal depuis la session (pour redirect change-password)
  const resolvedUser: User = currentUserId
    ? (useSupabase
        ? (supabaseUser?.id === currentUserId
            ? supabaseUser
            : sessionUserId === currentUserId
              ? {
                  id: currentUserId,
                  name: sessionUserName || "Élève",
                  email: sessionUserEmail,
                  role: "student" as Role,
                  mustChangePassword: sessionMustChangePassword,
                }
              : (allProfiles.find((u) => u.id === currentUserId) ?? allProfiles[0] ?? defaultUser))
        : (getUsers().find((u) => u.id === currentUserId) ?? defaultUser))
    : defaultUser;
  const user: User = {
    ...resolvedUser,
    mustChangePassword: resolvedUser.mustChangePassword ?? sessionMustChangePassword,
  };
  const role: Role = user?.role ?? "student";
  const isLoggedIn = !!currentUserId && mounted;

  const value: AuthContextValue = React.useMemo(
    () => ({
      user,
      role,
      isLoggedIn,
      setRole,
      login,
      logout,
      allUsers,
      refetchProfiles,
      useSupabase,
    }),
    [user, role, isLoggedIn, setRole, login, logout, allUsers, refetchProfiles, useSupabase]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
