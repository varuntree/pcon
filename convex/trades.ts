import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("trades").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("trades")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("trades") },
  handler: async (ctx, args) => {
    const trade = await ctx.db.get(args.id);
    if (!trade) {
      throwNotFound("Trade", args.id);
    }
    return trade;
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const trade = await ctx.db
      .query("trades")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!trade) {
      throwNotFound("Trade with code " + args.code);
    }
    return trade;
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check code uniqueness
    const existing = await ctx.db
      .query("trades")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existing) {
      throwValidation(`A trade with code "${args.code}" already exists`);
    }

    return await ctx.db.insert("trades", {
      ...args,
      isActive: args.isActive ?? true,
      ...timestamps(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("trades"),
    code: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const trade = await ctx.db.get(id);
    if (!trade) {
      throwNotFound("Trade", id);
    }

    // Check code uniqueness if changing
    if (updates.code && updates.code !== trade.code) {
      const newCode = updates.code;
      const existing = await ctx.db
        .query("trades")
        .withIndex("by_code", (q) => q.eq("code", newCode))
        .first();

      if (existing) {
        throwValidation(`A trade with code "${newCode}" already exists`);
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
