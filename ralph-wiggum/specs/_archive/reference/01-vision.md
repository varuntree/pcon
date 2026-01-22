# 01: Product Vision

> Why PRJ Construction exists, what success looks like, how we're positioned in the market.

---

## 1. Purpose & Scope

### What This Covers
- Product thesis and core beliefs about AI in construction
- Target users and their operational pain points
- Success metrics and KPIs
- Competitive positioning against traditional construction software
- Future roadmap vision (2026-2028)
- Progressive autonomy model (Advisor → Operator → Autopilot)

### What This Does NOT Cover
- Technical architecture (see 02-architecture.md)
- Feature details and domain model (see 03-domain-model.md)
- Implementation specifics (see 04-schema.md, 05-ai-system.md)
- UI design patterns (see 06-ui-system.md)

---

## 2. Overview

PRJ Construction is an **operating system for construction** — not traditional SaaS where humans click through databases, but an AI-first platform where Chief (the AI) runs operations while humans review, approve, and handle exceptions.

**The core insight:** A construction project is hundreds of concurrent loops (defects raised → fixed → verified → closed; permits applied → approved → expires → renewed; incidents reported → investigated → corrective actions → closed). The project manager's job is ensuring every loop closes. Nothing gets stuck. Nothing expires unnoticed.

Current construction software is record-keeping. It stores information. Humans still do all the operational work — checking dashboards, sending follow-ups, remembering deadlines, reacting to fires.

**Our thesis:** The intelligence to run these loops already exists in 2026 AI models. They can reason about any situation they can observe. The bottleneck is not intelligence — it's **agency**. PRJ Construction gives AI agency within appropriate bounds, earning trust through progressive autonomy, while humans focus on judgment, relationships, and high-stakes decisions.

---

## 3. Core Concepts

### Concept 1: AI-First Operations

**AI-first means:** Chief is the principal contractor. Humans are reviewers for consequential decisions.

Traditional software is human-first with AI assistance (chatbots, autocomplete, suggestions). We invert this. Chief monitors the entire project state, identifies what needs attention, drafts responses, executes routine actions, reports back. Humans scan, approve, handle exceptions.

**The capability exists:** GPT-5.1 (2026) can fully automate construction operations. It doesn't need special algorithms to identify an overdue defect or expiring permit. It needs access to data, context about what matters, and ability to act.

**Our job:** Build the scaffolding now — the operation execution engine, the undo/approval mechanisms, the memory systems — so when models mature to research-level by late 2026, we're the default choice for construction companies.

### Concept 2: Progressive Autonomy

Chief evolves with trust. Not all users get full autonomy immediately. Trust is earned through demonstrated competence.

**Phase 1: Advisor**
- Chief observes everything
- Identifies what needs attention, tells you
- You decide what to do
- Chief helps you do it
- Trust building through observation

**Phase 2: Operator**
- Chief identifies issues AND executes routine/reversible actions directly (with undo)
- For high-risk actions, Chief asks for explicit confirmation
- Humans review summaries, handle edge cases
- Trust established through reliable execution

**Phase 3: Autopilot**
- Chief handles operations autonomously
- Humans see summaries of what happened
- Intervene only for exceptions and high-stakes decisions
- Trust matured into delegation

A company's relationship with Chief naturally progresses through these phases. The system tracks performance (approval rates, corrections, undo frequency) to calibrate autonomy levels.

### Concept 3: Loop Management

Construction is loop management. Every entity has a lifecycle:

| Entity | Lifecycle Loop |
|--------|----------------|
| Defect | Raised → Assigned → Fixed → Verified → Closed |
| Permit | Applied → Approved → Active → Expires → Renewed |
| Worker Certification | Inducted → Certified → Works → Expires → Re-inducted |
| Task | Scheduled → Executed → Delayed → Rescheduled → Completed |
| Incident | Reported → Investigated → Corrective Actions → Closed |
| SWMS | Created → Signed → Active → Completed → Archived |

The project manager's cognitive burden:
- **Finding** what needs attention (checking dashboards, running reports, scanning emails)
- **Pushing** things forward (sending follow-ups, escalating, reminding)
- **Remembering** what's due (deadlines in heads, calendar reminders, spreadsheets)
- **Reacting** when things go wrong (firefighting instead of preventing)

**Chief's role:** Close loops automatically. Monitor every entity, identify stalled/overdue/expiring items, execute appropriate actions (follow-ups, notifications, status updates, escalations), report exceptions.

Result: Nothing gets stuck. Nothing expires unnoticed. Nothing falls through.

### Concept 4: Operating System for Construction

PRJ Construction is not SaaS. It's an **operating system** that runs project operations.

**Like an OS:**
- Runs continuously in background
- Monitors all system state
- Manages resources (workers, equipment, materials)
- Schedules processes (workflows, inspections, certifications)
- Handles I/O (notifications, reports, external comms)
- Provides interface for human oversight and control

**Unlike traditional software:**
- Traditional software is passive storage. OS actively executes.
- Traditional software requires human to drive all actions. OS takes initiative.
- Traditional software fragments operations across modules. OS sees holistic project state.

**The experience:** You open Chief in the morning. Chief shows what happened overnight, what needs attention, what it drafted, what it already handled. You scan, approve, handle exceptions. Then you do the work only humans can do — walk the site, talk to people, make hard decisions.

---

## 4. Detailed Specification

### 4.1 Product Thesis

#### The Core Belief

**Construction operations can be fully automated with 2026 AI capabilities.**

The work project managers spend 80% of their time on — monitoring dashboards, sending follow-ups, updating statuses, remembering deadlines, generating reports, chasing people — requires no special human judgment. It requires awareness of project state, understanding of what matters, and ability to take appropriate action.

Modern AI models have this capability. GPT-5.1, Claude 4.5 can:
- Reason about complex situations
- Understand construction domain context
- Identify patterns and anomalies
- Draft appropriate communications
- Execute multi-step workflows
- Learn from feedback and corrections

**The bottleneck is not intelligence. It's agency.**

