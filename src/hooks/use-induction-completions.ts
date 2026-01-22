"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoInductionCompletion = Doc<"inductionCompletions"> & {
  _id: Id<"inductionCompletions">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_INDUCTION_COMPLETIONS: DemoInductionCompletion[] = [
  {
    _id: "indcomp1" as Id<"inductionCompletions">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    inductionTypeId: "indtype2" as Id<"inductionTypes">,
    workerId: "worker2" as Id<"workers">,
    status: "completed" as const,
    profile: {
      fullName: "Sarah Chen",
      email: "sarah.chen@buildright.com.au",
      phone: "0412333444",
      trade: "Electrician",
      employer: "BuildRight Construction",
    },
    emergencyContact: {
      name: "John Chen",
      phone: "0412555666",
      relationship: "Spouse" as const,
    },
    signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signatureHash: "Y29tcGxldGlvbjE6MTIzNDU2Nzg5MA==",
    signedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    startedAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
    submittedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    reviewedBy: "worker1" as Id<"workers">,
    reviewedAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
    completedAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 346 * 24 * 60 * 60 * 1000,
    auditLog: [
      {
        actorId: "worker2" as Id<"workers">,
        action: "created",
        timestamp: Date.now() - 21 * 24 * 60 * 60 * 1000,
      },
      {
        action: "started",
        timestamp: Date.now() - 21 * 24 * 60 * 60 * 1000,
      },
      {
        action: "submitted",
        timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
      },
      {
        actorId: "worker1" as Id<"workers">,
        action: "approved",
        timestamp: Date.now() - 19 * 24 * 60 * 60 * 1000,
      },
    ],
    createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "indcomp2" as Id<"inductionCompletions">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    inductionTypeId: "indtype2" as Id<"inductionTypes">,
    workerId: "worker3" as Id<"workers">,
    status: "awaiting_review" as const,
    profile: {
      fullName: "Tom Williams",
      email: "tom.williams@buildright.com.au",
      phone: "0412555666",
      trade: "Laborer",
      employer: "BuildRight Construction",
    },
    emergencyContact: {
      name: "Mary Williams",
      phone: "0412777888",
      relationship: "Parent" as const,
    },
    signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signatureHash: "Y29tcGxldGlvbjI6MTIzNDU2Nzg5MQ==",
    signedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    startedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    submittedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    auditLog: [
      {
        actorId: "worker3" as Id<"workers">,
        action: "created",
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      },
      {
        action: "started",
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      },
      {
        action: "submitted",
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      },
    ],
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "indcomp3" as Id<"inductionCompletions">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    inductionTypeId: "indtype1" as Id<"inductionTypes">,
    status: "in_progress" as const,
    inviteId: "invite1" as Id<"inductionInvites">,
    profile: {
      fullName: "New Contractor",
      email: "contractor@external.com.au",
    },
    startedAt: Date.now() - 2 * 60 * 60 * 1000,
    auditLog: [
      {
        action: "created",
        timestamp: Date.now() - 3 * 60 * 60 * 1000,
      },
      {
        action: "started",
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
      },
    ],
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 60 * 60 * 1000,
  },
];

// Types
export type InductionCompletionStatus =
  | "pending"
  | "in_progress"
  | "awaiting_review"
  | "completed"
  | "expired"
  | "superseded";

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

export interface AuditLogEntry {
  actorId?: Id<"workers">;
  action: string;
  timestamp: number;
  comment?: string;
}

export type InductionCompletionData = DemoInductionCompletion;

export type InductionCompletionWithDetails = DemoInductionCompletion & {
  inductionType: {
    _id: string;
    name: string;
    scope: string;
  } | null;
  worker: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  reviewer: {
    _id: string;
    fullName: string;
  } | null;
};

// Input types
export interface CreateInductionCompletionInput {
  orgId: Id<"orgs">;
  projectId?: Id<"projects">;
  inductionTypeId: Id<"inductionTypes">;
  workerId?: Id<"workers">;
  inviteId?: Id<"inductionInvites">;
  profile?: InductionProfile;
}

export interface UpdateProgressInput {
  id: Id<"inductionCompletions">;
  profile?: InductionProfile;
  emergencyContact?: EmergencyContact;
  responses?: unknown;
  certificationUploads?: CertificationUpload[];
}

