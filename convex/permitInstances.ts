import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const permitStatus = v.union(
  v.literal("draft"),
  v.literal("submitted"),
  v.literal("approved"),
  v.literal("active"),
  v.literal("suspended"),
  v.literal("closed"),
  v.literal("expired"),
  v.literal("rejected"),
  v.literal("cancelled")
);

// List all permit instances for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permitInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List permits by status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: permitStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permitInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// List active permits
export const listActive = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permitInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

// List permits by applicant
export const listByApplicant = query({
  args: { applicantId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("permitInstances")
      .withIndex("by_applicant", (q) => q.eq("applicantId", args.applicantId))
      .collect();
  },
});

// Get a single permit
export const get = query({
  args: { id: v.id("permitInstances") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }
    return permit;
  },
});

// Get permit with enriched data
export const getWithDetails = query({
  args: { id: v.id("permitInstances") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    const permitTypeId = permit.permitTypeId as Id<"permitTypes">;
    const applicantId = permit.applicantId as Id<"workers">;
    const approvedById = permit.approvedBy as Id<"workers"> | undefined;

    const permitType = permitTypeId ? await ctx.db.get(permitTypeId) : null;
    const applicant = applicantId ? await ctx.db.get(applicantId) : null;
    const approver = approvedById ? await ctx.db.get(approvedById) : null;

    return {
      ...permit,
      permitType: permitType
        ? {
            _id: permitType._id,
            name: permitType.name,
            code: permitType.code,
            riskLevel: permitType.riskLevel,
          }
        : null,
      applicant: applicant
        ? {
            _id: applicant._id,
            fullName: applicant.fullName,
            email: applicant.email,
          }
        : null,
      approver: approver
        ? {
            _id: approver._id,
            fullName: approver.fullName,
          }
        : null,
    };
  },
});

// Create a new permit (draft)
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    permitTypeId: v.id("permitTypes"),
    applicantId: v.id("workers"),
    workDescription: v.string(),
    location: v.string(),
    requestedStartAt: v.number(),
    requestedEndAt: v.number(),
    formData: v.optional(v.any()),
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

    // Verify permit type exists
    const permitType = await ctx.db.get(args.permitTypeId);
    if (!permitType) {
      throwNotFound("PermitType", args.permitTypeId);
    }
    if (!permitType.isActive) {
      throwValidation("Cannot create permit from inactive permit type");
    }

    // Check if permit type is enabled for project
    const assignment = await ctx.db
      .query("permitTypeAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("permitTypeId"), args.permitTypeId))
      .first();

    if (!assignment || !assignment.isEnabled) {
      throwValidation("Permit type is not enabled for this project");
    }

    // Verify applicant exists
    const applicant = await ctx.db.get(args.applicantId);
    if (!applicant) {
      throwNotFound("Worker (applicant)", args.applicantId);
    }

    // Generate permit number
    const existing = await ctx.db
      .query("permitInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNum = existing.length + 1;
    const permitNumber = `PERMIT-${String(nextNum).padStart(3, "0")}`;

    const insertData: Parameters<typeof ctx.db.insert<"permitInstances">>[1] = {
      orgId: args.orgId,
      projectId: args.projectId,
      permitTypeId: args.permitTypeId,
      permitNumber,
      status: "draft",
      applicantId: args.applicantId,
      workDescription: args.workDescription,
      location: args.location,
      requestedStartAt: args.requestedStartAt,
      requestedEndAt: args.requestedEndAt,
      ...timestamps(),
    };

    if (args.formData !== undefined) {
      insertData.formData = args.formData;
    }

    return await ctx.db.insert("permitInstances", insertData);
  },
});

