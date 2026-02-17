"use client";

import * as React from "react";
import { Upload, FileText, Trash2, Loader2, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCorrections, useClasses } from "@/lib/hooks-data";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { CorrectionItem } from "@/lib/store";
import { cn } from "@/lib/utils";

const CONTROLE_OPTIONS = [
  { value: "", label: "— Aucun —" },
  { value: "DS1", label: "DS1" },
  { value: "DS2", label: "DS2" },
  { value: "DS3", label: "DS3" },
  { value: "Contrôle", label: "Contrôle" },
  { value: "Partiel", label: "Partiel" },
  { value: "Oral", label: "Oral" },
  { value: "Autre", label: "Autre" },
];

/** Extrait le type de contrôle du titre (ex. "DS1 — Correction géo" -> "DS1") */
function getControleFromTitle(title: string): string {
  const i = title.indexOf(" — ");
  if (i > 0) return title.slice(0, i).trim();
  return "Sans type";
}

/** Groupe les corrections par classe puis par type de contrôle */
function groupCorrectionsByClassAndControle(
  corrections: CorrectionItem[],
  classes: { id: string; name: string }[]
): { classLabel: string; classId: string | null; groups: { controle: string; items: CorrectionItem[] }[] }[] {
  const byClass = new Map<string | null, CorrectionItem[]>();
  for (const c of corrections) {
    const key = c.classId ?? null;
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key)!.push(c);
  }
  const result: { classLabel: string; classId: string | null; groups: { controle: string; items: CorrectionItem[] }[] }[] = [];
  const sortedClassKeys = Array.from(byClass.keys()).sort((a, b) => {
    if (a === null) return -1;
    if (b === null) return 1;
    const nameA = classes.find((x) => x.id === a)?.name ?? "";
    const nameB = classes.find((x) => x.id === b)?.name ?? "";
    return nameA.localeCompare(nameB);
  });
  for (const classId of sortedClassKeys) {
    const items = byClass.get(classId)!;
    const classLabel = classId === null ? "Toutes classes" : (classes.find((x) => x.id === classId)?.name ?? "Classe");
    const byControle = new Map<string, CorrectionItem[]>();
    for (const c of items) {
      const controle = getControleFromTitle(c.title);
      if (!byControle.has(controle)) byControle.set(controle, []);
      byControle.get(controle)!.push(c);
    }
    const groups = Array.from(byControle.entries())
      .sort(([a], [b]) => (a === "Sans type" ? 1 : b === "Sans type" ? -1 : a.localeCompare(b)))
      .map(([controle, items]) => ({ controle, items: items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()) }));
    result.push({ classLabel, classId, groups });
  }
  return result;
}

