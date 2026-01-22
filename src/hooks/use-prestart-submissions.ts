"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type PrestartSubmissionData = Doc<"prestartSubmissions">;

export interface SubmitPrestartInput {
  assetId: Id<"assets">;
  projectId: Id<"projects">;
  templateId?: string;
  checklistInstanceId?: Id<"checklistInstances">;
  performedByWorkerId: Id<"workers">;
  responses?: Record<string, unknown>;
  photoIds?: Id<"_storage">[];
  odometerKm?: number;
  odometerHours?: number;
  passed: boolean;
  issues?: string[];
}

export function usePrestartSubmissions(assetId: Id<"assets"> | string) {
  const convexAvailable = useConvexAvailable();

  const submissionsQuery = useQuery(
    api.prestartSubmissions.listByAsset,
    convexAvailable ? { assetId: assetId as Id<"assets"> } : "skip"
  );
  const submitMutation = useMutation(api.prestartSubmissions.submit);
  const linkDefectMutation = useMutation(api.prestartSubmissions.linkDefect);
  const linkActionMutation = useMutation(api.prestartSubmissions.linkAction);

  const data: PrestartSubmissionData[] = convexAvailable
    ? (submissionsQuery ?? [])
    : [];
  const isLoading = convexAvailable && submissionsQuery === undefined;

  const actions = {
    submit: async (
      input: SubmitPrestartInput
    ): Promise<Id<"prestartSubmissions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - submit operation is a no-op");
        return "demo-prestart" as Id<"prestartSubmissions">;
      }
      return await submitMutation(input);
    },
    linkDefect: async (
      id: Id<"prestartSubmissions">,
      defectId: Id<"defects">
    ): Promise<Id<"prestartSubmissions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - linkDefect operation is a no-op");
        return id;
      }
      return await linkDefectMutation({ id, defectId });
    },
    linkAction: async (
      id: Id<"prestartSubmissions">,
      actionId: Id<"actionItems">
    ): Promise<Id<"prestartSubmissions">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - linkAction operation is a no-op");
        return id;
      }
      return await linkActionMutation({ id, actionId });
    },
  };

  return { data, actions, isLoading };
}

export function usePrestartSubmission(id: Id<"prestartSubmissions"> | string) {
  const convexAvailable = useConvexAvailable();

  const submissionQuery = useQuery(
    api.prestartSubmissions.get,
    convexAvailable ? { id: id as Id<"prestartSubmissions"> } : "skip"
  );

  const data = convexAvailable ? (submissionQuery ?? null) : null;
  const isLoading = convexAvailable && submissionQuery === undefined;

  return { data, isLoading };
}

export function usePrestartSubmissionsByProject(projectId: Id<"projects"> | string) {
  const convexAvailable = useConvexAvailable();

  const projectQuery = useQuery(
    api.prestartSubmissions.listByProject,
    convexAvailable ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const data: PrestartSubmissionData[] = convexAvailable
    ? (projectQuery ?? [])
    : [];
  const isLoading = convexAvailable && projectQuery === undefined;

  return { data, isLoading };
}

export function usePrestartSubmissionsByProjectDate(
  projectId: Id<"projects"> | string,
  startDate: number,
  endDate: number
) {
  const convexAvailable = useConvexAvailable();

  const dateQuery = useQuery(
    api.prestartSubmissions.listByProjectDate,
    convexAvailable
      ? { projectId: projectId as Id<"projects">, startDate, endDate }
      : "skip"
  );

  const data: PrestartSubmissionData[] = convexAvailable
    ? (dateQuery ?? [])
    : [];
  const isLoading = convexAvailable && dateQuery === undefined;

  return { data, isLoading };
}

export function useRecentPrestartSubmissions(
  assetId: Id<"assets"> | string,
  limit?: number
) {
  const convexAvailable = useConvexAvailable();

  const recentQuery = useQuery(
    api.prestartSubmissions.listRecent,
    convexAvailable
      ? { assetId: assetId as Id<"assets">, limit }
      : "skip"
  );

  const data: PrestartSubmissionData[] = convexAvailable
    ? (recentQuery ?? [])
    : [];
  const isLoading = convexAvailable && recentQuery === undefined;

  return { data, isLoading };
}

export function usePrestartSubmissionsByPerformer(
  performedByWorkerId: Id<"workers"> | string
) {
  const convexAvailable = useConvexAvailable();

  const performerQuery = useQuery(
    api.prestartSubmissions.listByPerformer,
    convexAvailable
      ? { performedByWorkerId: performedByWorkerId as Id<"workers"> }
      : "skip"
  );

  const data: PrestartSubmissionData[] = convexAvailable
    ? (performerQuery ?? [])
    : [];
  const isLoading = convexAvailable && performerQuery === undefined;

  return { data, isLoading };
}