export function useInductionCompletions(orgId: Id<"orgs"> | string): {
  data: InductionCompletionData[];
  actions: {
    create: (input: CreateInductionCompletionInput) => Promise<Id<"inductionCompletions">>;
    start: (id: Id<"inductionCompletions">) => Promise<Id<"inductionCompletions">>;
    updateProgress: (input: UpdateProgressInput) => Promise<Id<"inductionCompletions">>;
    submit: (
      id: Id<"inductionCompletions">,
      signatureData: string
    ) => Promise<Id<"inductionCompletions">>;
    approve: (
      id: Id<"inductionCompletions">,
      reviewedBy: Id<"workers">
    ) => Promise<Id<"inductionCompletions">>;
    returnForRevision: (
      id: Id<"inductionCompletions">,
      reviewedBy: Id<"workers">,
      returnReason: string
    ) => Promise<Id<"inductionCompletions">>;
    expire: (id: Id<"inductionCompletions">) => Promise<Id<"inductionCompletions">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const completionsQuery = useQuery(
    api.inductionCompletions.listByStatus,
    convexAvailable
      ? { orgId: orgId as Id<"orgs">, status: "awaiting_review" }
      : "skip"
  );
  const createMutation = useMutation(api.inductionCompletions.create);
  const startMutation = useMutation(api.inductionCompletions.start);
  const updateProgressMutation = useMutation(
    api.inductionCompletions.updateProgress
  );
  const submitMutation = useMutation(api.inductionCompletions.submit);
  const approveMutation = useMutation(api.inductionCompletions.approve);
  const returnForRevisionMutation = useMutation(
    api.inductionCompletions.returnForRevision
  );
  const expireMutation = useMutation(api.inductionCompletions.expire);

  const demoData = DEMO_INDUCTION_COMPLETIONS.filter((ic) => ic.orgId === orgId);
  const data: InductionCompletionData[] = convexAvailable
    ? ((completionsQuery ?? []) as InductionCompletionData[])
    : demoData;
  const isLoading = convexAvailable && completionsQuery === undefined;

  const actions = {
    create: async (
      input: CreateInductionCompletionInput
    ): Promise<Id<"inductionCompletions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-indcomp-new" as Id<"inductionCompletions">;
      }
      return await createMutation(input);
    },
    start: async (
      id: Id<"inductionCompletions">
    ): Promise<Id<"inductionCompletions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - start operation is a no-op");
        return id;
      }
      return await startMutation({ id });
    },
    updateProgress: async (
      input: UpdateProgressInput
    ): Promise<Id<"inductionCompletions">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - updateProgress operation is a no-op"
        );
        return input.id;
      }
      return await updateProgressMutation(input);
    },
    submit: async (
      id: Id<"inductionCompletions">,
      signatureData: string
    ): Promise<Id<"inductionCompletions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - submit operation is a no-op");
        return id;
      }
      return await submitMutation({ id, signatureData });
    },
    approve: async (
      id: Id<"inductionCompletions">,
      reviewedBy: Id<"workers">
    ): Promise<Id<"inductionCompletions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - approve operation is a no-op");
        return id;
      }
      return await approveMutation({ id, reviewedBy });
    },
    returnForRevision: async (
      id: Id<"inductionCompletions">,
      reviewedBy: Id<"workers">,
      returnReason: string
    ): Promise<Id<"inductionCompletions">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - returnForRevision operation is a no-op"
        );
        return id;
      }
      return await returnForRevisionMutation({ id, reviewedBy, returnReason });
    },
    expire: async (
      id: Id<"inductionCompletions">
    ): Promise<Id<"inductionCompletions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - expire operation is a no-op");
        return id;
      }
      return await expireMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useInductionCompletion(id: Id<"inductionCompletions"> | string) {
  const convexAvailable = useConvexAvailable();

  const completionQuery = useQuery(
    api.inductionCompletions.get,
    convexAvailable ? { id: id as Id<"inductionCompletions"> } : "skip"
  );

  const demoCompletion = DEMO_INDUCTION_COMPLETIONS.find((ic) => ic._id === id);
  const data = convexAvailable
    ? (completionQuery ?? null)
    : (demoCompletion ?? null);
  const isLoading = convexAvailable && completionQuery === undefined;

  return { data, isLoading };
}

