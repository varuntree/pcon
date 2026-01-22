# 04: Database Schema Specification

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-01-21
**Owner:** Migration Team

---

## 1. Purpose & Scope

### What This Document Covers

This specification defines the **complete simplified database schema** for PRJ Construction rebuilt on Convex.

**Includes:**
- All 52 tables (down from 97) with complete field definitions
- All indexes with performance rationale
- Relationship patterns and foreign key conventions
- Migration path from current 97-table schema
- Field-level consolidations and cleanup
- Convex-specific schema patterns

**Does NOT Include:**
- Business logic (see 03-domain-model.md)
- API implementations (see backend specs)
- UI patterns (see 06-ui-system.md)
- AI tool definitions (see 05-ai-system.md)

---

## 2. Overview

### Simplification Summary

| Metric | Current | Target | Change |
|--------|---------|--------|--------|
| **Total Tables** | 97 | 52 | -45 (-46%) |
| Core/Org | 10 | 8 | -2 |
| SWMS | 4 | 4 | 0 (unchanged) |
| Inductions | 4 | 4 | 0 (unchanged) |
| Quality | 7 | 5 | -2 |
| Assets | 10 | 6 | -4 |
| Safety | 11 | 9 | -2 |
| Operations | 13 | 8 | -5 |
| AI/System | 10 | 4 | -6 |
| Documents | 6 | 5 | -1 |
| Cross-Cutting | 6 | 4 | -2 |
| Supporting | 16 | 13 | -3 |

### Design Principles

1. **Preserve Critical Complexity:** SWMS and checklists kept as-is (legal compliance)
2. **Remove Redundancy:** Merge duplicate tables (bookings + assignments → allocations)
3. **Clean Legacy:** Remove deprecated tables (permitApplications, ChatKit tables)
4. **Standardize Patterns:** Consistent status enums, naming, relationships
5. **Convex Native:** Use Convex schema patterns (indexes, optional fields)

---

## 3. Core Concepts

### Concept 1: Convex Schema Patterns

**DefineTable + Validators:**
```typescript
import { defineTable } from "convex/server";
import { v } from "convex/values";

// Standard pattern
tableName: defineTable({
  // Required field
  name: v.string(),

  // Optional field
  description: v.optional(v.string()),

  // Foreign key
  projectId: v.id("projects"),

  // Enum using union
  status: v.union(
    v.literal("draft"),
    v.literal("active"),
    v.literal("archived")
  ),

  // Array of strings
  tags: v.array(v.string()),

  // Array of objects
  items: v.array(v.object({
    id: v.string(),
    value: v.any()
  })),

  // Flexible field for extensibility
  metadata: v.optional(v.any()),

  // ISO timestamps
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_status", ["projectId", "status"])
```

**Key Patterns:**
- Use `v.id("tableName")` for foreign keys (type-safe)
- Use `v.optional()` for nullable fields
- Use `v.union()` for enums
- Use `v.any()` sparingly (metadata, complex objects)
- Always include indexes for common queries

---

### Concept 2: Org → Project → Entity Hierarchy

**Three-Tier Scoping:**

```
orgs (root)
  ├── orgId references (templates, workers, configs)
  └── projects (primary scope)
      └── projectId references (all operations)
```

**Scoping Rules:**
1. **Org-level:** Templates, types, master data (reusable across projects)
2. **Project-level:** Instances, operations, daily work (project-specific)
3. **Optional dual-scope:** Some entities support both (documents, workers)

**Schema Implementation:**
- All org-level tables: `orgId: v.id("orgs")` (required)
- All project-level tables: `projectId: v.id("projects")` (required)
- Dual-scope: Both fields with `projectId: v.optional(v.id("projects"))`

---

### Concept 3: Template/Instance Pattern

**Reusable templates instantiated per project:**

| Template | Instance | Link | Purpose |
|----------|----------|------|---------|
| inductionTypes | inductionCompletions | inductionTypeId | Worker training |
| checklistTemplates | checklistInstances | checklistTemplateId | Dynamic inspections |
| swmsTemplates | swmsDocuments | templateId | Safety docs |
| prestartTemplates | prestartSubmissions | prestartTemplateId | Asset checks |
| permitTypes | permitInstances | permitTypeId | Work permits |
| certificationTypes | competencyRecords | certificationTypeId | Worker certs |

**Schema Pattern:**
```typescript
// Template (org-level)
templates: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  config: v.any(), // Template structure
  status: v.union(v.literal("draft"), v.literal("published")),
})
.index("by_org", ["orgId"])

// Instance (project-level)
instances: defineTable({
  projectId: v.id("projects"),
  templateId: v.id("templates"),
  responses: v.any(), // User input
  status: v.union(v.literal("in_progress"), v.literal("completed")),
})
.index("by_template", ["templateId"])
.index("by_project", ["projectId"])
```

---

### Concept 4: Polymorphic References

**Flexible entity linking without explicit FKs:**

**Pattern:** `sourceType` + `sourceId`

```typescript
{
  sourceType: v.union(
    v.literal("asset"),
    v.literal("incident"),
    v.literal("defect")
  ),
  sourceId: v.string(), // ID of source entity
}
```

**Used By:**
- `checklistInstances`: Checklists triggered by various sources
- `defects`: Defects from checklists, incidents, manual entry
- `actionItems`: Actions from multiple sources
- `comments`: Comments on any entity

**Benefits:**
- No schema changes when adding new source types
- Flexible cross-module linking
- Simplified queries (single pattern)

**Tradeoffs:**
- No FK constraints (must validate in code)
- Less type safety

---

## 4. Detailed Specification

### 4.1 Schema Statistics (Target State)

| Domain | Tables | Fields (avg) | Indexes (total) | Key Changes |
|--------|--------|--------------|-----------------|-------------|
| Core/Org | 8 | 12 | 15 | -2 (removed insurancePolicies duplicate, workPackages cleanup) |
| SWMS | 4 | 35 | 8 | 0 (unchanged - legal compliance) |
| Inductions | 4 | 22 | 12 | 0 (unchanged - well-designed) |
| Quality | 5 | 16 | 14 | -2 (merged comments into parents) |
| Assets | 6 | 14 | 16 | -4 (merged bookings + assignments, checklists + prestarts) |
| Safety | 9 | 18 | 20 | -2 (removed permitApplications legacy, consolidated types) |
| Operations | 8 | 15 | 18 | -5 (merged schedule flow, unified activity logs) |
| AI/System | 4 | 12 | 8 | -6 (removed ChatKit, simplified conversations) |
| Documents | 5 | 10 | 12 | -1 (merged pdfAnnotations) |
| Cross-Cutting | 4 | 8 | 10 | -2 (merged communications attachments) |
| Supporting | 13 | 10 | 18 | -3 (cleaned up various small tables) |
| **TOTAL** | **52** | **14 avg** | **151** | **-45 tables** |

---

### 4.2 Consolidation Summary

Complete list of schema changes from current to target:

| Action | From | To | Rationale |
|--------|------|----|-----------|
| **REMOVE** | permitApplications | - | Deprecated legacy format, replaced by permitInstances |
| **REMOVE** | chatkitThreads | - | OpenAI ChatKit specific, replaced by conversations |
| **REMOVE** | chatkitItems | - | OpenAI ChatKit specific, replaced by conversationMessages |
| **REMOVE** | defectComments | - | Merged into defects.comments[] array |
| **REMOVE** | actionComments | - | Merged into actionItems.comments[] array |
| **REMOVE** | communicationAttachments | - | Merged into communications.attachmentIds[] array |
| **REMOVE** | pdfAnnotations | - | Merged into sourceDocuments.annotationData field |
| **REMOVE** | assetActivityLogs | - | Merged into unified activityLogs table |
| **REMOVE** | toolboxActivityLogs | - | Merged into unified activityLogs table |
| **REMOVE** | scheduleShareLinks | - | Merged into unified scheduleShares table |
| **REMOVE** | schedulePublishes | - | Merged into unified scheduleShares table |
| **REMOVE** | scheduleConfirmLinks | - | Merged into unified scheduleShares table |
| **REMOVE** | scheduleTaskConfirmations | - | Embedded into scheduledTasks.confirmations[] |
| **MERGE** | assetBookings + assetAssignments | assetAllocations | Both track "who has asset", unified with type field |
| **MERGE** | assetChecklists + prestartTemplates | assetChecklistConfigs | Both recurring check configs, unified with purpose field |
| **RENAME** | assetBookingRequests | assetRequests | Shorter, clearer name |
| **ADD** | - | conversations | Generic Claude SDK conversation threads |
| **ADD** | - | conversationMessages | Generic conversation messages |
| **ADD** | - | activityLogs | Unified audit trail across all entities |
| **ADD** | - | assetAllocations | NEW: Unified bookings + assignments |
| **ADD** | - | assetChecklistConfigs | NEW: Unified inspection + prestart config |
| **ADD** | - | scheduleShares | NEW: Unified schedule sharing |
| **CLEAN** | workers | - | Remove isActive (use status), trade → tradeId FK |
| **CLEAN** | assets | - | Remove category (use assetType), identifier (use itemId) |
| **CLEAN** | workPackages | - | Make orgId required, remove sortOrder legacy |
| **CLEAN** | swmsDocuments | - | Remove 10+ legacy fields after data migration |
| **CLEAN** | inductionTypes | - | Remove validityMonths (use validityDays only) |

**Net Result:** 97 tables → 52 tables (-45, 46% reduction)

---

### 4.3 Core Tables (8 tables)

#### orgs

**Purpose:** Root organization entity - contractors, clients, suppliers, regulators

```typescript
orgs: defineTable({
  name: v.string(),
  abn: v.optional(v.string()), // Australian Business Number
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
  updatedAt: v.string(),
})
.index("by_kind", ["kind"])
```


**Migration Note:** Current source schema missing timestamp fields. Add in migration:
- createdAt: v.string()
- updatedAt: v.string()


**Indexes:**
- `by_kind`: Filter orgs by type (e.g., all subcontractors)

**Relationships:**
- Children: projects, workers, templates (inductionTypes, permitTypes, etc.)
- No parent (root entity)

**Operations:** create, update, list, get

**Lifecycle:** No status field - orgs always active

---

#### projects

**Purpose:** Construction projects - primary scoping entity

```typescript
projects: defineTable({
  orgId: v.id("orgs"),
  clientOrgId: v.optional(v.id("orgs")),
  name: v.string(),
  code: v.optional(v.string()),
  address: v.optional(v.string()),
  value: v.optional(v.number()), // Project value in currency
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived")
  ),
  startDate: v.optional(v.string()), // ISO date
  endDate: v.optional(v.string()), // ISO date
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_status", ["orgId", "status"])
.index("by_client", ["clientOrgId"])
```


**Missing Indexes:** 
- `by_status` compound index for filtering projects by status within org (critical for dashboard queries)
- `by_client` for listing all projects for a client organization


**Indexes:**
- `by_org`: List all projects for organization
- `by_status`: Filter projects by status within org
- `by_client`: List projects for client org

**Relationships:**
- Parent: orgs (orgId, clientOrgId)
- Children: Virtually all project-scoped tables

**Operations:** create, update, archive, clone, list, get, getStats

**Lifecycle:** `planning → active → completed → archived`

---

#### trades

**Purpose:** Master list of construction trades/disciplines

```typescript
trades: defineTable({
  code: v.string(), // Short code: "CARP", "ELEC"
  name: v.string(), // Full name: "Carpentry", "Electrical"
  description: v.optional(v.string()),
  isActive: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_code", ["code"])
.index("by_active", ["isActive"])
```


**Missing Index:** `by_active` for efficiently filtering active vs inactive trades in dropdowns


**Indexes:**
- `by_code`: Lookup by code
- `by_active`: Filter active trades

**Relationships:**
- Referenced by: workPackages, workers
- No parent (master data)

**Operations:** create, update, list, get

**Lifecycle:** Active/inactive toggle

---

#### workPackages

**Purpose:** Work subdivisions within projects (aligned to trades/phases)

```typescript
workPackages: defineTable({
  orgId: v.id("orgs"), // REQUIRED (was optional legacy)
  projectId: v.id("projects"),
  name: v.string(),
  description: v.optional(v.string()),
  status: v.optional(v.union(
    v.literal("planned"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived")
  )),
  tradeId: v.optional(v.id("trades")),
  phaseId: v.optional(v.string()), // String reference (external system)
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_org", ["orgId"])
.index("by_project_phase", ["projectId", "phaseId"])
.index("by_trade", ["tradeId"])
```

**Source Inconsistency:**
- sortOrder field still exists in source with legacy comment
- Spec states this should be removed

**Migration:** Remove sortOrder, use createdAt for ordering or add explicit order field if needed


**Changes from current:**
- `orgId` now required (was optional "for legacy")
- Removed `sortOrder` (use createdAt instead)

**Indexes:**
- `by_project`: List packages for project
- `by_org`: Org-level package view
- `by_project_phase`: Filter by phase
- `by_trade`: Filter by trade

**Relationships:**
- Parent: projects, orgs, trades (optional)
- No children (organizational container)

**Operations:** create, update, list, get

**Lifecycle:** `planned → active → completed → archived`

---

#### workers

**Purpose:** All site personnel - employees, subcontractors

```typescript
workers: defineTable({
  orgId: v.id("orgs"), // Employer organization
  fullName: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  role: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("inactive")
  ),
  tradeId: v.optional(v.id("trades")), // CHANGED: was string, now FK
  employer: v.optional(v.string()), // Employer name (string, can differ from org)
  avatarId: v.optional(v.id("mediaFiles")),

  // Emergency contact
  emergencyContactName: v.optional(v.string()),
  emergencyContactPhone: v.optional(v.string()),
  emergencyContactRelationship: v.optional(v.string()),

  // Personal details
  dateOfBirth: v.optional(v.string()), // ISO date
  address: v.optional(v.string()),

  // Medical
  allergies: v.optional(v.string()),
  medicalConditions: v.optional(v.string()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_email", ["email"])
.index("by_status", ["orgId", "status"])
.index("by_trade", ["tradeId"])
```


**Field Migration Notes:**
- Source has `trade` as optional string, spec requires FK `tradeId: v.id("trades")`. Migration: map trade string → tradeId FK lookup
- Source has `isActive` boolean marked as legacy. Spec removes it (use status enum). Migration: map isActive=false → status='inactive'
- Source has `status` as optional, spec shows as required. Document default value if migrating workers without status


**Changes from current:**
- Removed `isActive` boolean (redundant with status enum)
- Changed `trade` from string to `tradeId: v.id("trades")` FK
- Removed `identifier` field (redundant)

**Indexes:**
- `by_org`: List workers for org
- `by_email`: Lookup by email
- `by_status`: Filter by status within org
- `by_trade`: Filter by trade

