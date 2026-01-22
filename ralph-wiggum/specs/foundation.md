# Foundation

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Business Rules](#business-rules)
- [Dependencies](#dependencies)

## Purpose
Define core entities (organizations, projects, workers, trades) and scoping architecture that all other modules depend on.

## Scope

### In Scope
- Organizations (orgs) - root entity for multi-tenancy
- Projects - primary operational scope
- Workers - site personnel across projects
- Trades - master construction disciplines
- Work Packages - project subdivisions aligned to trades/phases
- Worker Assignments - project-worker junction
- Scoping enforcement (org → project → entity hierarchy)

### Out of Scope
- Safety operations (covered in safety-*.md specs)
- Quality operations (covered in quality-*.md specs)
- Asset management (covered in asset-*.md specs)
- Site operations (covered in site-operations.md)
- AI agent behavior (covered in chief-agent.md)

## Requirements

### Organizations
- **REQ-001**: System MUST support multiple organizations (multi-tenant architecture)
- **REQ-002**: Organizations MUST have unique ABN (Australian Business Number)
- **REQ-003**: Organizations MUST be categorized by kind (principal, subcontractor, client, supplier, regulator, other)
- **REQ-004**: Every org-scoped entity MUST reference orgId (required field)
- **REQ-005**: Organizations MUST support contact information (name, email, phone)
- **REQ-006**: Organizations MUST have `by_org` and `by_kind` indexes for filtering
- **REQ-007**: Organizations have no status field (always active)

### Projects
- **REQ-008**: Projects MUST belong to one organization (orgId required)
- **REQ-009**: Projects MUST support optional client organization (clientOrgId)
- **REQ-010**: Projects MUST have unique project codes within organization
- **REQ-011**: Projects MUST track status lifecycle (planning → active → completed → archived)
- **REQ-012**: Projects MUST support financial tracking (value, startDate, endDate)
- **REQ-013**: Every project-scoped entity MUST reference projectId (required field)
- **REQ-014**: Projects MUST have indexes: by_org, by_status (compound), by_client
- **REQ-015**: Projects serve as primary scoping boundary (scope enforcement at projectId level)

### Workers
- **REQ-016**: Workers MUST belong to one organization (orgId = employer org)
- **REQ-017**: Workers MUST have unique email addresses within organization
- **REQ-018**: Workers MUST track status (pending → active → inactive)
- **REQ-019**: Workers MUST reference trade via tradeId (FK to trades table)
- **REQ-020**: Workers MUST support emergency contact information (name, phone, relationship)
- **REQ-021**: Workers MUST support medical information (allergies, conditions)
- **REQ-022**: Workers MUST support avatar via mediaFiles reference
- **REQ-023**: Workers MUST have indexes: by_org, by_email, by_status (compound), by_trade
- **REQ-024**: Workers can be assigned to multiple projects via workerAssignments
- **REQ-025**: Worker employer name stored as string (can differ from org)

### Trades
- **REQ-026**: Trades are master data (no parent entity)
- **REQ-027**: Trades MUST have unique short codes (e.g., "CARP" for Carpentry)
- **REQ-028**: Trades MUST have full name and optional description
- **REQ-029**: Trades MUST support active/inactive toggle
- **REQ-030**: Trades MUST have indexes: by_code, by_active
- **REQ-031**: Trades referenced by workers and workPackages

### Work Packages
- **REQ-032**: Work packages MUST belong to one organization (orgId required)
- **REQ-033**: Work packages MUST belong to one project (projectId required)
- **REQ-034**: Work packages MUST track status (planned → active → completed → archived)
- **REQ-035**: Work packages MUST support optional trade reference (tradeId)
- **REQ-036**: Work packages MUST support optional external phase reference (phaseId string)
- **REQ-037**: Work packages MUST have indexes: by_project, by_org, by_project_phase, by_trade
- **REQ-038**: Work packages use createdAt for ordering (no sortOrder field)

### Worker Assignments
- **REQ-039**: Worker assignments MUST link worker to project (junction table)
- **REQ-040**: Worker assignments MUST support project-specific role
- **REQ-041**: Worker assignments MUST enforce unique worker-project pairs (by_project_worker index)
- **REQ-042**: Worker assignments have no explicit status (existence = active)
- **REQ-043**: Worker assignments MUST have indexes: by_project, by_worker, by_project_worker (unique)

### Scoping Architecture
- **REQ-044**: System MUST enforce three-tier scoping: org → project → entity
- **REQ-045**: MCP server MUST auto-inject projectId on all db_read operations for project-scoped tables
- **REQ-046**: MCP server MUST auto-inject projectId on all db_write operations for project-scoped tables
- **REQ-047**: MCP server MUST validate projectId on writes (throw error if mismatch)
- **REQ-048**: All project-scoped tables MUST have `by_project` index
- **REQ-049**: Chief agent CANNOT read data from other projects (MCP blocks cross-project access)
- **REQ-050**: Chief agent CANNOT write to other projects (MCP validates projectId)
- **REQ-051**: Foreign key validation MUST ensure related entities in same project
- **REQ-052**: Query scoping MUST require explicit projectId in all project-scoped queries
- **REQ-053**: Cross-project protections enforced at: MCP layer (primary), Convex indexes (secondary), UI layer (not security boundary)
- **REQ-054**: Scope enforcement hierarchy: Org → Project → Entity (database hierarchy)
- **REQ-055**: ChiefRequestContext MUST contain projectId and orgId for all operations
- **REQ-056**: Scope injection rules based on table.scopeHint: 'project', 'org', 'mixed', 'global'
- **REQ-063**: Scope violation errors MUST return HTTP 403 with message format specifying entityType, entityId, currentProjectId, targetProjectId

### Multi-Project & Cross-Project
- **REQ-057**: Business owners oversee 5-50 concurrent projects
- **REQ-058**: Project managers manage 1-3 concurrent projects
- **REQ-059**: Workers assigned to 5-50 people teams (direct staff + subcontractors)
- **REQ-060**: Cross-project intelligence for business owners (multi-project dashboard, pattern detection)
- **REQ-061**: Resource allocation tracked across projects
- **REQ-062**: Autonomy question: Per-project autonomy calibration (not global) - different projects have different risk profiles

## Entities

| Table | Key Fields | Purpose | Indexes |
|-------|------------|---------|---------|
| **orgs** | name, abn, kind, contactName, contactEmail, contactPhone, metadata | Root organization entity - contractors, clients, suppliers, regulators | by_kind |
| **projects** | orgId (FK), clientOrgId (FK opt), name, code, address, value, status, startDate, endDate, metadata | Construction projects - primary scoping entity | by_org, by_status (orgId+status), by_client |
| **trades** | code, name, description, isActive | Master list of construction trades/disciplines | by_code, by_active |
| **workPackages** | orgId (FK req), projectId (FK), name, description, status, tradeId (FK opt), phaseId (string opt), metadata | Work subdivisions within projects aligned to trades/phases | by_project, by_org, by_project_phase, by_trade |
| **workers** | orgId (FK), fullName, email, phone, role, status, tradeId (FK), employer, avatarId (FK opt), emergencyContact*, medical*, metadata | All site personnel - employees, subcontractors | by_org, by_email, by_status (orgId+status), by_trade |
| **workerAssignments** | workerId (FK), projectId (FK), role, createdAt | Junction table linking workers to projects | by_project, by_worker, by_project_worker (unique) |

**Field Details:**
- `emergencyContact*`: emergencyContactName, emergencyContactPhone, emergencyContactRelationship
- `medical*`: dateOfBirth, address, allergies, medicalConditions
- All tables include standard fields: createdAt, updatedAt (except where noted)

**Status Enums:**
- **projects.status**: planning | active | completed | archived
- **workPackages.status**: planned | active | completed | archived
- **workers.status**: pending | active | inactive
- **orgs.kind**: principal | subcontractor | client | supplier | regulator | other

**Foreign Keys:**
- `orgs`: No parent (root entity)
- `projects`: orgId → orgs, clientOrgId → orgs (optional)
- `workPackages`: orgId → orgs, projectId → projects, tradeId → trades (optional)
- `workers`: orgId → orgs, tradeId → trades (optional), avatarId → mediaFiles (optional)
- `workerAssignments`: workerId → workers, projectId → projects

**Lifecycle Flows:**
- **Projects**: planning → active → completed → archived
- **Work Packages**: planned → active → completed → archived
- **Workers**: pending → active → inactive
- **Trades**: Active/inactive toggle (isActive boolean)
- **Organizations**: Always active (no status field)
- **Worker Assignments**: Existence = active (no status, delete to deactivate)

## Workflows

### Workflow 1: Create New Project
1. User provides project details (name, code, address, client, dates, value)
2. Validate orgId exists and user has access
3. Validate unique project code within organization
4. Create project record with status: planning
5. Optionally create initial work packages
6. Optionally assign initial workers via workerAssignments
7. Return projectId
8. Chief monitors project for status progression

### Workflow 2: Assign Worker to Project
1. Validate worker exists and belongs to org
2. Validate project exists and belongs to same org
3. Check worker not already assigned (by_project_worker unique index)
4. Create workerAssignment record with project-specific role
5. Return assignmentId
6. Worker can now access project-scoped data

### Workflow 3: Scope Enforcement (Read)
1. Chief receives user request requiring data read
2. Infer projectId from context (ChiefRequestContext.projectId → path → screen)
3. MCP db_read tool called with table name and filters
4. MCP server checks table.scopeHint
5. If 'project': auto-inject projectId filter using by_project index
6. If 'org': auto-inject orgId filter using by_org index
7. Execute Convex query with injected scope
8. Return scoped results (CANNOT access other projects)

### Workflow 4: Scope Enforcement (Write)
1. Chief receives user request requiring data write
2. Validate projectId in ChiefRequestContext
3. MCP db_write tool called with operations array
4. MCP server validates projectId for each operation
5. For create: auto-inject projectId into payload
6. For update/delete: validate targetId belongs to same projectId
7. Validate foreign keys reference entities in same project
8. Execute mutation atomically
9. Store changeset for undo
10. Return executionId + results

### Workflow 5: Cross-Project Intelligence (Business Owner)
1. Business owner accesses multi-project dashboard
2. MCP validates user has business owner role
3. Query aggregates across projects filtered by orgId (no projectId injection)
4. **Pattern Detection Rules:**
   - Subcontractor delays: Same orgId appears in >2 projects with >3 overdue tasks
   - Quality patterns: Same defect category appears in >3 projects with critical priority
   - Safety patterns: Same incident type appears in >1 project within 30 days
   - Resource contention: Same workerId assigned to >3 concurrent active projects
5. **Risk Alert Generation:**
   - Critical defects open >7 days: Query defects WHERE priority='critical' AND status!='closed' AND createdAt < now()-7days
   - Permit expiry: Query permitInstances WHERE endDate < now()+3days AND status='active'
   - Worker cert expiry: Query competencyRecords WHERE expiryDate < now()+30days AND status='verified'
6. **Performance Metrics:**
   - Aggregate defect close rate per project (closed / total)
   - Aggregate SWMS completion rate (signed / assigned)
   - Aggregate incident frequency rate (incidents / worker-days)
7. Display multi-project KPI cards with drill-down links
8. Enable project selection to navigate to single-project view
9. Cache aggregations for 5 minutes (performance optimization)

## Acceptance Criteria

- **AC-001**: Creating an organization with ABN "12345678901" and kind "principal" succeeds and returns orgId
- **AC-002**: Creating a project with orgId, name "Site Alpha", code "SA-001", status "planning" succeeds and returns projectId
- **AC-003**: Creating two projects with same code in same org fails with conflict error
- **AC-004**: Creating a worker with orgId, email "john@example.com", tradeId (Carpenter), status "pending" succeeds
- **AC-005**: Creating two workers with same email in same org fails with validation error
- **AC-006**: Assigning worker to project creates workerAssignment record with unique by_project_worker constraint
- **AC-007**: Assigning same worker to same project twice fails with conflict error
- **AC-008**: Creating work package with orgId and projectId succeeds, optional tradeId supported
- **AC-009**: Querying defects with db_read automatically filters by projectId from context (cross-project reads blocked)
- **AC-010**: Creating defect with db_write auto-injects projectId from context (cannot override)
- **AC-011**: Updating defect validates targetId belongs to same projectId before execution
- **AC-012**: Attempting to read/write entities from different project fails with scope violation error
- **AC-013**: Multi-project dashboard aggregates data across all projects in orgId scope
- **AC-014**: Project status transitions follow lifecycle: planning → active → completed → archived
- **AC-015**: Worker status transitions follow lifecycle: pending → active → inactive
- **AC-016**: Work package status transitions follow lifecycle: planned → active → completed → archived
- **AC-017**: Trades support active/inactive toggle via isActive boolean
- **AC-018**: Projects indexed by_org, by_status (compound), by_client enable efficient queries
- **AC-019**: Workers indexed by_org, by_email, by_status (compound), by_trade enable efficient queries
- **AC-020**: Foreign key validation ensures project.orgId, project.clientOrgId, worker.orgId, worker.tradeId, workPackage.tradeId reference existing records
- **AC-021**: Creating two workers with emails "john@example.com" and "JOHN@example.com" in same org fails with validation error (case-insensitive)
- **AC-022**: Creating worker with email "john@example.com" in orgId=123 and same email in orgId=456 succeeds (org-scoped uniqueness)
- **AC-023**: Attempting to delete trade referenced by 3 workers fails with error message "Cannot delete trade: referenced by 3 workers and 2 work packages"
- **AC-024**: Attempting to delete org referenced by 5 projects fails with error message "Cannot delete organization: referenced by 5 projects, 12 workers, 8 work packages"
- **AC-025**: Creating project with invalid ABN "123" (not 11 digits) fails with validation error
- **AC-026**: Creating two orgs with same ABN fails with conflict error (global uniqueness)
- **AC-027**: Creating workPackage with tradeId from different org succeeds (trades are global, not org-scoped)
- **AC-028**: MCP scope violation error returns HTTP 403 with message format: "Scope violation: Cannot access {entityType} {entityId} from project {currentProjectId} (belongs to project {targetProjectId})"

## Business Rules

**Email Uniqueness:**
- Worker email addresses MUST be unique within organization (orgId scope)
- System MUST reject duplicate email creation with validation error
- Case-insensitive uniqueness check (john@example.com = JOHN@example.com)
- Email updates validated against existing workers in same org

**Project Code Uniqueness:**
- Project codes MUST be unique within organization (orgId scope)
- System MUST reject duplicate project code with conflict error
- Case-sensitive uniqueness (SA-001 ≠ sa-001)
- Empty/null codes allowed (optional field)

**ABN Validation:**
- ABN MUST be 11 digits (Australian Business Number format)
- ABN uniqueness enforced across all orgs (global scope)
- System SHOULD validate ABN checksum using ATO algorithm
- Empty ABN allowed (optional field)

**Referenced Entity Deletion:**
- Trades: CANNOT delete trade if referenced by workers.tradeId or workPackages.tradeId
  - Alternative: Set isActive=false (soft delete)
  - UI MUST hide inactive trades from dropdowns
- Organizations: CANNOT delete org if referenced by projects.orgId, projects.clientOrgId, workers.orgId, or workPackages.orgId
  - Orphan check MUST run before deletion
  - Return error with count of dependent entities
- Projects: CANNOT delete project if referenced by any project-scoped entities
  - Use status='archived' instead of deletion

## Dependencies

- **Requires**: None (foundation spec - no dependencies)
- **Required by**: All other specs (safety-swms.md, safety-permits.md, safety-inductions.md, safety-incidents.md, quality-checklists.md, quality-defects.md, site-operations.md, site-documents.md, asset-management.md, chief-agent.md, communications.md)

---

**Implementation Notes:**

1. **Scope Enforcement**: MCP server is primary security boundary - auto-injects projectId on reads, validates on writes. UI layer provides UX but is NOT security boundary.

2. **Multi-Project Context**: MVP enforces single-project context per operation. Future: Support cross-project operations with explicit multi-project scoping.

3. **Worker Trade Migration**: Current schema uses `trade: string`, target uses `tradeId: v.id('trades')`. Migration required to backfill tradeId from trade string.

4. **Work Package orgId**: Current schema has optional orgId, target requires orgId. Migration required to backfill orgId from projectId → project.orgId.

5. **ChiefRequestContext**: All Chief operations receive context with projectId + orgId. Inference order: context.projectId → inferProjectIdFromPath(currentPath) → inferProjectIdFromPath(screen.currentPath) → error.

6. **Autonomy Calibration**: Per-project autonomy levels (Advisor/Operator/Autopilot) not global - different projects have different risk profiles.

7. **Index Strategy**: Every project-scoped table MUST have `.index('by_project', ['projectId'])`. Compound indexes like `by_project_status` optimize common filters.

8. **Foreign Key Scope Validation:**

**Project-Scoped FKs:**
- defects.assignedTo (workerId) MUST have workerAssignment to same projectId
- checklistInstances.performerId MUST have workerAssignment to same projectId
- Validation: JOIN workerAssignments WHERE workerId=X AND projectId=Y MUST exist

**Org-Scoped FKs:**
- projects.orgId MUST reference existing org
- workers.orgId MUST reference existing org
- workPackages.orgId MUST match workPackages.projectId → project.orgId (consistency check)

**Global FKs (No Scope Validation):**
- workers.tradeId (trades are global master data)
- workPackages.tradeId (trades are global master data)

**Cross-Org FKs (Allowed):**
- projects.clientOrgId can reference different org than projects.orgId (client ≠ principal contractor)

9. **No Soft Deletes**: Organizations have no status field (always active). Projects/workers/workPackages use status enum for lifecycle. Worker assignments have no status (delete to deactivate).
