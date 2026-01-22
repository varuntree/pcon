import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const certificationCategory = v.union(
  v.literal("license"),
  v.literal("ticket"),
  v.literal("training"),
  v.literal("medical"),
  v.literal("other")
);

// List all certification types for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificationTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List active certification types for an org
export const listActive = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("certificationTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get a single certification type
export const get = query({
  args: { id: v.id("certificationTypes") },
  handler: async (ctx, args) => {
    const certType = await ctx.db.get(args.id);
    if (!certType) {
      throwNotFound("CertificationType", args.id);
    }
    return certType;
  },
});

// Get certification type by code within org
export const getByCode = query({
  args: {
    orgId: v.id("orgs"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.toUpperCase();
    return await ctx.db
      .query("certificationTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("code"), normalizedCode))
      .first();
  },
});

// Create a new certification type
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    code: v.string(),
    category: certificationCategory,
    description: v.optional(v.string()),
    validityDays: v.optional(v.number()),
    expiryWarningDays: v.optional(v.number()),
    isRequiredOrgwide: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Check code uniqueness within org (case-insensitive)
    const normalizedCode = args.code.toUpperCase();
    const existing = await ctx.db
      .query("certificationTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("code"), normalizedCode))
      .first();

    if (existing) {
      throwValidation(
        `A certification type with code "${args.code}" already exists in this organization`
      );
    }

    const insertData: Parameters<typeof ctx.db.insert<"certificationTypes">>[1] =
      {
        orgId: args.orgId,
        name: args.name,
        code: normalizedCode,
        category: args.category,
        expiryWarningDays: args.expiryWarningDays ?? 30,
        isRequiredOrgwide: args.isRequiredOrgwide ?? false,
        isActive: true,
        ...timestamps(),
      };

    if (args.description !== undefined) {
      insertData.description = args.description;
    }
    if (args.validityDays !== undefined) {
      insertData.validityDays = args.validityDays;
    }

    return await ctx.db.insert("certificationTypes", insertData);
  },
});

// Update a certification type
export const update = mutation({
  args: {
    id: v.id("certificationTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    validityDays: v.optional(v.number()),
    expiryWarningDays: v.optional(v.number()),
    isRequiredOrgwide: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const certType = await ctx.db.get(id);
    if (!certType) {
      throwNotFound("CertificationType", id);
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

// Deactivate a certification type (soft delete)
export const deactivate = mutation({
  args: { id: v.id("certificationTypes") },
  handler: async (ctx, args) => {
    const certType = await ctx.db.get(args.id);
    if (!certType) {
      throwNotFound("CertificationType", args.id);
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      ...updatedAt(),
    });

    return args.id;
  },
});

// List required org-wide certifications
export const listRequiredOrgwide = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const allActive = await ctx.db
      .query("certificationTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return allActive.filter((ct) => ct.isRequiredOrgwide);
  },
});
