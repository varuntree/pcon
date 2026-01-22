import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const inductionCompletionStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("awaiting_review"),
  v.literal("completed"),
  v.literal("expired"),
  v.literal("superseded")
);

const profileValidator = v.object({
  fullName: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  trade: v.optional(v.string()),
  employer: v.optional(v.string()),
});

const emergencyContactValidator = v.object({
  name: v.string(),
  phone: v.string(),
  relationship: v.union(
    v.literal("Spouse"),
    v.literal("Parent"),
    v.literal("Sibling"),
    v.literal("Other")
  ),
});

const certificationUploadValidator = v.object({
  certificationTypeId: v.id("certificationTypes"),
  certNumber: v.string(),
  expiryDate: v.optional(v.number()),
  frontPhotoId: v.optional(v.id("_storage")),
  backPhotoId: v.optional(v.id("_storage")),
});

const auditLogEntryValidator = v.object({
  actorId: v.optional(v.id("workers")),
  action: v.string(),
  timestamp: v.number(),
  comment: v.optional(v.string()),
});

// List all completions for a worker
export const listByWorker = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionCompletions")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .collect();
  },
});

// List all completions for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionCompletions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List completions by status
export const listByStatus = query({
  args: {
    orgId: v.id("orgs"),
    status: inductionCompletionStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionCompletions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// List pending reviews for an org
export const listPendingReview = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionCompletions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), "awaiting_review"))
      .collect();
  },
});

// Get a single completion
export const get = query({
  args: { id: v.id("inductionCompletions") },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.id);
    if (!completion) {
      throwNotFound("InductionCompletion", args.id);
    }
    return completion;
  },
});

// Get completion with enriched data
export const getWithDetails = query({
  args: { id: v.id("inductionCompletions") },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.id);
    if (!completion) {
      throwNotFound("InductionCompletion", args.id);
    }

    const inductionTypeId = completion.inductionTypeId as Id<"inductionTypes">;
    const workerId = completion.workerId as Id<"workers"> | undefined;
    const reviewerId = completion.reviewedBy as Id<"workers"> | undefined;

    const inductionType = inductionTypeId
      ? await ctx.db.get(inductionTypeId)
      : null;
    const worker = workerId ? await ctx.db.get(workerId) : null;
    const reviewer = reviewerId ? await ctx.db.get(reviewerId) : null;

    return {
      ...completion,
      inductionType: inductionType
        ? {
            _id: inductionType._id,
            name: inductionType.name,
            scope: inductionType.scope,
          }
        : null,
      worker: worker
        ? {
            _id: worker._id,
            fullName: worker.fullName,
            email: worker.email,
          }
        : null,
      reviewer: reviewer
        ? {
            _id: reviewer._id,
            fullName: reviewer.fullName,
          }
        : null,
    };
  },
});

// Create a new completion (start induction)
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")),
    inductionTypeId: v.id("inductionTypes"),
    workerId: v.optional(v.id("workers")),
    inviteId: v.optional(v.id("inductionInvites")),
    profile: v.optional(profileValidator),
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

    // Verify induction type exists
    const inductionType = await ctx.db.get(args.inductionTypeId);
    if (!inductionType) {
      throwNotFound("InductionType", args.inductionTypeId);
    }

    // Verify worker exists if provided
    if (args.workerId) {
      const worker = await ctx.db.get(args.workerId);
      if (!worker) {
        throwNotFound("Worker", args.workerId);
      }
    }

    // Verify invite exists if provided
    if (args.inviteId) {
      const invite = await ctx.db.get(args.inviteId);
      if (!invite) {
        throwNotFound("InductionInvite", args.inviteId);
      }
    }

    const insertData: Parameters<
      typeof ctx.db.insert<"inductionCompletions">
    >[1] = {
      orgId: args.orgId,
      inductionTypeId: args.inductionTypeId,
      status: "pending",
      auditLog: [
        {
          actorId: args.workerId,
          action: "created",
          timestamp: now(),
        },
      ],
      ...timestamps(),
    };

    if (args.projectId !== undefined) {
      insertData.projectId = args.projectId;
    }
    if (args.workerId !== undefined) {
      insertData.workerId = args.workerId;
    }
    if (args.inviteId !== undefined) {
      insertData.inviteId = args.inviteId;
    }
    if (args.profile !== undefined) {
      insertData.profile = args.profile;
    }

    return await ctx.db.insert("inductionCompletions", insertData);
  },
});

