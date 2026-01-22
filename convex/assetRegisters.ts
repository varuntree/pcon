import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const assetType = v.union(
  v.literal("plant"),
  v.literal("equipment"),
  v.literal("vehicle"),
  v.literal("tool"),
  v.literal("other")
);

// List all registers for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRegisters")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List registers by project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRegisters")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List registers by org + assetType
export const listByOrgType = query({
  args: {
    orgId: v.id("orgs"),
    assetType: assetType,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRegisters")
      .withIndex("by_org_type", (q) =>
        q.eq("orgId", args.orgId).eq("assetType", args.assetType)
      )
      .collect();
  },
});

// List active registers for an org
export const listActive = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRegisters")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get a single register
export const get = query({
  args: { id: v.id("assetRegisters") },
  handler: async (ctx, args) => {
    const register = await ctx.db.get(args.id);
    if (!register) {
      throwNotFound("AssetRegister", args.id);
    }
    return register;
  },
});

// Create a new register
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")),
    name: v.string(),
    description: v.optional(v.string()),
    assetType: assetType,
    createdBy: v.id("workers"),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Verify project exists if provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throwNotFound("Project", args.projectId);
      }
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker", args.createdBy);
    }

    const insertData: Parameters<typeof ctx.db.insert<"assetRegisters">>[1] = {
      orgId: args.orgId,
      name: args.name,
      assetType: args.assetType,
      isActive: args.isActive ?? true,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.projectId !== undefined) {
      insertData.projectId = args.projectId;
    }

    if (args.description !== undefined) {
      insertData.description = args.description;
    }

    return await ctx.db.insert("assetRegisters", insertData);
  },
});

// Update a register
export const update = mutation({
  args: {
    id: v.id("assetRegisters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const register = await ctx.db.get(id);
    if (!register) {
      throwNotFound("AssetRegister", id);
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      throwValidation("No fields provided to update.");
    }

    await ctx.db.patch(id, {
      ...filteredUpdates,
      ...updatedAt(),
    });

    return id;
  },
});

// Deactivate a register
export const deactivate = mutation({
  args: { id: v.id("assetRegisters") },
  handler: async (ctx, args) => {
    const register = await ctx.db.get(args.id);
    if (!register) {
      throwNotFound("AssetRegister", args.id);
    }

    if (!register.isActive) {
      throwValidation("Register is already inactive.");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Activate a register
export const activate = mutation({
  args: { id: v.id("assetRegisters") },
  handler: async (ctx, args) => {
    const register = await ctx.db.get(args.id);
    if (!register) {
      throwNotFound("AssetRegister", args.id);
    }

    if (register.isActive) {
      throwValidation("Register is already active.");
    }

    await ctx.db.patch(args.id, {
      isActive: true,
      ...updatedAt(),
    });

    return args.id;
  },
});
