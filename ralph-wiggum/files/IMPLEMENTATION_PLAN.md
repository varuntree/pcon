# Implementation Plan

## Current State Summary

**Completed (R1-R2):**
- R1 Foundation: orgs, projects, workers, trades, workPackages, workerAssignments (6 tables)
- R2 Safety Core: SWMS, permits, incidents, inductions, certifications (15 tables, all pages complete)
- Total: 21 tables in schema.ts, all with backend APIs, hooks, and pages

**Tags:**
- 0.0.3: R1 Foundation complete
- 0.0.4: R2 Phase 1 Schema
- 0.0.5: R2 SWMS+Cert APIs
- 0.0.6: R2 All Backend APIs
- 0.0.7: R2 Hooks
- 0.0.8: R2 Shared Components
- 0.0.9: R2 Core Pages + Navigation
- 0.0.10: R2 Public Flows

---

## R3: Quality + Assets

**Goal:** Build pages for already-defined schema tables (12 tables exist, 0 pages)

**Depends on:** R2 Complete (tag 0.0.10)

### Schema Changes (0 new tables, minor updates)
- [x] Add `plantInductionCompletions` table (M) - tracks plant-specific induction completions ✓
- [ ] Link `checklistTemplateId` in permitTypes, incidentTemplates (S)

### Backend APIs

**Quality Checklists**
- [x] `checklistTemplates.ts` - listByOrg, listByProject, listActive, get, create, update, clone, deactivate (M) ✓
- [x] `checklistInstances.ts` - listByProject, listByAssignee, listByStatus, get, create, updateResponses, complete, cancel (M) ✓

**Quality Defects**
- [x] `defects.ts` - listByProject, listByStatus, listByAssignee, get, create, update, resolve, close, addComment (M) ✓
- [x] `defectPhotos.ts` - listByDefect, create, delete, updateMarkup (S) ✓

**Action Items**
- [x] `actionItems.ts` - listByProject, listByAssignee, listByStatus, listBySource, get, create, update, complete, cancel, addComment (M) ✓

**Asset Management**
- [x] `assetRegisters.ts` - listByOrg, listByProject, get, create, update, deactivate (S) ✓
- [x] `assets.ts` - listByRegister, listByProject, listByStatus, get, create, update, updateStatus (M) ✓
- [x] `assetAllocations.ts` - listByAsset, listByWorker, listActive, get, create, return, cancel (M) ✓
- [x] `assetRequests.ts` - listByProject, listByStatus, get, create, approve, reject, cancel (S) ✓
- [x] `assetChecklistConfigs.ts` - listByAsset, get, create, update, deactivate (S) ✓
- [x] `assetServiceLogs.ts` - listByAsset, get, create (S) ✓
- [x] `prestartSubmissions.ts` - listByAsset, listByProject, get, submit, evaluate (M) ✓

### Hooks Layer
- [x] `use-checklist-templates.ts` (S) ✓
- [x] `use-checklist-instances.ts` (S) ✓
- [x] `use-defects.ts` (S) ✓
- [x] `use-defect-photos.ts` (S) ✓
- [x] `use-action-items.ts` (S) ✓
- [x] `use-asset-registers.ts` (S) ✓
- [x] `use-assets.ts` (S) ✓
- [x] `use-asset-allocations.ts` (S) ✓
- [x] `use-prestart-submissions.ts` (S) ✓

### Pages

**Quality Module**
- [x] PAGE-030: Checklist templates list `/orgs/[orgId]/checklist-templates` (M) ✓
- [x] PAGE-031: Checklist template editor (16 field types, sections, conditional logic) (L) ✓
- [x] PAGE-032: Project checklists list `/orgs/[orgId]/projects/[projectId]/checklists` (S) ✓
- [x] PAGE-033: Checklist instance conductor (dynamic fields, progress tracking) (L) ✓
- [x] PAGE-034: Defects list `/orgs/[orgId]/projects/[projectId]/defects` (S) ✓
- [x] PAGE-035: Defect detail view (photos, comments, lifecycle actions) (M) ✓
- [x] PAGE-036: Defect creation form (location, photos, markup) (M) ✓
- [x] PAGE-037: Action items list `/orgs/[orgId]/projects/[projectId]/actions` (S) ✓
- [x] PAGE-038: Action item detail view (M) ✓

