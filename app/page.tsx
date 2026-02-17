"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isLoggedIn, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[var(--muted-foreground)]">Redirection...</p>
    </div>
  );
}
