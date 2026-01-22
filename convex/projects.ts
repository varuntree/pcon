import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const projectStatus = v.union(
  v.literal("planning"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived")
);

export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const listByStatus = query({
  args: {
    orgId: v.id("orgs"),
    status: projectStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", args.status)
      )
      .collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throwNotFound("Project", args.id);
    }
    return project;
  },
});

export const getStats = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throwNotFound("Project", args.id);
    }

    // Count workers assigned to this project
    const assignments = await ctx.db
      .query("workerAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    // Count work packages
    const workPackages = await ctx.db
      .query("workPackages")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    const activeWorkPackages = workPackages.filter(
      (wp) => wp.status === "active"
    ).length;

    return {
      workerCount: assignments.length,
      workPackageCount: workPackages.length,
      activeWorkPackageCount: activeWorkPackages,
    };
  },
});

export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    clientOrgId: v.optional(v.id("orgs")),
    name: v.string(),
    code: v.string(),
    address: v.optional(v.string()),
    value: v.optional(v.number()),
    status: v.optional(projectStatus),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Check code uniqueness within org
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("code"), args.code))
      .first();

    if (existing) {
      throwValidation(
        `A project with code "${args.code}" already exists in this organization`
      );
    }

    // Verify client org exists if provided
    if (args.clientOrgId) {
      const clientOrg = await ctx.db.get(args.clientOrgId);
      if (!clientOrg) {
        throwNotFound("Client organization", args.clientOrgId);
      }
    }

    return await ctx.db.insert("projects", {
      ...args,
      status: args.status ?? "planning",
      ...timestamps(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    clientOrgId: v.optional(v.id("orgs")),
    address: v.optional(v.string()),
    value: v.optional(v.number()),
    status: v.optional(projectStatus),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const project = await ctx.db.get(id);
    if (!project) {
      throwNotFound("Project", id);
    }

    // Check code uniqueness if changing
    if (updates.code && updates.code !== project.code) {
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_org", (q) => q.eq("orgId", project.orgId))
        .filter((q) => q.eq(q.field("code"), updates.code))
        .first();

      if (existing) {
        throwValidation(
          `A project with code "${updates.code}" already exists in this organization`
        );
      }
    }

    // Verify client org exists if changing
    if (updates.clientOrgId) {
      const clientOrg = await ctx.db.get(updates.clientOrgId);
      if (!clientOrg) {
        throwNotFound("Client organization", updates.clientOrgId);
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
