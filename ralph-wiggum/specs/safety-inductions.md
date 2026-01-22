# Safety - Inductions

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Induction system manages site/company/task/plant worker qualifications via structured workflows. Workers complete inductions off-site (invite link) or on-site (tablet), capturing responses, signatures, certifications before site access. Supports version control, expiry tracking, re-induction triggers.

## Scope
### In Scope
- Induction types (company, site, task, plant scopes) with structured content blocks (info, video, acknowledgement, upload)
- Off-site induction invites (share code, no auth, pre-arrival workflow)
- On-site completion (tablet/kiosk, immediate completion)
- Completion tracking (pending → in_progress → awaiting_review → completed → expired)
- Signature capture (digital signature with tamper detection hash)
- Required certification prerequisites (certificationTypes)
- Version control (version, previousVersionId, triggers re-induction)
- Audit logging (append-only lifecycle tracking)
- Plant-specific inductions (by assetTypeId or specific asset)
- Expiry and renewal (validityDays, requiresReinduction flag)

### Out of Scope
- Generic training modules (separate training management system)
- External certification issuance (record existing certs only)
- Video hosting (external URLs only)
- Live streaming (recorded videos only)

## Requirements

### Induction Types
- REQ-001: Org can create induction templates with scope (company|site|task|plant)
- REQ-002: Templates support 4 content block types: info (title, HTML body, imageUrl), video (videoUrl, title), acknowledgement (confirmationText), upload (uploadLabel, required flag)
- REQ-003: Templates link to required certification types (requiredCertificationTypeIds array)
- REQ-004: Templates specify validityDays for expiry
- REQ-005: Templates have version control (version, previousVersionId, isActive)
- REQ-006: System templates (isSystemTemplate flag) provided by platform
- REQ-007: Project-specific templates override org templates (projectId optional)
- REQ-041: Templates optionally specify structure field (alternative structure format, TBD)
- REQ-042: Templates optionally specify contentUrl (external content URL as alternative to content blocks)
- REQ-043: Templates specify isRequired flag (boolean, mandatory for project access, used by sign-on validation)

### Off-Site Completion (Invite Workflow)
- REQ-008: Admin creates inductionInvite with shareCode (10-char timestamp-based: UPL-{timestamp})
- REQ-009: Invite links to inductionType, project, optionally specific workerId
- REQ-010: Public URL `/induct/invite/[shareCode]` requires no auth
- REQ-011: Worker completes 5-step wizard: Profile (name, email, phone, trade, employer), Emergency Contact (name, phone, relationship), Content (induction content blocks), Tickets (upload certifications), Signature (declaration, canvas, hash)
- REQ-012: Submission creates inductionCompletion with status: awaiting_review
- REQ-013: Admin reviews completion, approves (status: completed) or returns (returnComment, status: pending)
- REQ-014: Invite tracks status (pending|awaiting_review|completed), lastOpenedAt, submittedAt, approvedAt
- REQ-044: When worker opens invite link: load invite, if workerId set pre-fill name/email requiring confirmation, if no workerId worker enters email and system finds/creates worker record
- REQ-045: Update worker.lastActivityAt on invite start, set invite.lastOpenedAt

### On-Site Completion
- REQ-015: Admin creates inductionCompletion directly (status: in_progress)
- REQ-016: Worker completes on tablet/kiosk with same wizard steps
- REQ-017: Signature captured on canvas, signed immediately
- REQ-018: Status set to completed (no review needed)

### Completions
- REQ-019: Completion tracks: workerId, inductionTypeId, inviteId (optional), projectId, assignedAt, startedAt, completedAt, expiresAt
- REQ-020: Status lifecycle: pending → in_progress → awaiting_review → completed → expired → superseded
- REQ-021: Completion stores: completedVia (on_site|off_site), reviewedBy, reviewedAt
- REQ-022: Responses stored per content block (block ID, value, file IDs for uploads)
- REQ-023: Signature stored as object: { mediaFileId, signedAt, hash: SHA256(mediaFileId + signedAt) }
- REQ-024: Audit log tracks all state changes (actorId, actorType: ai|human, action, timestamp, comment)
- REQ-025: Completion links to inductionVersion for version tracking (snapshot of inductionType version at completion time for audit trail)
- REQ-026: RequiresReinduction flag triggers when template version changes
- REQ-046: Status transition triggers: pending→in_progress (worker starts), in_progress→awaiting_review (off-site submission), awaiting_review→completed (manual approval), completed→expired (expiresAt reached), completed→superseded (new version completed)

