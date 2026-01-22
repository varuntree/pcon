"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoIncidentTemplate = Doc<"incidentTemplates"> & {
  _id: Id<"incidentTemplates">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_INCIDENT_TEMPLATES: DemoIncidentTemplate[] = [
  {
    _id: "inctempl1" as Id<"incidentTemplates">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Standard Injury Investigation",
    description: "Template for investigating workplace injuries",
    incidentType: "injury" as const,
    isActive: true,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "inctempl2" as Id<"incidentTemplates">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Near Miss Report",
    description: "Quick reporting template for near miss incidents",
    incidentType: "near_miss" as const,
    isActive: true,
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "inctempl3" as Id<"incidentTemplates">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Property Damage Assessment",
    description: "Template for documenting property damage incidents",
    incidentType: "property_damage" as const,
    isActive: true,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "inctempl4" as Id<"incidentTemplates">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Environmental Incident",
    description: "Template for environmental impact incidents",
    incidentType: "environmental" as const,
    isActive: false,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
];

// Types
export type IncidentType =
  | "injury"
  | "near_miss"
  | "property_damage"
  | "environmental"
  | "other";

export type IncidentTemplateData = DemoIncidentTemplate;

// Input types
export interface CreateIncidentTemplateInput {
  orgId: Id<"orgs">;
  name: string;
  description?: string;
  incidentType: IncidentType;
  checklistTemplateId?: string;
}

export interface UpdateIncidentTemplateInput {
  id: Id<"incidentTemplates">;
  name?: string;
  description?: string;
  incidentType?: IncidentType;
  checklistTemplateId?: string;
}

export function useIncidentTemplates(orgId: Id<"orgs"> | string): {
  data: IncidentTemplateData[];
  actions: {
    create: (
      input: Omit<CreateIncidentTemplateInput, "orgId">
    ) => Promise<Id<"incidentTemplates">>;
    update: (input: UpdateIncidentTemplateInput) => Promise<Id<"incidentTemplates">>;
    archive: (id: Id<"incidentTemplates">) => Promise<Id<"incidentTemplates">>;
    publish: (id: Id<"incidentTemplates">) => Promise<Id<"incidentTemplates">>;
    clone: (
      id: Id<"incidentTemplates">
    ) => Promise<Id<"incidentTemplates">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const templatesQuery = useQuery(
    api.incidentTemplates.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.incidentTemplates.create);
  const updateMutation = useMutation(api.incidentTemplates.update);
  const archiveMutation = useMutation(api.incidentTemplates.archive);
  const publishMutation = useMutation(api.incidentTemplates.publish);
  const cloneMutation = useMutation(api.incidentTemplates.clone);

  const demoData = DEMO_INCIDENT_TEMPLATES.filter((t) => t.orgId === orgId);
  const data: IncidentTemplateData[] = convexAvailable
    ? ((templatesQuery ?? []) as IncidentTemplateData[])
    : demoData;
  const isLoading = convexAvailable && templatesQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateIncidentTemplateInput, "orgId">
    ): Promise<Id<"incidentTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-inctempl-new" as Id<"incidentTemplates">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (
      input: UpdateIncidentTemplateInput
    ): Promise<Id<"incidentTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    archive: async (
      id: Id<"incidentTemplates">
    ): Promise<Id<"incidentTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - archive operation is a no-op");
        return id;
      }
      return await archiveMutation({ id });
    },
    publish: async (
      id: Id<"incidentTemplates">
    ): Promise<Id<"incidentTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - publish operation is a no-op");
        return id;
      }
      return await publishMutation({ id });
    },
    clone: async (
      id: Id<"incidentTemplates">
    ): Promise<Id<"incidentTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - clone operation is a no-op");
        return "demo-inctempl-clone" as Id<"incidentTemplates">;
      }
      return await cloneMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useIncidentTemplate(id: Id<"incidentTemplates"> | string) {
  const convexAvailable = useConvexAvailable();

  const templateQuery = useQuery(
    api.incidentTemplates.get,
    convexAvailable ? { id: id as Id<"incidentTemplates"> } : "skip"
  );

  const demoTemplate = DEMO_INCIDENT_TEMPLATES.find((t) => t._id === id);
  const data = convexAvailable
    ? (templateQuery ?? null)
    : (demoTemplate ?? null);
  const isLoading = convexAvailable && templateQuery === undefined;

  return { data, isLoading };
}

export function useActiveIncidentTemplates(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.incidentTemplates.listActive,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const demoData = DEMO_INCIDENT_TEMPLATES.filter(
    (t) => t.orgId === orgId && t.isActive
  );
  const data: IncidentTemplateData[] = convexAvailable
    ? ((activeQuery ?? []) as IncidentTemplateData[])
    : demoData;
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function useIncidentTemplatesByType(
  orgId: Id<"orgs"> | string,
  incidentType: IncidentType
) {
  const convexAvailable = useConvexAvailable();

  const typeQuery = useQuery(
    api.incidentTemplates.listByType,
    convexAvailable ? { orgId: orgId as Id<"orgs">, incidentType } : "skip"
  );

  const demoData = DEMO_INCIDENT_TEMPLATES.filter(
    (t) => t.orgId === orgId && t.incidentType === incidentType
  );
  const data: IncidentTemplateData[] = convexAvailable
    ? ((typeQuery ?? []) as IncidentTemplateData[])
    : demoData;
  const isLoading = convexAvailable && typeQuery === undefined;

  return { data, isLoading };
}
