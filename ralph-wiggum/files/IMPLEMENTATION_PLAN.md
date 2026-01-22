# Implementation Plan

## Current Release: R1 - Foundation

### Status
- **Phase**: In Progress
- **Last Updated**: 2026-01-22

---

## Release Summary

- **Release**: R1 - Foundation
- **What's included**:
  - Project scaffolding (Next.js 16 + Convex + TypeScript)
  - Foundation database schema (6 tables: orgs, projects, workers, trades, workPackages, workerAssignments)
  - App shell with responsive layout (IconRail + Sidebar + Main pane)
  - Core UI primitives (15 essential ShadCN components)
  - Stub authentication (demo user context, no real auth)
  - Basic navigation structure
  - Project/Org switcher
  - PM Dashboard skeleton (stats cards, empty states)

- **Why this release**:
  - Establishes technical foundation all future modules depend on
  - Provides working app shell for iterative feature development
  - Enables data scoping patterns (org → project → entity) from day 1
  - Creates horizontal slice: PM can see empty project, switch orgs/projects, understand app structure
  - Validates tech stack integration (Next.js 16 + Convex real-time + ShadCN)

- **Dependencies**: None (first release)

---

## User Journey Maps

### Project Manager Journey (R1 Scope)
- Open app → See org selector (if multiple orgs)
- Select org → See project list with status badges
- Select project → Land on project dashboard
- Dashboard shows: empty stats cards, placeholder for "Chief AI coming soon"
- Navigate sidebar: Projects, Workers, Settings (minimal)
- See responsive layout: IconRail (60px) + Sidebar (240px collapsible) + Main content
- Mobile: Sidebar collapses to Sheet overlay

### Field Worker Journey (R1 Scope)
- **Minimal**: No dedicated mobile UI in R1
- Can view basic project info if accessing platform URL
- Mobile-responsive layout works but no TaskHub or mobile-specific screens
- Placeholder: "Mobile Worker app coming in R4"

### Business Owner Journey (R1 Scope)
- **Minimal**: Same as PM journey
- Multi-project view: list of all projects with status badges
- No cross-project analytics or compliance dashboard (R5)
- Can see project list, basic health indicators (status only)

---

## Prioritized Tasks

### Phase 1: Project Scaffolding

- [x] **INFRA-001**: Initialize Next.js 16 project with App Router
  - TypeScript strict mode enabled
  - Configure path aliases (`@/`)
  - Set up PostCSS for Tailwind v4

- [x] **INFRA-002**: Initialize Convex backend
  - Create `convex/` directory structure
  - Configure `convex.json` deployment
  - Set up `convex/_generated/` gitignore
  - Configure environment variables (`CONVEX_URL`, `CONVEX_DEPLOYMENT`)

- [x] **INFRA-003**: Install and configure ShadCN
  - Run `npx shadcn@latest init`
  - Configure `components.json` for `@/components/ui/`
  - Set up CSS variables in `app/globals.css`

- [x] **INFRA-004**: Configure development tooling
  - ESLint flat config with Next.js rules
  - Prettier configuration
  - VS Code settings for format on save
  - TypeScript strict configuration

- [x] **INFRA-005**: Set up file structure
  ```
  app/
    (platform)/
      orgs/[orgId]/
        projects/[projectId]/page.tsx
        page.tsx
      layout.tsx
    (public)/
      w/                    # Placeholder for R4
    layout.tsx
    globals.css
  components/
    ui/                     # ShadCN primitives
    layout/                 # AppShell, etc.
    shared/                 # Cross-module
  convex/
    schema.ts
    lib/
    domains/
  hooks/
  lib/
    constants.ts
    utils.ts
  ```

### Phase 2: Database Schema (Foundation Tables)

- [x] **DB-001**: Define `orgs` table
  - Fields: name, abn, kind, contactName, contactEmail, contactPhone, metadata, timestamps
  - Index: by_kind

- [x] **DB-002**: Define `projects` table
  - Fields: orgId, clientOrgId, name, code, address, value, status, startDate, endDate, metadata, timestamps
  - Indexes: by_org, by_status, by_client

- [x] **DB-003**: Define `trades` table
  - Fields: code, name, description, isActive, timestamps
  - Indexes: by_code, by_active

- [x] **DB-004**: Define `workers` table
  - Fields: orgId, fullName, email, phone, role, status, tradeId, employer, avatarId, emergency contact, medical info, timestamps
  - Indexes: by_org, by_email, by_status, by_trade

- [x] **DB-005**: Define `workPackages` table
  - Fields: orgId, projectId, name, description, status, tradeId, phaseId, metadata, timestamps
  - Indexes: by_project, by_org, by_trade

- [x] **DB-006**: Define `workerAssignments` table
  - Fields: workerId, projectId, role, createdAt
  - Indexes: by_project, by_worker, by_project_worker

