# Quality - Defects & Actions

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)
- [Schema Reference](#schema-reference)
- [Chief AI Integration](#chief-ai-integration)
- [Build Notes](#build-notes)

## Purpose
Defect lifecycle management with action item tracking, dual assignment model (org OR worker), photo markup, auto-increment numbering, and polymorphic source linking.

## Scope
### In Scope
- Defect tracking (open → in_progress → resolved → closed)
- Action items with corrective action tracking
- Dual assignment (assigned to org OR individual worker)
- Photo attachments with markup annotations
- Auto-increment defect numbering per project
- Comments embedded in entity
- Polymorphic sources (checklist, incident, ITP, asset, manual)
- Drawing markup
- Priority/category classification
- Chief AI operations (auto-assignment, follow-ups, overdue tracking)

### Out of Scope
- RFI workflow (separate module: communications)
- Quality approvals/sign-offs (covered in checklists)
- Inspection scheduling (covered in checklists)
- Progress claims (separate module)

## Requirements

### Defects
- REQ-001: Defect CRUD with status lifecycle (open → in_progress → resolved → closed)
- REQ-002: Auto-increment defectNumber per project (DEFECT-001, DEFECT-002, etc.)
- REQ-003: Dual assignment model: assignedTo (orgId) OR assignedWorkerId (workerId), not both
- REQ-004: Priority levels (low, medium, high, critical) with Chief escalation for critical
- REQ-005: Category classification (builder, client, safety, other)
- REQ-006: Location tracking (level, area, location text)
- REQ-007: Polymorphic source linking via sourceType/sourceId (asset, checklist, incident, itp, manual)
- REQ-008: Photo attachments with markup annotations (SVG/canvas data)
- REQ-009: Embedded comments array (was separate table, now inline)
- REQ-010: Drawing reference via drawingId (FK to sourceDocuments)
- REQ-011: Due date tracking with Chief overdue notifications
- REQ-012: Chief auto-assignment based on trade match
- REQ-013: Chief follow-up on overdue defects (>2× expected duration)

### Actions
- REQ-014: Action CRUD with status lifecycle (open → in_progress → completed or cancelled)
- REQ-015: Auto-increment actionNumber per project
- REQ-016: Dual assignment model (org OR worker)
- REQ-017: Priority levels (low, medium, high, critical)
- REQ-018: Polymorphic source linking (checklist, inspection, incident, defect, itp, manual)
- REQ-019: Attachment support via attachmentIds array (FK to mediaFiles)
- REQ-020: Embedded comments array
- REQ-021: Public access via shareCode for external parties (subcontractors)
- REQ-022: Due date tracking with Chief overdue alerts
- REQ-023: Chief auto-assigns corrective actions from failed prestarts/checklists

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **defects** | projectId, defectNumber (auto), title, description, category (builder/client/safety/other), location, level, area, priority (low/medium/high/critical), status (open/in_progress/resolved/closed), assignedTo (orgId), assignedWorkerId (workerId), dueDate, createdBy, createdAt, resolvedAt, closedAt, sourceType, sourceId, assetId, drawingId, comments (embedded array), metadata, updatedAt | Defect tracking with lifecycle, dual assignment, polymorphic sources, embedded comments |
| **defectPhotos** | defectId, mediaFileId, caption, markup (SVG/canvas data), order, createdAt | Defect photo attachments with annotation markup |
| **actionItems** | projectId, actionNumber (auto), title, description, priority (low/medium/high/critical), status (open/in_progress/completed/cancelled), assignedTo (orgId), assignedWorkerId (workerId), dueDate, createdBy, createdAt, completedAt, sourceType (checklist/inspection/incident/defect/itp/manual), sourceId, attachmentIds (array), shareCode (for public access), comments (embedded array), metadata, updatedAt | Corrective action tracking with polymorphic sources, public access, embedded comments |

## Workflows

### Workflow: Defect Resolution
1. **Defect Identified**
   - Source: Manual report, checklist failure, prestart failure, incident investigation, ITP inspection
   - Created with sourceType/sourceId linking
   - Auto-assigned defectNumber (DEFECT-001, etc.)
   - Status: open
   - Chief identifies assignee based on trade match (if available)

2. **Assignment**
   - PM assigns to org (subcontractor) OR worker (internal staff)
   - Chief drafts assignment with reasoning: "I've assigned this defect to John (electrical) based on trade match"
   - User approves or modifies
   - Due date set (or Chief suggests based on priority)

3. **In Progress**
   - Assignee acknowledges, begins work
   - Status: in_progress
   - Comments added by worker/PM for updates
   - Photos attached with markup annotations

4. **Resolved**
   - Worker marks resolved, uploads verification photo
   - Chief guidance: "Company policy requires verification photo for critical defects. Close without photo (document reason), or upload photo first?"
   - Status: resolved
   - PM/supervisor reviews

5. **Closed**
   - PM verifies resolution, closes defect
   - Status: closed
   - closedAt timestamp recorded
   - Chief tracks resolution time, surfaces patterns: "Average defect resolution: 3.2 days, down from 5.1"

### Workflow: Action Item Completion
1. **Action Created**
   - Source: Checklist failure, incident corrective action, defect follow-up, manual creation
   - Auto-assigned actionNumber
   - Status: open
   - Chief auto-assigns based on sourceType context

2. **Assignment**
   - Assigned to org OR worker
   - Due date set
   - Chief tracks overdue actions, sends follow-ups

3. **Completion**
   - Worker completes action, marks completed
   - Status: completed
   - completedAt timestamp
   - Chief logs closure, removes from overdue tracking

### Workflow: Action Item Cancellation
1. **Cancellation Trigger**
   - Action no longer needed (scope change, duplicate, mistake)
   - PM or assignee initiates cancellation
   - Reason documented in comments

2. **Cancel Action**
   - Status: open/in_progress → cancelled
   - cancelledAt timestamp recorded
   - Reason comment added (required)
   - Chief logs cancellation, removes from overdue tracking

**API Call:**
```typescript
const cancel = useMutation(api.actions.update);
await cancel({
  id: actionId,
  status: 'cancelled',
  cancelledAt: nowIso()
});

// Add cancellation reason comment
const addComment = useMutation(api.actions.addComment);
await addComment({
  actionId,
  workerId,
  comment: `Action cancelled: ${reason}`
});
```

### Workflow: Chief Proactive Defect Management
1. **Morning Brief (7:30 AM)**
   - Chief identifies: 2 critical defects raised overnight (via mobile)
   - Drafts assignments: "I've assigned defects to John (electrical) based on trade match — Approve assignments?"
   - PM approves in 30 seconds

2. **Throughout Day**
   - Chief monitors: Scaffolding defect blocks 3 trades
   - Escalation: "[CRITICAL] Scaffolding defect blocks 3 trades (I've notified them, awaiting your decision on workaround)"
   - PM handles exception

3. **End of Day Summary**
   - Chief reports: "Today's Outcome: 2 critical defects resolved (scaffolding, electrical)"
   - Tomorrow's Focus: "4 defects due for verification"
   - Overnight Operations: "I'll flag any urgent issues immediately"

4. **Overdue Tracking**
   - Chief identifies defects >2× expected duration
   - Sends follow-ups: "Sent reminder to subbie about overdue defect (3 days late)"
   - Escalates if still overdue: "Two critical defects open >7 days, escalating"

## Acceptance Criteria

### Defects
- AC-001: Defect created with auto-increment defectNumber per project
- AC-002: Defect lifecycle progresses: open → in_progress → resolved → closed
- AC-003: Dual assignment enforced: EITHER assignedTo (org) OR assignedWorkerId (worker), not both
- AC-004: Priority levels rendered with CSS variables (--priority-low-bg/text, etc.)
- AC-005: Category enum validated (builder, client, safety, other)
- AC-006: Polymorphic source resolution (asset, checklist, incident, itp, manual)
- AC-007: Photo attachments support markup annotations (SVG/canvas data)
- AC-008: Comments embedded in defects.comments[] array (not separate table)
- AC-009: Drawing reference via drawingId displays linked drawing metadata
- AC-010: Chief auto-assigns defects based on trade match with approval workflow
- AC-011: Chief sends follow-ups on overdue defects (>2× expected duration)
- AC-012: Critical defects escalate immediately with phone notification

### Actions
- AC-013: Action created with auto-increment actionNumber per project
- AC-014: Action lifecycle progresses: open → in_progress → completed or cancelled
- AC-015: Dual assignment enforced (org OR worker)
- AC-016: Polymorphic source linking (checklist, inspection, incident, defect, itp, manual)
- AC-017: Attachments uploaded via attachmentIds array
- AC-018: Public access via shareCode (12-char base64url, indexed by_shareCode)
- AC-019: Comments embedded in actionItems.comments[] array
- AC-020: Chief auto-creates action items from failed prestart/checklist items
- AC-021: Chief tracks overdue actions (past dueDate), sends automatic follow-ups
- AC-022: ShareCode public access bypasses auth (QR flow for subcontractors)

### Chief Integration
- AC-023: Chief identifies defects via db_read with by_project_status index
- AC-024: Chief drafts defect assignments via db_write with changeset tracking
- AC-025: Chief presents defect resolution confirmation with undo option
- AC-026: Chief surfaces defect resolution metrics: "Average defect resolution: 3.2 days"
- AC-027: Chief detects patterns: "Plumbing inspections delayed 3 weeks running"
- AC-028: Chief compliance guidance: "Verification photo required for critical defects. Close without photo (document reason), or upload photo first?"

## Dependencies

### Internal
- **projects**: projectId scope enforcement
- **orgs**: assignedTo foreign key (subcontractor assignment)
- **workers**: assignedWorkerId, createdBy foreign keys (worker assignment, creator)
- **mediaFiles**: defectPhotos.mediaFileId, actionItems.attachmentIds (photos, attachments)
- **sourceDocuments**: drawingId foreign key (drawing reference)
- **checklistInstances**: polymorphic source (checklist failures → defects/actions)
- **incidentReports**: polymorphic source (incidents → defects/actions)
- **prestartSubmissions**: polymorphic source (prestart failures → defects/actions)
- **assets**: assetId foreign key (asset-related defects)

### External
- **Chief AI**: Auto-assignment, follow-ups, overdue tracking, pattern detection
- **MCP Tools**: db_read (query defects/actions), db_write (create/update with undo), undo (reverse changesets)
- **Skills**: domain-defects skill for defect lifecycle management
- **Mobile QR**: Public action access via shareCode for subcontractors

### UI Components
- DefectCard, DefectsTable, DefectDetail, DefectPhotoGrid (components/defects/)
- StatusBadge, PriorityBadge (components/shared/)
- ChiefChat data renderer for type: 'defects_list'

### Schema Patterns
- **Polymorphic Sources**: sourceType + sourceId pattern (no FK constraints, validate in code)
- **Embedded Comments**: comments[] array with {id, workerId, comment, createdAt} objects (was separate table)
- **Auto-Increment Numbers**: defectNumber, actionNumber generated via nextDefectNumber(), nextActionNumber() helpers
- **Dual Assignment**: Mutually exclusive assignedTo (org) OR assignedWorkerId (worker) with validation
- **Public Access**: actionItems.shareCode (12-char base64url, indexed by_shareCode) for external access
- **Indexes**: by_project, by_project_status, by_assignee, by_source (sourceType + sourceId), by_shareCode

## Schema Reference

### defects Table
```typescript
defineTable({
  projectId: v.id("projects"),          // REQUIRED
  defectNumber: v.string(),             // Auto-increment: "DEFECT-001"
  title: v.string(),                    // 1-200 chars
  description: v.string(),              // max 5000 chars
  category: v.union(                    // builder|client|safety|other
    v.literal("builder"),
    v.literal("client"),
    v.literal("safety"),
    v.literal("other")
  ),
  location: v.optional(v.string()),     // Free text location
  level: v.optional(v.string()),        // e.g., "Level 2", "Ground"
  area: v.optional(v.string()),         // e.g., "Bathroom", "Electrical room"
  priority: v.union(                    // low|medium|high|critical
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  status: v.union(                      // open|in_progress|resolved|closed
    v.literal("open"),
    v.literal("in_progress"),
    v.literal("resolved"),
    v.literal("closed")
  ),
  assignedTo: v.optional(v.id("orgs")),           // Org assignment (subcontractor)
  assignedWorkerId: v.optional(v.id("workers")),  // Worker assignment (internal)
  dueDate: v.optional(v.string()),                // ISO date
  createdBy: v.id("workers"),
  createdAt: v.string(),                          // ISO timestamp
  resolvedAt: v.optional(v.string()),
  closedAt: v.optional(v.string()),
  sourceType: v.optional(v.union(                 // Polymorphic source
    v.literal("asset"),
    v.literal("checklist"),
    v.literal("incident"),
    v.literal("itp"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),
  assetId: v.optional(v.id("assets")),
  drawingId: v.optional(v.id("sourceDocuments")),
  comments: v.array(v.object({          // Embedded (was separate table)
    id: v.string(),
    workerId: v.id("workers"),
    comment: v.string(),
    createdAt: v.string()
  })),
  metadata: v.optional(v.any()),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_project_number", ["projectId", "defectNumber"])  // Unique
.index("by_status", ["projectId", "status"])
.index("by_assignee", ["assignedTo"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_asset", ["assetId"])
```

### defectPhotos Table
```typescript
defineTable({
  defectId: v.id("defects"),
  mediaFileId: v.id("mediaFiles"),
  caption: v.optional(v.string()),
  markup: v.optional(v.string()),       // SVG/canvas markup data (JSON)
  order: v.optional(v.number()),        // Photo ordering
  createdAt: v.string()
})
.index("by_defect", ["defectId"])
.index("by_mediaFile", ["mediaFileId"])
```

### actionItems Table
```typescript
defineTable({
  projectId: v.id("projects"),
  actionNumber: v.string(),             // Auto-increment: "ACTION-001"
  title: v.string(),
  description: v.string(),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  status: v.union(
    v.literal("open"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  assignedTo: v.optional(v.id("orgs")),
  assignedWorkerId: v.optional(v.id("workers")),
  dueDate: v.optional(v.string()),
  createdBy: v.id("workers"),
  createdAt: v.string(),
  completedAt: v.optional(v.string()),
  sourceType: v.optional(v.union(
    v.literal("checklist"),
    v.literal("inspection"),
    v.literal("incident"),
    v.literal("defect"),
    v.literal("itp"),
    v.literal("manual")
  )),
  sourceId: v.optional(v.string()),
  attachmentIds: v.array(v.id("mediaFiles")),
  shareCode: v.optional(v.string()),    // 12-char base64url for public access
  comments: v.array(v.object({          // Embedded
    id: v.string(),
    workerId: v.id("workers"),
    comment: v.string(),
    createdAt: v.string()
  })),
  metadata: v.optional(v.any()),
  updatedAt: v.optional(v.string())
})
.index("by_project", ["projectId"])
.index("by_status", ["projectId", "status"])
.index("by_assignee", ["assignedTo"])
.index("by_source", ["sourceType", "sourceId"])
.index("by_shareCode", ["shareCode"])
.index("by_dueDate", ["projectId", "dueDate"])
```

### ShareCode Generation
Actions use unique 12-character base64url codes for public access:

```typescript
// Generate on action creation (if public access needed)
const generateActionShareCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Example: aB3-xY9_zQ2w
```

**Collision handling:** Check uniqueness via by_shareCode index before insert.

## Chief AI Integration

### Morning Workflow (7:30 AM)
**Overnight Activity:**
- 2 critical defects raised (via mobile)

**What Needs Your Attention:**
- [CRITICAL] Scaffolding defect blocks 3 trades (I've notified them, awaiting your decision on workaround)
- [APPROVAL] 2 defects assigned to John (electrical) — Approve assignments?

**What I've Drafted for Approval:**
- Defect assignment: John (electrical) based on trade match

**User Actions:**
- Scan overnight activity: 15 seconds
- Handle critical issue: 5 minutes
- Approve assignments: 30 seconds

### Throughout Day
**10:00 AM — Phone Notification:**
- "Critical defect raised: Electrical panel exposed. I've notified John (electrician) and marked area unsafe. Photo attached. Needs immediate barricading."

**2:00 PM — Pattern Detection:**
- "Pattern detected: Plumbing inspections delayed 3 weeks running. Root cause appears to be inspector availability. Suggestion: Book inspections 2 weeks ahead instead of 1 week."

**4:00 PM — Client Query:**
- Client asks: "Status of waterproofing defect from December?"
- Chief responds: "Defect #247: Waterproofing membrane damage, Level 2 bathroom (Raised: Dec 18, Assigned: ABC Waterproofing Dec 19, Fixed: Jan 8 photos attached, Verified: Jan 10 by site supervisor, Closed: Jan 10, Warranty documentation filed)"

### End of Day Summary
**Today's Outcome:**
- 2 critical defects resolved (scaffolding, electrical)

**Tomorrow's Focus:**
- 4 defects due for verification

**Overnight Operations:**
- I'll flag any urgent issues immediately

### Trust Progression
**Week 1:**
- Chief proposes defect assignment, waits for approval every time

**Week 4:**
- User has approved 40 similar assignments
- Chief asks: "I've assigned defects to trades 40 times with 100% approval. Can I auto-assign going forward?"

**Week 5+:**
- Chief auto-assigns, user sees summary

### Compliance Guidance
**User Action:**
- Wants to close critical defect without verification photo

**Chief Response:**
- "Company policy requires verification photo for critical defects. Close without photo (document reason), or upload photo first?"

**Rationale:**
- Inform, don't block. User remains accountable.

## Build Notes

### Phase 1 Priority
- One module end-to-end: Defects (raise → assign → verify → close)
- Validation: Can Chief monitor defects, identify overdue, send follow-up?

### Validation Questions
- Can Chief identify defects via db_read with indexed queries?
- Can Chief draft defect assignments with trade-based reasoning?
- Can Chief track overdue defects and send automatic follow-ups?
- Can Chief surface defect resolution metrics and patterns?
- Can user undo any Chief action via changeset?

### Risk Assessment (Chief)
- **Low Risk + Reversible:** Status update (open → in_progress) — Chief proceeds
- **Medium Risk:** Assignment to worker, multiple defects — Chief confirms
- **High Risk:** Deletion, critical defect closure without photo — Chief escalates

### UI Routes
- Defects list: `/projects/:projectId/defects`
- Defect detail: `/projects/:projectId/defects/:defectId`
- Actions list: `/projects/:projectId/actions`
- Action detail: `/projects/:projectId/actions/:actionId`
- Action public view: `/w/action/:shareCode` (no auth)

### Mobile Worker Flows
- Report defect from checklist field (action_trigger type)
- Report defect from prestart failure (auto-created)
- View assigned actions
- Mark action complete
- Access action via QR shareCode (subcontractor)

### Performance Metrics
- **Loop Closure Rate:** (defects closed / defects created) × 100
  - Target: Advisor 85-90%, Operator 92-96%, Autopilot 97-99%
- **Proactive vs Reactive:** (Chief identified / user identified)
  - Target: Advisor 30-40%, Operator 60-75%, Autopilot 85-95%
- **Approval Rate:** Chief proposals approved without modification
  - Target: Advisor 70-80%, Operator 85-92%, Autopilot 93-97%
- **Average Defect Resolution Time:** Tracked by Chief
  - Example: "Average defect resolution: 3.2 days, down from 5.1"
