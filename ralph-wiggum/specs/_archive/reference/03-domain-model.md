# 03: Domain Model Specification

> Complete business domain model for PRJ Construction rebuild
> **Version:** 1.0 (2026-01-21)
> **Status:** Draft

---

## 1. Purpose & Scope

### What This Covers

This specification documents the complete business domain model for PRJ Construction:

- **4+1 Module Structure**: Site Management, Safety, Asset, Quality, Communication
- **49 Submodules**: Detailed breakdown of every business domain
- **97 Entities**: Complete entity catalog with relationships
- **730+ Features**: Every capability across all modules
- **Cross-Module Patterns**: Shared concerns (attachments, comments, signatures, etc.)
- **Workflows**: Complete business process flows
- **Entity Relationships**: All connections between entities

### What This Does NOT Cover

- **Database schema details** → See `04-schema.md`
- **Technical implementation** → See other specs
- **UI components** → See `06-ui-system.md`
- **AI system tools** → See `05-ai-system.md`

### Why This Document Exists

This is THE authoritative reference for:
- What PRJ Construction does
- What entities exist
- How they relate
- What features exist
- What workflows are supported

Every other specification derives requirements from this document.

---

## 2. Overview

### The 4+1 Module Structure

```
PRJ Construction
├── Site Management (18 submodules, 250+ features)
│   └── Core project operations
├── Safety (11 submodules, 200+ features)
│   └── WHS compliance
├── Asset (8 submodules, 100+ features)
│   └── Equipment & materials
├── Quality (4 submodules, 80+ features)
│   └── Defect & inspection management
└── Communication (8 submodules, 100+ features)
    └── Cross-cutting integration
```

### Module Responsibilities

| Module | Domain | Key Entities |
|--------|--------|--------------|
| **Site Management** | Project operations, scheduling, documentation, daily activities | Projects, Tasks, Schedule, Diary, Drawings, RFIs, Variations, Workers, Trades |
| **Safety** | WHS compliance, incidents, permits, SWMS, inductions | SWMS, Inductions, Incidents, Permits, Hazards, Certifications, SDS |
| **Asset** | Equipment, plant, vehicles, tools management | Assets, Registers, Prestarts, Maintenance, Bookings |
| **Quality** | Defect tracking, inspections, actions, compliance | Defects, Checklists, Actions, NCRs, ITPs, Hold Points |
| **Communication** | External integration, notifications, mail | Notifications, Communications, Media, Documents, AI Integration |

### Scale Summary

- **Total Entities:** 97 tables
- **Total Features:** 730+
- **Total Relationships:** 190+ distinct connections
- **Submodules:** 49 business domains
- **Template/Instance Pairs:** 8 major workflows
- **Polymorphic Links:** 15+ flexible relationships
- **Share Code Flows:** 8 public access patterns

---

## 3. Core Concepts

### Concept 1: Module/Submodule/Feature Hierarchy

**Organization:**
```
Module (Business Domain)
  ↓
Submodule (Entity Type)
  ↓
Feature (Capability)
```

**Example:**
```
Safety Module
  ↓
SWMS Submodule
  ↓
Features:
  - Create SWMS from template
  - Build SWMS with 12 sections
  - Hazard/control mapping
  - Worker signing (signature canvas)
  - Version control
  - Assignment to projects/trades
  - PDF export
  - QR code for signing
```

### Concept 2: Template/Instance Pattern

**Pattern:** Reusable org-level templates instantiated for specific projects

**8 Major Template/Instance Pairs:**

1. **SWMS**: `swmsTemplates` → `swmsDocuments`
2. **Inductions**: `inductionTypes` → `inductionCompletions`
3. **Checklists**: `checklistTemplates` → `checklistInstances`
4. **Permits**: `permitTypes` → `permitInstances`
5. **Prestarts**: `prestartTemplates` → `prestartSubmissions`
6. **Incidents**: `incidentTemplates` → `incidentReports`
7. **Certifications**: `certificationTypes` → `competencyRecords`
8. **Insurance**: `insuranceTypes` → `insurancePolicies`

**Benefits:**
- Org-wide standardization
- Quick project setup
- Consistent compliance
- Version control
- Knowledge reuse


**Safety Module Template/Instance Pairs (3 of 8):**
1. SWMS: swmsTemplates → swmsDocuments
2. Incidents: incidentTemplates → incidentReports
3. Permits: permitTypes → permitInstances (modern system)

Note: Permits use "types" terminology instead of "templates" but follow same pattern

### Concept 3: Org → Project → Entity Hierarchy

**Scoping:**
```
orgs (root)
  ↓
projects (scoping entity)
  ↓
All project-specific entities
```

**Multi-Tenancy:**
- Every project belongs to one org (principal contractor)
- Workers belong to org, assigned to projects
- Templates are org-level
- Instances are project-level
- Media/docs can be org or project scoped

**Enables:**
- Org library patterns (documents, templates)
- Cross-project reporting
- Worker mobility between projects
- Standardization across projects

### Concept 4: Cross-Cutting Concerns

Patterns shared across all modules:

| Concern | Implementation | Used By |
|---------|----------------|---------|
| **Attachments** | 4 strategies (arrays, bridge tables, polymorphic, embedded) | 15+ entities |
| **Comments** | Dedicated tables per entity | Defects, Actions |
| **Signatures** | 3 storage approaches (embedded, dedicated tables, responses) | SWMS, Inductions, Checklists, Permits |
| **Audit Logs** | Embedded arrays or dedicated tables | Inductions, Assets, Toolbox |
| **Share Codes** | Public access via unique codes + indexes | 8+ entities for QR flows |
| **Status Management** | Consistent enums + CSS variables | 20+ entities |
| **Assignment** | Dual pattern (org + worker) | Defects, Actions, Checklists |
| **Polymorphic Linking** | sourceType + sourceId | Checklists, Defects, Actions |
| **PDF Generation** | Entity-specific templates | SWMS, Reports, Certificates |
| **Notifications** | In-app feed + preferences | All workflow events |


**Safety Module Patterns:**

**Share Code Pattern (Safety Module):**
- SWMS: shareCode for external worker signing (QR code)
- Permits: (legacy permitApplications has shareCode)
- All use by_shareCode index for O(1) lookup
- Enables no-auth public access flows
- Security: unique random string, time-limited

**Worker Role Tracking Pattern:**
All safety entities track multiple worker roles:
- SWMS: createdBy, approvedBy, signatures[].workerId, assignments[].workerId
- Permits: applicantWorkerId, approverWorkerId, approvedByWorkerId, closedByWorkerId
- Incidents: reportedBy, affectedWorkerId, investigatorId

Purpose: Accountability + audit trail for WHS compliance

**Gantt/Timeline Styling:**
Status CSS variables also used for:
- Progress bar colors in timelines
- Background colors in Gantt charts
- Selected state colors
- Visual indicators for completion state

---

## 4. Detailed Specification

### 4.1 Module 1: Site Management

**Status Management:**

**Status Values:**
- `sent` - Delivered, no recipients have read
- `partially_read` - Some recipients read
- `read` - All recipients read

**Status Derivation:** Calculated from communicationRecipients.isRead counts, not stored on communication record

**Recipient Candidate Logic:**
- Pool: Workers assigned to project + all workers in project's org
- Deduplicated by workerId
- Enriched with:
  - signedOnToday: Has attendanceLog for today's date
  - inductedToday: Has completed induction today
  - orgName: For display and filtering
- Updated in real-time as workers sign on or complete inductions

**Media Storage:**
- Attachments → Media Files → Storage (Convex or external)
- Convex storage: Delete from ctx.storage on removal
- External storage: Only delete database record


#### Overview

**Purpose:** Core project operations - scheduling, documentation, communication, daily site activities

**Core Entities:** Projects, Tasks, Diary, Drawings, RFIs, Variations, Workers, Trades

**Submodules:** 18

---

#### Submodule 1.1: Project Foundation

**Purpose:** Core project structure and organization hierarchy

**Entities:**
- `orgs` - Organizations (principal, subcontractors, clients, suppliers)
- `projects` - Construction projects
- `workPackages` - Project scope subdivisions
- `trades` - Construction trades/disciplines

