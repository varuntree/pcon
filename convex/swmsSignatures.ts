import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation, throwConflict } from "./lib/errors";
import { now } from "./lib/time";

const swmsSignatureType = v.union(
  v.literal("internal"),
  v.literal("external")
);

// List all signatures for a document
export const listByDocument = query({
  args: { swmsDocumentId: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .collect();
  },
});

// List signatures by worker
export const listByWorker = query({
  args: { workerId: v.id("workers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsSignatures")
      .withIndex("by_worker", (q) => q.eq("workerId", args.workerId))
      .collect();
  },
});

// Get a single signature
export const get = query({
  args: { id: v.id("swmsSignatures") },
  handler: async (ctx, args) => {
    const sig = await ctx.db.get(args.id);
    if (!sig) {
      throwNotFound("SWMSSignature", args.id);
    }
    return sig;
  },
});

// Check if worker has signed a document
export const hasWorkerSigned = query({
  args: {
    swmsDocumentId: v.id("swmsDocuments"),
    workerId: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .filter((q) => q.eq(q.field("workerId"), args.workerId))
      .first();

    return !!existing;
  },
});

// Create internal signature (authenticated worker)
export const createInternal = mutation({
  args: {
    swmsDocumentId: v.id("swmsDocuments"),
    workerId: v.id("workers"),
    signatureData: v.string(), // Base64 PNG
    acknowledgedHazards: v.boolean(),
    acknowledgedControls: v.boolean(),
    acknowledgedPPE: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Verify document exists and is approved
    const doc = await ctx.db.get(args.swmsDocumentId);
    if (!doc) {
      throwNotFound("SWMSDocument", args.swmsDocumentId);
    }
    if (doc.status !== "approved") {
      throwValidation(
        `Cannot sign a document with status "${doc.status}". Only approved documents can be signed.`
      );
    }

    // Verify worker exists
    const worker = await ctx.db.get(args.workerId);
    if (!worker) {
      throwNotFound("Worker", args.workerId);
    }

    // Check all acknowledgements
    if (!args.acknowledgedHazards || !args.acknowledgedControls || !args.acknowledgedPPE) {
      throwValidation("All acknowledgements must be checked before signing.");
    }

    // Check for existing signature
    const existing = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .filter((q) => q.eq(q.field("workerId"), args.workerId))
      .first();

    if (existing) {
      throwConflict("Worker has already signed this document.");
    }

    // Validate signature data
    if (!args.signatureData || args.signatureData.length === 0) {
      throwValidation("Signature data cannot be empty.");
    }

    // Generate signature hash for tamper detection
    const signedAt = now();
    // Simple hash for now - in production would use SHA256
    const signatureHash = Buffer.from(
      `${args.signatureData}:${signedAt}`
    ).toString("base64");

    return await ctx.db.insert("swmsSignatures", {
      swmsDocumentId: args.swmsDocumentId,
      signatureType: "internal",
      workerId: args.workerId,
      signatureData: args.signatureData,
      signatureHash,
      acknowledgedHazards: args.acknowledgedHazards,
      acknowledgedControls: args.acknowledgedControls,
      acknowledgedPPE: args.acknowledgedPPE,
      signedAt,
    });
  },
});

// Create external signature (unauthenticated, via share code)
export const createExternal = mutation({
  args: {
    swmsDocumentId: v.id("swmsDocuments"),
    workerName: v.string(),
    workerCompany: v.optional(v.string()),
    signatureData: v.string(), // Base64 PNG
    acknowledgedHazards: v.boolean(),
    acknowledgedControls: v.boolean(),
    acknowledgedPPE: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Verify document exists and is approved
    const doc = await ctx.db.get(args.swmsDocumentId);
    if (!doc) {
      throwNotFound("SWMSDocument", args.swmsDocumentId);
    }
    if (doc.status !== "approved") {
      throwValidation(
        `Cannot sign a document with status "${doc.status}". Only approved documents can be signed.`
      );
    }

    // Check all acknowledgements
    if (!args.acknowledgedHazards || !args.acknowledgedControls || !args.acknowledgedPPE) {
      throwValidation("All acknowledgements must be checked before signing.");
    }

    // Check for duplicate name on this document
    const existingSignatures = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .collect();

    const duplicateName = existingSignatures.find((s) => {
      const wn = s.workerName;
      return (
        s.signatureType === "external" &&
        typeof wn === "string" &&
        wn.toLowerCase() === args.workerName.toLowerCase()
      );
    });

    if (duplicateName) {
      throwConflict(
        `A signature with the name "${args.workerName}" already exists on this document.`
      );
    }

    // Validate signature data
    if (!args.signatureData || args.signatureData.length === 0) {
      throwValidation("Signature data cannot be empty.");
    }

    // Generate signature hash
    const signedAt = now();
    const signatureHash = Buffer.from(
      `${args.signatureData}:${signedAt}`
    ).toString("base64");

    const insertData: Parameters<typeof ctx.db.insert<"swmsSignatures">>[1] = {
      swmsDocumentId: args.swmsDocumentId,
      signatureType: "external",
      workerName: args.workerName,
      signatureData: args.signatureData,
      signatureHash,
      acknowledgedHazards: args.acknowledgedHazards,
      acknowledgedControls: args.acknowledgedControls,
      acknowledgedPPE: args.acknowledgedPPE,
      signedAt,
    };

    if (args.workerCompany !== undefined) {
      insertData.workerCompany = args.workerCompany;
    }

    return await ctx.db.insert("swmsSignatures", insertData);
  },
});

// Get signature count by type for a document
export const getCountsByType = query({
  args: { swmsDocumentId: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    const signatures = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.swmsDocumentId))
      .collect();

    const internal = signatures.filter((s) => s.signatureType === "internal").length;
    const external = signatures.filter((s) => s.signatureType === "external").length;

    return {
      total: signatures.length,
      internal,
      external,
    };
  },
});
