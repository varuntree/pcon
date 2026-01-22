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
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, GraduationCap, MoreHorizontal, Eye, Share2, CheckCircle, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInductionCompletions, InductionCompletionStatus, InductionCompletionData } from "@/hooks/use-induction-completions";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../../convex/_generated/dataModel";

export default function ProjectInductionsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { data: completions, actions, isLoading } = useInductionCompletions(orgId);
  const [filter, setFilter] = useState<InductionCompletionStatus | "all">("all");

  // Filter completions by project
  const projectCompletions = completions.filter((c: InductionCompletionData) =>
    c.projectId === projectId || c.projectId === (projectId as Id<"projects">)
  );

  const filteredCompletions = filter === "all"
    ? projectCompletions
    : projectCompletions.filter((c: InductionCompletionData) => c.status === filter);

  const getStatusConfig = (status: InductionCompletionStatus): string => {
    switch (status) {
      case "pending":
        return "pending";
      case "in_progress":
        return "in_progress";
      case "awaiting_review":
        return "awaiting_review";
      case "completed":
        return "approved";
      case "expired":
        return "expired";
      case "superseded":
        return "superseded";
      default:
        return "pending";
    }
  };

  const getStatusLabel = (status: InductionCompletionStatus): string => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "awaiting_review":
        return "Awaiting Review";
      case "completed":
        return "Completed";
      case "expired":
        return "Expired";
      case "superseded":
        return "Superseded";
      default:
        return status;
    }
  };

  const handleApprove = async (completionId: string) => {
    try {
      await actions.approve(completionId as Id<"inductionCompletions">, "demo-reviewer" as Id<"workers">);
    } catch (error) {
      console.error("Failed to approve completion:", error);
    }
  };

  const handleReturnForRevision = async (completionId: string) => {
    try {
      await actions.returnForRevision(completionId as Id<"inductionCompletions">, "demo-reviewer" as Id<"workers">, "Please review and resubmit");
    } catch (error) {
      console.error("Failed to return for revision:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inductions" subtitle="Loading..." />
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
        title="Inductions"
        subtitle="Manage worker inductions for this project"
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/inductions/invite`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invite
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="completions">
        <TabsList>
          <TabsTrigger value="completions">Completions</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="completions" className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "in_progress", "awaiting_review", "completed", "expired"] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status === "all" ? "All" : getStatusLabel(status)}
              </Button>
            ))}
          </div>

          {filteredCompletions.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No induction completions"
              description={
                filter === "all"
                  ? "No workers have started inductions for this project"
                  : `No ${getStatusLabel(filter).toLowerCase()} inductions found`
              }
              action={
                filter === "all" ? (
                  <Link href={`/orgs/${orgId}/projects/${projectId}/inductions/invite`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Invite
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Completions</CardTitle>
                <CardDescription>
                  {filteredCompletions.length} completion{filteredCompletions.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Induction Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Started</TableHead>
                      <TableHead className="hidden md:table-cell">Completed</TableHead>
                      <TableHead className="hidden md:table-cell">Expires</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompletions.map((completion: InductionCompletionData) => (
                      <TableRow key={completion._id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">
                              {completion.profile?.fullName || "Unknown"}
                            </span>
                            {completion.profile?.email && (
                              <p className="text-sm text-[var(--color-text-muted)]">
                                {completion.profile.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/orgs/${orgId}/projects/${projectId}/inductions/${completion._id}`}
                            className="hover:underline"
                          >
                            Induction
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={getStatusConfig(completion.status)} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {completion.startedAt ? formatDate(completion.startedAt) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {completion.completedAt ? formatDate(completion.completedAt) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {completion.expiresAt ? (
                            <span className={completion.expiresAt < Date.now() ? "text-red-600" : ""}>
                              {formatDate(completion.expiresAt)}
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
                                <Link href={`/orgs/${orgId}/projects/${projectId}/inductions/${completion._id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              {completion.status === "awaiting_review" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleApprove(completion._id as string)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReturnForRevision(completion._id as string)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Return for Revision
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Induction Invites</CardTitle>
              <CardDescription>
                Share links for off-site induction completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Share2}
                title="No active invites"
                description="Create an invite to share a link for off-site induction"
                action={
                  <Link href={`/orgs/${orgId}/projects/${projectId}/inductions/invite`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Invite
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
