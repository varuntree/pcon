# Mobile QR Workflows

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
8 public QR-triggered workflows enable no-auth access to site operations. Workers/visitors scan QR codes at physical locations (site entrance, equipment, meetings) to complete tasks via mobile browser without login. Share codes are unguessable, optionally time-limited, revocable.

## Scope

### In Scope
- 8 QR-triggered public workflows (prestart, sign-in, induction, toolbox, SWMS, asset view, schedule confirm, document upload)
- Share code generation, validation, revocation
- Public routes (no authentication required)
- No-auth access patterns (code = access grant)
- External worker support (name/company input, not in system)
- QR image generation, poster printing
- Audit trail (usage tracking)

### Out of Scope
- Authenticated mobile screens → see mobile-worker.md
- Internal worker workflows requiring login
- Multi-project worker access
- Offline QR scanning (requires online connection)

**Offline QR Scanning Fallback:**
- Detection: Check navigator.onLine status before form submission
- Warning banner: "You appear to be offline. Your submission will be queued."
- Queue mechanism: LocalStorage stores submission data with timestamp
- Auto-retry: When connection restored (online event), POST queued submissions
- Manual retry: "Retry Now" button on failed submission screen
- Expiry: Queued submissions expire after 24 hours

## Requirements

### QR Flows

**REQ-001: Asset Prestart** (`/prestart/[qrCode]`)
- Scan asset QR → resolve asset + template → render checklist form → submit → pass/fail evaluation → success/failure screen
- Pass: asset status operational, display confirmation
- Fail: asset status maintenance, auto-create defects (one per failed item), auto-create action items (one per defect), display issues list

**Photo Compression:**
- Client-side compression: Compress images to max 1920x1080, quality 85%, JPEG format
- Library: browser-image-compression or sharp (server-side fallback)
- Target size: <500KB per photo after compression
- Original dimensions preserved in metadata for audit
- Apply before Convex Storage upload to reduce storage costs

**REQ-002: Site Sign-In** (`/sign-in/[code]`)
- Scan project QR → load project details + worker list → three tabs (Worker/Visitor/Delivery)
- Worker tab: select from dropdown (all assigned workers), sign in/out button, inline success confirmation
- Visitor/Delivery tabs: name, company, phone, purpose → creates visitor/delivery record on sign-in
- Today's attendance logs displayed on-site

**REQ-003: Induction** (`/induct/[qrCode]`)
- Scan project QR → welcome screen → email input + name → start → 5-step wizard → submit → awaiting_review status → success
- Step 1 (Profile): full name, email, phone, trade, employer
- Step 2 (Emergency Contact): name, phone, relationship
- Step 3 (Content): dynamic acknowledgments + uploads per induction type (from template content blocks)
- Step 4 (Tickets): upload certifications (cert number, expiry date, photos front/back) for required certification types
- Step 5 (Signature): declaration, signature canvas, hash generation, submit
- Alternative flow: Induction Invite Link (`/induct/invite/[shareCode]`) → load invite → confirm identity (pre-filled) → 5-step wizard → link to invite → success

**REQ-004: Toolbox Attendance** (`/toolbox/attend/[qrCode]`)
- Scan meeting QR → view meeting details (date, time, location, topics, facilitator, attachments) → worker selection dropdown → signature canvas → submit → confirmation
- External worker support: name + company input if not in system
- Meeting details read-only, signature required

**External Worker Duplicate Detection:**
- Name matching: Case-insensitive comparison (toLowerCase, trim whitespace)
- Check for existing attendance with same normalized name
- Warning: "A worker with this name has already signed. Continue?"
- No fuzzy matching (exact match after normalization only)

**REQ-005: SWMS Signing** (`/swms/view/[code]`)
- Open share link → display document sections (scope, PPE, tasks, hazards, controls, emergency) → external signature flow (name input, company input optional, signature canvas) → submit → confirmation
- Three acknowledgment checkboxes required: "I acknowledge the hazards", "I understand the controls", "I will use required PPE"
- Duplicate name check (warn if name already signed)
- Signature stored as base64 PNG in swmsSignatures.signatureData

