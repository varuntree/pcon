import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const workerStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("inactive")
);

const workerRole = v.union(
  v.literal("project_manager"),
  v.literal("site_supervisor"),
  v.literal("foreman"),
  v.literal("tradesperson"),
  v.literal("laborer"),
  v.literal("safety_officer"),
  v.literal("admin")
);

export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Get all assignments for this project
    const assignments = await ctx.db
      .query("workerAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get all workers
    const workers = await Promise.all(
      assignments.map(async (assignment) => {
        const worker = await ctx.db.get(assignment.workerId);
        return worker
          ? {
              ...worker,
              assignmentRole: assignment.role,
              assignedAt: assignment.createdAt,
            }
          : null;
      })
    );

    return workers.filter(Boolean);
  },
});

export const listByStatus = query({
  args: {
    orgId: v.id("orgs"),
    status: workerStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workers")
      .withIndex("by_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", args.status)
      )
      .collect();
  },
});

export const get = query({
  args: { id: v.id("workers") },
  handler: async (ctx, args) => {
    const worker = await ctx.db.get(args.id);
    if (!worker) {
      throwNotFound("Worker", args.id);
    }
    return worker;
  },
});

export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: workerRole,
    status: v.optional(workerStatus),
    tradeId: v.optional(v.id("trades")),
    employer: v.optional(v.string()),
    emergencyName: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    emergencyRelation: v.optional(v.string()),
    medicalConditions: v.optional(v.string()),
    allergies: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Check email uniqueness within org (case-insensitive)
    const normalizedEmail = args.email.toLowerCase();
    const existing = await ctx.db
      .query("workers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();

    if (existing) {
      throwValidation(
        `A worker with email "${args.email}" already exists in this organization`
      );
    }

    // Verify trade exists if provided
    if (args.tradeId) {
      const trade = await ctx.db.get(args.tradeId);
      if (!trade) {
        throwNotFound("Trade", args.tradeId);
      }
    }

    return await ctx.db.insert("workers", {
      ...args,
      email: normalizedEmail,
      status: args.status ?? "pending",
      ...timestamps(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("workers"),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(workerRole),
    status: v.optional(workerStatus),
    tradeId: v.optional(v.id("trades")),
    employer: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
    emergencyName: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    emergencyRelation: v.optional(v.string()),
    medicalConditions: v.optional(v.string()),
    allergies: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const worker = await ctx.db.get(id);
    if (!worker) {
      throwNotFound("Worker", id);
    }

    // Check email uniqueness if changing
    if (updates.email) {
      const normalizedEmail = updates.email.toLowerCase();
      if (normalizedEmail !== worker.email) {
        const existing = await ctx.db
          .query("workers")
          .withIndex("by_org", (q) => q.eq("orgId", worker.orgId))
          .filter((q) => q.eq(q.field("email"), normalizedEmail))
          .first();

        if (existing) {
          throwValidation(
            `A worker with email "${updates.email}" already exists in this organization`
          );
        }
        updates.email = normalizedEmail;
      }
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
