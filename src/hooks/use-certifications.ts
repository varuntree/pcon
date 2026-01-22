"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo types for fallback data
type DemoCertificationType = Doc<"certificationTypes"> & {
  _id: Id<"certificationTypes">;
  _creationTime: number;
};

type DemoCompetencyRecord = Doc<"competencyRecords"> & {
  _id: Id<"competencyRecords">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_CERTIFICATION_TYPES: DemoCertificationType[] = [
  {
    _id: "certtype1" as Id<"certificationTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "White Card (General Construction Induction)",
    code: "WHITE-CARD",
    category: "training" as const,
    description: "National construction induction training certification",
    expiryWarningDays: 30,
    isRequiredOrgwide: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "certtype2" as Id<"certificationTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Working at Heights",
    code: "WAH",
    category: "ticket" as const,
    description: "Working at heights certification",
    validityDays: 730,
    expiryWarningDays: 60,
    isRequiredOrgwide: false,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "certtype3" as Id<"certificationTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Forklift License",
    code: "LF",
    category: "license" as const,
    description: "High risk work license - forklift operation",
    validityDays: 1825,
    expiryWarningDays: 90,
    isRequiredOrgwide: false,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const DEMO_COMPETENCY_RECORDS: DemoCompetencyRecord[] = [
  {
    _id: "comprec1" as Id<"competencyRecords">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    workerId: "worker1" as Id<"workers">,
    certificationTypeId: "certtype1" as Id<"certificationTypes">,
    certNumber: "WC-123456",
    issuer: "SafeWork NSW",
    issueDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
    status: "verified" as const,
    verifiedBy: "worker1" as Id<"workers">,
    verifiedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "comprec2" as Id<"competencyRecords">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    workerId: "worker2" as Id<"workers">,
    certificationTypeId: "certtype2" as Id<"certificationTypes">,
    certNumber: "WAH-789012",
    issuer: "Training Provider ABC",
    issueDate: Date.now() - 180 * 24 * 60 * 60 * 1000,
    expiryDate: Date.now() + 545 * 24 * 60 * 60 * 1000,
    status: "verified" as const,
    verifiedBy: "worker1" as Id<"workers">,
    verifiedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "comprec3" as Id<"competencyRecords">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    workerId: "worker3" as Id<"workers">,
    certificationTypeId: "certtype1" as Id<"certificationTypes">,
    certNumber: "WC-345678",
    status: "pending" as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Types
export type CertificationCategory =
  | "license"
  | "ticket"
  | "training"
  | "medical"
  | "other";
export type CompetencyStatus = "pending" | "verified" | "rejected" | "expired";
export type CertificationTypeData = DemoCertificationType;
export type CompetencyRecordData = DemoCompetencyRecord;

// Input types
export interface CreateCertificationTypeInput {
  orgId: Id<"orgs">;
  name: string;
  code: string;
  category: CertificationCategory;
  description?: string;
  validityDays?: number;
  expiryWarningDays?: number;
  isRequiredOrgwide?: boolean;
}

export interface UpdateCertificationTypeInput {
  id: Id<"certificationTypes">;
  name?: string;
  description?: string;
  validityDays?: number;
  expiryWarningDays?: number;
  isRequiredOrgwide?: boolean;
  isActive?: boolean;
}

export interface CreateCompetencyRecordInput {
  orgId: Id<"orgs">;
  workerId: Id<"workers">;
  certificationTypeId: Id<"certificationTypes">;
  certNumber: string;
  issuer?: string;
  issueDate?: number;
  expiryDate?: number;
  frontPhotoId?: Id<"_storage">;
  backPhotoId?: Id<"_storage">;
}

export interface UpdateCompetencyRecordInput {
  id: Id<"competencyRecords">;
  certNumber?: string;
  issuer?: string;
  issueDate?: number;
  expiryDate?: number;
  frontPhotoId?: Id<"_storage">;
  backPhotoId?: Id<"_storage">;
}

// ============================================================
// Certification Types Hooks
// ============================================================

export function useCertificationTypes(orgId: Id<"orgs"> | string): {
  data: CertificationTypeData[];
  actions: {
    create: (
      input: Omit<CreateCertificationTypeInput, "orgId">
    ) => Promise<Id<"certificationTypes">>;
    update: (
      input: UpdateCertificationTypeInput
    ) => Promise<Id<"certificationTypes">>;
    deactivate: (id: Id<"certificationTypes">) => Promise<Id<"certificationTypes">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const certTypesQuery = useQuery(
    api.certificationTypes.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.certificationTypes.create);
  const updateMutation = useMutation(api.certificationTypes.update);
  const deactivateMutation = useMutation(api.certificationTypes.deactivate);

  const demoData = DEMO_CERTIFICATION_TYPES.filter((ct) => ct.orgId === orgId);
  const data: CertificationTypeData[] = convexAvailable
    ? ((certTypesQuery ?? []) as CertificationTypeData[])
    : demoData;
  const isLoading = convexAvailable && certTypesQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateCertificationTypeInput, "orgId">
    ): Promise<Id<"certificationTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-certtype-new" as Id<"certificationTypes">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (
      input: UpdateCertificationTypeInput
    ): Promise<Id<"certificationTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    deactivate: async (
      id: Id<"certificationTypes">
    ): Promise<Id<"certificationTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - deactivate operation is a no-op");
        return id;
      }
      return await deactivateMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useCertificationType(id: Id<"certificationTypes"> | string) {
  const convexAvailable = useConvexAvailable();

  const certTypeQuery = useQuery(
    api.certificationTypes.get,
    convexAvailable ? { id: id as Id<"certificationTypes"> } : "skip"
  );

  const demoCertType = DEMO_CERTIFICATION_TYPES.find((ct) => ct._id === id);
  const data = convexAvailable
    ? (certTypeQuery ?? null)
    : (demoCertType ?? null);
  const isLoading = convexAvailable && certTypeQuery === undefined;

  return { data, isLoading };
}

export function useActiveCertificationTypes(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.certificationTypes.listActive,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const demoData = DEMO_CERTIFICATION_TYPES.filter(
    (ct) => ct.orgId === orgId && ct.isActive
  );
  const data: CertificationTypeData[] = convexAvailable
    ? ((activeQuery ?? []) as CertificationTypeData[])
    : demoData;
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function useRequiredCertificationTypes(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const requiredQuery = useQuery(
    api.certificationTypes.listRequiredOrgwide,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const demoData = DEMO_CERTIFICATION_TYPES.filter(
    (ct) => ct.orgId === orgId && ct.isRequiredOrgwide
  );
  const data: CertificationTypeData[] = convexAvailable
    ? ((requiredQuery ?? []) as CertificationTypeData[])
    : demoData;
  const isLoading = convexAvailable && requiredQuery === undefined;

  return { data, isLoading };
}

// ============================================================
// Competency Records Hooks
// ============================================================

export function useCompetencyRecords(orgId: Id<"orgs"> | string): {
  data: CompetencyRecordData[];
  actions: {
    create: (
      input: Omit<CreateCompetencyRecordInput, "orgId">
    ) => Promise<Id<"competencyRecords">>;
    update: (
      input: UpdateCompetencyRecordInput
    ) => Promise<Id<"competencyRecords">>;
    verify: (
      id: Id<"competencyRecords">,
      verifiedBy: Id<"workers">
    ) => Promise<Id<"competencyRecords">>;
    reject: (
      id: Id<"competencyRecords">,
      verifiedBy: Id<"workers">,
      reason: string
    ) => Promise<Id<"competencyRecords">>;
    expire: (id: Id<"competencyRecords">) => Promise<Id<"competencyRecords">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const recordsQuery = useQuery(
    api.competencyRecords.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.competencyRecords.create);
  const updateMutation = useMutation(api.competencyRecords.update);
  const verifyMutation = useMutation(api.competencyRecords.verify);
  const rejectMutation = useMutation(api.competencyRecords.reject);
  const expireMutation = useMutation(api.competencyRecords.expire);

  const demoData = DEMO_COMPETENCY_RECORDS.filter((r) => r.orgId === orgId);
  const data: CompetencyRecordData[] = convexAvailable
    ? ((recordsQuery ?? []) as CompetencyRecordData[])
    : demoData;
  const isLoading = convexAvailable && recordsQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateCompetencyRecordInput, "orgId">
    ): Promise<Id<"competencyRecords">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-comprec-new" as Id<"competencyRecords">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (
      input: UpdateCompetencyRecordInput
    ): Promise<Id<"competencyRecords">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    verify: async (
      id: Id<"competencyRecords">,
      verifiedBy: Id<"workers">
    ): Promise<Id<"competencyRecords">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - verify operation is a no-op");
        return id;
      }
      return await verifyMutation({ id, verifiedBy });
    },
    reject: async (
      id: Id<"competencyRecords">,
      verifiedBy: Id<"workers">,
      reason: string
    ): Promise<Id<"competencyRecords">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - reject operation is a no-op");
        return id;
      }
      return await rejectMutation({ id, verifiedBy, rejectionReason: reason });
    },
    expire: async (
      id: Id<"competencyRecords">
    ): Promise<Id<"competencyRecords">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - expire operation is a no-op");
        return id;
      }
      return await expireMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useCompetencyRecord(id: Id<"competencyRecords"> | string) {
  const convexAvailable = useConvexAvailable();

  const recordQuery = useQuery(
    api.competencyRecords.get,
    convexAvailable ? { id: id as Id<"competencyRecords"> } : "skip"
  );

  const demoRecord = DEMO_COMPETENCY_RECORDS.find((r) => r._id === id);
  const data = convexAvailable ? (recordQuery ?? null) : (demoRecord ?? null);
  const isLoading = convexAvailable && recordQuery === undefined;

  return { data, isLoading };
}

