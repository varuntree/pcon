"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoInductionType = Doc<"inductionTypes"> & {
  _id: Id<"inductionTypes">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_INDUCTION_TYPES: DemoInductionType[] = [
  {
    _id: "indtype1" as Id<"inductionTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Company Induction",
    description: "General company policies, safety culture, and expectations",
    scope: "company" as const,
    steps: [
      {
        id: "step1",
        type: "info" as const,
        title: "Welcome",
        content: { text: "Welcome to BuildRight Construction!" },
        required: true,
        order: 1,
      },
      {
        id: "step2",
        type: "video" as const,
        title: "Safety Culture Video",
        content: { url: "https://example.com/safety-video.mp4", duration: 300 },
        required: true,
        order: 2,
      },
      {
        id: "step3",
        type: "acknowledgement" as const,
        title: "Acknowledge Policies",
        content: {
          text: "I have read and understand the company safety policies",
        },
        required: true,
        order: 3,
      },
    ],
    version: 1,
    isActive: true,
    createdBy: "worker1" as Id<"workers">,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "indtype2" as Id<"inductionTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    name: "Riverside Apartments Site Induction",
    description: "Site-specific hazards, access points, and emergency procedures",
    scope: "site" as const,
    steps: [
      {
        id: "step1",
        type: "info" as const,
        title: "Site Overview",
        content: { text: "Welcome to the Riverside Apartments project site" },
        required: true,
        order: 1,
      },
      {
        id: "step2",
        type: "info" as const,
        title: "Site Hazards",
        content: {
          text: "Key hazards include: Active excavation zones, overhead crane operations, confined spaces",
        },
        required: true,
        order: 2,
      },
      {
        id: "step3",
        type: "acknowledgement" as const,
        title: "Emergency Procedures",
        content: {
          text: "I understand the emergency evacuation procedures and muster point locations",
        },
        required: true,
        order: 3,
      },
    ],
    requiredCertificationTypeIds: ["certtype1" as Id<"certificationTypes">],
    validityDays: 365,
    version: 1,
    isActive: true,
    createdBy: "worker1" as Id<"workers">,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "indtype3" as Id<"inductionTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Working at Heights Task Induction",
    description: "Specific requirements for working above 2 meters",
    scope: "task" as const,
    steps: [
      {
        id: "step1",
        type: "video" as const,
        title: "Fall Prevention Training",
        content: { url: "https://example.com/fall-prevention.mp4", duration: 600 },
        required: true,
        order: 1,
      },
      {
        id: "step2",
        type: "document_upload" as const,
        title: "Upload WAH Certificate",
        content: { certificationTypeId: "certtype2" },
        required: true,
        order: 2,
      },
      {
        id: "step3",
        type: "acknowledgement" as const,
        title: "Acknowledge WAH Requirements",
        content: {
          text: "I will always use appropriate fall protection when working above 2 meters",
        },
        required: true,
        order: 3,
      },
    ],
    requiredCertificationTypeIds: ["certtype2" as Id<"certificationTypes">],
    validityDays: 730,
    version: 1,
    isActive: true,
    createdBy: "worker1" as Id<"workers">,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
];

// Types
export type InductionScope = "company" | "site" | "task" | "plant";
export type InductionStepType =
  | "info"
  | "video"
  | "quiz"
  | "acknowledgement"
  | "document_upload"
  | "photo_capture";

export interface InductionStep {
  id: string;
  type: InductionStepType;
  title: string;
  content?: unknown;
  required: boolean;
  order: number;
}

export type InductionTypeData = DemoInductionType;

export type InductionTypeWithCertifications = DemoInductionType & {
  requiredCertifications: Array<{
    _id: string;
    name: string;
    code: string;
    category: string;
  }>;
};

// Input types
export interface CreateInductionTypeInput {
  orgId: Id<"orgs">;
  projectId?: Id<"projects">;
  name: string;
  description?: string;
  scope: InductionScope;
  steps: InductionStep[];
  requiredCertificationTypeIds?: Id<"certificationTypes">[];
  validityDays?: number;
  createdBy: Id<"workers">;
}

export interface UpdateInductionTypeInput {
  id: Id<"inductionTypes">;
  name?: string;
  description?: string;
  steps?: InductionStep[];
  requiredCertificationTypeIds?: Id<"certificationTypes">[];
  validityDays?: number;
}

export function useInductionTypes(orgId: Id<"orgs"> | string): {
  data: InductionTypeData[];
  actions: {
    create: (
      input: Omit<CreateInductionTypeInput, "orgId">
    ) => Promise<Id<"inductionTypes">>;
    update: (input: UpdateInductionTypeInput) => Promise<Id<"inductionTypes">>;
    deactivate: (id: Id<"inductionTypes">) => Promise<Id<"inductionTypes">>;
    clone: (
      id: Id<"inductionTypes">,
      createdBy: Id<"workers">
    ) => Promise<Id<"inductionTypes">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const inductionTypesQuery = useQuery(
    api.inductionTypes.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.inductionTypes.create);
  const updateMutation = useMutation(api.inductionTypes.update);
  const deactivateMutation = useMutation(api.inductionTypes.deactivate);
  const cloneMutation = useMutation(api.inductionTypes.clone);

  const demoData = DEMO_INDUCTION_TYPES.filter((it) => it.orgId === orgId);
  const data: InductionTypeData[] = convexAvailable
    ? ((inductionTypesQuery ?? []) as InductionTypeData[])
    : demoData;
  const isLoading = convexAvailable && inductionTypesQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateInductionTypeInput, "orgId">
    ): Promise<Id<"inductionTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-indtype-new" as Id<"inductionTypes">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (
      input: UpdateInductionTypeInput
    ): Promise<Id<"inductionTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    deactivate: async (
      id: Id<"inductionTypes">
    ): Promise<Id<"inductionTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - deactivate operation is a no-op");
        return id;
      }
      return await deactivateMutation({ id });
    },
    clone: async (
      id: Id<"inductionTypes">,
      createdBy: Id<"workers">
    ): Promise<Id<"inductionTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - clone operation is a no-op");
        return "demo-indtype-clone" as Id<"inductionTypes">;
      }
      return await cloneMutation({ id, createdBy });
    },
  };

  return { data, actions, isLoading };
}