**External Worker Duplicate Detection:**
- Name matching: Case-insensitive comparison (toLowerCase, trim whitespace)
- Check for existing signature with same normalized name on same SWMS document
- Warning: "This name has already signed. Continue?"
- No fuzzy matching (exact match after normalization only)

**REQ-006: Asset View** (`/asset/[qrCode]`)
- Scan asset QR → display details (name, make, model, serial, status) + maintenance history (last 10 prestart submissions) + enabled checklists (isEnabledForQr = true)
- Optional "Report Issue" button (requires auth, redirects to login)
- Read-only view, no actions without auth

**REQ-007: Schedule Confirmation** (`/schedule/confirm/[shareCode]`)
- Open schedule confirmation link → display shift details (date, time, location, role) → confirm/decline buttons → submit → update status
- Worker views: shift date/time, project name, location, role, special instructions
- Confirm action: Update scheduleAssignments.status = 'confirmed', log confirmation timestamp
- Decline action: Update scheduleAssignments.status = 'declined', optional decline reason textarea
- Single-use: maxUses = 1, expires after 48 hours or after use
- Notification: Admin receives email on confirm/decline

**REQ-008: Document Upload** (`/upload/[shareCode]`)
- Open upload link → display project context + folder + instructions → file upload (multiple files) → submit → confirmation
- Allowed file types: images (jpg, png, gif, webp), documents (pdf, doc, docx), spreadsheets (xls, xlsx, csv)
- File size limits: images 10MB, documents 25MB, spreadsheets 10MB
- Files stored in Convex Storage, linked to documentUploadLinks.folderId

**File Validation:**
- MIME type whitelist:
  - Images: image/jpeg, image/png, image/gif, image/webp
  - Documents: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - Spreadsheets: application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv
- Magic byte verification: Check file signature matches claimed MIME type
- Reject: Executable files (.exe, .bat, .sh), scripts (.js, .py), archives (.zip if not allowed)
- Virus scanning: Optional integration with ClamAV or third-party API for large deployments

### Share Codes

**REQ-009: Unguessable Generation**
- Library: `nanoid` for collision-resistant codes
- 12-character URL-safe alphabet (A-Za-z0-9_-), entropy ~71 bits (2^71 combinations)
- Brute force infeasible, no sequential patterns
- Special formats: SWMS (12-char random: AbCdEfGhIjKl), Invite (10-char timestamp: UPL-2x5k8p), Asset (freeform: QR-123ABC), Project (metadata: PROJ456)

**Collision Retry Logic:**
```typescript
const generateUniqueShareCode = async (ctx: Context, type: string): Promise<string> => {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    const code = nanoid(12); // 12-char URL-safe

    // Check collision across all shareCode indexes
    const existing = await ctx.db
      .query('shareCodes')
      .withIndex('by_code', q => q.eq('code', code))
      .first();

    if (!existing) return code;
  }

  throw new Error('Failed to generate unique share code after 3 retries');
};
```

**REQ-010: Optional Expiry**
- `expiresAt` timestamp (automatic expiry)
- `maxUses` limit (single-use or limited uses, track in `usedCount`)
- State gating (e.g., SWMS must be approved before signing)
- No expiry for permanent QR codes (asset, prestart)

**Expiry Cleanup Automation:**
- Cron job: Daily at 2 AM, deactivate expired codes (set isActive = false where expiresAt < now)
- Query optimization: Index on expiresAt for fast lookup
- Soft delete: Keep records for audit trail, only deactivate
- Notification: Optional email to creator 24 hours before expiry for time-sensitive codes

**Multi-Use Tracking:**
- Display partial use state: "3 of 5 uses consumed" when maxUses > 1
- Progress indicator on admin panel for limited-use codes
- Auto-deactivate when usedCount >= maxUses (set isActive = false)
- Usage history: Log each use with timestamp, IP, linked entity (if created)
- Warning at 80% capacity: "1 use remaining" alert to creator

**REQ-011: Revocable (isActive)**
- `isActive` flag for instant deactivation
- Validation on every access: check active, not expired, not over max uses
- Increment `usedCount` on successful use
- Log every use in shareCodes table: IP address, timestamp, linked worker (if creates record)

