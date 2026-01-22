# Asset Management

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Track and manage physical assets (plant, equipment, vehicles, tools) across projects. Control asset allocation through bookings and assignments. Enable QR-based workflows for asset access and prestarts.

## Scope

### In Scope
- Asset registers (organizational categories: plant, equipment, vehicles, tools)
- Assets (individual items with QR codes, metadata, status tracking)
- Asset allocations (unified bookings + assignments: who has what, when)
- Booking requests (approval workflow for reservations)
- Asset checklist configurations (recurring inspections + prestart checks)
- QR code integration (asset lookup, prestart workflows, public access)
- Service/maintenance tracking
- Insurance tracking

### Out of Scope
- Prestart execution workflows (see asset-operations.md)
- Maintenance scheduling logic (see asset-operations.md)
- Defect creation from prestart failures (see quality-defects.md)

## Requirements

### Asset Registers (Categories)

**REQ-001: Organizational Asset Registers**
- System MUST support asset registers at org level and project level
- Registers group assets by type: plant, equipment, vehicle, tool, other
- Each register has: name, description, assetType
- Registers are permanent (no soft delete via isActive)

**REQ-002: Register Scoping**
- Org-level registers: reusable templates across projects
- Project-level registers: project-specific asset tracking
- Assets link to registers via registerId FK

### Assets (Items)

**REQ-003: Asset Records**
- Each asset has: orgId (owner), projectId (optional), registerId (category), itemId (auto-generated unique), assetType, name, description, make, model, serialNumber, registrationNumber (vehicles), purchaseDate, imageId, qrCode, status, metadata
- Auto-numbering: itemId generated per org (e.g., ASSET-001)
- QR codes: freeform format (e.g., QR-123ABC), indexed by_qrCode for fast lookup
- Status lifecycle: available → in_use → maintenance → retired

**REQ-004: Asset Status Management**
- Status values: available, in_use, maintenance, retired
- Source schema has 6 values (active, available, assigned, maintenance, inactive, disposed)
- Migration mapping: assigned→in_use, active→available, inactive/disposed→retired
- Field duplication cleanup: consolidate category/assetType, identifier/itemId, isActive/status

**REQ-005: Asset Metadata**
- Vehicle-specific: rego (registration), vin, year, odometerKm, odometerHours
- Equipment-specific: make, model, serialNumber
- Last prestart: lastPrestartAt timestamp
- Image: imageId FK to mediaFiles

**Vehicle Field Validation:**
- rego: Alphanumeric, 2-8 chars, indexed for lookup
- vin: 17 chars, alphanumeric (no I, O, Q), checksum validation
- year: 1900-current year, number
- odometerKm: Non-negative number, tracked on prestart (metadata.odometerKm)
- odometerHours: Non-negative number, tracked on prestart (metadata.odometerHours)
- Odometer must increment or stay same across prestarts (validation: current >= previous)

**REQ-006: Asset QR Codes**
- Every asset MAY have qrCode field (freeform string)
- QR indexed by_qrCode for collision-free lookups
- Org-scoped (multiple orgs can use same QR code pattern)
- Public access workflow: `/asset/[qrCode]` shows asset details + maintenance history + enabled checklists

### Asset Allocations (Bookings + Assignments)

**REQ-007: Unified Allocation System**
- Replaces separate assetBookings + assetAssignments tables
- Two allocation types:
  - reservation: Future booking (pending/active)
  - assignment: Active custody (who currently has asset)
- Fields: assetId, projectId (optional), allocationType, workerId (optional), orgId (optional), startDate, endDate, allocatedAt, returnedAt, status, notes, metadata
- Status lifecycle: pending → active → completed or cancelled

**REQ-008: Allocation Lifecycle and Conflict Detection**
- Status lifecycle: pending → active → completed or cancelled
- Conflict detection rules:
  - Overlapping allocations: assetId + [startDate, endDate) (exclusive end)
  - Check: new.startDate < existing.endDate AND new.endDate > existing.startDate
  - Exclude: cancelled or completed allocations
  - Grace period: Allow back-to-back bookings (endDate = startDate of next)