export function useWorkerCompetencyRecords(workerId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const recordsQuery = useQuery(
    api.competencyRecords.listByWorker,
    convexAvailable ? { workerId: workerId as Id<"workers"> } : "skip"
  );

  const demoData = DEMO_COMPETENCY_RECORDS.filter(
    (r) => r.workerId === workerId
  );
  const data: CompetencyRecordData[] = convexAvailable
    ? ((recordsQuery ?? []) as CompetencyRecordData[])
    : demoData;
  const isLoading = convexAvailable && recordsQuery === undefined;

  return { data, isLoading };
}

export function useWorkerCompliance(workerId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const complianceQuery = useQuery(
    api.competencyRecords.checkWorkerCompliance,
    convexAvailable ? { workerId: workerId as Id<"workers"> } : "skip"
  );

  // Demo compliance fallback
  const demoCompliance = {
    workerId: workerId as Id<"workers">,
    isCompliant: true,
    certifications: [
      {
        certificationTypeId: "certtype1" as Id<"certificationTypes">,
        certificationTypeName: "White Card (General Construction Induction)",
        required: true,
        hasRecord: true,
        status: "verified" as const,
        expiryDate: null,
        isValid: true,
      },
    ],
  };

  const data = convexAvailable ? (complianceQuery ?? null) : demoCompliance;
  const isLoading = convexAvailable && complianceQuery === undefined;

  return { data, isLoading };
}

