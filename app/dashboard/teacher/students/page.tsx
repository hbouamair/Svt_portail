"use client";

import * as React from "react";
import Link from "next/link";
import { Users, GraduationCap, ArrowRight } from "lucide-react";
import { useClasses, useClassStudents } from "@/lib/hooks-data";
import type { ClassItem } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";

function ClassStudentsCard({ c }: { c: ClassItem }) {
  const { data: studentsInClass } = useClassStudents(c.id);

  return (
    <Card key={c.id} className="card-modern overflow-hidden border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="border-b border-[var(--border)]/50 bg-[var(--muted)]/20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{c.name}</CardTitle>
            <CardDescription>
              {studentsInClass.length} élève{studentsInClass.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-[var(--border)]/50">
          {studentsInClass.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[var(--muted)]/20"
            >
              <div>
                <p className="font-medium text-[var(--foreground)]">{s.name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{s.email}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </li>
          ))}
        </ul>
        {studentsInClass.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
            Aucun élève dans cette classe.
          </div>
        )}
        <div className="border-t border-[var(--border)]/50 p-3">
          <Button asChild variant="ghost" size="sm" className="w-full rounded-xl justify-center gap-2">
            <Link href="/dashboard/teacher/classes">
              Modifier la classe
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherStudentsPage() {
  const { data: classes, loading } = useClasses();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Élèves par classe</h1>
          <p className="text-[var(--muted-foreground)]">
            Vue des élèves regroupés par classe. Pour ajouter ou retirer des élèves, modifiez les classes.
          </p>
        </div>
        <Button asChild className="gap-2 rounded-xl shadow-lg shadow-[var(--primary)]/20">
          <Link href="/dashboard/teacher/classes">
            <Users className="h-4 w-4" />
            Gérer les classes
          </Link>
        </Button>
      </div>

      {loading && classes.length === 0 ? (
        <LoadingState message="Chargement des classes…" />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="Aucune classe"
          description="Créez des classes et ajoutez des élèves."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/teacher/classes">Aller aux classes</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {classes.map((c) => (
            <ClassStudentsCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
