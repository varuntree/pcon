"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/layout/empty-state";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  Send,
  Calendar,
  MapPin,
  User,
  Building2,
  Clock,
  Edit,
} from "lucide-react";
import {
  useDefectWithDetails,
  useDefects,
  DefectData,
} from "@/hooks/use-defects";
import { useOrgs } from "@/hooks/use-orgs";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

const CATEGORY_LABELS: Record<string, string> = {
  builder: "Builder",
  client: "Client",
  safety: "Safety",
  other: "Other",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  asset: "Asset",
  itp: "ITP",
  incident: "Incident",
  defect: "Defect",
  manual: "Manual",
};

interface DefectComment {
  id: string;
  workerId: Id<"workers">;
  comment: string;
  createdAt: number;
}

export default function DefectDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string; defectId: string }>;
}) {
  const resolvedParams = use(params);
  const { orgId, projectId, defectId } = resolvedParams;
  const _router = useRouter();

  const { data: defect, isLoading } = useDefectWithDetails(defectId);
  const { actions } = useDefects(projectId);
  const { data: orgs } = useOrgs();
  const { data: workers } = useWorkers(orgId);

  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Helper to get org name by ID
  const getOrgName = (orgIdParam: Id<"orgs"> | undefined): string => {
    if (!orgIdParam) return "Unknown";
    const org = orgs.find((o) => o._id === orgIdParam);
    return org?.name ?? "Unknown Org";
  };

  // Helper to get worker name by ID
  const getWorkerName = (workerId: Id<"workers"> | undefined): string => {
    if (!workerId) return "Unknown";
    const worker = workers.find((w) => w._id === workerId);
    return worker?.fullName ?? "Unknown Worker";
  };

  const handleStartProgress = async () => {
    try {
      await actions.startProgress(defectId as Id<"defects">);
    } catch (error) {
      console.error("Failed to start progress:", error);
    }
  };

  const handleResolve = async () => {
    try {
      await actions.resolve(defectId as Id<"defects">);
    } catch (error) {
      console.error("Failed to resolve defect:", error);
    }
  };

  const handleClose = async () => {
    try {
      const closedBy = workers[0]?._id;
      if (closedBy) {
        await actions.close(defectId as Id<"defects">, closedBy);
      }
    } catch (error) {
      console.error("Failed to close defect:", error);
    }
  };

  const handleReopen = async () => {
    try {
      await actions.reopen(defectId as Id<"defects">);
    } catch (error) {
      console.error("Failed to reopen defect:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const workerId = workers[0]?._id;
      if (workerId) {
        await actions.addComment(
          defectId as Id<"defects">,
          workerId,
          newComment.trim()
        );
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
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

  if (!defect) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Defect Not Found"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/defects`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Defects
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={AlertTriangle}
          title="Defect not found"
          description="The defect you're looking for doesn't exist or has been deleted."
          action={
            <Link href={`/orgs/${orgId}/projects/${projectId}/defects`}>
              <Button>Back to Defects</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const defectData = defect as DefectData & { photos?: unknown[] };
  const comments = (defectData.comments as unknown as DefectComment[] | undefined) ?? [];
  const dueDate = defectData.dueDate as number | undefined;
  const status = String(defectData.status);
  const defectNumber = String(defectData.defectNumber);
  const title = String(defectData.title);
  const description = defectData.description ? String(defectData.description) : null;
  const category = String(defectData.category);
  const priority = String(defectData.priority);
  const location = defectData.location ? String(defectData.location) : null;
  const level = defectData.level ? String(defectData.level) : null;
  const area = defectData.area ? String(defectData.area) : null;
  const sourceType = defectData.sourceType ? String(defectData.sourceType) : null;
  const isOverdue =
    dueDate &&
    dueDate < Date.now() &&
    (status === "open" || status === "in_progress");

  return (
    <div className="space-y-6">
      <PageHeader
        title={defectNumber}
        subtitle={title}
        actions={
          <div className="flex gap-2">
            <Link href={`/orgs/${orgId}/projects/${projectId}/defects`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            {(status === "open" || status === "in_progress") && (
              <Link
                href={`/orgs/${orgId}/projects/${projectId}/defects/${defectId}/edit`}
              >
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Defect Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Details</CardTitle>
                <div className="flex gap-2">
                  <PriorityBadge priority={priority} />
                  <StatusBadge status={status} />
                </div>
              </div>
              {description && (
                <CardDescription className="mt-2 whitespace-pre-wrap">
                  {description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {CATEGORY_LABELS[category] ?? category}
                </Badge>
              </div>

              {/* Location Info */}
              {(location || level || area) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    {location && <span>{location}</span>}
                    {level && (
                      <span className="text-[var(--color-text-muted)]">
                        {location ? " • " : ""}
                        {level}
                      </span>
                    )}
                    {area && (
                      <span className="text-[var(--color-text-muted)]">
                        {location || level ? " • " : ""}
                        {area}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Source Info */}
              {sourceType && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[var(--color-text-muted)]">Source:</span>
                  <Badge variant="secondary">
                    {SOURCE_TYPE_LABELS[sourceType] ?? sourceType}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos Section */}
          {defectData.photos && (defectData.photos as unknown[]).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>
                  {(defectData.photos as unknown[]).length} photo
                  {(defectData.photos as unknown[]).length !== 1 ? "s" : ""} attached
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Photo thumbnails would go here */}
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-[var(--color-text-muted)]">
                    Photo previews coming soon
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
              <CardDescription>
                {comments.length} comment{comments.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment List */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {getWorkerName(comment.workerId)}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No comments yet
                </p>
              )}

              {/* Add Comment Form */}
              {status !== "closed" && (
                <div className="space-y-2 pt-4 border-t">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmittingComment ? "Sending..." : "Add Comment"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {status === "open" && (
                <Button
                  onClick={handleStartProgress}
                  className="w-full"
                  variant="default"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Progress
                </Button>
              )}

              {status === "in_progress" && (
                <Button
                  onClick={handleResolve}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Resolved
                </Button>
              )}

              {status === "resolved" && (
                <>
                  <Button
                    onClick={handleClose}
                    className="w-full"
                    variant="default"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Close Defect
                  </Button>
                  <Button
                    onClick={handleReopen}
                    className="w-full"
                    variant="outline"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reopen
                  </Button>
                </>
              )}

              {status === "closed" && (
                <Button
                  onClick={handleReopen}
                  className="w-full"
                  variant="outline"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reopen
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {defectData.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Assigned to Organization
                    </p>
                    <p className="font-medium">
                      {getOrgName(defectData.assignedTo as Id<"orgs">)}
                    </p>
                  </div>
                </div>
              ) : defectData.assignedWorkerId ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Assigned to Worker
                    </p>
                    <p className="font-medium">
                      {getWorkerName(defectData.assignedWorkerId as Id<"workers">)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Unassigned
                </p>
              )}

              {/* Created By */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Reported by
                  </p>
                  <p className="font-medium">
                    {getWorkerName(defectData.createdBy as Id<"workers">)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Due Date */}
              {dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Due Date
                    </p>
                    <p
                      className={`font-medium ${isOverdue ? "text-red-600" : ""}`}
                    >
                      {formatDate(dueDate)}
                      {isOverdue && " (Overdue)"}
                    </p>
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Created</p>
                  <p className="font-medium">
                    {formatDateTime(defectData.createdAt as number)}
                  </p>
                </div>
              </div>

              {/* Resolved At */}
              {defectData.resolvedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Resolved
                    </p>
                    <p className="font-medium">
                      {formatDateTime(defectData.resolvedAt as number)}
                    </p>
                  </div>
                </div>
              )}

              {/* Closed At */}
              {defectData.closedAt && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Closed</p>
                    <p className="font-medium">
                      {formatDateTime(defectData.closedAt as number)}
                    </p>
                    {defectData.closedBy && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        by {getWorkerName(defectData.closedBy as Id<"workers">)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
