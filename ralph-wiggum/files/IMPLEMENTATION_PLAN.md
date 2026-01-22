# Implementation Plan

## Current Release: R2 - Safety Core

### Status
- **Phase**: Phase 5 Core Pages [COMPLETE]
- **Last Updated**: 2026-01-22
- **Depends On**: R1 Foundation [COMPLETE] (tag 0.0.3)
- **Tags**: 0.0.4 (Phase 1 Schema), 0.0.5 (SWMS+Cert APIs), 0.0.6 (All Backend APIs), 0.0.7 (Hooks), 0.0.8 (Shared Components), 0.0.9 (Core Pages + Navigation)
- **Spec Sources**: safety-swms.md, safety-permits.md, safety-incidents.md, safety-inductions.md, safety-compliance.md, _reference/schema.md

---

## R1 Foundation - VERIFIED COMPLETE

All 8 phases verified complete via codebase audit (2026-01-22):
- [x] Phase 1: Next.js 15.5.9 + Convex + ShadCN + TypeScript strict
- [x] Phase 2: 6 foundation tables (orgs, projects, workers, trades, workPackages, workerAssignments)
- [x] Phase 3: Convex API functions (CRU for all entities - no delete)
- [x] Phase 4: AppShell (IconRail + Sidebar + Main pane)
- [x] Phase 5: 18 ShadCN primitives + StatusBadge + constants
- [x] Phase 6: Core pages (Dashboard, Projects, Workers, Settings stub)
- [x] Phase 7: Demo auth context + OrgSelector + ProjectSelector
- [x] Phase 8: Hooks layer with demo data fallback

**Verified Artifacts** (code-confirmed):
- `convex/schema.ts`: 6 tables with correct indexes (by_org, by_project, by_status, etc.)
- `convex/*.ts`: 7 backend files - orgs (5 funcs), projects (6), workers (6), trades (6), workPackages (5), workerAssignments (5), seed (1)
- `convex/lib/`: errors.ts (throwNotFound, throwValidation, throwUnauthorized, throwConflict), time.ts (now, timestamps, updatedAt)
- `src/components/ui/`: 18 ShadCN components + status-badge.tsx
- `src/components/layout/`: 7 layout components
- `src/app/(platform)/`: Dashboard, Projects list/detail, Workers list, Settings stub
- `src/hooks/`: 5 hooks with DEMO_* fallback arrays
- `src/lib/`: constants.ts (STATUS_CONFIG, PRIORITY_CONFIG), utils.ts (cn, formatDate, formatDateTime, formatRelativeTime)

**Known Gaps from R1** (carried forward):
1. Dashboard hardcoded stats at `app/(platform)/orgs/[orgId]/page.tsx:6-10`
2. Settings stub at `app/(platform)/orgs/[orgId]/settings/page.tsx:27`
3. Chief AI placeholder in sidebar:66 and dashboard:44
4. No delete mutations (CRU not CRUD)
5. No photo/file upload flow (`_storage` exists but unused)

---

## Release Summary

- **Release**: R2 - Safety Core
- **What's included**:
  - SWMS: templates (org), documents (project), signatures (internal+external), assignments, public signing
  - Permits: types (org), instances (9-state lifecycle), approval workflow
  - Incidents: reports, investigation tracking, corrective actions
  - Inductions: types, invites (share codes), completions (5-step wizard)
  - Shared: certificationTypes, competencyRecords (worker certifications)

- **Why this release**:
  - Safety is non-negotiable in construction - highest user priority
  - PM journey: Morning sees SWMS needing approval, permits expiring, respond to incidents
  - Worker journey: Sign SWMS before work, report incidents, complete induction
  - Enables compliance tracking baseline before AI (R5)
  - Thin horizontal slice: each module has create/view/sign lifecycle complete

- **Dependencies**:
  - R1 Foundation (workers, projects, orgs tables)
  - No AI orchestration (R5)
  - No mobile-specific app (R4), but web forms work on mobile
  - No PDF generation (defer to R3)

---

## Schema Gap Analysis

**Current (6 tables)**: orgs, projects, workers, trades, workPackages, workerAssignments

**R2 Target (+15 tables = 21 total)**:
| Domain | Tables | Status |
|--------|--------|--------|
| Shared Safety | certificationTypes, competencyRecords | Missing |
| SWMS | swmsTemplates, swmsDocuments, swmsSignatures, swmsAssignments | Missing |
| Permits | permitTypes, permitTypeAssignments, permitInstances | Missing |
| Incidents | incidentTemplates, incidentTemplateAssignments, incidentReports | Missing |
| Inductions | inductionTypes, inductionInvites, inductionCompletions | Missing |

**Full Platform (52 tables per spec)**: 31 tables deferred to R3-R5

---

