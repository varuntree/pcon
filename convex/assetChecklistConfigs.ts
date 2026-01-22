import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { now, updatedAt, timestamps } from "./lib/time";

const checklistPurpose = v.union(v.literal("inspection"), v.literal("prestart"));

const checklistFrequency = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("annually"),
  v.literal("on_use")
);

type Frequency = "daily" | "weekly" | "monthly" | "quarterly" | "annually" | "on_use";

// Helper: calculate next due date based on frequency
function calculateNextDueAt(
  completedAt: number,
  frequency: Frequency
): number | undefined {
  if (frequency === "on_use") {
    return undefined;
  }

  const date = new Date(completedAt);
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "annually":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.getTime();
}

// List configs by asset
export const listByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetChecklistConfigs")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();
  },
});

// List configs by template
export const listByTemplate = query({
  args: { checklistTemplateId: v.id("checklistTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetChecklistConfigs")
      .withIndex("by_template", (q) =>
        q.eq("checklistTemplateId", args.checklistTemplateId)
      )
      .collect();
  },
});

// List active configs by asset
export const listActiveByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("assetChecklistConfigs")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();
    return configs.filter((c) => c.isActive);
  },
});

// Get active prestart config for asset
export const getActivePrestart = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const configs = await ctx.db
      .query("assetChecklistConfigs")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();
    return configs.find((c) => c.isActive && c.purpose === "prestart") ?? null;
  },
});

// Get single config by ID
export const get = query({
  args: { id: v.id("assetChecklistConfigs") },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.id);
    if (!config) {
      throwNotFound("AssetChecklistConfig", args.id);
    }
    return config;
  },
});

// Create config
export const create = mutation({
  args: {
    assetId: v.id("assets"),
    checklistTemplateId: v.id("checklistTemplates"),
    purpose: checklistPurpose,
    frequency: checklistFrequency,
    createdBy: v.id("workers"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify asset exists
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throwNotFound("Asset", args.assetId);
    }

    // Verify template exists
    const template = await ctx.db.get(args.checklistTemplateId);
    if (!template) {
      throwNotFound("ChecklistTemplate", args.checklistTemplateId);
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (creator)", args.createdBy);
    }

    // Check for duplicate active config with same purpose
    if (args.isActive !== false) {
      const existing = await ctx.db
        .query("assetChecklistConfigs")
        .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
        .collect();
      const activeExists = existing.some((c) => c.isActive && c.purpose === args.purpose);
      if (activeExists) {
        throwValidation(
          `Active ${args.purpose} config already exists for this asset`
        );
      }
    }

    return await ctx.db.insert("assetChecklistConfigs", {
      assetId: args.assetId,
      checklistTemplateId: args.checklistTemplateId,
      purpose: args.purpose,
      frequency: args.frequency,
      createdBy: args.createdBy,
      isActive: args.isActive ?? true,
      ...timestamps(),
    });
  },
});

// Update config
export const update = mutation({
  args: {
    id: v.id("assetChecklistConfigs"),
    purpose: v.optional(checklistPurpose),
    frequency: v.optional(checklistFrequency),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.id);
    if (!config) {
      throwNotFound("AssetChecklistConfig", args.id);
    }

    const patchData: Partial<Doc<"assetChecklistConfigs">> = {
      ...updatedAt(),
    };

    if (args.purpose !== undefined) {
      // Check for duplicate if changing purpose
      if (args.purpose !== config.purpose && config.isActive) {
        const existing = await ctx.db
          .query("assetChecklistConfigs")
          .withIndex("by_asset", (q) => q.eq("assetId", config.assetId))
          .collect();
        const activeExists = existing.some((c) => c.isActive && c.purpose === args.purpose && c._id !== args.id);
        if (activeExists) {
          throwValidation(
            `Active ${args.purpose} config already exists for this asset`
          );
        }
      }
      patchData.purpose = args.purpose;
    }

    if (args.frequency !== undefined) {
      patchData.frequency = args.frequency;
      // Recalculate nextDueAt if lastCompletedAt exists
      if (config.lastCompletedAt) {
        patchData.nextDueAt = calculateNextDueAt(
          config.lastCompletedAt as number,
          args.frequency
        );
      }
    }

    await ctx.db.patch(args.id, patchData);
    return args.id;
  },
});

// Activate config
export const activate = mutation({
  args: { id: v.id("assetChecklistConfigs") },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.id);
    if (!config) {
      throwNotFound("AssetChecklistConfig", args.id);
    }

    if (config.isActive) {
      return args.id;
    }

    // Check for existing active config with same purpose
    const existing = await ctx.db
      .query("assetChecklistConfigs")
      .withIndex("by_asset", (q) => q.eq("assetId", config.assetId))
      .collect();
    const activeExists = existing.some((c) => c.isActive && c.purpose === config.purpose);
    if (activeExists) {
      throwValidation(
        `Active ${config.purpose} config already exists for this asset`
      );
    }

    await ctx.db.patch(args.id, {
      isActive: true,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Deactivate config
export const deactivate = mutation({
  args: { id: v.id("assetChecklistConfigs") },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.id);
    if (!config) {
      throwNotFound("AssetChecklistConfig", args.id);
    }

    if (!config.isActive) {
      return args.id;
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Mark completed + calculate next due
export const markCompleted = mutation({
  args: {
    id: v.id("assetChecklistConfigs"),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.id);
    if (!config) {
      throwNotFound("AssetChecklistConfig", args.id);
    }

    const completedAt = args.completedAt ?? now();
    const nextDueAt = calculateNextDueAt(completedAt, config.frequency as Frequency);

    await ctx.db.patch(args.id, {
      lastCompletedAt: completedAt,
      nextDueAt,
      ...updatedAt(),
    });

    return args.id;
  },
});
