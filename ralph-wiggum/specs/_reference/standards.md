# Standards Reference

## Index
- [Purpose](#purpose)
- [File Structure](#file-structure)
- [Coding Standards](#coding-standards)
- [File Naming Conventions](#file-naming-conventions)
- [Code Naming Conventions](#code-naming-conventions)
- [Import Order (ESLint Enforced)](#import-order-eslint-enforced)
- [Testing Standards](#testing-standards)
- [Git Standards](#git-standards)
- [Accessibility (WCAG AA)](#accessibility-wcag-aa)
- [Performance Standards](#performance-standards)
- [Separation of Concerns](#separation-of-concerns)
- [CSS/Styling Standards](#cssstyling-standards)
- [Domain Standards](#domain-standards)
- [Validation Standards](#validation-standards)
- [Error Handling Standards](#error-handling-standards)
- [Configuration Standards](#configuration-standards)
- [Migration Strategy](#migration-strategy)
- [Key Principles](#key-principles)
- [Status/Priority Color System](#statuspriority-color-system)
- [Barrel Exports (Required)](#barrel-exports-required)
- [Comments & Documentation](#comments--documentation)

## Purpose
This document defines coding standards, testing conventions, architectural patterns, and quality requirements for the PRJ Construction rebuild. It serves as the single source of truth for development practices.

## File Structure

```
/
├── app/                          # Next.js 16 App Router
│   ├── (platform)/              # Authenticated routes
│   │   ├── orgs/[orgId]/
│   │   │   ├── projects/[projectId]/
│   │   │   └── chief/           # Chief AI chat interface
│   │   └── layout.tsx           # Sidebar + header shell
│   ├── (public)/                # Unauthenticated routes
│   │   └── w/                   # Worker QR flows
│   ├── api/
│   │   └── chief/run/route.ts  # Claude SDK endpoint
│   ├── layout.tsx
│   ├── globals.css              # CSS variables + Tailwind
│   └── favicon.ico
├── components/
│   ├── ui/                      # ShadCN primitives (28 components)
│   ├── shared/                  # Cross-module components
│   ├── layout/                  # AppShell, PageHeader, etc.
│   ├── chief/                   # Chief chat components
│   ├── worker/                  # Mobile worker simulator
│   └── [module]/                # Module-specific (defects/, swms/, etc.)
├── convex/
│   ├── _generated/              # Auto-generated (DO NOT EDIT)
│   ├── schema.ts                # Database schema (52 tables)
│   ├── [domain].ts              # API functions per domain
│   ├── domains/                 # Service/repo/DTO layers
│   │   └── [domain]/
│   │       ├── service.ts       # Business logic
│   │       ├── repo.ts          # Data access
│   │       ├── dto.ts           # Enrichment functions
│   │       └── validators.ts    # Validation constants
│   └── lib/                     # Backend utilities
│       ├── errors.ts            # Structured error handling
│       ├── time.ts              # ISO timestamp helpers
│       ├── patch.ts             # Patch utilities
│       ├── share_code.ts        # QR code generation
│       ├── audit.ts             # Audit logging
│       └── media.ts             # File/media helpers
├── hooks/
│   ├── use-[entity].ts          # Convex query/mutation hooks
│   └── worker/screens/          # Mobile screen hooks (51 hooks)
├── lib/
│   ├── constants.ts             # Status/priority configs
│   ├── utils.ts                 # Shared utilities
│   ├── logger.ts                # Structured logging
│   └── types/                   # Shared TypeScript types
├── .claude/
│   ├── CLAUDE.md                # Global Chief instructions (~500 lines)
│   └── skills/                  # Domain-specific skills (~15 skills)
│       ├── database-read/
│       │   ├── SKILL.md
│       │   └── references/
│       │       └── schema-ref.md
│       ├── database-write/
│       │   ├── SKILL.md
│       │   └── references/
│       │       └── mutation-patterns.md
│       ├── domain-defects/
│       │   ├── SKILL.md
│       │   └── references/
│       │       ├── workflows.md
│       │       └── status-logic.md
│       ├── domain-swms/
│       │   ├── SKILL.md
│       │   └── references/
│       │       ├── templates.md
│       │       └── compliance.md
│       └── [skill-name]/
│           ├── SKILL.md
│           └── references/
├── mcp-server-convex/           # MCP server for Chief
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.ts                 # Entry point
│   ├── server.ts                # MCP server implementation
│   └── tools/                   # MCP tool definitions
│       ├── db-read.ts
│       ├── db-write.ts
│       └── undo.ts
└── public/
    └── chief-avatar.png
```

## Coding Standards

### TypeScript
- **Strict Mode**: Required in `tsconfig.json`
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `strictFunctionTypes: true`
- **No `any`**: Use `unknown` instead
- **Inference**: Let TypeScript infer when obvious
- **Patterns**:
  - Interfaces for objects
  - Types for unions/aliases
  - Const assertions for constants
  - Use generated `Id<'table'>` and `Doc<'table'>` types from Convex

#### Nested Object Props Pattern

When components receive enriched entities (DTOs from backend):

```tsx
interface EntityCardProps {
  projectId: Id<'projects'>;
  entity: {
    _id: Id<'entities'>;
    // Core fields from table
    title: string;
    status: string;
    // Enriched fields from DTO
    creatorName: string;
    photoUrls?: string[];
    commentCount: number;
  };
  // Component-specific props
  selected?: boolean;
  onSelect?: (id: Id<'entities'>, selected: boolean) => void;
}
```

**Why**: Props match DTO shape directly, clear which fields are enriched vs core.

#### Event Handler Pattern (Nested Clickables)

```tsx
export function EntityCard({ entity, onSelect, onClick }) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(entity._id, !selected);
  };

  const handleCardClick = () => {
    onClick?.(entity._id);
  };

  return (
    <div onClick={handleCardClick}>
      <div onClick={handleCheckboxClick}>
        <Checkbox />
      </div>
    </div>
  );
}
```

#### Inline Helper Components

When component needs small reusable piece used ONLY within that file:

```tsx
// NOT exported
function HelperComponent({ prop1, prop2 }: {
  prop1: string;
  prop2: boolean;
}) {
  return <div>...</div>;
}

export function MainComponent({ ... }: MainComponentProps) {
  return (
    <div>
      <HelperComponent prop1="value" prop2={true} />
    </div>
  );
}
```

**When to use**: Helper used 3+ times within same file, <50 lines, NOT reusable across files.

#### Component-Local Utilities

```tsx
// Above component, NOT exported
function formatDueDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function MyComponent({ ... }) {
  const formatted = formatDueDate(entity.dueDate);
  // ...
}
```

**When to use**: Function used 2+ times in same component, <20 lines, component-specific.

#### Async Event Handlers

```tsx
const handleAsyncAction = useCallback(async (item: Item) => {
  setIsLoading(true);
  try {
    const result = await processItem(item);
    setData(prev => prev.map(d =>
      d.id === item.id ? { ...d, ...result } : d
    ));
    if (item.tempUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.tempUrl);
    }
  } catch (error) {
    console.error('Action failed:', error);
  } finally {
    setIsLoading(false);
  }
}, []);
```

**Rules**: Wrap in useCallback, handle errors, set loading states, clean up resources.

### React/Next.js
- **Server Components by Default**: Use `'use client'` only when:
  - Using hooks (useState, useEffect, etc.)
  - Using browser APIs
  - Handling events
- **Server vs Client Boundaries**:
  - Server Components: Data fetching, direct database access, sensitive logic
  - Client Components: Interactivity, browser APIs, state management
  - Keep boundary minimal: wrap only interactive parts in `'use client'`
- **Component Structure** (400-500 line max):
  1. Imports
  2. Types (component-specific)
  3. Component
     - Hooks
     - Derived values
     - Event handlers
     - Effects
     - Early returns
     - Render
  4. Helper functions
- **Performance**:
  - `useMemo` for expensive computations
  - `useCallback` for callbacks passed to children
  - `memo` for expensive renders
  - Lazy load heavy components: `const PDFViewer = lazy(() => import('@/components/pdf-viewer'))`
- **Error Boundaries**:
  ```tsx
  'use client';

  export function ErrorBoundary({ children }: { children: React.ReactNode }) {
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
      const handler = (error: ErrorEvent) => {
        console.error('Error caught:', error);
        setHasError(true);
      };
      window.addEventListener('error', handler);
      return () => window.removeEventListener('error', handler);
    }, []);

    if (hasError) {
      return <div>Something went wrong</div>;
    }

    return children;
  }
  ```
- **Lazy Loading with Suspense**:
  ```tsx
  const PDFViewer = lazy(() => import('@/components/pdf-viewer'));

  export function DocumentView() {
    return (
      <Suspense fallback={<div>Loading PDF...</div>}>
        <PDFViewer url={pdfUrl} />
      </Suspense>
    );
  }
  ```

### Convex
- **Schema Patterns**:
  - Every table: `orgId: v.id('orgs')` (required)
  - Every table: `projectId: v.id('projects')` (required)
  - Optional fields: `v.optional(v.id('tableName'))`
  - Enums: `v.union(v.literal('value1'), v.literal('value2'))`
  - Metadata: `metadata: v.optional(v.any())` for extensibility
- **Index Patterns**:
  - Always: `.index('by_project', ['projectId'])`
  - Status filtering: `.index('by_project_status', ['projectId', 'status'])`
  - Public access: `.index('by_shareCode', ['shareCode'])`, `.index('by_qrCode', ['qrCode'])`
  - Polymorphic: `.index('by_source', ['sourceType', 'sourceId'])`
- **Query Patterns**:
  - Start with indexed query: `ctx.db.query('defects').withIndex('by_project', q => q.eq('projectId', args.projectId))`
  - Use `withIndex`, avoid `.filter()` for projectId
  - Collect results: `.collect()` or `.first()`
  - Enrich with related data (parallel `Promise.all`)
- **Mutation Patterns**:
  1. Validate entity exists
  2. Get org ID from project
  3. Insert/patch record
  4. Return ID
- **Service/Repo/DTO Layers** (use when business logic > 50 lines):
  - **Service**: Business logic, workflows, validation
    - **Helper function placement**: Pure functions first, async helpers next
  - **Repo**: Data access only (getById, listByX, insert, patch, delete)
  - **DTO**: Enrichment functions (toEntityListItem minimal, toEntityDetail full)
- **Service Layer Error Handling**:
  ```typescript
  // convex/domains/defects/service.ts
  import { throwNotFound, throwValidation } from '@/convex/lib/errors';

  export async function create(ctx: MutationCtx, args: CreateDefectArgs) {
    // Validate
    if (!args.title?.trim()) {
      throwValidation('title', 'Title is required');
    }

    // Check existence
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throwNotFound('Project', args.projectId);
    }

    // Business logic
    const defectId = await ctx.db.insert('defects', {
      ...args,
      orgId: project.orgId,
      status: 'open',
    });

    return defectId;
  }
  ```
- **Convex Lib Directory Patterns**:
  - `errors.ts`: Structured error helpers (throwNotFound, throwValidation, etc.)
  - `time.ts`: ISO timestamp utilities
  - `patch.ts`: Patch operation helpers
  - `share_code.ts`: QR code generation
  - `audit.ts`: Audit logging utilities
  - `media.ts`: File/media handling
- **API File Structure Conventions**:
  ```typescript
  // convex/defects.ts
  import { mutation, query } from './_generated/server';
  import { v } from 'convex/values';
  import * as defectService from './domains/defects/service';
  import { DEFECT_STATUS, DEFECT_PRIORITY } from './domains/defects/validators';

  export const list = query({
    args: { projectId: v.id('projects') },
    handler: async (ctx, args) => defectService.list(ctx, args)
  });

  export const create = mutation({
    args: {
      projectId: v.id('projects'),
      title: v.string(),
      status: DEFECT_STATUS,
      priority: DEFECT_PRIORITY,
    },
    handler: async (ctx, args) => defectService.create(ctx, args)
  });
  ```
- **Validators Pattern (DRY Enums)**:
  ```typescript
  // convex/domains/defects/validators.ts
  import { v } from 'convex/values';

  export const DEFECT_STATUS = v.union(
    v.literal('open'),
    v.literal('in_progress'),
    v.literal('resolved'),
    v.literal('closed')
  );

  export const DEFECT_PRIORITY = v.union(
    v.literal('low'),
    v.literal('medium'),
    v.literal('high'),
    v.literal('critical')
  );
  ```

  **Benefits**: Single source of truth, type-safe, easier to add new values.

### Claude SDK (Chief AI Layer)
- **MCP Tools**: Use MCP for ALL database access (not direct Convex)
  - `db_read`: Query with automatic projectId filtering
  - `db_write`: Create/update/delete with undo capability
  - `undo`: Reverse changesets
- **MCP Tool Implementation Details**:
  ```typescript
  // mcp-server-convex/tools/db-read.ts
  export const dbReadTool = {
    name: 'db_read',
    description: 'Query Convex database with automatic scope filtering',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string' },
        filters: { type: 'object' },
        projectId: { type: 'string' }
      },
      required: ['table', 'projectId']
    }
  };
  ```
- **Skills System**:
  - Global: `.claude/CLAUDE.md` (~500 lines, always loaded)
  - Domain-specific: `.claude/skills/[name]/SKILL.md` (loaded on demand)
  - References: `.claude/skills/[name]/references/*.md`
- **Subagents Pattern**:
  - **Orchestrator**: Opus (complex reasoning, multi-step planning)
  - **Analyzer**: Opus (deep analysis, pattern detection)
  - **Validator**: Sonnet (pattern matching, compliance checks)
  - **Writer**: Sonnet (structured output, documentation)
  - **Query handler**: Haiku (simple/fast reads, no side effects)

  **When to use**:
  - Single agent: Simple CRUD, status checks
  - Orchestrator + Specialist: Complex workflows requiring multiple steps
  - Parallel specialists: Independent tasks that can run concurrently
- **API Route Pattern**: `app/api/chief/run/route.ts`
  ```typescript
  export const runtime = 'edge';

  export async function POST(req: Request) {
    const { message, projectId } = await req.json();

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process with Claude SDK
    const result = await processMessage(message, projectId);

    // Stream response as SSE
    await writer.write(
      new TextEncoder().encode(`data: ${JSON.stringify(result)}\n\n`)
    );

    return new Response(stream.readable, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  }
  ```

## File Naming Conventions

- **Components**: kebab-case (`defect-card.tsx`)
- **Pages**: `page.tsx`
- **Layouts**: `layout.tsx`
- **Hooks**: `use-[name].ts` (camelCase with `use` prefix)
- **Types**: kebab-case (`defect-types.ts`)
- **Constants**: kebab-case (`status-constants.ts`)
- **Backend API**: kebab-case (`defects.ts`)
- **Skills**: kebab-case folder (`domain-defects/`)
- **MCP Tools**: snake_case (`db_read.ts`)

## Code Naming Conventions

- **Types/Interfaces**: PascalCase (`DefectCardProps`)
- **Components**: PascalCase (`DefectCard`)
- **Functions**: camelCase (`createDefect`)
- **Variables**: camelCase (`defectList`)
- **Constants (value)**: SCREAMING_SNAKE (`DEFECT_STATUSES`)
- **Constants (type)**: PascalCase (`DefectStatus`)
- **Hooks**: camelCase with `use` prefix (`useDefects`)
- **Event Handlers**: camelCase with `handle` prefix (`handleSubmit`)
- **Boolean Vars**: camelCase with `is`/`has` prefix (`isLoading`, `hasPermission`)
- **Private Functions**: camelCase with `_` prefix (`_calculateTotal`)
- **MCP Tools**: snake_case (`db_read`, `db_write`)

## Import Order (ESLint Enforced)

```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. External packages (alphabetical)
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 3. Internal API
import { api } from '@/convex/_generated/api';

// 4. Internal Lib
import { DEFECT_STATUSES } from '@/lib/constants';
import { logger } from '@/lib/logger';

// 5. Internal Components
import { StatusBadge } from '@/components/shared/status-badge';
import { DefectCard } from '@/components/defects/defect-card';

// 6. Relative imports
import { calculateTotal } from './utils';

// 7. Types (ALWAYS last with 'type' keyword)
import type { DefectCardProps } from './types';
import type { Id } from '@/convex/_generated/dataModel';
```

**Rules**:
- Blank line between groups
- External alphabetical
- Internal grouped by category
- Types always last with `type` keyword
- Prefer absolute imports (`@/`) over relative

## Testing Standards

### Structure
- Co-located: `defect-card.test.tsx` next to `defect-card.tsx`
- Storybook optional: `defect-card.stories.tsx`

### Pattern
```typescript
describe('DefectCard', () => {
  const mockDefect = {
    _id: 'def_123' as Id<'defects'>,
    title: 'Test Defect',
    status: 'open' as const,
    // ...
  };

  it('renders defect title', () => {
    render(<DefectCard defect={mockDefect} />);
    expect(screen.getByText('Test Defect')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const handleEdit = jest.fn();
    render(<DefectCard defect={mockDefect} onEdit={handleEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalledWith('def_123');
  });
});
```

### What to Test
- Component renders
- Props displayed correctly
- User interactions
- Conditional rendering
- Event handlers called

### Don't Test
- Third-party libraries
- Implementation details
- Styling (unless critical to functionality)

## Git Standards

### Branch Naming
```
feature/add-defect-bulk-assign
fix/swms-signature-validation
chore/update-dependencies
docs/api-documentation
refactor/service-layer-extraction
test/defect-card-coverage
```

### Commit Format (Conventional Commits)
```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`

**Examples**:
```
feat(defects): add bulk status change
fix(swms): validate signature before submit
chore(deps): upgrade Next.js to 16.0.1
```

### PR Process

**Steps**:
1. Create feature branch from main
2. Make changes following standards
3. Write tests for new functionality
4. Run `npm run lint` and fix issues
5. Run `npm test` and ensure all pass
6. Push branch and create PR
7. Request review from team
8. Address feedback and merge

**Title**: Same as commit format

**Description Template**:
```markdown
## Summary
[Brief description]

## Changes
- Changed X
- Added Y
- Removed Z

## Test Plan
1. Steps to test
2. Expected results

## Screenshots
[If UI changes]
```

## Accessibility (WCAG AA)

### Requirements
- All interactive elements keyboard accessible
- Tab order logical
- ARIA labels on icon buttons: `<Button aria-label="Edit defect" />`
- Color contrast 4.5:1+ (all text meets this)
- Focus indicators visible: `focus-visible:ring-2 ring-brand/25 ring-offset-1`
- Screen reader announcements: `role="alert"` for errors

### Checklist
- [ ] Can navigate with Tab/Shift+Tab
- [ ] Can activate with Enter/Space
- [ ] Focus visible on all interactive elements
- [ ] Icon buttons have `aria-label`
- [ ] Form errors have `aria-invalid` and `role="alert"`
- [ ] Color not sole indicator (use text/icons)
- [ ] Touch targets 44×44px minimum (mobile)

### WCAG AA Code Examples

**Icon buttons**:
```tsx
<Button aria-label="Delete defect" variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
</Button>
```

**Form errors**:
```tsx
<Input
  aria-invalid={!!error}
  aria-describedby={error ? 'error-message' : undefined}
/>
{error && (
  <p id="error-message" role="alert" className="text-sm text-red-600">
    {error}
  </p>
)}
```

**Loading states**:
```tsx
<div role="status" aria-live="polite">
  {isLoading ? 'Loading...' : `${items.length} items found`}
</div>
```

## Performance Standards

### Targets
- Page bundle: < 200 KB gzipped
- Initial load: < 1 MB
- Lighthouse score: > 90
- **File size: Max 500 lines per file**

### File Size Management

**Max file size: 500 lines**

If file exceeds 500 lines:
- Split component into sub-components
- Extract logic to custom hooks
- Extract helpers to utils
- Move business logic to service layer

### Strategies
- Lazy load routes: automatic with App Router
- Tree-shake imports: import specific components only
- Dynamic imports: `const PDFViewer = lazy(() => import('@/components/pdf-viewer'))`
- Next.js Image: always use `<Image>` from `next/image`
- Minimize re-renders: `useMemo`, `useCallback`, `memo`
- **Avoid inline object creation in render**:
  ```tsx
  // ❌ Bad - creates new object every render
  <Component config={{ value: 1 }} />

  // ✅ Good - memoized
  const config = useMemo(() => ({ value: 1 }), []);
  <Component config={config} />
  ```

### Bundle Analysis
```bash
npm run build
# Check .next/analyze for bundle breakdown
```

## Separation of Concerns

### Boundaries
1. **Frontend (React)**: Uses hooks, not direct Convex
2. **Backend (Convex)**: Service/repo/DTO layers
3. **AI Layer (Claude SDK)**: Uses MCP, not direct Convex
4. **Shared (constants, types)**: Imported by both

### Pattern Examples

**Frontend**:
```typescript
// ✅ Good - uses hook
const defects = useDefects(projectId);

// ❌ Bad - direct Convex import
import { api } from '@/convex/_generated/api';
const defects = useQuery(api.defects.list, { projectId });
```

**Backend**:
```typescript
// ✅ Good - thin API wrapper calls service
export const create = mutation({
  handler: async (ctx, args) => {
    return await defectService.create(ctx, args);
  }
});

// ❌ Bad - business logic in API
export const create = mutation({
  handler: async (ctx, args) => {
    // 50+ lines of validation/logic here
  }
});
```

**AI Layer**:
```typescript
// ✅ Good - uses MCP tools
await use_mcp_tool({
  server: "convex",
  tool: "db_read",
  arguments: { table: "defects", filters: { projectId } }
});

// ❌ Bad - direct Convex import in skill
import { api } from '@/convex/_generated/api';
```

## CSS/Styling Standards

### CSS Variables (All Colors)
```css
/* app/globals.css */
:root {
  /* Core */
  --background: #efefeb;        /* Warm off-white viewport */
  --card: #ffffff;              /* Panel background */
  --foreground: #212121;        /* Near-black text */
  --brand: #f97316;             /* Orange accent */
  --border: #e5e5e1;
  --ring: color-mix(in oklab, var(--brand) 65%, white);

  /* Status (50+ variants) */
  --status-open-bg: #fef5f5;
  --status-open-text: #b44343;
  --status-in-progress-bg: #fdf8ef;
  --status-in-progress-text: #a16520;
  --status-completed-bg: #f0f7f4;
  --status-completed-text: #1e6b52;
  /* ... 47 more status variants */

  /* Priority */
  --priority-low-bg: #f0f7f4;
  --priority-low-text: #1e6b52;
  --priority-medium-bg: #fdf8ef;
  --priority-medium-text: #a16520;
  --priority-high-bg: #fef5f5;
  --priority-high-text: #b44343;
  --priority-critical-bg: #fef5f5;
  --priority-critical-text: #b44343;
}
```

### Tailwind Conventions
**Order** (logical grouping):
1. Layout (flex, grid, position)
2. Spacing (p-, m-, gap-)
3. Sizing (w-, h-, max-, min-)
4. Background & border
5. Text
6. Effects (shadow, opacity, transition)
7. State variants (hover:, focus:, dark:)

**Example**:
```tsx
<div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow">
```

### No Module CSS
Use only:
- Tailwind utility classes
- CSS variables (defined in `globals.css`)
- ShadCN component styles

## Domain Standards

### Construction-Specific
- WHS regulations (Australian standards)
- Trade workflows (carpenter, electrician, etc.)
- Site operations (toolbox meetings, sign-on/off)
- Risk assessment (likelihood × consequence matrix)
- Hierarchy of controls (elimination → substitution → engineering → administrative → PPE)

### Compliance Standards
- Audit trails required (all mutations logged)
- Audit-ready documentation: 100%
- Verification workflows (pending → verified → rejected)
- Expiry alerts (configurable warning days)
- Signature capture with tamper detection (SHA256 hash)

### Documentation Standards
- Structured sections (SWMS: 12 sections, Induction: 4 content block types)
- Version control (previousVersionId pattern)
- PDF generation (signed documents with verification QR)
- Chunking for RAG (~500 tokens per chunk, 50 token overlap)

### Quality Standards
- Zero expired certifications: 100%
- Zero missed inspections: 100%
- Zero overdue corrective actions: >95%
- Response times: <1s simple queries, <3s complex analysis
- Actions execute immediately when approved (no "processing" delays)

## Validation Standards

### Phase-Based Validation
**Phase 1** (Can Chief monitor, identify, send follow-up? Can user undo?):
- MCP tools work
- Scope enforcement blocks cross-project access
- Undo system reverses changesets

**Phase 2** (Does Chief progress from asking to auto-executing?):
- Approval rate >80%
- Trust progression metrics tracked
- Autonomy levels per action type

**Phase 3** (Does Chief surface issues before user notices?):
- Morning brief eliminates dashboard checking
- Proactive vs reactive ratio >60%

**Phase 4** (Does Chief adapt? Time saved >10 hours/week?):
- Company-specific patterns learned
- Context-aware responses
- Performance optimization (<1s responses)

## Error Handling Standards

### Structured Errors
```typescript
// convex/lib/errors.ts
export const throwNotFound = (entity: string, id: string) => {
  throw new Error(`${entity} not found: ${id}`);
};

export const throwValidation = (field: string, message: string) => {
  throw new Error(`Validation failed: ${field} - ${message}`);
};

export const throwForbidden = (action: string) => {
  throw new Error(`Forbidden: ${action}`);
};

export const throwConflict = (message: string) => {
  throw new Error(`Conflict: ${message}`);
};
```

### Error Codes
- `NOT_FOUND`: Entity doesn't exist
- `VALIDATION`: Input validation failed
- `FORBIDDEN`: Insufficient permissions
- `CONFLICT`: Business rule violation
- `SCOPE_VIOLATION`: Cross-project access attempted
- `UNDO_TOO_OLD`: Changeset >24hrs
- `MCP_CONNECTION_FAILED`: MCP server unreachable

### Logging Standards
```typescript
import { logger } from '@/lib/logger';

// Info (normal operations)
logger.info('Created defect', {
  module: 'Defects',
  defectId,
  projectId
});

// Error (unrecoverable)
logger.error('Failed to create defect', error, {
  module: 'Defects',
  input: args,
  projectId
});

// Warn (recoverable)
logger.warn('Overdue checklist', {
  module: 'Checklists',
  checklistId,
  dueDate
});
```

**Rules**:
- Don't use `console.log`
- Don't log sensitive data (passwords, tokens)
- Always include `module` field
- Include entity IDs for traceability

## Configuration Standards

### ESLint (Flat Config)
```javascript
// eslint.config.mjs
export default [
  ...nextVitals,
  ...typescript,
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    ignores: ['app/api/**'],
    rules: {
      // Prevent direct Convex usage in UI
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: '@/convex/_generated/api',
            message: 'UI must not import Convex generated api. Use hooks/** adapter hooks.'
          },
          {
            name: 'convex/react',
            message: 'UI must not call Convex hooks directly. Use hooks/** adapter hooks.'
          }
        ],
        patterns: [{
          group: ['@/convex/_generated/api'],
          message: 'Use hooks instead of direct Convex imports in components'
        }]
      }]
    }
  }
];
```

### Prettier Configuration
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### TypeScript
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### PostCSS (Tailwind v4)
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};
```

### VS Code
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "\"([^\"]*)\""]
  ]
}
```

## Migration Strategy

### Current State (Pre-Rebuild)
- OpenAI Agents SDK
- ChatKit widgets
- Custom `lib/ai/engine/`
- `components/chief-chatkit/`

### Target State (Rebuild)
- Claude Agents SDK
- ShadCN components
- MCP server (`mcp-server-convex/`)
- `.claude/skills/` system

### Migration Checklist
- [ ] Add Claude SDK dependencies
- [ ] Create `mcp-server-convex/` with tools
- [ ] Convert tools to MCP format
- [ ] Replace ChatKit with ShadCN Chief components
- [ ] Update `app/api/chief/run/route.ts`
- [ ] Transform `.claude/skills/` directory
- [ ] Remove OpenAI dependencies

### Migration Approach
1. **New Code First**: All new files follow standards
2. **Touch Once**: Bring file up to standards when editing
3. **Module by Module**: Refactor one domain at a time

## Key Principles

### Convention Over Configuration
- One obvious way to do things
- Standardized patterns everywhere
- Reduce decision fatigue

### AI-First Codebase
- Predictable patterns for AI agents
- Consistent naming
- Clear separation of concerns
- Progressive disclosure (simple inline, complex extracted)

### Separation of Concerns
- Frontend uses hooks (not direct Convex)
- Backend has service/repo/DTO layers
- AI uses MCP (not direct Convex)
- Shared constants/types imported by both

### Progressive Disclosure
- **Simple (inline)**: <20 lines, obvious logic
- **Medium (extract helper)**: 20-100 lines, reusable function
- **Complex (extract file)**: 100-300 lines, separate module
- **Very Complex (split module)**: >300 lines, multiple focused files

## Status/Priority Color System

### Status Colors (50+ Variants)
**Workflow**: open, in-progress, completed, closed, cancelled, resolved, todo
**Approval**: draft, pending, approved, rejected, expired, archived
**Asset**: active, available, assigned, inactive, maintenance, disposed
**Inspection**: not-started, passed, failed, skipped
**Schedule**: planned, delayed
**Incident**: under-investigation

**Pattern**: `--status-{key}-bg` and `--status-{key}-text`

**Usage**:
```typescript
// lib/constants.ts
export const DEFECT_STATUSES = {
  open: { label: 'Open', cssVar: 'status-open' },
  in_progress: { label: 'In Progress', cssVar: 'status-in-progress' },
  completed: { label: 'Completed', cssVar: 'status-completed' }
} as const;

export type DefectStatus = keyof typeof DEFECT_STATUSES;
```

```tsx
// components/shared/status-badge.tsx
<span
  style={{
    backgroundColor: `rgb(var(--${cssVar}-bg))`,
    color: `rgb(var(--${cssVar}-text))`
  }}
  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
>
  {label}
</span>
```

### Priority Colors
**Levels**: low, medium, high, urgent, critical

**Pattern**: `--priority-{key}-bg` and `--priority-{key}-text`

## Barrel Exports (Required)

Every module folder MUST have `index.ts`:

```typescript
// components/defects/index.ts
export { DefectCard } from './defect-card';
export { DefectForm } from './defect-form';
export { DefectDetail } from './defect-detail';
export { DefectTable } from './defect-table';

export type { DefectCardProps } from './types';
export type { DefectFormData } from './types';
```

**Benefits**:
- Single import point: `import { DefectCard } from '@/components/defects'`
- Easy to see public API
- Easier to refactor internals

## Comments & Documentation

### When to Comment
- Complex algorithms (non-obvious logic)
- Non-obvious workarounds (explain why, not what)
- Public APIs (JSDoc with `@param`, `@returns`, `@throws`)
- Regex patterns (explain intent)
- Magic numbers (why this value?)

### When NOT to Comment
- Obvious code (don't state the obvious)
- Every line (code should be self-documenting)
- Instead of refactoring (clean code > comments)

**Examples**:
```tsx
// ❌ Bad comment - states the obvious
// Set the title to the value
setTitle(value);

// ❌ Bad comment - instead, refactor
// Check if user is admin
if (user.role === 'admin' || user.permissions.includes('admin')) {
  // Better: extract to function isAdmin(user)
}

// ✅ Good - explains non-obvious behavior
// QR code must be exactly 8 chars for compatibility with legacy scanners
const qrCode = generateCode(8);
```

### JSDoc for Public APIs
```typescript
/**
 * Creates a new defect record
 * @param ctx - Convex context
 * @param args - Defect creation arguments
 * @returns Newly created defect ID
 * @throws {Error} If validation fails or project not found
 * @example
 * const defectId = await defectService.create(ctx, {
 *   projectId: 'proj_123',
 *   title: 'Cracked tile',
 *   priority: 'high'
 * });
 */
export async function create(
  ctx: MutationCtx,
  args: CreateDefectArgs
): Promise<Id<'defects'>> {
  // ...
}
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-22
**Maintained By**: Development Team + Claude
**Related Documents**: `architecture.md`, `schema.md`, `ai-system.md`