export function useExpiringCertifications(
  orgId: Id<"orgs"> | string,
  withinDays?: number
) {
  const convexAvailable = useConvexAvailable();

  const expiringQuery = useQuery(
    api.competencyRecords.listExpiring,
    convexAvailable
      ? { orgId: orgId as Id<"orgs">, withinDays }
      : "skip"
  );

  const data: CompetencyRecordData[] = convexAvailable
    ? ((expiringQuery ?? []) as CompetencyRecordData[])
    : [];
  const isLoading = convexAvailable && expiringQuery === undefined;

  return { data, isLoading };
}

export function useExpiredCertifications(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const expiredQuery = useQuery(
    api.competencyRecords.listExpired,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const data: CompetencyRecordData[] = convexAvailable
    ? ((expiredQuery ?? []) as CompetencyRecordData[])
    : [];
  const isLoading = convexAvailable && expiredQuery === undefined;

  return { data, isLoading };
}

export function useCompetencyRecordsByStatus(
  orgId: Id<"orgs"> | string,
  status: CompetencyStatus
) {
  const convexAvailable = useConvexAvailable();

  const recordsQuery = useQuery(
    api.competencyRecords.listByStatus,
    convexAvailable
      ? { orgId: orgId as Id<"orgs">, status }
      : "skip"
  );

  const demoData = DEMO_COMPETENCY_RECORDS.filter(
    (r) => r.orgId === orgId && r.status === status
  );
  const data: CompetencyRecordData[] = convexAvailable
    ? ((recordsQuery ?? []) as CompetencyRecordData[])
    : demoData;
  const isLoading = convexAvailable && recordsQuery === undefined;

  return { data, isLoading };
}