**Asset Module**
- [ ] PAGE-039: Asset registers list `/orgs/[orgId]/asset-registers` (S)
- [ ] PAGE-040: Register detail (assets list, stats) (M)
- [ ] PAGE-041: Asset creation/edit form (M)
- [ ] PAGE-042: Asset detail view (status, history, allocations, service logs) (L)
- [ ] PAGE-043: Asset allocations list `/orgs/[orgId]/projects/[projectId]/plant` (M)
- [ ] PAGE-044: Asset request form (booking/transfer/maintenance) (M)
- [ ] PAGE-045: Prestart submission form (checklist + odometer + photos) (L)
- [ ] PAGE-046: Prestart result screen (pass/fail, auto-defects) (M)

### Public Flows
- [ ] PUBLIC-008: `/w/prestart/[qrCode]` - Asset prestart via QR (L)
- [ ] PUBLIC-009: `/w/asset/[qrCode]` - Asset view via QR (read-only) (S)

### Navigation Updates
- [ ] NAV-004: Add Quality group to sidebar (Checklists, Defects, Actions)
- [ ] NAV-005: Add Assets group to sidebar (Registers, Plant/Allocations)
- [ ] NAV-006: Update project detail page with Quality and Assets sections

### Technical Debt
- [ ] Configure Convex Storage for photo uploads (M)
- [ ] Implement photo compression on upload (S)
- [ ] Add delete mutations across entities (M)

### Effort Summary
| Category | S | M | L | Total |
|----------|---|---|---|-------|
| Schema | 1 | 1 | 0 | 2 |
| Backend | 4 | 6 | 0 | 10 |
| Hooks | 8 | 0 | 0 | 8 |
| Pages | 4 | 8 | 4 | 16 |
| Public | 1 | 0 | 1 | 2 |
| Nav | 3 | 0 | 0 | 3 |
| Debt | 1 | 2 | 0 | 3 |
| **Total** | 22 | 17 | 5 | **44 tasks** |

**Estimated Duration:** 3-4 weeks

---

## R4: Site Operations

**Goal:** Add missing schema + pages for daily site operations

**Depends on:** R3 Complete

### Schema Changes (11 new tables)

**Schedule**
- [ ] `scheduledTasks` - projectId, phaseId, name, startDate, endDate, status, assignedOrgId, progress, confirmations[] (M)
- [ ] `scheduleDependencies` - fromTaskId, toTaskId, dependencyType, lag (S)
- [ ] `schedulePhases` - projectId, name, startDate, endDate, order (S)
- [ ] `scheduleShares` - projectId, shareType (view_only|confirm), shareCode, targetOrgId, isActive, expiresAt (S)

**Daily Operations**
- [ ] `diaries` - projectId, date, weather, temperature, workDescription, progress, issues, visitors, attachmentIds, aiSummary (M)
- [ ] `briefings` - projectId, title, description, date, conductedBy, attendeeWorkerIds (S)
- [ ] `alerts` - projectId, kind (weather|change|safety|other), message, requiresAck, status, sentAt (S)

**Toolbox Meetings**
- [ ] `toolboxMeetings` - projectId, title, date, startTime, location, meetingType, conductedBy, linkedSwmsIds, qrCode, status (M)
- [ ] `toolboxAttendance` - toolboxMeetingId, workerId, workerName, workerCompany, attendanceType, signatureData, signedAt (S)

**Site Access**
- [ ] `attendanceLogs` - projectId, workerId, date, signOnTime, signOffTime, entryType, visitorDetails, formResponses, prestartNoticeAck, swmsAcknowledgedIds, viaQr (M)
- [ ] `signOnConfigs` - projectId, name, isDefault, visitorAllowed, deliveryAllowed, prestartNoticeId, customFields (S)
- [ ] `prestartNotices` - projectId, title, content, effectiveDate, expiresAt, requiresAcknowledgement, isActive (S)