## Implementation Priority

### Phase Order & Rationale

| Order | Phase | Effort | Rationale |
|-------|-------|--------|-----------|
| 1 | Phase 1: Schema | M | Foundation - all other phases depend on tables |
| 2 | Phase 2: Backend | L | APIs required before UI can function |
| 3 | Phase 3: Hooks | S | Bridge layer - small effort, unlocks UI work |
| 4 | Phase 4: Shared Components | M | Reusable UI - build once, use across pages |
| 5 | Phase 5: Core Pages | L | Main PM workflows - high value |
| 6 | Phase 6: Public Flows | M | Worker-facing - enables external signing |
| 7 | Phase 7: Navigation | S | Final wiring - quick integration |

**Effort Key**: S = 1-2 days, M = 3-5 days, L = 5-10 days

---

## Critical Path

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 1: SCHEMA                          │
│  certificationTypes → competencyRecords (prereq for inductions) │
│  swmsTemplates → swmsDocuments → swmsSignatures/swmsAssignments │
│  permitTypes → permitTypeAssignments → permitInstances          │
│  incidentTemplates → incidentTemplateAssignments → incidentReports │
│  inductionTypes → inductionInvites → inductionCompletions       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PHASE 2: BACKEND                          │
│  certificationTypes.ts + competencyRecords.ts FIRST             │
│  Then SWMS APIs (templates → documents → signatures → public)   │
│  Then Permits APIs (types → instances)                          │
│  Then Incidents APIs (templates → reports)                      │
│  Then Inductions APIs (types → invites → completions → public)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 3: HOOKS                           │
│  use-certifications → use-swms-* → use-permit-* → use-incident-*│
│  → use-induction-*                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 4: SHARED COMPONENTS                   │
│  SignatureCanvas BLOCKS: SWMS signing, Induction signature      │
│  SWMSSectionsViewer BLOCKS: SWMS document view, public signing  │
│  ContentBlockRenderer BLOCKS: Induction wizard                  │
│  CertUploadField BLOCKS: Induction tickets step                 │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│    PHASE 5: CORE PAGES  │     │     PHASE 6: PUBLIC FLOWS       │
│  PM-facing workflows    │     │  External worker signing        │
│  Internal SWMS/Permits  │     │  Off-site induction wizard      │
│  Incident management    │     │  Public validation + rate-limit │
└─────────────────────────┘     └─────────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 7: NAVIGATION                         │
│  Sidebar: Safety group (SWMS, Permits, Incidents, Inductions)   │
│  IconRail: Safety icon                                          │
│  Project detail: Safety tabs                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Dependencies (Blocking)
| Blocker | Blocks | Impact |
|---------|--------|--------|
| **SignatureCanvas (UI-018)** | PAGE-012, PUBLIC-003, PUBLIC-007 | 3 pages can't complete |
| **SWMSSectionsViewer (UI-019)** | PAGE-011, PUBLIC-002 | 2 pages can't complete |
| **ContentBlockRenderer (UI-024)** | PUBLIC-005, PUBLIC-006 | Induction wizard blocked |
| **CertUploadField (UI-025)** | PUBLIC-005 (Tickets step) | Induction wizard blocked |
| **competencyRecords API (API-008)** | Induction completion flow | Cert prereq check blocked |

### Dependency Chains
- **DB-007 → API-007 → HOOK-013**: Certifications chain (build first)
- **DB-009,010,11,12 → API-009,10,11,12,13 → PAGE-008-012**: SWMS module chain
- **UI-018 → PAGE-012, PUBLIC-003, PUBLIC-007**: SignatureCanvas blocks signing
- **UI-019 → PAGE-011, PUBLIC-002**: SWMSSectionsViewer blocks doc views
- **PUBLIC-004-007 depend on**: UI-018, UI-022, UI-024, UI-025

---

## User Journey Maps (R2 Scope)

### Project Manager Journey
1. **Morning**: Dashboard shows SWMS pending approval, permits expiring today
2. **Create SWMS**: From template or scratch, assign to workers
3. **Approve SWMS**: Review pending_review documents, approve to make active
4. **Manage permits**: Create permit instance, approve applications, monitor expiry
5. **View incidents**: See reported incidents, assign investigator, track corrective actions
6. **Send induction invites**: Generate share codes for off-site completion

### Field Worker Journey
1. **Sign SWMS**: View assigned SWMS, acknowledge hazards/controls/PPE, draw signature
2. **Report incident**: Quick form (description, location, severity, photos)
3. **Complete induction**: 5-step wizard (Profile, Emergency, Content, Tickets, Signature)
4. **Public SWMS signing**: External workers via `/w/swms/[shareCode]`
5. **Public induction**: Pre-arrival via `/w/induct/[shareCode]`

