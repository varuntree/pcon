# Integrations

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
External integrations enable PRJ Construction to bridge digital and physical workflows, export compliance documents, and connect with third-party systems. Core integrations: file storage (Convex), PDF generation (Puppeteer), QR codes (physical access), webhooks (event notifications), email (future), and external APIs (future).

## Scope

### In Scope
- **File Storage**: Convex Storage for files ≤20MB, signed URLs, access control
- **PDF Generation**: Server-side compliance documents (SWMS, certificates, reports)
- **QR Codes**: No-auth physical→digital workflows (site sign-in, equipment checks, SWMS signing)
- **Webhooks**: Outbound HTTP notifications for system events (incidents, permits, schedule changes)
- **Email Integration**: Transactional notifications and digests (future phase)
- **External APIs**: Third-party sync (Procore, Xero, PlanGrid - future phase)

### Out of Scope
- Video processing (future: 100MB+ files)
- CAD file processing (future: 50MB+ files)
- Real-time chat/messaging (future)
- Mobile push notifications (future)
- Blockchain/smart contracts
- AI/ML model training (inference only via Claude SDK)

## Requirements

### File Storage (REQ-FS)

**REQ-FS-001: Convex Storage for files ≤20MB**
- Storage provider: Convex Storage (primary)
- Max file size: 20MB per file
- Supported types: Images (jpg, png, gif, webp), Documents (pdf, doc, docx), Spreadsheets (xls, xlsx, csv)
- Type limits: Images 10MB, Documents 25MB, Spreadsheets 10MB
- Future: External storage (S3/Cloudflare R2) for files >20MB

**REQ-FS-002: File upload flow**
1. Client requests upload URL via Convex mutation
2. Convex returns signed upload URL
3. Client POSTs file to Convex Storage
4. Convex returns storageId
5. Client creates mediaFiles record with storageId
6. System returns mediaFileId

**REQ-FS-003: Client-side image processing (before upload)**
- Resize large images (max 2048px dimension)
- Compress JPEG quality to 85%
- Strip EXIF data (except orientation)
- Generate thumbnails (256x256) as separate file

**REQ-FS-004: File retrieval with signed URLs**
- Query entity → includes mediaFileId
- Resolve storageId → signed URL (expires 1 hour)
- Return entity + URL to client
- Client fetches file from signed URL

**REQ-FS-005: Access control**
- Project membership checked before URL generation
- Public share code flows bypass membership (by design)
- Rate limiting: 10 uploads/minute per user
- File type validation: MIME type + extension check
- Malware scanning: Not implemented (future)

**REQ-FS-006: mediaFiles table**
```typescript
{
  orgId?: Id<'orgs'>,
  projectId?: Id<'projects'>,
  storageProvider: 'convex' | 'external',
  storageId?: string,           // Convex Storage ID
  externalUrl?: string,          // S3/R2 URL (future)
  externalKey?: string,          // S3/R2 key (future)
  fileName: string,
  mimeType?: string,
  sizeBytes?: number,
  kind: 'document' | 'image' | 'video' | 'audio' | 'other',
  category?: 'site' | 'progress' | 'safety' | 'quality' | 'other',
  caption?: string,
  takenAt?: string,              // ISO timestamp
  linkedEntityType?: string,     // Polymorphic reference
  linkedEntityId?: string,
  metadata?: any
}
```

**REQ-FS-007: API functions**
- `generateUploadUrl()`: Returns signed upload URL
- `create()`: Create mediaFiles record
- `get()`: Retrieve media file metadata + signed URL
- `list()`: List media files (filtered by project/org/kind/category)
- `delete()`: Delete media file (soft delete, keep record)
- `resolveMediaFileUrl(ctx, mediaFile)`: Helper to resolve signed URL
- `createFromUpload()`: Create record from completed upload

### PDF Generation (REQ-PDF)

**REQ-PDF-001: Server-side PDF generation**
- Technology: Puppeteer (HTML → PDF)
- Alternative: React-PDF for client-side preview
- Template engine: React components define PDF structure
- Storage: PDFs stored as mediaFiles for audit trail

**REQ-PDF-002: PDF use cases (8 templates)**
1. **SWMS Export** (`swms-signed`) - 2-5 pages, multiple signatures, no photos
   - Trigger: User action
   - Content: Full SWMS with all sections
   - Signatures: All worker signatures
   - Layout: Header (logo, doc number, project, date, version, status), Work activity (location, duration), Organization details (principal contractor, ABN, supervisor, license), Risk assessment matrix (likelihood vs consequence: L/M/H/E), Hazards & Controls (risk level, control types), Required PPE checklist, High risk construction work flags, Emergency contacts, Signatures (images, names, roles, timestamps), Document generated timestamp, Verification QR code

2. **Induction Certificate** (`induction-certificate`) - 1 page, 2 signatures, no photos
   - Trigger: Completion
   - Content: Worker details, date, verifier
   - Signatures: Worker + verifier
   - Layout: Header ("CERTIFICATE OF SITE INDUCTION" + logo), Worker name, Project name, Induction date, Certificate number, Valid until date, Topics covered (site safety rules, emergency procedures, PPE requirements, environmental management, quality standards, hazard reporting), 2 signature blocks (worker + site supervisor), Verification QR code

3. **Checklist Report** (`checklist-report`) - 2-10 pages, 1 signature, yes photos
   - Trigger: Completion
   - Content: Responses, photos, pass/fail
   - Signatures: Conductor

4. **Incident Report** (`incident-report`) - 3-8 pages, 2 signatures, yes photos
   - Trigger: Closure
   - Content: Full incident details, corrective actions
   - Signatures: Investigator + closer

5. **Prestart Report** (`prestart-report`) - 2-3 pages, 1 signature, yes photos
   - Trigger: Submission
   - Content: Equipment checks, defects found
   - Signatures: Operator

