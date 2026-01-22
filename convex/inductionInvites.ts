import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const inductionInviteStatus = v.union(
  v.literal("pending"),
  v.literal("awaiting_review"),
  v.literal("completed")
);

// Generate share code (12-char alphanumeric)
function generateShareCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// List all invites for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionInvites")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List invites by status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: inductionInviteStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionInvites")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// Get a single invite
export const get = query({
  args: { id: v.id("inductionInvites") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.id);
    if (!invite) {
      throwNotFound("InductionInvite", args.id);
    }
    return invite;
  },
});

// Get invite by share code (public, no auth)
export const getByShareCode = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("inductionInvites")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!invite) {
      throwNotFound("InductionInvite", `shareCode: ${args.shareCode}`);
    }

    // Check if expired
    const expiresAt = invite.expiresAt;
    if (typeof expiresAt === "number" && expiresAt < now()) {
      throwValidation("This invitation has expired.");
    }

    if (invite.status === "completed") {
      throwValidation("This invitation has already been completed.");
    }

    // Get induction type
    const inductionTypeId = invite.inductionTypeId as Id<"inductionTypes">;
    const inductionType = inductionTypeId
      ? await ctx.db.get(inductionTypeId)
      : null;

    // Get project and org names
    const projectId = invite.projectId as Id<"projects">;
    const orgId = invite.orgId as Id<"orgs">;
    const project = projectId ? await ctx.db.get(projectId) : null;
    const org = orgId ? await ctx.db.get(orgId) : null;

    return {
      _id: invite._id,
      shareCode: invite.shareCode,
      status: invite.status,
      targetName: invite.targetName,
      targetEmail: invite.targetEmail,
      expiresAt: invite.expiresAt,
      inductionType: inductionType
        ? {
            _id: inductionType._id,
            name: inductionType.name,
            scope: inductionType.scope,
            steps: inductionType.steps,
            requiredCertificationTypeIds:
              inductionType.requiredCertificationTypeIds,
          }
        : null,
      projectName: project?.name ?? "Unknown Project",
      orgName: org?.name ?? "Unknown Organization",
    };
  },
});

// Create a new invite
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    inductionTypeId: v.id("inductionTypes"),
    createdBy: v.id("workers"),
    targetEmail: v.optional(v.string()),
    targetName: v.optional(v.string()),
    expiresInDays: v.optional(v.number()),
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
      throwValidation("Project does not belong to this organization");
    }

    // Verify induction type exists and is active
    const inductionType = await ctx.db.get(args.inductionTypeId);
    if (!inductionType) {
      throwNotFound("InductionType", args.inductionTypeId);
    }
    if (!inductionType.isActive) {
      throwValidation("Cannot create invite from inactive induction type");
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (creator)", args.createdBy);
    }

    const shareCode = generateShareCode();
    const expiryDays = args.expiresInDays ?? 30;
    const expiresAt = now() + expiryDays * 24 * 60 * 60 * 1000;

    const insertData: Parameters<typeof ctx.db.insert<"inductionInvites">>[1] =
      {
        orgId: args.orgId,
        projectId: args.projectId,
        inductionTypeId: args.inductionTypeId,
        shareCode,
        status: "pending",
        createdBy: args.createdBy,
        expiresAt,
        ...timestamps(),
      };

    if (args.targetEmail !== undefined) {
      insertData.targetEmail = args.targetEmail;
    }
    if (args.targetName !== undefined) {
      insertData.targetName = args.targetName;
    }

    return await ctx.db.insert("inductionInvites", insertData);
  },
});

// Deactivate an invite (mark as expired)
export const deactivate = mutation({
  args: { id: v.id("inductionInvites") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.id);
    if (!invite) {
      throwNotFound("InductionInvite", args.id);
    }

    if (invite.status === "completed") {
      throwValidation("Cannot deactivate a completed invite");
    }

    await ctx.db.patch(args.id, {
      expiresAt: now() - 1, // Set expiry to past
      ...updatedAt(),
    });

    return args.id;
  },
});

// Mark invite as awaiting review (completion submitted)
export const markAwaitingReview = mutation({
  args: {
    id: v.id("inductionInvites"),
    completionId: v.id("inductionCompletions"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.id);
    if (!invite) {
      throwNotFound("InductionInvite", args.id);
    }

    if (invite.status !== "pending") {
      throwValidation(
        `Cannot mark invite as awaiting review with status "${invite.status}"`
      );
    }

    await ctx.db.patch(args.id, {
      status: "awaiting_review",
      completionId: args.completionId,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Mark invite as completed
export const markCompleted = mutation({
  args: { id: v.id("inductionInvites") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.id);
    if (!invite) {
      throwNotFound("InductionInvite", args.id);
    }

    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// Get invite with completion status enriched
export const getWithCompletion = query({
  args: { id: v.id("inductionInvites") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.id);
    if (!invite) {
      throwNotFound("InductionInvite", args.id);
    }

    const inductionTypeId = invite.inductionTypeId as Id<"inductionTypes">;
    const completionId = invite.completionId as
      | Id<"inductionCompletions">
      | undefined;

    const inductionType = inductionTypeId
      ? await ctx.db.get(inductionTypeId)
      : null;
    const completion = completionId ? await ctx.db.get(completionId) : null;

    return {
      ...invite,
      inductionType: inductionType
        ? {
            _id: inductionType._id,
            name: inductionType.name,
            scope: inductionType.scope,
          }
        : null,
      completion: completion
        ? {
            _id: completion._id,
            status: completion.status,
            profile: completion.profile,
            submittedAt: completion.submittedAt,
            completedAt: completion.completedAt,
          }
        : null,
    };
  },
});
