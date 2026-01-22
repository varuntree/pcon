# Quality - Checklists

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Dynamic checklist builder system with 16 field types, conditional logic, polymorphic source linking, and linked item tracking (defects, actions). Templates org-scoped or project-scoped; instances project-scoped. Multiple contexts: site, plant, task, quality.

## Scope
### In Scope
- Checklist template builder (org or project scope)
- Checklist instance conductor (always project scope)
- 16 field types: text, textarea, number, date, time, datetime, yesno, checkbox, select, multiselect, photo, signature, instruction, notes, action_trigger, attachment
- Conditional field logic (show/hide based on other fields)
- Response storage (flexible JSON: value, notes, attachments, signatures)
- Linked item tracking (linkedDefectIds, linkedActionIds)
- Polymorphic source linking (asset, itp, incident, defect, manual)
- Plant induction integration (plantRegisterId, plantAssetIds, plantAllItemsInRegister, isPlantInduction)
- Mobile-optimized form conductor
- Field-level notes, attachments, signatures
- Create defect/action from any checklist field
- Tabbed report view (Overview, Activity, Attachments, Links)

### Out of Scope
- Template versioning (future)
- Offline support (future)
- Rating field type (future)
- Email/print export (future)
- Advanced scoring/analytics (basic scoring only)

## Requirements

### Templates
- REQ-001: Templates org-scoped or project-scoped with optional projectId
- REQ-002: Template scope types: site, plant, task, quality, other
- REQ-003: Templates contain sections array with fields array per section
- REQ-004: Template cloning support
- REQ-005: Plant induction mode (isPlantInduction flag with plantRegisterId or plantAssetIds)
- REQ-006: Active/inactive lifecycle (isActive flag)
- REQ-007: Optional scoring (scoringEnabled, passingScore)
- REQ-008: Section structure (id, title, order, fields[])

### Field Types
- REQ-010: Support 16 field types:
  - **text** - Single line input
  - **textarea** - Multi-line text (placeholder, rows)
  - **number** - Numeric input (min/max validation)
  - **date** - Date picker
  - **time** - Time picker (HH:MM format)
  - **datetime** - Combined date/time picker (ISO timestamp)
  - **yesno** - Binary choice (Yes/No buttons, pass/fail)
  - **checkbox** - Single checkbox (acknowledgment)
  - **select** - Dropdown (single selection from options)
  - **multiselect** - Checkbox group (multiple selections from options)
  - **photo** - Camera capture (environment camera, preview, remove)
  - **signature** - Canvas (300x150, clear button, base64 PNG export)
  - **attachment** - File upload (multiple files)
  - **instruction** - Read-only display (no user input, excluded from progress calc)
  - **notes** - Free text area (additional notes)
  - **action_trigger** - Button to create defect/action on any field

### Conditional Logic
- REQ-020: Conditional field visibility (show/hide based on other field values)
- REQ-021: Condition structure: { triggerFieldId, operator: "equals", value, action: "show" | "hide" }
- REQ-022: Client-side evaluation of conditional logic
- REQ-023: Example: Show field when safety_concern = "yes"

### Instances
- REQ-030: Instances always project-scoped (required projectId)
- REQ-031: Instance status workflow: in_progress → completed → cancelled
- REQ-032: Assignment (assignedTo workerId, optional)
- REQ-033: Execution tracking (performedByWorkerId, performedAt, completedAt)
- REQ-034: Due date tracking (dueDate ISO)
- REQ-035: Polymorphic source linking supports:
  - sourceType: 'asset' - Linked to asset inspection
  - sourceType: 'itp' - Inspection test plan stage
  - sourceType: 'incident' - Incident investigation
  - sourceType: 'defect' - Defect verification checklist
  - sourceType: 'manual' - Manually created checklist
  - sourceType: 'permit' - Permit-linked checklist (future)
  - sourceType: 'inspection' - General inspection (future)
- REQ-036: Plant context tracking (plantRegisterId, plantAssetId, plantBookingId)
- REQ-037: Linked item arrays (linkedDefectIds[], linkedActionIds[])
- REQ-038: Response storage (Record<fieldId, { value, notes?, attachmentIds?, signature? }>)
- REQ-039: Progress calculation: (answered fields / total fields excluding instruction type) * 100
- REQ-039a: Progress excludes instruction type fields from denominator
- REQ-039b: Empty string, null, undefined count as unanswered
- REQ-039c: For yesno fields, both "yes" and "no" count as answered
- REQ-039d: For multiselect, empty array counts as unanswered

