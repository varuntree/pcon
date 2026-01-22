"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoPermitInstance = Doc<"permitInstances"> & {
  _id: Id<"permitInstances">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_PERMIT_INSTANCES: DemoPermitInstance[] = [
  {
    _id: "perm1" as Id<"permitInstances">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    permitTypeId: "permtype1" as Id<"permitTypes">,
    permitNumber: "PERMIT-001",
    status: "active" as const,
    applicantId: "worker1" as Id<"workers">,
    workDescription: "Welding work on structural steel Level 4",
    location: "Building A, Level 4, Grid D3-E4",
    requestedStartAt: Date.now(),
    requestedEndAt: Date.now() + 8 * 60 * 60 * 1000,
    validFrom: Date.now(),
    validTo: Date.now() + 8 * 60 * 60 * 1000,
    submittedAt: Date.now() - 2 * 60 * 60 * 1000,
    approvedAt: Date.now() - 1 * 60 * 60 * 1000,
    approvedBy: "worker1" as Id<"workers">,
    activatedAt: Date.now(),
    formData: {
      location: "Building A, Level 4",
      equipment: ["Welding machine"],
      firewatch: true,
    },
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
    updatedAt: Date.now(),
  },
  {
    _id: "perm2" as Id<"permitInstances">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    permitTypeId: "permtype2" as Id<"permitTypes">,
    permitNumber: "PERMIT-002",
    status: "submitted" as const,
    applicantId: "worker2" as Id<"workers">,
    workDescription: "Entry to lift pit for maintenance",
    location: "Lift Shaft 2, Basement Level",
    requestedStartAt: Date.now() + 24 * 60 * 60 * 1000,
    requestedEndAt: Date.now() + 28 * 60 * 60 * 1000,
    submittedAt: Date.now() - 30 * 60 * 1000,
    formData: {
      space_id: "CS-002",
      atmosphere_tested: true,
      rescue_plan: true,
    },
    createdAt: Date.now() - 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 60 * 1000,
  },
  {
    _id: "perm3" as Id<"permitInstances">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    permitTypeId: "permtype3" as Id<"permitTypes">,
    permitNumber: "PERMIT-003",
    status: "draft" as const,
    applicantId: "worker3" as Id<"workers">,
    workDescription: "Excavation for storm water pipe",
    location: "Car park area, south side",
    requestedStartAt: Date.now() + 48 * 60 * 60 * 1000,
    requestedEndAt: Date.now() + 72 * 60 * 60 * 1000,
    formData: {
      depth: 2.5,
      services_checked: false,
    },
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 60 * 60 * 1000,
  },
];

// Types
export type PermitStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "active"
  | "suspended"
  | "closed"
  | "expired"
  | "rejected"
  | "cancelled";

export type PermitInstanceData = DemoPermitInstance;

export type PermitInstanceWithDetails = DemoPermitInstance & {
  permitType: {
    _id: string;
    name: string;
    code: string;
    riskLevel: string;
  } | null;
  applicant: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  approver: {
    _id: string;
    fullName: string;
  } | null;
};

// Input types
export interface CreatePermitInstanceInput {
  orgId: Id<"orgs">;
  projectId: Id<"projects">;
  permitTypeId: Id<"permitTypes">;
  applicantId: Id<"workers">;
  workDescription: string;
  location: string;
  requestedStartAt: number;
  requestedEndAt: number;
  formData?: unknown;
}

