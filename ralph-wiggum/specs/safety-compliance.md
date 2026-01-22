# Safety - Compliance

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Centralized safety compliance management providing SDS library, certification/insurance tracking, safety registers, sign-on configuration, compliance dashboard, and automated expiry alerts for WHS compliance and regulatory requirements.

## Scope
### In Scope
- SDS (Safety Data Sheets) library management at organization level
- SDS version tracking and request workflows
- Worker certifications/licenses/tickets/medical clearances
- Required certifications per project
- Insurance policy tracking (org, subcontractor, asset)
- Required insurance per project
- Safety registers (hazard, risk, contractor, etc.)
- Sign-on configuration with custom forms
- Prestart notices displayed during sign-on
- Compliance dashboard and metrics
- Expiry alerts for certifications, insurance, SDS reviews
- Ticket wallet (mobile worker view of certifications)

### Out of Scope
- Inductions (see safety-inductions.md)
- Permits (see safety-permits.md)
- SWMS (see safety-swms.md)
- Incidents (see safety-incidents.md)
- Quality checklists (see quality-checklists.md)

## Requirements

### SDS Library
- REQ-001: Maintain organization-level SDS library for hazardous materials
- REQ-002: Track SDS versions with document references
- REQ-003: Link SDS documents to projects where materials used
- REQ-004: Request SDS uploads from suppliers/subcontractors via share codes
- REQ-005: Track review dates and expiry status (current, review_due, expired, archived)
- REQ-006: Store supplier company references for each SDS
- REQ-007: Support dual format (new versioned + legacy single-document SDS records)

### Worker Certifications
- REQ-008: Track worker certifications (licenses, tickets, training, medical clearances)
- REQ-009: Store certification details (type, number, issuer, issue/expiry dates, photos front/back)
- REQ-010: Verification workflow (pending, verified, rejected, expired)
- REQ-011: Define certification types at org level (name, code, description, validity period, category)
- REQ-012: Link certifications to induction completion workflow
- REQ-013: Display certifications in mobile ticket wallet with color-coded status (valid, expiring_soon, expired)
- REQ-014: Photo storage for certification cards (front and back)
- REQ-015: Support certification sources (manual, induction, upload)
- REQ-016: Auto-expire certifications based on expiry date
- REQ-017: Expiry warnings at configurable thresholds (expiryWarningDays)

### Required Certifications
- REQ-018: Define required certifications per project
- REQ-019: Flag certifications as org-wide requirements (isRequiredOrgwide)
- REQ-020: Prevent work assignments when required certification expired
- REQ-021: Chief guidance: "Note: This task requires Working at Heights certification. John's certification expired Jan 5. Assign anyway (you may have arranged external cert), or reassign to Sarah (current cert)?"
- REQ-022: Compliance metric: Zero expired certifications (Target 100%)

### Insurance Management
- REQ-023: Define insurance types at org level (name, category: company/organisation/asset, coverage requirements)
- REQ-024: Track insurance policies for orgs, subcontractors, assets (polymorphic owner)
- REQ-025: Store policy details (provider, insurer, policy number, coverage amount, start/expiry dates)
- REQ-026: Link policy documents to sourceDocuments table
- REQ-027: Policy status workflow (pending, valid, expiring, expired, archived)
- REQ-028: Verification workflow (verifiedBy, verifiedAt, submittedAt)
- REQ-029: Define required insurance per project
- REQ-030: Expiry warnings at configurable thresholds (expiryWarningDays)

### Safety Registers
- REQ-031: Support generic register entries (hazard, risk, contractor, etc.)
- REQ-032: Flexible data structure per register type (kind + data object)
- REQ-033: Optional links to workers, assets, orgs
- REQ-034: Query by project and register kind

### Sign-On Configuration
- REQ-035: Configurable site sign-on forms per project
- REQ-036: Support worker, visitor, delivery entry types
- REQ-037: Custom fields with types (text, select, checkbox, etc.)
- REQ-038: Link to prestart notices (requires acknowledgment)
- REQ-039: Default sign-on config per project
- REQ-040: Track SWMS acknowledged IDs during sign-on
- REQ-041: Via QR code sign-on support

### Prestart Notices
- REQ-042: Display safety notices during worker sign-on
- REQ-043: Configurable title, content, effective date, expiry date
- REQ-044: Require acknowledgment before sign-on completion
- REQ-045: Active/inactive status control
- REQ-046: Track creator and creation date

