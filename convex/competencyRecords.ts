import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation, throwConflict } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const competencyStatus = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected"),
  v.literal("expired")
);

// List all competency records for a worker
export const listByWorker = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("competencyRecords")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .collect();
  },
});

// List all competency records for an org
export const listByOrg = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("competencyRecords")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

// List competency records by status
export const listByStatus = query({
  args: {
    orgId: v.id("orgs"),
    status: competencyStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("competencyRecords")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// Get a single competency record
export const get = query({
  args: { id: v.id("competencyRecords") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) {
      throwNotFound("CompetencyRecord", args.id);
    }
    return record;
  },
});

// Get competency record for a worker and certification type
export const getByWorkerAndType = query({
  args: {
    workerId: v.id("workers"),
    certificationTypeId: v.id("certificationTypes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("competencyRecords")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .filter((q) =>
        q.eq(q.field("certificationTypeId"), args.certificationTypeId)
      )
      .first();
  },
});

// Create a new competency record (worker uploads cert)
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    workerId: v.id("workers"),
    certificationTypeId: v.id("certificationTypes"),
    certNumber: v.string(),
    issuer: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    frontPhotoId: v.optional(v.id("_storage")),
    backPhotoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // Verify org exists
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throwNotFound("Organization", args.orgId);
    }

    // Verify worker exists and belongs to org
    const worker = await ctx.db.get(args.workerId);
    if (!worker) {
      throwNotFound("Worker", args.workerId);
    }
    if (worker.orgId !== args.orgId) {
      throwValidation("Worker does not belong to this organization");
    }

    // Verify certification type exists and belongs to org
    const certType = await ctx.db.get(args.certificationTypeId);
    if (!certType) {
      throwNotFound("CertificationType", args.certificationTypeId);
    }
    if (certType.orgId !== args.orgId) {
      throwValidation(
        "Certification type does not belong to this organization"
      );
    }

    // Check for existing record (one per worker per cert type)
    const existing = await ctx.db
      .query("competencyRecords")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .filter((q) =>
        q.eq(q.field("certificationTypeId"), args.certificationTypeId)
      )
      .first();

    if (existing) {
      throwConflict(
        "Worker already has a competency record for this certification type. Update the existing record instead."
      );
    }

    const insertData: Parameters<
      typeof ctx.db.insert<"competencyRecords">
    >[1] = {
      orgId: args.orgId,
      workerId: args.workerId,
      certificationTypeId: args.certificationTypeId,
      certNumber: args.certNumber,
      status: "pending",
      ...timestamps(),
    };

    if (args.issuer !== undefined) insertData.issuer = args.issuer;
    if (args.issueDate !== undefined) insertData.issueDate = args.issueDate;
    if (args.expiryDate !== undefined) insertData.expiryDate = args.expiryDate;
    if (args.frontPhotoId !== undefined)
      insertData.frontPhotoId = args.frontPhotoId;
    if (args.backPhotoId !== undefined)
      insertData.backPhotoId = args.backPhotoId;

    return await ctx.db.insert("competencyRecords", insertData);
  },
});

