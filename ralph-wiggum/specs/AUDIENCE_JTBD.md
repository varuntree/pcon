# Audience & Jobs To Be Done

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Audiences](#audiences)
- [Key Workflows by Audience](#key-workflows-by-audience)
- [Autonomy Progression](#autonomy-progression)
- [User Research Findings](#user-research-findings)
- [Success Metrics Framework](#success-metrics-framework)
- [Dependencies](#dependencies)

## Purpose
Define user personas, pain points, daily workflows, and success metrics for PRJ Construction - an AI-first construction operations platform.

## Scope

### In Scope
- Primary, secondary, and tertiary audience definitions
- Pain points and frustrations per audience
- Jobs to be done with desired outcomes
- Success metrics (time saved, compliance, operational efficiency)
- Daily workflows and interaction patterns
- Trust progression and autonomy levels
- Mobile worker capabilities and constraints

### Out of Scope
- Implementation details (covered in UI_SYSTEM.md, MOBILE_DEMO.md)
- Technical architecture (covered in ARCHITECTURE.md)
- Chief AI capabilities (covered in AI_SYSTEM.md)
- Specific domain workflows (covered in domain specs)

---

## Audiences

### Primary: Project Managers / Site Supervisors

**Profile**
- 5-20 years construction experience
- Managing 1-3 concurrent projects
- Team of 5-50 people (mix of direct staff and subcontractors)
- Responsible for schedule, safety, quality, compliance
- Currently spend 60-80% time on administrative operations vs actual site work

**Pain Points**
- **System Fragmentation**: Too many systems to check (safety, quality, schedule, compliance)
- **Information Scattered**: Defects in one place, permits in another, schedule elsewhere
- **Constant Context Switching**: Operational tasks, meetings, emails, dashboards
- **Reactive Mode**: Firefighting issues rather than proactive management
- **Compliance Burden**: WHS documentation, client reporting, audits
- **Communication Overhead**: Following up with subcontractors, workers, management
- **Memory Dependence**: Deadlines in head, relying on memory rather than systems

**Time Allocation (Current State)**
- Administrative operations: 4-5 hours/day (50-60%)
  - Dashboard checking, reports: 1-1.5 hours
  - Email/communication: 1.5-2 hours
  - Updating systems, data entry: 1-1.5 hours
  - Internal coordination meetings: 1 hour
- Site work: 2-3 hours/day (25-35%)
- Strategic work: 0.5-1 hour/day (5-10%)

**Biggest Frustrations** (Direct Quotes)
- "I spend more time updating systems than managing the project"
- "Things fall through the cracks — I can't remember everything"
- "Chasing people for overdue items is exhausting"
- "I'm always reactive, never proactive"
- "Reports take hours to generate manually"

**Jobs To Be Done**

1. **Morning Briefing**: "Here's what needs your attention today"
   - Overnight issues surfaced
   - Today's critical items prioritized
   - Automated actions already taken (with undo)
   - **Outcome**: 8 minutes vs 45-60 minutes without Chief

2. **Proactive Identification**: "This permit expires tomorrow, I've drafted renewal"
   - Expiring permits, certifications, SWMS
   - Overdue defects, actions, checklists
   - **Outcome**: Zero missed deadlines, zero compliance gaps

3. **Draft Execution**: "I've assigned this defect to John based on trade, approve?"
   - Smart assignments based on trade matching
   - Pre-filled forms based on context
   - One-click approvals for routine operations
   - **Outcome**: 50% reduction in data entry time

4. **Automatic Follow-ups**: "Sent reminder to subbie about overdue checklist"
   - Overdue items tracked automatically
   - Reminders sent without manual intervention
   - Escalation when needed
   - **Outcome**: 90% want this automation

5. **Compliance Automation**: "SWMS expiring this week, I've scheduled refreshers"
   - SWMS validity monitored
   - Certification expirations tracked
   - Audit-ready documentation maintained
   - **Outcome**: Zero compliance surprises

6. **Exception Escalation**: "Critical defect raised, needs immediate attention"
   - Critical issues surfaced immediately
   - Phone notifications for urgent items
   - Context provided for quick decisions
   - **Outcome**: Faster incident response

**Daily Workflow**

*Morning (7:30 AM)*
- Open Chief workspace
- Scan overnight activity (15 seconds)
- Handle critical issue (5 minutes)
- Approve 4/5 drafted items (30 seconds)
- Modify one item (1 minute)
- Review what Chief handled (30 seconds)
- **Total**: 8 minutes vs 45-60 minutes manual

*During Day*
- 10:00 AM: Phone notification about critical defect (30 seconds to handle)
- 2:00 PM: Chief surfaces pattern detection in sidebar (1 minute to review)
- 4:00 PM: Ask Chief about past defect status (10 seconds response)

*End of Day (5:30 PM)*
- Chief end-of-day summary: Today's Outcome, Tomorrow's Focus, Overnight Operations
- Scan summary, note tomorrow's priorities (1 minute)
- **Total daily time in Chief**: ~12 minutes
- **Equivalent manual work**: 2-3 hours
- **Savings**: 10-15 hours/week

**Success Metrics**
- **Primary**: 20-30 hours/week saved on administrative operations (Autopilot phase)
- **Secondary**:
  - Loop closure rate: 97-99% (vs 70-80% baseline)
  - Proactive vs reactive ratio: 85-95% (Chief identifies before PM notices)
  - Approval rate: 93-97% (Chief proposals approved without modification)
  - Compliance: 100% (zero expired certifications, zero missed inspections)

**Trust Progression**
- **Week 1**: Chief proposes defect assignment, waits for approval every time
- **Week 4**: User has approved 40 similar assignments. Chief asks: "I've assigned defects to trades 40 times with 100% approval. Can I auto-assign going forward?"
- **Week 5+**: Chief auto-assigns, user sees summary

---

### Secondary: Field Workers

**Profile**
- Trades people, laborers, supervisors
- Mobile-first (phone/tablet on site)
- Need quick capture, minimal friction
- Compliance tasks: sign SWMS, conduct checklists, report incidents
- Communication with management and other workers

**Pain Points**
- **Too Many Steps**: Complicated forms and workflows
- **Unclear Requirements**: Don't know what's required until someone chases them
- **Duplicate Data Entry**: Same info entered multiple times across forms
- **No Site Access**: Can't access drawings, procedures, history on-site
- **Unclear Urgency**: Don't know what's urgent vs routine
- **Forms Not Mobile**: Not designed for phones, hard to use with gloves

**Mobile Usage Context**
- 95% use phones on site (not tablets)
- 70% use personal devices (BYOD)
- Average task completion time expectation: <2 minutes
- Tolerance for app switching: Very low ("if I need 3 apps, I'll use none")
- Harsh conditions: sun glare, gloves, noise, dust

**Usage Tolerance and Constraints**
- Tolerance for app switching: Very low ("if I need 3 apps, I'll use none")
- Environmental challenges: Sun glare, gloves, noise, dust
- Reception: Sites often have poor/no connectivity (offline critical)

**Jobs To Be Done**

1. **Task Clarity**: "Here's what you need to do today"
   - View assigned tasks aggregated across modules
   - Clear priorities and due dates
   - Deep links to complete tasks
   - **Outcome**: Zero missed assigned work

2. **Smart Defaults**: Forms pre-filled based on context
   - Location from GPS
   - Worker from sign-on
   - Asset from QR scan
   - **Outcome**: 50% less data entry

3. **Proactive Reminders**: "Your permit expires in 1 hour"
   - Permit expiry warnings
   - SWMS refresh notifications
   - Prestart check reminders
   - **Outcome**: Zero permit violations

4. **Quick Capture**: Voice-to-text for incident descriptions
   - Voice input for descriptions
   - One-tap photo capture
   - Signature with finger
   - **Outcome**: <2 minute task completion

5. **Contextual Help**: "You're about to work on electrical, here's the SWMS"
   - SWMS presented when needed
   - Safety notices during sign-on
   - Permit requirements surfaced
   - **Outcome**: 100% SWMS compliance

**Mobile Interactions**
- Sign SWMS before work starts
- Conduct safety checklists
- Report incidents/defects
- Submit prestart checks
- View assigned tasks
- Clock in/out (sign-ons)
- Take and upload photos
- Access drawings and documents

**Desired Experience** (Direct Quotes)
- "Tell me what I need to do, pre-fill what you can, let me sign and go"
- "Voice input for incident descriptions"
- "Photo capture with one tap"
- "Offline works (sites have bad reception)"

**Success Metrics**
- **Primary**: 50% less time on compliance admin
- **Secondary**:
  - Zero compliance gaps (all SWMS signed, all checklists completed)
  - Task completion time: <2 minutes average
  - Form abandonment rate: <5%

---

### Tertiary: Business Owners / Directors

**Profile**
- Overseeing 5-50 concurrent projects
- Focus on business health, risk management, strategic decisions
- Need visibility without micromanaging
- Compliance accountability (WHS officer, legal liability)

**Pain Points**
- **No Cross-Project Visibility**: Can't see patterns across projects
- **Reactive to Problems**: Firefighting rather than preventing
- **Compliance Risk**: Unnoticed expired certifications, missing documentation
- **Inefficient Resource Allocation**: Can't optimize across projects
- **Lack of Metrics**: How well are we running operations?

**Oversight Requirements**
- Multi-project dashboard (health at a glance)
- Risk alerts (critical defects, compliance gaps, delays)
- Performance metrics (loop closure rate, time-to-resolution)
- Audit trails (who did what when, why)

**Jobs To Be Done**

1. **Cross-Project Intelligence**: "Three projects have same subbie causing delays"
   - Pattern detection across portfolio
   - Subcontractor performance tracking
   - Resource allocation optimization
   - **Outcome**: Data-driven vendor management

2. **Risk Monitoring**: "Two critical defects open >7 days, escalating"
   - Critical defects tracked across projects
   - Aging issues escalated
   - Compliance gaps surfaced
   - **Outcome**: Proactive risk mitigation

3. **Compliance Assurance**: "All projects compliant, zero expired certifications"
   - Real-time compliance status
   - Certification expiry monitoring
   - Audit-ready documentation
   - **Outcome**: Zero compliance surprises, reduced liability

4. **Operational Metrics**: "Average defect resolution: 3.2 days, down from 5.1"
   - Loop closure rates
   - Time-to-resolution trends
   - Compliance maintenance metrics
   - **Outcome**: Continuous operational improvement

5. **Strategic Insights**: "Pattern detected: electrical inspections consistently delayed"
   - Process bottleneck identification
   - Resource constraint analysis
   - Efficiency opportunities
   - **Outcome**: Strategic process improvements

**Risk Concerns** (Prioritized)
1. Safety incidents (highest priority)
2. Compliance failures (WHS, council)
3. Budget overruns
4. Reputation damage (defects, delays)

**Research Findings**
- "I don't know project health until weekly meetings"
- "Compliance gaps surface during audits, not proactively"
- "Can't compare project performance systematically"
- "Rely on PMs to escalate — sometimes they don't"

**AI Expectations**
- "I'd want AI to tell me if something is about to go wrong, not after"
- "Cross-project patterns would be valuable — same issues across sites"
- "I need confidence in the data — can't have AI guessing on compliance"

**Success Metrics**
- **Primary**: Complete visibility into operations
- **Secondary**:
  - Zero compliance surprises
  - Cross-project pattern detection operational
  - Data-driven process improvements quarterly
  - Portfolio-level resource optimization

---

## Key Workflows by Audience

### Project Manager Workflows

**Morning Workflow** (Chief-Driven)
- Overnight Activity: 2 critical defects, 1 SWMS signed, 3 permits expiring, schedule update
- What Needs Attention: Critical items, approvals, decisions
- What I've Drafted: Follow-ups, assignments, applications
- What I Already Handled: Status updates, routine reminders

**Throughout Day** (Chief-Assisted)
- 10:00 AM: On-site walkthrough (Chief silent)
- 10:30 AM: Critical defect notification (Chief alerts)
- 2:00 PM: Working on schedule (Chief surfaces pattern)
- 4:00 PM: Client meeting (Chief provides status on demand)

**End of Day** (Chief Summary)
- Today's Outcome: 8 new tasks, 11 completed, 2 critical defects resolved
- Tomorrow's Focus: Toolbox meeting 7am, 4 defects for verification
- Overnight Operations: Monitor permit expirations

### Field Worker Workflows

**Site Arrival** (Mobile QR)
- Scan project QR code
- View prestart notice
- Acknowledge safety notice
- Sign in (worker tab)
- Confirmation displayed

**Work Start** (Mobile Tasks)
- Open task hub
- View assigned SWMS
- Read hazards and controls
- Acknowledge (3 checkboxes)
- Sign SWMS
- Work proceeds

**Equipment Use** (Mobile QR)
- Scan asset QR code
- Load prestart checklist
- Fill checklist fields
- Take photo
- Enter odometer
- Submit
- Pass/fail evaluation

**Incident Occurrence** (Mobile Capture)
- Tap "Report Incident"
- Describe what happened (voice/text)
- When/where occurred
- Severity selection
- Who involved
- Take photos
- Submit
- Supervisor auto-notified

**End of Day** (Mobile Sign-Out)
- Return to sign-in QR
- Sign out
- Hours logged automatically

### Business Owner Workflows

**Weekly Review** (Dashboard)
- Open multi-project dashboard
- Review project health cards
- Drill into red/yellow status
- Review compliance summary
- Check resource utilization

**Risk Monitoring** (Alerts)
- Receive alert: "2 critical defects open >7 days"
- Review defect details
- Escalate to project manager
- Set follow-up reminder

**Compliance Audit** (On-Demand)
- Request compliance report from Chief
- Generated instantly: all certifications current, all SWMS signed, all inspections complete
- Download audit-ready documentation
- Share with WHS officer

---

## Autonomy Progression

PRJ Construction uses progressive autonomy - Chief earns trust over time through demonstrated competence.

### Phase 1: Advisor (Weeks 1-12)
**Chief Behavior**
- Observes everything
- Identifies what needs attention
- Tells you what's needed
- You decide what to do
- Chief helps you do it

**User Actions**
- All db_write operations require explicit approval
- Review every recommendation
- Provide feedback on accuracy

**Metrics**
- Approval rate target: 70-80%
- Time saved: 5-8 hours/week (PM), 2-4 hours/week (worker)

### Phase 2: Operator (Months 3-9) — **Current Target**
**Chief Behavior**
- Identifies issues AND executes routine/reversible actions directly
- High-risk actions require explicit confirmation
- Provides undo for all actions
- Learns from corrections

**User Actions**
- Review summaries of what Chief handled
- Handle exceptions and high-stakes decisions
- Undo when needed (rare)

**Metrics**
- Approval rate target: 85-92%
- Undo frequency: <5%
- Time saved: 12-18 hours/week (PM), 4-7 hours/week (worker)

### Phase 3: Autopilot (Month 9+) — **Future**
**Chief Behavior**
- Handles operations autonomously
- Surfaces summaries of actions taken
- Escalates only exceptions and critical decisions
- Trust established through consistent performance

**User Actions**
- Intervene only for exceptions
- Review summaries periodically
- Make strategic decisions

**Metrics**
- Approval rate target: 93-97%
- Undo frequency: <2%
- Time saved: 20-30 hours/week (PM)

**Transition Mechanism**
- Hybrid approach: Metrics-based recommendations + user approval
- Chief tracks performance per action type
- Threshold example: "I've successfully executed X 50 times with 95% approval. Can I auto-execute going forward?"
- User grants autonomy per action category (not blanket approval)
- Different action types progress at different rates based on risk level

---

## User Research Findings

### Project Manager Research

**Desired Automation** (% wanting feature)
- Automatic follow-ups on overdue items: 90%
- Deadline reminders and expiration alerts: 85%
- Status updates based on events: 80%
- Report generation: 75%
- Cross-checking compliance: 70%

**AI Trust Research**
- Comfortable with AI handling: Reminders, status updates, report generation, data retrieval
- Uncomfortable with AI handling: Quality acceptance, safety decisions, contract changes, external communications
- Direct quote: "I'd trust AI to do the admin stuff and flag issues for me to decide"

### Field Worker Research

**Compliance Pain Points** (Direct Quotes)
- "Too many forms, too many steps"
- "I have to enter the same info multiple times"
- "I don't know what's required until someone chases me"
- "Forms aren't designed for phones"

**Mobile Constraints**
- Touch targets must be 44x44px minimum (WCAG)
- High contrast needed for outdoor visibility
- Bold typography for readability
- Minimal text input required
- Offline capability critical (sites have bad reception)

### Business Owner Research

**Operational Visibility Gaps**
- "I don't know project health until weekly meetings"
- "Compliance gaps surface during audits, not proactively"
- "Can't compare project performance systematically"
- "Rely on PMs to escalate — sometimes they don't"

---

## Success Metrics Framework

### Primary Metric: Time Saved
**Definition**: Hours per week saved on administrative operations

**Measurement**
- Pre-deployment baseline (time study over 2 weeks)
- Post-deployment tracking (weekly self-reported time allocation)
- Automated tracking (actions Chief takes × average time per action)

**Benchmarks**
- Advisor Phase: 5-8 hours/week (PM), 2-4 hours/week (Worker)
- Operator Phase: 12-18 hours/week (PM), 4-7 hours/week (Worker)
- Autopilot Phase: 20-30 hours/week (PM)

**Attribution**
- monitoring: Dashboards/reports Chief eliminated need to check
- follow_up: Reminders/escalations Chief sent automatically
- status_update: Entity state changes Chief executed
- documentation: Reports/summaries Chief generated
- identification: Issues Chief surfaced proactively

### Secondary Metrics

**1. Loop Closure Rate**
- **Definition**: % of lifecycle loops reaching terminal state without getting stuck
- **Formula**: loops_closed / (loops_closed + loops_stalled) × 100
- **Stalled**: Entity remains in non-terminal state for >2× expected duration without activity
- **Targets**: Baseline 70-80%, Advisor 85-90%, Operator 92-96%, Autopilot 97-99%

**2. Proactive vs Reactive Ratio**
- **Definition**: Issues Chief identifies before user notices vs issues user brings to Chief
- **Formula**: chief_identified / (chief_identified + user_identified)
- **Targets**: Advisor 30-40%, Operator 60-75%, Autopilot 85-95%

**3. Approval Rate**
- **Definition**: % of Chief proposals/actions approved without modification
- **Formula**: approved_as_is / (approved_as_is + modified + rejected) × 100
- **Targets**: Advisor 70-80%, Operator 85-92%, Autopilot 93-97%
- **Improvement**: Rate should increase as Chief learns company patterns

**4. Compliance Maintenance**
- **Definition**: Continuous compliance without manual intervention
- **Metrics**:
  - Zero expired certifications: 100%
  - Zero missed inspections: 100%
  - Zero overdue corrective actions: >95%
  - Audit-ready documentation: 100%

**5. Trust Progression**
- **Metrics**:
  - Time to Operator phase: <3 months
  - Time to Autopilot phase: <9 months
  - Undo frequency: Should decrease over time
  - Autonomy scope: More action types auto-approved

---

## Dependencies

**Required by**
- UI_SYSTEM.md (interface design for each audience)
- MOBILE_DEMO.md (worker simulator implementation)
- AI_SYSTEM.md (Chief capabilities aligned to JTBD)
- All domain specs (workflows per audience)

**Feeds into**
- Product roadmap prioritization
- Feature development sequencing
- Success criteria for MVP validation
