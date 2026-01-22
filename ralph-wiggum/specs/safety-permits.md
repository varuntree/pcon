# Safety - Permits

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Permit type definitions (org-level templates), permit instances (project-level applications), 9-state lifecycle, approval workflow, checklist integration.

## Scope

### In Scope
- Permit types (org-level templates: Hot Work, Confined Space, Height Work, Electrical Isolation, etc.)
- Permit instances (project-level applications with 9-state lifecycle)
- Type assignments (enable permit types per project)
- Approval workflow (draft → submitted → approved → active → closed)
- Rejection/suspension/expiration/cancellation paths
- Checklist integration (optional required checklist per permit type)
- Validity periods (validityHours, validFrom/validTo)
- Applicant tracking (worker or external)
- Form data storage (dynamic fields from permit type)
- Proactive expiration alerts

### Out of Scope
- External permit authority integration (council permits - handled via document uploads)
- Permit renewal workflow (create new instance)
- Permit variations (create new instance with reference)
- Permit conditions compliance tracking (separate compliance module)
- Physical permit printing/QR codes (integrations.md)

## Requirements

### Permit Types (Org-Level Templates)

**REQ-001: Permit Type Creation**
- Org admins create permit types with: name, description, requiredFields (dynamic form definition), defaultValidityHours (default duration in hours)
- Optional: checklistTemplateId (linked checklist), riskLevel (low|medium|high)
- Examples: Hot Work Permit, Confined Space Entry, Working at Heights, Electrical Isolation, Crane Lifting, Excavation

**REQ-002: Permit Type Assignment to Projects**
- Admins enable permit types per project via permitTypeAssignments
- Track: defaultApproverId (default approver for this project), enabledBy (who enabled), enabledAt
- One type can be enabled on multiple projects
- Disabled types hidden from worker permit application forms

**REQ-003: Permit Type Deactivation**
- Org admins can deactivate permit types (isActive flag)
- Deactivated types remain visible on historical permits but hidden from new applications
- Cannot delete types with existing instances

### Permit Instances (Project-Level Applications)

**REQ-004: Permit Application Creation**
- Workers create permit instances: permitTypeId, applicantId (workerId or external), workDescription, location, requestedStartAt, requestedEndAt
- Auto-generate permitNumber (e.g., PERMIT-001 per project)
- Initial status: draft
- Store applicant details: applicantName, applicantCompany (for external applicants)

**REQ-005: Dynamic Form Data**
- Permit types define requiredFields (array of field definitions)
- Instance stores formData (field responses matching type structure)
- Support field types: text, textarea, number, select, multiselect, date, yesno, checkbox

**REQ-006: Permit Submission**
- Worker submits draft permit (status: draft → submitted)
- Track: submittedAt timestamp
- Notify assigned approver (defaultApproverId from type assignment)

**REQ-007: Permit Approval**
- Approver reviews submitted permit
- Can approve (status: submitted → approved) or reject (status: submitted → rejected)
- Track: approvedBy, approvedAt, approvalSignatureData (optional signature)
- Rejection: store rejectedBy, rejectedAt, rejectionReason

**REQ-008: Permit Activation**
- Approved permits activate automatically at validFrom or manually (status: approved → active)
- Track: validFrom, validTo (calculated from requestedStartAt + validityHours)
- activatedAt timestamp

**REQ-009: Permit Suspension**
- Active permits can be suspended (status: active → suspended)
- Track: suspendedAt, suspendReason
- Can resume (suspended → active) with notes

**REQ-010: Permit Closure**
- Active permits closed when work complete (status: active → closed)
- Track: closedBy, closedAt, closureNotes
- Cannot reopen closed permits

**REQ-011: Permit Expiration**
- System auto-expires permits at validTo (status: active → expired)
- Track: expiredAt
- Proactive alerts: 24h before expiry, 1h before expiry

**REQ-012: Permit Cancellation**
- Any permit can be cancelled before activation (status: draft/submitted/approved → cancelled)
- Track: cancelledAt
- Cannot cancel active permits (must suspend then close)

### Lifecycle (9 States)

**REQ-013: Permit Lifecycle States**
1. **draft** - created, not submitted
2. **submitted** - awaiting approval
3. **approved** - approved, not yet active
4. **active** - work in progress, within validity period
5. **suspended** - temporarily halted
6. **closed** - work complete, normal termination
7. **expired** - validTo passed without closure
8. **rejected** - approval denied
9. **cancelled** - cancelled before activation