// Update a competency record (worker updates cert details)
export const update = mutation({
  args: {
    id: v.id("competencyRecords"),
    certNumber: v.optional(v.string()),
    issuer: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    frontPhotoId: v.optional(v.id("_storage")),
    backPhotoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const record = await ctx.db.get(id);
    if (!record) {
      throwNotFound("CompetencyRecord", id);
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    // Reset to pending if verified/rejected and details changed
    const statusUpdate =
      record.status === "verified" || record.status === "rejected"
        ? { status: "pending" as const }
        : {};

    await ctx.db.patch(id, {
      ...filteredUpdates,
      ...statusUpdate,
      ...updatedAt(),
    });

    return id;
  },
});

// Verify a competency record (admin approves)
export const verify = mutation({
  args: {
    id: v.id("competencyRecords"),
    verifiedBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) {
      throwNotFound("CompetencyRecord", args.id);
    }

    if (record.status !== "pending") {
      throwValidation(
        `Cannot verify a record with status "${record.status}". Only pending records can be verified.`
      );
    }

    // Verify the verifier exists
    const verifier = await ctx.db.get(args.verifiedBy);
    if (!verifier) {
      throwNotFound("Worker (verifier)", args.verifiedBy);
    }

    await ctx.db.patch(args.id, {
      status: "verified",
      verifiedBy: args.verifiedBy,
      verifiedAt: now(),
      rejectionReason: undefined,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Reject a competency record (admin rejects)
export const reject = mutation({
  args: {
    id: v.id("competencyRecords"),
    verifiedBy: v.id("workers"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) {
      throwNotFound("CompetencyRecord", args.id);
    }

    if (record.status !== "pending") {
      throwValidation(
        `Cannot reject a record with status "${record.status}". Only pending records can be rejected.`
      );
    }

    // Verify the verifier exists
    const verifier = await ctx.db.get(args.verifiedBy);
    if (!verifier) {
      throwNotFound("Worker (verifier)", args.verifiedBy);
    }

    await ctx.db.patch(args.id, {
      status: "rejected",
      verifiedBy: args.verifiedBy,
      verifiedAt: now(),
      rejectionReason: args.rejectionReason,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Mark a competency record as expired (system or admin)
export const expire = mutation({
  args: { id: v.id("competencyRecords") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) {
      throwNotFound("CompetencyRecord", args.id);
    }

    await ctx.db.patch(args.id, {
      status: "expired",
      ...updatedAt(),
    });

    return args.id;
  },
});

// List expiring certifications (within warning days threshold)
export const listExpiring = query({
  args: {
    orgId: v.id("orgs"),
    withinDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysThreshold = args.withinDays ?? 30;
    const currentTime = now();
    const thresholdDate = currentTime + daysThreshold * 24 * 60 * 60 * 1000;

    // Get all verified records for org
    const records = await ctx.db
      .query("competencyRecords")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), "verified"))
      .collect();

    // Filter to those expiring within threshold
    return records.filter((r) => {
      const expiry = r.expiryDate;
      if (typeof expiry !== "number") return false;
      return expiry <= thresholdDate && expiry > currentTime;
    });
  },
});

// List expired certifications (past expiry date)
export const listExpired = query({
  args: { orgId: v.id("orgs") },
  handler: async (ctx, args) => {
    const currentTime = now();

    // Get all verified records that are past expiry
    const records = await ctx.db
      .query("competencyRecords")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("status"), "verified"))
      .collect();

    return records.filter((r) => {
      const expiry = r.expiryDate;
      if (typeof expiry !== "number") return false;
      return expiry < currentTime;
    });
  },
});

// Check if worker has all required org-wide certifications (valid)
export const checkWorkerCompliance = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    const worker = await ctx.db.get(args.workerId);
    if (!worker) {
      throwNotFound("Worker", args.workerId);
    }

    // Get required org-wide cert types
    const allCertTypes = await ctx.db
      .query("certificationTypes")
      .withIndex("by_org", (q) => q.eq("orgId", worker.orgId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const required = allCertTypes.filter((ct) => ct.isRequiredOrgwide);

    // Get worker's competency records
    const workerRecords = await ctx.db
      .query("competencyRecords")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .collect();

    const currentTime = now();

    // Check each required type
    const results = required.map((certType) => {
      const record = workerRecords.find(
        (r) => r.certificationTypeId === certType._id
      );
      const expiry = record?.expiryDate;
      const isValid =
        record &&
        record.status === "verified" &&
        (typeof expiry !== "number" || expiry > currentTime);

      return {
        certificationTypeId: certType._id,
        certificationTypeName: certType.name,
        required: true,
        hasRecord: !!record,
        status: record?.status ?? null,
        expiryDate: record?.expiryDate ?? null,
        isValid,
      };
    });

    return {
      workerId: args.workerId,
      isCompliant: results.every((r) => r.isValid),
      certifications: results,
    };
  },
});
