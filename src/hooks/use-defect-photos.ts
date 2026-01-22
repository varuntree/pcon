"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useConvexAvailable } from "@/components/providers/convex-provider";

export type DefectPhotoData = Doc<"defectPhotos">;

export interface CreateDefectPhotoInput {
  defectId: Id<"defects">;
  mediaFileId: Id<"_storage">;
  caption?: string;
  markup?: string;
  order: number;
}

export function useDefectPhotos(defectId: Id<"defects"> | string) {
  const convexAvailable = useConvexAvailable();

  const photosQuery = useQuery(
    api.defectPhotos.listByDefect,
    convexAvailable ? { defectId: defectId as Id<"defects"> } : "skip"
  );
  const createMutation = useMutation(api.defectPhotos.create);
  const updateMarkupMutation = useMutation(api.defectPhotos.updateMarkup);
  const updateCaptionMutation = useMutation(api.defectPhotos.updateCaption);
  const removeMutation = useMutation(api.defectPhotos.remove);
  const reorderMutation = useMutation(api.defectPhotos.reorder);

  const data: DefectPhotoData[] = convexAvailable ? (photosQuery ?? []) : [];
  const isLoading = convexAvailable && photosQuery === undefined;

  const actions = {
    create: async (input: CreateDefectPhotoInput): Promise<Id<"defectPhotos">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - create operation is a no-op");
        return "demo-photo" as Id<"defectPhotos">;
      }
      return await createMutation(input);
    },
    updateMarkup: async (
      id: Id<"defectPhotos">,
      markup: string
    ): Promise<Id<"defectPhotos">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - updateMarkup operation is a no-op");
        return id;
      }
      return await updateMarkupMutation({ id, markup });
    },
    updateCaption: async (
      id: Id<"defectPhotos">,
      caption: string
    ): Promise<Id<"defectPhotos">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - updateCaption operation is a no-op");
        return id;
      }
      return await updateCaptionMutation({ id, caption });
    },
    remove: async (id: Id<"defectPhotos">): Promise<Id<"defectPhotos">> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - remove operation is a no-op");
        return id;
      }
      return await removeMutation({ id });
    },
    reorder: async (
      updates: Array<{ id: Id<"defectPhotos">; order: number }>
    ): Promise<Id<"defectPhotos">[]> => {
      if (!convexAvailable) {
        console.warn("Convex not configured - reorder operation is a no-op");
        return updates.map((u) => u.id);
      }
      return await reorderMutation({ updates });
    },
  };

  return { data, actions, isLoading };
}

export function useDefectPhoto(id: Id<"defectPhotos"> | string) {
  const convexAvailable = useConvexAvailable();

  const photoQuery = useQuery(
    api.defectPhotos.get,
    convexAvailable ? { id: id as Id<"defectPhotos"> } : "skip"
  );

  const data = convexAvailable ? (photoQuery ?? null) : null;
  const isLoading = convexAvailable && photoQuery === undefined;

  return { data, isLoading };
}
