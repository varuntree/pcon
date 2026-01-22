import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { throwNotFound, throwValidation } from "./lib/errors";
import { timestamps, updatedAt, now } from "./lib/time";

const swmsDocumentStatus = v.union(
  v.literal("draft"),
  v.literal("pending_review"),
  v.literal("approved"),
  v.literal("expired"),
  v.literal("archived")
);

const swmsSectionType = v.union(
  v.literal("title"),
  v.literal("activity"),
  v.literal("ppe"),
  v.literal("hazards"),
  v.literal("controls"),
  v.literal("plant"),
  v.literal("hazmat"),
  v.literal("permits"),
  v.literal("training"),
  v.literal("emergency"),
  v.literal("legislation"),
  v.literal("hrcw"),
  v.literal("supervision")
);

const sectionValidator = v.object({
  id: v.string(),
  type: swmsSectionType,
  title: v.string(),
  content: v.any(),
  order: v.number(),
});

// Generate SWMS number inline in mutation

// Generate share code (12-char alphanumeric)
function generateShareCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// List all documents for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsDocuments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// List documents by status
export const listByStatus = query({
  args: {
    projectId: v.id("projects"),
    status: swmsDocumentStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsDocuments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// List approved/active documents for signing
export const listActive = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("swmsDocuments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();
  },
});

// Get a single document
export const get = query({
  args: { id: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throwNotFound("SWMSDocument", args.id);
    }
    return doc;
  },
});

// Get by share code (for public signing)
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
    return doc;
  },
});

// Create a new document (from template or scratch)
export const create = mutation({
  args: {
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    templateId: v.optional(v.id("swmsTemplates")),
    title: v.string(),
    sections: v.optional(v.array(sectionValidator)),
    createdBy: v.id("workers"),
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

    // Verify creator exists
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throwNotFound("Worker", args.createdBy);
    }

    let sections: Parameters<typeof ctx.db.insert<"swmsDocuments">>[1]["sections"] =
      args.sections || [];

    // If template provided, copy sections from template
    if (args.templateId) {
      const template = await ctx.db.get(args.templateId);
      if (!template) {
        throwNotFound("SWMSTemplate", args.templateId);
      }
      if (template.status !== "published") {
        throwValidation("Can only create documents from published templates");
      }
      const templateSections = template.sections;
      if (Array.isArray(templateSections)) {
        sections =
          templateSections as Parameters<typeof ctx.db.insert<"swmsDocuments">>[1]["sections"];
      }
    }

    // Generate SWMS number
    const existing = await ctx.db
      .query("swmsDocuments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const nextNum = existing.length + 1;
    const swmsNumber = `SWMS-${String(nextNum).padStart(3, "0")}`;

    const insertData: Parameters<typeof ctx.db.insert<"swmsDocuments">>[1] = {
      orgId: args.orgId,
      projectId: args.projectId,
      swmsNumber,
      title: args.title,
      revision: 1,
      status: "draft",
      sections,
      createdBy: args.createdBy,
      ...timestamps(),
    };

    if (args.templateId !== undefined) {
      insertData.templateId = args.templateId;
    }

    return await ctx.db.insert("swmsDocuments", insertData);
  },
});