// Start induction (pending -> in_progress)
export const start = mutation({
  args: { id: v.id("inductionCompletions") },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.id);
    if (!completion) {
      throwNotFound("InductionCompletion", args.id);
    }

    if (completion.status !== "pending") {
      throwValidation(
        `Cannot start an induction with status "${completion.status}"`
      );
    }

    const currentAuditLog = Array.isArray(completion.auditLog)
      ? (completion.auditLog as { actorId?: Id<"workers">; action: string; timestamp: number; comment?: string }[])
      : [];

    await ctx.db.patch(args.id, {
      status: "in_progress",
      startedAt: now(),
      auditLog: [
        ...currentAuditLog,
        {
          action: "started",
          timestamp: now(),
        },
      ],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Update completion progress (save profile, emergency contact, responses)
export const updateProgress = mutation({
  args: {
    id: v.id("inductionCompletions"),
    profile: v.optional(profileValidator),
    emergencyContact: v.optional(emergencyContactValidator),
    responses: v.optional(v.any()),
    certificationUploads: v.optional(v.array(certificationUploadValidator)),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const completion = await ctx.db.get(id);
    if (!completion) {
      throwNotFound("InductionCompletion", id);
    }

    if (
      completion.status !== "pending" &&
      completion.status !== "in_progress"
    ) {
      throwValidation(
        `Cannot update an induction with status "${completion.status}"`
      );
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      status: "in_progress",
      ...updatedAt(),
    });

    return id;
  },
});

// Submit completion for review (in_progress -> awaiting_review)
export const submit = mutation({
  args: {
    id: v.id("inductionCompletions"),
    signatureData: v.string(),
  },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.id);
    if (!completion) {
      throwNotFound("InductionCompletion", args.id);
    }

    if (
      completion.status !== "pending" &&
      completion.status !== "in_progress"
    ) {
      throwValidation(
        `Cannot submit an induction with status "${completion.status}"`
      );
    }

    // Validate signature
    if (!args.signatureData || args.signatureData.length === 0) {
      throwValidation("Signature data cannot be empty");
    }

    const signedAt = now();
    const signatureHash = Buffer.from(
      `${args.signatureData}:${signedAt}`
    ).toString("base64");

    const currentAuditLog = Array.isArray(completion.auditLog)
      ? (completion.auditLog as { actorId?: Id<"workers">; action: string; timestamp: number; comment?: string }[])
      : [];

    await ctx.db.patch(args.id, {
      status: "awaiting_review",
      signatureData: args.signatureData,
      signatureHash,
      signedAt,
      submittedAt: now(),
      auditLog: [
        ...currentAuditLog,
        {
          action: "submitted",
          timestamp: now(),
        },
      ],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Approve completion (awaiting_review -> completed)
export const approve = mutation({
  args: {
    id: v.id("inductionCompletions"),
    reviewedBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.id);
    if (!completion) {
      throwNotFound("InductionCompletion", args.id);
    }

    if (completion.status !== "awaiting_review") {
      throwValidation(
        `Cannot approve an induction with status "${completion.status}"`
      );
    }

    // Verify reviewer exists
    const reviewer = await ctx.db.get(args.reviewedBy);
    if (!reviewer) {
      throwNotFound("Worker (reviewer)", args.reviewedBy);
    }

    // Get induction type for validity calculation
    const inductionTypeId = completion.inductionTypeId as Id<"inductionTypes">;
    const inductionType = inductionTypeId
      ? await ctx.db.get(inductionTypeId)
      : null;
    const validityDays =
      typeof inductionType?.validityDays === "number"
        ? inductionType.validityDays
        : null;

    const completedAt = now();
    const expiresAt = validityDays
      ? completedAt + validityDays * 24 * 60 * 60 * 1000
      : undefined;

    const currentAuditLog = Array.isArray(completion.auditLog)
      ? (completion.auditLog as { actorId?: Id<"workers">; action: string; timestamp: number; comment?: string }[])
      : [];

    await ctx.db.patch(args.id, {
      status: "completed",
      reviewedBy: args.reviewedBy,
      reviewedAt: now(),
      completedAt,
      expiresAt,
      auditLog: [
        ...currentAuditLog,
        {
          actorId: args.reviewedBy,
          action: "approved",
          timestamp: now(),
        },
      ],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Return completion for revision (awaiting_review -> in_progress)
export const returnForRevision = mutation({
  args: {
    id: v.id("inductionCompletions"),
    reviewedBy: v.id("workers"),
    returnReason: v.string(),
  },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.id);
    if (!completion) {
      throwNotFound("InductionCompletion", args.id);
    }

    if (completion.status !== "awaiting_review") {
      throwValidation(
        `Cannot return an induction with status "${completion.status}"`
      );
    }

    // Verify reviewer exists
    const reviewer = await ctx.db.get(args.reviewedBy);
    if (!reviewer) {
      throwNotFound("Worker (reviewer)", args.reviewedBy);
    }

    const currentAuditLog = Array.isArray(completion.auditLog)
      ? (completion.auditLog as { actorId?: Id<"workers">; action: string; timestamp: number; comment?: string }[])
      : [];

    await ctx.db.patch(args.id, {
      status: "in_progress",
      reviewedBy: args.reviewedBy,
      reviewedAt: now(),
      returnReason: args.returnReason,
      // Clear signature for re-signing
      signatureData: undefined,
      signatureHash: undefined,
      signedAt: undefined,
      submittedAt: undefined,
      auditLog: [
        ...currentAuditLog,
        {
          actorId: args.reviewedBy,
          action: "returned",
          timestamp: now(),
          comment: args.returnReason,
        },
      ],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Mark completion as expired
export const expire = mutation({
  args: { id: v.id("inductionCompletions") },
  handler: async (ctx, args) => {
    const completion = await ctx.db.get(args.id);
    if (!completion) {
      throwNotFound("InductionCompletion", args.id);
    }

    if (completion.status !== "completed") {
      throwValidation(
        `Cannot expire an induction with status "${completion.status}"`
      );
    }

    const currentAuditLog = Array.isArray(completion.auditLog)
      ? (completion.auditLog as { actorId?: Id<"workers">; action: string; timestamp: number; comment?: string }[])
      : [];

    await ctx.db.patch(args.id, {
      status: "expired",
      auditLog: [
        ...currentAuditLog,
        {
          action: "expired",
          timestamp: now(),
        },
      ],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Check if worker has valid induction for a type
export const checkWorkerInduction = query({
  args: {
    workerId: v.id("workers"),
    inductionTypeId: v.id("inductionTypes"),
  },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("inductionCompletions")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .filter((q) =>
        q.and(
          q.eq(q.field("inductionTypeId"), args.inductionTypeId),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    const currentTime = now();

    // Find a valid (non-expired) completion
    const validCompletion = completions.find((c) => {
      const expiresAt = c.expiresAt;
      if (typeof expiresAt !== "number") return true; // No expiry = always valid
      return expiresAt > currentTime;
    });

    return {
      hasValidInduction: !!validCompletion,
      completion: validCompletion
        ? {
            _id: validCompletion._id,
            status: validCompletion.status,
            completedAt: validCompletion.completedAt,
            expiresAt: validCompletion.expiresAt,
          }
        : null,
    };
  },
});
