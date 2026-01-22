import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const permitRiskLevel = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

const fieldType = v.union(
  v.literal("text"),
  v.literal("textarea"),
  v.literal("number"),
  v.literal("select"),
  v.literal("multiselect"),
  v.literal("date"),
  v.literal("yesno"),
  v.literal("checkbox")
);

const requiredFieldValidator = v.object({
  id: v.string(),
  label: v.string(),
  type: fieldType,
  required: v.boolean(),
  options: v.optional(v.array(v.string())),
});

// List all permit types for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permitTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List active permit types for an org
export const listActive = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permitTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get a single permit type
export const get = query({
  args: { id: v.id("permitTypes") },
  handler: async (ctx, args) => {
    const permitType = await ctx.db.get(args.id);
    if (!permitType) {
      throwNotFound("PermitType", args.id);
    }
    return permitType;
  },
});

// Get permit type by code within org
export const getByCode = query({
  args: {
    orgId: v.id("orgs"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.toUpperCase();
    return await ctx.db
      .query("permitTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("code"), normalizedCode))
      .first();
  },
});

// Create a new permit type
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    requiredFields: v.array(requiredFieldValidator),
    defaultValidityHours: v.number(),
    riskLevel: permitRiskLevel,
    checklistTemplateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Check code uniqueness within org
    const normalizedCode = args.code.toUpperCase();
    const existing = await ctx.db
      .query("permitTypes")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("code"), normalizedCode))
      .first();

    if (existing) {
      throwValidation(
        `A permit type with code "${args.code}" already exists in this organization`
      );
    }

    const insertData: Parameters<typeof ctx.db.insert<"permitTypes">>[1] = {
      orgId: args.orgId,
      name: args.name,
      code: normalizedCode,
      requiredFields: args.requiredFields,
      defaultValidityHours: args.defaultValidityHours,
      riskLevel: args.riskLevel,
      isActive: true,
      ...timestamps(),
    };

    if (args.description !== undefined) {
      insertData.description = args.description;
    }
    if (args.checklistTemplateId !== undefined) {
      insertData.checklistTemplateId = args.checklistTemplateId;
    }

    return await ctx.db.insert("permitTypes", insertData);
  },
});

// Update a permit type
export const update = mutation({
  args: {
    id: v.id("permitTypes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    requiredFields: v.optional(v.array(requiredFieldValidator)),
    defaultValidityHours: v.optional(v.number()),
    riskLevel: v.optional(permitRiskLevel),
    checklistTemplateId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const permitType = await ctx.db.get(id);
    if (!permitType) {
      throwNotFound("PermitType", id);
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

// Deactivate a permit type (soft delete)
export const deactivate = mutation({
  args: { id: v.id("permitTypes") },
  handler: async (ctx, args) => {
    const permitType = await ctx.db.get(args.id);
    if (!permitType) {
      throwNotFound("PermitType", args.id);
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Reactivate a permit type
export const reactivate = mutation({
  args: { id: v.id("permitTypes") },
  handler: async (ctx, args) => {
    const permitType = await ctx.db.get(args.id);
    if (!permitType) {
      throwNotFound("PermitType", args.id);
    }

    await ctx.db.patch(args.id, {
      isActive: true,
      ...updatedAt(),
    });

    return args.id;
  },
});