### Backend APIs

**Schedule**
- [ ] `scheduledTasks.ts` - listByProject, listByPhase, listByOrg, get, create, update, updateStatus, addConfirmation (M)
- [ ] `scheduleDependencies.ts` - listByTask, create, delete (S)
- [ ] `schedulePhases.ts` - listByProject, get, create, update, reorder, delete (S)
- [ ] `scheduleShares.ts` - listByProject, get, getByShareCode, create, deactivate (S)
- [ ] `schedulePublic.ts` - getByShareCode (no auth), confirmTask (M)

**Daily Ops**
- [ ] `diaries.ts` - listByProject, listByDate, get, create, update, archive (M)
- [ ] `briefings.ts` - listByProject, get, create (S)
- [ ] `alerts.ts` - listByProject, listActive, get, create, send, archive (S)

**Toolbox**
- [ ] `toolboxMeetings.ts` - listByProject, listUpcoming, get, create, update, start, complete, cancel, generateQr (M)
- [ ] `toolboxAttendance.ts` - listByMeeting, get, signInternal, signExternal (S)
- [ ] `toolboxPublic.ts` - getByQrCode (no auth), signAttendance (M)

**Site Access**
- [ ] `attendanceLogs.ts` - listByProject, listByDate, listByWorker, get, signIn, signOut, createVisitor, createDelivery (M)
- [ ] `signOnConfigs.ts` - listByProject, get, create, update, setDefault (S)
- [ ] `prestartNotices.ts` - listByProject, listActive, get, create, update, deactivate (S)
- [ ] `signOnPublic.ts` - getByCode (no auth), signIn, signOut (M)

### Hooks Layer
- [ ] `use-scheduled-tasks.ts` (S)
- [ ] `use-schedule-phases.ts` (S)
- [ ] `use-schedule-shares.ts` (S)
- [ ] `use-diaries.ts` (S)
- [ ] `use-toolbox-meetings.ts` (S)
- [ ] `use-attendance-logs.ts` (S)
- [ ] `use-alerts.ts` (S)

### Pages

**Schedule Module**
- [ ] PAGE-047: Schedule Gantt view `/orgs/[orgId]/projects/[projectId]/schedule` (L)
- [ ] PAGE-048: Schedule phase editor (M)
- [ ] PAGE-049: Task detail/edit modal (M)
- [ ] PAGE-050: Schedule sharing management (S)

**Diary Module**
- [ ] PAGE-051: Site diaries list `/orgs/[orgId]/projects/[projectId]/diaries` (S)
- [ ] PAGE-052: Diary entry form (weather, progress, photos) (M)
- [ ] PAGE-053: Diary detail view (M)

**Toolbox Module**
- [ ] PAGE-054: Toolbox meetings list `/orgs/[orgId]/projects/[projectId]/toolbox` (S)
- [ ] PAGE-055: Toolbox meeting creation form (M)
- [ ] PAGE-056: Toolbox meeting detail (attendance list, QR code) (M)

**Site Access Module**
- [ ] PAGE-057: Attendance dashboard `/orgs/[orgId]/projects/[projectId]/attendance` (M)
- [ ] PAGE-058: Sign-on config management (M)
- [ ] PAGE-059: Prestart notices management (S)
- [ ] PAGE-060: Alerts management (S)

### Public Flows
- [ ] PUBLIC-010: `/w/signin/[code]` - Site sign-in via QR (worker/visitor/delivery tabs) (L)
- [ ] PUBLIC-011: `/w/toolbox/[qrCode]` - Toolbox attendance via QR (M)
- [ ] PUBLIC-012: `/schedule/view/[shareCode]` - Schedule view (view-only mode) (M)
- [ ] PUBLIC-013: `/schedule/confirm/[shareCode]` - Schedule confirmation (subcontractor) (M)

### Navigation Updates
- [ ] NAV-007: Add Operations group to sidebar (Schedule, Diaries, Toolbox, Attendance, Alerts)
- [ ] NAV-008: Update project detail page with Operations section

