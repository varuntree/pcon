import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const checklistInstanceStatus = v.union(
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

const checklistSourceType = v.union(
  v.literal("asset"),
  v.literal("itp"),
  v.literal("incident"),
  v.literal("defect"),
  v.literal("manual")
);

// List all checklist instances for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checklistInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List checklist instances by status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: checklistInstanceStatus,
  },
  handler: async (ctx, args) => {
    const instances = await ctx.db
      .query("checklistInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return instances.filter((i) => i.status === args.status);
  },
});

// List checklist instances by assignee
export const listByAssignee = query({
  args: { assignedTo: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checklistInstances")
      .withIndex("by_assignee", (q) => q.eq("assignedTo", args.assignedTo))
      .collect();
  },
});

// List checklist instances by template
export const listByTemplate = query({
  args: { checklistTemplateId: v.id("checklistTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("checklistInstances")
      .withIndex("by_template", (q) =>
        q.eq("checklistTemplateId", args.checklistTemplateId)
      )
      .collect();
  },
});

// List checklist instances by source
export const listBySource = query({
  args: {
    sourceType: checklistSourceType,
    sourceId: v.string(),
  },
  handler: async (ctx, args) => {
    const instances = await ctx.db
      .query("checklistInstances")
      .filter((q) => q.eq(q.field("sourceType"), args.sourceType))
      .collect();
    return instances.filter((i) => i.sourceId === args.sourceId);
  },
});

// Get a single checklist instance
export const get = query({
  args: { id: v.id("checklistInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.id);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.id);
    }
    return instance;
  },
});

// Get checklist instance with template data
export const getWithDetails = query({
  args: { id: v.id("checklistInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.id);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.id);
    }

    const template = await ctx.db.get(instance.checklistTemplateId as Id<"checklistTemplates">);
    const assignee = instance.assignedTo
      ? await ctx.db.get(instance.assignedTo as Id<"workers">)
      : null;
    const performer = instance.performedByWorkerId
      ? await ctx.db.get(instance.performedByWorkerId as Id<"workers">)
      : null;

    return {
      ...instance,
      template: template
        ? {
            _id: template._id,
            name: template.name,
            description: template.description,
            sections: template.sections,
            scoringEnabled: template.scoringEnabled,
            passingScore: template.passingScore,
          }
        : null,
      assignee: assignee
        ? {
            _id: assignee._id,
            fullName: assignee.fullName,
            email: assignee.email,
          }
        : null,
      performer: performer
        ? {
            _id: performer._id,
            fullName: performer.fullName,
            email: performer.email,
          }
        : null,
    };
  },
});

// Create a new checklist instance
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    checklistTemplateId: v.id("checklistTemplates"),
    assignedTo: v.optional(v.id("workers")),
    dueDate: v.optional(v.number()),
    sourceType: v.optional(checklistSourceType),
    sourceId: v.optional(v.string()),
    plantRegisterId: v.optional(v.id("assetRegisters")),
    plantAssetId: v.optional(v.id("assets")),
    plantBookingId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Verify project exists and belongs to org
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound("Project", args.projectId);
    }
    if (project.orgId !== args.orgId) {
      throwValidation("Project does not belong to this organization");
    }

    // Verify template exists
    const template = await ctx.db.get(args.checklistTemplateId);
    if (!template) {
      throwNotFound("ChecklistTemplate", args.checklistTemplateId);
    }
    if (!template.isActive) {
      throwValidation("Cannot create instance from inactive template");
    }

    // Verify assignee exists if provided
    if (args.assignedTo) {
      const assignee = await ctx.db.get(args.assignedTo);
      if (!assignee) {
        throwNotFound("Worker (assignee)", args.assignedTo);
      }
    }

    // Generate instance number
    const existing = await ctx.db
      .query("checklistInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNum = existing.length + 1;
    const instanceNumber = `CHK-${String(nextNum).padStart(3, "0")}`;

    const insertData: Parameters<
      typeof ctx.db.insert<"checklistInstances">
    >[1] = {
      orgId: args.orgId,
      projectId: args.projectId,
      checklistTemplateId: args.checklistTemplateId,
      instanceNumber,
      status: "in_progress",
      ...timestamps(),
    };

    if (args.assignedTo !== undefined) {
      insertData.assignedTo = args.assignedTo;
    }
    if (args.dueDate !== undefined) {
      insertData.dueDate = args.dueDate;
    }
    if (args.sourceType !== undefined) {
      insertData.sourceType = args.sourceType;
    }
    if (args.sourceId !== undefined) {
      insertData.sourceId = args.sourceId;
    }
    if (args.plantRegisterId !== undefined) {
      insertData.plantRegisterId = args.plantRegisterId;
    }
    if (args.plantAssetId !== undefined) {
      insertData.plantAssetId = args.plantAssetId;
    }
    if (args.plantBookingId !== undefined) {
      insertData.plantBookingId = args.plantBookingId;
    }

    return await ctx.db.insert("checklistInstances", insertData);
  },
});

