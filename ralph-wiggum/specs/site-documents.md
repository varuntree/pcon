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
Manage project and org documents, drawings, photos, and folders with AI-powered chunking for semantic search (RAG). Supports hierarchical organization, versioning, annotations, public upload links, and entity linking.

## Scope

### In Scope
- Document metadata management (title, tags, folders, versioning)
- Document upload (< 20MB Convex, > 20MB external storage)
- Hierarchical folder structure (project + org scoped)
- Drawings with specialized metadata (sheet numbers, disciplines, revisions)
- PDF annotations (rectangles, circles, arrows, text, freehand)
- AI text extraction and chunking (~500 tokens per chunk, 50 token overlap)
- Vector embedding generation (OpenAI → Pinecone)
- Semantic search across document chunks
- Entity linking (chunks linked to defects, SWMS, incidents, etc.)
- Document versioning (new version creates new record, preserves old)
- Org library pattern (org-level docs linked to projects via linkedFromOrgDocId)
- Public upload links with share codes (subcontractor doc submission)
- Photo management (categorization: site, progress, safety, quality)
- Media file storage abstraction (Convex storage or external URL)
- Temporary signed URLs (1 hour expiry)

### Out of Scope
- Email integration (future)
- Advanced OCR for scanned documents (beyond PDF text extraction)
- Video/audio playback (storage only)
- Real-time collaborative editing (future)
- Automated document approval workflows (manual review only)
- Integration with external document management systems (SharePoint, Dropbox)

## Requirements

### Documents
- REQ-001: Support org-scoped and project-scoped documents
- REQ-002: Org-level documents can be linked (not copied) to projects via linkedFromOrgDocId
- REQ-003: Document upload accepts PDF, Word, Excel, images (< 20MB → Convex, > 20MB → external)
- REQ-004: Document metadata includes: title, docType, tags, folderId, version, previousVersionId
- REQ-005: Auto-generate version numbers on new version creation
- REQ-006: Preserve previous versions (previousVersionId references)
- REQ-007: Search documents by title, tags, docType
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
- REQ-017: Drawing status workflow: draft → for_review → current → superseded
- REQ-018: Drawing status values: current (active set), superseded (replaced), for_review (pending approval), draft (WIP)
- REQ-019: Promote generic document to drawing (convert PDF, add drawing metadata, validate MIME type)
- REQ-020: PDF annotation support via pdfAnnotations table (now embedded in sourceDocuments.annotationData)
- REQ-021: Annotation tools: rectangle, circle, arrow, text label, freehand drawing, color picker, stroke width, delete
- REQ-022: Separate drawings dashboard UI
- REQ-023: Drawing statistics (total count, by discipline, by status)

### AI Processing
- REQ-024: Extract text from PDFs via pdfjs-dist (tryExtractPdfText)
- REQ-025: Fallback to OpenAI vision API for non-PDF/non-text documents (GPT-4o-mini)
- REQ-026: Text chunking: ~500 tokens per chunk with 50 token overlap
- REQ-027: Store chunks in documentChunks table (chunkIndex, text, pageNumber, embeddingKey)
- REQ-028: Generate embeddings via OpenAI API
- REQ-029: Store embeddings in Pinecone with embeddingKey reference
- REQ-030: Semantic search across chunks (query Pinecone → retrieve chunks → return documents)
- REQ-031: Re-chunk documents on version update (auto-regenerate chunks)
- REQ-032: Link chunks to entities via documentEntityLinks (polymorphic: entityTable + entityId)
- REQ-033: Link types: source (doc is source of truth), evidence (doc provides evidence), definition (doc defines requirements), note (doc adds context)
- REQ-034: OpenAI analysis returns: summary (≤120 words), suggestedDocType, suggestedTitle, suggestedTags, confidence, questions, extracted facts (≤12)
- REQ-035: Limits: MAX_TEXT_CHARS 40,000, MAX_DOWNLOAD_BYTES_FOR_AI 30MB, PDF max pages 50, PDF max chars 80,000
- REQ-036: ai.read_document tool: Read/analyze documents with optional focus directive

