/**
 * Store des données SVT — classes, notes, corrections (localStorage)
 */

export interface ClassItem {
  id: string;
  name: string;
  studentIds: string[];
}

export interface GradeEntry {
  studentId: string;
  examName: string;
  note: number;
  date: string;
  coefficient?: number;
}

export interface CorrectionItem {
  id: string;
  title: string;
  classId: string | null;
  fileUrl: string;
  /** Chemin dans le bucket Storage (pour suppression du fichier) */
  filePath?: string;
  fileName: string;
  uploadedAt: string;
}

const KEY_CLASSES = "svt-classes";
const KEY_GRADES = "svt-grades";
const KEY_CORRECTIONS = "svt-corrections";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getClasses(): ClassItem[] {
  return loadJson<ClassItem[]>(KEY_CLASSES, []);
}

export function setClasses(classes: ClassItem[]): void {
  saveJson(KEY_CLASSES, classes);
}

export function addClass(name: string, studentIds: string[]): ClassItem {
  const classes = getClasses();
  const id = "c-" + Date.now();
  const item: ClassItem = { id, name, studentIds };
  setClasses([...classes, item]);
  return item;
}

export function updateClass(id: string, name: string, studentIds: string[]): void {
  const classes = getClasses().map((c) =>
    c.id === id ? { ...c, name, studentIds } : c
  );
  setClasses(classes);
}

export function deleteClass(id: string): void {
  setClasses(getClasses().filter((c) => c.id !== id));
}

/** Retirer un élève de toutes les classes (à appeler avant removeStudent) */
export function removeStudentFromAllClasses(studentId: string): void {
  const classes = getClasses().map((c) => ({
    ...c,
    studentIds: c.studentIds.filter((id) => id !== studentId),
  }));
  setClasses(classes);
}

// Grades: key = classId, value = GradeEntry[]
export type GradesMap = Record<string, GradeEntry[]>;

export function getGrades(): GradesMap {
  return loadJson<GradesMap>(KEY_GRADES, {});
}

export function setGrades(grades: GradesMap): void {
  saveJson(KEY_GRADES, grades);
}

export function getGradesForClass(classId: string): GradeEntry[] {
  return getGrades()[classId] ?? [];
}

export function setGradesForClass(classId: string, entries: GradeEntry[]): void {
  const grades = getGrades();
  grades[classId] = entries;
  setGrades({ ...grades });
}

export function setGradeForStudent(
  classId: string,
  studentId: string,
  examName: string,
  note: number,
  date: string,
  coefficient?: number
): void {
  const entries = getGradesForClass(classId);
  const rest = entries.filter(
    (e) => !(e.studentId === studentId && e.examName === examName)
  );
  rest.push({ studentId, examName, note, date, coefficient });
  setGradesForClass(classId, rest);
}

/** Toutes les notes d’un élève (toutes classes) */
export function getGradesForStudent(studentId: string): GradeEntry[] {
  const grades = getGrades();
  const out: GradeEntry[] = [];
  for (const entries of Object.values(grades)) {
    for (const e of entries) {
      if (e.studentId === studentId) out.push(e);
    }
  }
  return out.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Corrections
export function getCorrections(): CorrectionItem[] {
  return loadJson<CorrectionItem[]>(KEY_CORRECTIONS, []);
}

export function setCorrections(items: CorrectionItem[]): void {
  saveJson(KEY_CORRECTIONS, items);
}

export function addCorrection(item: Omit<CorrectionItem, "id" | "uploadedAt">): CorrectionItem {
  const list = getCorrections();
  const newItem: CorrectionItem = {
    ...item,
    id: "corr-" + Date.now(),
    uploadedAt: new Date().toISOString(),
  };
  setCorrections([...list, newItem]);
  return newItem;
}

export function deleteCorrection(id: string): void {
  setCorrections(getCorrections().filter((c) => c.id !== id));
}
