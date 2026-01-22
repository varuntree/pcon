import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { throwNotFound, throwValidation, throwConflict } from "./lib/errors";
import { now } from "./lib/time";

/**
 * Public SWMS APIs - No authentication required
 * These endpoints are accessed via share codes for external worker signing
 */

// Get SWMS document by share code (public, no auth)
export const getByShareCode = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("swmsDocuments")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!doc) {
      throwNotFound("SWMSDocument", `shareCode: ${args.shareCode}`);
    }

    // Only return approved documents
    if (doc.status !== "approved") {
      throwValidation(
        "This SWMS document is not available for signing. It may have been archived or expired."
      );
    }

    // Check if expired
    if (doc.expiresAt && typeof doc.expiresAt === "number" && doc.expiresAt < now()) {
      throwValidation(
        "This SWMS document has expired and is no longer available for signing."
      );
    }

    // Get project name for context
    const projectId = doc.projectId as Id<"projects">;
    const orgId = doc.orgId as Id<"orgs">;
    const project = projectId ? await ctx.db.get(projectId) : null;
    const org = orgId ? await ctx.db.get(orgId) : null;

    // Return limited document info for public view
    return {
      _id: doc._id,
      title: doc.title,
      swmsNumber: doc.swmsNumber,
      sections: doc.sections,
      projectName: project?.name ?? "Unknown Project",
      orgName: org?.name ?? "Unknown Organization",
      approvedAt: doc.approvedAt,
      expiresAt: doc.expiresAt,
    };
  },
});

// Sign SWMS externally (public, no auth)
export const signExternal = mutation({
  args: {
    shareCode: v.string(),
    workerName: v.string(),
    workerCompany: v.optional(v.string()),
    signatureData: v.string(), // Base64 PNG
    acknowledgedHazards: v.boolean(),
    acknowledgedControls: v.boolean(),
    acknowledgedPPE: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Find document by share code
    const doc = await ctx.db
      .query("swmsDocuments")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!doc) {
      throwNotFound("SWMSDocument", `shareCode: ${args.shareCode}`);
    }

    // Validate document status
    if (doc.status !== "approved") {
      throwValidation(
        "This SWMS document is not available for signing. It may have been archived or expired."
      );
    }

    // Check if expired
    if (doc.expiresAt && typeof doc.expiresAt === "number" && doc.expiresAt < now()) {
      throwValidation(
        "This SWMS document has expired and is no longer available for signing."
      );
    }

    // Validate acknowledgements
    if (!args.acknowledgedHazards || !args.acknowledgedControls || !args.acknowledgedPPE) {
      throwValidation("All acknowledgements must be checked before signing.");
    }

    // Validate signature data
    if (!args.signatureData || args.signatureData.length === 0) {
      throwValidation("Signature data cannot be empty.");
    }

    // Check for duplicate name on this document
    const existingSignatures = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", doc._id))
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
        `A signature with the name "${args.workerName}" already exists on this document. If you've already signed, you don't need to sign again.`
      );
    }

    // Generate signature hash
    const signedAt = now();
    const signatureHash = Buffer.from(
      `${args.signatureData}:${signedAt}`
    ).toString("base64");

    const insertData: Parameters<typeof ctx.db.insert<"swmsSignatures">>[1] = {
      swmsDocumentId: doc._id,
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

    const signatureId = await ctx.db.insert("swmsSignatures", insertData);

    return {
      success: true,
      signatureId,
      message: "Thank you for signing the SWMS. You may now proceed with work.",
    };
  },
});

// Get signature count for a document (public, no auth)
export const getSignatureCount = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("swmsDocuments")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", args.shareCode))
      .first();

    if (!doc) {
      return { count: 0 };
    }

    const signatures = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", doc._id))
      .collect();

    return { count: signatures.length };
  },
});