// Save a single field response
export const saveResponse = mutation({
  args: {
    instanceId: v.id("checklistInstances"),
    fieldId: v.string(),
    value: v.any(),
    notes: v.optional(v.string()),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.instanceId);
    }

    if (instance.status === "completed") {
      throwValidation("Cannot modify a completed checklist");
    }
    if (instance.status === "cancelled") {
      throwValidation("Cannot modify a cancelled checklist");
    }

    // Get current responses or init empty object
    const responses = (instance.responses as Record<string, unknown>) || {};

    // Update the response for this field
    responses[args.fieldId] = {
      value: args.value,
      notes: args.notes,
      attachmentIds: args.attachmentIds,
      updatedAt: now(),
    };

    await ctx.db.patch(args.instanceId, {
      responses: responses as Record<string, unknown> as Parameters<typeof ctx.db.patch<"checklistInstances">>[1]["responses"],
      ...updatedAt(),
    });

    return args.instanceId;
  },
});

// Batch save all responses
export const saveAllResponses = mutation({
  args: {
    instanceId: v.id("checklistInstances"),
    responses: v.any(), // Object keyed by fieldId
    performedByWorkerId: v.optional(v.id("workers")),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.instanceId);
    }

    if (instance.status === "completed") {
      throwValidation("Cannot modify a completed checklist");
    }
    if (instance.status === "cancelled") {
      throwValidation("Cannot modify a cancelled checklist");
    }

    // Verify performer if provided
    if (args.performedByWorkerId) {
      const performer = await ctx.db.get(args.performedByWorkerId);
      if (!performer) {
        throwNotFound("Worker (performer)", args.performedByWorkerId);
      }
    }

    const patchData: Partial<Doc<"checklistInstances">> = {
      responses: args.responses,
      status: "in_progress",
      ...updatedAt(),
    };

    if (args.performedByWorkerId) {
      patchData.performedByWorkerId = args.performedByWorkerId;
      patchData.performedAt = now();
    }

    await ctx.db.patch(args.instanceId, patchData);

    return args.instanceId;
  },
});

