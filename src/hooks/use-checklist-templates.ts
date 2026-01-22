"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type ChecklistTemplateData = Doc<"checklistTemplates">;
export type ChecklistFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "yesno"
  | "checkbox"
  | "select"
  | "multiselect"
  | "photo"
  | "signature"
  | "attachment"
  | "instruction"
  | "notes"
  | "action_trigger";

export interface ChecklistField {
  id: string;
  type: ChecklistFieldType;
  label: string;
  required: boolean;
  order: number;
  helpText?: string;
  options?: string[];
  min?: number;
  max?: number;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  maxPhotos?: number;
  signatureConfig?: {
    label: string;
    role: string;
    required: boolean;
  };
  actionTrigger?: {
    triggerWhen: string;
    actionTitle: string;
    actionPriority: string;
  };
  conditions?: Array<{
    triggerFieldId: string;
    operator: "equals";
    value: unknown;
    action: "show" | "hide";
  }>;
}

export interface ChecklistSection {
  id: string;
  title: string;
  order: number;
  fields: ChecklistField[];
}

export interface CreateChecklistTemplateInput {
  orgId: Id<"orgs">;
  projectId?: Id<"projects">;
  name: string;
  description?: string;
  scope?: string;
  sections: ChecklistSection[];
  isActive?: boolean;
  createdBy: Id<"workers">;
}

export interface UpdateChecklistTemplateInput {
  id: Id<"checklistTemplates">;
  name?: string;
  description?: string;
  scope?: string;
  sections?: ChecklistSection[];
  isActive?: boolean;
}

export function useChecklistTemplates(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const templatesQuery = useQuery(
    api.checklistTemplates.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.checklistTemplates.create);
  const updateMutation = useMutation(api.checklistTemplates.update);
  const activateMutation = useMutation(api.checklistTemplates.activate);
  const deactivateMutation = useMutation(api.checklistTemplates.deactivate);
  const cloneMutation = useMutation(api.checklistTemplates.clone);

  const data: ChecklistTemplateData[] = convexAvailable
    ? (templatesQuery ?? [])
    : [];
  const isLoading = convexAvailable && templatesQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateChecklistTemplateInput, "orgId">
    ): Promise<Id<"checklistTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-template" as Id<"checklistTemplates">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (
      input: UpdateChecklistTemplateInput
    ): Promise<Id<"checklistTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    activate: async (
      id: Id<"checklistTemplates">
    ): Promise<Id<"checklistTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - activate operation is a no-op");
        return id;
      }
      return await activateMutation({ id });
    },
    deactivate: async (
      id: Id<"checklistTemplates">
    ): Promise<Id<"checklistTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - deactivate operation is a no-op");
        return id;
      }
      return await deactivateMutation({ id });
    },
    clone: async (
      id: Id<"checklistTemplates">,
      name: string,
      createdBy: Id<"workers">
    ): Promise<Id<"checklistTemplates">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - clone operation is a no-op");
        return "demo-clone" as Id<"checklistTemplates">;
      }
      return await cloneMutation({ id, name, createdBy });
    },
  };

  return { data, actions, isLoading };
}

export function useChecklistTemplate(id: Id<"checklistTemplates"> | string) {
  const convexAvailable = useConvexAvailable();

  const templateQuery = useQuery(
    api.checklistTemplates.get,
    convexAvailable ? { id: id as Id<"checklistTemplates"> } : "skip"
  );

  const data = convexAvailable ? (templateQuery ?? null) : null;
  const isLoading = convexAvailable && templateQuery === undefined;

  return { data, isLoading };
}

export function useActiveChecklistTemplates(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.checklistTemplates.listActive,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const data: ChecklistTemplateData[] = convexAvailable
    ? (activeQuery ?? [])
    : [];
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function useProjectChecklistTemplates(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.checklistTemplates.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const data: ChecklistTemplateData[] = convexAvailable
    ? (projectQuery ?? [])
    : [];
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}
