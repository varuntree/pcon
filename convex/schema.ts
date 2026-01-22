import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable validators
const timestamps = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

const orgKind = v.union(
  v.literal("principal"),
  v.literal("subcontractor"),
  v.literal("client"),
  v.literal("supplier"),
  v.literal("regulator"),
  v.literal("other")
);

const projectStatus = v.union(
  v.literal("planning"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived")
);

const workerStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("inactive")
);

const workerRole = v.union(
  v.literal("project_manager"),
  v.literal("site_supervisor"),
  v.literal("foreman"),
  v.literal("tradesperson"),
  v.literal("laborer"),
  v.literal("safety_officer"),
  v.literal("admin")
);

const workPackageStatus = v.union(
  v.literal("planned"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("archived")
);

export default defineSchema({
  // ===================
  // FOUNDATION TABLES
  // ===================

  // Organizations - Multi-tenant root
  orgs: defineTable({
    name: v.string(),
    abn: v.optional(v.string()), // 11-digit Australian Business Number
    kind: orgKind,
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ...timestamps,
  }).index("by_kind", ["kind"]),

  // Projects - Primary scoping boundary
  projects: defineTable({
    orgId: v.id("orgs"),
    clientOrgId: v.optional(v.id("orgs")),
    name: v.string(),
    code: v.string(), // Unique per org
    address: v.optional(v.string()),
    value: v.optional(v.number()), // Contract value in cents
    status: projectStatus,
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_status", ["orgId", "status"])
    .index("by_client", ["clientOrgId"]),

  // Trades - Global master data
  trades: defineTable({
    code: v.string(), // Unique code (e.g., "ELEC", "PLUM")
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    ...timestamps,
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"]),

  // Workers - Site personnel
  workers: defineTable({
    orgId: v.id("orgs"),
    fullName: v.string(),
    email: v.string(), // Unique per org (case-insensitive)
    phone: v.optional(v.string()),
    role: workerRole,
    status: workerStatus,
    tradeId: v.optional(v.id("trades")),
    employer: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
    // Emergency contact
    emergencyName: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    emergencyRelation: v.optional(v.string()),
    // Medical info
    medicalConditions: v.optional(v.string()),
    allergies: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["orgId", "email"])
    .index("by_status", ["orgId", "status"])
    .index("by_trade", ["tradeId"]),

  // Work Packages - Project subdivisions
  workPackages: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    status: workPackageStatus,
    tradeId: v.optional(v.id("trades")),
    phaseId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_project", ["projectId"])
    .index("by_org", ["orgId"])
    .index("by_project_phase", ["projectId", "phaseId"])
    .index("by_trade", ["tradeId"]),

  // Worker Assignments - Worker-project junction
  workerAssignments: defineTable({
    workerId: v.id("workers"),
    projectId: v.id("projects"),
    role: workerRole,
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_worker", ["workerId"])
    .index("by_project_worker", ["projectId", "workerId"]),
});
