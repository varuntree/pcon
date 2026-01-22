import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const priorityLevel = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

const actionItemStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

const actionSourceType = v.union(
  v.literal("checklist"),
  v.literal("inspection"),
  v.literal("incident"),
  v.literal("defect"),
  v.literal("itp"),
  v.literal("manual")
);

// Generate 12-char base64url share code
function generateShareCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// List all actions for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actionItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List actions by status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: actionItemStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actionItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// List actions by assignee (org or worker)
export const listByAssignee = query({
  args: {
    assignedTo: v.optional(v.id("orgs")),
    assignedWorkerId: v.optional(v.id("workers")),
  },
  handler: async (ctx, args) => {
    const { assignedTo, assignedWorkerId } = args;
    if (assignedTo) {
      return await ctx.db
        .query("actionItems")
        .withIndex("by_assignee", (q) => q.eq("assignedTo", assignedTo))
        .collect();
    }
    if (assignedWorkerId) {
      return await ctx.db
        .query("actionItems")
        .withIndex("by_worker_assignee", (q) =>
          q.eq("assignedWorkerId", assignedWorkerId)
        )
        .collect();
    }
    return [];
  },
});

// List actions by source
export const listBySource = query({
  args: {
    sourceType: actionSourceType,
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actionItems")
      .withIndex("by_source", (q) => q.eq("sourceType", args.sourceType))
      .filter((q) => q.eq(q.field("sourceId"), args.sourceId))
      .collect();
  },
});

// List action by share code (public access)
export const listByShareCode = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("actionItems")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .collect();
  },
});

// List overdue actions
export const listOverdue = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const currentTime = now();
    const actions = await ctx.db
      .query("actionItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return actions.filter((a) => {
      const dueDate = a.dueDate as number | undefined;
      if (!dueDate) return false;
      if (a.status === "completed" || a.status === "cancelled") return false;
      return dueDate < currentTime;
    });
  },
});

// Get single action by ID
export const get = query({
  args: { id: v.id("actionItems") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throwNotFound("ActionItem", args.id);
    }
    return action;
  },
});

// Get action by share code (public endpoint)
export const getByShareCode = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const action = await ctx.db
      .query("actionItems")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!action) {
      throwNotFound("ActionItem", `shareCode: ${args.shareCode}`);
    }
    return action;
  },
});

// Create action item
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: priorityLevel,
    assignedTo: v.optional(v.id("orgs")),
    assignedWorkerId: v.optional(v.id("workers")),
    dueDate: v.optional(v.number()),
    sourceType: v.optional(actionSourceType),
    sourceId: v.optional(v.string()),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    // Validate dual assignment
    if (args.assignedTo && args.assignedWorkerId) {
      throwValidation(
        "Cannot assign to both organization and worker. Choose one."
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
      throwNotFound("Worker (creator)", args.createdBy);
    }

    // Verify assigned org if provided
    if (args.assignedTo) {
      const assignedOrg = await ctx.db.get(args.assignedTo);
      if (!assignedOrg) {
        throwNotFound("Organization (assigned)", args.assignedTo);
      }
    }

    // Verify assigned worker if provided
    if (args.assignedWorkerId) {
      const assignedWorker = await ctx.db.get(args.assignedWorkerId);
      if (!assignedWorker) {
        throwNotFound("Worker (assigned)", args.assignedWorkerId);
      }
    }

    // Generate action number
    const existing = await ctx.db
      .query("actionItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNum = existing.length + 1;
    const actionNumber = `ACTION-${String(nextNum).padStart(3, "0")}`;

    const insertData: Parameters<typeof ctx.db.insert<"actionItems">>[1] = {
      orgId: args.orgId,
      projectId: args.projectId,
      actionNumber,
      title: args.title,
      priority: args.priority,
      status: "open",
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.description !== undefined) {
      insertData.description = args.description;
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

    return await ctx.db.insert("actionItems", insertData);
  },
});

