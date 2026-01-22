import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { now } from "./lib/time";

const workerRole = v.union(
  v.literal("project_manager"),
  v.literal("site_supervisor"),
  v.literal("foreman"),
  v.literal("tradesperson"),
  v.literal("laborer"),
  v.literal("safety_officer"),
  v.literal("admin")
);

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workerAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const listByWorker = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workerAssignments")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .collect();
  },
});

export const assign = mutation({
  args: {
    workerId: v.id("workers"),
    projectId: v.id("projects"),
    role: workerRole,
  },
  handler: async (ctx, args) => {
    // Verify worker exists
    const worker = await ctx.db.get(args.workerId);
    if (!worker) {
      throwNotFound("Worker", args.workerId);
    }

    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound("Project", args.projectId);
    }

    // Check if assignment already exists
    const existing = await ctx.db
      .query("workerAssignments")
      .withIndex("by_project_worker", (q) =>
        q.eq("projectId", args.projectId).eq("workerId", args.workerId)
      )
      .first();

    if (existing) {
      throwValidation("Worker is already assigned to this project");
    }

    return await ctx.db.insert("workerAssignments", {
      workerId: args.workerId,
      projectId: args.projectId,
      role: args.role,
      createdAt: now(),
    });
  },
});

export const updateRole = mutation({
  args: {
    workerId: v.id("workers"),
    projectId: v.id("projects"),
    role: workerRole,
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("workerAssignments")
      .withIndex("by_project_worker", (q) =>
        q.eq("projectId", args.projectId).eq("workerId", args.workerId)
      )
      .first();

    if (!assignment) {
      throwNotFound("Worker assignment");
    }

    await ctx.db.patch(assignment._id as never, { role: args.role });
    return assignment._id;
  },
});

export const unassign = mutation({
  args: {
    workerId: v.id("workers"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("workerAssignments")
      .withIndex("by_project_worker", (q) =>
        q.eq("projectId", args.projectId).eq("workerId", args.workerId)
      )
      .first();

    if (!assignment) {
      throwNotFound("Worker assignment");
    }

    await ctx.db.delete(assignment._id as never);
    return true;
  },
});
