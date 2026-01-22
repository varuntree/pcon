# Safety - Incidents

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Business Rules](#business-rules)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)
- [Notes](#notes)

## Purpose
Incident reporting, investigation workflow, root cause analysis, and corrective action planning with full audit trail.

## Scope

### In Scope
- Incident reporting (injury, near miss, property damage, environmental)
- Investigation workflow with status tracking
- Investigation templates for structured data collection
- Corrective action planning and tracking
- Witness statements and involved parties tracking
- Root cause analysis documentation
- Photo/evidence attachment
- Integration with checklists for investigation forms
- Mobile incident reporting (field workers)
- Chief AI-driven incident analysis

### Out of Scope
- External regulator notification (manual process)
- Insurance claim processing (external system)
- Legal compliance enforcement (guidance only)
- Workers compensation claims (external system)

## Requirements

### Reporting
- REQ-001: Workers can report incidents via mobile (quick capture, voice-to-text descriptions, photo upload)
- REQ-002: Incident types: injury, near_miss, property_damage, environmental, other
- REQ-003: Severity levels: low, medium, high, critical
- REQ-004: Capture: what happened (description), when (occurredAt timestamp), where (location), who involved (worker IDs), witnesses (worker IDs)
- REQ-005: Photo attachments for evidence
- REQ-006: Auto-notify supervisor on critical incidents
- REQ-007: Link incidents to related entities (assets, defects, actions, checklists)
- REQ-008: Source tracking: report can originate from checklist, prestart, or manual
- REQ-009: Incident numbering: auto-generated unique per project

### Investigation
- REQ-010: Investigation status: pending → in_progress → completed
- REQ-011: Assign investigator (worker ID)
- REQ-012: Investigation notes field for findings
- REQ-013: Root cause field for determined cause
- REQ-014: Link to investigation checklist instance
- REQ-015: Investigation templates: configurable per organization
- REQ-016: Template assignment: enable templates per project
- REQ-017: Template sections: structured investigation forms
- REQ-018: Investigator can update status throughout lifecycle
- REQ-019: Chief AI can analyze incident patterns and suggest root causes
- REQ-020: Chief AI orchestrates investigation workflow with subagents

### Corrective Actions
- REQ-021: Corrective actions array: list of planned actions
- REQ-022: Link to action items table for trackable actions
- REQ-023: Zero overdue corrective actions target: >95%
- REQ-024: Chief AI monitors corrective action completion
- REQ-025: Chief AI escalates overdue corrective actions
- REQ-026: Link defects created from incident (via linkedDefectIds)
- REQ-027: Corrective actions tracked to closure

### Compliance & Audit
- REQ-028: Full audit trail (who reported, when, who investigated, when closed)
- REQ-029: Immutable incident records after creation (updates tracked)
- REQ-030: Report generation for WHS officer (compliance documentation)
- REQ-031: Chief provides compliance assurance (zero expired investigations)

### Mobile Worker Experience
- REQ-032: Incident list screen: view all incidents, tap to view detail
- REQ-033: Incident detail screen: read-only view of full incident
- REQ-034: Incident report screen: multi-step form (description, date/time, location, severity, involved workers, photos)
- REQ-035: Incident report flow: fill form → submit → status: open → auto-notify supervisor → confirmation
- REQ-036: Form fields: what happened (textarea), when (date/time picker), where (location input), severity (minor/moderate/serious), who involved (worker selector), photos (optional camera capture)
- REQ-037: Quick capture optimized for field conditions (large touch targets, minimal text input, voice-to-text)
- REQ-038: Conditional UI fields: injury type shows injuryDetails card + witnesses section
- REQ-039: Photo upload required for property/environmental types
- REQ-040: Witnesses section: dynamic add/remove rows, two-column input (name, contact)

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| incidentReports | projectId, templateId, incidentNumber, incidentType, severity, description, location, occurredAt, reportedByWorkerId, reportedAt, involvedWorkerIds, involvedAssetIds, witnessWorkerIds, investigationStatus, investigationNotes, rootCause, correctiveActions, checklistInstanceId, linkedDefectIds, linkedActionIds, attachmentIds | Core incident records with full lifecycle tracking |
| incidentTemplates | orgId, name, description, sections, isActive | Reusable investigation templates (org-level) |
| incidentTemplateAssignments | incidentTemplateId, projectId, isEnabled, isDefault, assignedBy, assignedAt | Enable templates per project |

### Schema Details

**incidentReports**
```typescript
{
  projectId: v.id("projects"), // Required
  templateId: v.optional(v.id("incidentTemplates")), // Optional investigation template
  incidentNumber: v.string(), // Auto-generated unique (e.g., INC-001)
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
  description: v.string(), // What happened
  location: v.string(), // Where it happened
  occurredAt: v.string(), // ISO timestamp when it happened
  reportedByWorkerId: v.id("workers"), // Who reported
  reportedAt: v.string(), // ISO timestamp when reported
  involvedWorkerIds: v.array(v.id("workers")), // Workers involved
  involvedAssetIds: v.array(v.id("assets")), // Assets involved
  witnessWorkerIds: v.array(v.id("workers")), // Witnesses
  investigationStatus: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed")
  ),
  investigationNotes: v.optional(v.string()), // Investigation findings
  rootCause: v.optional(v.string()), // Determined root cause
  correctiveActions: v.array(v.string()), // Planned corrective actions
  checklistInstanceId: v.optional(v.id("checklistInstances")), // Linked investigation checklist
  linkedDefectIds: v.array(v.id("defects")), // Defects created from incident
  linkedActionIds: v.array(v.id("actionItems")), // Action items created
  attachmentIds: v.array(v.id("mediaFiles")), // Photos/evidence
  metadata: v.optional(v.any()),
  createdAt: v.string(), // ISO timestamp
  updatedAt: v.string() // ISO timestamp
}
```

**Indexes:**
- `by_project` [projectId]
- `by_type` [projectId, incidentType]
- `by_severity` [projectId, severity]
- `by_reporter` [reportedByWorkerId]
- `by_date` [projectId, occurredAt]

**incidentTemplates**
```typescript
{
  orgId: v.id("orgs"), // Required (org-level template)
  name: v.string(),
  description: v.optional(v.string()),
  sections: v.array(v.object({
    id: v.string(),
    title: v.string(),
    questions: v.array(v.string())
  })), // NOTE: Source doesn't have sections - templates are simple type definitions
  isActive: v.boolean(),
  metadata: v.optional(v.any()),
  createdAt: v.string() // ISO timestamp
  // NOTE: No updatedAt in source
}
```

**Indexes:**
- `by_org` [orgId]
- `by_active` [orgId, isActive]

**incidentTemplateAssignments**
```typescript
{
  incidentTemplateId: v.id("incidentTemplates"),
  projectId: v.id("projects"),
  isEnabled: v.boolean(),
  isDefault: v.boolean(),
  assignedBy: v.id("workers"), // Who enabled this template
  assignedAt: v.string() // ISO timestamp
}
```

**Indexes:**
- `by_project` [projectId]
- `by_template` [incidentTemplateId]
- `by_project_template` [projectId, incidentTemplateId] (unique check)

### Relationships
- **incidentReports → projects** (many-to-one): Each incident belongs to one project
- **incidentReports → incidentTemplates** (many-to-one, optional): Investigation template used
- **incidentReports → workers** (many-to-many): Reporter, involved workers, witnesses, investigator
- **incidentReports → assets** (many-to-many): Involved assets
- **incidentReports → checklistInstances** (one-to-one, optional): Linked investigation checklist
- **incidentReports → defects** (one-to-many): Defects created from incident
- **incidentReports → actionItems** (one-to-many): Action items created from incident
- **incidentReports → mediaFiles** (one-to-many): Photo attachments
- **incidentTemplates → orgs** (many-to-one): Org-level templates
- **incidentTemplateAssignments → incidentTemplates + projects** (junction table): Enable templates per project

### Polymorphic Linking Pattern

Incidents do NOT store `linkedDefectIds` or `linkedActionIds` arrays.

**Instead, link FROM the entity side:**

**Defects linking to incident:**
```typescript
defect: {
  sourceType: 'incident',
  sourceId: Id<'incidentReports'>
}
```

**Action items linking to incident:**
```typescript
actionItem: {
  sourceType: 'incident',
  sourceId: Id<'incidentReports'>
}
```

**Benefits:**
- Single source of truth
- No array maintenance
- Query pattern: `db.query("defects").withIndex("by_source", q => q.eq("sourceType", "incident").eq("sourceId", incidentId))`

## Workflows

### Workflow: Incident Management
1. **Incident Reported** (mobile worker)
   - Worker completes incident report form (multi-step)
   - Fields: description, occurredAt, location, severity, involvedWorkerIds, photos
   - Submit → status: pending
   - Auto-notify supervisor if severity = critical

2. **Investigation Assigned**
   - Supervisor assigns investigator (workerId)
   - Status: pending → in_progress
   - Optional: Assign investigation template
   - Optional: Create investigation checklist instance

3. **Investigation Conducted**
   - Investigator fills investigation notes
   - **TRIGGER**: Create investigation checklist instance from template.checklistTemplateId
     - Store in incidentReports.checklistInstanceId
     - Checklist contains root cause analysis questions
     - Must be completed before closing incident
   - Investigator determines root cause (from checklist responses)
   - Investigator plans corrective actions (array)

4. **Corrective Actions Created**
   - Create action items from corrective actions array
   - Link action items to incident (linkedActionIds)
   - Optional: Create defects (linkedDefectIds)

5. **Investigation Completed**
   - Investigator updates status: in_progress → completed
   - All corrective actions must be planned
   - Root cause must be documented
   - Incident record closed (immutable)

6. **Corrective Actions Tracked**
   - Action items tracked to completion
   - Chief AI monitors overdue corrective actions
   - Chief AI escalates if >5% overdue (target: >95% on-time)

### Workflow: Chief AI Incident Analysis
1. **Incident Created**
   - Chief detects new critical incident
   - Chief sends notification: "Critical incident raised: {description}. I've notified {supervisor} and marked area unsafe."
   - Chief provides instant summary to PM

2. **Pattern Detection**
   - Chief analyzes incident patterns across project
   - Chief surfaces insights: "Pattern detected: 3 near-miss incidents in electrical work area this month. Root cause appears to be inadequate PPE enforcement."
   - Chief suggests preventive actions

3. **Investigation Orchestration** (Subagent Workflow)
   - **incident-orchestrator** (Opus): Coordinates investigation workflow
   - **incident-investigator** (Sonnet): Analyzes incident data, suggests root causes
   - **corrective-action-planner** (Opus): Plans corrective actions based on root cause
   - **compliance-reviewer** (Haiku): Validates compliance documentation

4. **Compliance Monitoring**
   - Chief tracks investigation completion rate
   - Chief escalates overdue investigations
   - Chief generates compliance reports for WHS officer
   - Target: Zero expired investigations (100%)

## Business Rules

### Form Validation
- **Required fields**: incidentType, date, description, reportedBy
- **Conditional requirements**:
  - Injury type → injuryDetails object required
  - Property/Environmental type → photos required (attachmentIds not empty)
  - Injury type → witnesses array shown (optional)
- **Submit state**: Disabled until all required fields valid

### Investigation Completion Criteria
Before transition to closed status:
1. Checklist status = completed
2. All critical corrective actions created
3. Root cause documented (from checklist)
4. Investigation notes present

### Auto-Selection Behavior
- **Reporter**: If reportedBy not provided, auto-select first worker in list (single-worker project convenience)
- **Template type sync**: When template selected, incidentType auto-populated from template.incidentType (user can override)

## Acceptance Criteria

### Reporting
- AC-001: Worker can submit incident report via mobile in <2 minutes
- AC-002: Critical incidents auto-notify supervisor within 10 seconds
- AC-003: Incident number auto-generated (sequential per project: INC-001, INC-002, etc.)
- AC-004: Photos uploaded and linked to incident record
- AC-005: Voice-to-text description capture works on mobile

### Investigation
- AC-006: Investigator can update investigation status (pending → in_progress → completed)
- AC-007: Investigation notes and root cause fields editable by investigator
- AC-008: Investigation checklist instance linkable to incident
- AC-009: Investigation templates assignable per project
- AC-010: Default template auto-selected when creating investigation

### Corrective Actions
- AC-011: Corrective actions array stores planned actions
- AC-012: Action items creatable from incident (linkedActionIds)
- AC-013: Defects creatable from incident (linkedDefectIds)
- AC-014: Chief AI monitors overdue corrective actions (>95% on-time target)
- AC-015: Chief AI escalates if corrective actions overdue >7 days

### Compliance
- AC-016: All incidents have complete audit trail (reporter, investigator, timestamps)
- AC-017: Incident records immutable after creation (updates tracked in activity log)
- AC-018: Compliance report generation for WHS officer (all incidents, investigations, corrective actions)
- AC-019: Chief provides compliance assurance: "Zero overdue investigations: 100%"

### Mobile Experience
- AC-020: Incident list screen displays all project incidents (filtered by worker if applicable)
- AC-021: Incident detail screen shows full incident data (read-only)
- AC-022: Incident report form supports multi-step wizard (description → details → photos → submit)
- AC-023: Form validates required fields (description, occurredAt, location, severity)
- AC-024: Photo capture works with rear camera (environment mode)
- AC-025: Confirmation screen shows success message and incident number
- AC-026: Injury type fields shown only when incidentType = 'injury' (injuryDetails card, witnesses section)
- AC-027: Photo upload required validation for property/environmental types
- AC-028: Witnesses section supports dynamic add/remove rows with two-column input
- AC-029: Reporter auto-selected if not provided (first worker convenience)
- AC-030: Template selection auto-populates incidentType from template.incidentType

### Conditional UI Fields

**Injury Type Fields** (only when incidentType = 'injury'):
- Injury Details Card (nested, accent background):
  - Nature of Injury (text input): "Cut", "Fracture", "Burn"
  - Body Location (text input): "Left hand", "Right knee"
  - Treatment Required (checkbox)
- Witnesses Section:
  - Dynamic add/remove rows
  - Two-column input per row (name, contact)
  - Trash icon to remove row
  - No validation (optional capture)

**Photo Requirements**:
- Property/Environmental types: Upload required (validate attachmentIds.length > 0)
- Injury/Near Miss: Optional
- Upload accepts image/* only
- Uses ActionAttachments component (upload + preview + remove)

### Chief AI
- AC-031: Chief detects critical incidents and sends instant notifications
- AC-032: Chief analyzes incident patterns and surfaces insights
- AC-033: Chief orchestrates investigation workflow with subagents
- AC-034: Chief generates compliance reports on demand
- AC-035: Chief escalates overdue corrective actions proactively

## Dependencies

### Internal
- **workers table**: Reporter, investigator, involved workers, witnesses
- **projects table**: Project scope
- **assets table**: Involved assets
- **checklistInstances table**: Investigation checklists
- **defects table**: Defects created from incident
- **actionItems table**: Corrective action tracking
- **mediaFiles table**: Photo attachments
- **activityLogs table**: Audit trail
- **orgs table**: Organization for templates

### External (Chief AI)
- **domain-incidents skill**: Incident reporting and investigation expertise
  - **Location**: `.claude/skills/domain-incidents/SKILL.md`
  - **Triggers**: incident, investigation, hazard, near miss, injury, corrective action
  - **Capabilities**:
    - Create incident reports from natural language description
    - Analyze incident patterns across project
    - Suggest root causes based on incident type/context
    - Generate corrective actions from root cause
    - Monitor investigation completion (overdue alerts)
    - Compliance reporting (zero expired investigations)
  - **References**:
    - `incident-types.md` - Type definitions and severity mapping
    - `investigation-checklist-patterns.md` - Standard investigation questions per type
    - `corrective-action-library.md` - Common corrective actions by hazard type
- **incident-orchestrator subagent** (Opus): Coordinates multi-step investigation workflow
- **incident-investigator subagent** (Sonnet): Analyzes incident data, suggests root causes
- **corrective-action-planner subagent** (Opus): Plans corrective actions based on root cause
- **compliance-reviewer subagent** (Haiku): Validates compliance documentation

### UI Components
- **Mobile**: IncidentsScreen, IncidentDetailScreen, IncidentReportScreen (multi-step form)
- **Desktop**: Incident dashboard, incident detail view, investigation workflow

### Webhooks
- **incident.created**: New incident report → Full incident details (incidentNumber, title, severity, location, reportedBy, occurredAt, description, url)
- **incident.closed**: Incident closure → Resolution + corrective actions

### PDF Generation
- **incident-report template**: 3-8 pages, 2 signatures (investigator + closer), includes photos
- **Verification QR code**: SHA256 hash for authenticity

## Notes

### Source Schema Differences
**incidentReports table** (source vs spec):
- Source uses `date` field (not `occurredAt`) - **Migration**: Use `date` field, keep `reportedAt` (when reported, different from occurred)
- Source has NO `createdAt`/`updatedAt` timestamps - **Migration**: Remove from spec (source is correct)
- Source uses simpler structure: `workerId` (singular, not `involvedWorkerIds` array), `assetId` (singular, not `involvedAssetIds` array), `reportedBy` + `investigatorId` (not `reportedByWorkerId`) - **Migration**: Use source structure
- Source has `witnesses` array with `name`/`contact` objects (not just IDs) - **Migration**: Use source structure for witnesses
- Source does NOT have `linkedDefectIds`/`linkedActionIds` - **Migration**: Link from defect/action side using `sourceType`/`sourceId` pattern
- Source has NO `investigationStatus` enum - **Migration**: Use main `status` field (open/under_investigation/closed)

**incidentTemplates table** (source vs spec):
- Source has NO `sections` structure - **Migration**: Remove from spec (templates are simple type definitions, investigation forms handled by linked `checklistTemplateId`)
- Source has `createdAt` but NO `updatedAt` - **Migration**: Keep `createdAt`, remove `updatedAt`

**incidentTemplateAssignments table** (source vs spec):
- No differences (aligned with source)

### Schema Migration Strategy

**Critical Changes Required:**

1. **Date field**: Use `date` instead of `occurredAt` (keep `reportedAt` separate for when reported vs when occurred)
2. **Timestamps**: Remove `updatedAt` from incidentReports (source has no updatedAt)
3. **Worker fields**: Change from arrays to singular:
   - `workerId: v.id("workers")` (single affected worker, not array)
   - `reportedBy: v.id("workers")` (reporter)
   - `investigatorId: v.optional(v.id("workers"))` (investigator)
4. **Asset field**: Change to singular `assetId: v.optional(v.id("assets"))`
5. **Witnesses structure**: Change from IDs to objects:
   ```typescript
   witnesses: v.optional(v.array(v.object({
     name: v.string(),
     contact: v.string() // phone or email
   })))
   ```
6. **Investigation status**: Remove `investigationStatus` enum, use main `status` field with values: open, under_investigation, closed
7. **Linked entities**: Remove `linkedDefectIds` and `linkedActionIds` arrays - link from defect/action side using polymorphic pattern:
   - defects: `sourceType: 'incident'`, `sourceId: incidentId`
   - actionItems: `sourceType: 'incident'`, `sourceId: incidentId`
8. **Template sections**: Remove elaborate sections structure from incidentTemplates - templates are simple type definitions, investigation forms handled via:
   ```typescript
   incidentTemplates: {
     checklistTemplateId: v.optional(v.id("checklistTemplates"))
   }
   ```
9. **Injury details**: Add to incidentReports:
   ```typescript
   injuryDetails: v.optional(v.object({
     natureOfInjury: v.string(),
     bodyLocation: v.string(),
     treatmentRequired: v.boolean()
   }))
   ```

### Investigation Forms
Investigation forms are handled via the **checklists system** (not embedded sections):
- Create investigation checklist template (checklistTemplates table)
- Link template to incident type (incidentTemplates.checklistTemplateId)
- Create checklist instance when investigation starts (checklistInstances table)
- Link checklist instance to incident (incidentReports.checklistInstanceId)

### Polymorphic Links
Defects and action items link TO incidents (not FROM incidents):
- **defects**: `sourceType: 'incident'`, `sourceId: incidentId`
- **actionItems**: `sourceType: 'incident'`, `sourceId: incidentId`

### Chief AI Integration
- **Proactive identification**: Chief monitors all incidents, identifies critical patterns
- **Exception escalation**: Chief escalates critical incidents instantly
- **Compliance automation**: Chief tracks investigation completion, generates reports
- **Pattern detection**: Chief analyzes incident patterns across projects (org-level intelligence)
- **Corrective action monitoring**: Chief tracks action items to closure, escalates overdue (>95% target)

### Mobile Simulator
- **Demo worker**: Test worker can report incidents, view incident list, view incident details
- **QR code access**: Not applicable for incidents (authenticated flow only)
- **Touch optimization**: Large touch targets (44px), bold typography, high contrast for outdoor visibility

### Performance Targets
- **Incident report submission**: <2 minutes from open to submit
- **Critical incident notification**: <10 seconds from submit to supervisor notification
- **Photo upload**: <5 seconds per photo (optimized compression)
- **Investigation status update**: Instant (real-time Convex sync)
