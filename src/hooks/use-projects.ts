"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo project type for fallback data
type DemoProject = Doc<"projects"> & { _id: Id<"projects">; _creationTime: number };

// Demo data fallback when Convex is not configured
const DEMO_PROJECTS: DemoProject[] = [
  {
    _id: "proj1" as Id<"projects">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Riverside Apartments",
    code: "RSA-001",
    address: "123 River St, Sydney NSW 2000",
    value: 5000000,
    status: "active" as const,
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 180 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: "proj2" as Id<"projects">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    name: "Harbor Office Tower",
    code: "HOT-002",
    address: "45 Harbor View, Sydney NSW 2000",
    value: 12000000,
    status: "planning" as const,
    startDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
    endDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export type ProjectStatus = "planning" | "active" | "completed" | "archived";

export interface CreateProjectInput {
  orgId: Id<"orgs">;
  clientOrgId?: Id<"orgs">;
  name: string;
  code: string;
  address?: string;
  value?: number;
  status?: ProjectStatus;
  startDate?: number;
  endDate?: number;
  metadata?: unknown;
}

export interface UpdateProjectInput {
  id: Id<"projects">;
  name?: string;
  code?: string;
  clientOrgId?: Id<"orgs">;
  address?: string;
  value?: number;
  status?: ProjectStatus;
  startDate?: number;
  endDate?: number;
  metadata?: unknown;
}

// Project data returned from hook
export type ProjectData = DemoProject;

export function useProjects(orgId: Id<"orgs"> | string): {
  data: ProjectData[];
  actions: {
    create: (input: Omit<CreateProjectInput, "orgId">) => Promise<Id<"projects">>;
    update: (input: UpdateProjectInput) => Promise<Id<"projects">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  // Use "skip" to skip the query when Convex is not available
  const projectsQuery = useQuery(
    api.projects.listByOrg,
    convexAvailable ? { orgId: orgId as Id<"orgs"> } : "skip"
  );
  const createMutation = useMutation(api.projects.create);
  const updateMutation = useMutation(api.projects.update);

  // Use demo data fallback filtered by org
  const demoData = DEMO_PROJECTS.filter((p) => p.orgId === orgId);
  const data: ProjectData[] = convexAvailable
    ? ((projectsQuery ?? []) as ProjectData[])
    : demoData;
  const isLoading = convexAvailable && projectsQuery === undefined;

  const actions = {
    create: async (input: Omit<CreateProjectInput, "orgId">): Promise<Id<"projects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-proj-new" as Id<"projects">;
      }
      return await createMutation({ ...input, orgId: orgId as Id<"orgs"> });
    },
    update: async (input: UpdateProjectInput): Promise<Id<"projects">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - update operation is a no-op");
        return input.id;
      }
      return await updateMutation(input);
    },
  };

  return { data, actions, isLoading };
}

export function useProject(id: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.projects.get,
    convexAvailable ? { id: id as Id<"projects"> } : "skip"
  );

  // Use demo data fallback
  const demoProject = DEMO_PROJECTS.find((p) => p._id === id);
  const data = convexAvailable ? (projectQuery ?? null) : (demoProject ?? null);
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}

export function useProjectStats(id: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const statsQuery = useQuery(
    api.projects.getStats,
    convexAvailable ? { id: id as Id<"projects"> } : "skip"
  );

  // Demo stats fallback
  const demoStats = {
    workerCount: 12,
    workPackageCount: 8,
    activeWorkPackageCount: 3,
  };

  const data = convexAvailable ? (statsQuery ?? demoStats) : demoStats;
  const isLoading = convexAvailable && statsQuery === undefined;

  return { data, isLoading };
}

export function useProjectsByStatus(orgId: Id<"orgs"> | string, status: ProjectStatus) {
  const { data: projects, isLoading } = useProjects(orgId);

  const filtered = projects.filter((p) => p.status === status);

  return { data: filtered, isLoading };
}
