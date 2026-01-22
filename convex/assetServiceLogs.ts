import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound } from "./lib/errors";
import { now } from "./lib/time";

const serviceType = v.union(
  v.literal("maintenance"),
  v.literal("repair"),
  v.literal("inspection"),
  v.literal("calibration"),
  v.literal("other")
);

// List service logs by asset, sorted by performedAt desc
export const listByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("assetServiceLogs")
      .withIndex("by_date", (q) => q.eq("assetId", args.assetId))
      .order("desc")
      .collect();
    return logs;
  },
});

// List service logs by project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetServiceLogs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List service logs by asset + serviceType
export const listByType = query({
  args: {
    assetId: v.id("assets"),
    serviceType: serviceType,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetServiceLogs")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .filter((q) => q.eq(q.field("serviceType"), args.serviceType))
      .collect();
  },
});

// List recent service logs by asset, limit to last N records
export const listRecent = query({
  args: {
    assetId: v.id("assets"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const logs = await ctx.db
      .query("assetServiceLogs")
      .withIndex("by_date", (q) => q.eq("assetId", args.assetId))
      .order("desc")
      .take(limit);
    return logs;
  },
});

// Get a single service log by ID
export const get = query({
  args: { id: v.id("assetServiceLogs") },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.id);
    if (!log) {
      throwNotFound("AssetServiceLog", args.id);
    }
    return log;
  },
});

// Create a new service log (immutable after creation)
export const create = mutation({
  args: {
    assetId: v.id("assets"),
    projectId: v.optional(v.id("projects")),
    serviceType: serviceType,
    description: v.string(),
    performedBy: v.string(),
    performedByWorkerId: v.optional(v.id("workers")),
    performedAt: v.number(),
    cost: v.optional(v.number()),
    nextServiceDue: v.optional(v.number()),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    // Verify asset exists
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throwNotFound("Asset", args.assetId);
    }

    // Verify project exists if provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throwNotFound("Project", args.projectId);
      }
    }

    // Verify performedByWorkerId exists if provided
    if (args.performedByWorkerId) {
      const worker = await ctx.db.get(args.performedByWorkerId);
      if (!worker) {
        throwNotFound("Worker (performedByWorkerId)", args.performedByWorkerId);
      }
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (createdBy)", args.createdBy);
    }

    // Build insert data
    const insertData: Parameters<typeof ctx.db.insert<"assetServiceLogs">>[1] =
      {
        assetId: args.assetId,
        serviceType: args.serviceType,
        description: args.description,
        performedBy: args.performedBy,
        performedAt: args.performedAt,
        createdBy: args.createdBy,
        createdAt: now(),
      };

    if (args.projectId !== undefined) {
      insertData.projectId = args.projectId;
    }
    if (args.performedByWorkerId !== undefined) {
      insertData.performedByWorkerId = args.performedByWorkerId;
    }
    if (args.cost !== undefined) {
      insertData.cost = args.cost;
    }
    if (args.nextServiceDue !== undefined) {
      insertData.nextServiceDue = args.nextServiceDue;
    }
    if (args.attachmentIds !== undefined) {
      insertData.attachmentIds = args.attachmentIds;
    }

    const logId = await ctx.db.insert("assetServiceLogs", insertData);

    // Update asset.nextServiceDue if provided
    if (args.nextServiceDue !== undefined) {
      await ctx.db.patch(args.assetId, {
        nextServiceDue: args.nextServiceDue,
      });
    }

    return logId;
  },
});
