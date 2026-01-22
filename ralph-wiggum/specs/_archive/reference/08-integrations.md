# 08-integrations.md

> External integrations: PDF, QR, webhooks, file storage, email

---

## 1. Purpose & Scope

### What This Covers
- **File Storage** - Convex storage for all uploads
- **PDF Generation** - Compliance document export
- **QR Code Generation** - Physical-digital bridge
- **Webhooks** - Outbound event notifications
- **Email Integration** - Notification delivery (future)
- **External APIs** - Third-party integrations (future)

### What This Does NOT Cover
- Internal data flow (see 02-architecture.md)
- Business logic (see 03-domain-model.md)
- AI integrations (see 05-ai-system.md)

---

## 2. Overview

PRJ Construction integrates with external systems to enable:

1. **Document generation** - PDF export for compliance/printing
2. **Physical-digital bridging** - QR codes connect sites/assets to digital records
3. **Event-driven notifications** - Webhooks notify external systems
4. **File management** - Centralized storage via Convex
5. **Email delivery** - Notification distribution (planned)

**Design Principle:** Integrations are modular, with fallbacks for failures. System remains functional if integrations unavailable.

---

## 3. Core Concepts

### Concept 1: Centralized File Storage
All uploads (photos, documents, PDFs, signatures) stored in Convex Storage with unified API. No external S3/blob storage unless file > 20MB.

### Concept 2: PDF as Compliance Artifact
PDFs generated server-side for signed SWMS, certificates, reports. Stored as mediaFiles for audit trail.

### Concept 3: QR as Public Gateway
QR codes provide no-auth access to workflows (inductions, sign-in, SWMS signing). Share codes are unguessable, time-limited, state-gated.

### Concept 4: Webhooks as Event Bus
System events (incident created, permit expired, cert expiring) trigger outbound webhooks to external systems (project management, accounting, alert systems).

### Concept 5: Email as Notification Channel
Email extends notification system beyond in-app. Batched digests for non-urgent, instant for critical.

---

## 4. Detailed Specification

### 4.1 File Storage (Convex)

#### Overview
Convex Storage is primary file repository. Time-limited signed URLs for retrieval.

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FILE UPLOAD FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client                                                     │
│    │                                                        │
│    │ 1. Request upload URL                                 │
│    ├────────────────────────────────────────────────►      │
│    │                                                   Convex│
│    │ 2. Return signed upload URL                      Mutation│
│    ◄────────────────────────────────────────────────┤      │
│    │                                                        │
│    │ 3. POST file directly to Convex Storage              │
│    ├──────────────────────────────────────────►           │
│    │                                          Convex Storage│
│    │ 4. Return storageId                                   │
│    ◄──────────────────────────────────────────┤           │
│    │                                                        │
│    │ 5. Create mediaFiles record                           │
│    ├────────────────────────────────────────────────►      │
│    │    { storageId, fileName, projectId }           Convex│
│    │                                               Mutation │
│    │ 6. Return mediaFileId                                 │
│    ◄────────────────────────────────────────────────┤      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     FILE RETRIEVAL FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client                                                     │
│    │                                                        │
│    │ 1. Query entity (includes mediaFileId)                │
│    ├────────────────────────────────────────────────►      │
│    │                                                   Convex│
│    │                                                   Query │
│    │ 2. Resolve storageId → signed URL                     │
│    │    (ctx.storage.getUrl)                               │
│    │                                                        │
│    │ 3. Return entity + URL                                │
│    ◄────────────────────────────────────────────────┤      │
│    │    { mediaFile: { url: "https://..." } }              │
│    │                                                        │
│    │ 4. Fetch file from signed URL                         │
│    ├──────────────────────────────────────────►           │
│    │                                          Convex Storage│
│    │ 5. Return file bytes                                  │
│    ◄──────────────────────────────────────────┤           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Schema

**mediaFiles** table
```typescript
{
  // Ownership
  orgId?: Id<'orgs'>
  projectId?: Id<'projects'>

  // Storage
  storageProvider: 'convex' | 'external'
  storageId?: Id<'_storage'>           // Convex storage reference
  externalUrl?: string                  // Direct URL if external
  externalKey?: string                  // S3-style key if external

  // Metadata
  fileName: string
  mimeType?: string                     // e.g., 'image/jpeg'
  sizeBytes?: number
  kind: 'document' | 'image' | 'video' | 'audio' | 'other'
  category?: 'site' | 'progress' | 'safety' | 'quality' | 'other'
  caption?: string                      // Photo caption
  takenAt?: string                      // Photo timestamp

  // Linking (optional)
  linkedEntityType?: string             // Polymorphic link
  linkedEntityId?: string

  // Extension
  metadata?: any
}

Indexes:
  - by_project: [projectId]
  - by_org: [orgId]
  - by_kind: [projectId, kind]
  - by_category: [projectId, category]
  - by_linked: [linkedEntityType, linkedEntityId]
```

#### API Functions

**Core Functions** (`convex/files.ts`)
```typescript
generateUploadUrl()
  → Returns Convex upload URL (1-hour expiry)
  → Client uploads directly to URL

create({
  orgId?, projectId?,
  storageId,
  fileName, mimeType?, sizeBytes?,
  kind, category?, caption?,
  linkedEntityType?, linkedEntityId?
})
  → Creates mediaFiles record
  → Returns mediaFileId

get(id: Id<'mediaFiles'>)
  → Returns mediaFile with resolved URL
  → URL generated fresh each query (1-hour expiry)

list({ projectId?, orgId?, kind?, category?, limit? })
  → Lists files with filters
  → Returns files with resolved URLs

delete(id: Id<'mediaFiles'>)
  → Deletes mediaFile record
  → Deletes from Convex storage
```

