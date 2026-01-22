"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoSWMSSignature = Doc<"swmsSignatures"> & {
  _id: Id<"swmsSignatures">;
  _creationTime: number;
};

// Demo assignment type for enriched data
type DemoSWMSAssignment = Doc<"swmsAssignments"> & {
  _id: Id<"swmsAssignments">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_SWMS_SIGNATURES: DemoSWMSSignature[] = [
  {
    _id: "swmssig1" as Id<"swmsSignatures">,
    _creationTime: Date.now(),
    swmsDocumentId: "swmsd1" as Id<"swmsDocuments">,
    signatureType: "internal" as const,
    workerId: "worker1" as Id<"workers">,
    signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signatureHash: "c2lnbmF0dXJlMToxMjM0NTY3ODkw",
    acknowledgedHazards: true,
    acknowledgedControls: true,
    acknowledgedPPE: true,
    signedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "swmssig2" as Id<"swmsSignatures">,
    _creationTime: Date.now(),
    swmsDocumentId: "swmsd1" as Id<"swmsDocuments">,
    signatureType: "internal" as const,
    workerId: "worker2" as Id<"workers">,
    signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signatureHash: "c2lnbmF0dXJlMjoxMjM0NTY3ODkx",
    acknowledgedHazards: true,
    acknowledgedControls: true,
    acknowledgedPPE: true,
    signedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "swmssig3" as Id<"swmsSignatures">,
    _creationTime: Date.now(),
    swmsDocumentId: "swmsd1" as Id<"swmsDocuments">,
    signatureType: "external" as const,
    workerName: "John Smith",
    workerCompany: "Smith Electrical Pty Ltd",
    signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signatureHash: "c2lnbmF0dXJlMzoxMjM0NTY3ODky",
    acknowledgedHazards: true,
    acknowledgedControls: true,
    acknowledgedPPE: true,
    signedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
];

const DEMO_SWMS_ASSIGNMENTS: (DemoSWMSAssignment & {
  worker?: { _id: string; fullName: string; email: string; role?: string };
  document?: { _id: string; title: string; swmsNumber: string; status: string };
})[] = [
  {
    _id: "swmsasn1" as Id<"swmsAssignments">,
    _creationTime: Date.now(),
    swmsDocumentId: "swmsd1" as Id<"swmsDocuments">,
    workerId: "worker1" as Id<"workers">,
    assignedBy: "worker1" as Id<"workers">,
    assignedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    acknowledgedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
    worker: {
      _id: "worker1",
      fullName: "Mike Johnson",
      email: "mike.johnson@buildright.com.au",
      role: "site_supervisor",
    },
    document: {
      _id: "swmsd1",
      title: "Concrete Pour - Level 3",
      swmsNumber: "SWMS-001",
      status: "approved",
    },
  },
  {
    _id: "swmsasn2" as Id<"swmsAssignments">,
    _creationTime: Date.now(),
    swmsDocumentId: "swmsd1" as Id<"swmsDocuments">,
    workerId: "worker2" as Id<"workers">,
    assignedBy: "worker1" as Id<"workers">,
    assignedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    acknowledgedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    worker: {
      _id: "worker2",
      fullName: "Sarah Chen",
      email: "sarah.chen@buildright.com.au",
      role: "tradesperson",
    },
    document: {
      _id: "swmsd1",
      title: "Concrete Pour - Level 3",
      swmsNumber: "SWMS-001",
      status: "approved",
    },
  },
  {
    _id: "swmsasn3" as Id<"swmsAssignments">,
    _creationTime: Date.now(),
    swmsDocumentId: "swmsd1" as Id<"swmsDocuments">,
    workerId: "worker3" as Id<"workers">,
    assignedBy: "worker1" as Id<"workers">,
    assignedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    worker: {
      _id: "worker3",
      fullName: "Tom Williams",
      email: "tom.williams@buildright.com.au",
      role: "laborer",
    },
    document: {
      _id: "swmsd1",
      title: "Concrete Pour - Level 3",
      swmsNumber: "SWMS-001",
      status: "approved",
    },
  },
];

// Types
export type SWMSSignatureType = "internal" | "external";
export type SWMSSignatureData = DemoSWMSSignature;
export type SWMSAssignmentData = typeof DEMO_SWMS_ASSIGNMENTS[0];

// Input types
export interface CreateInternalSignatureInput {
  swmsDocumentId: Id<"swmsDocuments">;
  workerId: Id<"workers">;
  signatureData: string;
  acknowledgedHazards: boolean;
  acknowledgedControls: boolean;
  acknowledgedPPE: boolean;
}

export interface CreateExternalSignatureInput {
  swmsDocumentId: Id<"swmsDocuments">;
  workerName: string;
  workerCompany?: string;
  signatureData: string;
  acknowledgedHazards: boolean;
  acknowledgedControls: boolean;
  acknowledgedPPE: boolean;
}

// ============================================================
// SWMS Signatures Hooks
// ============================================================

export function useSWMSSignatures(swmsDocumentId: Id<"swmsDocuments"> | string): {
  data: SWMSSignatureData[];
  actions: {
    createInternal: (
      input: Omit<CreateInternalSignatureInput, "swmsDocumentId">
    ) => Promise<Id<"swmsSignatures">>;
    createExternal: (
      input: Omit<CreateExternalSignatureInput, "swmsDocumentId">
    ) => Promise<Id<"swmsSignatures">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const signaturesQuery = useQuery(
    api.swmsSignatures.listByDocument,
    convexAvailable
      ? { swmsDocumentId: swmsDocumentId as Id<"swmsDocuments"> }
      : "skip"
  );
  const createInternalMutation = useMutation(api.swmsSignatures.createInternal);
  const createExternalMutation = useMutation(api.swmsSignatures.createExternal);

  const demoData = DEMO_SWMS_SIGNATURES.filter(
    (s) => s.swmsDocumentId === swmsDocumentId
  );
  const data: SWMSSignatureData[] = convexAvailable
    ? ((signaturesQuery ?? []) as SWMSSignatureData[])
    : demoData;
  const isLoading = convexAvailable && signaturesQuery === undefined;

  const actions = {
    createInternal: async (
      input: Omit<CreateInternalSignatureInput, "swmsDocumentId">
    ): Promise<Id<"swmsSignatures">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - createInternal operation is a no-op"
        );
        return "demo-swmssig-new" as Id<"swmsSignatures">;
      }
      return await createInternalMutation({
        ...input,
        swmsDocumentId: swmsDocumentId as Id<"swmsDocuments">,
      });
    },
    createExternal: async (
      input: Omit<CreateExternalSignatureInput, "swmsDocumentId">
    ): Promise<Id<"swmsSignatures">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - createExternal operation is a no-op"
        );
        return "demo-swmssig-new" as Id<"swmsSignatures">;
      }
      return await createExternalMutation({
        ...input,
        swmsDocumentId: swmsDocumentId as Id<"swmsDocuments">,
      });
    },
  };

  return { data, actions, isLoading };
}

