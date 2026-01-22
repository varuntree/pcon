import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation, throwConflict } from "./lib/errors";
import { now } from "./lib/time";

// List all permit type assignments for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("permitTypeAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Enrich with permit type data
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const permitTypeId = assignment.permitTypeId as Id<"permitTypes">;
        const permitType = permitTypeId
          ? await ctx.db.get(permitTypeId)
          : null;
        return {
          ...assignment,
          permitType: permitType
            ? {
                _id: permitType._id,
                name: permitType.name,
                code: permitType.code,
                riskLevel: permitType.riskLevel,
                defaultValidityHours: permitType.defaultValidityHours,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// List enabled permit types for a project
export const listEnabled = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("permitTypeAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect();

    // Enrich with permit type data
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const permitTypeId = assignment.permitTypeId as Id<"permitTypes">;
        const permitType = permitTypeId
          ? await ctx.db.get(permitTypeId)
          : null;
        return {
          ...assignment,
          permitType: permitType
            ? {
                _id: permitType._id,
                name: permitType.name,
                code: permitType.code,
                riskLevel: permitType.riskLevel,
                defaultValidityHours: permitType.defaultValidityHours,
                requiredFields: permitType.requiredFields,
              }
            : null,
        };
      })
    );

    // Filter out any with null permit types
    return enriched.filter((e) => e.permitType !== null);
  },
});

// Check if a permit type is enabled for a project
export const isEnabled = query({
  args: {
    permitTypeId: v.id("permitTypes"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("permitTypeAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("permitTypeId"), args.permitTypeId))
      .first();

    return assignment?.isEnabled === true;
  },
});

// Enable a permit type for a project
export const enable = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    projectId: v.id("projects"),
    enabledBy: v.id("workers"),
    defaultApproverId: v.optional(v.id("workers")),
  },
  handler: async (ctx, args) => {
    // Verify permit type exists
    const permitType = await ctx.db.get(args.permitTypeId);
    if (!permitType) {
      throwNotFound("PermitType", args.permitTypeId);
    }

    if (!permitType.isActive) {
      throwValidation("Cannot enable an inactive permit type");
    }

    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound("Project", args.projectId);
    }

    // Verify enabler exists
    const enabler = await ctx.db.get(args.enabledBy);
    if (!enabler) {
      throwNotFound("Worker (enabler)", args.enabledBy);
    }

    // Verify default approver exists if provided
    if (args.defaultApproverId) {
      const approver = await ctx.db.get(args.defaultApproverId);
      if (!approver) {
        throwNotFound("Worker (defaultApprover)", args.defaultApproverId);
      }
    }

    // Check for existing assignment
    const existing = await ctx.db
      .query("permitTypeAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("permitTypeId"), args.permitTypeId))
      .first();

    if (existing) {
      if (existing.isEnabled) {
        throwConflict("Permit type is already enabled for this project");
      }
      // Re-enable existing assignment
      const existingId = existing._id as Id<"permitTypeAssignments">;
      await ctx.db.patch(existingId, {
        isEnabled: true,
        enabledBy: args.enabledBy,
        enabledAt: now(),
        defaultApproverId: args.defaultApproverId,
      });
      return existingId;
    }

    // Create new assignment
    const insertData: Parameters<
      typeof ctx.db.insert<"permitTypeAssignments">
    >[1] = {
      permitTypeId: args.permitTypeId,
      projectId: args.projectId,
      enabledBy: args.enabledBy,
      enabledAt: now(),
      isEnabled: true,
    };

    if (args.defaultApproverId !== undefined) {
      insertData.defaultApproverId = args.defaultApproverId;
    }

    return await ctx.db.insert("permitTypeAssignments", insertData);
  },
});

// Disable a permit type for a project
export const disable = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("permitTypeAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("permitTypeId"), args.permitTypeId))
      .first();

    if (!assignment) {
      throwNotFound(
        "PermitTypeAssignment",
        `permitType: ${args.permitTypeId}, project: ${args.projectId}`
      );
    }

    if (!assignment.isEnabled) {
      throwValidation("Permit type is already disabled for this project");
    }

    const assignmentId = assignment._id as Id<"permitTypeAssignments">;
    await ctx.db.patch(assignmentId, {
      isEnabled: false,
    });

    return assignmentId;
  },
});

// Update default approver for a permit type assignment
export const updateDefaultApprover = mutation({
  args: {
    permitTypeId: v.id("permitTypes"),
    projectId: v.id("projects"),
    defaultApproverId: v.optional(v.id("workers")),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("permitTypeAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("permitTypeId"), args.permitTypeId))
      .first();

    if (!assignment) {
      throwNotFound(
        "PermitTypeAssignment",
        `permitType: ${args.permitTypeId}, project: ${args.projectId}`
      );
    }

    // Verify default approver exists if provided
    if (args.defaultApproverId) {
      const approver = await ctx.db.get(args.defaultApproverId);
      if (!approver) {
        throwNotFound("Worker (defaultApprover)", args.defaultApproverId);
      }
    }

    const assignmentId = assignment._id as Id<"permitTypeAssignments">;
    await ctx.db.patch(assignmentId, {
      defaultApproverId: args.defaultApproverId,
    });

    return assignmentId;
  },
});
