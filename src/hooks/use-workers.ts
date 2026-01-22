"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo worker type for fallback data
type DemoWorker = Doc<"workers"> & { _id: Id<"workers">; _creationTime: number };

// Demo data fallback when Convex is not configured
const DEMO_WORKERS: DemoWorker[] = [
  {
    _id: "worker1" as Id<"workers">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    fullName: "Mike Johnson",
    email: "mike.johnson@buildright.com.au",
    phone: "0412111222",
    role: "site_supervisor" as const,
    status: "active" as const,
    tradeId: "trade1" as Id<"trades">,
    employer: "BuildRight Construction",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "worker2" as Id<"workers">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    fullName: "Sarah Chen",
    email: "sarah.chen@buildright.com.au",
    phone: "0412333444",
    role: "tradesperson" as const,
    status: "active" as const,
    tradeId: "trade2" as Id<"trades">,
    employer: "BuildRight Construction",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "worker3" as Id<"workers">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    fullName: "Tom Williams",
    email: "tom.williams@buildright.com.au",
    phone: "0412555666",
    role: "laborer" as const,
    status: "pending" as const,
    employer: "BuildRight Construction",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export type WorkerStatus = "pending" | "active" | "inactive";
export type WorkerRole =
  | "project_manager"
  | "site_supervisor"
  | "foreman"
  | "tradesperson"
  | "laborer"
  | "safety_officer"
  | "admin";

export interface CreateWorkerInput {
  orgId: Id<"orgs">;
  fullName: string;
  email: string;
  phone?: string;
  role: WorkerRole;
  status?: WorkerStatus;
  tradeId?: Id<"trades">;
  employer?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  medicalConditions?: string;
  allergies?: string;
  metadata?: unknown;
}

export interface UpdateWorkerInput {
  id: Id<"workers">;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: WorkerRole;
  status?: WorkerStatus;
  tradeId?: Id<"trades">;
  employer?: string;
  avatarId?: Id<"_storage">;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  medicalConditions?: string;
  allergies?: string;
  metadata?: unknown;
}

// Worker data returned from hook
export type WorkerData = DemoWorker;

export function useWorkers(orgId: Id<"orgs"> | string): {
  data: WorkerData[];
  actions: {
    create: (input: Omit<CreateWorkerInput, "orgId">) => Promise<Id<"workers">>;
    update: (input: UpdateWorkerInput) => Promise<Id<"workers">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  // Use "skip" to skip the query when Convex is not available
  const workersQuery = useQuery(
    api.workers.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.workers.create);
  const updateMutation = useMutation(api.workers.update);

  // Use demo data fallback filtered by org
  const demoData = DEMO_WORKERS.filter((w) => w.orgId === orgId);
  const data: WorkerData[] = convexAvailable
    ? ((workersQuery ?? []) as WorkerData[])
    : demoData;
  const isLoading = convexAvailable && workersQuery === undefined;

  const actions = {
    create: async (input: Omit<CreateWorkerInput, "orgId">): Promise<Id<"workers">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-worker-new" as Id<"workers">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (input: UpdateWorkerInput): Promise<Id<"workers">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
  };

  return { data, actions, isLoading };
}

export function useWorker(id: Id<"workers"> | string) {
  const convexAvailable = useConvexAvailable();

  const workerQuery = useQuery(
    api.workers.get,
    convexAvailable ? { id: id as Id<"workers"> } : "skip"
  );

  // Use demo data fallback
  const demoWorker = DEMO_WORKERS.find((w) => w._id === id);
  const data = convexAvailable ? (workerQuery ?? null) : (demoWorker ?? null);
  const isLoading = convexAvailable && workerQuery === undefined;

  return { data, isLoading };
}

export function useWorkersByProject(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const workersQuery = useQuery(
    api.workers.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  // Demo workers assigned to project
  const demoData = DEMO_WORKERS.slice(0, 2).map((w) => ({
    ...w,
    assignmentRole: w.role,
    assignedAt: Date.now(),
  }));

  const data = convexAvailable ? (workersQuery ?? []) : demoData;
  const isLoading = convexAvailable && workersQuery === undefined;

  return { data, isLoading };
}

export function useWorkersByStatus(orgId: Id<"orgs"> | string, status: WorkerStatus) {
  const { data: workers, isLoading } = useWorkers(orgId);

  const filtered = workers.filter((w) => w.status === status);

  return { data: filtered, isLoading };
}
