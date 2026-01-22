# Site Operations

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)
- [Key Patterns](#key-patterns)
- [Chief Autonomy](#chief-autonomy)
- [Mobile Touchpoints](#mobile-touchpoints)
- [Integration Points](#integration-points)
- [Schema Notes](#schema-notes)
- [Safety/Compliance](#safetycompliance)
- [Performance Considerations](#performance-considerations)
- [Open Questions](#open-questions)
- [Migration Notes](#migration-notes)

## Purpose
Scheduling, diary, toolbox meetings, sign-on/off, briefings, and site-level operational tracking. Core workflows for managing daily site activities, worker attendance, safety meetings, and project schedule.

## Scope

### In Scope
- **Schedule management**: phases, tasks, dependencies, Gantt views, subcontractor confirmations, schedule sharing
- **Daily diary entries**: weather, progress, issues, visitors, attachments
- **Toolbox meetings**: QR attendance, signature capture, meeting details
- **Site sign-on/sign-off**: worker/visitor/delivery tracking, attendance logs
- **Briefings**: simple safety briefings with attendee tracking
- **Alerts**: project-wide notifications (weather, safety, changes)
- **Prestart notices**: safety messages displayed during sign-on

### Out of Scope
- **Asset scheduling** (covered in asset-operations.md)
- **Worker certifications** (covered in safety-compliance.md)
- **Quality inspections** (covered in quality-checklists.md)
- **Document management** (covered in site-documents.md)

## Requirements

### Scheduling
- **REQ-001**: Support hierarchical schedule structure with phases, tasks, and dependencies
- **REQ-002**: Track task status lifecycle: pending → in_progress → completed (or delayed/cancelled)
- **REQ-003**: Assign tasks to subcontractor organizations with confirmation workflow
- **REQ-004**: Support finish-to-start, start-to-start, finish-to-finish, start-to-finish dependencies
- **REQ-005**: Generate shareable schedule links for subcontractors (view-only or confirmation mode)
- **REQ-006**: Track schedule confirmations per subcontractor with embedded confirmation array
- **REQ-007**: Support schedule phases for swimlane grouping with ordering
- **REQ-008**: Chief identifies schedule delays and impacts automatically
- **REQ-009**: Chief surfaces patterns (e.g., "plumbing inspections delayed 3 weeks running")

### Daily Diary
- **REQ-010**: Capture daily site diary entries with date, weather, temperature, work description
- **REQ-011**: Track progress, issues, visitors
- **REQ-012**: Support photo attachments via mediaFiles
- **REQ-013**: Generate AI summaries of diary entries
- **REQ-014**: Editable until archived

### Toolbox Meetings
- **REQ-015**: Schedule toolbox meetings with QR code for attendance
- **REQ-016**: Support internal and external attendee sign-in with signature capture
- **REQ-017**: Link SWMS documents to meetings
- **REQ-018**: Track meeting status: scheduled → in_progress → completed or cancelled
- **REQ-019**: Prevent duplicate sign-in per worker per meeting
- **REQ-020**: Store attendance signatures as base64 PNG (immutable audit trail)

### Sign-On/Sign-Off
- **REQ-021**: Support worker, visitor, and delivery sign-on types
- **REQ-022**: QR code access at site entrance (`/w/signin/{code}`)
- **REQ-023**: Configurable sign-on forms per project with custom fields
- **REQ-024**: Display prestart notices requiring acknowledgment
- **REQ-025**: Track sign-on and sign-off times by date
- **REQ-026**: Link SWMS acknowledgments during sign-on
- **REQ-027**: Support sign-on via QR code (no authentication)
- **REQ-028**: Capture visitor details (name, company, phone, purpose)

### Briefings
- **REQ-029**: Simple briefing creation with title, description, date
- **REQ-030**: Track conductor and attendee workers
- **REQ-031**: Immutable after creation (audit trail)

### Alerts
- **REQ-032**: Create project-wide alerts (weather, safety, change, other)
- **REQ-033**: Track alert lifecycle: draft → sent → archived
- **REQ-034**: Support mandatory acknowledgment requirement
- **REQ-035**: Record sent timestamp

## Entities

| Table | Key Fields | Purpose |
|-------|------------|---------|
| **scheduledTasks** | projectId, phaseId, name, startDate, endDate, status, assignedOrgId, progress, confirmations[] | Project schedule tasks with Gantt chart support |
| **scheduleDependencies** | fromTaskId, toTaskId, dependencyType, lag | Task predecessor relationships |
| **schedulePhases** | projectId, name, startDate, endDate, order | Schedule grouping/swimlanes |
| **scheduleShares** | projectId, shareType, shareCode, targetOrgId, isActive, expiresAt | Unified schedule sharing (view-only + confirmations) |
| **diaries** | projectId, date, weather, temperature, workDescription, progress, issues, visitors, createdBy, attachmentIds, aiSummary | Daily site diary entries |
| **toolboxMeetings** | projectId, title, date, startTime, location, meetingType, conductedBy, linkedSwmsIds, qrCode, status | Safety meetings with QR attendance |
| **toolboxAttendance** | toolboxMeetingId, workerId, workerName, workerCompany, attendanceType, signatureData, signedAt | Individual meeting attendance (immutable) |
| **attendanceLogs** | projectId, workerId, date, signOnTime, signOffTime, notes, signOnConfigId, entryType, visitorDetails, formResponses, prestartNoticeAck, swmsAcknowledgedIds, viaQr | Daily worker sign-on/sign-off + visitor/delivery tracking |
| **briefings** | projectId, title, description, date, conductedBy, attendeeWorkerIds | Simple safety briefings |
| **signOnConfigs** | projectId, name, isDefault, visitorAllowed, deliveryAllowed, prestartNoticeId, customFields | Configurable site sign-on/sign-in forms |
| **prestartNotices** | projectId, title, content, effectiveDate, expiresAt, requiresAcknowledgement, isActive | Safety notices during sign-on |
| **alerts** | projectId, kind, message, requiresAck, status, sentAt | Project-wide alerts/notifications |

## Workflows

### Workflow: Schedule Management
1. Create schedule phases (swimlanes)
2. Add tasks to phases with start/end dates, assigned orgs
3. Define dependencies between tasks
4. Generate share code for subcontractor access
5. Subcontractor views schedule, confirms tasks
6. Track confirmations embedded in scheduledTasks.confirmations[]
7. Update task status as work progresses
8. Chief identifies delays, suggests adjustments

### Workflow: Daily Site Operations (Morning)
1. **7:30 AM** - PM arrives, opens Chief
2. **Overnight Activity** section shows:
   - Rain delay affects 4 tasks (schedule updated)
   - 1 SWMS signed by 8 workers (electrical work)
   - 3 permits approaching expiration
3. **What Needs Your Attention**:
   - Critical defect: scaffolding blocks 3 trades
   - Decision: Permit renewal requires non-standard docs
4. **What I've Drafted for Approval**:
   - Follow-up to subcontractor: Overdue checklist (3 days late)
   - Permit renewal application pre-filled
5. **What I Already Handled**:
   - Updated 8 task statuses from sign-offs
   - Logged daily diary from supervisor notes
   - Generated compliance report (weekly routine)
6. PM reviews (8 minutes total)

### Workflow: Daily Site Operations (Throughout Day)
1. **10:00 AM** - Site walkthrough
2. **2:00 PM** - Working on schedule
   - Council inspection 10am (all docs ready)
   - Chief surfaces: "Plumbing inspections delayed 3 weeks running. Root cause: inspector availability. Suggestion: Book 2 weeks ahead"
3. **4:00 PM** - Client meeting
   - Ask Chief: "Status of waterproofing defect from December"
   - Chief provides warranty doc reference

### Workflow: Daily Site Operations (End of Day)
1. **5:30 PM** - End of day summary
2. **Today's Outcome**:
   - 8 new tasks created, 11 completed
   - 3 permits renewed (all approved)
   - 2 critical defects resolved
   - 1 incident report (minor first aid)
3. **Tomorrow's Focus**:
   - Toolbox meeting 7am (12 attendees confirmed)
   - SWMS refresh: 6 workers (cert expiring)
   - 4 defects due for verification
4. **Overnight Operations**:
   - Send toolbox reminder at 6am
   - Monitor permit expirations
   - Flag urgent issues immediately
5. **Compliance**: 100% (all certs current, all SWMS signed)

### Workflow: Toolbox Meeting QR Attendance
1. Admin creates toolbox meeting with QR code
2. Meeting details: date, time, location, topics, facilitator
3. Link SWMS documents to meeting
4. Worker scans QR code (`/w/toolbox/{qrCode}`)
5. Meeting details displayed
6. Worker selection (internal) or name entry (external)
7. Signature capture on canvas
8. Submit attendance
9. Signature stored as base64 PNG (immutable)
10. Inline confirmation displayed

### Workflow: Site Sign-On via QR
1. Worker arrives at site entrance
2. Scans project QR code (`/w/signin/{code}`)
3. Load project details + worker list + sign-on config
4. Three tabs displayed: Worker / Visitor / Delivery
5. **Worker tab**: select from dropdown, sign in/out button
6. **Visitor tab**: name, company, phone, purpose
7. **Delivery tab**: name, company, phone
8. Optional: Prestart notice displayed (requires acknowledgment)
9. Optional: SWMS acknowledgment via swmsAcknowledgedIds
10. Submit → attendance log created
11. Inline confirmation displayed

### Workflow: Schedule Sharing with Subcontractor
1. PM creates schedule share with shareType: confirm
2. Set targetOrgId for specific subcontractor
3. Generate unique shareCode
4. Send link to subcontractor
5. Subcontractor opens `/schedule/view/{shareCode}`
6. Views tasks, dates, dependencies
7. Confirms tasks via UI
8. Confirmations stored in scheduledTasks.confirmations[] embedded array
9. PM reviews confirmations in dashboard

### Workflow: Daily Diary Entry
1. Site supervisor creates diary entry
2. Set date, weather, temperature
3. Enter work description, progress notes
4. Record issues, visitors
5. Attach photos via mediaFiles
6. Chief generates aiSummary automatically
7. Entry editable until archived
8. Used for progress reporting, issue tracking

### Workflow: Configure Sign-On Forms
1. Admin creates sign-on config for project
2. Set name, visitor/delivery flags
3. Define custom fields (text, select, checkbox)
4. Link optional prestart notice
5. Mark as default (or project-specific)
6. Workers use config when signing on via QR
7. Form responses stored in attendanceLogs.formResponses

### Workflow: Project Alerts
1. Admin creates alert (weather/safety/change/other)
2. Set message, requiresAck flag
3. Status: draft
4. Send alert → status: sent, timestamp recorded
5. If requiresAck: track worker acknowledgments
6. Archive when complete
7. Chief monitors unacknowledged alerts

## Acceptance Criteria

- **AC-001**: Schedule displays Gantt chart with phases, tasks, dependencies
- **AC-002**: Subcontractors can view schedule via share link without login
- **AC-003**: Subcontractors can confirm tasks via share link (confirmation mode)
- **AC-004**: Task confirmations stored in embedded array (orgId, status, confirmedAt, comments)
- **AC-005**: Toolbox meeting QR code generates valid `/w/toolbox/{code}` URL
- **AC-006**: Toolbox attendance signatures captured as base64 PNG
- **AC-007**: Cannot sign toolbox meeting twice (unique index by_meeting_worker)
- **AC-008**: Site sign-on supports worker/visitor/delivery types
- **AC-009**: Sign-on QR code accessible without authentication
- **AC-010**: Prestart notice displayed during sign-on if configured
- **AC-011**: Daily diary entry supports attachments via mediaFiles
- **AC-012**: Chief generates daily diary aiSummary automatically
- **AC-013**: Schedule delays identified by Chief (rain affects 4 tasks)
- **AC-014**: Chief surfaces patterns (e.g., plumbing inspections delayed)
- **AC-015**: Morning brief shows overnight activity, drafted actions, auto-handled items
- **AC-016**: End of day summary shows outcomes, tomorrow's focus, overnight plans
- **AC-017**: Prestart notice displayed during sign-on if configured
- **AC-018**: SWMS acknowledgment linked during sign-on (swmsAcknowledgedIds)
- **AC-019**: Visitor/delivery sign-on captured with details object
- **AC-020**: Custom form fields rendered from signOnConfigs
- **AC-021**: Alerts support requiresAck flag with acknowledgment tracking

## Dependencies

- **Requires**: foundation.md (projects, orgs, workers, mediaFiles)
- **Requires**: safety-swms.md (linkedSwmsIds in toolbox meetings)
- **Requires**: site-documents.md (mediaFiles for attachments)
- **Required by**: mobile-worker.md (worker mobile screens for sign-on, toolbox)
- **Required by**: chief-agent.md (proactive schedule monitoring, pattern detection)

## Key Patterns

### Embedded Confirmations Pattern
**scheduledTasks.confirmations** field stores array of embedded confirmation objects:
```typescript
confirmations: [
  {
    orgId: Id<"orgs">,
    status: "pending" | "confirmed" | "rejected",
    confirmedAt: string, // ISO timestamp
    confirmedByName: string,
    comments: string
  }
]
```
Replaces separate `scheduleTaskConfirmations` table. Simpler queries, atomic updates.

### QR Code Access Pattern
Multiple QR workflows for site operations:
- **Site Sign-In**: `/w/signin/{code}` → project QR code (no auth)
- **Toolbox Attendance**: `/w/toolbox/{code}` → meeting QR code (no auth)

Share codes validated: active check, expiry check, max uses check.

### Signature Capture Pattern
Used in toolboxAttendance and sign-on workflows:
- Canvas-based drawing (300x150px)
- Export as base64 PNG (`data:image/png;base64,...`)
- Store in signatureData field
- Immutable after creation (audit trail)
- Tamper detection via SHA256 hash (in PDF verification QR)

### Schedule Share Modes
**scheduleShares** supports two shareTypes:
- **view_only**: Read-only schedule access
- **confirm**: Subcontractor can confirm tasks

Unified table replaces 3 legacy tables: scheduleShareLinks, schedulePublishes, scheduleConfirmLinks.

## Chief Autonomy

### Loop Management
Chief monitors schedule, diary, attendance, meetings:
- **Stalled tasks**: Task remains in_progress >2× expected duration → flag
- **Expiring shares**: Schedule share expires tomorrow → notify PM
- **Missing confirmations**: Subcontractor hasn't confirmed 3 days before start → escalate
- **Pattern detection**: Same issue recurring (e.g., inspections delayed) → suggest process change

### Proactive Actions
- **Morning brief**: Overnight schedule updates, task status from sign-offs
- **End of day**: Tomorrow's focus (toolbox meeting, SWMS refresh, defects due)
- **Overnight ops**: Send toolbox reminder 6am, monitor permit expirations
- **Auto-logging**: Diary entries from supervisor notes
- **AI summaries**: Generate diary aiSummary automatically

### Escalations
- **Critical**: Scaffolding defect blocks 3 trades → immediate attention
- **Decision**: Permit renewal requires non-standard docs → PM approval
- **Pattern**: Plumbing inspections delayed 3 weeks → suggest booking 2 weeks ahead

## Mobile Touchpoints

### Worker Screens (Tab 1: Tasks)
- **TaskHub**: Aggregated task list across modules
- **Schedule**: Worker's scheduled tasks, calendar view

### Worker Screens (Tab 3: Project)
- **Site Diaries**: List diary entries, tap to view (read-only)
- **Site Diary Detail**: View diary entry details

### Worker Public Flows (QR)
- **Sign-On**: `/w/signin/{code}` → worker/visitor/delivery tabs → sign in/out + prestart notice ack + SWMS ack
- **Toolbox Attendance**: `/w/toolbox/{code}` → meeting details → signature → submit

## Integration Points

### External Systems
- **Schedule export**: PDF/Excel for client reporting
- **Schedule sync**: Procore integration (future)
- **Diary export**: Daily reports for management

### Internal Systems
- **SWMS linking**: toolboxMeetings.linkedSwmsIds → swmsDocuments
- **Worker assignments**: attendanceLogs.workerId → workers
- **Photo attachments**: diaries.attachmentIds → mediaFiles
- **Subcontractor orgs**: scheduledTasks.assignedOrgId → orgs
- **Sign-on linking**: attendanceLogs.signOnConfigId → signOnConfigs
- **Notice linking**: signOnConfigs.prestartNoticeId → prestartNotices
- **SWMS acknowledgment**: attendanceLogs.swmsAcknowledgedIds → swmsDocuments

## Schema Notes

### scheduledTasks Changes
- **Embedded confirmations**: Array of objects (was separate table)
- **Status values**: pending, in_progress, completed, delayed, cancelled
- **Required dates**: startDate, endDate (NOT optional)
- **Progress tracking**: 0-100 percentage

### scheduleShares (NEW)
Unified table replaces 3 legacy tables:
- scheduleShareLinks (view-only) ✗
- schedulePublishes (read-only schedule snapshots) ✗
- scheduleConfirmLinks (subcontractor confirmations) ✗

Single table with shareType discriminator.

### attendanceLogs Extensions
Safety Bucket 2 additions:
- signOnConfigId (FK to signOnConfigs)
- entryType (worker|visitor|delivery)
- visitorDetails (object: name, company, contactPhone, purpose)
- formResponses (custom sign-on form responses)
- prestartNoticeAck (boolean)
- swmsAcknowledgedIds (array of FK to swmsDocuments)
- viaQr (boolean)

### toolboxMeetings vs briefings
- **toolboxMeetings**: Full meeting management, QR attendance, SWMS links, structured
- **briefings**: Simple safety briefings, basic attendee tracking, minimal

## Safety/Compliance

### Sign-On Compliance
- Prestart notices displayed during sign-on
- SWMS acknowledgment during sign-on (swmsAcknowledgedIds)
- Custom fields for site-specific requirements
- Audit trail: immutable attendance logs

### Toolbox Meeting Compliance
- Signature-based attendance (immutable)
- SWMS document linking (linkedSwmsIds)
- Internal + external attendee tracking
- Meeting type taxonomy (toolbox, briefing, safety)

### Schedule Compliance
- Subcontractor confirmations tracked
- Audit trail: who confirmed, when, comments
- Schedule share access control (active, expiry, target org)

## Performance Considerations

### Indexes
- **scheduledTasks**: by_project, by_phase, by_assignedOrg, by_status, by_dates (projectId + startDate + endDate)
- **scheduleDependencies**: by_fromTask, by_toTask
- **scheduleShares**: by_project, by_shareCode, by_targetOrg
- **toolboxMeetings**: by_project, by_date (projectId + date), by_qr, by_status
- **toolboxAttendance**: by_meeting, by_worker, by_meeting_worker (unique)
- **attendanceLogs**: by_project_date (projectId + date), by_worker_date (workerId + date)
- **diaries**: by_project_date, by_project

### Query Patterns
- List tasks by phase: `by_phase` index
- List tasks by subcontractor: `by_assignedOrg` index
- Check task conflicts: `by_dates` index (projectId + startDate + endDate)
- Today's attendance: `by_project_date` index
- Meeting attendance lookup: `by_meeting` index
- Prevent duplicate sign-in: `by_meeting_worker` unique index

### Data Volume
- Typical project: 50-200 schedule tasks, 1-5 diary entries/day, 2-5 toolbox meetings/week
- Large project: 500+ tasks, 10+ diaries/day, daily toolbox meetings
- Attendance logs: 10-50 workers/day × 365 days = 3,650-18,250 records/year/project

## Open Questions

1. **Schedule baseline tracking**: Should we track baseline vs actual (variance analysis)?
2. **Diary templates**: Should diary entries support templates for common fields?
3. **Toolbox meeting reminders**: SMS or email reminders for scheduled meetings?
4. **Sign-on geofencing**: Validate worker at correct site location via GPS?
5. **Schedule critical path**: Auto-calculate critical path for Gantt chart?

## Migration Notes

### From Current Schema
- **scheduledTasks**: Embed confirmations array (was separate scheduleTaskConfirmations table)
- **scheduleShares**: Consolidate 3 tables (scheduleShareLinks, schedulePublishes, scheduleConfirmLinks)
- **attendanceLogs**: Add Safety Bucket 2 extensions (signOnConfigId, entryType, visitorDetails, etc.)
- **diaries**: Remove status field (draft/final), add aiSummary
- **toolboxMeetings**: Rename fields (topic→title, scheduledDate→date+startTime, notes→minutes)

### Data Migration Steps
1. Migrate scheduleTaskConfirmations → scheduledTasks.confirmations[] (embed)
2. Consolidate schedule share tables → scheduleShares (map shareType)
3. Backfill attendanceLogs.entryType from existing data (default: worker)
4. Generate diaries.aiSummary for existing entries
5. Migrate toolboxMeetings field names