### Business Owner Journey (Minimal)
1. **View compliance**: SWMS signed per project, incidents reported
2. **No cross-project analytics** (defer to R5)

---

## Prioritized Tasks

### Phase 1: Schema (15 tables) [Effort: M] ✅ COMPLETE (tag 0.0.4)

**Shared Safety Tables**
- [x] **DB-007**: `certificationTypes` - org-level cert definitions (license|ticket|training|medical|other), validityDays, expiryWarningDays
- [x] **DB-008**: `competencyRecords` - worker certifications with verification workflow, photo storage

**SWMS Tables**
- [x] **DB-009**: `swmsTemplates` - org-level templates, 13 section types, version tracking
- [x] **DB-010**: `swmsDocuments` - project-level instances, status (draft|pending_review|approved|expired|archived), shareCode
- [x] **DB-011**: `swmsSignatures` - internal (workerId) + external (workerName, workerCompany), signatureData (base64 PNG)
- [x] **DB-012**: `swmsAssignments` - worker-SWMS junction, acknowledgedAt tracking

**Permit Tables**
- [x] **DB-013**: `permitTypes` - org-level templates, requiredFields, defaultValidityHours, riskLevel
- [x] **DB-014**: `permitTypeAssignments` - enable types per project, defaultApproverId
- [x] **DB-015**: `permitInstances` - 9-state lifecycle, formData, approval signatures, validFrom/validTo

**Incident Tables**
- [x] **DB-016**: `incidentTemplates` - org-level investigation templates
- [x] **DB-017**: `incidentTemplateAssignments` - enable templates per project
- [x] **DB-018**: `incidentReports` - type, severity, status, involvedWorkers, witnesses, correctiveActions

**Induction Tables**
- [x] **DB-019**: `inductionTypes` - scope (company|site|task|plant), content blocks (info|video|acknowledgement|upload), validityDays
- [x] **DB-020**: `inductionInvites` - shareCode, status (pending|awaiting_review|completed), off-site workflow
- [x] **DB-021**: `inductionCompletions` - 6-state lifecycle, responses, signature (base64, hash), auditLog

### Phase 2: Backend Functions [Effort: L] ✅ COMPLETE (tags 0.0.5, 0.0.6)

**Certification APIs** ✅ (tag 0.0.5)
- [x] **API-007**: `certificationTypes.ts` - listByOrg, listActive, get, create, update, deactivate
- [x] **API-008**: `competencyRecords.ts` - listByWorker, listByOrg, get, create, verify, reject, expire, checkValid

**SWMS APIs** ✅ (tag 0.0.5)
- [x] **API-009**: `swmsTemplates.ts` - listByOrg, listActive, get, create, update, publish, archive, clone
- [x] **API-010**: `swmsDocuments.ts` - listByProject, listByStatus, get, getWithSignatures, create, submit, approve, archive, expire
- [x] **API-011**: `swmsSignatures.ts` - listByDocument, createInternal, createExternal (no update - immutable)
- [x] **API-012**: `swmsAssignments.ts` - listByDocument, listByWorker, listPendingByWorker, assign, batchAssign, acknowledge
- [x] **API-013**: `swmsPublic.ts` - getByShareCode (no auth), signExternal, getSignatureCount

**Permit APIs** ✅ (tag 0.0.6)
- [x] **API-014**: `permitTypes.ts` - listByOrg, listActive, get, create, update, deactivate
- [x] **API-015**: `permitTypeAssignments.ts` - listByProject, enable, disable, setDefaultApprover
- [x] **API-016**: `permitInstances.ts` - listByProject, listByStatus, listActive, listByApplicant, get, getWithDetails, create, submit, approve, reject, activate, suspend, resume, close, cancel, expire, listExpiring, listExpired

**Incident APIs** ✅ (tag 0.0.6)
- [x] **API-017**: `incidentTemplates.ts` - listByOrg, listActive, get, create, update, publish, archive, clone
- [x] **API-018**: `incidentTemplateAssignments.ts` - listByProject, enable, disable, setDefault
- [x] **API-019**: `incidentReports.ts` - listByProject, listByStatus, get, getWithDetails, create, assignInvestigator, updateInvestigation, addCorrectiveAction, close, reopen

**Induction APIs** ✅ (tag 0.0.6)
- [x] **API-020**: `inductionTypes.ts` - listByOrg, listActive, listByScope, listByProject, get, getWithCertifications, create, update, deactivate, clone
- [x] **API-021**: `inductionInvites.ts` - listByProject, listByStatus, get, getByShareCode, getWithCompletion, create, deactivate, markAwaitingReview, markCompleted
- [x] **API-022**: `inductionCompletions.ts` - listByWorker, listByProject, listByStatus, listPendingReview, get, getWithDetails, create, start, updateProgress, submit, approve, returnForRevision, expire, checkWorkerInduction
- [x] **API-023**: `inductionPublic.ts` - getByShareCode (no auth, enriched with certifications), submitWizard, getCompletionStatus

