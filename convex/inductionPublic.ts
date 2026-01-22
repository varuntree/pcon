import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

/**
 * Public Induction APIs - No authentication required
 * These endpoints are accessed via share codes for off-site induction completion
 */

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

// Get induction invite by share code (public, no auth)
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

    // Get required certifications enriched
    let requiredCertifications: Array<{
      _id: string;
      name: string;
      code: string;
      category: string;
    }> = [];

    if (inductionType) {
      const requiredCertIds = inductionType.requiredCertificationTypeIds;
      if (Array.isArray(requiredCertIds)) {
        const certs = await Promise.all(
          (requiredCertIds as Id<"certificationTypes">[]).map(async (id) => {
            const cert = await ctx.db.get(id);
            return cert
              ? {
                  _id: cert._id as string,
                  name: cert.name as string,
                  code: cert.code as string,
                  category: cert.category as string,
                }
              : null;
          })
        );
        requiredCertifications = certs.filter(
          (c): c is NonNullable<typeof c> => c !== null
        );
      }
    }

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
            validityDays: inductionType.validityDays,
          }
        : null,
      requiredCertifications,
      projectName: project?.name ?? "Unknown Project",
      orgName: org?.name ?? "Unknown Organization",
    };
  },
});

// Submit induction wizard (public, no auth)
export const submitWizard = mutation({
  args: {
    shareCode: v.string(),
    profile: profileValidator,
    emergencyContact: emergencyContactValidator,
    responses: v.optional(v.any()),
    certificationUploads: v.optional(v.array(certificationUploadValidator)),
    signatureData: v.string(),
  },
  handler: async (ctx, args) => {
    // Find invite by share code
    const invite = await ctx.db
      .query("inductionInvites")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!invite) {
      throwNotFound("InductionInvite", `shareCode: ${args.shareCode}`);
    }

    // Validate invite status
    const expiresAt = invite.expiresAt;
    if (typeof expiresAt === "number" && expiresAt < now()) {
      throwValidation("This invitation has expired.");
    }

    if (invite.status === "completed") {
      throwValidation("This invitation has already been completed.");
    }

    // Validate signature
    if (!args.signatureData || args.signatureData.length === 0) {
      throwValidation("Signature data cannot be empty");
    }

    // Create completion record
    const orgId = invite.orgId as Id<"orgs">;
    const projectId = invite.projectId as Id<"projects">;
    const inductionTypeId = invite.inductionTypeId as Id<"inductionTypes">;

    const signedAt = now();
    const signatureHash = Buffer.from(
      `${args.signatureData}:${signedAt}`
    ).toString("base64");

    const insertData: Parameters<
      typeof ctx.db.insert<"inductionCompletions">
    >[1] = {
      orgId,
      projectId,
      inductionTypeId,
      inviteId: invite!._id as Id<"inductionInvites">,
      status: "awaiting_review",
      profile: args.profile,
      emergencyContact: args.emergencyContact,
      responses: args.responses,
      signatureData: args.signatureData,
      signatureHash,
      signedAt,
      startedAt: now(),
      submittedAt: now(),
      auditLog: [
        {
          action: "created_via_public",
          timestamp: now(),
        },
        {
          action: "submitted",
          timestamp: now(),
        },
      ],
      ...timestamps(),
    };

    if (args.certificationUploads !== undefined) {
      insertData.certificationUploads = args.certificationUploads;
    }

    const completionId = await ctx.db.insert("inductionCompletions", insertData);

    // Update invite status
    const inviteId = invite._id as Id<"inductionInvites">;
    await ctx.db.patch(inviteId, {
      status: "awaiting_review",
      completionId,
      ...updatedAt(),
    });

    return {
      success: true,
      completionId,
      message:
        "Thank you for completing the induction. Your submission is now awaiting review.",
    };
  },
});

// Get completion status by share code (public, no auth)
export const getCompletionStatus = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("inductionInvites")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!invite) {
      return { found: false };
    }

    const completionId = invite.completionId as
      | Id<"inductionCompletions">
      | undefined;
    const completion = completionId ? await ctx.db.get(completionId) : null;

    return {
      found: true,
      inviteStatus: invite.status,
      completionStatus: completion?.status ?? null,
      completedAt: completion?.completedAt ?? null,
    };
  },
});