// Update action item
export const update = mutation({
  args: {
    id: v.id("actionItems"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(priorityLevel),
    assignedTo: v.optional(v.id("orgs")),
    assignedWorkerId: v.optional(v.id("workers")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const action = await ctx.db.get(id);
    if (!action) {
      throwNotFound("ActionItem", id);
    }

    if (action.status === "completed" || action.status === "cancelled") {
      throwValidation(
        `Cannot update a ${action.status} action item`
      );
    }

    // Validate dual assignment
    const newAssignedTo =
      updates.assignedTo !== undefined ? updates.assignedTo : action.assignedTo;
    const newAssignedWorkerId =
      updates.assignedWorkerId !== undefined
        ? updates.assignedWorkerId
        : action.assignedWorkerId;

    if (newAssignedTo && newAssignedWorkerId) {
      throwValidation(
        "Cannot assign to both organization and worker. Choose one."
      );
    }

    // Verify assigned org if changing
    if (updates.assignedTo) {
      const assignedOrg = await ctx.db.get(updates.assignedTo);
      if (!assignedOrg) {
        throwNotFound("Organization (assigned)", updates.assignedTo);
      }
    }

    // Verify assigned worker if changing
    if (updates.assignedWorkerId) {
      const assignedWorker = await ctx.db.get(updates.assignedWorkerId);
      if (!assignedWorker) {
        throwNotFound("Worker (assigned)", updates.assignedWorkerId);
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

// Add comment to action
export const addComment = mutation({
  args: {
    id: v.id("actionItems"),
    workerId: v.id("workers"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throwNotFound("ActionItem", args.id);
    }

    // Verify worker exists
    const worker = await ctx.db.get(args.workerId);
    if (!worker) {
      throwNotFound("Worker", args.workerId);
    }

    type CommentType = {
      id: string;
      workerId: Id<"workers">;
      comment: string;
      createdAt: number;
    };

    const currentComments = Array.isArray(action.comments)
      ? (action.comments as CommentType[])
      : [];

    const newComment: CommentType = {
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

// Add attachment to action
export const addAttachment = mutation({
  args: {
    id: v.id("actionItems"),
    attachmentId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throwNotFound("ActionItem", args.id);
    }

    const currentAttachments = Array.isArray(action.attachmentIds)
      ? (action.attachmentIds as Id<"_storage">[])
      : [];

    await ctx.db.patch(args.id, {
      attachmentIds: [...currentAttachments, args.attachmentId],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Start progress (open -> in_progress)
export const startProgress = mutation({
  args: { id: v.id("actionItems") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throwNotFound("ActionItem", args.id);
    }

    if (action.status !== "open") {
      throwValidation(
        `Cannot start progress on action with status "${action.status}". Only open actions can be started.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "in_progress",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Complete action (open/in_progress -> completed)
export const complete = mutation({
  args: { id: v.id("actionItems") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throwNotFound("ActionItem", args.id);
    }

    if (action.status === "completed") {
      throwValidation("Action is already completed");
    }
    if (action.status === "cancelled") {
      throwValidation("Cannot complete a cancelled action");
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// Cancel action
export const cancel = mutation({
  args: {
    id: v.id("actionItems"),
    cancelReason: v.string(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throwNotFound("ActionItem", args.id);
    }

    if (action.status === "cancelled") {
      throwValidation("Action is already cancelled");
    }
    if (action.status === "completed") {
      throwValidation("Cannot cancel a completed action");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      cancelledAt: now(),
      cancelReason: args.cancelReason,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Generate share code for public access
export const generateShareCodeMutation = mutation({
  args: { id: v.id("actionItems") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throwNotFound("ActionItem", args.id);
    }

    const shareCode = generateShareCode();

    await ctx.db.patch(args.id, {
      shareCode,
      ...updatedAt(),
    });

    return shareCode;
  },
});
