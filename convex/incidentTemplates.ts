import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const incidentType = v.union(
  v.literal("injury"),
  v.literal("near_miss"),
  v.literal("property_damage"),
  v.literal("environmental"),
  v.literal("other")
);

// List all incident templates for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List active incident templates for an org
export const listActive = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// List templates by incident type
export const listByType = query({
  args: {
    orgId: v.id("orgs"),
    incidentType: incidentType,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("incidentType"), args.incidentType))
      .collect();
  },
});

// Get a single incident template
export const get = query({
  args: { id: v.id("incidentTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("IncidentTemplate", args.id);
    }
    return template;
  },
});

// Create a new incident template
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    description: v.optional(v.string()),
    incidentType: incidentType,
    checklistTemplateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    const insertData: Parameters<typeof ctx.db.insert<"incidentTemplates">>[1] =
      {
        orgId: args.orgId,
        name: args.name,
        incidentType: args.incidentType,
        isActive: true,
        ...timestamps(),
      };

    if (args.description !== undefined) {
      insertData.description = args.description;
    }
    if (args.checklistTemplateId !== undefined) {
      insertData.checklistTemplateId = args.checklistTemplateId;
    }

    return await ctx.db.insert("incidentTemplates", insertData);
  },
});

// Update an incident template
export const update = mutation({
  args: {
    id: v.id("incidentTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    checklistTemplateId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const template = await ctx.db.get(id);
    if (!template) {
      throwNotFound("IncidentTemplate", id);
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

// Deactivate an incident template
export const deactivate = mutation({
  args: { id: v.id("incidentTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("IncidentTemplate", args.id);
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      ...updatedAt(),
    });

    return args.id;
  },
});