### Response Storage
- REQ-040: Flexible JSON response structure per field:
  - **value**: any (field-specific: string, number, boolean, array, date)
  - **notes**: string (field-level notes separate from main notes)
  - **attachmentIds**: string[] (array of mediaFile IDs)
  - **signature**: { mediaFileId: string, signedAt: string, hash: string }
- REQ-041: Simple values for basic fields (text, number, yesno, select)
- REQ-042: Complex structures for rich fields (photo, signature, attachment, multiselect)
- REQ-043: Signature hash for tamper detection (SHA256)
- REQ-044: Signature can be stored inline (base64 in responses) OR as mediaFile reference
- REQ-045: MediaFile storage preferred for large signatures, inline for quick access

### Defect/Action Creation
- REQ-050: Create defect from any checklist field (button per field)
- REQ-051: Create action from any checklist field (button per field)
- REQ-052: Pre-populate title: "Defect/Action from: {fieldLabel}"
- REQ-053: Pre-populate description with field value
- REQ-054: Source linking: sourceType='checklist', sourceId=instanceId
- REQ-055: Link created defect/action back to checklist (append to linkedDefectIds, linkedActionIds)
- REQ-056: Display linked defect/action count in checklist report
- REQ-057: Navigate to linked defects/actions from checklist

### Plant Integration
- REQ-060: Plant induction templates (isPlantInduction flag)
- REQ-061: Plant scope via plantRegisterId (all assets in register) OR plantAssetIds (specific assets)
- REQ-062: Instance plant context (plantRegisterId, plantAssetId, plantBookingId)
- REQ-063: Auto-create plantInductionCompletions on completion
- REQ-064: plantAllItemsInRegister flag enables induction for entire register vs specific assets

### Action Trigger Fields
- REQ-070: Action trigger field config: { type: "action_trigger", label, triggerWhen: "yes", actionTitle, actionPriority }
- REQ-071: Fire action triggers on instance completion
- REQ-072: Template variables in action title: {{field_issue_description}}
- REQ-073: Trigger conditions support field value matching (triggerWhen config)
- REQ-074: Template variables extract field values using {{field_<fieldId>}} syntax
- REQ-075: Available variables: all field IDs from same checklist instance

### Checklist Conductor
- REQ-080: Mobile-optimized form conductor (touch targets 44x44px min)
- REQ-081: Field-level validation (required fields, numeric min/max)
- REQ-082: Save vs Complete distinction:
  - **Save**: status → in_progress (editable, preserves partial responses)
  - **Complete**: status → completed (immutable, validation required)
- REQ-083: Progress bar display (answered/total, percentage)
- REQ-084: Conditional field evaluation (real-time show/hide)
- REQ-085: Signature canvas drawing logic (isDrawing state, beginPath, moveTo, lineTo, stroke)
- REQ-086: Photo capture rear-facing camera (capture=environment, multiple photos, preview thumbnails, remove per photo)
- REQ-087: Attachment upload (multiple files, upload progress indicator)

### Field Validation Rules
- REQ-088: Text fields validate max length (configurable, default 255 chars)
- REQ-089: Email fields validate format (if email type added)
- REQ-090: Number fields validate min/max range (optional config)
- REQ-091: Date fields validate format (ISO) and optional min/max dates
- REQ-092: Required fields block completion until filled
- REQ-093: Multiselect validates at least one selection if required

### Checklist Report
- REQ-094: Tabbed report view:
  - **Overview**: Responses with conditional logic, field notes, attachments
  - **Activity**: Timeline of events (created, started, completed)
  - **Attachments**: Gallery view of all photos/files (grouped by field or chronological, lightbox modal)
  - **Links**: Defects/actions created from this checklist
- REQ-095: Metadata cards (created date, completed date, performer, assigned to, due date)
- REQ-096: Status badge in header
- REQ-097: Back button navigation
- REQ-098: Download individual or all attachments

### Chief Operations
- REQ-100: Automatic follow-ups on overdue checklists
- REQ-101: Morning brief includes assigned checklists
- REQ-102: Pattern detection: equipment defect impacts quality checklist
- REQ-103: Reminder drafts: "Sent reminder to subbie about overdue checklist (3 days late)"
- REQ-104: Tomorrow's focus: 4 defects due for verification

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **checklistTemplates** | orgId, projectId (optional), name, description, scope, sections[], items (legacy), isPlantInduction, plantRegisterId, plantAllItemsInRegister, plantAssetIds[], scoringEnabled, passingScore, isActive, isSystemTemplate | Template definitions (org or project scope) |
| **checklistInstances** | projectId, checklistTemplateId, assignedTo, performedByWorkerId, dueDate, sourceType, sourceId, plantRegisterId, plantAssetId, plantBookingId, performedAt, status, completedAt, responses, linkedDefectIds[], linkedActionIds[] | Execution records (always project scope) |
| **mediaFiles** | fileName, storageId, linkedEntityType, linkedEntityId | Photo/attachment storage (linked via attachmentIds) |
| **defects** | projectId, title, sourceType, sourceId | Linked defects (created from checklist fields) |
| **actionItems** | projectId, title, sourceType, sourceId | Linked actions (created from checklist fields) |