**Helper Functions** (`convex/lib/media.ts`)
```typescript
resolveMediaFileUrl(ctx, mediaFile)
  → Handles both Convex + external storage
  → Returns null if storage unavailable

createFromUpload(ctx, {
  storageId, fileName, projectId, orgId,
  kind, category?, caption?
})
  → Convenience wrapper for create()
```

#### File Types & Limits

| Type | Extensions | Max Size | Storage |
|------|------------|----------|---------|
| Images | jpg, png, gif, webp | 10MB | Convex |
| Documents | pdf, doc, docx | 25MB | Convex |
| Spreadsheets | xls, xlsx, csv | 10MB | Convex |
| CAD | dwg, dxf | 50MB | External (future) |
| Videos | mp4, mov | 100MB | External (future) |

**Size Strategy:**
- Files ≤ 20MB → Convex Storage
- Files > 20MB → External storage (S3/Cloudflare R2)
- Signature PNGs → Always Convex (typically 5-20KB)
- Thumbnails → Generated client-side, stored as separate file

#### Image Processing

**Client-side (before upload):**
- Resize large images (max 2048px dimension)
- Compress JPEG quality to 85%
- Strip EXIF data (except orientation)
- Generate thumbnails (256x256) as separate file

**Server-side:**
- No processing currently
- Future: Generate thumbnails on-demand
- Future: EXIF orientation correction

#### Security

**Access Control:**
- Signed URLs expire after 1 hour
- No direct storage access from client
- Project membership checked before URL generation
- Public share code flows bypass membership (by design)

**Upload Limits:**
- Rate limiting: 10 uploads/minute per user
- Malware scanning: Not implemented (future)
- File type validation: MIME type + extension check

---

### 4.2 PDF Generation

#### Overview
Server-side PDF generation for compliance documents. Uses React components to define PDF structure, renders to binary PDF.

#### Use Cases

| Document Type | Trigger | Content | Signatures |
|---------------|---------|---------|------------|
| SWMS Export | User action | Full SWMS with all sections | All signatures |
| Induction Certificate | Completion | Worker details, date, verifier | Worker + verifier |
| Checklist Report | Completion | Responses, photos, pass/fail | Conductor signature |
| Incident Report | Closure | Full incident details, corrective actions | Investigator + closer |
| Prestart Report | Submission | Equipment checks, defects found | Operator signature |
| Toolbox Attendance | Meeting close | Topic, attendees, signatures | All attendees |
| Permit Application | Approval | Permit details, conditions, approvals | Applicant + approver |
| Project Report | Scheduled | Summary of activity, KPIs | PM signature |

#### Technology Options

**Option A: Puppeteer (HTML → PDF)**
- **Pros:** Full CSS support, easy debugging (view HTML first)
- **Cons:** Heavyweight (Chrome headless), slower
- **Use for:** Complex layouts, multi-page reports

**Option B: PDFKit (Programmatic)**
- **Pros:** Lightweight, fast, precise control
- **Cons:** Manual layout calculations, no CSS
- **Use for:** Simple forms, certificates

**Option C: React-PDF**
- **Pros:** React-like components, good balance
- **Cons:** Limited CSS subset, client-side only (current)
- **Use for:** Current implementation (SWMS)

**Recommendation:** Migrate to **Puppeteer** for server-side generation. Keep React-PDF for client-side preview.

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  PDF GENERATION FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client                                                     │
│    │                                                        │
│    │ 1. Request PDF (entityType, entityId, template)       │
│    ├────────────────────────────────────────────────►      │
│    │                                                   Convex│
│    │                                                  Action │
│    │ 2. Fetch entity data (enriched)                       │
│    │    ├─► Get entity                                     │
│    │    ├─► Get related records                            │
│    │    ├─► Get signatures                                 │
│    │    ├─► Get photos (with URLs)                         │
│    │    └─► Build template data                            │
│    │                                                        │
│    │ 3. Render PDF                                         │
│    │    ├─► Load template                                  │
│    │    ├─► Populate with data                             │
│    │    ├─► Generate PDF binary                            │
│    │    └─► Return buffer                                  │
│    │                                                        │
│    │ 4. Store in Convex Storage                            │
│    │    ├─► Upload PDF buffer                              │
│    │    ├─► Create mediaFiles record                       │
│    │    └─► Link to entity                                 │
│    │                                                        │
│    │ 5. Return URL                                         │
│    ◄────────────────────────────────────────────────┤      │
│    │    { pdfUrl: "https://...", mediaFileId }             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Template Structure

**Template Registry** (`lib/pdf/templates.ts`)
```typescript
type PdfTemplate = {
  id: string
  name: string
  documentType: 'swms' | 'certificate' | 'report' | 'permit'
  fetchData: (ctx, entityId) => Promise<TemplateData>
  render: (data: TemplateData) => Promise<Buffer>
  options: {
    format: 'A4' | 'Letter'
    orientation: 'portrait' | 'landscape'
    margin: { top: string, right: string, bottom: string, left: string }
    header?: (data) => string  // HTML
    footer?: (data) => string  // HTML
  }
}

const TEMPLATES: Record<string, PdfTemplate> = {
  'swms-signed': { ... },
  'induction-certificate': { ... },
  'checklist-report': { ... },
  ...
}
```

#### SWMS PDF Layout

