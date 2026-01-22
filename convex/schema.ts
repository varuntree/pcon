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

// ===================
// R2 SAFETY VALIDATORS
// ===================

// Certification types
const certificationCategory = v.union(
  v.literal("license"),
  v.literal("ticket"),
  v.literal("training"),
  v.literal("medical"),
  v.literal("other")
);

const competencyStatus = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected"),
  v.literal("expired")
);

// SWMS
const swmsTemplateStatus = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived")
);

const swmsDocumentStatus = v.union(
  v.literal("draft"),
  v.literal("pending_review"),
  v.literal("approved"),
  v.literal("expired"),
  v.literal("archived")
);

const swmsSignatureType = v.union(
  v.literal("internal"),
  v.literal("external")
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

// Permits (9-state lifecycle)
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

const permitRiskLevel = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

// Incidents
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

// Inductions
const inductionScope = v.union(
  v.literal("company"),
  v.literal("site"),
  v.literal("task"),
  v.literal("plant")
);

const inductionStepType = v.union(
  v.literal("info"),
  v.literal("video"),
  v.literal("quiz"),
  v.literal("acknowledgement"),
  v.literal("document_upload"),
  v.literal("photo_capture")
);

const inductionInviteStatus = v.union(
  v.literal("pending"),
  v.literal("awaiting_review"),
  v.literal("completed")
);

const inductionCompletionStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("awaiting_review"),
  v.literal("completed"),
  v.literal("expired"),
  v.literal("superseded")
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

  // ===================
  // R2: SHARED SAFETY
  // ===================

  // Certification Types - Org-level cert definitions
  certificationTypes: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    code: v.string(), // Unique per org (e.g., "WHS-CARD", "FORKLIFT")
    category: certificationCategory,
    description: v.optional(v.string()),
    validityDays: v.optional(v.number()), // null = never expires
    expiryWarningDays: v.number(), // Days before expiry to warn (default: 30)
    isRequiredOrgwide: v.boolean(), // Required for all workers
    isActive: v.boolean(),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_org_code", ["orgId", "code"])
    .index("by_org_active", ["orgId", "isActive"]),

  // Competency Records - Worker certifications
  competencyRecords: defineTable({
    orgId: v.id("orgs"),
    workerId: v.id("workers"),
    certificationTypeId: v.id("certificationTypes"),
    certNumber: v.string(),
    issuer: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    frontPhotoId: v.optional(v.id("_storage")),
    backPhotoId: v.optional(v.id("_storage")),
    status: competencyStatus,
    verifiedBy: v.optional(v.id("workers")),
    verifiedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_worker", ["workerId"])
    .index("by_cert_type", ["certificationTypeId"])
    .index("by_worker_cert", ["workerId", "certificationTypeId"])
    .index("by_status", ["orgId", "status"])
    .index("by_expiry", ["expiryDate"]),

  // ===================
  // R2: SWMS MODULE
  // ===================

  // SWMS Templates - Org-level reusable templates
  swmsTemplates: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    description: v.optional(v.string()),
    sections: v.array(
      v.object({
        id: v.string(),
        type: swmsSectionType,
        title: v.string(),
        content: v.any(), // Flexible content per section type
        order: v.number(),
      })
    ),
    status: swmsTemplateStatus,
    version: v.number(),
    previousVersionId: v.optional(v.id("swmsTemplates")),
    createdBy: v.id("workers"),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"]),

  // SWMS Documents - Project-level instances
  swmsDocuments: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    templateId: v.optional(v.id("swmsTemplates")),
    swmsNumber: v.string(), // Auto-generated per project (SWMS-001)
    title: v.string(),
    revision: v.number(),
    status: swmsDocumentStatus,
    // Content sections
    sections: v.array(
      v.object({
        id: v.string(),
        type: swmsSectionType,
        title: v.string(),
        content: v.any(),
        order: v.number(),
      })
    ),
    // Workflow
    createdBy: v.id("workers"),
    submittedAt: v.optional(v.number()),
    submittedBy: v.optional(v.id("workers")),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("workers")),
    expiresAt: v.optional(v.number()),
    // Public signing
    shareCode: v.optional(v.string()), // 12-char alphanumeric
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_shareCode", ["shareCode"])
    .index("by_swmsNumber", ["projectId", "swmsNumber"]),

  // SWMS Signatures - Immutable audit trail
  swmsSignatures: defineTable({
    swmsDocumentId: v.id("swmsDocuments"),
    signatureType: swmsSignatureType,
    // Internal worker
    workerId: v.optional(v.id("workers")),
    // External worker (no account)
    workerName: v.optional(v.string()),
    workerCompany: v.optional(v.string()),
    // Signature data
    signatureData: v.string(), // Base64 PNG
    signatureHash: v.optional(v.string()), // SHA256 for tamper detection
    // Acknowledgements
    acknowledgedHazards: v.boolean(),
    acknowledgedControls: v.boolean(),
    acknowledgedPPE: v.boolean(),
    signedAt: v.number(),
  })
    .index("by_document", ["swmsDocumentId"])
    .index("by_worker", ["workerId"])
    .index("by_document_worker", ["swmsDocumentId", "workerId"]),

  // SWMS Assignments - Worker-SWMS junction
  swmsAssignments: defineTable({
    swmsDocumentId: v.id("swmsDocuments"),
    workerId: v.id("workers"),
    assignedBy: v.id("workers"),
    assignedAt: v.number(),
    acknowledgedAt: v.optional(v.number()),
  })
    .index("by_document", ["swmsDocumentId"])
    .index("by_worker", ["workerId"])
    .index("by_document_worker", ["swmsDocumentId", "workerId"]),

  // ===================
  // R2: PERMITS MODULE
  // ===================

  // Permit Types - Org-level templates
  permitTypes: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    code: v.string(), // Unique per org (e.g., "HOT-WORK", "CONFINED")
    description: v.optional(v.string()),
    requiredFields: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("textarea"),
          v.literal("number"),
          v.literal("select"),
          v.literal("multiselect"),
          v.literal("date"),
          v.literal("yesno"),
          v.literal("checkbox")
        ),
        required: v.boolean(),
        options: v.optional(v.array(v.string())), // For select/multiselect
      })
    ),
    defaultValidityHours: v.number(),
    riskLevel: permitRiskLevel,
    checklistTemplateId: v.optional(v.string()), // Future: link to checklists
    isActive: v.boolean(),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_org_code", ["orgId", "code"])
    .index("by_org_active", ["orgId", "isActive"]),

  // Permit Type Assignments - Enable types per project
  permitTypeAssignments: defineTable({
    permitTypeId: v.id("permitTypes"),
    projectId: v.id("projects"),
    defaultApproverId: v.optional(v.id("workers")),
    enabledBy: v.id("workers"),
    enabledAt: v.number(),
    isEnabled: v.boolean(),
  })
    .index("by_project", ["projectId"])
    .index("by_permit_type", ["permitTypeId"])
    .index("by_project_type", ["projectId", "permitTypeId"]),

  // Permit Instances - Project-level applications
  permitInstances: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    permitTypeId: v.id("permitTypes"),
    permitNumber: v.string(), // Auto-generated per project (PERMIT-001)
    status: permitStatus,
    // Applicant
    applicantId: v.id("workers"),
    applicantName: v.optional(v.string()), // For external
    applicantCompany: v.optional(v.string()),
    // Work details
    workDescription: v.string(),
    location: v.string(),
    formData: v.optional(v.any()), // Dynamic form responses
    // Timing
    requestedStartAt: v.number(),
    requestedEndAt: v.number(),
    validFrom: v.optional(v.number()),
    validTo: v.optional(v.number()),
    // Workflow timestamps
    submittedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("workers")),
    approvalSignatureData: v.optional(v.string()), // Base64 PNG
    rejectedBy: v.optional(v.id("workers")),
    rejectionReason: v.optional(v.string()),
    activatedAt: v.optional(v.number()),
    suspendedAt: v.optional(v.number()),
    suspendReason: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    closedBy: v.optional(v.id("workers")),
    closureNotes: v.optional(v.string()),
    expiredAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    // Linked checklist (future)
    checklistInstanceId: v.optional(v.string()),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_permit_type", ["permitTypeId"])
    .index("by_applicant", ["applicantId"])
    .index("by_permitNumber", ["projectId", "permitNumber"])
    .index("by_validTo", ["validTo"]),

  // ===================
  // R2: INCIDENTS MODULE
  // ===================

  // Incident Templates - Org-level investigation templates
  incidentTemplates: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    description: v.optional(v.string()),
    incidentType: incidentType,
    checklistTemplateId: v.optional(v.string()), // Future: link to checklists
    isActive: v.boolean(),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_org_type", ["orgId", "incidentType"])
    .index("by_org_active", ["orgId", "isActive"]),

  // Incident Template Assignments - Enable templates per project
  incidentTemplateAssignments: defineTable({
    incidentTemplateId: v.id("incidentTemplates"),
    projectId: v.id("projects"),
    isEnabled: v.boolean(),
    isDefault: v.boolean(),
    assignedBy: v.id("workers"),
    assignedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_template", ["incidentTemplateId"])
    .index("by_project_template", ["projectId", "incidentTemplateId"]),

  // Incident Reports - Project-level records
  incidentReports: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    incidentNumber: v.string(), // Auto-generated per project (INC-001)
    // Incident details
    incidentType: incidentType,
    severity: incidentSeverity,
    status: incidentStatus,
    description: v.string(),
    location: v.string(),
    date: v.number(), // When incident occurred
    // People involved
    reportedBy: v.id("workers"),
    reportedAt: v.number(),
    workerId: v.optional(v.id("workers")), // Affected worker (singular)
    investigatorId: v.optional(v.id("workers")),
    witnesses: v.optional(
      v.array(
        v.object({
          name: v.string(),
          contact: v.optional(v.string()),
        })
      )
    ),
    // Investigation
    investigationNotes: v.optional(v.string()),
    rootCause: v.optional(v.string()),
    correctiveActions: v.optional(v.array(v.string())),
    // Injury details (conditional)
    injuryDetails: v.optional(
      v.object({
        natureOfInjury: v.optional(v.string()),
        bodyLocation: v.optional(v.string()),
        treatmentRequired: v.optional(v.boolean()),
      })
    ),
    // Attachments
    attachmentIds: v.optional(v.array(v.id("_storage"))),
    involvedAssetIds: v.optional(v.array(v.string())), // Future: link to assets
    checklistInstanceId: v.optional(v.string()), // Future: link to investigation checklist
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_project_type", ["projectId", "incidentType"])
    .index("by_severity", ["projectId", "severity"])
    .index("by_reporter", ["reportedBy"])
    .index("by_date", ["projectId", "date"])
    .index("by_incidentNumber", ["projectId", "incidentNumber"]),

  // ===================
  // R2: INDUCTIONS MODULE
  // ===================

  // Induction Types - Org-level templates
  inductionTypes: defineTable({
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")), // null = company-wide
    name: v.string(),
    description: v.optional(v.string()),
    scope: inductionScope,
    // Content blocks
    steps: v.array(
      v.object({
        id: v.string(),
        type: inductionStepType,
        title: v.string(),
        content: v.optional(v.any()), // HTML for info, URL for video, etc.
        required: v.boolean(),
        order: v.number(),
      })
    ),
    // Prerequisites
    requiredCertificationTypeIds: v.optional(v.array(v.id("certificationTypes"))),
    // Validity
    validityDays: v.optional(v.number()), // null = never expires
    version: v.number(),
    previousVersionId: v.optional(v.id("inductionTypes")),
    isActive: v.boolean(),
    createdBy: v.id("workers"),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_org_scope", ["orgId", "scope"])
    .index("by_project", ["projectId"])
    .index("by_org_active", ["orgId", "isActive"]),

  // Induction Invites - Off-site invitation links
  inductionInvites: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    inductionTypeId: v.id("inductionTypes"),
    shareCode: v.string(), // 12-char alphanumeric (e.g., UPL-xxxxx format)
    status: inductionInviteStatus,
    // Target (optional pre-fill)
    targetEmail: v.optional(v.string()),
    targetName: v.optional(v.string()),
    // Workflow
    createdBy: v.id("workers"),
    expiresAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    completionId: v.optional(v.id("inductionCompletions")),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_shareCode", ["shareCode"])
    .index("by_status", ["projectId", "status"]),

  // Induction Completions - Worker completion records
  inductionCompletions: defineTable({
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")), // null for company-wide
    inductionTypeId: v.id("inductionTypes"),
    workerId: v.optional(v.id("workers")), // null for off-site before account created
    inviteId: v.optional(v.id("inductionInvites")),
    status: inductionCompletionStatus,
    // Profile (captured during wizard)
    profile: v.optional(
      v.object({
        fullName: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        trade: v.optional(v.string()),
        employer: v.optional(v.string()),
      })
    ),
    // Emergency contact
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        relationship: v.union(
          v.literal("Spouse"),
          v.literal("Parent"),
          v.literal("Sibling"),
          v.literal("Other")
        ),
      })
    ),
    // Step responses
    responses: v.optional(v.any()), // Flexible responses per step
    // Certification uploads
    certificationUploads: v.optional(
      v.array(
        v.object({
          certificationTypeId: v.id("certificationTypes"),
          certNumber: v.string(),
          expiryDate: v.optional(v.number()),
          frontPhotoId: v.optional(v.id("_storage")),
          backPhotoId: v.optional(v.id("_storage")),
        })
      )
    ),
    // Signature
    signatureData: v.optional(v.string()), // Base64 PNG
    signatureHash: v.optional(v.string()), // SHA256(signatureData + signedAt)
    signedAt: v.optional(v.number()),
    // Workflow
    startedAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    // Review
    reviewedBy: v.optional(v.id("workers")),
    reviewedAt: v.optional(v.number()),
    returnReason: v.optional(v.string()),
    // Audit
    auditLog: v.optional(
      v.array(
        v.object({
          actorId: v.optional(v.id("workers")),
          action: v.string(),
          timestamp: v.number(),
          comment: v.optional(v.string()),
        })
      )
    ),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_worker", ["workerId"])
    .index("by_type", ["inductionTypeId"])
    .index("by_worker_type", ["workerId", "inductionTypeId"])
    .index("by_status", ["orgId", "status"])
    .index("by_invite", ["inviteId"]),
});