#### Why Current Solutions Fail

Traditional construction software (Procore, PlanGrid, Fieldwire, etc.) is **record-keeping systems**:

| What They Do Well | What They Lack |
|-------------------|----------------|
| Store project data in structured databases | Active monitoring of project state |
| Provide forms for data entry | Identification of what needs attention |
| Generate reports from stored data | Proactive action on identified issues |
| Offer mobile apps for field capture | Loop closure without human intervention |
| Integrate with other tools | Learning and adaptation over time |

They're **passive**. Humans must:
- Check dashboards to find issues
- Remember to follow up on overdue items
- Manually send notifications and reminders
- Synthesize information across modules
- Maintain operational discipline

This is why construction software has high adoption cost and low sustained usage. It adds administrative burden rather than reducing it.

#### The Capability Gap We're Filling

**Operational layer between humans and data.**

We don't replace the database. We add an AI layer that:
- Continuously monitors all project state
- Identifies what needs attention based on learned patterns and rules
- Executes appropriate actions (within autonomy bounds)
- Reports back with summaries and exception escalations
- Learns from corrections to improve over time

Humans shift from **doing operations** to **reviewing operations** — a fundamentally different cognitive load.

### 4.2 Target Users

#### Primary: Project Managers / Site Supervisors

**Profile:**
- 5-20 years construction experience
- Managing 1-3 concurrent projects
- Team of 5-50 people (mix of direct staff and subcontractors)
- Responsible for schedule, safety, quality, compliance
- Spend 60-80% of time on administrative operations vs actual site work

**Pain Points:**
- Too many systems to check (safety, quality, schedule, compliance)
- Information fragmentation — defects in one place, permits in another, schedule elsewhere
- Constant context switching between operational tasks
- Firefighting mode — reactive rather than proactive
- Compliance burden — documentation for WHS, client reporting, audits
- Communication overhead — following up with subcontractors, workers, management
- Deadlines in head — relying on memory rather than systems

**Daily Workflow:**
- Morning: Check overnight issues, review day's schedule, handle urgent matters
- During day: Field work, meetings, ad-hoc problem solving, approvals
- End of day: Update statuses, send follow-ups, prepare for tomorrow
- Continuous: Email/message responding, firefighting, decision-making

**What They Need from Chief:**
- **Morning brief:** "Here's what needs your attention today"
- **Proactive identification:** "This permit expires tomorrow, I've drafted renewal"
- **Draft execution:** "I've assigned this defect to John based on trade, approve?"
- **Automatic follow-ups:** "Sent reminder to subbie about overdue checklist"
- **Compliance automation:** "SWMS expiring this week, I've scheduled refreshers"
- **Exception escalation:** "Critical defect raised, needs immediate attention"

**Success metric:** Project manager spends 80% less time on administrative operations, 80% more time on site/relationships/judgment.

#### Secondary: Field Workers

**Profile:**
- Trades people, laborers, supervisors
- Mobile-first (phone/tablet on site)
- Need quick capture, minimal friction
- Compliance tasks (sign SWMS, conduct checklists, report incidents)
- Communication with management and other workers

**Pain Points:**
- Too many steps to capture information
- Don't know what's required of them
- Duplicate data entry across forms
- Can't access information on-site (drawings, procedures, history)
- Unclear what's urgent vs routine

**Mobile Interactions:**
- Sign SWMS before work starts
- Conduct safety checklists
- Report incidents/defects
- Submit prestart checks
- View assigned tasks
- Clock in/out (sign-ons)
- Take and upload photos
- Access drawings and documents

**What They Need from Chief:**
- **Task clarity:** "Here's what you need to do today"
- **Smart defaults:** Forms pre-filled based on context
- **Proactive reminders:** "Your permit expires in 1 hour"
- **Quick capture:** Voice-to-text for incident descriptions
- **Contextual help:** "You're about to work on electrical, here's the SWMS"

**Success metric:** 50% less time on compliance admin, zero compliance gaps.

#### Tertiary: Business Owners / Directors

**Profile:**
- Overseeing 5-50 concurrent projects
- Focus on business health, risk management, strategic decisions
- Need visibility without micromanaging
- Compliance accountability (WHS officer, legal liability)

**Pain Points:**
- Can't see cross-project patterns
- Reactive to problems rather than preventing them
- Compliance risk (unnoticed expired certifications, missing documentation)
- Inefficient resource allocation across projects
- Lack of operational metrics (how well are we running?)

**Oversight Requirements:**
- Multi-project dashboard (health at a glance)
- Risk alerts (critical defects, compliance gaps, delays)
- Performance metrics (loop closure rate, time-to-resolution, compliance maintenance)
- Audit trails (who did what when, why)

**What They Need from Chief:**
- **Cross-project intelligence:** "Three projects have same subbie causing delays"
- **Risk monitoring:** "Two critical defects open >7 days, escalating"
- **Compliance assurance:** "All projects compliant, zero expired certifications"
- **Operational metrics:** "Average defect resolution: 3.2 days, down from 5.1"
- **Strategic insights:** "Pattern detected: electrical inspections consistently delayed"

**Success metric:** Complete visibility into operations, zero compliance surprises, data-driven process improvements.

### 4.3 Success Metrics

#### Primary Metric: Time Saved

**Definition:** Hours per week saved on administrative operations (monitoring, follow-ups, status updates, reporting) measured by comparing time spent before and after Chief deployment.

**How We Measure:**
- Pre-deployment baseline: Time study over 2 weeks
- Post-deployment tracking: Weekly self-reported time allocation
- Automated tracking: Number of actions Chief takes that would have required manual work

**Target Benchmarks:**

| Phase | Time Saved (hours/week) | User Role |
|-------|-------------------------|-----------|
| Advisor | 5-8 hours | Project Manager |
| Operator | 12-18 hours | Project Manager |
| Autopilot | 20-30 hours | Project Manager |
| Advisor | 2-4 hours | Field Worker |
| Operator | 4-7 hours | Field Worker |