**REQ-014: State Transitions**
```
draft → submitted (worker submits)
submitted → approved (approver approves)
submitted → rejected (approver rejects)
approved → active (manual activation or auto at validFrom)
active → suspended (safety concern, work paused)
suspended → active (resume work)
active → closed (work complete)
active → expired (auto at validTo if not closed)
draft/submitted/approved → cancelled (cancel before activation)
```

**REQ-015: State Validation**
- Cannot approve without all required fields filled
- Cannot activate before requestedStartAt
- Cannot close without linked checklist completion (if required)
- Cannot modify after closure/expiration/rejection/cancellation

### Indexes

**REQ-026: Permit Instance Indexes**
- `by_project` (projectId) - list permits per project
- `by_permitType` (permitTypeId) - instances of permit type
- `by_status` (projectId, status) - filter by workflow state
- `by_applicant` (applicantId) - worker's permit history
- `by_permitNumber` (permitNumber) - unique permit lookup
- `by_validTo` (validTo) - expiration queries for Chief proactive monitoring

### Checklist Integration

**REQ-016: Required Checklist per Permit Type**
- Permit types can require checklist completion (checklistTemplateId)
- Permit instance links to checklistInstanceId when created
- Worker must complete checklist before permit closure
- Checklist status tracked separately (checklistInstances table)

**REQ-017: Checklist Enforcement**
- If permit type has checklistTemplateId:
  - Auto-create checklist instance on permit approval
  - Link via permitInstance.checklistInstanceId
  - Block permit closure if checklist status ≠ completed

### Approvals and Signatures

**REQ-018: Approval Workflow**
- Approver assigned via permitTypeAssignment.defaultApproverId
- Can override approver per permit instance
- Approver reviews: permit details, form data, risk level
- Approval actions: approve with optional signature, reject with reason

**REQ-019: Digital Signatures**
- Optional approval signature (approvalSignatureData: base64 PNG)
- Signature stored with approvedBy, approvedAt
- Display on permit export/PDF

**REQ-020: Applicant Tracking**
- applicantId (FK to workers) for internal workers
- applicantName, applicantCompany for external applicants (subcontractors)
- Track who applied vs who approved (separation of duties)

### Proactive Notifications

**REQ-021: Expiration Alerts**
- Chief monitors permitInstances.validTo
- 24h before expiry: notify applicant + approver
- 1h before expiry: urgent notification
- Auto-expire at validTo (status: active → expired)

**REQ-022: Overdue Submission Alerts**
- Track permits in draft state >2 days
- Notify applicant to submit or cancel

**REQ-023: Approval Pending Alerts**
- Track permits in submitted state >4 hours
- Notify approver to review

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **permitTypes** | orgId, name, description, requiredFields (array of field definitions), defaultValidityHours, checklistTemplateId (optional), riskLevel (low\|medium\|high), isActive, metadata | Permit type templates (org-level) |
| **permitTypeAssignments** | permitTypeId, projectId, defaultApproverId (optional), enabledBy (optional), enabledAt (optional), isEnabled (boolean) | Enable permit types per project with default approver |
| **permitInstances** | permitNumber (REQUIRED auto-gen), projectId, permitTypeId, applicantId, applicantName, applicantCompany, workDescription, location, requestedStartAt, requestedEndAt, status (9 states), approvedBy, approvedAt, approvalSignatureData, rejectedBy, rejectedAt, rejectionReason, submittedAt, activatedAt, suspendedAt, suspendReason, closedBy, closedAt, closureNotes, cancelledAt, expiredAt, validFrom, validTo, checklistInstanceId, formData, metadata, createdAt | Permit applications with full lifecycle tracking |

## Workflows

### Workflow: Permit Lifecycle (9 States)

**Draft → Submitted → Approved → Active → Closed** (Normal Path)
1. Worker creates permit (status: draft)
2. Worker submits for approval (status: submitted, submittedAt)
3. Approver approves (status: approved, approvedBy, approvedAt)
4. Permit activates at validFrom or manually (status: active, activatedAt, validFrom, validTo calculated)
5. Worker completes work, closes permit (status: closed, closedBy, closedAt, closureNotes)

**Rejection Path**: submitted → rejected (rejectedBy, rejectedAt, rejectionReason)

**Suspension Path**: active → suspended (suspendedAt, suspendReason) → active (resume)

**Expiration Path**: active → expired (auto at validTo, expiredAt)

**Cancellation Path**: draft/submitted/approved → cancelled (cancelledAt)

### Workflow: Permit with Required Checklist

1. Worker creates permit (status: draft)
2. Worker submits (status: submitted)
3. Approver approves (status: approved)
4. **System auto-creates checklist instance** (checklistInstanceId linked)
5. Permit activates (status: active)
6. Worker conducts checklist (checklistInstance.status: in_progress → completed)
7. Worker attempts closure
8. **System validates checklist completed** (blocks if not completed)
9. Permit closes (status: closed)

