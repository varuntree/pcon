# Schema Reference

## Index
- [Purpose](#purpose)
- [Database Technology](#database-technology)
- [Table Organization by Domain](#table-organization-by-domain)
- [Schema Patterns](#schema-patterns)
- [Core Table Specifications](#core-table-specifications)
- [Consolidation Summary](#consolidation-summary)
- [Validation Rules](#validation-rules)
- [Performance Optimization](#performance-optimization)
- [Security & Scope Enforcement](#security--scope-enforcement)
- [Migration Notes](#migration-notes)
- [Additional Tables (Not Detailed Above)](#additional-tables-not-detailed-above)

## Purpose
Complete data model specification for PRJ Construction rebuild - 52 core tables with comprehensive field definitions, indexes, relationships, validation rules, and architectural patterns.

## Database Technology
- **Type**: Convex (NoSQL, TypeScript-first, serverless)
- **Schema**: Code-first with auto-generated types
- **Reactivity**: Built-in real-time subscriptions via WebSocket
- **Total Tables**: 52 core tables (after 46% consolidation from 97)

## Table Organization by Domain

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Foundation** | orgs, projects, workers, trades, workPackages, workerAssignments | Root entities, scoping hierarchy |
| **Site Operations** | toolboxMeetings, toolboxAttendance, attendanceLogs, diaries, briefings, scheduledTasks, scheduleDependencies, schedulePhases, scheduleShares, signOnConfigs, prestartNotices, alerts | Daily site operations, scheduling, attendance |
| **Site Documents** | sourceDocuments, documentEntityLinks, documentFolders, documentUploadLinks | Document management (Claude reads files directly) |
| **SWMS Safety** | swmsTemplates, swmsDocuments, swmsSignatures, swmsAssignments | Safe Work Method Statements (60+ fields, 12 section types) |
| **Safety Permits** | permitTypes, permitTypeAssignments, permitInstances | Permit lifecycle (9 states) |
| **Safety Inductions** | inductionTypes, inductionInvites, inductionCompletions, plantInductionCompletions | Site/plant inductions with wizard workflow |
| **Safety Incidents** | incidentReports, incidentTemplates, incidentTemplateAssignments | Incident reporting and investigation |
| **Safety Compliance** | sdsLibrary, sdsVersions, sdsProjectLinks, sdsRequests, registerEntries, certificationTypes, projectCertificationRequirements, competencyRecords, insuranceTypes, projectInsuranceRequirements, insurancePolicies | SDS management, certifications, insurance tracking |
| **Asset Management** | assetRegisters, assets, assetAllocations, assetRequests, assetChecklistConfigs, assetServiceLogs | Equipment/plant tracking, bookings, maintenance |
| **Asset Operations** | prestartSubmissions | Equipment prestart checks |
| **Quality Checklists** | checklistTemplates, checklistInstances | Dynamic checklist builder (16 field types) |
| **Quality Defects** | defects, defectPhotos, actionItems | Defect tracking, action management |
| **Communications** | notifications, notificationPreferences, communications, communicationRecipients | In-app messaging, notification system |
| **Chief AI** | executions, aiRuns, conversations, conversationMessages | AI operations, session management, undo system |
| **Supporting** | mediaFiles, dashboards, dashboardWidgets, activityLogs | Cross-cutting infrastructure |

## Schema Patterns

### Scoping Hierarchy
```typescript
// Three-tier scoping: orgs → projects → entities
orgs (root)
  ├─ workers (org-level)
  ├─ swmsTemplates (org-level)
  └─ projects (org-level)
       ├─ scheduledTasks (project-level)
       ├─ defects (project-level)
       └─ swmsDocuments (project-level)

// Schema implementation
v.id("orgs")           // Always required for org-level tables
v.id("projects")       // Always required for project-level tables
v.optional(v.id(...))  // Optional for dual-scope tables
```

### Index Patterns
Every table follows consistent index patterns for performance:

```typescript
// Primary scoping indexes (REQUIRED)
.index("by_org", ["orgId"])              // Org-level tables
.index("by_project", ["projectId"])      // Project-level tables

// Common composite indexes
.index("by_project_status", ["projectId", "status"])
.index("by_project_priority_createdAt", ["projectId", "priority", "createdAt"])
.index("by_project_date", ["projectId", "date"])

// Public access indexes
.index("by_qrCode", ["qrCode"])          // QR code lookups
.index("by_shareCode", ["shareCode"])    // Share code lookups

// Polymorphic indexes
.index("by_source", ["sourceType", "sourceId"])
.index("by_entity", ["entityType", "entityId"])
.index("by_linked", ["linkedEntityType", "linkedEntityId"])

// Assignment indexes
.index("by_assignee", ["assignedTo"])
.index("by_worker", ["workerId"])

// Time-based indexes
.index("by_dueDate", ["projectId", "dueDate"])
.index("by_expiresAt", ["expiresAt"])
.index("by_date", ["projectId", "date"])
.index("by_completed", ["completedAt"])

// Verification/status specific
.index("by_verification", ["verificationStatus"])
.index("by_certType", ["certificationTypeId"])

// Asset-specific
.index("by_plant", ["plantAssetId"])
.index("by_register", ["plantRegisterId"])
```

### Field Patterns

**Standard Audit Fields:**
```typescript
createdAt: v.string(),              // ISO 8601 timestamp
updatedAt: v.optional(v.string()),  // ISO 8601 timestamp (omitted for immutable records)
createdBy: v.id("workers"),         // Creator reference
metadata: v.optional(v.any()),      // Extension point
```

**Foreign Key Pattern:**
```typescript
// Always use v.id() for type safety (NOT v.string())
orgId: v.id("orgs"),
projectId: v.id("projects"),
workerId: v.id("workers"),

// Optional references
assignedTo: v.optional(v.id("workers")),
```

**Status Enum Pattern:**
```typescript
// Use v.union() with v.literal() (NOT v.string() with docs)
status: v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
)
```

**Array Pattern:**
```typescript
// Simple value arrays
tags: v.array(v.string()),
linkedDefectIds: v.array(v.id("defects")),

// Embedded object arrays
confirmations: v.array(v.object({
  orgId: v.id("orgs"),
  status: v.union(v.literal("pending"), v.literal("confirmed")),
  confirmedAt: v.optional(v.string()),
  confirmedByName: v.optional(v.string()),
  comments: v.optional(v.string())
}))
```

**Public Access Codes:**
```typescript
// QR codes (asset tracking, document sharing)
qrCode: v.optional(v.string()),

// Share codes (external access)
shareCode: v.optional(v.string()),

// Always indexed
.index("by_qrCode", ["qrCode"])
.index("by_shareCode", ["shareCode"])
```

**Auto-Increment Numbers:**
```typescript
// Per-project sequential numbers
defectNumber: v.string(),        // "DEF-001"
actionNumber: v.string(),         // "ACT-001"
swmsNumber: v.string(),          // "SWMS-2024-001"

// Generated server-side, not client-provided
```

**Signature Pattern:**
```typescript
// Base64-encoded PNG image
signatureData: v.string(),  // "data:image/png;base64,..."

// Used by: swmsSignatures, completions
```

**Date vs Timestamp:**
```typescript
// Use ISO date (YYYY-MM-DD) for calendar dates
date: v.string(),              // "2024-01-15"
dueDate: v.string(),           // "2024-01-20"

// Use ISO timestamp for precise times
createdAt: v.string(),         // "2024-01-15T14:30:00.000Z"
signedAt: v.string(),          // "2024-01-15T09:15:23.456Z"
```

### Standard Status Lifecycles

**Simple Lifecycle:**
- `active | inactive | archived`
- Used by: projects, phases, workers

**Review Lifecycle:**
- `draft | submitted | approved | rejected | active | expired | archived`
- Used by: SWMS, permits, inductions

**Work Lifecycle:**
- `open | in_progress | resolved | closed`
- Used by: defects, incidents

**Task Lifecycle:**
- `pending | in_progress | completed | cancelled`
- Used by: scheduledTasks, actionItems

**Permit Lifecycle (Extended):**
- `draft | submitted | approved | active | suspended | closed | expired | rejected | cancelled`
- Used by: permitInstances (9 states)

**Verification Lifecycle:**
- `pending | verified | rejected | expired`
- Used by: competencyRecords, document verifications

**Induction Lifecycle:**
- `invited | in_progress | completed | expired`
- Used by: inductionCompletions, inductionInvites

### Polymorphic Patterns

**Source Reference Pattern:**
```typescript
// Flexible entity linking without explicit FKs
sourceType: v.union(
  v.literal("asset"),
  v.literal("checklist"),
  v.literal("incident"),
  v.literal("defect"),
  v.literal("itp"),
  v.literal("manual")
),
sourceId: v.string(),  // Entity ID as string

// Index for lookups
.index("by_source", ["sourceType", "sourceId"])

// Used by: checklistInstances, defects, actionItems
```

**Entity Link Pattern:**
```typescript
// Generic polymorphic links
linkedEntityType: v.optional(v.string()),
linkedEntityId: v.optional(v.string()),

// Index for reverse lookups
.index("by_linked", ["linkedEntityType", "linkedEntityId"])

// Used by: mediaFiles
```

### Template → Instance Pattern
Reusable templates instantiated per project:

| Template (Org-Level) | Instance (Project-Level) | Link Field |
|----------------------|--------------------------|------------|
| swmsTemplates | swmsDocuments | templateId |
| inductionTypes | inductionCompletions | inductionTypeId |
| checklistTemplates | checklistInstances | checklistTemplateId |
| permitTypes | permitInstances | permitTypeId |
| certificationTypes | competencyRecords | certificationTypeId |

```typescript
// Template (org-scoped, reusable)
defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  status: v.union(v.literal("draft"), v.literal("published")),
  // ... template configuration fields
})

// Instance (project-scoped, one-time use)
defineTable({
  projectId: v.id("projects"),
  templateId: v.optional(v.id("templateTable")),
  status: v.union(v.literal("in_progress"), v.literal("completed")),
  // ... instance-specific fields
})
```

### Advanced Relationship Patterns

**Self-Referencing (Hierarchies):**
```typescript
// Task dependencies
scheduleDependencies: defineTable({
  taskId: v.id("scheduledTasks"),
  dependsOnTaskId: v.id("scheduledTasks"),
  dependencyType: v.union(
    v.literal("finish_to_start"),
    v.literal("start_to_start")
  )
})

// Folder hierarchy
documentFolders: {
  parentFolderId: v.optional(v.id("documentFolders"))
}
```

**Many-to-Many with Metadata:**
```typescript
// Junction table with additional fields
workerAssignments: defineTable({
  workerId: v.id("workers"),
  projectId: v.id("projects"),
  role: v.optional(v.string()),  // Extra metadata
  createdAt: v.string()          // Extra metadata
})
.index("by_project_worker", ["projectId", "workerId"]) // Uniqueness
```

**Optional Bidirectional:**
```typescript
// Projects optionally reference client orgs
projects: {
  orgId: v.id("orgs"),           // Owner (required)
  clientOrgId: v.optional(v.id("orgs"))  // Client (optional)
}

// Allows org to be both owner and client
```

## Core Table Specifications

### Foundation Tables

**orgs** (Root organization entity)
```typescript
defineTable({
  name: v.string(),
  abn: v.optional(v.string()),
  kind: v.union(
    v.literal("principal"),
    v.literal("subcontractor"),
    v.literal("client"),
    v.literal("supplier"),
    v.literal("regulator"),
    v.literal("other")
  ),
  contactName: v.optional(v.string()),
  contactEmail: v.optional(v.string()),
  contactPhone: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_kind", ["kind"])
```
- **Lifecycle**: Always active (no status field)
- **Children**: projects, workers, templates (all org-scoped entities)
- **Operations**: create, update, list, get

**projects** (Primary scoping entity)
```typescript
defineTable({
  orgId: v.id("orgs"),
  clientOrgId: v.optional(v.id("orgs")),
  name: v.string(),
  code: v.optional(v.string()),
  address: v.optional(v.string()),
  value: v.optional(v.number()),
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived")
  ),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_status", ["orgId", "status"])
.index("by_client", ["clientOrgId"])
```
- **Lifecycle**: planning → active → completed → archived
- **Children**: Virtually all project-scoped tables
- **Operations**: create, update, archive, clone, list, get, getStats

**workers**
```typescript
defineTable({
  orgId: v.id("orgs"),
  fullName: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  role: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("inactive")
  ),
  tradeId: v.optional(v.id("trades")),
  employer: v.optional(v.string()),
  avatarId: v.optional(v.id("mediaFiles")),
  emergencyContactName: v.optional(v.string()),
  emergencyContactPhone: v.optional(v.string()),
  emergencyContactRelationship: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  address: v.optional(v.string()),
  allergies: v.optional(v.string()),
  medicalConditions: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_email", ["email"])
.index("by_status", ["orgId", "status"])
.index("by_trade", ["tradeId"])
```
- **Changes from Current**: Removed `isActive` boolean (use status enum), Changed `trade` from string to `tradeId` FK, Removed `identifier` field
- **Lifecycle**: pending → active → inactive
- **Operations**: create, update, list, get, getByEmail

**trades** (Master trade/discipline list)
```typescript
defineTable({
  code: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_code", ["code"])
.index("by_active", ["isActive"])
```

**workerAssignments** (Junction table)
```typescript
defineTable({
  workerId: v.id("workers"),
  projectId: v.id("projects"),
  role: v.optional(v.string()),
  createdAt: v.string()
})
.index("by_project", ["projectId"])
.index("by_worker", ["workerId"])
.index("by_project_worker", ["projectId", "workerId"])
```

### SWMS Tables (UNCHANGED - Legal Compliance)

**Critical Note**: SWMS tables preserved exactly as-is. Every field is compliance-critical.

**swmsTemplates**
```typescript
defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  description: v.optional(v.string()),
  sections: v.array(v.object({
    id: v.string(),
    type: v.union(
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
    ),
    content: v.any(),
    order: v.number()
  })),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived")
  ),
  version: v.optional(v.number()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_status", ["orgId", "status"])
```

**swmsDocuments** (60+ fields, 12 section types)
```typescript
defineTable({
  projectId: v.id("projects"),
  templateId: v.optional(v.id("swmsTemplates")),
  swmsNumber: v.string(),
  title: v.string(),
  revision: v.optional(v.string()),
  status: v.union(
    v.literal("draft"),
    v.literal("pending_review"),
    v.literal("approved"),
    v.literal("expired"),
    v.literal("archived")
  ),
  createdBy: v.id("workers"),
  approvedBy: v.optional(v.id("workers")),
  approvedAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  shareCode: v.optional(v.string()),
  tasks: v.array(v.object({
    description: v.string(),
    hazards: v.array(v.string())
  })),
  hrcwActivities: v.array(v.string()),
  hazardousMaterials: v.array(v.object({
    material: v.string(),
    hazards: v.array(v.string()),
    controls: v.array(v.string())
  })),
  plantEquipment: v.array(v.object({
    equipment: v.string(),
    purpose: v.string(),
    requirements: v.array(v.string())
  })),
  ppeRequirements: v.array(v.string()),
  trainingRequirements: v.array(v.string()),
  permitsRequired: v.array(v.string()),
  legislation: v.object({
    acts: v.array(v.string()),
    standards: v.array(v.string()),
    codes: v.array(v.string())
  }),
  emergencyProcedures: v.optional(v.string()),
  supervision: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_status", ["projectId", "status"])
.index("by_shareCode", ["shareCode"])
.index("by_template", ["templateId"])
```
- **Changes from Current**: Removed 10+ legacy fields after data migration
- **Public Access**: `shareCode` field with `by_shareCode` index

**swmsSignatures** (Immutable audit trail)
```typescript
defineTable({
  swmsDocumentId: v.id("swmsDocuments"),
  workerId: v.optional(v.id("workers")),
  workerName: v.string(),
  workerCompany: v.optional(v.string()),
  signatureType: v.union(
    v.literal("internal"),
    v.literal("external")
  ),
  signatureData: v.string(), // Base64 PNG
  signedAt: v.string(),
  metadata: v.optional(v.any())
})
.index("by_swms", ["swmsDocumentId"])
.index("by_worker", ["workerId"])
```

**swmsAssignments**
```typescript
defineTable({
  swmsDocumentId: v.id("swmsDocuments"),
  workerId: v.id("workers"),
  assignedAt: v.string(),
  acknowledgedAt: v.optional(v.string()),
  metadata: v.optional(v.any())
})
.index("by_swms", ["swmsDocumentId"])
.index("by_worker", ["workerId"])
.index("by_swms_worker", ["swmsDocumentId", "workerId"])
```

### Safety Permits Tables

**permitTypes** (Permit templates)
```typescript
defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  code: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.optional(v.union(
    v.literal("hot_work"),
    v.literal("confined_space"),
    v.literal("work_at_height"),
    v.literal("electrical"),
    v.literal("excavation"),
    v.literal("other")
  )),
  fields: v.optional(v.array(v.any())), // Custom form fields
  defaultValidityHours: v.optional(v.number()),
  requiresApproval: v.optional(v.boolean()),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**permitTypeAssignments** (Permit availability per project)
```typescript
defineTable({
  projectId: v.id("projects"),
  permitTypeId: v.id("permitTypes"),
  isRequired: v.optional(v.boolean()),
  customValidityHours: v.optional(v.number()),
  approverIds: v.optional(v.array(v.id("workers"))),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_project", ["projectId"])
.index("by_permitType", ["permitTypeId"])
.index("by_project_permitType", ["projectId", "permitTypeId"])
```

**permitInstances** (Active permits - 9 state lifecycle)
```typescript
defineTable({
  projectId: v.id("projects"),
  permitTypeId: v.id("permitTypes"),
  permitNumber: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  requestedBy: v.id("workers"),
  approvedBy: v.optional(v.id("workers")),
  status: v.union(
    v.literal("draft"),
    v.literal("submitted"),
    v.literal("approved"),
    v.literal("active"),
    v.literal("suspended"),
    v.literal("closed"),
    v.literal("expired"),
    v.literal("rejected"),
    v.literal("cancelled")
  ),
  validFrom: v.optional(v.string()),
  validUntil: v.optional(v.string()),
  formData: v.optional(v.any()),
  rejectionReason: v.optional(v.string()),
  suspensionReason: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_project_status", ["projectId", "status"])
.index("by_permitType", ["permitTypeId"])
.index("by_number", ["permitNumber"])
```

### Safety Inductions Tables

**inductionTypes** (Induction templates)
```typescript
defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("site"),
    v.literal("plant"),
    v.literal("visitor"),
    v.literal("contractor"),
    v.literal("other")
  ),
  steps: v.array(v.object({
    id: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("video"),
      v.literal("quiz"),
      v.literal("acknowledgement"),
      v.literal("document_upload"),
      v.literal("photo_capture")
    ),
    title: v.string(),
    content: v.any(),
    order: v.number()
  })),
  validityDays: v.optional(v.number()),
  passingScore: v.optional(v.number()),
  certificateTemplateId: v.optional(v.string()),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**inductionInvites** (Invitation tracking)
```typescript
defineTable({
  projectId: v.id("projects"),
  inductionTypeId: v.id("inductionTypes"),
  workerId: v.optional(v.id("workers")),
  inviteeEmail: v.optional(v.string()),
  inviteCode: v.string(),
  status: v.union(
    v.literal("invited"),
    v.literal("accepted"),
    v.literal("completed"),
    v.literal("expired")
  ),
  expiresAt: v.optional(v.string()),
  completionId: v.optional(v.id("inductionCompletions")),
  invitedBy: v.id("workers"),
  createdAt: v.string(),
  acceptedAt: v.optional(v.string()),
  metadata: v.optional(v.any())
})
.index("by_project", ["projectId"])
.index("by_worker", ["workerId"])
.index("by_inviteCode", ["inviteCode"])
.index("by_status", ["projectId", "status"])
```

**inductionCompletions** (Completed inductions)
```typescript
defineTable({
  projectId: v.id("projects"),
  inductionTypeId: v.id("inductionTypes"),
  workerId: v.id("workers"),
  inviteId: v.optional(v.id("inductionInvites")),
  status: v.union(
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("expired")
  ),
  startedAt: v.string(),
  completedAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  score: v.optional(v.number()),
  passed: v.optional(v.boolean()),
  responses: v.optional(v.any()),
  certificateId: v.optional(v.id("sourceDocuments")),
  metadata: v.optional(v.any())
})
.index("by_project", ["projectId"])
.index("by_worker", ["workerId"])
.index("by_inductionType", ["inductionTypeId"])
.index("by_project_worker", ["projectId", "workerId"])
```

**plantInductionCompletions** (Asset-specific inductions)
```typescript
defineTable({
  plantAssetId: v.id("assets"),
  workerId: v.id("workers"),
  inductionTypeId: v.optional(v.id("inductionTypes")),
  completedAt: v.string(),
  expiresAt: v.optional(v.string()),
  signatureData: v.optional(v.string()),
  verifiedBy: v.optional(v.id("workers")),
  metadata: v.optional(v.any())
})
.index("by_asset", ["plantAssetId"])
.index("by_worker", ["workerId"])
.index("by_asset_worker", ["plantAssetId", "workerId"])
```

### Safety Incidents Tables

**incidentTemplates** (Incident report templates)
```typescript
defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("injury"),
    v.literal("near_miss"),
    v.literal("property_damage"),
    v.literal("environmental"),
    v.literal("other")
  ),
  fields: v.array(v.any()), // Custom form fields
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**incidentTemplateAssignments** (Template availability per project)
```typescript
defineTable({
  projectId: v.id("projects"),
  incidentTemplateId: v.id("incidentTemplates"),
  isDefault: v.optional(v.boolean()),
  notificationRecipients: v.optional(v.array(v.id("workers"))),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_project", ["projectId"])
.index("by_template", ["incidentTemplateId"])
.index("by_project_template", ["projectId", "incidentTemplateId"])
```

**incidentReports** (Incident records)
```typescript
defineTable({
  projectId: v.id("projects"),
  incidentTemplateId: v.optional(v.id("incidentTemplates")),
  incidentNumber: v.string(),
  title: v.string(),
  description: v.string(),
  category: v.union(
    v.literal("injury"),
    v.literal("near_miss"),
    v.literal("property_damage"),
    v.literal("environmental"),
    v.literal("other")
  ),
  severity: v.union(
    v.literal("minor"),
    v.literal("moderate"),
    v.literal("serious"),
    v.literal("critical")
  ),
  incidentDate: v.string(),
  location: v.optional(v.string()),
  reportedBy: v.id("workers"),
  involvedParties: v.optional(v.array(v.object({
    workerId: v.optional(v.id("workers")),
    name: v.string(),
    role: v.optional(v.string()),
    injuryType: v.optional(v.string())
  }))),
  witnesses: v.optional(v.array(v.string())),
  formData: v.optional(v.any()),
  status: v.union(
    v.literal("open"),
    v.literal("investigating"),
    v.literal("resolved"),
    v.literal("closed")
  ),
  investigationNotes: v.optional(v.string()),
  correctiveActions: v.optional(v.array(v.string())),
  photoIds: v.optional(v.array(v.id("mediaFiles"))),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_project_status", ["projectId", "status"])
.index("by_category", ["projectId", "category"])
.index("by_severity", ["projectId", "severity"])
```

### Safety Compliance Tables

**sdsLibrary** (Safety Data Sheets)
```typescript
defineTable({
  productName: v.string(),
  manufacturer: v.optional(v.string()),
  productCode: v.optional(v.string()),
  hazardClass: v.optional(v.string()),
  category: v.optional(v.string()),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_active", ["isActive"])
.index("by_product", ["productName"])
```

**sdsVersions**
```typescript
defineTable({
  sdsLibraryId: v.id("sdsLibrary"),
  versionNumber: v.string(),
  effectiveDate: v.string(),
  documentId: v.id("sourceDocuments"),
  isCurrent: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_library", ["sdsLibraryId"])
.index("by_current", ["sdsLibraryId", "isCurrent"])
```

**sdsProjectLinks**
```typescript
defineTable({
  projectId: v.id("projects"),
  sdsLibraryId: v.id("sdsLibrary"),
  quantity: v.optional(v.number()),
  storageLocation: v.optional(v.string()),
  addedBy: v.id("workers"),
  addedAt: v.string(),
  metadata: v.optional(v.any())
})
.index("by_project", ["projectId"])
.index("by_library", ["sdsLibraryId"])
.index("by_project_library", ["projectId", "sdsLibraryId"])
```

**sdsRequests**
```typescript
defineTable({
  projectId: v.id("projects"),
  productName: v.string(),
  manufacturer: v.optional(v.string()),
  requestedBy: v.id("workers"),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected")
  ),
  linkedSdsId: v.optional(v.id("sdsLibrary")),
  notes: v.optional(v.string()),
  createdAt: v.string(),
  resolvedAt: v.optional(v.string()),
  metadata: v.optional(v.any())
})
.index("by_project_status", ["projectId", "status"])
.index("by_requested", ["requestedBy"])
```

**registerEntries**
```typescript
defineTable({
  projectId: v.id("projects"),
  registerType: v.union(
    v.literal("hazard"),
    v.literal("risk"),
    v.literal("inspection"),
    v.literal("other")
  ),
  entryNumber: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  status: v.union(
    v.literal("open"),
    v.literal("active"),
    v.literal("closed")
  ),
  riskRating: v.optional(v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("extreme")
  )),
  controls: v.optional(v.array(v.string())),
  assignedTo: v.optional(v.id("workers")),
  reviewDate: v.optional(v.string()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project_type", ["projectId", "registerType"])
.index("by_status", ["projectId", "status"])
```

**certificationTypes**
```typescript
defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  code: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("license"),
    v.literal("ticket"),
    v.literal("training"),
    v.literal("medical"),
    v.literal("other")
  ),
  defaultValidityDays: v.optional(v.number()),
  isRequiredOrgwide: v.optional(v.boolean()),
  expiryWarningDays: v.optional(v.number()),
  isActive: v.boolean(),
  metadata: v.optional(v.any())
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```
- **Migration**: Added category, defaultValidityDays, isRequiredOrgwide, expiryWarningDays

**competencyRecords** (Worker certifications)
```typescript
defineTable({
  workerId: v.id("workers"),
  kind: v.union(
    v.literal("license"),
    v.literal("ticket"),
    v.literal("training"),
    v.literal("medical"),
    v.literal("other")
  ),
  ticketTypeCode: v.optional(v.string()),
  name: v.string(),
  licenseNumber: v.optional(v.string()),
  reference: v.optional(v.string()),
  issuer: v.optional(v.string()),
  issuingAuthority: v.optional(v.string()),
  stateOfIssue: v.optional(v.string()),
  issueDate: v.optional(v.string()),
  expiryDate: v.optional(v.string()),
  documentId: v.optional(v.id("sourceDocuments")),
  verificationStatus: v.union(
    v.literal("pending"),
    v.literal("verified"),
    v.literal("rejected"),
    v.literal("expired")
  ),
  verifiedBy: v.optional(v.id("workers")),
  verifiedAt: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),
  certificationTypeId: v.optional(v.id("certificationTypes")),
  frontPhotoId: v.optional(v.id("_storage")),
  backPhotoId: v.optional(v.id("_storage")),
  source: v.union(
    v.literal("manual"),
    v.literal("induction"),
    v.literal("upload")
  ),
  metadata: v.optional(v.any())
})
.index("by_worker", ["workerId"])
.index("by_verification", ["verificationStatus"])
.index("by_certType", ["certificationTypeId"])
```
- **Lifecycle**: pending → verified or rejected, with auto-expiry

**projectCertificationRequirements** (Required certs per project)
```typescript
defineTable({
  projectId: v.id("projects"),
  certificationTypeId: v.id("certificationTypes"),
  isRequired: v.boolean(),
  minimumLevel: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_project", ["projectId"])
.index("by_certType", ["certificationTypeId"])
```

**insuranceTypes** (Insurance/policy types)
```typescript
defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  code: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("liability"),
    v.literal("workers_comp"),
    v.literal("professional_indemnity"),
    v.literal("vehicle"),
    v.literal("other")
  ),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**projectInsuranceRequirements** (Required insurance per project)
```typescript
defineTable({
  projectId: v.id("projects"),
  insuranceTypeId: v.id("insuranceTypes"),
  minimumCoverage: v.optional(v.number()),
  isRequired: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_project", ["projectId"])
.index("by_insuranceType", ["insuranceTypeId"])
```

**insurancePolicies** (Org insurance policies)
```typescript
defineTable({
  orgId: v.id("orgs"),
  insuranceTypeId: v.id("insuranceTypes"),
  policyNumber: v.string(),
  provider: v.string(),
  coverageAmount: v.optional(v.number()),
  effectiveDate: v.string(),
  expiryDate: v.string(),
  documentId: v.optional(v.id("sourceDocuments")),
  status: v.union(
    v.literal("active"),
    v.literal("expired"),
    v.literal("cancelled")
  ),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_insuranceType", ["insuranceTypeId"])
.index("by_status", ["orgId", "status"])
.index("by_expiry", ["expiryDate"])
```

### Asset Management Tables

**assetRegisters** (Equipment/plant registers)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  name: v.string(),
  description: v.optional(v.string()),
  assetType: v.union(
    v.literal("plant"),
    v.literal("equipment"),
    v.literal("vehicle"),
    v.literal("tool"),
    v.literal("other")
  ),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_active", ["orgId", "isActive"])
```

**assets** (Individual asset records)
```typescript
defineTable({
  assetRegisterId: v.id("assetRegisters"),
  itemId: v.string(),
  name: v.string(),
  assetType: v.union(
    v.literal("plant"),
    v.literal("equipment"),
    v.literal("vehicle"),
    v.literal("tool"),
    v.literal("other")
  ),
  make: v.optional(v.string()),
  model: v.optional(v.string()),
  serialNumber: v.optional(v.string()),
  registrationNumber: v.optional(v.string()),
  status: v.union(
    v.literal("available"),
    v.literal("in_use"),
    v.literal("maintenance"),
    v.literal("retired")
  ),
  qrCode: v.optional(v.string()),
  purchaseDate: v.optional(v.string()),
  warrantyExpiry: v.optional(v.string()),
  lastServiceDate: v.optional(v.string()),
  nextServiceDue: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_register", ["assetRegisterId"])
.index("by_status", ["status"])
.index("by_qrCode", ["qrCode"])
```

**assetAllocations** (Bookings + assignments merged)
```typescript
defineTable({
  assetId: v.id("assets"),
  projectId: v.id("projects"),
  allocatedTo: v.optional(v.id("workers")),
  allocationType: v.union(
    v.literal("booking"),
    v.literal("assignment")
  ),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  notes: v.optional(v.string()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_asset", ["assetId"])
.index("by_project", ["projectId"])
.index("by_allocatedTo", ["allocatedTo"])
.index("by_status", ["status"])
```

**assetRequests** (Booking requests)
```typescript
defineTable({
  projectId: v.id("projects"),
  assetRegisterId: v.id("assetRegisters"),
  requestedBy: v.id("workers"),
  requestedDate: v.string(),
  requiredFrom: v.string(),
  requiredUntil: v.optional(v.string()),
  purpose: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("fulfilled")
  ),
  approvedBy: v.optional(v.id("workers")),
  approvedAt: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),
  fulfilledAssetId: v.optional(v.id("assets")),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_project", ["projectId"])
.index("by_requestedBy", ["requestedBy"])
.index("by_status", ["projectId", "status"])
```

**assetChecklistConfigs** (Prestart checklists merged)
```typescript
defineTable({
  assetRegisterId: v.id("assetRegisters"),
  checklistTemplateId: v.id("checklistTemplates"),
  frequency: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("per_use")
  ),
  isRequired: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_register", ["assetRegisterId"])
.index("by_template", ["checklistTemplateId"])
```

**assetServiceLogs** (Maintenance history)
```typescript
defineTable({
  assetId: v.id("assets"),
  serviceType: v.union(
    v.literal("inspection"),
    v.literal("maintenance"),
    v.literal("repair"),
    v.literal("calibration"),
    v.literal("other")
  ),
  serviceDate: v.string(),
  performedBy: v.optional(v.string()),
  description: v.optional(v.string()),
  cost: v.optional(v.number()),
  nextServiceDue: v.optional(v.string()),
  documentIds: v.optional(v.array(v.id("sourceDocuments"))),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_asset", ["assetId"])
.index("by_serviceDate", ["assetId", "serviceDate"])
```

### Asset Operations Tables

**prestartSubmissions** (Equipment prestart checks)
```typescript
defineTable({
  assetId: v.id("assets"),
  projectId: v.id("projects"),
  checklistInstanceId: v.optional(v.id("checklistInstances")),
  submittedBy: v.id("workers"),
  submittedAt: v.string(),
  passed: v.boolean(),
  failureReasons: v.optional(v.array(v.string())),
  defectIds: v.optional(v.array(v.id("defects"))),
  metadata: v.optional(v.any())
})
.index("by_asset", ["assetId"])
.index("by_project", ["projectId"])
.index("by_submittedBy", ["submittedBy"])
```

### Quality Checklists Tables

**checklistTemplates** (Dynamic builder with 16 field types)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  name: v.string(),
  description: v.optional(v.string()),
  scope: v.union(
    v.literal("site"),
    v.literal("plant"),
    v.literal("task"),
    v.literal("quality"),
    v.literal("other")
  ),
  sections: v.array(v.object({
    id: v.string(),
    title: v.string(),
    order: v.number(),
    fields: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("text"),
        v.literal("textarea"),
        v.literal("number"),
        v.literal("date"),
        v.literal("yesno"),
        v.literal("checkbox"),
        v.literal("select"),
        v.literal("multiselect"),
        v.literal("photo"),
        v.literal("signature"),
        v.literal("instruction"),
        v.literal("notes"),
        v.literal("action_trigger"),
        v.literal("attachment")
      ),
      label: v.string(),
      required: v.optional(v.boolean()),
      options: v.optional(v.array(v.string())),
      conditions: v.optional(v.array(v.object({
        dependsOn: v.string(),
        value: v.any(),
        action: v.union(v.literal("show"), v.literal("hide"))
      }))),
      order: v.number()
    }))
  })),
  items: v.optional(v.array(v.any())), // Legacy, deprecate
  isPlantInduction: v.optional(v.boolean()),
  plantRegisterId: v.optional(v.id("assetRegisters")),
  plantAllItemsInRegister: v.optional(v.boolean()),
  plantAssetIds: v.optional(v.array(v.id("assets"))),
  scoringEnabled: v.optional(v.boolean()),
  passingScore: v.optional(v.number()),
  isActive: v.boolean(),
  isSystemTemplate: v.optional(v.boolean()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_scope", ["orgId", "scope"])
.index("by_system", ["isSystemTemplate"])
```
- **Field Types**: text, textarea, number, date, yesno, checkbox, select, multiselect, photo, signature, instruction, notes, action_trigger, attachment
- **Conditional Logic**: Fields show/hide based on other field values

**checklistInstances**
```typescript
defineTable({
  projectId: v.id("projects"),
  checklistTemplateId: v.id("checklistTemplates"),
  assignedTo: v.optional(v.id("workers")),
  performedByWorkerId: v.optional(v.id("workers")),
  dueDate: v.optional(v.string()),
  sourceType: v.optional(v.union(
    v.literal("asset"),
    v.literal("itp"),
    v.literal("incident"),
    v.literal("defect"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),
  plantRegisterId: v.optional(v.id("assetRegisters")),
  plantAssetId: v.optional(v.id("assets")),
  plantBookingId: v.optional(v.string()), // Legacy
  performedAt: v.optional(v.string()),
  status: v.union(
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  completedAt: v.optional(v.string()),
  responses: v.any(), // Record<fieldId, value>
  linkedDefectIds: v.optional(v.array(v.id("defects"))),
  linkedActionIds: v.optional(v.array(v.id("actionItems"))),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project_template", ["projectId", "checklistTemplateId"])
.index("by_assignee", ["assignedTo"])
.index("by_status", ["projectId", "status"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_completed", ["completedAt"])
.index("by_plant", ["plantAssetId"])
```
- **Polymorphic Source**: Links to various sources via sourceType/sourceId
- **Response Storage**: Field-level responses in `responses` object

### Quality Defects Tables

**defects**
```typescript
defineTable({
  projectId: v.id("projects"),
  defectNumber: v.string(), // Auto-increment per project
  title: v.string(),
  description: v.optional(v.string()),
  category: v.union(
    v.literal("builder"),
    v.literal("client"),
    v.literal("safety"),
    v.literal("other")
  ),
  location: v.optional(v.string()),
  level: v.optional(v.string()),
  area: v.optional(v.string()),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  status: v.union(
    v.literal("open"),
    v.literal("in_progress"),
    v.literal("resolved"),
    v.literal("closed")
  ),
  assignedTo: v.optional(v.id("orgs")),
  assignedWorkerId: v.optional(v.id("workers")),
  dueDate: v.optional(v.string()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  resolvedAt: v.optional(v.string()),
  closedAt: v.optional(v.string()),
  sourceType: v.optional(v.union(
    v.literal("asset"),
    v.literal("checklist"),
    v.literal("incident"),
    v.literal("itp"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),
  assetId: v.optional(v.id("assets")),
  drawingId: v.optional(v.id("sourceDocuments")),
  comments: v.array(v.object({
    id: v.string(),
    workerId: v.id("workers"),
    comment: v.string(),
    createdAt: v.string()
  })),
  metadata: v.optional(v.any()),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_project_number", ["projectId", "defectNumber"])
.index("by_status", ["projectId", "status"])
.index("by_assignee", ["assignedTo"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_asset", ["assetId"])
```
- **Changes**: Embedded comments array (was separate defectComments table)
- **Lifecycle**: open → in_progress → resolved → closed

**defectPhotos** (Defect images)
```typescript
defineTable({
  defectId: v.id("defects"),
  photoId: v.id("mediaFiles"),
  caption: v.optional(v.string()),
  photoType: v.union(
    v.literal("initial"),
    v.literal("progress"),
    v.literal("resolved")
  ),
  order: v.optional(v.number()),
  createdAt: v.string()
})
.index("by_defect", ["defectId"])
.index("by_photo", ["photoId"])
```

**actionItems** (Polymorphic task tracking)
```typescript
defineTable({
  projectId: v.id("projects"),
  actionNumber: v.string(), // Auto-increment
  title: v.string(),
  description: v.optional(v.string()),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  status: v.union(
    v.literal("open"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  assignedTo: v.optional(v.id("orgs")),
  assignedWorkerId: v.optional(v.id("workers")),
  dueDate: v.optional(v.string()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  completedAt: v.optional(v.string()),
  sourceType: v.optional(v.union(
    v.literal("checklist"),
    v.literal("inspection"),
    v.literal("incident"),
    v.literal("defect"),
    v.literal("itp"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),
  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),
  shareCode: v.optional(v.string()),
  comments: v.array(v.object({
    id: v.string(),
    workerId: v.id("workers"),
    comment: v.string(),
    createdAt: v.string()
  })),
  metadata: v.optional(v.any()),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_status", ["projectId", "status"])
.index("by_assignee", ["assignedTo"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_shareCode", ["shareCode"])
.index("by_dueDate", ["dueDate"])
```
- **Changes**: Embedded comments array, added shareCode for public access

### Site Documents Tables

**sourceDocuments** (Master document storage)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  name: v.string(),
  fileType: v.optional(v.string()),
  storageId: v.optional(v.id("_storage")),
  url: v.optional(v.string()),
  category: v.optional(v.union(
    v.literal("drawing"),
    v.literal("specification"),
    v.literal("sds"),
    v.literal("policy"),
    v.literal("report"),
    v.literal("other")
  )),
  folderId: v.optional(v.id("documentFolders")),
  metadata: v.optional(v.any()),
  annotationData: v.optional(v.any()), // Embedded PDF annotations
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_folder", ["folderId"])
.index("by_category", ["projectId", "category"])
```

**documentEntityLinks** (Polymorphic document references)
```typescript
defineTable({
  documentId: v.id("sourceDocuments"),
  entityType: v.string(),
  entityId: v.string(),
  linkType: v.optional(v.union(
    v.literal("reference"),
    v.literal("attachment"),
    v.literal("related")
  )),
  createdAt: v.string(),
  createdBy: v.id("workers")
})
.index("by_document", ["documentId"])
.index("by_entity", ["entityType", "entityId"])
```

**documentFolders** (Hierarchical organization)
```typescript
defineTable({
  projectId: v.id("projects"),
  name: v.string(),
  parentFolderId: v.optional(v.id("documentFolders")),
  path: v.string(), // Hierarchical path
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  createdBy: v.id("workers")
})
.index("by_project", ["projectId"])
.index("by_parent", ["parentFolderId"])
```

**documentUploadLinks** (External upload access)
```typescript
defineTable({
  projectId: v.id("projects"),
  folderId: v.optional(v.id("documentFolders")),
  linkCode: v.string(),
  expiresAt: v.string(),
  maxUploads: v.optional(v.number()),
  uploadCount: v.number(),
  status: v.union(
    v.literal("active"),
    v.literal("expired"),
    v.literal("disabled")
  ),
  createdAt: v.string(),
  createdBy: v.id("workers")
})
.index("by_linkCode", ["linkCode"])
.index("by_project", ["projectId"])
.index("by_status", ["status", "expiresAt"])
```

### Site Operations Tables

**toolboxMeetings**
```typescript
defineTable({
  projectId: v.id("projects"),
  date: v.string(),
  topics: v.optional(v.array(v.string())),
  conductedBy: v.id("workers"),
  duration: v.optional(v.number()),
  notes: v.optional(v.string()),
  status: v.union(
    v.literal("scheduled"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project_date", ["projectId", "date"])
.index("by_status", ["projectId", "status"])
```

**toolboxAttendance**
```typescript
defineTable({
  toolboxMeetingId: v.id("toolboxMeetings"),
  workerId: v.id("workers"),
  signedAt: v.string(),
  signatureData: v.optional(v.string()),
  metadata: v.optional(v.any())
})
.index("by_meeting", ["toolboxMeetingId"])
.index("by_worker", ["workerId"])
```

**attendanceLogs**
```typescript
defineTable({
  projectId: v.id("projects"),
  workerId: v.id("workers"),
  date: v.string(), // ISO date
  signInTime: v.optional(v.string()), // ISO timestamp
  signOutTime: v.optional(v.string()), // ISO timestamp
  attendanceType: v.union(
    v.literal("sign_on"),
    v.literal("toolbox"),
    v.literal("manual")
  ),
  sourceId: v.optional(v.string()), // References sign-on config or toolbox meeting
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_project_date", ["projectId", "date"])
.index("by_worker_date", ["workerId", "date"])
.index("by_worker", ["workerId"])
```

**diaries** (Daily site diary)
```typescript
defineTable({
  projectId: v.id("projects"),
  date: v.string(), // ISO date
  weather: v.optional(v.string()),
  temperature: v.optional(v.string()),
  workSummary: v.optional(v.string()),
  issuesEncountered: v.optional(v.string()),
  visitorsOnSite: v.optional(v.array(v.string())),
  workersOnSite: v.optional(v.number()),
  photoIds: v.optional(v.array(v.id("mediaFiles"))),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project_date", ["projectId", "date"])
.index("by_createdBy", ["createdBy"])
```

**briefings** (Safety briefings)
```typescript
defineTable({
  projectId: v.id("projects"),
  title: v.string(),
  description: v.optional(v.string()),
  briefingType: v.union(
    v.literal("safety"),
    v.literal("toolbox"),
    v.literal("general"),
    v.literal("emergency")
  ),
  scheduledDate: v.string(),
  conductedBy: v.id("workers"),
  attendeeIds: v.optional(v.array(v.id("workers"))),
  attendeeCount: v.optional(v.number()),
  topics: v.optional(v.array(v.string())),
  status: v.union(
    v.literal("scheduled"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  completedAt: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project_date", ["projectId", "scheduledDate"])
.index("by_status", ["projectId", "status"])
```

**alerts** (Site notifications)
```typescript
defineTable({
  projectId: v.id("projects"),
  alertType: v.union(
    v.literal("expiry"),
    v.literal("safety"),
    v.literal("quality"),
    v.literal("deadline"),
    v.literal("other")
  ),
  severity: v.union(
    v.literal("info"),
    v.literal("warning"),
    v.literal("critical")
  ),
  title: v.string(),
  message: v.string(),
  entityType: v.optional(v.string()),
  entityId: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("acknowledged"),
    v.literal("resolved")
  ),
  acknowledgedBy: v.optional(v.id("workers")),
  acknowledgedAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  createdAt: v.string()
})
.index("by_project_status", ["projectId", "status"])
.index("by_severity", ["projectId", "severity"])
.index("by_entity", ["entityType", "entityId"])
```

**scheduledTasks**
```typescript
defineTable({
  projectId: v.id("projects"),
  phaseId: v.optional(v.id("schedulePhases")),
  title: v.string(),
  description: v.optional(v.string()),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  duration: v.optional(v.number()),
  progress: v.optional(v.number()),
  assignedTo: v.optional(v.id("orgs")),
  assignedWorkerId: v.optional(v.id("workers")),
  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  priority: v.optional(v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high")
  )),
  metadata: v.optional(v.any()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_phase", ["phaseId"])
.index("by_status", ["projectId", "status"])
.index("by_assignee", ["assignedTo"])
```

**scheduleDependencies** (Self-referencing task links)
```typescript
defineTable({
  taskId: v.id("scheduledTasks"),
  dependsOnTaskId: v.id("scheduledTasks"),
  dependencyType: v.union(
    v.literal("finish_to_start"),
    v.literal("start_to_start"),
    v.literal("finish_to_finish"),
    v.literal("start_to_finish")
  ),
  lagDays: v.optional(v.number()),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_task", ["taskId"])
.index("by_dependsOn", ["dependsOnTaskId"])
```

**schedulePhases**
```typescript
defineTable({
  projectId: v.id("projects"),
  name: v.string(),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  color: v.optional(v.string()),
  order: v.number(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
```

**scheduleShares** (External schedule access)
```typescript
defineTable({
  projectId: v.id("projects"),
  shareCode: v.string(),
  recipientOrgId: v.optional(v.id("orgs")),
  recipientEmail: v.optional(v.string()),
  accessLevel: v.union(
    v.literal("view"),
    v.literal("comment"),
    v.literal("confirm")
  ),
  expiresAt: v.optional(v.string()),
  confirmations: v.optional(v.array(v.object({
    orgId: v.id("orgs"),
    status: v.union(v.literal("pending"), v.literal("confirmed")),
    confirmedAt: v.optional(v.string()),
    confirmedByName: v.optional(v.string()),
    comments: v.optional(v.string())
  }))),
  status: v.union(
    v.literal("active"),
    v.literal("expired"),
    v.literal("revoked")
  ),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  metadata: v.optional(v.any())
})
.index("by_project", ["projectId"])
.index("by_shareCode", ["shareCode"])
.index("by_recipient", ["recipientOrgId"])
```

**signOnConfigs** (QR sign-on setup)
```typescript
defineTable({
  projectId: v.id("projects"),
  name: v.string(),
  qrCode: v.string(),
  isActive: v.boolean(),
  requireInduction: v.optional(v.boolean()),
  allowedInductionTypes: v.optional(v.array(v.id("inductionTypes"))),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_qrCode", ["qrCode"])
```

**prestartNotices**
```typescript
defineTable({
  projectId: v.id("projects"),
  title: v.string(),
  description: v.string(),
  noticeType: v.union(
    v.literal("safety"),
    v.literal("quality"),
    v.literal("environmental"),
    v.literal("general")
  ),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high")
  ),
  effectiveFrom: v.string(),
  effectiveUntil: v.optional(v.string()),
  isActive: v.boolean(),
  acknowledgedBy: v.optional(v.array(v.id("workers"))),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_active", ["projectId", "isActive"])
```

### Chief AI Tables

**aiRuns** (Claude SDK tracking)
```typescript
defineTable({
  executionId: v.id("executions"),
  runId: v.string(), // Claude SDK run ID
  status: v.union(
    v.literal("queued"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  tokensUsed: v.optional(v.number()),
  costUsd: v.optional(v.number()),
  error: v.optional(v.string()),
  startedAt: v.string(),
  completedAt: v.optional(v.string()),
  metadata: v.optional(v.any())
})
.index("by_execution", ["executionId"])
.index("by_status", ["status"])
```

**executions** (AI database operations with undo)
```typescript
defineTable({
  projectId: v.id("projects"),
  scope: v.union(
    v.literal("bootstrap"),
    v.literal("onboarding"),
    v.literal("ops_gap"),
    v.literal("variation"),
    v.literal("artifact"),
    v.literal("close_out"),
    v.literal("other")
  ),
  title: v.string(),
  summary: v.optional(v.string()),
  status: v.union(
    v.literal("applied"),
    v.literal("undone"),
    v.literal("partial")
  ),
  createdBy: v.union(v.literal("ai"), v.literal("admin")),
  createdByUserId: v.optional(v.id("workers")),
  createdAt: v.string(),
  undoneAt: v.optional(v.string()),
  undoneByUserId: v.optional(v.id("workers")),
  operations: v.array(v.object({
    opId: v.string(),
    kind: v.optional(v.string()),
    operation: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("call")
    ),
    targetTable: v.string(),
    targetId: v.optional(v.string()),
    createdId: v.optional(v.string()),
    deletedId: v.optional(v.string()),
    before: v.optional(v.any()), // Snapshot for undo
    patch: v.optional(v.any()),  // Delta applied
    ok: v.optional(v.boolean()),
    message: v.optional(v.string()),
    undoneAt: v.optional(v.string()),
    undoneByUserId: v.optional(v.id("workers"))
  })),
  metadata: v.optional(v.any())
})
.index("by_project_status", ["projectId", "status"])
.index("by_project_createdAt", ["projectId", "createdAt"])
.index("by_createdBy", ["createdBy"])
```
- **Undo System**: Full before/after snapshots for atomic rollback
- **Operations**: create (deletable), update (revert to before), delete (recreate with before)

### Communications Tables

**notifications** (System notifications)
```typescript
defineTable({
  workerId: v.id("workers"),
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  notificationType: v.union(
    v.literal("assignment"),
    v.literal("mention"),
    v.literal("approval"),
    v.literal("expiry"),
    v.literal("system"),
    v.literal("other")
  ),
  title: v.string(),
  message: v.string(),
  entityType: v.optional(v.string()),
  entityId: v.optional(v.string()),
  isRead: v.boolean(),
  readAt: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_worker", ["workerId"])
.index("by_worker_read", ["workerId", "isRead"])
.index("by_entity", ["entityType", "entityId"])
```

**notificationPreferences** (User notification settings)
```typescript
defineTable({
  workerId: v.id("workers"),
  channel: v.union(
    v.literal("email"),
    v.literal("sms"),
    v.literal("push")
  ),
  notificationType: v.string(),
  enabled: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_worker", ["workerId"])
.index("by_worker_channel", ["workerId", "channel"])
```

**communications** (Direct messages)
```typescript
defineTable({
  projectId: v.id("projects"),
  subject: v.optional(v.string()),
  message: v.string(),
  communicationType: v.union(
    v.literal("message"),
    v.literal("announcement"),
    v.literal("alert")
  ),
  priority: v.optional(v.union(
    v.literal("low"),
    v.literal("normal"),
    v.literal("high")
  )),
  senderId: v.id("workers"),
  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_project", ["projectId"])
.index("by_sender", ["senderId"])
```

**communicationRecipients** (Message recipients)
```typescript
defineTable({
  communicationId: v.id("communications"),
  recipientId: v.id("workers"),
  isRead: v.boolean(),
  readAt: v.optional(v.string()),
  metadata: v.optional(v.any())
})
.index("by_communication", ["communicationId"])
.index("by_recipient", ["recipientId"])
.index("by_recipient_read", ["recipientId", "isRead"])
```

**conversations** (Claude SDK session management)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  sessionId: v.string(), // Claude SDK session ID
  title: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("archived")
  ),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_session", ["sessionId"])
```
- **Replaces**: chatkitThreads (ChatKit-specific removed)

**conversationMessages** (Immutable message log)
```typescript
defineTable({
  conversationId: v.id("conversations"),
  role: v.union(
    v.literal("user"),
    v.literal("assistant"),
    v.literal("system")
  ),
  content: v.string(),
  toolCalls: v.optional(v.array(v.any())),
  toolResults: v.optional(v.array(v.any())),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_conversation", ["conversationId"])
.index("by_conversation_createdAt", ["conversationId", "createdAt"])
```
- **Replaces**: chatkitItems (ChatKit-specific removed)

## Consolidation Summary

**Current**: 97 tables → **Target**: 52 tables (-45, 46% reduction)

### Removed Tables
- `permitApplications` (deprecated legacy format)
- `chatkitThreads`, `chatkitItems` (replaced by conversations/conversationMessages)
- `defectComments`, `actionComments` (embedded into parent tables)
- `communicationAttachments` (embedded into communications)
- `pdfAnnotations` (embedded into sourceDocuments.annotationData)
- `assetActivityLogs`, `toolboxActivityLogs` (consolidated into activityLogs)
- `scheduleShareLinks`, `schedulePublishes`, `scheduleConfirmLinks`, `scheduleTaskConfirmations` (merged into scheduleShares)

### Merged Tables
- `assetBookings` + `assetAssignments` → `assetAllocations`
- `assetChecklists` + `prestartTemplates` → `assetChecklistConfigs`
- `assetBookingRequests` → `assetRequests` (renamed)

### Field Cleanup
- **workers**: Removed `isActive` (use status enum), `trade` string (use tradeId FK), `identifier` field
- **assets**: Removed `category`/`identifier` duplicates, `isActive` (use status enum)
- **workPackages**: Made `orgId` required, removed `sortOrder`
- **swmsDocuments**: Removed 10+ legacy fields after data migration
- **inductionTypes**: Removed `validityMonths` (use validityDays only)

## Validation Rules

### Required Field Patterns
```typescript
// Always required
orgId: v.id("orgs")           // Org-level tables
projectId: v.id("projects")   // Project-level tables
createdAt: v.string()         // ISO 8601 timestamp
status: v.union(...)          // Most tables with lifecycle

// Conditional required
createdBy: v.id("workers")    // User-initiated actions
```

### Auto-Populated Fields
```typescript
// MCP server auto-injects
projectId   // From context
orgId       // From context
createdAt   // Current timestamp
createdBy   // From context userId
_id         // Convex auto-generated
```

### Enum Validation
All status/category/type fields use strict enums:
```typescript
// ✅ Correct
status: v.union(v.literal("open"), v.literal("closed"))

// ❌ Wrong
status: v.string() // No validation
```

### Foreign Key Validation
```typescript
// ✅ Correct - type-safe
assignedTo: v.id("workers")

// ❌ Wrong - no type safety
assignedTo: v.string()
```

## Performance Optimization

### Index Strategy
1. **Always index projectId**: Every project-scoped table has `by_project` index
2. **Composite for filters**: Common filter combinations (projectId + status)
3. **Unique constraints**: Compound indexes for uniqueness (by_project_worker)
4. **Public access**: QR/share codes always indexed

### Query Patterns
```typescript
// ✅ Efficient - uses index
ctx.db.query("defects")
  .withIndex("by_project_status",
    q => q.eq("projectId", projectId).eq("status", "open"))

// ❌ Inefficient - full table scan
ctx.db.query("defects")
  .filter(q => q.eq(q.field("projectId"), projectId))
```

### Subscription Management
- **Scoped subscriptions**: Always filter by projectId
- **Limit collections**: Cap at first N items for DTOs
- **Avoid global**: Never subscribe to entire tables

## Security & Scope Enforcement

### Scope Injection Points
1. **MCP Server (Primary)**: Auto-injects projectId/orgId on reads, validates on writes
2. **Convex Indexes**: by_project ensures data isolation
3. **UI Layer**: Secondary validation (NOT security boundary)

### Cross-Project Protections
- Agent **cannot** read data from other projects (MCP blocks)
- Agent **cannot** write to other projects (MCP validates)
- Agent **cannot** assign workers from other projects (validation)
- Agent **cannot** reference entities from other projects (FK checks)

### Validation in Mutations
```typescript
// Standard mutation pattern
export const create = mutation({
  args: { projectId: v.id("projects"), ... },
  handler: async (ctx, args) => {
    // 1. Validate project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // 2. Validate user has access
    // (Auth system checks membership)

    // 3. Validate related entities in same project
    if (args.assignedTo) {
      const worker = await ctx.db.get(args.assignedTo);
      if (worker.projectId !== args.projectId) {
        throw new Error("Worker not in project");
      }
    }

    // 4. Insert with auto-populated fields
    const id = await ctx.db.insert("defects", {
      ...args,
      createdAt: new Date().toISOString(),
      createdBy: ctx.userId
    });

    return id;
  }
});
```

## Migration Notes

### Schema Changes Summary
See individual table specifications above for detailed migration mappings.

**Key Migrations:**
- Workers: `isActive` boolean → `status` enum, `trade` string → `tradeId` FK
- Assets: Consolidate `category`/`assetType`, `identifier`/`itemId`, `isActive`/`status`
- Permits: `permitNumber` now REQUIRED, add lifecycle tracking fields
- Inductions: Add `completionId`, use `createdBy` not `invitedByWorkerId`
- Incidents: Simplify involved parties structure

### Migration Phases
1. **Remove Deprecated**: DROP old tables (permitApplications, ChatKit tables)
2. **Field Cleanup**: Remove redundant fields, migrate data
3. **Merge Comments**: Embed comments into parent tables
4. **Consolidate Assets**: Merge bookings+assignments, checklists+prestarts
5. **Consolidate Operations**: Merge schedule tables, activity logs
6. **Replace ChatKit**: Migrate to conversations/conversationMessages

## Additional Tables (Not Detailed Above)

### Site Operations
- `scheduleDependencies`, `schedulePhases`, `signOnConfigs`, `prestartNotices`, `alerts`

### Documents
- `documentFolders`, `documentUploadLinks`, `documentEntityLinks`

### Inductions
- `inductionInvites`, `plantInductionCompletions`

### Permits
- `permitTypeAssignments`

### Incidents
- `incidentTemplateAssignments`

### Assets
- `assetRegisters`, `prestartSubmissions`

### Communications
- `notificationPreferences`, `communicationRecipients`

### Supporting Tables

**mediaFiles** (File storage references)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  storageId: v.id("_storage"),
  fileName: v.string(),
  fileType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
  linkedEntityType: v.optional(v.string()),
  linkedEntityId: v.optional(v.string()),
  metadata: v.optional(v.any()),
  uploadedBy: v.id("workers"),
  createdAt: v.string()
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_linked", ["linkedEntityType", "linkedEntityId"])
```

**dashboards** (Custom dashboard layouts)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  name: v.string(),
  layout: v.array(v.any()), // Widget layout config
  isDefault: v.optional(v.boolean()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
```

**dashboardWidgets** (Dashboard components)
```typescript
defineTable({
  dashboardId: v.id("dashboards"),
  widgetType: v.string(), // "chart", "metric", "list", "calendar"
  config: v.any(), // Widget-specific config
  position: v.object({
    x: v.number(),
    y: v.number(),
    w: v.number(),
    h: v.number()
  }),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_dashboard", ["dashboardId"])
```

**activityLogs** (Audit trail)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  entityType: v.string(),
  entityId: v.string(),
  action: v.union(
    v.literal("created"),
    v.literal("updated"),
    v.literal("deleted"),
    v.literal("signed"),
    v.literal("approved"),
    v.literal("rejected")
  ),
  actorId: v.id("workers"),
  changes: v.optional(v.any()),
  metadata: v.optional(v.any()),
  createdAt: v.string()
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_entity", ["entityType", "entityId"])
.index("by_actor", ["actorId"])
```

**workPackages** (Work breakdown structure)
```typescript
defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  code: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  parentId: v.optional(v.id("workPackages")),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.optional(v.string())
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_parent", ["parentId"])
.index("by_code", ["code"])
```
