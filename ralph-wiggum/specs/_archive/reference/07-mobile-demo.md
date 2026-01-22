# 07: Mobile Demo

> Complete specification for mobile simulator - worker persona, 51 screens, QR flows, public access patterns

---

## 1. Purpose & Scope

### What This Covers
- Worker persona definition and capabilities
- All 51 mobile screens (7 tabs, 9 submodules)
- All interaction types (signing, forms, checklists, QR, photos)
- Data flow for each screen
- QR code flows (7 public entry points)
- Public access patterns (no-auth flows)
- Adapter hook architecture
- Navigation system (stack-based with returnTo)

### What This Does NOT Cover
- Desktop platform UI (see 06-ui-system.md)
- Business logic (see 03-domain-model.md)
- Authentication (deferred)
- Production mobile app architecture

### Relationship to Other Specs
- **Depends on:** 03-domain-model.md (entities), 04-schema.md (data structure)
- **Feeds into:** Implementation, QR code generation, public access flows

---

## 2. Overview

The mobile simulator demonstrates field worker interactions with the system. It's a **demo tool**, not a production mobile app.

### Key Characteristics
- **Worker Persona:** Simulated field worker with assigned tasks, certifications, permissions
- **No Auth:** Single demo worker (identified by email/name match)
- **Mobile-First UI:** Touch-optimized, simplified for field conditions
- **QR Code Entry:** Many flows start from scanning QR on site
- **Offline-Ready Design:** Architecture supports future offline capability
- **51 Screens:** Complete coverage of worker touchpoints
- **7 Tabs:** Tasks, Communication, Project, Safety, Quality, Plant, Profile

### Philosophy
**Simple = field worker completes task in minimal taps, no distractions, clear feedback**

The mobile experience is optimized for:
- Harsh conditions (sun glare, gloves, noise)
- Quick interactions (sign SWMS, submit prestart, report incident)
- Task completion (not exploration)
- Offline capability (future)

---

## 3. Core Concepts

### Concept 1: Worker Persona
A simulated field worker with identity, permissions, assigned work.

**Attributes:**
- Name, email, phone
- Trade (e.g., Carpenter, Electrician)
- Certifications (Working at Heights, Confined Space, etc.)
- Assigned projects (can switch between)
- Current project (context for all screens)

**Permissions:**
- View assigned tasks
- Sign SWMS documents
- Complete checklists
- Submit prestarts
- Report incidents
- Attend toolbox meetings
- Request plant/equipment
- Upload documents

**Demo Mode:**
- No authentication required
- Single test worker identified by email match
- Project switcher in profile
- All data filtered by worker + active project

---

### Concept 2: Mobile-First Interactions
Touch-optimized, simplified UI for field conditions.

**Design Principles:**
- Large touch targets (44x44px minimum)
- Bold typography (easily readable)
- High contrast (outdoor visibility)
- Minimal text input (use camera/signature/select)
- Progressive disclosure (show only relevant fields)
- Clear feedback (success/error states)
- Offline-ready architecture (future)

**Interaction Types:**
1. **Signing:** Canvas-based signature capture
2. **Photo Capture:** Camera with rear-facing default
3. **Form Submission:** Optimized inputs, minimal typing
4. **QR Scanning:** Entry point for many flows
5. **List Navigation:** Tap to detail, pull to refresh
6. **Checklist Conduct:** Dynamic field rendering

---

### Concept 3: QR Code Entry Points
Many flows start from scanning a QR code on site.

**QR Flow Pattern:**
1. Worker arrives at site/equipment
2. Scans QR code (printed sign/sticker)
3. Mobile browser opens public URL
4. No auth required (code = access grant)
5. Complete task (sign-in, prestart, sign SWMS)
6. Confirmation shown
7. Optional: Continue to full app

**Public QR Flows:**
- Prestart submission (`/prestart/[qrCode]`)
- Site sign-in/sign-out (`/sign-in/[code]`)
- Induction completion (`/induct/[qrCode]`)
- Toolbox attendance (`/toolbox/attend/[qrCode]`)
- SWMS viewing (`/swms/view/[code]`)
- Asset view (`/asset/[qrCode]`)
- Document upload (`/upload/[shareCode]`)

---

### Concept 4: Offline-First (Future)
Design now for eventual offline capability.

**Strategy:**
- Service worker for caching
- IndexedDB for local storage
- Sync queue for offline mutations
- Conflict resolution on reconnect

**Priority Screens for Offline:**
1. PrestartConduct (equipment checks)
2. ChecklistConduct (inspections)
3. IncidentReport (safety critical)
4. SignIn/SignOut (attendance)

**Constraints:**
- Convex requires online connection (current)
- No offline-first database (current)
- Signatures/photos stored locally until upload

---

## 4. Detailed Specification

### 4.1 Worker Persona

#### Profile Structure
```typescript
type WorkerPersona = {
  _id: Id<'workers'>;
  orgId: Id<'orgs'>;
  name: string;
  email: string;
  phone: string;
  trade: string;
  employerName: string;
  status: 'active' | 'inactive';

  // Certifications
  certifications: Certification[];

  // Project assignments
  assignedProjectIds: Id<'projects'>[];

  // Current context (demo state)
  activeProjectId: Id<'projects'>;
};

type Certification = {
  _id: Id<'workerCertifications'>;
  certificationTypeId: Id<'certificationTypes'>;
  name: string; // e.g., "Working at Heights"
  number: string; // License/cert number
  expiryDate: string; // ISO date
  status: 'valid' | 'expiring_soon' | 'expired';
  photoIds: Id<'mediaFiles'>[]; // Front/back photos
};
```

#### Demo Worker Setup
```typescript
// Demo worker identified by email match
const DEMO_WORKER_EMAIL = 'test.worker@example.com';

// Or by name match
const DEMO_WORKER_NAME = 'Test Worker';

// Provider gives all screens access to:
const demoWorkerContext = {
  workerId: Id<'workers'>,
  activeProjectId: Id<'projects'>,
  setActiveProject: (projectId: Id<'projects'>) => void,
  worker: WorkerPersona,
  isLoading: boolean
};
```

#### Capabilities
What the demo worker can do:
- ✅ View assigned tasks (actions, SWMS, permits, checklists, prestarts)
- ✅ Sign SWMS documents
- ✅ Complete checklists (quality, safety, asset)
- ✅ Submit prestarts (pass/fail evaluation)
- ✅ Report incidents
- ✅ Attend toolbox meetings
- ✅ Request plant/equipment
- ✅ Upload documents
- ✅ View compliance status
- ✅ View ticket wallet
- ✅ Sign in/out of site
- ❌ Approve anything (supervisor function)
- ❌ Create templates (admin function)
- ❌ Assign tasks (manager function)

---

### 4.2 Screen Inventory

#### Tab Structure
```
┌─────────────────────────────────────┐
│   Worker Mobile Simulator           │
├─────────────────────────────────────┤
│                                     │
│  [Screen Content Area]              │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Tasks] [Comms] [Project] [Safety] │
│ [Quality] [Plant] [Profile]         │
└─────────────────────────────────────┘
```

---

#### Tab 1: Tasks (1 screen)

**Purpose:** Unified hub showing all assigned work across modules

| Screen | Purpose | Interactions | Data Hook |
|--------|---------|--------------|-----------|
| TaskHub | Aggregated task list | Filter, tap to navigate | `useTaskHubScreenData` |

**TaskHub Screen Details:**

```
┌─────────────────────────────────────┐
│ ← Back        Tasks                 │
├─────────────────────────────────────┤
│ Project: [Harbor Bridge ▼]          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 12 Active Tasks                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Project Actions (3)    [Open →]    │
│ ┌─────────────────────────────────┐ │
│ │ [!] Install scaffolding Lvl 3   │ │
│ │     Due: Today                  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [!] Fix defect #127             │ │
│ │     Due: 2 days                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Safety SWMS (2)       [Open →]     │
│ ┌─────────────────────────────────┐ │
│ │ [S] Concrete Pouring v1.2       │ │
│ │     Unsigned                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Quality Checklists (4) [Open →]    │
│ Plant Prestarts (3)    [Open →]    │
└─────────────────────────────────────┘
```

**Data Aggregation:**
- Project actions (status: open, in_progress)
- Safety SWMS (unsigned by worker)
- Safety permits (status: pending)
- Quality checklists (status: in_progress)
- Plant prestarts (pending for assets)

**Features:**
- Project selector dropdown (switches context)
- Stats card (total active count)
- Grouped by module
- First 6 items per module
- "Open →" navigates to full list
- Deep links with returnTo support