**State Gating Rules:**
- SWMS Signing: swmsDocuments.status = 'approved' (cannot sign draft/pending/rejected)
- Permit Apply: permitTypes.isActive = true (cannot apply for disabled types)
- Induction: inductionTypes.isRequired = true (only required inductions trigger alerts)
- Toolbox Attend: toolboxMeetings.status = 'scheduled' (cannot sign past meetings unless status='in_progress')
- Asset Prestart: prestartTemplates.publicAccess = true (only public templates via QR)
- Document Upload: documentUploadLinks.isActive = true AND expiresAt > now
- Validation: Check state before rendering form, return 403 if gating fails

### Security

**REQ-012: Rate Limiting**
- Max 5 submissions per code per hour (prevent spam)
- Max 20 failed attempts per IP per hour
- CAPTCHA after 3 failures

**Implementation:**
- ipRateLimits table: { ip, endpoint, attemptTimestamps[], windowStartMs }
- Sliding window: Keep last 60 minutes of timestamps per IP
- Cleanup: Remove entries older than 1 hour on next attempt
- Response: 429 status with Retry-After header
- CAPTCHA trigger: After 3 failures, require CAPTCHA token in request body
- CAPTCHA provider: hCaptcha (site key in env, verify token server-side)
- Token verification: POST to hCaptcha API, check success + score threshold

**REQ-013: Audit Trail**
- Every use logged in shareCodes table
- Fields: code, type, entityId, projectId, orgId, createdBy, isActive, expiresAt, maxUses, usedCount, lastUsedAt, createdAt
- Linked to worker if creates record

**REQ-014: Access Control**
- No authentication required (code = access grant)
- Public routes: `app/(public)/w/`
- Validation logic: active, not expired, not over max uses, state gating

**REQ-015: QR Poster PDF Generation**
- Library: Puppeteer (headless Chrome) for high-fidelity rendering
- Template: HTML/CSS with embedded QR code (data URL from qrcode library)
- Layout: A4 portrait (210mm x 297mm), 10mm margins
- Content:
  - Top: Project/asset name (48pt bold)
  - Center: QR code 150x150mm (error correction 'M')
  - Below QR: Instructions (24pt, 2-line max)
  - Bottom: Fallback URL (14pt, https://app.example.com/w/prestart/QR-123ABC)
  - Footer: Organization logo (if provided) + generation date
- PDF options: A4 size, portrait, printBackground: true
- Output: Base64-encoded PDF for download or Blob for printing
- Caching: Generate once, cache in mediaFiles with linkedEntityType: qr_poster

## Workflows

### Workflow: QR Prestart
1. Worker scans asset QR code at equipment location
2. Public page loads: `/prestart/[qrCode]`
3. Resolve asset + template (prestartTemplates with publicAccess = true)
4. Render checklist form (dynamic field types: text, textarea, number, yesno, checkbox, select, multiselect, date, time, datetime, photo, signature, attachment, instruction, notes, action_trigger)
5. Worker fills fields, takes photo (if required), enters odometer readings (km + hours)
6. Submit form
7. Evaluate pass/fail:
   - **Pass criteria**: all required fields filled, all yesno = "yes", photo if required
   - **Pass action**: asset status → operational, display success screen (passed message, asset ready, timestamp, inspector name)
   - **Fail action**: asset status → maintenance, create defects (one per failed item, priority: high, category: safety), create action items (one per defect), log activity (prestart_failed), display failure screen (failed message, asset out of service, list of issues, defects/actions auto-created, "View Defects" button)
8. Return to list or navigate to defects

### Workflow: Site Sign-In (Worker)
1. Worker arrives at site entrance, scans project QR code
2. Public page loads: `/sign-in/[code]`
3. Load project details + worker list (all assigned workers)
4. Three tabs displayed: Worker, Visitor, Delivery
5. Worker selects "Worker" tab
6. Select worker from dropdown (name + employer)
7. Choose "Sign In" or "Sign Out" button
8. Submit action
9. Create/update attendanceLogs record (projectId, workerId, date, signOnTime/signOffTime, type: worker)
10. Display inline success confirmation
11. Today's attendance logs displayed (who's on-site)

