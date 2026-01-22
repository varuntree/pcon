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

// ===================
// R3 QUALITY VALIDATORS
// ===================

// Checklist field types (16 types)
const checklistFieldType = v.union(
  v.literal("text"),
  v.literal("textarea"),
  v.literal("number"),
  v.literal("date"),
  v.literal("time"),
  v.literal("datetime"),
  v.literal("yesno"),
  v.literal("checkbox"),
  v.literal("select"),
  v.literal("multiselect"),
  v.literal("photo"),
  v.literal("signature"),
  v.literal("attachment"),
  v.literal("instruction"),
  v.literal("notes"),
  v.literal("action_trigger")
);

// Checklist instance status
const checklistInstanceStatus = v.union(
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

// Checklist source types (polymorphic linking)
const checklistSourceType = v.union(
  v.literal("asset"),
  v.literal("itp"),
  v.literal("incident"),
  v.literal("defect"),
  v.literal("manual")
);

// Defect status
const defectStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
);

// Defect category
const defectCategory = v.union(
  v.literal("builder"),
  v.literal("client"),
  v.literal("safety"),
  v.literal("other")
);

// Defect/action priority
const priorityLevel = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

// Action item status
const actionItemStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

// Action source types
const actionSourceType = v.union(
  v.literal("checklist"),
  v.literal("inspection"),
  v.literal("incident"),
  v.literal("defect"),
  v.literal("itp"),
  v.literal("manual")
);

// ===================
// R3 ASSET VALIDATORS
// ===================

// Asset type
const assetType = v.union(
  v.literal("plant"),
  v.literal("equipment"),
  v.literal("vehicle"),
  v.literal("tool"),
  v.literal("other")
);

// Asset status
const assetStatus = v.union(
  v.literal("available"),
  v.literal("in_use"),
  v.literal("maintenance"),
  v.literal("retired")
);

// Asset allocation type
const allocationType = v.union(
  v.literal("reservation"),
  v.literal("assignment")
);

// Asset allocation status
const allocationStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

// Asset request type
const assetRequestType = v.union(
  v.literal("booking"),
  v.literal("transfer"),
  v.literal("maintenance")
);

// Asset request status
const assetRequestStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled")
);

// Service log type
const serviceType = v.union(
  v.literal("maintenance"),
  v.literal("repair"),
  v.literal("inspection"),
  v.literal("calibration"),
  v.literal("other")
);

// Checklist config purpose
const checklistPurpose = v.union(
  v.literal("inspection"),
  v.literal("prestart")
);

