import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { now, updatedAt, timestamps } from "./lib/time";

const defectStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
);

const defectCategory = v.union(
  v.literal("builder"),
  v.literal("client"),
  v.literal("safety"),
  v.literal("other")
);

const priorityLevel = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

const sourceType = v.union(
  v.literal("asset"),
  v.literal("itp"),
  v.literal("incident"),
  v.literal("defect"),
  v.literal("manual")
);

// List all defects for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("defects")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List defects by status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: defectStatus,
  },
  handler: async (ctx, args) => {
    const defects = await ctx.db
      .query("defects")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return defects.filter((d) => d.status === args.status);
  },
});

// List defects by category
export const listByCategory = query({
  args: { category: defectCategory },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("defects")
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();
  },
});

// List defects by assignee (org or worker)
export const listByAssignee = query({
  args: {
    assignedTo: v.optional(v.id("orgs")),
    assignedWorkerId: v.optional(v.id("workers")),
  },
  handler: async (ctx, args) => {
    if (args.assignedTo) {
      return await ctx.db
        .query("defects")
        .filter((q) => q.eq(q.field("assignedTo"), args.assignedTo))
        .collect();
    }
    if (args.assignedWorkerId) {
      return await ctx.db
        .query("defects")
        .filter((q) => q.eq(q.field("assignedWorkerId"), args.assignedWorkerId))
        .collect();
    }
    return [];
  },
});

// List defects by source
export const listBySource = query({
  args: {
    sourceType: sourceType,
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const defects = await ctx.db
      .query("defects")
      .filter((q) => q.eq(q.field("sourceType"), args.sourceType))
      .collect();
    return defects.filter((d) => d.sourceId === args.sourceId);
  },
});

// List defects by asset
export const listByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("defects")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();
  },
});

// Get a single defect
export const get = query({
  args: { id: v.id("defects") },
  handler: async (ctx, args) => {
    const defect = await ctx.db.get(args.id);
    if (!defect) {
      throwNotFound("Defect", args.id);
    }
    return defect;
  },
});

// Get defect with photos
export const getWithDetails = query({
  args: { id: v.id("defects") },
  handler: async (ctx, args) => {
    const defect = await ctx.db.get(args.id);
    if (!defect) {
      throwNotFound("Defect", args.id);
    }

    const photos = await ctx.db
      .query("defectPhotos")
      .withIndex("by_defect", (q) => q.eq("defectId", args.id))
      .collect();

    return {
      ...defect,
      photos,
    };
  },
});

// Create a new defect
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    category: defectCategory,
    location: v.optional(v.string()),
    level: v.optional(v.string()),
    area: v.optional(v.string()),
    priority: priorityLevel,
    assignedTo: v.optional(v.id("orgs")),
    assignedWorkerId: v.optional(v.id("workers")),
    dueDate: v.optional(v.number()),
    sourceType: v.optional(sourceType),
    sourceId: v.optional(v.string()),
    assetId: v.optional(v.id("assets")),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    // Validate dual assignment
    if (args.assignedTo && args.assignedWorkerId) {
      throwValidation(
        "Cannot assign to both org and worker. Use either assignedTo OR assignedWorkerId."
      );
    }

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
      throwValidation("Project does not belong to this organization");
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (createdBy)", args.createdBy);
    }

    // Verify assigned org if provided
    if (args.assignedTo) {
      const assignedOrg = await ctx.db.get(args.assignedTo);
      if (!assignedOrg) {
        throwNotFound("Organization (assignedTo)", args.assignedTo);
      }
    }

    // Verify assigned worker if provided
    if (args.assignedWorkerId) {
      const assignedWorker = await ctx.db.get(args.assignedWorkerId);
      if (!assignedWorker) {
        throwNotFound("Worker (assignedWorkerId)", args.assignedWorkerId);
      }
    }

    // Verify asset if provided
    if (args.assetId) {
      const asset = await ctx.db.get(args.assetId);
      if (!asset) {
        throwNotFound("Asset", args.assetId);
      }
    }

    // Generate defect number
    const existing = await ctx.db
      .query("defects")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNum = existing.length + 1;
    const defectNumber = `DEFECT-${String(nextNum).padStart(3, "0")}`;

    const insertData: Parameters<typeof ctx.db.insert<"defects">>[1] = {
      orgId: args.orgId,
      projectId: args.projectId,
      defectNumber,
      title: args.title,
      category: args.category,
      priority: args.priority,
      status: "open",
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.description !== undefined) {
      insertData.description = args.description;
    }
    if (args.location !== undefined) {
      insertData.location = args.location;
    }
    if (args.level !== undefined) {
      insertData.level = args.level;
    }
    if (args.area !== undefined) {
      insertData.area = args.area;
    }
    if (args.assignedTo !== undefined) {
      insertData.assignedTo = args.assignedTo;
    }
    if (args.assignedWorkerId !== undefined) {
      insertData.assignedWorkerId = args.assignedWorkerId;
    }
    if (args.dueDate !== undefined) {
      insertData.dueDate = args.dueDate;
    }
    if (args.sourceType !== undefined) {
      insertData.sourceType = args.sourceType;
    }
    if (args.sourceId !== undefined) {
      insertData.sourceId = args.sourceId;
    }
    if (args.assetId !== undefined) {
      insertData.assetId = args.assetId;
    }

    return await ctx.db.insert("defects", insertData);
  },
});