### Plant Inductions
- REQ-027: Separate plantInductionCompletions table for plant-specific qualifications
- REQ-028: Links to inductionTypeId (template), workerId, assetTypeId (optional string for equipment category)
- REQ-029: Stores completedAt, expiresAt, certificateMediaFileId (PDF certificate)
- REQ-030: Plant induction by assetTypeId (all excavators) or specific asset

### Certifications
- REQ-031: Workers cannot complete induction until required certs valid (requiredCertificationTypeIds check)
- REQ-032: Cert upload in step 4: cert number, expiry date, front/back photos (1-2 photos required), validation: expiryDate must be > today
- REQ-033: Cert verification blocking conditions: expiryDate <= today (error "Certification expired"), cert not uploaded for required type (error "Missing required certification"), cert photo count < 1 (error "Photo evidence required")
- REQ-034: Cert warning conditions: expiryDate <= today + 30 days (warn "Certification expiring soon")

### Business Rules
- REQ-035: Workers cannot sign-on without completed induction
- REQ-036: Induction expires after validityDays (calculated from completedAt)
- REQ-037: Version changes trigger requiresReinduction flag on old completions
- REQ-038: Signature hash prevents tampering (SHA256 verification)
- REQ-039: Plant inductions separate from general site inductions
- REQ-040: Invites active until used or manually deactivated (isActive flag)

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| inductionTypes | orgId, projectId (opt), scope, name, validityDays, content (blocks), requiredCertificationTypeIds, requireSignature, requireReInduction, isSystemTemplate, version, previousVersionId, structure (opt), contentUrl (opt), isRequired | Reusable induction templates (company/site/task/plant) with structured content blocks |
| inductionInvites | shareCode, inductionTypeId, projectId, workerId (opt), createdBy, status (pending\|awaiting_review\|completed), lastOpenedAt, submittedAt, approvedAt, returnComment, completionId, isActive | Pre-arrival induction invites (public URL, off-site workflow) |
| inductionCompletions | projectId, inductionTypeId, workerId, inviteId (opt), status (pending\|in_progress\|awaiting_review\|completed\|expired\|superseded), assignedAt, startedAt, completedAt, expiresAt, completedVia (on_site\|off_site), reviewedBy, reviewedAt, signature (mediaFileId, signedAt, hash), responses, auditLog, inductionVersion, requiresReinduction | Worker completion records with full audit trail |
| plantInductionCompletions | workerId, inductionTypeId, assetTypeId (opt), completedAt, expiresAt, certificateMediaFileId, createdAt | Simplified plant-specific induction records |
| certificationTypes | orgId, name, code, category (license\|ticket\|training\|medical\|other), defaultValidityDays, isRequiredOrgwide, expiryWarningDays | Org-level certification definitions (prerequisites for inductions) |

**Indexes:**
- inductionTypes: by_org, by_project, by_scope, by_system
- inductionInvites: by_shareCode, by_induction, by_project, by_status
- inductionCompletions: by_project_induction, by_worker, by_status, by_expires
- plantInductionCompletions: by_worker, by_assetType, by_expires
- certificationTypes: by_org, by_active, by_category

**Relationships:**
- Orgs → InductionTypes (1:N, template library)
- Projects → InductionTypes (1:N, optional project-specific)
- InductionTypes → CertificationTypes (N:N via requiredCertificationTypeIds, prerequisites)
- InductionTypes → InductionCompletions (1:N, instances from template)
- Projects → InductionCompletions (1:N)
- Workers → InductionCompletions (1:N)
- InductionInvites → InductionCompletions (1:1 after approval, completionId)
- Workers → PlantInductionCompletions (1:N)
- MediaFiles → InductionCompletions (1:1 signature), PlantInductionCompletions (1:1 certificate)

## Workflows