// Update a draft document
export const update = mutation({
  args: {
    id: v.id("swmsDocuments"),
    title: v.optional(v.string()),
    sections: v.optional(v.array(sectionValidator)),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const doc = await ctx.db.get(id);
    if (!doc) {
      throwNotFound("SWMSDocument", id);
    }

    if (doc.status !== "draft") {
      throwValidation(
        `Cannot update a document with status "${doc.status}". Only draft documents can be updated.`
      );
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

// Submit for review (draft -> pending_review)
export const submitForReview = mutation({
  args: {
    id: v.id("swmsDocuments"),
    submittedBy: v.id("workers"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throwNotFound("SWMSDocument", args.id);
    }

    if (doc.status !== "draft") {
      throwValidation(
        `Cannot submit a document with status "${doc.status}". Only draft documents can be submitted.`
      );
    }

    // Validate document has sections
    const sections = doc.sections;
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      throwValidation("Document must have at least one section to submit.");
    }

    await ctx.db.patch(args.id, {
      status: "pending_review",
      submittedAt: now(),
      submittedBy: args.submittedBy,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Approve document (pending_review -> approved)
export const approve = mutation({
  args: {
    id: v.id("swmsDocuments"),
    approvedBy: v.id("workers"),
    expiresInDays: v.optional(v.number()), // Default 365 days
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throwNotFound("SWMSDocument", args.id);
    }

    if (doc.status !== "pending_review") {
      throwValidation(
        `Cannot approve a document with status "${doc.status}". Only pending_review documents can be approved.`
      );
    }

    // Verify approver exists
    const approver = await ctx.db.get(args.approvedBy);
    if (!approver) {
      throwNotFound("Worker (approver)", args.approvedBy);
    }

    const currentTime = now();
    const expiryDays = args.expiresInDays ?? 365;
    const expiresAt = currentTime + expiryDays * 24 * 60 * 60 * 1000;
    const shareCode = generateShareCode();

    await ctx.db.patch(args.id, {
      status: "approved",
      approvedAt: currentTime,
      approvedBy: args.approvedBy,
      expiresAt,
      shareCode,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Return to draft (pending_review -> draft)
export const returnToDraft = mutation({
  args: { id: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throwNotFound("SWMSDocument", args.id);
    }

    if (doc.status !== "pending_review") {
      throwValidation(
        `Cannot return a document with status "${doc.status}". Only pending_review documents can be returned.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "draft",
      submittedAt: undefined,
      submittedBy: undefined,
      ...updatedAt(),
    });

    return args.id;
  },
});

// Archive document
export const archive = mutation({
  args: { id: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throwNotFound("SWMSDocument", args.id);
    }

    if (doc.status === "archived") {
      throwValidation("Document is already archived.");
    }

    await ctx.db.patch(args.id, {
      status: "archived",
      ...updatedAt(),
    });

    return args.id;
  },
});

// Expire document (approved -> expired, triggered by system or manually)
export const expire = mutation({
  args: { id: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throwNotFound("SWMSDocument", args.id);
    }

    if (doc.status !== "approved") {
      throwValidation(
        `Cannot expire a document with status "${doc.status}". Only approved documents can expire.`
      );
    }

    await ctx.db.patch(args.id, {
      status: "expired",
      ...updatedAt(),
    });

    return args.id;
  },
});

// List expiring documents (within threshold)
export const listExpiring = query({
  args: {
    projectId: v.id("projects"),
    withinDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysThreshold = args.withinDays ?? 7;
    const currentTime = now();
    const thresholdDate = currentTime + daysThreshold * 24 * 60 * 60 * 1000;

    const docs = await ctx.db
      .query("swmsDocuments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    return docs.filter((d) => {
      const expiry = d.expiresAt;
      if (typeof expiry !== "number") return false;
      return expiry <= thresholdDate && expiry > currentTime;
    });
  },
});

// Get document with signatures count
export const getWithStats = query({
  args: { id: v.id("swmsDocuments") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throwNotFound("SWMSDocument", args.id);
    }

    // Count signatures
    const signatures = await ctx.db
      .query("swmsSignatures")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.id))
      .collect();

    // Count assignments
    const assignments = await ctx.db
      .query("swmsAssignments")
      .withIndex("by_document", (q) => q.eq("swmsDocumentId", args.id))
      .collect();

    const acknowledgedCount = assignments.filter((a) => a.acknowledgedAt).length;

    return {
      ...doc,
      signatureCount: signatures.length,
      assignmentCount: assignments.length,
      acknowledgedCount,
    };
  },
});
