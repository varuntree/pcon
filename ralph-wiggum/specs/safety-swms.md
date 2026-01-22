# Safety - SWMS

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Safe Work Method Statements (SWMS) — templates, documents, signatures, assignments, AI-assisted creation, public signing.

## Scope
### In Scope
- SWMS templates (org-level reusable templates)
- SWMS documents (project-level instances)
- Signatures and acknowledgments (internal + external)
- Worker assignments to SWMS
- AI-assisted SWMS creation workflow (subagent orchestration)
- Public signing via share codes (no auth)
- SWMS lifecycle (draft → pending_review → approved → expired → archived)
- Contextual help ("You're about to work on electrical, here's the SWMS")
- PDF export with signatures
- Australian WHS compliance

### Out of Scope
- General risk assessments (see `safety-compliance.md`)
- JSAs/JHAs (separate from SWMS)
- Training materials (see `safety-inductions.md`)
- Incident investigation (see `safety-incidents.md`)

## Requirements

### Templates
- REQ-001: Org-level SWMS templates with 13 section types (Project Details, Scope of Work, Legislation, Definitions, Responsibilities, Training, PPE, Hazards & Controls, Emergency Procedures, Plant & Equipment, Environmental, Sign-Off, Review)
- REQ-002: Templates support status (draft|published|archived) with version tracking
- REQ-003: Templates store structured sections array with id, type, content, order
- REQ-004: Templates immutable after publishing (create new version instead)
- REQ-005: Templates cloneable for customization

**Note**: Some legacy references mention "12 sections" - the modern system uses 13 sections including both Sign-Off and Review sections. Both are required for compliance.

### Documents
- REQ-006: Project-level SWMS documents instantiated from templates or created from scratch
- REQ-007: SWMS documents have auto-generated swmsNumber (SWMS-001, SWMS-002, etc.)
- REQ-008: Documents store: title, revision, status, tasks (with hazards), hrcwActivities, hazardousMaterials, plantEquipment, ppeRequirements, trainingRequirements, permitsRequired, legislation, emergencyProcedures, supervision
- REQ-009: Documents support lifecycle: draft → pending_review → approved → expired → archived
- REQ-010: Documents require approval before assignment to workers
- REQ-011: Documents track approvedBy, approvedAt, expiresAt
- REQ-012: Documents have public shareCode for external worker signing
- REQ-013: SWMS expiry proactive monitoring ("SWMS expiring this week, I've scheduled refreshers")
- REQ-014: Schedule delay affects SWMS validity detection (Chief cross-module awareness)

### Signatures
- REQ-015: Internal signatures (workerId + signatureData base64 PNG + signedAt)
- REQ-016: External signatures (workerName + workerCompany + signatureData + signedAt)
- REQ-017: Signatures immutable audit trail (no deletion)
- REQ-018: Sign SWMS workflow: review sections → acknowledge (3 checkboxes) → draw signature → submit
- REQ-019: Signature validation: SWMS status = approved, all checkboxes checked, signature canvas not empty
- REQ-020: Morning workflow tracking: "1 SWMS signed by 8 workers (electrical work)"
- REQ-021: Worker mobile flow: tap SWMS → view sections (collapsible) → acknowledge → sign → submit

### Assignments
- REQ-022: Worker assignments to SWMS (swmsDocumentId + workerId + assignedAt + acknowledgedAt)
- REQ-023: Assignments unique per worker-SWMS pair
- REQ-024: Query unsigned SWMS per worker (assigned but not signed)
- REQ-025: Query SWMS expiring soon for compliance
- REQ-026: End-of-day summary: "SWMS refresh required: 6 workers (certification expiring)"

### AI Creation
- REQ-027: AI-assisted SWMS creation via subagent orchestration
- REQ-028: Subagent workflow: hazard-analyzer (Opus) → swms-validator (Sonnet) → swms-writer (Sonnet)
- REQ-029: Parallel execution: hazard analysis + validation concurrent
- REQ-030: Hazard analyzer identifies hazards for activity with task context (location, crew, equipment)
- REQ-031: SWMS validator checks completeness (all 13 sections, hazards ≥3 entries, controls ≥2 per hazard, PPE listed, emergency plan)
- REQ-032: SWMS writer generates structured document from analysis
- REQ-033: Chief provides undo option after SWMS creation
- REQ-034: SWMS skill loaded with database-write skill for execution