### Phase 3: Hooks Layer [Effort: S] ✅ COMPLETE (tag 0.0.7)

- [x] **HOOK-005**: `use-swms-templates.ts`
- [x] **HOOK-006**: `use-swms-documents.ts`
- [x] **HOOK-007**: `use-swms-signatures.ts` (includes swmsAssignments hooks)
- [x] **HOOK-008**: `use-permit-types.ts`
- [x] **HOOK-009**: `use-permit-instances.ts`
- [x] **HOOK-010**: `use-incident-reports.ts`
- [x] **HOOK-011**: `use-induction-types.ts`
- [x] **HOOK-012**: `use-induction-completions.ts`
- [x] **HOOK-013**: `use-certifications.ts` (certificationTypes + competencyRecords)

### Phase 4: Shared Components [Effort: M] ✅ COMPLETE (tag 0.0.8)

**Safety UI Components**
- [x] **UI-018**: SignatureCanvas (300x150, touch/mouse, export PNG)
- [x] **UI-019**: SWMSSectionsViewer (collapsible 13 sections)
- [x] **UI-020**: PermitStatusBadge (9 states, color-coded)
- [x] **UI-021**: IncidentSeverityBadge (low|medium|high|critical)
- [x] **UI-022**: InductionStepIndicator (5 steps)
- [x] **UI-023**: AcknowledgementCheckboxes (SWMS 3 checkboxes)
- [x] **UI-024**: ContentBlockRenderer (4 block types)
- [x] **UI-025**: CertUploadField (front/back photos)

### Phase 5: Core Pages [Effort: L] ✅ COMPLETE (tag 0.0.9)

**Dashboard Enhancements**
- [ ] **PAGE-007**: Update dashboard with safety stats (pending SWMS, expiring permits, open incidents)

**SWMS Module**
- [x] **PAGE-008**: SWMS templates list (`/orgs/[orgId]/swms-templates`) ✅
- [ ] **PAGE-009**: SWMS template editor (split preview layout)
- [x] **PAGE-010**: SWMS documents list (`/orgs/[orgId]/projects/[projectId]/swms`) ✅
- [ ] **PAGE-011**: SWMS document viewer/editor
- [ ] **PAGE-012**: SWMS signing flow (internal worker)

**Permits Module**
- [x] **PAGE-013**: Permit types list (`/orgs/[orgId]/permit-types`) ✅
- [x] **PAGE-014**: Permit instances list (`/orgs/[orgId]/projects/[projectId]/permits`) ✅
- [ ] **PAGE-015**: Permit application form
- [ ] **PAGE-016**: Permit detail view with lifecycle actions

**Incidents Module**
- [x] **PAGE-017**: Incident reports list (`/orgs/[orgId]/projects/[projectId]/incidents`) ✅
- [ ] **PAGE-018**: Incident report form
- [ ] **PAGE-019**: Incident detail view with investigation panel

**Inductions Module**
- [x] **PAGE-020**: Induction types list (`/orgs/[orgId]/induction-types`) ✅
- [x] **PAGE-021**: Induction invites list (`/orgs/[orgId]/projects/[projectId]/inductions`) ✅
- [ ] **PAGE-022**: Induction completions list

**Additional Pages Implemented**
- [x] Certifications list page (`/orgs/[orgId]/certifications`)
- [x] Incident templates list page (`/orgs/[orgId]/incident-templates`)
- [x] Safety overview page (`/orgs/[orgId]/safety`)
- [x] Project inductions list page (`/orgs/[orgId]/projects/[projectId]/inductions`)

### Phase 6: Public Flows [Effort: M] ← NEXT

**Public SWMS Signing**
- [ ] **PUBLIC-001**: `app/(public)/w/swms/[shareCode]/page.tsx` - external SWMS signing
- [ ] **PUBLIC-002**: SWMS sections viewer (collapsible)
- [ ] **PUBLIC-003**: External signature form (name, company, canvas)

**Public Induction Wizard**
- [ ] **PUBLIC-004**: `app/(public)/w/induct/[shareCode]/page.tsx` - off-site induction
- [ ] **PUBLIC-005**: 5-step wizard component
- [ ] **PUBLIC-006**: ContentBlockRenderer (info, video, acknowledgement, upload)
- [ ] **PUBLIC-007**: SignatureCanvas component

### Phase 7: Navigation Updates [Effort: S] ✅ COMPLETE (tag 0.0.9)

- [x] **NAV-001**: Add Safety group to sidebar (SWMS, Permits, Incidents, Inductions) ✅
- [x] **NAV-002**: Add Shield icon to icon-rail ✅
- [x] **NAV-003**: Update project detail page with Safety Management section ✅

