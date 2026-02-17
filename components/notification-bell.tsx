"use client";

import * as React from "react";
import { Bell, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNotifications } from "@/lib/hooks-data";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user, useSupabase } = useAuth();
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const isStudent = user.role === "student";
  const enabled = useSupabase && isStudent && !!user.id;
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch } = useNotifications(
    enabled ? user.id : null,
    !!enabled
  );

  React.useEffect(() => {
    if (!open) return;
    refetch();
  }, [open, refetch]);

  React.useEffect(() => {
    if (!open) return;
    const onClose = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClose);
    return () => document.removeEventListener("click", onClose);
  }, [open]);

  if (!enabled) return null;

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 rounded-lg"
        aria-label={unreadCount > 0 ? `${unreadCount} notification(s)` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-[var(--primary-foreground)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <span className="font-semibold text-[var(--foreground)]">Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-[var(--primary)]"
                onClick={() => markAllAsRead()}
              >
                <Check className="mr-1 h-3 w-3" />
                Tout marquer lu
              </Button>
            )}
          </div>
          <div className="max-h-[min(60vh,400px)] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Chargement…
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Aucune notification
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]/50">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-3 transition-colors",
                      !n.read && "bg-[var(--primary)]/5"
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        markAsRead(n.id);
                      }}
                    >
                      <div className="flex gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                            {n.message}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            {new Date(n.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
