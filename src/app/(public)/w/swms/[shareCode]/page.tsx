"use client";

import { use, useState } from "react";
import { usePublicSWMS, useSignExternalSWMS } from "@/hooks/use-swms-public";
import { SWMSSectionsViewer, type SwmsSection } from "@/components/safety/swms-sections-viewer";
import { SignatureCanvas, isSignatureEmpty } from "@/components/safety/signature-canvas";
import { AcknowledgementCheckboxes, useAcknowledgements } from "@/components/safety/acknowledgement-checkboxes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle, FileText, Building2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ shareCode: string }>;
}

export default function PublicSWMSSigningPage({ params }: PageProps) {
  const { shareCode } = use(params);
  const { data: swmsDocument, signatureCount, isLoading, error } = usePublicSWMS(shareCode);
  const { signExternal } = useSignExternalSWMS();

  const [workerName, setWorkerName] = useState("");
  const [workerCompany, setWorkerCompany] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const { checkedIds, setCheckedIds, allRequiredChecked } = useAcknowledgements();

  const canSubmit =
    workerName.trim().length > 0 &&
    allRequiredChecked &&
    !isSignatureEmpty(signatureData) &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit || !signatureData) return;

    setIsSubmitting(true);
    try {
      const result = await signExternal({
        shareCode,
        workerName: workerName.trim(),
        workerCompany: workerCompany.trim() || undefined,
        signatureData,
        acknowledgedHazards: checkedIds.includes("hazards"),
        acknowledgedControls: checkedIds.includes("controls"),
        acknowledgedPPE: checkedIds.includes("ppe"),
      });

      if (result.success) {
        setIsComplete(true);
        toast.success(result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign SWMS";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading SWMS document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !swmsDocument) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Document Not Available</CardTitle>
            <CardDescription>
              {error || "This SWMS document is not available for signing. It may have been archived, expired, or the link is invalid."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Thank You!</CardTitle>
            <CardDescription className="text-base">
              Your signature has been recorded successfully. You may now proceed with work as outlined in the SWMS.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Total signatures on this document: {signatureCount + 1}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {swmsDocument.swmsNumber}
              </span>
            </div>
            <CardTitle className="text-2xl">{swmsDocument.title}</CardTitle>
            <CardDescription className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{swmsDocument.orgName} - {swmsDocument.projectName}</span>
              </div>
              {swmsDocument.expiresAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Valid until {formatDate(swmsDocument.expiresAt)}</span>
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
              Review all sections before signing. Click each section to expand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SWMSSectionsViewer
              sections={swmsDocument.sections as SwmsSection[]}
              defaultExpanded={false}
            />
          </CardContent>
        </Card>

        {/* Signing Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sign SWMS</CardTitle>
              <CardDescription>
                Complete all fields below to acknowledge and sign this SWMS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Worker Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workerName">Your Name *</Label>
                  <Input
                    id="workerName"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="workerCompany">Company (optional)</Label>
                  <Input
                    id="workerCompany"
                    value={workerCompany}
                    onChange={(e) => setWorkerCompany(e.target.value)}
                    placeholder="Enter your company name"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Acknowledgements */}
              <div>
                <Label className="mb-3 block">Acknowledgements *</Label>
                <AcknowledgementCheckboxes
                  checkedIds={checkedIds}
                  onCheckedChange={setCheckedIds}
                />
              </div>

              {/* Signature */}
              <div>
                <Label className="mb-3 block">Signature *</Label>
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
                <p className="text-sm text-muted-foreground text-center">
                  {!workerName.trim()
                    ? "Please enter your name"
                    : !allRequiredChecked
                    ? "Please check all acknowledgements"
                    : isSignatureEmpty(signatureData)
                    ? "Please provide your signature"
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          {signatureCount} signature{signatureCount !== 1 ? "s" : ""} recorded on this document
        </p>
      </div>
    </div>
  );
}
