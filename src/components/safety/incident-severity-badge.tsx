"use client";

import { cn } from "@/lib/utils";
import { INCIDENT_SEVERITY_CONFIG, type IncidentSeverity } from "@/lib/constants";
import { AlertCircle, AlertOctagon, AlertTriangle, Info } from "lucide-react";

interface IncidentSeverityBadgeProps {
  severity: IncidentSeverity;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const SEVERITY_ICONS = {
  low: Info,
  medium: AlertTriangle,
  high: AlertCircle,
  critical: AlertOctagon,
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

const ICON_SIZES = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export function IncidentSeverityBadge({
  severity,
  className,
  showIcon = true,
  size = "md",
}: IncidentSeverityBadgeProps) {
  const config = INCIDENT_SEVERITY_CONFIG[severity];
  const Icon = SEVERITY_ICONS[severity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        SIZE_CLASSES[size],
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {showIcon && <Icon className={ICON_SIZES[size]} />}
      {config.label}
    </span>
  );
}

// Helper to determine if severity requires immediate attention
export function isHighPriority(severity: IncidentSeverity): boolean {
  return severity === "high" || severity === "critical";
}

// Helper to get severity level number (for sorting)
export function getSeverityLevel(severity: IncidentSeverity): number {
  const levels: Record<IncidentSeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return levels[severity];
}

// Sort incidents by severity (critical first)
export function sortBySeverity<T extends { severity: IncidentSeverity }>(
  items: T[],
  descending = true
): T[] {
  return [...items].sort((a, b) => {
    const diff = getSeverityLevel(a.severity) - getSeverityLevel(b.severity);
    return descending ? -diff : diff;
  });
}