// Complete a checklist instance
export const complete = mutation({
  args: {
    instanceId: v.id("checklistInstances"),
    performedByWorkerId: v.optional(v.id("workers")),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.instanceId);
    }

    if (instance.status === "completed") {
      throwValidation("Checklist is already completed");
    }
    if (instance.status === "cancelled") {
      throwValidation("Cannot complete a cancelled checklist");
    }

    // Get template to validate required fields
    const template = await ctx.db.get(instance.checklistTemplateId as Id<"checklistTemplates">);
    if (!template) {
      throwNotFound("ChecklistTemplate", instance.checklistTemplateId as string);
    }

    // Validate required fields
    const responses = (instance.responses as Record<string, unknown>) || {};
    const missingFields: string[] = [];

    type Section = { id: string; title: string; order: number; fields: Array<{ id: string; type: string; label: string; required: boolean }> };
    const sections = (template.sections || []) as Section[];

    for (const section of sections) {
      for (const field of section.fields) {
        if (field.required && field.type !== "instruction") {
          const response = responses[field.id] as
            | { value: unknown }
            | undefined;
          if (
            !response ||
            response.value === undefined ||
            response.value === null ||
            response.value === ""
          ) {
            missingFields.push(field.label);
          }
        }
      }
    }

    if (missingFields.length > 0) {
      throwValidation(
        `Missing required fields: ${missingFields.slice(0, 5).join(", ")}${missingFields.length > 5 ? ` and ${missingFields.length - 5} more` : ""}`
      );
    }

    // Calculate score if scoring enabled
    let score: number | undefined;
    let passed: boolean | undefined;

    if (template.scoringEnabled) {
      let totalPoints = 0;
      let earnedPoints = 0;

      for (const section of sections) {
        for (const field of section.fields) {
          if (field.type === "yesno" || field.type === "checkbox") {
            totalPoints++;
            const response = responses[field.id] as
              | { value: boolean }
              | undefined;
            if (response?.value === true) {
              earnedPoints++;
            }
          }
        }
      }

      if (totalPoints > 0) {
        score = Math.round((earnedPoints / totalPoints) * 100);
        const passingScore = template.passingScore as number | undefined;
        passed = passingScore
          ? score >= passingScore
          : score >= 80;
      }
    }

    // Verify performer if provided
    if (args.performedByWorkerId) {
      const performer = await ctx.db.get(args.performedByWorkerId);
      if (!performer) {
        throwNotFound("Worker (performer)", args.performedByWorkerId);
      }
    }

    const patchData: Partial<Doc<"checklistInstances">> = {
      status: "completed",
      completedAt: now(),
      ...updatedAt(),
    };

    if (args.performedByWorkerId) {
      patchData.performedByWorkerId = args.performedByWorkerId;
      if (!instance.performedAt) {
        patchData.performedAt = now();
      }
    }

    if (score !== undefined) {
      patchData.score = score;
    }
    if (passed !== undefined) {
      patchData.passed = passed;
    }

    await ctx.db.patch(args.instanceId, patchData);

    return args.instanceId;
  },
});

// Cancel a checklist instance
export const cancel = mutation({
  args: { instanceId: v.id("checklistInstances") },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.instanceId);
    }

    if (instance.status === "completed") {
      throwValidation("Cannot cancel a completed checklist");
    }
    if (instance.status === "cancelled") {
      throwValidation("Checklist is already cancelled");
    }

    await ctx.db.patch(args.instanceId, {
      status: "cancelled",
      ...updatedAt(),
    });

    return args.instanceId;
  },
});

// Link a defect to a checklist instance
export const linkDefect = mutation({
  args: {
    instanceId: v.id("checklistInstances"),
    defectId: v.id("defects"),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.instanceId);
    }

    // Verify defect exists
    const defect = await ctx.db.get(args.defectId);
    if (!defect) {
      throwNotFound("Defect", args.defectId);
    }

    const linkedDefectIds = (instance.linkedDefectIds || []) as Id<"defects">[];

    // Avoid duplicates
    if (linkedDefectIds.includes(args.defectId)) {
      return args.instanceId;
    }

    await ctx.db.patch(args.instanceId, {
      linkedDefectIds: [...linkedDefectIds, args.defectId],
      ...updatedAt(),
    });

    return args.instanceId;
  },
});

// Link an action to a checklist instance
export const linkAction = mutation({
  args: {
    instanceId: v.id("checklistInstances"),
    actionId: v.id("actionItems"),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) {
      throwNotFound("ChecklistInstance", args.instanceId);
    }

    // Verify action exists
    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throwNotFound("ActionItem", args.actionId);
    }

    const linkedActionIds = (instance.linkedActionIds || []) as Id<"actionItems">[];

    // Avoid duplicates
    if (linkedActionIds.includes(args.actionId)) {
      return args.instanceId;
    }

    await ctx.db.patch(args.instanceId, {
      linkedActionIds: [...linkedActionIds, args.actionId],
      ...updatedAt(),
    });

    return args.instanceId;
  },
});