- Supervisor override: Can force allocation despite conflicts (logs warning in activityLogs)
- Conflict resolution: UI shows conflicting allocations, suggests alternative dates

**REQ-009: Allocation Assignment**
- Allocations assigned to: workerId (individual), orgId (subcontractor), or both
- ProjectId tracks which project asset allocated to
- Timestamps: allocatedAt (when allocation created), returnedAt (when completed)

### Booking Requests (Approval Workflow)

**REQ-010: Asset Booking Requests**
- Renamed from assetBookingRequests to assetRequests
- Request types: booking (reserve asset), transfer (move between projects), maintenance (schedule service)
- Fields: assetId, projectId, requestedByWorkerId, requestType, startDate, endDate, purpose, status, approvedBy, approvedAt, rejectionReason, allocationId (resulting allocation), metadata
- Status lifecycle: pending → approved or rejected or cancelled

**REQ-011: Request Approval Flow**
- Worker creates request → supervisor approves/rejects
- On approval: creates assetAllocation record, links via allocationId
- On rejection: stores rejectionReason
- User can cancel pending request

### Asset Checklist Configurations

**REQ-012: Unified Checklist System**
- Replaces assetChecklists + prestartTemplates
- Links asset to checklist template with purpose
- Fields: assetId, checklistTemplateId, purpose (inspection|prestart), frequency (daily|weekly|monthly|quarterly|annually|on_use), isActive, metadata
- Purpose types:
  - inspection: Recurring maintenance inspections (scheduled)
  - prestart: Pre-use safety checks (on-demand, per use)

**REQ-013: Checklist Frequency**
- Recurring inspections: daily, weekly, monthly, quarterly, annually
- Prestart checks: on_use (triggered by worker using asset)
- Active/inactive toggle: isActive field

### Prestart Submissions

**REQ-014: Prestart Records**
- Fields: assetId, projectId, templateId (legacy FK to prestartTemplates), checklistInstanceId (NEW: links to unified checklist system), performedByWorkerId, performedAt, responses, photoIds, passed, issues, metadata
- Dual template system: legacy templateId + new checklistInstanceId for migration
- Pass/fail: passed boolean, issues array (failed items)
- Immutable: records permanent after creation (audit trail)

**REQ-015: Prestart Responses**
- Responses: field-level key-value map (same structure as checklists)
- Photos: photoIds array (FK to mediaFiles)
- Issues: array of failed items (itemId, description)
- Metadata: odometerKm, odometerHours for vehicle tracking

### Service Logs

**REQ-016: Maintenance Records**
- Fields: assetId, projectId (optional), serviceType, description, performedBy, performedAt, cost, nextServiceDue, attachmentIds, metadata
- Service types: maintenance, repair, inspection, calibration, other
- Next service: nextServiceDue field for scheduling
- Attachments: array of mediaFileIds
- Immutable: permanent records after creation

**REQ-017: Service History**
- All service records queryable by assetId
- Indexed by_asset, by_type, by_date, by_nextDue
- Cost tracking: optional cost field (decimal)
- Performer tracking: performedBy string (name or company)

### Plant Equipment Integration

**REQ-018: Plant Induction Tracking**
- System MUST track plant equipment qualifications via plantInductionCompletions
- Fields: workerId, assetTypeId (asset type qualified for), inductionTypeId (template), completedAt, expiresAt, certificateMediaFileId
- Indexed by_worker, by_assetType, by_expires for fast qualification lookups
- Integration: Workers must have valid plant qualification (non-expired) to receive asset allocations for assetType

**REQ-019: Plant Checklist Configuration**
- checklistTemplates support plant-specific fields:
  - isPlantInduction: boolean (marks template as plant qualification)
  - plantRegisterId: optional FK to assetRegisters (template applies to all assets in register)
  - plantAllItemsInRegister: boolean (template covers all items)
  - plantAssetIds: optional array (template specific to asset IDs)
- checklistInstances link to plant context: plantRegisterId, plantAssetId, plantBookingId (legacy)

