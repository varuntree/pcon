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
import { StatusBadge } from "@/components/ui/status-badge";
import { SWMSSectionsViewer, type SwmsSection } from "@/components/safety/swms-sections-viewer";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  User,
  Users,
  PenLine,
  CheckCircle,
  XCircle,
  Share2,
  Archive,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  useSWMSDocument,
  useSWMSDocuments,
  SWMSDocumentStatus,
} from "@/hooks/use-swms-documents";
import {
  useSWMSSignatures,
  useSWMSAssignments,
  useSWMSSignatureCounts,
} from "@/hooks/use-swms-signatures";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ orgId: string; projectId: string; documentId: string }>;
}

export default function SWMSDocumentDetailPage({ params }: PageProps) {
  const { orgId, projectId, documentId } = use(params);
  const router = useRouter();

  const { data: document, isLoading } = useSWMSDocument(documentId);
  const { actions } = useSWMSDocuments(projectId);
  const { data: signatures } = useSWMSSignatures(documentId);
  const { data: assignments } = useSWMSAssignments(documentId);
  const { data: signatureCounts } = useSWMSSignatureCounts(documentId);
  const { data: workers } = useWorkers(orgId);

  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusConfig = (status: SWMSDocumentStatus): string => {
    switch (status) {
      case "draft":
        return "draft";
      case "pending_review":
        return "pending_review";
      case "approved":
        return "approved";
      case "expired":
        return "expired";
      case "archived":
        return "closed";
      default:
        return "pending";
    }
  };

  const handleSubmitForReview = async () => {
    if (!document) return;
    setIsUpdating(true);
    try {
      // Using first worker as submitter (in real app, use current user)
      const submitterId = workers[0]?._id as Id<"workers">;
      await actions.submitForReview(
        documentId as Id<"swmsDocuments">,
        submitterId
      );
      toast.success("SWMS submitted for review");
    } catch (error) {
      console.error("Failed to submit for review:", error);
      toast.error("Failed to submit for review");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!document) return;
    setIsUpdating(true);
    try {
      // Using first worker as approver (in real app, use current user)
      const approverId = workers[0]?._id as Id<"workers">;
      await actions.approve(
        documentId as Id<"swmsDocuments">,
        approverId,
        365 // Default validity: 1 year
      );
      toast.success("SWMS approved");
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve SWMS");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReturnToDraft = async () => {
    if (!document) return;
    setIsUpdating(true);
    try {
      await actions.returnToDraft(documentId as Id<"swmsDocuments">);
      toast.success("SWMS returned to draft");
    } catch (error) {
      console.error("Failed to return to draft:", error);
      toast.error("Failed to return to draft");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (!document) return;
    setIsUpdating(true);
    try {
      await actions.archive(documentId as Id<"swmsDocuments">);
      toast.success("SWMS archived");
      router.push(`/orgs/${orgId}/projects/${projectId}/swms`);
    } catch (error) {
      console.error("Failed to archive:", error);
      toast.error("Failed to archive SWMS");
    } finally {
      setIsUpdating(false);
    }
  };

  const copyShareLink = () => {
    if (document?.shareCode) {
      const link = `${window.location.origin}/w/swms/${document.shareCode}`;
      navigator.clipboard.writeText(link);
      toast.success("Share link copied to clipboard");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SWMS Document" subtitle="Loading..." />
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

  // Not found state
  if (!document) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Document Not Found"
          subtitle="The requested SWMS document could not be found"
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/swms`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to SWMS
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Get worker name by ID
  const getWorkerName = (workerId: string | undefined) => {
    if (!workerId) return "Unknown";
    const worker = workers.find((w) => w._id === workerId);
    return worker?.fullName ?? "Unknown";
  };

  // Count unsigned workers
  const unsignedCount = assignments.filter((a) => !a.acknowledgedAt).length;
  const signedCount = assignments.filter((a) => a.acknowledgedAt).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.title}
        subtitle={
          <div className="flex items-center gap-2">
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {document.swmsNumber}
            </code>
            <span className="text-[var(--color-text-muted)]">Rev {document.revision}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Status-based actions */}
            {document.status === "draft" && (
              <Button onClick={handleSubmitForReview} disabled={isUpdating}>
                <PenLine className="mr-2 h-4 w-4" />
                Submit for Review
              </Button>
            )}
            {document.status === "pending_review" && (
              <>
                <Button variant="outline" onClick={handleReturnToDraft} disabled={isUpdating}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Return to Draft
                </Button>
                <Button onClick={handleApprove} disabled={isUpdating}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {document.status === "approved" && (
              <>
                <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${documentId}/sign`}>
                  <Button variant="outline">
                    <PenLine className="mr-2 h-4 w-4" />
                    Sign SWMS
                  </Button>
                </Link>
                <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${documentId}/assign`}>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Assign Workers
                  </Button>
                </Link>
                {document.shareCode && (
                  <Button variant="outline" onClick={copyShareLink}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                )}
              </>
            )}
            {document.status !== "archived" && (
              <Button variant="outline" onClick={handleArchive} disabled={isUpdating}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            )}
            <Link href={`/orgs/${orgId}/projects/${projectId}/swms`}>
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
          {/* Document Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Document Overview
                </CardTitle>
                <StatusBadge status={getStatusConfig(document.status)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Created</p>
                    <p className="text-sm font-medium">{formatDate(document.createdAt)}</p>
                  </div>
                </div>
                {document.approvedAt && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Approved</p>
                      <p className="text-sm font-medium">{formatDate(document.approvedAt)}</p>
                    </div>
                  </div>
                )}
                {document.expiresAt && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Expires</p>
                      <p className={`text-sm font-medium ${document.expiresAt < Date.now() ? "text-red-600" : ""}`}>
                        {formatDate(document.expiresAt)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Created By</p>
                    <p className="text-sm font-medium">{getWorkerName(document.createdBy as string)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SWMS Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SWMS Content</CardTitle>
              <CardDescription>
                {document.sections?.length ?? 0} sections defined. Click to expand each section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {document.sections && document.sections.length > 0 ? (
                <SWMSSectionsViewer
                  sections={document.sections as SwmsSection[]}
                  defaultExpanded={false}
                />
              ) : (
                <div className="text-center py-8 text-[var(--color-text-muted)]">
                  No sections defined yet. Edit this document to add sections.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signatures List */}
          {signatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PenLine className="h-5 w-5" />
                  Signatures ({signatures.length})
                </CardTitle>
                <CardDescription>
                  {signatureCounts.internal} internal, {signatureCounts.external} external signatures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {signatures.map((sig) => (
                    <div
                      key={sig._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {sig.signatureType === "internal"
                            ? getWorkerName(sig.workerId as string)
                            : String(sig.workerName ?? "Unknown")}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {sig.signatureType === "external" && sig.workerCompany && (
                            <span>{String(sig.workerCompany)} • </span>
                          )}
                          {sig.signatureType === "internal" ? "Internal" : "External"} •{" "}
                          {typeof sig.signedAt === "number" ? formatDateTime(sig.signedAt) : "Unknown"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sig.acknowledgedHazards && sig.acknowledgedControls && sig.acknowledgedPPE && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={getStatusConfig(document.status)} />
                <span className="text-sm capitalize">{document.status.replace("_", " ")}</span>
              </div>
              {document.status === "approved" && document.shareCode && (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--color-text-muted)]">Public Share Link</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                      /w/swms/{document.shareCode}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyShareLink}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Link href={`/w/swms/${document.shareCode}`} target="_blank">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PenLine className="h-4 w-4" />
                Signatures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Total</span>
                  <span className="font-medium">{signatureCounts.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Internal</span>
                  <span className="font-medium">{signatureCounts.internal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">External</span>
                  <span className="font-medium">{signatureCounts.external}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments */}
          {assignments.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned Workers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Acknowledged</span>
                    <span className="font-medium text-green-600">{signedCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Pending</span>
                    <span className={`font-medium ${unsignedCount > 0 ? "text-amber-600" : ""}`}>
                      {unsignedCount}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="space-y-2">
                    {assignments.slice(0, 5).map((assignment) => (
                      <div key={assignment._id} className="flex items-center justify-between text-sm">
                        <span>{assignment.worker?.fullName ?? "Unknown"}</span>
                        {assignment.acknowledgedAt ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    ))}
                    {assignments.length > 5 && (
                      <p className="text-xs text-[var(--color-text-muted)] text-center">
                        +{assignments.length - 5} more workers
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                      {formatDateTime(document.createdAt)}
                    </p>
                  </div>
                </li>
                {document.submittedAt && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Submitted for Review</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(document.submittedAt)}
                      </p>
                    </div>
                  </li>
                )}
                {document.approvedAt && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(document.approvedAt)} by {getWorkerName(document.approvedBy as string)}
                      </p>
                    </div>
                  </li>
                )}
                {document.status === "expired" && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Expired</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {document.expiresAt ? formatDateTime(document.expiresAt) : ""}
                      </p>
                    </div>
                  </li>
                )}
                {document.status === "archived" && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mt-1.5" />
                    <div>
                      <p className="font-medium">Archived</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {formatDateTime(document.updatedAt)}
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