### Public Signing
- REQ-035: Public SWMS signing via `/w/swms/{code}` (no auth)
- REQ-036: Share code 12-character random alphanumeric (AbCdEfGhIjKl format)
- REQ-037: External signature form: name input, company input (optional), signature canvas
- REQ-038: Duplicate name check for external signatures
- REQ-039: Public view shows: document sections (scope, PPE, tasks, hazards, controls, emergency)
- REQ-040: Share code indexed by_shareCode for fast lookup
- REQ-041: Share code state gating: SWMS must be approved before signing

### PDF Export
- REQ-042: Server-side PDF generation for signed SWMS
- REQ-043: PDF layout includes: header (logo, doc number, project, date, version, status), work activity, organization details (principal contractor, ABN, supervisor, license), risk assessment matrix (L/M/H/E), hazards & controls with risk levels, required PPE checklist, HRCW flags, emergency contacts, signatures (images, names, roles, timestamps), generation timestamp, verification QR code
- REQ-044: Verification QR code URL: `/verify/{entityType}/{entityId}/{hash}`
- REQ-045: Hash: SHA256 of (entityId + signatures + timestamp)
- REQ-046: Public verification page shows: entity details, signatures, generation timestamp
- REQ-047: PDF stored as mediaFile for audit trail

### Compliance
- REQ-048: SWMS tables preserved exactly as-is for legal WHS compliance (every field critical)
- REQ-049: Hazards & Controls section: identify activity, list hazards, map controls, rate risk (before/after)
- REQ-050: Australian WHS Regulations compliance
- REQ-051: Chief knows WHS regulations, weaves into guidance (not enforcement)
- REQ-052: Compliance automation: "SWMS expiring this week, I've scheduled refreshers"

### Worker Mobile Experience
- REQ-053: Workers sign SWMS before work starts
- REQ-054: Contextual help: "You're about to work on electrical, here's the SWMS"
- REQ-055: Mobile-optimized signature canvas (300x150, clear button)
- REQ-056: Large touch targets (44x44px minimum)
- REQ-057: Collapsible sections for readability
- REQ-058: Acknowledgments (3 checkboxes): "I acknowledge the hazards", "I understand the controls", "I will use required PPE"
- REQ-059: SWMS list: signed/unsigned filter, tap to view/sign

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **swmsTemplates** | orgId, name, description, sections[], status (draft\|published\|archived), version, createdBy | Org-level reusable SWMS templates with 13 section types |
| **swmsDocuments** | projectId, templateId?, swmsNumber, title, revision, status (draft\|pending_review\|approved\|expired\|archived), createdBy, approvedBy, approvedAt, expiresAt, shareCode, tasks[], hrcwActivities[], hazardousMaterials[], plantEquipment[], ppeRequirements[], trainingRequirements[], permitsRequired[], legislation{}, emergencyProcedures, supervision | Project-specific SWMS instances (60+ fields, 12 section types) |
| **swmsSignatures** | swmsDocumentId, workerId?, workerName, workerCompany, signatureType (internal\|external), signatureData (Base64 PNG), signedAt | Digital signatures (internal workers + external) - immutable audit trail |
| **swmsAssignments** | swmsDocumentId, workerId, assignedAt, acknowledgedAt | Worker assignments + acknowledgements with unique constraint |

## Workflows

### Workflow: SWMS Lifecycle
1. **Template created** (org-level)
   - Status: draft
   - Sections array populated with 13 section types
   - Version 1
2. **Template published** (org-level)
   - Status: draft → published
   - Template immutable (clone for changes)
3. **Document drafted** (project-level)
   - From template (templateId) or from scratch
   - Auto-generate swmsNumber (SWMS-001)
   - Status: draft
4. **Document reviewed**
   - Status: draft → pending_review
   - AI validator checks completeness