### QR Code Workflows

**REQ-020: Public QR Access Implementation**
- Route: GET `/api/public/asset/[qrCode]`
- No authentication required
- Response format:
  ```typescript
  {
    asset: { id, name, assetType, make, model, status, imageId },
    register: { name, assetType },
    maintenanceHistory: prestartSubmissions[] (last 10, passed only),
    enabledChecklists: checklistTemplateId[] (isEnabledForQr=true),
    canReportIssue: boolean (requires auth)
  }
  ```
- Error handling:
  - 404: QR code not found or asset retired
  - 429: Rate limit exceeded (10 req/min per IP)
- CORS: Allow all origins for public access
- Integration: Uses shareCodes table (type='asset', code=qrCode, entityId=assetId) for centralized QR management

**REQ-021: Prestart QR Flow**
- Public route: `/prestart/[qrCode]`
- No authentication required if template.publicAccess = true
- Workflow: scan QR → resolve asset + template → render checklist form → submit → pass/fail → success/failure screen
- On failure: asset status → maintenance, defects/actions auto-created

### Insurance Tracking

**REQ-022: Insurance Policies for Assets**
- insurancePolicies table supports ownerType='asset'
- Fields: ownerAssetId (FK to assets), policyType, provider, policyNumber, coverageAmount, startDate, expiryDate, documentId, status
- Status lifecycle: pending → valid → expiring → expired → archived
- Policy types defined in insuranceTypes table (with category='asset')

**Asset Insurance Types (via insuranceTypes table):**
- Category='asset' policy types:
  - Public Liability (plant/equipment/vehicles)
  - Comprehensive (vehicles only)
  - Third Party Property Damage (vehicles only)
  - Equipment All Risks (plant/equipment only)
  - Hired-In Plant Insurance (allocated plant)
- Each type has: name, category='asset', description, isRequired (per project/org policy)

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **assetRegisters** | orgId, projectId?, name, assetType | Asset category containers (plant, equipment, vehicles, tools) |
| **assets** | orgId, projectId?, registerId, itemId, assetType, name, qrCode?, status | Individual physical assets with QR codes |
| **assetAllocations** | assetId, allocationType, workerId?, orgId?, startDate, endDate, status | Unified bookings + assignments (who has asset, when) |
| **assetRequests** | assetId, projectId, requestedByWorkerId, requestType, status, allocationId? | Booking/transfer/maintenance approval workflow |
| **assetChecklistConfigs** | assetId, checklistTemplateId, purpose, frequency, isActive | Recurring inspections + prestart check configuration |
| **prestartSubmissions** | assetId, projectId, performedByWorkerId, passed, issues, checklistInstanceId? | Completed prestart checks (links to unified checklist system) |
| **assetServiceLogs** | assetId, projectId?, serviceType, performedBy, performedAt, cost?, nextServiceDue? | Maintenance and repair records |
| **insurancePolicies** | ownerType='asset', ownerAssetId, policyNumber, coverageAmount, expiresAt, status | Insurance coverage for assets |
| **plantInductionCompletions** | workerId, assetTypeId, inductionTypeId, completedAt, expiresAt, certificateMediaFileId | Plant equipment qualifications tracking |

## Workflows

### 1. Asset Registration
1. Admin creates assetRegister (org or project level) with assetType
2. Admin creates asset record: name, make, model, serial, registerId, generates QR code
3. System auto-generates itemId (e.g., ASSET-001)
4. Asset status initialized to "available"
5. Optional: Upload asset photo (imageId)

### 2. Asset Booking (Reservation)
1. Worker browses available assets (status: available, no active allocations)
2. Worker creates assetRequest: assetId, requestType=booking, startDate, endDate, purpose
3. Request status: pending
4. Supervisor reviews request → approves or rejects
5. On approval: system creates assetAllocation (allocationType=reservation, status=pending)
6. On startDate: allocation status → active
7. On endDate or manual return: allocation status → completed, asset status → available