```
┌─────────────────────────────────────────────────────────────┐
│                   SAFE WORK METHOD STATEMENT                │
│                                                             │
│  [Company Logo]                    Document: SWMS-001-HB    │
│  Project: Harbor Bridge            Version: 1.2             │
│  Date: 2026-01-15                  Status: APPROVED         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WORK ACTIVITY                                              │
│  Concrete pouring for pier foundation                       │
│                                                             │
│  LOCATION                                                   │
│  Pier 3, South Approach                                     │
│                                                             │
│  DURATION                                                   │
│  Start: 2026-01-20  End: 2026-01-22                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ORGANIZATION DETAILS                                       │
│                                                             │
│  Principal Contractor: Harbor Construction Ltd              │
│  ABN: 12 345 678 901                                        │
│  Supervisor: John Smith (License: 123456)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RISK ASSESSMENT MATRIX                                     │
│                                                             │
│         Consequence                                         │
│         ├────┬────┬────┬────┬────┐                         │
│  L   5  │ M  │ H  │ H  │ E  │ E  │                         │
│  i   4  │ M  │ M  │ H  │ H  │ E  │                         │
│  k   3  │ L  │ M  │ M  │ H  │ H  │                         │
│  e   2  │ L  │ L  │ M  │ M  │ H  │                         │
│  l   1  │ L  │ L  │ L  │ M  │ M  │                         │
│      └────┴────┴────┴────┴────┘                            │
│         1    2    3    4    5                               │
│                                                             │
│  L=Low  M=Medium  H=High  E=Extreme                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  HAZARDS & CONTROLS                                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Hazard: Falls from height                            │  │
│  │ Risk Level: HIGH                                     │  │
│  │─────────────────────────────────────────────────────│  │
│  │ Controls:                                            │  │
│  │ • Edge protection barriers installed                │  │
│  │ • Fall arrest harnesses required                    │  │
│  │ • Daily inspections of scaffolding                  │  │
│  │ Control Type: Elimination + PPE                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Hazard: Chemical exposure (concrete additives)       │  │
│  │ Risk Level: MEDIUM                                   │  │
│  │─────────────────────────────────────────────────────│  │
│  │ Controls:                                            │  │
│  │ • Gloves + eye protection mandatory                 │  │
│  │ • SDS available on-site                             │  │
│  │ • Eyewash station at mix location                   │  │
│  │ Control Type: PPE + Administrative                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [Additional hazards...]                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  REQUIRED PPE                                               │
│                                                             │
│  ☑ Hard hat        ☑ Safety boots    ☑ High-vis vest       │
│  ☑ Safety glasses  ☑ Gloves          ☐ Hearing protection  │
│  ☑ Fall arrest     ☐ Respirator      ☐ Face shield         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  HIGH RISK CONSTRUCTION WORK                                │
│                                                             │
│  ☑ Work at heights (scaffolding > 2m)                       │
│  ☐ Confined spaces                                          │
│  ☑ Demolition                                               │
│  ☐ Excavation near services                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  EMERGENCY CONTACTS                                         │
│                                                             │
│  Emergency: 000                                             │
│  First Aid Officer: Jane Doe - 0412 345 678                 │
│  Site Supervisor: John Smith - 0423 456 789                 │
│  Hospital: St. Mary's - 123 Main St                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  SIGNATURES                                                 │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ [Signature Image]       │  │ [Signature Image]       │  │
│  │ John Smith              │  │ Jane Doe                │  │
│  │ Site Supervisor         │  │ Safety Officer          │  │
│  │ 2026-01-15 08:30        │  │ 2026-01-15 08:35        │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ [Signature Image]       │  │ [Signature Image]       │  │
│  │ Bob Worker              │  │ Alice Contractor        │  │
│  │ Operator                │  │ External                │  │
│  │ 2026-01-15 14:20        │  │ 2026-01-15 14:22        │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Document generated: 2026-01-21 10:45                       │
│  Verification QR:                                           │
│  ┌─────────┐                                                │
│  │  █▀▀█  │  Scan to verify authenticity                   │
│  │  ▀▀▀▀  │  prjconstruction.app/verify/SWMS-001-HB        │
│  └─────────┘                                                │
│                                                             │
│  Page 1 of 3                                                │
└─────────────────────────────────────────────────────────────┘
```

#### Induction Certificate Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           CERTIFICATE OF SITE INDUCTION                     │
│                                                             │
│         [Company Logo]                                      │
│                                                             │
│  This certifies that                                        │
│                                                             │
│         John Worker                                         │
│                                                             │
│  has successfully completed the site induction for          │
│                                                             │
│         Harbor Bridge Construction Project                  │
│                                                             │
│  Induction Date: 15 January 2026                            │
│  Certificate Number: IND-2026-001234                        │
│  Valid Until: 15 January 2027                               │
│                                                             │
│  Topics Covered:                                            │
│  • Site safety rules and emergency procedures               │
│  • PPE requirements and usage                               │
│  • Environmental management                                 │
│  • Quality standards                                        │
│  • Hazard reporting                                         │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │ [Signature Image]       │  │ [Signature Image]       │  │
│  │ John Worker             │  │ Jane Supervisor         │  │
│  │ Worker                  │  │ Site Supervisor         │  │
│  │ 2026-01-15              │  │ 2026-01-15              │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────┐                                                │
│  │  █▀▀█  │  Scan to verify                                │
│  │  ▀▀▀▀  │  prjconstruction.app/verify/IND-2026-001234    │
│  └─────────┘                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### API Functions

**PDF Service** (`convex/actions/pdf.ts`)
```typescript
generate({
  entityType: 'swms' | 'induction' | 'checklist' | 'incident' | ...,
  entityId: Id<'...'>
  template?: string,                    // Optional override
  options?: {
    includePhotos?: boolean,
    includeComments?: boolean,
    watermark?: string
  }
})
  → Fetches entity data
  → Renders PDF using template
  → Stores in Convex storage
  → Returns { pdfUrl, mediaFileId }

preview({
  entityType, entityId, template?
})
  → Same as generate but returns base64 for preview
  → Not stored permanently
```

**Usage Example**
```typescript
// Generate SWMS PDF
const result = await ctx.runAction(api.pdf.generate, {
  entityType: 'swms',
  entityId: swmsId,
  template: 'swms-signed',
  options: { includePhotos: true }
});

// Link to SWMS record
await ctx.db.patch(swmsId, {
  pdfMediaFileId: result.mediaFileId
});
```

#### Verification QR Codes

Every PDF includes verification QR code:
- URL: `/verify/{entityType}/{entityId}/{hash}`
- Hash: SHA256 of (entityId + signatures + timestamp)
- Public verification page shows: entity details, signatures, generation timestamp

