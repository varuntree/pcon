"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type AssetData = Doc<"assets">;
export type AssetType = "plant" | "equipment" | "vehicle" | "tool" | "other";
export type AssetStatus = "available" | "in_use" | "maintenance" | "retired";

export interface CreateAssetInput {
  orgId: Id<"orgs">;
  projectId?: Id<"projects">;
  registerId: Id<"assetRegisters">;
  assetType: AssetType;
  name: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  registrationNumber?: string;
  vin?: string;
  year?: number;
  createdBy: Id<"workers">;
}

export interface UpdateAssetInput {
  id: Id<"assets">;
  name?: string;
  description?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  registrationNumber?: string;
  vin?: string;
  year?: number;
  odometerKm?: number;
  odometerHours?: number;
  purchaseDate?: number;
  purchasePrice?: number;
  imageId?: Id<"_storage">;
  qrCode?: string;
  nextServiceDue?: number;
}

export function useAssets(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const assetsQuery = useQuery(
    api.assets.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.assets.create);
  const updateMutation = useMutation(api.assets.update);
  const updateStatusMutation = useMutation(api.assets.updateStatus);
  const retireMutation = useMutation(api.assets.retire);
  const updateOdometerMutation = useMutation(api.assets.updateOdometer);

  const data: AssetData[] = convexAvailable ? (assetsQuery ?? []) : [];
  const isLoading = convexAvailable && assetsQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateAssetInput, "orgId">
    ): Promise<Id<"assets">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-asset" as Id<"assets">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (input: UpdateAssetInput): Promise<Id<"assets">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    updateStatus: async (
      id: Id<"assets">,
      status: AssetStatus
    ): Promise<Id<"assets">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - updateStatus operation is a no-op");
        return id;
      }
      return await updateStatusMutation({ id, status });
    },
    retire: async (id: Id<"assets">): Promise<Id<"assets">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - retire operation is a no-op");
        return id;
      }
      return await retireMutation({ id });
    },
    updateOdometer: async (
      id: Id<"assets">,
      odometerKm?: number,
      odometerHours?: number
    ): Promise<Id<"assets">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - updateOdometer operation is a no-op");
        return id;
      }
      return await updateOdometerMutation({ id, odometerKm, odometerHours });
    },
  };

  return { data, actions, isLoading };
}

export function useAsset(id: Id<"assets"> | string) {
  const convexAvailable = useConvexAvailable();

  const assetQuery = useQuery(
    api.assets.get,
    convexAvailable ? { id: id as Id<"assets"> } : "skip"
  );

  const data = convexAvailable ? (assetQuery ?? null) : null;
  const isLoading = convexAvailable && assetQuery === undefined;

  return { data, isLoading };
}

export function useAssetByQRCode(qrCode: string) {
  const convexAvailable = useConvexAvailable();

  const assetQuery = useQuery(
    api.assets.getByQRCode,
    convexAvailable && qrCode ? { qrCode } : "skip"
  );

  const data = convexAvailable ? (assetQuery ?? null) : null;
  const isLoading = convexAvailable && assetQuery === undefined;

  return { data, isLoading };
}

export function useAssetWithDetails(id: Id<"assets"> | string) {
  const convexAvailable = useConvexAvailable();

  const assetQuery = useQuery(
    api.assets.getWithDetails,
    convexAvailable ? { id: id as Id<"assets"> } : "skip"
  );

  const data = convexAvailable ? (assetQuery ?? null) : null;
  const isLoading = convexAvailable && assetQuery === undefined;

  return { data, isLoading };
}

export function useAssetsByProject(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.assets.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const data: AssetData[] = convexAvailable ? (projectQuery ?? []) : [];
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}

export function useAssetsByRegister(registerId: Id<"assetRegisters"> | string) {
  const convexAvailable = useConvexAvailable();

  const registerQuery = useQuery(
    api.assets.listByRegister,
    convexAvailable ? { registerId: registerId as Id<"assetRegisters"> } : "skip"
  );

  const data: AssetData[] = convexAvailable ? (registerQuery ?? []) : [];
  const isLoading = convexAvailable && registerQuery === undefined;

  return { data, isLoading };
}

export function useAssetsByStatus(
  orgId: Id<"orgs"> | string,
  status: AssetStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.assets.listByStatus,
    convexAvailable ? { orgId: orgId as Id<"orgs">, status } : "skip"
  );

  const data: AssetData[] = convexAvailable ? (statusQuery ?? []) : [];
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}

export function useAvailableAssets(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const availableQuery = useQuery(
    api.assets.listAvailable,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const data: AssetData[] = convexAvailable ? (availableQuery ?? []) : [];
  const isLoading = convexAvailable && availableQuery === undefined;

  return { data, isLoading };
}
