import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-[var(--primary)]",
        sizeClasses[size],
        className
      )}
    />
  );
}