---

### 4.3 QR Code Generation

#### Overview
QR codes bridge physical→digital. Workers scan codes at sites/assets to access workflows without authentication.

#### QR Code Types

| Type | URL Pattern | Purpose | Expiry |
|------|-------------|---------|--------|
| **Site Sign-In** | `/w/signin/{code}` | Worker/visitor site attendance | None |
| **SWMS Signing** | `/w/swms/{code}` | Sign SWMS before work | Optional |
| **Induction** | `/w/induction/{code}` | Complete site induction | Optional |
| **Prestart** | `/w/prestart/{code}` | Submit equipment prestart | None |
| **Toolbox** | `/w/toolbox/{code}` | Mark toolbox attendance | Meeting start |
| **Asset Access** | `/w/asset/{code}` | View asset info + submit checklist | None |
| **Document Upload** | `/w/upload/{code}` | Upload docs (subcontractor) | Optional |
| **Verification** | `/verify/{type}/{id}/{hash}` | Verify document authenticity | None |

#### Code Generation

**Library:** `nanoid` for collision-resistant codes

**Strategy:**
```typescript
// lib/share-codes.ts
import { nanoid } from 'nanoid';

export function generateShareCode(): string {
  // 12-character URL-safe code
  // Alphabet: A-Za-z0-9_-
  // Entropy: ~71 bits (collision probability negligible)
  return nanoid(12);
}

// Example codes: 'Uakgb_J5m9g-', 'V1StGXR8_Z5j'
```

#### Share Code Storage

**Option A: Embedded in Entity (Simple)**
```typescript
// For entities with 1:1 QR relationship
{
  shareCode: v.string(),
  shareCodeActive: v.boolean(),
  shareCodeExpiresAt: v.optional(v.string())
}
.index('by_shareCode', ['shareCode'])
```

**Option B: Dedicated Table (Flexible)**
```typescript
// For complex access control
shareCodes: {
  code: v.string(),
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
  entityId: v.string(),
  projectId: v.id('projects'),
  orgId?: v.id('orgs'),
  createdBy: v.id('workers'),

  // Access control
  isActive: v.boolean(),
  expiresAt: v.optional(v.string()),
  maxUses: v.optional(v.number()),       // Single-use or N-use
  usedCount: v.number(),

  // Audit
  lastUsedAt: v.optional(v.string()),
  createdAt: v.string()
}
.index('by_code', ['code'])
.index('by_entity', ['entityId'])
.index('by_project', ['projectId', 'type'])
```

**Recommendation:** Use Option B (dedicated table) for all QR codes in rebuild. Provides:
- Centralized audit trail
- Flexible access control
- Analytics (usage tracking)
- Easy deactivation

#### QR Image Generation

**Library:** `qrcode` (v1.5.4)

```typescript
// lib/qr.ts
import QRCode from 'qrcode';

export async function generateQrCode(
  url: string,
  options?: {
    size?: number,
    margin?: number,
    color?: { dark: string, light: string }
  }
): Promise<string> {
  return QRCode.toDataURL(url, {
    width: options?.size || 256,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#ffffff'
    },
    errorCorrectionLevel: 'M'  // Medium (15% damage recovery)
  });
}

// Returns: "data:image/png;base64,iVBORw0KGgo..."
```

**QR Poster Generation:**
- A4 PDF with:
  - Large QR code (center)
  - Title (e.g., "Site Sign-In")
  - Instructions (e.g., "Scan to record attendance")
  - URL (fallback for manual entry)
  - Project branding
- Designed for printing + laminating

#### Public Routes

**Route Structure:** `app/(public)/w/`

```typescript
// app/(public)/w/signin/[code]/page.tsx
export default async function SignInPage({ params }) {
  const shareCode = await convex.query(api.shareCodes.getByCode, {
    code: params.code
  });

  if (!shareCode || !shareCode.isActive) {
    return <InvalidCodePage />;
  }

  if (shareCode.expiresAt && new Date(shareCode.expiresAt) < new Date()) {
    return <ExpiredCodePage />;
  }

  return <SignInWizard projectId={shareCode.projectId} />;
}
```

**Common Pattern:** All public flows
1. Validate share code (active, not expired, not over max uses)
2. Increment usage counter
3. Present workflow wizard (multi-step form)
4. Submit to backend (no auth required)
5. Show confirmation + next steps

#### Security Considerations

**Unguessable Codes:**
- 12 characters base64url = 2^71 combinations
- Brute force infeasible (12^62 guesses)
- No sequential patterns

**Access Control:**
- `isActive` flag - instant deactivation
- `expiresAt` - automatic expiry
- `maxUses` - single-use or limited
- State gating - e.g., SWMS must be approved before signing

**Rate Limiting:**
- Max 5 submissions/code/hour (prevent spam)
- Max 20 failed attempts/IP/hour
- CAPTCHA after 3 failures

**Audit Trail:**
- Every use logged in shareCodes table
- IP address + timestamp
- Linked to worker (if creates record)

---

### 4.4 Webhooks (Outbound)

#### Overview
System events trigger HTTP POST to external URLs. Enables integration with project management, accounting, alert systems.

#### Supported Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `incident.created` | New incident report | Full incident details |
| `incident.closed` | Incident closure | Resolution + corrective actions |
| `permit.approved` | Permit approval | Permit details + conditions |
| `permit.expired` | Permit expiration | Expiry notice |
| `permit.expiring_soon` | 24h before expiry | Warning |
| `cert.expiring_soon` | 7 days before expiry | Worker + cert details |
| `swms.signed` | All signatures collected | Signature summary |
| `checklist.failed` | Checklist below threshold | Failure details |
| `defect.created` | New defect | Defect details + severity |
| `action.overdue` | Action past due date | Action details |
| `schedule.updated` | Schedule change | Before/after comparison |

#### Webhook Configuration

