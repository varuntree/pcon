# Site Documents

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)

## Purpose
Manage project and org documents, drawings, photos, and folders. Supports hierarchical organization, versioning, annotations, public upload links, and entity linking. AI reads files directly via MCP tools (multimodal).

## Scope

### In Scope
- Document metadata management (title, tags, folders, versioning)
- Document upload (< 20MB Convex, > 20MB external storage)
- Hierarchical folder structure (project + org scoped)
- Drawings with specialized metadata (sheet numbers, disciplines, revisions)
- PDF annotations (rectangles, circles, arrows, text, freehand)
- Entity linking (documents linked to defects, SWMS, incidents, etc.)
- Document versioning (new version creates new record, preserves old)
- Org library pattern (org-level docs linked to projects via linkedFromOrgDocId)
- Public upload links with share codes (subcontractor doc submission)
- Photo management (categorization: site, progress, safety, quality)
- Media file storage abstraction (Convex storage or external URL)
- Temporary signed URLs (1 hour expiry)

### Out of Scope
- Email integration (future)
- Video/audio playback (storage only)
- Real-time collaborative editing (future)
- Automated document approval workflows (manual review only)
- Integration with external document management systems (SharePoint, Dropbox)
- Content-based search (search by metadata only)

## Requirements

### Documents
- REQ-001: Support org-scoped and project-scoped documents
- REQ-002: Org-level documents can be linked (not copied) to projects via linkedFromOrgDocId
- REQ-003: Document upload accepts PDF, Word, Excel, images (< 20MB → Convex, > 20MB → external)
- REQ-004: Document metadata includes: title, docType, tags, folderId, version, previousVersionId
- REQ-005: Auto-generate version numbers on new version creation
- REQ-006: Preserve previous versions (previousVersionId references)
- REQ-007: Search documents by title, tags, docType, filename
- REQ-008: Filter documents by folder
- REQ-009: Public upload links with share codes (12-char alphanumeric, optional expiry, usage tracking)
- REQ-010: Upload link deactivation (isActive flag)
- REQ-011: Document tagging (array of strings)
- REQ-012: Document type categorization (docType field: drawing, contract, specification, report, other)
- REQ-013: Link documents to entities polymorphically (documentEntityLinks: sourceType + sourceId)

### Drawings
- REQ-014: Drawings must be PDF files (MIME type validated on creation/promotion)
- REQ-015: Drawing metadata: sheetNumber, revision, discipline, scale, drawnBy, drawnDate, status
- REQ-016: Drawing disciplines: architectural (A), structural (S), electrical (E), mechanical (M), plumbing (P), civil (C), fire (F), other (X)
- REQ-017: Drawing status workflow: draft -> for_review -> current -> superseded
- REQ-018: Drawing status values: current (active set), superseded (replaced), for_review (pending approval), draft (WIP)
- REQ-019: Promote generic document to drawing (convert PDF, add drawing metadata, validate MIME type)
- REQ-020: PDF annotation support via annotationData embedded in sourceDocuments
- REQ-021: Annotation tools: rectangle, circle, arrow, text label, freehand drawing, color picker, stroke width, delete
- REQ-022: Separate drawings dashboard UI
- REQ-023: Drawing statistics (total count, by discipline, by status)

### Folders
- REQ-024: Hierarchical folder structure (parentFolderId for nesting)
- REQ-025: Folders can be org-scoped or project-scoped
- REQ-026: Folder CRUD operations: create, update, delete, list, get
- REQ-027: Folder navigation (breadcrumb trail)
- REQ-028: Move documents between folders (update folderId)

### Media Files
- REQ-029: Media file metadata: fileName, fileType (MIME), fileSize, storageId (Convex), externalUrl (external), kind, category
- REQ-030: Kind values: document, image, video, audio, other
- REQ-031: Category values: site, progress, safety, quality, other
- REQ-032: Entity linking (polymorphic: linkedEntityType + linkedEntityId)
- REQ-033: Photo timestamp (takenAt) for timeline views
- REQ-034: Storage provider abstraction: storageProvider ('convex' | 'external')
- REQ-035: Convex storage signed URLs expire after 1 hour (regenerated on query)
- REQ-036: External URLs permanent
- REQ-037: Photo gallery views (grid, filtered by category/date)
- REQ-038: Caption and tagging for photos
- REQ-039: Search photos by category, date range