// Update a defect
export const update = mutation({
  args: {
    id: v.id("defects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(defectCategory),
    location: v.optional(v.string()),
    level: v.optional(v.string()),
    area: v.optional(v.string()),
    priority: v.optional(priorityLevel),
    assignedTo: v.optional(v.id("orgs")),
    assignedWorkerId: v.optional(v.id("workers")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const defect = await ctx.db.get(id);
    if (!defect) {
      throwNotFound("Defect", id);
    }

    if (defect.status === "closed") {
      throwValidation("Cannot update a closed defect");
    }

    // Validate dual assignment
    const newAssignedTo =
      updates.assignedTo !== undefined
        ? updates.assignedTo
        : defect.assignedTo;
    const newAssignedWorkerId =
      updates.assignedWorkerId !== undefined
        ? updates.assignedWorkerId
        : defect.assignedWorkerId;

    if (newAssignedTo && newAssignedWorkerId) {
      throwValidation(
        "Cannot assign to both org and worker. Use either assignedTo OR assignedWorkerId."
      );
    }

    // Verify assigned org if provided
    if (updates.assignedTo) {
      const assignedOrg = await ctx.db.get(updates.assignedTo);
      if (!assignedOrg) {
        throwNotFound("Organization (assignedTo)", updates.assignedTo);
      }
    }

    // Verify assigned worker if provided
    if (updates.assignedWorkerId) {
      const assignedWorker = await ctx.db.get(updates.assignedWorkerId);
      if (!assignedWorker) {
        throwNotFound("Worker (assignedWorkerId)", updates.assignedWorkerId);
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

// Add a comment to a defect
export const addComment = mutation({
  args: {
    id: v.id("defects"),
    workerId: v.id("workers"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const defect = await ctx.db.get(args.id);
    if (!defect) {
      throwNotFound("Defect", args.id);
    }

    // Verify worker exists
    const worker = await ctx.db.get(args.workerId);
    if (!worker) {
      throwNotFound("Worker", args.workerId);
    }

    type Comment = { id: string; workerId: Id<"workers">; comment: string; createdAt: number };
    const currentComments: Comment[] = Array.isArray(defect.comments)
      ? (defect.comments as Comment[])
      : [];

    const newComment: Comment = {
      id: crypto.randomUUID(),
      workerId: args.workerId,
      comment: args.comment,
      createdAt: now(),
    };

    await ctx.db.patch(args.id, {
      comments: [...currentComments, newComment],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Start progress on a defect
export const startProgress = mutation({
  args: { id: v.id("defects") },
  handler: async (ctx, args) => {
    const defect = await ctx.db.get(args.id);
    if (!defect) {
      throwNotFound("Defect", args.id);
    }

    if (defect.status !== "open") {
      throwValidation("Can only start progress on open defects");
    }

    await ctx.db.patch(args.id, {
      status: "in_progress",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Resolve a defect
export const resolve = mutation({
  args: { id: v.id("defects") },
  handler: async (ctx, args) => {
    const defect = await ctx.db.get(args.id);
    if (!defect) {
      throwNotFound("Defect", args.id);
    }

    if (defect.status === "closed") {
      throwValidation("Cannot resolve a closed defect");
    }

    if (defect.status === "resolved") {
      throwValidation("Defect is already resolved");
    }

    await ctx.db.patch(args.id, {
      status: "resolved",
      resolvedAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// Close a defect
export const close = mutation({
  args: {
    id: v.id("defects"),
    closedBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const defect = await ctx.db.get(args.id);
    if (!defect) {
      throwNotFound("Defect", args.id);
    }

    if (defect.status === "closed") {
      throwValidation("Defect is already closed");
    }

    // Verify closer exists
    const closer = await ctx.db.get(args.closedBy);
    if (!closer) {
      throwNotFound("Worker (closedBy)", args.closedBy);
    }

    await ctx.db.patch(args.id, {
      status: "closed",
      closedAt: now(),
      closedBy: args.closedBy,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Reopen a defect
export const reopen = mutation({
  args: { id: v.id("defects") },
  handler: async (ctx, args) => {
    const defect = await ctx.db.get(args.id);
    if (!defect) {
      throwNotFound("Defect", args.id);
    }

    if (defect.status === "open") {
      throwValidation("Defect is already open");
    }

    await ctx.db.patch(args.id, {
      status: "open",
      resolvedAt: undefined,
      closedAt: undefined,
      closedBy: undefined,
      ...updatedAt(),
    });

    return args.id;
  },
});
