"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/layout/empty-state";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import {
  Plus,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  useDefects,
  DefectData,
  DefectStatus,
} from "@/hooks/use-defects";
import { useOrgs } from "@/hooks/use-orgs";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../../convex/_generated/dataModel";

type FilterStatus = DefectStatus | "all";

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_LABELS: Record<string, string> = {
  builder: "Builder",
  client: "Client",
  safety: "Safety",
  other: "Other",
};

export default function ProjectDefectsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { data: defects, actions, isLoading } = useDefects(projectId);
  const { data: orgs } = useOrgs();
  const { data: workers } = useWorkers(orgId);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredDefects =
    filter === "all"
      ? defects
      : defects.filter((d: DefectData) => d.status === filter);

  // Helper to get org name by ID
  const getOrgName = (orgIdParam: Id<"orgs"> | undefined): string => {
    if (!orgIdParam) return "";
    const org = orgs.find((o) => o._id === orgIdParam);
    return org?.name ?? "Unknown Org";
  };

  // Helper to get worker name by ID
  const getWorkerName = (workerId: Id<"workers"> | undefined): string => {
    if (!workerId) return "";
    const worker = workers.find((w) => w._id === workerId);
    return worker?.fullName ?? "Unknown Worker";
  };

  // Get assignee display text
  const getAssigneeDisplay = (defect: DefectData): string => {
    if (defect.assignedTo) {
      return getOrgName(defect.assignedTo as Id<"orgs">);
    }
    if (defect.assignedWorkerId) {
      return getWorkerName(defect.assignedWorkerId as Id<"workers">);
    }
    return "Unassigned";
  };

  const handleStartProgress = async (defectId: string) => {
    try {
      await actions.startProgress(defectId as Id<"defects">);
    } catch (error) {
      console.error("Failed to start progress:", error);
    }
  };

  const handleResolve = async (defectId: string) => {
    try {
      await actions.resolve(defectId as Id<"defects">);
    } catch (error) {
      console.error("Failed to resolve defect:", error);
    }
  };

  const handleClose = async (defectId: string) => {
    try {
      // TODO: Get actual current worker ID from auth context
      const closedBy = workers[0]?._id;
      if (closedBy) {
        await actions.close(defectId as Id<"defects">, closedBy);
      }
    } catch (error) {
      console.error("Failed to close defect:", error);
    }
  };

  const handleReopen = async (defectId: string) => {
    try {
      await actions.reopen(defectId as Id<"defects">);
    } catch (error) {
      console.error("Failed to reopen defect:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Defects" subtitle="Loading..." />
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Defects"
        subtitle="Track and manage quality defects for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/defects/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Defect
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {filteredDefects.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No defects"
          description={
            filter === "all"
              ? "No defects have been reported for this project"
              : `No ${STATUS_OPTIONS.find((s) => s.value === filter)?.label.toLowerCase()} defects found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/projects/${projectId}/defects/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Report Defect
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Defects</CardTitle>
            <CardDescription>
              {filteredDefects.length} defect
              {filteredDefects.length !== 1 ? "s" : ""}
              {filter !== "all" &&
                ` (${STATUS_OPTIONS.find((s) => s.value === filter)?.label.toLowerCase()})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Defect #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDefects.map((defect: DefectData) => {
                  const defectId = defect._id as string;
                  const dueDate = defect.dueDate as number | undefined;
                  const status = String(defect.status);
                  const isOverdue =
                    dueDate &&
                    dueDate < Date.now() &&
                    (status === "open" || status === "in_progress");
                  const defectNumber = String(defect.defectNumber);
                  const title = String(defect.title);
                  const location = defect.location ? String(defect.location) : null;
                  const level = defect.level ? String(defect.level) : null;
                  const area = defect.area ? String(defect.area) : null;
                  const category = String(defect.category);
                  const priority = String(defect.priority);

                  return (
                    <TableRow key={defectId}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {defectNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/orgs/${orgId}/projects/${projectId}/defects/${defectId}`}
                          className="font-medium hover:underline"
                        >
                          {title}
                        </Link>
                        {location && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {location}
                            {level && ` • ${level}`}
                            {area && ` • ${area}`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {CATEGORY_LABELS[category] ?? category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getAssigneeDisplay(defect)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {dueDate ? (
                          <span
                            className={isOverdue ? "text-red-600 font-medium" : ""}
                          >
                            {formatDate(dueDate)}
                            {isOverdue && " (Overdue)"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/orgs/${orgId}/projects/${projectId}/defects/${defectId}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>

                            {/* Workflow actions based on status */}
                            {status === "open" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleStartProgress(defectId)}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Start Progress
                                </DropdownMenuItem>
                              </>
                            )}

                            {status === "in_progress" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleResolve(defectId)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              </>
                            )}

                            {status === "resolved" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleClose(defectId)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Close Defect
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReopen(defectId)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reopen
                                </DropdownMenuItem>
                              </>
                            )}

                            {status === "closed" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleReopen(defectId)}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Reopen
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