### 3. Asset Assignment (Active Custody)
1. Supervisor assigns asset to worker: creates assetAllocation (allocationType=assignment, workerId, status=active)
2. Asset status → in_use
3. Worker has custody until assignment completed
4. On return: allocation status → completed, returnedAt timestamp, asset status → available

### 4. Prestart Check Workflow
1. Worker scans asset QR code or taps asset in app
2. System loads prestartTemplate via assetChecklistConfigs (purpose=prestart)
3. Worker completes checklist fields (yesno, number, photo, signature)
4. Optional: Enter odometer readings (km + hours)
5. System evaluates pass/fail: all required fields filled, all yesno="yes", photo if required
6. **Pass**: asset status → operational, submission logged
7. **Fail**: asset status → maintenance, defects auto-created (one per failed item), actions created, submission logged with issues array

### 5. Recurring Inspection Scheduling
1. Admin configures assetChecklistConfig: assetId, checklistTemplateId, purpose=inspection, frequency=weekly
2. System generates checklistInstance records based on frequency
3. Worker receives notification when inspection due
4. Worker completes inspection via checklist workflow
5. On completion: checklistInstance status → completed, nextInspectionDue calculated

### 6. Service/Maintenance Logging
1. Worker or admin navigates to asset detail
2. Creates assetServiceLog: serviceType, description, performedBy, performedAt, cost
3. Optional: Upload attachments (invoices, photos)
4. Optional: Set nextServiceDue date
5. Record saved (immutable)
6. Service history visible in asset detail view (last 10 records)

### 7. QR Code Public Access
1. Worker scans asset QR code (no app login)
2. Browser opens public URL: `/asset/[qrCode]`
3. System resolves asset via by_qrCode index
4. Display: asset details, maintenance history, enabled checklists (isEnabledForQr=true)
5. Optional: "Report Issue" button (redirects to auth flow, then defect creation)

## Acceptance Criteria

### Asset Registration
- AC-001: Admin can create asset register with org or project scope
- AC-002: Assets auto-generate unique itemId per org
- AC-003: QR codes indexed for fast lookup (<100ms)
- AC-004: Asset status transitions follow lifecycle (available → in_use → maintenance → retired)

### Allocation Management
- AC-005: System prevents overlapping allocations (conflict detection on startDate/endDate)
- AC-006: Booking request approval creates allocation record with allocationId link
- AC-007: Allocation completion updates asset status to available
- AC-008: Worker can view assigned assets (allocationType=assignment, workerId=current user)

### Prestart Workflows
- AC-009: Prestart submission evaluates pass/fail correctly (all yesno=yes, required fields filled)
- AC-010: Failed prestart creates defects (one per failed item) and sets asset status to maintenance
- AC-011: Passed prestart logs submission with passed=true, asset remains operational
- AC-012: Prestart records immutable after creation (audit trail)

### Checklist Configuration
- AC-013: Admin can link asset to checklist template with purpose (inspection|prestart)
- AC-014: Frequency options support daily/weekly/monthly/quarterly/annually/on_use
- AC-015: Inactive configs (isActive=false) excluded from scheduling/workflows

### Service Tracking
- AC-016: Service logs store cost, nextServiceDue, attachments
- AC-017: Service history queryable by asset (last N records)
- AC-018: Service records immutable after creation

### QR Code Access
- AC-019: Public QR URL (`/asset/[qrCode]`) resolves asset without auth
- AC-020: QR flow shows asset details, maintenance history (last 10), enabled checklists
- AC-021: "Report Issue" button requires authentication before defect creation
- AC-025: Public QR API returns 404 for invalid QR codes or retired assets
- AC-026: QR public route enforces rate limiting (10 requests/min per IP)

### Plant Integration
- AC-027: Workers with valid plant qualifications can receive allocations for qualified asset types
- AC-028: Plant induction completions track expiresAt, prevent allocation after expiry
- AC-029: Checklist templates support plant-specific fields (isPlantInduction, plantRegisterId, plantAssetIds)

### Vehicle Validation
- AC-030: VIN validation enforces 17 chars, alphanumeric (excluding I, O, Q), checksum validation
- AC-031: Odometer readings increment or stay same across prestarts (current >= previous)