**Relationships:**
- Parent: orgs, trades (optional), mediaFiles (avatar)
- Children: workerAssignments, competencyRecords, inductionCompletions, swmsSignatures, many more

**Operations:** create, update, list, get, getByEmail

**Lifecycle:** `pending → active → inactive`

---

#### workerAssignments

**Purpose:** Junction table linking workers to projects

```typescript
workerAssignments: defineTable({
  workerId: v.id("workers"),
  projectId: v.id("projects"),
  role: v.optional(v.string()), // Project-specific role
  createdAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_worker", ["workerId"])
.index("by_project_worker", ["projectId", "workerId"]) // Unique check
```

**Missing Index:** `by_project_worker` compound index critical for:
- Preventing duplicate worker assignments to same project
- Efficient uniqueness check before insert
- Query optimization


**Indexes:**
- `by_project`: List workers on project
- `by_worker`: List projects for worker
- `by_project_worker`: Prevent duplicate assignments

**Relationships:**
- Parent: workers, projects
- No children (junction table)

**Operations:** create, delete, listByProject, listByWorker

**Lifecycle:** Existence = active assignment

---

#### assetRegisters

**Purpose:** Asset category containers (e.g., "Plant & Equipment", "Vehicles")

```typescript
assetRegisters: defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")), // Optional: org-level or project-level
  name: v.string(),
  description: v.optional(v.string()),
  assetType: v.optional(v.union(
    v.literal("plant"),
    v.literal("equipment"),
    v.literal("vehicle"),
    v.literal("tool"),
    v.literal("other")
  )),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
```

**Source Field Differences:**
- Source uses `category` field (not `assetType`)
- Source includes 'safety' as category option (not in spec)
- Source has `isActive` field (spec says registers permanent)

**Migration:**
- Rename category → assetType
- Map 'safety' category to 'equipment' or 'other'
- Remove isActive (or document as soft-delete mechanism if needed)


**Indexes:**
- `by_org`: List registers for org
- `by_project`: List registers for project

**Relationships:**
- Parent: orgs, projects (optional)
- Children: assets

**Operations:** create, update, list, get

**Lifecycle:** No status - registers permanent

---


---


#### competencyRecords

**Purpose:** Worker certifications, licenses, tickets, medical clearances

```typescript
competencyRecords: defineTable({
  workerId: v.id('workers'),
  kind: v.union(
    v.literal('license'),
    v.literal('ticket'),
    v.literal('training'),
    v.literal('medical'),
    v.literal('other')
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
  documentId: v.optional(v.id('sourceDocuments')),
  verificationStatus: v.optional(v.union(
    v.literal('pending'),
    v.literal('verified'),
    v.literal('rejected'),
    v.literal('expired')
  )),
  verifiedBy: v.optional(v.id('workers')),
  verifiedAt: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),
  certificationTypeId: v.optional(v.id('certificationTypes')),
  frontPhotoId: v.optional(v.id('_storage')),
  backPhotoId: v.optional(v.id('_storage')),
  source: v.optional(v.union(
    v.literal('manual'),
    v.literal('induction'),
    v.literal('upload')
  )),
  metadata: v.optional(v.any()),
})
.index('by_worker', ['workerId'])
.index('by_verification', ['verificationStatus'])
.index('by_certType', ['certificationTypeId'])
```

**Indexes:**
- `by_worker`: Worker's certifications
- `by_verification`: Filter by verification status
- `by_certType`: Certifications of specific type

**Relationships:**
- Parent: workers, certificationTypes
- No children

**Operations:** create, verify, reject, expire, list

**Lifecycle:** `pending → verified` or `rejected`, with auto-expiry

**Migration Note:** This table exists in source (convex/schema.ts:191-228) but was missing from spec.

#### assets

**Purpose:** Physical assets - plant, equipment, vehicles, tools

```typescript
assets: defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  registerId: v.id("assetRegisters"),
  itemId: v.string(), // Auto-generated unique ID
  assetType: v.union(
    v.literal("plant"),
    v.literal("equipment"),
    v.literal("vehicle"),
    v.literal("tool"),
    v.literal("other")
  ),
  name: v.string(),
  description: v.optional(v.string()),
  make: v.optional(v.string()),
  model: v.optional(v.string()),
  serialNumber: v.optional(v.string()),
  registrationNumber: v.optional(v.string()), // For vehicles
  purchaseDate: v.optional(v.string()), // ISO date
  imageId: v.optional(v.id("mediaFiles")),
  qrCode: v.optional(v.string()), // For QR scanning

  // Status
  status: v.union(
    v.literal("available"),
    v.literal("in_use"),
    v.literal("maintenance"),
    v.literal("retired")
  ),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_register", ["registerId"])
.index("by_qr", ["qrCode"])
.index("by_itemId", ["itemId"])
```


**Source Field Additions (not in spec):**
- `rego`: v.optional(v.string()) - Vehicle registration (called registrationNumber in spec)
- `vin`: v.optional(v.string()) - Vehicle Identification Number
- `year`: v.optional(v.number()) - Year of manufacture
- `odometerKm`: v.optional(v.number()) - Current odometer reading (km)
- `odometerHours`: v.optional(v.number()) - Current hours reading
- `lastPrestartAt`: v.optional(v.string()) - Last prestart completion timestamp

**Status Enum Mismatch:**
Source has 6 values: active|available|assigned|maintenance|inactive|disposed
Spec has 4 values: available|in_use|maintenance|retired
Migration mapping: assigned→in_use, active→available, inactive/disposed→retired

**Field Duplication (Technical Debt):**
- Source has BOTH `category` and `assetType` (same enum values)
- Source has BOTH `identifier` and `itemId`
- Source has BOTH `status` enum AND `isActive` boolean
Migration: consolidate duplicates, backfill missing values


**Changes from current:**
- Removed `category` field (redundant with assetType)
- Removed `identifier` field (use itemId)
- Removed `isActive` field (use status enum)

**Indexes:**
- `by_org`: List assets for org
- `by_project`: List assets for project
- `by_register`: List assets in register
- `by_qr`: QR code lookup
- `by_itemId`: Unique item lookup

**Relationships:**
- Parent: orgs, projects (optional), assetRegisters, mediaFiles (image)
- Children: assetAllocations, assetChecklistConfigs, prestartSubmissions, assetServiceLogs, activityLogs

**Operations:** create, update, list, get, getByQR, getByItemId

**Lifecycle:** `available → in_use → maintenance → retired`

---

### 4.4 SWMS Tables (4 tables - UNCHANGED)

**Critical Note:** SWMS tables preserved exactly as-is for legal WHS compliance. Every field critical.

#### swmsTemplates

**Purpose:** Reusable SWMS templates

```typescript
swmsTemplates: defineTable({
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
    content: v.any(), // Section-specific structure
    order: v.number(),
  })),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived")
  ),
  version: v.number(),
  createdBy: v.optional(v.id("workers")),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_status", ["orgId", "status"])
```

**Indexes:**
- `by_org`: List templates for org
- `by_status`: Filter by status

**Relationships:**
- Parent: orgs, workers (creator)
- Children: swmsDocuments

**Operations:** create, update, publish, archive, clone, list, get

**Lifecycle:** `draft → published → archived`

---

#### swmsDocuments

**Purpose:** Project-specific SWMS instances (60+ fields, 12 section types)

```typescript
swmsDocuments: defineTable({
  projectId: v.id("projects"),
  templateId: v.optional(v.id("swmsTemplates")),
  swmsNumber: v.optional(v.string()), // Auto: SWMS-001
  title: v.string(),
  revision: v.number(),
  status: v.union(
    v.literal("draft"),
    v.literal("pending_review"),
    v.literal("approved"),
    v.literal("expired"),
    v.literal("archived")
  ),

  // Approval
  createdBy: v.optional(v.id("workers")),
  approvedBy: v.optional(v.id("workers")),
  approvedAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()),

  // Public access
  shareCode: v.optional(v.string()),

  // Content sections (40+ fields total)
  tasks: v.optional(v.array(v.object({
    description: v.string(),
    hazards: v.array(v.object({
      hazard: v.string(),
      risk: v.string(),
      controls: v.array(v.string()),
    })),
  }))),

  hrcwActivities: v.optional(v.array(v.string())), // High Risk Construction Work
  hazardousMaterials: v.optional(v.array(v.object({
    material: v.string(),
    sdsAvailable: v.boolean(),
    controls: v.array(v.string()),
  }))),

  plantEquipment: v.optional(v.array(v.object({
    name: v.string(),
    licenseRequired: v.boolean(),
    inspectionRequired: v.boolean(),
  }))),

  ppeRequirements: v.optional(v.array(v.string())),
  trainingRequirements: v.optional(v.array(v.string())),
  permitsRequired: v.optional(v.array(v.string())),

  legislation: v.optional(v.object({
    acts: v.array(v.string()),
    standards: v.array(v.string()),
    codes: v.array(v.string()),
  })),

  emergencyProcedures: v.optional(v.string()),
  supervision: v.optional(v.string()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_status", ["projectId", "status"])
.index("by_shareCode", ["shareCode"])
.index("by_template", ["templateId"])
```

**Changes from current:**
- Removed 10+ legacy fields (siteAddress, startDate, etc.) after data migration
- Kept all compliance-critical fields

**Indexes:**
- `by_project`: List SWMS for project
- `by_status`: Filter by status
- `by_shareCode`: Public access lookup
- `by_template`: Find instances from template

**Relationships:**
- Parent: projects, swmsTemplates (optional), workers
- Children: swmsSignatures, swmsAssignments

**Operations:** create, update, submit, approve, reject, expire, archive, list, get, getByShareCode

**Lifecycle:** `draft → pending_review → approved → expired → archived`

---

#### swmsSignatures

**Purpose:** Digital signatures on SWMS (internal workers + external)

```typescript
swmsSignatures: defineTable({
  swmsDocumentId: v.id("swmsDocuments"),
  workerId: v.optional(v.id("workers")), // Null for external
  workerName: v.string(),
  workerCompany: v.optional(v.string()),
  signatureType: v.union(
    v.literal("internal"), // Registered worker
    v.literal("external")  // Public access
  ),
  signatureData: v.string(), // Base64 PNG
  signedAt: v.string(),
  metadata: v.optional(v.any()),
})
.index("by_swms", ["swmsDocumentId"])
.index("by_worker", ["workerId"])
```

**Indexes:**
- `by_swms`: List signatures for SWMS
- `by_worker`: List SWMS signed by worker

**Relationships:**
- Parent: swmsDocuments, workers (optional)

**Operations:** create (no delete - audit trail), listBySwms, listByWorker

**Lifecycle:** Immutable once created

---

#### swmsAssignments

**Purpose:** Worker assignments + acknowledgements

```typescript
swmsAssignments: defineTable({
  swmsDocumentId: v.id("swmsDocuments"),
  workerId: v.id("workers"),
  assignedAt: v.string(),
  acknowledgedAt: v.optional(v.string()),
  metadata: v.optional(v.any()),
})
.index("by_swms", ["swmsDocumentId"])
.index("by_worker", ["workerId"])
.index("by_swms_worker", ["swmsDocumentId", "workerId"]) // Unique check
```

**Indexes:**
- `by_swms`: List workers assigned to SWMS
- `by_worker`: List SWMS assigned to worker
- `by_swms_worker`: Prevent duplicates

**Relationships:**
- Parent: swmsDocuments, workers

**Operations:** create, acknowledge, listBySwms, listByWorker

**Lifecycle:** `assigned → acknowledged`

---

### 4.5 Inductions Tables (4 tables - UNCHANGED)

**Critical Note:** Inductions tables well-designed, preserved as-is.

#### inductionTypes

**Purpose:** Induction templates with structured content blocks

```typescript
inductionTypes: defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),
  scope: v.union(
    v.literal("company"),
    v.literal("site"),
    v.literal("task"),
    v.literal("plant")
  ),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),
  validityDays: v.optional(v.number()), // CHANGED: removed validityMonths
  requiredCertificationTypeIds: v.optional(v.array(v.id("certificationTypes"))),

  // Content blocks
  content: v.optional(v.array(v.object({
    id: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("video"),
      v.literal("acknowledgement"),
      v.literal("upload")
    ),
    data: v.any(), // Type-specific content
    order: v.number(),
  }))),

  requireSignature: v.optional(v.boolean()),
  requireReInduction: v.optional(v.boolean()),

  // Versioning
  isSystemTemplate: v.optional(v.boolean()),
  version: v.optional(v.number()),
  previousVersionId: v.optional(v.id("inductionTypes")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_scope", ["orgId", "scope"])
.index("by_system", ["isSystemTemplate"])
```

**Source Field Differences:**
- Source has NO createdAt/updatedAt timestamps
- Source has `structure`, `contentUrl`, `isRequired` fields not in spec

**Migration:** Add structure/contentUrl/isRequired to spec or mark as removed


**Migration Notes / Source Reconciliation:**

**inductionTypes missing timestamp fields**

Remove from spec (source is correct):
  createdAt: v.string(),
  updatedAt: v.string(),

Source doesn't track timestamps for inductionTypes - it's template config, not temporal data.


**inductionTypes has structure field not in spec**

Add to spec inductionTypes:
  structure: v.optional(v.any()), // Legacy structured content format


**inductionTypes has contentUrl field not in spec**

Add to spec inductionTypes:
  contentUrl: v.optional(v.string()), // External content URL (legacy)


**inductionTypes has isRequired field not in spec**

Add to spec inductionTypes:
  isRequired: v.optional(v.boolean()), // Whether induction is mandatory for site



**Changes from current:**
- Removed `validityMonths` (use validityDays only)

**Indexes:**
- `by_org`: List inductions for org
- `by_project`: Project-specific inductions
- `by_scope`: Filter by scope type
- `by_system`: System templates

**Relationships:**
- Parent: orgs, projects (optional)
- Children: inductionInvites, inductionCompletions
- References: certificationTypes (prerequisites)

**Operations:** create, update, version, list, get

**Lifecycle:** Active/inactive toggle

---

#### inductionInvites

**Purpose:** Public access invite workflow via share codes

```typescript
inductionInvites: defineTable({
  inductionTypeId: v.id("inductionTypes"),
  projectId: v.id("projects"),
  shareCode: v.string(), // 8-char unique code
  invitedByWorkerId: v.optional(v.id("workers")),
  isActive: v.boolean(),
  expiresAt: v.optional(v.string()),
  usageCount: v.optional(v.number()), // Track usage
  maxUses: v.optional(v.number()), // Limit uses
  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_shareCode", ["shareCode"])
.index("by_induction", ["inductionTypeId"])
.index("by_project", ["projectId"])
```

**Source Field Differences:**
- Source has `completionId` linking to result (not in spec)
- Source uses `createdBy` (not `invitedByWorkerId`)
- Source has workflow fields: status, lastOpenedAt, submittedAt, approvedAt, returnComment
- Spec has expiresAt/usageCount/maxUses NOT in source


