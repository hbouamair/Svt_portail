/**
 * Couche données async — Supabase (remplace les appels sync de store.ts)
 * Les fonctions prennent le client Supabase en premier argument (client ou server).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import type { ClassItem, GradeEntry, CorrectionItem } from "./store";

type Db = SupabaseClient<Database>;

// ——— Classes ———

export async function dbGetClasses(db: Db): Promise<ClassItem[]> {
  const { data: rows, error } = await db.from("classes").select("id, name").order("name");
  if (error) throw new Error(error.message);
  const classRows = rows ?? [];
  if (classRows.length === 0) return [];

  const classIds = classRows.map((r) => r.id);
  const { data: links, error: linksError } = await db
    .from("class_students")
    .select("class_id, user_id")
    .in("class_id", classIds);
  if (linksError) throw new Error(linksError.message);

  const studentIdsByClass = new Map<string, string[]>();
  for (const id of classIds) studentIdsByClass.set(id, []);
  for (const l of links ?? []) {
    const list = studentIdsByClass.get(l.class_id);
    if (list) list.push(l.user_id);
  }

  return classRows.map((row) => ({
    id: row.id,
    name: row.name,
    studentIds: studentIdsByClass.get(row.id) ?? [],
  }));
}

export async function dbAddClass(db: Db, name: string, createdBy: string): Promise<ClassItem> {
  const { data, error } = await db.from("classes").insert({ name, created_by: createdBy }).select("id, name").single();
  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, studentIds: [] };
}

export async function dbUpdateClass(db: Db, id: string, name: string): Promise<void> {
  const { error } = await db.from("classes").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function dbDeleteClass(db: Db, id: string): Promise<void> {
  const { error } = await db.from("classes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ——— Élèves par classe ———

export async function dbGetClassStudents(db: Db, classId: string): Promise<{ id: string; name: string; email: string }[]> {
  const { data, error } = await db
    .from("class_students")
    .select("user_id")
    .eq("class_id", classId);
  if (error) throw new Error(error.message);
  const ids = (data ?? []).map((r) => r.user_id);
  if (ids.length === 0) return [];
  const { data: profiles, error: e2 } = await db.from("profiles").select("id, name, email").in("id", ids);
  if (e2) throw new Error(e2.message);
  return (profiles ?? []).map((p) => ({ id: p.id, name: p.name, email: p.email }));
}

export async function dbAddStudentToClass(db: Db, classId: string, userId: string): Promise<void> {
  const { error } = await db.from("class_students").insert({ class_id: classId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function dbRemoveStudentFromClass(db: Db, classId: string, userId: string): Promise<void> {
  const { error } = await db.from("class_students").delete().eq("class_id", classId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// ——— Notes ———

function rowToGradeEntry(r: { student_id: string; exam_name: string; note: number; date: string; coefficient: number | null }): GradeEntry {
  return {
    studentId: r.student_id,
    examName: r.exam_name,
    note: r.note,
    date: r.date,
    coefficient: r.coefficient ?? undefined,
  };
}

export async function dbGetGradesForClass(db: Db, classId: string): Promise<GradeEntry[]> {
  const { data, error } = await db
    .from("grades")
    .select("student_id, exam_name, note, date, coefficient")
    .eq("class_id", classId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToGradeEntry);
}

/** Notes de l’élève (toutes classes) pour la vue élève */
export async function dbGetGradesForStudent(db: Db, studentId: string): Promise<GradeEntry[]> {
  const { data, error } = await db
    .from("grades")
    .select("student_id, exam_name, note, date, coefficient")
    .eq("student_id", studentId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToGradeEntry);
}

/** Enregistrer toutes les notes d’une classe (upsert par student_id + exam_name) */
export async function dbSetGradesForClass(db: Db, classId: string, entries: GradeEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const toInsert = entries.map((e) => ({
    class_id: classId,
    student_id: e.studentId,
    exam_name: e.examName,
    note: e.note,
    date: e.date,
    coefficient: e.coefficient ?? null,
  }));
  const { error } = await db.from("grades").upsert(toInsert, {
    onConflict: "class_id,student_id,exam_name",
  });
  if (error) throw new Error(error.message);
}

// ——— Corrections ———