**API Calls:**
```typescript
// Hook aggregates across modules
const actions = useQuery(api.actions.listByWorker, { workerId, projectId });
const swms = useQuery(api.swms.listApprovedForWorker, { workerId, projectId });
const permits = useQuery(api.permits.listByWorker, { workerId, projectId });
const checklists = useQuery(api.checklists.listQualityByAssignee, { workerId });
const prestarts = useQuery(api.assets.listByProjectWithPrestartStatus, { projectId });
```

---

#### Tab 2: Communication (3 screens)

**Purpose:** Messages from management, notifications

| Screen | Purpose | Interactions | Data Hook |
|--------|---------|--------------|-----------|
| Communications | Messages + assigned items tabs | Switch tabs, tap message | `useCommunicationsScreenData` |
| CommunicationDetail | Full message view | Download attachments | `useCommunicationDetailScreenData` |
| Inbox | Notifications list | Mark read | `useInboxScreenData` |

**Communications Screen:**
```
┌─────────────────────────────────────┐
│ ← Back        Messages              │
├─────────────────────────────────────┤
│ [Messages] [Assigned Items]         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Site Update - Week 23           │ │
│ │ From: John Smith                │ │
│ │ 2 days ago              [2 📎]  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Weather Alert: High Winds       │ │
│ │ From: Safety Team               │ │
│ │ Today                           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Data:**
- Messages with unread count
- Assigned items (actions, checklists)
- Notifications with mark-as-read

**API Calls:**
```typescript
const messages = useQuery(api.communications.listByProject, { projectId });
const assigned = useQuery(api.actions.listByWorker, { workerId });
const notifications = useQuery(api.notifications.listByWorker, { workerId });
```

---

#### Tab 3: Project (9 screens)

**Purpose:** Project information, actions, schedule, documents

| Screen | Purpose | Interactions | Data Hook |
|--------|---------|--------------|-----------|
| ModuleMenu | Project submenu | Tap tile | — |
| Actions | Action list | Tap action | `useActionsScreenData` |
| ActionDetail | Action details + mark complete | Complete button | `useActionDetailScreenData` |
| Schedule | Worker's scheduled tasks | Calendar view | `useScheduleScreenData` |
| Documents | Project files | Download | `useDocumentsScreenData` |
| Drawings | Issued drawings | View metadata | `useDrawingsScreenData` |
| Photos | Site photos | Grid view | `usePhotosScreenData` |
| SiteDiaries | Diary entries list | Tap entry | `useSiteDiariesScreenData` |
| SiteDiaryDetail | Full diary view | Read-only | `useSiteDiaryDetailScreenData` |

**Actions Screen:**
```
┌─────────────────────────────────────┐
│ ← Back        Actions               │
├─────────────────────────────────────┤
│ Urgent (2)                          │
│ ┌─────────────────────────────────┐ │
│ │ [!] Install scaffolding Lvl 3   │ │
│ │     Due: Today • High Priority  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [!] Fix defect #127             │ │
│ │     Due: 2 days • High Priority │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Normal (5)                          │
│ ┌─────────────────────────────────┐ │
│ │ [ ] Clean work area             │ │
│ │     Due: Next week              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**ActionDetail Screen:**
```
┌─────────────────────────────────────┐
│ ← Back    Action Details            │
├─────────────────────────────────────┤
│ Install scaffolding Lvl 3           │
│                                     │
│ Status:    [In Progress]            │
│ Priority:  [High]                   │
│ Due:       Today                    │
│ Assigned:  Test Worker              │
│                                     │
│ Description:                        │
│ Install scaffolding on level 3      │
│ following approved method statement │
│                                     │
│ Attachments:                        │
│ - Scaffolding Plan.pdf              │
│ - Site Photo.jpg                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Mark Complete              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Actions Flow:**
1. View assigned actions (filtered by worker)
2. Tap to open detail
3. Review description + attachments
4. Mark complete button
5. Status: open → in_progress → completed
6. Return to actions list (or returnTo)

**API Calls:**
```typescript
// Actions list
const actions = useQuery(api.actions.listByWorker, { workerId, projectId });

// Action detail
const action = useQuery(api.actions.get, { id: actionId });
const update = useMutation(api.actions.update);

// Mark complete
await update({ id: actionId, status: 'completed' });
```

---

#### Tab 4: Safety (18 screens)

**Purpose:** Safety compliance, incidents, SWMS, permits, inductions

| Screen | Purpose | Interactions | Data Hook |
|--------|---------|--------------|-----------|
| ModuleMenu | Safety submenu | Tap tile | — |
| **Sign On (1)** |||
| SignOn | Sign on/off + SWMS nav | Sign in/out buttons | `useSignOnScreenData` |
| **Incidents (3)** |||
| Incidents | Incident list | Tap incident | `useIncidentsScreenData` |
| IncidentDetail | Incident details | Read-only | `useIncidentDetailScreenData` |
| IncidentReport | Create incident | Form submit | `useIncidentReportScreenData` |
| **SWMS (2)** |||
| SwmsList | SWMS list (signed/unsigned) | Tap SWMS | `useSwmsScreenData` |
| SwmsSign | **Signature canvas + ack** | Draw + submit | `useSwmsSignScreenData` |
| **Permits (3)** |||
| Permits | Permit list | Tap permit | `usePermitsScreenData` |
| PermitApply | Apply for permit | Form submit | `usePermitApplyScreenData` |
| PermitDetail | Permit details | View status | `usePermitDetailScreenData` |
| **Toolbox (2)** |||
| Toolbox | Toolbox meeting list | Tap meeting | `useToolboxScreenData` |
| ToolboxAttend | Attend + sign | Signature | `useToolboxAttendScreenData` |
| **SDS (4)** |||
| Sds | SDS library | Search | `useSdsScreenData` |
| SdsRequests | Request queue | View requests | `useSdsRequestsScreenData` |
| SdsRequestCreate | Create request | Form submit | `useSdsRequestCreateScreenData` |
| SdsRequestUpload | Upload SDS | File upload | `useSdsRequestUploadScreenData` |
| **Inductions (2)** |||
| Inductions | Assigned inductions | Tap induction | `useInductionsScreenData` |
| InductionDetail | Complete induction | Wizard | `useInductionDetailScreenData` |
| **Compliance (1)** |||
| Compliance | Compliance summary | View-only | `useComplianceScreenData` |
| **Tickets (3)** |||
| TicketWallet | Ticket wallet cards | Tap card | `useTicketWalletScreenData` |
| TicketWalletCard | Individual ticket card | — | — |
| TicketDetail | Ticket details | View photos | `useTicketDetailScreenData` |

**SwmsSign Screen (Complex Example):**
```
┌─────────────────────────────────────┐
│ ← Back        Sign SWMS             │
├─────────────────────────────────────┤
│ SWMS: Concrete Pouring              │
│ Project: Harbor Bridge              │
│ Version: 1.2                        │
│                                     │
│ [Document Sections Collapsed]       │
│ ▼ Scope of Work                     │
│   Pouring concrete on level 3       │
│                                     │
│ ▼ Hazards Identified                │
│   - Working at heights              │
│   - Heavy machinery                 │
│   - Chemical exposure               │
│                                     │
│ ▼ Control Measures                  │
│   - Use harness + lanyard           │
│   - Spotter required                │
│   - PPE: gloves, goggles, boots     │
│                                     │
│ ☐ I acknowledge the hazards        │
│ ☐ I understand the controls        │
│ ☐ I will use required PPE          │
│                                     │
│ Signature:                          │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │      [Signature Canvas]         │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│        [Clear]                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Sign SWMS               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**SWMS Sign Flow:**
1. Worker opens SWMS from list (status: approved)
2. Reviews document sections (scope, PPE, tasks, hazards, controls, emergency)
3. Acknowledges understanding (3 checkboxes)
4. Draws signature on canvas
5. Submit button (disabled until signed)
6. Signature stored as base64
7. SWMS assignment created (worker → SWMS link)
8. Return to SWMS list or returnTo

**Data Required:**
- SWMS document details (name, version, sections)
- Worker acknowledgments (checkbox state)
- Signature image (base64 PNG)

**API Calls:**
```typescript
// Load SWMS
const swms = useQuery(api.swms.get, { id: swmsId });

// Check if already signed
const signatures = useQuery(api.swmsSignatures.listBySwms, { swmsId });
const isSigned = signatures?.some(s => s.workerId === workerId);

// Sign SWMS
const sign = useMutation(api.swms.addSignature);
await sign({
  swmsId,
  workerId,
  signatureData: base64String,
  acknowledgments: ['hazards', 'controls', 'ppe']
});
```