export function useInductionType(id: Id<"inductionTypes"> | string) {
  const convexAvailable = useConvexAvailable();

  const inductionTypeQuery = useQuery(
    api.inductionTypes.get,
    convexAvailable ? { id: id as Id<"inductionTypes"> } : "skip"
  );

  const demoInductionType = DEMO_INDUCTION_TYPES.find((it) => it._id === id);
  const data = convexAvailable
    ? (inductionTypeQuery ?? null)
    : (demoInductionType ?? null);
  const isLoading = convexAvailable && inductionTypeQuery === undefined;

  return { data, isLoading };
}

export function useInductionTypeWithCertifications(
  id: Id<"inductionTypes"> | string
) {
  const convexAvailable = useConvexAvailable();

  const detailsQuery = useQuery(
    api.inductionTypes.getWithCertifications,
    convexAvailable ? { id: id as Id<"inductionTypes"> } : "skip"
  );

  const demoInductionType = DEMO_INDUCTION_TYPES.find((it) => it._id === id);
  const demoDetails: InductionTypeWithCertifications | null = demoInductionType
    ? {
        ...demoInductionType,
        requiredCertifications: [
          {
            _id: "certtype1",
            name: "White Card (General Construction Induction)",
            code: "WHITE-CARD",
            category: "training",
          },
        ],
      }
    : null;

  const data = convexAvailable ? (detailsQuery ?? null) : demoDetails;
  const isLoading = convexAvailable && detailsQuery === undefined;

  return { data, isLoading };
}

export function useActiveInductionTypes(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.inductionTypes.listActive,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const demoData = DEMO_INDUCTION_TYPES.filter(
    (it) => it.orgId === orgId && it.isActive
  );
  const data: InductionTypeData[] = convexAvailable
    ? ((activeQuery ?? []) as InductionTypeData[])
    : demoData;
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function useInductionTypesByScope(
  orgId: Id<"orgs"> | string,
  scope: InductionScope
) {
  const convexAvailable = useConvexAvailable();

  const scopeQuery = useQuery(
    api.inductionTypes.listByScope,
    convexAvailable ? { orgId: orgId as Id<"orgs">, scope } : "skip"
  );

  const demoData = DEMO_INDUCTION_TYPES.filter(
    (it) => it.orgId === orgId && it.scope === scope
  );
  const data: InductionTypeData[] = convexAvailable
    ? ((scopeQuery ?? []) as InductionTypeData[])
    : demoData;
  const isLoading = convexAvailable && scopeQuery === undefined;

  return { data, isLoading };
}

export function useProjectInductionTypes(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.inductionTypes.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const demoData = DEMO_INDUCTION_TYPES.filter(
    (it) => it.projectId === projectId && it.isActive
  );
  const data: InductionTypeData[] = convexAvailable
    ? ((projectQuery ?? []) as InductionTypeData[])
    : demoData;
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}
