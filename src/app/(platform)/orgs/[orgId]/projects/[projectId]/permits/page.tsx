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
import { Plus, Shield, MoreHorizontal, Eye, CheckCircle, XCircle, Play, Pause, Square } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermitStatusBadge, permitRequiresAction, isPermitTerminal, getPermitTransitions } from "@/components/safety";
import { usePermitInstances, PermitStatus, PermitInstanceData } from "@/hooks/use-permit-instances";
import { formatDateTime } from "@/lib/utils";
import { Id } from "../../../../../../../../convex/_generated/dataModel";

export default function ProjectPermitsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { data: permits, actions, isLoading } = usePermitInstances(projectId);
  const [filter, setFilter] = useState<PermitStatus | "all">("all");

  const filteredPermits = filter === "all"
    ? permits
    : permits.filter((p: PermitInstanceData) => p.status === filter);

  const handleApprove = async (permitId: string) => {
    try {
      await actions.approve(permitId as Id<"permitInstances">, "demo-approver" as Id<"workers">);
    } catch (error) {
      console.error("Failed to approve permit:", error);
    }
  };

  const handleReject = async (permitId: string) => {
    try {
      await actions.reject(permitId as Id<"permitInstances">, "demo-approver" as Id<"workers">, "Rejected by user");
    } catch (error) {
      console.error("Failed to reject permit:", error);
    }
  };

  const handleActivate = async (permitId: string) => {
    try {
      await actions.activate(permitId as Id<"permitInstances">);
    } catch (error) {
      console.error("Failed to activate permit:", error);
    }
  };

  const handleSuspend = async (permitId: string) => {
    try {
      await actions.suspend(permitId as Id<"permitInstances">, "Suspended by user");
    } catch (error) {
      console.error("Failed to suspend permit:", error);
    }
  };

  const handleResume = async (permitId: string) => {
    try {
      await actions.resume(permitId as Id<"permitInstances">);
    } catch (error) {
      console.error("Failed to resume permit:", error);
    }
  };

  const handleClose = async (permitId: string) => {
    try {
      await actions.close(permitId as Id<"permitInstances">, "demo-closer" as Id<"workers">, "Work completed");
    } catch (error) {
      console.error("Failed to close permit:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Permits" subtitle="Loading..." />
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
        title="Permits"
        subtitle="Manage work permits for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/permits/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Permit
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "draft", "submitted", "approved", "active", "suspended", "closed", "expired"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {filteredPermits.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No permits"
          description={
            filter === "all"
              ? "Create your first permit for this project"
              : `No ${filter} permits found`
          }
          action={
            filter === "all" ? (
              <Link href={`/orgs/${orgId}/projects/${projectId}/permits/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Permit
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Permits</CardTitle>
            <CardDescription>
              {filteredPermits.length} permit{filteredPermits.length !== 1 ? "s" : ""}
              {filter !== "all" && permitRequiresAction(filter) && " requiring action"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permit #</TableHead>
                  <TableHead>Work Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Valid From</TableHead>
                  <TableHead className="hidden md:table-cell">Valid To</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermits.map((permit: PermitInstanceData) => {
                  const transitions = getPermitTransitions(permit.status);
                  const terminal = isPermitTerminal(permit.status);

                  return (
                    <TableRow key={permit._id}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {permit.permitNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/orgs/${orgId}/projects/${projectId}/permits/${permit._id}`}
                          className="font-medium hover:underline"
                        >
                          {permit.workDescription.length > 50
                            ? permit.workDescription.substring(0, 50) + "..."
                            : permit.workDescription}
                        </Link>
                      </TableCell>
                      <TableCell>{permit.location}</TableCell>
                      <TableCell>
                        <PermitStatusBadge status={permit.status} showIcon />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {permit.validFrom ? formatDateTime(permit.validFrom) : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {permit.validTo ? (
                          <span className={permit.validTo < Date.now() ? "text-red-600" : ""}>
                            {formatDateTime(permit.validTo)}
                          </span>
                        ) : "—"}
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
                              <Link href={`/orgs/${orgId}/projects/${projectId}/permits/${permit._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {!terminal && (
                              <>
                                <DropdownMenuSeparator />
                                {transitions.includes("approved") && (
                                  <DropdownMenuItem onClick={() => handleApprove(permit._id as string)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {transitions.includes("rejected") && (
                                  <DropdownMenuItem onClick={() => handleReject(permit._id as string)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                {transitions.includes("active") && (
                                  <DropdownMenuItem onClick={() => handleActivate(permit._id as string)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                {transitions.includes("suspended") && (
                                  <DropdownMenuItem onClick={() => handleSuspend(permit._id as string)}>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Suspend
                                  </DropdownMenuItem>
                                )}
                                {permit.status === "suspended" && (
                                  <DropdownMenuItem onClick={() => handleResume(permit._id as string)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Resume
                                  </DropdownMenuItem>
                                )}
                                {transitions.includes("closed") && (
                                  <DropdownMenuItem onClick={() => handleClose(permit._id as string)}>
                                    <Square className="mr-2 h-4 w-4" />
                                    Close
                                  </DropdownMenuItem>
                                )}
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