### Compliance Dashboard
- REQ-047: Aggregate compliance metrics across projects
- REQ-048: Zero expired certifications (Target 100%)
- REQ-049: Zero missed inspections (Target 100%)
- REQ-050: Zero overdue corrective actions (Target >95%)
- REQ-051: Audit-ready documentation (Target 100%)
- REQ-052: Cross-project compliance visibility for business owners
- REQ-053: Risk alerts for compliance gaps

### Chief Compliance Automation
- REQ-054: Proactive expiry alerts ("SWMS expiring this week, I've scheduled refreshers")
- REQ-055: Automatic compliance report generation (weekly routine for WHS officer)
- REQ-056: Cross-project pattern detection ("Three projects have same subbie causing delays")
- REQ-057: Compliance assurance monitoring ("All projects compliant, zero expired certifications")
- REQ-058: Guidance not enforcement ("Note: This task requires certification. John's expired. Assign anyway or reassign?")
- REQ-059: Inform, don't block (humans remain accountable for compliance decisions)

### Polymorphic Ownership Clarification
- REQ-060: Insurance policies support three ownership models:
  - Organisation-level (company-wide coverage)
  - Subcontractor-specific (supplier insurance)
  - Asset-specific (equipment/vehicle coverage)
- REQ-061: Query patterns must support filtering by owner type and project context
- REQ-062: Policy expiry impacts vary by owner type:
  - Org-level: Affects all projects
  - Subcontractor: Blocks work assignments
  - Asset: Prevents asset booking/usage

### Certification Source Attribution
- REQ-063: Track certification entry source (manual/induction/upload)
- REQ-064: Induction-linked certifications auto-link via inductionCompletions.tickets
- REQ-065: Manual uploads require admin verification workflow
- REQ-066: Photo uploads (front/back) stored as mediaFiles references

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **sdsLibrary** | orgId, title, companyOrgId, latestVersionId, reviewDate, status | Organization-level SDS library for hazardous materials |
| **sdsVersions** | sdsId, sourceDocumentId, reviewDate, uploadedByOrgId, uploadedByWorkerId | SDS version history and document tracking |
| **sdsProjectLinks** | projectId, sdsId, linkedByWorkerId, isActive | Link org-level SDS to projects where materials used |
| **sdsRequests** | orgId, companyOrgId, projectIds, shareCode, requestedSdsId, linkedSdsId | Request SDS uploads from suppliers via share codes |
| **certificationTypes** | orgId, name, code, category, defaultValidityDays, isRequiredOrgwide, expiryWarningDays | Certification type definitions (license, ticket, training, medical) |
| **competencyRecords** | workerId, certificationTypeId, name, licenseNumber, issueDate, expiryDate, verificationStatus, frontPhotoId, backPhotoId, source | Worker certifications, licenses, tickets, medical clearances |
| **projectCertificationRequirements** | certificationTypeId, projectId, notes | Required certifications per project |
| **insuranceTypes** | orgId, name, category, isRequiredOrgwide, defaultCoverageMinimum, expiryWarningDays | Insurance type definitions |
| **insurancePolicies** | orgId, projectId, insuranceTypeId, provider, policyNumber, coverageAmount, startDate, expiryDate, status, ownerType, ownerAssetId | Insurance policies for orgs, subcontractors, assets |
| **projectInsuranceRequirements** | insuranceTypeId, projectId, minimumCoverage | Required insurance per project |
| **registerEntries** | projectId, kind, workerId, assetId, orgId, data | Generic register entries (hazard, risk, contractor, etc.) |
| **signOnConfigs** | projectId, name, isDefault, visitorAllowed, deliveryAllowed, prestartNoticeId, customFields | Configurable site sign-on/sign-in forms per project |
| **prestartNotices** | projectId, title, content, effectiveDate, expiresAt, requiresAcknowledgement, isActive | Safety notices displayed during worker sign-on |
| **attendanceLogs** | projectId, workerId, date, signOnTime, signOffTime, signOnConfigId, entryType, visitorDetails, formResponses, prestartNoticeAck, swmsAcknowledgedIds, viaQr | Daily worker sign-on/sign-off with compliance extensions |

### Entity Indexes

#### competencyRecords
Additional indexes from schema v4.0:
- `by_expires`: Expiry date sorting for alert generation
- `by_worker_certType`: Unique constraint check

