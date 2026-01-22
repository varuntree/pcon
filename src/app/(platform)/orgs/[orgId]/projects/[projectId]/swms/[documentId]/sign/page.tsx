"use client";

import { use, useState } from "react";
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
import { SWMSSectionsViewer, type SwmsSection } from "@/components/safety/swms-sections-viewer";
import { SignatureCanvas, isSignatureEmpty } from "@/components/safety/signature-canvas";
import { AcknowledgementCheckboxes, useAcknowledgements } from "@/components/safety/acknowledgement-checkboxes";
import {
  ArrowLeft,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useSWMSDocument } from "@/hooks/use-swms-documents";
import { useSWMSSignatures, useHasWorkerSignedSWMS } from "@/hooks/use-swms-signatures";
import { useWorkers } from "@/hooks/use-workers";
import { formatDate } from "@/lib/utils";
import { Id } from "../../../../../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ orgId: string; projectId: string; documentId: string }>;
}

export default function SWMSInternalSigningPage({ params }: PageProps) {
  const { orgId, projectId, documentId } = use(params);

  const { data: document, isLoading: documentLoading } = useSWMSDocument(documentId);
  const { actions: signatureActions } = useSWMSSignatures(documentId);
  const { data: workers } = useWorkers(orgId);

  // Use first worker as current user (in real app, use auth context)
  const currentWorkerId = workers[0]?._id as Id<"workers"> | undefined;
  const currentWorkerName = workers[0]?.fullName ?? "Unknown";

  const { data: hasAlreadySigned, isLoading: signedLoading } = useHasWorkerSignedSWMS(
    documentId,
    currentWorkerId ?? ""
  );

  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const { checkedIds, setCheckedIds, allRequiredChecked } = useAcknowledgements();

  const canSubmit =
    currentWorkerId &&
    allRequiredChecked &&
    !isSignatureEmpty(signatureData) &&
    !isSubmitting &&
    !hasAlreadySigned;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || !signatureData || !currentWorkerId) return;

    setIsSubmitting(true);
    try {
      await signatureActions.createInternal({
        workerId: currentWorkerId,
        signatureData,
        acknowledgedHazards: checkedIds.includes("hazards"),
        acknowledgedControls: checkedIds.includes("controls"),
        acknowledgedPPE: checkedIds.includes("ppe"),
      });

      setIsComplete(true);
      toast.success("SWMS signed successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign SWMS";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = documentLoading || signedLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sign SWMS" subtitle="Loading..." />
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Document not found or not approved
  if (!document || document.status !== "approved") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Cannot Sign SWMS"
          subtitle={!document ? "Document not found" : "Document is not approved for signing"}
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/swms`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to SWMS
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)]">
              {!document
                ? "The requested SWMS document could not be found."
                : "Only approved SWMS documents can be signed. This document is currently in " +
                  document.status.replace("_", " ") +
                  " status."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already signed
  if (hasAlreadySigned && !isComplete) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Already Signed"
          subtitle={document.title}
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${documentId}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View Document
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">You have already signed this SWMS</h2>
            <p className="text-[var(--color-text-muted)]">
              Your signature has already been recorded for this document.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isComplete) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Signature Recorded"
          subtitle={document.title}
          actions={
            <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${documentId}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View Document
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-[var(--color-text-muted)]">
              Your signature has been recorded successfully. You may now proceed with work as outlined in the SWMS.
            </p>
            <div className="mt-6">
              <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${documentId}`}>
                <Button>View Document</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sign SWMS"
        subtitle={
          <div className="flex items-center gap-2">
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {document.swmsNumber}
            </code>
            <span>{document.title}</span>
          </div>
        }
        actions={
          <Link href={`/orgs/${orgId}/projects/${projectId}/swms/${documentId}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Document Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-[var(--color-text-muted)]">
                {document.swmsNumber}
              </span>
            </div>
            <CardTitle className="text-2xl">{document.title}</CardTitle>
            <CardDescription className="space-y-1">
              {document.expiresAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Valid until {formatDate(document.expiresAt)}</span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* SWMS Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SWMS Content</CardTitle>
            <CardDescription>
              Review all sections carefully before signing. Click each section to expand.
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
                No sections defined for this SWMS.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signing Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sign SWMS</CardTitle>
              <CardDescription>
                Signing as: <strong>{currentWorkerName}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Acknowledgements */}
              <div>
                <label className="text-sm font-medium mb-3 block">Acknowledgements *</label>
                <AcknowledgementCheckboxes
                  checkedIds={checkedIds}
                  onCheckedChange={setCheckedIds}
                />
              </div>

              {/* Signature */}
              <div>
                <label className="text-sm font-medium mb-3 block">Signature *</label>
                <SignatureCanvas
                  width={400}
                  height={200}
                  onSignatureChange={setSignatureData}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Sign SWMS"
                )}
              </Button>

              {!canSubmit && !isSubmitting && (
                <p className="text-sm text-[var(--color-text-muted)] text-center">
                  {!allRequiredChecked
                    ? "Please check all acknowledgements"
                    : isSignatureEmpty(signatureData)
                    ? "Please provide your signature"
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
