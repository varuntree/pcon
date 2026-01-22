"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoPermitType = Doc<"permitTypes"> & {
  _id: Id<"permitTypes">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_PERMIT_TYPES: DemoPermitType[] = [
  {
    _id: "permtype1" as Id<"permitTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Hot Work Permit",
    code: "HWP",
    description: "Required for welding, cutting, grinding operations",
    requiredFields: [
      {
        id: "location",
        label: "Work Location",
        type: "text" as const,
        required: true,
      },
      {
        id: "equipment",
        label: "Equipment to be used",
        type: "multiselect" as const,
        required: true,
        options: ["Welding machine", "Angle grinder", "Oxy-acetylene torch"],
      },
      {
        id: "firewatch",
        label: "Fire watch required?",
        type: "yesno" as const,
        required: true,
      },
    ],
    defaultValidityHours: 8,
    riskLevel: "high" as const,
    isActive: true,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "permtype2" as Id<"permitTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Confined Space Entry Permit",
    code: "CSE",
    description: "Required for entry into confined spaces",
    requiredFields: [
      {
        id: "space_id",
        label: "Confined Space ID",
        type: "text" as const,
        required: true,
      },
      {
        id: "atmosphere_tested",
        label: "Atmosphere tested?",
        type: "yesno" as const,
        required: true,
      },
      {
        id: "rescue_plan",
        label: "Rescue plan available?",
        type: "yesno" as const,
        required: true,
      },
    ],
    defaultValidityHours: 4,
    riskLevel: "high" as const,
    isActive: true,
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "permtype3" as Id<"permitTypes">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Excavation Permit",
    code: "EXC",
    description: "Required for excavation work",
    requiredFields: [
      {
        id: "depth",
        label: "Expected depth (m)",
        type: "number" as const,
        required: true,
      },
      {
        id: "services_checked",
        label: "Underground services checked?",
        type: "yesno" as const,
        required: true,
      },
    ],
    defaultValidityHours: 24,
    riskLevel: "medium" as const,
    isActive: true,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
];

// Types
export type PermitRiskLevel = "low" | "medium" | "high";
export type PermitFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "date"
  | "yesno"
  | "checkbox";

export interface PermitRequiredField {
  id: string;
  label: string;
  type: PermitFieldType;
  required: boolean;
  options?: string[];
}

export type PermitTypeData = DemoPermitType;

// Input types
export interface CreatePermitTypeInput {
  orgId: Id<"orgs">;
  name: string;
  code: string;
  description?: string;
  requiredFields: PermitRequiredField[];
  defaultValidityHours: number;
  riskLevel: PermitRiskLevel;
  checklistTemplateId?: string;
}

export interface UpdatePermitTypeInput {
  id: Id<"permitTypes">;
  name?: string;
  description?: string;
  requiredFields?: PermitRequiredField[];
  defaultValidityHours?: number;
  riskLevel?: PermitRiskLevel;
  checklistTemplateId?: string;
  isActive?: boolean;
}

export function usePermitTypes(orgId: Id<"orgs"> | string): {
  data: PermitTypeData[];
  actions: {
    create: (
      input: Omit<CreatePermitTypeInput, "orgId">
    ) => Promise<Id<"permitTypes">>;
    update: (input: UpdatePermitTypeInput) => Promise<Id<"permitTypes">>;
    deactivate: (id: Id<"permitTypes">) => Promise<Id<"permitTypes">>;
    reactivate: (id: Id<"permitTypes">) => Promise<Id<"permitTypes">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const permitTypesQuery = useQuery(
    api.permitTypes.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.permitTypes.create);
  const updateMutation = useMutation(api.permitTypes.update);
  const deactivateMutation = useMutation(api.permitTypes.deactivate);
  const reactivateMutation = useMutation(api.permitTypes.reactivate);

  const demoData = DEMO_PERMIT_TYPES.filter((pt) => pt.orgId === orgId);
  const data: PermitTypeData[] = convexAvailable
    ? ((permitTypesQuery ?? []) as PermitTypeData[])
    : demoData;
  const isLoading = convexAvailable && permitTypesQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreatePermitTypeInput, "orgId">
    ): Promise<Id<"permitTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-permtype-new" as Id<"permitTypes">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (input: UpdatePermitTypeInput): Promise<Id<"permitTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
    deactivate: async (id: Id<"permitTypes">): Promise<Id<"permitTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - deactivate operation is a no-op");
        return id;
      }
      return await deactivateMutation({ id });
    },
    reactivate: async (id: Id<"permitTypes">): Promise<Id<"permitTypes">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - reactivate operation is a no-op");
        return id;
      }
      return await reactivateMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function usePermitType(id: Id<"permitTypes"> | string) {
  const convexAvailable = useConvexAvailable();

  const permitTypeQuery = useQuery(
    api.permitTypes.get,
    convexAvailable ? { id: id as Id<"permitTypes"> } : "skip"
  );

  const demoPermitType = DEMO_PERMIT_TYPES.find((pt) => pt._id === id);
  const data = convexAvailable
    ? (permitTypeQuery ?? null)
    : (demoPermitType ?? null);
  const isLoading = convexAvailable && permitTypeQuery === undefined;

  return { data, isLoading };
}

export function useActivePermitTypes(orgId: Id<"orgs"> | string) {
  const convexAvailable = useConvexAvailable();

  const activeQuery = useQuery(
    api.permitTypes.listActive,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );

  const demoData = DEMO_PERMIT_TYPES.filter(
    (pt) => pt.orgId === orgId && pt.isActive
  );
  const data: PermitTypeData[] = convexAvailable
    ? ((activeQuery ?? []) as PermitTypeData[])
    : demoData;
  const isLoading = convexAvailable && activeQuery === undefined;

  return { data, isLoading };
}