**webhooks** table
```typescript
{
  orgId: v.id('orgs'),
  projectId?: v.id('projects'),          // Optional: project-specific

  // Endpoint
  url: v.string(),                        // HTTPS required
  secret: v.string(),                     // HMAC signing secret

  // Events
  events: v.array(v.string()),            // Event types to send

  // Control
  active: v.boolean(),
  description: v.optional(v.string()),

  // Retry policy
  retryPolicy: v.object({
    maxRetries: v.number(),
    backoffMs: v.number(),               // Initial backoff
    maxBackoffMs: v.number()
  }),

  // Stats
  lastSuccessAt: v.optional(v.string()),
  lastFailureAt: v.optional(v.string()),
  failureCount: v.number(),

  createdAt: v.string()
}
.index('by_org', ['orgId'])
.index('by_project', ['projectId'])
.index('by_active', ['active'])
```

**webhookDeliveries** table (audit trail)
```typescript
{
  webhookId: v.id('webhooks'),
  event: v.string(),
  attempt: v.number(),                    // 1-5

  // Request
  requestUrl: v.string(),
  requestBody: v.string(),                // JSON payload
  requestHeaders: v.any(),

  // Response
  responseStatus: v.optional(v.number()),
  responseBody: v.optional(v.string()),
  responseTime: v.optional(v.number()),   // Milliseconds

  // Outcome
  success: v.boolean(),
  error: v.optional(v.string()),

  sentAt: v.string()
}
.index('by_webhook', ['webhookId', 'sentAt'])
.index('by_success', ['webhookId', 'success'])
```

#### Webhook Payload Format

**Standard Envelope:**
```json
{
  "event": "incident.created",
  "timestamp": "2026-01-21T10:45:00.000Z",
  "orgId": "k17abc123",
  "projectId": "k17def456",
  "data": {
    // Event-specific payload
  },
  "metadata": {
    "webhookId": "k17ghi789",
    "deliveryAttempt": 1
  }
}
```

**Example: incident.created**
```json
{
  "event": "incident.created",
  "timestamp": "2026-01-21T10:45:00.000Z",
  "orgId": "k17abc123",
  "projectId": "k17def456",
  "data": {
    "incident": {
      "id": "k17xyz123",
      "incidentNumber": "INC-2026-001",
      "title": "Near miss - falling object",
      "severity": "medium",
      "location": "Block C, Level 3",
      "reportedBy": {
        "id": "k17worker1",
        "name": "John Smith",
        "role": "Site Supervisor"
      },
      "occurredAt": "2026-01-21T09:30:00.000Z",
      "description": "Unsecured tool fell from scaffold...",
      "url": "https://app.prjconstruction.app/projects/k17def456/incidents/k17xyz123"
    }
  }
}
```

#### Webhook Delivery

**Signing:**
```typescript
// Generate signature
const signature = createHmac('sha256', webhook.secret)
  .update(JSON.stringify(payload))
  .digest('hex');

// Include in headers
headers: {
  'Content-Type': 'application/json',
  'X-Webhook-Signature': signature,
  'X-Webhook-Event': event,
  'X-Webhook-Delivery': deliveryId,
  'X-Webhook-Timestamp': timestamp
}
```

**Verification (recipient):**
```typescript
// Verify signature
const expectedSignature = createHmac('sha256', secret)
  .update(requestBody)
  .digest('hex');

if (expectedSignature !== receivedSignature) {
  throw new Error('Invalid signature');
}
```

**Retry Policy:**
```typescript
const retrySchedule = [
  0,          // Immediate
  5_000,      // 5 seconds
  30_000,     // 30 seconds
  120_000,    // 2 minutes
  600_000,    // 10 minutes
  3600_000    // 1 hour
];

// Exponential backoff with max
function getNextRetryDelay(attempt: number): number {
  if (attempt >= retrySchedule.length) {
    return null;  // Max retries exceeded
  }
  return retrySchedule[attempt];
}
```

**Delivery Action** (`convex/actions/webhooks.ts`)
```typescript
export const deliver = action({
  args: {
    webhookId: v.id('webhooks'),
    event: v.string(),
    payload: v.any()
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.runQuery(api.webhooks.get, {
      id: args.webhookId
    });

    if (!webhook.active) return;

    // Sign payload
    const signature = sign(webhook.secret, args.payload);

    // Send
    let attempt = 0;
    while (attempt < webhook.retryPolicy.maxRetries) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': args.event,
            'X-Webhook-Timestamp': new Date().toISOString()
          },
          body: JSON.stringify(args.payload),
          signal: AbortSignal.timeout(10000)  // 10s timeout
        });

        // Log delivery
        await ctx.runMutation(api.webhooks.logDelivery, {
          webhookId: args.webhookId,
          event: args.event,
          attempt: attempt + 1,
          success: response.ok,
          status: response.status,
          response: await response.text()
        });

        if (response.ok) {
          return;  // Success
        }

        // Retry on 5xx
        if (response.status >= 500) {
          attempt++;
          await sleep(getNextRetryDelay(attempt));
          continue;
        }

        // Don't retry on 4xx
        return;

      } catch (error) {
        await ctx.runMutation(api.webhooks.logDelivery, {
          webhookId: args.webhookId,
          event: args.event,
          attempt: attempt + 1,
          success: false,
          error: error.message
        });

        attempt++;
        if (attempt < webhook.retryPolicy.maxRetries) {
          await sleep(getNextRetryDelay(attempt));
        }
      }
    }

    // Mark webhook as failing if 5+ consecutive failures
    await ctx.runMutation(api.webhooks.incrementFailureCount, {
      webhookId: args.webhookId
    });
  }
});
```

#### Webhook Management UI

**Admin screen:** `/orgs/[orgId]/settings/webhooks`

Features:
- Create/edit webhooks
- Test delivery (sends test event)
- View delivery history (success rate, recent attempts)
- Rotate secrets
- Disable/enable webhooks
- Delete webhooks