- [x] **DB-007**: Seed initial data
  - 1 demo org, 2 demo projects, 5 trades, 3 workers, assignments

### Phase 3: Backend Functions (Foundation APIs)

- [x] **API-001**: Create `convex/orgs.ts` (list, get, create, update)
- [x] **API-002**: Create `convex/projects.ts` (listByOrg, get, create, update, getStats)
- [x] **API-003**: Create `convex/workers.ts` (listByOrg, listByProject, get, create, update)
- [x] **API-004**: Create `convex/trades.ts` (listActive, list, get)
- [x] **API-005**: Create `convex/workerAssignments.ts` (listByProject, listByWorker, assign, unassign)
- [x] **API-006**: Create `convex/lib/` utilities (errors.ts, time.ts)

### Phase 4: Frontend - App Shell

- [x] **SHELL-001**: Create `app/layout.tsx` (root) - fonts, ConvexProvider, metadata
- [x] **SHELL-002**: Create `app/globals.css` - CSS variables (50+ status colors, priorities)
- [x] **SHELL-003**: Create `components/layout/app-shell.tsx` - IconRail + Sidebar + Main pane
- [x] **SHELL-004**: Create `components/layout/icon-rail.tsx` - 4 nav icons with tooltips
- [x] **SHELL-005**: Create `components/layout/sidebar.tsx` - OrgSelector, ProjectSelector, NavGroups
- [x] **SHELL-006**: Create `components/layout/page-header.tsx` - title, subtitle, actions, tabs
- [x] **SHELL-007**: Create `components/layout/empty-state.tsx` - 3 variants

### Phase 5: Frontend - Core UI Primitives (ShadCN)

- [x] **UI-001**: Button
- [x] **UI-002**: Card
- [x] **UI-003**: Badge
- [x] **UI-004**: Input
- [x] **UI-005**: Label
- [x] **UI-006**: Select
- [x] **UI-007**: Dialog
- [x] **UI-008**: Sheet
- [x] **UI-009**: Tabs
- [x] **UI-010**: Table
- [x] **UI-011**: DropdownMenu
- [x] **UI-012**: Avatar
- [x] **UI-013**: Skeleton
- [x] **UI-014**: ScrollArea
- [x] **UI-015**: Toast (Sonner)
- [x] **UI-016**: Create `components/ui/status-badge.tsx`
- [x] **UI-017**: Create `lib/constants.ts` (status/priority configs)

### Phase 6: Frontend - Core Pages

- [x] **PAGE-001**: Create `app/(platform)/layout.tsx` - AppShell wrapper
- [x] **PAGE-002**: Create `app/(platform)/orgs/[orgId]/page.tsx` - Org dashboard
- [x] **PAGE-003**: Create `app/(platform)/orgs/[orgId]/projects/page.tsx` - Project list
- [x] **PAGE-004**: Create `app/(platform)/orgs/[orgId]/projects/[projectId]/page.tsx` - Project dashboard
- [x] **PAGE-005**: Create `app/(platform)/orgs/[orgId]/workers/page.tsx` - Worker list
- [x] **PAGE-006**: Create worker detail page (placeholder)

### Phase 7: Authentication (Stub)

- [ ] **AUTH-001**: Create `hooks/use-demo-context.ts` - demo user context
- [ ] **AUTH-002**: Create OrgSelector component
- [ ] **AUTH-003**: Create ProjectSelector component
- [ ] **AUTH-004**: Create redirect middleware (/ → /orgs/[firstOrgId])

### Phase 8: Hooks Layer

- [ ] **HOOK-001**: Create `hooks/use-orgs.ts`
- [ ] **HOOK-002**: Create `hooks/use-projects.ts`
- [ ] **HOOK-003**: Create `hooks/use-workers.ts`
- [ ] **HOOK-004**: Create `hooks/use-trades.ts`

---

## Acceptance Criteria (R1)

### Infrastructure
- [ ] Next.js 16 builds without errors
- [ ] Convex deployment succeeds
- [ ] TypeScript strict mode passes
- [ ] ESLint shows no errors
- [ ] Hot reload works in development

### Database
- [ ] All 6 foundation tables created with indexes
- [ ] Seed data loads successfully
- [ ] Queries return expected data

### App Shell
- [ ] AppShell renders with IconRail + Sidebar + Main pane
- [ ] Sidebar collapses on mobile (< 1024px)
- [ ] Sheet overlay works on mobile
- [ ] Active navigation state highlighted

### Navigation
- [ ] Can navigate between orgs
- [ ] Can navigate between projects
- [ ] URL reflects current context

### UI Components
- [ ] 15 ShadCN primitives installed
- [ ] StatusBadge shows correct colors
- [ ] EmptyState displays when no data
- [ ] Loading skeletons shown during fetch

