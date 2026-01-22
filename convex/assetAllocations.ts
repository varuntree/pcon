import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation, throwConflict } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const allocationType = v.union(
  v.literal("reservation"),
  v.literal("assignment")
);

const allocationStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

// List allocations by asset
export const listByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetAllocations")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();
  },
});

// List allocations by project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetAllocations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List allocations by worker
export const listByWorker = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetAllocations")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .collect();
  },
});

// List active allocations for an asset
export const listActive = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("assetAllocations")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();
    return allocations.filter((a) => a.status === "active");
  },
});

// List allocations by date range for an asset
export const listByDateRange = query({
  args: {
    assetId: v.id("assets"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("assetAllocations")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();

    // Filter by date range overlap: allocation overlaps if
    // allocation.startDate < query.endDate AND (allocation.endDate is null OR allocation.endDate > query.startDate)
    return allocations.filter((a) => {
      const allocStart = a.startDate as number;
      const allocEnd = (a.endDate as number | null) ?? Infinity;
      return allocStart < args.endDate && allocEnd > args.startDate;
    });
  },
});

// Get a single allocation
export const get = query({
  args: { id: v.id("assetAllocations") },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.id);
    if (!allocation) {
      throwNotFound("AssetAllocation", args.id);
    }
    return allocation;
  },
});

// Check for conflicts with overlapping dates
export const checkConflict = query({
  args: {
    assetId: v.id("assets"),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    excludeAllocationId: v.optional(v.id("assetAllocations")),
  },
  handler: async (ctx, args) => {
    const allocations = await ctx.db
      .query("assetAllocations")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();

    const newEnd = args.endDate ?? Infinity;

    // Filter out cancelled/completed and check overlap
    // Conflict: new.startDate < existing.endDate AND new.endDate > existing.startDate
    const conflicts = allocations.filter((a) => {
      // Skip if this is the allocation being updated
      if (args.excludeAllocationId && a._id === args.excludeAllocationId) {
        return false;
      }

      // Skip cancelled/completed allocations
      if (a.status === "cancelled" || a.status === "completed") {
        return false;
      }

      const existingStart = a.startDate as number;
      const existingEnd = (a.endDate as number | null) ?? Infinity;

      // Check overlap: new.startDate < existing.endDate AND new.endDate > existing.startDate
      return args.startDate < existingEnd && newEnd > existingStart;
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  },
});

// Create a new allocation
export const create = mutation({
  args: {
    assetId: v.id("assets"),
    projectId: v.optional(v.id("projects")),
    allocationType: allocationType,
    workerId: v.optional(v.id("workers")),
    orgId: v.optional(v.id("orgs")),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    notes: v.optional(v.string()),
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

    // Verify worker exists if provided
    if (args.workerId) {
      const worker = await ctx.db.get(args.workerId);
      if (!worker) {
        throwNotFound("Worker", args.workerId);
      }
    }

    // Verify org exists if provided
    if (args.orgId) {
      const org = await ctx.db.get(args.orgId);
      if (!org) {
        throwNotFound("Organization", args.orgId);
      }
    }

    // Verify createdBy worker exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (createdBy)", args.createdBy);
    }

    // Validate dates
    if (args.endDate && args.endDate <= args.startDate) {
      throwValidation("End date must be after start date");
    }

    // Check for conflicts
    const existingAllocations = await ctx.db
      .query("assetAllocations")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();

    const newEnd = args.endDate ?? Infinity;

    const conflicts = existingAllocations.filter((a) => {
      if (a.status === "cancelled" || a.status === "completed") {
        return false;
      }

      const existingStart = a.startDate as number;
      const existingEnd = (a.endDate as number | null) ?? Infinity;
      return args.startDate < existingEnd && newEnd > existingStart;
    });

    if (conflicts.length > 0) {
      throwConflict(
        `Asset is already allocated during this period (${conflicts.length} conflicting allocation(s))`
      );
    }

    const insertData: Parameters<
      typeof ctx.db.insert<"assetAllocations">
    >[1] = {
      assetId: args.assetId,
      allocationType: args.allocationType,
      startDate: args.startDate,
      allocatedAt: now(),
      status: "pending",
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.projectId !== undefined) {
      insertData.projectId = args.projectId;
    }
    if (args.workerId !== undefined) {
      insertData.workerId = args.workerId;
    }
    if (args.orgId !== undefined) {
      insertData.orgId = args.orgId;
    }
    if (args.endDate !== undefined) {
      insertData.endDate = args.endDate;
    }
    if (args.notes !== undefined) {
      insertData.notes = args.notes;
    }

    return await ctx.db.insert("assetAllocations", insertData);
  },
});

// Update an allocation
export const update = mutation({
  args: {
    id: v.id("assetAllocations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const allocation = await ctx.db.get(id);
    if (!allocation) {
      throwNotFound("AssetAllocation", id);
    }

    if (allocation.status === "completed" || allocation.status === "cancelled") {
      throwValidation("Cannot update a completed or cancelled allocation");
    }

    const newStartDate = (updates.startDate ?? allocation.startDate) as number;
    const newEndDate =
      updates.endDate !== undefined ? updates.endDate : (allocation.endDate as number | undefined);

    // Validate dates
    if (newEndDate && newEndDate <= newStartDate) {
      throwValidation("End date must be after start date");
    }

    // Check for conflicts if dates changed
    if (updates.startDate !== undefined || updates.endDate !== undefined) {
      const existingAllocations = await ctx.db
        .query("assetAllocations")
        .withIndex("by_asset", (q) => q.eq("assetId", allocation.assetId))
        .collect();

      const newEnd = newEndDate ?? Infinity;

      const conflicts = existingAllocations.filter((a) => {
        if (a._id === id) return false;
        if (a.status === "cancelled" || a.status === "completed") return false;

        const existingStart = a.startDate as number;
        const existingEnd = (a.endDate as number | null) ?? Infinity;
        return newStartDate < existingEnd && newEnd > existingStart;
      });

      if (conflicts.length > 0) {
        throwConflict(
          `Asset is already allocated during this period (${conflicts.length} conflicting allocation(s))`
        );
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

// Activate an allocation (reservation becoming active)
export const activate = mutation({
  args: { id: v.id("assetAllocations") },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.id);
    if (!allocation) {
      throwNotFound("AssetAllocation", args.id);
    }

    if (allocation.status !== "pending") {
      throwValidation("Can only activate pending allocations");
    }

    await ctx.db.patch(args.id, {
      status: "active",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Complete an allocation
export const complete = mutation({
  args: { id: v.id("assetAllocations") },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.id);
    if (!allocation) {
      throwNotFound("AssetAllocation", args.id);
    }

    if (allocation.status === "completed") {
      throwValidation("Allocation is already completed");
    }

    if (allocation.status === "cancelled") {
      throwValidation("Cannot complete a cancelled allocation");
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      returnedAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// Cancel an allocation
export const cancel = mutation({
  args: { id: v.id("assetAllocations") },
  handler: async (ctx, args) => {
    const allocation = await ctx.db.get(args.id);
    if (!allocation) {
      throwNotFound("AssetAllocation", args.id);
    }

    if (allocation.status === "cancelled") {
      throwValidation("Allocation is already cancelled");
    }

    if (allocation.status === "completed") {
      throwValidation("Cannot cancel a completed allocation");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      ...updatedAt(),
    });

    return args.id;
  },
});