### Workflow: Off-Site Induction (Invite Link)
1. **Admin creates invite:** Create inductionInvite (shareCode: UPL-2x5k8p, inductionTypeId, projectId, workerId (optional), status: pending, isActive: true)
2. **Worker receives link:** Email/SMS with public URL `/induct/invite/[shareCode]`
3. **Worker opens link:** Load invite details, update invite.lastOpenedAt
4. **Identity confirmation (if workerId set):** Pre-fill name/email (readonly), prompt "Is this you? [Yes, Continue] [No, I'm Different]", if "No" clear workerId and show full profile entry, if "Yes" proceed to Step 2
5. **Identity entry (if no workerId):** Worker enters email, system finds/creates worker record, update worker.lastActivityAt
6. **Step 1 - Profile:** Worker enters fullName (required), email (required), phone (required), trade (optional), employer (optional)
7. **Step 2 - Emergency Contact:** Enter emergencyContactName (required), emergencyContactPhone (required), emergencyContactRelationship (optional: Spouse|Parent|Sibling|Other)
8. **Step 3 - Content:** Render inductionType.content blocks:
   - **info blocks:** Display title, HTML body, imageUrl (read-only, no response required)
   - **video blocks:** Display videoUrl player (must watch to completion, track view state, progress bar shows % watched, "Continue" disabled until 100% watched, seeking backward allowed, forward blocked)
   - **acknowledgement blocks:** Checkbox with acknowledgementText (must check all)
   - **upload blocks:** File upload with uploadLabel (required if uploadRequired = true)
9. **Step 4 - Tickets:** For each requiredCertificationTypeId:
   - Enter cert number (required), expiry date (required, validation: expiryDate must be > today)
   - Upload front/back photos (1-2 photos required)
   - System validates cert not expired
10. **Step 5 - Signature:** Worker reads declaration, draws signature on canvas (required: signature canvas not empty), generates hash: SHA256(mediaFileId + signedAt)
11. **Submit:** Create inductionCompletion (status: awaiting_review, inviteId, responses, signature, auditLog: [{ action: 'submitted', timestamp, actorType: 'human' }])
12. **Update invite:** Set invite.status = awaiting_review, submittedAt = now, completionId = completion._id
13. **Admin reviews:** Navigate to completion, verify responses/signature
14. **Approve path:** Update completion (status: completed, reviewedBy, reviewedAt, completedAt, expiresAt: completedAt + validityDays), auditLog append: { action: 'approved', actorId: reviewerId, timestamp }
15. **Return path:** Update completion (auditLog append: { action: 'returned', comment: returnComment, timestamp }), invite.status = pending, worker re-submits

### Workflow: On-Site Induction (Tablet/Kiosk)
1. **Admin initiates:** Create inductionCompletion directly (status: in_progress, workerId, inductionTypeId, projectId, assignedAt)
2. **Worker starts:** Same 5-step wizard on tablet
3. **Complete immediately:** After signature, status = completed (no review), expiresAt = completedAt + validityDays
4. **Audit log:** [{ action: 'assigned', timestamp }, { action: 'started', timestamp }, { action: 'completed', timestamp }]

### Workflow: Version Control & Re-Induction
1. **Admin edits template:** Load existing inductionType
2. **Create new version:** Create new inductionType record (version: old.version + 1, previousVersionId: old._id)
3. **Deactivate old:** Set old.isActive = false
4. **Existing completions remain valid:** Linked to old version via inductionVersion field
5. **Flag re-induction:** Optional - update old completions (requiresReinduction: true)
6. **New invites use new version:** Link to latest active inductionType
7. **Worker re-induction:** Create new completion linked to new version

### Workflow: Expiry & Renewal
1. **Cron job (daily):** Query completions where expiresAt < now + 7 days
2. **Trigger alerts:** Create notifications (cert.expiring_soon event)
3. **Worker notified:** Email/SMS with renewal instructions
4. **Worker renews:** Complete new induction (new completion record)
5. **Old completion:** Status = superseded

## Acceptance Criteria

### Template Creation
- AC-001: Admin creates induction type with 4 content blocks (1 info, 1 video, 2 acknowledgements), validityDays: 365, requiredCertificationTypeIds: [whiteCard, firstAid]
- AC-002: Template saved with version: 1, previousVersionId: null, isActive: true
- AC-003: Template appears in project induction list

