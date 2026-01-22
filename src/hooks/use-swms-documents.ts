"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";
import { SWMSSection } from "./use-swms-templates";

// Demo type for fallback data
type DemoSWMSDocument = Doc<"swmsDocuments"> & {
  _id: Id<"swmsDocuments">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_SWMS_DOCUMENTS: DemoSWMSDocument[] = [
  {
    _id: "swmsd1" as Id<"swmsDocuments">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    swmsNumber: "SWMS-001",
    title: "Concrete Pour - Level 3",
    revision: 1,
    status: "approved" as const,
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
        content: { items: ["Wear protective clothing", "Maintain housekeeping"] },
        order: 3,
      },
      {
        id: "s4",
        type: "ppe" as const,
        title: "PPE Requirements",
        content: { items: ["Hard hat", "Safety glasses", "Rubber boots", "Gloves"] },
        order: 4,
      },
    ],
    createdBy: "worker1" as Id<"workers">,
    approvedBy: "worker1" as Id<"workers">,
    approvedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 358 * 24 * 60 * 60 * 1000,
    shareCode: "ABC123DEF456",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "swmsd2" as Id<"swmsDocuments">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    swmsNumber: "SWMS-002",
    title: "Scaffolding Erection",
    revision: 1,
    status: "pending_review" as const,
    sections: [
      {
        id: "s1",
        type: "title" as const,
        title: "SWMS Title",
        content: { text: "Scaffolding Erection" },
        order: 1,
      },
    ],
    createdBy: "worker1" as Id<"workers">,
    submittedBy: "worker1" as Id<"workers">,
    submittedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "swmsd3" as Id<"swmsDocuments">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    swmsNumber: "SWMS-003",
    title: "Electrical Installation",
    revision: 1,
    status: "draft" as const,
    sections: [],
    createdBy: "worker2" as Id<"workers">,
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

// Types
export type SWMSDocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "expired"
  | "archived";

export type SWMSDocumentData = DemoSWMSDocument;

export type SWMSDocumentWithStats = DemoSWMSDocument & {
  signatureCount: number;
  assignmentCount: number;
  acknowledgedCount: number;
};

// Input types
export interface CreateSWMSDocumentInput {
  orgId: Id<"orgs">;
  projectId: Id<"projects">;
  templateId?: Id<"swmsTemplates">;
  title: string;
  sections?: SWMSSection[];
  createdBy: Id<"workers">;
}

export interface UpdateSWMSDocumentInput {
  id: Id<"swmsDocuments">;
  title?: string;
  sections?: SWMSSection[];
}

export function useSWMSDocuments(projectId: Id<"projects"> | string): {
  data: SWMSDocumentData[];
  actions: {
    create: (
      input: Omit<CreateSWMSDocumentInput, "projectId">
    ) => Promise<Id<"swmsDocuments">>;
    update: (input: UpdateSWMSDocumentInput) => Promise<Id<"swmsDocuments">>;
    submitForReview: (
      id: Id<"swmsDocuments">,
      submittedBy: Id<"workers">
    ) => Promise<Id<"swmsDocuments">>;
    approve: (
      id: Id<"swmsDocuments">,
      approvedBy: Id<"workers">,
      expiresInDays?: number
    ) => Promise<Id<"swmsDocuments">>;
    returnToDraft: (id: Id<"swmsDocuments">) => Promise<Id<"swmsDocuments">>;
    archive: (id: Id<"swmsDocuments">) => Promise<Id<"swmsDocuments">>;
    expire: (id: Id<"swmsDocuments">) => Promise<Id<"swmsDocuments">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const documentsQuery = useQuery(
    api.swmsDocuments.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const createMutation = useMutation(api.swmsDocuments.create);
  const updateMutation = useMutation(api.swmsDocuments.update);
  const submitMutation = useMutation(api.swmsDocuments.submitForReview);
  const approveMutation = useMutation(api.swmsDocuments.approve);
  const returnToDraftMutation = useMutation(api.swmsDocuments.returnToDraft);
  const archiveMutation = useMutation(api.swmsDocuments.archive);
  const expireMutation = useMutation(api.swmsDocuments.expire);

  const demoData = DEMO_SWMS_DOCUMENTS.filter((d) => d.projectId === projectId);
  const data: SWMSDocumentData[] = convexAvailable
    ? ((documentsQuery ?? []) as SWMSDocumentData[])
    : demoData;
  const isLoading = convexAvailable && documentsQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateSWMSDocumentInput, "projectId">
    ): Promise<Id<"swmsDocuments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-swmsd-new" as Id<"swmsDocuments">;
      }
      return await createMutation({
        ...input,
        projectId: projectId as Id<"projects">,
      });
    },
    update: async (
      input: UpdateSWMSDocumentInput
    ): Promise<Id<"swmsDocuments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    submitForReview: async (
      id: Id<"swmsDocuments">,
      submittedBy: Id<"workers">
    ): Promise<Id<"swmsDocuments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - submit operation is a no-op");
        return id;
      }
      return await submitMutation({ id, submittedBy });
    },
    approve: async (
      id: Id<"swmsDocuments">,
      approvedBy: Id<"workers">,
      expiresInDays?: number
    ): Promise<Id<"swmsDocuments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - approve operation is a no-op");
        return id;
      }
      return await approveMutation({ id, approvedBy, expiresInDays });
    },
    returnToDraft: async (
      id: Id<"swmsDocuments">
    ): Promise<Id<"swmsDocuments">> => {
      if (!convexAvailable) {
        console.warn(
          "Convex not configured - returnToDraft operation is a no-op"
        );
        return id;
      }
      return await returnToDraftMutation({ id });
    },
    archive: async (id: Id<"swmsDocuments">): Promise<Id<"swmsDocuments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - archive operation is a no-op");
        return id;
      }
      return await archiveMutation({ id });
    },
    expire: async (id: Id<"swmsDocuments">): Promise<Id<"swmsDocuments">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - expire operation is a no-op");
        return id;
      }
      return await expireMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useSWMSDocument(id: Id<"swmsDocuments"> | string) {
  const convexAvailable = useConvexAvailable();

  const documentQuery = useQuery(
    api.swmsDocuments.get,
    convexAvailable ? { id: id as Id<"swmsDocuments"> } : "skip"
  );

  const demoDocument = DEMO_SWMS_DOCUMENTS.find((d) => d._id === id);
  const data = convexAvailable
    ? (documentQuery ?? null)
    : (demoDocument ?? null);
  const isLoading = convexAvailable && documentQuery === undefined;

  return { data, isLoading };
}

