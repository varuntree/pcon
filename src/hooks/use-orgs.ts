"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo org type for fallback data
type DemoOrg = Doc<"orgs"> & { _id: Id<"orgs">; _creationTime: number };

// Demo data fallback when Convex is not configured
const DEMO_ORGS: DemoOrg[] = [
  {
    _id: "demo" as Id<"orgs">,
    _creationTime: Date.now(),
    name: "BuildRight Construction",
    abn: "12345678901",
    kind: "principal" as const,
    contactName: "John Builder",
    contactEmail: "john@buildright.com.au",
    contactPhone: "0412345678",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "org2" as Id<"orgs">,
    _creationTime: Date.now(),
    name: "Metro Developments",
    abn: "98765432101",
    kind: "principal" as const,
    contactName: "Sarah Dev",
    contactEmail: "sarah@metro.com.au",
    contactPhone: "0487654321",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export type OrgKind = "principal" | "subcontractor" | "client" | "supplier" | "regulator" | "other";

export interface CreateOrgInput {
  name: string;
  abn?: string;
  kind: OrgKind;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  metadata?: unknown;
}

export interface UpdateOrgInput {
  id: Id<"orgs">;
  name?: string;
  abn?: string;
  kind?: OrgKind;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  metadata?: unknown;
}

// Org data returned from hook
export type OrgData = DemoOrg;

export function useOrgs(): {
  data: OrgData[];
  actions: {
    create: (input: CreateOrgInput) => Promise<Id<"orgs">>;
    update: (input: UpdateOrgInput) => Promise<Id<"orgs">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  // Use "skip" to skip the query when Convex is not available
  const orgsQuery = useQuery(api.orgs.list, convexAvailable ? {} : "skip");
  const createMutation = useMutation(api.orgs.create);
  const updateMutation = useMutation(api.orgs.update);

  // Use demo data if Convex is not available
  const data: OrgData[] = convexAvailable
    ? ((orgsQuery ?? []) as OrgData[])
    : DEMO_ORGS;
  const isLoading = convexAvailable && orgsQuery === undefined;

  const actions = {
    create: async (input: CreateOrgInput): Promise<Id<"orgs">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-new" as Id<"orgs">;
      }
      return await createMutation(input);
    },
    update: async (input: UpdateOrgInput): Promise<Id<"orgs">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
  };

  return { data, actions, isLoading };
}

export function useOrg(id: Id<"orgs"> | string) {
  const { data: orgs, isLoading } = useOrgs();

  const org = orgs.find((o) => o._id === id);

  return { data: org ?? null, isLoading };
}

export function useOrgsByKind(kind: OrgKind) {
  const { data: orgs, isLoading } = useOrgs();

  const filtered = orgs.filter((o) => o.kind === kind);

  return { data: filtered, isLoading };
}

export interface OrgSafetyStats {
  activeProjects: number;
  totalWorkers: number;
  openIncidents: number;
  pendingPermits: number;
  awaitingReview: number;
  swmsNeedingSignatures: number;
}

const DEMO_SAFETY_STATS: OrgSafetyStats = {
  activeProjects: 2,
  totalWorkers: 15,
  openIncidents: 1,
  pendingPermits: 3,
  awaitingReview: 2,
  swmsNeedingSignatures: 4,
};

export function useOrgSafetyStats(orgId: Id<"orgs"> | string): {
  data: OrgSafetyStats | null;
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const statsQuery = useQuery(
    api.orgs.getSafetyStats,
    convexAvailable ? { id: orgId as Id<"orgs"> } : "skip"
  );

  const data: OrgSafetyStats | null = convexAvailable
    ? (statsQuery ?? null)
    : DEMO_SAFETY_STATS;
  const isLoading = convexAvailable && statsQuery === undefined;

  return { data, isLoading };
}
