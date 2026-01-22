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

export const getSafetyStats = query({
  args: { id: v.id("orgs") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.id);
    if (!org) {
      throwNotFound("Organization", args.id);
    }

    // Count active projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.id))
      .collect();
    const activeProjects = projects.filter((p) => p.status === "active").length;

    // Count workers
    const workers = await ctx.db
      .query("workers")
      .withIndex("by_org", (q) => q.eq("orgId", args.id))
      .collect();

    // Count open incidents (status != closed)
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_org", (q) => q.eq("orgId", args.id))
      .collect();
    const openIncidents = incidents.filter((i) => i.status !== "closed").length;

    // Count pending permits (status = pending_approval)
    const permits = await ctx.db
      .query("permits")
      .withIndex("by_org", (q) => q.eq("orgId", args.id))
      .collect();
    const pendingPermits = permits.filter(
      (p) => p.status === "pending_approval"
    ).length;

    // Count induction completions awaiting review
    const completions = await ctx.db
      .query("inductionCompletions")
      .withIndex("by_org", (q) => q.eq("orgId", args.id))
      .collect();
    const awaitingReview = completions.filter(
      (c) => c.status === "awaiting_review"
    ).length;

    // Count SWMS documents with pending acknowledgements
    const swmsDocuments = await ctx.db
      .query("swmsDocuments")
      .withIndex("by_org", (q) => q.eq("orgId", args.id))
      .collect();
    const approvedSwms = swmsDocuments.filter((d) => d.status === "approved");

    // Get all assignments for approved SWMS and count those with pending acknowledgements
    let swmsNeedingSignatures = 0;
    for (const doc of approvedSwms) {
      const assignments = await ctx.db
        .query("swmsAssignments")
        .withIndex("by_document", (q) => q.eq("swmsDocumentId", doc._id))
        .collect();
      const hasUnacknowledged = assignments.some((a) => !a.acknowledgedAt);
      if (hasUnacknowledged) {
        swmsNeedingSignatures++;
      }
    }

    return {
      activeProjects,
      totalWorkers: workers.length,
      openIncidents,
      pendingPermits,
      awaitingReview,
      swmsNeedingSignatures,
    };
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
