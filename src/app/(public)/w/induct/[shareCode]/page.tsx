"use client";

import { use, useState } from "react";
import {
  usePublicInduction,
  useSubmitInductionWizard,
  type InductionProfile,
  type EmergencyContact,
} from "@/hooks/use-induction-public";
import {
  InductionStepIndicator,
  useInductionSteps,
} from "@/components/safety/induction-step-indicator";
import {
  ContentBlockRenderer,
  useContentBlockResponses,
  type ContentBlock,
  type BlockResponse,
} from "@/components/safety/content-block-renderer";
import {
  CertUploadField,
  useCertificationUploads,
} from "@/components/safety/cert-upload-field";
import {
  SignatureCanvas,
  isSignatureEmpty,
} from "@/components/safety/signature-canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { INDUCTION_STEP_LABELS, type InductionStep } from "@/lib/constants";

interface PageProps {
  params: Promise<{ shareCode: string }>;
}

export default function PublicInductionWizardPage({ params }: PageProps) {
  const { shareCode } = use(params);
  const {
    data: inductionData,
    isLoading,
    error,
  } = usePublicInduction(shareCode);
  const { submitWizard } = useSubmitInductionWizard();

  // Wizard state
  const {
    currentStep,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    progress,
  } = useInductionSteps("profile");

  // Form state
  const [profile, setProfile] = useState<InductionProfile>({
    fullName: "",
    email: "",
    phone: "",
    trade: "",
    employer: "",
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "Other",
  });

  // Content blocks state - cast through unknown to handle type differences between API and component
  const contentBlocks: ContentBlock[] =
    (inductionData?.inductionType?.steps as unknown as ContentBlock[]) ?? [];
  const { responses, setResponses, allComplete: allContentComplete } =
    useContentBlockResponses(contentBlocks);

  // Certifications state
  const requiredCerts =
    inductionData?.requiredCertifications?.map((c) => ({
      id: c._id,
      name: c.name,
      required: true,
    })) ?? [];
  const { entries: certEntries, updateEntry, allComplete: allCertsComplete } =
    useCertificationUploads(requiredCerts);

  // Signature state
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Validation helpers
  const isProfileValid =
    profile.fullName.trim().length > 0 && profile.email.trim().length > 0;

  const isEmergencyValid =
    emergencyContact.name.trim().length > 0 &&
    emergencyContact.phone.trim().length > 0;

  const isContentValid = contentBlocks.length === 0 || allContentComplete;
  const isCertsValid = requiredCerts.length === 0 || allCertsComplete;
  const isSignatureValid = !isSignatureEmpty(signatureData);

  const canProceed = (step: InductionStep): boolean => {
    switch (step) {
      case "profile":
        return isProfileValid;
      case "emergency":
        return isEmergencyValid;
      case "content":
        return isContentValid;
      case "tickets":
        return isCertsValid;
      case "signature":
        return isSignatureValid;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed(currentStep)) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!signatureData || !canProceed(currentStep)) return;

    setIsSubmitting(true);
    try {
      const result = await submitWizard({
        shareCode,
        profile,
        emergencyContact,
        responses: responses.reduce((acc, r) => {
          acc[r.blockId] = r;
          return acc;
        }, {} as Record<string, BlockResponse>),
        signatureData,
      });

      if (result.success) {
        setIsComplete(true);
        toast.success(result.message);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit induction";
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
          <p className="text-muted-foreground">Loading induction...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !inductionData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invitation Not Available</CardTitle>
            <CardDescription>
              {error ||
                "This induction invitation is not available. It may have expired or already been completed."}
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
            <CardTitle>Induction Submitted!</CardTitle>
            <CardDescription className="text-base">
              Thank you for completing the induction. Your submission is now
              awaiting review. You will be notified once it has been approved.
            </CardDescription>
          </CardHeader>
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
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {inductionData.inductionType?.scope?.toUpperCase()} INDUCTION
              </span>
            </div>
            <CardTitle className="text-2xl">
              {inductionData.inductionType?.name}
            </CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>
                  {inductionData.orgName} - {inductionData.projectName}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {INDUCTION_STEP_LABELS[currentStep]}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(progress)}% complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <InductionStepIndicator
                currentStep={currentStep}
                completedSteps={completedSteps}
                allowNavigation
                onStepClick={goToStep}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {INDUCTION_STEP_LABELS[currentStep]}
            </CardTitle>
            <CardDescription>
              {currentStep === "profile" &&
                "Enter your personal details for the induction record."}
              {currentStep === "emergency" &&
                "Provide emergency contact information."}
              {currentStep === "content" &&
                "Review and complete all induction content."}
              {currentStep === "tickets" &&
                "Upload your required certifications and tickets."}
              {currentStep === "signature" &&
                "Sign to confirm your completion of this induction."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Step */}
            {currentStep === "profile" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="trade">Trade</Label>
                  <Input
                    id="trade"
                    value={profile.trade}
                    onChange={(e) =>
                      setProfile({ ...profile, trade: e.target.value })
                    }
                    placeholder="e.g., Electrician, Carpenter"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="employer">Employer</Label>
                  <Input
                    id="employer"
                    value={profile.employer}
                    onChange={(e) =>
                      setProfile({ ...profile, employer: e.target.value })
                    }
                    placeholder="Enter your employer/company"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {/* Emergency Contact Step */}
            {currentStep === "emergency" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergencyName">Contact Name *</Label>
                  <Input
                    id="emergencyName"
                    value={emergencyContact.name}
                    onChange={(e) =>
                      setEmergencyContact({
                        ...emergencyContact,
                        name: e.target.value,
                      })
                    }
                    placeholder="Emergency contact's full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) =>
                      setEmergencyContact({
                        ...emergencyContact,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Emergency contact's phone"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select
                    value={emergencyContact.relationship}
                    onValueChange={(
                      value: "Spouse" | "Parent" | "Sibling" | "Other"
                    ) =>
                      setEmergencyContact({
                        ...emergencyContact,
                        relationship: value,
                      })
                    }
                  >
                    <SelectTrigger id="relationship" className="mt-1">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Content Step */}
            {currentStep === "content" && (
              <div>
                {contentBlocks.length > 0 ? (
                  <ContentBlockRenderer
                    blocks={contentBlocks}
                    responses={responses}
                    onResponsesChange={setResponses}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No content to review. You may proceed to the next step.
                  </p>
                )}
              </div>
            )}

            {/* Tickets Step */}
            {currentStep === "tickets" && (
              <div className="space-y-4">
                {certEntries.length > 0 ? (
                  certEntries.map((entry) => (
                    <CertUploadField
                      key={entry.certificationTypeId}
                      certificationTypeId={entry.certificationTypeId}
                      certificationTypeName={entry.certificationTypeName}
                      required={entry.required}
                      value={entry.data}
                      onChange={(data) =>
                        updateEntry(entry.certificationTypeId, data)
                      }
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No certifications required. You may proceed to the next
                    step.
                  </p>
                )}
              </div>
            )}

            {/* Signature Step */}
            {currentStep === "signature" && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    By signing below, I confirm that:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>
                      I have read and understood all induction content
                    </li>
                    <li>
                      The information I have provided is true and accurate
                    </li>
                    <li>
                      I agree to follow all safety requirements and procedures
                    </li>
                  </ul>
                </div>
                <div>
                  <Label className="mb-3 block">Your Signature *</Label>
                  <SignatureCanvas
                    width={400}
                    height={200}
                    onSignatureChange={setSignatureData}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={isFirstStep}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex-1" />

          {!isLastStep ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed(currentStep)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isSignatureValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Induction"
              )}
            </Button>
          )}
        </div>

        {!canProceed(currentStep) && (
          <p className="text-sm text-muted-foreground text-center">
            {currentStep === "profile" && "Please enter your name and email"}
            {currentStep === "emergency" &&
              "Please enter emergency contact name and phone"}
            {currentStep === "content" &&
              "Please complete all content blocks"}
            {currentStep === "tickets" &&
              "Please upload all required certifications"}
            {currentStep === "signature" && "Please provide your signature"}
          </p>
        )}
      </div>
    </div>
  );
}
