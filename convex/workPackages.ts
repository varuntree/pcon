import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const workPackageStatus = v.union(
  v.literal("planned"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived")
);

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workPackages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workPackages")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("workPackages") },
  handler: async (ctx, args) => {
    const workPackage = await ctx.db.get(args.id);
    if (!workPackage) {
      throwNotFound("Work Package", args.id);
    }
    return workPackage;
  },
});

export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(workPackageStatus),
    tradeId: v.optional(v.id("trades")),
    phaseId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Verify project exists and belongs to org
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound("Project", args.projectId);
    }
    if (project.orgId !== args.orgId) {
      throwNotFound("Project in this organization", args.projectId);
    }

    // Verify trade exists if provided
    if (args.tradeId) {
      const trade = await ctx.db.get(args.tradeId);
      if (!trade) {
        throwNotFound("Trade", args.tradeId);
      }
    }

    return await ctx.db.insert("workPackages", {
      ...args,
      status: args.status ?? "planned",
      ...timestamps(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("workPackages"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(workPackageStatus),
    tradeId: v.optional(v.id("trades")),
    phaseId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const workPackage = await ctx.db.get(id);
    if (!workPackage) {
      throwNotFound("Work Package", id);
    }

    // Verify trade exists if changing
    if (updates.tradeId) {
      const trade = await ctx.db.get(updates.tradeId);
      if (!trade) {
        throwNotFound("Trade", updates.tradeId);
      }
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      ...updatedAt(),
    });

    return id;
  },
});