#### insurancePolicies
Additional indexes from schema v4.0:
- `by_expires`: Expiry date sorting for alert generation
- `by_insuranceType`: Policies by type for reporting
- `by_org`, `by_asset`: Owner-specific queries

#### sdsLibrary
Additional indexes:
- `by_org_review`: Review date tracking for alerts
- `by_status`: Filter current/review_due/expired

### Schema Version Reconciliation

**Note:** Spec reflects source schema (convex/schema.ts). Schema v4.0 (cleanup) has differences:

#### certificationTypes
- Source: `category`, `defaultValidityDays`, `isRequiredOrgwide`, `expiryWarningDays`
- v4.0: `validityDays`, `isActive`, `createdAt`, `updatedAt`
- **Migration:** Map defaultValidityDays→validityDays, preserve category/orgwide/warning fields

#### competencyRecords
- Source: `issueDate`, `expiryDate`, `verificationStatus` (pending/verified/rejected/expired)
- v4.0: `issuedDate`, `expiresAt`, `status` (current/expired/pending_verification), requires `certificationTypeId`
- **Migration:** Rename fields, map status values

#### insuranceTypes
- Source: `category` (company/organisation/asset), `isRequiredOrgwide`, `defaultCoverageMinimum`, `expiryWarningDays`
- v4.0: `minimumCoverage`, `isActive`, `createdAt`, `updatedAt`
- **Migration:** Preserve category/orgwide/warning fields

#### insurancePolicies
- Source: `ownerType` (organisation/company/asset), `ownerAssetId` (polymorphic)
- v4.0: `orgId`, `assetId`, `subcontractorId` (separate nullable FKs)
- **Migration:** Map ownerType→appropriate FK

#### sdsVersions
- Source: Full version history table with `sdsId`, `sourceDocumentId`, `reviewDate`
- v4.0: May be simplified or removed (legacy note mentions "dual format")
- **Migration:** Confirm if version tracking preserved or archived

## Workflows

### SDS Request Workflow
1. Admin creates SDS request for supplier (companyOrgId, projectIds, requestedSdsId, dueDate)
2. System generates share code for public upload link
3. Email/notification sent to supplier with upload link
4. Supplier uploads SDS via public link (`/w/upload/[shareCode]`)
5. Upload creates sourceDocument and links to sdsLibrary (linkedSdsId)
6. Request marked uploaded (uploadedAt, uploadedByOrgId, uploadedByWorkerId)
7. Admin links SDS to projects via sdsProjectLinks

### Certification Verification Workflow
1. Worker submits certification (manual upload or via induction)
2. Competency record created with status: pending
3. Admin reviews certification details and photos
4. Admin verifies or rejects (verifiedBy, verifiedAt, rejectionReason)
5. If verified: status → verified, worker can be assigned to tasks requiring certification
6. If rejected: status → rejected, worker receives notification with reason
7. Auto-expiry: System marks expired when expiryDate passes
8. Expiry warning: Notification sent at expiryWarningDays threshold

### Insurance Policy Tracking Workflow
1. Admin defines required insurance types per project (projectInsuranceRequirements)
2. Subcontractor/org uploads insurance policy via form or upload link
3. Insurance policy created with status: pending
4. Admin reviews policy details and document
5. Admin verifies policy (verifiedBy, verifiedAt)
6. Policy status → valid
7. System tracks expiry dates
8. Expiry warning sent at expiryWarningDays threshold
9. On expiry: status → expired, alerts sent, subcontractor blocked from work

### Worker Sign-On with Compliance Workflow
1. Worker scans project QR code or navigates to sign-on screen
2. System loads signOnConfig for project (default or specified)
3. Worker selects entry type (worker/visitor/delivery)
4. If worker: select from dropdown, pre-fill profile
5. If visitor/delivery: enter name, company, phone, purpose
6. Display prestart notice if linked (title, content)
7. Worker acknowledges prestart notice (prestartNoticeAck: true)
8. If configured: display SWMS list for acknowledgment
9. Worker acknowledges SWMS (swmsAcknowledgedIds: [])
10. Display custom fields from signOnConfig (fill form)
11. Worker signs in (signOnTime recorded in attendanceLogs)
12. Worker signs out (signOffTime recorded)

