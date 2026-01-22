"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

// Demo type for fallback data
type DemoInductionInvite = Doc<"inductionInvites"> & {
  _id: Id<"inductionInvites">;
  _creationTime: number;
};

// Demo data fallback when Convex is not configured
const DEMO_INDUCTION_INVITES: DemoInductionInvite[] = [
  {
    _id: "indinv1" as Id<"inductionInvites">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    inductionTypeId: "indtype2" as Id<"inductionTypes">,
    shareCode: "ABC123XYZ789",
    status: "pending" as const,
    targetName: "John Smith",
    targetEmail: "john.smith@example.com",
    createdBy: "worker1" as Id<"workers">,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "indinv2" as Id<"inductionInvites">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    inductionTypeId: "indtype1" as Id<"inductionTypes">,
    shareCode: "DEF456UVW012",
    status: "awaiting_review" as const,
    targetName: "Jane Doe",
    targetEmail: "jane.doe@example.com",
    createdBy: "worker1" as Id<"workers">,
    expiresAt: Date.now() + 20 * 24 * 60 * 60 * 1000,
    submittedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
  {
    _id: "indinv3" as Id<"inductionInvites">,
    _creationTime: Date.now(),
    orgId: "demo" as Id<"orgs">,
    projectId: "proj1" as Id<"projects">,
    inductionTypeId: "indtype2" as Id<"inductionTypes">,
    shareCode: "GHI789STU345",
    status: "completed" as const,
    targetName: "Bob Wilson",
    targetEmail: "bob.wilson@example.com",
    createdBy: "worker1" as Id<"workers">,
    expiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000,
    submittedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    approvedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
];

// Types
export type InductionInviteStatus = "pending" | "awaiting_review" | "completed";

export type InductionInviteData = DemoInductionInvite;

// Input types
export interface CreateInductionInviteInput {
  orgId: Id<"orgs">;
  projectId: Id<"projects">;
  inductionTypeId: Id<"inductionTypes">;
  createdBy: Id<"workers">;
  targetEmail?: string;
  targetName?: string;
  expiresInDays?: number;
}

export function useInductionInvites(projectId: Id<"projects"> | string): {
  data: InductionInviteData[];
  actions: {
    create: (
      input: Omit<CreateInductionInviteInput, "projectId">
    ) => Promise<Id<"inductionInvites">>;
    deactivate: (id: Id<"inductionInvites">) => Promise<Id<"inductionInvites">>;
  };
  isLoading: boolean;
} {
  const convexAvailable = useConvexAvailable();

  const invitesQuery = useQuery(
    api.inductionInvites.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const createMutation = useMutation(api.inductionInvites.create);
  const deactivateMutation = useMutation(api.inductionInvites.deactivate);

  const demoData = DEMO_INDUCTION_INVITES.filter((i) => i.projectId === projectId);
  const data: InductionInviteData[] = convexAvailable
    ? ((invitesQuery ?? []) as InductionInviteData[])
    : demoData;
  const isLoading = convexAvailable && invitesQuery === undefined;

  const actions = {
    create: async (
      input: Omit<CreateInductionInviteInput, "projectId">
    ): Promise<Id<"inductionInvites">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-indinv-new" as Id<"inductionInvites">;
      }
      return await createMutation({
        ...input,
        projectId: projectId as Id<"projects">,
      });
    },
    deactivate: async (
      id: Id<"inductionInvites">
    ): Promise<Id<"inductionInvites">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - deactivate operation is a no-op");
        return id;
      }
      return await deactivateMutation({ id });
    },
  };

  return { data, actions, isLoading };
}

export function useInductionInvite(id: Id<"inductionInvites"> | string) {
  const convexAvailable = useConvexAvailable();

  const inviteQuery = useQuery(
    api.inductionInvites.get,
    convexAvailable ? { id: id as Id<"inductionInvites"> } : "skip"
  );

  const demoInvite = DEMO_INDUCTION_INVITES.find((i) => i._id === id);
  const data = convexAvailable ? (inviteQuery ?? null) : (demoInvite ?? null);
  const isLoading = convexAvailable && inviteQuery === undefined;

  return { data, isLoading };
}

export function useInductionInvitesByStatus(
  projectId: Id<"projects"> | string,
  status: InductionInviteStatus
) {
  const convexAvailable = useConvexAvailable();

  const statusQuery = useQuery(
    api.inductionInvites.listByStatus,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, status }
      : "skip"
  );

  const demoData = DEMO_INDUCTION_INVITES.filter(
    (i) => i.projectId === projectId && i.status === status
  );
  const data: InductionInviteData[] = convexAvailable
    ? ((statusQuery ?? []) as InductionInviteData[])
    : demoData;
  const isLoading = convexAvailable && statusQuery === undefined;

  return { data, isLoading };
}