### Public Upload Links
- REQ-040: Generate share codes (12-char alphanumeric via nanoid)
- REQ-041: Upload link fields: shareCode, label, description, folderId (target folder), isActive, expiresAt, createdBy
- REQ-042: Public route: `/w/upload/[shareCode]` (no auth required)
- REQ-043: Validate share code: active, not expired, not over max uses (optional)
- REQ-044: Upload flow: validate code -> file upload -> store in target folder -> confirmation
- REQ-045: Deactivation (isActive flag toggle)
- REQ-046: Usage tracking (usageCount, lastUsedAt)
- REQ-047: Max uses limit (optional maxUses field)

### Photo Gallery
- REQ-048: Photo gallery grid view with category filtering
- REQ-049: Photo timeline view sorted by takenAt timestamp
- REQ-050: Batch photo upload (multiple files, single request)
- REQ-051: Photo compression on upload (resize to max 2048px width, 85% quality)
- REQ-052: EXIF metadata extraction (timestamp, geolocation, camera model)

### Drawing Export
- REQ-053: Export drawing with annotations as flattened PDF
- REQ-054: Annotation layer toggle (show/hide during export)
- REQ-055: Annotation color preservation in export
- REQ-056: Export includes metadata footer (sheet number, revision, exported date)

### Storage Validation
- REQ-057: File size validation on upload (reject > 20MB for Convex)
- REQ-058: MIME type whitelist (PDF, Word, Excel, images only)
- REQ-059: Virus scan integration for uploaded files (future)
- REQ-060: Automatic cleanup of orphaned mediaFiles (no references after 30 days)

### AI Document Access
- REQ-061: AI reads documents directly via Claude MCP tools (multimodal)
- REQ-062: Supported formats: PDF, images, Word, Excel (via MCP file read)
- REQ-063: No preprocessing required - Claude reads raw files
- REQ-064: Link documents to entities via documentEntityLinks (polymorphic: entityTable + entityId)
- REQ-065: Link types: source (doc is source of truth), evidence (doc provides evidence), definition (doc defines requirements), note (doc adds context)

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| sourceDocuments | projectId?, orgId?, mediaFileId, docType, title, folderId, version, previousVersionId, linkedFromOrgDocId?, uploadLinkId?, annotationData (embedded), sheetNumber?, revision?, discipline?, scale?, drawnBy?, drawnDate?, status? | Document metadata. Optional projectId/orgId for dual scope. Embedded annotationData. Drawing-specific fields when docType='drawing'. |
| documentEntityLinks | documentId, entityTable, entityId, linkType (source\|evidence\|definition\|note) | Link documents to entities (polymorphic). |
| documentFolders | orgId?, projectId?, name, parentFolderId? | Hierarchical document organization (org or project scoped). |
| documentUploadLinks | projectId, folderId?, shareCode (12-char), label, description, isActive, expiresAt?, usageCount?, lastUsedAt?, maxUses?, createdBy | Public upload links for subcontractor docs (QR code access). Includes usage tracking. |
| mediaFiles | orgId?, projectId?, storageProvider ('convex'\|'external'), storageId?, externalUrl?, fileName, mimeType, sizeBytes, kind?, category?, caption?, takenAt?, linkedEntityType?, linkedEntityId? | Universal file storage pointer (photos, PDFs, attachments). kind: document/image/video/audio/other. category: site/progress/safety/quality/other. |

## Workflows

### Document Upload (Standard)
1. User selects file (< 20MB)
2. Request upload URL (Convex mutation: generateUploadUrl)
3. Upload file to Convex Storage (POST to signed URL)
4. Receive storageId
5. Create mediaFiles record (name, type, size, storageId)
6. Create sourceDocuments record (title, mediaFileId, projectId/orgId, folderId)
7. Return documentId