// Checklist config frequency
const checklistFrequency = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("annually"),
  v.literal("on_use")
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

  // ===================
  // R3: QUALITY CHECKLISTS MODULE
  // ===================

  // Checklist Templates - Org/project level dynamic forms
  checklistTemplates: defineTable({
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")), // null = org-wide template
    name: v.string(),
    description: v.optional(v.string()),
    scope: v.optional(v.string()), // Descriptive scope (e.g., "Quality", "Safety")
    // Sections with fields
    sections: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        order: v.number(),
        fields: v.array(
          v.object({
            id: v.string(),
            type: checklistFieldType,
            label: v.string(),
            required: v.boolean(),
            order: v.number(),
            helpText: v.optional(v.string()),
            // For select/multiselect
            options: v.optional(v.array(v.string())),
            // For number
            min: v.optional(v.number()),
            max: v.optional(v.number()),
            // For textarea
            rows: v.optional(v.number()),
            placeholder: v.optional(v.string()),
            maxLength: v.optional(v.number()),
            // For photo
            maxPhotos: v.optional(v.number()),
            // For signature
            signatureConfig: v.optional(
              v.object({
                label: v.string(),
                role: v.string(),
                required: v.boolean(),
              })
            ),
            // For action_trigger
            actionTrigger: v.optional(
              v.object({
                triggerWhen: v.string(),
                actionTitle: v.string(),
                actionPriority: v.string(),
              })
            ),
            // Conditional logic
            conditions: v.optional(
              v.array(
                v.object({
                  triggerFieldId: v.string(),
                  operator: v.literal("equals"),
                  value: v.any(),
                  action: v.union(v.literal("show"), v.literal("hide")),
                })
              )
            ),
          })
        ),
      })
    ),
    // Plant integration
    isPlantInduction: v.optional(v.boolean()),
    plantRegisterId: v.optional(v.id("assetRegisters")),
    plantAllItemsInRegister: v.optional(v.boolean()),
    plantAssetIds: v.optional(v.array(v.id("assets"))),
    // Scoring
    scoringEnabled: v.optional(v.boolean()),
    passingScore: v.optional(v.number()),
    // Status
    isActive: v.boolean(),
    isSystemTemplate: v.optional(v.boolean()),
    createdBy: v.id("workers"),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_org_active", ["orgId", "isActive"]),

  // Checklist Instances - Executed checklist records
  checklistInstances: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    checklistTemplateId: v.id("checklistTemplates"),
    instanceNumber: v.optional(v.string()), // Auto-generated per project (CHK-001)
    // Assignment
    assignedTo: v.optional(v.id("workers")),
    performedByWorkerId: v.optional(v.id("workers")),
    // Timing
    dueDate: v.optional(v.number()),
    performedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    // Source linking (polymorphic)
    sourceType: v.optional(checklistSourceType),
    sourceId: v.optional(v.string()),
    // Plant linking
    plantRegisterId: v.optional(v.id("assetRegisters")),
    plantAssetId: v.optional(v.id("assets")),
    plantBookingId: v.optional(v.string()),
    // Status
    status: checklistInstanceStatus,
    // Responses (keyed by fieldId)
    responses: v.optional(v.any()),
    // Linked items
    linkedDefectIds: v.optional(v.array(v.id("defects"))),
    linkedActionIds: v.optional(v.array(v.id("actionItems"))),
    // Score (if scoring enabled)
    score: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_template", ["checklistTemplateId"])
    .index("by_assignee", ["assignedTo"])
    .index("by_performer", ["performedByWorkerId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_source", ["sourceType", "sourceId"])
    .index("by_asset", ["plantAssetId"]),

  // ===================
  // R3: QUALITY DEFECTS MODULE
  // ===================

  // Defects - Quality issues requiring resolution
  defects: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    defectNumber: v.string(), // Auto-generated per project (DEFECT-001)
    title: v.string(),
    description: v.optional(v.string()),
    category: defectCategory,
    location: v.optional(v.string()),
    level: v.optional(v.string()), // Building level/floor
    area: v.optional(v.string()), // Specific area
    priority: priorityLevel,
    status: defectStatus,
    // Assignment (either org OR worker, not both)
    assignedTo: v.optional(v.id("orgs")), // Assigned to company
    assignedWorkerId: v.optional(v.id("workers")), // Assigned to worker
    dueDate: v.optional(v.number()),
    // Source linking (polymorphic)
    sourceType: v.optional(checklistSourceType),
    sourceId: v.optional(v.string()),
    assetId: v.optional(v.id("assets")), // Direct asset link
    drawingId: v.optional(v.string()), // Future: link to drawings
    // Workflow
    createdBy: v.id("workers"),
    resolvedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    closedBy: v.optional(v.id("workers")),
    // Embedded comments
    comments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          workerId: v.id("workers"),
          comment: v.string(),
          createdAt: v.number(),
        })
      )
    ),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_project_number", ["projectId", "defectNumber"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_assignee", ["assignedTo"])
    .index("by_worker_assignee", ["assignedWorkerId"])
    .index("by_source", ["sourceType", "sourceId"])
    .index("by_asset", ["assetId"]),

  // Defect Photos - Photo attachments with markup
  defectPhotos: defineTable({
    defectId: v.id("defects"),
    mediaFileId: v.id("_storage"),
    caption: v.optional(v.string()),
    markup: v.optional(v.string()), // SVG/canvas JSON for annotations
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_defect", ["defectId"])
    .index("by_mediaFile", ["mediaFileId"]),

  // Action Items - Tasks to be completed
  actionItems: defineTable({
    orgId: v.id("orgs"),
    projectId: v.id("projects"),
    actionNumber: v.string(), // Auto-generated per project (ACTION-001)
    title: v.string(),
    description: v.optional(v.string()),
    priority: priorityLevel,
    status: actionItemStatus,
    // Assignment (either org OR worker, not both)
    assignedTo: v.optional(v.id("orgs")),
    assignedWorkerId: v.optional(v.id("workers")),
    dueDate: v.optional(v.number()),
    // Source linking (polymorphic)
    sourceType: v.optional(actionSourceType),
    sourceId: v.optional(v.string()),
    // Attachments
    attachmentIds: v.optional(v.array(v.id("_storage"))),
    // Public access
    shareCode: v.optional(v.string()), // 12-char base64url for external access
    // Workflow
    createdBy: v.id("workers"),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
    // Embedded comments
    comments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          workerId: v.id("workers"),
          comment: v.string(),
          createdAt: v.number(),
        })
      )
    ),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_assignee", ["assignedTo"])
    .index("by_worker_assignee", ["assignedWorkerId"])
    .index("by_source", ["sourceType", "sourceId"])
    .index("by_shareCode", ["shareCode"])
    .index("by_dueDate", ["projectId", "dueDate"]),

  // ===================
  // R3: ASSET MANAGEMENT MODULE
  // ===================

  // Asset Registers - Category containers
  assetRegisters: defineTable({
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")), // null = org-wide register
    name: v.string(),
    description: v.optional(v.string()),
    assetType: assetType,
    isActive: v.boolean(),
    createdBy: v.id("workers"),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_org_type", ["orgId", "assetType"]),

  // Assets - Individual physical items
  assets: defineTable({
    orgId: v.id("orgs"),
    projectId: v.optional(v.id("projects")), // null = org-wide asset
    registerId: v.id("assetRegisters"),
    itemId: v.string(), // Auto-generated per org (ASSET-001)
    assetType: assetType,
    name: v.string(),
    description: v.optional(v.string()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    // Vehicle-specific
    registrationNumber: v.optional(v.string()), // Rego
    vin: v.optional(v.string()), // Vehicle Identification Number
    year: v.optional(v.number()),
    odometerKm: v.optional(v.number()),
    odometerHours: v.optional(v.number()),
    lastPrestartAt: v.optional(v.number()),
    // General
    purchaseDate: v.optional(v.number()),
    purchasePrice: v.optional(v.number()), // In cents
    imageId: v.optional(v.id("_storage")),
    qrCode: v.optional(v.string()), // Freeform QR code
    status: assetStatus,
    // Service tracking
    nextServiceDue: v.optional(v.number()),
    // Metadata
    metadata: v.optional(v.any()),
    createdBy: v.id("workers"),
    ...timestamps,
  })
    .index("by_org", ["orgId"])
    .index("by_project", ["projectId"])
    .index("by_register", ["registerId"])
    .index("by_itemId", ["orgId", "itemId"])
    .index("by_qrCode", ["qrCode"])
    .index("by_status", ["orgId", "status"])
    .index("by_rego", ["registrationNumber"]),

  // Asset Allocations - Unified bookings + assignments
  assetAllocations: defineTable({
    assetId: v.id("assets"),
    projectId: v.optional(v.id("projects")),
    allocationType: allocationType,
    // Assigned to (worker or org)
    workerId: v.optional(v.id("workers")),
    orgId: v.optional(v.id("orgs")),
    // Timing
    startDate: v.number(),
    endDate: v.optional(v.number()),
    allocatedAt: v.number(),
    returnedAt: v.optional(v.number()),
    // Status
    status: allocationStatus,
    notes: v.optional(v.string()),
    // Created by
    createdBy: v.id("workers"),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_asset", ["assetId"])
    .index("by_project", ["projectId"])
    .index("by_worker", ["workerId"])
    .index("by_status", ["assetId", "status"])
    .index("by_dates", ["assetId", "startDate", "endDate"]),

  // Asset Requests - Booking/transfer/maintenance approval
  assetRequests: defineTable({
    assetId: v.id("assets"),
    projectId: v.id("projects"),
    requestedByWorkerId: v.id("workers"),
    requestType: assetRequestType,
    // Timing
    requestedStartDate: v.optional(v.number()),
    requestedEndDate: v.optional(v.number()),
    // Status
    status: assetRequestStatus,
    approvedBy: v.optional(v.id("workers")),
    approvedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    // Link to allocation (on approval)
    allocationId: v.optional(v.id("assetAllocations")),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_asset", ["assetId"])
    .index("by_project", ["projectId"])
    .index("by_requester", ["requestedByWorkerId"])
    .index("by_status", ["projectId", "status"]),

  // Asset Checklist Configs - Inspection + prestart configuration
  assetChecklistConfigs: defineTable({
    assetId: v.id("assets"),
    checklistTemplateId: v.id("checklistTemplates"),
    purpose: checklistPurpose,
    frequency: checklistFrequency,
    isActive: v.boolean(),
    lastCompletedAt: v.optional(v.number()),
    nextDueAt: v.optional(v.number()),
    createdBy: v.id("workers"),
    metadata: v.optional(v.any()),
    ...timestamps,
  })
    .index("by_asset", ["assetId"])
    .index("by_template", ["checklistTemplateId"])
    .index("by_asset_purpose", ["assetId", "purpose"]),

  // Asset Service Logs - Maintenance/repair records
  assetServiceLogs: defineTable({
    assetId: v.id("assets"),
    projectId: v.optional(v.id("projects")),
    serviceType: serviceType,
    description: v.string(),
    performedBy: v.string(), // Name/company of performer
    performedByWorkerId: v.optional(v.id("workers")),
    performedAt: v.number(),
    cost: v.optional(v.number()), // In cents
    nextServiceDue: v.optional(v.number()),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
    metadata: v.optional(v.any()),
    createdBy: v.id("workers"),
    createdAt: v.number(),
  })
    .index("by_asset", ["assetId"])
    .index("by_project", ["projectId"])
    .index("by_type", ["assetId", "serviceType"])
    .index("by_date", ["assetId", "performedAt"]),

  // ===================
  // R3: ASSET OPERATIONS MODULE
  // ===================

  // Prestart Submissions - Completed prestart checks
  prestartSubmissions: defineTable({
    assetId: v.id("assets"),
    projectId: v.id("projects"),
    // Dual template support (legacy + new)
    templateId: v.optional(v.string()), // Legacy template ID
    checklistInstanceId: v.optional(v.id("checklistInstances")), // New checklist instance
    // Performer
    performedByWorkerId: v.id("workers"),
    performedAt: v.number(),
    // Responses and photos
    responses: v.optional(v.any()), // Field responses
    photoIds: v.optional(v.array(v.id("_storage"))),
    // Odometer tracking
    odometerKm: v.optional(v.number()),
    odometerHours: v.optional(v.number()),
    // Result
    passed: v.boolean(),
    issues: v.optional(v.array(v.string())), // List of failed items
    // Linked defects/actions (if failed)
    linkedDefectIds: v.optional(v.array(v.id("defects"))),
    linkedActionIds: v.optional(v.array(v.id("actionItems"))),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_asset", ["assetId"])
    .index("by_project", ["projectId"])
    .index("by_project_date", ["projectId", "performedAt"])
    .index("by_asset_status", ["assetId", "passed"])
    .index("by_performer", ["performedByWorkerId"]),

  // Plant Induction Completions - Worker qualifications for specific assets/types
  plantInductionCompletions: defineTable({
    workerId: v.id("workers"),
    // Either asset-specific or type-wide
    assetId: v.optional(v.id("assets")), // Specific asset
    assetTypeId: v.optional(v.id("assetRegisters")), // Asset type (register)
    inductionTypeId: v.optional(v.id("checklistTemplates")), // Linked induction template
    // Completion details
    completedAt: v.number(),
    expiresAt: v.optional(v.number()),
    certificateMediaFileId: v.optional(v.id("_storage")),
    // Metadata
    verifiedBy: v.optional(v.id("workers")),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_worker", ["workerId"])
    .index("by_asset", ["assetId"])
    .index("by_asset_type", ["assetTypeId"])
    .index("by_worker_asset", ["workerId", "assetId"])
    .index("by_worker_type", ["workerId", "assetTypeId"])
    .index("by_expiry", ["expiresAt"]),
});