### Effort Summary
| Category | S | M | L | Total |
|----------|---|---|---|-------|
| Schema | 7 | 4 | 0 | 11 |
| Backend | 7 | 8 | 0 | 15 |
| Hooks | 7 | 0 | 0 | 7 |
| Pages | 5 | 8 | 1 | 14 |
| Public | 0 | 3 | 1 | 4 |
| Nav | 2 | 0 | 0 | 2 |
| **Total** | 28 | 23 | 2 | **53 tasks** |

**Estimated Duration:** 4-5 weeks

---

## R5: Documents + Communications

**Goal:** Document management (files stored in Convex, Claude reads directly) + notification system

**Depends on:** R4 Complete

### Schema Changes (8 new tables)

**Documents**
- [ ] `sourceDocuments` - projectId?, orgId?, mediaFileId, docType, title, folderId, version, previousVersionId, linkedFromOrgDocId?, uploadLinkId?, annotationData, drawing metadata fields, tags[] (M)
- [ ] `documentEntityLinks` - documentId, entityTable, entityId, linkType (S)
- [ ] `documentFolders` - orgId?, projectId?, name, parentFolderId (S)
- [ ] `documentUploadLinks` - projectId, folderId?, shareCode, label, description, isActive, expiresAt, usageCount, maxUses, createdBy (S)
- [ ] `mediaFiles` - orgId?, projectId?, storageId, fileName, mimeType, sizeBytes, kind?, category?, caption?, takenAt?, linkedEntityType?, linkedEntityId (M)

**Communications**
- [ ] `notifications` - userId, type, title, message, entityType, entityId, isRead, readAt, metadata (M)
- [ ] `notificationPreferences` - userId, emailEnabled, pushEnabled, preferences, metadata (S)
- [ ] `communications` - projectId, subject, message, sentBy, sentAt, attachmentIds[], sourceType, sourceId (M)
- [ ] `communicationRecipients` - communicationId, workerId, status, deliveredAt, readAt (S)

### Backend APIs

**Documents**
- [ ] `sourceDocuments.ts` - listByProject, listByFolder, listVersions, search (title/tags), get, create, createVersion, promoteToDrawing, updateAnnotations (M)
- [ ] `documentEntityLinks.ts` - listByDocument, listByEntity, create, delete (S)
- [ ] `documentFolders.ts` - listByProject, listByOrg, get, create, update, delete (S)
- [ ] `documentUploadLinks.ts` - listByProject, get, getByShareCode, create, deactivate, incrementUsage (S)
- [ ] `documentsPublic.ts` - getUploadLinkByCode (no auth), uploadViaLink (M)
- [ ] `mediaFiles.ts` - get, create, delete, generateUploadUrl, getUrl (M)

**Communications**
- [ ] `notifications.ts` - listByUser, listUnread, get, create, markRead, markAllRead (M)
- [ ] `notificationPreferences.ts` - get, update (S)
- [ ] `communications.ts` - listByProject, listBySender, get, create (M)
- [ ] `communicationRecipients.ts` - listByCommunication, listByWorker, updateStatus (S)

### Hooks Layer
- [ ] `use-source-documents.ts` (S)
- [ ] `use-document-folders.ts` (S)
- [ ] `use-document-upload-links.ts` (S)
- [ ] `use-media-files.ts` (S)
- [ ] `use-notifications.ts` (S)
- [ ] `use-communications.ts` (S)

### Pages

**Documents Module**
- [ ] PAGE-061: Documents list `/orgs/[orgId]/projects/[projectId]/documents` (M)
- [ ] PAGE-062: Document detail view (versions, entity links) (M)
- [ ] PAGE-063: Folder tree navigation (M)
- [ ] PAGE-064: Document upload form (M)
- [ ] PAGE-065: Drawings dashboard (discipline/status filters) (M)
- [ ] PAGE-066: PDF annotation editor (L)
- [ ] PAGE-067: Upload links management (S)
- [ ] PAGE-068: Photo gallery `/orgs/[orgId]/projects/[projectId]/photos` (M)