### Field Structure
```typescript
// Template section field
{
  id: string                 // Unique field ID
  type: FieldType            // One of 14 types
  label: string              // Field label
  required: boolean          // Validation flag
  options?: string[]         // For select/multiselect
  conditions?: Condition[]   // Conditional logic
  order: number              // Display order
}

// Condition structure
{
  triggerFieldId: string     // Field ID to watch
  operator: "equals"         // Comparison operator
  value: any                 // Trigger value
  action: "show" | "hide"    // Visibility action
}

// Response structure
{
  [fieldId]: {
    value: any                    // Field value
    notes?: string                // Field-level notes
    attachmentIds?: string[]      // mediaFile IDs
    signature?: {
      mediaFileId: string         // Signature image
      signedAt: string            // ISO timestamp
      hash: string                // SHA256 tamper detection
    }
  }
}

// Complete field config example
{
  id: "field_1",
  type: "yesno",
  label: "Fire extinguisher present?",
  required: true,
  order: 1,
  helpText: "Check all extinguishers are in date",

  // For select/multiselect
  options?: ["Option 1", "Option 2"],

  // For number
  min?: 0,
  max?: 100,

  // For textarea
  rows?: 4,
  placeholder?: "Enter notes",

  // For photo
  maxPhotos?: 5,

  // For signature
  signatureConfig?: {
    label: "Inspector signature",
    role: "Inspector",
    required: true
  },

  // For action_trigger
  actionTrigger?: {
    triggerWhen: "yes",
    actionTitle: "Follow up on {{field_issue_description}}",
    actionPriority: "high"
  },

  // Conditional logic
  conditions?: [{
    triggerFieldId: "field_0",
    operator: "equals",
    value: "no",
    action: "show"
  }]
}
```

## Workflows

### Create Template
1. User creates template (name, description, scope)
2. Builder adds sections with fields (14 types available)
3. Configure conditional logic (if needed)
4. Configure action triggers (if needed)
5. Plant integration: Set isPlantInduction flag, select plantRegisterId or plantAssetIds
6. Optional: Enable scoring (scoringEnabled, passingScore)
7. Activate template (isActive = true)
8. Template available for use

### Conduct Checklist (Mobile)
1. Worker opens assigned checklist instance (or creates from template)
2. System loads template + existing responses (if in_progress)
3. Worker fills fields:
   - Text inputs, number inputs, date pickers
   - Yes/No buttons, checkboxes, dropdowns
   - Photo capture (rear camera), signature canvas
   - File uploads, notes
4. System evaluates conditional logic (show/hide fields in real-time)
5. Worker saves progress (status: in_progress, editable)
6. System calculates progress: (answered / total excluding instructions) * 100
7. Worker completes checklist (status: completed, immutable)
8. System validates required fields
9. System fires action triggers (creates action items from action_trigger fields)
10. If plant induction: System creates plantInductionCompletions record
11. System displays confirmation + summary

### Create Defect from Checklist Field
1. User views checklist instance (any status)
2. User clicks "Create Defect" button on any field
3. System opens defect creation dialog
4. System pre-fills:
   - title: "Defect from: {fieldLabel}"
   - description: {fieldValue}
   - sourceType: 'checklist'
   - sourceId: checklistInstanceId
5. User adjusts title, description, priority, location
6. User submits defect
7. System creates defect record
8. System appends defectId to checklist.linkedDefectIds[]
9. System displays confirmation
10. User navigates to defect detail (optional)

### View Checklist Report
1. User opens completed checklist instance
2. System displays tabbed report:
   - **Overview tab**: Responses (respects conditional logic), field notes, inline attachments, status badge
   - **Activity tab**: Timeline (created, started, completed events with icons, relative timestamps)
   - **Attachments tab**: Gallery of all photos/files (grouped by field or chronological, lightbox modal, download all)
   - **Links tab**: List of linked defects/actions (count, titles, statuses, navigate to detail)
3. User downloads attachments (individual or all)
4. User navigates to linked defect/action
5. User returns via back button

## Acceptance Criteria

