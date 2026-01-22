import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "compact" | "card";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "compact") {
    return (
      <div className={cn("py-6 text-center", className)}>
        {Icon && (
          <Icon className="mx-auto h-8 w-8 text-[var(--color-text-muted)] mb-2" />
        )}
        <p className="text-sm text-[var(--color-text-muted)]">{title}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-panel)] p-8 text-center",
          className
        )}
      >
        {Icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Icon className="h-6 w-6 text-[var(--color-text-muted)]" />
          </div>
        )}
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center py-12", className)}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-8 w-8 text-[var(--color-text-muted)]" />
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-center text-sm text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
