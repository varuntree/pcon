"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PermitStatusBadge, getPermitTransitions } from "@/components/safety";
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  X,
  FileCheck,
} from "lucide-react";
import {
  usePermitInstanceWithDetails,
  usePermitInstances,
  PermitStatus,
} from "@/hooks/use-permit-instances";
import { usePermitType, PermitRequiredField } from "@/hooks/use-permit-types";
import { useWorkers } from "@/hooks/use-workers";
import { formatDateTime } from "@/lib/utils";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ orgId: string; projectId: string; permitId: string }>;
}

export default function PermitDetailPage({ params }: PageProps) {
  const { orgId, projectId, permitId } = use(params);
  const router = useRouter();

  const { data: permit, isLoading } = usePermitInstanceWithDetails(permitId);
  const { actions } = usePermitInstances(projectId);
  const { data: workers } = useWorkers(orgId);
  const { data: permitType } = usePermitType(permit?.permitTypeId ?? "");

  // Action state
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [closureNotes, setClosureNotes] = useState("");

  // Get worker name by ID
  const getWorkerName = (workerId: string | undefined) => {
    if (!workerId) return "Unknown";
    const worker = workers.find((w) => w._id === workerId);
    return worker?.fullName ?? "Unknown";
  };

  // Current user (first worker for demo)
  const currentUserId = workers[0]?._id as Id<"workers">;

  // Get available transitions
  const transitions = permit ? getPermitTransitions(permit.status as PermitStatus) : [];

  // Action handlers
  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      await actions.submit(permitId as Id<"permitInstances">);
      toast.success("Permit submitted for approval");
    } catch (error) {
      console.error("Failed to submit permit:", error);
      toast.error("Failed to submit permit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      await actions.approve(
        permitId as Id<"permitInstances">,
        currentUserId,
        undefined,
        permitType?.defaultValidityHours
      );
      toast.success("Permit approved");
    } catch (error) {
      console.error("Failed to approve permit:", error);
      toast.error("Failed to approve permit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsUpdating(true);
    try {
      await actions.reject(
        permitId as Id<"permitInstances">,
        currentUserId,
        rejectionReason.trim()
      );
      setShowRejectForm(false);
      setRejectionReason("");
      toast.success("Permit rejected");
    } catch (error) {
      console.error("Failed to reject permit:", error);
      toast.error("Failed to reject permit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivate = async () => {
    setIsUpdating(true);
    try {
      await actions.activate(permitId as Id<"permitInstances">);
      toast.success("Permit activated");
    } catch (error) {
      console.error("Failed to activate permit:", error);
      toast.error("Failed to activate permit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }
    setIsUpdating(true);
    try {
      await actions.suspend(
        permitId as Id<"permitInstances">,
        suspendReason.trim()
      );
      setShowSuspendForm(false);
      setSuspendReason("");
      toast.success("Permit suspended");
    } catch (error) {
      console.error("Failed to suspend permit:", error);
      toast.error("Failed to suspend permit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResume = async () => {
    setIsUpdating(true);
    try {
      await actions.resume(permitId as Id<"permitInstances">);
      toast.success("Permit resumed");
    } catch (error) {
      console.error("Failed to resume permit:", error);
      toast.error("Failed to resume permit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = async () => {
    setIsUpdating(true);
    try {
      await actions.close(
        permitId as Id<"permitInstances">,
        currentUserId,
        closureNotes.trim() || undefined
      );
      setShowCloseForm(false);
      setClosureNotes("");
      toast.success("Permit closed");
    } catch (error) {
      console.error("Failed to close permit:", error);
      toast.error("Failed to close permit");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsUpdating(true);
    try {
      await actions.cancel(permitId as Id<"permitInstances">);
      toast.success("Permit cancelled");
      router.push(`/orgs/${orgId}/projects/${projectId}/permits`);
    } catch (error) {
      console.error("Failed to cancel permit:", error);
      toast.error("Failed to cancel permit");
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Permit Details" subtitle="Loading..." />
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

  // Not found
  if (!permit) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Permit Not Found"
          subtitle="The requested permit could not be found"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/permits`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Permits
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Get required fields display
  const requiredFields: PermitRequiredField[] = permitType?.requiredFields ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Permit ${permit.permitNumber}`}
        subtitle={
          <div className="flex items-center gap-2">
            <PermitStatusBadge status={permit.status as PermitStatus} />
            <span className="text-[var(--color-text-muted)]">
              {permit.permitType?.name ?? "Unknown Type"}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/orgs/${orgId}/projects/${projectId}/permits`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Permit Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Permit Overview
                </CardTitle>
                <PermitStatusBadge status={permit.status as PermitStatus} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Work Description */}
              <div>
                <Label className="text-[var(--color-text-muted)]">Work Description</Label>
                <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                  {permit.workDescription}
                </p>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Location</p>
                    <p className="text-sm font-medium">{permit.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Applicant</p>
                    <p className="text-sm font-medium">
                      {permit.applicant?.fullName ?? getWorkerName(permit.applicantId as string)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Requested Start</p>
                    <p className="text-sm font-medium">{formatDateTime(permit.requestedStartAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Requested End</p>
                    <p className="text-sm font-medium">{formatDateTime(permit.requestedEndAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Data */}
          {permit.formData && Object.keys(permit.formData as object).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredFields.map((field) => {
                    const value = (permit.formData as Record<string, unknown>)?.[field.id];
                    if (value === undefined) return null;

                    let displayValue: string;
                    if (Array.isArray(value)) {
                      displayValue = value.join(", ");
                    } else if (typeof value === "boolean") {
                      displayValue = value ? "Yes" : "No";
                    } else {
                      displayValue = String(value);
                    }

                    return (
                      <div key={field.id}>
                        <dt className="text-sm text-[var(--color-text-muted)]">{field.label}</dt>
                        <dd className="text-sm font-medium mt-1">{displayValue}</dd>
                      </div>
                    );
                  })}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Approval/Rejection Info */}
          {permit.status === "rejected" && permit.rejectionReason && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-600">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-red-50 p-3 rounded-lg">{permit.rejectionReason}</p>
                {permit.rejectedBy && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Rejected by {getWorkerName(permit.rejectedBy as string)} on{" "}
                    {permit.rejectedAt ? formatDateTime(permit.rejectedAt) : "Unknown"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Suspension Info */}
          {permit.status === "suspended" && permit.suspendReason && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-600">Suspension Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-amber-50 p-3 rounded-lg">{permit.suspendReason}</p>
                {permit.suspendedAt && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Suspended on {formatDateTime(permit.suspendedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Closure Info */}
          {permit.status === "closed" && (
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-green-600">Permit Closed</CardTitle>
              </CardHeader>
              <CardContent>
                {permit.closureNotes && (
                  <p className="text-sm bg-green-50 p-3 rounded-lg mb-2">{permit.closureNotes}</p>
                )}
                {permit.closedBy && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Closed by {getWorkerName(permit.closedBy as string)} on{" "}
                    {permit.closedAt ? formatDateTime(permit.closedAt) : "Unknown"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Forms */}
          {showRejectForm && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reject Permit</CardTitle>
                <CardDescription>Provide a reason for rejection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isUpdating || !rejectionReason.trim()}
                  >
                    Reject Permit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showSuspendForm && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Suspend Permit</CardTitle>
                <CardDescription>Provide a reason for suspension</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter suspension reason..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSuspendForm(false);
                      setSuspendReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSuspend}
                    disabled={isUpdating || !suspendReason.trim()}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    Suspend Permit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showCloseForm && (
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Close Permit</CardTitle>
                <CardDescription>Add optional closure notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter closure notes (optional)..."
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCloseForm(false);
                      setClosureNotes("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleClose} disabled={isUpdating}>
                    Close Permit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transitions.includes("submitted") && (
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
              )}
              {transitions.includes("approved") && (
                <Button
                  className="w-full"
                  onClick={handleApprove}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}
              {transitions.includes("rejected") && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isUpdating}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              )}
              {transitions.includes("active") && permit.status === "approved" && (
                <Button
                  className="w-full"
                  onClick={handleActivate}
                  disabled={isUpdating}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Activate Permit
                </Button>
              )}
              {transitions.includes("suspended") && (
                <Button
                  variant="outline"
                  className="w-full text-amber-600 hover:text-amber-700"
                  onClick={() => setShowSuspendForm(true)}
                  disabled={isUpdating}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Suspend
                </Button>
              )}
              {transitions.includes("active") && permit.status === "suspended" && (
                <Button
                  className="w-full"
                  onClick={handleResume}
                  disabled={isUpdating}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
              {transitions.includes("closed") && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCloseForm(true)}
                  disabled={isUpdating}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Close Permit
                </Button>
              )}
              {transitions.includes("cancelled") && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              {transitions.length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-2">
                  No actions available for this permit status.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Validity Period */}
          {(permit.validFrom || permit.validTo) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Validity Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {permit.validFrom && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Valid From</span>
                    <span className="font-medium">{formatDateTime(permit.validFrom)}</span>
                  </div>
                )}
                {permit.validTo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Valid To</span>
                    <span
                      className={`font-medium ${
                        permit.validTo < Date.now() ? "text-red-600" : ""
                      }`}
                    >
                      {formatDateTime(permit.validTo)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Permit Type Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Permit Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Name</span>
                <span className="font-medium">{permit.permitType?.name ?? "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Code</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {permit.permitType?.code ?? "N/A"}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Risk Level</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    permit.permitType?.riskLevel === "high"
                      ? "bg-red-100 text-red-700"
                      : permit.permitType?.riskLevel === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {permit.permitType?.riskLevel ?? "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDateTime(permit.createdAt)}
                    </p>
                  </div>
                </li>
                {permit.submittedAt && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Submitted</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.submittedAt)}
                      </p>
                    </div>
                  </li>
                )}
                {permit.approvedAt && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.approvedAt)} by{" "}
                        {permit.approver?.fullName ?? getWorkerName(permit.approvedBy as string)}
                      </p>
                    </div>
                  </li>
                )}
                {permit.activatedAt && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Activated</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.activatedAt)}
                      </p>
                    </div>
                  </li>
                )}
                {permit.suspendedAt && permit.status === "suspended" && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Suspended</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.suspendedAt)}
                      </p>
                    </div>
                  </li>
                )}
                {permit.closedAt && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Closed</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.closedAt)}
                      </p>
                    </div>
                  </li>
                )}
                {permit.rejectedAt && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Rejected</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.rejectedAt)}
                      </p>
                    </div>
                  </li>
                )}
                {permit.status === "expired" && permit.validTo && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Expired</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.validTo)}
                      </p>
                    </div>
                  </li>
                )}
                {permit.status === "cancelled" && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Cancelled</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(permit.updatedAt)}
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
