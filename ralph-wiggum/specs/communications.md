# Communications

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)
- [Notes](#notes)

## Purpose
Internal communication system (in-app notifications, messages, alerts). Admin → worker messages, notification preferences, recipient tracking, delivery status.

## Scope

### In Scope
- In-app notifications (feed)
- Notification preferences (per user, per type)
- Admin → worker messages (project-level communications)
- Recipient tracking (sent/delivered/read)
- Alerts (project-wide announcements)
- Status derivation (read/unread)
- Delivery tracking (per recipient)

### Out of Scope
- Email delivery (integrations.md - future phase)
- SMS notifications (integrations.md)
- External communications (subcontractors, clients) - Chief drafts only, humans send
- Push notifications (mobile devices)
- Webhooks (integrations.md)

## Requirements

### Notifications

**REQ-001: In-App Notification Feed**
- User notification feed with unread/read tracking
- Polymorphic entity linking (entityType + entityId)
- Mark as read functionality
- Timestamp tracking (createdAt, readAt)
- Notification pruning (eventually)

**REQ-002: Notification Types**
- Support specific notification types via type field:
  - `expiry_alert`: Certificates, permits, certifications expiring
  - `approval_request`: SWMS, permits, variations pending review
  - `action_reminder`: Overdue actions, defects, checklists
  - `status_change`: Defect resolved, schedule published, incident closed
  - `system`: General system messages and announcements
- Polymorphic links to source entities
- Type-specific formatting and icons
- Type CSS variables for visual styling

**Notification Triggers:**
- Certificate expiry within 30 days → expiry_alert
- SWMS status = 'pending_review' → approval_request
- Action item dueDate < today → action_reminder
- Defect status → 'resolved' → status_change
- Schedule published → status_change
- Permit needs approval → approval_request

**REQ-003: Notification Preferences**
- User-level notification settings
- Email enabled/disabled per type (future)
- Email frequency options (future): instant, daily, weekly, never
  - instant: Send immediately
  - daily: Digest once per day
  - weekly: Weekly summary
  - never: In-app only
- Push enabled/disabled (future)
- Type-specific preferences (per notification type)
- Metadata for extensibility
- Default preferences: inApp = true, email = false

### Messages

**REQ-004: Admin → Worker Messages**
- Project-level communications from management to workers
- Subject + message body
- Attachment support (embedded array of mediaFileIds)
- Sender tracking (sentBy workerId)
- Timestamp (sentAt)
- Polymorphic source context (sourceType + sourceId)

**REQ-005: Message Attachments**
- Embedded attachmentIds array (was separate table)
- Links to mediaFiles for downloads
- Multiple attachments per message

**REQ-006: Communication Inbox**
- Workers view messages assigned to them
- Unread count tracking
- Sender info display
- Attachment count display
- Date sorting

### Recipient Tracking

**REQ-007: Delivery Status Tracking**
- Per-recipient delivery status
- Status enum: sent | delivered | read | failed
- Timestamp tracking: deliveredAt, readAt
- Metadata for delivery details

**REQ-008: Read Receipt Tracking**
- Track when recipient reads message
- Status progression: sent → delivered → read
- Failure tracking (failed status)

**REQ-009: Multi-Recipient Messages**
- One communication, many recipients
- Separate status per recipient
- Query by worker or by message
- Status filtering

### Chief Integration

**REQ-010: Chief Internal-Only Communication**
- Chief communicates with internal team members only
- Chief does NOT communicate with external parties (subcontractors, clients)
- Exception: Notifications to users within same org
- Rationale: External parties expect human communication

**REQ-011: Chief Drafts External Communications**
- Chief drafts external communications for human review
- Tracks external communication threads
- Reminds about required external responses
- Human must send (Chief does not auto-send external)

**REQ-012: Automatic Follow-ups (Chief)**
- Chief sends follow-ups on overdue items (90% want this)
- Drafts follow-ups for human approval
- PM time saved: 1.5-2 hours/day on email/communication reduced

**REQ-013: Chief Notification Context**
- Chief can suggest navigation via ai.ui_navigate tool
- ctaLabel and description for notifications
- Deep links to relevant entities

### Alerts

**REQ-014: Project-Wide Alerts**
- Project-level alerts (weather, safety, changes)
- Alert kinds: weather | change | safety | other
- Require acknowledgment flag (requiresAck)
- Status: draft | sent | archived
- Sent timestamp tracking

**REQ-014A: Alert Acknowledgment Tracking** *(Future)*
- Track which workers acknowledged alerts (when requiresAck = true)
- Acknowledgment timestamp per worker
- Compliance reporting (who hasn't acknowledged)
- Note: Implementation details TBD (separate table vs embedded array)

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **notifications** | userId, type, title, message, entityType, entityId, isRead, readAt, metadata, createdAt | In-app notification feed with polymorphic entity links |
| **notificationPreferences** | userId, emailEnabled, pushEnabled, preferences, metadata, createdAt, updatedAt | User notification settings per type |
| **communications** | projectId, subject, message, sentBy, sentAt, attachmentIds (array), sourceType, sourceId, metadata, createdAt | Admin → worker messages with embedded attachments |
| **communicationRecipients** | communicationId, workerId, status (sent\|delivered\|read\|failed), deliveredAt, readAt, metadata, createdAt, updatedAt | Message delivery tracking per recipient |
| **alerts** | projectId, kind (weather\|change\|safety\|other), message, requiresAck, status (draft\|sent\|archived), sentAt, metadata, createdAt | Project-wide alerts and notifications |

### Indexes

**notifications**
- `by_user` [userId]
- `by_user_read` [userId, isRead]
- `by_entity` [entityType, entityId]

**notificationPreferences**
- `by_user` [userId]

**communications**
- `by_project` [projectId]
- `by_sender` [sentBy]
- `by_source` [sourceType, sourceId]

**communicationRecipients**
- `by_communication` [communicationId]
- `by_worker` [workerId]
- `by_worker_status` [workerId, status]

**alerts**
- `by_project` [projectId]
- `by_status` [projectId, status]

### Schema Changes from Current

**communications table**
- CHANGED: attachmentIds now embedded array (was separate communicationAttachments table)
- Pattern: Simplifies queries, follows defects.comments[] pattern

**communicationRecipients table**
- No changes

**notifications table**
- No changes

**alerts table**
- Exists in source but was missing from spec (now included)

## Workflows

### Notification Creation
1. Event occurs (defect created, SWMS signed, etc.)
2. System creates notification record
3. Notification appears in user feed (unread)
4. User views notification → marks read
5. Notification links to entity (polymorphic)

### Admin Message Workflow
1. Admin creates communication (subject, message, attachments)
2. Selects recipient workers
3. System creates communication record
4. System creates communicationRecipients records (status: sent)
5. Workers see message in inbox (unread count)
6. Worker opens message → status: delivered
7. Worker reads message → status: read
8. Worker downloads attachments (if any)

### Chief Notification Workflow (Proactive)
1. Scheduled cron job triggers Chief agent
2. Chief loads data via db_read
3. Chief analyzes patterns (expiring permits, compliance reminders)
4. Chief creates notification records via db_write
5. User sees on app open (no user action required)

### Chief Message Draft Workflow
1. Chief identifies overdue items (defects, checklists, etc.)
2. Chief drafts follow-up message
3. Chief presents draft to PM for approval
4. PM approves → message sent
5. PM modifies → Chief updates and sends
6. Recipients tracked via communicationRecipients

### Alert Creation Workflow
1. Admin creates alert (weather, safety, change)
2. Alert status: draft
3. Admin sends alert → status: sent, sentAt timestamp
4. All project members notified (if requiresAck = true)
5. Later: Admin archives alert → status: archived

## Acceptance Criteria

**AC-001: Notification Feed Display**
- Given user has 5 unread notifications
- When user opens notification feed
- Then all notifications appear with unread/read status
- And unread count badge shows 5
- And notifications sorted by createdAt desc

**AC-002: Mark Notification as Read**
- Given user has unread notification
- When user clicks notification
- Then isRead = true, readAt = timestamp
- And notification removed from unread count
- And polymorphic entity link navigates to source

**AC-003: Admin Creates Message**
- Given admin has project access
- When admin creates communication with subject, message, 2 attachments, 3 recipients
- Then communication record created with attachmentIds array
- And 3 communicationRecipient records created (status: sent)
- And 3 workers see message in inbox (unread)

**AC-004: Worker Reads Message**
- Given worker has unread message
- When worker opens message
- Then communicationRecipient status: sent → delivered
- When worker views message content
- Then communicationRecipient status: delivered → read, readAt timestamp
- And worker can download attachments

**AC-005: Chief Automatic Follow-up**
- Given defect overdue by 3 days
- When Chief daily check runs
- Then Chief drafts follow-up message
- And PM sees draft in approval queue
- And PM approves with 1 click
- And message sent to assigned worker

**AC-006: Chief Does Not Send External**
- Given Chief detects overdue subcontractor checklist
- When Chief prepares communication
- Then Chief drafts message for human review
- And Chief does NOT auto-send to subcontractor
- And message waits in PM approval queue
- Rationale: External communications require human sending

**AC-007: Notification Preferences**
- Given user opens notification settings
- When user toggles emailEnabled = false
- Then notificationPreferences record updated
- And email notifications paused (future phase)
- And in-app notifications continue

**AC-008: Alert Broadcast**
- Given admin creates weather alert (requiresAck = true)
- When admin sends alert
- Then alert status: draft → sent
- And all project workers notified
- And notification created per worker

**AC-009: Delivery Status Filtering**
- Given communication with 10 recipients
- When PM queries "who read this message"
- Then communicationRecipients filtered by status = 'read'
- And 6 workers read, 4 unread
- And PM sees delivery report

**AC-010: Polymorphic Notification Links**
- Given notification entityType = 'defects', entityId = defect_123
- When user clicks notification
- Then system navigates to /projects/:projectId/defects/defect_123
- And notification marked read
- And defect detail screen displays

## Dependencies

### Internal Dependencies
- **foundation.md**: projectId scope, orgId scope, userId
- **site-operations.md**: toolbox meetings, attendance, schedule updates
- **safety-swms.md**: SWMS signed notifications
- **safety-permits.md**: permit expiry alerts, approval notifications
- **safety-inductions.md**: induction completion notifications
- **safety-incidents.md**: incident created/closed notifications
- **safety-compliance.md**: certification expiry notifications
- **asset-operations.md**: prestart failure notifications
- **quality-checklists.md**: checklist overdue notifications
- **quality-defects.md**: defect created/assigned notifications
- **chief-agent.md**: Chief notification creation, message drafting, follow-up automation
- **integrations.md**: Email delivery (future), webhook events (future)

### External Dependencies
- **mediaFiles table**: Attachments for communications
- **workers table**: Recipients, senders
- **projects table**: Project scope

### Technical Dependencies
- Convex reactivity for real-time notification feed updates
- Polymorphic entity references (entityType + entityId)
- Embedded arrays pattern (attachmentIds, not separate table)
- Indexes for efficient queries (by_user_read, by_worker_status)

### Future Dependencies
- **Email integration**: Resend API for email delivery
- **Push notifications**: Mobile device push
- **Webhooks**: External system event notifications
- **SMS**: Twilio for critical alerts

## Notes

### Design Decisions

**Polymorphic Entity Links**
- Notifications link to any entity via entityType + entityId
- Flexible: add new types without schema changes
- Tradeoff: No FK constraints (must validate in code)

**Embedded Attachments Array**
- communications.attachmentIds replaces separate table
- Follows defects.comments[] consolidation pattern
- Simpler queries, fewer joins

**Per-Recipient Status Tracking**
- Separate communicationRecipients record per worker
- Enables individual delivery/read tracking
- Supports queries: "who read", "who hasn't opened"

**Chief Internal-Only Communication**
- Chief communicates with internal team members only
- Chief does NOT communicate externally (subcontractors, clients)
- Rationale: External communications carry reputational/contractual risk
- Tone and relationship management require human judgment

**Notification Type System**
- Five core notification types cover all use cases
- Type field is string (not enum) for extensibility
- Type-specific preferences allow granular control
- Email frequency per type enables flexible delivery
- Default: all in-app, email opt-in

**Chief Drafts External Communications**
- Chief prepares external messages for human review
- Human must click send (not auto-sent)
- Tracks external communication threads
- Reminds about required external responses

**Alert Acknowledgment** *(Deferred)*
- requiresAck flag indicates acknowledgment required
- Acknowledgment tracking mechanism not yet defined
- Options: separate table, embedded array, or notification-based
- Decision deferred to implementation phase

### PM Pain Points Addressed
- Communication overhead: 1.5-2 hours/day on email/communication
- 90% want automatic follow-ups on overdue items
- Chasing people for overdue items is exhausting
- Chief drafts follow-ups, PM approves in seconds

### Chief Capabilities
- Automatic follow-ups (drafted for approval)
- Compliance reminders (SWMS expiring, cert expiring)
- Risk alerts (high-priority defects not assigned)
- Status updates to team (daily site reports)
- Proactive identification ("This permit expires tomorrow")

### Chief Does NOT Do
- Communicate with external parties (subcontractors, clients, consultants, regulators)
- Auto-send messages without human approval for external
- Replace human judgment on communication tone/relationship management

### Visual Design
- Notification type CSS variables for color coding
  - `--notify-expiry-bg/text` (red, for expirations)
  - `--notify-approval-bg/text` (orange, for pending approvals)
  - `--notify-action-bg/text` (blue, for required actions)
  - `--notify-status-bg/text` (green, for status updates)
  - `--notify-system-bg/text` (gray, for system messages)

### Performance Considerations
- Notification feed pagination (first 50, load more)
- Unread count query optimized via by_user_read index
- Polymorphic entity links: validate entityType in code
- Delivery status queries: by_worker_status index for fast filtering

### Migration Notes
- **communicationAttachments → communications.attachmentIds**: Embed array, migrate data
- **alerts table**: Was missing from spec, now included (exists in source)
- **Polymorphic pattern**: entityType + entityId used consistently

### Open Questions
- **Email delivery timing**: When to send instant vs daily digest vs weekly?
  - Recommendation: Instant for critical (incidents, high priority defects), daily for routine (cert expiring), weekly for summaries
- **Push notification priority**: Which events require mobile push?
  - Recommendation: Critical defects, incident reports, permit expiry < 1hr
- **Notification pruning**: When to delete old read notifications?
  - Recommendation: After 90 days, or user-initiated clear
- **External communication boundary**: Should Chief ever send external communications autonomously?
  - Current position: Human must send. Chief drafts only.
  - Reconsider if: Trust reaches very high levels (95%+ approval rate) and communications are routine (e.g., permit renewal confirmations).
  - Decision timeline: After 12+ months of usage data.