### Folders
- REQ-037: Hierarchical folder structure (parentFolderId for nesting)
- REQ-038: Folders can be org-scoped or project-scoped
- REQ-039: Folder CRUD operations: create, update, delete, list, get
- REQ-040: Folder navigation (breadcrumb trail)
- REQ-041: Move documents between folders (update folderId)

### Media Files
- REQ-042: Media file metadata: fileName, fileType (MIME), fileSize, storageId (Convex), externalUrl (external), kind, category
- REQ-043: Kind values: document, image, video, audio, other
- REQ-044: Category values: site, progress, safety, quality, other
- REQ-045: Entity linking (polymorphic: linkedEntityType + linkedEntityId)
- REQ-046: Photo timestamp (takenAt) for timeline views
- REQ-047: Storage provider abstraction: storageProvider ('convex' | 'external')
- REQ-048: Convex storage signed URLs expire after 1 hour (regenerated on query)
- REQ-049: External URLs permanent
- REQ-050: Photo gallery views (grid, filtered by category/date)
- REQ-051: Caption and tagging for photos
- REQ-052: Search photos by category, date range

### Public Upload Links
- REQ-053: Generate share codes (12-char alphanumeric via nanoid)
- REQ-054: Upload link fields: shareCode, label, description, folderId (target folder), isActive, expiresAt, createdBy
- REQ-055: Public route: `/w/upload/[shareCode]` (no auth required)
- REQ-056: Validate share code: active, not expired, not over max uses (optional)
- REQ-057: Upload flow: validate code → file upload → store in target folder → confirmation
- REQ-058: Deactivation (isActive flag toggle)
- REQ-059: Usage tracking (usageCount, lastUsedAt)
- REQ-060: Max uses limit (optional maxUses field)

### Photo Gallery
- REQ-061: Photo gallery grid view with category filtering
- REQ-062: Photo timeline view sorted by takenAt timestamp
- REQ-063: Batch photo upload (multiple files, single request)
- REQ-064: Photo compression on upload (resize to max 2048px width, 85% quality)
- REQ-065: EXIF metadata extraction (timestamp, geolocation, camera model)

### Drawing Export
- REQ-066: Export drawing with annotations as flattened PDF
- REQ-067: Annotation layer toggle (show/hide during export)
- REQ-068: Annotation color preservation in export
- REQ-069: Export includes metadata footer (sheet number, revision, exported date)

### Storage Validation
- REQ-070: File size validation on upload (reject > 20MB for Convex)
- REQ-071: MIME type whitelist (PDF, Word, Excel, images only)
- REQ-072: Virus scan integration for uploaded files (future)
- REQ-073: Automatic cleanup of orphaned mediaFiles (no references after 30 days)

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| sourceDocuments | projectId?, orgId?, mediaFileId, docType, title, folderId, version, previousVersionId, linkedFromOrgDocId?, uploadLinkId?, annotationData (embedded), sheetNumber?, revision?, discipline?, scale?, drawnBy?, drawnDate?, status? | Document metadata with AI chunking support. Optional projectId/orgId for dual scope. Embedded annotationData (was separate pdfAnnotations table). Drawing-specific fields when docType='drawing'. |
| documentChunks | documentId, chunkIndex, text (~500 tokens), pageNumber, embeddingKey (Pinecone key) | Text chunks for RAG/semantic search. Auto-generated on document upload. |
| documentEntityLinks | documentId, chunkIndex, entityTable, entityId, linkType (source\|evidence\|definition\|note) | Link document chunks to entities (polymorphic). |
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
7. Trigger AI processing: extract text → chunk → embed → store chunks
8. Return documentId

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
4. Trigger AI re-chunking:
   - Delete old documentChunks (where documentId = old doc)
   - Generate new chunks for new document
   - Generate new embeddings
5. Return new documentId

### Drawing Promotion
1. User selects PDF document (docType = generic)
2. Validate MIME type = application/pdf
3. Open drawing metadata form (sheetNumber, revision, discipline, scale, drawnBy, drawnDate, status)
4. Update sourceDocuments:
   - Set docType = 'drawing'
   - Add drawing metadata fields
