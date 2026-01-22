import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt } from "./lib/time";

// Field type validator (matches schema)
const checklistFieldType = v.union(
  v.literal("text"),
  v.literal("textarea"),
  v.literal("number"),
  v.literal("date"),
  v.literal("time"),
  v.literal("datetime"),
  v.literal("yesno"),
  v.literal("checkbox"),
  v.literal("select"),
  v.literal("multiselect"),
  v.literal("photo"),
  v.literal("signature"),
  v.literal("attachment"),
  v.literal("instruction"),
  v.literal("notes"),
  v.literal("action_trigger")
);

// Field validator
const fieldValidator = v.object({
  id: v.string(),
  type: checklistFieldType,
  label: v.string(),
  required: v.boolean(),
  order: v.number(),
  helpText: v.optional(v.string()),
  // For select/multiselect
  options: v.optional(v.array(v.string())),
  // For number
  min: v.optional(v.number()),
  max: v.optional(v.number()),
  // For textarea
  rows: v.optional(v.number()),
  placeholder: v.optional(v.string()),
  maxLength: v.optional(v.number()),
  // For photo
  maxPhotos: v.optional(v.number()),
  // For signature
  signatureConfig: v.optional(
    v.object({
      label: v.string(),
      role: v.string(),
      required: v.boolean(),
    })
  ),
  // For action_trigger
  actionTrigger: v.optional(
    v.object({
      triggerWhen: v.string(),
      actionTitle: v.string(),
      actionPriority: v.string(),
    })
  ),
  // Conditional logic
  conditions: v.optional(
    v.array(
      v.object({
        triggerFieldId: v.string(),
        operator: v.literal("equals"),
        value: v.any(),
        action: v.union(v.literal("show"), v.literal("hide")),
      })
    )
  ),
});

// Section validator
const sectionValidator = v.object({
  id: v.string(),
  title: v.string(),
  order: v.number(),
  fields: v.array(fieldValidator),
});

// List all templates for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checklistTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List active templates for an org
export const listActive = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checklistTemplates")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// List templates by project (project-level templates)
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checklistTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get a single template
export const get = query({
  args: { id: v.id("checklistTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("ChecklistTemplate", args.id);
    }
    return template;
  },
});

// Create a new template
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")),
    name: v.string(),
    description: v.optional(v.string()),
    scope: v.optional(v.string()),
    sections: v.array(sectionValidator),
    isActive: v.optional(v.boolean()),
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
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker", args.createdBy);
    }

    const insertData: Parameters<
      typeof ctx.db.insert<"checklistTemplates">
    >[1] = {
      orgId: args.orgId,
      name: args.name,
      sections: args.sections,
      isActive: args.isActive ?? true,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.projectId !== undefined) {
      insertData.projectId = args.projectId;
    }

    if (args.description !== undefined) {
      insertData.description = args.description;
    }

    if (args.scope !== undefined) {
      insertData.scope = args.scope;
    }

    return await ctx.db.insert("checklistTemplates", insertData);
  },
});

// Update a template
export const update = mutation({
  args: {
    id: v.id("checklistTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    scope: v.optional(v.string()),
    sections: v.optional(v.array(sectionValidator)),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const template = await ctx.db.get(id);
    if (!template) {
      throwNotFound("ChecklistTemplate", id);
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return id;
    }

    await ctx.db.patch(id, {
      ...filteredUpdates,
      ...updatedAt(),
    });

    return id;
  },
});

// Activate a template
export const activate = mutation({
  args: { id: v.id("checklistTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("ChecklistTemplate", args.id);
    }

    if (template.isActive) {
      return args.id; // Already active
    }

    await ctx.db.patch(args.id, {
      isActive: true,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Deactivate a template
export const deactivate = mutation({
  args: { id: v.id("checklistTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("ChecklistTemplate", args.id);
    }

    if (!template.isActive) {
      return args.id; // Already inactive
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Clone a template with new name
export const clone = mutation({
  args: {
    id: v.id("checklistTemplates"),
    name: v.string(),
    createdBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template) {
      throwNotFound("ChecklistTemplate", args.id);
    }

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker", args.createdBy);
    }

    const templateSections = Array.isArray(template.sections)
      ? template.sections
      : [];

    const insertData: Parameters<
      typeof ctx.db.insert<"checklistTemplates">
    >[1] = {
      orgId: template.orgId,
      name: args.name,
      sections: templateSections as Parameters<
        typeof ctx.db.insert<"checklistTemplates">
      >[1]["sections"],
      isActive: true,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (template.projectId !== undefined) {
      insertData.projectId = template.projectId;
    }

    if (
      template.description !== undefined &&
      typeof template.description === "string"
    ) {
      insertData.description = template.description;
    }

    if (template.scope !== undefined && typeof template.scope === "string") {
      insertData.scope = template.scope;
    }

    return await ctx.db.insert("checklistTemplates", insertData);
  },
});
