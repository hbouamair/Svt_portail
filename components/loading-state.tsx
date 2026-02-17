"use client";

import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  spinnerSize?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "Chargement…",
  className,
  spinnerSize = "lg",
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size={spinnerSize} />
      {message && (
        <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
      )}
    </div>
  );
}
