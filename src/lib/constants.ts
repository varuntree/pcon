// Project Status
export const PROJECT_STATUSES = [
  "planning",
  "active",
  "completed",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// Worker Status
export const WORKER_STATUSES = ["pending", "active", "inactive"] as const;
export type WorkerStatus = (typeof WORKER_STATUSES)[number];

// Work Package Status
export const WORK_PACKAGE_STATUSES = [
  "planned",
  "active",
  "completed",
  "archived",
] as const;
export type WorkPackageStatus = (typeof WORK_PACKAGE_STATUSES)[number];

// Organization Kind
export const ORG_KINDS = [
  "principal",
  "subcontractor",
  "client",
  "supplier",
  "regulator",
  "other",
] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

// Worker Roles
export const WORKER_ROLES = [
  "project_manager",
  "site_supervisor",
  "foreman",
  "tradesperson",
  "laborer",
  "safety_officer",
  "admin",
] as const;
export type WorkerRole = (typeof WORKER_ROLES)[number];

// Status Config for UI
export const STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  // Project statuses
  planning: {
    label: "Planning",
    bgClass: "bg-[var(--color-status-planning-bg)]",
    textClass: "text-[var(--color-status-planning-text)]",
  },
  active: {
    label: "Active",
    bgClass: "bg-[var(--color-status-active-bg)]",
    textClass: "text-[var(--color-status-active-text)]",
  },
  completed: {
    label: "Completed",
    bgClass: "bg-[var(--color-status-completed-bg)]",
    textClass: "text-[var(--color-status-completed-text)]",
  },
  archived: {
    label: "Archived",
    bgClass: "bg-[var(--color-status-archived-bg)]",
    textClass: "text-[var(--color-status-archived-text)]",
  },

  // Worker statuses
  pending: {
    label: "Pending",
    bgClass: "bg-[var(--color-status-pending-bg)]",
    textClass: "text-[var(--color-status-pending-text)]",
  },
  inactive: {
    label: "Inactive",
    bgClass: "bg-[var(--color-status-inactive-bg)]",
    textClass: "text-[var(--color-status-inactive-text)]",
  },

  // Work package statuses
  planned: {
    label: "Planned",
    bgClass: "bg-[var(--color-status-planning-bg)]",
    textClass: "text-[var(--color-status-planning-text)]",
  },

  // General statuses
  draft: {
    label: "Draft",
    bgClass: "bg-[var(--color-status-draft-bg)]",
    textClass: "text-[var(--color-status-draft-text)]",
  },
  submitted: {
    label: "Submitted",
    bgClass: "bg-[var(--color-status-submitted-bg)]",
    textClass: "text-[var(--color-status-submitted-text)]",
  },
  approved: {
    label: "Approved",
    bgClass: "bg-[var(--color-status-approved-bg)]",
    textClass: "text-[var(--color-status-approved-text)]",
  },
  rejected: {
    label: "Rejected",
    bgClass: "bg-[var(--color-status-rejected-bg)]",
    textClass: "text-[var(--color-status-rejected-text)]",
  },
  expired: {
    label: "Expired",
    bgClass: "bg-[var(--color-status-expired-bg)]",
    textClass: "text-[var(--color-status-expired-text)]",
  },
  open: {
    label: "Open",
    bgClass: "bg-[var(--color-status-open-bg)]",
    textClass: "text-[var(--color-status-open-text)]",
  },
  in_progress: {
    label: "In Progress",
    bgClass: "bg-[var(--color-status-in-progress-bg)]",
    textClass: "text-[var(--color-status-in-progress-text)]",
  },
  resolved: {
    label: "Resolved",
    bgClass: "bg-[var(--color-status-resolved-bg)]",
    textClass: "text-[var(--color-status-resolved-text)]",
  },
  closed: {
    label: "Closed",
    bgClass: "bg-[var(--color-status-closed-bg)]",
    textClass: "text-[var(--color-status-closed-text)]",
  },
  cancelled: {
    label: "Cancelled",
    bgClass: "bg-[var(--color-status-cancelled-bg)]",
    textClass: "text-[var(--color-status-cancelled-text)]",
  },
};

// Priority Config for UI
export const PRIORITY_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string }
> = {
  critical: {
    label: "Critical",
    bgClass: "bg-[var(--color-priority-critical-bg)]",
    textClass: "text-[var(--color-priority-critical-text)]",
  },
  high: {
    label: "High",
    bgClass: "bg-[var(--color-priority-high-bg)]",
    textClass: "text-[var(--color-priority-high-text)]",
  },
  medium: {
    label: "Medium",
    bgClass: "bg-[var(--color-priority-medium-bg)]",
    textClass: "text-[var(--color-priority-medium-text)]",
  },
  low: {
    label: "Low",
    bgClass: "bg-[var(--color-priority-low-bg)]",
    textClass: "text-[var(--color-priority-low-text)]",
  },
};

// Org Kind Labels
export const ORG_KIND_LABELS: Record<OrgKind, string> = {
  principal: "Principal Contractor",
  subcontractor: "Subcontractor",
  client: "Client",
  supplier: "Supplier",
  regulator: "Regulator",
  other: "Other",
};

// Worker Role Labels
export const WORKER_ROLE_LABELS: Record<WorkerRole, string> = {
  project_manager: "Project Manager",
  site_supervisor: "Site Supervisor",
  foreman: "Foreman",
  tradesperson: "Tradesperson",
  laborer: "Laborer",
  safety_officer: "Safety Officer",
  admin: "Admin",
};