6. **Toolbox Attendance** (`toolbox-attendance`) - 2-4 pages, multiple signatures, optional photos
   - Trigger: Meeting completion
   - Content: Meeting details, attendees
   - Signatures: All attendees

7. **Permit Application** (`permit-application`) - 2-4 pages, 2 signatures, optional photos
   - Trigger: Approval
   - Content: Permit details, conditions, approvals
   - Signatures: Applicant + approver

8. **Defect Report** (`defect-report`) - 2-5 pages, 1 signature, yes photos
   - Trigger: Closure
   - Content: Defect details, resolution
   - Signatures: Resolver

**REQ-PDF-003: PDF generation flow**
1. Request PDF (`entityType`, `entityId`, `template?`, `options?`)
2. Fetch entity data (enriched)
3. Render PDF via Puppeteer
4. Store in Convex Storage
5. Create mediaFiles record
6. Return URL

**REQ-PDF-004: PDF template registry**
```typescript
type PdfTemplate = {
  id: string;
  name: string;
  documentType: 'swms' | 'certificate' | 'report' | 'permit' | 'summary';
  fetchData: (ctx, entityId) => Promise<any>;
  render: (data) => Promise<Buffer>;
  options?: {
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    margin?: { top: string; right: string; bottom: string; left: string };
    header?: boolean;
    footer?: boolean;
  };
};
```

**REQ-PDF-005: Verification QR codes**
- Every PDF includes verification QR code
- URL: `/verify/{entityType}/{entityId}/{hash}`
- Hash: SHA256 of (entityId + signatures + timestamp)
- Public verification page shows: entity details, signatures, generation timestamp
- Tamper detection: Hash mismatch = invalid document

**REQ-PDF-006: API functions**
- `generate({ entityType, entityId, template?, options? })`: Generate PDF
- `preview({ entityType, entityId, template? })`: Client-side preview (React-PDF)

### QR Codes (REQ-QR)

**REQ-QR-001: QR code types (8 types)**
1. **Site Sign-In** - `/w/signin/{code}` - Worker/visitor site attendance - No expiry
2. **SWMS Signing** - `/w/swms/{code}` - Sign SWMS before work - Expiry: Optional
3. **Induction** - `/w/induction/{code}` - Complete site induction - Expiry: Optional
4. **Prestart** - `/w/prestart/{code}` - Submit equipment prestart - No expiry
5. **Toolbox** - `/w/toolbox/{code}` - Mark toolbox attendance - Expiry: Meeting start
6. **Asset Access** - `/w/asset/{code}` - View asset info + submit checklist - No expiry
7. **Document Upload** - `/w/upload/{code}` - Upload docs (subcontractor) - Expiry: Optional
8. **Verification** - `/verify/{type}/{id}/{hash}` - Verify document authenticity - No expiry

**REQ-QR-002: QR code generation**
- Library: `nanoid` for collision-resistant codes
- Algorithm: `generateShareCode()` returns 12-character URL-safe code
- Alphabet: A-Za-z0-9_-
- Entropy: ~71 bits (2^71 combinations, collision probability negligible)
- Image generation: `qrcode` library (v1.5.4)
  - Width: 256px (default)
  - Margin: 2
  - Error correction: 'M' (Medium - 15% damage recovery)

**REQ-QR-003: QR poster generation**
- Format: A4 PDF
- Content: Large QR code (center), Title, Instructions, URL (fallback), Project branding
- Purpose: Print + laminate for site display

**REQ-QR-003.1: QR poster generation workflow**
1. Generate share code for entity (REQ-QR-002)
2. Create QR image (qrcode library, 512x512 for print quality)
3. Render A4 PDF template:
   - Large QR code (center, 200x200mm)
   - Title (e.g., "Site Sign-In - Harbor Bridge Project")
   - Instructions (e.g., "1. Scan QR code with phone camera\n2. Select your name\n3. Tap Sign In")
   - Fallback URL (manual entry: prjconstruction.app/w/signin/Uakgb_J5m9g-)
   - Project branding (logo, colors)
4. Store PDF as mediaFile
5. Return PDF URL for download/print
6. Physical deployment: Print→laminate→mount at entry/asset location

**REQ-QR-004: Share code storage (dedicated table)**
```typescript
shareCodes: defineTable({
  code: v.string(),              // 12-char URL-safe
  type: v.union(
    v.literal('swms'),
    v.literal('signin'),
    v.literal('induction'),
    v.literal('prestart'),
    v.literal('toolbox'),
    v.literal('asset'),
    v.literal('upload'),
    v.literal('verification')
  ),
  entityId: v.string(),          // Linked entity ID
  projectId: v.id('projects'),
  orgId: v.optional(v.id('orgs')),
  createdBy: v.id('workers'),
  isActive: v.boolean(),
  expiresAt: v.optional(v.string()),  // ISO timestamp
  maxUses: v.optional(v.number()),
  usedCount: v.number(),
  lastUsedAt: v.optional(v.string()), // ISO timestamp
  createdAt: v.string()
})
  .index('by_code', ['code'])
  .index('by_entity', ['entityId'])
  .index('by_project', ['projectId', 'type'])
```

**REQ-QR-005: Public route validation**
- Check shareCode active (`isActive: true`)
- Check not expired (`expiresAt` > now or null)
- Check not over max uses (`usedCount` < `maxUses` or null)
- State gating: e.g., SWMS must be approved before signing

