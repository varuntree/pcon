"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type ChecklistInstanceData = Doc<"checklistInstances">;
export type ChecklistInstanceStatus = "in_progress" | "completed" | "cancelled";
export type ChecklistSourceType = "asset" | "itp" | "incident" | "defect" | "manual";

export interface ChecklistResponse {
  value: unknown;
  notes?: string;
  attachmentIds?: Id<"_storage">[];
  signature?: string;
  updatedAt?: number;
}

export interface CreateChecklistInstanceInput {
  orgId: Id<"orgs">;
  projectId: Id<"projects">;
  checklistTemplateId: Id<"checklistTemplates">;
  assignedTo?: Id<"workers">;
  dueDate?: number;
  sourceType?: ChecklistSourceType;
  sourceId?: string;
  plantRegisterId?: Id<"assetRegisters">;
  plantAssetId?: Id<"assets">;
  plantBookingId?: string;
}

export function useChecklistInstances(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const instancesQuery = useQuery(
    api.checklistInstances.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const createMutation = useMutation(api.checklistInstances.create);
  const saveResponseMutation = useMutation(api.checklistInstances.saveResponse);
  const saveAllResponsesMutation = useMutation(api.checklistInstances.saveAllResponses);
  const completeMutation = useMutation(api.checklistInstances.complete);
  const cancelMutation = useMutation(api.checklistInstances.cancel);
  const linkDefectMutation = useMutation(api.checklistInstances.linkDefect);
  const linkActionMutation = useMutation(api.checklistInstances.linkAction);

  const data: ChecklistInstanceData[] = convexAvailable
    ? (instancesQuery ?? [])
    : [];
  const isLoading = convexAvailable && instancesQuery === undefined;

  const actions = {
    create: async (
      input: CreateChecklistInstanceInput
    ): Promise<Id<"checklistInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-instance" as Id<"checklistInstances">;
      }
      return await createMutation(input);
    },
    saveResponse: async (
      instanceId: Id<"checklistInstances">,
      fieldId: string,
      value: unknown,
      notes?: string,
      attachmentIds?: Id<"_storage">[]
    ): Promise<Id<"checklistInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - saveResponse operation is a no-op");
        return instanceId;
      }
      return await saveResponseMutation({ instanceId, fieldId, value, notes, attachmentIds });
    },
    saveAllResponses: async (
      instanceId: Id<"checklistInstances">,
      responses: Record<string, ChecklistResponse>,
      performedByWorkerId?: Id<"workers">
    ): Promise<Id<"checklistInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - saveAllResponses operation is a no-op");
        return instanceId;
      }
      return await saveAllResponsesMutation({ instanceId, responses, performedByWorkerId });
    },
    complete: async (
      instanceId: Id<"checklistInstances">,
      performedByWorkerId?: Id<"workers">
    ): Promise<Id<"checklistInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - complete operation is a no-op");
        return instanceId;
      }
      return await completeMutation({ instanceId, performedByWorkerId });
    },
    cancel: async (
      instanceId: Id<"checklistInstances">
    ): Promise<Id<"checklistInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - cancel operation is a no-op");
        return instanceId;
      }
      return await cancelMutation({ instanceId });
    },
    linkDefect: async (
      instanceId: Id<"checklistInstances">,
      defectId: Id<"defects">
    ): Promise<Id<"checklistInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - linkDefect operation is a no-op");
        return instanceId;
      }
      return await linkDefectMutation({ instanceId, defectId });
    },
    linkAction: async (
      instanceId: Id<"checklistInstances">,
      actionId: Id<"actionItems">
    ): Promise<Id<"checklistInstances">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - linkAction operation is a no-op");
        return instanceId;
      }
      return await linkActionMutation({ instanceId, actionId });
    },
  };

  return { data, actions, isLoading };
}

export function useChecklistInstance(id: Id<"checklistInstances"> | string) {
  const convexAvailable = useConvexAvailable();

  const instanceQuery = useQuery(
    api.checklistInstances.get,
    convexAvailable ? { id: id as Id<"checklistInstances"> } : "skip"
  );

  const data = convexAvailable ? (instanceQuery ?? null) : null;
  const isLoading = convexAvailable && instanceQuery === undefined;

  return { data, isLoading };
}

export function useChecklistInstanceWithDetails(id: Id<"checklistInstances"> | string) {
  const convexAvailable = useConvexAvailable();

  const instanceQuery = useQuery(
    api.checklistInstances.getWithDetails,
    convexAvailable ? { id: id as Id<"checklistInstances"> } : "skip"
  );

  const data = convexAvailable ? (instanceQuery ?? null) : null;
  const isLoading = convexAvailable && instanceQuery === undefined;

  return { data, isLoading };
}

export function useChecklistInstancesByStatus(
  projectId: Id<"projects"> | string,
  status: ChecklistInstanceStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.checklistInstances.listByStatus,
    convexAvailable ? { projectId: projectId as Id<"projects">, status } : "skip"
  );

  const data: ChecklistInstanceData[] = convexAvailable
    ? (statusQuery ?? [])
    : [];
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useChecklistInstancesByAssignee(assignedTo: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const assigneeQuery = useQuery(
    api.checklistInstances.listByAssignee,
    convexAvailable ? { assignedTo: assignedTo as Id<"workers"> } : "skip"
  );

  const data: ChecklistInstanceData[] = convexAvailable
    ? (assigneeQuery ?? [])
    : [];
  const isLoading = convexAvailable && assigneeQuery === undefined;

  return { data, isLoading };
}
