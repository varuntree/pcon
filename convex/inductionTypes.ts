import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const inductionScope = v.union(
  v.literal("company"),
  v.literal("site"),
  v.literal("task"),
  v.literal("plant")
);

const inductionStepType = v.union(
  v.literal("info"),
  v.literal("video"),
  v.literal("quiz"),
  v.literal("acknowledgement"),
  v.literal("document_upload"),
  v.literal("photo_capture")
);

const stepValidator = v.object({
  id: v.string(),
  type: inductionStepType,
  title: v.string(),
  content: v.optional(v.any()),
  required: v.boolean(),
  order: v.number(),
});

// List all induction types for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List active induction types for an org
export const listActive = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// List induction types by scope
export const listByScope = query({
  args: {
    orgId: v.id("orgs"),
    scope: inductionScope,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("scope"), args.scope))
      .collect();
  },
});

// List induction types for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inductionTypes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get a single induction type
export const get = query({
  args: { id: v.id("inductionTypes") },
  handler: async (ctx, args) => {
    const inductionType = await ctx.db.get(args.id);
    if (!inductionType) {
      throwNotFound("InductionType", args.id);
    }
    return inductionType;
  },
});

// Get induction type with required certifications enriched
export const getWithCertifications = query({
  args: { id: v.id("inductionTypes") },
  handler: async (ctx, args) => {
    const inductionType = await ctx.db.get(args.id);
    if (!inductionType) {
      throwNotFound("InductionType", args.id);
    }

    const requiredCertIds = inductionType.requiredCertificationTypeIds;
    let requiredCertifications: Array<{
      _id: string;
      name: string;
      code: string;
      category: string;
    }> = [];

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

    return {
      ...inductionType,
      requiredCertifications,
    };
  },
});

// Create a new induction type
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")),
    name: v.string(),
    description: v.optional(v.string()),
    scope: inductionScope,
    steps: v.array(stepValidator),
    requiredCertificationTypeIds: v.optional(
      v.array(v.id("certificationTypes"))
    ),
    validityDays: v.optional(v.number()),
    createdBy: v.id("workers"),
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
      if (project.orgId !== args.orgId) {
        throwValidation("Project does not belong to this organization");
      }
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (creator)", args.createdBy);
    }

    // Verify required certifications exist
    if (args.requiredCertificationTypeIds) {
      for (const certId of args.requiredCertificationTypeIds) {
        const cert = await ctx.db.get(certId);
        if (!cert) {
          throwNotFound("CertificationType", certId);
        }
      }
    }

    const insertData: Parameters<typeof ctx.db.insert<"inductionTypes">>[1] = {
      orgId: args.orgId,
      name: args.name,
      scope: args.scope,
      steps: args.steps,
      version: 1,
      isActive: true,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.projectId !== undefined) {
      insertData.projectId = args.projectId;
    }
    if (args.description !== undefined) {
      insertData.description = args.description;
    }
    if (args.requiredCertificationTypeIds !== undefined) {
      insertData.requiredCertificationTypeIds =
        args.requiredCertificationTypeIds;
    }
    if (args.validityDays !== undefined) {
      insertData.validityDays = args.validityDays;
    }

    return await ctx.db.insert("inductionTypes", insertData);
  },
});

// Update an induction type (creates new version if published)
export const update = mutation({
  args: {
    id: v.id("inductionTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    steps: v.optional(v.array(stepValidator)),
    requiredCertificationTypeIds: v.optional(
      v.array(v.id("certificationTypes"))
    ),
    validityDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const inductionType = await ctx.db.get(id);
    if (!inductionType) {
      throwNotFound("InductionType", id);
    }

    // Verify required certifications exist if updating
    if (args.requiredCertificationTypeIds) {
      for (const certId of args.requiredCertificationTypeIds) {
        const cert = await ctx.db.get(certId);
        if (!cert) {
          throwNotFound("CertificationType", certId);
        }
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

// Deactivate an induction type
export const deactivate = mutation({
  args: { id: v.id("inductionTypes") },
  handler: async (ctx, args) => {
    const inductionType = await ctx.db.get(args.id);
    if (!inductionType) {
      throwNotFound("InductionType", args.id);
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Clone an induction type (create new version)
export const clone = mutation({
  args: {
    id: v.id("inductionTypes"),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const inductionType = await ctx.db.get(args.id);
    if (!inductionType) {
      throwNotFound("InductionType", args.id);
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker (creator)", args.createdBy);
    }

    const orgId = inductionType.orgId as Id<"orgs">;
    const name =
      typeof inductionType.name === "string"
        ? inductionType.name
        : "Induction";
    const scope =
      (inductionType.scope as "company" | "site" | "task" | "plant") ||
      "company";
    const steps = Array.isArray(inductionType.steps)
      ? (inductionType.steps as Parameters<typeof ctx.db.insert<"inductionTypes">>[1]["steps"])
      : [];
    const version =
      typeof inductionType.version === "number" ? inductionType.version : 1;

    const insertData: Parameters<typeof ctx.db.insert<"inductionTypes">>[1] = {
      orgId,
      name: `${name} (Copy)`,
      scope,
      steps,
      version: version + 1,
      previousVersionId: args.id,
      isActive: true,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (inductionType.projectId) {
      insertData.projectId = inductionType.projectId as Id<"projects">;
    }
    if (
      inductionType.description !== undefined &&
      typeof inductionType.description === "string"
    ) {
      insertData.description = inductionType.description;
    }
    if (Array.isArray(inductionType.requiredCertificationTypeIds)) {
      insertData.requiredCertificationTypeIds =
        inductionType.requiredCertificationTypeIds as Id<"certificationTypes">[];
    }
    if (typeof inductionType.validityDays === "number") {
      insertData.validityDays = inductionType.validityDays;
    }

    return await ctx.db.insert("inductionTypes", insertData);
  },
});
