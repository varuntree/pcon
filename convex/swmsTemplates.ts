import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

const swmsTemplateStatus = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived")
);

const swmsSectionType = v.union(
  v.literal("title"),
  v.literal("activity"),
  v.literal("ppe"),
  v.literal("hazards"),
  v.literal("controls"),
  v.literal("plant"),
  v.literal("hazmat"),
  v.literal("permits"),
  v.literal("training"),
  v.literal("emergency"),
  v.literal("legislation"),
  v.literal("hrcw"),
  v.literal("supervision")
);

const sectionValidator = v.object({
  id: v.string(),
  type: swmsSectionType,
  title: v.string(),
  content: v.any(),
  order: v.number(),
});

// List all templates for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List templates by status
export const listByStatus = query({
  args: {
    orgId: v.id("orgs"),
    status: swmsTemplateStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// List published templates (for creating documents)
export const listPublished = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();
  },
});

// Get a single template
export const get = query({
  args: { id: v.id("swmsTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("SWMSTemplate", args.id);
    }
    return template;
  },
});

// Create a new template (starts as draft)
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    description: v.optional(v.string()),
    sections: v.array(sectionValidator),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker", args.createdBy);
    }

    const insertData: Parameters<typeof ctx.db.insert<"swmsTemplates">>[1] = {
      orgId: args.orgId,
      name: args.name,
      sections: args.sections,
      status: "draft",
      version: 1,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.description !== undefined) {
      insertData.description = args.description;
    }

    return await ctx.db.insert("swmsTemplates", insertData);
  },
});

// Update a draft template
export const update = mutation({
  args: {
    id: v.id("swmsTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    sections: v.optional(v.array(sectionValidator)),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const template = await ctx.db.get(id);
    if (!template) {
      throwNotFound("SWMSTemplate", id);
    }

    if (template.status !== "draft") {
      throwValidation(
        `Cannot update a template with status "${template.status}". Only draft templates can be updated.`
      );
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

// Publish a template (draft -> published, becomes immutable)
export const publish = mutation({
  args: { id: v.id("swmsTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("SWMSTemplate", args.id);
    }

    if (template.status !== "draft") {
      throwValidation(
        `Cannot publish a template with status "${template.status}". Only draft templates can be published.`
      );
    }

    // Validate template has required sections
    const sections = template.sections;
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throwValidation("Template must have at least one section to publish.");
    }

    await ctx.db.patch(args.id, {
      status: "published",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Archive a template (published -> archived)
export const archive = mutation({
  args: { id: v.id("swmsTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("SWMSTemplate", args.id);
    }

    if (template.status === "archived") {
      throwValidation("Template is already archived.");
    }

    await ctx.db.patch(args.id, {
      status: "archived",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Clone a template (creates new draft with incremented version)
export const clone = mutation({
  args: {
    id: v.id("swmsTemplates"),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("SWMSTemplate", args.id);
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker", args.createdBy);
    }

    const templateVersion = typeof template.version === "number" ? template.version : 1;
    const templateName = typeof template.name === "string" ? template.name : "Template";
    const templateSections = Array.isArray(template.sections) ? template.sections : [];

    const insertData: Parameters<typeof ctx.db.insert<"swmsTemplates">>[1] = {
      orgId: template.orgId,
      name: `${templateName} (Copy)`,
      sections: templateSections as Parameters<typeof ctx.db.insert<"swmsTemplates">>[1]["sections"],
      status: "draft",
      version: templateVersion + 1,
      previousVersionId: args.id,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (template.description !== undefined && typeof template.description === "string") {
      insertData.description = template.description;
    }

    return await ctx.db.insert("swmsTemplates", insertData);
  },
});

// Get version history for a template
export const getVersionHistory = query({
  args: { id: v.id("swmsTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("SWMSTemplate", args.id);
    }

    const templateVersion = typeof template.version === "number" ? template.version : 1;
    const templateStatus = typeof template.status === "string" ? template.status : "draft";
    const templateCreatedAt = typeof template.createdAt === "number" ? template.createdAt : 0;

    const history: Array<{
      _id: string;
      version: number;
      status: string;
      createdAt: number;
    }> = [
      {
        _id: template._id as string,
        version: templateVersion,
        status: templateStatus,
        createdAt: templateCreatedAt,
      },
    ];

    // Walk back through previous versions
    let currentId: Id<"swmsTemplates"> | undefined = template.previousVersionId as
      | Id<"swmsTemplates">
      | undefined;
    while (currentId) {
      const prev = await ctx.db.get(currentId);
      if (!prev) break;
      const prevVersion = typeof prev.version === "number" ? prev.version : 1;
      const prevStatus = typeof prev.status === "string" ? prev.status : "draft";
      const prevCreatedAt =
        typeof prev.createdAt === "number" ? prev.createdAt : 0;
      history.push({
        _id: prev._id as string,
        version: prevVersion,
        status: prevStatus,
        createdAt: prevCreatedAt,
      });
      currentId = prev.previousVersionId as Id<"swmsTemplates"> | undefined;
    }

    return history;
  },
});
