"use client";

import * as React from "react";
import type { ClassItem, GradeEntry, CorrectionItem } from "@/lib/store";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import * as db from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";

/** Données uniquement depuis Supabase. Si pas de Supabase ou vide → affichage vide. */

// ——— Classes ———

export function useClasses() {
  const { user, useSupabase } = useAuth();
  const supabase = React.useMemo(() => getSupabaseClientOrNull(), []);
  const [data, setData] = React.useState<ClassItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    if (!useSupabase || !supabase) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await db.dbGetClasses(supabase);
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [useSupabase, supabase]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const addClass = React.useCallback(
    async (name: string) => {
      if (!useSupabase || !supabase) return;
      setError(null);
      try {
        await db.dbAddClass(supabase, name.trim(), user.id);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [useSupabase, supabase, user.id, refetch]
  );

  const updateClass = React.useCallback(
    async (id: string, name: string, _studentIds: string[]) => {
      if (!useSupabase || !supabase) return;
      setError(null);
      try {
        await db.dbUpdateClass(supabase, id, name);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [useSupabase, supabase, refetch]
  );

  const deleteClass = React.useCallback(
    async (id: string) => {
      if (!useSupabase || !supabase) return;
      setError(null);
      try {
        await db.dbDeleteClass(supabase, id);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [useSupabase, supabase, refetch]
  );

  return { data, loading, error, refetch, addClass, updateClass, deleteClass };
}

// ——— Élèves d’une classe ———

export function useClassStudents(classId: string | null) {
  const supabase = React.useMemo(() => getSupabaseClientOrNull(), []);
  const { useSupabase } = useAuth();
  const [data, setData] = React.useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    if (!classId) { setData([]); return; }
    if (!useSupabase || !supabase) {
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await db.dbGetClassStudents(supabase, classId);
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [classId, useSupabase, supabase]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const addStudentToClass = React.useCallback(
    async (studentId: string) => {
      if (!classId || !useSupabase || !supabase) return;
      setError(null);
      try {
        await db.dbAddStudentToClass(supabase, classId, studentId);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [classId, useSupabase, supabase, refetch]
  );

  const removeStudentFromClass = React.useCallback(
    async (studentId: string) => {
      if (!classId || !useSupabase || !supabase) return;
      setError(null);
      try {
        await db.dbRemoveStudentFromClass(supabase, classId, studentId);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [classId, useSupabase, supabase, refetch]
  );

  return { data, loading, error, refetch, addStudentToClass, removeStudentFromClass };
}

// ——— Notes (classe) ———

export function useGradesForClass(classId: string | null) {
  const supabase = React.useMemo(() => getSupabaseClientOrNull(), []);
  const { useSupabase } = useAuth();
  const [data, setData] = React.useState<GradeEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    if (!classId) { setData([]); setLoading(false); return; }
    if (!useSupabase || !supabase) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await db.dbGetGradesForClass(supabase, classId);
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [classId, useSupabase, supabase]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const setGrades = React.useCallback(
    async (entries: GradeEntry[]) => {
      if (!classId || !useSupabase || !supabase) return;
      setError(null);
      try {
        await db.dbSetGradesForClass(supabase, classId, entries);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [classId, useSupabase, supabase, refetch]
  );

  return { data, loading, error, refetch, setGrades };
}

// ——— Notes (élève) ———

export function useGradesForStudent(studentId: string | null) {
  const supabase = React.useMemo(() => getSupabaseClientOrNull(), []);
  const { useSupabase } = useAuth();
  const [data, setData] = React.useState<GradeEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    if (!studentId) { setData([]); setLoading(false); return; }
    if (!useSupabase || !supabase) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await db.dbGetGradesForStudent(supabase, studentId);
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [studentId, useSupabase, supabase]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ——— Corrections ———

export function useCorrections(options?: { classId?: string | null }) {
  const supabase = React.useMemo(() => getSupabaseClientOrNull(), []);
  const { user, useSupabase } = useAuth();
  const [data, setData] = React.useState<CorrectionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    if (!useSupabase || !supabase) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await db.dbGetCorrections(supabase, options);
      setData(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [useSupabase, supabase, options?.classId]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const addCorrection = React.useCallback(
    async (item: { title: string; classId: string | null; filePath: string; fileName: string }) => {
      if (!useSupabase || !supabase) throw new Error("Supabase requis");
      setError(null);
      try {
        const newItem = await db.dbAddCorrection(supabase, {
          ...item,
          uploadedBy: user.id,
        });
        await refetch();
        return newItem;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [useSupabase, supabase, user.id, refetch]
  );

  const deleteCorrection = React.useCallback(
    async (id: string, filePath?: string) => {
      if (!useSupabase || !supabase) return;
      setError(null);
      try {
        if (filePath) {
          try {
            await db.dbDeleteCorrectionFile(supabase, filePath);
          } catch (e) {
            console.warn("Suppression du fichier Storage:", e);
          }
        }
        await db.dbDeleteCorrection(supabase, id);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
        throw e;
      }
    },
    [useSupabase, supabase, refetch]
  );

  return { data, loading, error, refetch, addCorrection, deleteCorrection };
}

// ——— Notifications (élèves) ———

export type NotificationItem = { id: string; title: string; message: string; read: boolean; created_at: string };

export function useNotifications(userId: string | null, enabled: boolean) {
  const supabase = React.useMemo(() => getSupabaseClientOrNull(), []);
  const [data, setData] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refetch = React.useCallback(async () => {
    if (!enabled || !userId || !supabase) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      setData((rows ?? []) as NotificationItem[]);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, userId, supabase]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  const markAsRead = React.useCallback(
    async (id: string) => {
      if (!supabase) return;
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      setData((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [supabase]
  );

  const markAllAsRead = React.useCallback(async () => {
    if (!supabase || !userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    setData((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [supabase, userId]);

  const unreadCount = data.filter((n) => !n.read).length;
  return { notifications: data, unreadCount, loading, markAsRead, markAllAsRead, refetch };
}