**Communications Module**
- [ ] PAGE-069: Notification bell + dropdown (global) (M)
- [ ] PAGE-070: Notification preferences page (S)
- [ ] PAGE-071: Communications inbox `/orgs/[orgId]/projects/[projectId]/communications` (M)
- [ ] PAGE-072: Communication detail view (M)
- [ ] PAGE-073: Compose message form (M)

### Public Flows
- [ ] PUBLIC-014: `/w/upload/[shareCode]` - Document upload via QR (M)

### Navigation Updates
- [ ] NAV-009: Add Documents to sidebar
- [ ] NAV-010: Add global notification bell to header
- [ ] NAV-011: Add Communications to sidebar

### Effort Summary
| Category | S | M | L | Total |
|----------|---|---|---|-------|
| Schema | 4 | 4 | 0 | 8 |
| Backend | 4 | 6 | 0 | 10 |
| Hooks | 6 | 0 | 0 | 6 |
| Pages | 2 | 10 | 1 | 13 |
| Public | 0 | 1 | 0 | 1 |
| Nav | 3 | 0 | 0 | 3 |
| **Total** | 19 | 21 | 1 | **41 tasks** |

**Estimated Duration:** 3-4 weeks

---

## R6: Chief AI

**Goal:** AI orchestration layer - morning briefs, monitoring, proactive actions

**Depends on:** R5 Complete (documents + notifications required)

### Schema Changes (6 new tables)

**Conversations**
- [ ] `conversations` - orgId, projectId?, userId, title, status, startedAt, lastMessageAt (M)
- [ ] `conversationMessages` - conversationId, role (user|assistant|system|tool), content, toolCalls?, toolResults?, createdAt (M)

**Execution Tracking**
- [ ] `executions` - conversationId?, triggeredBy, status (pending|running|completed|failed), startedAt, completedAt, error? (M)
- [ ] `aiRuns` - executionId, modelId, promptTokens, completionTokens, latencyMs, cost? (S)

**Dashboards**
- [ ] `dashboards` - orgId, projectId?, name, layout, isDefault, createdBy (S)
- [ ] `dashboardWidgets` - dashboardId, widgetType, config, position, size (S)

**Activity**
- [ ] `activityLogs` - orgId, projectId?, entityType, entityId, action, actorId?, actorType (user|chief|system), details, timestamp (M)

### Backend APIs

**Conversations**
- [ ] `conversations.ts` - listByUser, listByProject, get, create, archive (M)
- [ ] `conversationMessages.ts` - listByConversation, append (internal) (S)

**AI Orchestration**
- [ ] `chiefAgent.ts` (action) - processMessage, executeTool, handleToolResult (L)
- [ ] `chiefTools.ts` - db_read, db_write, undo, ui_navigate, present (L)
- [ ] `chiefScheduled.ts` (cron) - morningBrief (6am), endOfDaySummary (5pm), expiryMonitor (hourly) (L)

**Execution**
- [ ] `executions.ts` - listByConversation, get, create, complete, fail (S)
- [ ] `aiRuns.ts` - create, listByExecution (S)

**Dashboards**
- [ ] `dashboards.ts` - listByOrg, listByProject, get, create, update, delete, setDefault (M)
- [ ] `dashboardWidgets.ts` - listByDashboard, create, update, delete, reorder (S)

**Activity**
- [ ] `activityLogs.ts` - listByProject, listByEntity, create (S)

### Hooks Layer
- [ ] `use-conversations.ts` (S)
- [ ] `use-chief-chat.ts` (streaming responses) (M)
- [ ] `use-dashboards.ts` (S)
- [ ] `use-activity-logs.ts` (S)

### Pages

**Chief Interface**
- [ ] PAGE-074: Chief chat panel (sliding pane, streaming) (L)
- [ ] PAGE-075: Morning brief dashboard (4 sections) (L)
- [ ] PAGE-076: End-of-day summary view (M)
- [ ] PAGE-077: Trust progression settings (M)

**Dashboards**
- [ ] PAGE-078: Dashboard editor (widget grid) (L)
- [ ] PAGE-079: Widget library (stats, charts, lists) (M)