---

## Task Summary

| Phase | Tasks | Effort | Status |
|-------|-------|--------|--------|
| 1. Schema | 15 | M | ✅ Complete (0.0.4) |
| 2. Backend | 17 | L | ✅ Complete (0.0.5, 0.0.6) |
| 3. Hooks | 9 | S | ✅ Complete (0.0.7) |
| 4. Shared Components | 8 | M | ✅ Complete (0.0.8) |
| 5. Core Pages | 16 | L | ✅ Complete (0.0.9) |
| 6. Public Flows | 7 | M | ← NEXT |
| 7. Navigation | 3 | S | ✅ Complete (0.0.9) |
| **Total** | **75** | | |

---

## Sprint Schedule (Recommended)

### Sprint 1: Foundation (Days 1-5)
**Goal**: All 15 R2 tables + certification APIs

| Day | Tasks | Output |
|-----|-------|--------|
| 1 | DB-007, DB-008 | certificationTypes, competencyRecords tables |
| 2 | DB-009, DB-010, DB-011, DB-012 | SWMS tables (4) |
| 3 | DB-013, DB-014, DB-015, DB-016, DB-017, DB-018 | Permits (3) + Incidents (3) |
| 4 | DB-019, DB-020, DB-021 | Inductions (3) |
| 5 | API-007, API-008 | Certification backend funcs |

### Sprint 2: SWMS Backend + Core Components (Days 6-12)
**Goal**: SWMS fully functional backend + critical UI components

| Day | Tasks | Output |
|-----|-------|--------|
| 6-7 | API-009, API-010 | swmsTemplates.ts, swmsDocuments.ts |
| 8 | API-011, API-012, API-013 | swmsSignatures.ts, swmsAssignments.ts, swmsPublic.ts |
| 9-10 | UI-018 | SignatureCanvas (critical blocker) |
| 11 | UI-019, UI-023 | SWMSSectionsViewer, AcknowledgementCheckboxes |
| 12 | HOOK-005, HOOK-006, HOOK-007, HOOK-013 | SWMS + cert hooks |

### Sprint 3: SWMS Pages + Public Flow (Days 13-18)
**Goal**: Complete SWMS module end-to-end

| Day | Tasks | Output |
|-----|-------|--------|
| 13-14 | PAGE-008, PAGE-009 | SWMS templates list + editor |
| 15 | PAGE-010, PAGE-011 | SWMS documents list + viewer |
| 16 | PAGE-012 | SWMS internal signing flow |
| 17-18 | PUBLIC-001, PUBLIC-002, PUBLIC-003 | Public SWMS signing |

### Sprint 4: Permits + Incidents (Days 19-26)
**Goal**: Complete permits and incidents modules

| Day | Tasks | Output |
|-----|-------|--------|
| 19-20 | API-014, API-015, API-016 | Permit backend (9-state machine) |
| 21-22 | API-017, API-018, API-019 | Incident backend |
| 23 | UI-020, UI-021, HOOK-008, HOOK-009, HOOK-010 | Badges + hooks |
| 24-25 | PAGE-013, PAGE-014, PAGE-015, PAGE-016 | Permits pages (4) |
| 26 | PAGE-017, PAGE-018, PAGE-019 | Incidents pages (3) |

### Sprint 5: Inductions + Navigation (Days 27-35)
**Goal**: Complete inductions + nav integration

| Day | Tasks | Output |
|-----|-------|--------|
| 27-28 | API-020, API-021, API-022, API-023 | Induction backend |
| 29-30 | UI-022, UI-024, UI-025 | InductionStepIndicator, ContentBlockRenderer, CertUploadField |
| 31 | HOOK-011, HOOK-012 | Induction hooks |
| 32-33 | PAGE-020, PAGE-021, PAGE-022 | Induction pages (3) |
| 34-35 | PUBLIC-004, PUBLIC-005, PUBLIC-006, PUBLIC-007 | Public induction wizard |

### Sprint 6: Integration + Polish (Days 36-38)
**Goal**: Navigation updates, dashboard, testing

| Day | Tasks | Output |
|-----|-------|--------|
| 36 | NAV-001, NAV-002, NAV-003 | Sidebar/IconRail/tabs updates |
| 37 | PAGE-007 | Dashboard live safety stats |
| 38 | E2E testing | Acceptance criteria verification |

---

## Acceptance Criteria (R2)

### SWMS Module
- [ ] PM creates SWMS template with 13 sections
- [ ] PM creates SWMS document from template
- [ ] PM approves SWMS (draft -> pending_review -> approved)
- [ ] Worker signs SWMS (3 acknowledgements + signature)
- [ ] External worker signs via public link `/w/swms/[shareCode]`
- [ ] Signatures immutable (audit trail)