**Validation:**
- All checkboxes checked
- Signature canvas not empty
- Worker not already signed
- SWMS status = approved

---

**IncidentReport Screen:**
```
┌─────────────────────────────────────┐
│ ← Back    Report Incident           │
├─────────────────────────────────────┤
│ What happened?                      │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │ [Text area]                     │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ When did it happen?                 │
│ [Date/Time Picker]                  │
│                                     │
│ Where did it happen?                │
│ [Location Input]                    │
│                                     │
│ Severity:                           │
│ ○ Minor  ○ Moderate  ○ Serious     │
│                                     │
│ Who was involved?                   │
│ [Worker Selector]                   │
│                                     │
│ Photos (optional):                  │
│ [📷 Add Photo]                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Submit Report              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Incident Report Flow:**
1. Worker taps "Report Incident" from safety menu
2. Fills multi-step form:
   - What happened (description)
   - When (date/time)
   - Where (location)
   - Severity (minor/moderate/serious)
   - Who involved (worker selector)
   - Photos (optional)
3. Submit creates incident (status: open)
4. Auto-notify supervisor
5. Confirmation shown
6. Navigate back to incidents list

**API Calls:**
```typescript
const create = useMutation(api.incidents.create);
await create({
  projectId,
  reportedBy: workerId,
  description,
  occurredAt,
  location,
  severity,
  involvedWorkerIds,
  photoIds
});
```

---

#### Tab 5: Quality (5 screens)

**Purpose:** Quality checklists, defects

| Screen | Purpose | Interactions | Data Hook |
|--------|---------|--------------|-----------|
| ModuleMenu | Quality submenu | Tap tile | — |
| Checklists | Assigned checklists | Tap checklist | `useChecklistsScreenData` |
| ChecklistConduct | **Dynamic checklist conductor** | Fill fields, save, complete | `useChecklistConductScreenData` |
| Defects | Defect list | Tap defect | `useDefectsScreenData` |
| DefectDetail | Defect details | View status | `useDefectDetailScreenData` |

**ChecklistConduct Screen (Most Complex):**
```
┌─────────────────────────────────────┐
│ ← Back    Conduct Checklist         │
├─────────────────────────────────────┤
│ Site Safety Inspection              │
│ Progress: 3/15 items                │
│ ████████░░░░░░░░░░░░░░ 20%         │
├─────────────────────────────────────┤
│                                     │
│ Section: Fire Safety                │
│                                     │
│ 1. Fire extinguishers present?      │
│    ┌─────────────────────────────┐  │
│    │ [Yes ✓]  [No]  [N/A]       │  │
│    └─────────────────────────────┘  │
│    Notes: All 5 extinguishers OK   │
│    📷 [Photo captured]             │
│                                     │
│ 2. Fire exits clear?                │
│    ┌─────────────────────────────┐  │
│    │ [Yes]  [No ✓]  [N/A]       │  │
│    └─────────────────────────────┘  │
│    ⚠️ Exit blocked by materials     │
│    [Create Defect]                 │
│                                     │
│ 3. Fire rating (1-5):               │
│    ⭐⭐⭐⭐☆                        │
│                                     │
│ 4. Additional comments:             │
│    ┌─────────────────────────────┐  │
│    │ Need more signage           │  │
│    └─────────────────────────────┘  │
│                                     │
│ 5. Inspector signature:             │
│    ┌─────────────────────────────┐  │
│    │ [Signature Canvas]          │  │
│    └─────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│ [Save Progress] [Complete Checklist]│
└─────────────────────────────────────┘
```

**Field Types Supported (14):**

1. **text** - Single line input
   ```html
   <input type="text" placeholder="Enter value" />
   ```

2. **textarea** - Multi-line text
   ```html
   <textarea placeholder="Enter notes" rows={4} />
   ```

3. **number** - Numeric input
   ```html
   <input type="number" min={0} max={100} />
   ```

4. **yesno** - Binary choice (pass/fail)
   ```html
   <div class="button-group">
     <button class="yes">Yes ✓</button>
     <button class="no">No ✗</button>
   </div>
   ```

5. **checkbox** - Single checkbox
   ```html
   <input type="checkbox" /> Acknowledged
   ```

6. **select** - Single selection dropdown
   ```html
   <select>
     <option>Option 1</option>
     <option>Option 2</option>
   </select>
   ```

7. **multiselect** - Multiple selections
   ```html
   <div class="checkbox-group">
     <input type="checkbox" /> Option 1
     <input type="checkbox" /> Option 2
   </div>
   ```

8. **date** - Date picker
   ```html
   <input type="date" />
   ```

9. **time** - Time picker
   ```html
   <input type="time" />
   ```

10. **datetime** - Combined date/time
    ```html
    <input type="datetime-local" />
    ```

11. **photo** - Camera capture
    ```html
    <input type="file" accept="image/*" capture="environment" />
    <div class="photo-preview">
      <img src="..." />
      <button class="remove">✗</button>
    </div>
    ```

12. **signature** - Signature canvas
    ```html
    <canvas width="300" height="150"></canvas>
    <button class="clear">Clear</button>
    ```

13. **attachment** - File upload
    ```html
    <input type="file" multiple />
    ```

14. **instruction** - Read-only display
    ```html
    <div class="instruction-box">
      <p>Important: Wear PPE at all times</p>
    </div>
    ```

15. **notes** - Free text area
    ```html
    <textarea placeholder="Additional notes" />
    ```

16. **action_trigger** - Create action/defect button
    ```html
    <button class="create-defect">Create Defect</button>
    <button class="create-action">Create Action</button>
    ```

**Conditional Logic:**
Fields can show/hide based on other field values.

Example:
```typescript
{
  id: 'explain_why',
  type: 'textarea',
  label: 'Explain why',
  conditionalLogic: {
    triggerFieldId: 'fire_extinguishers_present',
    operator: 'equals',
    value: 'no',
    action: 'show' // or 'hide'
  }
}
```

**Response Storage:**
```typescript
// Simple value
responses['field_1'] = "value";

// With notes
responses['field_2'] = {
  value: "yes",
  notes: "All OK"
};

// With attachments
responses['field_3'] = {
  value: "yes",
  attachments: [
    { id: Id<'mediaFiles'>, name: "photo.jpg", type: "image/jpeg", size: 123456 }
  ]
};

// With signature
responses['field_4'] = {
  value: "signed",
  signature: {
    data: "data:image/png;base64,...",
    signedBy: workerId,
    signedAt: "2025-01-21T10:30:00Z"
  }
};
```

**Save vs Complete:**
- **Save:** `checklists.saveResponse` → status: in_progress (can edit)
- **Complete:** `checklists.completeChecklist` → status: completed (immutable)

**Progress Tracking:**
```typescript
const progress = {
  answered: Object.keys(responses).filter(k => responses[k]).length,
  total: template.sections.flatMap(s => s.fields).filter(f => f.type !== 'instruction').length,
  percentage: (answered / total) * 100
};
```

**Create Defect/Action:**
1. Button on any field (or dedicated action_trigger field)
2. Opens dialog
3. Pre-fills description from field label + response
4. Submits `checklists.createDefectFromField` or `createActionFromField`
5. Links defect/action to checklist instance
6. Appends to `instance.linkedDefectIds[]` or `linkedActionIds[]`
7. Continues checklist

**API Calls:**
```typescript
// Load checklist
const instance = useQuery(api.checklists.getInstance, { id: instanceId });
const template = useQuery(api.checklists.getTemplate, { id: instance?.templateId });

// Save field response
const saveResponse = useMutation(api.checklists.saveResponse);
await saveResponse({ instanceId, fieldId, value, notes });

// Complete checklist
const complete = useMutation(api.checklists.completeChecklist);
await complete({ instanceId });

