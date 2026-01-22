import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const orgKind = v.union(
  v.literal("principal"),
  v.literal("subcontractor"),
  v.literal("client"),
  v.literal("supplier"),
  v.literal("regulator"),
  v.literal("other")
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orgs").collect();
  },
});

export const listByKind = query({
  args: { kind: orgKind },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orgs")
      .withIndex("by_kind", (q) => q.eq("kind", args.kind))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("orgs") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.id);
    if (!org) {
      throwNotFound("Organization", args.id);
    }
    return org;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    abn: v.optional(v.string()),
    kind: orgKind,
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Validate ABN format (11 digits)
    if (args.abn && !/^\d{11}$/.test(args.abn)) {
      throwValidation("ABN must be exactly 11 digits");
    }

    // Check ABN uniqueness
    if (args.abn) {
      const existing = await ctx.db
        .query("orgs")
        .filter((q) => q.eq(q.field("abn"), args.abn))
        .first();
      if (existing) {
        throwValidation("An organization with this ABN already exists");
      }
    }

    return await ctx.db.insert("orgs", {
      ...args,
      ...timestamps(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("orgs"),
    name: v.optional(v.string()),
    abn: v.optional(v.string()),
    kind: v.optional(orgKind),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const org = await ctx.db.get(id);
    if (!org) {
      throwNotFound("Organization", id);
    }

    // Validate ABN format
    if (updates.abn && !/^\d{11}$/.test(updates.abn)) {
      throwValidation("ABN must be exactly 11 digits");
    }

    // Check ABN uniqueness (exclude current org)
    if (updates.abn && updates.abn !== org.abn) {
      const existing = await ctx.db
        .query("orgs")
        .filter((q) => q.eq(q.field("abn"), updates.abn))
        .first();
      if (existing) {
        throwValidation("An organization with this ABN already exists");
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
