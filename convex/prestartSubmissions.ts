import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { now } from "./lib/time";

// List prestart submissions by asset, sorted by performedAt desc
export const listByAsset = query({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("prestartSubmissions")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();

    // Sort by performedAt descending
    return submissions.sort(
      (a, b) => (b.performedAt as number) - (a.performedAt as number)
    );
  },
});

// List prestart submissions by project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prestartSubmissions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List prestart submissions by project and date range
export const listByProjectDate = query({
  args: {
    projectId: v.id("projects"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("prestartSubmissions")
      .withIndex("by_project_date", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Filter by date range
    return submissions.filter((s) => {
      const performedAt = s.performedAt as number;
      return performedAt >= args.startDate && performedAt <= args.endDate;
    });
  },
});

// List recent prestart submissions for an asset
export const listRecent = query({
  args: {
    assetId: v.id("assets"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const submissions = await ctx.db
      .query("prestartSubmissions")
      .withIndex("by_asset", (q) => q.eq("assetId", args.assetId))
      .collect();

    // Sort by performedAt descending and take limit
    return submissions
      .sort((a, b) => (b.performedAt as number) - (a.performedAt as number))
      .slice(0, limit);
  },
});

// List prestart submissions by performer
export const listByPerformer = query({
  args: { performedByWorkerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prestartSubmissions")
      .withIndex("by_performer", (q) =>
        q.eq("performedByWorkerId", args.performedByWorkerId)
      )
      .collect();
  },
});

// Get a single prestart submission
export const get = query({
  args: { id: v.id("prestartSubmissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throwNotFound("PrestartSubmission", args.id);
    }
    return submission;
  },
});

// Submit a prestart check
export const submit = mutation({
  args: {
    assetId: v.id("assets"),
    projectId: v.id("projects"),
    templateId: v.optional(v.string()),
    checklistInstanceId: v.optional(v.id("checklistInstances")),
    performedByWorkerId: v.id("workers"),
    responses: v.optional(v.any()),
    photoIds: v.optional(v.array(v.id("_storage"))),
    odometerKm: v.optional(v.number()),
    odometerHours: v.optional(v.number()),
    passed: v.boolean(),
    issues: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verify asset exists
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throwNotFound("Asset", args.assetId);
    }

    // Verify project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound("Project", args.projectId);
    }

    // Verify performer exists
    const performer = await ctx.db.get(args.performedByWorkerId);
    if (!performer) {
      throwNotFound("Worker (performer)", args.performedByWorkerId);
    }

    // Verify checklist instance if provided
    if (args.checklistInstanceId) {
      const checklistInstance = await ctx.db.get(args.checklistInstanceId);
      if (!checklistInstance) {
        throwNotFound("ChecklistInstance", args.checklistInstanceId);
      }
    }

    // Validate odometer values - must be >= previous values
    if (args.odometerKm !== undefined) {
      const currentKm = (asset.odometerKm as number | undefined) ?? 0;
      if (args.odometerKm < currentKm) {
        throwValidation(
          `Odometer (km) cannot decrease: current ${currentKm}, submitted ${args.odometerKm}`
        );
      }
    }

    if (args.odometerHours !== undefined) {
      const currentHours = (asset.odometerHours as number | undefined) ?? 0;
      if (args.odometerHours < currentHours) {
        throwValidation(
          `Odometer (hours) cannot decrease: current ${currentHours}, submitted ${args.odometerHours}`
        );
      }
    }

    const timestamp = now();
    const linkedDefectIds: Id<"defects">[] = [];

    // If failed, auto-create defects for each issue
    if (!args.passed && args.issues && args.issues.length > 0) {
      // Get org from asset
      const orgId = asset.orgId as Id<"orgs">;

      // Generate defect numbers
      const existingDefects = await ctx.db
        .query("defects")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
      let nextDefectNum = existingDefects.length + 1;

      for (const issue of args.issues) {
        const defectNumber = `DEFECT-${String(nextDefectNum).padStart(3, "0")}`;

        const defectId = await ctx.db.insert("defects", {
          orgId,
          projectId: args.projectId,
          defectNumber,
          title: `Prestart: ${issue}`,
          description: `Auto-generated from failed prestart check on asset ${asset.name} (${asset.itemId})`,
          category: "safety",
          priority: "high",
          status: "open",
          sourceType: "asset",
          sourceId: args.assetId,
          assetId: args.assetId,
          createdBy: args.performedByWorkerId,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        linkedDefectIds.push(defectId);
        nextDefectNum++;
      }

      // Update asset status to maintenance
      await ctx.db.patch(args.assetId, {
        status: "maintenance",
        updatedAt: timestamp,
      });
    } else if (args.passed) {
      // Update asset status to available and update lastPrestartAt
      await ctx.db.patch(args.assetId, {
        status: "available",
        lastPrestartAt: timestamp,
        updatedAt: timestamp,
        ...(args.odometerKm !== undefined && { odometerKm: args.odometerKm }),
        ...(args.odometerHours !== undefined && {
          odometerHours: args.odometerHours,
        }),
      });
    }

    // Update odometer on failed prestart if provided
    if (
      !args.passed &&
      (args.odometerKm !== undefined || args.odometerHours !== undefined)
    ) {
      await ctx.db.patch(args.assetId, {
        updatedAt: timestamp,
        ...(args.odometerKm !== undefined && { odometerKm: args.odometerKm }),
        ...(args.odometerHours !== undefined && {
          odometerHours: args.odometerHours,
        }),
      });
    }

    // Create submission
    const insertData: Parameters<
      typeof ctx.db.insert<"prestartSubmissions">
    >[1] = {
      assetId: args.assetId,
      projectId: args.projectId,
      performedByWorkerId: args.performedByWorkerId,
      performedAt: timestamp,
      passed: args.passed,
      createdAt: timestamp,
    };

    if (args.templateId !== undefined) {
      insertData.templateId = args.templateId;
    }
    if (args.checklistInstanceId !== undefined) {
      insertData.checklistInstanceId = args.checklistInstanceId;
    }
    if (args.responses !== undefined) {
      insertData.responses = args.responses;
    }
    if (args.photoIds !== undefined) {
      insertData.photoIds = args.photoIds;
    }
    if (args.odometerKm !== undefined) {
      insertData.odometerKm = args.odometerKm;
    }
    if (args.odometerHours !== undefined) {
      insertData.odometerHours = args.odometerHours;
    }
    if (args.issues !== undefined) {
      insertData.issues = args.issues;
    }
    if (linkedDefectIds.length > 0) {
      insertData.linkedDefectIds = linkedDefectIds;
    }

    return await ctx.db.insert("prestartSubmissions", insertData);
  },
});

// Link a defect to a prestart submission
export const linkDefect = mutation({
  args: {
    id: v.id("prestartSubmissions"),
    defectId: v.id("defects"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throwNotFound("PrestartSubmission", args.id);
    }

    // Verify defect exists
    const defect = await ctx.db.get(args.defectId);
    if (!defect) {
      throwNotFound("Defect", args.defectId);
    }

    const linkedDefectIds = (submission.linkedDefectIds ||
      []) as Id<"defects">[];

    // Avoid duplicates
    if (linkedDefectIds.includes(args.defectId)) {
      return args.id;
    }

    await ctx.db.patch(args.id, {
      linkedDefectIds: [...linkedDefectIds, args.defectId],
    });

    return args.id;
  },
});

// Link an action to a prestart submission
export const linkAction = mutation({
  args: {
    id: v.id("prestartSubmissions"),
    actionId: v.id("actionItems"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throwNotFound("PrestartSubmission", args.id);
    }

    // Verify action exists
    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throwNotFound("ActionItem", args.actionId);
    }

    const linkedActionIds = (submission.linkedActionIds ||
      []) as Id<"actionItems">[];

    // Avoid duplicates
    if (linkedActionIds.includes(args.actionId)) {
      return args.id;
    }

    await ctx.db.patch(args.id, {
      linkedActionIds: [...linkedActionIds, args.actionId],
    });

    return args.id;
  },
});