// Create defect from field
const createDefect = useMutation(api.checklists.createDefectFromField);
await createDefect({ instanceId, fieldId, description, priority: 'high' });
```

---

#### Tab 6: Plant (11 screens)

**Purpose:** Equipment prestarts, requests, inductions

| Screen | Purpose | Interactions | Data Hook |
|--------|---------|--------------|-----------|
| ModuleMenu | Plant submenu | Tap tile | — |
| **Pre-Starts (3)** |||
| Prestarts | Asset list | Tap asset | `usePrestartsScreenData` |
| PrestartDetail | **Checklist + photo + odometer** | Fill + submit | `usePrestartDetailScreenData` |
| PrestartSuccess | Pass/fail result | View result | — |
| **Plant Requests (1)** |||
| PlantRequests | Request management | Tabs: pending/approved | `usePlantRequestsScreenData` |
| **Assets (3)** |||
| Assets | Asset list | Tap asset | `useAssetsScreenData` |
| AssetDetail | Asset details + checklists | View history | `useAssetDetailScreenData` |
| AssetChecklist | Conduct asset checklist | Fill checklist | `useAssetChecklistScreenData` |
| **Plant Inductions (2)** |||
| PlantInductions | Assigned inductions | Tap induction | `usePlantInductionsScreenData` |
| PlantInductionSuccess | Completion screen | View success | — |

**PrestartDetail Screen (Complex):**
```
┌─────────────────────────────────────┐
│ ← Back    Pre-Start Check           │
├─────────────────────────────────────┤
│ Asset: Excavator #23                │
│ Make: Caterpillar 320              │
│ Model: 320D2 GC                     │
│                                     │
│ Section: Visual Inspection          │
│                                     │
│ 1. Engine oil level OK?             │
│    [Yes ✓]  [No]                   │
│                                     │
│ 2. Hydraulic leaks present?         │
│    [Yes]  [No ✓]                   │
│                                     │
│ 3. Tire condition (1-5):            │
│    ⭐⭐⭐⭐⭐                       │
│                                     │
│ Section: Safety Equipment           │
│                                     │
│ 4. Fire extinguisher present?       │
│    [Yes ✓]  [No]                   │
│                                     │
│ 5. First aid kit present?           │
│    [Yes ✓]  [No]                   │
│                                     │
│ Evidence Photo: *                   │
│ ┌─────────────────────────────────┐ │
│ │ [📷 Take Photo]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Odometer Readings:                  │
│ Hours:     [1234] hrs               │
│ Kilometers: [5678] km               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Submit Pre-Start           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Prestart Check Flow:**
1. Scan asset QR or tap from list
2. Load asset context (name, make, model)
3. Load prestart template for asset type
4. Render checklist fields (template-driven)
5. Fill all required fields
6. Take photo (if requiresPhoto = true)
7. Enter odometer readings (km + hours)
8. Submit button
9. **Pass/fail evaluation:**
   - All required fields filled?
   - All yesno fields = "yes"?
   - Photo if required?
10. **If passed:** Success screen, asset status → operational
11. **If failed:**
    - Asset status → maintenance
    - Auto-create defects (one per failed item)
    - Auto-create action items (one per defect)
    - Failure screen with issues listed

**Pass/Fail Logic:**
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

**On Failure (Backend):**
```typescript
// Update asset status
await ctx.db.patch(assetId, { status: 'maintenance' });

// Create defects
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

// Create action items
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

**PrestartSuccess Screen:**
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

Or if failed:
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

**API Calls:**
```typescript
// Load asset + template
const asset = useQuery(api.assets.get, { id: assetId });
const template = useQuery(api.prestarts.getTemplateForAsset, { assetId });

// Submit prestart
const submit = useMutation(api.prestarts.submit);
const result = await submit({
  assetId,
  prestartTemplateId: template._id,
  workerId,
  responses,
  photoIds,
  odometerKm,
  odometerHours
});

// Result contains { passed, issues, defectIds, actionIds }
```

---

#### Tab 7: Profile (1 screen)

**Purpose:** Worker profile, settings, project switcher

**Profile Screen:**
```
┌─────────────────────────────────────┐
│        Profile                      │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 👤 Test Worker                  │ │
│ │    Carpenter                    │ │
│ │    🟢 Active                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Active Project:                     │
│ ┌─────────────────────────────────┐ │
│ │ Harbor Bridge               ▼   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ My Projects (3):                    │
│ • Harbor Bridge                     │
│ • City Tower                        │
│ • Westside Mall                     │
│                                     │
│ Settings:                           │
│ [⚙️] Preferences                    │
│ [🔔] Notifications                  │
│ [📱] About                          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Sign Out                   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Version 2.0 (Build 123)             │
└─────────────────────────────────────┘
```

**Features:**
- Worker card (name, role, status)
- Project selector (switches active project context)
- Project list (all assigned)
- Settings placeholders (future)
- Sign out placeholder (demo mode)
- Version info

**API Calls:**
```typescript
const worker = useQuery(api.workers.get, { id: workerId });
const projects = useQuery(api.projects.listByWorker, { workerId });

// Switch project
const setActiveProject = (projectId: Id<'projects'>) => {
  // Update demo context (local state)
  // All screens re-filter by new projectId
};
```

---

### 4.3 Interaction Types

#### Type 1: Signature Capture

**Screens Using:**
- SWMS Sign
- Toolbox Attend
- Checklist signature fields
- Induction signature step
- Permit applications

**Component:** SignatureCanvas

**Implementation:**
```tsx
<div className="signature-section">
  <label>Signature:</label>
  <canvas
    ref={canvasRef}
    width={300}
    height={150}
    onMouseDown={startDrawing}
    onMouseMove={draw}
    onMouseUp={stopDrawing}
    onTouchStart={startDrawing}
    onTouchMove={draw}
    onTouchEnd={stopDrawing}
    className="border rounded-lg bg-white"
  />
  <button onClick={clearCanvas}>Clear</button>
</div>
```

**Drawing Logic:**
```typescript
const [isDrawing, setIsDrawing] = useState(false);
const canvasRef = useRef<HTMLCanvasElement>(null);

const startDrawing = (e: MouseEvent | TouchEvent) => {
  setIsDrawing(true);
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const { x, y } = getCoordinates(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
};

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing) return;

  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const { x, y } = getCoordinates(e);
  ctx.lineTo(x, y);
  ctx.stroke();
};

const stopDrawing = () => {
  setIsDrawing(false);
};

const clearCanvas = () => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

const getSignatureData = () => {
  const canvas = canvasRef.current;
  if (!canvas) return null;

  // Convert to base64 PNG
  return canvas.toDataURL('image/png');
};
```

**Output:** Base64 PNG data URL
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
```

**Backend Storage:**
- SWMS: `swmsSignatures.signatureData` (string)
- Toolbox: `attendanceLogs.signature` (embedded object)
- Checklists: `checklistInstances.responses[fieldId].signature.data` (string)
- Inductions: `inductionCompletions.signature.mediaFileId` (Id<'mediaFiles'>)

---

#### Type 2: Photo Capture

**Screens Using:**
- Prestart Detail (evidence photo)
- Checklist Conduct (photo fields)
- Incident Report (attachments)
- Defect creation (photo evidence)

**Component:** PhotoCapture

**Implementation:**
```tsx
<div className="photo-capture">
  <label>Photo Evidence {required && '*'}:</label>
  <input
    type="file"
    accept="image/*"
    capture="environment" // Rear camera on mobile
    multiple
    onChange={handlePhotoCapture}
    className="hidden"
    id="photo-input"
  />
  <label htmlFor="photo-input" className="photo-button">
    📷 Take Photo
  </label>

  {/* Preview */}
  <div className="photo-preview-grid">
    {photos.map((photo, i) => (
      <div key={i} className="photo-preview">
        <img src={photo.url} alt="Preview" />
        <button onClick={() => removePhoto(i)}>✗</button>
      </div>
    ))}
  </div>
</div>
```

**Upload Flow:**
1. User taps "Take Photo"
2. Mobile camera opens (rear-facing)
3. User takes photo
4. File object received
5. Generate upload URL: `generateUploadUrl()`
6. Upload file: `fetch(uploadUrl, { method: 'POST', body: file })`
7. Store metadata: `createMediaFile({ name, type, size, storageId })`
8. Store mediaFileId in response

```typescript
const handlePhotoCapture = async (e: ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  for (const file of Array.from(files)) {
    // Generate upload URL
    const uploadUrl = await generateUploadUrl();

    // Upload file
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: file
    });

    const { storageId } = await response.json();

    // Create media file record
    const mediaFileId = await createMediaFile({
      name: file.name,
      type: file.type,
      size: file.size,
      storageId,
      uploadedBy: workerId
    });

    // Add to photos array
    setPhotos(prev => [...prev, { id: mediaFileId, url: URL.createObjectURL(file) }]);
  }
};
```

**Multiple Photos:**
- Array of mediaFileIds: `[Id<'mediaFiles'>]`
- Preview thumbnails shown
- Delete button per photo
- Max limit configurable per field

---

#### Type 3: Form Submission

**Screens Using:**
- Incident Report
- Permit Apply
- SDS Request
- Action Detail (mark complete)
- Plant Requests

