"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexAvailable } from "@/components/providers/convex-provider";
import { Id } from "../../convex/_generated/dataModel";

// Demo data for offline mode
const DEMO_INDUCTION_PUBLIC = {
  _id: "invite1",
  shareCode: "INV123ABC456",
  status: "pending" as const,
  targetName: "John Smith",
  targetEmail: "john@example.com",
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  inductionType: {
    _id: "indtype1",
    name: "Site Safety Induction",
    scope: "site" as const,
    steps: [
      {
        id: "step1",
        type: "info" as const,
        title: "Welcome",
        content: { html: "<p>Welcome to the site safety induction. Please review all materials carefully.</p>" },
        order: 1,
      },
      {
        id: "step2",
        type: "acknowledgement" as const,
        title: "Safety Agreement",
        content: { statement: "I agree to follow all site safety rules and procedures." },
        order: 2,
        required: true,
      },
    ],
    validityDays: 365,
  },
  requiredCertifications: [
    {
      _id: "cert1",
      name: "White Card",
      code: "WC",
      category: "license",
    },
  ],
  projectName: "Demo Project",
  orgName: "Demo Organization",
};

// Types
export interface InductionStep {
  id: string;
  type: "info" | "video" | "quiz" | "acknowledgement" | "document_upload" | "photo_capture";
  title: string;
  content: Record<string, unknown>;
  order: number;
  required?: boolean;
}

export interface PublicInductionData {
  _id: string;
  shareCode: string;
  status: "pending" | "awaiting_review" | "completed";
  targetName?: string;
  targetEmail?: string;
  expiresAt?: number;
  inductionType: {
    _id: string;
    name: string;
    scope: "company" | "site" | "task" | "plant";
    steps: InductionStep[];
    validityDays?: number;
  } | null;
  requiredCertifications: Array<{
    _id: string;
    name: string;
    code: string;
    category: string;
  }>;
  projectName: string;
  orgName: string;
}

export interface InductionProfile {
  fullName: string;
  email: string;
  phone?: string;
  trade?: string;
  employer?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: "Spouse" | "Parent" | "Sibling" | "Other";
}

export interface CertificationUpload {
  certificationTypeId: Id<"certificationTypes">;
  certNumber: string;
  expiryDate?: number;
  frontPhotoId?: Id<"_storage">;
  backPhotoId?: Id<"_storage">;
}

export interface SubmitWizardInput {
  shareCode: string;
  profile: InductionProfile;
  emergencyContact: EmergencyContact;
  responses?: Record<string, unknown>;
  certificationUploads?: CertificationUpload[];
  signatureData: string;
}

export interface SubmitWizardResult {
  success: boolean;
  completionId?: string;
  message: string;
}

export interface CompletionStatus {
  found: boolean;
  inviteStatus?: string;
  completionStatus?: string | null;
  completedAt?: number | null;
}

export function usePublicInduction(shareCode: string): {
  data: PublicInductionData | null;
  isLoading: boolean;
  error: string | null;
} {
  const convexAvailable = useConvexAvailable();

  const inviteQuery = useQuery(
    api.inductionPublic.getByShareCode,
    convexAvailable && shareCode ? { shareCode } : "skip"
  );

  const error = inviteQuery === null ? "Invitation not found or expired" : null;

  const data = convexAvailable
    ? inviteQuery
      ? (inviteQuery as unknown as PublicInductionData)
      : null
    : shareCode === "INV123ABC456"
    ? DEMO_INDUCTION_PUBLIC
    : null;

  const isLoading = convexAvailable && inviteQuery === undefined;

  return { data, isLoading, error };
}

export function useInductionCompletionStatus(shareCode: string): {
  data: CompletionStatus | null;
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.inductionPublic.getCompletionStatus,
    convexAvailable && shareCode ? { shareCode } : "skip"
  );

  const data = convexAvailable
    ? statusQuery ?? null
    : { found: true, inviteStatus: "pending" };

  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useSubmitInductionWizard(): {
  submitWizard: (input: SubmitWizardInput) => Promise<SubmitWizardResult>;
  isSubmitting: boolean;
} {
  const convexAvailable = useConvexAvailable();
  const submitMutation = useMutation(api.inductionPublic.submitWizard);

  const submitWizard = async (input: SubmitWizardInput): Promise<SubmitWizardResult> => {
    if (!convexAvailable) {
      console.warn("Convex not configured - submitWizard is a no-op");
      return {
        success: true,
        completionId: "demo-completion-new",
        message: "Thank you for completing the induction (demo mode).",
      };
    }

    const result = await submitMutation(input);
    return result as SubmitWizardResult;
  };

  return {
    submitWizard,
    isSubmitting: false,
  };
}