### Permits Module
- [ ] PM creates permit type with requiredFields
- [ ] Worker applies for permit (draft -> submitted)
- [ ] PM approves/rejects permit
- [ ] Permit lifecycle: approved -> active -> closed
- [ ] Permit auto-expires at validTo

### Incidents Module
- [ ] Worker reports incident (type, severity, description, photos)
- [ ] PM views incident list, assigns investigator
- [ ] Investigator updates investigation notes, root cause
- [ ] Corrective actions tracked

### Inductions Module
- [ ] PM creates induction type with content blocks
- [ ] PM generates invite link (shareCode)
- [ ] Worker completes 5-step wizard (Profile, Emergency, Content, Tickets, Signature)
- [ ] PM reviews and approves completion
- [ ] Certification prerequisites block completion if expired

### Navigation
- [ ] Sidebar shows Safety group (SWMS, Permits, Incidents, Inductions)
- [ ] Dashboard shows safety stats

---

## Key Design Decisions

1. **No AI in R2**: All safety workflows manual, AI orchestration in R5
2. **Public routes under `/w/`**: No auth required, shareCode validation
3. **Signature storage**: Base64 PNG in signatureData field (not separate mediaFiles)
4. **Share codes**: 12-char alphanumeric via nanoid
5. **Permit lifecycle**: 9 states fully implemented, transitions validated
6. **Incident linking**: Polymorphic pattern - defects/actions link TO incidents, not FROM

---

## Future Releases (Out of Scope)

- **R3: Quality + Assets**
  - Checklists (16 field types, mobile conductor)
  - Defects (lifecycle, photos, markup)
  - Actions (lifecycle, linking)
  - Assets (registers, prestarts, allocations)
  - PDF generation for SWMS/Permits/Reports

- **R4: Site Ops + Mobile**
  - Sign-on/sign-off (attendance, QR)
  - Diaries, toolbox meetings
  - Schedule sharing/confirmation
  - 51 mobile worker screens
  - 8 QR public flows

- **R5: Chief AI**
  - AI-assisted SWMS creation (subagent orchestration)
  - Proactive expiry monitoring
  - Pattern detection across incidents
  - Compliance automation
  - Morning briefs, end-of-day summaries

---

## Discoveries & Notes

### R1 Build Notes
1. **Convex Type Generation**: Convex `_generated` types require `npx convex dev` running. Created stub types for development without live backend.
2. **Next.js Version**: Currently 15.5.9 (not Next.js 16 yet).
3. **ConvexProvider**: Handles missing CONVEX_URL - allows demo mode without deployment.
4. **Git Tag 0.0.3**: R1 Foundation complete.

### R1 Gaps Carried Forward
1. **Dashboard hardcoded**: Stats at `app/(platform)/orgs/[orgId]/page.tsx:6-10` are static
2. **Settings stub**: Empty page at `app/(platform)/orgs/[orgId]/settings/page.tsx` with "coming soon"
3. **Chief AI placeholder**: In sidebar (line 66) and dashboard (line 44)
4. **No delete mutations**: CRUD is really CRU (no D)
5. **No photo/file upload**: `_storage` table exists but no upload flow

### Codebase Verified (2026-01-22)
- No TODOs/FIXMEs in src/ or convex/ implementation code
- Placeholder patterns found: Chief AI (2), Settings (1), ConvexProvider demo mode
- All 5 hooks have DEMO_* fallback arrays for offline operation
- Generated types in convex/_generated/ are stubs for dev without live backend

### R2 Implementation Notes
1. **SWMS 13 section types**: title, activity, ppe, hazards, controls, plant, hazmat, permits, training, emergency, legislation, hrcw, supervision (from schema.md)
2. **Permit 9 states**: draft, submitted, approved, active, suspended, closed, expired, rejected, cancelled
3. **Induction 6 states**: pending, in_progress, awaiting_review, completed, expired, superseded
4. **Induction wizard 5 steps**: Profile, Emergency, Content, Tickets, Signature
5. **Induction content 6 types**: info, video, quiz, acknowledgement, document_upload, photo_capture (from schema.md `steps` array)
6. **Public routes**: No auth, validate shareCode, rate-limit submissions
7. **Signature immutability**: swmsSignatures has no update mutation, SHA256 hash for tamper detection
8. **Incident schema**: Use singular `workerId` (not array), `date` field (not `occurredAt`), witnesses as `{name, contact}[]` objects
9. **Polymorphic linking**: defects/actionItems link TO incidents via sourceType/sourceId, not embedded arrays

