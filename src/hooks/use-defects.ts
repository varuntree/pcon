"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type DefectData = Doc<"defects">;
export type DefectStatus = "open" | "in_progress" | "resolved" | "closed";
export type DefectCategory = "builder" | "client" | "safety" | "other";
export type DefectPriority = "low" | "medium" | "high" | "critical";
export type DefectSourceType = "asset" | "itp" | "incident" | "defect" | "manual";

export interface DefectComment {
  id: string;
  workerId: Id<"workers">;
  comment: string;
  createdAt: number;
}

export interface CreateDefectInput {
  orgId: Id<"orgs">;
  projectId: Id<"projects">;
  title: string;
  description?: string;
  category: DefectCategory;
  location?: string;
  level?: string;
  area?: string;
  priority: DefectPriority;
  assignedTo?: Id<"orgs">;
  assignedWorkerId?: Id<"workers">;
  dueDate?: number;
  sourceType?: DefectSourceType;
  sourceId?: string;
  assetId?: Id<"assets">;
  createdBy: Id<"workers">;
}

export interface UpdateDefectInput {
  id: Id<"defects">;
  title?: string;
  description?: string;
  category?: DefectCategory;
  location?: string;
  level?: string;
  area?: string;
  priority?: DefectPriority;
  assignedTo?: Id<"orgs">;
  assignedWorkerId?: Id<"workers">;
  dueDate?: number;
}

export function useDefects(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const defectsQuery = useQuery(
    api.defects.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const createMutation = useMutation(api.defects.create);
  const updateMutation = useMutation(api.defects.update);
  const addCommentMutation = useMutation(api.defects.addComment);
  const startProgressMutation = useMutation(api.defects.startProgress);
  const resolveMutation = useMutation(api.defects.resolve);
  const closeMutation = useMutation(api.defects.close);
  const reopenMutation = useMutation(api.defects.reopen);

  const data: DefectData[] = convexAvailable ? (defectsQuery ?? []) : [];
  const isLoading = convexAvailable && defectsQuery === undefined;

  const actions = {
    create: async (input: CreateDefectInput): Promise<Id<"defects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-defect" as Id<"defects">;
      }
      return await createMutation(input);
    },
    update: async (input: UpdateDefectInput): Promise<Id<"defects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    addComment: async (
      id: Id<"defects">,
      workerId: Id<"workers">,
      comment: string
    ): Promise<Id<"defects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - addComment operation is a no-op");
        return id;
      }
      return await addCommentMutation({ id, workerId, comment });
    },
    startProgress: async (id: Id<"defects">): Promise<Id<"defects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - startProgress operation is a no-op");
        return id;
      }
      return await startProgressMutation({ id });
    },
    resolve: async (id: Id<"defects">): Promise<Id<"defects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - resolve operation is a no-op");
        return id;
      }
      return await resolveMutation({ id });
    },
    close: async (
      id: Id<"defects">,
      closedBy: Id<"workers">
    ): Promise<Id<"defects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - close operation is a no-op");
        return id;
      }
      return await closeMutation({ id, closedBy });
    },
    reopen: async (id: Id<"defects">): Promise<Id<"defects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - reopen operation is a no-op");
        return id;
      }
      return await reopenMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useDefect(id: Id<"defects"> | string) {
  const convexAvailable = useConvexAvailable();

  const defectQuery = useQuery(
    api.defects.get,
    convexAvailable ? { id: id as Id<"defects"> } : "skip"
  );

  const data = convexAvailable ? (defectQuery ?? null) : null;
  const isLoading = convexAvailable && defectQuery === undefined;

  return { data, isLoading };
}

export function useDefectWithDetails(id: Id<"defects"> | string) {
  const convexAvailable = useConvexAvailable();

  const defectQuery = useQuery(
    api.defects.getWithDetails,
    convexAvailable ? { id: id as Id<"defects"> } : "skip"
  );

  const data = convexAvailable ? (defectQuery ?? null) : null;
  const isLoading = convexAvailable && defectQuery === undefined;

  return { data, isLoading };
}

export function useDefectsByStatus(
  projectId: Id<"projects"> | string,
  status: DefectStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.defects.listByStatus,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, status }
      : "skip"
  );

  const data: DefectData[] = convexAvailable ? (statusQuery ?? []) : [];
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useDefectsByCategory(category: DefectCategory) {
  const convexAvailable = useConvexAvailable();

  const categoryQuery = useQuery(
    api.defects.listByCategory,
    convexAvailable ? { category } : "skip"
  );

  const data: DefectData[] = convexAvailable ? (categoryQuery ?? []) : [];
  const isLoading = convexAvailable && categoryQuery === undefined;

  return { data, isLoading };
}

export function useDefectsByAsset(assetId: Id<"assets"> | string) {
  const convexAvailable = useConvexAvailable();

  const assetQuery = useQuery(
    api.defects.listByAsset,
    convexAvailable ? { assetId: assetId as Id<"assets"> } : "skip"
  );

  const data: DefectData[] = convexAvailable ? (assetQuery ?? []) : [];
  const isLoading = convexAvailable && assetQuery === undefined;

  return { data, isLoading };
}
