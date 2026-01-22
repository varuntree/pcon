import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const incidentType = v.union(
  v.literal("injury"),
  v.literal("near_miss"),
  v.literal("property_damage"),
  v.literal("environmental"),
  v.literal("other")
);

const incidentSeverity = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

const incidentStatus = v.union(
  v.literal("open"),
  v.literal("under_investigation"),
  v.literal("closed")
);

const witnessValidator = v.object({
  name: v.string(),
  contact: v.optional(v.string()),
});

const injuryDetailsValidator = v.object({
  natureOfInjury: v.optional(v.string()),
  bodyLocation: v.optional(v.string()),
  treatmentRequired: v.optional(v.boolean()),
});

// List all incidents for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentReports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List incidents by status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: incidentStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentReports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// List incidents by type
export const listByType = query({
  args: {
    projectId: v.id("projects"),
    incidentType: incidentType,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentReports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("incidentType"), args.incidentType))
      .collect();
  },
});

// List incidents by severity
export const listBySeverity = query({
  args: {
    projectId: v.id("projects"),
    severity: incidentSeverity,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentReports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("severity"), args.severity))
      .collect();
  },
});

// List incidents by reporter
export const listByReporter = query({
  args: { reportedBy: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidentReports")
      .withIndex("by_reporter", (q) => q.eq("reportedBy", args.reportedBy))
      .collect();
  },
});

// Get a single incident
export const get = query({
  args: { id: v.id("incidentReports") },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throwNotFound("IncidentReport", args.id);
    }
    return incident;
  },
});

// Get incident with enriched data
export const getWithDetails = query({
  args: { id: v.id("incidentReports") },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throwNotFound("IncidentReport", args.id);
    }

    const reporterId = incident.reportedBy as Id<"workers">;
    const workerId = incident.workerId as Id<"workers"> | undefined;
    const investigatorId = incident.investigatorId as Id<"workers"> | undefined;

    const reporter = reporterId ? await ctx.db.get(reporterId) : null;
    const worker = workerId ? await ctx.db.get(workerId) : null;
    const investigator = investigatorId
      ? await ctx.db.get(investigatorId)
      : null;

    return {
      ...incident,
      reporter: reporter
        ? {
            _id: reporter._id,
            fullName: reporter.fullName,
            email: reporter.email,
          }
        : null,
      affectedWorker: worker
        ? {
            _id: worker._id,
            fullName: worker.fullName,
          }
        : null,
      investigator: investigator
        ? {
            _id: investigator._id,
            fullName: investigator.fullName,
          }
        : null,
    };
  },
});

// Create a new incident report
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    incidentType: incidentType,
    severity: incidentSeverity,
    description: v.string(),
    location: v.string(),
    date: v.number(),
    reportedBy: v.id("workers"),
    workerId: v.optional(v.id("workers")),
    witnesses: v.optional(v.array(witnessValidator)),
    injuryDetails: v.optional(injuryDetailsValidator),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
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

    // Verify reporter exists
    const reporter = await ctx.db.get(args.reportedBy);
    if (!reporter) {
      throwNotFound("Worker (reporter)", args.reportedBy);
    }

    // Verify affected worker exists if provided
    if (args.workerId) {
      const worker = await ctx.db.get(args.workerId);
      if (!worker) {
        throwNotFound("Worker (affected)", args.workerId);
      }
    }

    // Generate incident number
    const existing = await ctx.db
      .query("incidentReports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNum = existing.length + 1;
    const incidentNumber = `INC-${String(nextNum).padStart(3, "0")}`;

    const insertData: Parameters<typeof ctx.db.insert<"incidentReports">>[1] = {
      orgId: args.orgId,
      projectId: args.projectId,
      incidentNumber,
      incidentType: args.incidentType,
      severity: args.severity,
      status: "open",
      description: args.description,
      location: args.location,
      date: args.date,
      reportedBy: args.reportedBy,
      reportedAt: now(),
      ...timestamps(),
    };

    if (args.workerId !== undefined) {
      insertData.workerId = args.workerId;
    }
    if (args.witnesses !== undefined) {
      insertData.witnesses = args.witnesses;
    }
    if (args.injuryDetails !== undefined) {
      insertData.injuryDetails = args.injuryDetails;
    }
    if (args.attachmentIds !== undefined) {
      insertData.attachmentIds = args.attachmentIds;
    }

    return await ctx.db.insert("incidentReports", insertData);
  },
});