### Insurance Tracking
- AC-022: Assets support insurance policies via ownerType='asset', ownerAssetId
- AC-023: Insurance expiry tracked with expiresAt field
- AC-024: Insurance status lifecycle: pending → valid → expiring → expired → archived

## Dependencies

### Internal Dependencies
- **quality-defects.md**: Prestart failures create defects (one per failed item)
- **quality-checklists.md**: assetChecklistConfigs links to checklistTemplates for inspection/prestart structure
- **asset-operations.md**: Prestart execution workflow, maintenance scheduling logic
- **safety-compliance.md**: Insurance policies via insurancePolicies table (ownerType='asset')
- **site-documents.md**: Asset photos via mediaFiles (imageId FK), service attachments (attachmentIds array)
- **mobile-qr.md**: Public QR code workflows (`/asset/[qrCode]`, `/prestart/[qrCode]`)

### External Dependencies
- **Schema (04-schema.md)**: Table definitions, indexes, relationships
- **AI System (05-ai-system.md)**: domain-assets skill for equipment management
- **UI System (06-ui-system.md)**: Asset status colors (CSS variables: --status-active-bg/text, --status-available-bg/text, --status-assigned-bg/text, --status-inactive-bg/text, --status-maintenance-bg/text, --status-disposed-bg/text)
- **Mobile Demo (07-mobile-demo.md)**: Worker simulator asset screens (Assets, AssetDetail, Prestarts, PrestartDetail), QR flows
- **Integrations (08-integrations.md)**: QR code generation (`generateShareCode()`), asset QR lookup via shareCodes table (type='asset')

### Migration Notes
- **Field Consolidation**: Remove category (use assetType), remove identifier (use itemId), remove isActive (use status enum)
- **Status Migration**: active→available, assigned→in_use, inactive/disposed→retired
- **Table Merging**: assetBookings + assetAssignments → assetAllocations (allocationType discriminator)
- **Checklist Migration**: assetChecklists + prestartTemplates → assetChecklistConfigs (purpose discriminator)
- **Dual Template Support**: prestartSubmissions has templateId (legacy) + checklistInstanceId (new) for gradual migration
- **Vehicle Fields**: Add rego, vin, year, odometerKm, odometerHours to assets schema
- **Lifecycle Fields**: Add lastPrestartAt timestamp for last prestart completion tracking

### AI Integration
- **Chief Actions**: Equipment defect impacts quality checklist (cross-module awareness)
- **Domain Skill**: domain-assets skill for equipment management, maintenance tracking
- **Tool Integration**: ai.db_read for asset queries, ai.db_write for allocation/service log creation
- **Proactive Monitoring**: Chief identifies assets overdue for inspection, allocations past endDate, insurance expiring soon

### UI Components
- **Status Badge**: Asset status colors via CSS variables (`--status-{status}-bg/text`)
- **Asset Card**: Display asset details, QR code, status, current allocation
- **Allocation Timeline**: Visual representation of bookings/assignments over time
- **Service History**: Last N service logs with cost, nextServiceDue
- **QR Code Display**: qr-code-display.tsx component for asset QR codes
- **Photo Gallery**: Asset images, service attachments, prestart photos

### Performance Considerations
- **QR Lookup**: by_qrCode index for <100ms resolution
- **Allocation Conflicts**: by_dates index (assetId + startDate + endDate) for conflict detection
- **Service History**: Limit to last N records (e.g., 10) in list views, full history on detail page
- **DTO Enrichment**: List view (minimal: asset name, status, current allocation), Detail view (full: register, image, service history, allocations)

### Security & Access Control
- **Org Scoping**: All asset tables have orgId (required), filtered automatically by MCP layer
- **Project Scoping**: Assets support optional projectId for project-specific tracking
- **Public QR Access**: `/asset/[qrCode]` public route (no auth), "Report Issue" requires authentication
- **Allocation Permissions**: Workers can view own allocations, supervisors can approve requests
- **Service Log Audit**: Immutable records, performedBy tracking, timestamp logging
