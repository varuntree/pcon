import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation, throwConflict } from "./lib/errors";
import { now } from "./lib/time";

// List all assignments for a document
export const listByDocument = query({
  args: { swmsDocumentId: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .collect();

    // Enrich with worker data
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const workerId = assignment.workerId as Id<"workers">;
        const worker = workerId ? await ctx.db.get(workerId) : null;
        return {
          ...assignment,
          worker: worker
            ? {
                _id: worker._id,
                fullName: worker.fullName,
                email: worker.email,
                role: worker.role,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// List all assignments for a worker
export const listByWorker = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .collect();

    // Enrich with document data
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const docId = assignment.swmsDocumentId as Id<"swmsDocuments">;
        const doc = docId ? await ctx.db.get(docId) : null;
        return {
          ...assignment,
          document: doc
            ? {
                _id: doc._id,
                title: doc.title,
                swmsNumber: doc.swmsNumber,
                status: doc.status,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

// List unsigned SWMS for a worker (assigned but not acknowledged)
export const listUnsignedByWorker = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .filter((q) => q.eq(q.field("acknowledgedAt"), undefined))
      .collect();

    // Enrich and filter for approved documents only
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const docId = assignment.swmsDocumentId as Id<"swmsDocuments">;
        const doc = docId ? await ctx.db.get(docId) : null;
        if (!doc || doc.status !== "approved") return null;
        return {
          ...assignment,
          document: {
            _id: doc._id,
            title: doc.title,
            swmsNumber: doc.swmsNumber,
            status: doc.status,
          },
        };
      })
    );

    return enriched.filter(Boolean);
  },
});

// Get a single assignment
export const get = query({
  args: { id: v.id("swmsAssignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.id);
    if (!assignment) {
      throwNotFound("SWMSAssignment", args.id);
    }
    return assignment;
  },
});

// Check if worker is assigned to a document
export const isAssigned = query({
  args: {
    swmsDocumentId: v.id("swmsDocuments"),
    workerId: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .filter((q) => q.eq(q.field("workerId"), args.workerId))
      .first();

    return !!existing;
  },
});

// Assign a single worker to a document
export const assign = mutation({
  args: {
    swmsDocumentId: v.id("swmsDocuments"),
    workerId: v.id("workers"),
    assignedBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    // Verify document exists and is approved
    const doc = await ctx.db.get(args.swmsDocumentId);
    if (!doc) {
      throwNotFound("SWMSDocument", args.swmsDocumentId);
    }
    if (doc.status !== "approved") {
      throwValidation(
        `Cannot assign workers to a document with status "${doc.status}". Only approved documents can have assignments.`
      );
    }

    // Verify worker exists
    const worker = await ctx.db.get(args.workerId);
    if (!worker) {
      throwNotFound("Worker", args.workerId);
    }

    // Verify assigner exists
    const assigner = await ctx.db.get(args.assignedBy);
    if (!assigner) {
      throwNotFound("Worker (assigner)", args.assignedBy);
    }

    // Check for existing assignment
    const existing = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .filter((q) => q.eq(q.field("workerId"), args.workerId))
      .first();

    if (existing) {
      throwConflict("Worker is already assigned to this document.");
    }

    return await ctx.db.insert("swmsAssignments", {
      swmsDocumentId: args.swmsDocumentId,
      workerId: args.workerId,
      assignedBy: args.assignedBy,
      assignedAt: now(),
    });
  },
});

// Batch assign multiple workers
export const assignBatch = mutation({
  args: {
    swmsDocumentId: v.id("swmsDocuments"),
    workerIds: v.array(v.id("workers")),
    assignedBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    // Verify document exists and is approved
    const doc = await ctx.db.get(args.swmsDocumentId);
    if (!doc) {
      throwNotFound("SWMSDocument", args.swmsDocumentId);
    }
    if (doc.status !== "approved") {
      throwValidation(
        `Cannot assign workers to a document with status "${doc.status}". Only approved documents can have assignments.`
      );
    }

    // Verify assigner exists
    const assigner = await ctx.db.get(args.assignedBy);
    if (!assigner) {
      throwNotFound("Worker (assigner)", args.assignedBy);
    }

    // Get existing assignments
    const existing = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .collect();
    const existingWorkerIds = new Set(existing.map((a) => a.workerId));

    const currentTime = now();
    const created: string[] = [];
    const skipped: string[] = [];

    for (const workerId of args.workerIds) {
      // Verify worker exists
      const worker = await ctx.db.get(workerId);
      if (!worker) {
        skipped.push(workerId);
        continue;
      }

      // Skip if already assigned
      if (existingWorkerIds.has(workerId)) {
        skipped.push(workerId);
        continue;
      }

      const id = await ctx.db.insert("swmsAssignments", {
        swmsDocumentId: args.swmsDocumentId,
        workerId,
        assignedBy: args.assignedBy,
        assignedAt: currentTime,
      });
      created.push(id);
    }

    return { created, skipped };
  },
});

// Acknowledge assignment (worker confirms they've read)
export const acknowledge = mutation({
  args: { id: v.id("swmsAssignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.id);
    if (!assignment) {
      throwNotFound("SWMSAssignment", args.id);
    }

    if (assignment.acknowledgedAt) {
      throwValidation("Assignment has already been acknowledged.");
    }

    await ctx.db.patch(args.id, {
      acknowledgedAt: now(),
    });

    return args.id;
  },
});

// Unassign a worker from a document
export const unassign = mutation({
  args: {
    swmsDocumentId: v.id("swmsDocuments"),
    workerId: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .filter((q) => q.eq(q.field("workerId"), args.workerId))
      .first();

    if (!assignment) {
      throwNotFound(
        "SWMSAssignment",
        `document: ${args.swmsDocumentId}, worker: ${args.workerId}`
      );
    }

    // Check if worker has signed - cannot unassign
    const signature = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .filter((q) => q.eq(q.field("workerId"), args.workerId))
      .first();

    if (signature) {
      throwValidation(
        "Cannot unassign a worker who has already signed the document."
      );
    }

    const assignmentId = assignment._id as Id<"swmsAssignments">;
    await ctx.db.delete(assignmentId);

    return assignmentId;
  },
});

// Get unsigned workers for a document (assigned but no signature)
export const listUnsignedWorkers = query({
  args: { swmsDocumentId: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    // Get all assignments
    const assignments = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .collect();

    // Get all internal signatures
    const signatures = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .filter((q) => q.eq(q.field("signatureType"), "internal"))
      .collect();

    const signedWorkerIds = new Set(
      signatures
        .map((s) => s.workerId)
        .filter((id): id is typeof id & string => typeof id === "string")
    );

    // Filter to unsigned assignments and enrich
    const unsigned = assignments.filter((a) => {
      const wid = a.workerId;
      return typeof wid === "string" && !signedWorkerIds.has(wid);
    });

    const enriched = await Promise.all(
      unsigned.map(async (assignment) => {
        const workerId = assignment.workerId as Id<"workers">;
        const worker = workerId ? await ctx.db.get(workerId) : null;
        return {
          ...assignment,
          worker: worker
            ? {
                _id: worker._id,
                fullName: worker.fullName,
                email: worker.email,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});