export function usePermitInstances(projectId: Id<"projects"> | string): {
  data: PermitInstanceData[];
  actions: {
    create: (
      input: Omit<CreatePermitInstanceInput, "projectId">
    ) => Promise<Id<"permitInstances">>;
    submit: (id: Id<"permitInstances">) => Promise<Id<"permitInstances">>;
    approve: (
      id: Id<"permitInstances">,
      approvedBy: Id<"workers">,
      approvalSignatureData?: string,
      validityHours?: number
    ) => Promise<Id<"permitInstances">>;
    reject: (
      id: Id<"permitInstances">,
      rejectedBy: Id<"workers">,
      rejectionReason: string
    ) => Promise<Id<"permitInstances">>;
    activate: (id: Id<"permitInstances">) => Promise<Id<"permitInstances">>;
    suspend: (
      id: Id<"permitInstances">,
      suspendReason: string
    ) => Promise<Id<"permitInstances">>;
    resume: (id: Id<"permitInstances">) => Promise<Id<"permitInstances">>;
    close: (
      id: Id<"permitInstances">,
      closedBy: Id<"workers">,
      closureNotes?: string
    ) => Promise<Id<"permitInstances">>;
    cancel: (id: Id<"permitInstances">) => Promise<Id<"permitInstances">>;
    expire: (id: Id<"permitInstances">) => Promise<Id<"permitInstances">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const permitsQuery = useQuery(
    api.permitInstances.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const createMutation = useMutation(api.permitInstances.create);
  const submitMutation = useMutation(api.permitInstances.submit);
  const approveMutation = useMutation(api.permitInstances.approve);
  const rejectMutation = useMutation(api.permitInstances.reject);
  const activateMutation = useMutation(api.permitInstances.activate);
  const suspendMutation = useMutation(api.permitInstances.suspend);
  const resumeMutation = useMutation(api.permitInstances.resume);
  const closeMutation = useMutation(api.permitInstances.close);
  const cancelMutation = useMutation(api.permitInstances.cancel);
  const expireMutation = useMutation(api.permitInstances.expire);

  const demoData = DEMO_PERMIT_INSTANCES.filter((p) => p.projectId === projectId);
  const data: PermitInstanceData[] = convexAvailable
    ? ((permitsQuery ?? []) as PermitInstanceData[])
    : demoData;
  const isLoading = convexAvailable && permitsQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreatePermitInstanceInput, "projectId">
    ): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-perm-new" as Id<"permitInstances">;
      }
      return await createMutation({
        ...input,
        projectId: projectId as Id<"projects">,
      });
    },
    submit: async (id: Id<"permitInstances">): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - submit operation is a no-op");
        return id;
      }
      return await submitMutation({ id });
    },
    approve: async (
      id: Id<"permitInstances">,
      approvedBy: Id<"workers">,
      approvalSignatureData?: string,
      validityHours?: number
    ): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - approve operation is a no-op");
        return id;
      }
      return await approveMutation({
        id,
        approvedBy,
        approvalSignatureData,
        validityHours,
      });
    },
    reject: async (
      id: Id<"permitInstances">,
      rejectedBy: Id<"workers">,
      rejectionReason: string
    ): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - reject operation is a no-op");
        return id;
      }
      return await rejectMutation({ id, rejectedBy, rejectionReason });
    },
    activate: async (
      id: Id<"permitInstances">
    ): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - activate operation is a no-op");
        return id;
      }
      return await activateMutation({ id });
    },
    suspend: async (
      id: Id<"permitInstances">,
      suspendReason: string
    ): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - suspend operation is a no-op");
        return id;
      }
      return await suspendMutation({ id, suspendReason });
    },
    resume: async (id: Id<"permitInstances">): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - resume operation is a no-op");
        return id;
      }
      return await resumeMutation({ id });
    },
    close: async (
      id: Id<"permitInstances">,
      closedBy: Id<"workers">,
      closureNotes?: string
    ): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - close operation is a no-op");
        return id;
      }
      return await closeMutation({ id, closedBy, closureNotes });
    },
    cancel: async (id: Id<"permitInstances">): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - cancel operation is a no-op");
        return id;
      }
      return await cancelMutation({ id });
    },
    expire: async (id: Id<"permitInstances">): Promise<Id<"permitInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - expire operation is a no-op");
        return id;
      }
      return await expireMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function usePermitInstance(id: Id<"permitInstances"> | string) {
  const convexAvailable = useConvexAvailable();

  const permitQuery = useQuery(
    api.permitInstances.get,
    convexAvailable ? { id: id as Id<"permitInstances"> } : "skip"
  );

  const demoPermit = DEMO_PERMIT_INSTANCES.find((p) => p._id === id);
  const data = convexAvailable ? (permitQuery ?? null) : (demoPermit ?? null);
  const isLoading = convexAvailable && permitQuery === undefined;

  return { data, isLoading };
}

