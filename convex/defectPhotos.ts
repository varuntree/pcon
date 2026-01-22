import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound } from "./lib/errors";
import { now } from "./lib/time";

// List photos for a defect, ordered by order field
export const listByDefect = query({
  args: { defectId: v.id("defects") },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("defectPhotos")
      .withIndex("by_defect", (q) => q.eq("defectId", args.defectId))
      .collect();

    return photos.sort((a, b) => (a.order as number) - (b.order as number));
  },
});

// Get a single photo by ID
export const get = query({
  args: { id: v.id("defectPhotos") },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.id);
    if (!photo) {
      throwNotFound("DefectPhoto", args.id);
    }
    return photo;
  },
});

// Create a new defect photo
export const create = mutation({
  args: {
    defectId: v.id("defects"),
    mediaFileId: v.id("_storage"),
    caption: v.optional(v.string()),
    markup: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify defect exists
    const defect = await ctx.db.get(args.defectId);
    if (!defect) {
      throwNotFound("Defect", args.defectId);
    }

    const insertData: Parameters<typeof ctx.db.insert<"defectPhotos">>[1] = {
      defectId: args.defectId,
      mediaFileId: args.mediaFileId,
      order: args.order,
      createdAt: now(),
    };

    if (args.caption !== undefined) {
      insertData.caption = args.caption;
    }
    if (args.markup !== undefined) {
      insertData.markup = args.markup;
    }

    return await ctx.db.insert("defectPhotos", insertData);
  },
});

// Update markup field (for annotations)
export const updateMarkup = mutation({
  args: {
    id: v.id("defectPhotos"),
    markup: v.string(),
  },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.id);
    if (!photo) {
      throwNotFound("DefectPhoto", args.id);
    }

    await ctx.db.patch(args.id, {
      markup: args.markup,
    });

    return args.id;
  },
});

// Update caption
export const updateCaption = mutation({
  args: {
    id: v.id("defectPhotos"),
    caption: v.string(),
  },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.id);
    if (!photo) {
      throwNotFound("DefectPhoto", args.id);
    }

    await ctx.db.patch(args.id, {
      caption: args.caption,
    });

    return args.id;
  },
});

// Delete a photo
export const remove = mutation({
  args: { id: v.id("defectPhotos") },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.id);
    if (!photo) {
      throwNotFound("DefectPhoto", args.id);
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

// Reorder photos - update order values for multiple photos
export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("defectPhotos"),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify all photos exist
    for (const update of args.updates) {
      const photo = await ctx.db.get(update.id);
      if (!photo) {
        throwNotFound("DefectPhoto", update.id);
      }
    }

    // Update all order values
    for (const update of args.updates) {
      await ctx.db.patch(update.id, {
        order: update.order,
      });
    }

    return args.updates.map((u) => u.id);
  },
});
