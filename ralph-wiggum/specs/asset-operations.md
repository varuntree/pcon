# Asset Operations

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Database Indexes](#database-indexes)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Asset operations manage day-to-day use of plant and equipment: prestart checks, maintenance logging, service tracking, and activity tracking. Ensures assets are safe before use and maintenance is tracked.

## Scope

### In Scope
- Prestart checks (equipment safety verification before use)
- Pass/fail evaluation with auto-defect creation
- Maintenance and service logs
- Activity tracking (prestart history)
- Odometer tracking (hours + kilometers)
- Asset checklists configuration (recurring inspections + prestarts)

### Out of Scope
- Asset registry (see asset-management.md)
- Asset allocations/bookings (see asset-management.md)
- General quality checklists (see quality-checklists.md)

## Requirements

### Prestarts
- **REQ-001**: Worker can submit prestart check by scanning asset QR or selecting from list
- **REQ-002**: Prestart template defines checklist structure with required fields
- **REQ-003**: System evaluates pass/fail: all required fields filled, all yesno = "yes", photo if required
- **REQ-004**: On failure, asset status → maintenance + auto-create defects (one per failed item) + action items
- **REQ-005**: On pass, asset status → operational, timestamp logged
- **REQ-006**: Odometer readings (hours + km) captured per prestart
- **REQ-007**: Photo capture if template.requiresPhoto = true
- **REQ-008**: Public access via QR for prestart submission (no auth required if publicAccess = true)
- **REQ-009**: Prestart submission creates checklistInstance via unified checklist system. On prestart submit, backend creates checklistInstances record, links via prestartSubmissions.checklistInstanceId, template structure from checklistTemplates (via assetChecklistConfigs), enables unified reporting across quality/asset/safety checklists, legacy prestartSubmissions.templateId maintained for backward compatibility

### Maintenance
- **REQ-010**: Log maintenance, repair, inspection, calibration events
- **REQ-011**: Track cost, performedBy, performedAt, nextServiceDue
- **REQ-012**: Attach photos/documents as evidence
- **REQ-013**: Service logs permanent, immutable after creation

### Activity Tracking
- **REQ-014**: Activity logs track prestart events with full context. Event types: prestart_passed, prestart_failed. Fields logged: projectId, assetId, workerId, type, description, timestamp. Description format: Pass="Pre-start check passed", Fail="Pre-start check failed: {N} issues". Queryable by asset for history view. Permanent audit trail.
- **REQ-015**: Maintenance history visible on asset detail screen (last 10 submissions)

### Asset Checklists Configuration
- **REQ-016**: Configure recurring inspection schedules per asset (daily/weekly/monthly/quarterly/annually)
- **REQ-017**: Configure prestart requirements per asset (on_use frequency)
- **REQ-018**: Link to checklistTemplates for reusable definitions
- **REQ-019**: Enable/disable checklist configs per asset

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **prestartSubmissions** | assetId, projectId, templateId (legacy), checklistInstanceId (new), performedByWorkerId, performedAt, responses, photoIds, passed, issues, odometerKm, odometerHours | Completed prestart checks with pass/fail result |
| **assetServiceLogs** | assetId, projectId, serviceType, description, performedBy, performedAt, cost, nextServiceDue, attachmentIds | Maintenance/repair/inspection records |
| **assetChecklistConfigs** | assetId, checklistTemplateId, purpose (inspection\|prestart), frequency (daily\|weekly\|monthly\|quarterly\|annually\|on_use) | Recurring inspection + prestart check configuration |
| **activityLogs** | projectId, assetId, type (prestart_failed\|prestart_passed), description, workerId, timestamp | Activity tracking for asset operations |
| **assets** | qrCode, status (operational\|maintenance) | Asset status updated based on prestart pass/fail |
| **defects** | projectId, assetId, sourceType (prestart), sourceId, priority (high), category (safety) | Auto-created on prestart failure |
| **actionItems** | projectId, sourceType (prestart), sourceId, priority, status | Auto-created on prestart failure |

## Database Indexes

Required indexes for efficient QR and prestart lookups:

| Index | Table | Fields | Purpose |
|-------|-------|--------|---------|
| by_qrCode | assets | qrCode | Fast QR resolution |
| by_asset | assetChecklistConfigs | assetId | Find active prestart config |
| by_asset | prestartSubmissions | assetId | Maintenance history lookup |
| by_project_date | prestartSubmissions | projectId, performedAt | Recent prestarts query |
| by_asset_status | prestartSubmissions | assetId, passed | Pass/fail filtering |

### Relationships
- prestartSubmissions → assets (assetId FK)
- prestartSubmissions → checklistInstances (checklistInstanceId FK - new unified system)
- prestartSubmissions → prestartTemplates (templateId FK - legacy)
- assetServiceLogs → assets (assetId FK)
- assetChecklistConfigs → assets (assetId FK)
- assetChecklistConfigs → checklistTemplates (checklistTemplateId FK)
- activityLogs → assets (assetId FK)
- defects/actionItems created on prestart failure (sourceType=prestart, sourceId=prestartSubmissionId)

## Workflows

### Workflow: Prestart Check (QR Flow)

**Trigger**: Worker scans asset QR code `/prestart/{qrCode}` or `/asset/{qrCode}`

1. **Resolve Asset + Template**
   - Lookup asset by qrCode (by_qrCode index)
   - Resolve prestart template (assetChecklistConfigs where purpose=prestart + isActive=true)
   - Check publicAccess flag (if false, require auth)

2. **Render Form**
   - Display asset context (name, make, model, serial)
   - Render checklist fields from template (16 field types supported: text, textarea, number, yesno, checkbox, select, multiselect, date, time, datetime, photo, signature, attachment, instruction, notes, action_trigger)
   - Mark required fields
   - Show photo capture if template.requiresPhoto = true
   - Show odometer inputs (km + hours)

3. **Submit**
   - Worker fills all required fields
   - Takes photo (if required)
   - Enters odometer readings
   - Submits form

4. **Evaluate Pass/Fail**
   - Pass criteria:
     - All required fields filled
     - All yesno fields = "yes"
     - Photo captured if template.requiresPhoto = true
   - Fail criteria: Any required field missing OR any yesno = "no" OR photo missing

5. **On Pass**
   - Asset status → operational
   - Log activityLog (type: prestart_passed)
   - Show success screen: "Asset ready for use"
   - Display: submitted timestamp, inspector name

6. **On Fail**
   - Asset status → maintenance
   - Create defects (one per failed item):
     - priority: high
     - category: safety
     - sourceType: prestart
     - sourceId: prestartSubmissionId
     - title: failed item description
   - Create action items (one per defect)
   - Log activityLog (type: prestart_failed)
   - Show failure screen: "Asset out of service"
   - Display: list of issues (max 3), defects/actions auto-created, "View Defects" button

7. **Confirmation**
   - Show success/failure screen with next steps
   - Option to continue to full app or return to task list

### Workflow: Public Prestart Submission (QR)

**Entry Point**: `/prestart/{qrCode}` (no auth required)

**Backend Resolution:**
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

    // Get active prestart config
    const config = await ctx.db
      .query('assetChecklistConfigs')
      .withIndex('by_asset', q => q.eq('assetId', asset._id))
      .filter(q =>
        q.and(
          q.eq(q.field('purpose'), 'prestart'),
          q.eq(q.field('isActive'), true)
        )
      )
      .first();

    if (!config) return null;

    // Get template
    const template = await ctx.db.get(config.checklistTemplateId);

    // Check public access
    if (!template.publicAccess) {
      throw new Error('Auth required for this prestart');
    }

    return { asset, config, template };
  }
});
```

**Flow:**
1. Worker scans QR on asset sticker
2. Browser opens `/prestart/QR-123ABC`
3. Backend resolves asset + template
4. Renders mobile prestart form
5. Worker completes all fields + photo + odometer
6. Submit creates prestartSubmissions + checklistInstance
7. Pass/fail evaluation
8. On fail: auto-create defects + actions
9. Success/failure screen shown

### Workflow: Maintenance Log Entry

**Trigger**: Site supervisor completes service/repair on asset

1. **Navigate to Asset Detail**
   - View asset from asset list
   - Tap "Log Service" button

2. **Enter Service Details**
   - Select serviceType (maintenance|repair|inspection|calibration|other)
   - Enter description (what was done)
   - Enter performedBy (worker/contractor name)
   - Select performedAt (date/time)
   - Enter cost (optional)
   - Select nextServiceDue (date)
   - Attach photos/documents

3. **Submit**
   - Create assetServiceLogs record
   - Update asset.nextServiceDue (if provided)
   - Show confirmation

4. **View History**
   - Service logs visible on asset detail screen
   - Sorted desc by performedAt
   - Filter by serviceType

### Workflow: Asset Checklist Configuration

**Trigger**: Admin configures recurring inspections for asset

1. **Navigate to Asset Detail**
   - View asset from asset registry
   - Tap "Configure Checklists" tab

2. **Add Checklist Config**
   - Select checklistTemplateId (from quality-checklists.md)
   - Select purpose:
     - "inspection" → recurring maintenance inspections
     - "prestart" → pre-use safety checks
   - Select frequency:
     - inspection: daily|weekly|monthly|quarterly|annually
     - prestart: on_use
   - Mark isActive = true

3. **Save**
   - Create assetChecklistConfigs record
   - Template now available for asset

4. **Usage**
   - Inspection: Scheduled automatically based on frequency
   - Prestart: Triggered on asset QR scan (if publicAccess = true) or manual selection

## Acceptance Criteria

### AC-001: Prestart Pass
- Given asset with prestart template configured
- When worker scans QR, fills all fields correctly, all yesno="yes", photo taken
- Then prestart submission created with passed=true, asset status=operational, activityLog created

### AC-002: Prestart Fail with Auto-Defects
- Given asset with prestart template configured
- When worker scans QR, fills fields with yesno="no" on "Brake check"
- Then prestart submission created with passed=false, asset status=maintenance, defect created (priority=high, category=safety, title="Brake check"), action item created, activityLog created

### AC-003: Odometer Tracking
- Given prestart submission form
- When worker enters odometerKm=12345, odometerHours=567
- Then prestartSubmissions.odometerKm=12345, odometerHours=567

### AC-004: Maintenance Log
- Given asset detail screen
- When supervisor logs service (type=maintenance, description="Oil change", performedBy="John", performedAt=2025-01-15, cost=150, nextServiceDue=2025-04-15)
- Then assetServiceLogs created, asset.nextServiceDue updated, service appears in maintenance history

### AC-005: Public QR Access
- Given prestart template with publicAccess=true
- When visitor (no auth) scans asset QR `/prestart/{qrCode}`
- Then prestart form loads, submission succeeds without login

### AC-006: Checklist Integration
- Given prestart submission
- When checklistInstanceId created via unified checklist system
- Then prestartSubmissions.checklistInstanceId links to checklistInstances, template fields synced

## Dependencies

### Upstream Dependencies (Required)
- **asset-management.md**: Asset registry (assets table, qrCode, status field)
- **quality-checklists.md**: Unified checklist system (checklistTemplates, checklistInstances, 16 field types)
- **quality-defects.md**: Defect creation (defects table, actionItems table)

### Downstream Dependencies (Used By)
- **chief-agent.md**: AI identifies overdue prestarts, maintenance gaps, auto-suggests service schedules
- **mobile-worker.md**: Worker mobile UI for prestart submission (51 screens include prestarts)
- **mobile-qr.md**: QR flow `/prestart/{qrCode}` for public access (7 QR flows total)

### Cross-Module Integration
- **activityLogs**: Shared table for prestart_passed/prestart_failed events
- **mediaFiles**: Photo capture for prestarts, attachments for service logs
- **workers**: performedByWorkerId FK for prestart submissions, performedBy string for service logs
- **projects**: projectId scope for all operations