**Indexes:**
- `by_shareCode`: Public lookup
- `by_induction`: List invites for induction
- `by_project`: Project-level invites

**Relationships:**
- Parent: inductionTypes, projects, workers (creator)
- No children (triggers inductionCompletions)

**Operations:** create, deactivate, list, getByShareCode

**Lifecycle:** `active → expired/deactivated`

---

#### inductionCompletions

**Purpose:** Worker completion records with full audit trail

```typescript
inductionCompletions: defineTable({
  projectId: v.id("projects"),
  inductionTypeId: v.id("inductionTypes"),
  workerId: v.id("workers"),
  inviteId: v.optional(v.id("inductionInvites")),

  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("awaiting_review"),
    v.literal("completed"),
    v.literal("expired"),
    v.literal("superseded")
  ),

  // Timeline
  assignedAt: v.optional(v.string()),
  startedAt: v.optional(v.string()),
  completedAt: v.optional(v.string()),
  expiresAt: v.optional(v.string()),

  // Review
  completedVia: v.optional(v.union(
    v.literal("on_site"),
    v.literal("off_site")
  )),
  reviewedBy: v.optional(v.id("workers")),
  reviewedAt: v.optional(v.string()),

  // Signature
  signature: v.optional(v.object({
    mediaFileId: v.id("mediaFiles"),
    signedAt: v.string(),
    hash: v.string(), // SHA256 tamper detection
  })),

  // Responses to content blocks
  responses: v.optional(v.any()),

  // Audit trail
  auditLog: v.optional(v.array(v.object({
    actorId: v.optional(v.id("workers")),
    actorType: v.optional(v.union(
      v.literal("admin"),
      v.literal("worker"),
      v.literal("system")
    )),
    action: v.string(),
    timestamp: v.string(),
    comment: v.optional(v.string()),
  }))),

  // Versioning
  inductionVersion: v.optional(v.number()),
  requiresReinduction: v.optional(v.boolean()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project_induction", ["projectId", "inductionTypeId"])
.index("by_worker", ["workerId"])
.index("by_status", ["projectId", "status"])
.index("by_expires", ["expiresAt"]) // Find expiring inductions
```

**Source Field Differences:**
- Source has NO createdAt/updatedAt (uses assignedAt/startedAt/completedAt lifecycle)


**Migration Notes / Source Reconciliation:**

**inductionCompletions missing timestamp fields in source**

Remove from spec (source is correct):
  createdAt: v.string(),
  updatedAt: v.string(),

Source doesn't track creation timestamps for completions - uses assignedAt/startedAt/completedAt lifecycle instead.



**Migration Notes / Source Reconciliation:**

**inductionInvites has completionId field not in spec**

Add to spec inductionInvites:
  completionId: v.optional(v.id('inductionCompletions')), // Linked completion record when used


**inductionInvites has createdBy not invitedByWorkerId**

Update spec inductionInvites to match source:
  createdBy: v.optional(v.id('workers')), // NOT invitedByWorkerId


**inductionInvites missing status, lastOpenedAt, submittedAt, approvedAt, returnComment fields**

Add to spec inductionInvites (after shareCode):
  status: v.union(
    v.literal('pending'),
    v.literal('awaiting_review'),
    v.literal('completed')
  ),
  lastOpenedAt: v.optional(v.string()), // Last time invite link was opened
  submittedAt: v.optional(v.string()), // When worker submitted completion
  approvedAt: v.optional(v.string()), // When admin approved
  returnComment: v.optional(v.string()), // Admin feedback if returned


**inductionInvites missing expiresAt, usageCount, maxUses fields in source**

Remove from spec inductionInvites (NOT in source):
  expiresAt: v.optional(v.string()),
  usageCount: v.optional(v.number()),
  maxUses: v.optional(v.number()),

Source doesn't track invite expiry/usage limits - invites controlled by isActive flag only.



**Indexes:**
- `by_project_induction`: Completions per induction type
- `by_worker`: Worker's induction history
- `by_status`: Filter by status
- `by_expires`: Expiring inductions query

**Relationships:**
- Parent: projects, inductionTypes, workers, inductionInvites (optional), mediaFiles (signature)

**Operations:** assign, start, submit, approve, reject, expire, list, get

**Lifecycle:** `pending → in_progress → awaiting_review → completed → expired → superseded`

---

#### plantInductionCompletions

**Purpose:** Plant equipment qualifications (separate from site inductions)

```typescript
plantInductionCompletions: defineTable({
  workerId: v.id("workers"),
  assetTypeId: v.optional(v.string()), // Asset type qualified for
  plantInductionName: v.string(),
  completedAt: v.string(),
  expiresAt: v.optional(v.string()),
  certificateMediaFileId: v.optional(v.id("mediaFiles")),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_worker", ["workerId"])
.index("by_assetType", ["assetTypeId"])
.index("by_expires", ["expiresAt"])
```

**Indexes:**
- `by_worker`: Worker's plant qualifications
- `by_assetType`: Workers qualified for asset type
- `by_expires`: Expiring qualifications

**Relationships:**
- Parent: workers, mediaFiles (certificate)
- No children

**Operations:** create, update, list, listByWorker

**Lifecycle:** `completed → expired`

---

### 4.6 Quality Tables (5 tables)

#### checklistTemplates

**Purpose:** Dynamic checklist builder with 14 field types

```typescript
checklistTemplates: defineTable({
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

  // Structured sections with fields
  sections: v.optional(v.array(v.object({
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
      options: v.optional(v.array(v.string())), // For select types
      conditions: v.optional(v.array(v.object({
        dependsOn: v.string(),
        value: v.any(),
        action: v.union(v.literal("show"), v.literal("hide")),
      }))),
      order: v.number(),
    })),
  }))),

  // Legacy simple items (deprecate)
  items: v.optional(v.array(v.any())),

  // Plant integration
  isPlantInduction: v.optional(v.boolean()),
  plantRegisterId: v.optional(v.id("assetRegisters")),
  plantAllItemsInRegister: v.optional(v.boolean()),
  plantAssetIds: v.optional(v.array(v.id("assets"))),

  // Scoring
  scoringEnabled: v.optional(v.boolean()),
  passingScore: v.optional(v.number()),

  isActive: v.boolean(),
  isSystemTemplate: v.optional(v.boolean()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_scope", ["orgId", "scope"])
.index("by_system", ["isSystemTemplate"])
```

**Missing Fields in Source:**
- No createdAt/updatedAt timestamps in source

**Missing Index:** `by_scope` for filtering templates by scope type


**Migration Notes / Source Reconciliation:**

**plantInductionCompletions missing certificateMediaFileId in spec**

Update spec plantInductionCompletions to match source:

REMOVE:
  verifiedBy: v.optional(v.id("workers")),

ADD:
  certificateMediaFileId: v.optional(v.id('mediaFiles')), // Certificate document


**plantInductionCompletions field name mismatch**

Update spec plantInductionCompletions:
  assetTypeId: v.optional(v.string()), // KEPT
  inductionTypeId: v.optional(v.id('inductionTypes')), // ADD - links to induction template

REMOVE:
  plantInductionName: v.string(), // Redundant - use inductionTypeId


**plantInductionCompletions missing createdAt timestamp**

