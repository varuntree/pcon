"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type AssetRegisterData = Doc<"assetRegisters">;
export type AssetType = "plant" | "equipment" | "vehicle" | "tool" | "other";

export interface CreateAssetRegisterInput {
  orgId: Id<"orgs">;
  projectId?: Id<"projects">;
  name: string;
  description?: string;
  assetType: AssetType;
  createdBy: Id<"workers">;
  isActive?: boolean;
}

export interface UpdateAssetRegisterInput {
  id: Id<"assetRegisters">;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export function useAssetRegisters(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const registersQuery = useQuery(
    api.assetRegisters.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.assetRegisters.create);
  const updateMutation = useMutation(api.assetRegisters.update);
  const activateMutation = useMutation(api.assetRegisters.activate);
  const deactivateMutation = useMutation(api.assetRegisters.deactivate);

  const data: AssetRegisterData[] = convexAvailable
    ? (registersQuery ?? [])
    : [];
  const isLoading = convexAvailable && registersQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateAssetRegisterInput, "orgId">
    ): Promise<Id<"assetRegisters">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-register" as Id<"assetRegisters">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (
      input: UpdateAssetRegisterInput
    ): Promise<Id<"assetRegisters">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    activate: async (
      id: Id<"assetRegisters">
    ): Promise<Id<"assetRegisters">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - activate operation is a no-op");
        return id;
      }
      return await activateMutation({ id });
    },
    deactivate: async (
      id: Id<"assetRegisters">
    ): Promise<Id<"assetRegisters">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - deactivate operation is a no-op");
        return id;
      }
      return await deactivateMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useAssetRegister(id: Id<"assetRegisters"> | string) {
  const convexAvailable = useConvexAvailable();

  const registerQuery = useQuery(
    api.assetRegisters.get,
    convexAvailable ? { id: id as Id<"assetRegisters"> } : "skip"
  );

  const data = convexAvailable ? (registerQuery ?? null) : null;
  const isLoading = convexAvailable && registerQuery === undefined;

  return { data, isLoading };
}

export function useActiveAssetRegisters(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.assetRegisters.listActive,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const data: AssetRegisterData[] = convexAvailable ? (activeQuery ?? []) : [];
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}

export function useAssetRegistersByProject(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.assetRegisters.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const data: AssetRegisterData[] = convexAvailable
    ? (projectQuery ?? [])
    : [];
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}

export function useAssetRegistersByType(
  orgId: Id<"orgs"> | string,
  assetType: AssetType
) {
  const convexAvailable = useConvexAvailable();

  const typeQuery = useQuery(
    api.assetRegisters.listByOrgType,
    convexAvailable
      ? { orgId: orgId as Id<"orgs">, assetType }
      : "skip"
  );

  const data: AssetRegisterData[] = convexAvailable ? (typeQuery ?? []) : [];
  const isLoading = convexAvailable && typeQuery === undefined;

  return { data, isLoading };
}
