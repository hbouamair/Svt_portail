import Link from "next/link";
import { Shield, Users, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Administration</h1>
        <p className="text-[var(--muted-foreground)]">
          Accès aux outils enseignant et gestion de la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tableau de bord</CardTitle>
            <Shield className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/teacher">Ouvrir le tableau de bord enseignant</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Élèves</CardTitle>
            <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/teacher/students">Gérer les élèves</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notes & corrections</CardTitle>
            <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/teacher/notes">Saisie des notes</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/dashboard/teacher/corrections">Corrections PDF</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