**REQ-QR-005.1: Public route implementation pattern**
```typescript
// Example: app/(public)/w/signin/[code]/page.tsx
export default async function PublicWorkflowPage({ params }) {
  // 1. Validate share code
  const shareCode = await convex.query(api.shareCodes.getByCode, {
    code: params.code
  });

  if (!shareCode || !shareCode.isActive) {
    return <InvalidCodePage message="This QR code is not active" />;
  }

  if (shareCode.expiresAt && new Date(shareCode.expiresAt) < new Date()) {
    return <ExpiredCodePage expiresAt={shareCode.expiresAt} />;
  }

  if (shareCode.maxUses && shareCode.usedCount >= shareCode.maxUses) {
    return <MaxUsesReachedPage />;
  }

  // 2. State gating (entity-specific)
  if (shareCode.type === 'swms') {
    const swms = await convex.query(api.swms.get, { id: shareCode.entityId });
    if (swms.status !== 'approved') {
      return <ErrorPage message="SWMS must be approved before signing" />;
    }
  }

  // 3. Load workflow wizard
  return <WorkflowWizard shareCode={shareCode} />;
}
```

**REQ-QR-006: Security**
- **Unguessable codes**: 12 characters base64url = 2^71 combinations, brute force infeasible
- **Access control**: `isActive` flag (instant deactivation), `expiresAt` (automatic expiry), `maxUses` (single-use or limited), state gating (entity must be in correct state)
- **Rate limiting**: Max 5 submissions/code/hour (prevent spam), Max 20 failed attempts/IP/hour, CAPTCHA after 3 failures
- **Audit trail**: Every use logged in shareCodes table (usedCount, lastUsedAt), IP address + timestamp, linked to worker (if creates record)

**REQ-QR-007: Common workflow pattern**
1. Validate share code (active, not expired, not over max uses)
2. Increment usage counter (`usedCount++`, update `lastUsedAt`)
3. Present workflow wizard (multi-step form)
4. Submit to backend (no auth required, code = access grant)
5. Show confirmation + next steps (optional continue to full app)

### Webhooks (REQ-WH)

**REQ-WH-001: Supported events (11 events)**
1. `incident.created` - New incident report - Payload: incidentNumber, title, severity, location, reportedBy (id, name, role), occurredAt, description, url
2. `incident.closed` - Incident closure - Payload: Resolution + corrective actions
3. `permit.approved` - Permit approval - Payload: Permit details + conditions
4. `permit.expired` - Permit expiration - Payload: Expiry notice
5. `permit.expiring_soon` - 24h before expiry - Payload: Warning
6. `cert.expiring_soon` - 7 days before expiry - Payload: Worker + cert details
7. `swms.signed` - All signatures collected - Payload: Signature summary
8. `checklist.failed` - Checklist below threshold - Payload: Failure details
9. `defect.created` - New defect - Payload: Defect details + severity
10. `action.overdue` - Action past due date - Payload: Action details
11. `schedule.updated` - Schedule change - Payload: Before/after comparison

**REQ-WH-002: webhooks table**
```typescript
webhooks: defineTable({
  orgId: v.id('orgs'),
  projectId: v.optional(v.id('projects')),
  url: v.string(),               // HTTPS required
  secret: v.string(),            // HMAC signing secret
  events: v.array(v.string()),   // Event type subscriptions
  active: v.boolean(),
  description: v.optional(v.string()),
  retryPolicy: v.object({
    maxRetries: v.number(),
    backoffMs: v.number(),
    maxBackoffMs: v.number()
  }),
  lastSuccessAt: v.optional(v.string()),
  lastFailureAt: v.optional(v.string()),
  failureCount: v.number(),
  createdAt: v.string()
})
  .index('by_org', ['orgId'])
  .index('by_project', ['projectId'])
  .index('by_active', ['active'])
```

**REQ-WH-003: webhookDeliveries table**
```typescript
webhookDeliveries: defineTable({
  webhookId: v.id('webhooks'),
  event: v.string(),
  attempt: v.number(),           // 1-5
  requestUrl: v.string(),
  requestBody: v.string(),       // JSON string
  requestHeaders: v.any(),
  responseStatus: v.optional(v.number()),
  responseBody: v.optional(v.string()),
  responseTime: v.optional(v.number()),  // ms
  success: v.boolean(),
  error: v.optional(v.string()),
  sentAt: v.string()
})
  .index('by_webhook', ['webhookId', 'sentAt'])
  .index('by_success', ['webhookId', 'success'])
```

**REQ-WH-004: Webhook payload format**
```typescript
{
  event: string,                 // Event type (e.g., 'incident.created')
  timestamp: string,             // ISO timestamp
  orgId: string,
  projectId?: string,
  data: any,                     // Event-specific payload
  metadata: {
    webhookId: string,
    deliveryId: string
  }
}
```

**REQ-WH-005: Webhook signing (HMAC SHA256)**
- Headers:
  - `X-Webhook-Signature`: HMAC SHA256 signature
  - `X-Webhook-Event`: Event type
  - `X-Webhook-Delivery`: Unique delivery ID
  - `X-Webhook-Timestamp`: ISO timestamp
- Signature: `HMAC_SHA256(secret, timestamp + '.' + JSON.stringify(payload))`
- Verification: Recipient verifies HMAC signature against secret

**REQ-WH-006: Retry policy**
- Exponential backoff: [0, 5s, 30s, 2min, 10min, 1hr]
- Max 6 retries
- Don't retry on 4xx (client error)
- Timeout: 10 seconds per attempt
- Failure threshold: 5 consecutive failures → pause, notify admin

**REQ-WH-007: Webhook management UI**
- Route: `/orgs/[orgId]/settings/webhooks`
- Actions: Create/edit, test delivery, view history, rotate secrets, disable/enable, delete

### Email (REQ-EMAIL) - Future Phase

**REQ-EMAIL-001: Email provider**
- Provider: Resend (recommended)
- Alternative: Postmark (better deliverability, more expensive)
- Template engine: React Email
- Cost: $20/month for 50k emails

**REQ-EMAIL-002: Email architecture**
1. Trigger Event → Check Preferences
2. Email Queue (emailQueue table)
3. Email Sender Action (Convex action)
4. Email Provider (Resend API)

**REQ-EMAIL-003: Email priorities**
- **Instant**: Critical alerts (incidents, safety issues)
- **Daily digest**: Batched non-urgent (certifications expiring, actions overdue)
- **Weekly digest**: Summary reports