export function useSWMSSignature(id: Id<"swmsSignatures"> | string) {
  const convexAvailable = useConvexAvailable();

  const signatureQuery = useQuery(
    api.swmsSignatures.get,
    convexAvailable ? { id: id as Id<"swmsSignatures"> } : "skip"
  );

  const demoSignature = DEMO_SWMS_SIGNATURES.find((s) => s._id === id);
  const data = convexAvailable
    ? (signatureQuery ?? null)
    : (demoSignature ?? null);
  const isLoading = convexAvailable && signatureQuery === undefined;

  return { data, isLoading };
}

export function useWorkerSWMSSignatures(workerId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const signaturesQuery = useQuery(
    api.swmsSignatures.listByWorker,
    convexAvailable ? { workerId: workerId as Id<"workers"> } : "skip"
  );

  const demoData = DEMO_SWMS_SIGNATURES.filter((s) => s.workerId === workerId);
  const data: SWMSSignatureData[] = convexAvailable
    ? ((signaturesQuery ?? []) as SWMSSignatureData[])
    : demoData;
  const isLoading = convexAvailable && signaturesQuery === undefined;

  return { data, isLoading };
}

export function useHasWorkerSignedSWMS(
  swmsDocumentId: Id<"swmsDocuments"> | string,
  workerId: Id<"workers"> | string
) {
  const convexAvailable = useConvexAvailable();

  const hasSignedQuery = useQuery(
    api.swmsSignatures.hasWorkerSigned,
    convexAvailable
      ? {
          swmsDocumentId: swmsDocumentId as Id<"swmsDocuments">,
          workerId: workerId as Id<"workers">,
        }
      : "skip"
  );

  const demoHasSigned = DEMO_SWMS_SIGNATURES.some(
    (s) => s.swmsDocumentId === swmsDocumentId && s.workerId === workerId
  );
  const data = convexAvailable ? (hasSignedQuery ?? false) : demoHasSigned;
  const isLoading = convexAvailable && hasSignedQuery === undefined;

  return { data, isLoading };
}

