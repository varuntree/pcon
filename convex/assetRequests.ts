import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const assetRequestType = v.union(
  v.literal("booking"),
  v.literal("transfer"),
  v.literal("maintenance")
);

const assetRequestStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled")
);

// List requests by asset
export const listByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRequests")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();
  },
});

// List requests by project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List requests by requester
export const listByRequester = query({
  args: { requestedByWorkerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRequests")
      .withIndex("by_requester", (q) =>
        q.eq("requestedByWorkerId", args.requestedByWorkerId)
      )
      .collect();
  },
});

// List requests by project + status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: assetRequestStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assetRequests")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// List all pending requests (org-wide)
export const listPending = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    // Get all projects for the org
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const projectIds = new Set(projects.map((p) => p._id));

    // Query all asset requests and filter by pending status and org projects
    const allRequests = await ctx.db.query("assetRequests").collect();

    return allRequests.filter(
      (r) => r.status === "pending" && projectIds.has(r.projectId)
    );
  },
});

// Get single request by ID
export const get = query({
  args: { id: v.id("assetRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) {
      throwNotFound("AssetRequest", args.id);
    }
    return request;
  },
});

// Create asset request
export const create = mutation({
  args: {
    assetId: v.id("assets"),
    projectId: v.id("projects"),
    requestedByWorkerId: v.id("workers"),
    requestType: assetRequestType,
    requestedStartDate: v.optional(v.number()),
    requestedEndDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify asset exists
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throwNotFound("Asset", args.assetId);
    }

    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound("Project", args.projectId);
    }

    // Verify requester exists
    const requester = await ctx.db.get(args.requestedByWorkerId);
    if (!requester) {
      throwNotFound("Worker (requester)", args.requestedByWorkerId);
    }

    // Validate date range if both provided
    if (args.requestedStartDate && args.requestedEndDate) {
      if (args.requestedEndDate < args.requestedStartDate) {
        throwValidation("End date cannot be before start date");
      }
    }

    const insertData: Parameters<typeof ctx.db.insert<"assetRequests">>[1] = {
      assetId: args.assetId,
      projectId: args.projectId,
      requestedByWorkerId: args.requestedByWorkerId,
      requestType: args.requestType,
      status: "pending",
      ...timestamps(),
    };

    if (args.requestedStartDate !== undefined) {
      insertData.requestedStartDate = args.requestedStartDate;
    }
    if (args.requestedEndDate !== undefined) {
      insertData.requestedEndDate = args.requestedEndDate;
    }
    if (args.notes !== undefined) {
      insertData.notes = args.notes;
    }

    return await ctx.db.insert("assetRequests", insertData);
  },
});

// Approve request
export const approve = mutation({
  args: {
    id: v.id("assetRequests"),
    approvedBy: v.id("workers"),
    createAllocation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) {
      throwNotFound("AssetRequest", args.id);
    }

    if (request.status !== "pending") {
      throwValidation(
        `Cannot approve request with status "${request.status}". Only pending requests can be approved.`
      );
    }

    // Verify approver exists
    const approver = await ctx.db.get(args.approvedBy);
    if (!approver) {
      throwNotFound("Worker (approver)", args.approvedBy);
    }

    const currentTime = now();
    let allocationId: Id<"assetAllocations"> | undefined;

    // Optionally create allocation
    if (args.createAllocation) {
      const assetId = request.assetId as Id<"assets">;
      const asset = await ctx.db.get(assetId);
      if (!asset) {
        throwNotFound("Asset", assetId);
      }

      const allocationData: Parameters<typeof ctx.db.insert<"assetAllocations">>[1] = {
        assetId: assetId,
        projectId: request.projectId as Id<"projects">,
        workerId: request.requestedByWorkerId as Id<"workers">,
        allocationType: "reservation",
        startDate: (request.requestedStartDate as number | undefined) ?? currentTime,
        allocatedAt: currentTime,
        status: "pending",
        createdBy: args.approvedBy,
        ...timestamps(),
      };

      if (request.requestedEndDate !== undefined) {
        allocationData.endDate = request.requestedEndDate as number;
      }
      if (request.notes !== undefined) {
        allocationData.notes = request.notes as string;
      }

      allocationId = await ctx.db.insert("assetAllocations", allocationData);
    }

    if (allocationId) {
      await ctx.db.patch(args.id, {
        status: "approved" as const,
        approvedBy: args.approvedBy,
        approvedAt: currentTime,
        allocationId,
        ...updatedAt(),
      });
    } else {
      await ctx.db.patch(args.id, {
        status: "approved" as const,
        approvedBy: args.approvedBy,
        approvedAt: currentTime,
        ...updatedAt(),
      });
    }

    return args.id;
  },
});

// Reject request
export const reject = mutation({
  args: {
    id: v.id("assetRequests"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) {
      throwNotFound("AssetRequest", args.id);
    }

    if (request.status !== "pending") {
      throwValidation(
        `Cannot reject request with status "${request.status}". Only pending requests can be rejected.`
      );
    }

    if (!args.rejectionReason.trim()) {
      throwValidation("Rejection reason is required");
    }

    await ctx.db.patch(args.id, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Cancel request
export const cancel = mutation({
  args: { id: v.id("assetRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) {
      throwNotFound("AssetRequest", args.id);
    }

    if (request.status === "cancelled") {
      throwValidation("Request is already cancelled");
    }

    if (request.status === "approved") {
      throwValidation("Cannot cancel an approved request");
    }

    if (request.status === "rejected") {
      throwValidation("Cannot cancel a rejected request");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      ...updatedAt(),
    });

    return args.id;
  },
});
