import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation, throwConflict } from "./lib/errors";
import { now } from "./lib/time";

// List all incident template assignments for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("incidentTemplateAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Enrich with template data
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const templateId = assignment.incidentTemplateId as Id<"incidentTemplates">;
        const template = templateId ? await ctx.db.get(templateId) : null;
        return {
          ...assignment,
          template: template
            ? {
                _id: template._id,
                name: template.name,
                incidentType: template.incidentType,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// List enabled incident templates for a project
export const listEnabled = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("incidentTemplateAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect();

    // Enrich with template data
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const templateId = assignment.incidentTemplateId as Id<"incidentTemplates">;
        const template = templateId ? await ctx.db.get(templateId) : null;
        return {
          ...assignment,
          template: template
            ? {
                _id: template._id,
                name: template.name,
                incidentType: template.incidentType,
                checklistTemplateId: template.checklistTemplateId,
              }
            : null,
        };
      })
    );

    return enriched.filter((e) => e.template !== null);
  },
});

// Get default template for a project
export const getDefault = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("incidentTemplateAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(q.eq(q.field("isEnabled"), true), q.eq(q.field("isDefault"), true))
      )
      .first();

    if (!assignment) {
      return null;
    }

    const templateId = assignment.incidentTemplateId as Id<"incidentTemplates">;
    const template = templateId ? await ctx.db.get(templateId) : null;

    return template
      ? {
          ...assignment,
          template: {
            _id: template._id,
            name: template.name,
            incidentType: template.incidentType,
          },
        }
      : null;
  },
});

// Enable an incident template for a project
export const enable = mutation({
  args: {
    incidentTemplateId: v.id("incidentTemplates"),
    projectId: v.id("projects"),
    assignedBy: v.id("workers"),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify template exists
    const template = await ctx.db.get(args.incidentTemplateId);
    if (!template) {
      throwNotFound("IncidentTemplate", args.incidentTemplateId);
    }

    if (!template.isActive) {
      throwValidation("Cannot enable an inactive incident template");
    }

    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound("Project", args.projectId);
    }

    // Verify assigner exists
    const assigner = await ctx.db.get(args.assignedBy);
    if (!assigner) {
      throwNotFound("Worker (assigner)", args.assignedBy);
    }

    // Check for existing assignment
    const existing = await ctx.db
      .query("incidentTemplateAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.eq(q.field("incidentTemplateId"), args.incidentTemplateId)
      )
      .first();

    if (existing) {
      if (existing.isEnabled) {
        throwConflict("Incident template is already enabled for this project");
      }
      // Re-enable existing assignment
      const existingId = existing._id as Id<"incidentTemplateAssignments">;
      await ctx.db.patch(existingId, {
        isEnabled: true,
        isDefault: args.isDefault ?? false,
        assignedBy: args.assignedBy,
        assignedAt: now(),
      });
      return existingId;
    }

    // If setting as default, clear other defaults
    if (args.isDefault) {
      const currentDefault = await ctx.db
        .query("incidentTemplateAssignments")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .filter((q) => q.eq(q.field("isDefault"), true))
        .first();

      if (currentDefault) {
        const currentId = currentDefault._id as Id<"incidentTemplateAssignments">;
        await ctx.db.patch(currentId, { isDefault: false });
      }
    }

    // Create new assignment
    return await ctx.db.insert("incidentTemplateAssignments", {
      incidentTemplateId: args.incidentTemplateId,
      projectId: args.projectId,
      isEnabled: true,
      isDefault: args.isDefault ?? false,
      assignedBy: args.assignedBy,
      assignedAt: now(),
    });
  },
});

// Disable an incident template for a project
export const disable = mutation({
  args: {
    incidentTemplateId: v.id("incidentTemplates"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("incidentTemplateAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.eq(q.field("incidentTemplateId"), args.incidentTemplateId)
      )
      .first();

    if (!assignment) {
      throwNotFound(
        "IncidentTemplateAssignment",
        `template: ${args.incidentTemplateId}, project: ${args.projectId}`
      );
    }

    if (!assignment.isEnabled) {
      throwValidation("Incident template is already disabled for this project");
    }

    const assignmentId = assignment._id as Id<"incidentTemplateAssignments">;
    await ctx.db.patch(assignmentId, {
      isEnabled: false,
      isDefault: false,
    });

    return assignmentId;
  },
});

// Set default template for a project
export const setDefault = mutation({
  args: {
    incidentTemplateId: v.id("incidentTemplates"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("incidentTemplateAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.eq(q.field("incidentTemplateId"), args.incidentTemplateId)
      )
      .first();

    if (!assignment || !assignment.isEnabled) {
      throwValidation(
        "Incident template must be enabled before setting as default"
      );
    }

    // Clear other defaults
    const allAssignments = await ctx.db
      .query("incidentTemplateAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const a of allAssignments) {
      if (a.isDefault) {
        const aId = a._id as Id<"incidentTemplateAssignments">;
        await ctx.db.patch(aId, { isDefault: false });
      }
    }

    const assignmentId = assignment._id as Id<"incidentTemplateAssignments">;
    await ctx.db.patch(assignmentId, { isDefault: true });

    return assignmentId;
  },
});