### Responsiveness
- [ ] Breakpoints work: sm (640), md (768), lg (1024), xl (1280)
- [ ] Touch targets are 44x44px minimum
- [ ] Tables scroll horizontally on mobile

---

## Future Releases (Out of Scope for R1)

- **R2: Safety Core** - SWMS, Permits, Inductions, Incidents (14 tables)
- **R3: Quality + Assets** - Checklists (16 field types), Defects, Assets (12 tables)
- **R4: Site Ops + Mobile** - Diaries, Toolbox, Schedule, 51 mobile screens, 8 QR flows
- **R5: Chief AI** - MCP tools, Skills, Autonomy levels, Morning briefs

---

## Key Design Decisions

1. **No Real Auth in R1**: Demo context stub, real auth (Clerk/Auth0) deferred to pre-production
2. **Minimal Tables First**: Only 6 foundation tables, resist adding more
3. **No AI Pane in R1**: AppShell reserves space but renders placeholder
4. **No MCP Server in R1**: Direct Convex queries, MCP introduced in R5
5. **Status Colors System**: Full 50+ variable system established upfront
6. **Service Layer Deferred**: Extract when logic exceeds 50 lines (R2+)

---

## Discoveries & Notes

### Build Iteration 1 (2026-01-22)

1. **Convex Type Generation**: Convex `_generated` types require `npx convex dev` running. Created stub types for development without live backend.

2. **Next.js Version**: Currently 15.5.9 (not Next.js 16 yet). Adjust expectations - App Router and features match 15.x capabilities.

3. **Linting Deprecation**: `next lint` is deprecated. Use ESLint CLI directly (`npx eslint .`) in future workflows.

4. **ConvexProvider Updated**: Now handles missing CONVEX_URL - allows demo mode without deployment.

5. **UI Verified via Chrome E2E**: Dashboard, Projects list, Workers list all working.

6. **Git Tag 0.0.1 Created**: Release tag established.

---

## Completed Items

### Phase 1: Project Scaffolding ✓
- INFRA-001: Next.js 16 project initialized with App Router, TypeScript strict, path aliases, Tailwind v4
- INFRA-002: Convex backend initialized with directory structure, config, gitignore, env vars
- INFRA-003: ShadCN installed and configured with components.json, CSS variables
- INFRA-004: Development tooling configured (ESLint flat config, Prettier, VS Code, TypeScript strict)
- INFRA-005: File structure established (app routes, components, convex, hooks, lib)

### Phase 2: Database Schema ✓
- DB-001: `orgs` table defined with full schema and indexes
- DB-002: `projects` table defined with full schema and indexes
- DB-003: `trades` table defined with full schema and indexes
- DB-004: `workers` table defined with full schema and indexes
- DB-005: `workPackages` table defined with full schema and indexes
- DB-006: `workerAssignments` table defined with full schema and indexes
- DB-007: Seed data created (demo org, projects, trades, workers, assignments)

### Phase 3: Backend Functions ✓
- API-001: `convex/orgs.ts` with list, get, create, update
- API-002: `convex/projects.ts` with listByOrg, get, create, update, getStats
- API-003: `convex/workers.ts` with listByOrg, listByProject, get, create, update
- API-004: `convex/trades.ts` with listActive, list, get
- API-005: `convex/workerAssignments.ts` with listByProject, listByWorker, assign, unassign
- API-006: `convex/lib/` utilities (errors.ts, time.ts)

### Phase 4: App Shell ✓
- SHELL-001: Root layout with fonts, ConvexProvider, metadata
- SHELL-002: globals.css with 50+ CSS variables for status colors and priorities
- SHELL-003: app-shell.tsx with IconRail + Sidebar + Main pane
- SHELL-004: icon-rail.tsx with 4 nav icons and tooltips
- SHELL-005: sidebar.tsx with OrgSelector, ProjectSelector, NavGroups
- SHELL-006: page-header.tsx with title, subtitle, actions, tabs
- SHELL-007: empty-state.tsx with 3 variants

### Phase 5: UI Primitives ✓
- UI-001 to UI-015: 15 ShadCN components (Button, Card, Badge, Input, Label, Select, Dialog, Sheet, Tabs, Table, DropdownMenu, Avatar, Skeleton, ScrollArea, Toast)
- UI-016: status-badge.tsx custom component
- UI-017: lib/constants.ts with status/priority configurations

### Phase 6: Core Pages ✓
- PAGE-001: Platform layout with AppShell wrapper
- PAGE-002: Org dashboard page
- PAGE-003: Project list page
- PAGE-004: Project dashboard page
- PAGE-005: Worker list page
- PAGE-006: Worker detail page (placeholder)