5. **Document approved**
   - Status: pending_review → approved
   - Set approvedBy, approvedAt, expiresAt
   - Generate shareCode for public signing
6. **Workers assigned**
   - Create swmsAssignments (workerId + assignedAt)
   - Query unsigned SWMS per worker
7. **Workers sign**
   - Internal: workerId + signature canvas → swmsSignatures (internal)
   - External: public link → name + company + signature → swmsSignatures (external)
   - Update swmsAssignments.acknowledgedAt
8. **SWMS active**
   - All signatures collected
   - Workers can commence work
   - Webhook event: `swms.signed`
9. **SWMS expired**
   - expiresAt passed
   - Status: approved → expired
   - Chief alerts: "SWMS expiring this week, I've scheduled refreshers"
10. **SWMS archived**
    - Status: expired → archived
    - PDF export for compliance records

### Workflow: AI-Assisted SWMS Creation
1. **User request**
   - User: "Create SWMS for concrete pouring, Level 3 slab"
   - Chief skill: domain-swms loaded
2. **Hazard analysis** (Opus subagent, parallel)
   - Input: activity, taskContext (location, crew, equipment)
   - Output: identified hazards, risk ratings
3. **Validation** (Sonnet subagent, parallel)
   - Check completeness (13 sections, hazards ≥3, controls ≥2/hazard, PPE, emergency plan)
   - Output: validation report
4. **Document creation** (Sonnet subagent)
   - Input: hazard analysis + validation report
   - Output: structured swmsDocument
5. **Chief presents result**
   - Show created SWMS with undo option
   - Suggest next actions (assign workers, publish)

### Workflow: Public SWMS Signing (External Workers)
1. **Worker scans QR code** (site entrance, toolbox)
   - QR code URL: `/w/swms/{shareCode}`
   - shareCode: 12-char random (e.g., AbCdEfGhIjKl)
2. **Public page loads**
   - Validate shareCode active + SWMS approved (state gating)
   - Display SWMS sections (collapsible)
3. **Worker reviews SWMS**
   - Scope of work
   - Hazards identified
   - Control measures
   - PPE requirements
   - Emergency procedures
4. **Worker signs**
   - Enter name (required)
   - Enter company (optional)
   - Duplicate name check
   - Draw signature on canvas (300x150)
5. **Signature submitted**
   - Create swmsSignature (external)
   - Store signatureData (base64 PNG)
   - Inline confirmation
6. **Optional: Continue to app**
   - Link to full worker app (if authenticated)

### Workflow: Morning Brief - SWMS Compliance
1. **Chief overnight monitoring**
   - Scan all active SWMS for expiresAt approaching
   - Identify unsigned SWMS (assigned but not signed)
   - Detect schedule delays affecting SWMS validity
2. **Morning brief**
   - Overnight Activity: "1 SWMS signed by 8 workers (electrical work)"
   - What Needs Attention: [DECISION] SWMS renewal required (custom conditions)
   - What I've Drafted: SWMS renewal pre-filled template
3. **End-of-day summary**
   - Tomorrow's Focus: "SWMS refresh required: 6 workers (certification expiring)"
   - Compliance: "100% (all certifications current, all SWMS signed)"

## Acceptance Criteria

### Templates
- [ ] Org admin creates SWMS template with 13 sections
- [ ] Template status: draft → published → archived
- [ ] Template versioning creates new record (previousVersionId)
- [ ] Template clone preserves structure, resets status to draft
- [ ] Template deletion blocked if swmsDocuments reference it

### Documents
- [ ] PM creates SWMS from template (sections pre-filled)
- [ ] PM creates SWMS from scratch (blank sections)
- [ ] Auto-generated swmsNumber unique per project (SWMS-001, SWMS-002)
- [ ] Document lifecycle: draft → pending_review → approved
- [ ] Approved SWMS generates shareCode (12-char random)
- [ ] Expiry monitoring: Chief alerts 7 days before expiresAt
- [ ] Schedule delay detection: Chief warns if delay affects SWMS validity

