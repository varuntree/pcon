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
  ListTodo,
  Play,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  Calendar,
  User,
  Building2,
  Clock,
  Edit,
  Share2,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import {
  useActionItem,
  useActionItems,
  ActionItemData,
  ActionComment,
} from "@/hooks/use-action-items";
import { useOrgs } from "@/hooks/use-orgs";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  checklist: "Checklist",
  inspection: "Inspection",
  incident: "Incident",
  defect: "Defect",
  itp: "ITP",
  manual: "Manual",
};

export default function ActionItemDetailPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string; actionId: string }>;
}) {
  const resolvedParams = use(params);
  const { orgId, projectId, actionId } = resolvedParams;
  const _router = useRouter();

  const { data: actionItem, isLoading } = useActionItem(actionId);
  const { actions } = useActionItems(projectId);
  const { data: orgs } = useOrgs();
  const { data: workers } = useWorkers(orgId);

  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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
      await actions.startProgress(actionId as Id<"actionItems">);
    } catch (error) {
      console.error("Failed to start progress:", error);
    }
  };

  const handleComplete = async () => {
    try {
      await actions.complete(actionId as Id<"actionItems">);
    } catch (error) {
      console.error("Failed to complete action:", error);
    }
  };

  const handleCancel = async () => {
    if (!cancelReasonInput.trim()) return;
    try {
      await actions.cancel(
        actionId as Id<"actionItems">,
        cancelReasonInput.trim()
      );
      setShowCancelDialog(false);
      setCancelReasonInput("");
    } catch (error) {
      console.error("Failed to cancel action:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const workerId = workers[0]?._id;
      if (workerId) {
        await actions.addComment(
          actionId as Id<"actionItems">,
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

  const handleGenerateShareCode = async () => {
    try {
      const shareCode = await actions.generateShareCode(
        actionId as Id<"actionItems">
      );
      const shareUrl = `${window.location.origin}/w/action/${shareCode}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
    } catch (error) {
      console.error("Failed to generate share code:", error);
    }
  };

  const handleCopyShareLink = async () => {
    if (actionItem?.shareCode) {
      const shareUrl = `${window.location.origin}/w/action/${actionItem.shareCode}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied to clipboard!");
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

  if (!actionItem) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Action Not Found"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/actions`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Actions
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={ListTodo}
          title="Action item not found"
          description="The action item you're looking for doesn't exist or has been deleted."
          action={
            <Link href={`/orgs/${orgId}/projects/${projectId}/actions`}>
              <Button>Back to Actions</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const actionData = actionItem as ActionItemData;
  const comments = (actionData.comments as unknown as ActionComment[] | undefined) ?? [];
  const dueDate = actionData.dueDate as number | undefined;
  const status = String(actionData.status);
  const actionNumber = String(actionData.actionNumber);
  const title = String(actionData.title);
  const description = actionData.description ? String(actionData.description) : null;
  const priority = String(actionData.priority);
  const sourceType = actionData.sourceType ? String(actionData.sourceType) : null;
  const shareCode = actionData.shareCode ? String(actionData.shareCode) : null;
  const cancelReason = actionData.cancelReason ? String(actionData.cancelReason) : null;
  const isOverdue =
    dueDate &&
    dueDate < Date.now() &&
    (status === "open" || status === "in_progress");
  const isEditable = status === "open" || status === "in_progress";

  return (
    <div className="space-y-6">
      <PageHeader
        title={actionNumber}
        subtitle={title}
        actions={
          <div className="flex gap-2">
            <Link href={`/orgs/${orgId}/projects/${projectId}/actions`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            {isEditable && (
              <Link
                href={`/orgs/${orgId}/projects/${projectId}/actions/${actionId}/edit`}
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
          {/* Action Details */}
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
              {/* Source Info */}
              {sourceType && (
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-muted)]">Source:</span>
                  <Badge variant="secondary">
                    {SOURCE_TYPE_LABELS[sourceType] ?? sourceType}
                  </Badge>
                </div>
              )}

              {/* Share Code */}
              {shareCode && (
                <div className="flex items-center gap-2 text-sm">
                  <Share2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="text-[var(--color-text-muted)]">
                    Share Code:
                  </span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {shareCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyShareLink}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Cancel Reason if cancelled */}
              {status === "cancelled" && cancelReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">
                    Cancellation Reason
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {cancelReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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
              {isEditable && (
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
                <>
                  <Button
                    onClick={handleStartProgress}
                    className="w-full"
                    variant="default"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Progress
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="w-full"
                    variant="outline"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </Button>
                </>
              )}

              {status === "in_progress" && (
                <Button
                  onClick={handleComplete}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
              )}

              {isEditable && (
                <>
                  {!shareCode ? (
                    <Button
                      onClick={handleGenerateShareCode}
                      className="w-full"
                      variant="outline"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Generate Share Link
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCopyShareLink}
                      className="w-full"
                      variant="outline"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Share Link
                    </Button>
                  )}

                  {!showCancelDialog ? (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Action
                    </Button>
                  ) : (
                    <div className="space-y-2 p-3 border rounded-lg">
                      <p className="text-sm font-medium">Cancel Reason</p>
                      <Textarea
                        placeholder="Why is this being cancelled?"
                        value={cancelReasonInput}
                        onChange={(e) => setCancelReasonInput(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCancel}
                          disabled={!cancelReasonInput.trim()}
                          variant="destructive"
                          size="sm"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCancelDialog(false);
                            setCancelReasonInput("");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionData.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Assigned to Organization
                    </p>
                    <p className="font-medium">
                      {getOrgName(actionData.assignedTo as Id<"orgs">)}
                    </p>
                  </div>
                </div>
              ) : actionData.assignedWorkerId ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Assigned to Worker
                    </p>
                    <p className="font-medium">
                      {getWorkerName(
                        actionData.assignedWorkerId as Id<"workers">
                      )}
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
                    Created by
                  </p>
                  <p className="font-medium">
                    {getWorkerName(actionData.createdBy as Id<"workers">)}
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
                    {formatDateTime(actionData.createdAt as number)}
                  </p>
                </div>
              </div>

              {/* Completed At */}
              {actionData.completedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Completed
                    </p>
                    <p className="font-medium">
                      {formatDateTime(actionData.completedAt as number)}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancelled At */}
              {actionData.cancelledAt && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Cancelled
                    </p>
                    <p className="font-medium">
                      {formatDateTime(actionData.cancelledAt as number)}
                    </p>
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