**Features:**
1. Create/update organizations (kind: principal, subcontractor, client, supplier, regulator)
2. Manage organization details (name, ABN, contact info)
3. Project CRUD (status: planning, active, completed, archived)
4. Project metadata (code, address, value, start/end dates)
5. Work package management with trade assignments
6. Trade master list management (code, name, description)
7. Soft delete via isActive flags
15. Auto-increment defect numbers (per-project: #1, #2, #3)
16. Defect number badge display with category color coding
17. Photo markup editor with annotation tools:
    - Drawing tools (freehand, shapes, arrows, text)
    - Color picker
    - Stroke width adjustment
    - Save annotated version as new file (preserves original)
    - Markup data stored with photo metadata
18. Link defect to drawing (sourceDocuments)
19. Navigate from defect to linked drawing
20. Display drawing reference in defect detail
21. Structured location breakdown:
    - location (free text address)
    - level (predefined: Ground Floor, Level 1-3, Basement, Roof)
    - area (predefined: Kitchen, Bathroom, Living Room, Bedroom, Garage, Exterior, Common Area)
    - Composite location display: "location • level • area"
22. Multi-select defects (checkbox UI)
23. Bulk change status (respects workflow rules per defect)
24. Bulk assign to org or worker
25. Bulk action toolbar with selection counter
26. Clear selection button
27. Disabled states if status transition invalid for any selected defect
28. Link defect to asset (plant/equipment)
29. Display asset reference in defect detail (itemId + name)
30. Help text: "Link this defect to a plant/equipment item"
31. Overdue badge display (red background) if dueDate < today and status != closed
32. Overdue styling on due date field (red text)
33. isOverdue calculated field (not stored)
34. Create defect from checklist field dialog
35. Pre-populate title: "Defect from: {fieldLabel}"
36. Pre-populate description with field value
37. Source linking: sourceType='checklist', sourceId=instanceId
38. Minimal form: title, description, priority, location
39. Chip button selection UI for category (4 options with color coding):
    - builder (orange), client (blue), safety (red), other (gray)
40. Chip button selection UI for priority (4 options with color coding):
    - critical (red), high (orange), medium (yellow), low (green)
41. Selected state: filled background with CSS variable colors
42. Unselected state: outline style
21. Create defect from any checklist field (button per field)
22. Create action item from any checklist field (button per field)
23. Link created defect/action back to checklist instance (linkedDefectIds, linkedActionIds arrays)
24. Display linked defect/action count in checklist report view
25. Navigate to linked defects/actions from checklist
26. Enhanced response structure per field:
    { [fieldId]: { value, notes?, attachmentIds?, signature? } }
27. Field-level notes capture (separate from main notes)
28. Field-level attachment storage (multiple per field)
29. Field-level signature capture (role-based)
30. Extract all attachments from checklist responses
31. Gallery view of all photos/files across all fields
32. Group by field or chronological
33. Lightbox modal for photo viewing
34. Download individual or all attachments
35. Activity timeline generation from checklist lifecycle:
    - Created event (_creationTime)
    - Started event (performedAt)
    - Completed event (completedAt)
36. Timeline display with icons and relative timestamps
37. buildChecklistTimeline utility function
38. Tabbed report view:
    - Overview tab (responses with conditional logic, field notes, attachments)
    - Activity tab (timeline of events)
    - Attachments tab (gallery view)
    - Links tab (defects/actions created from this checklist)
39. Metadata cards: created date, completed date, performer, assigned to, due date
40. Back button navigation
41. Status badge in header
12. Dual assignment model:
    - assignedTo (worker ID) OR
    - assignedToOrgId (org ID)
    - Mutually exclusive (selecting one clears the other)
13. Form UI shows both dropdowns (worker and org)
14. Only one can be populated at a time
15. Public action view via shareCode:
    - Simplified view (no edit/delete buttons)
    - Show: title, description, status, priority, due date, assignee, project name
    - Comment thread (public comments with authorName)
    - Attachments gallery
    - Overdue indicator if dueDate < today and status != completed
16. External comment submission:
    - No workerId required
    - authorName captures commenter name (string)
    - isPublic flag on comment thread
13. Recipient candidate filtering (signed today, inducted today, by org)
14. Bulk recipient selection (all visible, clear visible)
15. Search recipients by name, org, role
16. Cross-reference with attendance logs (today's sign-ons)
17. Cross-reference with induction completions (today's inductions)
18. Auto-generate message preview (140 chars, normalized whitespace)
19. Sender selection (org workers only, required before send)
20. Validation: sender must belong to project's org
21. Multi-file attachment upload (concurrent)
22. Attachment removal before send
23. File kind detection (image, document, pdf)
24. Upload progress indicator
25. File size and MIME type capture

**Relationships:**
- Checklist Instances → Defects (1:N via linkedDefectIds array)
  Purpose: Track all defects created from this checklist execution
- Checklist Instances → Actions (1:N via linkedActionIds array)
  Purpose: Track all actions created from this checklist execution

**Indexes:**
- communications.by_project_sentAt: Sent list queries (desc order)
- communications.by_project_sender: Filter by sender
- communicationRecipients.by_worker_project_deliveredAt: Worker inbox
- communicationRecipients.by_comm_worker: Mark read lookup
- communicationRecipients.by_worker_read: Unread badge counts

- Defects → Source Documents (N:1 via drawingId)
  Purpose: Link defect to specific drawing/document for location reference
- Defects → Assets (N:1 via assetId)
  Purpose: Link defect to plant/equipment item (asset-related defects)
- Org → Projects (1:N)
- Projects → Work Packages (1:N)
- Trades → Work Packages (1:N via tradeId)
- Projects → All project-scoped entities (1:N)

**Status Workflow:**
```
planning → active → completed → archived
```

**Business Rules:**
- Mark all read: Processes up to 200 messages per worker
- Skips already-read messages
- Updates isRead and readAt timestamp
- assignedTo (worker) and assignedToOrgId (org) are mutually exclusive
- Selecting one clears the other
- UI shows both dropdowns but enforces mutex
- Backend validation: reject if both populated
- Defect/action can be created from any checklist field (regardless of field type)
- sourceType='checklist', sourceId=checklistInstanceId automatically set
- linkedDefectIds/linkedActionIds arrays updated on parent checklist instance
- Title auto-populated: "Defect/Action from: {fieldLabel}"
- Field value pre-fills description (if field has value)
- Bulk status change validates transition for each defect individually
- If any defect can't transition, status dropdown shows available common transitions only
- Disabled reason shown if no valid bulk transitions available
- Assignment changes always allowed (no workflow constraint)
- Org is root entity (no parent)
- Project requires orgId (principal contractor)
- Optional clientOrgId for client organization
- Work packages can be org or project scoped
- Trades are global master data

---

#### Submodule 1.2: Worker Management

**Purpose:** Worker records, assignments, certifications, competencies

**Entities:**
- `workers` - Site personnel records
- `workerAssignments` - Project assignments
- `competencyRecords` - Certifications/licenses/tickets

**Features:**
1. Worker CRUD (fullName, email, phone, role, trade, employer)
2. Project assignment management (role per project)
3. Certification tracking (white card, EWP, forklift, tickets, licenses)
4. Emergency contact management (name, phone, relationship)
5. BuildPass profile integration (DOB, address, medical conditions, allergies)
6. Certificate verification workflow (pending → verified → rejected → expired)
7. Expiry alerts (30 days before)
8. Avatar photo upload
9. Worker search by email
10. Active/inactive status management

**Relationships:**
- Orgs → Workers (1:N via orgId)
- Workers ↔ Projects (N:N via workerAssignments)
- Workers → Competency Records (1:N)
- Certification Types → Competency Records (1:N)
- Workers → Media Files (1:1 via avatarId)

**Certificate Categories:**
- `license` - Construction Induction/White Card
- `ticket` - High Risk Work License
- `training` - Safety training, first aid
- `medical` - Medical clearance

**Status Workflow:**
```
pending → active → inactive
```

**Business Rules:**
- Workers belong to one org (employer)
- Can be assigned to multiple projects
- Certification expiry triggers notifications 30 days before
- Verification required for site access
- Emergency contact optional but recommended

---

#### Submodule 1.3: Schedule & Planning

**Purpose:** Project timeline with phases, tasks, dependencies, confirmations

**Entities:**
- `schedulePhases` - Gantt swimlanes
- `scheduledTasks` - Task items
- `scheduleDependencies` - Finish-to-start relationships
- `scheduleShareLinks` - Public schedule viewing
- `scheduleConfirmLinks` - Org-specific confirmation
- `scheduleTaskConfirmations` - Per-task, per-org confirmation
- `schedulePublishes` - Publication event log

**Features:**
1. Phase management (create, reorder, color-code, collapse)
2. Task CRUD (title, start/end dates, status, progress, org assignment)
3. Dependency management with auto-cascade (updates propagate downstream)
4. Bulk task import (CSV/Excel)
5. Drag-and-drop reordering
6. Auto-connect all tasks sequentially
7. Org assignment with confirmation workflow
8. Public schedule sharing via share code
9. Schedule publication with org notifications
10. Subcontractor date confirmation
11. Worker task list (shows assigned org's tasks)
12. Gantt chart visualization
13. Critical path calculation
14. Progress tracking (percentage complete)
15. Status management (not_started, in_progress, complete)
16. Confirmed status tracking per org
17. Progress tracking (0-100 percentage, displayed in Gantt bars)
18. Duration display (computed from startDate → endDate, shown in days)
19. Edit mode toggle (enter/exit editing with save/discard, visual status indicator)
20. Preview mode (read-only view with limited actions)
21. Table view (spreadsheet layout, inline editing, phase collapsing)
22. Timeline view (Gantt chart, visual dependencies, drag-to-edit dates)
23. Timeline zoom modes (weekly vs monthly granularity)
24. Visual dependency arrows in timeline
25. Progress bars in Gantt visualization
26. Filter tasks by status (not_started, in_progress, complete, all)
27. Empty phase visibility (hidden in filtered view unless editing)

**Relationships:**
- Projects → Phases (1:N)
- Phases → Tasks (1:N)
- Tasks ↔ Tasks via Dependencies (N:N, fromTaskId → toTaskId)
- Tasks → Orgs (assignment, N:1 via assignedOrgId)
- Projects → Share Links (1:N)
- Projects → Confirm Links (1:N)
- Confirm Links → Orgs (1:1)
- Tasks → Task Confirmations (1:N)
- Orgs → Task Confirmations (1:N)

**Status Values:**
- `not_started` - Task not begun
- `in_progress` - Work underway
- `complete` - Task finished

**Confirmation Flow:**
```
Admin publishes schedule
  ↓
Create schedulePublishes record
  ↓
Generate scheduleConfirmLinks per org (with shareCode)
  ↓
Create scheduleTaskConfirmations (status: pending)
  ↓
Org accesses via shareCode (public URL)
  ↓
Confirms tasks (status: confirmed)
  ↓
Updates scheduledTasks.confirmedStatus
```

**Dependency Cascade:**
```
Task A finish date changes
  ↓
Query scheduleDependencies (fromTaskId = A)
  ↓
Update dependent tasks' start dates
  ↓
Recursively cascade to downstream tasks
```

**Business Rules:**
- Duration (days) computed client-side from date range for display
- Only finish-to-start dependencies (no start-to-start, etc.)
- Dependency cycles prevented
- Auto-cascade updates downstream tasks
- One phase can have multiple tasks
- Tasks can be assigned to org (subcontractor)
- Confirmation required before work begins
- Share codes expire after configurable period

---

#### Submodule 1.4: Site Diaries

**Purpose:** Daily site records with weather, activities, issues

**Entities:**
- `diaries` - Daily site diary entries

**Features:**
1. Daily diary creation (one per project per date)
2. Weather tracking (summary, temperature, inclement events)
3. Activity logging (text + rich HTML)
4. Issue tracking (inline text)
5. Photo attachments (via mediaFiles)
6. AI-generated summary (from attendance, tasks, photos, incidents)
7. Draft/final status workflow
8. Inclement weather events (multiple per day: id, description, time; for variation claims)
9. Date-based indexing
10. Search by date range
10. Rich HTML description field (separate from activities, supports formatting)
11. Attendance grouped by organization (shows org name, worker list, total hours, worker count)
12. Attachment management (upload files, link to mediaFiles, display gallery)
13. Calendar view (month-based visualization, optimized queries by year/month)
14. Month filter optimization (listByProjectMonth query for calendar performance)

**Relationships:**
- Diaries ↔ Attendance Logs via date (aggregated by org for display)

**Status Workflow:**
draft → final (via finalize mutation)

**Status Business Rules:**
- Drafts can be edited
- Final diaries are locked (no further edits)
- Separate "Save as Draft" vs "Save & Finalize" actions
- Status badge displayed in UI

- Projects → Diaries (1:N, unique per date)
- Diaries → Media Files (N:N via attachmentIds array)

**AI Integration:**
- Auto-populate weather from API
- Auto-populate activities from schedule (completed tasks)
- Generate summary from:
  - Attendance logs (who was on site)
  - Completed tasks
  - Photos taken
  - Incidents reported
  - Weather conditions

**Business Rules:**
- One diary per project per date
- Weather data pulled from external API
- AI summary regenerates on demand
- Photos tagged with capture timestamp
- Inclement weather events support variation claims

---

#### Submodule 1.5: Toolbox Meetings

**Purpose:** Safety meetings with attendance tracking and QR sign-on

**Entities:**
- `toolboxMeetings` - Meeting records
- `toolboxAttendance` - Worker attendance
- `toolboxActivityLogs` - Meeting lifecycle audit trail

**Features:**
1. Meeting creation (topic, date, location, conductor, type: safety/prestart/toolbox)
2. QR code generation for sign-on
3. Worker attendance tracking (manual or QR)
4. Signature capture per attendee
5. Agenda management (structured text)
6. SWMS linking (reviewed documents via linkedSwmsIds array)
7. SDS linking (safety data sheets)
8. Document attachments (via sourceDocuments)
9. Activity logging (created, started, completed, cancelled, archived)
10. Meeting lifecycle management (scheduled → in_progress → completed → archived)
11. Attendance export (PDF/CSV)
12. Search by date range
13. Filter by conductor
14. Worker attendance history

**Relationships:**
- Projects → Meetings (1:N)
- Meetings → Attendance (1:N)
- Meetings → Activity Logs (1:N)
- Meetings → SWMS Documents (N:N via linkedSwmsIds)
- Meetings → SDS Library (N:N via linkedSdsIds)
- Meetings → Source Documents (N:N via attachmentIds)
- Workers → Meetings (conductor, N:1)
- Workers → Attendance (1:N)

**Status Workflow:**
```
scheduled → in_progress → completed
               ↓
          cancelled → archived
```

**QR Sign-On Flow:**
```
Admin creates meeting → QR generated
  ↓
Worker scans QR
  ↓
Opens mobile sign-on (public URL)
  ↓
Creates toolboxAttendance (viaQr: true)
  ↓
Optional signature capture
  ↓
Activity log updated (worker_joined)
```

**Business Rules:**
- QR code unique per meeting
- Attendance can be added manually or via QR
- Signature optional (configurable)
- Meeting must be "in_progress" to accept attendance
- Activity logs track full lifecycle
- SWMS/SDS links create audit trail

---

#### Submodule 1.6: Attendance & Sign-On

**Purpose:** Daily worker sign-on/sign-off with induction checks

**Entities:**
- `attendanceLogs` - Daily sign-on records

**Features:**
1. Worker sign-on (time, location, org)
2. Worker sign-off (time)
3. Entry type tracking (worker, visitor, delivery)
4. Visitor details capture (name, company, contact, purpose)
5. Induction verification at entry
6. SWMS acknowledgment at sign-on
7. Prestart notice acknowledgment
8. Custom form responses (via signOnConfigs)
9. QR-based sign-on
10. Hours worked calculation (sign-in to sign-out)
11. Daily attendance report
12. Search by worker/date
13. Export to CSV

**Relationships:**
- Projects → Attendance Logs (1:N)
- Workers → Attendance Logs (1:N)
- Orgs → Attendance Logs (1:N)
- Sign-On Configs → Attendance Logs (configuration)
- SWMS Documents → Attendance Logs (N:N via acknowledgedSwmsIds, acknowledged at entry)

**Sign-On Flow:**
```
Worker arrives → Scans QR or uses app
  ↓
System checks:
  - Valid induction (inductionCompletions)
  - Required SWMS (swmsAssignments)
  - Prestart notice (if applicable)
  ↓
Custom form fields (if configured)
  ↓
Create attendanceLog (signInTime)
  ↓
Worker leaves → Update signOutTime
  ↓
Calculate hours: signOutTime - signInTime
```

**Induction Verification:**
```
Query inductionCompletions
WHERE workerId = ? AND status = 'completed'
AND expiresAt > now
```

**Business Rules:**
- Cannot sign-on without valid induction
- SWMS acknowledgment required if assigned
- One active sign-on per worker per project
- Sign-off required for accurate hours
- Visitor sign-on simpler (no induction check)

---

#### Submodule 1.7: Briefings (Simple)

**Purpose:** Quick informal safety briefings (lighter than toolbox meetings)

**Entities:**
- `briefings` - Simple briefing records

**Features:**
1. Create briefing (date, topic, notes)
2. Attendee list (array of worker IDs)
3. Date-based search
4. Basic filtering

**Relationships:**
- Projects → Briefings (1:N)
- Workers → Briefings (N:N via attendeeWorkerIds array)

**vs Toolbox Meetings:**

| Feature | Briefings | Toolbox Meetings |
|---------|-----------|------------------|
| Complexity | Simple | Full workflow |
| Signatures | No | Yes |
| QR codes | No | Yes |
| Linked docs | No | Yes (SWMS/SDS) |
| Activity logs | No | Yes |
| Use case | Quick informal | Formal compliance |

**Business Rules:**
- No formal attendance tracking
- No signature requirement
- Workers stored as ID array (not separate table)
- Faster to create than toolbox meeting

---

#### Submodule 1.8: Documents & Drawings

**Purpose:** Document management with AI chunking for RAG

**Entities:**
- `sourceDocuments` - Document metadata
- `documentChunks` - Text chunks for AI search
- `documentEntityLinks` - Document → entity relationships
- `documentFolders` - Hierarchical organization
- `documentUploadLinks` - Public upload access
- `pdfAnnotations` - Drawing markup

**Features:**
1. Document upload (via aiFileIntakes or direct)
2. Folder hierarchy management
3. Document versioning (version, previousVersionId)
4. Org library pattern (org-level docs linked to projects)
5. AI text extraction and chunking (~500 tokens per chunk)
6. Vector embedding generation (via Pinecone/OpenAI)
7. Semantic search across documents
8. Entity linking (link document chunks to defects, swms, etc.)
9. PDF annotation/markup (rectangles, circles, arrows, text, freehand)
10. Public upload links with share codes
11. Document tagging
12. Version control (new version creates new record)
13. Previous version tracking
14. Search by title/tags
15. Filter by docType
16. Folder navigation


**Drawing Management:**

Drawings are specialized sourceDocuments with:
- docType: 'drawing' (discriminator field)
- Dedicated metadata structure (sheetNumber, revision, discipline, scale, drawnBy, drawnDate, status)
- Separate dashboard UI
- PDF-only constraint
- Annotation support (via pdfAnnotations table)
- Promotion from generic documents

**Drawing-Specific Features:**
1. Sheet number tracking (e.g., "A-101")
2. Revision management (e.g., "A", "B")
3. Discipline classification (architectural, structural, electrical, mechanical, plumbing, civil, fire, other)
4. Scale notation (e.g., "1:100")
5. Drawn by (consultant/firm)
6. Drawn date
7. Drawing status (current, superseded, for_review, draft)
8. Promote document to drawing
9. Drawing statistics by discipline and status
10. Filter by discipline
11. Search by sheet number or title
12. Annotation badge (shows if drawing has markups)

**Disciplines:**
- architectural (A)
- structural (S)
- electrical (E)
- mechanical (M)
- plumbing (P)
- civil (C)
- fire (F)
- other (X)

Each has code prefix for sheet numbering convention.

**Status Workflow:**
draft → for_review → current → superseded

**Status Values:**
- current: Active drawing set
- superseded: Replaced by newer revision
- for_review: Pending approval
- draft: Work in progress

**Additional Features:**
20. Drawing statistics (total, by discipline, by status, with annotations count)
21. Stats dashboard cards (visual metrics display)
22. Promote document to drawing (convert PDF document, add drawing metadata, validate mime type)

**Relationships:**
- sourceDocuments (docType='drawing') → Drawings (1:1 conceptual, via discriminator)

**Implementation Note:** Drawings are not separate table, but filtered view of sourceDocuments where docType='drawing'.
- Projects → Source Documents (1:N)
- Orgs → Source Documents (1:N, library)
- Org Docs → Project Docs (N:N via linkedFromOrgDocId)
- Documents → Chunks (1:N)
- Documents → Annotations (1:1)
- Documents → Media Files (1:1)
- Documents → Folders (N:1)
- Chunks ↔ Entities via documentEntityLinks (N:N, polymorphic)

**Link Types:**
- `source` - Document is source of truth
- `evidence` - Document provides evidence
- `definition` - Document defines requirements
- `note` - Document adds context

**Chunking Strategy:**
```
PDF → Extract text per page
  ↓
Split into ~500 token chunks (50 token overlap)
  ↓
Store in documentChunks (text, pageNumber, chunkIndex)
  ↓
Generate embeddings (OpenAI)
  ↓
Store in vector DB (Pinecone) with embeddingKey
  ↓
Enable semantic search
```

**Annotation Tools:**
- Rectangle
- Circle
- Arrow
- Text label
- Freehand drawing
- Color picker
- Stroke width
- Delete annotation

**Business Rules:**
- Drawings must be PDF files (mime type validated on creation/promotion)
- Non-PDF documents cannot be promoted to drawings
- Upload form accepts only application/pdf
- Documents can be org or project scoped
- Org docs can be "linked" to projects (not copied)
- Version control creates new record, preserves old
- Chunks automatically regenerated on version
- Public upload links expire after configurable period
- Annotations stored separate from original file

---

#### Submodule 1.9: Media Files

**Purpose:** Unified file storage pointer (Convex or external)

**Entities:**
- `mediaFiles` - File metadata and storage references

**Features:**
1. File upload (< 20MB → Convex, > 20MB → external)
2. Photo categorization (site, progress, safety, quality)
3. Caption and tagging
4. Entity linking (polymorphic: linkedEntityType + linkedEntityId)
5. Photo timestamp (takenAt)
6. Storage provider abstraction (Convex storage or external URL)
7. Temporary signed URL generation (Convex)
8. File size tracking
9. MIME type detection
10. Search by category
11. Filter by date
12. Photo gallery views

**Relationships:**
- Projects → Media Files (1:N)
- Orgs → Media Files (1:N)
- Media Files ↔ Any Entity (polymorphic via linkedEntityType/linkedEntityId)

**Storage Strategy:**
- **Convex:** Files < 20MB → storageProvider = 'convex', storageId populated
- **External:** Files > 20MB or external hosting → storageProvider = 'external', externalUrl populated

**Kind Values:**
- `document` - PDFs, Word, Excel
- `image` - Photos, drawings
- `video` - Video recordings
- `audio` - Audio recordings
- `other` - Miscellaneous

**Business Rules:**
- Convex storage URLs expire (1 hour), regenerated on query
- External URLs permanent
- Photos tagged with capture timestamp for timeline
- Category drives filtering in photo galleries

---

#### Submodule 1.10: Notifications

**Purpose:** In-app notification feed for users

**Entities:**
- `notifications` - Notification records
- `notificationPreferences` - User settings

**Features:**
1. Notification creation (title, message, type, entity link)
2. Read/unread tracking
3. Entity linking (polymorphic: entityType + entityId)
4. User preferences (per notification type: inApp, email, emailFrequency)
5. Notification types: expiry_alert, approval_request, action_reminder, status_change, system
6. Mark as read
7. Mark all as read
8. Filter by read/unread
9. Search notifications
10. Delete notification

**Relationships:**
- Users → Notifications (1:N via userId)
- Users → Preferences (1:N)
- Notifications ↔ Entities (polymorphic)

**Triggers:**
- Certificate expiry within 30 days → expiry_alert
- SWMS status = 'pending_review' → approval_request
- Action item dueDate < today → action_reminder
- Defect status → 'resolved' → status_change
- Schedule published → status_change
- Permit needs approval → approval_request

**Email Frequency:**
- `instant` - Send immediately
- `daily` - Batch daily digest
- `weekly` - Batch weekly digest

**Business Rules:**
- Default preferences: inApp = true, email = false
- Notifications stored indefinitely (no auto-deletion)
- Read status persists
- Users can disable per notification type

---

#### Submodule 1.11: Communications (Admin → Worker)

**Purpose:** Broadcast/targeted messages from admins to workers

**Entities:**
- `communications` - Message records
- `communicationRecipients` - Delivery tracking
- `communicationAttachments` - File attachments

**Features:**
1. Message creation (subject, body HTML, sender)
2. Multiple recipients
3. Delivery tracking (deliveredAt)
4. Read status (isRead, readAt)
5. File attachments (multiple)
6. Source entity linking (polymorphic)
7. Rich text editor (HTML body)
8. Worker inbox view
9. Mark as read
10. Download attachments
11. Search messages
12. Filter by sender/date

**Relationships:**
- Projects → Communications (1:N)
- Workers → Communications (sender, 1:N via senderWorkerId)
- Communications → Recipients (1:N)
- Communications → Attachments (1:N)
- Attachments → Media Files (1:1)

**Use Cases:**
- Schedule published → notify subcontractors
- SWMS approved → notify assigned workers
- Toolbox meeting scheduled → notify attendees
- Project update → broadcast to all workers
- Safety alert → emergency broadcast

**Business Rules:**
- Sender must be worker (admin account)
- Recipients are workers
- Delivery instant (no scheduling)
- Attachments optional
- Body supports HTML formatting
- Messages permanent (no deletion)

---

#### Submodule 1.12: Dashboards

**Purpose:** User-customizable dashboard layouts

**Entities:**
- `dashboards` - Dashboard configs
- `dashboardWidgets` - Widget placements

**Features:**
1. Dashboard creation (name, description, layout)
2. Default dashboard flag
3. Project-specific or global dashboards
4. Widget management (position, type, config)
5. Widget types: inductions, signOns, weather, contacts, qrCode, checklists, actions, swmsReview, stats
6. Grid-based layout (x, y, w, h)
7. Drag-and-drop reordering
8. Widget configuration (data sources, filters)
9. Share dashboard (view-only)
10. Clone dashboard

**Relationships:**
- Users → Dashboards (1:N via userId)
- Projects → Dashboards (1:N, optional)
- Dashboards → Widgets (1:N)

**Widget Types:**
- `inductions` - Pending inductions list
- `signOns` - Today's attendance
- `weather` - Current weather + forecast
- `contacts` - Emergency contacts
- `qrCode` - Project QR code
- `checklists` - Due checklists
- `actions` - My actions
- `swmsReview` - SWMS needing review
- `stats` - Project statistics

**Layout Grid:**
- 12-column grid
- Row height: 60px
- Widget coordinates: (x, y, w, h)
- Drag to reposition
- Resize handles

**Business Rules:**
- One default dashboard per user
- Dashboards can be project-specific or global
- Widget data filtered by user permissions
- Layout persists across sessions

---

#### Submodule 1.13: Insurance

**Purpose:** Insurance policy tracking for orgs, projects, assets

**Entities:**
- `insurancePolicies` - Policy records
- `insuranceTypes` - Org-level insurance type definitions
- `projectInsuranceRequirements` - Project-specific requirements

**Features:**
1. Insurance type creation (name, category, defaultCoverageMinimum, expiryWarningDays)
2. Policy upload (policyNumber, provider, insurer, coverageAmount, startDate, expiryDate)
3. Verification workflow (pending → valid → expiring → expired → archived)
4. Project requirements (minimumCoverage per project)
5. Expiry alerts (configurable warning days)
6. Coverage validation (compare against minimumCoverage)
7. Polymorphic ownership (organisation, company, asset)
8. Document attachment (policy PDF)
9. Search policies
10. Filter by expiry date
11. Compliance dashboard

**Relationships:**
- Orgs → Insurance Policies (1:N via orgId)
- Orgs → Insurance Policies (subcontractor, 1:N via subcontractorOrgId)
- Projects → Insurance Policies (1:N via projectId)
- Assets → Insurance Policies (1:N via assetId)
- Orgs → Insurance Types (1:N)
- Projects → Project Insurance Requirements (1:N)
- Insurance Types → Project Insurance Requirements (N:1)

**Categories:**
- `company` - Subcontractor insurance (public liability, workers comp)
- `organisation` - Org-level insurance
- `asset` - Asset-specific insurance (vehicle, equipment)

**Verification Workflow:**
```
pending (uploaded)
  ↓
valid (verified, within coverage requirements)
  ↓
expiring (< warning days to expiry)
  ↓
expired (past expiry date)
  ↓
archived (renewed or replaced)
```

**Business Rules:**
- Expiry triggers notification (configurable days before)
- Coverage must meet project minimums
- Subcontractor insurance required for site access
- Asset insurance required for high-value equipment
- Auto-expire policies on expiry date

---

#### Submodule 1.14: RFIs (Future)

**Purpose:** Request for Information management

**Note:** Not implemented in current schema, mentioned in future roadmap

**Planned Entities:**
- `rfis` - RFI records
- `rfiResponses` - Response tracking

**Planned Features:**
- Create RFI (subject, description, drawings)
- Assign to org/contact
- Track responses
- Link to drawings
- Status workflow (open → responded → closed)
- Due date management
- Communication thread

---

#### Submodule 1.15: Variations (Future)

**Purpose:** Contract variation management

**Note:** Not implemented in current schema, mentioned in future roadmap

**Planned Entities:**
- `variations` - Variation records
- `variationItems` - Line items

**Planned Features:**
- Create variation (number, description, value)
- Line item breakdown
- Approval workflow
- Cost impact tracking
- Time impact tracking
- Link to diary entries (inclement weather)
- Status workflow (draft → pending → approved → completed)

---

#### Submodule 1.16: Workflows (Agentic v2)

**Purpose:** Multi-step AI workflows for org-level operations

**Entities:**
- `workflows` - Workflow definitions

**Features:**
1. Workflow creation (name, description, steps)
2. System vs custom workflows
3. Step-based execution (heading, prompt)
4. No branching/conditionals in v1
5. Workflow library
6. Clone system workflows to org
7. Edit custom workflows
8. Delete custom workflows

**Relationships:**
- Orgs → Workflows (1:N)

**System Workflows:**
- Project Bootstrap
- Close-Out Package
- Worker Onboarding
- Daily Report Generation
- Safety Audit
- Quality Inspection

(Pre-defined, cannot be edited, cloned to org on first use)

**Custom Workflows:**
- User-created
- Org-specific
- Can be edited/deleted
- Steps array (sequential)

**Step Structure:**
```typescript
{
  heading: string    // Step title
  prompt: string     // AI instruction
}
```

**Business Rules:**
- System workflows immutable
- Custom workflows org-scoped
- No branching/conditionals (linear execution)
- Steps execute in array order
- AI interprets prompts

---

#### Submodule 1.17: AI Execution System

**Purpose:** Track AI-initiated database writes with undo capability

**Entities:**
- `executions` - DB write operations
- `aiRuns` - AI reasoning sessions

**Features:**
1. Execution tracking (scope, title, summary, operations[])
2. Operation recording (kind, operation, targetTable, targetId, before, patch, createdId, deletedId)
3. Undo functionality (reverse operations using 'before' snapshots)
4. Partial execution handling (only undo successful ops)
5. Audit trail (never delete execution records)
6. AI run tracking (kind, status, inputContext, outputSummary, serializedState)
7. Scope categorization
8. Operation history
9. Replay/redo (future)

**Relationships:**
- Projects → Executions (1:N)
- Projects → AI Runs (1:N)
- AI Runs → Executions (conceptual, no FK)

**Operation Types:**
- `create` - Insert record → Undo deletes createdId
- `update` - Patch record → Undo restores 'before' snapshot
- `delete` - Delete record → Undo recreates from 'before'
- `call` - Function call → No undo

**Execution Scopes:**
- `bootstrap` - Project setup
- `onboarding` - Worker onboarding
- `ops_gap` - Fill operational gaps
- `variation` - Contract variations
- `artifact` - Generate artifacts (reports, docs)
- `close_out` - Project closeout
- `other` - Miscellaneous

**Undo Logic:**
```
For each operation in reverse order:
  If operation == 'create':
    Delete record with createdId
  If operation == 'update':
    Restore record from 'before' snapshot
  If operation == 'delete':
    Recreate record from 'before' snapshot
  If operation == 'call':
    Skip (no undo for function calls)
Mark operation as undone
```

**Business Rules:**
- Executions never deleted (audit trail)
- Undo marks operations as undone, doesn't delete
- Partial executions track which ops succeeded
- 'before' snapshot captured before every operation
- Operations atomic per execution

---

#### Submodule 1.18: ChatKit Integration

**Purpose:** Persist ChatKit conversation threads for Chief UI

**Note:** TO BE REMOVED IN REBUILD (migrating to Claude SDK + ShadCN)

**Entities:**
- `chatkitThreads` - Thread metadata
- `chatkitItems` - Messages/widgets

**Current Features:**
1. Thread creation (ownerUserId, threadId, title)
2. Thread status (active, locked, closed)
3. Item persistence (type, sequence, data, widgetKey)
4. Hydration on page load
5. Auto-increment sequence

**Relationships:**
- Users → Threads (1:N)
- Threads → Items (1:N)

**Thread Status:**
- `active` - Accepts new messages
- `locked` - Temporarily locked (AI processing)
- `closed` - Archived/completed (read-only)

**Persistence Flow:**
```
Frontend (ChatKit) → Create thread
  ↓
Persist to Convex (chatkitThreads)
  ↓
Send message → Persist to Convex (chatkitItems)
  ↓
Page load → Hydrate ChatKit from Convex
```

**Migration Note:** This will be replaced with Claude SDK conversation management in rebuild.

---

### 4.2 Module 2: Safety

#### Overview

**Purpose:** WHS compliance, incident management, permits, hazard controls


**CRITICAL: Dual Permit Systems**

Two permit systems currently coexist:
1. Legacy System: permitApplications (7 states: draft → pending → approved → rejected → expired → completed → archived)
2. Modern System: permitInstances (9 states: draft → submitted → approved → active → suspended → closed → expired → rejected → cancelled)

Migration path: New permits use modern system. Legacy permits remain functional.

**Core Entities:** SWMS, Inductions, Incidents, Permits, Hazards, SDS

**Submodules:** 11

---

#### Submodule 2.1: SWMS (Safe Work Method Statements)

**Purpose:** Australian WHS-compliant work method statements with risk assessment

**Entities:**
- `swmsTemplates` - Reusable SWMS templates
- `swmsDocuments` - Project-specific SWMS instances
- `swmsSignatures` - Worker + external signatures
- `swmsAssignments` - Worker assignments + acknowledgments

**Features:**
1. Template management (org + system templates)
2. Document creation (from template or blank, 60+ fields)
3. 12 structured sections (see below)
4. Risk assessment (initial risk, control measures, residual risk)
5. Hierarchy of controls (Elimination, Substitution, Engineering, Administrative, PPE)
6. Approval workflow (draft → pending_review → approved → expired → archived)
7. Version control (revision number)
8. Worker assignment with acknowledgment tracking
9. Signature workflow (internal + external via share code)
10. Share code for public access (QR signing)
11. SDS linking (hazardous materials)
12. Auto-number generation (SWMS-001, SWMS-002...)
13. Clone SWMS
14. Archive SWMS
15. PDF export with signatures:
   - Renders all 12 sections with complete data
   - Includes signature grid (internal + external signatures)
   - Document metadata (number, revision, dates) in header
   - Risk matrix visualization
   - Hierarchy of controls table
   - Downloadable via browser or preview in modal
16. Track assignments (who needs to acknowledge)
17. Dashboard for pending acknowledgments
18. Worker view (assigned SWMS list)
18. Link Safety Data Sheets (SDS) to SWMS (linkedSdsIds array)
19. SDS attached to hazardous materials for compliance audit trail

**Builder Modes:**
1. Simplified Builder (4 steps): Project details, Hazards/controls, PPE, Review
   - Quick SWMS creation
   - Minimal fields
   - Legacy format output
2. Comprehensive Form (12 sections): Full WHS compliance
   - All 12 structured sections
   - Vertical stepper navigation
   - New schema format
   - Save draft at any step
   - Submit for review only when complete

**12 Structured Sections:**

1. **Document Metadata**
   - documentNumber, developedBy, authorisedBy
   - issueDate, reviewDate, revision

2. **Organisation Details**
   - name, ABN, address, phone, email

3. **Project Details**
   - projectName, projectNumber, siteAddress
   - scopeOfWork, startDate, endDate

4. **Principal Contractor**
   - name, contactPerson, phone, email

5. **HRCW Activities** (High Risk Construction Work)
   - Array of activities (excavation, confined space, heights, etc.)

6. **Hazardous Materials**
   - name, SDS available, storage location, controls
   - Array of materials

7. **Plant/Equipment**
   - name, prestart required, logbook required, license required
   - Array of equipment

8. **PPE Requirements**
   - Array of required PPE (hard hat, boots, gloves, etc.)

9. **Risk Matrix**
   - acknowledged boolean (user confirms understanding)

10. **Task Breakdown & Risk Control**
    - tasks array:
      - taskDescription
      - hazards array:
        - hazardDescription
        - initialRisk (likelihood × consequence)
        - controlMeasures array (hierarchy of controls)
        - residualRisk (after controls)

11. **Training & Qualifications**
    - training, inspections, permits, certificates
    - Arrays of requirements

12. **Legislation**
    - acts, standards, codes of practice
    - Arrays of references

13. **Emergency Procedures**
    - emergencyProcedures (text)

**Relationships:**
- Orgs → SWMS Documents (1:N via companyId, subcontractor SWMS)
- Trades → SWMS Documents (1:N via tradeId, trade-specific SWMS)
- Indexes: by_company, by_trade for filtering
- Orgs → SWMS Templates (1:N)
- Projects → SWMS Documents (1:N)
- Templates → Documents (1:N via templateId)
- Documents → Signatures (1:N)
- Documents → Assignments (1:N)
- Documents → SDS Library (N:N via linkedSdsIds)
- Companies → SWMS Documents (1:N)
- Trades → SWMS Documents (1:N)
- Workers → SWMS Signatures (1:N)
- Workers → SWMS Assignments (1:N)

**Risk Matrix:**

| Likelihood × Consequence | Risk Level |
|---------------------------|------------|
| 1-4 | Low |
| 5-9 | Medium |
| 10-14 | High |
| 15-25 | Extreme |

**Status Workflow:**
```
draft → pending_review → approved → expired
                      ↓          ↓
                   rejected  archived
```

**Signature Flow:**

**Internal Worker:**
```
workerId populated
Mobile simulator signature
Signature stored in swmsSignatures
```

**External Worker (via QR/shareCode):**
```
workerId null
externalName + externalCompany required
Public link signature
Anonymous access via shareCode
```

**Assignment Workflow:**
```
Admin assigns SWMS to worker
  ↓
Create swmsAssignment (acknowledgedAt null)
  ↓
Worker signs SWMS
  ↓
Create swmsSignature
  ↓
Update assignment.acknowledgedAt
  ↓
Dashboard shows pending SWMS
  ↓
Sign-on flow blocks until required SWMS acknowledged
```

**Business Rules:**
- Schema supports legacy format (activities array with simple hazards) for backward compatibility
- Two builder interfaces: simplified 4-step wizard and comprehensive 12-section form
- Legacy fields: activities[], ppe[], siteAddress, contactId, subcontractorName, subcontractorAbn, scopeOverview, startDate, endDate, companyId, tradeId
- New documents use 12-section structure; legacy documents remain functional
- swmsNumber is optional at creation (draft state)
- Auto-generated on submission or approval
- Format: SWMS-{projectId}-{sequential}
- Unique per project
- Signature role field captures worker role at time of signing (e.g., "Site Supervisor", "Operator")
- Assignment includes assignedBy, dueDate, notes fields
- SWMS must be approved before assignment
- Workers can't sign-on without acknowledging required SWMS
- Revision number increments on changes
- Share code enables external worker signing
- Risk assessment required (initial → controls → residual)
- Hierarchy of controls enforced (Elimination > Substitution > Engineering > Admin > PPE)
- SDS links create compliance audit trail
- SWMS expires after reviewDate

---

#### Submodule 2.2: Inductions

**Purpose:** Worker safety inductions (company, site, task, plant)

**Entities:**
- `inductionTypes` - Induction templates with content blocks
- `inductionInvites` - Pre-arrival induction invites (share code)
- `inductionCompletions` - Worker completion records
- `plantInductionCompletions` - Simplified plant-specific records

**Features:**
1. Induction template creation (scope: company, site, task, plant)
2. Structured content blocks (info, video, acknowledgement, upload)
3. Version control (version, previousVersionId)
4. Worker assignment
5. Completion workflow (pending → in_progress → awaiting_review → completed → expired)
6. Pre-arrival invites with share codes
7. Review & approval (approve/reject with reason)
8. Signature capture (mediaFile + hash for tamper detection)
9. Audit log (append-only array)
10. Response storage (acknowledgements + upload file IDs)
11. Re-induction triggering (when template changes or expires)
12. Plant induction tracking (assetTypeId, expiresAt, verifiedBy)
13. Required certification prerequisites
14. Off-site completion (via invite link)
15. On-site completion (tablet/kiosk)
16. Worker induction history
17. Dashboard for pending inductions
18. Expiry alerts

**Relationships:**
- Orgs → Induction Types (1:N)
- Projects → Induction Types (1:N, optional)
- Projects → Induction Completions (1:N)
- Workers → Induction Completions (1:N)
- Induction Types → Completions (1:N)
- Induction Types → Certification Types (N:N via requiredCertificationTypeIds, required certs)
- Invites → Completions (1:1 after approval)
- Workers → Plant Induction Completions (1:N)

**Content Block Types:**

1. **info**
   - title: string
   - body: string (HTML)
   - imageUrl: optional string

2. **video**
   - videoUrl: string
   - title: string

3. **acknowledgement**
   - acknowledgementText: string (worker must confirm)

4. **upload**
   - uploadLabel: string
   - uploadRequired: boolean flag

**Completion Workflow:**
```
pending → in_progress → awaiting_review → completed
                                       ↓
                                    expired
```

**Off-Site Induction Flow:**
```
Admin creates inductionInvite (shareCode, status: pending)
  ↓
Worker receives link/QR
  ↓
Opens public page (no auth)
  ↓
Completes induction (responses + signature)
  ↓
Submit (status: awaiting_review)
  ↓
Admin reviews
  ↓
Approve:
  Create inductionCompletion, status: completed
  OR
Return:
  Add returnComment, status: pending (worker re-submits)
```

**On-Site Induction Flow:**
```
Admin creates inductionCompletion directly (status: in_progress)
  ↓
Worker completes on tablet/kiosk
  ↓
Sign signature canvas
  ↓
Status: completed (no review needed)
```

**Version Control Pattern:**
```
Admin edits inductionType content
  ↓
Create NEW inductionType record
  ↓
Set version = old.version + 1
  ↓
Set previousVersionId = old._id
  ↓
Mark old as isActive = false
  ↓
Existing completions remain valid (linked to old version)
  ↓
New invites use new version
  ↓
Optional: Flag old completions for re-induction (requiresReinduction = true)
```

**Signature Verification:**
```
signature: {
  mediaFileId: Id<'mediaFiles'>  // PNG stored
  signedAt: string               // ISO timestamp
  hash: string                   // SHA256(mediaFileId + signedAt)
}
```

**Business Rules:**
- Workers cannot sign-on without completed induction
- Induction expires after validityDays
- Required certs must be valid before completing induction
- Version changes trigger re-induction flag
- Signature hash prevents tampering
- Audit log tracks full lifecycle
- Plant inductions separate from general inductions
- Plant induction by assetTypeId (all excavators) or specific asset

---

#### Submodule 2.3: Incidents & Hazards

**Purpose:** Incident reporting and investigation

**Entities:**
- `incidentReports` - Incident/hazard records
- `incidentTemplates` - Investigation templates
- `incidentTemplateAssignments` - Project-level enablement

- `incidentTemplateAssignments` - Project-level template enablement

Fields:
- incidentTemplateId: Which template
- projectId: Which project
- isDefault: boolean - Auto-select when creating incident
- Pattern mirrors permitTypeAssignments

When creating incident, default template auto-selected if isDefault=true
Template selection updates incidentType field automatically

**Features:**
1. Incident reporting (date, description, severity, type, location)
2. Incident types: injury, nearMiss, hazard, property, environmental
3. Severity levels: near_miss, minor, major, critical
4. Worker involvement tracking
5. Asset involvement tracking
6. Witness information:
   witnesses array structure:
   [
     {
       name: string
       contact: string (phone/email)
     }
   ]

   UI pattern:
   - Add/remove witness rows dynamically
   - Only shown for incidentType='injury'
   - Two-column input (name, contact)
   - Trash icon to remove
7. Photo/document attachments:
   - attachmentIds: array of Id<'mediaFiles'>
   - Upload only accepts image files (image/*)
   - Uses useIncidentAttachmentUpload hook
   - Stores metadata locally (fileName, kind) for display
   - ActionAttachments component handles upload + remove
   - Photos required for property/environmental incidents
8. Investigation workflow (open → under_investigation → closed)
9. Investigator assignment
10. Investigation checklist (via checklistInstances)
11. Corrective actions (via actionItems, sourceType='incident')
12. Injury details (natureOfInjury, bodyLocation, treatmentRequired)
13. Investigation templates (org-level, per incident type)
14. Template-checklist linking:
   - incidentTemplates.checklistTemplateId: Links to checklistTemplate
   - When incident investigation starts, checklist instance created from template
   - investigationChecklistId on incidentReport stores instance
   - Standardized investigation process per incident type
15. Root cause analysis
16. Search incidents
17. Filter by severity/type
18. Incident statistics
19. Template auto-type selection
   - When template selected, incidentType auto-populated from template.incidentType
   - Ensures consistency (injury template → injury type)
   - User can override if needed
20. Reporter auto-selection
   - If reportedBy not provided, auto-select first worker in list
   - Convenience for single-worker projects
   - User can change selection

**Relationships:**
- Projects → Incident Reports (1:N)
- Workers → Incident Reports (1:N via affectedWorkerId, affected worker)
- Workers → Incident Reports (1:N via reportedBy, reporter)
- Workers → Incident Reports (1:N via investigatorId, investigator)
- Assets → Incident Reports (1:N, via assetId)
- Incident Reports → Checklist Instances (1:1 via investigationChecklistId)
- Incident Reports → Action Items (1:N via sourceType='incident')
- Incident Reports → Media Files (N:N via attachmentIds)
- Orgs → Incident Templates (1:N)
- Projects → Incident Template Assignments (1:N)
- Incident Templates → Checklist Templates (N:1)

**Investigation Workflow:**
```
open (initial report)
  ↓
Investigator assigned
  ↓
under_investigation
  ↓
Create checklistInstance (root cause analysis via template)
  ↓
Create actionItems (corrective actions, sourceType='incident')
  ↓
Investigation complete
  ↓
closed
```

**Injury Details:**
- natureOfInjury: string (cut, fracture, burn, etc.)

**Injury Details Structure:**
injuryDetails object (only for incidentType='injury'):
{
  natureOfInjury: string (e.g., "Cut", "Fracture", "Burn")
  bodyLocation: string (e.g., "Left hand", "Right knee")
  treatmentRequired: boolean (checkbox)
}

UI pattern:
- Only displayed when incidentType = 'injury'
- Nested card with accent background
- treatmentRequired shown as checkbox

- bodyLocation: string (hand, leg, head, etc.)
- treatmentRequired: boolean
- treatmentDetails: string

**Business Rules:**

**Form Validation:**
- incidentType: required (one of 5 types)
- date: required (datetime)
- description: required (non-empty string)
- reportedBy: required (workerId)
- Submit disabled until all required fields valid

**Investigation Workflow Detail:**
under_investigation state:
1. investigatorId assigned
2. Create checklistInstance from template.checklistTemplateId
   - Store in investigationChecklistId
   - Checklist contains root cause analysis questions
3. Create actionItems (sourceType='incident', sourceId=incidentId)
   - Multiple actions per incident
   - Each action has assignee, dueDate, priority
4. Investigation complete when:
   - Checklist status = completed
   - All critical actions created
5. Transition to closed

- All incidents require investigation
- Investigator assigned based on severity
- Templates enable standardized investigation
- Corrective actions mandatory for major/critical
- Photos required for property/environmental
- Witnesses contacted during investigation
- Investigation must complete before closing

---

#### Submodule 2.4: Permits (Modern System)

**Purpose:** Permit-to-work with full lifecycle (9 states)

**Entities:**
- `permitTypes` - Org-level permit definitions
- `permitTypeAssignments` - Project-level enablement
- `permitInstances` - Permit lifecycle records

**Features:**
1. Permit type creation (name, description, requiredFields, checklistTemplateId, defaultValidityHours, riskLevel)
2. Project enablement with default approver:
   permitTypeAssignments entity:
   - permitTypeId: Which permit type
   - projectId: Which project
   - defaultApproverId: Id<'workers'> (optional) - Default approver for this permit type on this project
   - When permit created, approverWorkerId = defaultApproverId
3. Permit creation (auto-generated number PTW-XXXX)
4. 9-state lifecycle (draft → submitted → approved → active → suspended → closed → expired → rejected → cancelled)
5. Checklist integration:
   - checklistInstanceId: Links to pre-work safety checklist
   - checklistTemplateId: Template used for checklist
   - Checklist tab in permit detail view
   - Shows checklist status (pending, completed)
   - Link to full checklist instance page
   - Must be completed before permit activation (enforced in workflow)
6. Approval with signature capture:
   - Signature captured via canvas (SignaturePad component)
   - Stored in permitInstance.approvalSignatureData (base64 PNG)
   - Fallback: localStorage[`permitSignature:${instanceId}`] for session persistence
   - Displayed in permit detail view after approval
7. Risk level assessment (low, medium, high)
8. Validity period (validFrom, validTo)
9. Suspension with reason:
   - suspendReason: string (optional, captured via dialog)
   - suspendedAt: timestamp
   - Suspended permits can be resumed (reactivate) to active state
   - Suspension does not affect validity period
   - Used for temporary safety holds
10. Closure with notes:
   - closureNotes: string (optional, completion notes)
   - closedBy: Id<'workers'> (worker who closed permit)
   - closedAt: timestamp
   - Can close from active or suspended state
   - Indicates work completed successfully
11. Form data (dynamic fields based on permitType.requiredFields)
12. Worker assignment (applicant)
13. Approver assignment
14. Search permits
15. Filter by status/risk
16. Auto-expiry on validTo:
   - Expiry check: validTo ?? requestedEndAt < now
   - Applies to states: submitted, approved, active, suspended
   - Sets isExpired flag
   - UI displays "expired" badge overriding status
   - Expired permits cannot be activated or resumed
   - Fallback to requestedEndAt if validTo not set (approved but not activated)
17. Permit dashboard
18. Timeline view showing all lifecycle events:
   - Created (with applicant name)
   - Submitted
   - Approved (with approver name + signature)
   - Rejected (with reason)
   - Activated
   - Suspended (with reason)
   - Expired
   - Closed (with closer name)
   - Cancelled
   - Each event includes timestamp and description

**Relationships:**
- Workers → Permit Instances (applicantWorkerId, 1:N) - Who requested permit
- Workers → Permit Instances (approverWorkerId, 1:N) - Assigned approver (from permitTypeAssignment.defaultApproverId)
- Workers → Permit Instances (approvedByWorkerId, 1:N) - Who actually approved (may differ from assigned)
- Workers → Permit Instances (closedByWorkerId, 1:N) - Who closed permit

**Lifecycle Timestamps (all optional):**
- submittedAt: When submitted for approval
- approvedAt: When approved
- rejectedAt: When rejected
- activatedAt: When work started
- suspendedAt: When temporarily halted
- expiredAt: When validity lapsed
- closedAt: When work completed
- cancelledAt: When application cancelled
- Each state transition records timestamp for audit trail

- Orgs → Permit Types (1:N)
- Projects → Permit Type Assignments (1:N)
- Permit Types → Permit Type Assignments (1:N)
- Projects → Permit Instances (1:N)
- Permit Types → Permit Instances (1:N)
- Workers → Permit Instances (applicantWorkerId, 1:N)
- Workers → Permit Instances (approverWorkerId, 1:N)
- Permit Instances → Checklist Instances (1:1 via checklistInstanceId, pre-work check)

**Lifecycle Flow:**
```
draft (worker drafting)
  ↓ submit
submitted (awaiting approval)
  ↓ approve        ↓ reject
approved      OR  rejected
  ↓ activate
active (work in progress)
  ↓ suspend (if needed)
suspended
  ↓ reactivate
active
  ↓ close
closed (work complete)

Auto-expire if validTo passed: expired
Worker cancels: cancelled
```


**Rejection Path:**
rejected state requires:
- rejectionReason: string (mandatory, captured via dialog)
- rejectedBy: Id<'workers'> (approver who rejected)
- rejectedAt: timestamp

**Cancellation Path:**
cancelled state (alternative path from draft):
- Worker cancels application before submission
- cancelledAt: timestamp
- Terminal state (no further transitions)
- Used when permit no longer needed

**Default Permit Types (6):**

1. **Hot Work**
   - Welding, cutting, grinding
   - Risk: high
   - Checklist: fire extinguisher, fire watch, clear area

2. **Confined Space**
   - Entry into confined spaces
   - Risk: high
   - Checklist: gas testing, ventilation, rescue plan

3. **Excavation**
   - Digging and excavation work
   - Risk: medium
   - Checklist: services located, shoring, access/egress

4. **Working at Heights**
   - Work above 2 meters
   - Risk: high
   - Checklist: fall protection, edge protection, scaffold inspection

5. **Electrical**
   - Live electrical work
   - Risk: high
   - Checklist: isolation, testing, authorized personnel

6. **Isolation**
   - Lock out tag out procedures
   - Risk: high
   - Checklist: isolation points, locks, verification

**Form Data (Dynamic Fields):**
```typescript
formData: {
  [fieldId]: any  // Based on permitType.requiredFields
}

Example for Hot Work:
{
  "location": "Level 2, East Wing",
  "workDescription": "Welding steel beams",
  "fireWatch": "John Smith",
  "fireExtinguisherLocation": "Column A5"
}
```

**Business Rules:**
- Permit must be approved before activation
- Active permits must be on-site
- Checklist must pass before activation
- Auto-suspend if safety issue identified
- Auto-expire after validTo
- Signature required for approval
- Risk level determines approver level

---

#### Submodule 2.5: Permits (Legacy System)

**Purpose:** Simple permit workflow (7 states)

**Entities:**
- `permitApplications` - Legacy permit records

**Note:** Deprecated in favor of permitInstances. Kept for backwards compatibility.

**Features:**
1. Simple 7-state workflow (draft → pending → approved → rejected → expired → completed → archived)
2. Basic form data storage

**Status Flow:**
```
draft → pending → approved → completed
                        ↓         ↓
                   rejected  expired → archived
```

**Migration Note:** Data will be migrated to permitInstances in rebuild.

---

#### Submodule 2.6: Certifications

**Purpose:** Required certifications for workers

**Entities:**
- `certificationTypes` - Org-level cert definitions
- `projectCertificationRequirements` - Project-specific requirements
- `competencyRecords` - Worker certifications (in Worker Management)

**Features:**
1. Certification type creation (code, name, description, category, defaultValidityDays, expiryWarningDays)
2. Org-wide required flag
3. Project-level requirements
4. Categories: license, ticket, training, medical, other
5. Expiry alerts (expiryWarningDays before)
6. Default validity period
7. Certificate upload (front/back photos)
8. Verification workflow
9. Compliance dashboard (who's missing what)
10. Expiry tracking

**Relationships:**
- Orgs → Certification Types (1:N)
- Projects → Project Certification Requirements (1:N)
- Certification Types → Project Certification Requirements (1:N)
- Certification Types → Competency Records (1:N)
- Certification Types → Induction Types (N:N via requiredCertificationTypeIds)

**Compliance Workflow:**
```
Safety manager creates certificationTypes
  ↓
Project manager creates projectCertificationRequirements (isRequired: true)
  ↓
Worker uploads cert → Create competencyRecords (verificationStatus: pending)
  ↓
Safety officer verifies (status: verified)
  ↓
Dashboard monitors:
  - Workers lacking required certs (JOIN workers → competencyRecords → projectCertificationRequirements)
  - Expiring certs (WHERE expiryDate < now + expiryWarningDays)
  ↓
System triggers notifications for expiring certs
  ↓
Induction flow blocks site access if missing required cert
```

**Common Certification Types:**

**Licenses:**
- Construction Induction (White Card)
- Driver's License

**Tickets:**
- Forklift (LF)
- Elevated Work Platform (WP)
- Crane Operator
- Rigging

**Training:**
- First Aid
- Fire Warden
- Asbestos Awareness

**Medical:**
- Pre-employment Medical
- Drug & Alcohol Testing

**Business Rules:**
- Certs expire after defaultValidityDays
- Notifications triggered expiryWarningDays before
- Project requirements override org requirements
- Verification required before site access
- Expired certs block induction completion

---

#### Submodule 2.7: SDS Library (Safety Data Sheets)

**Purpose:** Hazardous material safety data sheet management

**Entities:**
- `sdsLibrary` - SDS records

**Note:** Referenced in schema but detailed structure not fully explored in provided outputs.

**Features:**
1. SDS upload (product name, manufacturer, date)
2. Search by product name
3. Link to SWMS (hazardous materials section)
4. Link to toolbox meetings (hazard discussion)
5. Expiry tracking

**Relationships:**
- SWMS Documents → SDS Library (N:N via linkedSdsIds)
- Toolbox Meetings → SDS Library (N:N via linkedSdsIds)

**Business Rules:**
- SDS required for hazardous materials on site
- SWMS must link to SDS for hazmat work
- Toolbox meetings reference SDS when discussing hazards

---

#### Submodule 2.8: Toolbox Meetings

**Purpose:** Safety meetings (covered in Site Management)

**Cross-reference:** See Site Management → Toolbox Meetings (Submodule 1.5)

---

#### Submodule 2.9: Prestarts (Asset-related)

**Purpose:** Pre-operation equipment checks (covered in Asset Management)

**Cross-reference:** See Asset Management → Prestarts (Submodule 3.4)

---

#### Submodule 2.10: Sign-On & Induction Verification

**Purpose:** Entry control with induction checks (covered in Site Management)

**Cross-reference:** See Site Management → Attendance & Sign-On (Submodule 1.6)

---

#### Submodule 2.11: Competency Records

**Purpose:** Worker certifications (covered in Site Management)

**Cross-reference:** See Site Management → Worker Management (Submodule 1.2)

---

### 4.3 Module 3: Asset

#### Overview

**Purpose:** Equipment, plant, vehicles, tools management with maintenance and booking

**Core Entities:** Assets, Registers, Prestarts, Maintenance, Bookings

**Submodules:** 8

---

#### Submodule 3.1: Asset Registers

**Purpose:** Top-level asset organization (plant, equipment, vehicles, tools)

**Entities:**
- `assetRegisters` - Asset category containers

**Features:**
1. Register creation (name, description, category, isActive)
2. Org-wide or project-specific registers
3. Categories: plant, equipment, vehicle, tool, safety, other
4. Register hierarchy (parent registers)
5. Soft delete (isActive)
1.5. Register category assignment (plant/equipment/vehicle/tool/safety/other)

**Relationships:**
- Orgs → Asset Registers (1:N)
- Projects → Asset Registers (1:N, optional)
- Asset Registers → Assets (1:N)

**Scope Logic:**
- If projectId present → project-specific (visible only to that project)
- If projectId null → org-wide (shared across all projects)

**Categories:**
- `plant` - Heavy machinery (excavators, loaders, etc.)
- `equipment` - Tools and equipment (drills, saws, etc.)
- `vehicle` - Vehicles (trucks, utes, etc.)
- `tool` - Hand tools
- `safety` - Safety equipment (harnesses, helmets, etc.)
- `other` - Miscellaneous

**Business Rules:**
- Register category constrains child assets
- Enables register-level filtering
- Matches asset category enum
- Registers organize assets by category
- One asset belongs to one register
- Registers can be nested (future)

---

#### Submodule 3.2: Assets

**Purpose:** Individual asset records with lifecycle tracking


**Terminology:**
- **Asset** - Generic term for all equipment/tools/vehicles
- **Plant Item** - Heavy machinery/equipment requiring:
  - Plant-specific inductions
  - Enhanced booking workflow
  - Compliance tracking (certifications)
  - Operator qualifications

Plant items are assets with assetType='plant' but receive dedicated UI treatment due to regulatory requirements.

**Cross-Module Asset Picker:**

**Component:** AssetPickerDialog

**Used By:**
- Defect creation (link to asset)
- Incident reporting (asset involvement)
- Action items (asset context)
- Booking requests (asset selection)

**Features:**
- Search/filter assets by type/status
- Multi-select capability
- Project/org scoping

**Entities:**
- `assets` - Asset records

**Features:**
1. Asset CRUD (name, category, identifier, make, model, serialNumber, rego, VIN, year)
2. QR code generation for mobile scanning
3. Status tracking (active, available, assigned, maintenance, inactive, disposed)
4. Odometer tracking (odometerKm for vehicles, odometerHours for plant)
5. Photo attachment (imageId)
6. Follow-up date (next service/inspection)
7. Item ID auto-generation (PLANT-16, VEHICLE-42, TOOL-7)
8. Category: plant, equipment, vehicle, tool, other
9. Asset search
10. Filter by status/category
11. Asset timeline (all history)
12. Asset dashboard
13. QR code printing
14. Column visibility customization (show/hide table columns)
15. Persist column preferences per user session
16. View mode toggle (list/calendar)
17. Calendar visualization of asset assignments
18. CalendarAssignment interface includes projectName enrichment
19. Show/hide archived assets toggle (via Archived stat card)
20. Disposed assets excluded from counts/views by default
21. Dedicated image upload component in asset form
22. Image preview during asset creation/editing
23. Photo scoped to project + org (requires both)
24. Asset detail panel/drawer for quick view
25. Panel accessed from dashboard without full navigation

**Relationships:**
- Orgs → Assets (1:N)
- Projects → Assets (1:N, optional)
- Asset Registers → Assets (1:N)
- Assets → Asset Assignments (1:N, custody)
- Assets → Asset Checklists (1:N, inspection config)
- Assets → Prestart Submissions (1:N)
- Assets → Service Logs (1:N)
- Assets → Activity Logs (1:N, audit)
- Assets → Bookings (1:N)
- Assets → Booking Requests (1:N)
- Assets → Defects (1:N)
- Assets → Insurance Policies (1:N)
- Assets → Incident Reports (1:N)
- Assets → Media Files (1:1 via imageId)

**Status Lifecycle:**
```
active → available → assigned → maintenance → inactive → disposed
```

**QR Code Flow:**
```
Worker scans asset QR
  ↓
App queries assets by qrCode index
  ↓
Displays asset details + actions:
  - View prestart checklists
  - Submit prestart check
  - View maintenance history
  - Request booking
```

**Item ID Generation:**
```
Category prefix + auto-increment:
- PLANT-001, PLANT-002...
- VEHICLE-001, VEHICLE-002...
- TOOL-001, TOOL-002...
```

**Business Rules:**
- QR code unique per asset
- Status transitions tracked in activity logs
- Odometer updates logged
- Follow-up date triggers service reminders
- Photo optional but recommended
- Assets can be project-specific or org-wide

---

#### Submodule 3.3: Asset Assignments

**Purpose:** Track custody (who has the asset)

**Entities:**
- `assetAssignments` - Custody records

**Features:**
1. Assignment creation (assignedToId for worker, assignedToOrgId for org, assignedAt)
2. Return tracking (returnedAt)
3. Notes (assignment reason, condition)
4. Assignment history (audit trail)
5. Current custody report
6. Overdue assignments
7. Bulk assign/return

**Relationships:**
- Assets → Assignments (1:N)
- Workers → Assignments (1:N via assignedToId, optional)
- Orgs → Assignments (1:N via assignedToOrgId, optional)
- Projects → Assignments (1:N via projectId, optional)
- Booking Requests → Assignments (1:1 via assignmentId)

**Lifecycle:**
```
Create assignment (assignedAt, returnedAt null)
  ↓
Active assignment (returnedAt null)
  ↓
Return asset (set returnedAt)
  ↓
Query active: WHERE returnedAt == null
```

**Business Rules:**
- Max 1 active assignment per asset (returnedAt null)
- Assignment to worker OR org (not both)
- Return required before new assignment
- Assignment history preserved

---

#### Submodule 3.4: Asset Checklists & Prestarts

**Purpose:** Configure recurring inspections per asset

**Entities:**
- `assetChecklists` - Recurring checklist config
- `prestartTemplates` - Prestart check requirements
- `prestartSubmissions` - Completed prestart records

**Features:**
1. Checklist configuration (assetId, checklistTemplateId, frequency, lastCompletedAt, isEnabledForQr)
2. Frequency types: daily, weekly, monthly, on_use
3. QR-enabled checklists (mobile access)
4. Prestart template creation (assetTypeId or assetId, checklistTemplateId, frequency, requiresPhoto, publicAccess)
5. Prestart submission (submittedBy or submitterName/Email for public, passed, issues[], odometerKm/Hours, photoIds)
6. Pass/fail logic
7. Issue tracking (array of issues found)
8. Photo evidence required
9. Odometer reading capture
10. Public access (no auth required)
11. Scheduled reminders
12. Overdue checklists

**Issues Array Structure:**
{
  itemId: string,        // Checklist field ID that failed
  description: string    // Issue description/notes
}

**Usage:**
- Links issues to specific checklist fields
- Enables targeted follow-up
- Supports defect auto-creation from failed items

**Public Access Flow:**
Worker scans QR (no login)
  ↓
If publicAccess == true:
  - Collect submitterName (required)
  - Collect submitterEmail (optional)
  - submittedBy = null
  ↓
If publicAccess == false:
  - Require authentication
  - submittedBy = workerId
  - submitterName/Email = null

**Use Case:** External contractors/delivery drivers who don't have platform accounts

13. Dashboard for due checklists
9.5. Dual odometer tracking (km for vehicles, hours for plant)
9.6. Odometer captured at prestart submission time
9.7. Historical odometer readings preserved in submissions

**Relationships:**
- Assets → Asset Checklists (1:N)
- Asset Checklists → Checklist Templates (N:1)
- Orgs → Prestart Templates (1:N)
- Assets → Prestart Templates (1:N, optional)
- Assets → Prestart Submissions (1:N)
- Prestart Templates → Prestart Submissions (1:N)
- Workers → Prestart Submissions (1:N via submittedBy)
- Prestart Submissions → Checklist Instances (1:1 via checklistInstanceId, optional)
- Prestart Submissions → Media Files (N:N via photoIds)

**Prestart Flow:**
```
Worker arrives, scans asset QR
  ↓
Query prestartTemplates (by assetId or assetTypeId)
  ↓
If publicAccess true → allow submission without login
  ↓
Display checklist (from checklistTemplates)
  ↓
Worker completes
  ↓
Create prestartSubmissions (passed, issues[], odometerKm/Hours)
  ↓
Update assets.lastPrestartAt
  ↓
Update assets.odometerKm or odometerHours
  ↓
If passed == false:
  - Update assets.status = 'maintenance'
  - Optionally create defect
  - Block asset usage
  ↓
Create assetActivityLogs: 'prestart'
```

**QR Code Flow (QR-Enabled Checklists):**
```
Scan asset QR → Show checklist in mobile app
  ↓
Worker completes checklist on-site
  ↓
Creates checklistInstance record
  ↓
Links to asset via assetId
```

**Scheduling Logic:**
```
Compare current date with lastCompletedAt + frequency
  ↓
If overdue → flag asset as requiring inspection
  ↓
Block usage until checklist completed (policy-dependent)
```

**Business Rules:**
- Prestart required before asset use
- Failed prestart blocks asset
- Odometer required for vehicles/plant
- Photos required if configured
- Public access enables no-auth submission
- Templates apply to assetType (all excavators) or specific asset

---

#### Submodule 3.5: Asset Maintenance

**Purpose:** Service, repair, inspection, certification tracking

**Entities:**
- `assetServiceLogs` - Maintenance records

**Features:**
1. Service logging (serviceType, description, performedBy, performedAt, nextServiceDue, cost, documentId)
2. Service types: maintenance, repair, inspection, certification
3. Next service due tracking (auto-updates assets.followUpDate)
4. Cost tracking (total lifetime cost)
5. Document attachment (invoices, certificates, inspection reports)
6. Service history timeline
7. Scheduled service dashboard
8. Overdue service alerts
9. Cost analysis
10. Search by service type
1.5. Service performed by (free text or worker reference)
8.5. Visual service alerts (overdue in red, upcoming in blue)
8.6. Alert prominence (top of compliance view)
8.7. Multiple overdue services listed in alert

**Relationships:**
- Assets → Service Logs (1:N)
- Workers → Service Logs (createdBy, 1:N)
- Source Documents → Service Logs (1:N via documentId)
- Service Logs → Activity Logs (auto-creates activity log entry)

**Service Types:**
- `maintenance` - Scheduled maintenance (oil change, filter replacement)
- `repair` - Unscheduled repair (breakdown fix)
- `inspection` - Compliance inspection (annual checks, safety audits)
- `certification` - Certification renewal (pressure vessel, lifting gear)

**Next Service Due Logic:**
```
Admin logs service → Sets nextServiceDue
  ↓
Index by_nextDue enables queries: "assets needing service in next 30 days"
  ↓
Updates assets.followUpDate
  ↓
Background job checks nextServiceDue → Triggers notifications
```

**Business Rules:**
- performedBy: external service provider name (string)
- createdBy: worker who logged the service
- Allows tracking outsourced maintenance
- Service logs never deleted (audit trail)
- Cost accumulates for lifetime cost
- Next service due required for scheduled maintenance
- Document attachment for certifications (compliance)
- Activity log auto-created

---

#### Submodule 3.6: Asset Activity Logs

**Purpose:** Comprehensive audit trail for asset lifecycle

**Entities:**
- `assetActivityLogs` - Activity records

**Features:**
1. Activity logging (activityType, description, metadata, createdBy, createdAt)
2. Activity types (see below)
3. Metadata storage (flexible JSON)
4. Timeline view (chronological)
5. Filter by activity type
6. Search by date range
7. Export history

**Activity Types:**

**Lifecycle:**
- `created` - Asset created
- `updated` - Asset details changed
- `disposed` - Asset disposed

**Assignment:**
- `assigned` - Asset assigned to worker/org
- `returned` - Asset returned

**Inspection:**
- `prestart` - Prestart check performed
- `inspection` - Inspection completed
- `inspection_scheduled` - Inspection scheduled
- `service` - Service performed

**Booking:**
- `booking_created` - Booking created
- `booking_updated` - Booking changed
- `booking_cancelled` - Booking cancelled

**Requests:**
- `booking_request_created` - Request submitted
- `booking_request_approved` - Request approved
- `booking_request_rejected` - Request rejected

**Plant Inductions:**
- `induction_started` - Plant induction begun
- `induction_completed` - Plant induction finished

**Relationships:**
- Assets → Activity Logs (1:N)
- Workers → Activity Logs (1:N via createdBy)

**Metadata Example:**
```json
{
  "bookingId": "xyz",
  "startAt": "2026-01-22",
  "endAt": "2026-01-25",
  "assignedTo": "John Smith"
}
```

**Use Cases:**
- Full asset history timeline in UI
- Compliance audit trail
- Usage pattern analysis
- Issue investigation
- Lifecycle reporting

**Business Rules:**
- Activity logs never deleted
- Auto-created for most asset events
- Metadata stores event-specific data
- Timeline chronological (sort by createdAt)

---

#### Submodule 3.7: Asset Bookings

**Purpose:** Schedule future asset reservations

**Entities:**
- `assetBookings` - Confirmed bookings
- `assetBookingRequests` - Worker requests (pending approval)

**Features:**
1. Direct booking (admin creates directly)
2. Request-based booking (worker requests → admin approves)
3. Calendar view (schedule conflicts)
4. Assignment label (free text: "John Smith", "Excavation Crew")
5. Status: active, cancelled
6. Request approval workflow (pending → approved → rejected)
7. Signature requirement on requests
8. Review notes (admin feedback)
9. Conflict detection
10. Booking history
11. Search by date range
12. Export bookings
6.5. Signature REQUIRED on all booking requests (mandatory field)

**Relationships:**
- Orgs → Asset Bookings (1:N)
- Asset Registers → Asset Bookings (1:N)
- Assets → Asset Bookings (1:N)
- Projects → Asset Bookings (1:N, optional)
- Workers → Asset Bookings (createdBy, 1:N)
- Orgs → Asset Booking Requests (1:N)
- Projects → Asset Booking Requests (1:N)
- Asset Registers → Asset Booking Requests (1:N)
- Assets → Asset Booking Requests (1:N)
- Workers → Asset Booking Requests (requestedBy, 1:N)
- Workers → Asset Booking Requests (reviewedBy, 1:N)
- Asset Booking Requests → Asset Bookings (1:1 via bookingId)
- Asset Booking Requests → Asset Assignments (1:1 via assignmentId)

**Direct Booking Workflow:**
```
Admin creates booking
  ↓
assetBookings record created
  ↓
assetActivityLogs: booking_created
```

**Request-Based Booking Workflow:**
```
Worker requests via mobile (with signature)
  ↓
assetBookingRequests record (status: pending)
  ↓
assetActivityLogs: booking_request_created
  ↓
Admin reviews in dashboard
  ↓
[Approve path]
  ↓
assetBookings record created
  ↓
assetBookingRequests.bookingId linked
  ↓
assetBookingRequests.status = approved
  ↓
assetActivityLogs: booking_request_approved
  ↓
Optional: assetAssignments record created
  ↓
assetActivityLogs: assigned

[Reject path]
  ↓
assetBookingRequests.status = rejected
  ↓
assetBookingRequests.reviewNotes = reason
  ↓
assetActivityLogs: booking_request_rejected
```

**Conflict Detection:**
```
Query assetBookings by assetId
  ↓
Filter status == 'active'
  ↓
Check for overlapping startAt/endAt ranges
  ↓
Block/warn if conflict found
```

**Business Rules:**
- Cannot submit request without signature
- Stored as base64 string
- Signature binds worker to booking terms
- No double-booking (conflict detection)
- Worker requests require signature
- Admin approval required for requests
- Bookings create optional assignments
- Cancelled bookings preserve history

---

#### Submodule 3.8: Plant Inductions

**Purpose:** Equipment-specific worker qualifications

**Entities:**
- `plantInductionCompletions` - Plant qualification records

**Features:**
1. Plant qualification tracking (workerId, assetTypeId, completedAt, expiresAt, verifiedBy)
2. Asset type-based (e.g., "excavator", "forklift")
3. Optional link to inductionType
4. Expiry tracking
5. Register-level induction (all assets in register)
6. Asset-specific induction (specific assets)
7. Verification workflow
8. Dashboard for plant qualifications
9. Expiry alerts

**Relationships:**
- Workers → Plant Induction Completions (1:N)
- Induction Types → Plant Induction Completions (1:N via inductionTypeId, optional)
- Workers → Plant Induction Completions (verifiedBy, 1:N)
- Asset Registers → Plant Induction Completions (via assetTypeId reference)

**Plant Induction Flow:**
```
Worker assigned to use plant equipment
  ↓
Check plantInductionCompletions (worker + assetTypeId)
  ↓
If missing or expired → require induction
  ↓
Display induction checklist (from checklistTemplates with isPlantInduction == true)
  ↓
Worker completes checklist
  ↓
Create plantInductionCompletions record
  ↓
Create checklistInstances with plantAssetId link
  ↓
Create assetActivityLogs: 'induction_completed'
```

**Register-Level Induction:**
```
If plantAllItemsInRegister == true:
  → Induction applies to all assets in register
  → Worker inducted once, can use any asset in category
```

**Asset-Specific Induction:**
```
If plantAssetIds populated:
  → Induction only for those specific assets
  → Worker must complete induction per asset
```

**Business Rules:**
- Plant induction required before equipment use
- Induction by asset type (category) or specific asset
- Expiry tracked (expiresAt)
- Verification required (verifiedBy)
- Links to checklist template for content

---

### 4.4 Module 4: Quality

#### Overview

**Purpose:** Defect tracking, inspections, actions, compliance

**Core Entities:** Defects, Checklists, Actions, NCRs, ITPs

**Submodules:** 4

---

#### Submodule 4.1: Checklists

**Purpose:** Flexible form-based data collection (safety, quality, asset, site)

**Entities:**
- `checklistTemplates` - Template definitions
- `checklistInstances` - Execution records

**Features:**
1. Template creation (name, description, scope, sections[], isActive)
2. Scopes: site, plant, task, quality, other
3. 15 field types (see below)
4. Section structure with fields
5. Conditional logic (show/hide based on other fields)
6. Signature configuration (label, role, required)
7. Response storage (flexible JSON: value, notes, attachments, signatures)
8. Plant induction integration (isPlantInduction, plantRegisterId, plantAllItemsInRegister, plantAssetIds)
9. Instance creation (assignedTo, dueDate, sourceType/sourceId)
10. Generic source linking (polymorphic: asset, itp, incident, defect)
11. Plant context (plantRegisterId, plantAssetId, plantBookingId)
12. Status workflow (in_progress → completed → cancelled)
13. Linked item tracking (linkedDefectIds, linkedActionIds)
14. Action trigger fields (auto-create action items)
15. Template cloning
16. Template versioning (future)
17. Mobile-optimized forms
18. Offline support (future)

**15 Field Types:**

1. **text** - Single-line input
2. **textarea** - Multi-line input
3. **number** - Numeric input
4. **date** - Date picker
5. **yesno** - Yes/No toggle
6. **checkbox** - Single checkbox
7. **select** - Dropdown (single choice)
8. **multiselect** - Multiple choice
9. **photo** - Photo upload (stores mediaFileId)
10. **signature** - Signature canvas (label, role, required config)
11. **instruction** - Display-only info block
12. **notes** - Additional notes field
13. **action_trigger** - Creates action item when triggered
14. **attachment** - File upload
15. **rating** - Star rating (future)

**Relationships:**
- Orgs → Checklist Templates (1:N)
- Projects → Checklist Templates (1:N, optional)
- Asset Registers → Checklist Templates (1:N via plantRegisterId)
- Assets → Checklist Templates (N:N via plantAssetIds)
- Projects → Checklist Instances (1:N)
- Checklist Templates → Checklist Instances (1:N)
- Workers → Checklist Instances (assignedTo, 1:N)
- Workers → Checklist Instances (performedBy, 1:N)
- Asset Registers → Checklist Instances (1:N, plant context)
- Assets → Checklist Instances (1:N, plant context)
- Asset Bookings → Checklist Instances (1:N via plantBookingId)
- Checklist Instances → Defects (1:N via linkedDefectIds)
- Checklist Instances → Action Items (1:N via linkedActionIds)
- Checklist Instances ↔ Any Entity (polymorphic via sourceType/sourceId)

**Response Storage Format:**
```typescript
{
  [fieldId]: {
    value: any,
    notes?: string,
    attachmentIds?: string[], // mediaFile IDs
    signature?: {
      mediaFileId: string,
      signedAt: string,
      hash: string
    }
  }
}
```

**Conditional Logic Example:**
```typescript
{
  triggerFieldId: "field_safety_concern",
  operator: "equals",
  value: "yes",
  action: "show" // Show this field when safety_concern = yes
}
```

**Plant Induction Integration:**
```
Template Setup:
  isPlantInduction: true
  plantRegisterId: Id (or)
  plantAssetIds: [assetId1, assetId2]

Instance Creation:
  plantRegisterId, plantAssetId, plantBookingId
  Auto-creates plantInductionCompletions on complete
```

**Action Trigger Field:**
```typescript
{
  type: "action_trigger",
  label: "Create corrective action?",
  triggerWhen: "yes", // When user selects yes
  actionTitle: "Follow up on {{field_issue_description}}",
  actionPriority: "high"
}
```

**Business Rules:**
- Templates are org or project scoped
- Instances always project-scoped
- Conditional logic evaluated client-side
- Action triggers fire on instance completion
- Plant inductions auto-create completion records
- Polymorphic source enables flexible linking
- Responses stored as flexible JSON

---

#### Submodule 4.2: Defects

**Purpose:** Defect tracking with categorization and lifecycle

**Entities:**
- `defects` - Defect records
- `defectPhotos` - Photo attachments with markup
- `defectComments` - Comment thread + status change audit

**Features:**
1. Defect creation (title, description, category, location, level, area, priority, status)
2. Auto-increment defect number per project (#1, #2, #3...)
3. Categories: builder, client, safety, other
4. Priority levels: low, medium, high, critical
5. Status workflow (open → in_progress → resolved → closed)
6. Location hierarchy (location → level → area)
7. Org assignment (assignedTo)
8. Worker assignment (assignedWorkerId)
9. Due date tracking
10. Photo attachments with markup support (drawing/annotation overlays)
11. Primary photo designation
12. Comment thread (type: comment, status_change)
13. Polymorphic source linking (asset, checklist, incident, itp, manual)
14. Drawing linking (drawingId)
15. Search defects
16. Filter by status/category/priority
17. Defect statistics
18. Export to PDF/CSV

**Relationships:**
- Projects → Defects (1:N)
- Orgs → Defects (assignedTo, 1:N)
- Workers → Defects (createdBy, 1:N)
- Workers → Defects (assignedWorkerId, 1:N)
- Assets → Defects (1:N via assetId, optional)
- Source Documents → Defects (1:N via drawingId)
- Defects → Defect Photos (1:N)
- Defects → Defect Comments (1:N)
- Defects → Action Items (1:N via sourceType='defect')
- Defects ↔ Any Entity (polymorphic via sourceType/sourceId)
- Defect Photos → Media Files (1:1)

**Status Lifecycle:**
```
open → in_progress (assigned, work begins)
  ↓
resolved (resolvedAt timestamp)
  ↓
closed (closedAt timestamp, final)
```

**Location Hierarchy:**
- **location:** General location (e.g., "Building A")
- **level:** Building level (e.g., "Level 1", "Ground Floor")
- **area:** Specific area (e.g., "Kitchen", "Bathroom")

**Defect Photo Markup:**
```typescript
{
  defectId,
  mediaFileId,
  markupData: any, // Canvas JSON (annotations, arrows, circles, text)
  caption: string,
  isPrimary: boolean
}
```

**Comment Types:**
- `comment` - User comment
- `status_change` - Lifecycle event (auto-logged)

**Polymorphic Source:**
```typescript
// Defect from checklist
{ sourceType: 'checklist', sourceId: checklistInstanceId }

// Defect from incident
{ sourceType: 'incident', sourceId: incidentReportId }

// Defect from ITP
{ sourceType: 'itp', sourceId: itpStageId }

// Defect from asset
{ sourceType: 'asset', sourceId: assetId }

// Defect created manually
{ sourceType: 'manual', sourceId: null }
```

**Business Rules:**
- Defect number auto-increments per project
- Location hierarchy enables spatial filtering
- Primary photo displayed in cards/lists
- Markup data supports drawing tools
- Status changes auto-log to comments
- Source linking creates audit trail
- Assignment to org or worker (dual pattern)

---

#### Submodule 4.3: Action Items

**Purpose:** Tasks/actions triggered from multiple sources

**Entities:**
- `actionItems` - Action records
- `actionComments` - Comment thread (supports anonymous)

**Features:**
1. Action creation (title, description, priority, status, dueDate, assignedTo, assignedToOrgId)
2. Polymorphic source linking (checklist, inspection, incident, defect, itp, manual)
3. Priority levels: low, medium, high, urgent
4. Status workflow (open → in_progress → completed → cancelled)
5. Dual assignment (worker or org)
6. Attachment support (attachmentIds array)
7. Share code for public/external access
8. Comment thread (authenticated workerId OR anonymous authorName)
9. Completion tracking (completedAt, completedBy)
10. Overdue detection
11. Reminder notifications
12. Search actions
13. Filter by status/priority/assignee
14. Action dashboard
15. Export to PDF/CSV

**Relationships:**
- Projects → Action Items (1:N)
- Workers → Action Items (assignedTo, 1:N)
- Orgs → Action Items (assignedToOrgId, 1:N)
- Workers → Action Items (createdBy, 1:N)
- Workers → Action Items (completedBy, 1:N)
- Action Items → Media Files (N:N via attachmentIds)
- Action Items → Action Comments (1:N)
- Action Items ↔ Any Entity (polymorphic via sourceType/sourceId)

**Status Workflow:**
```
open → in_progress → completed
                   ↘ cancelled
```

**Priority Levels:**
- `low` - Non-urgent, can wait
- `medium` - Standard priority
- `high` - Important, needs attention
- `urgent` - Critical, immediate action

**Source Types:**
- `checklist` - Triggered from checklist instance
- `inspection` - Triggered from inspection
- `incident` - Triggered from incident report
- `defect` - Triggered from defect
- `itp` - Triggered from ITP stage
- `manual` - Manually created

**Share Code Pattern:**
```
Action has shareCode
  ↓
Public URL: /action/share/{shareCode}
  ↓
Worker/subcontractor views/updates without auth
  ↓
Comments support anonymous (authorName instead of workerId)
```

**Comment Dual Identity:**
```typescript
// Authenticated comment
{ workerId: Id, content: string }

// Anonymous comment (via shareCode)
{ authorName: string, content: string }
```

**Business Rules:**
- Actions can be assigned to org or worker
- Share code enables external collaboration
- Overdue actions trigger notifications
- Completion requires completedBy
- Source linking creates traceability

---

#### Submodule 4.4: ITPs (Inspection & Test Plans)

**Purpose:** Quality hold points and inspections

**Note:** Referenced in schema (sourceType='itp') but detailed structure not explored in provided outputs.

**Relationships:**
- Defects ↔ ITPs (via sourceType='itp', sourceId)
- Action Items ↔ ITPs (via sourceType='itp', sourceId)
- Checklist Instances ↔ ITPs (via sourceType='itp', sourceId)

**Planned Features:**
- ITP stage creation
- Hold point management
- Inspection sign-off
- Progress tracking
- Witness requirements
- Quality checks

---

### 4.5 Module 5: Communication (Cross-Cutting)

#### Overview

**Purpose:** System-wide communication, file management, AI integration

**Core Entities:** Media, Documents, Notifications, AI, Chief

**Submodules:** 8

---

#### Submodule 5.1: Media Files

**Purpose:** Unified file storage (covered in Site Management)

**Cross-reference:** See Site Management → Media Files (Submodule 1.9)

---

#### Submodule 5.2: Documents & Chunking

**Purpose:** Document management with AI (covered in Site Management)

**Cross-reference:** See Site Management → Documents & Drawings (Submodule 1.8)

---

#### Submodule 5.3: Notifications

**Purpose:** In-app notification feed (covered in Site Management)

**Cross-reference:** See Site Management → Notifications (Submodule 1.10)

---

#### Submodule 5.4: Communications

**Purpose:** Admin → worker messaging (covered in Site Management)

**Cross-reference:** See Site Management → Communications (Submodule 1.11)

---

#### Submodule 5.5: AI File Intakes

**Purpose:** File upload + AI classification + linking

**Entities:**
- `aiFileIntakes` - File intake records

**Features:**
1. File upload tracking (uploadToken, fileName, mimeType, sizeBytes, kind)
2. Status workflow (uploading → uploaded → analyzing → classified → proposed → linked → failed → expired → deleted)
3. AI classification (analysisSummary, analysisData, candidateTargets)
4. Entity linking proposals (entityType, confidence, suggestedEntityId, reasoning)
5. Media file creation (mediaFileId)
6. Final document linking (linkedDocumentId)
7. TTL expiry (default 24h)
8. Provider tracing (AI provider metadata)

**Relationships:**
- Projects → AI File Intakes (1:N)
- Orgs → AI File Intakes (1:N, optional)
- AI File Intakes → Media Files (1:1 via mediaFileId)
- AI File Intakes → Source Documents (1:1 via linkedDocumentId)

**Status Lifecycle:**
```
uploading (upload in progress)
  ↓
uploaded (file received, awaiting AI)
  ↓
analyzing (AI analyzing content)
  ↓
classified (AI classified, awaiting user action)
  ↓
proposed (AI proposed linking targets)
  ↓
linked (user accepted, linked to entity) OR deleted (user rejected)
  ↓
expired (TTL expired, default 24h) OR failed (upload/analysis failed)
```

**AI Classification Output:**
```typescript
{
  entityType: 'defect' | 'swms' | 'drawing' | 'sds' | 'induction' | 'other',
  confidence: number,
  suggestedEntityId?: string,
  reasoning: string
}
```

**Upload → Classification → Linking Flow:**
```
Initiate upload → Create aiFileIntakes (status: uploading)
  ↓
File received → Update status: uploaded, create mediaFileId
  ↓
AI analysis (automatic) → Extract text/metadata
  ↓
Classification complete → status: classified, populate analysisSummary + candidateTargets
  ↓
User action:
  Accept → status: linked, create linkedDocumentId
  Reject → status: deleted
  ↓
Expiry: Cron job marks 'expired' after 24h
```

**Business Rules:**
- AI classification automatic on upload
- User approval required for linking
- Expiry after 24h (configurable)
- Failed uploads retained for debugging
- Provider metadata tracks AI service used

---

#### Submodule 5.6: AI Execution + Undo

**Purpose:** Track AI database writes with undo (covered in Site Management)

**Cross-reference:** See Site Management → AI Execution System (Submodule 1.17)

---

#### Submodule 5.7: ChatKit Integration

**Purpose:** Persist Chief conversations (covered in Site Management)

**Cross-reference:** See Site Management → ChatKit Integration (Submodule 1.18)

**Migration Note:** TO BE REMOVED in rebuild (Claude SDK + ShadCN)

---

#### Submodule 5.8: Workflows

**Purpose:** Multi-step AI workflows (covered in Site Management)

**Cross-reference:** See Site Management → Workflows (Submodule 1.16)

---

### 4.6 Cross-Cutting Concerns

#### 4.6.1 Attachments

**Pattern:** How files attach to entities

**Used By:** defects, incidents, swms, communications, diaries, actions, toolbox, prestarts, checklists

**4 Implementation Strategies:**

1. **Array of IDs (Simple)**
   - Pattern: `attachmentIds: Id<'mediaFiles'>[]`
   - Used by: incidents, diaries, actions
   - Query: Batch get by IDs
   - Pros: Simple, flexible
   - Cons: No per-attachment metadata

2. **Bridge Tables (Rich)**
   - Pattern: Dedicated join table with extra fields
   - Example: `defectPhotos` (defectId, mediaFileId, markupData, caption, isPrimary)
   - Used by: defects
   - Pros: Rich metadata, queryable
   - Cons: Extra table

3. **linkedEntityType Pattern (Generic)**
   - Pattern: mediaFiles has linkedEntityType + linkedEntityId
   - Query: Index `by_linked: [linkedEntityType, linkedEntityId]`
   - Used by: standalone photos/files
   - Pros: Generic, no extra tables
   - Cons: String typing, no per-link metadata

4. **Embedded Base64 (Legacy)**
   - Pattern: Store base64 data URLs directly in document
   - Used by: checklistInstances.responses
   - Size: ~5-20KB per photo
   - Pros: No joins, atomic
   - Cons: Document bloat, no reuse

**Recommendation for Rebuild:** Consolidate to 2 patterns (Array + Bridge)

---

#### 4.6.2 Comments

**Pattern:** Threaded discussion on entities

**Used By:** defects, actions

**Implementation:** Dedicated comment tables per entity

**Schema Pattern:**
```typescript
{
  [entity]Id: Id<'[entities]'>
  workerId?: Id<'workers'>       // Optional for public
  authorName?: string            // For external comments
  content: string
  type?: 'comment' | 'status_change'  // Optional dual purpose
  createdAt: string
}
```

**Why Dedicated Tables:**
- Type safety (referential integrity)
- Simple queries (indexed by parent ID)
- No string-based entity typing
- Entity-specific fields (like type in defectComments)

---

#### 4.6.3 Signatures

**Pattern:** Digital signature capture and storage

**Used By:** swms, inductions, checklists, permits, toolbox

**3 Storage Approaches:**

1. **Embedded Object**
   - Pattern: Signature object in entity
   ```typescript
   signature: {
     mediaFileId: Id<'mediaFiles'>
     signedAt: string
     hash: string  // Verification
   }
   ```
   - Used by: inductionCompletions
   - Use when: Single signature, compliance critical

2. **Dedicated Tables**
   - Pattern: Separate signature table
   ```typescript
   {
     [entity]Id: Id
     workerId?: Id<'workers'>
     externalName?: string
     signatureData: string  // Base64 PNG
     signedAt: string
     role?: string
   }
   ```
   - Used by: swmsSignatures
   - Use when: Multiple signatures per entity

3. **Response Field**
   - Pattern: Signature in checklist responses
   ```typescript
   responses: {
     [fieldId]: {
       signature?: string  // Base64 PNG
     }
   }
   ```
   - Used by: checklistInstances
   - Use when: Dynamic form fields

**Recommendation for Rebuild:** Standardize to mediaFiles reference (no base64)

---

#### 4.6.4 Audit Logs

**Pattern:** Change tracking

**Implementation:** Embedded arrays in entities

**Schema:**
```typescript
auditLog: v.array(v.object({
  actorId: v.optional(v.id('workers'))
  actorType: v.optional(v.union(
    v.literal('admin'),
    v.literal('worker'),
    v.literal('system')
  ))
  action: string
  timestamp: string
  comment: v.optional(v.string())
}))
```

**Used By:** inductionCompletions, permitInstances, swmsDocuments

**Helper:**
```typescript
appendAuditLog(existing, entry): AuditEntry[]
```

**Why Embedded:**
- Atomic with parent update
- No joins needed
- Simple chronological array

---

#### 4.6.5 Share Codes

**Pattern:** Public access via unique codes

**Used By:** 8+ entities for QR flows

**Schema:**
```typescript
shareCode: v.string()
.index('by_shareCode', ['shareCode'])
isActive: v.boolean()
expiresAt: v.optional(v.string())
```

**Public Routes:**
- `/induct/invite/{shareCode}` - Inductions
- `/swms/view/{code}` - SWMS signing
- `/toolbox/attend/{qrCode}` - Meeting attendance
- `/schedule/confirm/{shareCode}` - Task confirmation
- `/action/{shareCode}` - Action updates
- `/upload/{shareCode}` - Document upload
- `/assets/scan?qr={qrCode}` - Asset prestart

**Generation:**
```typescript
generateShareCode(): string
// Format: base36 timestamp + random suffix
```

**Security:**
- Unguessable codes (time + random)
- isActive flag (revocable)
- Optional expiry
- Limited actions (usually read + submit)

---

#### 4.6.6 Status Management

**Pattern:** Consistent status enums and transitions

**CSS Variables:** `status-{status}-bg`, `status-{status}-text`

**Common Workflows:**
```
# 3-State (Simple)
pending → in_progress → completed

# 4-State (With Review)
draft → pending_review → approved → expired

# 5-State (Complex)
open → in_progress → resolved → closed
                           ↓
                       archived
```

**Constants:**
```typescript
export const STATUSES = {
  open: { label: 'Open', cssVar: 'status-open' },
  // ...
} as const;
```

**Badge Component:**
```typescript
<span style={{
  backgroundColor: `var(--status-${status}-bg)`,
  color: `var(--status-${status}-text)`,
}} className="rounded-full px-2.5 py-0.5 text-xs font-medium">
  {STATUSES[status].label}
</span>
```

---

#### 4.6.7 Assignment

**Pattern:** Linking entities to workers/trades

**Levels:** Organization + Worker

**Schema:**
```typescript
assignedTo?: Id<'orgs'>          // Organization assignment
assignedWorkerId?: Id<'workers'>  // Individual assignment
```

**Used By:** defects, actionItems, checklistInstances

**Flow:**
```
Create entity → assigned to org (e.g., "Electrical" trade)
  ↓
Org supervisor → assigns to specific worker
  ↓
Worker sees in their task list
  ↓
Worker completes → status changes
```

---

#### 4.6.8 PDF Generation

**Pattern:** Document export

**Used By:** SWMS, checklists, reports, certificates

**Requirements:**
- Entity data
- Signatures
- Photos/attachments
- Audit trail
- Branding (org logo)
- QR code for verification

**Current:** Limited implementation

**Planned:** Unified PDF service with templates

---

### 4.7 Workflows

#### Workflow 1: SWMS Lifecycle
```
Template Created
  ↓
SWMS Drafted (from template or scratch)
  ↓
Review & Approval (pending_review)
  ↓
Published (approved, active)
  ↓
Workers Assigned (swmsAssignments created)
  ↓
Workers Sign (swmsSignatures created)
  ↓
Acknowledgment Tracked (assignment.acknowledgedAt)
  ↓
[Revision needed?]
  ↓
Superseded by new version (revision++)
```

#### Workflow 2: Incident Management
```
Incident Reported (incidentReports created)
  ↓
Initial Review (status: open)
  ↓
Investigation Assigned (investigatorId)
  ↓
Investigation Conducted (status: under_investigation)
  ↓
Checklist Completed (investigation checklist)
  ↓
Root Cause Identified (findings documented)
  ↓
Corrective Actions Created (actionItems, sourceType: incident)
  ↓
Actions Completed (actionItems status: completed)
  ↓
Incident Closed (status: closed)
```

#### Workflow 3: Permit Lifecycle
```
Permit Drafted (status: draft)
  ↓
Checklist Completed (pre-work verification)
  ↓
Submitted for Approval (status: submitted)
  ↓
Approved with Signature (status: approved)
  ↓
Activated (status: active, work begins)
  ↓
[If issue: suspend → suspended → reactivate]
  ↓
Work Complete (status: closed)
  ↓
[Auto-expire if validTo passed: expired]
```

#### Workflow 4: Defect Resolution
```
Defect Identified (status: open)
  ↓
Assigned to Org/Worker (assignedTo/assignedWorkerId)
  ↓
Work Begins (status: in_progress)
  ↓
Resolution Completed (status: resolved, resolvedAt)
  ↓
Verification (comment thread, photos)
  ↓
Closed (status: closed, closedAt)
```

#### Workflow 5: Checklist Conduct
```
Checklist Assigned (assignedTo, dueDate)
  ↓
Worker Opens Checklist (status: in_progress)
  ↓
Fields Completed (responses populated)
  ↓
Photos Attached (field-level attachments)
  ↓
Signatures Captured (signature fields)
  ↓
Completed (status: completed, completedAt)
  ↓
[Action triggers fire]
  ↓
Linked Items Created (defects, actions via trigger fields)
```

#### Workflow 6: Induction Completion
```
[Off-Site Path]
Admin creates inductionInvite (shareCode)
  ↓
Worker accesses via link (no auth)
  ↓
Completes induction (responses + signature)
  ↓
Submits (status: awaiting_review)
  ↓
Admin reviews → Approves
  ↓
inductionCompletion created (status: completed)

[On-Site Path]
Admin creates inductionCompletion (status: in_progress)
  ↓
Worker completes on tablet/kiosk
  ↓
Signs
  ↓
Status: completed (no review)
```

#### Workflow 7: Asset Booking
```
[Request Path]
Worker scans asset QR
  ↓
Submits booking request (with signature)
  ↓
assetBookingRequests created (status: pending)
  ↓
Admin reviews → Approves
  ↓
assetBookings created
  ↓
Optional: assetAssignments created (custody)

[Direct Path]
Admin creates assetBookings directly
  ↓
assetBookings record (status: active)
```

#### Workflow 8: Daily Site Operations
```
Morning:
  Worker signs on (attendanceLogs)
  ↓
  Induction verified (inductionCompletions)
  ↓
  SWMS acknowledged (swmsAssignments)
  ↓
  Toolbox meeting (toolboxMeetings + attendance)
  ↓
  Asset prestart (prestartSubmissions)

Throughout Day:
  Tasks completed (scheduledTasks)
  ↓
  Photos taken (mediaFiles)
  ↓
  Incidents reported (incidentReports)
  ↓
  Defects identified (defects)

Evening:
  Worker signs off (attendanceLogs.signOutTime)
  ↓
  Diary entry (diaries, AI-generated summary)
```

---

### 4.8 Entity Relationship Summary

#### High-Level Diagram
```
orgs (root)
  ↓
projects (scoping entity)
  ├── Site Management
  │   ├── scheduledTasks
  │   ├── diaries
  │   ├── toolboxMeetings
  │   ├── attendanceLogs
  │   └── sourceDocuments
  │
  ├── Safety
  │   ├── swmsDocuments
  │   ├── inductionCompletions
  │   ├── permitInstances
  │   └── incidentReports
  │
  ├── Asset
  │   ├── assets
  │   ├── prestartSubmissions
  │   ├── assetBookings
  │   └── assetServiceLogs
  │
  └── Quality
      ├── defects
      ├── checklistInstances
      └── actionItems
```

#### Key Relationships Table

| From | To | Relationship | Cardinality | Purpose |
|------|----|--------------| ------------|---------|
| orgs | projects | parent | 1:N | Org owns projects |
| projects | all entities | scope | 1:N | Project contains entities |
| swmsTemplates | swmsDocuments | based_on | 1:N | Template instantiation |
| checklistTemplates | checklistInstances | instantiated | 1:N | Template instantiation |
| inductionTypes | inductionCompletions | based_on | 1:N | Template instantiation |
| permitTypes | permitInstances | based_on | 1:N | Template instantiation |
| workers | projects | via workerAssignments | N:N | Project access |
| workers | swmsDocuments | via swmsAssignments | N:N | SWMS acknowledgment |
| workers | inductionCompletions | completed_by | 1:N | Training record |
| assets | assetAssignments | custody | 1:N | Who has asset |
| defects | defectPhotos | photos | 1:N | Visual evidence |
| defects | defectComments | discussion | 1:N | Communication thread |
| actionItems | actionComments | discussion | 1:N | Communication thread |
| checklistInstances | defects | linked | 1:N | Checklist → defect |
| checklistInstances | actionItems | linked | 1:N | Checklist → action |
| incidentReports | actionItems | corrective | 1:N | Incident → action |
| defects | actionItems | corrective | 1:N | Defect → action |
| scheduledTasks | scheduleDependencies | dependencies | N:N | Task precedence |
| toolboxMeetings | toolboxAttendance | attendance | 1:N | Meeting participants |
| toolboxMeetings | swmsDocuments | reviewed | N:N | Documents discussed |
| communications | communicationRecipients | delivery | 1:N | Message recipients |
| sourceDocuments | documentChunks | chunks | 1:N | AI-ready text |
| mediaFiles | all entities | attachments | N:N | File storage |
| [source entity] | checklistInstances | polymorphic | 1:N | Flexible linking |
| [source entity] | defects | polymorphic | 1:N | Flexible linking |
| [source entity] | actionItems | polymorphic | 1:N | Flexible linking |

---

## 5. Relationships & Dependencies

### Depends On

- `01-vision.md` - Product requirements, AI-first thesis
- Context synthesis docs (module-inventory, entity-catalog, relationship-map, cross-cutting)

### Feeds Into

- `04-schema.md` - Database tables from entities
- `05-ai-system.md` - What Chief operates on
- `06-ui-system.md` - What UI displays
- `07-mobile-demo.md` - Worker interactions
- `08-integrations.md` - External system touchpoints

---

## 6. Implementation Notes

### Entity Implementation Order

**Phase 1: Core Foundation**
1. orgs, projects, trades
2. workers, workerAssignments
3. mediaFiles, sourceDocuments
4. notifications, notificationPreferences

**Phase 2: Safety (Most Complex)**
1. swmsTemplates, swmsDocuments, swmsSignatures, swmsAssignments
2. inductionTypes, inductionCompletions, inductionInvites
3. certificationTypes, competencyRecords
4. permitTypes, permitInstances
5. incidentReports, incidentTemplates

**Phase 3: Quality**
1. checklistTemplates, checklistInstances
2. defects, defectPhotos, defectComments
3. actionItems, actionComments

**Phase 4: Assets**
1. assetRegisters, assets
2. assetChecklists, prestartTemplates, prestartSubmissions
3. assetAssignments, assetBookings, assetBookingRequests
4. assetServiceLogs, assetActivityLogs
5. plantInductionCompletions

**Phase 5: Operations**
1. schedulePhases, scheduledTasks, scheduleDependencies
2. diaries
3. toolboxMeetings, toolboxAttendance
4. attendanceLogs
5. briefings

**Phase 6: AI & Communication**
1. executions, aiRuns
2. workflows
3. aiFileIntakes
4. communications, communicationRecipients
5. dashboards, dashboardWidgets

### Simplification from Current

**Schema Consolidation:**
- **Target:** ~52 tables (down from 97)
- Merge activity log tables into generic activityLogs
- Consolidate share code patterns
- Unify attachment strategies (2 patterns instead of 4)
- Remove deprecated tables (permitApplications, etc.)
- Standardize signature storage (mediaFiles only)

**Pattern Standardization:**
- Template/instance pairs follow same structure
- Polymorphic linking uses consistent naming
- Status enums standardized across entities
- Assignment pattern unified (org + worker)
- Audit logs use consistent structure

**Data Model Improvements:**
- Explicit FK relationships where implicit now
- Formalize implied relationships (diary + tasks)
- Add missing links (permit → schedule)
- Remove field duplication

---

## 7. Open Questions

### Domain Questions

1. **RFIs & Variations:** Full feature set? Integration with diary/schedule?
2. **ITPs:** Complete workflow definition needed
3. **NCRs:** Separate from defects or unified?
4. **Hold Points:** Part of ITP or separate entity?
5. **Quote/Budget Tracking:** In scope for rebuild?
6. **Contracts/POs:** In scope for rebuild?

### Relationship Questions

1. **SWMS → Schedule:** Should SWMS link to specific tasks?
2. **Permits → Schedule:** Should permits link to tasks requiring them?
3. **Diary → Tasks:** Formalize task progress updates in diary?
4. **Toolbox → Attendance:** Link toolbox to attendanceLogs for same workers?

### Cross-Cutting Questions

1. **Attachments:** Reduce to 2 patterns (array + bridge)?
2. **Comments:** Keep dedicated tables or go polymorphic?
3. **Signatures:** Always use mediaFiles (no base64)?
4. **Share codes:** Unified expiration/tracking table?
5. **Notifications:** Multi-channel delivery system?
6. **PDF:** Template system or hardcoded layouts?

---

## Appendix

### A. Complete Feature Matrix

[Due to length, complete 730+ feature matrix would be generated from module-inventory.md in implementation phase]

**Summary by Module:**
- Site Management: 250+ features across 18 submodules
- Safety: 200+ features across 11 submodules
- Asset: 100+ features across 8 submodules
- Quality: 80+ features across 4 submodules
- Communication: 100+ features across 8 submodules

### B. Entity Reference Table

**Total Entities:** 97 tables

**By Domain:**
- Core/Org: 10 tables
- SWMS: 4 tables
- Inductions: 4 tables
- Quality: 7 tables
- Assets: 10 tables
- Safety: 11 tables
- Operations: 13 tables
- AI/Cross-Cutting: 20 tables
- Supporting: 18 tables

**Most Complex (40+ fields):**
- swmsDocuments (60+ fields)
- inductionTypes (30+ fields)
- inductionCompletions (30+ fields)
- checklistTemplates (20+ fields)

### C. Status Enum Reference

**Common Status Patterns:**

**3-State Workflow:**
- pending → in_progress → completed

**4-State Approval:**
- draft → pending_review → approved → expired

**5-State Defect:**
- open → in_progress → resolved → closed

**9-State Permit:**
- draft → submitted → approved → active → suspended → closed → expired → rejected → cancelled

### D. Field Type Reference

**Checklist Field Types (15):**
1. text
2. textarea
3. number
4. date
5. yesno
6. checkbox
7. select
8. multiselect
9. photo
10. signature
11. instruction
12. notes
13. action_trigger
14. attachment
15. rating (future)

**Media Kinds:**
- document
- image
- video
- audio
- other

**Polymorphic Source Types:**
- checklist
- inspection
- incident
- defect
- itp
- asset
- manual

---

**END OF DOMAIN MODEL SPECIFICATION**

**Document Status:** Draft v1.0
**Next Steps:**
1. Review for completeness (730+ features captured?)
2. Validate relationships (190+ connections accurate?)
3. Resolve open questions
4. Feed into 04-schema.md (entity → table mapping)
