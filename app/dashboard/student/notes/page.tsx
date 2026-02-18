"use client";

import * as React from "react";
import { FileText, TrendingUp, Award, Target, List } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { getGradesForStudent, type GradeEntry } from "@/lib/store";
import { dbGetGradesForStudent } from "@/lib/db";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function noteColor(note: number): string {
  if (note >= 10) return "text-emerald-500";
  if (note >= 8) return "text-amber-500";
  return "text-red-500";
}

function noteBg(note: number): string {
  if (note >= 10) return "bg-emerald-500/15 border-emerald-500/40";
  if (note >= 8) return "bg-amber-500/15 border-amber-500/40";
  return "bg-red-500/15 border-red-500/40";
}

/** Mention française selon la note (/ 20) */
function getMention(note: number): string {
  if (note >= 16) return "Très bien";
  if (note >= 14) return "Bien";
  if (note >= 12) return "Assez bien";
  if (note >= 10) return "Passable";
  if (note >= 8) return "Insuffisant";
  return "Échec";
}

const MIN_NOTES_FOR_AVERAGE = 3;

export default function StudentNotesPage() {
  const { user, useSupabase } = useAuth();
  const supabase = getSupabaseClientOrNull();
  const [grades, setGrades] = React.useState<GradeEntry[]>(() =>
    useSupabase ? [] : getGradesForStudent(user.id)
  );
  const [loading, setLoading] = React.useState(useSupabase);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const fetchGrades = React.useCallback(async () => {
    if (!user.id && !supabase) return;
    if (!useSupabase || !supabase) {
      setGrades(getGradesForStudent(user.id));
      return;
    }
    setFetchError(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? user.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const list = await dbGetGradesForStudent(supabase, userId);
      setGrades(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors du chargement des notes.";
      setFetchError(msg);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [user.id, useSupabase, supabase]);

  React.useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  React.useEffect(() => {
    if (!useSupabase || !supabase) return;
    const onFocus = () => fetchGrades();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [useSupabase, supabase, fetchGrades]);

  const chartData = React.useMemo(() => {
    return grades.map((g) => ({
      name: g.examName,
      note: g.note,
      date: new Date(g.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      }),
    }));
  }, [grades]);

  const showAverage = grades.length >= MIN_NOTES_FOR_AVERAGE;
  const average =
    showAverage && grades.length > 0
      ? grades.reduce((s, g) => s + g.note, 0) / grades.length
      : null;

  const bestNote =
    grades.length > 0 ? Math.max(...grades.map((g) => g.note)) : null;
  const worstNote =
    grades.length > 0 ? Math.min(...grades.map((g) => g.note)) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Mes notes
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Vue d’ensemble et évolution de vos notes.
        </p>
      </div>

      {fetchError && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              Impossible de charger les notes. {fetchError}
            </p>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => fetchGrades()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bloc résumé — moyenne affichée seulement à partir de 3 notes */}
      {grades.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {showAverage && (
            <Card
              className={cn(
                "overflow-hidden border-2 transition-shadow hover:shadow-lg",
                average !== null && average >= 10
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : average !== null && average >= 8
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-[var(--border)] bg-[var(--card)]"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    "text-3xl font-bold tabular-nums",
                    average !== null && noteColor(average)
                  )}
                >
                  {average !== null ? average.toFixed(1) : "—"}{" "}
                  <span className="text-lg font-normal text-[var(--muted-foreground)]">
                    / 20
                  </span>
                </p>
                {average !== null && (
                  <p className={cn("mt-1 text-sm font-medium", noteColor(average))}>
                    {getMention(average)}
                  </p>
                )}
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {grades.length} note{grades.length > 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          )}

          {!showAverage && grades.length > 0 && (
            <Card className="border-dashed border-[var(--border)] bg-[var(--muted)]/10">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
                  <TrendingUp className="h-4 w-4" />
                  Moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--muted-foreground)]">
                  La moyenne s’affichera lorsque vous aurez au moins {MIN_NOTES_FOR_AVERAGE} notes.
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {grades.length} note{grades.length > 1 ? "s" : ""} pour l’instant
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Award className="h-4 w-4 text-emerald-500" />
                Meilleure note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-500 tabular-nums">
                {bestNote !== null ? bestNote.toFixed(1) : "—"}
              </p>
              {bestNote !== null && (
                <p className="mt-1 text-sm font-medium text-emerald-600">{getMention(bestNote)}</p>
              )}
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">/ 20</p>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-[var(--muted-foreground)]" />
                À améliorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  worstNote !== null && worstNote < 10 ? "text-red-500" : "text-[var(--foreground)]"
                )}
              >
                {worstNote !== null ? worstNote.toFixed(1) : "—"}
              </p>
              {worstNote !== null && (
                <p className={cn("mt-1 text-sm font-medium", noteColor(worstNote))}>
                  {getMention(worstNote)}
                </p>
              )}
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">/ 20</p>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[var(--foreground)] tabular-nums">
                {grades.length}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                au total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cartes par note — uniquement les contrôles notés par l’enseignant */}
      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold">
          <FileText className="h-5 w-5 text-[var(--primary)]" />
          Notes par contrôle
        </h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Seuls les contrôles pour lesquels l’enseignant a saisi une note sont affichés.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((g, i) => (
            <Card
              key={`${g.examName}-${g.date}-${i}`}
              className={cn(
                "overflow-hidden border-2 transition-all hover:shadow-md",
                noteBg(g.note)
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-1">
                <CardTitle className="text-sm font-medium text-[var(--foreground)]">
                  {g.examName}
                </CardTitle>
                <span
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xl font-bold tabular-nums",
                    noteColor(g.note)
                  )}
                >
                  {g.note.toFixed(1)}
                </span>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(g.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tableau récapitulatif */}
      {grades.length > 0 && (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Récapitulatif
            </CardTitle>
            <CardDescription>
              Une ligne par contrôle noté par l’enseignant. Les contrôles sans note ne figurent pas.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--foreground)]">
                      Évaluation
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--foreground)]">
                      Note
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--foreground)]">
                      Mention
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[var(--muted-foreground)]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g, i) => (
                    <tr
                      key={`${g.examName}-${g.date}-${i}`}
                      className="border-b border-[var(--border)]/70 hover:bg-[var(--muted)]/20"
                    >
                      <td className="px-4 py-3 font-medium">{g.examName}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "inline-flex rounded-lg px-2.5 py-1 font-semibold tabular-nums",
                            noteBg(g.note),
                            noteColor(g.note)
                          )}
                        >
                          {g.note.toFixed(1)} / 20
                        </span>
                      </td>
                      <td className={cn("px-4 py-3 text-sm font-medium", noteColor(g.note))}>
                        {getMention(g.note)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[var(--muted-foreground)]">
                        {new Date(g.date).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphique */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle>Progression</CardTitle>
          <CardDescription>
            Uniquement les évaluations pour lesquelles vous avez une note.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <ReferenceLine
                    y={10}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={{ stroke: "var(--border)" }}
                    axisLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    domain={[0, 20]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={{ stroke: "var(--border)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                    formatter={(value: number) => [
                      `${value.toFixed(1)} / 20`,
                      "Note",
                    ]}
                    labelFormatter={(_, payload) =>
                      payload[0]
                        ? `${payload[0].payload.name} — ${payload[0].payload.date}`
                        : ""
                    }
                  />
                  <Bar
                    dataKey="note"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                    name="Note"
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="mt-4 text-[var(--muted-foreground)]">
                Aucune note pour l’instant.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-[var(--muted-foreground)]">Chargement des notes…</p>
          </CardContent>
        </Card>
      )}

      {!loading && grades.length === 0 && (
        <Card className="border-dashed border-[var(--border)] bg-[var(--muted)]/10">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-14 w-14 text-[var(--muted-foreground)]" />
            <p className="mt-4 font-medium text-[var(--foreground)]">
              Aucune note enregistrée
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Vos notes apparaîtront ici une fois saisies par votre enseignant.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
