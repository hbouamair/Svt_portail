"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar, SidebarTrigger } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const CHANGE_PASSWORD_PATH = "/dashboard/student/change-password";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();
  const { isLoggedIn, user, useSupabase, userProfileLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  // Rediriger vers change-password seulement quand on est sûr (profil chargé) que l’élève doit changer son mot de passe
  useEffect(() => {
    if (!isLoggedIn || !useSupabase) return;
    if (user.role !== "student" || pathname === CHANGE_PASSWORD_PATH) return;
    if (!userProfileLoaded) return;
    if (user.mustChangePassword) router.replace(CHANGE_PASSWORD_PATH);
  }, [isLoggedIn, useSupabase, user.role, user.mustChangePassword, userProfileLoaded, pathname, router]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--muted-foreground)]">Redirection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AppSidebar />
      <main
        className={cn(
          "min-w-0 flex-1 transition-[padding] duration-300 ease-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[280px]"
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--background)]/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80 sm:h-16 sm:px-4">
          <SidebarTrigger />
          <div className="flex-1 min-w-0" />
          <NotificationBell />
        </header>
        <div className="min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