### Compliance Monitoring by Chief
1. Morning Brief: Chief checks all projects for compliance status
2. Chief identifies expiring certifications (within expiryWarningDays)
3. Chief drafts notification: "3 certifications expiring this week: [list]"
4. Chief checks required certifications vs worker assignments
5. Chief flags non-compliant assignments: "John assigned to electrical work but certification expired Jan 5"
6. Chief generates weekly compliance report for WHS officer
7. Chief monitors overdue corrective actions from incidents
8. Chief alerts if compliance metrics below target (e.g., expired certs found)
9. Business owner dashboard shows: "All projects compliant, zero expired certifications" or risk alerts

### SDS Version Management Workflow (Dual Format)
**Note:** System supports two SDS formats during migration:

**New Format (Versioned):**
1. Create sdsLibrary record (title, companyOrgId, hazardCategory)
2. Upload first version → creates sdsVersions record
3. Update sdsLibrary.latestVersionId → points to version
4. Upload new version → creates new sdsVersions record, updates latestVersionId
5. Version history preserved for audit trail

**Legacy Format (Single Document):**
1. sdsLibrary record with embedded document fields (productName, manufacturer, sourceDocumentId)
2. No version tracking
3. Document replacement overwrites previous
4. Migration path: Convert to versioned format on next update

**Project Links:**
- Both formats support sdsProjectLinks (N:N with projects)
- Links remain valid across version updates
- Projects always reference latest version

### Insurance Policy Ownership Model
**Organisation-level policies:**
- Applied to all org projects by default
- Expiry affects org compliance status globally

**Subcontractor policies:**
- Linked via subcontractorId (orgId of supplier company)
- Project-specific via projectId
- Required for work assignment via projectInsuranceRequirements
- Expiry blocks subcontractor workers from site access

**Asset-level policies:**
- Linked via assetId (equipment/vehicle)
- Required for asset booking/allocation
- Expiry prevents asset usage until renewed

## Acceptance Criteria

### SDS Library Management
- AC-001: Admin can create SDS record with title, supplier company, product name, hazard category
- AC-002: Admin can upload new SDS version (creates sdsVersions record, updates latestVersionId)
- AC-003: Admin can view SDS version history with dates and uploaders
- AC-004: Admin can link SDS to multiple projects (sdsProjectLinks)
- AC-005: Admin can search SDS library by title, supplier, product name, hazard category
- AC-006: System tracks review dates and auto-updates status (current → review_due → expired)
- AC-007: Admin receives notification when SDS review due or expired

### SDS Request Workflow
- AC-008: Admin can create SDS request for supplier with due date and message
- AC-009: System generates unique share code (12-char alphanumeric)
- AC-010: Supplier can access upload link without authentication (`/w/upload/[shareCode]`)
- AC-011: Supplier uploads document, creates sourceDocument and links to sdsLibrary
- AC-012: Admin receives notification when supplier completes upload
- AC-013: Admin can cancel request (cancelledAt, cancelledByWorkerId)

### Worker Certifications
- AC-014: Worker can upload certification during induction or via profile
- AC-015: Worker enters cert details (type, number, issuer, issue/expiry dates)
- AC-016: Worker uploads photos (front and back) stored as mediaFiles
- AC-017: Admin can verify certification (status: pending → verified)
- AC-018: Admin can reject certification with reason (status: rejected, rejectionReason)
- AC-019: System auto-expires certifications on expiry date (status: expired)
- AC-020: Worker views certifications in mobile ticket wallet with color-coded status
- AC-021: Valid certs show green background, expiring soon yellow, expired red

### Certification Requirements
- AC-022: Admin defines certification types at org level (name, code, category, validityDays)
- AC-023: Admin flags certification as org-wide requirement (isRequiredOrgwide: true)
- AC-024: Admin defines required certifications per project (projectCertificationRequirements)
- AC-025: Chief guidance appears when assigning worker with expired required certification
- AC-026: Chief message: "Note: This task requires [cert name]. [Worker]'s certification expired [date]. Assign anyway or reassign to [worker with valid cert]?"
- AC-027: Compliance dashboard shows zero expired certifications metric

### Insurance Management
- AC-028: Admin defines insurance types at org level (name, category, coverage requirements)
- AC-029: Admin or subcontractor uploads insurance policy with details and document
- AC-030: Admin verifies insurance policy (status: pending → valid)
- AC-031: System tracks policy expiry dates
- AC-032: Admin receives expiry warning at configurable threshold (expiryWarningDays)
- AC-033: Admin defines required insurance per project (projectInsuranceRequirements)
- AC-034: System tracks polymorphic policy ownership (org, company, asset via ownerType/ownerAssetId)