### Workflow: Site Sign-In (Visitor)
1. Visitor arrives, scans project QR
2. Select "Visitor" tab
3. Enter: name, company, phone, purpose
4. Click "Sign In"
5. Create attendanceLogs record (type: visitor, visitorDetails object)
6. Display confirmation

### Workflow: Induction (Public QR)
1. Worker arrives at site, scans project QR
2. Public page loads: `/induct/[qrCode]`
3. Welcome screen: project name, required inductions list
4. Enter: email, name
5. Click "Start"
6. **Step 1 - Profile**: full name, email, phone, trade, employer
7. **Step 2 - Emergency Contact**: name, phone, relationship (dropdown: Spouse, Parent, Sibling)
8. **Step 3 - Content**: dynamic content blocks from inductionTypes.content (type: info, video, acknowledgement, upload)
   - Info: display text
   - Video: display video player
   - Acknowledgement: checkbox with text
   - Upload: file upload input
9. **Step 4 - Tickets**: upload certifications
   - Display required certification types (from inductionTypes.requiredCertificationTypeIds)
   - For each: cert number, expiry date, photos (front/back)
   - Multiple required types supported
10. **Step 5 - Signature**: declaration text, signature canvas (300x150), clear button, draw signature, hash generation (SHA256)
11. Submit all data
12. Create inductionCompletions record (status: awaiting_review, profile, emergencyContact, blockResponses, tickets, signature: mediaFileId)
13. Display success screen: confirmation message, next steps
14. Optional: link to full app

### Workflow: Induction (Invite Link)
1. Admin creates induction invite (shareCode: UPL-2x5k8p)
2. Worker receives invite link: `/induct/invite/[shareCode]`
3. Click link, public page loads
4. Load invite → confirm identity (pre-filled name/email from invite)
5. Start → update profile (if needed)
6. Same 5-step wizard as public QR flow
7. Submit → link to invite (inviteId in inductionCompletions)
8. Success screen

### Workflow: Toolbox Attendance
1. Facilitator starts meeting, displays QR code poster
2. Workers scan QR: `/toolbox/attend/[qrCode]`
3. Public page loads meeting details:
   - Date, time, location
   - Topics (agenda)
   - Facilitator name
   - Attachments (download links)
4. Worker selection: dropdown (all assigned workers) OR name + company input (external)
5. Draw signature on canvas
6. Submit
7. Create toolboxAttendance record (toolboxMeetingId, workerId (optional), workerName, workerCompany, attendanceType: internal/external, signatureData: base64 PNG, signedAt)
8. Display confirmation: "Attendance recorded"

### Workflow: SWMS Signing
1. Admin shares SWMS link: `/swms/view/[code]`
2. External worker opens link (no auth)
3. Public page loads SWMS document:
   - Title, version, project
   - Sections: scope of work, hazards identified, control measures (collapsible)
   - PPE requirements
   - Emergency procedures
4. Review document (scroll through sections)
5. Three acknowledgment checkboxes (required):
   - "I acknowledge the hazards"
   - "I understand the controls"
   - "I will use required PPE"
6. Enter: name (required), company (optional)
7. Duplicate name check: if name already signed, warn "This name has already signed. Continue?"
8. Draw signature on canvas
9. Submit
10. Create swmsSignatures record (swmsDocumentId, workerId: null, workerName, workerCompany, signatureType: external, signatureData: base64 PNG, signedAt)
11. Display confirmation: "SWMS signed successfully"

### Workflow: Asset View
1. Worker scans asset QR: `/asset/[qrCode]`
2. Public page loads asset details:
   - Name, make, model, serial number, assetType
   - Status (operational/maintenance/out of service)
3. Maintenance history section:
   - Last 10 prestart submissions (ordered desc)
   - Date, inspector name, passed/failed
4. Enabled checklists section:
   - List of assetChecklists where isEnabledForQr = true
   - Tap to start checklist (redirects to checklist conduct screen, requires auth)