export default function TeacherCorrectionsPage() {
  const { useSupabase } = useAuth();
  const { data: classes, loading: classesLoading } = useClasses();
  const {
    data: corrections,
    loading: correctionsLoading,
    addCorrection,
    deleteCorrection,
  } = useCorrections();

  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [controleType, setControleType] = React.useState("");
  const [classId, setClassId] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<CorrectionItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const grouped = React.useMemo(
    () => groupCorrectionsByClassAndControle(corrections, classes),
    [corrections, classes]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    const finalTitle = controleType.trim() ? `${controleType.trim()} — ${title.trim()}` : title.trim();
    setUploading(true);
    try {
      const supabase = getSupabaseClientOrNull();
      if (useSupabase && supabase) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${Date.now()}-${safeName}`;
        const { error } = await supabase.storage
          .from("corrections")
          .upload(filePath, file, { contentType: file.type || "application/pdf" });
        if (error) throw new Error(error.message);
        await addCorrection({
          title: finalTitle,
          classId,
          filePath,
          fileName: file.name,
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/corrections/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { fileUrl, fileName } = await res.json();
        await addCorrection({
          title: finalTitle,
          classId,
          filePath: fileName,
          fileName,
        });
      }
      setTitle("");
      setControleType("");
      setClassId(null);
      setFile(null);
      setAddModalOpen(false);
      toast.success("Correction ajoutée.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCorrection(toDelete.id, toDelete.filePath);
      toast.success("Correction supprimée.");
      setToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.type === "application/pdf") setFile(f);
    else if (f) toast.error("Seuls les fichiers PDF sont acceptés.");
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const openAddModal = () => {
    setTitle("");
    setControleType("");
    setClassId(null);
    setFile(null);
    setAddModalOpen(true);
  };

  const loading = classesLoading || correctionsLoading;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header + bouton Ajouter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Corrections PDF
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)] sm:text-base">
            Déposez les corrections d'examens par classe et par contrôle pour les rendre accessibles aux élèves.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="gap-2 rounded-xl shadow-lg shadow-[var(--primary)]/20 sm:shrink-0"
        >
          <Plus className="h-4 w-4" />
          Ajouter une correction
        </Button>
      </div>

      {/* Modal : Ajouter une correction */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[var(--border)] bg-[var(--card)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                <Upload className="h-4 w-4" />
              </span>
              Ajouter une correction
            </DialogTitle>
            <DialogDescription>
              Titre, type de contrôle (optionnel), classe (optionnelle) et fichier PDF.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="correction-title">Titre</Label>
              <Input
                id="correction-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Correction Géologie"
                required
                aria-required="true"
                className="h-11 rounded-xl border-[var(--border)] bg-[var(--background)]/50"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="correction-controle">Type de contrôle</Label>
                <select
                  id="correction-controle"
                  value={controleType}
                  onChange={(e) => setControleType(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-3 py-2 text-sm"
                >
                  {CONTROLE_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="correction-class">Classe</Label>
                <select
                  id="correction-class"
                  value={classId ?? ""}
                  onChange={(e) => setClassId(e.target.value || null)}
                  className="flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)]/50 px-3 py-2 text-sm"
                >
                  <option value="">Toutes les classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fichier PDF</Label>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 transition-colors",
                  dragOver
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] bg-[var(--muted)]/20 hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  id="correction-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                  aria-required="true"
                />
                {file ? (
                  <>
                    <FileText className="h-9 w-9 text-[var(--primary)]" />
                    <p className="text-center text-sm font-medium text-[var(--foreground)] truncate max-w-full px-2">
                      {file.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Cliquez ou glissez pour remplacer
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-9 w-9 text-[var(--muted-foreground)]" />
                    <p className="text-center text-sm font-medium text-[var(--foreground)]">
                      Glissez un PDF ou cliquez
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">PDF uniquement</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setAddModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={uploading || !file || !title.trim()}
                className="flex-1 rounded-xl font-medium"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Liste groupée par classe et par contrôle */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold sm:text-xl">
          Corrections déposées
        </h2>
        {corrections.length > 0 && (
          <span className="text-sm text-[var(--muted-foreground)]">
            {corrections.length} document{corrections.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && corrections.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 sm:p-12">
          <LoadingState message="Chargement des corrections…" />
        </div>
      ) : corrections.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-8 sm:p-12">
            <EmptyState
              icon={<FileText className="h-12 w-12 text-[var(--muted-foreground)]" />}
              title="Aucune correction"
              description="Cliquez sur « Ajouter une correction » pour déposer un PDF."
              action={
                <Button onClick={openAddModal} className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une correction
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ classLabel, classId: gClassId, groups }) => (
            <Card key={gClassId ?? "all"} className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
              <div className="border-b border-[var(--border)] bg-[var(--muted)]/20 px-4 py-3 sm:px-6">
                <h3 className="font-display font-semibold text-[var(--foreground)]">
                  {classLabel}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {groups.reduce((acc, g) => acc + g.items.length, 0)} correction
                  {groups.reduce((acc, g) => acc + g.items.length, 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <CardContent className="p-0">
                {groups.map(({ controle, items }) => (
                  <div key={controle} className="border-b border-[var(--border)]/50 last:border-b-0">
                    <div className="bg-[var(--muted)]/10 px-4 py-2 sm:px-6">
                      <span className="text-sm font-medium text-[var(--muted-foreground)]">
                        {controle}
                      </span>
                    </div>
                    <ul className="divide-y divide-[var(--border)]/50">
                      {items.map((c) => (
                        <li
                          key={c.id}
                          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)]">
                              <FileText className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--foreground)] truncate">
                                {c.title}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {new Date(c.uploadedAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                            <a
                              href={c.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)]/15 px-3 py-2 text-sm font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/25"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Voir
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setToDelete(c)}
                              className="h-9 w-9 shrink-0 text-red-500 hover:bg-red-500/10"
                              aria-label="Supprimer cette correction"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Supprimer cette correction ?"
        description="Le fichier PDF sera également supprimé du stockage."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  );
}
