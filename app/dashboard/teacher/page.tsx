import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, BookOpen, GraduationCap, ArrowRight } from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Tableau de bord enseignant
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Gérez vos classes, saisissez les notes et déposez les corrections.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="card-modern group border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Élèves par classe</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] transition group-hover:bg-[var(--primary)]/30">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Consulter les élèves regroupés par classe.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl gap-2">
              <Link href="/dashboard/teacher/students">Voir les élèves <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="card-modern group border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] transition group-hover:bg-[var(--primary)]/30">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Créer des classes et y ajouter les élèves.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl gap-2">
              <Link href="/dashboard/teacher/classes">Gérer les classes <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="card-modern group border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saisie des notes</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] transition group-hover:bg-[var(--primary)]/30">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Tableau éditable par classe et par évaluation.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl gap-2">
              <Link href="/dashboard/teacher/notes">Saisir les notes <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="card-modern group border-[var(--border)] bg-[var(--card)] sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Corrections PDF</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)] transition group-hover:bg-[var(--primary)]/30">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Déposer les corrections d’examens pour les élèves.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl gap-2">
              <Link href="/dashboard/teacher/corrections">Corrections <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