### Templates
- **AC-T1**: Template created with name, scope, sections, fields
- **AC-T2**: All 16 field types render correctly in builder
- **AC-T3**: Conditional logic configured and saved
- **AC-T4**: Template cloned with "-Copy" suffix
- **AC-T5**: Plant integration flags persist (isPlantInduction, plantRegisterId, plantAssetIds)
- **AC-T6**: Inactive templates hidden from instance creation (isActive = false)

### Instances
- **AC-I1**: Instance created from template with projectId, templateId
- **AC-I2**: Responses saved as in_progress (editable)
- **AC-I3**: Progress bar updates: (answered / total excluding instructions) * 100
- **AC-I4**: Conditional fields show/hide based on trigger field values
- **AC-I5**: Complete validation checks all required fields
- **AC-I6**: Completed instance immutable (status: completed)
- **AC-I7**: Linked defects/actions tracked in linkedDefectIds[], linkedActionIds[]

### Field Types
- **AC-F1**: Text field accepts single line input
- **AC-F2**: Textarea accepts multi-line with configurable rows
- **AC-F3**: Number field validates min/max
- **AC-F4**: Date field opens date picker
- **AC-F4a**: Time field opens time picker (HH:MM format)
- **AC-F4b**: Datetime field opens combined date/time picker (ISO timestamp)
- **AC-F5**: Yesno field displays Yes/No buttons
- **AC-F6**: Checkbox field toggles boolean
- **AC-F7**: Select field shows dropdown with options
- **AC-F8**: Multiselect field shows checkbox group
- **AC-F9**: Photo field captures from rear camera, displays preview, allows remove
- **AC-F10**: Signature field renders canvas, exports base64 PNG with hash
- **AC-F11**: Attachment field uploads multiple files with progress indicator
- **AC-F12**: Instruction field displays text, excluded from progress calc
- **AC-F13**: Notes field provides textarea for additional notes
- **AC-F14**: Action_trigger field shows button, pre-fills action on click

### Defect/Action Creation
- **AC-D1**: "Create Defect" button on every field
- **AC-D2**: Dialog pre-fills title: "Defect from: {fieldLabel}"
- **AC-D3**: Dialog pre-fills description with field value
- **AC-D4**: Created defect has sourceType='checklist', sourceId=instanceId
- **AC-D5**: Defect ID appended to checklist.linkedDefectIds[]
- **AC-D6**: Linked defects display count in report Links tab
- **AC-D7**: Navigate to linked defect from checklist report

### Checklist Report
- **AC-R1**: Tabbed report displays Overview, Activity, Attachments, Links tabs
- **AC-R2**: Overview tab shows all responses respecting conditional logic
- **AC-R3**: Activity tab shows timeline (created, started, completed events with relative timestamps)
- **AC-R4**: Attachments tab displays gallery with lightbox modal
- **AC-R5**: Links tab lists linked defects/actions with status badges
- **AC-R6**: Download all attachments button works
- **AC-R7**: Back button navigates to list

### Chief Operations
- **AC-C1**: Morning brief includes "3 checklists due today"
- **AC-C2**: Chief drafts "Sent reminder to subbie about overdue checklist (3 days late)"
- **AC-C3**: Tomorrow's focus includes "4 defects due for verification"
- **AC-C4**: Chief detects pattern: "Equipment defect impacts quality checklist"

## Dependencies

### Data Dependencies
- **workers** table (assignedTo, performedByWorkerId)
- **projects** table (projectId scope)
- **orgs** table (orgId scope for templates)
- **assetRegisters** table (plantRegisterId for plant integration)
- **assets** table (plantAssetIds for plant integration)
- **mediaFiles** table (photo, signature, attachment storage)
- **defects** table (linked defects via linkedDefectIds)
- **actionItems** table (linked actions via linkedActionIds)

### Feature Dependencies
- **Defects module** (create defect from field)
- **Actions module** (create action from field, action_trigger fields)
- **Media storage** (photo capture, signature, attachment upload)
- **Plant module** (plant induction integration)
- **Chief agent** (automatic follow-ups, morning brief, pattern detection)

### UI Dependencies
- **Mobile components** (touch-optimized conductor, field renderers)
- **ShadCN primitives** (inputs, buttons, dialogs, tabs)
- **Signature canvas** (drawing logic, base64 export)
- **Photo capture** (camera API, preview, file upload)
- **Conditional logic engine** (client-side evaluation)
- **Progress bar** (answered/total calculation)

### API Dependencies
- **getInstance** (fetch instance with responses)
- **getTemplate** (fetch template with sections/fields)
- **saveResponse** (save single field response)
- **saveAllResponses** (batch save, status: in_progress)
- **completeChecklist** (validate + finalize, status: completed)
- **createDefectFromField** (create defect with source link)
- **createActionFromField** (create action with source link)
