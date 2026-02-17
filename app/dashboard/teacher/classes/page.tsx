"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Users, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { ClassItem } from "@/lib/store";
import { addStudent } from "@/lib/auth";
import { useClasses, useClassStudents } from "@/lib/hooks-data";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";

function ClassCard({
  c,
  onEdit,
  onRequestRemoveClass,
  onOpenAddStudent,
  onRefetchClasses,
  refreshStudentsTrigger,
  onStudentsRefetched,
}: {
  c: ClassItem;
  onEdit: (c: ClassItem) => void;
  onRequestRemoveClass: (id: string) => void;
  onOpenAddStudent: (classId: string) => void;
  onRefetchClasses: () => void;
  refreshStudentsTrigger: string | null;
  onStudentsRefetched: () => void;
}) {
  const { data: students, removeStudentFromClass, refetch } = useClassStudents(c.id);
  const [studentToRemove, setStudentToRemove] = React.useState<string | null>(null);
  const [removingStudent, setRemovingStudent] = React.useState(false);

  React.useEffect(() => {
    if (refreshStudentsTrigger === c.id) {
      refetch().then(onStudentsRefetched);
    }
  }, [refreshStudentsTrigger, c.id, refetch, onStudentsRefetched]);

  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemove) return;
    setRemovingStudent(true);
    try {
      await removeStudentFromClass(studentToRemove);
      onRefetchClasses();
      setStudentToRemove(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setRemovingStudent(false);
    }
  };

  return (
    <Card className="card-modern overflow-hidden border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="border-b border-[var(--border)]/50 bg-[var(--muted)]/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)]">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl">{c.name}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => onEdit(c)} className="rounded-lg">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={() => onOpenAddStudent(c.id)}
            >
              <UserPlus className="h-4 w-4" />
              Ajouter un élève
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRequestRemoveClass(c.id)}
              className="rounded-lg text-red-500 hover:bg-red-500/10"
              aria-label="Supprimer cette classe"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <p className="mb-3 text-sm font-medium text-[var(--muted-foreground)]">
          {students.length} élève{students.length !== 1 ? "s" : ""} dans la classe
        </p>
        <ul className="space-y-2">
          {students.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-3"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{s.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStudentToRemove(s.id)}
                className="shrink-0 rounded-lg text-red-500 hover:bg-red-500/10"
                title="Retirer de la classe"
                aria-label={`Retirer ${s.name} de la classe`}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        {students.length === 0 && (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Aucun élève"
            description='Cliquez sur "Ajouter un élève" pour en ajouter à cette classe.'
          />
        )}
      </CardContent>
      <ConfirmDialog
        open={!!studentToRemove}
        onOpenChange={(open) => !open && setStudentToRemove(null)}
        title="Retirer cet élève de la classe ?"
        description="L’élève ne sera plus dans cette classe mais conservera son compte."
        confirmLabel="Retirer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={handleConfirmRemoveStudent}
        loading={removingStudent}
      />
    </Card>
  );
}