// Assign investigator (open -> under_investigation)
export const assignInvestigator = mutation({
  args: {
    id: v.id("incidentReports"),
    investigatorId: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throwNotFound("IncidentReport", args.id);
    }

    if (incident.status === "closed") {
      throwValidation("Cannot assign investigator to a closed incident");
    }

    // Verify investigator exists
    const investigator = await ctx.db.get(args.investigatorId);
    if (!investigator) {
      throwNotFound("Worker (investigator)", args.investigatorId);
    }

    await ctx.db.patch(args.id, {
      status: "under_investigation",
      investigatorId: args.investigatorId,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Update investigation (add notes, root cause, corrective actions)
export const updateInvestigation = mutation({
  args: {
    id: v.id("incidentReports"),
    investigationNotes: v.optional(v.string()),
    rootCause: v.optional(v.string()),
    correctiveActions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const incident = await ctx.db.get(id);
    if (!incident) {
      throwNotFound("IncidentReport", id);
    }

    if (incident.status === "closed") {
      throwValidation("Cannot update a closed incident");
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

// Add attachment to incident
export const addAttachment = mutation({
  args: {
    id: v.id("incidentReports"),
    attachmentId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throwNotFound("IncidentReport", args.id);
    }

    if (incident.status === "closed") {
      throwValidation("Cannot add attachments to a closed incident");
    }

    const currentAttachments = Array.isArray(incident.attachmentIds)
      ? (incident.attachmentIds as Id<"_storage">[])
      : [];

    await ctx.db.patch(args.id, {
      attachmentIds: [...currentAttachments, args.attachmentId],
      ...updatedAt(),
    });

    return args.id;
  },
});

// Close incident
export const close = mutation({
  args: { id: v.id("incidentReports") },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throwNotFound("IncidentReport", args.id);
    }

    if (incident.status === "closed") {
      throwValidation("Incident is already closed");
    }

    await ctx.db.patch(args.id, {
      status: "closed",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Reopen incident
export const reopen = mutation({
  args: { id: v.id("incidentReports") },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throwNotFound("IncidentReport", args.id);
    }

    if (incident.status !== "closed") {
      throwValidation("Can only reopen closed incidents");
    }

    // Determine if it should go back to open or under_investigation
    const newStatus = incident.investigatorId ? "under_investigation" : "open";

    await ctx.db.patch(args.id, {
      status: newStatus,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Get incident stats for a project
export const getProjectStats = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const incidents = await ctx.db
      .query("incidentReports")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const open = incidents.filter((i) => i.status === "open").length;
    const underInvestigation = incidents.filter(
      (i) => i.status === "under_investigation"
    ).length;
    const closed = incidents.filter((i) => i.status === "closed").length;

    const bySeverity = {
      low: incidents.filter((i) => i.severity === "low").length,
      medium: incidents.filter((i) => i.severity === "medium").length,
      high: incidents.filter((i) => i.severity === "high").length,
      critical: incidents.filter((i) => i.severity === "critical").length,
    };

    const byType = {
      injury: incidents.filter((i) => i.incidentType === "injury").length,
      near_miss: incidents.filter((i) => i.incidentType === "near_miss").length,
      property_damage: incidents.filter(
        (i) => i.incidentType === "property_damage"
      ).length,
      environmental: incidents.filter(
        (i) => i.incidentType === "environmental"
      ).length,
      other: incidents.filter((i) => i.incidentType === "other").length,
    };

    return {
      total: incidents.length,
      byStatus: { open, underInvestigation, closed },
      bySeverity,
      byType,
    };
  },
});