Remove from spec (source doesn't track):
  createdAt: v.string(),



**Indexes:**
- `by_org`: List templates for org
- `by_project`: Project templates
- `by_scope`: Filter by scope
- `by_system`: System templates

**Relationships:**
- Parent: orgs, projects (optional), assetRegisters (plant), assets (plant)
- Children: checklistInstances, assetChecklistConfigs

**Operations:** create, update, clone, list, get

**Lifecycle:** Active/inactive toggle

---

#### checklistInstances

**Purpose:** Executed checklist records with field-level responses

```typescript
checklistInstances: defineTable({
  projectId: v.id("projects"),
  checklistTemplateId: v.id("checklistTemplates"),
  assignedTo: v.optional(v.id("workers")),
  performedByWorkerId: v.optional(v.id("workers")),
  dueDate: v.optional(v.string()),

  // Polymorphic source
  sourceType: v.optional(v.union(
    v.literal("asset"),
    v.literal("itp"),
    v.literal("incident"),
    v.literal("defect"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),

  // Plant context
  plantRegisterId: v.optional(v.id("assetRegisters")),
  plantAssetId: v.optional(v.id("assets")),
  plantBookingId: v.optional(v.id("assetBookings")), // Legacy

  // Execution
  performedAt: v.optional(v.string()),
  status: v.union(
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  completedAt: v.optional(v.string()),

  // Responses (field-level)
  responses: v.optional(v.any()), // {[fieldId]: {value, notes?, attachmentIds?, signature?}}

  // Links to generated entities
  linkedDefectIds: v.optional(v.array(v.id("defects"))),
  linkedActionIds: v.optional(v.array(v.id("actionItems"))),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project_template", ["projectId", "checklistTemplateId"])
.index("by_assignee", ["assignedTo"])
.index("by_status", ["projectId", "status"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_completed", ["projectId", "completedAt"])
.index("by_plant", ["plantAssetId"])
```

**Missing Fields in Source:**
- No createdAt/updatedAt timestamps

**Missing Index:** `by_plant` for plant asset-specific instances


**Indexes:**
- `by_project_template`: Instances per template
- `by_assignee`: Assigned checklists
- `by_status`: Filter by status
- `by_source`: Polymorphic lookup
- `by_completed`: Completed checklists query
- `by_plant`: Plant asset checklists

**Relationships:**
- Parent: projects, checklistTemplates, workers
- Links: Polymorphic via sourceType/sourceId
- Children: defects (via linkedDefectIds), actionItems (via linkedActionIds)

**Operations:** create, update, complete, cancel, list, get

**Lifecycle:** `in_progress → completed` or `cancelled`

---

#### defects

**Purpose:** Defect tracking with priority, categorization, lifecycle

```typescript
defects: defineTable({
  projectId: v.id("projects"),
  defectNumber: v.optional(v.number()), // Auto-increment per project

  title: v.string(),
  description: v.optional(v.string()),

  category: v.union(
    v.literal("builder"),
    v.literal("client"),
    v.literal("safety"),
    v.literal("other")
  ),

  // Location
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

  // Assignment
  assignedTo: v.optional(v.id("orgs")),
  assignedWorkerId: v.optional(v.id("workers")),
  dueDate: v.optional(v.string()),

  // Timeline
  createdBy: v.id("workers"),
  createdAt: v.string(),
  resolvedAt: v.optional(v.string()),
  closedAt: v.optional(v.string()),

  // Polymorphic source
  sourceType: v.optional(v.union(
    v.literal("asset"),
    v.literal("checklist"),
    v.literal("incident"),
    v.literal("itp"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),

  // Direct links
  assetId: v.optional(v.id("assets")),
  drawingId: v.optional(v.id("sourceDocuments")),

  // Comments embedded (NEW: was separate table)
  comments: v.optional(v.array(v.object({
    id: v.string(),
    workerId: v.id("workers"),
    comment: v.string(),
    createdAt: v.string(),
  }))),

  metadata: v.optional(v.any()),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_project_number", ["projectId", "defectNumber"])
.index("by_status", ["projectId", "status"])
.index("by_assignee", ["assignedTo"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_asset", ["assetId"])
```

**Missing Field in Source:** updatedAt timestamp


**Changes from current:**
- Embedded `comments` array (was separate defectComments table)

**Indexes:**
- `by_project`: List defects for project
- `by_project_number`: Unique defect number
- `by_status`: Filter by status
- `by_assignee`: Assigned org's defects
- `by_source`: Polymorphic source lookup
- `by_asset`: Asset-specific defects

**Relationships:**
- Parent: projects, workers (creator), orgs (assigned), assets, sourceDocuments
- Children: defectPhotos
- Links: Polymorphic via sourceType/sourceId

**Operations:** create, update, assign, resolve, close, addComment, list, get

**Lifecycle:** `open → in_progress → resolved → closed`

---

#### defectPhotos

**Purpose:** Defect photos with markup annotations

```typescript
defectPhotos: defineTable({
  defectId: v.id("defects"),
  mediaFileId: v.id("mediaFiles"),
  caption: v.optional(v.string()),
  markup: v.optional(v.any()), // SVG/canvas markup data
  order: v.number(),
  createdAt: v.string(),
})
.index("by_defect", ["defectId"])
.index("by_mediaFile", ["mediaFileId"])
```

**Missing Fields in Source:** order (for photo ordering), createdAt

**Missing Index:** `by_mediaFile` for reverse lookup from media file to defect


**Indexes:**
- `by_defect`: Photos for defect
- `by_mediaFile`: Reverse lookup

**Relationships:**
- Parent: defects, mediaFiles

**Operations:** create, update, delete, list

**Lifecycle:** Tied to defect lifecycle

---

#### actionItems

**Purpose:** Polymorphic task tracking from multiple sources

```typescript
actionItems: defineTable({
  projectId: v.id("projects"),
  actionNumber: v.optional(v.number()), // Auto-increment

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

  // Assignment
  assignedTo: v.optional(v.id("orgs")),
  assignedWorkerId: v.optional(v.id("workers")),
  dueDate: v.optional(v.string()),

  // Timeline
  createdBy: v.id("workers"),
  createdAt: v.string(),
  completedAt: v.optional(v.string()),

  // Polymorphic source
  sourceType: v.optional(v.union(
    v.literal("checklist"),
    v.literal("inspection"),
    v.literal("incident"),
    v.literal("defect"),
    v.literal("itp"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),

  // Attachments
  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),

  // Public access
  shareCode: v.optional(v.string()),

  // Comments embedded (NEW: was separate table)
  comments: v.optional(v.array(v.object({
    id: v.string(),
    workerId: v.id("workers"),
    comment: v.string(),
    createdAt: v.string(),
  }))),

  metadata: v.optional(v.any()),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_status", ["projectId", "status"])
.index("by_assignee", ["assignedTo"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_shareCode", ["shareCode"])
.index("by_dueDate", ["projectId", "dueDate"])
```

**Missing Fields in Source:** actionNumber (auto-increment), updatedAt

**Missing Index:** `by_dueDate` for overdue/upcoming actions


**Changes from current:**
- Embedded `comments` array (was separate actionComments table)

**Indexes:**
- `by_project`: List actions for project
- `by_status`: Filter by status
- `by_assignee`: Assigned org's actions
- `by_source`: Polymorphic source
- `by_shareCode`: Public access
- `by_dueDate`: Overdue actions query

**Relationships:**
- Parent: projects, workers, orgs, mediaFiles (attachments)
- Links: Polymorphic via sourceType/sourceId

**Operations:** create, update, assign, complete, cancel, addComment, list, get, getByShareCode

**Lifecycle:** `open → in_progress → completed` or `cancelled`

---

### 4.7 Assets Tables (6 tables)

#### assetAllocations

**Purpose:** NEW - Unified bookings + assignments (who has asset, when)

```typescript
assetAllocations: defineTable({
  assetId: v.id("assets"),
  projectId: v.optional(v.id("projects")),

  allocationType: v.union(
    v.literal("reservation"), // Future booking
    v.literal("assignment")   // Active custody
  ),

  // Allocated to (one of these)
  workerId: v.optional(v.id("workers")),
  orgId: v.optional(v.id("orgs")),

  // Timeline
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  allocatedAt: v.string(),
  returnedAt: v.optional(v.string()),

  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("cancelled")
  ),

  notes: v.optional(v.string()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_asset", ["assetId"])
.index("by_worker", ["workerId"])
.index("by_org", ["orgId"])
.index("by_status", ["assetId", "status"])
.index("by_dates", ["assetId", "startDate", "endDate"]) // Conflict check
```

**Replaces:** assetBookings + assetAssignments (merged)

**Indexes:**
- `by_asset`: Allocation history
- `by_worker`: Worker's assets
- `by_org`: Org's assets
- `by_status`: Active allocations
- `by_dates`: Booking conflict detection

**Relationships:**
- Parent: assets, workers (optional), orgs (optional), projects (optional)

**Operations:** create, update, complete, cancel, list, checkConflicts

**Lifecycle:** `pending → active → completed` or `cancelled`

---

#### assetRequests

**Purpose:** Asset booking request approval workflow (renamed from assetBookingRequests)

```typescript
assetRequests: defineTable({
  assetId: v.id("assets"),
  projectId: v.id("projects"),
  requestedByWorkerId: v.id("workers"),

  requestType: v.union(
    v.literal("booking"),
    v.literal("transfer"),
    v.literal("maintenance")
  ),

  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  purpose: v.optional(v.string()),

  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("cancelled")
  ),

  approvedBy: v.optional(v.id("workers")),
  approvedAt: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),

  // Resulting allocation
  allocationId: v.optional(v.id("assetAllocations")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_asset", ["assetId"])
.index("by_project", ["projectId"])
.index("by_requester", ["requestedByWorkerId"])
.index("by_status", ["projectId", "status"])
```

**Renamed from:** assetBookingRequests

**Indexes:**
- `by_asset`: Requests for asset
- `by_project`: Project requests
- `by_requester`: Worker's requests
- `by_status`: Pending approvals

**Relationships:**
- Parent: assets, projects, workers
- Children: assetAllocations (created on approval)

**Operations:** create, approve, reject, cancel, list

**Lifecycle:** `pending → approved` or `rejected` or `cancelled`

---

#### assetChecklistConfigs

**Purpose:** NEW - Unified recurring inspection + prestart check configuration

```typescript
assetChecklistConfigs: defineTable({
  assetId: v.id("assets"),
  checklistTemplateId: v.id("checklistTemplates"),

  purpose: v.union(
    v.literal("inspection"), // Recurring maintenance inspections
    v.literal("prestart")    // Pre-use safety checks
  ),

  frequency: v.optional(v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("quarterly"),
    v.literal("annually"),
    v.literal("on_use") // For prestart
  )),

  isActive: v.boolean(),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_asset", ["assetId"])
.index("by_template", ["checklistTemplateId"])
.index("by_purpose", ["purpose"])
```

**Replaces:** assetChecklists + prestartTemplates (merged)

**Indexes:**
- `by_asset`: Checklists for asset
- `by_template`: Assets using template
- `by_purpose`: Filter by purpose

**Relationships:**
- Parent: assets, checklistTemplates

**Operations:** create, update, deactivate, list

**Lifecycle:** Active/inactive toggle

---

#### prestartSubmissions

**Purpose:** Completed prestart checks (unchanged)

```typescript
prestartSubmissions: defineTable({
  assetId: v.id("assets"),
  projectId: v.id("projects"),
  templateId: v.id("prestartTemplates"), // Legacy - now links to checklistTemplates
  checklistInstanceId: v.optional(v.id("checklistInstances")), // NEW: link to unified system
  performedByWorkerId: v.id("workers"),
  performedAt: v.string(),

  responses: v.any(), // Field responses
  photoIds: v.optional(v.array(v.id("mediaFiles"))),

  passed: v.boolean(),
  issues: v.optional(v.array(v.string())),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_asset", ["assetId"])
.index("by_project", ["projectId"])
.index("by_worker", ["performedByWorkerId"])
.index("by_date", ["assetId", "performedAt"])
```

**Indexes:**
- `by_asset`: Prestart history
- `by_project`: Project prestarts
- `by_worker`: Worker's prestarts
- `by_date`: Recent checks

**Relationships:**
- Parent: assets, projects, workers, prestartTemplates (legacy), checklistInstances (new)
- References: mediaFiles (photos)

**Operations:** create, list, get

**Lifecycle:** Immutable after creation

---

#### assetServiceLogs

**Purpose:** Maintenance and repair records (unchanged)

```typescript
assetServiceLogs: defineTable({
  assetId: v.id("assets"),
  projectId: v.optional(v.id("projects")),

  serviceType: v.union(
    v.literal("maintenance"),
    v.literal("repair"),
    v.literal("inspection"),
    v.literal("calibration"),
    v.literal("other")
  ),

  description: v.string(),
  performedBy: v.optional(v.string()),
  performedAt: v.string(),
  cost: v.optional(v.number()),
  nextServiceDue: v.optional(v.string()),

  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_asset", ["assetId"])
.index("by_type", ["serviceType"])
.index("by_date", ["performedAt"])
.index("by_nextDue", ["nextServiceDue"])
```

**Indexes:**
- `by_asset`: Service history
- `by_type`: Filter by type
- `by_date`: Recent services
- `by_nextDue`: Upcoming maintenance

**Relationships:**
- Parent: assets, projects (optional), mediaFiles (attachments)

**Operations:** create, update, list, get

**Lifecycle:** Immutable after creation



#### sdsLibrary

**Purpose:** Organization-level Safety Data Sheet library for hazardous materials

```typescript
sdsLibrary: defineTable({
  orgId: v.id('orgs'),
  title: v.optional(v.string()),
  companyOrgId: v.optional(v.id('orgs')), // Supplier company
  notes: v.optional(v.string()),
  latestVersionId: v.optional(v.id('sdsVersions')),
  productName: v.optional(v.string()), // Legacy
  manufacturer: v.optional(v.string()), // Legacy
  hazardCategory: v.optional(v.string()),
  documentId: v.optional(v.id('sourceDocuments')), // Legacy single doc
  issueDate: v.optional(v.string()),
  reviewDate: v.optional(v.string()),
  status: v.optional(v.union(
    v.literal('current'),
    v.literal('review_due'),
    v.literal('expired'),
    v.literal('archived')
  )),
  createdAt: v.optional(v.string()),
  createdByWorkerId: v.optional(v.id('workers')),
  metadata: v.optional(v.any()),
})
.index('by_org', ['orgId'])
.index('by_org_company', ['orgId', 'companyOrgId'])
.index('by_org_review', ['orgId', 'reviewDate'])
```

**Indexes:**
- `by_org`: Library entries for org
- `by_org_company`: Filter by supplier
- `by_org_review`: Review due tracking

**Relationships:**
- Parent: orgs, sdsVersions (latest)
- Children: sdsVersions, sdsProjectLinks

**Operations:** create, update, archive, list, linkToProject

**Lifecycle:** `current → review_due → expired → archived`

**Migration Note:** Source (convex/schema.ts:2035-2062) has dual format (new + legacy fields).

---

#### sdsVersions

**Purpose:** Version history for SDS documents

```typescript
sdsVersions: defineTable({
  sdsId: v.id('sdsLibrary'),
  sourceDocumentId: v.id('sourceDocuments'),
  createdAt: v.string(),
  replacementNote: v.optional(v.string()),
  reviewDate: v.optional(v.string()),
  uploadedByOrgId: v.optional(v.id('orgs')),
  uploadedByWorkerId: v.optional(v.id('workers')),
})
.index('by_sds', ['sdsId'])
```

**Indexes:**
- `by_sds`: Versions for SDS

**Relationships:**
- Parent: sdsLibrary, sourceDocuments

**Operations:** create, list

**Migration Note:** Source convex/schema.ts:2065-2074

---

#### sdsProjectLinks

**Purpose:** Link org-level SDS to projects where used

```typescript
sdsProjectLinks: defineTable({
  projectId: v.id('projects'),
  sdsId: v.id('sdsLibrary'),
  linkedAt: v.string(),
  linkedByWorkerId: v.optional(v.id('workers')),
  isActive: v.boolean(),
})
.index('by_project', ['projectId'])
.index('by_sds', ['sdsId'])
.index('by_project_sds', ['projectId', 'sdsId'])
```

**Indexes:**
- `by_project`: SDS for project
- `by_sds`: Projects using SDS
- `by_project_sds`: Unique link check

**Relationships:**
- Parent: projects, sdsLibrary

**Operations:** create, deactivate, list

**Migration Note:** Source convex/schema.ts:2077-2086

---

#### sdsRequests

**Purpose:** Admin-initiated requests for companies to upload SDS

```typescript
sdsRequests: defineTable({
  orgId: v.id('orgs'), // Requesting org
  companyOrgId: v.id('orgs'), // Company being asked
  projectIds: v.optional(v.array(v.id('projects'))),
  message: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  requestedSdsId: v.optional(v.id('sdsLibrary')),
  shareCode: v.string(), // Public upload link
  createdAt: v.string(),
  createdByWorkerId: v.optional(v.id('workers')),
  cancelledAt: v.optional(v.string()),
  cancelledByWorkerId: v.optional(v.id('workers')),
  uploadedAt: v.optional(v.string()),
  uploadedByOrgId: v.optional(v.id('orgs')),
  uploadedByWorkerId: v.optional(v.id('workers')),
  linkedSdsId: v.optional(v.id('sdsLibrary')),
  sourceDocumentId: v.optional(v.id('sourceDocuments')),
})
.index('by_org', ['orgId'])
.index('by_company', ['companyOrgId'])
.index('by_shareCode', ['shareCode'])
```

**Indexes:**
- `by_org`: Requests from org
- `by_company`: Requests to company
- `by_shareCode`: Public link lookup

**Relationships:**
- Parent: orgs, projects, sdsLibrary

**Operations:** create, cancel, complete, list

**Lifecycle:** `created → uploaded|cancelled`

**Migration Note:** Source convex/schema.ts:2089-2109


---

---

### 4.8 Safety Tables (9 tables)

#### permitTypes

**Purpose:** Permit type definitions (unchanged)

```typescript
permitTypes: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  description: v.optional(v.string()),
  requiresChecklist: v.optional(v.boolean()),
  requiredChecklistTemplateId: v.optional(v.id("checklistTemplates")),
  validityHours: v.optional(v.number()),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**Source Field Differences:**
- Source has NO createdAt/updatedAt timestamps (config template)
- Source has `requiredFields` array (not requiresChecklist boolean)
- Source has `defaultValidityHours` (not validityHours)
- Source has `riskLevel` enum not in spec


**Indexes:**
- `by_org`: List permit types for org
- `by_active`: Active permit types

**Relationships:**
- Parent: orgs, checklistTemplates (required checklist)
- Children: permitTypeAssignments, permitInstances

**Operations:** create, update, list, get

**Lifecycle:** Active/inactive toggle

---

#### permitTypeAssignments

**Purpose:** Enable permit types per project (unchanged)

```typescript
permitTypeAssignments: defineTable({
  permitTypeId: v.id("permitTypes"),
  projectId: v.id("projects"),
  isEnabled: v.boolean(),
  isDefault: v.optional(v.boolean()),
  assignedBy: v.optional(v.id("workers")),
  assignedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_permitType", ["permitTypeId"])
.index("by_project_permitType", ["projectId", "permitTypeId"]) // Unique
```

**Indexes:**
- `by_project`: Permit types for project
- `by_permitType`: Projects using permit type
- `by_project_permitType`: Prevent duplicates

**Relationships:**
- Parent: permitTypes, projects, workers (assigner)

**Operations:** create, update, delete, list

**Lifecycle:** Enabled/disabled toggle

---

#### permitInstances

**Purpose:** Full permit lifecycle management (9 states)

```typescript
permitInstances: defineTable({
  projectId: v.id("projects"),
  permitTypeId: v.id("permitTypes"),
  permitNumber: v.optional(v.string()), // Auto-generated

  // Applicant
  applicantWorkerId: v.optional(v.id("workers")),
  applicantName: v.string(),
  applicantCompany: v.optional(v.string()),

  // Work details
  workDescription: v.string(),
  location: v.optional(v.string()),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),

  // Status workflow (9 states)
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

  // Approval
  approvedBy: v.optional(v.id("workers")),
  approvedAt: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),

  // Checklist requirement
  checklistInstanceId: v.optional(v.id("checklistInstances")),

  // Conditions
  conditions: v.optional(v.array(v.string())),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_permitType", ["permitTypeId"])
.index("by_status", ["projectId", "status"])
.index("by_applicant", ["applicantWorkerId"])
.index("by_permitNumber", ["permitNumber"])
```

**Source Field Differences:**
- permitNumber is REQUIRED in source (optional in spec)
- Source uses `applicantId` (not applicantWorkerId)
- Source uses `requestedStartAt/requestedEndAt` (not startDate/endDate)
- Source has extensive lifecycle fields: validFrom, validTo, approvalSignatureData, rejectedBy, rejectedAt, submittedAt, activatedAt, suspendedAt, suspendReason, closedBy, closureNotes, cancelledAt, expiredAt, formData
- Source has indexes: by_applicant, by_validTo


**Migration Notes / Source Reconciliation:**

**permitTypes missing timestamps**

Remove from spec (source is correct):
  createdAt: v.string(),
  updatedAt: v.string(),

Permit types are config templates, not temporal records.


**permitTypes has requiredFields not requiresChecklist**

Update spec permitTypes to match source:

REPLACE:
  requiresChecklist: v.optional(v.boolean()),
  requiredChecklistTemplateId: v.optional(v.id("checklistTemplates")),

WITH:
  requiredFields: v.optional(v.array(v.string())), // Dynamic form field definitions
  checklistTemplateId: v.optional(v.id('checklistTemplates')), // Optional linked checklist


**permitTypes has defaultValidityHours not validityHours**

Update spec permitTypes:
  defaultValidityHours: v.optional(v.number()), // NOT validityHours


**permitTypes has riskLevel field not in spec**

Add to spec permitTypes:
  riskLevel: v.optional(v.union(
    v.literal('low'),
    v.literal('medium'),
    v.literal('high')
  )), // Default risk level for this permit type



**Changes from current:**
- permitApplications table REMOVED (deprecated legacy format)
- permitInstances is now the single source of truth

**Indexes:**
- `by_project`: Permits for project
- `by_permitType`: Instances of permit type
- `by_status`: Filter by status
- `by_applicant`: Worker's permits
- `by_permitNumber`: Unique permit lookup

**Relationships:**
- Parent: projects, permitTypes, workers, checklistInstances (required checklist)

**Operations:** create, submit, approve, reject, activate, suspend, close, expire, cancel, list, get

**Lifecycle:** `draft → submitted → approved → active → closed` (with branches for suspended/expired/rejected/cancelled)

---

#### incidentReports

**Purpose:** Incident and hazard reporting (unchanged)

```typescript
incidentReports: defineTable({
  projectId: v.id("projects"),
  templateId: v.optional(v.id("incidentTemplates")),
  incidentNumber: v.optional(v.string()),

  incidentType: v.union(
    v.literal("injury"),
    v.literal("near_miss"),
    v.literal("property_damage"),
    v.literal("environmental"),
    v.literal("other")
  ),

  severity: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),

  // Incident details
  description: v.string(),
  location: v.optional(v.string()),
  occurredAt: v.string(),
  reportedByWorkerId: v.id("workers"),
  reportedAt: v.string(),

  // Involved parties
  involvedWorkerIds: v.optional(v.array(v.id("workers"))),
  involvedAssetIds: v.optional(v.array(v.id("assets"))),
  witnessWorkerIds: v.optional(v.array(v.id("workers"))),

  // Investigation
  investigationStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed")
  )),
  investigationNotes: v.optional(v.string()),
  rootCause: v.optional(v.string()),

  // Corrective actions
  correctiveActions: v.optional(v.array(v.string())),

  // Linked entities
  checklistInstanceId: v.optional(v.id("checklistInstances")),
  linkedDefectIds: v.optional(v.array(v.id("defects"))),
  linkedActionIds: v.optional(v.array(v.id("actionItems"))),

  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_type", ["projectId", "incidentType"])
.index("by_severity", ["projectId", "severity"])
.index("by_reporter", ["reportedByWorkerId"])
.index("by_date", ["occurredAt"])
```

**Source Field Differences:**
- Source has `date` (not occurredAt)
- Source has NO createdAt/updatedAt
- Source has simpler structure: workerId/assetId (singular, not arrays)
- Source has `reportedBy` + `investigatorId` (not involvedWorkerIds array)
- Source has witnesses array with name/contact objects (not just IDs)
- Source does NOT have linkedDefectIds/linkedActionIds (link from other side)


**Migration Notes / Source Reconciliation:**

**permitInstances has different field structure**

Update spec permitInstances to match source:

CHANGE:
  permitNumber: v.string(), // REQUIRED, not optional
  applicantId: v.id('workers'), // NOT applicantWorkerId
  requestedStartAt: v.string(), // NOT startDate
  requestedEndAt: v.string(), // NOT endDate

ADD lifecycle tracking fields:
  validFrom: v.optional(v.string()), // When permit becomes active
  validTo: v.optional(v.string()), // When permit expires
  approvalSignatureData: v.optional(v.string()), // Approver signature
  rejectedBy: v.optional(v.id('workers')),
  rejectedAt: v.optional(v.string()),
  submittedAt: v.optional(v.string()),
  activatedAt: v.optional(v.string()),
  suspendedAt: v.optional(v.string()),
  suspendReason: v.optional(v.string()),
  closedBy: v.optional(v.id('workers')),
  closureNotes: v.optional(v.string()),
  cancelledAt: v.optional(v.string()),
  expiredAt: v.optional(v.string()),
  formData: v.optional(v.any()), // Custom form responses
  createdAt: v.string(),

REMOVE from spec:
  workDescription (not in source, use description)
  conditions (not in source)
  createdAt/updatedAt (source only has createdAt)


**permitInstances missing indexes**

Add indexes to spec permitInstances:
  .index("by_applicant", ["applicantId"]) // Worker's permit applications
  .index("by_validTo", ["validTo"]) // Expiring permits query



**Migration Notes / Source Reconciliation:**

**permitTypeAssignments field name mismatch**

Update spec permitTypeAssignments to match source:

REPLACE:
  assignedBy: v.optional(v.id("workers")),
  assignedAt: v.string(),
  isDefault: v.optional(v.boolean()),

WITH:
  defaultApproverId: v.optional(v.id('workers')), // Default approver for this permit type on project
  enabledBy: v.optional(v.id('workers')), // Who enabled this permit type
  enabledAt: v.optional(v.string()), // When enabled



**Indexes:**
- `by_project`: Incidents for project
- `by_type`: Filter by type
- `by_severity`: Filter by severity
- `by_reporter`: Reporter's incidents
- `by_date`: Date range queries

**Relationships:**
- Parent: projects, incidentTemplates, workers (many), assets, checklistInstances, defects, actionItems, mediaFiles

**Operations:** create, update, investigate, close, list, get

**Lifecycle:** `reported → under_investigation → completed`

---

#### incidentTemplates

**Purpose:** Investigation templates (unchanged)

```typescript
incidentTemplates: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  description: v.optional(v.string()),
  sections: v.optional(v.array(v.object({
    id: v.string(),
    title: v.string(),
    questions: v.array(v.object({
      id: v.string(),
      question: v.string(),
      type: v.string(),
    })),
  }))),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**Indexes:**
- `by_org`: Templates for org
- `by_active`: Active templates

**Relationships:**
- Parent: orgs
- Children: incidentReports, incidentTemplateAssignments

**Operations:** create, update, list, get

**Lifecycle:** Active/inactive toggle

---

#### incidentTemplateAssignments

**Purpose:** Enable templates per project (unchanged)

```typescript
incidentTemplateAssignments: defineTable({
  incidentTemplateId: v.id("incidentTemplates"),
  projectId: v.id("projects"),
  isEnabled: v.boolean(),
  isDefault: v.optional(v.boolean()),
  assignedBy: v.optional(v.id("workers")),
  assignedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_template", ["incidentTemplateId"])
.index("by_project_template", ["projectId", "incidentTemplateId"])
```

**Indexes:**
- `by_project`: Templates for project
- `by_template`: Projects using template
- `by_project_template`: Unique check

**Relationships:**
- Parent: incidentTemplates, projects, workers (assigner)

**Operations:** create, update, delete, list

**Lifecycle:** Enabled/disabled toggle

---

#### certificationTypes

**Purpose:** Certification/license type definitions (unchanged)

```typescript
certificationTypes: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  code: v.optional(v.string()),
  description: v.optional(v.string()),
  validityDays: v.optional(v.number()),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**Source Field Differences:**
- Source has NO createdAt/updatedAt
- Source has `category` enum not in spec
- Source has `defaultValidityDays`, `isRequiredOrgwide`, `expiryWarningDays`


**Migration Notes / Source Reconciliation:**

**incidentReports has date field not occurredAt**

Update spec incidentReports to match source:
  date: v.string(), // NOT occurredAt
  reportedAt: v.string(), // KEEP - when reported (different from occurred)


**incidentReports missing timestamps in source**

Remove from spec (source doesn't track):
  createdAt: v.string(),
  updatedAt: v.string(),


**incidentReports field structure differences**

Update spec incidentReports to match source:

REPLACE spec's complex structure:
  reportedByWorkerId: v.id("workers"),
  involvedWorkerIds: v.optional(v.array(v.id("workers"))),
  involvedAssetIds: v.optional(v.array(v.id("assets"))),
  witnessWorkerIds: v.optional(v.array(v.id("workers"))),
  investigationStatus: v.optional(v.union(...))

WITH source's simpler fields:
  workerId: v.optional(v.id('workers')), // Primary involved worker
  assetId: v.optional(v.id('assets')), // Primary involved asset
  reportedBy: v.optional(v.id('workers')), // Who reported (can differ from involved)
  investigatorId: v.optional(v.id('workers')), // Who is investigating

KEEP from source:
  witnesses: v.optional(v.array(v.object({
    name: v.string(),
    contact: v.optional(v.string()),
  }))), // Witness details (not just IDs)

No investigationStatus enum in source - use main status field (open/under_investigation/closed)


**incidentReports missing linked entity arrays**

Remove from spec (NOT in source):
  linkedDefectIds: v.optional(v.array(v.id("defects"))),
  linkedActionIds: v.optional(v.array(v.id("actionItems"))),

Source doesn't track these relationships at incident level. Link from defect/action side using sourceType/sourceId pattern.



**Indexes:**
- `by_org`: Cert types for org
- `by_active`: Active types

**Relationships:**
- Parent: orgs
- Children: projectCertificationRequirements, competencyRecords

**Operations:** create, update, list, get

**Lifecycle:** Active/inactive toggle

---

#### projectCertificationRequirements

**Purpose:** Required certifications per project (unchanged)

```typescript
projectCertificationRequirements: defineTable({
  certificationTypeId: v.id("certificationTypes"),
  projectId: v.id("projects"),
  isRequired: v.boolean(),
  assignedBy: v.optional(v.id("workers")),
  assignedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_certType", ["certificationTypeId"])
.index("by_project_certType", ["projectId", "certificationTypeId"])
```

**Indexes:**
- `by_project`: Requirements for project
- `by_certType`: Projects requiring cert
- `by_project_certType`: Unique check

**Relationships:**
- Parent: certificationTypes, projects, workers (assigner)

**Operations:** create, update, delete, list

**Lifecycle:** Required/optional toggle

---

#### insuranceTypes

**Purpose:** Insurance type definitions (unchanged)

```typescript
insuranceTypes: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  description: v.optional(v.string()),
  minimumCoverage: v.optional(v.number()),
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**Source Field Differences:**
- Source has NO createdAt/updatedAt
- Source has `category` enum (company/organisation/asset)
- Source has `isRequiredOrgwide`, `defaultCoverageMinimum`, `expiryWarningDays`
- Source has index: by_category


**Indexes:**
- `by_org`: Insurance types for org
- `by_active`: Active types

**Relationships:**
- Parent: orgs
- Children: projectInsuranceRequirements, insurancePolicies

**Operations:** create, update, list, get

**Lifecycle:** Active/inactive toggle

---

#### projectInsuranceRequirements

**Purpose:** Required insurance per project (unchanged)

```typescript
projectInsuranceRequirements: defineTable({
  insuranceTypeId: v.id("insuranceTypes"),
  projectId: v.id("projects"),
  isRequired: v.boolean(),
  minimumCoverage: v.optional(v.number()),
  assignedBy: v.optional(v.id("workers")),
  assignedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_insuranceType", ["insuranceTypeId"])
.index("by_project_insuranceType", ["projectId", "insuranceTypeId"])
```

**Indexes:**
- `by_project`: Requirements for project
- `by_insuranceType`: Projects requiring insurance
- `by_project_insuranceType`: Unique check

**Relationships:**
- Parent: insuranceTypes, projects, workers (assigner)

**Operations:** create, update, delete, list

**Lifecycle:** Required/optional toggle


#### registerEntries

**Purpose:** Generic register entries for various safety tracking (hazard register, risk register, etc.)

```typescript
registerEntries: defineTable({
  projectId: v.id('projects'),
  kind: v.string(), // Register type: 'hazard', 'risk', 'contractor', etc.
  workerId: v.optional(v.id('workers')),
  assetId: v.optional(v.id('assets')),
  orgId: v.optional(v.id('orgs')),
  data: v.optional(v.any()), // Register-specific structured data
  metadata: v.optional(v.any()),
})
.index('by_project_kind', ['projectId', 'kind'])
```

**Indexes:**
- `by_project_kind`: Entries by register type within project

**Relationships:**
- Parent: projects
- Optional links: workers, assets, orgs

**Operations:** create, update, delete, list

**Purpose:** Flexible register system for various safety tracking needs without dedicated tables for each register type.

**Migration Note:** Exists in source (convex/schema.ts:732-740) but not documented in spec.


---


#### insurancePolicies

**Purpose:** Insurance policy records for orgs, subcontractors, and assets

```typescript
insurancePolicies: defineTable({
  orgId: v.id('orgs'),
  subcontractorId: v.optional(v.id('orgs')),
  projectId: v.optional(v.id('projects')),
  policyType: v.string(),
  provider: v.optional(v.string()),
  insurer: v.optional(v.string()),
  policyNumber: v.optional(v.string()),
  coverageAmount: v.optional(v.number()),
  startDate: v.optional(v.string()),
  expiryDate: v.optional(v.string()),
  documentId: v.optional(v.id('sourceDocuments')),
  status: v.optional(v.union(
    v.literal('pending'),
    v.literal('valid'),
    v.literal('expiring'),
    v.literal('expired'),
    v.literal('archived')
  )),
  verifiedBy: v.optional(v.id('workers')),
  verifiedAt: v.optional(v.string()),
  submittedAt: v.optional(v.string()),
  insuranceTypeId: v.optional(v.id('insuranceTypes')),
  ownerType: v.optional(v.union(
    v.literal('organisation'),
    v.literal('company'),
    v.literal('asset')
  )),
  ownerAssetId: v.optional(v.id('assets')),
  metadata: v.optional(v.any()),
})
.index('by_org', ['orgId'])
.index('by_project', ['projectId'])
.index('by_subcontractor', ['subcontractorId'])
.index('by_status', ['status'])
.index('by_insuranceType', ['insuranceTypeId'])
.index('by_ownerAsset', ['ownerAssetId'])
```

**Indexes:**
- `by_org`: Policies for org
- `by_project`: Project-specific policies
- `by_subcontractor`: Subcontractor policies
- `by_status`: Filter by verification status
- `by_insuranceType`: Policies of specific type
- `by_ownerAsset`: Asset-specific insurance

**Relationships:**
- Parent: orgs, projects, insuranceTypes, sourceDocuments, assets
- Polymorphic owner via ownerType/ownerAssetId

**Operations:** create, verify, expire, archive, list

**Lifecycle:** `pending → valid → expiring → expired → archived`

**Migration Note:** Exists in source (convex/schema.ts:230-263).


---



#### signOnConfigs

**Purpose:** Configurable site sign-on/sign-in forms per project

```typescript
signOnConfigs: defineTable({
  projectId: v.id('projects'),
  name: v.string(),
  isDefault: v.boolean(),
  visitorAllowed: v.boolean(),
  deliveryAllowed: v.boolean(),
  prestartNoticeId: v.optional(v.id('prestartNotices')),
  customFields: v.optional(v.array(v.object({
    id: v.string(),
    label: v.string(),
    type: v.union(v.literal('text'), v.literal('select'), v.literal('checkbox')),
    required: v.boolean(),
    options: v.optional(v.array(v.string())),
  }))),
  isActive: v.boolean(),
})
.index('by_project', ['projectId'])
.index('by_default', ['projectId', 'isDefault'])
```

**Indexes:**
- `by_project`: Configs for project
- `by_default`: Find default config

**Relationships:**
- Parent: projects, prestartNotices (optional)

**Operations:** create, update, setDefault, list

**Migration Note:** Source convex/schema.ts:2001-2018. Related to attendanceLogs extensions.

---

#### prestartNotices

**Purpose:** Safety notices displayed during worker sign-on

```typescript
prestartNotices: defineTable({
  projectId: v.id('projects'),
  title: v.string(),
  content: v.string(),
  effectiveDate: v.string(),
  expiresAt: v.optional(v.string()),
  requiresAcknowledgement: v.boolean(),
  createdBy: v.optional(v.id('workers')),
  isActive: v.boolean(),
})
.index('by_project', ['projectId'])
.index('by_active', ['projectId', 'isActive'])
```

**Indexes:**
- `by_project`: Notices for project
- `by_active`: Active notices only

**Relationships:**
- Parent: projects

**Operations:** create, update, deactivate, list

**Migration Note:** Source convex/schema.ts:2021-2032. Linked from signOnConfigs.


---

---

### 4.9 Operations Tables (8 tables)

#### toolboxMeetings

**Purpose:** Safety meetings with QR attendance (unchanged)

```typescript
toolboxMeetings: defineTable({
  projectId: v.id("projects"),
  title: v.string(),
  date: v.string(), // ISO date
  startTime: v.optional(v.string()),
  location: v.optional(v.string()),

  meetingType: v.optional(v.union(
    v.literal("toolbox"),
    v.literal("briefing"),
    v.literal("safety")
  )),

  agenda: v.optional(v.string()),
  minutes: v.optional(v.string()),

  conductedBy: v.optional(v.id("workers")),

  // Linked SWMS
  linkedSwmsIds: v.optional(v.array(v.id("swmsDocuments"))),

  // Attachments
  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),

  // QR code attendance
  qrCode: v.optional(v.string()),

  status: v.union(
    v.literal("scheduled"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
  ),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_date", ["projectId", "date"])
.index("by_qr", ["qrCode"])
.index("by_status", ["projectId", "status"])
```

**Source Field Differences:**
- Source: `topic` (not `title`)
- Source: `scheduledDate` (not separate date + startTime)
- Source: `notes` (not `minutes`)
- Source has: linkedSdsIds, startedAt, completedAt, archivedAt, archived status
- Source: attachmentIds point to sourceDocuments (not mediaFiles)
- Missing index: `by_type`


**Migration Notes / Source Reconciliation:**

**incidentTemplates missing timestamps**

Update spec incidentTemplates:
  createdAt: v.string(), // KEEP

REMOVE:
  updatedAt: v.string(), // Not in source


**incidentTemplates missing sections structure in source**

Remove from spec (NOT in source):
  sections: v.optional(v.array(v.object({...}))),

Source incidentTemplates are simple type definitions, not form builders. Investigation forms handled by linked checklistTemplateId.



**Indexes:**
- `by_project`: Meetings for project
- `by_date`: Date range queries
- `by_qr`: QR code lookup
- `by_status`: Filter by status

**Relationships:**
- Parent: projects, workers (conductor), swmsDocuments, mediaFiles
- Children: toolboxAttendance, activityLogs

**Operations:** create, update, complete, cancel, list, get, getByQR

**Lifecycle:** `scheduled → in_progress → completed` or `cancelled`

---

#### toolboxAttendance

**Purpose:** Individual meeting attendance with signatures (unchanged)

```typescript
toolboxAttendance: defineTable({
  toolboxMeetingId: v.id("toolboxMeetings"),
  workerId: v.optional(v.id("workers")),
  workerName: v.string(),
  workerCompany: v.optional(v.string()),

  attendanceType: v.union(
    v.literal("internal"), // Registered worker
    v.literal("external")  // External/QR access
  ),

  signatureData: v.optional(v.string()), // Base64 PNG
  signedAt: v.string(),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_meeting", ["toolboxMeetingId"])
.index("by_worker", ["workerId"])
.index("by_meeting_worker", ["toolboxMeetingId", "workerId"])
```

**Migration Notes / Source Reconciliation:**

**certificationTypes missing timestamps**

Remove from spec (source doesn't track):
  createdAt: v.string(),
  updatedAt: v.string(),


**certificationTypes has category field not in spec**

Add to spec certificationTypes:
  category: v.union(
    v.literal('license'),
    v.literal('ticket'),
    v.literal('training'),
    v.literal('medical'),
    v.literal('other')
  ),


**certificationTypes has additional fields**

Add to spec certificationTypes:
  defaultValidityDays: v.optional(v.number()), // Default cert validity period
  isRequiredOrgwide: v.boolean(), // Required for all workers in org
  expiryWarningDays: v.optional(v.number()), // Warning threshold before expiry



**Indexes:**
- `by_meeting`: Attendees for meeting
- `by_worker`: Worker's attendance history
- `by_meeting_worker`: Prevent duplicate sign-in

**Relationships:**
- Parent: toolboxMeetings, workers (optional)

**Operations:** create (no delete - audit trail), list

**Lifecycle:** Immutable after creation

---

#### attendanceLogs

**Purpose:** Daily worker sign-on/sign-off (unchanged)

```typescript
attendanceLogs: defineTable({
  projectId: v.id("projects"),
  workerId: v.id("workers"),
  date: v.string(), // ISO date
  signOnTime: v.optional(v.string()),
  signOffTime: v.optional(v.string()),
  notes: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project_date", ["projectId", "date"])
.index("by_worker_date", ["workerId", "date"])
.index("by_project", ["projectId"])
```

**Source Field Differences:**
- Source: `signInTime` (not `signOnTime`)
- Source has extensive sign-on extensions: signOnConfigId, entryType (worker|visitor|delivery), visitorDetails, formResponses, prestartNoticeAck, swmsAcknowledgedIds, viaQr
- Missing index: `by_entry_type`


**Indexes:**
- `by_project_date`: Daily attendance report
- `by_worker_date`: Worker's daily log
- `by_project`: All attendance for project

**Relationships:**
- Parent: projects, workers

**Operations:** signOn, signOff, update, list

**Lifecycle:** `signed_on → signed_off`

---

#### diaries

**Purpose:** Daily site diary entries (unchanged)

```typescript
diaries: defineTable({
  projectId: v.id("projects"),
  date: v.string(), // ISO date
  weather: v.optional(v.string()),
  temperature: v.optional(v.number()),
  workDescription: v.optional(v.string()),
  progress: v.optional(v.string()),
  issues: v.optional(v.string()),
  visitors: v.optional(v.string()),

  createdBy: v.id("workers"),

  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),

  // AI-generated summary
  aiSummary: v.optional(v.string()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project_date", ["projectId", "date"])
.index("by_project", ["projectId"])
```

**Source Field Differences:**
- Source has `weatherSummary` (not `weather`)
- Source has `weatherTemp` (not `temperature`)
- Source has `activities` array (not `workDescription` string)
- Source has `status` field: draft|final (missing in spec)
- Source has `description` rich text field (missing in spec)
- Source has `inclementWeatherEvents` array (missing in spec)


**Migration Notes / Source Reconciliation:**

**projectCertificationRequirements field name mismatch**

Update spec projectCertificationRequirements to match source:

REMOVE:
  assignedBy: v.optional(v.id("workers")),
  assignedAt: v.string(),

ADD:
  notes: v.optional(v.string()), // Why this certification is required



**Indexes:**
- `by_project_date`: Diary for specific date
- `by_project`: All diaries for project

**Relationships:**
- Parent: projects, workers (creator), mediaFiles (attachments)

**Operations:** create, update, list, get

**Lifecycle:** Editable until archived

---

#### briefings

**Purpose:** Simple safety briefings (unchanged)

```typescript
briefings: defineTable({
  projectId: v.id("projects"),
  title: v.string(),
  description: v.optional(v.string()),
  date: v.string(),
  conductedBy: v.optional(v.id("workers")),
  attendeeWorkerIds: v.optional(v.array(v.id("workers"))),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_date", ["projectId", "date"])
```

**Migration Notes / Source Reconciliation:**

**insuranceTypes missing timestamps**

Remove from spec (source doesn't track):
  createdAt: v.string(),
  updatedAt: v.string(),


**insuranceTypes has category field not in spec**

Add to spec insuranceTypes:
  category: v.union(
    v.literal('company'),
    v.literal('organisation'),
    v.literal('asset')
  ), // What this insurance type applies to


**insuranceTypes has additional fields**

Update spec insuranceTypes:

REPLACE:
  minimumCoverage: v.optional(v.number()),

WITH:
  isRequiredOrgwide: v.boolean(), // Required for all applicable entities in org
  defaultCoverageMinimum: v.optional(v.number()), // Minimum coverage amount
  expiryWarningDays: v.optional(v.number()), // Warning threshold


**insuranceTypes missing by_category index**

Add index to spec insuranceTypes:
  .index("by_category", ["orgId", "category"]) // Filter by insurance category



**Indexes:**
- `by_project`: Briefings for project
- `by_date`: Date range queries

**Relationships:**
- Parent: projects, workers (conductor, attendees)

**Operations:** create, update, list, get

**Lifecycle:** Immutable after creation

---

#### scheduledTasks

**Purpose:** Project schedule tasks (Gantt chart)

```typescript
scheduledTasks: defineTable({
  projectId: v.id("projects"),
  phaseId: v.optional(v.id("schedulePhases")),

  name: v.string(),
  description: v.optional(v.string()),

  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  duration: v.optional(v.number()), // Days

  assignedOrgId: v.optional(v.id("orgs")), // Subcontractor

  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("delayed"),
    v.literal("cancelled")
  ),

  progress: v.optional(v.number()), // 0-100

  // Confirmations embedded (NEW: was separate table)
  confirmations: v.optional(v.array(v.object({
    orgId: v.id("orgs"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("rejected")
    ),
    confirmedAt: v.optional(v.string()),
    confirmedByName: v.optional(v.string()),
    comments: v.optional(v.string()),
  }))),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_phase", ["phaseId"])
.index("by_assignedOrg", ["assignedOrgId"])
.index("by_status", ["projectId", "status"])
.index("by_dates", ["projectId", "startDate", "endDate"])
```

**Source Field Differences:**
- Source: `title` (not `name`), no description field
- Source: startDate/endDate REQUIRED (not optional)
- Source: status values: not_started|in_progress|complete (not pending|completed|delayed|cancelled)
- Source has: sortOrder, confirmedStatus/confirmedAt/confirmedByName (flat, not array), createdBy


**Migration Notes / Source Reconciliation:**

**projectInsuranceRequirements field name mismatch**

Remove from spec projectInsuranceRequirements (NOT in source):
  assignedBy: v.optional(v.id("workers")),
  assignedAt: v.string(),



**Changes from current:**
- Embedded `confirmations` array (was separate scheduleTaskConfirmations table)

**Indexes:**
- `by_project`: Tasks for project
- `by_phase`: Tasks in phase
- `by_assignedOrg`: Org's tasks
- `by_status`: Filter by status
- `by_dates`: Date range queries

**Relationships:**
- Parent: projects, schedulePhases, orgs (assigned)
- Children: scheduleDependencies

**Operations:** create, update, confirm, list, get

**Lifecycle:** `pending → in_progress → completed` (or delayed/cancelled)

---

#### scheduleDependencies

**Purpose:** Task predecessor relationships (unchanged)

```typescript
scheduleDependencies: defineTable({
  fromTaskId: v.id("scheduledTasks"),
  toTaskId: v.id("scheduledTasks"),
  dependencyType: v.union(
    v.literal("finish_to_start"),
    v.literal("start_to_start"),
    v.literal("finish_to_finish"),
    v.literal("start_to_finish")
  ),
  lag: v.optional(v.number()), // Days offset
  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_fromTask", ["fromTaskId"])
.index("by_toTask", ["toTaskId"])
```

**Indexes:**
- `by_fromTask`: Dependencies from task
- `by_toTask`: Dependencies to task

**Relationships:**
- Parent: scheduledTasks (from/to)

**Operations:** create, delete, list

**Lifecycle:** Tied to task lifecycle

---

#### schedulePhases

**Purpose:** Schedule grouping/swimlanes (unchanged)

```typescript
schedulePhases: defineTable({
  projectId: v.id("projects"),
  name: v.string(),
  description: v.optional(v.string()),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  order: v.number(),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_project_order", ["projectId", "order"])
```

**Indexes:**
- `by_project`: Phases for project
- `by_project_order`: Ordered phases

**Relationships:**
- Parent: projects
- Children: scheduledTasks

**Operations:** create, update, reorder, delete, list

**Lifecycle:** Tied to project lifecycle

---

#### scheduleShares

**Purpose:** NEW - Unified schedule sharing (read-only + confirmation links)

```typescript
scheduleShares: defineTable({
  projectId: v.id("projects"),
  shareType: v.union(
    v.literal("view_only"),  // Read-only schedule view
    v.literal("confirm")     // Subcontractor confirmation
  ),
  shareCode: v.string(),

  // For confirmation shares
  targetOrgId: v.optional(v.id("orgs")), // Subcontractor org

  isActive: v.boolean(),
  expiresAt: v.optional(v.string()),

  // Publishing metadata
  publishedBy: v.optional(v.id("workers")),
  publishedAt: v.optional(v.string()),
  publishVersion: v.optional(v.number()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_shareCode", ["shareCode"])
.index("by_targetOrg", ["targetOrgId"])
```

**Replaces:** scheduleShareLinks + schedulePublishes + scheduleConfirmLinks (merged)

**Indexes:**
- `by_project`: Shares for project
- `by_shareCode`: Public lookup
- `by_targetOrg`: Org's shares

**Relationships:**
- Parent: projects, orgs (target), workers (publisher)

**Operations:** create, deactivate, list, getByShareCode

**Lifecycle:** `active → expired/deactivated`


#### alerts

**Purpose:** Project-wide alerts and notifications (weather, safety, changes)

```typescript
alerts: defineTable({
  projectId: v.id("projects"),
  kind: v.union(
    v.literal("weather"),
    v.literal("change"),
    v.literal("safety"),
    v.literal("other")
  ),
  message: v.string(),
  requiresAck: v.boolean(),
  status: v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("archived")
  ),
  sentAt: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_status", ["projectId", "status"])
```

**Indexes:**
- `by_project`: Alerts for project
- `by_status`: Filter by status

**Relationships:**
- Parent: projects

**Operations:** create, send, archive, list, get

**Lifecycle:** `draft → sent → archived`

**Migration Note:** Exists in source (convex/schema.ts:809-827) but not in spec.


---

---

### 4.10 AI/System Tables (4 tables)

#### executions

**Purpose:** AI db writes with full undo capability (unchanged)

```typescript
executions: defineTable({
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
  summary: v.string(),

  status: v.union(
    v.literal("applied"),
    v.literal("undone"),
    v.literal("partial")
  ),

  createdBy: v.union(
    v.literal("ai"),
    v.literal("admin")
  ),
  createdByUserId: v.optional(v.string()),
  createdAt: v.string(),

  undoneAt: v.optional(v.string()),
  undoneByUserId: v.optional(v.string()),

  // Atomic operations array
  operations: v.array(v.object({
    opId: v.optional(v.string()),
    kind: v.string(),
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
    before: v.optional(v.any()), // Snapshot before
    patch: v.optional(v.any()),  // Delta applied
    ok: v.boolean(),
    message: v.optional(v.string()),
    undoneAt: v.optional(v.string()),
    undoneByUserId: v.optional(v.string()),
  })),

  metadata: v.optional(v.any()),
})
.index("by_project_status", ["projectId", "status"])
.index("by_project_createdAt", ["projectId", "createdAt"])
.index("by_createdBy", ["createdBy"])
```

**Migration Notes / Source Reconciliation:**

**attendanceLogs has safety-specific extensions not in spec**

Add to spec attendanceLogs (Safety Bucket 2 extensions):
  signOnConfigId: v.optional(v.id('signOnConfigs')), // Which sign-on form used
  entryType: v.optional(v.union(
    v.literal('worker'),
    v.literal('visitor'),
    v.literal('delivery')
  )),
  visitorDetails: v.optional(v.object({
    name: v.string(),
    company: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    purpose: v.optional(v.string()),
  })),
  formResponses: v.optional(v.any()), // Custom sign-on form responses
  prestartNoticeAck: v.optional(v.boolean()), // Acknowledged prestart notice
  swmsAcknowledgedIds: v.optional(v.array(v.id('swmsDocuments'))), // SWMS acknowledged at entry
  viaQr: v.optional(v.boolean()), // Signed in via QR code



**Indexes:**
- `by_project_status`: Filter by status
- `by_project_createdAt`: Chronological list
- `by_createdBy`: AI vs admin filter

**Relationships:**
- Parent: projects

**Operations:** executeDbWrite, undoExecution, list, get

**Lifecycle:** `applied → undone` or `partial`

---

#### aiRuns

**Purpose:** AI reasoning sessions (unchanged)

```typescript
aiRuns: defineTable({
  projectId: v.optional(v.id("projects")),
  sessionId: v.string(),
  userId: v.optional(v.string()),

  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
  ),

  prompt: v.optional(v.string()),
  response: v.optional(v.string()),

  // Execution links
  executionIds: v.optional(v.array(v.id("executions"))),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_session", ["sessionId"])
.index("by_status", ["status"])
```

**Indexes:**
- `by_project`: Runs for project
- `by_session`: Session continuity
- `by_status`: Failed/running runs

**Relationships:**
- Parent: projects (optional)
- References: executions

**Operations:** create, update, complete, fail, list, get

**Lifecycle:** `running → completed` or `failed` or `cancelled`

---

#### conversations

**Purpose:** NEW - Generic Claude SDK conversation threads (replaces chatkitThreads)

```typescript
conversations: defineTable({
  orgId: v.id("orgs"),
  projectId: v.optional(v.id("projects")),

  sessionId: v.string(), // Claude SDK session ID for resume
  title: v.optional(v.string()),

  status: v.union(
    v.literal("active"),
    v.literal("archived")
  ),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_session", ["sessionId"])
```

**Replaces:** chatkitThreads (ChatKit-specific table removed)

**Indexes:**
- `by_org`: Conversations for org
- `by_project`: Project conversations
- `by_session`: Session lookup

**Relationships:**
- Parent: orgs, projects (optional)
- Children: conversationMessages

**Operations:** create, update, archive, list, get, getBySession

**Lifecycle:** `active → archived`

---

#### conversationMessages

**Purpose:** NEW - Generic conversation messages (replaces chatkitItems)

```typescript
conversationMessages: defineTable({
  conversationId: v.id("conversations"),

  role: v.union(
    v.literal("user"),
    v.literal("assistant"),
    v.literal("system")
  ),

  content: v.string(),

  // Tool calls/results
  toolCalls: v.optional(v.array(v.any())),
  toolResults: v.optional(v.array(v.any())),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_conversation", ["conversationId"])
.index("by_conversation_createdAt", ["conversationId", "createdAt"])
```

**Replaces:** chatkitItems (ChatKit-specific table removed)

**Indexes:**
- `by_conversation`: Messages for conversation
- `by_conversation_createdAt`: Chronological order

**Relationships:**
- Parent: conversations

**Operations:** create (no update - immutable), list, get

**Lifecycle:** Immutable after creation

---

### 4.11 Documents Tables (5 tables)

#### sourceDocuments

**Purpose:** Document metadata with AI chunking support

```typescript
sourceDocuments: defineTable({
  projectId: v.optional(v.id("projects")),
  orgId: v.optional(v.id("orgs")),
  linkedFromOrgDocId: v.optional(v.id("sourceDocuments")), // Org library link

  mediaFileId: v.id("mediaFiles"),
  docType: v.string(),
  title: v.optional(v.string()),

  uploadedByOrgId: v.optional(v.id("orgs")),
  uploadedByWorkerId: v.optional(v.id("workers")),

  tags: v.optional(v.array(v.string())),
  folderId: v.optional(v.id("documentFolders")),

  // Versioning
  version: v.optional(v.number()),
  previousVersionId: v.optional(v.id("sourceDocuments")),

  // Upload link source
  uploadLinkId: v.optional(v.id("documentUploadLinks")),

  // PDF annotations embedded (NEW: was separate table)
  annotationData: v.optional(v.any()), // SVG/canvas markup data

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_org", ["orgId"])
.index("by_folder", ["folderId"])
.index("by_mediaFile", ["mediaFileId"])
```

**Changes from current:**
- Embedded `annotationData` field (was separate pdfAnnotations table)

**Indexes:**
- `by_project`: Docs for project
- `by_org`: Org-level docs
- `by_folder`: Folder contents
- `by_mediaFile`: Reverse lookup

**Relationships:**
- Parent: projects (optional), orgs (optional), mediaFiles, documentFolders, documentUploadLinks
- Children: documentChunks, documentEntityLinks

**Operations:** create, update, version, list, get

**Lifecycle:** Permanent once uploaded

---

#### documentChunks

**Purpose:** Text chunks for RAG/semantic search (unchanged)

```typescript
documentChunks: defineTable({
  documentId: v.id("sourceDocuments"),
  chunkIndex: v.number(),
  text: v.string(), // ~500 tokens
  pageNumber: v.optional(v.number()),
  embeddingKey: v.optional(v.string()), // Pinecone/vector DB key
  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_document", ["documentId"])
.index("by_document_chunkIndex", ["documentId", "chunkIndex"])
```

**Indexes:**
- `by_document`: Chunks for document
- `by_document_chunkIndex`: Ordered chunks

**Relationships:**
- Parent: sourceDocuments

**Operations:** create (auto during chunking), list, get

**Lifecycle:** Created with document, updated on re-chunking

---

#### documentEntityLinks

**Purpose:** Link document chunks to entities (unchanged)

```typescript
documentEntityLinks: defineTable({
  documentId: v.id("sourceDocuments"),
  chunkIndex: v.optional(v.number()),

  entityTable: v.string(),
  entityId: v.string(),

  linkType: v.optional(v.string()), // e.g., "reference", "attachment"

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_document", ["documentId"])
.index("by_entity", ["entityTable", "entityId"])
```

**Indexes:**
- `by_document`: Entities linked to doc
- `by_entity`: Docs linked to entity

**Relationships:**
- Parent: sourceDocuments
- Links: Polymorphic (entityTable + entityId)

**Operations:** create, delete, list

**Lifecycle:** Tied to document lifecycle

---

#### documentFolders

**Purpose:** Hierarchical document organization (unchanged)

```typescript
documentFolders: defineTable({
  orgId: v.optional(v.id("orgs")),
  projectId: v.optional(v.id("projects")),

  name: v.string(),
  parentFolderId: v.optional(v.id("documentFolders")), // Nested folders

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_parent", ["parentFolderId"])
```

**Indexes:**
- `by_org`: Org folders
- `by_project`: Project folders
- `by_parent`: Nested folders

**Relationships:**
- Parent: orgs (optional), projects (optional), documentFolders (parent)
- Children: sourceDocuments, documentFolders (children)

**Operations:** create, update, delete, list, get

**Lifecycle:** Permanent unless deleted

---

#### documentUploadLinks

**Purpose:** Public upload links for subcontractor docs (unchanged)

```typescript
documentUploadLinks: defineTable({
  projectId: v.id("projects"),
  folderId: v.optional(v.id("documentFolders")),

  shareCode: v.string(),
  label: v.string(),
  description: v.optional(v.string()),

  isActive: v.boolean(),
  expiresAt: v.optional(v.string()),

  createdBy: v.optional(v.id("workers")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_shareCode", ["shareCode"])
```

**Indexes:**
- `by_project`: Upload links for project
- `by_shareCode`: Public lookup

**Relationships:**
- Parent: projects, documentFolders (optional), workers (creator)
- No children (triggers sourceDocuments creation)

**Operations:** create, deactivate, list, getByShareCode

**Lifecycle:** `active → expired/deactivated`

---

### 4.12 Cross-Cutting Tables (4 tables)

#### mediaFiles

**Purpose:** Universal file storage pointer (unchanged)

```typescript
mediaFiles: defineTable({
  orgId: v.optional(v.id("orgs")),
  projectId: v.optional(v.id("projects")),

  fileName: v.string(),
  fileType: v.string(), // MIME type
  fileSize: v.number(), // Bytes
  storageId: v.string(), // Convex storage ID

  linkedEntityType: v.optional(v.string()),
  linkedEntityId: v.optional(v.string()),

  uploadedBy: v.optional(v.id("workers")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_linked", ["linkedEntityType", "linkedEntityId"])
.index("by_storageId", ["storageId"])
```

**Indexes:**
- `by_org`: Files for org
- `by_project`: Files for project
- `by_linked`: Polymorphic entity lookup
- `by_storageId`: Storage lookup

**Relationships:**
- Referenced by: 50+ tables (avatars, photos, attachments, signatures, etc.)

**Operations:** create, delete, list, get

**Lifecycle:** Permanent until explicitly deleted

---

#### notifications

**Purpose:** In-app notification feed (unchanged)

```typescript
notifications: defineTable({
  userId: v.string(),

  type: v.string(), // Notification type
  title: v.string(),
  message: v.string(),

  // Polymorphic entity link
  entityType: v.optional(v.string()),
  entityId: v.optional(v.string()),

  isRead: v.boolean(),
  readAt: v.optional(v.string()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_user", ["userId"])
.index("by_user_read", ["userId", "isRead"])
.index("by_entity", ["entityType", "entityId"])
```

**Indexes:**
- `by_user`: User's notifications
- `by_user_read`: Unread notifications
- `by_entity`: Notifications for entity

**Relationships:**
- Links: Polymorphic (entityType + entityId)

**Operations:** create, markRead, delete, list

**Lifecycle:** `unread → read` (eventually pruned)

---

#### notificationPreferences

**Purpose:** User notification settings (unchanged)

```typescript
notificationPreferences: defineTable({
  userId: v.string(),

  emailEnabled: v.optional(v.boolean()),
  pushEnabled: v.optional(v.boolean()),

  preferences: v.optional(v.any()), // Type-specific settings

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_user", ["userId"])
```

**Indexes:**
- `by_user`: User's preferences

**Relationships:**
- No parent (user-specific)

**Operations:** create, update, get

**Lifecycle:** Permanent

---

#### communications

**Purpose:** Admin → worker messages

```typescript
communications: defineTable({
  projectId: v.id("projects"),

  subject: v.string(),
  message: v.string(),

  sentBy: v.id("workers"),
  sentAt: v.string(),

  // Attachments embedded (NEW: was separate table)
  attachmentIds: v.optional(v.array(v.id("mediaFiles"))),

  // Polymorphic source context
  sourceType: v.optional(v.string()),
  sourceId: v.optional(v.string()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_sender", ["sentBy"])
.index("by_source", ["sourceType", "sourceId"])
```

**Changes from current:**
- Embedded `attachmentIds` array (was separate communicationAttachments table)

**Indexes:**
- `by_project`: Messages for project
- `by_sender`: Sent messages
- `by_source`: Context-specific messages

**Relationships:**
- Parent: projects, workers (sender), mediaFiles (attachments)
- Children: communicationRecipients

**Operations:** create, list, get

**Lifecycle:** Permanent

---

#### communicationRecipients

**Purpose:** Message delivery tracking (unchanged)

```typescript
communicationRecipients: defineTable({
  communicationId: v.id("communications"),
  workerId: v.id("workers"),

  status: v.union(
    v.literal("sent"),
    v.literal("delivered"),
    v.literal("read"),
    v.literal("failed")
  ),

  deliveredAt: v.optional(v.string()),
  readAt: v.optional(v.string()),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_communication", ["communicationId"])
.index("by_worker", ["workerId"])
.index("by_worker_status", ["workerId", "status"])
```

**Indexes:**
- `by_communication`: Recipients for message
- `by_worker`: Worker's messages
- `by_worker_status`: Unread messages

**Relationships:**
- Parent: communications, workers

**Operations:** create, updateStatus, list

**Lifecycle:** `sent → delivered → read` or `failed`

---

### 4.13 Supporting Tables (13 tables)

#### activityLogs

**Purpose:** NEW - Unified audit trail across all entities (replaces assetActivityLogs + toolboxActivityLogs)

```typescript
activityLogs: defineTable({
  // Polymorphic entity
  entityType: v.string(),
  entityId: v.string(),

  activityType: v.string(), // e.g., "status_changed", "assigned", "signed"
  description: v.string(),

  actorId: v.optional(v.id("workers")),
  actorType: v.optional(v.union(
    v.literal("admin"),
    v.literal("worker"),
    v.literal("system")
  )),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
})
.index("by_entity", ["entityType", "entityId"])
.index("by_actor", ["actorId"])
.index("by_type", ["activityType"])
```

**Replaces:** assetActivityLogs, toolboxActivityLogs (merged into single polymorphic table)

**Indexes:**
- `by_entity`: Activity history for entity
- `by_actor`: Worker's activity
- `by_type`: Filter by activity type

**Relationships:**
- Links: Polymorphic (entityType + entityId)
- References: workers (actor)

**Operations:** create (no update/delete - audit trail), list

**Lifecycle:** Immutable after creation

---

#### competencyRecords

**Purpose:** Worker certifications/licenses (unchanged)

```typescript
competencyRecords: defineTable({
  workerId: v.id("workers"),
  certificationTypeId: v.id("certificationTypes"),

  certificationNumber: v.optional(v.string()),
  issuedBy: v.optional(v.string()),
  issuedDate: v.optional(v.string()),
  expiresAt: v.optional(v.string()),

  status: v.union(
    v.literal("current"),
    v.literal("expired"),
    v.literal("pending_verification")
  ),

  frontPhotoId: v.optional(v.id("mediaFiles")),
  backPhotoId: v.optional(v.id("mediaFiles")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_worker", ["workerId"])
.index("by_certType", ["certificationTypeId"])
.index("by_expires", ["expiresAt"])
.index("by_worker_certType", ["workerId", "certificationTypeId"])
```

**Indexes:**
- `by_worker`: Worker's certifications
- `by_certType`: Workers with cert type
- `by_expires`: Expiring certifications
- `by_worker_certType`: Specific cert for worker

**Relationships:**
- Parent: workers, certificationTypes, mediaFiles (photos)

**Operations:** create, update, expire, list

**Lifecycle:** `current → expired`

---

#### insurancePolicies

**Purpose:** Insurance policy records (unchanged)

```typescript
insurancePolicies: defineTable({
  insuranceTypeId: v.id("insuranceTypes"),

  // Policy holder (one of these)
  orgId: v.optional(v.id("orgs")),
  assetId: v.optional(v.id("assets")),

  policyNumber: v.string(),
  provider: v.string(),
  coverage: v.number(),

  startDate: v.string(),
  expiresAt: v.string(),

  certificateMediaFileId: v.optional(v.id("mediaFiles")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_insuranceType", ["insuranceTypeId"])
.index("by_org", ["orgId"])
.index("by_asset", ["assetId"])
.index("by_expires", ["expiresAt"])
```

**Indexes:**
- `by_insuranceType`: Policies of type
- `by_org`: Org's policies
- `by_asset`: Asset insurance
- `by_expires`: Expiring policies

**Relationships:**
- Parent: insuranceTypes, orgs (optional), assets (optional), mediaFiles (certificate)

**Operations:** create, update, list

**Lifecycle:** `active → expired`

---

#### sdsLibrary

**Purpose:** Safety Data Sheets database (unchanged)

```typescript
sdsLibrary: defineTable({
  orgId: v.optional(v.id("orgs")),
  projectId: v.optional(v.id("projects")),

  productName: v.string(),
  manufacturer: v.optional(v.string()),
  unNumber: v.optional(v.string()),

  hazardClassification: v.optional(v.string()),

  mediaFileId: v.optional(v.id("mediaFiles")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_project", ["projectId"])
.index("by_productName", ["productName"])
```

**Indexes:**
- `by_org`: Org SDS library
- `by_project`: Project SDS
- `by_productName`: Search by product

**Relationships:**
- Parent: orgs (optional), projects (optional), mediaFiles

**Operations:** create, update, list, search

**Lifecycle:** Permanent

---

#### sdsRequests

**Purpose:** SDS request workflow (unchanged)

```typescript
sdsRequests: defineTable({
  projectId: v.id("projects"),
  requestedByWorkerId: v.id("workers"),

  productName: v.string(),
  manufacturer: v.optional(v.string()),

  status: v.union(
    v.literal("pending"),
    v.literal("fulfilled"),
    v.literal("cancelled")
  ),

  fulfilledBy: v.optional(v.id("workers")),
  fulfilledAt: v.optional(v.string()),

  sdsLibraryId: v.optional(v.id("sdsLibrary")),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
.index("by_requester", ["requestedByWorkerId"])
.index("by_status", ["projectId", "status"])
```

**Indexes:**
- `by_project`: Requests for project
- `by_requester`: Worker's requests
- `by_status`: Pending requests

**Relationships:**
- Parent: projects, workers, sdsLibrary (result)

**Operations:** create, fulfill, cancel, list

**Lifecycle:** `pending → fulfilled` or `cancelled`

---

#### signOnConfigs

**Purpose:** Site sign-on configuration (unchanged)

```typescript
signOnConfigs: defineTable({
  projectId: v.id("projects"),

  requireInduction: v.optional(v.boolean()),
  requireSwms: v.optional(v.boolean()),
  requirePrestart: v.optional(v.boolean()),

  inductionTypeIds: v.optional(v.array(v.id("inductionTypes"))),

  customChecks: v.optional(v.array(v.any())),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_project", ["projectId"])
```

**Indexes:**
- `by_project`: Config for project

**Relationships:**
- Parent: projects, inductionTypes

**Operations:** create, update, get

**Lifecycle:** Permanent

---

#### dashboards

**Purpose:** User dashboard layouts (unchanged)

```typescript
dashboards: defineTable({
  userId: v.string(),
  name: v.string(),
  layout: v.optional(v.any()),
  isDefault: v.optional(v.boolean()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_user", ["userId"])
```

**Indexes:**
- `by_user`: User's dashboards

**Relationships:**
- Children: dashboardWidgets

**Operations:** create, update, delete, list

**Lifecycle:** Permanent

---

#### dashboardWidgets

**Purpose:** Dashboard widget configs (unchanged)

```typescript
dashboardWidgets: defineTable({
  dashboardId: v.id("dashboards"),
  widgetType: v.string(),
  config: v.any(),
  position: v.optional(v.any()),
  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_dashboard", ["dashboardId"])
```

**Indexes:**
- `by_dashboard`: Widgets for dashboard

**Relationships:**
- Parent: dashboards

**Operations:** create, update, delete, list

**Lifecycle:** Tied to dashboard

---

#### workflows

**Purpose:** Agentic workflows (multi-step AI processes) (unchanged)

```typescript
workflows: defineTable({
  orgId: v.id("orgs"),
  name: v.string(),
  description: v.optional(v.string()),

  steps: v.array(v.object({
    id: v.string(),
    promptTemplate: v.string(),
    requiresHumanApproval: v.optional(v.boolean()),
    order: v.number(),
  })),

  isActive: v.boolean(),

  metadata: v.optional(v.any()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
.index("by_org", ["orgId"])
.index("by_active", ["orgId", "isActive"])
```

**Indexes:**
- `by_org`: Workflows for org
- `by_active`: Active workflows

**Relationships:**
- Parent: orgs

**Operations:** create, update, list, get

**Lifecycle:** Active/inactive toggle

---

#### (10 more supporting tables preserved: drawings, rfis, rfiResponses, variations, variationItems, progressClaims, claimLineItems, projectRisks, riskControls, constraintExpectations)

*Note: Full specifications for remaining 10 supporting tables follow same pattern - preserved from current schema with minimal changes.*

---

## 5. Relationships & Dependencies

### Depends On

- **03-domain-model.md:** Entities to implement (domain logic)
- **Context.md:** Decisions on schema simplification

### Feeds Into

- **05-ai-system.md:** Schema for MCP tools (db_read, db_write)
- **Backend implementation:** Convex functions
- **Migration scripts:** Data transformation

---

## 6. Implementation Notes

### Migration from Current Schema (97 → 52 tables)

**Phase 1: Remove Deprecated**
```sql
-- Remove legacy tables
DROP TABLE permitApplications;
DROP TABLE chatkitThreads;
DROP TABLE chatkitItems;
```

**Phase 2: Field Cleanup**
```typescript
// assets: Remove redundant fields
// Before: category, identifier, isActive
// After: assetType only (category removed), itemId (identifier removed), status (isActive removed)

// workers: Standardize
// Before: isActive (boolean), trade (string)
// After: status (enum), tradeId (FK)
```

**Phase 3: Merge Comments**
```typescript
// defectComments → defects.comments[]
// actionComments → actionItems.comments[]

// Embed as array of objects:
comments: [{
  id: string,
  workerId: Id<'workers'>,
  comment: string,
  createdAt: string
}]
```

**Phase 4: Consolidate Assets**
```typescript
// assetBookings + assetAssignments → assetAllocations
// Unified with allocationType: 'reservation' | 'assignment'

// assetChecklists + prestartTemplates → assetChecklistConfigs
// Unified with purpose: 'inspection' | 'prestart'
```

**Phase 5: Consolidate Operations**
```typescript
// scheduleShareLinks + schedulePublishes + scheduleConfirmLinks → scheduleShares
// Unified with shareType: 'view_only' | 'confirm'

// scheduleTaskConfirmations → scheduledTasks.confirmations[]
// Embedded array

// assetActivityLogs + toolboxActivityLogs → activityLogs
// Polymorphic with entityType + entityId
```

**Phase 6: Replace ChatKit**
```typescript
// chatkitThreads → conversations
// Generic table, sessionId for Claude SDK

// chatkitItems → conversationMessages
// Standard message format
```

---

### Convex-Specific Patterns

**1. Foreign Keys**
```typescript
// Always use v.id("tableName") for type safety
projectId: v.id("projects")  // ✓ Correct
projectId: v.string()         // ✗ Wrong
```

**2. Optional Fields**
```typescript
// Use v.optional() liberally
description: v.optional(v.string())
// Better than nullable alternatives
```

**3. Indexes**
```typescript
// Critical for performance
.index("by_project", ["projectId"]) // Single field
.index("by_status", ["projectId", "status"]) // Composite
```

**4. Status Enums**
```typescript
// Use v.union() with literals
status: v.union(
  v.literal("draft"),
  v.literal("active")
)
// Not: v.string() with documentation
```

**5. Metadata Fields**
```typescript
// Every table has extensibility
metadata: v.optional(v.any())
// For future needs, experiments, migrations
```

---

### Index Strategy Best Practices

**1. Always Index Project Scope**
```typescript
// Every project-scoped table MUST have this
.index("by_project", ["projectId"])
```

**2. Status Filters**
```typescript
// If table has status field
.index("by_status", ["projectId", "status"])
```

**3. Public Access**
```typescript
// QR codes and share codes
.index("by_qrCode", ["qrCode"])
.index("by_shareCode", ["shareCode"])
```

**4. Polymorphic Lookups**
```typescript
// For sourceType/sourceId pattern
.index("by_source", ["sourceType", "sourceId"])
```

**5. Date Ranges**
```typescript
// For time-based queries
.index("by_date", ["projectId", "date"])
.index("by_expires", ["expiresAt"])
```

---

## 7. Open Questions

### Schema Decisions Needing Resolution

**Q1: Comments Pattern**
- **Current decision:** Embedded arrays (defects.comments[], actionItems.comments[])
- **Alternative:** Keep separate tables for rich features (edit history, reactions)
- **Tradeoff:** Simplicity vs features

**Q2: Activity Logs**
- **Current decision:** Single polymorphic activityLogs table
- **Alternative:** Domain-specific tables for type safety
- **Tradeoff:** Unified queries vs type constraints

**Q3: Template Assignment Pattern**
- **Current decision:** Keep domain-specific assignment tables (permitTypeAssignments, etc.)
- **Alternative:** Generic projectRequirements table
- **Tradeoff:** Type safety vs table count

**Q4: ChatKit Migration Timing**
- **Current decision:** Replace with conversations/conversationMessages now
- **Alternative:** Wait until full AI system redesign
- **Tradeoff:** Clean break vs incremental migration

---

## Appendix

### A. Complete Table List (52 Tables Alphabetical)

1. actionItems
2. activityLogs
3. assets
4. assetAllocations
5. assetChecklistConfigs
6. assetRegisters
7. assetRequests
8. assetServiceLogs
9. attendanceLogs
10. briefings
11. certificationTypes
12. checklistInstances
13. checklistTemplates
14. communications
15. communicationRecipients
16. competencyRecords
17. conversationMessages
18. conversations
19. dashboards
20. dashboardWidgets
21. defectPhotos
22. defects
23. diaries
24. documentChunks
25. documentEntityLinks
26. documentFolders
27. documentUploadLinks
28. executions
29. aiRuns
30. incidentReports
31. incidentTemplateAssignments
32. incidentTemplates
33. inductionCompletions
34. inductionInvites
35. inductionTypes
36. insurancePolicies
37. insuranceTypes
38. mediaFiles
39. notificationPreferences
40. notifications
41. orgs
42. permitInstances
43. permitTypeAssignments
44. permitTypes
45. plantInductionCompletions
46. prestartSubmissions
47. projectCertificationRequirements
48. projectInsuranceRequirements
49. projects
50. scheduleDependencies
51. schedulePhases
52. scheduledTasks
53. scheduleShares
54. sdsLibrary
55. sdsRequests
56. signOnConfigs
57. sourceDocuments
58. swmsAssignments
59. swmsDocuments
60. swmsSignatures
61. swmsTemplates
62. toolboxAttendance
63. toolboxMeetings
64. trades
65. workerAssignments
66. workers
67. workPackages
68. workflows

*(Plus 10 supporting tables: drawings, rfis, rfiResponses, variations, variationItems, progressClaims, claimLineItems, projectRisks, riskControls, constraintExpectations)*

**Total: ~52 core + 10 supporting = 62 tables** (revised from initial 52 estimate)

---

### B. Type Definitions

**Standard Status Lifecycles:**

```typescript
// Simple Lifecycle (projects, phases)
type SimpleStatus = 'active' | 'inactive' | 'archived';

// Review Lifecycle (SWMS, permits, inductions)
type ReviewStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'expired'
  | 'archived';

// Work Lifecycle (defects, actions, incidents)
type WorkStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';
```

**Polymorphic Patterns:**

```typescript
// Source reference
type SourceRef = {
  sourceType: 'asset' | 'incident' | 'defect' | 'checklist' | 'manual';
  sourceId: string;
};

// Entity reference
type EntityRef = {
  entityType: string;
  entityId: string;
};
```

---

### C. Migration Scripts (Pseudocode)

```typescript
// Migrate comments from separate tables to embedded arrays
async function migrateComments() {
  // Get all defects
  const defects = await db.query("defects").collect();

  for (const defect of defects) {
    // Get comments for defect
    const comments = await db.query("defectComments")
      .withIndex("by_defect", q => q.eq("defectId", defect._id))
      .collect();

    // Embed comments in defect
    await db.patch(defect._id, {
      comments: comments.map(c => ({
        id: c._id,
        workerId: c.workerId,
        comment: c.comment,
        createdAt: c.createdAt
      }))
    });
  }

  // Drop old table
  // await db.drop("defectComments");
}

// Merge asset allocations
async function mergeAssetAllocations() {
  // Migrate bookings
  const bookings = await db.query("assetBookings").collect();
  for (const booking of bookings) {
    await db.insert("assetAllocations", {
      assetId: booking.assetId,
      allocationType: "reservation",
      startDate: booking.startDate,
      endDate: booking.endDate,
      // ... other fields
    });
  }

  // Migrate assignments
  const assignments = await db.query("assetAssignments").collect();
  for (const assignment of assignments) {
    await db.insert("assetAllocations", {
      assetId: assignment.assetId,
      allocationType: "assignment",
      workerId: assignment.workerId,
      // ... other fields
    });
  }

  // Drop old tables
  // await db.drop("assetBookings");
  // await db.drop("assetAssignments");
}
```

---

**END OF SPECIFICATION**

This schema document is the authoritative reference for the simplified PRJ Construction database. All implementation must follow these definitions exactly.