5. Optional "Report Issue" button:
   - Requires authentication
   - Redirects to login → defect creation screen with assetId pre-filled
6. Read-only view (no actions without auth)

### Workflow: Schedule Confirmation
1. Admin creates schedule assignment for worker (future shift)
2. System generates confirmation link: `/schedule/confirm/[shareCode]`
3. Worker receives link via email/SMS
4. Click link, public page loads shift details:
   - Shift date, time (start/end)
   - Project name, location (address)
   - Role/position assigned
   - Special instructions (if any)
   - Duration (calculated)
5. Two action buttons: "Confirm Attendance" (green) OR "Decline Shift" (red)
6. Confirm action:
   - Click "Confirm Attendance"
   - Submit → update scheduleAssignments.status = 'confirmed'
   - Log confirmationTimestamp
   - Display success: "Shift confirmed. See you on [date]!"
   - Notification: Admin receives email "Worker X confirmed shift on [date]"
7. Decline action:
   - Click "Decline Shift"
   - Modal opens: optional textarea for decline reason
   - Submit → update scheduleAssignments.status = 'declined'
   - Store declineReason (if provided)
   - Display message: "Shift declined. Notification sent to admin."
   - Notification: Admin receives email "Worker X declined shift on [date]. Reason: [text]"
8. Single-use enforcement:
   - maxUses = 1, auto-deactivate after confirm/decline
   - Expiry: 48 hours from link generation OR first use (whichever earlier)
   - If expired: "This confirmation link has expired. Contact your supervisor."

### Workflow: Document Upload
1. Admin creates document upload link (shareCode: 12-char)
2. Share link with subcontractor: `/upload/[shareCode]`
3. Subcontractor opens link (no auth)
4. Public page loads upload form:
   - Project context (name)
   - Folder destination (name)
   - Instructions (custom text)
   - Label (e.g., "Insurance Certificate", "Method Statement")
5. File upload input (multiple files):
   - Allowed types: images (jpg, png, gif, webp), documents (pdf, doc, docx), spreadsheets (xls, xlsx, csv)
   - Size limits: images 10MB, documents 25MB, spreadsheets 10MB
   - Preview thumbnails for selected files
   - Remove button per file
6. Submit
7. Upload flow for each file:
   - Generate upload URL (Convex Storage)
   - POST file to signed URL
   - Receive storageId
   - Create mediaFiles record (orgId, projectId, storageId, fileName, mimeType, sizeBytes, linkedEntityType: documentUploadLinks, linkedEntityId: shareCode)
   - Create sourceDocuments record (projectId, mediaFileId, uploadLinkId, title, tags, folderId)
8. Increment shareCodes.usedCount
9. Display confirmation: "Files uploaded successfully"

## Acceptance Criteria

**AC-001: Share Code Generation**
- GIVEN admin creates QR code
- WHEN share code generated
- THEN code is 12-character URL-safe (A-Za-z0-9_-)
- AND entropy ~71 bits (2^71 combinations)
- AND collision probability negligible
- AND code stored in shareCodes table

**AC-002: QR Image Generation**
- GIVEN share code exists
- WHEN QR image requested
- THEN generate QR code using `qrcode` library
- AND width 256px, margin 2, error correction level 'M' (15% damage recovery)
- AND return data URL for display

**AC-003: QR Poster Generation**
- GIVEN share code exists
- WHEN poster requested
- THEN generate A4 PDF with: large QR code (center), title, instructions, URL (fallback), project branding
- AND designed for printing + laminating

**AC-004: Share Code Validation**
- GIVEN worker accesses QR flow
- WHEN share code validated
- THEN check isActive = true
- AND check expiresAt > now (if set)
- AND check usedCount < maxUses (if set)
- AND check state gating (e.g., SWMS status = approved)
- AND reject if any check fails

**AC-005: Share Code Usage Tracking**
- GIVEN worker completes QR flow
- WHEN submission successful
- THEN increment shareCodes.usedCount
- AND update shareCodes.lastUsedAt
- AND log usage in audit trail (IP, timestamp, linked worker)

