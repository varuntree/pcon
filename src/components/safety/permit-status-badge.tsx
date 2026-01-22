"use client";

import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PermitStatus } from "@/lib/constants";

interface PermitStatusBadgeProps {
  status: PermitStatus;
  className?: string;
  showIcon?: boolean;
}

// Permit-specific status icons
const PERMIT_STATUS_ICONS: Record<PermitStatus, string> = {
  draft: "📝",
  submitted: "📤",
  approved: "✓",
  active: "🟢",
  suspended: "⏸",
  closed: "✔",
  expired: "⏰",
  rejected: "✗",
  cancelled: "🚫",
};

export function PermitStatusBadge({
  status,
  className,
  showIcon = false,
}: PermitStatusBadgeProps) {
  if (showIcon) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <span className="text-sm">{PERMIT_STATUS_ICONS[status]}</span>
        <StatusBadge status={status} />
      </span>
    );
  }

  return <StatusBadge status={status} className={className} />;
}

// Helper to determine if permit status requires action
export function permitRequiresAction(status: PermitStatus): boolean {
  return status === "submitted" || status === "suspended";
}

// Helper to determine if permit is terminal state
export function isPermitTerminal(status: PermitStatus): boolean {
  return ["closed", "expired", "rejected", "cancelled"].includes(status);
}

// Helper to get next valid transitions for a permit status
export function getPermitTransitions(status: PermitStatus): PermitStatus[] {
  const transitions: Record<PermitStatus, PermitStatus[]> = {
    draft: ["submitted", "cancelled"],
    submitted: ["approved", "rejected", "cancelled"],
    approved: ["active", "cancelled"],
    active: ["suspended", "closed"],
    suspended: ["active", "closed"],
    closed: [],
    expired: [],
    rejected: [],
    cancelled: [],
  };
  return transitions[status] || [];
}