5. Move to drawings dashboard

### Semantic Search
1. User enters search query
2. Generate query embedding (OpenAI API)
3. Query Pinecone with embedding (top 20 chunks)
4. Retrieve matching chunks (documentChunks by embeddingKey)
5. Group by documentId
6. Load sourceDocuments metadata
7. Rank by relevance
8. Return document list with matching snippets

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
2. User highlights chunk referencing defect (e.g., "Waterproofing failure")
3. User clicks "Link to Defect"
4. Select defect from list (or create new)
5. Create documentEntityLinks record:
   - documentId, chunkIndex, entityTable = 'defects', entityId, linkType = 'evidence'
6. Bidirectional navigation enabled (defect → doc, doc → defect)

### AI Vision Fallback (Non-PDF Documents)
1. User uploads non-PDF document (Word, Excel, image)
2. System detects MIME type ≠ application/pdf
3. System attempts text extraction:
   - Images: Send to OpenAI GPT-4o-mini vision API
   - Word/Excel: Use document parser libraries
4. Receive extracted text or error
5. If successful:
   - Proceed to chunking workflow
   - Generate OpenAI analysis (summary, suggestedDocType, suggestedTitle, suggestedTags, confidence, questions, facts)
6. If failed:
   - Skip chunking (document remains searchable by metadata only)
   - Log extraction failure
7. Store document metadata regardless

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

### Auto Re-chunk on Version Update
1. User creates new version (previousVersionId set)
2. System identifies old document ID
3. Delete old chunks:
   - Query: `documentChunks.where("documentId", oldDocId)`
   - Delete all matching chunks
   - Delete Pinecone embeddings (via embeddingKey references)
4. Extract text from new version:
   - PDF → pdfjs-dist extraction
   - Non-PDF → OpenAI vision fallback
5. Chunk text (~500 tokens, 50 overlap)
6. Generate embeddings (OpenAI API)
7. Store new chunks in documentChunks
8. Store embeddings in Pinecone with new embeddingKeys
9. Update chunk references in any documentEntityLinks
10. Return new documentId

### ai.read_document Tool Integration
1. AI agent receives user query requiring document analysis
2. Agent invokes `ai.read_document` tool with:
   - documentId: Target document ID
   - focus: Optional directive (e.g., "waterproofing specs", "safety protocols")
3. Backend retrieves:
   - Document metadata from sourceDocuments
   - All chunks from documentChunks (ordered by chunkIndex)
   - Media file from mediaFiles
4. If focus provided:
   - Filter chunks by semantic relevance to focus (vector similarity)
   - Limit to top 10 relevant chunks
5. If no focus:
   - Use all chunks (up to MAX_TEXT_CHARS 40,000)
6. Send to OpenAI API with prompt:
   - Analyze document
   - Return: summary (≤120 words), suggestedDocType, suggestedTitle, suggestedTags (≤8), confidence (0-1), questions (≤5), extracted facts (≤12)
7. Return structured analysis to agent
8. Agent uses analysis in response to user

## Acceptance Criteria

### Documents
- AC-001: User can upload document to project folder (< 20MB → Convex)
- AC-002: User can upload document to org library (org-scoped)
- AC-003: User can link org library doc to project (linkedFromOrgDocId)
- AC-004: User can create new version (auto-increments version, preserves previousVersionId)
- AC-005: User can view version history (list all versions via previousVersionId chain)
- AC-006: User can search documents by title, tags, docType
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

### AI Processing
- AC-018: System extracts text from PDF documents (via pdfjs-dist)
- AC-019: System falls back to OpenAI vision API for non-PDF documents
- AC-020: System chunks text into ~500 token segments with 50 token overlap
- AC-021: System stores chunks in documentChunks table (chunkIndex, text, pageNumber, embeddingKey)
- AC-022: System generates embeddings via OpenAI API
- AC-023: System stores embeddings in Pinecone with embeddingKey
- AC-024: User can semantically search documents (query → embeddings → Pinecone → results)
- AC-025: System re-chunks documents on version update (auto-regenerate)
- AC-026: ai.read_document tool returns: summary, suggestedDocType, suggestedTitle, suggestedTags, confidence, questions, extracted facts
- AC-027: ai.read_document tool respects focus directive (prioritize relevant details)

