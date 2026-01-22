# Mobile Worker Experience

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Screen List](#screen-list)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [QR Code Flows (7 Public Entry Points)](#qr-code-flows-7-public-entry-points)
- [Prestart Pass/Fail Evaluation](#prestart-passfail-evaluation)
- [Checklist Conditional Logic](#checklist-conditional-logic)
- [Response Storage Formats](#response-storage-formats)
- [Share Code Generation](#share-code-generation)
- [Adapter Hook Examples](#adapter-hook-examples)
- [Design Philosophy](#design-philosophy)
- [Worker Capabilities](#worker-capabilities)
- [PWA Configuration](#pwa-configuration)
- [Field Type Implementation Details](#field-type-implementation-details)
- [Drawing Logic for Signature](#drawing-logic-for-signature)
- [Progress Tracking Formula](#progress-tracking-formula)
- [Open Questions](#open-questions)
- [Dependencies](#dependencies)

## Purpose
Mobile simulator demonstrating worker task hub, compliance flows, field capture patterns across 51 screens organized into 7 tabs.

## Scope
### In Scope
- 51 mobile screens (7 tabs, 9 submodules)
- 7 navigation tabs (Tasks, Communication, Project, Safety, Quality, Plant, Profile)
- Worker task hub (aggregated tasks)
- Touch UI patterns (44px targets, high contrast, bold typography)
- Offline-ready architecture (future)
- Camera/photo capture (rear-facing, multiple photos)
- Signature capture (canvas-based)
- QR code access (7 public flows)
- Mobile simulator (demo tool, single test worker)
- Field worker persona (minimal taps, clear feedback)
- Share code public access (no auth required)

### Out of Scope
- QR public flows spec (see mobile-qr.md)
- Production authentication (demo uses email/name match)
- Multi-user sessions (single demo worker)
- Production offline implementation (architecture defined)

## Requirements

### Navigation Structure
- REQ-001: 7 bottom tabs (Tasks, Communication, Project, Safety, Quality, Plant, Profile)
- REQ-002: Tab 1 Tasks: TaskHub screen (1 screen)
- REQ-003: Tab 2 Communication: Communications, CommunicationDetail, Inbox (3 screens)
- REQ-004: Tab 3 Project: ModuleMenu + 8 screens (Actions, ActionDetail, Schedule, Documents, Drawings, Photos, SiteDiaries, SiteDiaryDetail)
- REQ-005: Tab 4 Safety: ModuleMenu + 17 screens (SignOn, Incidents x3, SWMS x2, Permits x3, Toolbox x2, SDS x4, Inductions x2, Compliance, Tickets x3)
- REQ-006: Tab 5 Quality: ModuleMenu + 4 screens (Checklists, ChecklistConduct, Defects, DefectDetail)
- REQ-007: Tab 6 Plant: ModuleMenu + 10 screens (Pre-Starts x3, PlantRequests, Assets x3, PlantInductions x2)
- REQ-008: Tab 7 Profile: Profile screen (1 screen)

### Worker Profile & Context
- REQ-009: Worker identity (workerId, orgId, name, email, phone, trade, employerName, status)
- REQ-010: Certifications (certificationTypeId, name, number, expiryDate, status: valid/expiring_soon/expired, photoIds)
- REQ-011: Demo worker identified by email (test.worker@example.com) or name (Test Worker)
- REQ-012: Worker assignments (multiple projects, activeProjectId, setActiveProject)
- REQ-013: All data filtered by: worker + active project
- REQ-014: Emergency contact (name, phone, relationship)
- REQ-015: Avatar photo upload (avatarId → mediaFiles)

### Design Principles
- REQ-016: Touch targets 44x44px minimum (WCAG)
- REQ-017: Bold typography, high contrast (outdoor visibility)
- REQ-018: Minimal text input (prefer selections, camera, signature)
- REQ-019: Progressive disclosure (only show what's needed)
- REQ-020: Clear feedback (confirmation screens, inline success)
- REQ-021: Mobile-first utility classes (.mobile-full-width, .mobile-stack, .mobile-fullscreen-dialog, .table-scroll-container)

### Responsive Breakpoints
- REQ-022: sm: 640px (Mobile → Tablet)
- REQ-023: md: 768px (Tablet → Desktop)
- REQ-024: lg: 1024px (Desktop, sidebar visible)
- REQ-025: xl: 1280px (Large desktop, AI pane visible)
- REQ-026: 2xl: 1536px (Extra large)

### Components & Patterns
- REQ-027: WorkerLayout (root with demo context)
- REQ-028: DeviceFrame (iPhone-style frame)
- REQ-029: TabBar (bottom nav, 7 tabs)
- REQ-030: MobileHeader (iOS-style, back button, title)
- REQ-031: MobileCard (onClick, icon, title, subtitle, meta, status badge)
- REQ-032: MobileEmptyState (icon, title, description)
- REQ-033: SignatureCanvas (300x150, clear button, base64 PNG export)
- REQ-034: PhotoCapture (file input accept=image/*, capture=environment, multiple, preview grid, remove per photo)
- REQ-035: FieldRenderer (dynamic rendering of 16 checklist field types)
- REQ-036: StatusBadge (backgroundColor, color, status-based, rounded-full, px-2.5, py-0.5, text-xs)

### Field Types (Checklists & Forms)
- REQ-037: text (single line input)
- REQ-038: textarea (multi-line, placeholder, rows)
- REQ-039: number (numeric, min/max)
- REQ-040: yesno (binary Yes/No buttons, pass/fail)
- REQ-041: checkbox (single checkbox, acknowledgment)
- REQ-042: select (dropdown, single selection)
- REQ-043: multiselect (checkbox group, multiple selections)
- REQ-044: date (date picker)
- REQ-045: time (time picker)
- REQ-046: datetime (combined date/time picker)
- REQ-047: photo (camera capture, environment camera, preview, remove button)
- REQ-048: signature (canvas, clear button, width 300 height 150)
- REQ-049: attachment (file upload, multiple files)
- REQ-050: instruction (read-only display, no user input)
- REQ-051: notes (free text area, additional notes)
- REQ-052: action_trigger (create defect/action button)

### Data Adapter Hooks
- REQ-053: Location: `hooks/worker/screens/`
- REQ-054: Naming: `use-{screen-name}-data.ts`
- REQ-055: Structure: queries + mutations + enrichment + actions + return
- REQ-056: Pattern: useQuery for data, useMutation for actions, useMemo for enrichment
- REQ-057: Return: `{ data, actions, isLoading }`
- REQ-058: 51 hooks, one per screen
- REQ-059: Demo worker context hook: `use-demo-worker-context.ts` (workerId, activeProjectId, setActiveProject, worker, isLoading)

### Navigation System
- REQ-060: Stack-based navigation with returnTo support
- REQ-061: Deep linking support (returnTo parameter)
- REQ-062: Mobile list pattern (card layout, tap to navigate)

### CSS Variables & Design Tokens
- REQ-063: Status colors: `--status-{status}-bg/text`
- REQ-064: Priority colors: `--priority-{priority}-bg/text`
- REQ-065: Ticket wallet gradient backgrounds: `--ticket-gradient-1/2/3-start/end`
- REQ-066: Ticket state colors: `--ticket-valid/expiring/expired-bg/text`
- REQ-067: Usage: `backgroundColor: rgb(var(--status-${status}-bg))`

### File Structure
- REQ-068: Public routes: `app/(public)/w/` (QR flows, no auth)
- REQ-069: Worker components: `components/worker/` (layout, shared, per-tab folders)
- REQ-070: Worker hooks: `hooks/worker/screens/` + use-demo-worker-context.ts
- REQ-071: Worker shell: `worker-shell.tsx` (mobile frame)
- REQ-072: Barrel exports required for all module folders

## Screen List

### Tab 1: Tasks (1 screen)
| Screen | Purpose |
|--------|---------|
| TaskHub | Aggregated task list across modules (actions, SWMS, permits, checklists, prestarts), project selector dropdown, stats card, grouped by module, first 6 items per module, deep links with returnTo |

### Tab 2: Communication (3 screens)
| Screen | Purpose |
|--------|---------|
| Communications | Messages + assigned items tabs, switch tabs, unread count, sender, timestamp, attachment count |
| CommunicationDetail | Full message view, download attachments |
| Inbox | Notifications list, mark as read |

### Tab 3: Project (9 screens)
| Screen | Purpose |
|--------|---------|
| ModuleMenu | Navigation hub for project screens |
| Actions | Action list, urgent/normal grouping, priority filter, due date display |
| ActionDetail | Action details, status, priority, due date, assignee, description, attachments, "Mark Complete" button |
| Schedule | Worker's scheduled tasks, calendar view |
| Documents | Project files list, download functionality |
| Drawings | Issued drawings list, view metadata |
| Photos | Site photos, grid view |
| SiteDiaries | Site diary entries list, tap to view detail, read-only |
| SiteDiaryDetail | Full diary entry view |

### Tab 4: Safety (18 screens)
| Screen | Purpose |
|--------|---------|
| ModuleMenu | Navigation hub for safety screens |
| SignOn | Site sign-on/sign-off via QR or app |
| IncidentsList | Incident list, tap to view detail |
| IncidentDetail | View incident details, read-only |
| IncidentReport | Multi-step form (description, date/time, location, severity, involved workers, photos) |
| SwmsList | SWMS list, signed/unsigned filter |
| SwmsSign | SWMS sign screen (document sections, acknowledgment checkboxes, signature canvas, submit) |
| PermitsList | Permit list, tap to view detail |
| PermitApply | Permit application form (permitTypeId, startDate, endDate, location, description) |
| PermitDetail | View permit status, details |
| ToolboxList | Toolbox meetings list |
| ToolboxAttend | Toolbox attendance (QR flow: meeting details, worker selection, signature, submit) |
| SdsList | SDS library search |
| SdsDetail | SDS details view |
| SdsRequests | SDS request queue |
| SdsRequestCreate | SDS request form |
| InductionsList | Assigned inductions list |
| InductionDetail | 5-step wizard (profile, emergency contact, content, tickets, signature) |
| Compliance | Compliance summary, view-only |
| TicketWallet | Certification cards, tap to view detail |
| TicketCard | Individual certification display |
| TicketDetail | Certification details, view photos (front/back) |

### Tab 5: Quality (5 screens)
| Screen | Purpose |
|--------|---------|
| ModuleMenu | Navigation hub for quality screens |
| Checklists | Assigned checklists list, tap to conduct |
| ChecklistConduct | Dynamic checklist conductor (16 field types, conditional logic, progress tracking, save/complete) |
| Defects | Defect list, tap to view detail |
| DefectDetail | View defect status, details |

### Tab 6: Plant (11 screens)
| Screen | Purpose |
|--------|---------|
| ModuleMenu | Navigation hub for plant screens |
| Prestarts | Asset list, tap asset to start prestart |
| PrestartDetail | Asset context + checklist fields + photo + odometer readings |
| PrestartResult | Pass/fail screen (operational or maintenance + defects/actions) |
| PlantRequests | Asset booking request workflow |
| AssetsList | Asset list, tap to view detail |
| AssetDetail | Asset details + checklists, view history |
| AssetView | Asset QR view (details + maintenance history + enabled checklists) |
| PlantInductionsList | Plant-specific induction list |
| PlantInductionDetail | Plant induction completion |

### Tab 7: Profile (1 screen)
| Screen | Purpose |
|--------|---------|
| Profile | Worker profile, project switcher, certifications, settings |

## Workflows

### TaskHub Screen
1. Worker opens app → TaskHub (default screen)
2. Project selector dropdown (switch between assigned projects)
3. Stats card (pending tasks count)
4. Tasks grouped by module (Actions, SWMS, Permits, Checklists, Prestarts)
5. First 6 items per module shown
6. Tap task → Navigate to specific screen with returnTo=TaskHub
7. Complete task → Return to TaskHub

### SWMS Sign Workflow
1. Worker taps SWMS from list (status: approved)
2. Review document sections (scope, PPE, tasks, hazards, controls, emergency)
3. Acknowledge understanding (3 checkboxes: hazards, controls, PPE)
4. Draw signature on canvas
5. Submit → Signature stored as base64 PNG
6. Create swmsSignature record
7. Update swmsAssignment.acknowledgedAt
8. Return to list with confirmation

### Prestart Check Workflow
1. Worker scans QR or taps asset
2. Load prestartTemplate (assetId + templateId)
3. Render checklist fields (yesno, number, select, text, photo, signature, rating)
4. Fill required fields
5. Take photo (if requiresPhoto = true)
6. Enter odometer readings (km + hours)
7. Submit → Evaluate pass/fail
   - Pass: all required fields filled, all yesno = "yes", photo if required → Asset status: operational
   - Fail: any yesno = "no" → Asset status: maintenance + create defects (one per failed item) + create actionItems (one per defect)
8. Show result screen
   - Pass: "Asset ready", submitted timestamp, inspector name
   - Fail: "Asset out of service", list issues (3 max), "View Defects" button
9. Log activityLog (type: prestart_passed or prestart_failed)

### Checklist Conduct Workflow
1. Worker taps checklist from list
2. Load checklistTemplate + checklistInstance
3. Render dynamic fields (16 types)
4. Handle conditional logic (show/hide based on triggerFieldId)
5. Fill fields → Track progress (answered/total %)
6. Save as draft (status: in_progress, editable)
7. Create defect/action from field (action_trigger button, pre-fills description, links to instance)
8. Complete checklist (validate required fields → status: completed, immutable)
9. Response storage: `{ [fieldId]: value }` or `{ value, notes, attachmentIds, signature }`

### Incident Report Workflow
1. Worker taps "Report Incident"
2. Multi-step form:
   - What happened (textarea)
   - When (date/time picker)
   - Where (location input)
   - Severity (minor/moderate/serious)
   - Who involved (worker selector)
   - Photos (optional, multiple)
3. Submit → Status: open
4. Auto-notify supervisor
5. Confirmation screen
6. Navigate to incident list

### Toolbox Attendance Workflow (QR)
1. Worker scans meeting QR code
2. Opens public URL `/toolbox/attend/[qrCode]`
3. View meeting details (date, time, location, topics, facilitator, attachments)
4. Select worker from dropdown
5. Draw signature on canvas
6. Submit → Create toolboxAttendance (viaQr: true, signatureData: base64)
7. Confirmation screen with meeting summary

### Induction Completion Workflow (QR)
1. Worker scans project QR or receives invite link
2. Opens public URL `/induct/[qrCode]` or `/induct/invite/[shareCode]`
3. Welcome screen → Email input (or pre-filled for invite)
4. Start 5-step wizard:
   - Step 1 Profile: fullName, email, phone, trade, employer
   - Step 2 Emergency Contact: name, phone, relationship
   - Step 3 Content: Dynamic content blocks (acknowledgments + uploads per induction type)
   - Step 4 Tickets: Upload certifications (cert number, expiry date, photos front/back), multiple required types
   - Step 5 Signature: Declaration, signature canvas, hash generation
5. Submit → Status: awaiting_review
6. Create inductionCompletion (link to inviteId if invite flow)
7. Success screen

### Sign-On/Sign-Off Workflow (QR)
1. Worker arrives at site → Scans project QR
2. Opens public URL `/sign-in/[code]`
3. Load project details + worker list
4. Three tabs: Worker, Visitor, Delivery
5. Worker tab:
   - Select worker from dropdown (all assigned workers)
   - Sign in/out button
   - Inline success confirmation
6. Visitor tab:
   - Name, company, phone, purpose inputs
   - Creates visitor record (entryType: visitor)
7. Delivery tab:
   - Name, company, phone inputs
   - Creates delivery record (entryType: delivery)
8. System checks:
   - Valid induction (inductionCompletions WHERE workerId AND status='completed' AND expiresAt > now)
   - Required SWMS (acknowledgedSwmsIds)
   - Prestart notice (acknowledgment)
9. Create attendanceLog (signInTime or signOutTime)
10. Calculate hours worked (sign-in to sign-out)

## Acceptance Criteria

### AC-001: Navigation
- 7 bottom tabs visible at all times
- Active tab highlighted
- Tab bar fixed at bottom
- Tap tab → Navigate to screen
- Back button on iOS-style header

### AC-002: Touch Targets
- All interactive elements 44x44px minimum
- Large tap areas for buttons
- Adequate spacing between elements
- No accidental taps

### AC-003: Typography
- Bold, easily readable fonts
- High contrast text (outdoor visibility)
- Clear visual hierarchy
- Appropriate font sizes (see ui-system.md)

### AC-004: Photo Capture
- Rear-facing camera default (environment)
- Multiple photos supported
- Preview thumbnails
- Delete per photo
- Max limit configurable

### AC-005: Signature Canvas
- 300x150px canvas
- Clear button
- Mouse/touch drawing support
- Export as base64 PNG (data:image/png;base64,...)
- Signature validation (not empty)

### AC-006: Form Fields
- 16 field types supported (REQ-037 to REQ-052)
- Conditional logic (show/hide based on triggerFieldId)
- Required field validation
- Clear error messages
- Accessible inputs (WCAG AA)

### AC-007: Checklist Progress
- Progress bar (answered/total %)
- Visual indicator (0-100%)
- Exclude instruction fields from count
- Update real-time as fields filled

### AC-008: Save vs Complete
- Save as draft → status: in_progress (editable)
- Complete → status: completed (immutable, validate required fields)
- Clear button distinction
- Confirmation on complete

### AC-009: QR Code Access
- Public routes `/w/` (no auth required)
- 7 QR flows functional (see mobile-qr.md)
- Share code validation (active, not expired, not over max uses)
- Increment usage counter
- Show confirmation + next steps

### AC-010: Status Badges
- Color-coded by status/priority
- CSS variable color system
- Rounded-full shape
- Text-xs size
- px-2.5, py-0.5 padding

### AC-011: Empty States
- Icon + title + description
- Centered layout
- Clear call-to-action (if applicable)

### AC-012: Loading States
- Skeleton placeholders
- Pulse animation
- Match component structure
- Fast perceived performance

### AC-013: Demo Worker Context
- Single test worker (email: test.worker@example.com or name: Test Worker)
- Project switcher in Profile
- All data filtered by worker + activeProjectId
- WorkerLayout wraps all screens

### AC-014: Offline Architecture (Future)
- Service worker caching
- IndexedDB local storage
- Sync queue for offline mutations
- Conflict resolution on reconnect
- Priority screens: PrestartConduct, ChecklistConduct, IncidentReport, SignIn/SignOut

### AC-015: Adapter Hooks
- 51 hooks (one per screen) in `hooks/worker/screens/`
- Naming: `use-{screen-name}-data.ts`
- Return: `{ data, actions, isLoading }`
- Separation: online (Convex) vs offline (IndexedDB) via adapter pattern

### AC-016: Deep Linking
- Screens support returnTo parameter
- Navigate after task completion
- Stack-based navigation
- Back button returns to returnTo if provided

### AC-017: Ticket Wallet
- Certification cards display
- Gradient backgrounds (ticket-gradient-1/2/3)
- Valid/expiring/expired colors
- Tap to view detail (photos front/back)

### AC-018: Mobile Responsiveness
- Responsive breakpoints (sm, md, lg, xl, 2xl)
- Mobile-first utility classes
- Sheet component for mobile navigation/menus
- SplitPreviewLayout: editor only on mobile, preview in Sheet

## QR Code Flows (7 Public Entry Points)

### Flow 1: Asset QR → Prestart (`/prestart/[qrCode]`)
**Entry:** Worker scans asset QR sticker
**Flow:**
1. Browser opens `/prestart/QR-123ABC`
2. Resolve QR to asset + template
3. Render prestart form (checklist + photo + odometer)
4. Submit via `prestarts.submitPublic`
5. Pass/fail evaluation:
   - Pass: all yesno="yes", photo if required → status: operational
   - Fail: any yesno="no" → status: maintenance + auto-create defects + actions
6. Show result screen

**API:**
```typescript
export const getByQRCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const asset = await ctx.db.query('assets')
      .withIndex('by_qrCode', q => q.eq('qrCode', args.qrCode))
      .first();
    const template = await ctx.db.query('prestartTemplates')
      .withIndex('by_assetType', q => q.eq('assetType', asset.assetType))
      .filter(q => q.eq(q.field('publicAccess'), true))
      .first();
    return { asset, template };
  }
});
```

### Flow 2: Project QR → Sign-In (`/sign-in/[code]`)
**Entry:** Worker scans project QR at site entrance
**Three Tabs:**
1. **Worker:** Dropdown selection → Sign in/out button → Inline confirmation
2. **Visitor:** Name, company, phone, purpose → Creates visitor record (entryType: visitor)
3. **Delivery:** Name, company, phone → Creates delivery record (entryType: delivery)

**System Checks:**
- Valid induction (status='completed', not expired)
- Required SWMS signed
- Prestart notice acknowledgment

**Flow:**
```typescript
// Find project (linear scan, no index)
const projects = await ctx.db.query('projects').collect();
const project = projects.find(p => p.metadata?.qrCode?.code === code);

// Get workers + today's attendance
const workers = await ctx.db.query('workers')
  .withIndex('by_project', q => q.eq('projectId', project._id))
  .collect();
const today = new Date().toISOString().split('T')[0];
const attendance = await ctx.db.query('attendanceLogs')
  .withIndex('by_project_date', q =>
    q.eq('projectId', project._id).eq('date', today))
  .collect();
```

### Flow 3: Induction QR/Invite (`/induct/[qrCode]` or `/induct/invite/[shareCode]`)
**5-Step Wizard:**
1. **Profile:** fullName, email, phone, trade, employer
2. **Emergency Contact:** name, phone, relationship
3. **Content:** Dynamic acknowledgments + uploads per induction type
4. **Tickets:** Upload certifications (cert number, expiry, photos front/back), multiple required types
5. **Signature:** Declaration + signature canvas + hash generation

**Submit:** Status → awaiting_review, create inductionCompletion, link to inviteId if invite flow

### Flow 4: Toolbox QR → Attend (`/toolbox/attend/[qrCode]`)
**Flow:**
1. Scan meeting QR
2. View meeting details (date, topics, facilitator, attachments)
3. Worker dropdown selection
4. Signature canvas
5. Submit → Create toolboxAttendance (viaQr: true, signatureData: base64)
6. Confirmation with meeting summary

### Flow 5: SWMS Share Link (`/swms/view/[code]`)
**External Workers:**
1. Open share link → `/swms/view/AbCdEfGhIjKl`
2. View SWMS document (all sections)
3. External signature:
   - Name input (required)
   - Company input (optional)
   - Signature canvas
4. Submit → `swms.addExternalSignature`
5. Duplicate name check (case-insensitive)

### Flow 6: Asset View (`/asset/[qrCode]`)
**View Only:**
- Asset details (name, make, model, status)
- Maintenance history
- Enabled checklists (isEnabledForQr = true)
- Optional "Report Issue" (requires auth)

### Flow 7: Document Upload (`/upload/[shareCode]`)
**Future:** File upload via share code

## Prestart Pass/Fail Evaluation

### Algorithm
```typescript
const evaluate = (responses, photoIds, template) => {
  const issues: Issue[] = [];

  // Check all fields
  for (const section of template.checklist.sections) {
    for (const field of section.fields) {
      // Required field empty
      if (field.required && !responses[field.id]) {
        issues.push({
          itemId: field.id,
          description: `${field.label} is required`
        });
      }

      // Yesno field = no (failure)
      if (field.type === 'yesno' && responses[field.id] === 'no') {
        issues.push({
          itemId: field.id,
          description: `${field.label} failed`
        });
      }
    }
  }

  // Photo required
  if (template.requiresPhoto && photoIds.length === 0) {
    issues.push({
      itemId: 'photo',
      description: 'Photo evidence required'
    });
  }

  return {
    passed: issues.length === 0,
    issues
  };
};
```

### On Failure (Backend)
```typescript
// Update asset status
await ctx.db.patch(assetId, { status: 'maintenance' });

// Create defects (one per failed item)
for (const issue of issues) {
  const defectId = await ctx.db.insert('defects', {
    projectId,
    assetId,
    category: 'safety',
    priority: 'high',
    title: issue.description,
    sourceType: 'prestart',
    sourceId: submissionId,
    status: 'open',
    createdAt: nowIso()
  });
}

// Create action items (one per defect)
for (const issue of issues) {
  await ctx.db.insert('actionItems', {
    projectId,
    title: `Fix: ${issue.description}`,
    priority: 'high',
    status: 'open',
    assignedTo: workerId,
    sourceType: 'prestart',
    sourceId: submissionId,
    createdAt: nowIso()
  });
}

// Log activity
await ctx.db.insert('activityLogs', {
  projectId,
  assetId,
  type: 'prestart_failed',
  description: `Pre-start check failed: ${issues.length} issues`,
  workerId,
  timestamp: nowIso()
});
```

### Result Screens

**Pass:**
```
┌─────────────────────────────────────┐
│        Pre-Start Result             │
├─────────────────────────────────────┤
│                                     │
│         ✅ PASSED                   │
│                                     │
│ Excavator #23 is ready for use      │
│                                     │
│ Submitted: 21 Jan 2025 10:30        │
│ Inspector: Test Worker              │
│                                     │
│ All checks completed successfully   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Done                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Fail:**
```
┌─────────────────────────────────────┐
│        Pre-Start Result             │
├─────────────────────────────────────┤
│                                     │
│         ❌ FAILED                   │
│                                     │
│ Excavator #23 is OUT OF SERVICE     │
│                                     │
│ Issues found (3):                   │
│ • Hydraulic leaks present          │
│ • Fire extinguisher expired        │
│ • Photo evidence missing           │
│                                     │
│ Defects and actions have been       │
│ created automatically.              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │    View Defects                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Checklist Conditional Logic

### Pattern
Fields show/hide based on other field values.

### Example
```typescript
{
  id: 'explain_why',
  type: 'textarea',
  label: 'Explain why',
  conditionalLogic: {
    triggerFieldId: 'fire_extinguishers_present',
    operator: 'equals', // 'equals', 'not_equals', 'contains', 'greater_than', etc.
    value: 'no',
    action: 'show' // or 'hide'
  }
}
```

### Evaluation
```typescript
const shouldShowField = (field: Field, responses: Record<string, any>) => {
  if (!field.conditionalLogic) return true;

  const { triggerFieldId, operator, value, action } = field.conditionalLogic;
  const triggerValue = responses[triggerFieldId];

  let condition = false;
  switch (operator) {
    case 'equals':
      condition = triggerValue === value;
      break;
    case 'not_equals':
      condition = triggerValue !== value;
      break;
    case 'contains':
      condition = Array.isArray(triggerValue) && triggerValue.includes(value);
      break;
    case 'greater_than':
      condition = Number(triggerValue) > Number(value);
      break;
    case 'less_than':
      condition = Number(triggerValue) < Number(value);
      break;
  }

  return action === 'show' ? condition : !condition;
};
```

## Response Storage Formats

### Simple Value
```typescript
responses['field_1'] = "value";
responses['field_2'] = 42;
responses['field_3'] = true;
```

### With Notes
```typescript
responses['field_4'] = {
  value: "yes",
  notes: "All OK, minor wear on tire"
};
```

### With Attachments
```typescript
responses['field_5'] = {
  value: "yes",
  attachments: [
    {
      id: Id<'mediaFiles'>,
      name: "photo.jpg",
      type: "image/jpeg",
      size: 123456,
      url: "https://..."
    }
  ]
};
```

### With Signature
```typescript
responses['field_6'] = {
  value: "signed",
  signature: {
    data: "data:image/png;base64,iVBORw0KGgo...",
    signedBy: workerId,
    signedAt: "2025-01-21T10:30:00Z"
  }
};
```

### Multi-Select
```typescript
responses['field_7'] = {
  value: ["option_1", "option_3", "option_5"]
};
```

### Photo Field
```typescript
responses['field_8'] = {
  value: "captured",
  photoIds: [Id<'mediaFiles'>, Id<'mediaFiles'>]
};
```

## Share Code Generation

### SWMS Share Codes
12-character random alphanumeric (case-sensitive)

```typescript
const generateShareCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Example: AbCdEfGhIjKl
```

### Invite Share Codes
10-character timestamp-based

```typescript
const generateInviteCode = () => {
  const timestamp = Date.now().toString(36); // Base36 encoding
  const random = Math.random().toString(36).substring(2, 6);
  return `UPL-${timestamp.substring(0, 4)}${random}`;
};

// Example: UPL-2x5k8p
```

### QR Code Resolution

| Type | Format | Example | Index | Collision Risk |
|------|--------|---------|-------|----------------|
| Asset | Freeform | `QR-123ABC` | `by_qrCode` | Low (org scoped) |
| Project | Metadata | `PROJ456` | None | Medium (linear scan) |
| SWMS | 12-char random | `AbCdEfGhIjKl` | `by_shareCode` | Very low |
| Invite | 10-char timestamp | `UPL-2x5k8p` | `by_shareCode` | Very low |

## Adapter Hook Examples

### Example 1: useTaskHubScreenData
Aggregates tasks across 5 modules

```typescript
export function useTaskHubScreenData({
  workerId,
  projectId
}: {
  workerId: Id<'workers'>;
  projectId: Id<'projects'>;
}) {
  // Parallel queries
  const actions = useQuery(api.actions.listByWorker, { workerId, projectId });
  const swms = useQuery(api.swms.listApprovedForWorker, { workerId, projectId });
  const permits = useQuery(api.permits.listByWorker, { workerId, projectId });
  const checklists = useQuery(api.checklists.listQualityByAssignee, { workerId });
  const prestarts = useQuery(api.assets.listByProjectWithPrestartStatus, { projectId });

  // Aggregate into sections
  const sections = useMemo(() => {
    if (!actions || !swms || !permits || !checklists || !prestarts) return [];

    return [
      {
        module: 'project',
        title: 'Actions',
        items: actions
          .filter(a => a.status !== 'completed')
          .slice(0, 6)
          .map(a => ({
            id: a._id,
            title: a.title,
            subtitle: `Due: ${formatDate(a.dueDate)}`,
            meta: a.priority,
            screen: 'action-detail',
            params: { actionId: a._id },
            returnTo: 'task-hub'
          })),
        total: actions.filter(a => a.status !== 'completed').length
      },
      // ... 4 more sections (SWMS, Permits, Checklists, Prestarts)
    ];
  }, [actions, swms, permits, checklists, prestarts]);

  const totalCount = sections.reduce((sum, s) => sum + s.total, 0);

  return {
    sections,
    totalCount,
    isLoading: !actions || !swms || !permits || !checklists || !prestarts
  };
}
```

### Example 2: useChecklistConductScreenData
Handles dynamic checklist rendering with progress tracking

```typescript
export function useChecklistConductScreenData({
  instanceId,
  workerId
}: {
  instanceId: Id<'checklistInstances'>;
  workerId: Id<'workers'>;
}) {
  // Load instance + template
  const instance = useQuery(api.checklists.getInstance, { id: instanceId });
  const template = useQuery(api.checklists.getTemplate, {
    id: instance?.templateId
  });

  // Mutations
  const saveResponse = useMutation(api.checklists.saveResponse);
  const saveAllResponses = useMutation(api.checklists.saveAllResponses);
  const complete = useMutation(api.checklists.completeChecklist);
  const createDefect = useMutation(api.checklists.createDefectFromField);
  const createAction = useMutation(api.checklists.createActionFromField);

  // Local state for responses
  const [responses, setResponses] = useState<Record<string, any>>(
    instance?.responses || {}
  );

  // Sync instance responses to local state
  useEffect(() => {
    if (instance?.responses) {
      setResponses(instance.responses);
    }
  }, [instance?.responses]);

  // Progress tracking
  const progress = useMemo(() => {
    if (!template) return { answered: 0, total: 0, percentage: 0 };

    const allFields = template.sections
      .flatMap(s => s.fields)
      .filter(f => f.type !== 'instruction'); // Exclude instruction fields

    const answered = Object.keys(responses).filter(k => {
      const value = responses[k];
      return value !== undefined && value !== null && value !== '';
    }).length;

    return {
      answered,
      total: allFields.length,
      percentage: allFields.length > 0 ? (answered / allFields.length) * 100 : 0
    };
  }, [template, responses]);

  // Validation
  const validate = () => {
    const errors: Record<string, string> = {};

    if (!template) return errors;

    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.required && !responses[field.id]) {
          errors[field.id] = `${field.label} is required`;
        }
      }
    }

    return errors;
  };

  // Actions
  const actions = {
    updateResponse: (fieldId: string, value: any) => {
      setResponses(prev => ({ ...prev, [fieldId]: value }));
    },

    saveProgress: async () => {
      await saveAllResponses({ instanceId, responses });
    },

    completeChecklist: async () => {
      const errors = validate();
      if (Object.keys(errors).length > 0) {
        throw new Error('Please fill all required fields');
      }
      await complete({ instanceId });
    },

    createDefectFromField: async (fieldId: string) => {
      const field = template?.sections
        .flatMap(s => s.fields)
        .find(f => f.id === fieldId);

      if (!field) return;

      await createDefect({
        instanceId,
        fieldId,
        description: `${field.label}: ${responses[fieldId]}`,
        priority: 'high'
      });
    }
  };

  return {
    instance,
    template,
    responses,
    progress,
    actions,
    isLoading: instance === undefined || template === undefined
  };
}
```

### Example 3: useSwmsSignScreenData
SWMS signature flow with acknowledgment tracking

```typescript
export function useSwmsSignScreenData({
  swmsId,
  workerId
}: {
  swmsId: Id<'swmsDocuments'>;
  workerId: Id<'workers'>;
}) {
  // Load SWMS document
  const swms = useQuery(api.swms.getDocument, { id: swmsId });
  const assignment = useQuery(api.swms.getAssignment, { swmsId, workerId });

  // Mutations
  const signSwms = useMutation(api.swms.signSwms);

  // Local state for acknowledgments
  const [acknowledgments, setAcknowledgments] = useState({
    hazards: false,
    controls: false,
    ppe: false
  });

  const [signatureData, setSignatureData] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      acknowledgments.hazards &&
      acknowledgments.controls &&
      acknowledgments.ppe &&
      signatureData !== null
    );
  }, [acknowledgments, signatureData]);

  const actions = {
    toggleAcknowledgment: (key: keyof typeof acknowledgments) => {
      setAcknowledgments(prev => ({ ...prev, [key]: !prev[key] }));
    },

    setSignature: (data: string) => {
      setSignatureData(data);
    },

    submit: async () => {
      if (!canSubmit) {
        throw new Error('Complete all acknowledgments and signature');
      }

      await signSwms({
        swmsId,
        workerId,
        signatureData: signatureData!,
        acknowledgments
      });
    }
  };

  return {
    swms,
    assignment,
    acknowledgments,
    signatureData,
    canSubmit,
    actions,
    isLoading: swms === undefined || assignment === undefined
  };
}
```

## Design Philosophy

### Core Principle
**Simple = field worker completes task in minimal taps, no distractions, clear feedback**

### Optimized For
- **Harsh conditions:** Sun glare, gloves, noise, outdoor environment
- **Quick interactions:** Sign SWMS, submit prestart, report incident in seconds
- **Task completion:** Not exploration or discovery
- **Offline capability:** Future support for disconnected operation

### Anti-Patterns to Avoid
- ❌ Tiny touch targets (< 44px)
- ❌ Low contrast text (outdoor visibility)
- ❌ Excessive text input (use camera, signature, select instead)
- ❌ Hidden features (no hamburger menus, show all options)
- ❌ Unclear feedback (always confirm actions)
- ❌ Complex navigation (max 2 levels deep)

## Worker Capabilities

### Can Do ✅
- View assigned tasks across modules
- Sign SWMS documents
- Submit prestart checks
- Conduct quality checklists
- Report incidents
- Apply for permits
- Attend toolbox meetings
- View site diaries (read-only)
- Upload certifications
- Complete inductions
- Sign in/out via QR
- View SDS library
- Switch between assigned projects
- View defects (assigned to them)
- View action items (assigned to them)

### Cannot Do ❌
- Create new SWMS documents
- Approve permits
- Delete incidents
- Edit site diaries
- Assign tasks to others
- Change project settings
- View other workers' data
- Access admin functions
- Approve inductions
- Create new assets
- Modify asset configurations
- Access financial data
- Change organization settings

## PWA Configuration

### manifest.json
```json
{
  "name": "Project Construction Mobile",
  "short_name": "PCon Mobile",
  "description": "Field worker task management",
  "start_url": "/w/tasks",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Service Worker Strategy (Future)
```typescript
// sw.js
const CACHE_NAME = 'pcon-mobile-v1';
const PRIORITY_SCREENS = [
  '/w/tasks',
  '/w/safety/sign-on',
  '/w/plant/prestarts',
  '/w/quality/checklists',
  '/w/safety/incidents/report'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRIORITY_SCREENS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## Field Type Implementation Details

### Field Type 1-2: Text & Textarea
```html
<input
  type="text"
  placeholder="Enter value"
  value={responses[field.id] || ''}
  onChange={(e) => updateResponse(field.id, e.target.value)}
  required={field.required}
/>

<textarea
  rows={field.rows || 4}
  placeholder={field.placeholder}
  value={responses[field.id] || ''}
  onChange={(e) => updateResponse(field.id, e.target.value)}
  required={field.required}
/>
```

### Field Type 3: Number
```html
<input
  type="number"
  min={field.min}
  max={field.max}
  step={field.step || 1}
  value={responses[field.id] || ''}
  onChange={(e) => updateResponse(field.id, Number(e.target.value))}
  required={field.required}
/>
```

### Field Type 4: Yes/No
```tsx
<div className="flex gap-2">
  <button
    className={`flex-1 py-3 rounded ${responses[field.id] === 'yes' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
    onClick={() => updateResponse(field.id, 'yes')}
  >
    Yes
  </button>
  <button
    className={`flex-1 py-3 rounded ${responses[field.id] === 'no' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
    onClick={() => updateResponse(field.id, 'no')}
  >
    No
  </button>
</div>
```

### Field Type 11: Photo
```tsx
<PhotoCapture
  multiple={field.multiple || false}
  maxPhotos={field.maxPhotos || 5}
  onPhotosChange={(photoIds) => updateResponse(field.id, { value: 'captured', photoIds })}
  existingPhotos={responses[field.id]?.photoIds || []}
/>
```

### Field Type 12: Signature
```tsx
<SignatureCanvas
  width={300}
  height={150}
  onSignatureChange={(dataUrl) => updateResponse(field.id, {
    value: 'signed',
    signature: {
      data: dataUrl,
      signedBy: workerId,
      signedAt: new Date().toISOString()
    }
  })}
/>
```

### Field Type 16: Action Trigger
```tsx
<button
  className="w-full py-3 bg-orange-600 text-white rounded"
  onClick={() => {
    if (field.actionType === 'create_defect') {
      actions.createDefectFromField(field.id);
    } else if (field.actionType === 'create_action') {
      actions.createActionFromField(field.id);
    }
  }}
>
  {field.label}
</button>
```

## Drawing Logic for Signature

### Complete Implementation
```typescript
export function SignatureCanvas({
  width = 300,
  height = 150,
  onSignatureChange
}: {
  width?: number;
  height?: number;
  onSignatureChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    onSignatureChange('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button onClick={clear} className="mt-2 px-4 py-2 bg-gray-200 rounded">
        Clear
      </button>
    </div>
  );
}
```

## Progress Tracking Formula

### Implementation
```typescript
const calculateProgress = (template: ChecklistTemplate, responses: Record<string, any>) => {
  // Get all fields excluding instruction type
  const allFields = template.sections
    .flatMap(s => s.fields)
    .filter(f => f.type !== 'instruction');

  // Count answered fields
  const answered = Object.keys(responses).filter(fieldId => {
    const value = responses[fieldId];

    // Check if value is not empty
    if (value === undefined || value === null || value === '') return false;

    // For arrays (multiselect)
    if (Array.isArray(value) && value.length === 0) return false;

    // For objects with value property
    if (typeof value === 'object' && 'value' in value) {
      return value.value !== undefined && value.value !== null && value.value !== '';
    }

    return true;
  }).length;

  return {
    answered,
    total: allFields.length,
    percentage: allFields.length > 0 ? Math.round((answered / allFields.length) * 100) : 0
  };
};
```

## Open Questions

### QR Code System
- How to handle QR collision across orgs?
- Max uses enforcement on share codes?
- Expiry auto-cleanup strategy?

### Offline Sync
- Conflict resolution when two workers edit same checklist offline?
- Photo upload queue priority (cellular vs wifi)?
- Retry strategy for failed submissions?

### Performance
- Lazy load checklist templates (paginate sections)?
- Image compression on device before upload?
- Cache invalidation strategy for worker data?

### Security
- Rate limiting on public QR endpoints?
- Share code brute-force protection?
- External signature verification?

### UX
- Auto-save interval for long checklists?
- Warning before navigating away from unsaved form?
- Photo preview zoom/pinch support?

## Dependencies

### External
- Next.js 16 App Router
- React 19
- TypeScript 5
- Convex (queries/mutations)
- ShadCN (UI primitives)
- Tailwind CSS v4
- Lucide React (icons)

### Internal Specs
- mobile-qr.md (QR code public flows)
- ui-system.md (design system, components, CSS variables)
- foundation.md (worker profile, org/project structure)
- 04-schema.md (database tables)
- 05-ai-system.md (Chief integration, not directly used in mobile)
- 06-ui-system.md (component library)
- 09-standards.md (coding standards, file structure)

### Tables Referenced
- workers (profile, assignments)
- workerAssignments (project assignments)
- competencyRecords (certifications)
- swmsDocuments, swmsSignatures, swmsAssignments
- toolboxMeetings, toolboxAttendance
- attendanceLogs
- inductionTypes, inductionInvites, inductionCompletions
- permitInstances
- incidentReports
- checklistTemplates, checklistInstances
- prestartTemplates (now assetChecklistConfigs), prestartSubmissions
- assets
- defects
- actionItems
- mediaFiles
- scheduleShares (QR codes)
- sdsLibrary
- notifications
- communications, communicationRecipients

### Components Referenced
- WorkerLayout (root layout with demo context)
- DeviceFrame (iPhone-style frame)
- TabBar (bottom navigation)
- MobileHeader (iOS-style header)
- MobileCard (list item pattern)
- MobileEmptyState (empty state pattern)
- SignatureCanvas (signature capture)
- PhotoCapture (camera + preview)
- FieldRenderer (dynamic field rendering)
- StatusBadge (status display)
- Sheet (mobile slide-in panel)
- AssetPickerDialog (cross-module asset selection)

### Hooks Referenced
- use-demo-worker-context.ts (worker identity + project)
- 51 screen-specific hooks in `hooks/worker/screens/`
- useQuery, useMutation (Convex)
- useMemo, useCallback (React optimization)

### Future Dependencies
- Service Worker (offline caching)
- IndexedDB (offline storage)
- Sync Queue (offline mutations)
- Conflict Resolution (offline sync)
