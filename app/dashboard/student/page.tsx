"use client";

import Link from "next/link";
import { FileText, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Tableau de bord élève
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Consultez vos notes et téléchargez les corrections.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mes notes</CardTitle>
            <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Dernières notes et graphique de progression.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/student/notes">Voir mes notes</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Corrections</CardTitle>
            <BookOpen className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Télécharger les PDF de correction.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/student/corrections">Voir les corrections</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