export function useInductionCompletionWithDetails(
  id: Id<"inductionCompletions"> | string
) {
  const convexAvailable = useConvexAvailable();

  const detailsQuery = useQuery(
    api.inductionCompletions.getWithDetails,
    convexAvailable ? { id: id as Id<"inductionCompletions"> } : "skip"
  );

  const demoCompletion = DEMO_INDUCTION_COMPLETIONS.find((ic) => ic._id === id);
  const demoDetails: InductionCompletionWithDetails | null = demoCompletion
    ? {
        ...demoCompletion,
        inductionType: {
          _id: "indtype2",
          name: "Riverside Apartments Site Induction",
          scope: "site",
        },
        worker: demoCompletion.workerId
          ? {
              _id: demoCompletion.workerId as string,
              fullName: (demoCompletion.profile as unknown as InductionProfile | undefined)?.fullName ?? "Unknown",
              email: (demoCompletion.profile as unknown as InductionProfile | undefined)?.email ?? "",
            }
          : null,
        reviewer: demoCompletion.reviewedBy
          ? {
              _id: demoCompletion.reviewedBy as string,
              fullName: "Mike Johnson",
            }
          : null,
      }
    : null;

  const data = convexAvailable ? (detailsQuery ?? null) : demoDetails;
  const isLoading = convexAvailable && detailsQuery === undefined;

  return { data, isLoading };
}

export function useWorkerInductionCompletions(workerId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const workerQuery = useQuery(
    api.inductionCompletions.listByWorker,
    convexAvailable ? { workerId: workerId as Id<"workers"> } : "skip"
  );

  const demoData = DEMO_INDUCTION_COMPLETIONS.filter(
    (ic) => ic.workerId === workerId
  );
  const data: InductionCompletionData[] = convexAvailable
    ? ((workerQuery ?? []) as InductionCompletionData[])
    : demoData;
  const isLoading = convexAvailable && workerQuery === undefined;

  return { data, isLoading };
}

export function useProjectInductionCompletions(
  projectId: Id<"projects"> | string
) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.inductionCompletions.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const demoData = DEMO_INDUCTION_COMPLETIONS.filter(
    (ic) => ic.projectId === projectId
  );
  const data: InductionCompletionData[] = convexAvailable
    ? ((projectQuery ?? []) as InductionCompletionData[])
    : demoData;
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}

export function useInductionCompletionsByStatus(
  orgId: Id<"orgs"> | string,
  status: InductionCompletionStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.inductionCompletions.listByStatus,
    convexAvailable ? { orgId: orgId as Id<"orgs">, status } : "skip"
  );

  const demoData = DEMO_INDUCTION_COMPLETIONS.filter(
    (ic) => ic.orgId === orgId && ic.status === status
  );
  const data: InductionCompletionData[] = convexAvailable
    ? ((statusQuery ?? []) as InductionCompletionData[])
    : demoData;
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function usePendingReviewInductionCompletions(
  orgId: Id<"orgs"> | string
) {
  const convexAvailable = useConvexAvailable();

  const pendingQuery = useQuery(
    api.inductionCompletions.listPendingReview,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const demoData = DEMO_INDUCTION_COMPLETIONS.filter(
    (ic) => ic.orgId === orgId && ic.status === "awaiting_review"
  );
  const data: InductionCompletionData[] = convexAvailable
    ? ((pendingQuery ?? []) as InductionCompletionData[])
    : demoData;
  const isLoading = convexAvailable && pendingQuery === undefined;

  return { data, isLoading };
}

export function useWorkerInductionStatus(
  workerId: Id<"workers"> | string,
  inductionTypeId: Id<"inductionTypes"> | string
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.inductionCompletions.checkWorkerInduction,
    convexAvailable
      ? {
          workerId: workerId as Id<"workers">,
          inductionTypeId: inductionTypeId as Id<"inductionTypes">,
        }
      : "skip"
  );

  const demoStatus = {
    hasValidInduction: true,
    completion: {
      _id: "indcomp1",
      status: "completed" as const,
      completedAt: Date.now() - 19 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 346 * 24 * 60 * 60 * 1000,
    },
  };

  const data = convexAvailable ? (statusQuery ?? null) : demoStatus;
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}
