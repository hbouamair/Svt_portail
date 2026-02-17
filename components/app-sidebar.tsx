"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Menu,
  X,
  Leaf,
  ChevronLeft,
  ChevronRight,
  LogOut,
  GraduationCap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import type { Role } from "@/lib/auth";

const TEACHER_LINKS = [
  { href: "/dashboard/teacher", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/teacher/students", label: "Élèves", icon: GraduationCap },
  { href: "/dashboard/teacher/notes", label: "Saisie des notes", icon: FileText },
  { href: "/dashboard/teacher/classes", label: "Classes", icon: Users },
  { href: "/dashboard/teacher/corrections", label: "Corrections PDF", icon: BookOpen },
];

const STUDENT_LINKS = [
  { href: "/dashboard/student", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/student/notes", label: "Mes notes", icon: FileText },
  { href: "/dashboard/student/corrections", label: "Corrections", icon: BookOpen },
];

const ADMIN_LINKS = [
  { href: "/dashboard/admin", label: "Administration", icon: Shield },
  { href: "/dashboard/teacher", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/teacher/students", label: "Élèves", icon: GraduationCap },
  { href: "/dashboard/teacher/notes", label: "Saisie des notes", icon: FileText },
  { href: "/dashboard/teacher/classes", label: "Classes", icon: Users },
  { href: "/dashboard/teacher/corrections", label: "Corrections PDF", icon: BookOpen },
];

function getNavLinks(role: Role) {
  switch (role) {
    case "admin":
      return ADMIN_LINKS;
    case "teacher":
      return TEACHER_LINKS;
    default:
      return STUDENT_LINKS;
  }
}

export function AppSidebar() {
  const pathname = usePathname();
  const { role, setRole, user, logout } = useAuth();
  const { mobileOpen, setMobileOpen, collapsed, setCollapsed } = useSidebar();

  const links = getNavLinks(role);

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
          mobileOpen ? "block" : "hidden"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] transition-all duration-300 ease-out",
          "w-[280px] lg:w-[280px]",
          collapsed && "lg:w-[72px] lg:min-w-[72px]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[var(--sidebar-border)] px-4">
          <Link
            href={role === "teacher" || role === "admin" ? "/dashboard/teacher" : "/dashboard/student"}
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Leaf className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-display text-lg font-semibold tracking-tight text-[var(--sidebar-foreground)]">
                SVT — Pr. Bouamair
              </span>
            )}
          </Link>
          <div className="flex items-center gap-1 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Ouvrir la sidebar" : "Réduire la sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map((item) => {
            const Icon = item.icon;
            const isRootDashboard = ["/dashboard/teacher", "/dashboard/student", "/dashboard/admin"].includes(item.href);
            const isActive = isRootDashboard
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "text-[var(--sidebar-foreground)]/90",
                  isActive
                    ? "bg-[var(--primary)]/15 text-[var(--primary)] shadow-sm"
                    : "hover:bg-[var(--muted)]/80 hover:text-[var(--sidebar-foreground)]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Role switcher + user */}
        <div className="border-t border-[var(--sidebar-border)] p-3">
          <div className={cn("space-y-2", collapsed && "flex flex-col items-center")}>
            <p className={cn("text-xs text-[var(--muted-foreground)]", collapsed && "hidden")}>
              Connecté en tant que
            </p>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={cn(
                "w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]",
                collapsed && "w-10 px-1 py-1 text-center"
              )}
              title="Changer de rôle"
            >
              <option value="student">Élève</option>
              <option value="teacher">Enseignant</option>
              <option value="admin">Admin</option>
            </select>
            {!collapsed && (
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {user.name}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full justify-start gap-2 text-[var(--muted-foreground)]", collapsed && "w-10 justify-center px-0")}
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Déconnexion</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function SidebarTrigger() {
  const { setMobileOpen } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={() => setMobileOpen(true)}
      aria-label="Ouvrir le menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