**Activity**
- [ ] PAGE-080: Activity feed `/orgs/[orgId]/projects/[projectId]/activity` (M)

### Chief Capabilities
- [ ] CHIEF-001: Morning brief generation (overnight activity, attention items, drafts, handled) (L)
- [ ] CHIEF-002: End-of-day summary (outcomes, tomorrow focus, overnight ops) (M)
- [ ] CHIEF-003: Expiry monitoring (permits, certs, SWMS) (M)
- [ ] CHIEF-004: Pattern detection (repeated delays, compliance gaps) (L)
- [ ] CHIEF-005: Defect auto-assignment (trade matching) (M)
- [ ] CHIEF-006: Follow-up drafting (overdue items) (M)
- [ ] CHIEF-007: Status query answering (natural language → data) (M)

### Navigation Updates
- [ ] NAV-012: Replace Chief placeholder with functional chat pane
- [ ] NAV-013: Add customizable dashboard to org home

### External Integrations
- [ ] INT-004: Claude API for agent responses (M)
- [ ] INT-005: Streaming response handling (M)

### Effort Summary
| Category | S | M | L | Total |
|----------|---|---|---|-------|
| Schema | 4 | 3 | 0 | 7 |
| Backend | 5 | 2 | 3 | 10 |
| Hooks | 3 | 1 | 0 | 4 |
| Pages | 0 | 4 | 3 | 7 |
| Capabilities | 0 | 5 | 2 | 7 |
| Nav | 2 | 0 | 0 | 2 |
| Integrations | 0 | 2 | 0 | 2 |
| **Total** | 14 | 17 | 8 | **39 tasks** |

**Estimated Duration:** 5-6 weeks

---

## R7: Mobile + Remaining QR Flows

**Goal:** 51 mobile screens + 6 remaining QR flows

**Depends on:** R6 Complete (Chief integration for mobile)

### Schema Changes (0 new - all tables exist)

### Mobile Infrastructure
- [ ] MOB-001: WorkerLayout (root with demo context) (M)
- [ ] MOB-002: DeviceFrame (iPhone-style simulator) (S)
- [ ] MOB-003: TabBar (7 bottom tabs) (M)
- [ ] MOB-004: MobileHeader (iOS-style) (S)
- [ ] MOB-005: MobileCard, MobileEmptyState (S)
- [ ] MOB-006: PhotoCapture component (camera, multiple, preview) (M)
- [ ] MOB-007: FieldRenderer (16 field types, conditional logic) (L)
- [ ] MOB-008: use-demo-worker-context.ts (S)

### Mobile Screens by Tab

**Tab 1: Tasks (1 screen)**
- [ ] MOB-010: TaskHub (aggregated tasks, project selector) (M)

**Tab 2: Communication (3 screens)**
- [ ] MOB-011: Communications list (M)
- [ ] MOB-012: CommunicationDetail (S)
- [ ] MOB-013: Inbox (notifications) (S)

**Tab 3: Project (9 screens)**
- [ ] MOB-014: Project ModuleMenu (S)
- [ ] MOB-015: Actions list (S)
- [ ] MOB-016: ActionDetail (S)
- [ ] MOB-017: Schedule view (S)
- [ ] MOB-018: Documents list (S)
- [ ] MOB-019: Drawings list (S)
- [ ] MOB-020: Photos gallery (S)
- [ ] MOB-021: SiteDiaries list (S)
- [ ] MOB-022: SiteDiaryDetail (S)

**Tab 4: Safety (18 screens)**
- [ ] MOB-023: Safety ModuleMenu (S)
- [ ] MOB-024: SignOn screen (S)
- [ ] MOB-025: IncidentsList (S)
- [ ] MOB-026: IncidentDetail (S)
- [ ] MOB-027: IncidentReport form (M)
- [ ] MOB-028: SwmsList (S)
- [ ] MOB-029: SwmsSign (acknowledgments + signature) (M)
- [ ] MOB-030: PermitsList (S)
- [ ] MOB-031: PermitApply form (M)
- [ ] MOB-032: PermitDetail (S)
- [ ] MOB-033: ToolboxList (S)
- [ ] MOB-034: ToolboxAttend (signature) (M)
- [ ] MOB-035: SdsList (S)
- [ ] MOB-036: SdsDetail (S)
- [ ] MOB-037: SdsRequests (S)
- [ ] MOB-038: SdsRequestCreate (S)
- [ ] MOB-039: InductionsList (S)
- [ ] MOB-040: InductionDetail (5-step wizard) (L)
- [ ] MOB-041: Compliance summary (S)
- [ ] MOB-042: TicketWallet (S)
- [ ] MOB-043: TicketCard (S)
- [ ] MOB-044: TicketDetail (S)

