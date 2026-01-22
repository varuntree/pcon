"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type AssetAllocationData = Doc<"assetAllocations">;
export type AllocationType = "reservation" | "assignment";
export type AllocationStatus = "pending" | "active" | "completed" | "cancelled";

export interface CreateAssetAllocationInput {
  assetId: Id<"assets">;
  projectId?: Id<"projects">;
  allocationType: AllocationType;
  workerId?: Id<"workers">;
  orgId?: Id<"orgs">;
  startDate: number;
  endDate?: number;
  notes?: string;
  createdBy: Id<"workers">;
}

export interface UpdateAssetAllocationInput {
  id: Id<"assetAllocations">;
  startDate?: number;
  endDate?: number;
  notes?: string;
}

export interface AllocationConflict {
  hasConflict: boolean;
  conflicts: AssetAllocationData[];
}

export function useAssetAllocations(assetId: Id<"assets"> | string) {
  const convexAvailable = useConvexAvailable();

  const allocationsQuery = useQuery(
    api.assetAllocations.listByAsset,
    convexAvailable ? { assetId: assetId as Id<"assets"> } : "skip"
  );
  const createMutation = useMutation(api.assetAllocations.create);
  const updateMutation = useMutation(api.assetAllocations.update);
  const activateMutation = useMutation(api.assetAllocations.activate);
  const completeMutation = useMutation(api.assetAllocations.complete);
  const cancelMutation = useMutation(api.assetAllocations.cancel);

  const data: AssetAllocationData[] = convexAvailable
    ? (allocationsQuery ?? [])
    : [];
  const isLoading = convexAvailable && allocationsQuery === undefined;

  const actions = {
    create: async (
      input: CreateAssetAllocationInput
    ): Promise<Id<"assetAllocations">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-allocation" as Id<"assetAllocations">;
      }
      return await createMutation(input);
    },
    update: async (
      input: UpdateAssetAllocationInput
    ): Promise<Id<"assetAllocations">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    activate: async (
      id: Id<"assetAllocations">
    ): Promise<Id<"assetAllocations">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - activate operation is a no-op");
        return id;
      }
      return await activateMutation({ id });
    },
    complete: async (
      id: Id<"assetAllocations">
    ): Promise<Id<"assetAllocations">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - complete operation is a no-op");
        return id;
      }
      return await completeMutation({ id });
    },
    cancel: async (
      id: Id<"assetAllocations">
    ): Promise<Id<"assetAllocations">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - cancel operation is a no-op");
        return id;
      }
      return await cancelMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useAssetAllocation(id: Id<"assetAllocations"> | string) {
  const convexAvailable = useConvexAvailable();

  const allocationQuery = useQuery(
    api.assetAllocations.get,
    convexAvailable ? { id: id as Id<"assetAllocations"> } : "skip"
  );

  const data = convexAvailable ? (allocationQuery ?? null) : null;
  const isLoading = convexAvailable && allocationQuery === undefined;

  return { data, isLoading };
}

export function useAssetAllocationsByProject(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.assetAllocations.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const data: AssetAllocationData[] = convexAvailable
    ? (projectQuery ?? [])
    : [];
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}

export function useAssetAllocationsByWorker(workerId: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const workerQuery = useQuery(
    api.assetAllocations.listByWorker,
    convexAvailable ? { workerId: workerId as Id<"workers"> } : "skip"
  );

  const data: AssetAllocationData[] = convexAvailable
    ? (workerQuery ?? [])
    : [];
  const isLoading = convexAvailable && workerQuery === undefined;

  return { data, isLoading };
}

export function useActiveAssetAllocations(assetId: Id<"assets"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.assetAllocations.listActive,
    convexAvailable ? { assetId: assetId as Id<"assets"> } : "skip"
  );

  const data: AssetAllocationData[] = convexAvailable
    ? (activeQuery ?? [])
    : [];
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function useAssetAllocationConflict(
  assetId: Id<"assets"> | string,
  startDate: number,
  endDate?: number,
  excludeAllocationId?: Id<"assetAllocations">
) {
  const convexAvailable = useConvexAvailable();

  const conflictQuery = useQuery(
    api.assetAllocations.checkConflict,
    convexAvailable
      ? {
          assetId: assetId as Id<"assets">,
          startDate,
          endDate,
          excludeAllocationId,
        }
      : "skip"
  );

  const data: AllocationConflict = convexAvailable
    ? (conflictQuery ?? { hasConflict: false, conflicts: [] })
    : { hasConflict: false, conflicts: [] };
  const isLoading = convexAvailable && conflictQuery === undefined;

  return { data, isLoading };
}

export function useAssetAllocationsByDateRange(
  assetId: Id<"assets"> | string,
  startDate: number,
  endDate: number
) {
  const convexAvailable = useConvexAvailable();

  const dateRangeQuery = useQuery(
    api.assetAllocations.listByDateRange,
    convexAvailable
      ? { assetId: assetId as Id<"assets">, startDate, endDate }
      : "skip"
  );

  const data: AssetAllocationData[] = convexAvailable
    ? (dateRangeQuery ?? [])
    : [];
  const isLoading = convexAvailable && dateRangeQuery === undefined;

  return { data, isLoading };
}