---

### 4.5 Email Integration (Future)

#### Overview
Email extends notification system beyond in-app. Batched digests for non-urgent, instant for critical.

#### Planned Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EMAIL ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger Event                                              │
│    │ (incident, cert expiry, etc)                           │
│    │                                                        │
│    ▼                                                        │
│  Check Notification Preferences                             │
│    │ (email enabled? frequency?)                            │
│    │                                                        │
│    ├─► Instant                                              │
│    │     └─► Queue for immediate send                       │
│    │                                                        │
│    ├─► Daily Digest                                         │
│    │     └─► Add to digest queue (cron sends at 8am)        │
│    │                                                        │
│    └─► Weekly Digest                                        │
│          └─► Add to digest queue (cron sends Monday 8am)    │
│                                                             │
│  Email Queue                                                │
│    │ (Convex table: emailQueue)                             │
│    │                                                        │
│    ▼                                                        │
│  Email Sender Action                                        │
│    │ (Convex action)                                        │
│    │                                                        │
│    ├─► Render template (React Email)                       │
│    ├─► Send via provider (Resend)                          │
│    └─► Log delivery                                        │
│                                                             │
│  Email Provider (Resend)                                    │
│    │                                                        │
│    ├─► Sends email                                         │
│    ├─► Tracks delivery                                     │
│    └─► Webhook for bounces/opens                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Email Provider

**Recommendation: Resend**
- Simple API
- React Email templates
- Built-in analytics
- Affordable ($20/month for 50k emails)
- Good deliverability

**Alternative: Postmark**
- Better deliverability for transactional
- More expensive
- No React Email support

#### Schema

**emailQueue** table
```typescript
{
  orgId: v.id('orgs'),
  projectId?: v.id('projects'),

  // Recipient
  to: v.string(),                        // Email address
  workerId?: v.id('workers'),

  // Content
  template: v.string(),                  // Template ID
  subject: v.string(),
  data: v.any(),                         // Template variables

  // Delivery
  priority: v.union(
    v.literal('instant'),
    v.literal('daily'),
    v.literal('weekly')
  ),
  scheduledFor: v.string(),              // When to send

  // Status
  status: v.union(
    v.literal('pending'),
    v.literal('sending'),
    v.literal('sent'),
    v.literal('failed'),
    v.literal('bounced')
  ),
  attempts: v.number(),
  lastAttemptAt: v.optional(v.string()),

  // Provider
  providerMessageId: v.optional(v.string()),
  providerStatus: v.optional(v.string()),

  // Tracking
  sentAt: v.optional(v.string()),
  openedAt: v.optional(v.string()),
  clickedAt: v.optional(v.string()),

  createdAt: v.string()
}
.index('by_status', ['status', 'scheduledFor'])
.index('by_worker', ['workerId'])
```

#### Email Templates

**Using React Email** (https://react.email)

```typescript
// lib/email/templates/incident-alert.tsx
import { Html, Button, Container, Text } from '@react-email/components';

export function IncidentAlert({ incident, project }) {
  return (
    <Html>
      <Container>
        <Text>New incident reported on {project.name}</Text>
        <Text>
          <strong>{incident.title}</strong>
        </Text>
        <Text>Severity: {incident.severity}</Text>
        <Text>Location: {incident.location}</Text>
        <Button href={`https://app.prjconstruction.app/projects/${project.id}/incidents/${incident.id}`}>
          View Incident
        </Button>
      </Container>
    </Html>
  );
}
```

**Template Registry:**
- `incident-alert` - New incident notification
- `cert-expiring` - Certificate expiring warning
- `action-overdue` - Action past due
- `swms-ready` - SWMS ready for signing
- `permit-approved` - Permit approved
- `daily-digest` - Summary of day's activity
- `weekly-digest` - Summary of week's activity

#### Sending Email

**Action** (`convex/actions/email.ts`)
```typescript
export const send = action({
  args: {
    to: v.string(),
    template: v.string(),
    data: v.any(),
    priority: v.union(v.literal('instant'), v.literal('daily'), v.literal('weekly'))
  },
  handler: async (ctx, args) => {
    // Check preferences
    const worker = await ctx.runQuery(api.workers.getByEmail, { email: args.to });
    if (!worker) return;

    const prefs = await ctx.runQuery(api.notifications.getPreferences, {
      userId: worker._id
    });

    if (!prefs.email) return;  // Email disabled

    // Queue for delivery
    await ctx.runMutation(api.email.queue, {
      to: args.to,
      workerId: worker._id,
      template: args.template,
      data: args.data,
      priority: args.priority,
      scheduledFor: args.priority === 'instant'
        ? new Date().toISOString()
        : getNextDigestTime(args.priority)
    });
  }
});
```

**Digest Builder** (Cron job - daily at 8am)
```typescript
export const buildDailyDigest = internalMutation({
  handler: async (ctx) => {
    // Get all workers with daily digest enabled
    const workers = await ctx.db.query('workers')
      .filter(q => q.eq(q.field('notificationPreferences.emailFrequency'), 'daily'))
      .collect();

    for (const worker of workers) {
      // Get yesterday's notifications
      const notifications = await ctx.db.query('notifications')
        .withIndex('by_user_read', q => q.eq('userId', worker.email))
        .filter(q => q.gte(q.field('createdAt'), yesterday()))
        .collect();

      if (notifications.length === 0) continue;

      // Queue digest email
      await ctx.db.insert('emailQueue', {
        to: worker.email,
        workerId: worker._id,
        template: 'daily-digest',
        data: { notifications, worker },
        priority: 'daily',
        scheduledFor: new Date().toISOString(),
        status: 'pending'
      });
    }
  }
});
```

#### Inbound Email (Future)

**Planned Use Cases:**
- Email → Task creation
- Email → Incident report
- Email → Document upload
- Reply to notification → Add comment

**Architecture:**
```
External Email
  ↓