**Tab 5: Quality (5 screens)**
- [ ] MOB-045: Quality ModuleMenu (S)
- [ ] MOB-046: Checklists list (S)
- [ ] MOB-047: ChecklistConduct (16 field types, progress) (L)
- [ ] MOB-048: Defects list (S)
- [ ] MOB-049: DefectDetail (S)

**Tab 6: Plant (11 screens)**
- [ ] MOB-050: Plant ModuleMenu (S)
- [ ] MOB-051: Prestarts list (S)
- [ ] MOB-052: PrestartDetail (form + odometer) (M)
- [ ] MOB-053: PrestartResult (pass/fail) (M)
- [ ] MOB-054: PlantRequests (S)
- [ ] MOB-055: AssetsList (S)
- [ ] MOB-056: AssetDetail (S)
- [ ] MOB-057: AssetView (QR scanned) (S)
- [ ] MOB-058: PlantInductionsList (S)
- [ ] MOB-059: PlantInductionDetail (M)

**Tab 7: Profile (1 screen)**
- [ ] MOB-060: Profile (project switcher, certs, settings) (M)

### Remaining QR Public Flows (6 flows)
- [ ] PUBLIC-015: `/w/prestart/[qrCode]` - Asset prestart (implemented in R3)
- [ ] PUBLIC-016: `/w/signin/[code]` - Site sign-in (implemented in R4)
- [ ] PUBLIC-017: `/w/toolbox/[qrCode]` - Toolbox attendance (implemented in R4)
- [ ] PUBLIC-018: `/w/asset/[qrCode]` - Asset view (implemented in R3)
- [ ] PUBLIC-019: `/schedule/confirm/[shareCode]` - Schedule confirmation (implemented in R4)
- [ ] PUBLIC-020: `/w/upload/[shareCode]` - Document upload (implemented in R5)

### Mobile Hooks (51 hooks)
- [ ] MOB-070: Create 51 adapter hooks in `hooks/worker/screens/` (L)
- [ ] MOB-071: Pattern: queries + mutations + enrichment + actions + return (S)

### PWA Configuration
- [ ] MOB-080: manifest.json (icons, theme, orientation) (S)
- [ ] MOB-081: Service worker stub (future offline) (S)
- [ ] MOB-082: iOS/Android install prompts (S)

### Effort Summary
| Category | S | M | L | Total |
|----------|---|---|---|-------|
| Infrastructure | 4 | 3 | 1 | 8 |
| Tab 1-2 | 2 | 2 | 0 | 4 |
| Tab 3 | 8 | 0 | 0 | 8 |
| Tab 4 | 14 | 4 | 1 | 19 |
| Tab 5 | 4 | 0 | 1 | 5 |
| Tab 6 | 6 | 3 | 0 | 9 |
| Tab 7 | 0 | 1 | 0 | 1 |
| Public | (already counted in R3-R5) | | | 0 |
| Hooks | 1 | 0 | 1 | 2 |
| PWA | 3 | 0 | 0 | 3 |
| **Total** | 42 | 13 | 4 | **59 tasks** |

**Estimated Duration:** 5-6 weeks

---

## Release Timeline Summary

| Release | Tasks | Effort | Duration | Cumulative |
|---------|-------|--------|----------|------------|
| R3 Quality + Assets | 44 | M | 3-4 weeks | Weeks 1-4 |
| R4 Site Operations | 53 | L | 4-5 weeks | Weeks 5-9 |
| R5 Documents + Comms | 41 | M | 3-4 weeks | Weeks 10-13 |
| R6 Chief AI | 39 | L | 5-6 weeks | Weeks 14-19 |
| R7 Mobile | 59 | M | 5-6 weeks | Weeks 20-25 |
| **Total** | **236** | | **20-25 weeks** | |