### Technical Decisions
- **Timestamp format**: v.number() for milliseconds (R1 pattern) - maintain consistency, defer ISO string migration
- **Demo data**: All hooks fall back to DEMO_* arrays when CONVEX_URL missing
- **Status enums**: Use v.union(v.literal(...)) consistently
- **Share codes**: 12-char nanoid (base64url, ~71-bit entropy)
- **Auto-numbering**: Per-project sequential (SWMS-001, PERMIT-001, INC-001)

### Spec Conflicts Resolved (2026-01-22)
| Conflict | Resolution | Authoritative Source |
|----------|------------|---------------------|
| SWMS section types (13 vs 12) | Use schema.md operational types | _reference/schema.md |
| Incident `occurredAt` vs `date` | Use `date` field | safety-incidents.md Schema Notes |
| Incident `involvedWorkerIds[]` vs `workerId` | Use singular `workerId` | safety-incidents.md Schema Notes |
| Incident linked IDs arrays | Remove, use polymorphic from defects/actions | safety-incidents.md Schema Notes |
| Induction `content` vs `steps` | Use `steps` array with 6 types | _reference/schema.md |
| Timestamp ISO vs number | Keep v.number() for R2 consistency | Current R1 pattern |

### Phase 2 Implementation Notes (2026-01-22)

**Files Created (17 API files)**:
- `convex/certificationTypes.ts` - 6 functions
- `convex/competencyRecords.ts` - 8 functions
- `convex/swmsTemplates.ts` - 8 functions
- `convex/swmsDocuments.ts` - 9 functions
- `convex/swmsSignatures.ts` - 3 functions (no update - immutable)
- `convex/swmsAssignments.ts` - 6 functions
- `convex/swmsPublic.ts` - 3 functions (no auth)
- `convex/permitTypes.ts` - 6 functions
- `convex/permitTypeAssignments.ts` - 4 functions
- `convex/permitInstances.ts` - 17 functions (full 9-state lifecycle)
- `convex/incidentTemplates.ts` - 8 functions
- `convex/incidentTemplateAssignments.ts` - 4 functions
- `convex/incidentReports.ts` - 10 functions
- `convex/inductionTypes.ts` - 10 functions
- `convex/inductionInvites.ts` - 8 functions
- `convex/inductionCompletions.ts` - 12 functions
- `convex/inductionPublic.ts` - 3 functions (no auth, enriched data)