// Submit permit for approval (draft -> submitted)
export const submit = mutation({
  args: { id: v.id("permitInstances") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "draft") {
      throwValidation(
        `Cannot submit a permit with status "${permit.status}". Only draft permits can be submitted.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "submitted",
      submittedAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// Approve permit (submitted -> approved)
export const approve = mutation({
  args: {
    id: v.id("permitInstances"),
    approvedBy: v.id("workers"),
    approvalSignatureData: v.optional(v.string()),
    validityHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "submitted") {
      throwValidation(
        `Cannot approve a permit with status "${permit.status}". Only submitted permits can be approved.`
      );
    }

    // Verify approver exists
    const approver = await ctx.db.get(args.approvedBy);
    if (!approver) {
      throwNotFound("Worker (approver)", args.approvedBy);
    }

    // Get permit type for default validity
    const permitTypeId = permit.permitTypeId as Id<"permitTypes">;
    const permitType = permitTypeId ? await ctx.db.get(permitTypeId) : null;
    const defaultValidityHours =
      typeof permitType?.defaultValidityHours === "number"
        ? permitType.defaultValidityHours
        : 24;

    const validityHours = args.validityHours ?? defaultValidityHours;
    const requestedStartAt =
      typeof permit.requestedStartAt === "number"
        ? permit.requestedStartAt
        : now();
    const validTo = requestedStartAt + validityHours * 60 * 60 * 1000;

    await ctx.db.patch(args.id, {
      status: "approved",
      approvedAt: now(),
      approvedBy: args.approvedBy,
      validFrom: requestedStartAt,
      validTo,
      approvalSignatureData: args.approvalSignatureData,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Reject permit (submitted -> rejected)
export const reject = mutation({
  args: {
    id: v.id("permitInstances"),
    rejectedBy: v.id("workers"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "submitted") {
      throwValidation(
        `Cannot reject a permit with status "${permit.status}". Only submitted permits can be rejected.`
      );
    }

    // Verify rejector exists
    const rejector = await ctx.db.get(args.rejectedBy);
    if (!rejector) {
      throwNotFound("Worker (rejector)", args.rejectedBy);
    }

    await ctx.db.patch(args.id, {
      status: "rejected",
      rejectedBy: args.rejectedBy,
      rejectionReason: args.rejectionReason,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Activate permit (approved -> active)
export const activate = mutation({
  args: { id: v.id("permitInstances") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "approved") {
      throwValidation(
        `Cannot activate a permit with status "${permit.status}". Only approved permits can be activated.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "active",
      activatedAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// Suspend permit (active -> suspended)
export const suspend = mutation({
  args: {
    id: v.id("permitInstances"),
    suspendReason: v.string(),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "active") {
      throwValidation(
        `Cannot suspend a permit with status "${permit.status}". Only active permits can be suspended.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "suspended",
      suspendedAt: now(),
      suspendReason: args.suspendReason,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Resume permit (suspended -> active)
export const resume = mutation({
  args: { id: v.id("permitInstances") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "suspended") {
      throwValidation(
        `Cannot resume a permit with status "${permit.status}". Only suspended permits can be resumed.`
      );
    }

    // Check if permit is still within validity period
    const validTo = permit.validTo;
    if (typeof validTo === "number" && validTo < now()) {
      throwValidation(
        "Cannot resume permit - validity period has expired. Create a new permit instead."
      );
    }

    await ctx.db.patch(args.id, {
      status: "active",
      suspendedAt: undefined,
      suspendReason: undefined,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Close permit (active -> closed)
export const close = mutation({
  args: {
    id: v.id("permitInstances"),
    closedBy: v.id("workers"),
    closureNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "active" && permit.status !== "suspended") {
      throwValidation(
        `Cannot close a permit with status "${permit.status}". Only active or suspended permits can be closed.`
      );
    }

    // Verify closer exists
    const closer = await ctx.db.get(args.closedBy);
    if (!closer) {
      throwNotFound("Worker (closer)", args.closedBy);
    }

    await ctx.db.patch(args.id, {
      status: "closed",
      closedAt: now(),
      closedBy: args.closedBy,
      closureNotes: args.closureNotes,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Cancel permit (draft/submitted/approved -> cancelled)
export const cancel = mutation({
  args: { id: v.id("permitInstances") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    const allowedStatuses = ["draft", "submitted", "approved"];
    if (!allowedStatuses.includes(permit.status as string)) {
      throwValidation(
        `Cannot cancel a permit with status "${permit.status}". Only draft, submitted, or approved permits can be cancelled.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      cancelledAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// Expire permit (active -> expired) - called by system
export const expire = mutation({
  args: { id: v.id("permitInstances") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.id);
    if (!permit) {
      throwNotFound("PermitInstance", args.id);
    }

    if (permit.status !== "active") {
      throwValidation(
        `Cannot expire a permit with status "${permit.status}". Only active permits can expire.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "expired",
      expiredAt: now(),
      ...updatedAt(),
    });

    return args.id;
  },
});

// List expiring permits
export const listExpiring = query({
  args: {
    projectId: v.id("projects"),
    withinHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursThreshold = args.withinHours ?? 24;
    const currentTime = now();
    const thresholdTime = currentTime + hoursThreshold * 60 * 60 * 1000;

    const permits = await ctx.db
      .query("permitInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return permits.filter((p) => {
      const validTo = p.validTo;
      if (typeof validTo !== "number") return false;
      return validTo <= thresholdTime && validTo > currentTime;
    });
  },
});

// List expired permits (should be transitioned)
export const listExpired = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const currentTime = now();

    const permits = await ctx.db
      .query("permitInstances")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return permits.filter((p) => {
      const validTo = p.validTo;
      if (typeof validTo !== "number") return false;
      return validTo < currentTime;
    });
  },
});