### Signatures
- [ ] Internal worker signs SWMS (workerId + signature)
- [ ] External worker signs SWMS via public link (name + company + signature)
- [ ] Signature validation: approved SWMS, 3 checkboxes, non-empty canvas
- [ ] Signatures immutable (no delete, audit trail)
- [ ] Query unsigned SWMS per worker (assignedAt but not acknowledgedAt)

### Assignments
- [ ] PM assigns SWMS to workers (creates swmsAssignments)
- [ ] Assignment unique per worker-SWMS (by_swms_worker index)
- [ ] Worker acknowledges SWMS (acknowledgedAt set on signature)
- [ ] Query SWMS expiring soon for compliance dashboard

### AI Creation
- [ ] User requests SWMS creation with activity + context
- [ ] domain-swms skill loads with database-write skill
- [ ] Subagent orchestrator invokes hazard-analyzer (Opus) + swms-validator (Sonnet) in parallel
- [ ] swms-writer (Sonnet) creates structured document
- [ ] Chief presents result with undo option
- [ ] Review checklist: all 13 sections, hazards ≥3, controls ≥2/hazard, PPE, emergency plan

### Public Signing
- [ ] External worker accesses `/w/swms/{shareCode}` (no auth)
- [ ] Validate shareCode active + SWMS approved (state gating)
- [ ] Display SWMS sections (collapsible: scope, PPE, tasks, hazards, controls, emergency)
- [ ] External signature form: name (required), company (optional), signature canvas
- [ ] Duplicate name check before submission
- [ ] Create swmsSignature (external) with base64 PNG
- [ ] Inline confirmation + optional link to full app

### PDF Export
- [ ] Generate signed SWMS PDF with all sections + signatures
- [ ] PDF layout: header, work activity, org details, risk matrix, hazards & controls, PPE, HRCW, emergency, signatures, verification QR
- [ ] Verification QR code: SHA256 hash of (entityId + signatures + timestamp)
- [ ] PDF stored as mediaFile for audit trail
- [ ] Public verification page `/verify/{type}/{id}/{hash}` shows entity details + signatures + timestamp

### Worker Mobile
- [ ] Worker views SWMS list (signed/unsigned filter)
- [ ] Worker taps SWMS → view sections (collapsible)
- [ ] Worker acknowledges (3 checkboxes): hazards, controls, PPE
- [ ] Worker draws signature (300x150 canvas, clear button)
- [ ] Worker submits → swmsSignature created, assignment acknowledgedAt set
- [ ] Contextual help: "You're about to work on electrical, here's the SWMS"

### Compliance
- [ ] All SWMS tables preserved exactly (legal WHS compliance)
- [ ] Chief monitors SWMS expiry, alerts 7 days before
- [ ] Chief detects unsigned SWMS (assigned but not signed)
- [ ] Chief cross-module awareness: schedule delay → SWMS validity warning
- [ ] Morning brief shows: overnight SWMS signatures, expiring SWMS, unsigned SWMS
- [ ] Compliance metric: 100% SWMS signed before work commencement

## Dependencies

### Internal
- `foundation.md` — projectId/orgId scope enforcement
- `safety-compliance.md` — WHS regulations, compliance metrics
- `mobile-worker.md` — worker mobile interactions, signature canvas
- `mobile-qr.md` — public QR flows, share code generation
- `integrations.md` — PDF generation, verification QR codes
- `ui-system.md` — SplitPreviewLayout (3-column builder: nav, editor, preview)
- `chief-agent.md` — AI-assisted creation, subagent orchestration
- `chief-tools.md` — domain-swms skill, database-write skill, undo system

### Schema
- `swmsTemplates` table (org-level)
- `swmsDocuments` table (project-level, 60+ fields)
- `swmsSignatures` table (internal + external)
- `swmsAssignments` table (worker assignments)
- `mediaFiles` table (PDF storage, signature images)

### External
- Australian WHS Regulations 2011
- ISO 45001 (Occupational Health and Safety)
- Anthropic Claude SDK (Opus for hazard analysis, Sonnet for validation/writing)
- MCP server (database access)
- Convex (real-time reactive database)
- PDF generation library (Puppeteer or React-PDF)
- QR code generation library (`qrcode` v1.5.4)
- Share code generation library (`nanoid`)