### Folders
- AC-028: User can create folder (project or org scoped)
- AC-029: User can nest folders (parentFolderId)
- AC-030: User can move documents between folders (update folderId)
- AC-031: User can delete folder (must be empty or cascade delete)
- AC-032: User can navigate folder hierarchy (breadcrumb trail)

### Media Files
- AC-033: User can upload photo (< 10MB, JPEG/PNG/GIF/WebP)
- AC-034: User can categorize photo (site, progress, safety, quality)
- AC-035: User can caption photo
- AC-036: User can view photo gallery (grid, filtered by category/date)
- AC-037: User can download media file (signed URL, 1 hour expiry)
- AC-038: System tracks photo timestamp (takenAt) for timeline
- AC-039: System links media file to entity (polymorphic: linkedEntityType + linkedEntityId)

### Public Upload Links
- AC-040: User can generate public upload link (shareCode, label, description, target folderId)
- AC-041: User can set upload link expiry (expiresAt)
- AC-042: User can set max uses (maxUses)
- AC-043: External user can access `/w/upload/[shareCode]` (no auth)
- AC-044: External user can upload document via share code
- AC-045: System validates share code (active, not expired, not over max uses)
- AC-046: System increments usage counter (usageCount)
- AC-047: User can deactivate upload link (isActive = false)
- AC-048: User can view upload link usage history (usageCount, lastUsedAt)

### Entity Linking
- AC-049: User can link document chunk to defect (documentEntityLinks)
- AC-050: User can link document chunk to SWMS (documentEntityLinks)
- AC-051: User can link document chunk to incident (documentEntityLinks)
- AC-052: User can specify link type (source, evidence, definition, note)
- AC-053: User can view linked entities from document detail screen
- AC-054: User can view linked documents from entity detail screen (bidirectional)

### Photo Management
- AC-055: User can upload multiple photos in batch (grid selection)
- AC-056: System extracts EXIF timestamp and populates takenAt field
- AC-057: System compresses photos on upload (max 2048px, 85% quality)
- AC-058: User can filter photo gallery by category dropdown
- AC-059: User can view photo timeline (vertical list, grouped by date)

### Drawing Export
- AC-060: User can export drawing with annotations as PDF
- AC-061: Exported PDF preserves annotation colors and strokes
- AC-062: User can toggle annotation visibility before export
- AC-063: Exported PDF includes metadata footer

### AI Processing Validation
- AC-064: System rejects PDFs > 50 pages (REQ-035 limit)
- AC-065: System rejects text extraction > 80,000 chars (REQ-035 limit)
- AC-066: System falls back to vision API for image-based PDFs
- AC-067: ai.read_document returns confidence score with analysis

### Storage Management
- AC-068: System rejects files > 20MB for Convex storage
- AC-069: System validates MIME type against whitelist
- AC-070: User receives clear error for rejected file types
- AC-071: Convex signed URLs regenerated on each document access (1hr expiry)

## Dependencies

### Backend
- Convex database (sourceDocuments, documentChunks, documentEntityLinks, documentFolders, documentUploadLinks, mediaFiles tables)
- Convex storage (file storage < 20MB, signed URLs)
- Convex mutations: generateUploadUrl, createDocument, createVersion, promoteToDrawing, createFolder, generateUploadLink
- Convex queries: listDocuments, getDocument, listChunks, listFolders, listByProject, listByFolder

### AI/ML
- OpenAI API (text extraction, embeddings, vision API fallback)
- pdfjs-dist library (PDF text extraction)
- Pinecone (vector database for embeddings, semantic search)
- Claude SDK ai.read_document tool (document analysis with focus directive)

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
- AI chunking pipeline (upload → extract → chunk → embed → store)
