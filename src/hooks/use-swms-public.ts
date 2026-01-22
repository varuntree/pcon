"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexAvailable } from "@/components/providers/convex-provider";
import { SWMSSection } from "./use-swms-templates";

// Demo data for offline mode
const DEMO_SWMS_PUBLIC = {
  _id: "swmsd1",
  title: "Concrete Pour - Level 3",
  swmsNumber: "SWMS-001",
  sections: [
    {
      id: "s1",
      type: "title" as const,
      title: "SWMS Title",
      content: { text: "Concrete Pour - Level 3" },
      order: 1,
    },
    {
      id: "s2",
      type: "hazards" as const,
      title: "Hazards",
      content: { items: ["Wet concrete burns", "Slips and trips", "Moving plant"] },
      order: 2,
    },
    {
      id: "s3",
      type: "controls" as const,
      title: "Controls",
      content: { items: ["Wear protective clothing", "Maintain housekeeping", "Follow exclusion zones"] },
      order: 3,
    },
    {
      id: "s4",
      type: "ppe" as const,
      title: "PPE Requirements",
      content: { items: ["Hard hat", "Safety glasses", "Rubber boots", "Gloves"] },
      order: 4,
    },
    {
      id: "s5",
      type: "emergency" as const,
      title: "Emergency Procedures",
      content: { text: "In case of emergency, evacuate to the muster point and contact the site supervisor." },
      order: 5,
    },
  ],
  projectName: "Demo Project",
  orgName: "Demo Organization",
  approvedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  expiresAt: Date.now() + 358 * 24 * 60 * 60 * 1000,
};

// Types
export interface PublicSWMSDocument {
  _id: string;
  title: string;
  swmsNumber: string;
  sections: SWMSSection[];
  projectName: string;
  orgName: string;
  approvedAt?: number;
  expiresAt?: number;
}

export interface SignExternalInput {
  shareCode: string;
  workerName: string;
  workerCompany?: string;
  signatureData: string;
  acknowledgedHazards: boolean;
  acknowledgedControls: boolean;
  acknowledgedPPE: boolean;
}

export interface SignExternalResult {
  success: boolean;
  signatureId?: string;
  message: string;
}

export function usePublicSWMS(shareCode: string): {
  data: PublicSWMSDocument | null;
  signatureCount: number;
  isLoading: boolean;
  error: string | null;
} {
  const convexAvailable = useConvexAvailable();

  const documentQuery = useQuery(
    api.swmsPublic.getByShareCode,
    convexAvailable && shareCode ? { shareCode } : "skip"
  );

  const countQuery = useQuery(
    api.swmsPublic.getSignatureCount,
    convexAvailable && shareCode ? { shareCode } : "skip"
  );

  // Handle errors from the query
  const error = documentQuery === null ? "Document not found or unavailable" : null;

  const data = convexAvailable
    ? documentQuery
      ? (documentQuery as unknown as PublicSWMSDocument)
      : null
    : shareCode === "ABC123DEF456"
    ? DEMO_SWMS_PUBLIC
    : null;

  const signatureCount = convexAvailable
    ? (countQuery?.count ?? 0)
    : 3;

  const isLoading = convexAvailable && documentQuery === undefined;

  return { data, signatureCount, isLoading, error };
}

export function useSignExternalSWMS(): {
  signExternal: (input: SignExternalInput) => Promise<SignExternalResult>;
  isSubmitting: boolean;
} {
  const convexAvailable = useConvexAvailable();
  const signMutation = useMutation(api.swmsPublic.signExternal);

  const signExternal = async (input: SignExternalInput): Promise<SignExternalResult> => {
    if (!convexAvailable) {
      console.warn("Convex not configured - signExternal is a no-op");
      return {
        success: true,
        signatureId: "demo-sig-new",
        message: "Thank you for signing the SWMS (demo mode).",
      };
    }

    const result = await signMutation(input);
    return result as SignExternalResult;
  };

  return {
    signExternal,
    isSubmitting: false, // Convex mutations handle their own loading state
  };
}