export function useSWMSSignatureCounts(swmsDocumentId: Id<"swmsDocuments"> | string) {
  const convexAvailable = useConvexAvailable();

  const countsQuery = useQuery(
    api.swmsSignatures.getCountsByType,
    convexAvailable
      ? { swmsDocumentId: swmsDocumentId as Id<"swmsDocuments"> }
      : "skip"
  );

  const demoData = DEMO_SWMS_SIGNATURES.filter(
    (s) => s.swmsDocumentId === swmsDocumentId
  );
  const demoCounts = {
    total: demoData.length,
    internal: demoData.filter((s) => s.signatureType === "internal").length,
    external: demoData.filter((s) => s.signatureType === "external").length,
  };
  const data = convexAvailable ? (countsQuery ?? demoCounts) : demoCounts;
  const isLoading = convexAvailable && countsQuery === undefined;

  return { data, isLoading };
}

// ============================================================
// SWMS Assignments Hooks
// ============================================================

export function useSWMSAssignments(swmsDocumentId: Id<"swmsDocuments"> | string): {
  data: SWMSAssignmentData[];
  actions: {
    assign: (
      workerId: Id<"workers">,
      assignedBy: Id<"workers">
    ) => Promise<Id<"swmsAssignments">>;
    assignBatch: (
      workerIds: Id<"workers">[],
      assignedBy: Id<"workers">
    ) => Promise<{ created: string[]; skipped: string[] }>;
    acknowledge: (id: Id<"swmsAssignments">) => Promise<Id<"swmsAssignments">>;
    unassign: (workerId: Id<"workers">) => Promise<Id<"swmsAssignments">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const assignmentsQuery = useQuery(
    api.swmsAssignments.listByDocument,
    convexAvailable
      ? { swmsDocumentId: swmsDocumentId as Id<"swmsDocuments"> }
      : "skip"
  );
  const assignMutation = useMutation(api.swmsAssignments.assign);
  const assignBatchMutation = useMutation(api.swmsAssignments.assignBatch);
  const acknowledgeMutation = useMutation(api.swmsAssignments.acknowledge);
  const unassignMutation = useMutation(api.swmsAssignments.unassign);

  const demoData = DEMO_SWMS_ASSIGNMENTS.filter(
    (a) => a.swmsDocumentId === swmsDocumentId
  );
  const data: SWMSAssignmentData[] = convexAvailable
    ? ((assignmentsQuery ?? []) as SWMSAssignmentData[])
    : demoData;
  const isLoading = convexAvailable && assignmentsQuery === undefined;

  const actions = {
    assign: async (
      workerId: Id<"workers">,
      assignedBy: Id<"workers">
    ): Promise<Id<"swmsAssignments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - assign operation is a no-op");
        return "demo-swmsasn-new" as Id<"swmsAssignments">;
      }
      return await assignMutation({
        swmsDocumentId: swmsDocumentId as Id<"swmsDocuments">,
        workerId,
        assignedBy,
      });
    },
    assignBatch: async (
      workerIds: Id<"workers">[],
      assignedBy: Id<"workers">
    ): Promise<{ created: string[]; skipped: string[] }> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - assignBatch operation is a no-op");
        return { created: [], skipped: workerIds };
      }
      return await assignBatchMutation({
        swmsDocumentId: swmsDocumentId as Id<"swmsDocuments">,
        workerIds,
        assignedBy,
      });
    },
    acknowledge: async (
      id: Id<"swmsAssignments">
    ): Promise<Id<"swmsAssignments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - acknowledge operation is a no-op");
        return id;
      }
      return await acknowledgeMutation({ id });
    },
    unassign: async (
      workerId: Id<"workers">
    ): Promise<Id<"swmsAssignments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - unassign operation is a no-op");
        return "demo-swmsasn-deleted" as Id<"swmsAssignments">;
      }
      return await unassignMutation({
        swmsDocumentId: swmsDocumentId as Id<"swmsDocuments">,
        workerId,
      });
    },
  };

  return { data, actions, isLoading };
}

