"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { getCorrections, getClasses } from "@/lib/store";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StudentCorrectionsPage() {
  const { user } = useAuth();
  const [corrections, setCorrections] = React.useState(() => getCorrections());
  const classes = getClasses();

  React.useEffect(() => {
    setCorrections(getCorrections());
  }, []);

  const myClassIds = React.useMemo(() => {
    return classes
      .filter((c) => c.studentIds.includes(user.id))
      .map((c) => c.id);
  }, [classes, user.id]);

  const visible = React.useMemo(() => {
    return corrections.filter(
      (c) => !c.classId || myClassIds.includes(c.classId)
    );
  }, [corrections, myClassIds]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Corrections
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)] sm:text-base">
          Téléchargez les corrections d'examens au format PDF pour vos classes.
        </p>
      </div>

      <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/10">
        <CardHeader className="border-b border-[var(--border)]/50 bg-[var(--muted)]/20 pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
              <FileText className="h-4 w-4" />
            </span>
            Corrections disponibles
          </CardTitle>
          <CardDescription className="text-sm">
            Documents accessibles pour vos classes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/10 py-12 sm:py-16">
              <FileText className="h-12 w-12 text-[var(--muted-foreground)]" />
              <p className="mt-4 font-medium text-[var(--foreground)]">
                Aucune correction disponible
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Les corrections apparaîtront ici lorsqu'elles seront déposées par votre enseignant.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-[var(--muted-foreground)]">
                {visible.length} document{visible.length !== 1 ? "s" : ""} disponible
                {visible.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((c) => {
                  const cls = c.classId
                    ? classes.find((x) => x.id === c.classId)
                    : null;
                  return (
                    <Card
                      key={c.id}
                      className={cn(
                        "group overflow-hidden border-[var(--border)] bg-[var(--card)] transition-all",
                        "hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5"
                      )}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                              <FileText className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--foreground)]">
                                {c.title}
                              </p>
                              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                                {cls ? cls.name : "Toutes classes"} ·{" "}
                                {new Date(c.uploadedAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <a
                            href={c.fileUrl}
                            download={c.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0"
                          >
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full gap-2 rounded-xl sm:w-auto"
                            >
                              <Download className="h-4 w-4" />
                              Télécharger
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