export function usePermitInstanceWithDetails(id: Id<"permitInstances"> | string) {
  const convexAvailable = useConvexAvailable();

  const detailsQuery = useQuery(
    api.permitInstances.getWithDetails,
    convexAvailable ? { id: id as Id<"permitInstances"> } : "skip"
  );

  const demoPermit = DEMO_PERMIT_INSTANCES.find((p) => p._id === id);
  const demoDetails: PermitInstanceWithDetails | null = demoPermit
    ? {
        ...demoPermit,
        permitType: {
          _id: "permtype1",
          name: "Hot Work Permit",
          code: "HWP",
          riskLevel: "high",
        },
        applicant: {
          _id: "worker1",
          fullName: "Mike Johnson",
          email: "mike.johnson@buildright.com.au",
        },
        approver: demoPermit.approvedBy
          ? {
              _id: "worker1",
              fullName: "Mike Johnson",
            }
          : null,
      }
    : null;

  const data = convexAvailable ? (detailsQuery ?? null) : demoDetails;
  const isLoading = convexAvailable && detailsQuery === undefined;

  return { data, isLoading };
}

export function useActivePermitInstances(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.permitInstances.listActive,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const demoData = DEMO_PERMIT_INSTANCES.filter(
    (p) => p.projectId === projectId && p.status === "active"
  );
  const data: PermitInstanceData[] = convexAvailable
    ? ((activeQuery ?? []) as PermitInstanceData[])
    : demoData;
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function usePermitInstancesByStatus(
  projectId: Id<"projects"> | string,
  status: PermitStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.permitInstances.listByStatus,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, status }
      : "skip"
  );

  const demoData = DEMO_PERMIT_INSTANCES.filter(
    (p) => p.projectId === projectId && p.status === status
  );
  const data: PermitInstanceData[] = convexAvailable
    ? ((statusQuery ?? []) as PermitInstanceData[])
    : demoData;
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useWorkerPermitInstances(applicantId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const applicantQuery = useQuery(
    api.permitInstances.listByApplicant,
    convexAvailable ? { applicantId: applicantId as Id<"workers"> } : "skip"
  );

  const demoData = DEMO_PERMIT_INSTANCES.filter(
    (p) => p.applicantId === applicantId
  );
  const data: PermitInstanceData[] = convexAvailable
    ? ((applicantQuery ?? []) as PermitInstanceData[])
    : demoData;
  const isLoading = convexAvailable && applicantQuery === undefined;

  return { data, isLoading };
}

export function useExpiringPermitInstances(
  projectId: Id<"projects"> | string,
  withinHours?: number
) {
  const convexAvailable = useConvexAvailable();

  const expiringQuery = useQuery(
    api.permitInstances.listExpiring,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, withinHours }
      : "skip"
  );

  const data: PermitInstanceData[] = convexAvailable
    ? ((expiringQuery ?? []) as PermitInstanceData[])
    : [];
  const isLoading = convexAvailable && expiringQuery === undefined;

  return { data, isLoading };
}

export function useExpiredPermitInstances(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const expiredQuery = useQuery(
    api.permitInstances.listExpired,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const data: PermitInstanceData[] = convexAvailable
    ? ((expiredQuery ?? []) as PermitInstanceData[])
    : [];
  const isLoading = convexAvailable && expiredQuery === undefined;

  return { data, isLoading };
}