### Off-Site Invite
- AC-004: Admin creates invite, shareCode generated (UPL-xxxxx), public URL displayed
- AC-005: Worker opens URL, no auth required, identity pre-filled if workerId set
- AC-006: Worker completes wizard, uploads 2 certs (4 photos), signs signature
- AC-007: Submission creates completion (status: awaiting_review), invite.status = awaiting_review
- AC-008: Admin approves, completion.status = completed, expiresAt set, worker receives confirmation

### On-Site Completion
- AC-009: Admin assigns induction to worker, status: in_progress
- AC-010: Worker completes on tablet, signs, status: completed immediately
- AC-011: No review step, audit log shows: assigned → started → completed

### Signature Verification
- AC-012: Signature stored with hash: SHA256(mediaFileId + signedAt)
- AC-013: Hash verification succeeds on valid signature
- AC-014: Hash verification fails if mediaFileId modified

### Version Control
- AC-015: Admin edits template, new version created (version: 2, previousVersionId: old._id)
- AC-016: Old version isActive: false
- AC-017: Existing completions still valid (linked to old version)
- AC-018: New invites link to new version

### Expiry Tracking
- AC-019: Completion created with expiresAt: completedAt + 365 days
- AC-020: Cron job detects expiry in 7 days, triggers notification
- AC-021: Worker renews, new completion created, old status: superseded

### Certification Prerequisites
- AC-022: Worker attempts completion without required certs, blocked with error message
- AC-023: Worker uploads expired cert, submission blocked
- AC-024: Worker uploads valid cert, submission proceeds
- AC-025: Worker attempts completion with expired cert, system blocks submission with error message listing cert type + expiry date, worker cannot proceed until cert updated

### Video Completion
- AC-026: Video block requires watch to completion, progress bar shows % watched, "Continue" disabled until 100% watched, seeking backward allowed, forward blocked

### Identity Confirmation
- AC-027: Invite with workerId pre-fills name/email, worker confirms or rejects identity, if rejected shows full profile form, if confirmed skips to Step 2

## Dependencies

### Internal
- **Workers:** InductionCompletions link to workers (workerId)
- **Projects:** Completions scoped to projectId
- **Certification Types:** Required certs (requiredCertificationTypeIds)
- **Media Files:** Signature storage (mediaFileId), cert photos, certificate PDFs
- **Attendance Logs:** Workers cannot sign-on without completed induction
- **Action Items:** Re-induction reminders created as action items

### External
- **QR Code Generation:** Invite URLs, certificate verification QR codes
- **PDF Generation:** Induction certificates (template: induction-certificate)
- **Email/SMS:** Invite delivery, expiry notifications
- **Storage:** Convex Storage for signatures, photos, certificates

### UI Dependencies
- **InductionWizard:** 5-step form (Profile, Emergency Contact, Content, Tickets, Signature)
  - **ProfileStep:** fullName, email, phone, trade, employer fields
  - **EmergencyContactStep:** emergencyContact name, phone, relationship fields
  - **ContentStep:** renders content blocks via ContentBlockRenderer
  - **TicketsStep:** cert upload fields via CertUploadField
  - **SignatureStep:** signature canvas and declaration
- **SignatureCanvas:** Touch/mouse drawing, clear button, export PNG
- **ContentBlockRenderer:** Renders info/video/acknowledgement/upload blocks
  - **InfoBlock:** title, HTML body, image display
  - **VideoBlock:** embed player, completion tracking, progress bar
  - **AcknowledgementBlock:** checkbox + text
  - **UploadBlock:** file picker, preview
- **CertUploadField:** Dual photo upload (front/back)
- **InductionReviewPanel:** Admin review interface

### AI Skills
- **domain-inductions:** Induction assignment, completion tracking, expiry alerts

---

**Notes:**
- Signature hash: SHA256(mediaFileId + signedAt) for tamper detection
- Share code format: UPL-{timestamp base36}{random} for invites (10-char)
- Audit log append-only: Never modify, always append entries
- Version control: Previous version remains valid for existing completions
- Plant inductions: Separate table for simplified plant qualification tracking
- Content block types: info, video, acknowledgement, upload (4 types total)
- Completion statuses: pending → in_progress → awaiting_review → completed → expired → superseded (6 states)