### Workflow: Proactive Expiration Management (Chief)

1. **Morning Brief** (7am daily):
   - Chief queries permitInstances where validTo within next 24h
   - Report: "3 permits expiring today (PERMIT-045 Hot Work expires 3pm, PERMIT-046 Height Work expires 5pm, PERMIT-047 Confined Space expires 6pm)"

2. **Hourly Check**:
   - Chief queries permits where validTo within next 1h
   - Urgent notification: "Your permit expires in 1 hour" (to applicant)

3. **Auto-Expiration** (scheduled job):
   - Chief queries permits where validTo < now AND status = active
   - Update status: active → expired, set expiredAt
   - Notify: "Permit PERMIT-045 expired at 3:00 PM. Create new permit if work continues."

4. **Renewal Draft** (proactive):
   - Chief detects permit expiring tomorrow
   - Draft renewal application pre-filled from original
   - Present to PM: "Permit renewal: Standard template pre-filled. Approve?"

## Acceptance Criteria

**AC-001: Create Permit Type**
- GIVEN org admin on permit types page
- WHEN create "Hot Work Permit" with defaultValidityHours=8, requiredFields=[{name: "fireExtinguisherLocation", type: "text", required: true}]
- THEN permitType created with orgId, isActive=true

**AC-002: Assign Permit Type to Project**
- GIVEN permit type "Hot Work Permit" exists
- WHEN assign to Project A with defaultApproverId=John
- THEN permitTypeAssignment created, workers can see "Hot Work Permit" in application form

**AC-003: Worker Applies for Permit**
- GIVEN worker on Project A
- WHEN create permit: type="Hot Work", location="Level 3", requestedStartAt=tomorrow 9am, requestedEndAt=tomorrow 5pm
- THEN permitInstance created with permitNumber=PERMIT-001, status=draft, applicantId=workerId

**AC-004: Worker Submits Permit**
- GIVEN worker has draft permit
- WHEN submit for approval
- THEN status=submitted, submittedAt set, approver notified

**AC-005: Approver Approves Permit**
- GIVEN approver reviews submitted permit
- WHEN approve with signature
- THEN status=approved, approvedBy set, approvedAt set, approvalSignatureData stored

**AC-006: Permit Auto-Activates**
- GIVEN approved permit with validFrom=9am tomorrow
- WHEN time reaches 9am tomorrow
- THEN status=active, activatedAt set, validTo=9am+8h=5pm

**AC-007: Worker Closes Permit**
- GIVEN worker has active permit (no required checklist)
- WHEN close with notes "Work complete, area cleaned"
- THEN status=closed, closedBy set, closedAt set, closureNotes stored

**AC-008: Permit Auto-Expires**
- GIVEN active permit with validTo=5pm
- WHEN time reaches 5pm and permit not closed
- THEN status=expired, expiredAt set, worker notified

**AC-009: Checklist Blocks Closure**
- GIVEN permit with required checklist, checklist status=in_progress
- WHEN worker attempts to close permit
- THEN error: "Checklist must be completed before closure"

**AC-010: Chief Proactive Expiration Alert**
- GIVEN permit validTo=tomorrow 3pm
- WHEN Chief morning brief runs
- THEN notification: "Permit PERMIT-045 expires tomorrow at 3pm"

**AC-011: Chief Drafts Permit Renewal**
- GIVEN permit expiring tomorrow, council requires additional documentation (non-standard)
- WHEN Chief detects expiration
- THEN Present to PM: "[DECISION] Permit renewal: Council requires additional documentation (not standard). Standard template pre-filled. Approve?"

## Dependencies

### Internal Dependencies
- **checklistInstances** - required checklist completion before closure
- **workers** - applicant, approver tracking
- **projects** - project scope
- **orgs** - org-level permit type templates
- **activityLogs** - audit trail for all state changes

### External Dependencies
- **Chief AI** - proactive expiration monitoring, renewal drafting, overnight monitoring
- **Notifications** - expiration alerts (24h, 1h), approval pending alerts
- **PDF Generation** - permit export with approval signatures (integrations.md)

### Upstream (Depends On)
- workers.md (applicant, approver roles)
- quality-checklists.md (required checklist integration)
- foundation.md (org/project scoping)

### Downstream (Used By)
- chief-agent.md (proactive permit management, expiration alerts, renewal drafting)
- communications.md (notification delivery)
- integrations.md (PDF export with signatures, webhook events: permit.approved, permit.expired, permit.expiring_soon)
