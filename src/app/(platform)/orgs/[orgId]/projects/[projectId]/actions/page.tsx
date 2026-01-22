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
  ListTodo,
  MoreHorizontal,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Share2,
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
  useActionItems,
  ActionItemData,
  ActionItemStatus,
} from "@/hooks/use-action-items";
import { useOrgs } from "@/hooks/use-orgs";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../../convex/_generated/dataModel";

type FilterStatus = ActionItemStatus | "all";

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  checklist: "Checklist",
  inspection: "Inspection",
  incident: "Incident",
  defect: "Defect",
  itp: "ITP",
  manual: "Manual",
};

export default function ProjectActionsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { data: actionItems, actions, isLoading } = useActionItems(projectId);
  const { data: orgs } = useOrgs();
  const { data: workers } = useWorkers(orgId);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredActions =
    filter === "all"
      ? actionItems
      : actionItems.filter((a: ActionItemData) => a.status === filter);

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
  const getAssigneeDisplay = (action: ActionItemData): string => {
    if (action.assignedTo) {
      return getOrgName(action.assignedTo as Id<"orgs">);
    }
    if (action.assignedWorkerId) {
      return getWorkerName(action.assignedWorkerId as Id<"workers">);
    }
    return "Unassigned";
  };

  const handleStartProgress = async (actionId: string) => {
    try {
      await actions.startProgress(actionId as Id<"actionItems">);
    } catch (error) {
      console.error("Failed to start progress:", error);
    }
  };

  const handleComplete = async (actionId: string) => {
    try {
      await actions.complete(actionId as Id<"actionItems">);
    } catch (error) {
      console.error("Failed to complete action:", error);
    }
  };

  const handleCancel = async (actionId: string) => {
    try {
      await actions.cancel(actionId as Id<"actionItems">, "Cancelled by user");
    } catch (error) {
      console.error("Failed to cancel action:", error);
    }
  };

  const handleGenerateShareCode = async (actionId: string) => {
    try {
      const shareCode = await actions.generateShareCode(
        actionId as Id<"actionItems">
      );
      // Copy to clipboard
      await navigator.clipboard.writeText(
        `${window.location.origin}/w/action/${shareCode}`
      );
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Failed to generate share code:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Action Items" subtitle="Loading..." />
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
        title="Action Items"
        subtitle="Track corrective actions and follow-ups"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/actions/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Action
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

      {filteredActions.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No action items"
          description={
            filter === "all"
              ? "No action items have been created for this project"
              : `No ${STATUS_OPTIONS.find((s) => s.value === filter)?.label.toLowerCase()} actions found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/projects/${projectId}/actions/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Action
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>
              {filteredActions.length} action
              {filteredActions.length !== 1 ? "s" : ""}
              {filter !== "all" &&
                ` (${STATUS_OPTIONS.find((s) => s.value === filter)?.label.toLowerCase()})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Assigned To
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map((action: ActionItemData) => {
                  const actionId = action._id as string;
                  const dueDate = action.dueDate as number | undefined;
                  const status = String(action.status);
                  const actionNumber = String(action.actionNumber);
                  const title = String(action.title);
                  const description = action.description ? String(action.description) : null;
                  const sourceType = action.sourceType ? String(action.sourceType) : null;
                  const priority = String(action.priority);
                  const isOverdue =
                    dueDate &&
                    dueDate < Date.now() &&
                    (status === "open" || status === "in_progress");

                  return (
                    <TableRow key={actionId}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {actionNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/orgs/${orgId}/projects/${projectId}/actions/${actionId}`}
                          className="font-medium hover:underline"
                        >
                          {title}
                        </Link>
                        {description && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                            {description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {sourceType ? (
                          <Badge variant="outline">
                            {SOURCE_TYPE_LABELS[sourceType] ?? sourceType}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getAssigneeDisplay(action)}
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
                                href={`/orgs/${orgId}/projects/${projectId}/actions/${actionId}`}
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
                                  onClick={() => handleStartProgress(actionId)}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Start Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleComplete(actionId)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                              </>
                            )}

                            {status === "in_progress" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleComplete(actionId)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                              </>
                            )}

                            {(status === "open" || status === "in_progress") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleGenerateShareCode(actionId)}
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share Link
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleCancel(actionId)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel
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