/** Construire l’URL publique d’un fichier dans le bucket corrections */
export function getCorrectionFileUrl(filePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/corrections/${filePath}`;
}

export async function dbGetCorrections(db: Db, options?: { classId?: string | null }): Promise<CorrectionItem[]> {
  let q = db.from("corrections").select("id, title, class_id, file_path, file_name, uploaded_at");
  if (options?.classId !== undefined && options.classId !== null) {
    q = q.eq("class_id", options.classId);
  }
  const { data, error } = await q.order("uploaded_at", { ascending: false });
  if (error) throw new Error(error.message);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    classId: r.class_id,
    fileUrl: getCorrectionFileUrl(r.file_path, url),
    filePath: r.file_path,
    fileName: r.file_name,
    uploadedAt: r.uploaded_at,
  }));
}

export async function dbAddCorrection(
  db: Db,
  payload: { title: string; classId: string | null; filePath: string; fileName: string; uploadedBy: string }
): Promise<CorrectionItem> {
  const { data, error } = await db
    .from("corrections")
    .insert({
      title: payload.title,
      class_id: payload.classId,
      file_path: payload.filePath,
      file_name: payload.fileName,
      uploaded_by: payload.uploadedBy,
    })
    .select("id, title, class_id, file_path, file_name, uploaded_at")
    .single();
  if (error) throw new Error(error.message);
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return {
    id: data.id,
    title: data.title,
    classId: data.class_id,
    fileUrl: getCorrectionFileUrl(data.file_path, baseUrl),
    filePath: data.file_path,
    fileName: data.file_name,
    uploadedAt: data.uploaded_at,
  };
}

export async function dbDeleteCorrection(db: Db, id: string): Promise<void> {
  const { error } = await db.from("corrections").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Supprimer le fichier du bucket Storage (à appeler avant dbDeleteCorrection si besoin) */
export async function dbDeleteCorrectionFile(db: Db, filePath: string): Promise<void> {
  const { error } = await db.storage.from("corrections").remove([filePath]);
  if (error) throw new Error(error.message);
}

// ——— Notifications (élèves) ———

export type NotificationRow = { id: string; user_id: string; title: string; message: string; read: boolean; created_at: string };

export async function dbGetNotifications(db: Db, userId: string): Promise<NotificationRow[]> {
  const { data, error } = await db
    .from("notifications")
    .select("id, user_id, title, message, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function dbMarkNotificationRead(db: Db, id: string): Promise<void> {
  const { error } = await db.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function dbMarkAllNotificationsRead(db: Db, userId: string): Promise<void> {
  const { error } = await db.from("notifications").update({ read: true }).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

/** Créer une notification pour chaque élève de la classe (appelé côté serveur avec service_role). */
export async function dbCreateNotificationsForClass(
  db: Db,
  classId: string,
  className: string,
  examNames: string[]
): Promise<void> {
  const { data: links, error: e1 } = await db
    .from("class_students")
    .select("user_id")
    .eq("class_id", classId);
  if (e1) throw new Error(e1.message);
  const userIds = (links ?? []).map((r) => r.user_id);
  if (userIds.length === 0) return;
  const controleLabel = examNames.length > 0 ? examNames.join(", ") : "les évaluations";
  const title = "Nouvelles notes disponibles";
  const message = `Les notes du ${controleLabel} pour la classe ${className} sont disponibles dans votre espace.`;
  const rows = userIds.map((user_id) => ({ user_id, title, message }));
  const { error: e2 } = await db.from("notifications").insert(rows);
  if (e2) throw new Error(e2.message);
}

// ——— Profils (pour liste élèves, auth, etc.) ———

export type ProfileRow = { id: string; name: string; email: string; role: string; must_change_password?: boolean };

const PROFILES_SELECT = "id, name, email, role, must_change_password";
const PROFILES_SELECT_LEGACY = "id, name, email, role";

function isMissingColumnError(err: { message?: string }): boolean {
  const m = err?.message ?? "";
  return m.includes("must_change_password") || (m.includes("column") && m.includes("does not exist"));
}

export async function dbGetProfiles(db: Db, role?: "student" | "teacher" | "admin"): Promise<ProfileRow[]> {
  let q = db.from("profiles").select(PROFILES_SELECT);
  if (role) q = q.eq("role", role);
  let { data, error } = await q.order("name");
  if (error && isMissingColumnError(error)) {
    q = db.from("profiles").select(PROFILES_SELECT_LEGACY);
    if (role) q = q.eq("role", role);
    const fallback = await q.order("name");
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []).map((r) => ({ ...r, must_change_password: false }));
  }
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, must_change_password: (r as ProfileRow).must_change_password ?? false }));
}

export async function dbGetProfile(db: Db, userId: string): Promise<ProfileRow | null> {
  let { data, error } = await db.from("profiles").select(PROFILES_SELECT).eq("id", userId).single();
  if (error && isMissingColumnError(error)) {
    const fallback = await db.from("profiles").select(PROFILES_SELECT_LEGACY).eq("id", userId).single();
    if (fallback.error && fallback.error.code !== "PGRST116") throw new Error(fallback.error.message);
    if (!fallback.data) return null;
    return { ...fallback.data, must_change_password: false };
  }
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  if (!data) return null;
  return { ...data, must_change_password: data.must_change_password ?? false };
}

export async function dbUpsertProfile(
  db: Db,
  payload: { id: string; name: string; email: string; role: "admin" | "teacher" | "student"; must_change_password?: boolean }
): Promise<void> {
  const { error } = await db.from("profiles").upsert(payload, { onConflict: "id" });
  if (error && isMissingColumnError(error)) {
    const { id, name, email, role } = payload;
    const { error: err2 } = await db.from("profiles").upsert({ id, name, email, role }, { onConflict: "id" });
    if (err2) throw new Error(err2.message);
    return;
  }
  if (error) throw new Error(error.message);
}
