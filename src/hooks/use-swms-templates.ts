"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoSWMSTemplate = Doc<"swmsTemplates"> & {
  _id: Id<"swmsTemplates">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_SWMS_TEMPLATES: DemoSWMSTemplate[] = [
  {
    _id: "swmst1" as Id<"swmsTemplates">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "General Construction Work",
    description: "Standard SWMS template for general construction activities",
    status: "published" as const,
    version: 1,
    sections: [
      {
        id: "s1",
        type: "title" as const,
        title: "SWMS Title",
        content: { text: "General Construction Work SWMS" },
        order: 1,
      },
      {
        id: "s2",
        type: "activity" as const,
        title: "Work Activity",
        content: { description: "General construction and building work" },
        order: 2,
      },
      {
        id: "s3",
        type: "hazards" as const,
        title: "Hazards",
        content: {
          items: ["Falls from height", "Moving plant", "Manual handling"],
        },
        order: 3,
      },
      {
        id: "s4",
        type: "controls" as const,
        title: "Controls",
        content: { items: ["Use fall protection", "Maintain exclusion zones"] },
        order: 4,
      },
      {
        id: "s5",
        type: "ppe" as const,
        title: "PPE Requirements",
        content: { items: ["Hard hat", "Hi-vis vest", "Steel cap boots"] },
        order: 5,
      },
    ],
    createdBy: "worker1" as Id<"workers">,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "swmst2" as Id<"swmsTemplates">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Working at Heights",
    description: "SWMS template for elevated work activities",
    status: "draft" as const,
    version: 1,
    sections: [
      {
        id: "s1",
        type: "title" as const,
        title: "SWMS Title",
        content: { text: "Working at Heights SWMS" },
        order: 1,
      },
    ],
    createdBy: "worker1" as Id<"workers">,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
];

// Types
export type SWMSTemplateStatus = "draft" | "published" | "archived";
export type SWMSSectionType =
  | "title"
  | "activity"
  | "ppe"
  | "hazards"
  | "controls"
  | "plant"
  | "hazmat"
  | "permits"
  | "training"
  | "emergency"
  | "legislation"
  | "hrcw"
  | "supervision";

export interface SWMSSection {
  id: string;
  type: SWMSSectionType;
  title: string;
  content: unknown;
  order: number;
}

export type SWMSTemplateData = DemoSWMSTemplate;

// Input types
export interface CreateSWMSTemplateInput {
  orgId: Id<"orgs">;
  name: string;
  description?: string;
  sections: SWMSSection[];
  createdBy: Id<"workers">;
}

export interface UpdateSWMSTemplateInput {
  id: Id<"swmsTemplates">;
  name?: string;
  description?: string;
  sections?: SWMSSection[];
}

export function useSWMSTemplates(orgId: Id<"orgs"> | string): {
  data: SWMSTemplateData[];
  actions: {
    create: (
      input: Omit<CreateSWMSTemplateInput, "orgId">
    ) => Promise<Id<"swmsTemplates">>;
    update: (input: UpdateSWMSTemplateInput) => Promise<Id<"swmsTemplates">>;
    publish: (id: Id<"swmsTemplates">) => Promise<Id<"swmsTemplates">>;
    archive: (id: Id<"swmsTemplates">) => Promise<Id<"swmsTemplates">>;
    clone: (
      id: Id<"swmsTemplates">,
      createdBy: Id<"workers">
    ) => Promise<Id<"swmsTemplates">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const templatesQuery = useQuery(
    api.swmsTemplates.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.swmsTemplates.create);
  const updateMutation = useMutation(api.swmsTemplates.update);
  const publishMutation = useMutation(api.swmsTemplates.publish);
  const archiveMutation = useMutation(api.swmsTemplates.archive);
  const cloneMutation = useMutation(api.swmsTemplates.clone);

  const demoData = DEMO_SWMS_TEMPLATES.filter((t) => t.orgId === orgId);
  const data: SWMSTemplateData[] = convexAvailable
    ? ((templatesQuery ?? []) as SWMSTemplateData[])
    : demoData;
  const isLoading = convexAvailable && templatesQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateSWMSTemplateInput, "orgId">
    ): Promise<Id<"swmsTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-swmst-new" as Id<"swmsTemplates">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (
      input: UpdateSWMSTemplateInput
    ): Promise<Id<"swmsTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    publish: async (id: Id<"swmsTemplates">): Promise<Id<"swmsTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - publish operation is a no-op");
        return id;
      }
      return await publishMutation({ id });
    },
    archive: async (id: Id<"swmsTemplates">): Promise<Id<"swmsTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - archive operation is a no-op");
        return id;
      }
      return await archiveMutation({ id });
    },
    clone: async (
      id: Id<"swmsTemplates">,
      createdBy: Id<"workers">
    ): Promise<Id<"swmsTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - clone operation is a no-op");
        return "demo-swmst-clone" as Id<"swmsTemplates">;
      }
      return await cloneMutation({ id, createdBy });
    },
  };

  return { data, actions, isLoading };
}

export function useSWMSTemplate(id: Id<"swmsTemplates"> | string) {
  const convexAvailable = useConvexAvailable();

  const templateQuery = useQuery(
    api.swmsTemplates.get,
    convexAvailable ? { id: id as Id<"swmsTemplates"> } : "skip"
  );

  const demoTemplate = DEMO_SWMS_TEMPLATES.find((t) => t._id === id);
  const data = convexAvailable
    ? (templateQuery ?? null)
    : (demoTemplate ?? null);
  const isLoading = convexAvailable && templateQuery === undefined;

  return { data, isLoading };
}

export function usePublishedSWMSTemplates(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const publishedQuery = useQuery(
    api.swmsTemplates.listPublished,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const demoData = DEMO_SWMS_TEMPLATES.filter(
    (t) => t.orgId === orgId && t.status === "published"
  );
  const data: SWMSTemplateData[] = convexAvailable
    ? ((publishedQuery ?? []) as SWMSTemplateData[])
    : demoData;
  const isLoading = convexAvailable && publishedQuery === undefined;

  return { data, isLoading };
}

export function useSWMSTemplatesByStatus(
  orgId: Id<"orgs"> | string,
  status: SWMSTemplateStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.swmsTemplates.listByStatus,
    convexAvailable ? { orgId: orgId as Id<"orgs">, status } : "skip"
  );

  const demoData = DEMO_SWMS_TEMPLATES.filter(
    (t) => t.orgId === orgId && t.status === status
  );
  const data: SWMSTemplateData[] = convexAvailable
    ? ((statusQuery ?? []) as SWMSTemplateData[])
    : demoData;
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export interface SWMSTemplateVersionHistoryEntry {
  _id: string;
  version: number;
  status: string;
  createdAt: number;
}

export function useSWMSTemplateVersionHistory(id: Id<"swmsTemplates"> | string): {
  data: SWMSTemplateVersionHistoryEntry[];
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const historyQuery = useQuery(
    api.swmsTemplates.getVersionHistory,
    convexAvailable ? { id: id as Id<"swmsTemplates"> } : "skip"
  );

  const demoHistory: SWMSTemplateVersionHistoryEntry[] = [
    {
      _id: id as string,
      version: 1,
      status: "published",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
  ];
  const data: SWMSTemplateVersionHistoryEntry[] = convexAvailable
    ? ((historyQuery ?? []) as SWMSTemplateVersionHistoryEntry[])
    : demoHistory;
  const isLoading = convexAvailable && historyQuery === undefined;

  return { data, isLoading };
}