### Sign-On Configuration
- AC-035: Admin creates sign-on config per project with custom fields
- AC-036: Admin enables visitor and/or delivery entry types
- AC-037: Admin links prestart notice to sign-on config (requires acknowledgment)
- AC-038: Worker scans project QR code, loads sign-on screen with configured fields
- AC-039: Worker acknowledges prestart notice before sign-in
- AC-040: Worker acknowledges SWMS if configured
- AC-041: System records sign-on with entryType, formResponses, prestartNoticeAck, swmsAcknowledgedIds

### Compliance Dashboard
- AC-042: Business owner views multi-project compliance dashboard
- AC-043: Dashboard shows aggregate metrics: expired certs, missed inspections, overdue actions
- AC-044: Dashboard shows compliance status per project (compliant/at risk/non-compliant)
- AC-045: Business owner receives risk alerts for compliance gaps
- AC-046: Chief generates compliance report showing: all certifications current, all SWMS signed, all inspections completed

### Chief Compliance Automation
- AC-047: Chief proactively identifies expiring certifications/insurance (within warning threshold)
- AC-048: Chief drafts notifications for expiring items and presents for approval
- AC-049: Chief generates weekly compliance report automatically
- AC-050: Chief provides guidance (not enforcement) on compliance decisions
- AC-051: Chief informs user of compliance requirements but allows override with documentation
- AC-052: Compliance metrics tracked and reported: zero expired certs, zero missed inspections, zero overdue corrective actions

### SDS Version Management
- AC-053: Admin uploads new SDS version, system creates sdsVersions record
- AC-054: sdsLibrary.latestVersionId auto-updates to newest version
- AC-055: Project links (sdsProjectLinks) reference parent sdsLibrary, not specific version
- AC-056: Version history displays: version number, upload date, uploader, replacement notes
- AC-057: Legacy SDS records (no versions) display single document with migration prompt

### Insurance Ownership
- AC-058: Admin creates org-level policy (orgId only, no assetId/subcontractorId)
- AC-059: Admin creates subcontractor policy (subcontractorId + projectId)
- AC-060: Admin creates asset policy (assetId only)
- AC-061: Compliance dashboard aggregates by ownership type:
  - Org policies: Global status
  - Subcontractor policies: Per-project status
  - Asset policies: Per-asset status
- AC-062: Expired asset policy prevents booking with message: "[Asset] insurance expired [date]. Cannot allocate until renewed."

### Certification Photo Management
- AC-063: Worker uploads front photo → creates mediaFile, links to competencyRecords.frontPhotoId
- AC-064: Worker uploads back photo → creates mediaFile, links to competencyRecords.backPhotoId
- AC-065: Admin views certification, sees front/back photos side-by-side
- AC-066: Mobile ticket wallet displays front photo thumbnail, tap to enlarge
- AC-067: Photo validation: Max 10MB, formats: JPG/PNG/PDF

## Dependencies

### Upstream Dependencies
- **Workers** (workers table): Certification ownership, sign-on logs
- **Projects** (projects table): Scope for sign-on configs, SDS links, requirements
- **Organizations** (orgs table): SDS library ownership, insurance policy ownership, certification types
- **Source Documents** (sourceDocuments table): SDS documents, insurance policy documents, certification photos
- **Media Files** (mediaFiles table): Certification photos (front/back), insurance documents

### Downstream Dependencies
- **Inductions** (inductionCompletions table): Certifications captured during induction workflow
- **Worker Assignments** (workerAssignments table): Prevent assignment when required certification expired
- **Attendance Logs** (attendanceLogs table): Sign-on/sign-off compliance tracking
- **Chief Agent**: Compliance monitoring, expiry alerts, guidance generation
- **Notifications**: Expiry warnings, compliance alerts, request notifications
- **Webhooks**: cert.expiring_soon event triggers external notifications

### Cross-Module Integration
- **Safety-Inductions**: Certifications linked via inductionCompletions.tickets field
- **Site-Operations**: Sign-on configs control attendance workflow, prestart notices displayed during sign-on
- **Asset-Management**: Insurance policies linked to assets via ownerType/ownerAssetId
- **Quality-Defects**: Compliance violations can trigger defect creation
- **Communications**: Notifications for expiry warnings, compliance alerts
- **Chief-Agent**: Compliance monitoring, automated report generation, guidance on non-compliant actions