Email Provider (Inbound Webhook)
  ↓
Convex Action (Parse email)
  ↓
Create Entity
  ↓
Send Confirmation Email
```

---

### 4.6 External API Integrations (Future)

#### Overview
Planned integrations with external project management, accounting, and data systems.

#### Planned Integrations

| Integration | Purpose | Priority | API Type |
|-------------|---------|----------|----------|
| **Procore** | Project management sync | High | REST |
| **Xero** | Accounting/invoicing | High | REST + OAuth |
| **PlanGrid** | Drawing management | Medium | REST |
| **Google Maps** | Location services | Medium | REST |
| **WeatherAPI** | Site conditions | Low | REST |
| **Twilio** | SMS notifications | Low | REST |

#### Integration Pattern

**integrations** table
```typescript
{
  orgId: v.id('orgs'),
  projectId?: v.id('projects'),

  type: v.union(
    v.literal('procore'),
    v.literal('xero'),
    v.literal('plangrid'),
    v.literal('google_maps'),
    v.literal('weather'),
    v.literal('twilio')
  ),

  // Auth
  authType: v.union(
    v.literal('api_key'),
    v.literal('oauth'),
    v.literal('basic')
  ),
  credentials: v.any(),                  // Encrypted

  // Config
  active: v.boolean(),
  syncEnabled: v.boolean(),
  syncFrequency: v.optional(v.union(
    v.literal('realtime'),
    v.literal('hourly'),
    v.literal('daily')
  )),

  // Sync mapping
  fieldMappings: v.optional(v.any()),    // Map PRJ fields → external fields

  // Stats
  lastSyncAt: v.optional(v.string()),
  lastSyncStatus: v.optional(v.string()),

  createdAt: v.string()
}
.index('by_org', ['orgId'])
.index('by_type', ['type'])
```

**integrationSyncLogs** table
```typescript
{
  integrationId: v.id('integrations'),

  direction: v.union(v.literal('inbound'), v.literal('outbound')),
  entity: v.string(),                    // Entity type synced
  operation: v.union(
    v.literal('create'),
    v.literal('update'),
    v.literal('delete')
  ),

  // Result
  success: v.boolean(),
  recordsProcessed: v.number(),
  recordsFailed: v.number(),
  errors: v.optional(v.array(v.any())),

  startedAt: v.string(),
  completedAt: v.optional(v.string()),
  durationMs: v.optional(v.number())
}
.index('by_integration', ['integrationId', 'startedAt'])
```

#### Example: Procore Sync

**Sync Schedule:**
- Projects: Daily
- Tasks: Hourly
- Documents: Realtime (webhook)
- Photos: Realtime (webhook)

**Sync Action** (`convex/actions/integrations/procore.ts`)
```typescript
export const syncProjects = action({
  args: { integrationId: v.id('integrations') },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(api.integrations.get, {
      id: args.integrationId
    });

    // Create API client
    const procore = new ProcoreClient(integration.credentials);

    // Fetch projects from Procore
    const procoreProjects = await procore.listProjects();

    // Sync to PRJ Construction
    for (const pp of procoreProjects) {
      const existing = await ctx.runQuery(api.projects.getByExternalId, {
        externalSystem: 'procore',
        externalId: pp.id
      });

      if (existing) {
        // Update
        await ctx.runMutation(api.projects.update, {
          id: existing._id,
          name: pp.name,
          status: mapProcoreStatus(pp.status),
          metadata: {
            ...existing.metadata,
            procore: pp
          }
        });
      } else {
        // Create
        await ctx.runMutation(api.projects.create, {
          orgId: integration.orgId,
          name: pp.name,
          externalSystem: 'procore',
          externalId: pp.id,
          metadata: { procore: pp }
        });
      }
    }

    // Log sync
    await ctx.runMutation(api.integrations.logSync, {
      integrationId: args.integrationId,
      direction: 'inbound',
      entity: 'projects',
      success: true,
      recordsProcessed: procoreProjects.length
    });
  }
});
```

---

## 5. Relationships & Dependencies

### Depends On
- **02-architecture.md** - System structure
- **04-schema.md** - Storage tables (mediaFiles, shareCodes, webhooks)
- **03-domain-model.md** - Entity relationships

### Feeds Into
- **Implementation** - All integration code
- **Third-party docs** - Procore, Xero, etc.
- **Mobile workers** - QR flows

---

## 6. Implementation Notes

### Build Order
1. **File storage** (foundation) - Week 1
2. **QR code generation** - Week 1
3. **PDF generation** - Week 2-3
4. **Webhooks** - Week 4
5. **Email** (future phase) - Week 5+

### Technology Decisions

**File Storage:** Convex Storage
- ✅ Built-in, no additional service
- ✅ Time-limited URLs (secure)
- ✅ CDN for fast delivery
- ❌ 20MB limit per file
- **Mitigation:** External storage (S3) for large files

**PDF Generation:** Puppeteer
- ✅ Full HTML/CSS support
- ✅ Easy debugging
- ✅ Server-side rendering
- ❌ Heavyweight (Chrome)
- **Mitigation:** Keep React-PDF for client-side preview

**QR Codes:** qrcode library
- ✅ Simple, fast
- ✅ No external service
- ❌ No analytics
- **Mitigation:** Centralized shareCodes table for tracking

**Webhooks:** Custom implementation
- ✅ Full control
- ✅ No external service cost
- ❌ Must handle retries, logging
- **Mitigation:** Convex actions handle async delivery

**Email:** Resend
- ✅ Simple API
- ✅ React Email templates
- ✅ Built-in analytics
- ❌ Cost scales with volume
- **Mitigation:** Batch non-urgent emails

### Security Considerations

**File Storage:**
- Signed URLs expire after 1 hour
- Project membership checked before URL generation
- Public flows bypass membership (by design)

**QR/Share Codes:**
- 12-character base64url (2^71 combinations)
- Brute force infeasible
- Rate limiting: 5 submissions/code/hour
- CAPTCHA after 3 failures

**Webhooks:**
- HMAC signature verification
- Replay attack prevention (timestamp check)
- TLS required for endpoint

**Email:**
- SPF, DKIM, DMARC configured
- No inline JavaScript (security risk)
- Unsubscribe link required

---

## 7. Open Questions

### PDF Generation
- **Q:** Client-side (React-PDF) or server-side (Puppeteer)?
- **A:** Server-side for final PDFs, client-side for preview

### Email Delivery
- **Q:** Resend or Postmark?
- **A:** Resend (simpler, React Email support)

### File Storage
- **Q:** When to use external storage vs Convex?
- **A:** Files > 20MB → external. Otherwise Convex.

### Webhook Retries
- **Q:** How many retries before disabling webhook?
- **A:** 5 consecutive failures → pause, notify admin

### QR Code Expiry
- **Q:** Default expiry for share codes?
- **A:** No default. Entity-specific (e.g., SWMS never expires, upload link 7 days)

---

## Appendix

### A. PDF Template Library

**Complete Template List:**

| Template ID | Document Type | Pages | Signatures | Photos |
|-------------|---------------|-------|------------|--------|
| `swms-signed` | SWMS | 2-5 | Multiple | No |
| `induction-certificate` | Certificate | 1 | 2 | No |
| `checklist-report` | Report | 2-10 | 1 | Yes |
| `incident-report` | Report | 3-8 | 2 | Yes |
| `prestart-report` | Report | 2-3 | 1 | Yes |
| `toolbox-attendance` | Attendance | 1-2 | Multiple | No |
| `permit-application` | Permit | 2-4 | 2 | Optional |
| `defect-report` | Report | 2-5 | 1 | Yes |
| `action-summary` | Summary | 1-2 | 0 | Optional |
| `project-report` | Report | 5-20 | 1 | Yes |

### B. Webhook Payload Examples

**incident.created**
```json
{
  "event": "incident.created",
  "timestamp": "2026-01-21T10:45:00.000Z",
  "orgId": "k17abc123",
  "projectId": "k17def456",
  "data": {
    "incident": {
      "id": "k17xyz123",
      "incidentNumber": "INC-2026-001",
      "title": "Near miss - falling object",
      "severity": "medium",
      "location": "Block C, Level 3",
      "reportedBy": {
        "id": "k17worker1",
        "name": "John Smith"
      },
      "occurredAt": "2026-01-21T09:30:00.000Z",
      "url": "https://app.prjconstruction.app/..."
    }
  }
}
```

**cert.expiring_soon**
```json
{
  "event": "cert.expiring_soon",
  "timestamp": "2026-01-21T08:00:00.000Z",
  "orgId": "k17abc123",
  "data": {
    "certification": {
      "id": "k17cert1",
      "worker": {
        "id": "k17worker2",
        "name": "Alice Worker"
      },
      "type": "White Card",
      "expiresAt": "2026-01-28T00:00:00.000Z",
      "daysRemaining": 7
    }
  }
}
```

**swms.signed**
```json
{
  "event": "swms.signed",
  "timestamp": "2026-01-21T14:30:00.000Z",
  "orgId": "k17abc123",
  "projectId": "k17def456",
  "data": {
    "swms": {
      "id": "k17swms1",
      "documentNumber": "SWMS-001-HB",
      "title": "Concrete pouring",
      "signatureCount": 4,
      "signatures": [
        {
          "workerId": "k17worker1",
          "name": "John Smith",
          "role": "Site Supervisor",
          "signedAt": "2026-01-21T14:25:00.000Z"
        },
        ...
      ],
      "pdfUrl": "https://storage.prjconstruction.app/..."
    }
  }
}
```

### C. File Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│               FILE UPLOAD PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Client Validation                                       │
│     ├─► Check file type (MIME + extension)                 │
│     ├─► Check file size (< limit)                          │
│     └─► Show preview                                       │
│                                                             │
│  2. Client Processing (images only)                         │
│     ├─► Resize if > 2048px                                 │
│     ├─► Compress JPEG (85% quality)                        │
│     ├─► Strip EXIF (keep orientation)                      │
│     └─► Generate thumbnail (256x256)                       │
│                                                             │
│  3. Request Upload URL                                      │
│     ├─► Call: generateUploadUrl()                          │
│     └─► Receive: signed URL (1hr expiry)                   │
│                                                             │
│  4. Upload to Convex Storage                                │
│     ├─► POST file to signed URL                            │
│     ├─► Content-Type header                                │
│     └─► Receive: storageId                                 │
│                                                             │
│  5. Create Media Record                                     │
│     ├─► Call: files.create()                               │
│     ├─► Link to entity (optional)                          │
│     └─► Receive: mediaFileId                               │
│                                                             │
│  6. Update Entity (if linked)                               │
│     ├─► Add mediaFileId to entity                          │
│     └─► Or: Create bridge table record                     │
│                                                             │
│  7. Display Confirmation                                    │
│     └─► Show uploaded file in UI                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### D. Third-Party API Documentation

**Procore API:**
- Docs: https://developers.procore.com/
- Auth: OAuth 2.0
- Rate Limit: 3600 requests/hour
- Webhook Support: Yes

**Xero API:**
- Docs: https://developer.xero.com/
- Auth: OAuth 2.0
- Rate Limit: 60 requests/minute
- Webhook Support: Yes

**Resend (Email):**
- Docs: https://resend.com/docs
- Auth: API Key
- Rate Limit: 50 emails/second
- Webhook Support: Yes (delivery, bounce, open, click)

**WeatherAPI:**
- Docs: https://www.weatherapi.com/docs/
- Auth: API Key
- Rate Limit: 1M requests/month (free tier)
- Webhook Support: No

---

**END OF INTEGRATIONS SPECIFICATION**
