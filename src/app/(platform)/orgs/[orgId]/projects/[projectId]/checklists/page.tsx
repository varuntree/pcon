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
import { Plus, ClipboardCheck, MoreHorizontal, Eye, Play, XCircle, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useChecklistInstances, ChecklistInstanceStatus, ChecklistInstanceData } from "@/hooks/use-checklist-instances";
import { useActiveChecklistTemplates, ChecklistTemplateData, ChecklistField } from "@/hooks/use-checklist-templates";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../../convex/_generated/dataModel";

type FilterStatus = ChecklistInstanceStatus | "all";

function getStatusBadgeVariant(status: ChecklistInstanceStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "in_progress":
      return "default";
    case "completed":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status: ChecklistInstanceStatus): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

interface SectionWithFields {
  fields: ChecklistField[];
}

function calculateProgress(
  responses: Record<string, unknown> | undefined,
  template: ChecklistTemplateData | undefined
): number {
  if (!template || !template.sections) return 0;

  // Count all fields except instruction fields
  let totalFields = 0;
  let answeredFields = 0;

  const sections = template.sections as unknown as SectionWithFields[];
  for (const section of sections) {
    for (const field of section.fields || []) {
      if (field.type === "instruction") continue;
      totalFields++;

      if (responses && responses[field.id] !== undefined) {
        const response = responses[field.id] as { value?: unknown } | undefined;
        if (response && response.value !== undefined && response.value !== null && response.value !== "") {
          answeredFields++;
        }
      }
    }
  }

  if (totalFields === 0) return 100;
  return Math.round((answeredFields / totalFields) * 100);
}

export default function ProjectChecklistsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { data: instances, actions, isLoading } = useChecklistInstances(projectId);
  const { data: templates } = useActiveChecklistTemplates(orgId);
  const { data: workers } = useWorkers(orgId);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredInstances = filter === "all"
    ? instances
    : instances.filter((i: ChecklistInstanceData) => i.status === filter);

  // Helper to get template by ID
  const getTemplate = (templateId: Id<"checklistTemplates">): ChecklistTemplateData | undefined => {
    return templates.find((t) => t._id === templateId);
  };

  // Helper to get worker name
  const getWorkerName = (workerId: Id<"workers"> | undefined): string => {
    if (!workerId) return "Unassigned";
    const worker = workers.find((w) => w._id === workerId);
    return worker?.fullName ?? "Unknown";
  };

  const handleCancel = async (instanceId: string) => {
    try {
      await actions.cancel(instanceId as Id<"checklistInstances">);
    } catch (error) {
      console.error("Failed to cancel checklist:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checklists" subtitle="Loading..." />
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
        title="Checklists"
        subtitle="Quality and safety checklists for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/checklists/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Checklist
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "in_progress", "completed", "cancelled"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : getStatusLabel(status as ChecklistInstanceStatus)}
          </Button>
        ))}
      </div>

      {filteredInstances.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No checklists"
          description={
            filter === "all"
              ? "Start a checklist to track quality or safety tasks"
              : `No ${getStatusLabel(filter as ChecklistInstanceStatus).toLowerCase()} checklists found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/projects/${projectId}/checklists/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Checklist
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Checklists</CardTitle>
            <CardDescription>
              {filteredInstances.length} checklist{filteredInstances.length !== 1 ? "s" : ""}
              {filter !== "all" && ` (${getStatusLabel(filter as ChecklistInstanceStatus).toLowerCase()})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Checklist #</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Progress</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((instance: ChecklistInstanceData) => {
                  const templateId = instance.checklistTemplateId as Id<"checklistTemplates">;
                  const template = templateId ? getTemplate(templateId) : undefined;
                  const progress = calculateProgress(
                    instance.responses as Record<string, unknown> | undefined,
                    template
                  );
                  const dueDate = instance.dueDate as number | undefined;
                  const isOverdue = dueDate && dueDate < Date.now() && instance.status === "in_progress";
                  const instanceId = instance._id as string;
                  const instanceNumber = instance.instanceNumber as string | undefined;
                  const assignedTo = instance.assignedTo as Id<"workers"> | undefined;

                  return (
                    <TableRow key={instanceId}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {instanceNumber ?? `CHK-${instanceId.slice(-4).toUpperCase()}`}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/orgs/${orgId}/projects/${projectId}/checklists/${instanceId}`}
                          className="font-medium hover:underline"
                        >
                          {template?.name ? String(template.name) : "Unknown Template"}
                        </Link>
                        {template?.scope && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {String(template.scope)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getWorkerName(assignedTo)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(instance.status as ChecklistInstanceStatus)}>
                          {instance.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {getStatusLabel(instance.status as ChecklistInstanceStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {instance.status === "in_progress" ? (
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="w-16 h-2" />
                            <span className="text-sm text-[var(--color-text-muted)]">{progress}%</span>
                          </div>
                        ) : instance.status === "completed" ? (
                          <span className="text-sm text-green-600">100%</span>
                        ) : (
                          <span className="text-sm text-[var(--color-text-muted)]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {dueDate ? (
                          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
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
                              <Link href={`/orgs/${orgId}/projects/${projectId}/checklists/${instanceId}`}>
                                {instance.status === "in_progress" ? (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Continue
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </>
                                )}
                              </Link>
                            </DropdownMenuItem>
                            {instance.status === "in_progress" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleCancel(instanceId)}
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