**AC-006: Share Code Revocation**
- GIVEN admin deactivates share code
- WHEN isActive set to false
- THEN all future access attempts rejected
- AND existing in-progress sessions continue (not interrupted)

**AC-007: Rate Limiting**
- GIVEN QR flow in use
- WHEN submission rate exceeds threshold
- THEN reject with 429 status
- AND thresholds: 5 submissions/code/hour, 20 failed attempts/IP/hour
- AND trigger CAPTCHA after 3 failures

**AC-008: Prestart Pass**
- GIVEN worker completes prestart
- WHEN all required fields filled AND all yesno = "yes" AND photo if required
- THEN asset status → operational
- AND display success screen
- AND prestartSubmissions.passed = true

**AC-009: Prestart Fail**
- GIVEN worker completes prestart
- WHEN any required field empty OR any yesno = "no" OR photo missing if required
- THEN asset status → maintenance
- AND create defects (one per failed item, priority: high, category: safety)
- AND create action items (one per defect)
- AND log activity (type: prestart_failed)
- AND display failure screen with issues list
- AND prestartSubmissions.passed = false

**AC-010: Sign-In Worker**
- GIVEN worker scans site QR
- WHEN worker selects self from dropdown AND clicks "Sign In"
- THEN create/update attendanceLogs (projectId, workerId, date, signOnTime, type: worker)
- AND display inline confirmation
- AND worker added to today's on-site list

**AC-011: Sign-In Visitor**
- GIVEN visitor scans site QR
- WHEN visitor enters name, company, phone, purpose AND clicks "Sign In"
- THEN create attendanceLogs (type: visitor, visitorDetails: {name, company, phone, purpose})
- AND display confirmation

**AC-012: Induction Completion**
- GIVEN worker completes induction wizard
- WHEN all 5 steps submitted
- THEN create inductionCompletions (status: awaiting_review, profile, emergencyContact, blockResponses, tickets, signature: mediaFileId)
- AND display success screen
- AND optional link to full app

**AC-013: Toolbox Attendance**
- GIVEN worker scans toolbox QR
- WHEN worker selects self AND draws signature AND submits
- THEN create toolboxAttendance (toolboxMeetingId, workerId, workerName, workerCompany, attendanceType: internal, signatureData: base64 PNG, signedAt)
- AND display confirmation

**AC-014: SWMS External Signature**
- GIVEN external worker opens SWMS share link
- WHEN worker reviews document AND checks 3 acknowledgments AND enters name AND draws signature AND submits
- THEN create swmsSignatures (swmsDocumentId, workerId: null, workerName, workerCompany, signatureType: external, signatureData: base64 PNG, signedAt)
- AND display confirmation

**AC-015: Schedule Confirmation**
- GIVEN worker receives schedule confirmation link
- WHEN worker opens link
- THEN display shift details (date, time, project, location, role, instructions)
- AND show "Confirm Attendance" and "Decline Shift" buttons
- WHEN worker clicks "Confirm Attendance"
- THEN update scheduleAssignments.status = 'confirmed'
- AND log confirmationTimestamp
- AND deactivate share code (isActive = false)
- AND send admin notification email
- AND display success message
- WHEN worker clicks "Decline Shift"
- THEN show modal with optional decline reason textarea
- WHEN reason submitted (or skipped)
- THEN update scheduleAssignments.status = 'declined'
- AND store declineReason
- AND deactivate share code
- AND send admin notification email
- AND display confirmation message

**AC-016: Document Upload**
- GIVEN subcontractor opens upload link
- WHEN files selected (within size limits) AND submit clicked
- THEN upload each file to Convex Storage
- AND create mediaFiles records
- AND create sourceDocuments records (linked to folderId)
- AND increment shareCodes.usedCount
- AND display confirmation

## Dependencies