**Attribution Model:**
Chief logs every action with category:
- `monitoring` — Dashboards/reports Chief eliminated need to check
- `follow_up` — Reminders/escalations Chief sent automatically
- `status_update` — Entity state changes Chief executed
- `documentation` — Reports/summaries Chief generated
- `identification` — Issues Chief surfaced proactively

Time saved = (action count × average time per action) validated against user self-reports.

#### Secondary Metrics

**1. Loop Closure Rate**

**Definition:** Percentage of lifecycle loops that reach terminal state (completed/closed/resolved) without getting stuck.

**Formula:** `loops_closed / (loops_closed + loops_stalled) × 100`

**Target:**
- Baseline (no Chief): 70-80% (industry standard)
- With Chief Advisor: 85-90%
- With Chief Operator: 92-96%
- With Chief Autopilot: 97-99%

**Stalled definition:** Entity remains in non-terminal state for >2× expected duration without activity.

**2. Proactive vs Reactive Ratio**

**Definition:** Ratio of issues Chief identifies before user notices vs issues user brings to Chief.

**Formula:** `chief_identified / (chief_identified + user_identified)`

**Target:**
- Advisor: 30-40% (Chief observing, learning patterns)
- Operator: 60-75% (Chief actively monitoring)
- Autopilot: 85-95% (Chief comprehensive oversight)

**Measurement:** Track issue origin in all Chief actions.

**3. Approval Rate**

**Definition:** Percentage of Chief proposals/actions approved without modification.

**Formula:** `approved_as_is / (approved_as_is + modified + rejected) × 100`

**Target:**
- Advisor: 70-80% (learning phase)
- Operator: 85-92% (established patterns)
- Autopilot: 93-97% (high trust)

**Improvement indicator:** Rate should increase over time as Chief learns company-specific patterns.

**4. Trust Progression**

**Definition:** Movement through autonomy phases over time, measured by autonomy level granted for different action types.

**Tracking:**
- Time to reach Operator phase: Target <3 months
- Time to reach Autopilot phase: Target <9 months
- Per-action autonomy grants (low-risk actions first, high-risk later)

**Indicators:**
- Undo frequency (should decrease over time)
- Modification frequency (should decrease over time)
- Autonomy scope expansion (more action types auto-approved)

**5. Compliance Maintenance**

**Definition:** Continuous compliance without manual intervention.

**Metrics:**
- Zero expired certifications: Target 100%
- Zero missed inspections: Target 100%
- Zero overdue corrective actions: Target >95%
- Audit-ready documentation: Target 100%

**Measurement:** Automated checks against compliance requirements, tracked continuously.

### 4.4 Competitive Positioning

#### Current Landscape

**Category 1: Traditional Construction Management Software**

| Product | Strengths | Weaknesses |
|---------|-----------|------------|
| **Procore** | Comprehensive feature set, strong integrations, established market leader | Overwhelming complexity, high learning curve, passive record-keeping, requires dedicated admin |
| **PlanGrid** (Autodesk) | Excellent drawings/RFI workflow, field-friendly mobile | Limited project management depth, primarily document-centric, no operational automation |
| **Fieldwire** | Intuitive UX, good task management, affordable | Limited safety/quality features, basic reporting, no AI capabilities |
| **Buildertrend** | All-in-one for residential, client portal, financial integration | Residential-focused, not suitable for commercial, limited customization |
| **Aconex** (Oracle) | Enterprise-grade document management, strong compliance | Expensive, complex, document-focused rather than operations-focused |

**What They Do Well:**
- Store structured project data
- Provide mobile capture for field workers
- Generate reports and dashboards
- Offer integrations with other tools
- Maintain audit trails