---

## Technical Debt Backlog

**Timestamp Format Migration**
- [ ] DEBT-001: Migrate ~40 timestamp fields from v.number() to v.string() (ISO) (L)
- [ ] DEBT-002: Update all queries/mutations for ISO timestamps (M)

**Schema Consistency**
- [ ] DEBT-003: Worker email field: make optional per spec (S)
- [ ] DEBT-004: Emergency contact field naming: emergencyName → emergencyContactName (S)
- [ ] DEBT-005: Incident status enum: under_investigation → investigating (S)

**Storage & Files**
- [ ] DEBT-006: Configure Convex Storage properly (M)
- [ ] DEBT-007: Implement photo compression (client-side) (M)
- [ ] DEBT-008: Add virus scanning integration for uploads (M)

**Missing Mutations**
- [ ] DEBT-009: Add delete mutations across all entities (M)
- [ ] DEBT-010: Add soft-delete pattern with isDeleted flag (S)

**Placeholders to Replace**
- [ ] DEBT-011: Settings page stub → real settings (M)
- [ ] DEBT-012: Chief AI placeholder → functional (R6)
- [ ] DEBT-013: Demo auth → real auth system (L)

---

## Blockers & Dependencies

### R3 Blockers
- None (schema exists, ready to build)

### R4 Blockers
- R3 complete (checklists needed for toolbox linking)
- Gantt chart library selection (recommend: react-gantt-chart or custom)

### R5 Blockers
- R4 complete (attendance logs needed for activity)
- Convex storage configured for file uploads

### R6 Blockers
- R5 complete (notifications + documents for Chief context)
- Claude API access + MCP server setup
- Streaming response infrastructure
- Cron job infrastructure (Convex scheduled functions)

### R7 Blockers
- R6 complete (Chief integration for mobile)
- Mobile testing devices/simulators
- PWA testing environment

---

## Success Metrics

### R3 Quality + Assets
- [ ] Checklist conductor supports 16 field types
- [ ] Defect → Action linking works
- [ ] Asset prestart creates defects on fail
- [ ] Photo upload working end-to-end

### R4 Site Operations
- [ ] Gantt chart renders with phases/tasks/dependencies
- [ ] QR sign-in works (worker/visitor/delivery)
- [ ] Toolbox attendance via QR captures signatures
- [ ] Schedule confirmation updates task status

### R5 Documents + Communications
- [ ] File upload stores in Convex storage (mediaFiles)
- [ ] Document metadata search works (title/tags)
- [ ] PDF annotation saves/loads
- [ ] Notification bell shows unread count
- [ ] Message delivery tracking works
- [ ] Chief can read files directly via MCP tools

### R6 Chief AI
- [ ] Morning brief generates automatically at 6am
- [ ] Chief can answer "show me overdue defects"
- [ ] Chief can assign defects with undo
- [ ] Trust progression tracks approval rate

### R7 Mobile
- [ ] 51 screens navigable
- [ ] TaskHub aggregates from all modules
- [ ] Prestart pass/fail creates correct records
- [ ] SWMS sign captures all acknowledgments

---

## Version History

- **v3.5** (2026-01-22): PAGE-034/035/036/037/038 complete (defects + action items pages)
- **v3.4** (2026-01-22): PAGE-032/033 complete (project checklists list + conductor pages)
- **v3.3** (2026-01-22): PAGE-030/031 complete w/ checklist section editor component
- **v3.2** (2026-01-22): R3 Backend APIs complete (12 APIs)
- **v3.1** (2026-01-22): R3 Hooks layer complete (9 hooks)
- **v3.0** (2026-01-22): Added R3-R7 implementation plan with full task breakdown
- **v2.0** (2026-01-22): R2 Safety Core complete (tag 0.0.10)
- **v1.0** (2026-01-XX): Initial R2 plan
