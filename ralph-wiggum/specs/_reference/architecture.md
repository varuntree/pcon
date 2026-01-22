# Architecture Reference

## Index
- [Purpose](#purpose)
- [Tech Stack](#tech-stack)
- [Architecture Layers](#architecture-layers)
- [Key Patterns](#key-patterns)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Security Model](#security-model)
- [Performance Targets](#performance-targets)
- [Deployment Architecture](#deployment-architecture)
- [Build Order](#build-order)
- [Key Integration Points](#key-integration-points)
- [Technology Comparisons](#technology-comparisons)
- [Open Questions](#open-questions)
- [Migration Path (OpenAI → Claude)](#migration-path-openai--claude)
- [Summary](#summary)

## Purpose
Tech stack, layers, patterns - reference for implementation, not feature spec.

## Tech Stack

**Frontend:**
- Next.js 16 (App Router, React Server Components, streaming)
- React 19
- TypeScript 5
- Tailwind CSS 4.0 (utility-first)
- ShadCN (Radix UI primitives + Tailwind)
- Lucide React (icons)

**Backend:**
- Convex (serverless database + functions)
- Real-time reactive queries via WebSocket
- TypeScript-first schema
- Managed hosting

**AI Layer:**
- Claude SDK (native skills/subagents)
- Claude Sonnet 4.5 (default)
- Claude Opus 4.5 (complex reasoning)
- MCP (Model Context Protocol) for database access

**Deployment:**
- Vercel (frontend + edge functions)
- Convex Cloud (backend + database)
- Zero-config CI/CD

**Integrations:**
- Convex Storage (files ≤20MB)
- Puppeteer (PDF generation)
- qrcode (QR generation)
- Resend (email, future)

## Architecture Layers

### Frontend Layer
**Purpose:** UI rendering, user interactions, streaming agent responses

**Components:**
- Next.js 16 App Router
  - `app/(platform)/` - authenticated routes (dashboard, projects, orgs, Chief)
  - `app/(public)/` - public routes (QR flows for workers)
  - `app/api/chief/run/route.ts` - Chief execution endpoint (streaming SSE)
- React Server Components (static HTML, no JS for non-interactive)
- Client Components (marked `'use client'`)
- ShadCN component library
  - `components/ui/` - 28 primitives (button, card, dialog, input, etc.)
  - `components/layout/` - AppShell, PageHeader, EmptyState, etc.
  - `components/chief/` - Chat interface (ShadCN-based, no ChatKit)
  - `components/worker/` - Mobile simulator screens
  - `components/[module]/` - Domain-specific (defects, swms, etc.)

**Data Flow:**
- Convex React Client (reactive queries)
- Custom hooks (`use-defects.ts`, etc.)
- Optimistic updates with automatic rollback
- No direct Convex imports in components (separation of concerns)

**State Management:**
- Convex queries auto-update via WebSocket push (10-50ms latency)
- Local state via useState/useReducer
- Session state via Claude SDK (conversations table)

**Rendering:**
- Server: Static HTML for non-interactive content
- Client: Interactive components with hooks/event handlers
- Streaming: Chief responses via Server-Sent Events

**Browser Compatibility Matrix:**

**Supported Browsers:**
- Chrome 90+ (primary target)
- Safari 14+
- Firefox 88+
- Edge 90+

**Mobile Browsers:**
- iOS Safari 14+
- Chrome Android 90+

**Graceful Degradation:**
- WebSocket fallback to long polling
- No IE11 support (end of life)

---

### Agent Layer
**Purpose:** AI operations, database access via MCP, autonomous workflows

**Core Components:**
- Claude SDK entry point: `query()` from `@anthropic-ai/claude-agent-sdk`
- MCP Server (Convex): `mcp-server-convex/` - Node.js process, stdio JSON-RPC
- Skills System: `.claude/` directory
  - `CLAUDE.md` - global instructions (identity, behavior, rules)
  - `skills/database-read/`, `database-write/`, `database-undo/` - core skills
  - `skills/domain-*/` - domain skills (swms, defects, checklists, etc.)
- Subagents: Specialized agents via `Task` tool (parallel execution)

**Execution Model:**
- Continuous monitoring (scheduled runs: morning brief, end-of-day)
- Event-driven (critical defect → immediate notification)
- Autonomous execution within scope bounds
- Progressive autonomy: Advisor → Operator → Autopilot

**Agent Tools (MCP):**
- `db_read` - query Convex with auto projectId filtering
  - Operations: describe_schema, describe_table, get, multi_get, list, search_text
  - Max 100 records/query, index enforcement, scope injection
- `db_write` - create/update/delete with validation + undo
  - Operations array (1-25), changeset tracking, atomic execution
  - Scope validation, auto-populate projectId/createdAt/createdBy
- `undo` - reverse changeset (24hr limit, dependency check)
- `ai.preamble` - update status line (construction terms only)
- `ai.present` - render ChatKit widgets (result, questions, confirm, sources, intake)
- `ai.read_document` - analyze documents via OpenAI vision API
- `ai.ui_navigate` - suggest navigation

**Subagent Patterns:**
- Orchestrator (Opus): Complex reasoning, multi-step coordination
- Analyzer (Opus): Deep analysis (SWMS hazard identification)
- Validator (Sonnet): Pattern matching, completeness checks
- Writer (Sonnet): Structured output generation
- Parallel execution: Up to 7 concurrent subagents

**Autonomy Levels:**
1. **Advisor** (observes, recommends, no db_write without request)
2. **Operator** (executes routine/reversible, confirms high-risk) ← Current target
3. **Autopilot** (autonomous operations, summaries, exception escalation) ← Future

**Risk Assessment:**
- High risk: Deletion, >5 records, critical tables (workers, projects, swmsDocuments)
- Medium risk: Status updates on high-value entities
- Low risk: Single status-only updates, metadata changes

**Session Management:**
- `sessionId` from `system.init` event
- Resume via `resume: sessionId` option
- Fork via `resume + forkSession`
- Compaction: automatic near token limits, `compact_boundary` marker

---

### Data Layer
**Purpose:** Real-time database, serverless functions, reactive subscriptions

**Convex Architecture:**
- 52 tables total (after consolidation from 97)
- All tables scoped: `orgId` (org-level) and/or `projectId` (project-level)
- Indexes: `by_project`, `by_org`, `by_project_status`, etc.
- TypeScript-first schema → auto-generated types

**Function Types:**
1. **Query** - read data (client + backend callable)
   - `ctx.db.query().withIndex()` - indexed queries
   - Auto-subscribe via Convex React Client
   - Real-time push on data changes
2. **Mutation** - write data (client + backend callable)
   - Atomic transactions
   - Validation → Insert/Update → Return ID
   - Triggers reactive query updates
3. **Action** - external calls (backend only)
   - HTTP fetch, PDF generation, email sending
   - Can call queries/mutations via `runQuery()`/`runMutation()`

**Service/Repo/DTO Pattern:**
- **Service** (`convex/domains/[entity]/service.ts`) - business logic, workflows
- **Repo** (`convex/domains/[entity]/repo.ts`) - data access (getById, listByX, insert, patch)
- **DTO** (`convex/domains/[entity]/dto.ts`) - enrichment (toListItem, toDetail)
- Use when: logic > 50 lines, shared logic, complex validation

**Reactive Subscriptions:**
- Convex pushes updates to all subscribers (10-50ms latency)
- WebSocket connection (auto-reconnect)
- Optimistic updates with rollback on error
- No polling, no manual refresh

**Indexes Strategy:**
- Primary: `by_project` (every project-scoped table)
- Composite: `by_project_status`, `by_project_priority_createdAt`
- Public access: `by_shareCode`, `by_qrCode`
- Polymorphic: `by_source` (sourceType + sourceId)

**Lifecycle Tracking:**
- Every entity has status field (enum)
- Common lifecycles:
  - Simple: `active | inactive | archived`
  - Review: `draft | submitted | approved | rejected | active | expired | archived`
  - Work: `open | in_progress | resolved | closed`
- Audit fields: `createdAt`, `createdBy`, `updatedAt`

**Changesets (Undo System):**
- Table: `executions`
- Fields: `operations[]` (before/after snapshots), `status`, `projectId`, `createdAt`, `undoneAt`
- Operation types: `create | update | delete`
- Undo constraints: <24hrs, no dependents, status = 'executed'

---

### Integration Layer
**Purpose:** External systems, file storage, PDF/QR generation, webhooks

**File Storage (Convex):**
- Primary: Convex Storage (files ≤20MB)
- External: S3/Cloudflare R2 (files >20MB, future)
- Table: `mediaFiles` (storageId, metadata)
- Upload flow:
  1. Request upload URL → signed URL (1hr expiry)
  2. POST file to Convex Storage → storageId
  3. Create mediaFiles record → mediaFileId
- Retrieval: resolve storageId → signed URL → fetch

**PDF Generation (Server-Side):**
- Technology: Puppeteer (HTML → PDF, server-side), React-PDF (client preview)
- Templates: SWMS, induction certificate, checklist report, incident report, permit, defect report
- Verification: Every PDF includes QR with SHA256 hash (entityId + signatures + timestamp)
- Storage: Generated PDFs stored in mediaFiles

**QR Code Generation:**
- Library: `qrcode` (v1.5.4)
- Share codes: 12-char base64url (nanoid), 2^71 entropy
- Table: `shareCodes` (code, type, entityId, projectId, isActive, expiresAt, maxUses, usedCount)
- Types: site sign-in, SWMS signing, induction, prestart, toolbox, asset, document upload, verification
- Public routes: `app/(public)/w/` (no auth required)
- Security: unguessable codes, rate limiting (5/code/hr, 20 failed/IP/hr, CAPTCHA after 3)

**Webhooks (Outbound Events):**
- Table: `webhooks` (orgId, url, secret, events[], retryPolicy)
- Events: incident.created, permit.approved, cert.expiring_soon, swms.signed, etc.
- Payload: Standard envelope (event, timestamp, orgId, projectId, data)
- Signing: HMAC SHA256 (X-Webhook-Signature header)
- Retry: Exponential backoff [0s, 5s, 30s, 2min, 10min, 1hr], max 6 attempts

**Email Integration (Future):**
- Provider: Resend ($20/month, 50k emails)
- Templates: React Email (incident-alert, cert-expiring, action-overdue, daily digest)
- Queue: `emailQueue` table (priority: instant/daily/weekly)
- Digest builder: Cron daily 8am

**External APIs (Future):**
- Procore (project management, OAuth 2.0, 3600 req/hr)
- Xero (accounting, OAuth 2.0, 60 req/min)
- PlanGrid (drawings, REST)
- WeatherAPI (site conditions, 1M req/month free)

---

## Key Patterns

### Pattern 1: Reactive Data Flow
**Convex → Frontend (Standard CRUD)**
```
User action → Convex mutation → Database update
→ Convex detects subscribers → Push via WebSocket
→ Frontend reactive query auto-updates → UI re-renders
```
Latency: 10-50ms

**No Manual Refresh:**
- User A creates defect → Mutation executes
- Convex pushes to User B → UI updates instantly
- Chief's context refreshes automatically

**Optimistic Updates:**
- Update UI immediately → Send mutation
- On success: keep update
- On error: rollback + show toast

---

### Pattern 2: Agent-Mediated Operations
**User → Chief → MCP → Convex**
```
User message → /api/chief/run → Claude SDK query()
→ Agent loads skill → Agent calls db_write (MCP tool)
→ MCP validates scope → MCP creates changeset
→ MCP executes Convex mutation → MCP returns changesetId
→ Agent streams response → UI renders with Undo button
→ Convex pushes updates to all subscribers
```

**Execution Tracking:**
- Every db_write creates `execution` record
- `operations[]` array with before/after snapshots
- `changesetId` returned to agent → user
- Undo available for 24 hours

**Scope Enforcement (Critical):**
- MCP server auto-injects `projectId` filter on db_read
- MCP server validates `projectId` on db_write
- Agent CANNOT read/write across projects
- Enforced at MCP layer (primary boundary)
- Convex indexes (secondary): `by_project` on every table

---

### Pattern 3: Proactive Agent Operations
**Scheduled Runs (No User Action)**
```
Cron trigger (6am daily) → Convex scheduled function
→ API call to Chief with prompt → Agent loads data via db_read
→ Agent analyzes patterns → Agent creates notifications via db_write
→ User sees on app open
```

**Examples:**
- Daily morning brief (overnight activity, what needs attention)
- Compliance checks (expiring permits, certifications)
- Risk alerts (overdue defects, critical issues)
- Workflow automation (close resolved defects after 7 days)

**Event-Driven Execution:**
```
Critical defect raised → Convex mutation
→ Triggers Chief agent via webhook/action → Agent analyzes context
→ Agent notifies stakeholders → Agent suggests corrective actions
→ Results saved to database
```

---

### Pattern 4: Skills-Based Context Loading
**Progressive Loading Strategy:**
1. Session start: Load `CLAUDE.md` (~500 lines) - identity, behavior, safety
2. User mentions domain: Load relevant skill (`domain-defects`, `domain-swms`)
3. Skill needs detail: Load references (`schema.md`, `validation.md`)
4. Navigate away: Unload skills

**Benefits:**
- Context stays focused (1200 lines vs 5000+ monolithic)
- Faster responses (less context to process)
- Easier maintenance (modular, clear boundaries)

**Skill Structure:**
```
.claude/skills/domain-defects/
├── SKILL.md           # Purpose, when to use, instructions, examples
└── references/
    ├── schema.md      # Defect table schema
    ├── workflows.md   # Lifecycle, status flows
    └── examples.md    # Common scenarios
```

**Loading Trigger:**
- User: "Create a defect for the scaffolding issue"
- Agent: Matches "defect" → Loads `domain-defects` skill
- Skill loaded: Access to schema, workflows, validation rules

---

### Pattern 5: Subagent Orchestration
**Complex Multi-Step Workflows:**
```
User request → Main agent (Opus orchestrator)
→ Spawns subagents in parallel:
   - hazard-analyzer (Opus) - identify hazards
   - swms-validator (Sonnet) - completeness check
   - swms-writer (Sonnet) - document generation
→ Collect results → Present to user
```

**Model Selection:**
- Orchestrator: Opus (complex reasoning)
- Analyzer: Opus (deep analysis)
- Validator: Sonnet (pattern matching)
- Writer: Sonnet (structured output)
- Query handler: Haiku (simple/fast)

**Parallel Execution:**
- Claude SDK runs up to 7 subagents concurrently
- Hazard analysis + validation run simultaneously
- Results aggregated by orchestrator
- Faster than sequential execution

---

### Pattern 6: Template/Instance Pattern
**Reusable Templates → Project Instances:**
- `inductionTypes` (org-level) → `inductionCompletions` (project-level)
- `checklistTemplates` (org-level) → `checklistInstances` (project-level)
- `swmsTemplates` (org-level) → `swmsDocuments` (project-level)
- `permitTypes` (org-level) → `permitInstances` (project-level)

**Schema Pattern:**
- Template: `orgId`, `name`, `config`, `status` (active/inactive)
- Instance: `projectId`, `templateId`, `responses`, `status` (lifecycle)

**Benefits:**
- Standardize across projects (templates shared)
- Customize per project (instances independent)
- Update templates without affecting existing instances

---

### Pattern 7: Polymorphic References
**Flexible Entity Linking (No Explicit FKs):**
```typescript
// Pattern
sourceType: 'asset' | 'incident' | 'defect' | 'checklist' | 'manual'
sourceId: string

// Index
.index('by_source', ['sourceType', 'sourceId'])
```

**Use Cases:**
- `checklistInstances` triggered by assets, ITPs, incidents
- `defects` created from checklists, incidents, prestarts, manual
- `actionItems` linked to checklists, inspections, incidents, defects

**Benefits:**
- No schema changes when adding new source types
- Flexible cross-module linking
- Simplified queries

**Tradeoffs:**
- No FK constraints (must validate in code)
- Less type safety

---

### Pattern 8: Public QR Workflows
**No Auth Required (Share Code = Access Grant):**
```
Worker arrives → Scans QR → Mobile browser opens public URL
→ Load workflow (no login) → Complete task → Submit
→ Confirmation → Optional continue to full app
```

**Share Code Security:**
- 12-char base64url (2^71 combinations)
- Unguessable (brute force infeasible)
- Access control: `isActive`, `expiresAt`, `maxUses`
- Rate limiting: 5 submissions/code/hr
- Audit trail: usage logs, IP, timestamp

**Public Routes:**
- `/w/signin/{code}` - site sign-in (worker/visitor/delivery)
- `/w/swms/{code}` - SWMS signing (external signatures)
- `/w/induction/{code}` - complete induction
- `/w/prestart/{code}` - equipment prestart
- `/w/toolbox/{code}` - toolbox attendance
- `/w/asset/{code}` - asset view + checklist
- `/w/upload/{code}` - document upload (subcontractors)

---

## Data Flow Diagrams

### Diagram 1: Standard CRUD (Real-Time Sync)
```
User A (Browser)
    ↓ [Action: Create Defect]
Next.js Frontend
    ↓ [useMutation hook]
Convex React Client
    ↓ [HTTP POST]
Convex Mutation (api.defects.create)
    ↓ [Validate + Insert]
Convex Database
    ↓ [Detect subscribers]
Convex Push Engine
    ↓ [WebSocket push, 10-50ms]
User B (Browser) ← Reactive query auto-updates
    ↓ [UI re-renders]
Defect appears instantly
```

---

### Diagram 2: AI-Mediated Operation (Chief)
```
User (Chat Input: "Create high priority defect")
    ↓ [POST /api/chief/run]
Next.js API Route (Edge Runtime)
    ↓ [Claude SDK query()]
Claude Agent
    ↓ [Load domain-defects skill]
Agent Reasoning
    ↓ [Call MCP tool: db_write]
MCP Server (Convex)
    ↓ [Validate scope, projectId auto-inject]
    ↓ [Create changeset for undo]
    ↓ [Execute Convex mutation]
Convex Database
    ↓ [Insert defect record]
MCP Server
    ↓ [Return changesetId + result]
Agent
    ↓ [Stream response with undo option]
User (Browser)
    ↓ [Renders: "Defect #247 created. [Undo]"]
Convex Push Engine
    ↓ [Push to all subscribers]
Other Users ← See new defect instantly
```

---

### Diagram 3: Proactive Agent Operation
```
Convex Scheduled Function (Daily 6am)
    ↓ [Trigger prompt: "Generate morning brief"]
/api/chief/run
    ↓ [Claude SDK query()]
Claude Agent
    ↓ [Load context-loader skill]
    ↓ [Call db_read: overnight activity]
MCP Server → Convex Queries
    ↓ [Return: 2 critical defects, 3 permits expiring, 1 SWMS signed]
Agent Analysis
    ↓ [Identify patterns, prioritize items]
    ↓ [Call db_write: create notifications]
MCP Server → Convex Mutations
    ↓ [Insert notification records]
Convex Database
    ↓ [Store notifications]
User Opens App (8am)
    ↓ [Query notifications]
Convex Push
    ↓ [Return morning brief]
User Sees: "2 critical defects need attention"
```

---

### Diagram 4: Subagent Orchestration (SWMS Creation)
```
User: "Create SWMS for concrete pouring, Level 3 slab"
    ↓
Main Agent (Opus Orchestrator)
    ↓ [Spawn 3 subagents in parallel]
    ├─→ Hazard Analyzer (Opus)
    │       ↓ [db_read: similar SWMS, hazard library]
    │       ↓ [Identify: working at heights, heavy lifting, wet concrete]
    │       → Return hazards[]
    ├─→ SWMS Validator (Sonnet)
    │       ↓ [db_read: compliance requirements]
    │       ↓ [Check: all 13 sections, ≥3 hazards, ≥2 controls each]
    │       → Return validation checklist
    └─→ SWMS Writer (Sonnet)
            ↓ [db_read: swmsTemplates]
            ↓ [Generate: sections, PPE, emergency procedures]
            → Return document structure
    ↓
Orchestrator
    ↓ [Combine results]
    ↓ [db_write: create swmsDocument]
MCP Server → Convex
    ↓ [Insert SWMS record, status: draft]
Agent
    ↓ [Stream response]
User: "SWMS #042 created (draft). Review required."
```

---

### Diagram 5: File Upload Flow
```
User (Browser)
    ↓ [Select file: photo.jpg, 2.3MB]
Client-Side Processing
    ↓ [Resize to max 2048px]
    ↓ [Compress JPEG to 85%]
    ↓ [Strip EXIF (keep orientation)]
    ↓ [Generate 256x256 thumbnail]
    ↓ [Request upload URL]
Convex Mutation (generateUploadUrl)
    ↓ [Return signed URL (1hr expiry)]
Browser
    ↓ [POST file to Convex Storage]
Convex Storage
    ↓ [Return storageId]
Browser
    ↓ [Create mediaFile record]
Convex Mutation (api.media.create)
    ↓ [Insert: storageId, metadata]
    ↓ [Return mediaFileId]
Browser
    ↓ [Update entity with mediaFileId]
Convex Mutation (e.g., api.defects.update)
    ↓ [Patch defect.photoIds]
User: Photo attached to defect
```

---

### Diagram 6: QR Public Workflow (Prestart)
```
Worker On-Site
    ↓ [Scan QR on excavator: QR-EXC-001]
Mobile Browser
    ↓ [Navigate to /w/prestart/QR-EXC-001]
Public Route (No Auth)
    ↓ [db_read: asset by qrCode]
Convex Query
    ↓ [Return asset + enabled checklists]
Browser
    ↓ [Render prestart form]
Worker
    ↓ [Fill checklist fields]
    ↓ [Take photo]
    ↓ [Enter odometer: 1234 km, 567 hrs]
    ↓ [Submit]
Public Route
    ↓ [Upload photo → storageId]
    ↓ [db_write: create prestartSubmission]
Convex Mutation
    ↓ [Validate responses]
    ↓ [Evaluate pass/fail]
    ↓ [If fail: create defects + actions, update asset status]
    ↓ [Insert prestartSubmission record]
    ↓ [Log activity]
Browser
    ↓ [Show success/failure screen]
Worker: "Prestart passed. Equipment operational."
```

---

## Security Model

### Scope Enforcement (Critical)
**Hierarchy:** Org → Project → Entity

**Schema Enforcement:**
- All org-level tables: `orgId: v.id('orgs')` (required)
- All project-level tables: `projectId: v.id('projects')` (required)
- Every table indexed: `.index('by_project', ['projectId'])`

**MCP Server (Primary Boundary):**
- Auto-injects `projectId` filter on db_read
- Validates `projectId` on db_write (throws error if mismatch)
- Agent CANNOT override projectId
- Agent CANNOT read data from other projects
- Agent CANNOT write to other projects

**Validation in Mutations:**
1. Validate project exists: `ctx.db.get(args.projectId)`
2. Validate user has access (future auth)
3. Validate related entities in same project: `defect.assignedTo` worker must have same `projectId`

**Query Scoping:**
- Explicit `projectId` required in all queries
- MCP validates matches current context
- Example: `ctx.db.query("defects").withIndex("by_project", q => q.eq("projectId", args.projectId))`

**Cross-Project Protections:**
- FK checks: related entities must share projectId
- Agent cannot assign workers from other projects
- Agent cannot reference entities from other projects

---

### Permission Model (Future)
**Current:** No authentication (single demo user)
- Demo mode: `user_demo_001` has full access
- All data visible, no permission checks
- Deferred for rebuild focus

**Future (Post-Auth):**
- Clerk or Auth0 for authentication
- RBAC: Admin, Project Manager, Worker, Viewer
- Project-level permissions: user assignments to projects
- Worker restrictions: view assigned tasks only, cannot approve, cannot create templates

---

### Audit Trail
**Activity Logs Table:**
```typescript
{
  entityType: 'defect' | 'swms' | 'permit' | ...,
  entityId: string,
  activityType: 'created' | 'updated' | 'deleted' | 'status_changed' | ...,
  actorId: string,
  actorType: 'ai' | 'human',
  metadata: {
    changesetId?: string, // Link to undo
    before?: any,         // Snapshot
    after?: any,          // Snapshot
  },
  createdAt: string,
}
```

**Logged Operations:**
- All mutations (create, update, delete)
- AI actions via db_write (actorType: 'ai')
- User actions (actorType: 'human')
- Undo operations (metadata includes original changesetId)

**Immutable Logs:**
- Append-only (no updates/deletes)
- Tamper detection via sequential ordering
- Required for compliance (WHS audit trail)

---

### Undo System Security
**Constraints:**
- Time limit: 24 hours (prevents stale data restoration)
- Dependency check: cannot undo if dependent data exists
- Status check: only status='executed' can be undone
- Scope check: must be in same projectId

**Changeset Isolation:**
- Each db_write creates isolated changeset
- Operations array stores before/after snapshots
- Undo reverses operations in reverse order
- Atomic execution (all or nothing)

---

### Data Access Policy
**Rate Limits (MCP Tools):**
- Max 20 requests per db_read call
- Max 100 rows per list query
- Max 50 IDs per multi_get
- Max 25 operations per db_write

**Index Enforcement:**
- Mode: `index_only` (default) - requires indexed queries
- Alternative: `allow_scan` - permits table scans (performance risk)
- Prevents accidental full table scans

**Auto-Index Selection:**
- Prefer `by_project` indexes when projectId available
- Fallback to `by_org` when orgId available
- Explicit index required if neither available

**API Rate Limits:**
- Convex queries: 1000 req/min per user
- Convex mutations: 100 req/min per user
- Chief API: 20 req/min per session
- MCP tools: 50 operations per request

**Enforcement:**
- Sliding window algorithm
- 429 status code on exceed
- Exponential backoff (1s, 2s, 4s, 8s)
- User notification on throttling

---

### Backup & Recovery

**Backup Strategy**

**Convex Managed Backups:**
- Automatic daily backups (Convex Cloud)
- Point-in-time recovery (7 days retention)
- No manual backup configuration needed

**Critical Data Export:**
- Weekly export of critical tables (projects, SWMS, permits)
- Store exports in S3 (compliance requirement)
- Test restore process quarterly

**Disaster Recovery:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours
- Failover plan: Convex handles automatically

---

### Public Access Security
**Share Codes:**
- 12-char base64url (2^71 entropy)
- Unguessable (brute force infeasible)
- Rate limiting: 5 submissions/code/hr, 20 failed/IP/hr
- CAPTCHA after 3 failures

**Access Control:**
- `isActive` flag - instant deactivation
- `expiresAt` - automatic expiry
- `maxUses` - single-use or limited
- State gating: SWMS must be approved before signing

**Audit Trail:**
- Every use logged in `shareCodes.usedCount`, `lastUsedAt`
- IP address + timestamp (future)
- Linked to worker if creates record

---

### Webhook Security
**Signing:**
- HMAC SHA256 signature
- Header: `X-Webhook-Signature`
- Secret: per-webhook (stored encrypted)
- Timestamp check: prevent replay attacks

**Validation:**
1. Recipient computes HMAC(secret, body)
2. Compare with signature header
3. Check timestamp (reject if >5min old)

**Failure Handling:**
- 5 consecutive failures → pause webhook
- Notify admin
- Manual re-enable required

---

### File Storage Security
**Access Control:**
- Signed URLs expire after 1 hour
- Project membership checked before URL generation
- Public share code flows bypass membership (by design)

**Upload Limits:**
- Rate limiting: 10 uploads/minute per user
- File type validation: MIME + extension check
- Malware scanning: not implemented (future)

**Privacy:**
- No public listing (must know mediaFileId)
- No directory traversal (Convex Storage isolation)
- Metadata linked to entities (linkedEntityType, linkedEntityId)

---

## Performance Targets

**Response Times:**
- Simple queries: <1 second
- Complex analysis: <3 seconds
- Actions execute immediately (no "processing" delays)
- Notifications: real-time (sub-second from event to notification)
- Summaries: available instantly when requested

**Page Load:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse score: >90

**API Latency:**
- Convex queries: 10-50ms (WebSocket push)
- Convex mutations: 50-200ms
- MCP tool execution: 200-500ms (spawn overhead)
- Agent responses: streaming (first chunk <2s)

**Bundle Size:**
- Page bundle: <200 KB gzipped
- Initial load: <1 MB
- Tree-shaking: remove unused code
- Dynamic imports: lazy load heavy components

**Scaling Constraints:**
- Convex free tier: 10k concurrent connections, 1GB storage, 100k executions/day
- Vercel hobby: 100GB bandwidth, 100hrs execution
- Anthropic API: 500 req/min (Tier 3)

**Mitigation Strategies:**
- Cache agent responses (reduce API calls)
- Pool MCP connections (reduce spawn overhead)
- Upgrade Convex plan: Pro = 100k connections, 10GB, unlimited executions
- Batch non-urgent operations (morning brief, nightly compliance checks)

---

### 4.10 PWA & Offline Strategy

**Progressive Web App Support**

**Current State:** Not implemented
**Future Plan:**
- Service worker for offline caching
- Install prompt for mobile devices
- Background sync for delayed operations
- Cache-first strategy for static assets

**Offline Mode:**
- Read-only access to cached data
- Queue mutations for sync when online
- Conflict resolution on reconnect
- User notification of offline state

---

## Deployment Architecture

### Development Environment
**Next.js Dev Server:**
- `localhost:3000` (main branch)
- `localhost:3001-3015` (worktrees, deterministic port assignment)
- Hot reload, Fast Refresh

**Convex Cloud (Dev):**
- Deployment: `dev:hip-ferret-424`
- Shared across all worktrees (same project data)
- Auto-sync schema on changes

**MCP Server:**
- Local Node.js process (stdio)
- Spawned per request (1-2s startup latency)
- Environment: `CONVEX_URL`, `PROJECT_ID`

---

### Production Environment
**Vercel:**
- Auto-deploy from GitHub main branch
- Edge network (CDN) for static assets
- Serverless functions auto-scale
- Custom domain (future)
- Environment variables: `CONVEX_URL`, `ANTHROPIC_API_KEY`, `NODE_ENV`

**Convex Cloud (Prod):**
- Deployment: `prod:hip-ferret-424`
- CI deployment via GitHub Actions
- Separate from dev (data isolation)
- Managed scaling (serverless functions, database, WebSocket pooling)

**MCP Server:**
- Same as dev (spawned per request)
- Isolated per request (no state leakage)
- Auto-cleanup after response

---

### CI/CD Pipeline
**GitHub Actions Workflow:**
1. Push to main branch
2. Run tests (lint, type-check, unit tests)
3. Deploy Convex schema + functions: `npx convex deploy --prod`
4. Vercel automatic deployment (frontend + API routes)
5. Health check (smoke tests)

**Deployment Slots:**
- Production: `main` branch → Vercel + Convex Prod
- Preview: feature branches → Vercel preview URLs
- Development: local dev servers → Convex Dev (shared)

---

### Environment Variables
**Required:**
- `CONVEX_URL` - Convex deployment URL
- `CONVEX_DEPLOYMENT` - Deployment ID (e.g., `prod:hip-ferret-424`)
- `ANTHROPIC_API_KEY` - Claude API key
- `NODE_ENV` - `development` | `production`

**Optional:**
- `PROJECT_ID` - Default projectId for MCP server (dev convenience)
- `MCP_LOG_LEVEL` - `debug` | `info` | `warn` | `error`
- `RESEND_API_KEY` - Email provider (future)

---

### Monitoring Strategy
**Convex Dashboard:**
- Function execution times (P50/P95/P99)
- Error rates per function
- Query performance (slow queries)
- WebSocket connection count
- Storage usage

**Vercel Analytics:**
- Page load times (Real User Monitoring)
- API route latency
- Geographic distribution
- Error tracking (500s, 404s)

**Custom Logging:**
- Structured logs: `{ level, function, userId, projectId, duration, error }`
- Log levels: debug (dev only), info (normal ops), warn (recoverable), error (unrecoverable)
- Don't log sensitive data (passwords, tokens, PII)

**Agent Metrics (Hooks):**
- Tool call frequency (db_read, db_write, undo)
- Success rate (% successful operations)
- Execution time (latency per tool)
- Session duration (conversation length)
- Skill load times (context loading overhead)

**Alerts:**
- Critical: Error rate >5%, rate limit exceeded, MCP spawn failures, WebSocket disconnections >10%
- Warning: P95 latency >1s, storage >80%, bandwidth >80%

---

## Build Order

**Week 1: Convex Schema + MCP Server**
- Define 52 tables with indexes
- Basic queries/mutations for core entities (projects, defects, workers)
- MCP server with db_read, db_write, undo tools
- Scope enforcement + validation
- Test with Claude SDK locally

**Week 2-3: Claude SDK Integration**
- API route: `/api/chief/run` with streaming SSE
- MCP server configuration
- Test tool execution (db_read, db_write, undo)
- Session management (resume, fork)

**Week 3-4: ShadCN UI Components**
- Design tokens (CSS variables for status/priority colors)
- Primitive components (button, card, input, dialog, table)
- Feature components (StatusBadge, PriorityBadge, DefectCard)
- AppShell layout (sidebar, header, AI pane)

**Week 4-5: Chief Chat Interface**
- Chat UI (message list, input, streaming)
- DataRenderer for structured data (tables, forms, confirmations)
- Undo button integration
- Response artifacts (result, questions, confirm, sources)

**Week 5-6: Skills Migration**
- Extract to `.claude/CLAUDE.md` (global instructions)
- Create domain skills (defects, swms, checklists, etc.)
- Test progressive loading
- Subagent workflows (SWMS creation, incident investigation)

**Week 7-8: Core Modules**
- Defects module (dashboard, detail, form)
- SWMS module (builder, viewer, signature)
- Checklists module (templates, conduct)
- Permits module (application, approval)

**Week 9-10: Mobile Simulator**
- Worker context (demo user)
- 51 mobile screens (7 tabs, 9 submodules)
- QR public routes (7 flows)
- Photo capture, signature canvas, field renderer

**Week 11-12: Integrations**
- File storage (Convex Storage, upload/retrieval)
- PDF generation (Puppeteer)
- QR codes (qrcode library, shareCodes table)
- Webhooks (outbound events, HMAC signing)

---

## Key Integration Points

### Convex ↔ MCP
- **Connection:** Separate Node.js process (stdio JSON-RPC)
- **Client:** Convex HTTP Client (fetch API)
- **Scope:** Environment variables (`CONVEX_URL`, `PROJECT_ID`)
- **Spawn:** Per-request isolation (1-2s latency, auto-cleanup)

### Claude SDK ↔ Next.js
- **Streaming:** TransformStream for SSE
- **Input:** Async generator (required for custom MCP servers)
- **Output:** `query()` async iterator
- **Client:** EventSource or fetch stream

### ShadCN ↔ Agent
- **Format:** Structured data (not HTML)
- **Rendering:** UI renders by data type (defects_list, table, confirmation)
- **Styling:** Tailwind classes, CSS variables
- **Accessibility:** WCAG 2.1 AA compliant (ARIA, keyboard nav, focus indicators)

---

## Technology Comparisons

### Convex vs Supabase
| Feature | Convex | Supabase |
|---------|--------|----------|
| Real-time | Built-in (10-50ms push) | Separate realtime module |
| Schema | TypeScript-first → types | SQL migrations + codegen |
| Deployment | Single command | Multiple services (DB, API, Auth) |
| Latency | 10-50ms | 50-500ms (polling/subscriptions) |
| Complexity | Low (managed, reactive) | High (ORM, caching, migrations) |
| Free tier | 10k connections, 1GB, 100k execs/day | Generous (unlimited API requests) |

**Decision:** Convex for built-in reactivity, lower complexity, TypeScript-first.

---

### ShadCN vs Material UI
| Feature | ShadCN | Material UI |
|---------|--------|--------------|
| Bundle size | ~50KB tree-shaken | ~300KB |
| Customization | Full control (copy-paste) | Theme overrides |
| Styling | Tailwind-native | Emotion (CSS-in-JS) |
| Breaking changes | Minimal (copy-paste) | Major versions |
| Accessibility | Built-in (Radix UI) | Built-in |

**Decision:** ShadCN for lighter bundle, full control, Tailwind-native.

---

### Puppeteer vs React-PDF
| Feature | Puppeteer | React-PDF |
|---------|-----------|-----------|
| Environment | Server-side | Client-side only (current) |
| CSS Support | Full HTML/CSS | Limited subset |
| Performance | Slower (headless Chrome) | Faster (JavaScript) |
| Debugging | Easy (inspect HTML) | Harder (canvas-based) |
| Use Case | Final PDFs (SWMS, certificates) | Client-side preview |

**Decision:** Migrate to Puppeteer for server-side generation, keep React-PDF for preview.

---

## Open Questions

### MCP Server Lifecycle
- **Spawn per request** (isolated, 1-2s latency) vs **long-running** (no latency, state management complexity)
- **Recommendation:** Start spawn per request (simpler, safer), migrate to long-running if latency becomes issue

### Skill Granularity
- **Coarse-grained** (9 skills, fewer files) vs **fine-grained** (30+ skills, minimal context)
- **Recommendation:** Start coarse-grained (easier to maintain), split if context bloat

### Session Persistence
- **Convex database** (centralized, survives restarts) vs **Redis** (fast, TTL expiry) vs **Claude SDK managed** (zero infrastructure)
- **Recommendation:** Start Convex (consistency), migrate to SDK when mature

### Real-time Sync for Agent
- **Re-query every message** (simple, fresh data) vs **subscribe to Convex** (instant updates, persistent connection)
- **Recommendation:** Start re-query (simpler), add subscriptions if staleness becomes issue

---

## Migration Path (OpenAI → Claude)

**Current Stack (Pre-Migration):**
- `@openai/agents` - OpenAI Agents SDK
- `@openai/chatkit` - ChatKit UI widgets
- `lib/ai/engine/` - Custom agent orchestration
- `lib/chatkit-adapter/` - ChatKit integration
- `components/chief-chatkit/` - ChatKit components

**Target Stack (Post-Migration):**
- `@anthropic-ai/claude-agent-sdk` - Claude SDK
- `@modelcontextprotocol/sdk` - MCP protocol
- `components/chief/` - ShadCN chat components
- `mcp-server-convex/` - MCP server for database access

**Migration Steps:**
1. Add Claude SDK dependencies
2. Create `mcp-server-convex/` directory + tools (db_read, db_write, undo)
3. Convert custom tools to MCP format
4. Replace ChatKit with ShadCN Chief components
5. Update API route `/api/chief/run` to use Claude SDK `query()`
6. Transform `.claude/skills/` to new format
7. Test subagent workflows
8. Remove OpenAI dependencies

**Timeline:** 8-13 weeks (MCP server 1-2w, API route 1w, instruction migration 2-3w, subagents 1-2w, UI replacement 2-3w, optimization 1-2w)

---

## Summary

**Core Principles:**
1. **AI-First:** Chief is primary operator, humans review/approve
2. **Reactive:** Real-time data flow, no polling, auto-updates
3. **Agent-Mediated:** Operations flow through AI layer with scope enforcement
4. **Scope-Safe:** Multi-tenant isolation at MCP layer (org/project boundaries)
5. **Serverless:** Zero infrastructure management (Convex + Vercel)

**Key Technologies:**
- Next.js 16 + React 19 (frontend)
- Convex (real-time database + functions)
- Claude SDK + MCP (AI layer with database access)
- ShadCN + Tailwind (UI components)
- Puppeteer + qrcode (integrations)

**Critical Patterns:**
- Reactive data flow (Convex push, 10-50ms)
- Agent-mediated operations (Chief → MCP → Convex)
- Proactive execution (scheduled + event-driven)
- Skills-based context (progressive loading)
- Subagent orchestration (parallel workflows)
- Template/instance (reusable configs)
- Polymorphic references (flexible linking)
- Public QR workflows (no-auth access)

**Security Model:**
- Scope enforcement (org → project → entity)
- Audit trail (immutable activity logs)
- Undo system (24hr limit, dependency checks)
- Share code security (2^71 entropy, rate limiting)
- Signed URLs (1hr expiry, membership checks)

**Performance Targets:**
- Simple queries: <1s
- Real-time push: 10-50ms
- Page load: <3s
- Bundle size: <200KB

**Build Focus:**
- Week 1-3: Convex schema + MCP server + Claude SDK
- Week 4-6: UI components + Chief chat + skills
- Week 7-10: Core modules + mobile simulator
- Week 11-12: Integrations (files, PDF, QR, webhooks)
