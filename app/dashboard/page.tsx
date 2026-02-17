"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role === "admin") {
      router.replace("/dashboard/admin");
    } else if (role === "teacher") {
      router.replace("/dashboard/teacher");
    } else {
      router.replace("/dashboard/student");
    }
  }, [role, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-[var(--muted-foreground)]">Redirection...</p>
    </div>
  );
}
