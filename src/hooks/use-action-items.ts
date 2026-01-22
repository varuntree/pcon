"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type ActionItemData = Doc<"actionItems">;
export type ActionItemStatus = "open" | "in_progress" | "completed" | "cancelled";
export type ActionPriority = "low" | "medium" | "high" | "critical";
export type ActionSourceType =
  | "checklist"
  | "inspection"
  | "incident"
  | "defect"
  | "itp"
  | "manual";

export interface ActionComment {
  id: string;
  workerId: Id<"workers">;
  comment: string;
  createdAt: number;
}

export interface CreateActionItemInput {
  orgId: Id<"orgs">;
  projectId: Id<"projects">;
  title: string;
  description?: string;
  priority: ActionPriority;
  assignedTo?: Id<"orgs">;
  assignedWorkerId?: Id<"workers">;
  dueDate?: number;
  sourceType?: ActionSourceType;
  sourceId?: string;
  createdBy: Id<"workers">;
}

export interface UpdateActionItemInput {
  id: Id<"actionItems">;
  title?: string;
  description?: string;
  priority?: ActionPriority;
  assignedTo?: Id<"orgs">;
  assignedWorkerId?: Id<"workers">;
  dueDate?: number;
}

export function useActionItems(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const actionsQuery = useQuery(
    api.actionItems.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const createMutation = useMutation(api.actionItems.create);
  const updateMutation = useMutation(api.actionItems.update);
  const addCommentMutation = useMutation(api.actionItems.addComment);
  const addAttachmentMutation = useMutation(api.actionItems.addAttachment);
  const startProgressMutation = useMutation(api.actionItems.startProgress);
  const completeMutation = useMutation(api.actionItems.complete);
  const cancelMutation = useMutation(api.actionItems.cancel);
  const generateShareCodeMutation = useMutation(api.actionItems.generateShareCodeMutation);

  const data: ActionItemData[] = convexAvailable ? (actionsQuery ?? []) : [];
  const isLoading = convexAvailable && actionsQuery === undefined;

  const actions = {
    create: async (input: CreateActionItemInput): Promise<Id<"actionItems">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-action" as Id<"actionItems">;
      }
      return await createMutation(input);
    },
    update: async (input: UpdateActionItemInput): Promise<Id<"actionItems">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    addComment: async (
      id: Id<"actionItems">,
      workerId: Id<"workers">,
      comment: string
    ): Promise<Id<"actionItems">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - addComment operation is a no-op");
        return id;
      }
      return await addCommentMutation({ id, workerId, comment });
    },
    addAttachment: async (
      id: Id<"actionItems">,
      attachmentId: Id<"_storage">
    ): Promise<Id<"actionItems">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - addAttachment operation is a no-op");
        return id;
      }
      return await addAttachmentMutation({ id, attachmentId });
    },
    startProgress: async (id: Id<"actionItems">): Promise<Id<"actionItems">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - startProgress operation is a no-op");
        return id;
      }
      return await startProgressMutation({ id });
    },
    complete: async (id: Id<"actionItems">): Promise<Id<"actionItems">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - complete operation is a no-op");
        return id;
      }
      return await completeMutation({ id });
    },
    cancel: async (
      id: Id<"actionItems">,
      cancelReason: string
    ): Promise<Id<"actionItems">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - cancel operation is a no-op");
        return id;
      }
      return await cancelMutation({ id, cancelReason });
    },
    generateShareCode: async (id: Id<"actionItems">): Promise<string> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - generateShareCode operation is a no-op");
        return "demo-share-code";
      }
      return await generateShareCodeMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useActionItem(id: Id<"actionItems"> | string) {
  const convexAvailable = useConvexAvailable();

  const actionQuery = useQuery(
    api.actionItems.get,
    convexAvailable ? { id: id as Id<"actionItems"> } : "skip"
  );

  const data = convexAvailable ? (actionQuery ?? null) : null;
  const isLoading = convexAvailable && actionQuery === undefined;

  return { data, isLoading };
}

export function useActionItemByShareCode(shareCode: string) {
  const convexAvailable = useConvexAvailable();

  const actionQuery = useQuery(
    api.actionItems.getByShareCode,
    convexAvailable && shareCode ? { shareCode } : "skip"
  );

  const data = convexAvailable ? (actionQuery ?? null) : null;
  const isLoading = convexAvailable && actionQuery === undefined;

  return { data, isLoading };
}

export function useActionItemsByStatus(
  projectId: Id<"projects"> | string,
  status: ActionItemStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.actionItems.listByStatus,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, status }
      : "skip"
  );

  const data: ActionItemData[] = convexAvailable ? (statusQuery ?? []) : [];
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useOverdueActionItems(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const overdueQuery = useQuery(
    api.actionItems.listOverdue,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const data: ActionItemData[] = convexAvailable ? (overdueQuery ?? []) : [];
  const isLoading = convexAvailable && overdueQuery === undefined;

  return { data, isLoading };
}