export default function TeacherClassesPage() {
  const { allUsers, useSupabase, refetchProfiles } = useAuth();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formName, setFormName] = React.useState("");
  const [showNewClassModal, setShowNewClassModal] = React.useState(false);
  const [addToClassId, setAddToClassId] = React.useState<string | null>(null);
  const [newStudentName, setNewStudentName] = React.useState("");
  const [newStudentEmail, setNewStudentEmail] = React.useState("");
  const [addError, setAddError] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [classToRemove, setClassToRemove] = React.useState<string | null>(null);
  const [removingClass, setRemovingClass] = React.useState(false);
  const [refreshStudentsForClassId, setRefreshStudentsForClassId] = React.useState<string | null>(null);

  const {
    data: classes,
    loading,
    error,
    refetch,
    addClass,
    updateClass,
    deleteClass,
  } = useClasses();
  const addModalStudents = useClassStudents(addToClassId);

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const openNewClassModal = () => {
    setFormName("");
    setShowNewClassModal(true);
  };

  const saveNewClass = async () => {
    if (!formName.trim()) return;
    setPending(true);
    try {
      await addClass(formName.trim());
      setFormName("");
      setShowNewClassModal(false);
      toast.success("Classe créée.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création.");
    } finally {
      setPending(false);
    }
  };

  const openEditModal = (c: ClassItem) => {
    setEditingId(c.id);
    setFormName(c.name);
  };

  const saveEdit = async () => {
    if (!editingId || !formName.trim()) return;
    const c = classes.find((x) => x.id === editingId);
    if (!c) return;
    setPending(true);
    try {
      await updateClass(editingId, formName.trim(), c.studentIds);
      setEditingId(null);
      setFormName("");
      toast.success("Classe modifiée.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l’enregistrement.");
    } finally {
      setPending(false);
    }
  };

  const handleConfirmRemoveClass = async () => {
    if (!classToRemove) return;
    setRemovingClass(true);
    try {
      await deleteClass(classToRemove);
      toast.success("Classe supprimée.");
      setClassToRemove(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setRemovingClass(false);
    }
  };

  const openAddStudentModal = (classId: string) => {
    setAddToClassId(classId);
    setNewStudentName("");
    setNewStudentEmail("");
    setAddError("");
  };

  const addStudentToClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addToClassId) return;
    setAddError("");
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;
    const emailNorm = newStudentEmail.trim().toLowerCase();
    const existing = allUsers.find((u) => u.email.toLowerCase() === emailNorm);
    const c = classes.find((x) => x.id === addToClassId);
    if (!c) return;
    setPending(true);
    try {
      if (useSupabase) {
        let userId: string;
        if (existing) {
          if (c.studentIds.includes(existing.id)) {
            const msg = "Cet élève est déjà dans la classe.";
            setAddError(msg);
            toast.error(msg);
            return;
          }
          userId = existing.id;
        } else {
          const res = await fetch("/api/users/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailNorm,
              name: newStudentName.trim(),
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = data?.error ?? "Impossible de créer le compte.";
            setAddError(msg);
            toast.error(msg);
            return;
          }
          userId = data.id;
          await refetchProfiles();
        }
        await addModalStudents.addStudentToClass(userId);
        refetch();
        setRefreshStudentsForClassId(addToClassId);
        setNewStudentName("");
        setNewStudentEmail("");
        setAddToClassId(null);
        toast.success("Élève ajouté à la classe.");
      } else {
        if (existing) {
          if (c.studentIds.includes(existing.id)) {
            const msg = "Cet élève est déjà dans la classe.";
            setAddError(msg);
            toast.error(msg);
            return;
          }
          await addModalStudents.addStudentToClass(existing.id);
        } else {
          const newUser = addStudent(newStudentName.trim(), newStudentEmail.trim());
          await addModalStudents.addStudentToClass(newUser.id);
        }
        refetch();
        setRefreshStudentsForClassId(addToClassId);
        setNewStudentName("");
        setNewStudentEmail("");
        setAddToClassId(null);
        toast.success("Élève ajouté à la classe.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setAddError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  const classForAddStudent = addToClassId ? classes.find((x) => x.id === addToClassId) : null;
  const classForEdit = editingId ? classes.find((x) => x.id === editingId) : null;

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingState message="Chargement des classes…" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Classes</h1>
          <p className="text-[var(--muted-foreground)]">
            Créez des classes et ajoutez les élèves à chaque classe.
          </p>
        </div>
        <Button onClick={openNewClassModal} className="gap-2 rounded-xl shadow-lg shadow-[var(--primary)]/20">
          <Plus className="h-4 w-4" />
          Nouvelle classe
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>
      )}

      {/* Modal : Nouvelle classe */}
      <Dialog open={showNewClassModal} onOpenChange={setShowNewClassModal}>
        <DialogContent className="rounded-2xl border-[var(--border)] bg-[var(--card)]">
          <DialogHeader>
            <DialogTitle>Nouvelle classe</DialogTitle>
            <DialogDescription>Ex. 2 Bac SVT, 1ère Spé SVT</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-class-name">Nom de la classe</Label>
              <Input
                id="new-class-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex. 2 Bac SVT"
                className="rounded-xl"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowNewClassModal(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={saveNewClass} disabled={!formName.trim() || pending} className="rounded-xl">
              {pending ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal : Modifier la classe */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="rounded-2xl border-[var(--border)] bg-[var(--card)]">
          <DialogHeader>
            <DialogTitle>Modifier la classe</DialogTitle>
            <DialogDescription>
              {classForEdit ? classForEdit.name : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-class-name">Nom de la classe</Label>
              <Input
                id="edit-class-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex. 2 Bac SVT"
                className="rounded-xl"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={saveEdit} disabled={!formName.trim() || pending} className="rounded-xl">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal : Ajouter un élève */}
      <Dialog open={!!addToClassId} onOpenChange={(open) => !open && setAddToClassId(null)}>
        <DialogContent className="rounded-2xl border-[var(--border)] bg-[var(--card)]">
          <DialogHeader>
            <DialogTitle>Ajouter un élève</DialogTitle>
            <DialogDescription>
              {classForAddStudent ? `Dans la classe : ${classForAddStudent.name}` : ""}
              {!useSupabase && " Si l’email existe déjà, l’élève sera ajouté. Sinon un nouveau compte est créé (mot de passe : eleve123)."}
              {useSupabase && " Si l’email n’existe pas encore, un compte élève sera créé (mot de passe : eleve123)."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addStudentToClassSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="student-name">Nom</Label>
              <Input
                id="student-name"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Nom de l'élève"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                placeholder="email@exemple.fr"
                className="rounded-xl"
                required
                aria-describedby={addError ? "add-student-error" : undefined}
                aria-invalid={!!addError}
              />
            </div>
            {addError && (
              <p id="add-student-error" role="alert" className="text-sm text-red-500">
                {addError}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddToClassId(null)}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button type="submit" className="rounded-xl" disabled={pending}>
                {pending ? "Ajout…" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

        <div className="space-y-6">
        {classes.map((c) => (
          <ClassCard
            key={c.id}
            c={c}
            onEdit={openEditModal}
            onRequestRemoveClass={setClassToRemove}
            onOpenAddStudent={openAddStudentModal}
            onRefetchClasses={refetch}
            refreshStudentsTrigger={refreshStudentsForClassId}
            onStudentsRefetched={() => setRefreshStudentsForClassId(null)}
          />
        ))}
      </div>

      {classes.length === 0 && (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Aucune classe"
          description="Créez une classe pour commencer."
          action={
            <Button onClick={openNewClassModal} className="rounded-xl">
              Créer une classe
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={!!classToRemove}
        onOpenChange={(open) => !open && setClassToRemove(null)}
        title="Supprimer cette classe ?"
        description="Les élèves ne seront pas supprimés, uniquement l’affectation à cette classe."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={handleConfirmRemoveClass}
        loading={removingClass}
      />
    </div>
  );
}