export function useSWMSDocumentByShareCode(shareCode: string) {
  const convexAvailable = useConvexAvailable();

  const documentQuery = useQuery(
    api.swmsDocuments.getByShareCode,
    convexAvailable && shareCode ? { shareCode } : "skip"
  );

  const demoDocument = DEMO_SWMS_DOCUMENTS.find((d) => d.shareCode === shareCode);
  const data = convexAvailable
    ? (documentQuery ?? null)
    : (demoDocument ?? null);
  const isLoading = convexAvailable && documentQuery === undefined;

  return { data, isLoading };
}

export function useSWMSDocumentWithStats(id: Id<"swmsDocuments"> | string) {
  const convexAvailable = useConvexAvailable();

  const statsQuery = useQuery(
    api.swmsDocuments.getWithStats,
    convexAvailable ? { id: id as Id<"swmsDocuments"> } : "skip"
  );

  const demoDocument = DEMO_SWMS_DOCUMENTS.find((d) => d._id === id);
  const demoStats: SWMSDocumentWithStats | null = demoDocument
    ? {
        ...demoDocument,
        signatureCount: 3,
        assignmentCount: 5,
        acknowledgedCount: 4,
      }
    : null;

  const data = convexAvailable ? (statsQuery ?? null) : demoStats;
  const isLoading = convexAvailable && statsQuery === undefined;

  return { data, isLoading };
}

export function useActiveSWMSDocuments(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.swmsDocuments.listActive,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const demoData = DEMO_SWMS_DOCUMENTS.filter(
    (d) => d.projectId === projectId && d.status === "approved"
  );
  const data: SWMSDocumentData[] = convexAvailable
    ? ((activeQuery ?? []) as SWMSDocumentData[])
    : demoData;
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function useSWMSDocumentsByStatus(
  projectId: Id<"projects"> | string,
  status: SWMSDocumentStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.swmsDocuments.listByStatus,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, status }
      : "skip"
  );

  const demoData = DEMO_SWMS_DOCUMENTS.filter(
    (d) => d.projectId === projectId && d.status === status
  );
  const data: SWMSDocumentData[] = convexAvailable
    ? ((statusQuery ?? []) as SWMSDocumentData[])
    : demoData;
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useExpiringSWMSDocuments(
  projectId: Id<"projects"> | string,
  withinDays?: number
) {
  const convexAvailable = useConvexAvailable();

  const expiringQuery = useQuery(
    api.swmsDocuments.listExpiring,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, withinDays }
      : "skip"
  );

  const data: SWMSDocumentData[] = convexAvailable
    ? ((expiringQuery ?? []) as SWMSDocumentData[])
    : [];
  const isLoading = convexAvailable && expiringQuery === undefined;

  return { data, isLoading };
}