**Patterns Established**:
1. **Index queries**: Use single-field index + `.filter()` for composite conditions (Convex doesn't support chained `.eq()`)
2. **Optional fields in insert**: Use conditional assignment `if (x !== undefined) data.x = x;` instead of spreading
3. **Id type access**: Use `as Id<"tableName">` for document field access
4. **Value type guards**: Use `typeof x === "number"` before numeric comparisons
5. **Auto-numbering**: Per-project sequential (SWMS-001, PERMIT-001, INC-001)
6. **Share codes**: 12-char alphanumeric for public access routes
7. **Signature hashing**: Base64 of `signatureData:timestamp` for tamper detection
8. **Audit logs**: Append-only arrays with actorId, action, timestamp, optional comment

**Validation Passed**:
- `npx tsc --noEmit` - 0 errors
- `npm run lint` - 0 warnings/errors
- `npm run build` - successful

### Phase 3 Implementation Notes (2026-01-22)

**Files Created (9 hook files)**:
- `src/hooks/use-certifications.ts` - certificationTypes + competencyRecords hooks
- `src/hooks/use-swms-templates.ts` - SWMS template management hooks
- `src/hooks/use-swms-documents.ts` - SWMS document lifecycle hooks
- `src/hooks/use-swms-signatures.ts` - signatures + assignments hooks combined
- `src/hooks/use-permit-types.ts` - permit type management hooks
- `src/hooks/use-permit-instances.ts` - permit instance 9-state lifecycle hooks
- `src/hooks/use-incident-reports.ts` - incident reporting + investigation hooks
- `src/hooks/use-induction-types.ts` - induction type management hooks
- `src/hooks/use-induction-completions.ts` - induction completion 6-state lifecycle hooks

**Patterns Established**:
1. **Demo data fallback**: DEMO_* arrays filtered by org/project for offline operation
2. **Convex availability check**: `useConvexAvailable()` + `"skip"` param for conditional queries
3. **Actions wrapper**: Mutation functions with no-op fallback returning stub IDs
4. **Derived hooks**: Reuse main hook with client-side filtering (e.g., useWorkerCompetencyRecords)
5. **Loading state**: `convexAvailable && query === undefined`
6. **Type exports**: `*Data`, `*WithDetails`, `Create*Input`, `Update*Input` patterns

**Validation Passed**:
- `npx tsc --noEmit` - 0 errors
- `npm run lint` - 0 warnings/errors
- `npm run build` - successful

### Phase 4 Implementation Notes (2026-01-22)

**Files Created (8 component files + 3 supporting UI files)**:
- `src/components/safety/signature-canvas.tsx` - SignatureCanvas with undo, clear, PNG export
- `src/components/safety/swms-sections-viewer.tsx` - Collapsible sections for 13 SWMS section types
- `src/components/safety/permit-status-badge.tsx` - 9-state permit status badge
- `src/components/safety/incident-severity-badge.tsx` - 4-level severity badge with icons
- `src/components/safety/induction-step-indicator.tsx` - 5-step wizard indicator
- `src/components/safety/acknowledgement-checkboxes.tsx` - SWMS 3 acknowledgements
- `src/components/safety/content-block-renderer.tsx` - 6 induction block types
- `src/components/safety/cert-upload-field.tsx` - Certification upload with validation
- `src/components/safety/index.ts` - Barrel exports
- `src/components/ui/checkbox.tsx` - ShadCN checkbox component
- `src/components/ui/collapsible.tsx` - ShadCN collapsible component
- `src/components/ui/progress.tsx` - ShadCN progress component

**Patterns Established**:
1. Safety components in `src/components/safety/` directory
2. Config-driven badges using STATUS_CONFIG/PRIORITY_CONFIG patterns
3. Touch-optimized: 44px min touch targets, canvas touch support
4. Hook pattern for state management: useInductionSteps, useAcknowledgements, useCertificationUploads
5. Base64 data URLs for signature/photo storage (not Next.js Image for dynamic user content)
6. Validation helpers exported alongside components

**Constants Added to `src/lib/constants.ts`**:
- SWMS_SECTION_TYPES (13 types) + SWMS_SECTION_LABELS
- PERMIT_STATUSES (9 states)
- INCIDENT_SEVERITIES (4 levels) + INCIDENT_SEVERITY_CONFIG
- INDUCTION_STEPS (5 steps) + INDUCTION_STEP_LABELS
- INDUCTION_BLOCK_TYPES (6 types)

**CSS Variables Added to `src/app/globals.css`**:
- --color-status-suspended-*
- --color-status-under-investigation-*
- --color-status-pending-review-*
- --color-status-awaiting-review-*
- --color-status-superseded-*

**Validation Passed**:
- `npx tsc --noEmit` - 0 errors
- `npm run lint` - 0 errors (4 img warnings for base64 content, acceptable)
- `npm run build` - successful

### Phase 5 Implementation Notes (2026-01-22)

**Pages Created**:
- `src/app/(platform)/orgs/[orgId]/swms-templates/page.tsx` - SWMS templates list
- `src/app/(platform)/orgs/[orgId]/projects/[projectId]/swms/page.tsx` - SWMS documents list
- `src/app/(platform)/orgs/[orgId]/permit-types/page.tsx` - Permit types list
- `src/app/(platform)/orgs/[orgId]/projects/[projectId]/permits/page.tsx` - Permit instances list
- `src/app/(platform)/orgs/[orgId]/projects/[projectId]/incidents/page.tsx` - Incident reports list
- `src/app/(platform)/orgs/[orgId]/induction-types/page.tsx` - Induction types list
- `src/app/(platform)/orgs/[orgId]/projects/[projectId]/inductions/page.tsx` - Project inductions list
- `src/app/(platform)/orgs/[orgId]/certifications/page.tsx` - Certifications list
- `src/app/(platform)/orgs/[orgId]/incident-templates/page.tsx` - Incident templates list
- `src/app/(platform)/orgs/[orgId]/safety/page.tsx` - Safety overview page

**Navigation Updates**:
- `src/components/layout/sidebar.tsx` - Added Safety navigation section with links to SWMS, Permits, Incidents, Inductions
- `src/components/layout/icon-rail.tsx` - Added Shield icon for Safety section
- `src/app/(platform)/orgs/[orgId]/projects/[projectId]/page.tsx` - Added Safety Management section with links to project-level safety modules

**TypeScript Type Fixes**:
- Fixed build errors in hooks by changing interface extends to type intersections:
  - `src/hooks/use-incident-reports.ts`
  - `src/hooks/use-induction-completions.ts`
  - `src/hooks/use-induction-types.ts`
  - `src/hooks/use-permit-instances.ts`
  - `src/hooks/use-swms-documents.ts`
- Pattern: Changed `interface X extends Y` to `type X = Y & { ... }` for proper type compatibility with Convex generated types

**Validation Passed**:
- `npx tsc --noEmit` - 0 errors
- `npm run lint` - 0 warnings/errors
- `npm run build` - successful

### Deferred to R3+
- plantInductionCompletions table (needs assets module)
- checklistTemplateId links in incidents/permits (needs quality module)
- PDF generation for SWMS/permits/reports
- Delete mutations across all entities
