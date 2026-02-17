"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Leaf, LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { authenticate } from "@/lib/auth";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (isLoggedIn) router.replace("/dashboard");
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const supabase = getSupabaseClientOrNull();
      if (supabase) {
        const { data, error: signError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (signError) {
          const msg = signError.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : signError.message;
          setError(msg);
          toast.error(msg);
          setPending(false);
          return;
        }
        if (data.session) {
          router.push("/dashboard");
          return;
        }
      }
      const user = authenticate(email, password);
      if (!user) {
        setError("Email ou mot de passe incorrect.");
        setPending(false);
        return;
      }
      login(user.id);
      router.push("/dashboard");
    } catch {
      const msg = "Une erreur est survenue.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Fond */}
      <div className="absolute inset-0 bg-[var(--background)]" />
      {/* Gradient principal — halo en haut au centre */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, var(--primary) 0%, transparent 55%)",
        }}
      />
      {/* Accents latéraux */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse 50% 40% at 85% 30%, var(--primary) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: "radial-gradient(ellipse 50% 40% at 15% 70%, var(--primary) 0%, transparent 50%)",
        }}
      />
      {/* Orbe flou central */}
      <div className="absolute left-1/2 top-1/3 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/20 blur-[100px]" />
      {/* Grille légère */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo & titre */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_40px_rgba(16,185,129,0.35)] transition-transform hover:scale-105">
            <Leaf className="h-9 w-9" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
              SVT Notes
            </h1>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Pr. Abdelmajid Bouamair — Lycée Alkhawarizmi, Ait Amira
            </p>
          </div>
        </div>

        {/* Carte login glassmorphism */}
        <div className="rounded-3xl border border-[var(--border)]/80 bg-[var(--card)]/80 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--foreground)]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@svt-lycee.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)]/50 pl-10 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  required
                  autoComplete="email"
                  aria-describedby={error ? "login-error" : undefined}
                  aria-invalid={!!error}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--foreground)]">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-[var(--border)] bg-[var(--background)]/50 pl-10 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  required
                  autoComplete="current-password"
                  aria-describedby={error ? "login-error" : undefined}
                  aria-invalid={!!error}
                />
              </div>
            </div>
            {error && (
              <div
                id="login-error"
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-medium shadow-lg shadow-[var(--primary)]/25 transition hover:opacity-95"
            >
              {pending ? (
                <span className="animate-pulse">Connexion…</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            Démo : mot de passe par défaut <kbd className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono">demo</kbd> (enseignant/admin) ou <kbd className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono">eleve123</kbd> (élèves).
          </p>
        </div>
      </div>
    </div>
  );
}