**What They Lack:**
- Proactive monitoring (humans must check dashboards)
- Autonomous action (no follow-ups, reminders, escalations without human initiation)
- Cross-module intelligence (safety system doesn't know about schedule delays)
- Learning and adaptation (same workflows regardless of project/company patterns)
- Operational automation (every action requires human trigger)

**Category 2: Emerging AI-Assisted Construction Tools**

| Product | Approach | Limitation |
|---------|----------|------------|
| **Alice Technologies** | AI-powered scheduling optimization | Single-function (schedule only), not operational layer |
| **Buildr** | AI document search and extraction | Document-focused, no action execution |
| **OpenSpace** | AI photo documentation and progress tracking | Visual documentation, not operational automation |
| **Anka** | AI for cost estimation and bid management | Pre-construction focused, not site operations |

**Common Pattern:**
AI as **assistant** — answering questions, suggesting improvements, analyzing data.
NOT as **operator** — monitoring continuously, identifying issues, executing actions.

#### Our Differentiation

**1. AI-First vs AI-Assisted**

| Traditional + AI Assistant | PRJ Construction (AI-First) |
|----------------------------|------------------------------|
| Human monitors dashboards, AI answers questions | AI monitors project state, human handles exceptions |
| Human decides what to do, AI helps execute | AI identifies and executes, human approves significant actions |
| Human remembers deadlines, AI sends reminders when asked | AI maintains all operational discipline automatically |
| AI is a feature added to existing workflow | AI is the primary operational layer |

**2. Operational Layer vs Record-Keeping**

| Record-Keeping (Traditional) | Operating System (PRJ) |
|------------------------------|------------------------|
| Stores information, humans retrieve it | Actively monitors all state changes |
| Generates reports when requested | Identifies issues proactively |
| Provides forms for data entry | Executes actions based on identified needs |
| Displays information, humans decide | Proposes actions with context, executes when approved |

**3. Progressive Autonomy vs Fixed Workflows**

| Fixed Workflows (Traditional) | Progressive Autonomy (PRJ) |
|-------------------------------|----------------------------|
| Same process for everyone | Adapts to company/user patterns |
| Rigid approval chains | Flexible autonomy based on earned trust |
| Can't skip steps even for routine matters | Auto-executes routine, escalates unusual |
| Doesn't learn from usage patterns | Continuously learns and improves |

**4. Holistic Intelligence vs Siloed Modules**

| Siloed (Traditional) | Holistic (PRJ) |
|----------------------|----------------|
| Safety module doesn't know about schedule delays | Chief sees that schedule delay affects SWMS validity |
| Quality system separate from asset management | Chief knows equipment defect impacts quality checklist |
| Worker certifications disconnected from task assignments | Chief blocks task assignment if worker cert expired |

**The Competitive Moat:**

1. **Data advantage:** Chief gets smarter the more it's used. Company-specific patterns, terminology, preferences compound over time. Switching cost increases with tenure.

2. **Timing advantage:** We're building for 2026-2027 model capabilities. When GPT-6 / Claude 5 reach research-level reasoning, we have the infrastructure ready. Competitors will still be treating AI as assistant features.

3. **Domain specialization:** Not general-purpose project management. Construction-specific — WHS compliance, Australian standards, trade workflows, site operations. Deep vertical focus creates defensibility.

4. **Trust infrastructure:** The undo system, approval mechanisms, progressive autonomy model — this is hard to replicate. It's not just AI capabilities, it's the scaffolding around AI that makes it trustworthy.

#### Market Timing

**Why Now (2026):**

1. **Model capabilities reached threshold:** GPT-5.1, Claude 4.5 (2026) can reliably execute multi-step reasoning, understand complex domain context, draft professional communications. Previous generations couldn't.

2. **API reliability and cost:** Model APIs are now stable, fast, and economically viable for continuous background operations. 2024-2025 this wasn't true.

3. **Construction industry digitization:** Post-COVID acceleration of software adoption. Workers expect mobile tools. Management expects data-driven decisions. Cultural barrier to AI lower than 3 years ago.

4. **Labor shortage:** Construction labor shortage (Australia + globally) creates urgency for productivity tools. Companies can't hire their way to capacity, must leverage technology.

**The 24-Month Window:**

- **2026 H1:** Build core product, acquire early customers (2-5 companies)
- **2026 H2:** Refine based on real usage, expand to 10-15 companies
- **2027 H1:** Models reach research-level, Chief capabilities step-change, market validation
- **2027 H2:** Scale to 50-100 companies, establish category leadership
- **2028+:** Models commoditize (everyone has access to same capabilities), but we have trust infrastructure, domain data, and established relationships

**Building for When Models Mature:**

Current models (2026 Q1) can handle 60-70% of operations autonomously. By late 2026, this reaches 85-90%. By 2027, 95%+.

We're building the scaffolding NOW:
- The operation execution engine
- The undo/approval system
- The progressive autonomy model
- The memory and learning infrastructure
- The domain-specific knowledge base

When models mature, we flip a switch and Chief goes from capable to dominant. Competitors still treating AI as chatbots will be years behind.

### 4.5 The Target Experience

#### Morning Workflow

**Time: 7:30 AM, Project Manager arrives at site office**

Open Chief workspace:

```
GOOD MORNING

Overnight Activity
├─ 2 critical defects raised (via mobile)
├─ 1 SWMS signed by 8 workers (electrical work)
├─ 3 permits approaching expiration
└─ Schedule updated: Rain delay affects 4 tasks

What Needs Your Attention Today
├─ [CRITICAL] Scaffolding defect blocks 3 trades (I've notified them, awaiting your decision on workaround)
├─ [APPROVAL] 2 defects assigned to John (electrical trade) — Approve assignments?
├─ [DECISION] Permit renewal: Council requires additional documentation (not standard)
└─ [REVIEW] 5 overdue items from last week (I've drafted follow-ups, review before sending)

What I've Drafted for Approval
├─ Follow-up to subcontractor: Overdue checklist (3 days late)
├─ Defect assignment: John (electrical) based on trade match
├─ Permit renewal application: Standard template pre-filled
├─ Status update to client: Weekly progress summary
└─ Toolbox meeting reminder: Tomorrow 7am, 12 attendees

What I Already Handled (Low-Risk)
├─ Updated 8 task statuses from 'in progress' to 'completed' based on sign-offs
├─ Sent 3 routine reminders for upcoming certification expirations
├─ Logged daily diary entry from site supervisor notes
└─ Generated compliance report for WHS officer (weekly routine)
```

**User actions:**
- Scan overnight activity (15 seconds)
- Handle critical scaffolding issue (5 minutes — calls subcontractor, makes decision)
- Approve 4/5 drafted items (30 seconds total)
- Modify one follow-up message (change tone, 1 minute)
- Review what Chief handled autonomously (30 seconds)

**Total time: 8 minutes**

**Without Chief:** 45-60 minutes checking dashboards, writing emails, updating statuses, remembering what needs follow-up.

#### Throughout the Day

**10:00 AM — On-site walkthrough**

Phone notification from Chief:
```
Critical defect raised: Electrical panel exposed
I've notified John (electrician) and marked area unsafe.
Photo attached. Needs immediate barricading.
```

**User action:** Check photo, confirm John is handling, approve Chief's barricade notation.

**Time: 30 seconds**

---

**2:00 PM — At desk, working on schedule**

Chief surfaces insight (sidebar):
```
Pattern detected: Plumbing inspections delayed 3 weeks running.
Root cause appears to be inspector availability.
Suggestion: Book inspections 2 weeks ahead instead of 1 week.
Want me to adjust scheduling rule?
```

**User action:** Review pattern, approve scheduling adjustment.

**Time: 1 minute**

---

**4:00 PM — Meeting with client**

Client asks: "What's the status of that waterproofing issue from last month?"

Ask Chief (voice/text): "Status of waterproofing defect from December"

Chief responds:
```
Defect #247: Waterproofing membrane damage, Level 2 bathroom
- Raised: Dec 18
- Assigned: ABC Waterproofing (Dec 19)
- Fixed: Jan 8 (photos attached)
- Verified: Jan 10 by site supervisor
- Closed: Jan 10
- Warranty documentation filed
```

**Time: 10 seconds**

#### End of Day

**5:30 PM — Wrapping up**

Chief end-of-day summary:
```
Today's Outcome
├─ 8 new tasks created, 11 completed
├─ 2 critical defects resolved (scaffolding, electrical)
├─ 3 permits renewed (all approved)
├─ 1 incident report submitted (minor - first aid only)
└─ Compliance: 100% (all certifications current, all SWMS signed)

Tomorrow's Focus
├─ Toolbox meeting 7am (12 attendees confirmed)
├─ Council inspection 10am (all documentation ready)
├─ 4 defects due for verification
└─ SWMS refresh required: 6 workers (certification expiring)

Overnight Operations
├─ I'll monitor permit expirations
├─ I'll send toolbox meeting reminder at 6am
├─ I'll draft weekly report for client (you review tomorrow morning)
└─ I'll flag any urgent issues immediately
```

**User action:** Scan summary, note tomorrow's priorities.

**Time: 1 minute**

**Without Chief:** 30-45 minutes updating statuses, sending reminders, preparing tomorrow's plan, checking for anything missed.

---

**Total time in Chief today: ~12 minutes**

**Equivalent manual work: 2-3 hours**

**Savings: 2+ hours/day = 10-15 hours/week**

### 4.6 Product Principles

#### 1. Agency Over Assistance

Chief does things. It doesn't just help users do things.

**Example:**
- **Assistance:** "You have 3 overdue defects. Would you like to see them?"
- **Agency:** "I've sent follow-ups on 3 overdue defects. John's electrical issue escalated due to 7-day delay."

**When designing features:** Prefer Chief taking action (within autonomy bounds) over suggesting user take action.

**Guardrail:** Undo always available. High-risk actions require confirmation. Autonomy earned, not granted by default.

#### 2. Context Is Everything

The same request means different things in different situations. Generic responses are failures.

**Example:**
User asks: "What's the status of the defects?"

**Generic response:** "You have 12 open defects. 3 are critical, 9 are minor."

**Contextual response:**
```
Current context: You're viewing the Level 2 electrical work area.

Relevant defects here:
├─ #156: Exposed wiring (CRITICAL - assigned to John, due today)
├─ #183: Switchboard labeling (minor - scheduled for Friday)

You also have 10 other defects across the project.
Want to see those, or focus on this area?
```

**When designing features:** Chief should deeply understand context — current page, recent actions, project state, user history, company norms — and respond appropriately.

#### 3. Simplicity in Interface, Sophistication in Behavior

Users should experience Chief as simple. Complexity lives in Chief's reasoning, not in the user's interaction.

**Example:**
Behind one-click "Approve" button:
- Chief validates all dependencies
- Checks for conflicts with other operations
- Updates related entities
- Sends appropriate notifications
- Logs to audit trail
- Learns from this approval for future similar situations

User sees: One button.

**When designing features:** Minimize user decisions. Maximum one-click for routine operations. Hide complexity in Chief's execution.

#### 4. Trust Is Earned

Chief starts with limited autonomy and earns more over time. This isn't just safety — it's how relationships work.

**Example:**
Week 1: Chief proposes defect assignment, waits for approval every time.
Week 4: User has approved 40 similar assignments. Chief asks: "I've assigned defects to trades 40 times with 100% approval. Can I auto-assign going forward?"
User approves.
Week 5+: Chief auto-assigns, user sees summary.

**When designing features:** Track performance per action type. Surface trust progression explicitly. Give users control over autonomy levels.

#### 5. Observation Before Suggestion

When Chief notices process improvements or inefficiencies, it observes first, confirms the pattern, then surfaces it appropriately.

**Example:**
Chief notices: Electrical inspections consistently scheduled too late, causing 2-3 day delays.
- Week 1-2: Observe pattern (3 occurrences)
- Week 3: Confirm pattern persists (2 more occurrences)
- Week 4: Surface to user with data: "Pattern detected over 4 weeks: electrical inspections delayed avg 2.8 days. Suggestion: Book 2 weeks ahead instead of 1 week."

**When designing features:** Don't immediately prescribe changes based on single data point. Build confidence through repeated observation. Present data with suggestions, not demands.

#### 6. Compliance Through Guidance

Chief knows WHS regulations, Australian standards, compliance requirements. It weaves this knowledge into guidance and recommendations. It doesn't enforce or block.

**Example:**
User tries to assign worker to high-risk task.

**Enforcement approach (NOT Chief):** "BLOCKED: Worker missing Working at Heights certification. Cannot proceed."

**Guidance approach (Chief):** "Note: This task requires Working at Heights certification. John's certification expired Jan 5. Assign anyway (you may have arranged external cert), or reassign to Sarah (current cert)?"

**When designing features:** Inform, don't block. Humans remain accountable for compliance decisions. Chief provides knowledge to support good decisions.

#### 7. Speed Creates Value

Construction operates on compressed timelines. Chief should match this pace.

**Targets:**
- Responses: <1 second for simple queries, <3 seconds for complex analysis
- Actions: Execute immediately when approved (no "processing" delays)
- Notifications: Real-time (sub-second from event to notification)
- Summaries: Available instantly when requested

**When designing features:** Optimize for speed. Fast responses. Quick actions. Minimal waiting. Speed is quality in operations.

### 4.7 What Chief Does NOT Do

#### 1. Replace Human Judgment on High-Stakes Decisions

**What Chief does:** Provides data, context, options, recommendations.

**What humans decide:**
- Accepting/rejecting work quality
- Safety incident severity classification
- Dispute resolution between parties
- Contract variations acceptance
- Worker disciplinary actions
- Budget reallocation decisions
- Schedule compression trade-offs

**Rationale:** These decisions carry significant consequences (legal, financial, safety, relational). Humans remain accountable. Chief supports decision-making but doesn't make the decision.

#### 2. Communicate with External Parties

**Chief communicates with:** Internal users (project managers, workers, business owners) within the organization.

**Chief does NOT communicate with:** Subcontractors, clients, consultants, regulators, suppliers, external auditors.

**Rationale:**
- External communications carry reputational and contractual risk
- Tone and relationship management require human judgment
- Recipients expect human interaction for official matters
- Accountability for external commitments must be clearly human

**What Chief does instead:** Drafts external communications for human review/sending. Tracks external communication threads. Reminds about required external responses.

#### 3. Enforce Compliance

**Chief's role:** Guide, advise, inform about compliance requirements.

**Chief does NOT:** Block actions, mandate processes, act as gatekeeper.

**Example:**
User wants to close a critical defect without verification photo.

**Enforcement (NOT Chief):** "Cannot close. Verification photo required per company policy."

**Guidance (Chief):** "Company policy requires verification photo for critical defects. Close without photo (document reason), or upload photo first?"

**Rationale:**
- Humans remain accountable for compliance
- Edge cases require judgment (legitimate reasons to deviate)
- Compliance is guidance not governance
- Trust erodes if Chief acts as enforcer rather than partner

#### 4. Impose Process Changes

**Chief's role:** Follow company's configured processes. Surface observations about inefficiencies.

**Chief does NOT:** Unilaterally change workflows, approval chains, or procedures.

**Example:**
Chief notices 3-step approval process for minor purchases causes 2-day delays.

**Imposes change (NOT Chief):** Automatically reduces to 1-step approval.

**Surfaces observation (Chief):** "Pattern detected: Minor purchases (<$500) average 2-day approval time due to 3-step process. 80% of approvals are 'yes' with no modification. Consider streamlining for low-value purchases?"

**Rationale:**
- Process changes are business decisions
- Workflows often have historical/compliance reasons
- Users need control over how their company operates
- Chief adapts to company, not vice versa

### 4.8 Future Vision (2026-2028)

#### 2026: Foundation

**Q1-Q2 (Current):**
- Core product built on Claude Agents SDK
- 4+1 modules operational (Site, Safety, Asset, Quality, Communication)
- Chief in Advisor/Operator mode
- 2-5 early customers (small-medium builders)
- Key focus: Product-market fit, refine based on real usage

**Q3-Q4:**
- Progressive autonomy model proven (Advisor → Operator transition)
- Mobile worker experience polished (51 touchpoints working seamlessly)
- Chief learns company-specific patterns automatically
- 10-15 customers across residential and commercial
- Key focus: Reliability, trust building, loop closure metrics

#### 2027: Maturation

**Q1-Q2:**
- Model capabilities step-change (GPT-6 / Claude 5 research-level)
- Chief reaches Autopilot mode for proven customers
- Cross-project intelligence active (pattern detection across portfolio)
- External integrations (email, accounting, ERP)
- 25-50 customers, mix of builders and subcontractors
- Key focus: Autonomous operations, compliance automation

**Q3-Q4:**
- Category leadership established (recognized as "AI-first construction ops")
- Acquisition strategy begins (target: 2-3 small construction companies)
- Chief becomes primary interface (traditional UI secondary)
- API for third-party integrations
- 50-100 customers
- Key focus: Scale, ecosystem, market position

#### 2028: Dominance

**Acquisition Strategy:**
- Acquire 5-10 small construction companies (10-50 employees each)
- Run entirely on PRJ Construction + Chief
- Demonstrate operational superiority (cost, speed, quality, compliance)
- Prove thesis: AI-first operations are not just software improvement, they're business model advantage

**Default Choice Positioning:**
- When construction companies think "operations automation," they think PRJ
- When models commoditize (everyone has GPT-6 access), we have the trust infrastructure and domain expertise
- Vertical integration: We're not just selling software, we're proving it works by running construction companies on it

**Market Position:**
- 200-500 software customers (using PRJ as software)
- 5-10 owned construction companies (running on PRJ)
- Category defining: "Construction Operating System"
- Moat: Data advantage (company-specific learning), trust infrastructure, proven operational model

#### Long-Term (2029+)

**The Vision:**
Every construction company has an AI operator managing their projects. The human role is judgment, relationships, exception handling.

**Our Position:**
- We built the scaffolding first (when others were building chatbots)
- We proved it works (running real construction companies)
- We have the trust infrastructure (undo, autonomy, learning)
- We have the domain knowledge (construction-specific, Australia-specific)
- We are the default choice

**Market Dynamics:**
- Models are commoditized (capabilities no longer differentiator)
- Trust infrastructure is differentiator (our moat)
- Data network effects (Chief gets smarter with every company)
- Vertical integration proves model (owned construction cos are showcase)

---

## 5. Relationships & Dependencies

### Feeds Into

**02-architecture.md (Technical Choices Driven by Vision)**
- AI-first operations → Claude Agents SDK as primary orchestration layer
- Progressive autonomy → Undo system, approval mechanisms, autonomy tracking
- Operating system model → Background execution, continuous monitoring, event-driven
- Context is everything → Comprehensive schema with rich relationships

**03-domain-model.md (Modules Driven by User Needs)**
- Loop management → Every entity has lifecycle, status tracking, state transitions
- Target users → Module breakdown (Site for PMs, Safety for compliance, Asset for superintendents)
- Proactive identification → Cross-module awareness, relationship mapping

**05-ai-system.md (Chief Capabilities Driven by Vision)**
- Agency over assistance → Tools for execution not just information retrieval
- Trust is earned → Performance tracking, autonomy progression logic
- Observation before suggestion → Pattern detection, confidence thresholds
- Speed creates value → Optimization targets, caching strategy

**06-ui-system.md (UX Driven by Principles)**
- Simplicity in interface → Minimal clicks, smart defaults, one-button approvals
- Chief primary, UI secondary → Chat-first layouts, traditional UI as secondary
- Morning workflow → Dashboard optimized for review not exploration

**07-mobile-demo.md (Worker Experience Driven by Needs)**
- Field worker pain points → 51 touchpoints covering all compliance tasks
- Quick capture → Voice, photos, smart defaults
- Task clarity → Proactive task surface, contextual help

**08-integrations.md (External Touch Driven by Scope)**
- Chief does NOT communicate externally → Drafts for human review/sending
- Email integration → Receive external messages, prepare responses, humans send

---

## 6. Implementation Notes

### What to Build First (Priority Order)

**Phase 1: Core Operating Loop (Months 1-3)**
1. Schema with lifecycle tracking (status, timestamps, audit)
2. Chief basic execution (db_read, db_write via MCP)
3. Simple dashboard (loop status visibility)
4. Undo system (revert any Chief action)
5. One module end-to-end (Defects: raise → assign → verify → close)

**Validation:** Can Chief monitor defects, identify overdue, send follow-up? Can user undo?

**Phase 2: Progressive Autonomy (Months 4-6)**
1. Approval mechanism (confirm widgets, proposal queue)
2. Autonomy levels per action type
3. Performance tracking (approval rate, undo frequency)
4. Trust progression logic (auto-approve after N successes)
5. Two more modules (Permits, Tasks)

**Validation:** Does Chief progress from asking every time to auto-executing routine actions?

**Phase 3: Proactive Intelligence (Months 7-9)**
1. Scheduled runs (morning brief, end-of-day summary)
2. Event triggers (critical defect raised → immediate notification)
3. Pattern detection (repeated delays, compliance gaps)
4. Cross-module awareness (schedule delay affects SWMS validity)
5. Remaining modules (full 4+1 coverage)

**Validation:** Does Chief surface issues before user notices? Does morning brief eliminate dashboard checking?

**Phase 4: Learning & Refinement (Months 10-12)**
1. Memory system (terminology, preferences, patterns)
2. Context awareness (page, recent actions, project state)
3. Performance optimization (sub-second responses)
4. Mobile touchpoints (worker compliance tasks)
5. Polish and edge case handling

**Validation:** Does Chief adapt to company-specific patterns? Time saved >10 hours/week?

### What Can Be Deferred

**Not MVP (Build Later):**
- Authentication/multi-tenancy (single demo user sufficient)
- External integrations (email, ERP) (manual bridging acceptable early)
- Advanced analytics (basic metrics sufficient to validate)
- Cross-project intelligence (single project focus initially)
- API for third parties (no ecosystem needed early)
- Mobile app (web mobile simulator sufficient for demo)

**Rationale:** Validate core thesis first (Chief can run operations autonomously) before expanding surface area.

### What's Table Stakes vs Differentiator

**Table Stakes (Must Work, Not Differentiator):**
- Data storage and retrieval
- Forms and basic CRUD
- Mobile capture (photos, signatures, text)
- PDF generation
- User management (when auth added)
- Audit trails

**Differentiator (Unique Value, Core Focus):**
- Chief proactive monitoring and identification
- Autonomous action execution with undo
- Progressive autonomy and trust building
- Cross-module intelligence and pattern detection
- Morning brief eliminating dashboard checking
- Loop closure without human intervention

**Build strategy:** Table stakes should be simple and reliable. Invest in differentiators.

---

## 7. Open Questions

### Vision-Level Questions (Minimal, Most Resolved)

**1. External Communication Boundary**

**Question:** Should Chief ever send external communications autonomously (with human pre-approval), or always require human to click send?

**Current position:** Human must send. Chief drafts only.

**Reconsider if:** Trust reaches very high levels (95%+ approval rate) and communications are routine (e.g., permit renewal confirmations).

**Decision timeline:** After 12+ months of usage data.

---

**2. Multi-Project Autonomy**

**Question:** Should Chief act autonomously across multiple projects, or require per-project autonomy calibration?

**Current position:** Per-project (different projects have different risk profiles).

**Reconsider if:** Same user/company manages multiple similar projects and wants consistent Chief behavior.

**Decision timeline:** When multi-project customers emerge (2026 Q4+).

---

**3. Compliance Enforcement Toggle**

**Question:** Should we offer optional "compliance enforcement mode" for highly regulated projects (Chief blocks non-compliant actions)?

**Current position:** No. Guidance only, no enforcement.

**Reconsider if:** Large enterprise customers demand it for liability/audit reasons.

**Decision timeline:** When enterprise sales begin (2027+).

---

## Appendix

### A. Comparable Products Analysis

**Harvey (Legal AI)**

**Model:** Domain-specialized LLM (custom models on GPT-4 base), privacy-first (no training on client data).

**Capabilities:**
- Legal research (case law, statutes)
- Document drafting (contracts, memos)
- Document review and comparison
- Due diligence automation

**Integration:** Embeds in MS Word, email, browser.

**Autonomy:** Expert always in loop. Harvey suggests, human approves.

**Metrics:** Saves professionals 2-7 hours/week.

**Differentiation:** Deep legal domain knowledge, accuracy over speed, confidentiality guarantees.

**Relevance to PRJ:**
- Vertical specialization works (construction-specific beats general PM tools)
- Privacy critical (project data confidentiality)
- Time saved is measurable and marketable
- Expert-in-loop model builds trust

---

**Legora (Legal Ops)**

**Model:** GPT-4 integration, speed and scale focus.

**Capabilities:**
- Contract analysis at scale (100s of documents)
- Drafting automation
- Research synthesis

**Integration:** MS Word, Outlook, Teams.

**Autonomy:** Lawyer initiates, Legora executes, lawyer reviews.

**Metrics:** 10x speed improvement on document review.

**Differentiation:** Zero workflow disruption (works in existing tools), speed focus.

**Relevance to PRJ:**
- Workflow integration critical (don't force new tools)
- Speed is differentiator (construction moves fast)
- Human judgment retained for significant decisions

---

**Claude Code (Software Development)**

**Model:** Claude 4.5 Opus with computer use capabilities.

**Capabilities:**
- Autonomous code writing
- File system operations
- Tool execution (terminal, browser)
- Multi-file refactoring

**Integration:** CLI, IDE plugins.

**Autonomy:** Developer observes, approves significant changes, can interrupt/undo.

**Metrics:** Hours saved on routine coding, refactoring, debugging.

**Differentiation:** Full autonomy within sandbox, transparent operations, developer always in control.

**Relevance to PRJ:**
- Autonomous execution with oversight is proven model
- Undo/interrupt critical for trust
- Transparency in what AI is doing builds confidence
- Routine work automated, human handles complex/creative

---

**Common Patterns Across All Three:**

1. **Domain specialization:** Deep knowledge in vertical beats general-purpose tools
2. **Human-in-loop:** Experts retain decision authority, AI accelerates execution
3. **Time saved:** Measurable productivity gains (2-10 hours/week)
4. **Trust through transparency:** Show what AI is doing, make it reversible
5. **Workflow integration:** Embed in existing tools, minimize disruption
6. **Progressive capability:** Start simple, expand as trust builds

**Applied to PRJ Construction:**
- Construction domain specialization (WHS, Australian standards, trade workflows)
- Project managers retain judgment, Chief handles operations
- Target: 10-15 hours/week saved per PM
- Full transparency + undo for all Chief actions
- Embed in project management workflow (not separate tool)
- Advisor → Operator → Autopilot progression

### B. Market Research Summary

**Australian Construction Software Market (2026)**

**Size:** $850M-$1.2B annually (estimated)

**Segments:**
- Enterprise (Procore, Aconex): $400M+
- Mid-market (PlanGrid, Fieldwire, local solutions): $300M+
- Small builders (Buildertrend, SimPRO, spreadsheets): $150M+

**Trends:**
- Post-COVID digital acceleration (90% of builders use some software, up from 60% in 2019)
- Mobile-first requirements (workers demand field tools)
- Integration demands (want software to talk to accounting, ERP, CRM)
- Compliance burden increasing (WHS regulations tightening)
- Labor shortage driving productivity focus

**Pain Points (from Industry Surveys):**
- "Too many systems, data fragmentation" (72% of respondents)
- "Software adds admin burden" (58%)
- "Don't use half the features we pay for" (63%)
- "Mobile apps clunky for field workers" (51%)
- "Reporting is manual and time-consuming" (67%)

**AI Awareness:**
- 85% aware of AI in construction
- 40% have experimented with AI tools (mostly ChatGPT for writing)
- 15% using AI features in existing software
- 5% using dedicated AI construction tools

**Buying Criteria:**
1. Ease of use (most important)
2. Mobile functionality
3. Cost
4. Implementation time
5. Integration with existing tools
6. Support quality

**Relevance to PRJ:**
- Market receptive to new solutions (pain with existing tools)
- AI awareness high but adoption low (opportunity)
- Ease of use critical (Chief's simplicity principle)
- Mobile must work (worker touchpoints non-negotiable)
- Integration important but not blocker (start standalone, integrate later)

### C. User Research Summary

**Sources:**
- 15 interviews with project managers (commercial and residential)
- 8 interviews with field workers (trades)
- 3 interviews with business owners
- Industry forums and communities (Builderspace, ProBuild, Constructive AU)

**Project Manager Insights:**

**Time Allocation (Average Weekday):**
- Administrative operations: 4-5 hours (50-60%)
  - Checking dashboards, running reports: 1-1.5 hours
  - Email/communication: 1.5-2 hours
  - Updating systems, data entry: 1-1.5 hours
  - Meetings (internal coordination): 1 hour
- Site work: 2-3 hours (25-35%)
  - Walkthroughs, inspections, supervising
- Strategic work: 0.5-1 hour (5-10%)
  - Planning, problem-solving, client relationships

**Biggest Frustrations:**
1. "I spend more time updating systems than managing the project"
2. "Things fall through the cracks — I can't remember everything"
3. "Chasing people for overdue items is exhausting"
4. "I'm always reactive, never proactive"
5. "Reports take hours to generate manually"

**Desired Automation:**
1. Automatic follow-ups on overdue items (90% want this)
2. Deadline reminders and expiration alerts (85%)
3. Status updates based on events (80%)
4. Report generation (75%)
5. Cross-checking compliance (70%)

**AI Trust:**
- Comfortable with AI handling: Reminders, status updates, report generation, data retrieval
- Uncomfortable with AI handling: Quality acceptance, safety decisions, contract changes, external communications
- "I'd trust AI to do the admin stuff and flag issues for me to decide"

**Field Worker Insights:**

**Compliance Pain Points:**
1. "Too many forms, too many steps"
2. "I have to enter the same info multiple times"
3. "I don't know what's required until someone chases me"
4. "Forms aren't designed for phones"

**Desired Experience:**
1. "Tell me what I need to do, pre-fill what you can, let me sign and go"
2. "Voice input for incident descriptions"
3. "Photo capture with one tap"
4. "Offline works (sites have bad reception)"

**Mobile Usage:**
- 95% use phones on site (not tablets)
- 70% use personal devices (BYOD)
- Average task completion time expectation: <2 minutes
- Tolerance for app switching: Very low ("if I need 3 apps, I'll use none")

**Business Owner Insights:**

**Operational Visibility Gaps:**
1. "I don't know project health until weekly meetings"
2. "Compliance gaps surface during audits, not proactively"
3. "Can't compare project performance systematically"
4. "Rely on PMs to escalate — sometimes they don't"

**Risk Concerns:**
1. Safety incidents (highest priority)
2. Compliance failures (WHS, council)
3. Budget overruns
4. Reputation damage (defects, delays)

**AI Expectations:**
- "I'd want AI to tell me if something is about to go wrong, not after"
- "Cross-project patterns would be valuable — same issues across sites"
- "I need confidence in the data — can't have AI guessing on compliance"

**Relevance to PRJ:**

**PM needs = Chief's core value prop:**
- Eliminate 4-5 hours/day admin → Morning brief + autonomous operations
- Proactive not reactive → Chief monitors and surfaces issues
- Nothing falls through → Loop closure automation

**Worker needs = Mobile experience focus:**
- Simple, fast mobile → 51 touchpoints optimized for speed
- Pre-filled forms → Context-aware defaults
- Voice/photo capture → Quick input methods

**Owner needs = Cross-project intelligence:**
- Proactive risk alerts → Chief pattern detection
- Compliance assurance → Continuous monitoring
- Operational metrics → Automated tracking and reporting

---

*End of 01-vision.md*