export function useWorkerSWMSAssignments(workerId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const assignmentsQuery = useQuery(
    api.swmsAssignments.listByWorker,
    convexAvailable ? { workerId: workerId as Id<"workers"> } : "skip"
  );

  const demoData = DEMO_SWMS_ASSIGNMENTS.filter((a) => a.workerId === workerId);
  const data: SWMSAssignmentData[] = convexAvailable
    ? ((assignmentsQuery ?? []) as SWMSAssignmentData[])
    : demoData;
  const isLoading = convexAvailable && assignmentsQuery === undefined;

  return { data, isLoading };
}

export function useWorkerUnsignedSWMS(workerId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const unsignedQuery = useQuery(
    api.swmsAssignments.listUnsignedByWorker,
    convexAvailable ? { workerId: workerId as Id<"workers"> } : "skip"
  );

  const demoData = DEMO_SWMS_ASSIGNMENTS.filter(
    (a) => a.workerId === workerId && !a.acknowledgedAt
  );
  const data: SWMSAssignmentData[] = convexAvailable
    ? ((unsignedQuery ?? []) as SWMSAssignmentData[])
    : demoData;
  const isLoading = convexAvailable && unsignedQuery === undefined;

  return { data, isLoading };
}

export function useSWMSUnsignedWorkers(swmsDocumentId: Id<"swmsDocuments"> | string) {
  const convexAvailable = useConvexAvailable();

  const unsignedQuery = useQuery(
    api.swmsAssignments.listUnsignedWorkers,
    convexAvailable
      ? { swmsDocumentId: swmsDocumentId as Id<"swmsDocuments"> }
      : "skip"
  );

  const demoData = DEMO_SWMS_ASSIGNMENTS.filter(
    (a) =>
      a.swmsDocumentId === swmsDocumentId &&
      !DEMO_SWMS_SIGNATURES.some(
        (s) => s.swmsDocumentId === swmsDocumentId && s.workerId === a.workerId
      )
  );
  const data: SWMSAssignmentData[] = convexAvailable
    ? ((unsignedQuery ?? []) as SWMSAssignmentData[])
    : demoData;
  const isLoading = convexAvailable && unsignedQuery === undefined;

  return { data, isLoading };
}

export function useIsWorkerAssignedToSWMS(
  swmsDocumentId: Id<"swmsDocuments"> | string,
  workerId: Id<"workers"> | string
) {
  const convexAvailable = useConvexAvailable();

  const isAssignedQuery = useQuery(
    api.swmsAssignments.isAssigned,
    convexAvailable
      ? {
          swmsDocumentId: swmsDocumentId as Id<"swmsDocuments">,
          workerId: workerId as Id<"workers">,
        }
      : "skip"
  );

  const demoIsAssigned = DEMO_SWMS_ASSIGNMENTS.some(
    (a) => a.swmsDocumentId === swmsDocumentId && a.workerId === workerId
  );
  const data = convexAvailable ? (isAssignedQuery ?? false) : demoIsAssigned;
  const isLoading = convexAvailable && isAssignedQuery === undefined;

  return { data, isLoading };
}