**Pattern:**
```tsx
const [formData, setFormData] = useState<FormData>({});
const [errors, setErrors] = useState<Record<string, string>>({});
const submit = useMutation(api.domain.create);

const handleChange = (field: string, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error for field
  setErrors(prev => ({ ...prev, [field]: '' }));
};

const validate = () => {
  const errors: Record<string, string> = {};

  if (!formData.title) errors.title = 'Title is required';
  if (!formData.date) errors.date = 'Date is required';
  // ... more validation

  return errors;
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Validate
  const validationErrors = validate();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  try {
    // Submit
    const id = await submit(formData);

    // Success feedback
    toast.success('Submitted successfully');

    // Navigate
    router.push(`/success`);
  } catch (error) {
    toast.error('Submission failed');
  }
};

return (
  <form onSubmit={handleSubmit}>
    <div>
      <label>Title *</label>
      <input
        value={formData.title || ''}
        onChange={e => handleChange('title', e.target.value)}
      />
      {errors.title && <span className="error">{errors.title}</span>}
    </div>

    {/* More fields */}

    <button type="submit">Submit</button>
  </form>
);
```

**Validation:**
- Required fields checked client-side
- Backend validators on mutation
- Error states shown inline
- Disabled submit until valid

---

#### Type 4: QR Scanning

**Entry Points:** 7 public flows (see section 4.5)

**Mobile Flow:**
1. Worker taps "Scan QR" or opens QR URL from camera app
2. Browser navigates to public URL (e.g., `/prestart/QR-123ABC`)
3. Page loads (no auth required)
4. Resolves QR code to entity (asset, project, SWMS)
5. Renders appropriate screen
6. Worker completes task
7. Confirmation shown

**QR Code Resolution:**

```typescript
// Asset QR
const asset = await ctx.db
  .query('assets')
  .withIndex('by_qrCode', q => q.eq('qrCode', qrCode))
  .first();

// Project QR (no index, linear scan)
const projects = await ctx.db.query('projects').collect();
const project = projects.find(p => p.metadata?.qrCode?.code === qrCode);

// SWMS Share Code
const swms = await ctx.db
  .query('swmsDocuments')
  .withIndex('by_shareCode', q => q.eq('shareCode', shareCode))
  .first();
```

**QR Code Types:**

| Type | Format | Example | Index | Collision Risk |
|------|--------|---------|-------|----------------|
| Asset | Freeform | `QR-123ABC` | `by_qrCode` | Low (org scoped) |
| Project | Metadata | `PROJ456` | None | Medium (linear scan) |
| SWMS | 12-char random | `AbCdEfGhIjKl` | `by_shareCode` | Very low |
| Invite | 10-char timestamp | `UPL-2x5k8p` | `by_shareCode` | Very low |

---

#### Type 5: List Navigation

**Pattern across all list screens:**

```tsx
<div className="mobile-list">
  {items.map(item => (
    <MobileCard
      key={item._id}
      onClick={() => navigate(item._id)}
    >
      <MobileCardIcon icon={getIcon(item.type)} color={getColor(item.status)} />
      <MobileCardContent
        title={item.title}
        subtitle={item.subtitle}
        meta={formatDate(item.date)}
      />
      <StatusBadge status={item.status} />
    </MobileCard>
  ))}
</div>
```

**Status Badge:**
```tsx
<span
  style={{
    backgroundColor: `var(--status-${status}-bg)`,
    color: `var(--status-${status}-text)`
  }}
  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
>
  {getStatusLabel(status)}
</span>
```

**Empty State:**
```tsx
<MobileEmptyState
  icon={<Icon />}
  title="No items"
  description="There are no items to display."
/>
```

---

### 4.4 QR Code Flows

#### Flow 1: Asset QR → Prestart

**Entry:** `/prestart/[qrCode]`

**Public Access:** Yes (no auth required)

**Flow:**
1. Worker scans asset QR code on sticker
2. Browser opens `/prestart/QR-123ABC`
3. Backend resolves QR to asset + prestart template
4. Renders prestart form (asset context, checklist, photo, odometer)
5. Worker fills all fields
6. Submits via `prestarts.submitPublic`
7. Pass/fail evaluation
8. Success screen with result (passed/failed)
9. If failed: Defects + actions auto-created

**Data Required:**
- Asset details (name, make, model, serial)
- Prestart template (checklist structure)
- Public access flag (`template.publicAccess = true`)

**API Call:**
```typescript
export const getByQRCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    // Resolve asset
    const asset = await ctx.db
      .query('assets')
      .withIndex('by_qrCode', q => q.eq('qrCode', args.qrCode))
      .first();

    if (!asset) return null;

    // Get template
    const template = await ctx.db
      .query('prestartTemplates')
      .withIndex('by_assetType', q => q.eq('assetType', asset.assetType))
      .filter(q => q.eq(q.field('publicAccess'), true))
      .first();

    return { asset, template };
  }
});
```

---

#### Flow 2: Project QR → Sign-In

**Entry:** `/sign-in/[code]`

**Public Access:** Yes (no auth required)

**Flow:**
1. Worker scans project QR at site entrance
2. Browser opens `/sign-in/PROJ456`
3. Loads project details + worker list
4. Three tabs: Worker / Visitor / Delivery
5. **Worker tab:**
   - Select from dropdown (all assigned workers)
   - Sign in/out button
   - Inline success confirmation
6. **Visitor tab:**
   - Name, company, phone, purpose
   - Sign in creates visitor record
7. **Delivery tab:**
   - Name, company, phone
   - Sign in creates delivery record

**Data Required:**
- Project details (name, address)
- Worker list (all assigned to project)
- Sign-on config (custom fields, visitor/delivery allowed)
- Prestart notice (acknowledgment text)
- Today's attendance logs (on-site status)

**API Call:**
```typescript
export const getByQrCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Find project (linear scan, no index)
    const projects = await ctx.db.query('projects').collect();
    const project = projects.find(p => p.metadata?.qrCode?.code === args.code);

    if (!project) return null;

    // Get workers
    const workers = await ctx.db
      .query('workers')
      .withIndex('by_project', q => q.eq('projectId', project._id))
      .collect();

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const attendance = await ctx.db
      .query('attendanceLogs')
      .withIndex('by_project_date', q =>
        q.eq('projectId', project._id).eq('date', today)
      )
      .collect();

    return { project, workers, attendance };
  }
});
```

---

#### Flow 3: Project QR → Induction

**Entry:** `/induct/[qrCode]`

**Public Access:** Yes (no auth required)

**Flow:**
1. Worker scans project induction QR
2. Browser opens `/induct/INDUCT123`
3. Welcome screen: project details + required inductions
4. Email input (required) + full name (optional)
5. "Start Induction" button
6. Backend finds/creates worker by email
7. Launches 5-step wizard:
   1. **Profile:** Name, email, phone, trade, employer
   2. **Emergency Contact:** Name, phone, relationship
   3. **Content:** Acknowledgments + uploads (per induction type)
   4. **Tickets:** Upload certifications (multiple)
   5. **Signature:** Sign + generate hash
8. Submit via `inductions.submitInduction`
9. Status → awaiting_review
10. Success page

**Data Required:**
- Project details
- Required induction types
- Content blocks (acknowledgments, uploads per type)
- Required certification types

**API Call:**
```typescript
export const getPublicInductionData = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const project = await findProjectByQrCode(ctx, args.qrCode);
    if (!project) return null;

    const inductionTypes = await ctx.db
      .query('inductionTypes')
      .withIndex('by_project', q => q.eq('projectId', project._id))
      .filter(q => q.eq(q.field('isRequired'), true))
      .collect();

    return { project, inductionTypes };
  }
});
```

**Wizard Steps Detail:**

