"use client";

import * as React from "react";
import { useClasses, useClassStudents, useGradesForClass } from "@/lib/hooks-data";
import type { GradeEntry } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ClipboardList, Calculator, User, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateNote, NOTE_MIN, NOTE_MAX } from "@/lib/validation";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/contexts/auth-context";

function noteStyle(note: number): string {
  if (note == null || Number.isNaN(note)) return "border-[var(--border)] bg-[var(--muted)]/20";
  if (note >= 10) return "border-emerald-500/40 bg-emerald-500/10";
  if (note >= 8) return "border-amber-500/40 bg-amber-500/10";
  return "border-red-500/40 bg-red-500/10";
}

function noteTextStyle(note: number): string {
  if (note == null || Number.isNaN(note)) return "text-[var(--foreground)]";
  if (note >= 10) return "text-emerald-600";
  if (note >= 8) return "text-amber-600";
  return "text-red-600";
}

export default function TeacherNotesPage() {
  const { user } = useAuth();
  const { data: classes, loading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
  const { data: classStudents, loading: classStudentsLoading } = useClassStudents(selectedClassId);
  const { data: gradesForClass, setGrades, refetch: refetchGrades, loading: gradesLoading } = useGradesForClass(selectedClassId);

  const [examNames, setExamNames] = React.useState<string[]>(["DS1", "DS2", "Contrôle"]);
  const [newExamModalOpen, setNewExamModalOpen] = React.useState(false);
  const [newExamName, setNewExamName] = React.useState("");
  const [localNotes, setLocalNotes] = React.useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const getLocalNote = React.useCallback(
    (studentId: string, examName: string): number => {
      const key = `${studentId}-${examName}`;
      const raw = localNotes[key]?.trim().replace(",", ".") ?? "";
      const n = raw === "" ? NaN : parseFloat(raw);
      return typeof n === "number" && !Number.isNaN(n) && n >= NOTE_MIN && n <= NOTE_MAX ? n : NaN;
    },
    [localNotes]
  );

  const setLocalNote = React.useCallback(
    (studentId: string, examName: string, value: string) => {
      if (value !== "" && !/^\d*[,.]?\d*$/.test(value)) return;
      const key = `${studentId}-${examName}`;
      setLocalNotes((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  React.useEffect(() => {
    if (!selectedClassId || classStudents.length === 0) {
      setLocalNotes({});
      return;
    }
    const next: Record<string, string> = {};
    classStudents.forEach((s) => {
      examNames.forEach((ex) => {
        const e = gradesForClass.find((x) => x.studentId === s.id && x.examName === ex);
        const n = e?.note ?? NaN;
        next[`${s.id}-${ex}`] =
          typeof n === "number" && !Number.isNaN(n) ? String(n) : "";
      });
    });
    setLocalNotes(next);
  }, [
    selectedClassId,
    examNames.join(","),
    classStudents.map((s) => s.id).join(","),
    gradesForClass,
  ]);

  const rowAverages = React.useMemo(() => {
    return classStudents.map((s) => {
      const vals = examNames
        .map((ex) => getLocalNote(s.id, ex))
        .filter((n) => !Number.isNaN(n));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
    });
  }, [classStudents, examNames, getLocalNote]);

  const columnAverages = React.useMemo(() => {
    return examNames.map((ex) => {
      const vals = classStudents
        .map((s) => getLocalNote(s.id, ex))
        .filter((n) => !Number.isNaN(n));
      return vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : NaN;
    });
  }, [classStudents, examNames, getLocalNote]);

  const validateAndSave = React.useCallback(async () => {
    if (!selectedClassId) return;
    const date = new Date().toISOString().slice(0, 10);
    const entries: GradeEntry[] = [];
    let validationError: string | null = null;
    classStudents.forEach((s) => {
      examNames.forEach((ex) => {
        const key = `${s.id}-${ex}`;
        const raw = localNotes[key]?.trim();
        if (raw === "") return;
        const err = validateNote(raw.replace(",", "."));
        if (err) {
          validationError = err;
          return;
        }
        const n = parseFloat(raw.replace(",", "."));
        if (n >= NOTE_MIN && n <= NOTE_MAX) {
          entries.push({ studentId: s.id, examName: ex, note: n, date, coefficient: 1 });
        }
      });
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      await setGrades(entries);
      await refetchGrades();
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
      toast.success("Les notes ont bien été enregistrées.");
      if (selectedClass && user?.id) {
        try {
          await fetch("/api/notifications/create-for-class", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              classId: selectedClassId,
              className: selectedClass.name,
              examNames,
              userId: user.id,
            }),
          });
        } catch {
          // non bloquant
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l’enregistrement.";
      const friendly = msg.includes("check") || msg.includes("constraint")
        ? "Une note doit être entre 0 et 20."
        : msg;
      toast.error(friendly);
    } finally {
      setSaving(false);
    }
  }, [selectedClassId, classStudents, examNames, localNotes, setGrades, refetchGrades]);

  const addExam = () => {
    const name = newExamName.trim();
    if (name && !examNames.includes(name)) {
      setExamNames([...examNames, name]);
      setNewExamName("");
      setNewExamModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Saisie des notes
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Choisissez une classe et renseignez les notes. Les moyennes se
          calculent automatiquement.
        </p>
      </div>

      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="flex flex-wrap items-end gap-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="notes-class" className="text-sm font-medium">Classe</Label>
            <select
              id="notes-class"
              value={selectedClassId ?? ""}
              onChange={(e) => setSelectedClassId(e.target.value || null)}
              className="flex h-11 min-w-[200px] rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              aria-label="Choisir une classe"
            >
              <option value="">— Choisir une classe —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => setNewExamModalOpen(true)}
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Nouvelle évaluation
          </Button>
        </CardContent>
      </Card>

      <Dialog open={newExamModalOpen} onOpenChange={setNewExamModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle évaluation</DialogTitle>
            <DialogDescription>
              Ajouter une colonne (ex. DS3, Partiel, Oral).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-exam-name">Nom de l’évaluation</Label>
              <Input
                id="new-exam-name"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                placeholder="Ex. DS3"
                className="rounded-xl"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addExam())
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewExamModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={addExam}
              disabled={
                !newExamName.trim() || examNames.includes(newExamName.trim())
              }
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedClassId && (
        <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="border-b border-[var(--border)]/50 bg-[var(--muted)]/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)]">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Notes — {selectedClass?.name}</CardTitle>
                  <CardDescription>
                    Saisissez les notes puis cliquez sur &quot;Valider les notes&quot;. Vert ≥ 10, orange 8–10, rouge &lt; 8.
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={validateAndSave}
                disabled={saving}
                className="gap-2 rounded-xl bg-[var(--primary)] font-medium shadow-lg shadow-[var(--primary)]/25 hover:opacity-95"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Enregistrement…
                  </>
                ) : savedMessage ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Notes enregistrées
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Valider les notes
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {classStudentsLoading || gradesLoading ? (
              <LoadingState message="Chargement des élèves et des notes…" />
            ) : classStudents.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-12 w-12" />}
                title="Aucun élève dans cette classe"
                description="Ajoutez des élèves dans la page Classes."
              />
            ) : (
              <div className="overflow-x-auto">
                {/* Grille : en-têtes */}
                <div
                  className="flex min-w-[600px] border-b border-[var(--border)] bg-[var(--muted)]/40"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `minmax(160px, 1fr) repeat(${examNames.length}, minmax(72px, 80px)) 72px`,
                  }}
                >
                  <div className="flex items-center gap-2 px-4 py-3 font-semibold text-[var(--foreground)]">
                    <User className="h-4 w-4 opacity-70" />
                    Élève
                  </div>
                  {examNames.map((ex) => (
                    <div
                      key={ex}
                      className="flex flex-col items-center justify-center px-2 py-3 text-center text-sm font-medium text-[var(--foreground)]"
                    >
                      {ex}
                      <span className="text-xs font-normal text-[var(--muted-foreground)]">
                        /20
                      </span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center px-2 py-3 text-center">
                    <Calculator className="mx-auto h-4 w-4 text-[var(--primary)]" />
                    <span className="text-xs font-semibold">Moy.</span>
                  </div>
                </div>

                {/* Lignes élèves */}
                {classStudents.map((s, rowIndex) => {
                  const avg = rowAverages[rowIndex];
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "flex min-w-[600px] border-b border-[var(--border)]/70 transition-colors hover:bg-[var(--muted)]/10",
                        rowIndex % 2 === 1 && "bg-[var(--muted)]/5"
                      )}
                      style={{
                        display: "grid",
                        gridTemplateColumns: `minmax(160px, 1fr) repeat(${examNames.length}, minmax(72px, 80px)) 72px`,
                      }}
                    >
                      <div className="flex items-center px-4 py-2.5 font-medium text-[var(--foreground)]">
                        {s.name}
                      </div>
                      {examNames.map((ex) => {
                        const cellKey = `${s.id}-${ex}`;
                        const displayVal = localNotes[cellKey] ?? "";
                        const note = getLocalNote(s.id, ex);
                        return (
                          <div
                            key={ex}
                            className="flex items-center justify-center p-2"
                          >
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="—"
                              className={cn(
                                "h-10 w-14 rounded-xl border px-2 text-center text-sm font-medium outline-none transition focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--card)]",
                                noteStyle(note)
                              )}
                              value={displayVal}
                              onChange={(e) =>
                                setLocalNote(s.id, ex, e.target.value)
                              }
                            />
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-center p-2">
                        <span
                          className={cn(
                            "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border px-2 text-sm font-semibold",
                            noteStyle(avg),
                            noteTextStyle(avg)
                          )}
                        >
                          {Number.isNaN(avg) ? "—" : avg.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Ligne moyenne classe */}
                <div
                  className="flex min-w-[600px] border-t-2 border-[var(--border)] bg-[var(--muted)]/30 font-medium"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `minmax(160px, 1fr) repeat(${examNames.length}, minmax(72px, 80px)) 72px`,
                  }}
                >
                  <div className="px-4 py-3 text-sm text-[var(--foreground)]">
                    Moyenne classe
                  </div>
                  {columnAverages.map((avg, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center p-2"
                    >
                      <span
                        className={cn(
                          "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl border px-2 text-sm font-semibold",
                          noteStyle(avg),
                          noteTextStyle(avg)
                        )}
                      >
                        {Number.isNaN(avg) ? "—" : avg.toFixed(1)}
                      </span>
                    </div>
                  ))}
                  <div />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