**Schema Dependencies:**
- shareCodes table: code, type, entityId, projectId, orgId, createdBy, isActive, expiresAt, maxUses, usedCount, lastUsedAt, createdAt
- assets table: qrCode (indexed by_qrCode)
- projects table: metadata.qrCode.code (freeform, no index)
- swmsDocuments table: shareCode (indexed by_shareCode)
- inductionInvites table: shareCode (indexed by_shareCode)
- toolboxMeetings table: qrCode (indexed by_qrCode)
- documentUploadLinks table: shareCode (indexed by_shareCode)
- prestartSubmissions table: assetId, templateId, workerId, responses, photoIds, odometerKm, odometerHours, passed, issues
- attendanceLogs table: projectId, workerId, date, signOnTime, signOffTime, type (worker/visitor/delivery), visitorDetails
- inductionCompletions table: inductionTypeId, workerId, profile, emergencyContact, blockResponses, tickets, signature (mediaFileId), status (awaiting_review)
- toolboxAttendance table: toolboxMeetingId, workerId, workerName, workerCompany, attendanceType (internal/external), signatureData, signedAt
- swmsSignatures table: swmsDocumentId, workerId (optional), workerName, workerCompany, signatureType (internal/external), signatureData, signedAt
- mediaFiles table: storageId, fileName, mimeType, sizeBytes, linkedEntityType, linkedEntityId
- sourceDocuments table: mediaFileId, uploadLinkId, title, tags, folderId
- scheduleAssignments table: workerId, projectId, shiftDate, startTime, endTime, role, location, specialInstructions, status (pending/confirmed/declined), confirmationTimestamp, declineReason, shareCode (indexed by_shareCode)

**Additional Schema Requirements:**
- ipRateLimits table: { ip: string, endpoint: string, attemptTimestamps: number[], windowStartMs: number, _creationTime: number }
  - Index: by_ip_endpoint for O(1) lookup
  - TTL: Auto-delete records older than 1 hour
- shareCodes table enhancement: Add stateGatingRules field (JSON object with entity-specific checks)
  - Example: { swmsStatus: 'approved', permitActive: true }
- captchaVerifications table: { token: string, ip: string, verifiedAt: number, success: boolean }
  - Index: by_token for deduplication check
  - TTL: Auto-delete after 5 minutes

**Integration Dependencies:**
- Convex Storage: file upload, signed URLs, 1-hour expiry
- QR code generation: `qrcode` library (v1.5.4)
- Share code generation: `nanoid` library
- PDF poster generation: Puppeteer or React-PDF

**Additional Integrations:**
- CAPTCHA Provider: hCaptcha (site key: env.HCAPTCHA_SITE_KEY, secret: env.HCAPTCHA_SECRET)
  - Frontend: @hcaptcha/react-hcaptcha component
  - Backend: Verify token via POST https://hcaptcha.com/siteverify
- PDF Generation: Puppeteer (v21+) with chromium bundled
  - Launch options: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  - Page size: A4 (8.27 x 11.69 inches)
- Virus Scanning (optional): ClamAV socket or third-party API (VirusTotal, Metadefender)
  - Scan files >1MB before storing in Convex Storage

**UI Dependencies:**
- Public routes: `app/(public)/w/`
- SignatureCanvas component: canvas (300x150), clear button, drawing logic (mouse/touch events), export as base64 PNG
- PhotoCapture component: file input (type=file, accept=image/*, capture=environment, multiple), preview grid, remove button per photo
- FieldRenderer component: dynamic rendering of 16 field types (see quality-checklists.md)
- MobileCard, MobileEmptyState, StatusBadge components
- Touch-friendly targets: 44x44px minimum (WCAG)
- High contrast colors for outdoor visibility

**Validation Dependencies:**
- Share code validation: active, not expired, not over max uses, state gating
- Rate limiting: 5 submissions/code/hour, 20 failed/IP/hour, CAPTCHA after 3
- File type validation: MIME type + extension check
- File size validation: images 10MB, documents 25MB, spreadsheets 10MB
- Prestart pass/fail evaluation: all required fields, all yesno = yes, photo if required
- SWMS signature validation: 3 acknowledgments checked, signature not empty, name provided
- Duplicate name check for SWMS: warn if name already signed

**Performance Dependencies:**
- QR image generation: < 1 second
- Share code validation: < 100ms
- File upload: chunked for large files, progress indicator
- Prestart evaluation: < 500ms
- Public routes: serverless, auto-scale, edge network (Vercel)