**Step 1: Profile**
```
┌─────────────────────────────────────┐
│ ← Back    Induction (1/5)           │
├─────────────────────────────────────┤
│ Your Profile                        │
│                                     │
│ Full Name: *                        │
│ [Input]                             │
│                                     │
│ Email: *                            │
│ [Input]                             │
│                                     │
│ Phone: *                            │
│ [Input]                             │
│                                     │
│ Trade:                              │
│ [Select: Carpenter, Electrician...] │
│                                     │
│ Employer:                           │
│ [Input]                             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Next                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Step 2: Emergency Contact**
```
┌─────────────────────────────────────┐
│ ← Back    Induction (2/5)           │
├─────────────────────────────────────┤
│ Emergency Contact                   │
│                                     │
│ Name: *                             │
│ [Input]                             │
│                                     │
│ Phone: *                            │
│ [Input]                             │
│                                     │
│ Relationship:                       │
│ [Select: Spouse, Parent, Sibling...] │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Next                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Step 3: Content (Dynamic)**
```
┌─────────────────────────────────────┐
│ ← Back    Induction (3/5)           │
├─────────────────────────────────────┤
│ Site Safety Rules                   │
│                                     │
│ Section: General Safety             │
│ - Always wear PPE                   │
│ - No lone working                   │
│ - Report all incidents              │
│                                     │
│ ☐ I acknowledge the above *         │
│                                     │
│ Upload Site Plan: *                 │
│ [📄 Upload File]                    │
│                                     │
│ Section: Emergency Procedures       │
│ [Content blocks from template]      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Next                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Step 4: Tickets**
```
┌─────────────────────────────────────┐
│ ← Back    Induction (4/5)           │
├─────────────────────────────────────┤
│ Certifications                      │
│                                     │
│ Required:                           │
│ • Working at Heights *              │
│ • White Card *                      │
│                                     │
│ Working at Heights:                 │
│ Cert Number: [Input]                │
│ Expiry Date: [Date]                 │
│ Photo (front): [📷 Upload]          │
│ Photo (back): [📷 Upload]           │
│                                     │
│ White Card:                         │
│ Cert Number: [Input]                │
│ Expiry Date: [Date]                 │
│ Photo: [📷 Upload]                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Next                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Step 5: Signature**
```
┌─────────────────────────────────────┐
│ ← Back    Induction (5/5)           │
├─────────────────────────────────────┤
│ Declaration                         │
│                                     │
│ I declare that the information      │
│ provided is true and accurate.      │
│                                     │
│ I agree to comply with all site     │
│ safety rules and procedures.        │
│                                     │
│ Signature: *                        │
│ ┌─────────────────────────────────┐ │
│ │ [Signature Canvas]              │ │
│ └─────────────────────────────────┘ │
│        [Clear]                      │
│                                     │
│ Hash: e8f3a9b2c1d4...               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Submit Induction           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

#### Flow 4: Induction Invite Link

**Entry:** `/induct/invite/[shareCode]`

**Public Access:** Yes (pre-arrival flow)

**Flow:**
1. Worker receives invite link (email/SMS)
2. Opens `/induct/invite/UPL-2x5k8p`
3. Backend loads invite details
4. Confirm identity screen (pre-filled name/email)
5. "Start" button
6. Updates worker profile on start
7. Launches same 5-step wizard
8. Submit links completion to invite
9. Success page

**Difference from QR:**
- Pre-arrival vs on-site
- Invite tracks completion via `inviteId`
- Worker profile update on start

**API Call:**
```typescript
export const getInviteByShareCode = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query('inductionInvites')
      .withIndex('by_shareCode', q => q.eq('shareCode', args.shareCode))
      .first();

    if (!invite) return null;

    const project = await ctx.db.get(invite.projectId);
    const worker = await ctx.db.get(invite.workerId);
    const inductionTypes = await ctx.db
      .query('inductionTypes')
      .filter(q => inductionTypeIds.includes(q.field('_id')))
      .collect();

    return { invite, project, worker, inductionTypes };
  }
});
```

---

#### Flow 5: Toolbox QR → Attend

**Entry:** `/toolbox/attend/[qrCode]`

**Public Access:** Yes (no auth required)

**Flow:**
1. Worker scans toolbox QR at meeting
2. Browser opens `/toolbox/attend/TB123ABC`
3. Loads meeting details (date, topics, facilitator, attachments)
4. Worker selection dropdown (all project workers)
5. Signature pad
6. Submit via `toolbox.sign`
7. Inline success confirmation

**Data Required:**
- Meeting details (date, time, location, topics)
- Worker list (for dropdown)
- Attachments (download links)

**API Call:**
```typescript
export const getByQrCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const meeting = await ctx.db
      .query('toolboxMeetings')
      .withIndex('by_qrCode', q => q.eq('qrCode', args.qrCode))
      .first();

    if (!meeting) return null;

    const project = await ctx.db.get(meeting.projectId);
    const workers = await ctx.db
      .query('workers')
      .withIndex('by_project', q => q.eq('projectId', meeting.projectId))
      .collect();

    const attachments = await resolveMediaFileUrls(ctx, meeting.attachmentIds);

    return { meeting, project, workers, attachments };
  }
});
```

---

#### Flow 6: SWMS Share Link

**Entry:** `/swms/view/[code]`

**Public Access:** Yes (external workers)

**Flow:**
1. Worker opens share link (email/SMS)
2. Browser opens `/swms/view/AbCdEfGhIjKl`
3. Loads SWMS document (all sections visible)
4. External signature section:
   - Name input (required)
   - Company input (optional)
   - Signature canvas
5. Submit via `swms.addExternalSignature`
6. Inline success confirmation

**Data Required:**
- SWMS document (full structure)
- Existing signatures (to check duplicates)

**Validation:**
- SWMS must be approved
- Duplicate name check (case-insensitive)
- Signature canvas not empty

**API Call:**
```typescript
export const getByShareCode = query({
  args: { shareCode: v.string() },
  handler: async (ctx, args) => {
    const swms = await ctx.db
      .query('swmsDocuments')
      .withIndex('by_shareCode', q => q.eq('shareCode', args.shareCode))
      .first();

    if (!swms || swms.status !== 'approved') return null;

    const signatures = await ctx.db
      .query('swmsSignatures')
      .withIndex('by_swms', q => q.eq('swmsId', swms._id))
      .collect();

    return { swms, signatures };
  }
});
```

---

#### Flow 7: Asset View

**Entry:** `/asset/[qrCode]`

**Public Access:** View only (no auth)

**Flow:**
1. Worker scans asset QR
2. Browser opens `/asset/QR-123ABC`
3. Displays asset details (name, make, model, status)
4. Shows maintenance history
5. Shows enabled checklists (view only or conduct if authenticated)
6. Optional: "Report Issue" button (requires auth)

**Data Required:**
- Asset details
- Enabled checklists (`assetChecklists` where `isEnabledForQr = true`)
- Maintenance history

**API Call:**
```typescript
export const getByQrCode = query({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query('assets')
      .withIndex('by_qrCode', q => q.eq('qrCode', args.qrCode))
      .first();

    if (!asset) return null;

    const checklists = await ctx.db
      .query('assetChecklists')
      .withIndex('by_asset', q => q.eq('assetId', asset._id))
      .filter(q => q.eq(q.field('isEnabledForQr'), true))
      .collect();

    const maintenanceHistory = await ctx.db
      .query('prestartSubmissions')
      .withIndex('by_asset', q => q.eq('assetId', asset._id))
      .order('desc')
      .take(10);

    return { asset, checklists, maintenanceHistory };
  }
});
```

---

### 4.5 Adapter Hook Architecture

#### Pattern

**Location:** `hooks/worker/screens/`

**Naming:** `use-{screen-name}-data.ts`

**Structure:**
```typescript
export function useScreenNameData({ workerId, projectId }: Args) {
  // Convex queries
  const data = useQuery(api.domain.list, { projectId });
  const related = useQuery(api.domain.related, { ...args });

  // Convex mutations
  const mutate = useMutation(api.domain.update);

  // Enrichment (joins, filters, transforms)
  const enriched = useMemo(() => {
    if (!data || !related) return undefined;
    return data.map(item => ({
      ...item,
      relatedData: related.find(r => r.id === item.relatedId)
    }));
  }, [data, related]);

  // Actions
  const actions = {
    doSomething: async (args: Args) => {
      await mutate(args);
    }
  };

  // Return
  return {
    data: enriched,
    actions,
    isLoading: data === undefined || related === undefined
  };
}
```

---

#### Complete Hook List (51 hooks, one per screen)

| Hook | Screen | Purpose |
|------|--------|---------|
| **Tasks (1)** |||
| `useTaskHubScreenData` | TaskHub | Aggregate across 4 modules |
| **Communication (3)** |||
| `useCommunicationsScreenData` | Communications | Messages + assigned |
| `useCommunicationDetailScreenData` | CommunicationDetail | Single message |
| `useInboxScreenData` | Inbox | Notifications |
| **Project (9)** |||
| `useActionsScreenData` | Actions | Action list |
| `useActionDetailScreenData` | ActionDetail | Action details + complete |
| `useScheduleScreenData` | Schedule | Worker's schedule |
| `useDocumentsScreenData` | Documents | Document list |
| `useDrawingsScreenData` | Drawings | Drawing list |
| `usePhotosScreenData` | Photos | Photo grid |
| `useSiteDiariesScreenData` | SiteDiaries | Diary list |
| `useSiteDiaryDetailScreenData` | SiteDiaryDetail | Diary details |
| **Safety (18)** |||
| `useSignOnScreenData` | SignOn | Sign on/off + SWMS nav |
| `useSwmsScreenData` | SwmsList | SWMS list |
| `useSwmsSignScreenData` | SwmsSign | Sign SWMS |
| `usePermitsScreenData` | Permits | Permit list |
| `usePermitApplyScreenData` | PermitApply | Apply permit |
| `usePermitDetailScreenData` | PermitDetail | Permit details |
| `useToolboxScreenData` | Toolbox | Meeting list |
| `useToolboxAttendScreenData` | ToolboxAttend | Attend meeting |
| `useIncidentsScreenData` | Incidents | Incident list |
| `useIncidentDetailScreenData` | IncidentDetail | Incident details |
| `useIncidentReportScreenData` | IncidentReport | Report incident |
| `useSdsScreenData` | Sds | SDS library |
| `useSdsRequestsScreenData` | SdsRequests | Request queue |
| `useSdsRequestCreateScreenData` | SdsRequestCreate | Create request |
| `useSdsRequestUploadScreenData` | SdsRequestUpload | Upload SDS |
| `useInductionsScreenData` | Inductions | Induction list |
| `useInductionDetailScreenData` | InductionDetail | Complete induction |
| `useComplianceScreenData` | Compliance | Compliance summary |
| `useTicketWalletScreenData` | TicketWallet | Ticket cards |
| `useTicketDetailScreenData` | TicketDetail | Ticket details |
| **Quality (5)** |||
| `useChecklistsScreenData` | Checklists | Checklist list |
| `useChecklistConductScreenData` | ChecklistConduct | Conduct checklist |
| `useDefectsScreenData` | Defects | Defect list |
| `useDefectDetailScreenData` | DefectDetail | Defect details |
| **Plant (11)** |||
| `usePrestartsScreenData` | Prestarts | Asset list |
| `usePrestartDetailScreenData` | PrestartDetail | Prestart check |
| `usePlantRequestsScreenData` | PlantRequests | Request management |
| `useAssetsScreenData` | Assets | Asset list |
| `useAssetDetailScreenData` | AssetDetail | Asset details |
| `useAssetChecklistScreenData` | AssetChecklist | Asset checklist |
| `usePlantInductionsScreenData` | PlantInductions | Induction list |
| **Profile (1)** |||
| `useProfileScreenData` | Profile | Worker profile |

---

#### Example: useTaskHubScreenData

```typescript
export function useTaskHubScreenData({ workerId, projectId }: {
  workerId: Id<'workers'>;
  projectId: Id<'projects'>;
}) {
  // Queries (parallel)
  const actions = useQuery(api.actions.listByWorker, { workerId, projectId });
  const swms = useQuery(api.swms.listApprovedForWorker, { workerId, projectId });
  const permits = useQuery(api.permits.listByWorker, { workerId, projectId });
  const checklists = useQuery(api.checklists.listQualityByAssignee, { workerId });
  const prestarts = useQuery(api.assets.listByProjectWithPrestartStatus, { projectId });

  // Filter + aggregate
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
      {
        module: 'safety',
        title: 'SWMS',
        items: swms
          .filter(s => !s.isSigned)
          .slice(0, 6)
          .map(s => ({
            id: s._id,
            title: s.name,
            subtitle: 'Unsigned',
            meta: `v${s.version}`,
            screen: 'swms-sign',
            params: { swmsId: s._id },
            returnTo: 'task-hub'
          })),
        total: swms.filter(s => !s.isSigned).length
      },
      {
        module: 'safety',
        title: 'Permits',
        items: permits
          .filter(p => p.status === 'pending')
          .slice(0, 6)
          .map(p => ({
            id: p._id,
            title: p.permitType,
            subtitle: 'Pending approval',
            meta: formatDate(p.requestedDate),
            screen: 'permit-detail',
            params: { permitId: p._id },
            returnTo: 'task-hub'
          })),
        total: permits.filter(p => p.status === 'pending').length
      },
      {
        module: 'quality',
        title: 'Checklists',
        items: checklists
          .filter(c => c.status === 'in_progress')
          .slice(0, 6)
          .map(c => ({
            id: c._id,
            title: c.templateName,
            subtitle: `${c.progress.answered}/${c.progress.total} complete`,
            meta: formatDate(c.startedAt),
            screen: 'checklist-conduct',
            params: { instanceId: c._id },
            returnTo: 'task-hub'
          })),
        total: checklists.filter(c => c.status === 'in_progress').length
      },
      {
        module: 'plant',
        title: 'Prestarts',
        items: prestarts
          .filter(p => p.prestartStatus !== 'completed')
          .slice(0, 6)
          .map(p => ({
            id: p._id,
            title: p.name,
            subtitle: 'Prestart due',
            meta: p.assetType,
            screen: 'prestart-detail',
            params: { assetId: p._id },
            returnTo: 'task-hub'
          })),
        total: prestarts.filter(p => p.prestartStatus !== 'completed').length
      }
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

---

#### Example: useSwmsSignScreenData

```typescript
export function useSwmsSignScreenData({ workerId, swmsId }: {
  workerId: Id<'workers'>;
  swmsId: Id<'swmsDocuments'>;
}) {
  // Queries
  const swms = useQuery(api.swms.get, { id: swmsId });
  const signatures = useQuery(api.swmsSignatures.listBySwms, { swmsId });

  // Mutations
  const sign = useMutation(api.swms.addSignature);

  // Derived state
  const mySignature = signatures?.find(s => s.workerId === workerId);
  const isSigned = !!mySignature;
  const canSign = swms?.status === 'approved' && !isSigned;

  // Actions
  const handleSign = async (signatureData: string, acknowledgments: string[]) => {
    if (!canSign) throw new Error('Cannot sign SWMS');

    await sign({
      swmsId,
      workerId,
      signatureData,
      acknowledgments
    });
  };

  return {
    swms,
    signatures,
    isSigned,
    canSign,
    handleSign,
    isLoading: swms === undefined || signatures === undefined
  };
}
```

---

#### Example: useChecklistConductScreenData

```typescript
export function useChecklistConductScreenData({ instanceId, workerId }: {
  instanceId: Id<'checklistInstances'>;
  workerId: Id<'workers'>;
}) {
  // Queries
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

  // Local state
  const [responses, setResponses] = useState<Record<string, any>>(instance?.responses || {});

  // Sync instance responses to local state
  useEffect(() => {
    if (instance?.responses) {
      setResponses(instance.responses);
    }
  }, [instance?.responses]);

  // Progress
  const progress = useMemo(() => {
    if (!template) return { answered: 0, total: 0, percentage: 0 };

    const allFields = template.sections.flatMap(s =>
      s.fields.filter(f => f.type !== 'instruction')
    );

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
    },

    createActionFromField: async (fieldId: string) => {
      const field = template?.sections
        .flatMap(s => s.fields)
        .find(f => f.id === fieldId);

      if (!field) return;

      await createAction({
        instanceId,
        fieldId,
        title: `Fix: ${field.label}`,
        description: responses[fieldId],
        priority: 'high',
        assignedTo: workerId
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

---

### 4.6 Data Requirements Per Screen

| Screen | Queries | Mutations | Required Fields |
|--------|---------|-----------|-----------------|
| **TaskHub** | actions.listByWorker, swms.listApprovedForWorker, permits.listByWorker, checklists.listQualityByAssignee, assets.listByProjectWithPrestartStatus | — | workerId, projectId |
| **SwmsSign** | swms.get, swmsSignatures.listBySwms | swms.addSignature | swmsId, workerId, signatureData, acknowledgments |
| **ChecklistConduct** | checklists.getInstance, checklists.getTemplate | checklists.saveResponse, checklists.saveAllResponses, checklists.completeChecklist, checklists.createDefectFromField, checklists.createActionFromField | instanceId, workerId, responses |
| **PrestartDetail** | assets.get, prestarts.getTemplateForAsset, prestarts.getLatestForAsset | prestarts.submit | assetId, workerId, responses, photoIds, odometerKm, odometerHours |
| **IncidentReport** | — | incidents.create | projectId, workerId, description, occurredAt, location, severity, involvedWorkerIds, photoIds |
| **PermitApply** | permitTypes.list | permits.createApplication | projectId, permitTypeId, workerId, startDate, endDate, location, description |
| **ToolboxAttend** | toolbox.get, workers.listByProject | toolbox.sign | meetingId, workerId, signatureData |
| **ActionDetail** | actions.get | actions.update | actionId, status |
| **InductionDetail** | inductions.get, inductionTypes.get, certificationTypes.list | inductions.saveWorkerProfile, inductions.saveEmergencyContact, inductions.saveBlockResponses, inductions.uploadTicketFromCompletion, inductions.submitSignature, inductions.submitInduction | completionId, workerId, inductionTypeId, profile, emergencyContact, blockResponses, tickets, signature |
| **Profile** | workers.get, projects.listByWorker | — | workerId |

---

### 4.7 Offline Considerations (Future)

#### Strategy
- **Service worker** for caching static assets + API responses
- **IndexedDB** for local storage of in-progress work
- **Sync queue** for offline mutations (submit when online)
- **Conflict resolution** on reconnect

#### Priority Screens for Offline
1. **PrestartConduct** - Equipment checks can't wait
2. **ChecklistConduct** - Inspections can't wait
3. **IncidentReport** - Safety critical
4. **SignIn/SignOut** - Attendance tracking

#### Architecture
```
┌─────────────────────────────────────┐
│  React Component                    │
├─────────────────────────────────────┤
│  Adapter Hook                       │
│  - Check online status              │
│  - If online: Convex query/mutation│
│  - If offline: IndexedDB read/write│
├─────────────────────────────────────┤
│  Sync Queue                         │
│  - Store pending mutations          │
│  - Retry on reconnect               │
│  - Resolve conflicts                │
├─────────────────────────────────────┤
│  IndexedDB                          │
│  - Cache responses                  │
│  - Store pending mutations          │
│  - Sync status per item             │
└─────────────────────────────────────┘
```

#### Constraints
- Convex requires online connection (current)
- No offline-first database (current)
- Signatures/photos stored locally until upload
- Conflict resolution needed (last-write-wins vs merge)

---

## 5. Relationships & Dependencies

### Depends On
- **03-domain-model.md** - Entities, relationships, business logic
- **04-schema.md** - Database tables, indexes, fields
- **06-ui-system.md** - Shared UI patterns, design tokens

### Feeds Into
- Implementation (component development)
- QR code generation (print stickers/signs)
- Public access flows (no-auth routes)

---

## 6. Implementation Notes

### Component Organization
```
components/worker/
├── layout/
│   ├── worker-layout.tsx          # Root layout with demo context
│   ├── device-frame.tsx           # iPhone-style frame
│   ├── tab-bar.tsx                # Bottom navigation
│   └── mobile-header.tsx          # iOS-style header
├── shared/
│   ├── mobile-card.tsx            # Standard list card
│   ├── mobile-task-item.tsx       # Task card for hub
│   ├── mobile-list.tsx            # Simple list container
│   ├── mobile-empty-state.tsx     # Empty state
│   ├── mobile-loading-state.tsx   # Loading spinner
│   ├── signature-canvas.tsx       # Signature capture
│   ├── photo-capture.tsx          # Photo upload
│   └── field-renderer.tsx         # Dynamic field rendering
├── tasks/
│   └── task-hub-screen.tsx
├── communication/
│   ├── communications-screen.tsx
│   ├── communication-detail-screen.tsx
│   └── inbox-screen.tsx
├── project/
│   ├── module-menu-screen.tsx
│   ├── actions-screen.tsx
│   ├── action-detail-screen.tsx
│   ├── schedule-screen.tsx
│   ├── documents-screen.tsx
│   ├── drawings-screen.tsx
│   ├── photos-screen.tsx
│   ├── site-diaries-screen.tsx
│   └── site-diary-detail-screen.tsx
├── safety/
│   ├── module-menu-screen.tsx
│   ├── sign-on-screen.tsx
│   ├── swms-screen.tsx
│   ├── swms-sign-screen.tsx
│   ├── permits-screen.tsx
│   ├── permit-apply-screen.tsx
│   ├── permit-detail-screen.tsx
│   ├── toolbox-screen.tsx
│   ├── toolbox-attend-screen.tsx
│   ├── incidents-screen.tsx
│   ├── incident-detail-screen.tsx
│   ├── incident-report-screen.tsx
│   ├── sds-screen.tsx
│   ├── sds-requests-screen.tsx
│   ├── sds-request-create-screen.tsx
│   ├── sds-request-upload-screen.tsx
│   ├── inductions-screen.tsx
│   ├── induction-detail-screen.tsx
│   ├── compliance-screen.tsx
│   ├── ticket-wallet-screen.tsx
│   ├── ticket-wallet-card.tsx
│   └── ticket-detail-screen.tsx
├── quality/
│   ├── module-menu-screen.tsx
│   ├── checklists-screen.tsx
│   ├── checklist-conduct-screen.tsx
│   ├── defects-screen.tsx
│   └── defect-detail-screen.tsx
├── plant/
│   ├── module-menu-screen.tsx
│   ├── prestarts-screen.tsx
│   ├── prestart-detail-screen.tsx
│   ├── prestart-success-screen.tsx
│   ├── plant-requests-screen.tsx
│   ├── assets-screen.tsx
│   ├── asset-detail-screen.tsx
│   ├── asset-checklist-screen.tsx
│   ├── plant-inductions-screen.tsx
│   └── plant-induction-success-screen.tsx
└── profile/
    └── profile-screen.tsx
```

### Public Routes
```
app/(public)/w/
├── prestart/[qrCode]/page.tsx     # Asset prestart
├── sign-in/[code]/page.tsx        # Site sign-in
├── induct/
│   ├── [qrCode]/page.tsx          # QR induction
│   └── invite/[shareCode]/page.tsx # Invite induction
├── toolbox/attend/[qrCode]/page.tsx # Toolbox attendance
├── swms/view/[code]/page.tsx      # SWMS external sign
├── asset/[qrCode]/page.tsx        # Asset view
└── upload/[shareCode]/page.tsx    # Document upload
```

### Hooks Organization
```
hooks/worker/
├── screens/
│   ├── use-task-hub-screen-data.ts
│   ├── use-swms-sign-screen-data.ts
│   ├── use-checklist-conduct-screen-data.ts
│   ├── use-prestart-detail-screen-data.ts
│   └── [48 more hooks, one per screen]
└── use-demo-worker-context.ts     # Demo worker provider
```

---

## 7. Open Questions

1. **QR Code Generation**
   - Who generates QR codes? (Admin UI?)
   - Format: Image, PDF, or printable page?
   - Regeneration: Can codes be regenerated?

2. **Offline Sync**
   - Conflict resolution strategy?
   - Maximum offline duration?
   - Priority: Which mutations sync first?

3. **Public Access Security**
   - Rate limiting on public endpoints?
   - QR code expiration?
   - Abuse prevention?

4. **Mobile Performance**
   - Image compression for photos?
   - Virtual scrolling for long lists?
   - Code splitting per tab?

5. **Worker Identity**
   - Demo mode forever, or plan for real auth?
   - Multi-worker support in simulator?
   - Worker switching in demo?

---

## Appendix

### A. Complete Screen Wireframes
(Provided inline throughout section 4.2)

### B. API Endpoint Reference
(Provided inline throughout section 4.2)

### C. Share Code Generation

**SWMS Share Codes:**
```typescript
// 12-character random alphanumeric
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

**Invite Share Codes:**
```typescript
// 10-character timestamp-based
const generateInviteCode = () => {
  const timestamp = Date.now().toString(36); // Base36 encoding
  const random = Math.random().toString(36).substring(2, 6);
  return `UPL-${timestamp.substring(0, 4)}${random}`;
};

// Example: UPL-2x5k8p
```

**QR Code Types:**
- Asset QR: Freeform (set by admin, e.g., `QR-123ABC`)
- Project QR: Stored in `projects.metadata.qrCode.code` (freeform)
- Toolbox QR: Auto-generated on meeting creation

### D. PWA Configuration (Future)

**manifest.json:**
```json
{
  "name": "PRJ Construction Worker",
  "short_name": "PRJ Worker",
  "description": "Field worker mobile app",
  "start_url": "/worker",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker:**
```typescript
// Cache static assets
const CACHE_NAME = 'prj-worker-v1';
const STATIC_ASSETS = [
  '/',
  '/worker',
  '/styles.css',
  '/icons/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Cache-first strategy for offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```

---

*This document defines the complete mobile simulator: 51 screens, 7 QR flows, all interactions, all data requirements. Use as source of truth for mobile worker experience rebuild.*