**REQ-EMAIL-004: Email templates (7 templates)**
1. `incident-alert` - Critical incident notification
2. `cert-expiring` - Certification expiring soon
3. `action-overdue` - Action item overdue
4. `swms-ready` - SWMS ready to sign
5. `permit-approved` - Permit approved notification
6. `daily-digest` - Daily summary of notifications
7. `weekly-digest` - Weekly summary report

**REQ-EMAIL-004.1: Email template implementation**
Using React Email (https://react.email) for HTML email templates.

**Example: Incident Alert Template**
```typescript
// lib/email/templates/incident-alert.tsx
import { Html, Button, Container, Heading, Text, Section } from '@react-email/components';

interface IncidentAlertProps {
  incident: {
    incidentNumber: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: string;
    occurredAt: string;
    url: string;
  };
  project: {
    name: string;
  };
}

export function IncidentAlert({ incident, project }: IncidentAlertProps) {
  const severityColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#991b1b'
  }[incident.severity];

  return (
    <Html>
      <Container style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        <Heading style={{ color: '#111', fontSize: '24px' }}>
          New Incident Reported
        </Heading>

        <Text style={{ fontSize: '16px', color: '#666' }}>
          A new incident has been reported on <strong>{project.name}</strong>
        </Text>

        <Section style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          borderLeft: `4px solid ${severityColor}`
        }}>
          <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
            {incident.title}
          </Text>

          <Text style={{ margin: '5px 0' }}>
            <strong>Incident Number:</strong> {incident.incidentNumber}
          </Text>

          <Text style={{ margin: '5px 0' }}>
            <strong>Severity:</strong>
            <span style={{
              color: severityColor,
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {incident.severity}
            </span>
          </Text>

          <Text style={{ margin: '5px 0' }}>
            <strong>Location:</strong> {incident.location}
          </Text>

          <Text style={{ margin: '5px 0' }}>
            <strong>Occurred:</strong> {new Date(incident.occurredAt).toLocaleString()}
          </Text>
        </Section>

        <Button
          href={incident.url}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-block',
            marginTop: '20px'
          }}
        >
          View Full Incident Report
        </Button>

        <Text style={{ fontSize: '12px', color: '#999', marginTop: '40px' }}>
          You're receiving this because you have incident alerts enabled for this project.
          <br />
          <a href="{unsubscribeUrl}" style={{ color: '#2563eb' }}>Manage notification preferences</a>
        </Text>
      </Container>
    </Html>
  );
}
```

**Rendering in Convex Action:**
```typescript
// convex/actions/email.ts
import { render } from '@react-email/render';
import { IncidentAlert } from '@/lib/email/templates/incident-alert';

export const sendIncidentAlert = action({
  args: { incidentId: v.id('incidents'), recipientEmail: v.string() },
  handler: async (ctx, args) => {
    const incident = await ctx.runQuery(api.incidents.get, { id: args.incidentId });
    const project = await ctx.runQuery(api.projects.get, { id: incident.projectId });

    const html = render(
      <IncidentAlert incident={incident} project={project} />
    );

    await resend.emails.send({
      from: 'PRJ Construction <alerts@prjconstruction.app>',
      to: args.recipientEmail,
      subject: `Incident Alert: ${incident.title}`,
      html
    });
  }
});
```

**REQ-EMAIL-005: emailQueue table**
```typescript
emailQueue: defineTable({
  orgId: v.id('orgs'),
  projectId: v.optional(v.id('projects')),
  to: v.string(),                // Email address
  workerId: v.optional(v.id('workers')),
  template: v.string(),          // Template ID
  subject: v.string(),
  data: v.any(),                 // Template data
  priority: v.union(
    v.literal('instant'),
    v.literal('daily'),
    v.literal('weekly')
  ),
  scheduledFor: v.string(),      // ISO timestamp
  status: v.union(
    v.literal('pending'),
    v.literal('sending'),
    v.literal('sent'),
    v.literal('failed'),
    v.literal('bounced')
  ),
  attempts: v.number(),
  lastAttemptAt: v.optional(v.string()),
  providerMessageId: v.optional(v.string()),
  providerStatus: v.optional(v.string()),
  sentAt: v.optional(v.string()),
  openedAt: v.optional(v.string()),
  clickedAt: v.optional(v.string()),
  createdAt: v.string()
})
  .index('by_status', ['status', 'scheduledFor'])
  .index('by_worker', ['workerId'])
```

**REQ-EMAIL-006: Digest builder**
- Cron job: Daily at 8am
- Algorithm:
  1. Get workers with daily digest enabled
  2. Get yesterday's notifications for each worker
  3. Queue digest email with aggregated data

**REQ-EMAIL-007: Deliverability**
- SPF/DKIM/DMARC configured
- No inline JavaScript
- Unsubscribe link required
- Track opens/clicks via Resend webhooks

**REQ-EMAIL-008: Inbound Email Processing (Future Phase)**

**Planned Use Cases:**
1. **Email→Task**: Forward email to tasks@{projectCode}.prjconstruction.app → creates task
2. **Email→Incident**: Forward to incidents@{projectCode}.prjconstruction.app → creates incident report
3. **Email→Document**: Attachments auto-uploaded to project documents
4. **Reply→Comment**: Reply to notification email → adds comment to entity

**Architecture:**
```
External Email (user@example.com)
  ↓
Email Provider Inbound Webhook (Resend/Postmark)
  → POST to /api/webhooks/email/inbound
  ↓
Convex Action: parseInboundEmail()
  ├─► Extract: sender, subject, body, attachments
  ├─► Identify: project (from recipient address)
  ├─► Authenticate: sender must be project member
  └─► Route: based on recipient address
      ├─► tasks@{code}.prj.app → createTask()
      ├─► incidents@{code}.prj.app → createIncident()
      ├─► reply+{entityId}@prj.app → addComment()
      └─► Unknown → bounce with error
  ↓
Create Entity in Convex
  ├─► Parse email body (plain text → fields)
  ├─► Upload attachments to mediaFiles
  └─► Link to project
  ↓
Send Confirmation Email
  → "Task #123 created from your email"
```

**Email Parsing:**
```typescript
// convex/actions/email/inbound.ts
export const handleInbound = action({
  args: {
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.optional(v.string()),
    attachments: v.array(v.object({
      filename: v.string(),
      contentType: v.string(),
      content: v.string()  // Base64
    }))
  },
  handler: async (ctx, args) => {
    // Parse recipient: tasks@HB001.prjconstruction.app
    const match = args.to.match(/^(\w+)@([A-Z0-9]+)\.prjconstruction\.app$/);
    if (!match) {
      return { error: 'Invalid recipient address' };
    }

    const [_, entityType, projectCode] = match;

    // Find project
    const project = await ctx.runQuery(api.projects.getByCode, { code: projectCode });
    if (!project) {
      return { error: 'Project not found' };
    }

    // Authenticate sender
    const worker = await ctx.runQuery(api.workers.getByEmail, { email: args.from });
    if (!worker || !await isProjectMember(ctx, worker._id, project._id)) {
      return { error: 'Sender not authorized for this project' };
    }

    // Route to handler
    switch (entityType) {
      case 'tasks':
        return await createTaskFromEmail(ctx, { project, worker, email: args });
      case 'incidents':
        return await createIncidentFromEmail(ctx, { project, worker, email: args });
      default:
        return { error: 'Unknown entity type' };
    }
  }
});

async function createTaskFromEmail(ctx, { project, worker, email }) {
  // Parse email body for task fields
  const title = email.subject;
  const description = email.text;

  // Upload attachments
  const mediaFileIds = [];
  for (const att of email.attachments) {
    const buffer = Buffer.from(att.content, 'base64');
    const storageId = await ctx.storage.store(new Blob([buffer]));
    const mediaFile = await ctx.runMutation(api.files.create, {
      projectId: project._id,
      storageId,
      fileName: att.filename,
      mimeType: att.contentType
    });
    mediaFileIds.push(mediaFile);
  }

  // Create task
  const task = await ctx.runMutation(api.tasks.create, {
    projectId: project._id,
    title,
    description,
    createdBy: worker._id,
    attachments: mediaFileIds
  });

  // Send confirmation
  await ctx.runAction(api.email.send, {
    to: worker.email,
    template: 'task-created-from-email',
    data: { task, project }
  });

  return { success: true, taskId: task._id };
}
```

**Resend Inbound Setup:**
```typescript
// Resend domain configuration
Domain: prjconstruction.app
MX Record: mx.resend.com
Inbound Webhook: https://app.prjconstruction.app/api/webhooks/email/inbound

// Route configuration (Resend dashboard)
tasks@*.prjconstruction.app → Forward to webhook
incidents@*.prjconstruction.app → Forward to webhook
reply+*@prjconstruction.app → Forward to webhook
```

**Security Considerations:**
- ✅ Sender authentication: Must be project member
- ✅ SPF/DKIM verification: Prevent spoofing
- ✅ Rate limiting: Max 10 emails/sender/hour
- ✅ Attachment scanning: MIME type validation (no .exe, .sh)
- ✅ Size limits: Max 10MB total attachments per email
- ⚠️ Reply injection: Strip quoted text to prevent command injection

### External APIs (REQ-API) - Future Phase

**REQ-API-001: Supported integrations**
1. **Procore** - Project management sync - Priority: High - Protocol: REST + OAuth 2.0 - Rate limit: 3600 req/hr - Webhooks: Yes
2. **Xero** - Accounting/invoicing - Priority: High - Protocol: REST + OAuth 2.0 - Rate limit: 60 req/min - Webhooks: Yes
3. **PlanGrid** - Drawing management - Priority: Medium - Protocol: REST
4. **Google Maps** - Location services - Priority: Medium - Protocol: REST
5. **WeatherAPI** - Site conditions - Priority: Low - Protocol: REST - Rate limit: 1M req/month free - Webhooks: No
6. **Twilio** - SMS notifications - Priority: Low - Protocol: REST

**REQ-API-002: integrations table**
```typescript
integrations: defineTable({
  orgId: v.id('orgs'),
  projectId: v.optional(v.id('projects')),
  type: v.union(
    v.literal('procore'),
    v.literal('xero'),
    v.literal('plangrid'),
    v.literal('google_maps'),
    v.literal('weather'),
    v.literal('twilio')
  ),
  authType: v.union(
    v.literal('api_key'),
    v.literal('oauth'),
    v.literal('basic')
  ),
  credentials: v.any(),          // Encrypted
  active: v.boolean(),
  syncEnabled: v.boolean(),
  syncFrequency: v.optional(v.union(
    v.literal('realtime'),
    v.literal('hourly'),
    v.literal('daily')
  )),
  fieldMappings: v.optional(v.any()),
  lastSyncAt: v.optional(v.string()),
  lastSyncStatus: v.optional(v.string()),
  createdAt: v.string()
})
  .index('by_org', ['orgId'])
  .index('by_type', ['type'])
```

**REQ-API-003: integrationSyncLogs table**
```typescript
integrationSyncLogs: defineTable({
  integrationId: v.id('integrations'),
  direction: v.union(
    v.literal('inbound'),
    v.literal('outbound')
  ),
  entity: v.string(),            // Entity type (e.g., 'projects', 'tasks')
  operation: v.union(
    v.literal('create'),
    v.literal('update'),
    v.literal('delete')
  ),
  success: v.boolean(),
  recordsProcessed: v.number(),
  recordsFailed: v.number(),
  errors: v.optional(v.any()),
  startedAt: v.string(),
  completedAt: v.optional(v.string()),
  durationMs: v.optional(v.number())
})
  .index('by_integration', ['integrationId', 'startedAt'])
```

**REQ-API-004: Procore sync schedule**
- Projects: Daily
- Tasks: Hourly
- Documents: Realtime webhook
- Photos: Realtime webhook

**REQ-API-004.1: Procore sync implementation**

**Complete Sync Action:**
```typescript
// convex/actions/integrations/procore.ts
import { ProcoreClient } from '@/lib/integrations/procore';
import { action } from '@/convex/_generated/server';
import { v } from 'convex/values';

export const syncProjects = action({
  args: { integrationId: v.id('integrations') },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const integration = await ctx.runQuery(api.integrations.get, { id: args.integrationId });

    if (!integration || integration.type !== 'procore' || !integration.active) {
      throw new Error('Invalid integration');
    }

    try {
      // Initialize Procore API client
      const procore = new ProcoreClient({
        clientId: integration.credentials.clientId,
        clientSecret: integration.credentials.clientSecret,
        accessToken: integration.credentials.accessToken,
        refreshToken: integration.credentials.refreshToken
      });

      // Fetch projects from Procore
      const procoreProjects = await procore.listProjects();

      let created = 0;
      let updated = 0;
      let failed = 0;
      const errors = [];

      // Sync each project
      for (const pp of procoreProjects) {
        try {
          // Check if project exists (by external ID)
          const existing = await ctx.runQuery(api.projects.getByExternalId, {
            externalSystem: 'procore',
            externalId: pp.id.toString()
          });

          // Map Procore fields to PRJ fields
          const mappedData = {
            name: pp.name,
            code: pp.project_number || pp.display_name,
            address: pp.address,
            city: pp.city,
            state: pp.state_code,
            postcode: pp.zip,
            country: pp.country_code,
            startDate: pp.start_date,
            endDate: pp.completion_date,
            status: mapProcoreStatus(pp.active),
            metadata: {
              procore: {
                id: pp.id,
                company_id: pp.company.id,
                program_id: pp.program?.id,
                stage: pp.stage,
                project_type: pp.project_type,
                last_synced: new Date().toISOString()
              }
            }
          };

          if (existing) {
            // Update existing project
            await ctx.runMutation(api.projects.update, {
              id: existing._id,
              ...mappedData
            });
            updated++;
          } else {
            // Create new project
            await ctx.runMutation(api.projects.create, {
              orgId: integration.orgId,
              externalSystem: 'procore',
              externalId: pp.id.toString(),
              ...mappedData
            });
            created++;
          }
        } catch (error) {
          failed++;
          errors.push({
            procoreProjectId: pp.id,
            procoreProjectName: pp.name,
            error: error.message
          });
        }
      }

      const duration = Date.now() - startTime;

      // Log sync result
      await ctx.runMutation(api.integrations.logSync, {
        integrationId: args.integrationId,
        direction: 'inbound',
        entity: 'projects',
        operation: 'sync',
        success: failed === 0,
        recordsProcessed: procoreProjects.length,
        recordsFailed: failed,
        errors: errors.length > 0 ? errors : undefined,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: duration
      });

      // Update integration last sync time
      await ctx.runMutation(api.integrations.updateLastSync, {
        id: args.integrationId,
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: failed === 0 ? 'success' : 'partial_failure'
      });

      return {
        success: true,
        created,
        updated,
        failed,
        total: procoreProjects.length,
        durationMs: duration,
        errors
      };

    } catch (error) {
      // Log failed sync
      await ctx.runMutation(api.integrations.logSync, {
        integrationId: args.integrationId,
        direction: 'inbound',
        entity: 'projects',
        operation: 'sync',
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: [{ error: error.message, stack: error.stack }],
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime
      });

      throw error;
    }
  }
});

// Helper: Map Procore status to PRJ status
function mapProcoreStatus(procoreActive: boolean): string {
  return procoreActive ? 'active' : 'completed';
}

// OAuth Token Refresh (called automatically when access token expires)
export const refreshProcoreToken = action({
  args: { integrationId: v.id('integrations') },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.get, { id: args.integrationId });

    const procore = new ProcoreClient({
      clientId: integration.credentials.clientId,
      clientSecret: integration.credentials.clientSecret,
      refreshToken: integration.credentials.refreshToken
    });

    const newTokens = await procore.refreshAccessToken();

    // Update credentials
    await ctx.runMutation(api.integrations.updateCredentials, {
      id: args.integrationId,
      credentials: {
        ...integration.credentials,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token,
        expiresAt: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
      }
    });
  }
});
```

**Field Mapping Configuration:**
Store custom field mappings in `integrations.fieldMappings`:
```typescript
{
  integrationId: 'k17abc123',
  fieldMappings: {
    projects: {
      // Procore field → PRJ field
      'name': 'name',
      'project_number': 'code',
      'display_name': 'displayName',
      'address': 'address',
      'city': 'city',
      'state_code': 'state',
      'zip': 'postcode',
      'start_date': 'startDate',
      'completion_date': 'endDate',
      // Custom fields
      'custom_field_12345': 'metadata.contract_value',
      'custom_field_67890': 'metadata.client_pm'
    },
    tasks: {
      'title': 'title',
      'description': 'description',
      'due_date': 'dueDate',
      'assignee_id': 'assignedTo',  // Requires worker mapping
      'status': 'status'  // Requires status mapping
    }
  }
}
```

**Sync Schedule (Cron Jobs):**
```typescript
// convex/crons.ts
import { cronJobs } from 'convex/server';

const crons = cronJobs();

// Daily project sync (2am)
crons.daily(
  'sync-procore-projects',
  { hourUTC: 2, minuteUTC: 0 },
  api.integrations.syncAllProcore,
  { entity: 'projects' }
);

// Hourly task sync
crons.hourly(
  'sync-procore-tasks',
  { minuteUTC: 15 },
  api.integrations.syncAllProcore,
  { entity: 'tasks' }
);

export default crons;
```

**Rate Limit Handling:**
Procore API: 3600 requests/hour = 60 requests/minute

```typescript
// lib/integrations/procore.ts
export class ProcoreClient {
  private requestQueue: Promise<any>[] = [];
  private requestCount = 0;
  private windowStart = Date.now();

  async makeRequest(endpoint: string) {
    // Rate limit: 60 req/min
    if (this.requestCount >= 60) {
      const elapsed = Date.now() - this.windowStart;
      if (elapsed < 60000) {
        await sleep(60000 - elapsed);
        this.requestCount = 0;
        this.windowStart = Date.now();
      }
    }

    this.requestCount++;
    return fetch(`https://api.procore.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Procore-Company-Id': this.companyId
      }
    });
  }
}
```

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `mediaFiles` | `storageId`, `fileName`, `mimeType`, `kind`, `linkedEntityType`, `linkedEntityId` | Universal file storage pointer |
| `shareCodes` | `code`, `type`, `entityId`, `isActive`, `expiresAt`, `usedCount` | QR code access control |
| `webhooks` | `url`, `secret`, `events`, `retryPolicy`, `lastSuccessAt` | Webhook subscriptions |
| `webhookDeliveries` | `webhookId`, `event`, `attempt`, `success`, `sentAt` | Webhook delivery audit |
| `emailQueue` | `to`, `template`, `priority`, `status`, `scheduledFor` | Email delivery queue (future) |
| `integrations` | `type`, `authType`, `credentials`, `syncEnabled`, `lastSyncAt` | External API connections (future) |
| `integrationSyncLogs` | `integrationId`, `direction`, `entity`, `recordsProcessed` | API sync audit (future) |

## Workflows

### File Upload Workflow
1. **Client**: Request upload URL → `generateUploadUrl()` mutation
2. **Convex**: Return signed upload URL (expires 1 hour)
3. **Client**: Resize image (max 2048px), compress JPEG (85%), strip EXIF, generate thumbnail (256x256)
4. **Client**: POST file to signed URL → Convex Storage
5. **Convex Storage**: Return `storageId`
6. **Client**: Create mediaFiles record → `create({ storageId, fileName, ... })` mutation
7. **Convex**: Validate (project membership, file type, size), insert record, return `mediaFileId`

### PDF Generation Workflow
1. **User**: Request PDF export (SWMS, certificate, report)
2. **API Route**: `/api/pdf/generate` with `{ entityType, entityId, template? }`
3. **Convex Action**: Fetch entity data (enriched with related data)
4. **Puppeteer**: Render HTML template to PDF binary
5. **Convex Storage**: Upload PDF binary, return `storageId`
6. **Convex Mutation**: Create mediaFiles record with `storageId`
7. **Response**: Return `{ mediaFileId, url }` (signed URL for download)

### QR Code Workflow (Site Sign-In Example)
1. **Admin**: Generate QR code → Create shareCodes record (`type: 'signin'`, `entityId: projectId`)
2. **Admin**: Print QR poster (A4 PDF with QR + instructions)
3. **Worker**: Arrive at site, scan QR code with phone camera
4. **Browser**: Navigate to `/w/signin/{code}` (public route, no auth)
5. **Public Page**: Validate code (active, not expired), load project details + worker list
6. **Worker**: Select name from dropdown (or enter visitor details), tap "Sign In"
7. **Convex Mutation**: Increment `usedCount`, create `attendanceLogs` record, log activity
8. **Confirmation**: Show inline success message "Signed in at 7:42 AM"

### Webhook Delivery Workflow
1. **System Event**: Incident created → trigger `incident.created` event
2. **Convex Action**: Query webhooks subscribed to `incident.created`
3. **For Each Webhook**:
   - Build payload with event data
   - Generate HMAC signature with webhook secret
   - POST to webhook URL with headers (`X-Webhook-Signature`, `X-Webhook-Event`, `X-Webhook-Delivery`, `X-Webhook-Timestamp`)
   - Create webhookDeliveries record (attempt 1)
4. **If Success**: Update webhook `lastSuccessAt`, log delivery
5. **If Failure**: Retry with exponential backoff [0, 5s, 30s, 2min, 10min, 1hr], max 6 attempts, don't retry 4xx
6. **If All Retries Fail**: Update webhook `failureCount`, notify admin if threshold reached (5 failures)

### Email Digest Workflow (Future)
1. **Cron Job**: Daily at 8am → trigger digest builder
2. **Builder**:
   - Query workers with `emailEnabled: true`, `preferences.frequency: 'daily'`
   - For each worker: Query yesterday's unread notifications
   - If notifications exist: Queue email (`template: 'daily-digest'`, `priority: 'daily'`, `scheduledFor: now`)
3. **Email Sender Action**: Every 1 minute
   - Query emailQueue (`status: 'pending'`, `scheduledFor <= now`), order by priority
   - For each email: Render template with data, send via Resend API, update status
4. **Resend Webhooks**: Track opens/clicks, update emailQueue record

## Acceptance Criteria

### File Storage
- ✅ Upload images (jpg, png, gif, webp) ≤10MB
- ✅ Upload documents (pdf, doc, docx) ≤25MB
- ✅ Client-side image processing (resize, compress, strip EXIF, thumbnail)
- ✅ Signed URLs expire after 1 hour
- ✅ Access control: Project membership checked before URL generation
- ✅ Rate limiting: 10 uploads/minute per user
- ✅ File type validation: MIME type + extension check
- ✅ mediaFiles table with indexes: `by_project`, `by_org`, `by_kind`, `by_category`, `by_linked`

### PDF Generation
- ✅ Generate SWMS PDF with verification QR code
- ✅ Generate induction certificate PDF with 2 signature blocks
- ✅ PDF layout matches spec (header, sections, signatures, verification QR)
- ✅ Verification QR URL: `/verify/{entityType}/{entityId}/{hash}` with SHA256 hash
- ✅ Public verification page displays entity details, signatures, timestamp
- ✅ PDFs stored as mediaFiles with `kind: 'document'`
- ✅ PDF API: `generate()`, `preview()` functions

### QR Codes
- ✅ Generate 12-character URL-safe share codes (nanoid, 2^71 entropy)
- ✅ QR image generation (qrcode library, 256px, error correction M)
- ✅ QR poster PDF generation (A4, large QR, title, instructions, URL)
- ✅ shareCodes table with indexes: `by_code`, `by_entity`, `by_project`
- ✅ Public routes: `/w/signin/{code}`, `/w/swms/{code}`, `/w/induction/{code}`, `/w/prestart/{code}`, `/w/toolbox/{code}`, `/w/asset/{code}`, `/w/upload/{code}`, `/verify/{type}/{id}/{hash}`
- ✅ Validation: Active check, expiry check, max uses check, state gating
- ✅ Rate limiting: Max 5 submissions/code/hour, max 20 failed/IP/hour, CAPTCHA after 3 failures
- ✅ Audit trail: `usedCount`, `lastUsedAt` tracked in shareCodes table

### Webhooks
- ✅ webhooks table with HTTPS URL, secret, event subscriptions
- ✅ webhookDeliveries table for delivery audit
- ✅ HMAC SHA256 signature in `X-Webhook-Signature` header
- ✅ Retry policy: Exponential backoff [0, 5s, 30s, 2min, 10min, 1hr], max 6 attempts, don't retry 4xx
- ✅ Timeout: 10 seconds per attempt
- ✅ Failure threshold: 5 consecutive failures → pause, notify admin
- ✅ Webhook management UI: `/orgs/[orgId]/settings/webhooks` with create/edit/test/history/rotate/disable/delete
- ✅ Supported events: `incident.created`, `incident.closed`, `permit.approved`, `permit.expired`, `permit.expiring_soon`, `cert.expiring_soon`, `swms.signed`, `checklist.failed`, `defect.created`, `action.overdue`, `schedule.updated`

### Email (Future)
- ✅ emailQueue table with priority, status, scheduled delivery
- ✅ Resend integration configured (API key, SPF/DKIM/DMARC)
- ✅ Email templates: `incident-alert`, `cert-expiring`, `action-overdue`, `swms-ready`, `permit-approved`, `daily-digest`, `weekly-digest`
- ✅ Digest builder cron job: Daily at 8am
- ✅ Email sender action: Every 1 minute, process pending emails
- ✅ Deliverability: No inline JavaScript, unsubscribe link, track opens/clicks

### External APIs (Future)
- ✅ integrations table with OAuth credentials (encrypted)
- ✅ integrationSyncLogs table for sync audit
- ✅ Procore integration: Projects (daily), Tasks (hourly), Documents/Photos (realtime webhooks)
- ✅ Xero integration: Invoices, expenses, payments
- ✅ OAuth 2.0 flow for Procore and Xero
- ✅ Field mapping configuration UI

## Dependencies

### Technology Stack
- **File Storage**: Convex Storage (primary), S3/Cloudflare R2 (future, files >20MB)
- **PDF Generation**: Puppeteer (server-side), React-PDF (client-side preview)
- **QR Codes**: `nanoid` (code generation), `qrcode` (image generation)
- **Webhooks**: Custom implementation (Convex actions)
- **Email**: Resend (future), React Email (templates)
- **External APIs**: REST clients (axios), OAuth 2.0 libraries

### Build Order
1. **Week 1**: File storage (foundation)
   - Implement mediaFiles table + indexes
   - Implement `generateUploadUrl()`, `create()`, `get()`, `list()`, `delete()` mutations
   - Implement client-side image processing (resize, compress, strip EXIF, thumbnail)
   - Implement signed URL generation + access control
2. **Week 1**: QR code generation
   - Implement shareCodes table + indexes
   - Implement `generateShareCode()` utility (nanoid)
   - Implement `generateQrCode()` utility (qrcode library)
   - Implement QR poster PDF generation
3. **Week 2-3**: PDF generation
   - Implement PDF template registry (8 templates)
   - Implement Puppeteer rendering pipeline
   - Implement SWMS PDF layout (header, sections, signatures, verification QR)
   - Implement induction certificate PDF layout
   - Implement verification QR code generation (SHA256 hash)
   - Implement public verification page (`/verify/{type}/{id}/{hash}`)
4. **Week 4**: Webhooks
   - Implement webhooks table + indexes
   - Implement webhookDeliveries table + indexes
   - Implement webhook signing (HMAC SHA256)
   - Implement retry policy (exponential backoff)
   - Implement webhook management UI
   - Test 11 event triggers
5. **Week 5+**: Email (future phase)
   - Implement emailQueue table + indexes
   - Implement Resend integration
   - Implement 7 email templates (React Email)
   - Implement digest builder cron job
   - Implement email sender action
6. **Later**: External APIs (future phase)
   - Implement integrations table + indexes
   - Implement OAuth 2.0 flows (Procore, Xero)
   - Implement sync schedules (daily, hourly, realtime)
   - Implement field mapping UI

### Open Questions
1. **External storage threshold**: Files >20MB → S3 or Cloudflare R2?
2. **PDF generation performance**: Puppeteer overhead acceptable? Consider PDFKit for simple templates?
3. **QR code collision handling**: What happens if nanoid collision (1 in 2^71)? Retry logic?
4. **Webhook failure handling**: After 5 consecutive failures, auto-disable or require manual re-enable?
5. **Email deliverability**: Resend vs Postmark vs SendGrid? Cost/performance tradeoffs?
6. **Procore sync frequency**: Hourly tasks sync = 3600/60 = 60 req/hr, within rate limit (3600 req/hr)?
