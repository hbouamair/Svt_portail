"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function StudentChangePasswordPage() {
  const router = useRouter();
  const { user, refetchProfiles } = useAuth();
  const supabase = getSupabaseClientOrNull();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (!supabase) {
      setError("Configuration Supabase manquante.");
      return;
    }
    setPending(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      const { error: profileErr } = await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
      if (profileErr && !profileErr.message?.includes("must_change_password") && !profileErr.message?.includes("does not exist")) {
        throw new Error(profileErr.message);
      }
      await refetchProfiles();
      toast.success("Mot de passe mis à jour. Vous pouvez accéder à votre espace.");
      router.replace("/dashboard/student");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/20 text-[var(--primary)]">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Nouveau mot de passe</CardTitle>
              <CardDescription>
                C’est votre première connexion. Choisissez un mot de passe pour accéder à votre espace élève.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  className="pl-10"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  aria-describedby={error ? "change-pwd-error" : undefined}
                  aria-invalid={!!error}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="pl-10"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            {error && (
              <p id="change-pwd-error" role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Enregistrement…" : "Enregistrer et accéder à mon espace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