### Document Upload (Public Link)
1. External user accesses `/w/upload/[shareCode]`
2. Validate share code (active, not expired, not over max uses)
3. User selects file
4. Upload to Convex Storage
5. Create mediaFiles record (uploadedBy = external user)
6. Create sourceDocuments record (uploadLinkId, target folderId from link config)
7. Increment usage counter (usageCount)
8. Confirmation screen

### Document Versioning
1. User selects "New Version" on existing document
2. Upload new file (same workflow as standard upload)
3. Create new sourceDocuments record:
   - Same title, tags, folderId
   - Increment version number
   - Set previousVersionId = old document ID
4. Return new documentId

### Drawing Promotion
1. User selects PDF document (docType = generic)
2. Validate MIME type = application/pdf
3. Open drawing metadata form (sheetNumber, revision, discipline, scale, drawnBy, drawnDate, status)
4. Update sourceDocuments:
   - Set docType = 'drawing'
   - Add drawing metadata fields
5. Move to drawings dashboard

### Document Search
1. User enters search query
2. Search sourceDocuments by title, tags, docType
3. Search mediaFiles by fileName
4. Return matching documents sorted by relevance (exact match > partial match)

### PDF Annotation
1. User opens PDF document
2. Load annotationData from sourceDocuments (embedded JSON)
3. Render PDF with pdfjs-dist
4. Overlay annotation canvas
5. User draws annotations (rectangle, circle, arrow, text, freehand)
6. Serialize annotations to JSON
7. Update sourceDocuments.annotationData (embedded field)
8. Return success

### Entity Linking
1. User viewing document (e.g., specification PDF)
2. User clicks "Link to Entity"
3. Select entity type (defect, SWMS, incident, etc.)
4. Select entity from list (or create new)
5. Create documentEntityLinks record:
   - documentId, entityTable, entityId, linkType
6. Bidirectional navigation enabled (entity -> doc, doc -> entity)

### Drawing Export with Annotations
1. User opens drawing with annotations
2. User clicks "Export with Annotations"
3. System loads:
   - Original PDF from mediaFiles (via storageId)
   - Annotation data from sourceDocuments.annotationData
4. Render PDF to canvas
5. Overlay annotation SVG/canvas elements
6. Flatten to single canvas
7. Export as new PDF blob
8. Trigger browser download
9. Return success confirmation


### AI Document Reading
1. AI agent needs to read document content
2. Agent retrieves mediaFile storageId/URL from sourceDocuments
3. Agent uses Claude MCP tools to read file directly (multimodal)
4. Claude processes PDF/image/document natively
5. Agent receives content and can respond to user queries

## Acceptance Criteria

### Documents
- AC-001: User can upload document to project folder (< 20MB → Convex)
- AC-002: User can upload document to org library (org-scoped)
- AC-003: User can link org library doc to project (linkedFromOrgDocId)
- AC-004: User can create new version (auto-increments version, preserves previousVersionId)
- AC-005: User can view version history (list all versions via previousVersionId chain)
- AC-006: User can search documents by title, tags, docType, filename
- AC-007: User can filter documents by folder
- AC-008: User can tag documents (add/remove tags array)
- AC-009: User can promote PDF document to drawing (validate MIME, add metadata)

### Drawings
- AC-010: User can create drawing with metadata (sheetNumber, revision, discipline, scale, drawnBy, drawnDate, status)
- AC-011: User can filter drawings by discipline (A, S, E, M, P, C, F, X)
- AC-012: User can filter drawings by status (draft, for_review, current, superseded)
- AC-013: User can update drawing status workflow (draft → for_review → current → superseded)
- AC-014: User can annotate PDF drawings (rectangle, circle, arrow, text, freehand)
- AC-015: User can delete annotations
- AC-016: User can export drawing with annotations (PDF with overlays)
- AC-017: System prevents promoting non-PDF documents to drawings (MIME type validation)

### Folders
- AC-018: User can create folder (project or org scoped)
- AC-019: User can nest folders (parentFolderId)
- AC-020: User can move documents between folders (update folderId)
- AC-021: User can delete folder (must be empty or cascade delete)
- AC-022: User can navigate folder hierarchy (breadcrumb trail)

### Media Files
- AC-023: User can upload photo (< 10MB, JPEG/PNG/GIF/WebP)
- AC-024: User can categorize photo (site, progress, safety, quality)
- AC-025: User can caption photo
- AC-026: User can view photo gallery (grid, filtered by category/date)
- AC-027: User can download media file (signed URL, 1 hour expiry)
- AC-028: System tracks photo timestamp (takenAt) for timeline
- AC-029: System links media file to entity (polymorphic: linkedEntityType + linkedEntityId)

### Public Upload Links
- AC-030: User can generate public upload link (shareCode, label, description, target folderId)
- AC-031: User can set upload link expiry (expiresAt)
- AC-032: User can set max uses (maxUses)
- AC-033: External user can access `/w/upload/[shareCode]` (no auth)
- AC-034: External user can upload document via share code
- AC-035: System validates share code (active, not expired, not over max uses)
- AC-036: System increments usage counter (usageCount)
- AC-037: User can deactivate upload link (isActive = false)
- AC-038: User can view upload link usage history (usageCount, lastUsedAt)

### Entity Linking
- AC-039: User can link document to defect (documentEntityLinks)
- AC-040: User can link document to SWMS (documentEntityLinks)
- AC-041: User can link document to incident (documentEntityLinks)
- AC-042: User can specify link type (source, evidence, definition, note)
- AC-043: User can view linked entities from document detail screen
- AC-044: User can view linked documents from entity detail screen (bidirectional)

### Photo Management
- AC-045: User can upload multiple photos in batch (grid selection)
- AC-046: System extracts EXIF timestamp and populates takenAt field
- AC-047: System compresses photos on upload (max 2048px, 85% quality)
- AC-048: User can filter photo gallery by category dropdown
- AC-049: User can view photo timeline (vertical list, grouped by date)

### Drawing Export
- AC-050: User can export drawing with annotations as PDF
- AC-051: Exported PDF preserves annotation colors and strokes
- AC-052: User can toggle annotation visibility before export
- AC-053: Exported PDF includes metadata footer

### Storage Management
- AC-054: System rejects files > 20MB for Convex storage
- AC-055: System validates MIME type against whitelist
- AC-056: User receives clear error for rejected file types
- AC-057: Convex signed URLs regenerated on each document access (1hr expiry)

### AI Document Access
- AC-058: AI can read PDF documents via MCP tools
- AC-059: AI can read images via MCP tools (multimodal)
- AC-060: AI can analyze document content when user requests

## Dependencies

### Backend
- Convex database (sourceDocuments, documentEntityLinks, documentFolders, documentUploadLinks, mediaFiles tables)
- Convex storage (file storage < 20MB, signed URLs)
- Convex mutations: generateUploadUrl, createDocument, createVersion, promoteToDrawing, createFolder, generateUploadLink
- Convex queries: listDocuments, getDocument, listFolders, listByProject, listByFolder, searchByMetadata

### AI/ML
- Claude MCP tools (direct file reading - multimodal)
- pdfjs-dist library (PDF rendering for annotation UI)

### External
- External storage (S3/Cloudflare R2 for files > 20MB, future)
- QR code generation (nanoid library for share codes)

### Frontend
- ShadCN UI components (file upload, folder tree, PDF viewer, annotation canvas)
- Public routes: `app/(public)/w/upload/[shareCode]/page.tsx`
- Document management components: `components/documents/` (document-list, document-detail, folder-tree, drawing-dashboard, annotation-editor)
- Media components: `components/shared/` (photo-gallery, file-upload)

### Integrations
- Document versioning (tracks previousVersionId chain)
- Entity linking (polymorphic documentEntityLinks)
- Drawing annotations (embedded annotationData field)
- Public upload links (QR code workflows)
