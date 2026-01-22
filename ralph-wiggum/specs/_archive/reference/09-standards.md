# 09 - Standards Specification

> Coding conventions, file structure, naming patterns, development standards for PRJ Construction rebuild.

---

## 1. Purpose & Scope

### What This Document Covers

This specification defines ALL coding and organizational standards for the PRJ Construction rebuild:

- **Directory structure** - Complete folder layout from root to leaf
- **File naming conventions** - kebab-case, PascalCase, camelCase rules
- **Code organization patterns** - Component structure, barrel exports, layering
- **TypeScript conventions** - Type definitions, inference, generics, strict mode
- **React/Next.js patterns** - Component structure, hooks, Server/Client components
- **Convex patterns** - Schema definition, queries, mutations, service/repo/DTO layer
- **CSS/styling standards** - CSS variables, Tailwind conventions, no hardcoded colors
- **Claude SDK patterns** - Skills, subagents, MCP tools
- **Testing standards** - Unit tests, integration tests, test structure
- **Git workflow** - Branch naming, commit messages, PR process
- **Documentation standards** - Code comments, README structure, JSDoc patterns

### What This Does NOT Cover

- **Business logic** - See 03-domain-model.md for entity definitions and relationships
- **Technical architecture** - See 02-architecture.md for system topology and data flow
- **UI design tokens** - See 06-ui-system.md for colors, spacing, typography
- **AI system prompts** - See 05-ai-system.md for Chief architecture

### Success Criteria

Standards are effective when:
1. **AI agents** can generate code that follows patterns without additional context
2. **Humans** can navigate codebase and predict file locations intuitively
3. **Consistency** is maintained across all 4+ modules and 50+ submodules
4. **Refactoring** is safe because patterns are predictable
5. **Onboarding** is fast because conventions are documented and enforced

---

## 2. Overview

PRJ Construction uses **convention over configuration** to reduce decision fatigue and enable AI-first development.

### Design Philosophy

**AI-First Codebase**
Code structured for AI agents to read, understand, and modify. Predictable patterns, consistent naming, clear separation of concerns.

**Convention Over Configuration**
One obvious way to do things. If there's a pattern, follow it. If there's no pattern, create one and document it here.

**Progressive Disclosure**
Simple cases are simple (CRUD form = 50 lines). Complex cases are possible (SWMS builder = 300 lines split into focused files).

**Separation of Concerns**
Clear boundaries:
- **Frontend** (React components) never imports Convex API directly (use hooks)
- **Backend** (Convex) has service/repo/DTO layers (no business logic in API files)
- **AI Layer** (Claude SDK) uses MCP for database access (not direct Convex calls)
- **Shared** (constants, types) imported by both but depends on neither

---

## 3. Core Concepts

### Concept 1: Convention Over Configuration

**Problem**: Every file/folder decision creates cognitive load. Multiply by 100 components, 50 API files, 52 tables.

**Solution**: Standardized patterns. Components go in `components/<module>/`, API in `convex/<domain>.ts`, types in `lib/types/<domain>.ts`.

**Example**:
```
Need defect form? → components/defects/defect-form.tsx
Need defect API? → convex/defects.ts
Need defect types? → lib/types/defects.ts (or inline in component)
```

### Concept 2: AI-First Codebase

**Problem**: AI agents need context to generate correct code. If patterns vary, agents make mistakes.

**Solution**: Predictable structure. All forms look similar. All cards look similar. All API mutations follow same validation → insert → return pattern.

**Example**:
AI sees one form component, learns the pattern, applies to 20 other forms without errors.

### Concept 3: Separation of Concerns

**Problem**: Mixed responsibilities = hard to test, hard to change, hard to understand.

**Solution**: Clear layers.

**Frontend**:
```tsx
// ✅ Component uses hook
const defects = useDefects(projectId);

// ❌ Component imports Convex directly
import { api } from '@/convex/_generated/api';
const defects = useQuery(api.defects.listByProject, { projectId });
```

**Backend**:
```tsx
// ✅ Thin API wrapper calls service
export const create = mutation({
  handler: async (ctx, args) => {
    return await createDefect(ctx, args);
  },
});

// ❌ Business logic in API file
export const create = mutation({
  handler: async (ctx, args) => {
    // 200 lines of validation, calculations, side effects...
  },
});
```

**AI Layer**:
```tsx
// ✅ Claude SDK uses MCP tools
await use_mcp_tool({
  server: "convex",
  tool: "db_read",
  arguments: { table: "defects", filters: { projectId } }
});

// ❌ AI layer imports Convex directly
import { api } from '@/convex/_generated/api';
```

### Concept 4: Progressive Disclosure

**Problem**: Simple use cases shouldn't require understanding complex abstractions.

**Solution**: Inline for simple, extract for complex.

**Example**:
- **Simple card** (20 lines) → inline component
- **Complex form** (300 lines) → split into form + field groups + validation
- **Simple type** (3 fields) → inline interface
- **Shared type** (used in 5+ places) → `lib/types/`

---

## 4. Detailed Specification

### 4.1 Directory Structure

#### Current State vs. Target State

**NOTE:** This spec shows TARGET architecture after Claude SDK migration. See Section 4.19 for current state and migration path.

#### Target Directory Structure (Post-Migration)

```
/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx                # Root layout (providers, fonts)
│   ├── globals.css               # CSS variables (status/priority colors)
│   ├── favicon.ico               # Site icon
│   │
│   ├── (platform)/               # Authenticated routes (layout with sidebar)
│   │   ├── layout.tsx            # Platform layout (sidebar, header)
│   │   │
│   │   ├── dashboard/            # Dashboard page
│   │   │   └── page.tsx
│   │   │
│   │   ├── projects/             # Project routes
│   │   │   ├── page.tsx          # Projects list
│   │   │   └── [projectId]/      # Project detail routes
│   │   │       ├── page.tsx      # Project overview
│   │   │       ├── layout.tsx    # Project layout (tabs)
│   │   │       ├── defects/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── swms/
│   │   │       ├── schedule/
│   │   │       ├── diary/
│   │   │       ├── incidents/
│   │   │       ├── permits/
│   │   │       ├── inductions/
│   │   │       ├── toolbox/
│   │   │       ├── checklists/
│   │   │       ├── assets/
│   │   │       ├── workers/
│   │   │       └── ...           # 27 module pages total
│   │   │
│   │   └── orgs/                 # Organization routes
│   │       └── [orgId]/
│   │           ├── settings/
│   │           │   └── page.tsx
│   │           └── chief/        # Chief chat interface
│   │               └── page.tsx
│   │
│   ├── (public)/                 # Public routes (no auth required)
│   │   ├── layout.tsx            # Minimal layout
│   │   └── w/                    # Worker flows (QR code access)
│   │       ├── signin/[code]/
│   │   │       │   └── page.tsx
│   │       ├── swms/[code]/
│   │       │   └── page.tsx
│   │       ├── induction/[code]/
│   │       │   └── page.tsx
│   │       ├── checklist/[code]/
│   │       │   └── page.tsx
│   │       └── ...
│   │
│   └── api/                      # API routes (webhooks, integrations)
│       └── chief/
│           └── run/
│               └── route.ts      # Chief execution endpoint

├── components/                   # React components
│   │
│   ├── ui/                       # ShadCN primitives (base components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   └── ...                   # ~30 primitives
│   │
│   ├── shared/                   # Cross-module reusable components
│   │   ├── entity-card.tsx       # Generic card pattern
│   │   ├── status-badge.tsx      # Status badge with CSS vars
│   │   ├── priority-badge.tsx    # Priority badge
│   │   ├── data-table.tsx        # Table with sorting/filtering
│   │   ├── file-upload.tsx       # File upload widget
│   │   ├── signature-pad.tsx     # Signature canvas
│   │   ├── photo-gallery.tsx     # Photo grid
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── sidebar.tsx           # Main sidebar
│   │   ├── header.tsx            # Top header
│   │   ├── project-tabs.tsx      # Project navigation tabs
│   │   └── breadcrumbs.tsx       # Breadcrumb navigation
│   │
│   ├── chief/                    # Chief AI interface components (ShadCN)
│   │   ├── chat-container.tsx    # Main chat UI
│   │   ├── chat-message.tsx      # Message bubble
│   │   ├── chat-input.tsx        # Input with attachments
│   │   ├── operation-card.tsx    # Operation suggestions
│   │   ├── changeset-card.tsx    # Undo/changeset display
│   │   └── ...
│   │
│   ├── worker/                   # Worker simulator components
│   │   ├── worker-shell.tsx      # Mobile frame
│   │   ├── worker-nav.tsx        # Bottom navigation
│   │   ├── screens/              # Screen components
│   │   │   ├── tasks-screen.tsx
│   │   │   ├── swms-screen.tsx
│   │   │   ├── incidents-screen.tsx
│   │   │   └── ...               # ~20 screens
│   │   └── index.ts
│   │
│   └── [module]/                 # Module-specific components
│       ├── index.ts              # Barrel export (REQUIRED)
│       ├── [module]-dashboard.tsx
│       ├── [module]-card.tsx
│       ├── [module]-form.tsx
│       ├── [module]-detail.tsx
│       └── ...
│
│       Examples:
│       ├── defects/
│       │   ├── index.ts
│       │   ├── defect-dashboard.tsx
│       │   ├── defect-card.tsx
│       │   ├── defect-form.tsx
│       │   ├── defect-detail.tsx
│       │   └── defect-photo-grid.tsx
│       │
│       ├── swms/
│       │   ├── index.ts
│       │   ├── swms-dashboard.tsx
│       │   ├── swms-builder.tsx
│       │   ├── swms-section-editor.tsx
│       │   └── ...               # 13 section editors
│       │
│       ├── checklists/
│       ├── schedule/
│       ├── incidents/
│       ├── permits/
│       ├── inductions/
│       ├── assets/
│       └── ...                   # 20+ modules

├── convex/                       # Convex backend
│   │
│   ├── _generated/               # Auto-generated (DO NOT EDIT)
│   │   ├── api.d.ts
│   │   ├── dataModel.d.ts
│   │   └── server.d.ts
│   │
│   ├── schema.ts                 # Database schema (source of truth)
│   │
│   ├── [domain].ts               # Public API functions (thin wrappers)
│   │                             # Examples:
│   ├── defects.ts                # export const { list, get, create, update, delete }
│   ├── swms.ts
│   ├── checklists.ts
│   ├── schedule.ts
│   ├── incidents.ts
│   ├── permits.ts
│   ├── workers.ts
│   ├── projects.ts
│   └── ...                       # ~30 domain files
│   │
│   ├── domains/                  # Domain logic (service/repo/dto pattern)
│   │   └── [domain]/
│   │       ├── service.ts        # Business logic layer
│   │       ├── repo.ts           # Data access layer
│   │       ├── dto.ts            # Data transfer objects
│   │       └── validators.ts     # Reusable Convex validators
│   │
│   │       Examples:
│   │       ├── defects/
│   │       │   ├── service.ts    # createDefect, assignDefect, resolveDefect
│   │       │   ├── repo.ts       # getDefectById, listByProject, updateStatus
│   │       │   ├── dto.ts        # DefectWithPhotos, DefectSummary
│   │       │   └── validators.ts # DEFECT_STATUS, DEFECT_PRIORITY
│   │       │
│   │       ├── swms/
│   │       ├── checklists/
│   │       ├── schedule/
│   │       └── ...               # ~25 domains
│   │
│   └── lib/                      # Backend-only shared utilities
│       ├── errors.ts             # Structured error handling
│       ├── time.ts               # ISO timestamp helpers
│       ├── patch.ts              # Patch utilities
│       └── ...

├── hooks/                        # React hooks
│   ├── use-defects.ts            # useDefects, useDefect, useCreateDefect
│   ├── use-swms.ts
│   ├── use-checklists.ts
│   ├── use-schedule.ts
│   ├── use-workers.ts
│   └── ...
│   │
│   └── worker/                   # Worker simulator hooks
│       └── screens/
│           ├── use-tasks-screen.ts
│           ├── use-swms-screen.ts
│           └── ...

├── lib/                          # Shared utilities
│   │
│   ├── constants.ts              # Enums, status definitions, nav items
│   ├── utils.ts                  # cn() helper, formatters, validators
│   ├── logger.ts                 # Structured logging
│   │
│   ├── types/                    # Shared TypeScript types (UI-only)
│   │   ├── defects.ts
│   │   ├── swms.ts
│   │   ├── checklists.ts
│   │   └── ...
│   │
│   └── ai/                       # AI system code (Claude SDK integration)
│       ├── types.ts              # AI-specific types
│       ├── operations.ts         # Operation definitions
│       └── utils.ts              # AI helpers

├── .claude/                      # Claude Code configuration
│   ├── CLAUDE.md                 # Global instructions (always loaded)
│   └── skills/                   # Skill definitions
│       ├── database-write/
│       │   ├── SKILL.md          # Skill instructions
│       │   └── references/       # Reference docs (loaded on demand)
│       │       ├── schema.md
│       │       └── validation.md
│       ├── swms-creator/
│       │   ├── SKILL.md
│       │   └── references/
│       ├── defect-manager/
│       ├── schedule-planner/
│       └── ...                   # ~15 skills

├── mcp-server-convex/            # MCP server for database access
│   ├── package.json              # Server dependencies
│   ├── tsconfig.json             # Server TypeScript config
│   ├── index.ts                  # Server entry point
│   ├── server.ts                 # MCP server implementation
│   └── tools/                    # MCP tool implementations
│       ├── db-read.ts            # Database read tool
│       ├── db-write.ts           # Database write tool (with changesets)
│       ├── undo.ts               # Undo last changeset
│       └── list-operations.ts    # List available operations

├── public/                       # Static assets
│   ├── images/
│   └── icons/

├── .env.local                    # Environment variables (not committed)
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── pnpm-lock.yaml                # Lockfile
└── README.md                     # Project overview
```

#### Current Directory Structure (Pre-Migration)

**Migration Note:** Current structure differs. See gaps below for actual vs. target.

**Key differences:**
- `lib/ai/` uses OpenAI Agents SDK (to be replaced)
- `lib/chatkit-adapter/` exists (to be removed)
- `app/` routes not fully organized into (platform)/(public) structure yet
- `components/chief-chatkit/` exists (to be replaced with `components/chief/`)
- `mcp-server-convex/` does NOT exist yet
- `.claude/` has ADW system, not skill structure documented above

**See Section 4.19 for full migration mapping.**

### 4.2 File Naming Conventions

| Type | Convention | Example | Rule |
|------|------------|---------|------|
| **Components** | kebab-case | `defect-form.tsx` | All lowercase, hyphens separate words |
| **Pages** | page.tsx in folder | `app/projects/[id]/page.tsx` | Next.js convention |
| **Layouts** | layout.tsx in folder | `app/(platform)/layout.tsx` | Next.js convention |
| **Hooks** | use-[name].ts | `use-defects.ts` | React convention |
| **Types (shared)** | kebab-case | `lib/types/defects.ts` | Matches domain name |
| **Constants** | kebab-case | `lib/constants.ts` | Single file for all |
| **Utilities** | kebab-case | `lib/utils.ts` | Lowercase |
| **Backend (API)** | kebab-case | `convex/defects.ts` | Matches table name (singular) |
| **Backend (domain)** | service/repo/dto.ts | `convex/domains/defects/service.ts` | Fixed pattern |
| **Skills** | kebab-case folder | `.claude/skills/database-write/` | Lowercase with hyphens |
| **MCP tools** | kebab-case | `mcp-server-convex/tools/db-read.ts` | Lowercase |
| **CSS files** | globals.css only | `app/globals.css` | No module CSS |

### 4.3 Naming Conventions (Code)

| Type | Convention | Example | Context |
|------|------------|---------|---------|
| **Types/Interfaces** | PascalCase | `DefectStatus` | TypeScript types |
| **Components** | PascalCase | `DefectCard` | React components |
| **Functions** | camelCase | `createDefect` | All functions |
| **Variables** | camelCase | `defectList` | All variables |
| **Constants (value)** | SCREAMING_SNAKE | `DEFECT_STATUSES` | Constant objects/arrays |
| **Constants (type)** | PascalCase | `DefectStatus` | Type derived from constant |
| **Hooks** | camelCase (use prefix) | `useDefects` | React hooks |
| **Event handlers** | camelCase (handle prefix) | `handleSubmit` | Event handlers |
| **Boolean vars** | camelCase (is/has prefix) | `isLoading`, `hasError` | Boolean variables |
| **Async functions** | camelCase (no prefix) | `createDefect` | No "async" prefix needed |
| **Private functions** | camelCase (underscore prefix) | `_validateInput` | Internal helpers |
| **MCP tools** | snake_case | `db_read`, `db_write` | MCP convention |

### 4.4 Import Order

**Strict order (enforced by ESLint):**

```tsx
// 1. React (if used)
import { useState, useEffect, useMemo } from 'react';

// 2. External packages (alphabetical)
import { useQuery, useMutation } from 'convex/react';
import { formatDistance } from 'date-fns';

// 3. Internal absolute imports - API (@ alias)
import { api } from '@/convex/_generated/api';

// 4. Internal absolute imports - Lib
import { DEFECT_STATUSES, DEFECT_PRIORITIES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

// 5. Internal absolute imports - Components
import { DefectCard } from '@/components/defects';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// 6. Relative imports (if needed, prefer absolute)
import { helper } from './utils';

// 7. Types (ALWAYS last, ALWAYS with 'type' keyword)
import type { Defect } from '@/lib/types/defects';
import type { Id } from '@/convex/_generated/dataModel';
```

**Rules:**
- Blank line between each group
- External packages alphabetical
- Internal imports grouped by category (API, lib, components)
- Types always last with `type` keyword (for type-only imports)
- Prefer absolute imports over relative (exception: co-located helpers)

### 4.5 Component File Structure

**Standard pattern for ALL components:**

```tsx
// components/defects/defect-card.tsx

// 1. Imports (see 4.4 for order)
import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/utils';
import type { Defect } from '@/lib/types/defects';

// 2. Types (component-specific only, if needed)
interface DefectCardProps {
  defect: Defect;
  onEdit?: () => void;
  onDelete?: () => void;
}

// 3. Component
export function DefectCard({ defect, onEdit, onDelete }: DefectCardProps) {
  // 3a. Hooks (state, queries, mutations)
  const [isExpanded, setIsExpanded] = useState(false);

  // 3b. Derived values (memoized if expensive)
  const isOverdue = new Date(defect.dueDate) < new Date();
  const statusColor = DEFECT_STATUSES[defect.status].cssVar;

  // 3c. Event handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  // 3d. Effects (if needed)
  // useEffect(...);

  // 3e. Early returns (loading/error states)
  // if (isLoading) return <Skeleton />;
  // if (error) return <Error />;

  // 3f. Render
  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{defect.title}</h3>
          <StatusBadge status={defect.status} />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {defect.description}
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={handleEdit}>Edit</Button>
            {onDelete && (
              <Button size="sm" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// 4. Helper functions (if needed, prefer extracting to separate file)
// function helper() { ... }
```

**Max file size: 500 lines**
If component exceeds 500 lines:
- Extract sub-components to separate files
- Extract complex logic to custom hooks
- Extract helpers to utils file

#### 4.5.1 Nested Object Props Pattern

When components receive enriched entities (DTOs from backend):

**Use nested object interface:**
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

**Why:**
- Props match DTO shape directly
- Clear which fields are enriched vs core
- No need to define separate type (inline is clearer)
- Easier to refactor when DTO changes

#### 4.5.2 Event Handler Pattern (Nested Clickables)

When component has clickable parent + clickable children:

```tsx
export function EntityCard({ entity, onSelect, onClick }) {
  // Handler for nested element (stops propagation)
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(entity._id, !selected);
  };

  // Parent click handler
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

**Why stopPropagation:**
- Prevents card click when clicking checkbox
- Allows nested interactive elements
- Common in list items with actions

#### 4.5.3 Inline Helper Components

When a component needs a small reusable piece used ONLY within that file:

**Pattern:**
```tsx
// components/[module]/[component].tsx

// 1. Inline helper component (NOT exported)
function HelperComponent({ prop1, prop2 }: {
  prop1: string;
  prop2: boolean;
}) {
  return <div>...</div>;
}

// 2. Main component (exported)
export function MainComponent({ ... }: MainComponentProps) {
  return (
    <div>
      <HelperComponent prop1="value" prop2={true} />
      <HelperComponent prop1="other" prop2={false} />
    </div>
  );
}
```

**When to use:**
- Helper used 3+ times within same file
- Helper is <50 lines
- Helper is NOT reusable across files
- Extracting reduces duplication

**When NOT to use:**
- Helper used in multiple files → extract to separate file
- Helper is >50 lines → extract to separate file
- Helper is generic → move to components/shared/

**Examples:**
- ChipButton in form (category/priority selection)
- TableRow in dashboard (repeated row structure)
- FieldGroup in form (label + input + error)

#### 4.5.4 Component-Local Utilities

Small utility functions used only within one component:

**Pattern:**
```tsx
// components/[module]/[component].tsx

// 1. Utility functions (NOT exported, above component)
function formatDueDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

async function convertImageFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || 'image/png' });
}

// 2. Component
export function MyComponent({ ... }) {
  const formatted = formatDueDate(entity.dueDate);
  // ...
}
```

**When to use:**
- Function used 2+ times in same component
- Function is component-specific logic
- Function is <20 lines
- NOT generic utility (then use lib/utils.ts)

**When to extract:**
- Used in multiple components → lib/utils/[module].ts
- Generic formatter → lib/utils/format-*.ts
- Complex logic → separate file in same folder

#### 4.5.5 Async Event Handlers

When event handlers need to perform async operations:

**Pattern:**
```tsx
export function MyComponent({ ... }) {
  const [data, setData] = useState<Data[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use useCallback for async handlers
  const handleAsyncAction = useCallback(async (item: Item) => {
    // 1. Optional: Set loading state
    setIsLoading(true);

    try {
      // 2. Perform async operations
      const result = await processItem(item);
      const transformed = await transformResult(result);

      // 3. Update state
      setData(prev => prev.map(d =>
        d.id === item.id ? { ...d, ...transformed } : d
      ));

      // 4. Cleanup (if needed)
      if (item.tempUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(item.tempUrl);
      }
    } catch (error) {
      console.error('Action failed:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, []);  // Dependencies

  return <Button onClick={() => handleAsyncAction(item)}>Process</Button>;
}
```

**Rules:**
- Wrap in `useCallback` to prevent re-renders
- Add dependencies to useCallback deps array
- Handle errors with try/catch
- Set loading states if operation is slow
- Clean up resources (URLs, subscriptions)
- Use functional setState for updates based on prev state

### 4.6 Barrel Exports (REQUIRED)

**Every module folder MUST have index.ts:**

```tsx
// components/defects/index.ts

// Export all public components from this module
export { DefectDashboard } from './defect-dashboard';
export { DefectCard } from './defect-card';
export { DefectForm } from './defect-form';
export { DefectDetail } from './defect-detail';
export { DefectPhotoGrid } from './defect-photo-grid';

// Export types (use 'export type' keyword)
export type { DefectFilters } from './defect-filters';
export type { DefectSortBy } from './defect-dashboard';

// Do NOT export internal helpers or sub-components
// These should be imported directly if needed:
// import { InternalHelper } from '@/components/defects/internal-helper';
```

**Why:**
- Single import point: `import { DefectCard, DefectForm } from '@/components/defects'`
- Easy to see public API of module
- Easier to refactor internal structure

**Import from barrel:**
```tsx
// ✅ Import from barrel
import { DefectCard, DefectForm } from '@/components/defects';

// ❌ Import from individual files
import { DefectCard } from '@/components/defects/defect-card';
import { DefectForm } from '@/components/defects/defect-form';
```

**Rules:**
- Use `export type` for type-only exports
- Export types used by consumers
- Don't export internal types
- Types must be defined in source file (not re-exported from elsewhere)

### 4.7 TypeScript Conventions

#### 4.7.1 Type Definitions

**Interfaces for objects:**
```tsx
// ✅ Use interface for object shapes
interface Defect {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: DefectStatus;
  priority: DefectPriority;
  createdAt: string;
  updatedAt: string;
}

// ✅ Extend interfaces
interface DefectWithPhotos extends Defect {
  photos: Photo[];
}
```

**Types for unions/aliases:**
```tsx
// ✅ Use type for unions
type DefectStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// ✅ Use type for complex unions
type FilterValue = string | number | boolean | string[];

// ✅ Use type for function signatures
type CreateDefectFn = (args: CreateDefectArgs) => Promise<string>;
```

**Const assertions for constants:**
```tsx
// ✅ Const assertion preserves literal types
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
type Priority = typeof PRIORITIES[number]; // 'low' | 'medium' | 'high' | 'critical'

// ✅ Const object with typed values
export const DEFECT_STATUSES = {
  open: { label: 'Open', cssVar: 'status-open' },
  in_progress: { label: 'In Progress', cssVar: 'status-in-progress' },
  resolved: { label: 'Resolved', cssVar: 'status-resolved' },
  closed: { label: 'Closed', cssVar: 'status-closed' },
} as const;

export type DefectStatus = keyof typeof DEFECT_STATUSES;
```

#### 4.7.2 Convex Types

**Use generated types:**
```tsx
import type { Id, Doc } from '@/convex/_generated/dataModel';

// ✅ Reference table ID
type DefectId = Id<'defects'>;

// ✅ Reference table document
type DefectDoc = Doc<'defects'>;

// ✅ Use in function signatures
function processDefect(defectId: Id<'defects'>) {
  // ...
}
```

#### 4.7.3 Type Inference

**Let TypeScript infer when obvious:**
```tsx
// ✅ Infer obvious types
const count = 5; // number
const name = 'John'; // string
const isActive = true; // boolean

// ✅ Infer from function return
const defect = await ctx.db.get(args.defectId); // Doc<'defects'> | null

// ✅ Explicit when ambiguous
const statuses: DefectStatus[] = ['open', 'closed'];
```

**Explicit types when needed:**
```tsx
// ✅ Component props
interface DefectCardProps {
  defect: Defect;
  onEdit?: () => void;
}

// ✅ Function parameters
function createDefect(args: CreateDefectArgs): Promise<string> {
  // ...
}

// ✅ State with initial null/undefined
const [defect, setDefect] = useState<Defect | null>(null);
```

#### 4.7.4 Avoid

```tsx
// ❌ NEVER use 'any'
function process(data: any) {}

// ✅ Use 'unknown' and narrow
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // ...
  }
}

// ❌ Don't use 'object'
function handle(obj: object) {}

// ✅ Be specific
function handle(obj: Record<string, unknown>) {}
function handle(obj: { id: string; name: string }) {}

// ❌ Don't disable strict checks without reason
// @ts-ignore

// ✅ Fix the type error or document why it's safe
// @ts-expect-error - External library has incorrect types
```

#### 4.7.5 Strict Mode

**tsconfig.json must have:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### 4.8 React & Next.js Patterns

#### 4.8.1 Server vs Client Components

**Default: Server Components**
```tsx
// app/projects/[projectId]/defects/page.tsx
// ✅ Server component (default, no 'use client')

export default function DefectsPage({ params }: { params: { projectId: string } }) {
  // Server component can directly query database
  // (In our case, we use Convex hooks in client components instead)
  return <DefectDashboard projectId={params.projectId} />;
}
```

**Client Components (when needed):**
```tsx
// components/defects/defect-form.tsx
'use client'; // ✅ Mark as client component when using hooks/interactivity

import { useState } from 'react';
import { useMutation } from 'convex/react';

export function DefectForm() {
  const [formData, setFormData] = useState({});
  const createDefect = useMutation(api.defects.create);
  // ...
}
```

**When to use 'use client':**
- Component uses React hooks (useState, useEffect, etc.)
- Component uses browser APIs (localStorage, window, etc.)
- Component uses Convex hooks (useQuery, useMutation)
- Component has event handlers (onClick, onChange, etc.)

#### 4.8.2 Data Fetching Patterns

**Use custom hooks for Convex queries:**
```tsx
// hooks/use-defects.ts
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export function useDefects(projectId: Id<'projects'>) {
  return useQuery(api.defects.listByProject, { projectId });
}

export function useDefect(defectId: Id<'defects'>) {
  return useQuery(api.defects.get, { defectId });
}

export function useCreateDefect() {
  return useMutation(api.defects.create);
}

export function useUpdateDefect() {
  return useMutation(api.defects.update);
}

export function useDeleteDefect() {
  return useMutation(api.defects.delete);
}
```

**Use hooks in components:**
```tsx
// components/defects/defect-dashboard.tsx
'use client';

import { useDefects, useCreateDefect } from '@/hooks/use-defects';

export function DefectDashboard({ projectId }: { projectId: string }) {
  const defects = useDefects(projectId);
  const createDefect = useCreateDefect();

  if (!defects) return <div>Loading...</div>;

  return (
    <div>
      {defects.map(defect => (
        <DefectCard key={defect._id} defect={defect} />
      ))}
    </div>
  );
}
```

#### 4.8.3 Performance Optimization

**Memoization:**
```tsx
import { useMemo, useCallback } from 'react';

// ✅ Memoize expensive computations
const sortedDefects = useMemo(() =>
  defects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [defects]
);

// ✅ Memoize callbacks passed to children
const handleEdit = useCallback((id: string) => {
  router.push(`/defects/${id}/edit`);
}, [router]);

// ✅ Memoize components with expensive renders
const MemoizedDefectCard = memo(DefectCard);
```

**Lazy loading:**
```tsx
// ✅ Lazy load heavy components
const PDFViewer = lazy(() => import('@/components/pdf-viewer'));

function DocumentPage() {
  return (
    <Suspense fallback={<div>Loading PDF viewer...</div>}>
      <PDFViewer document={document} />
    </Suspense>
  );
}
```

#### 4.8.4 Error Handling

**Error boundaries:**
```tsx
// components/shared/error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Component error', error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 bg-red-50 rounded">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <DefectDashboard projectId={projectId} />
</ErrorBoundary>
```

### 4.9 Convex Backend Patterns

#### 4.9.1 Schema Definition

```tsx
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  defects: defineTable({
    // Foreign keys (always required)
    orgId: v.id('orgs'),
    projectId: v.id('projects'),

    // Core fields
    title: v.string(),
    description: v.optional(v.string()),

    // Enums (use union of literals)
    status: v.union(
      v.literal('open'),
      v.literal('in_progress'),
      v.literal('resolved'),
      v.literal('closed')
    ),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    ),

    // Optional foreign keys
    assignedTo: v.optional(v.id('workers')),

    // Metadata (always include)
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.optional(v.id('workers')),
  })
    // Indexes for queries
    .index('by_org', ['orgId'])
    .index('by_project', ['projectId'])
    .index('by_project_status', ['projectId', 'status'])
    .index('by_assignee', ['assignedTo']),
});
```

**Index patterns:**
- `by_org` - Filter by organization (always include for multi-tenant)
- `by_project` - Filter by project (most common query)
- `by_project_status` - Composite index for filtered lists
- `by_assignee` - Filter by assignee

#### 4.9.2 Query Pattern

```tsx
// convex/defects.ts (public API)
import { query } from './_generated/server';
import { v } from 'convex/values';

export const listByProject = query({
  args: {
    projectId: v.id('projects'),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Start with indexed query
    let q = ctx.db
      .query('defects')
      .withIndex('by_project', q => q.eq('projectId', args.projectId));

    // Apply filters
    if (args.status) {
      q = q.filter(q => q.eq(q.field('status'), args.status));
    }
    if (args.priority) {
      q = q.filter(q => q.eq(q.field('priority'), args.priority));
    }

    // Collect results
    const defects = await q.collect();

    // Enrich with related data (if needed)
    return Promise.all(defects.map(async (defect) => {
      const assignee = defect.assignedTo
        ? await ctx.db.get(defect.assignedTo)
        : null;

      return {
        ...defect,
        assignee,
      };
    }));
  },
});

export const get = query({
  args: { defectId: v.id('defects') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.defectId);
  },
});
```

#### 4.9.3 Mutation Pattern

```tsx
// convex/defects.ts (public API)
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.string(),
    assignedTo: v.optional(v.id('workers')),
  },
  handler: async (ctx, args) => {
    // 1. Validate project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // 2. Get org ID from project
    const orgId = project.orgId;

    // 3. Insert record
    const defectId = await ctx.db.insert('defects', {
      orgId,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      priority: args.priority,
      assignedTo: args.assignedTo,
      status: 'open', // Default status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 4. Return ID
    return defectId;
  },
});

export const update = mutation({
  args: {
    defectId: v.id('defects'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id('workers')),
  },
  handler: async (ctx, args) => {
    const { defectId, ...updates } = args;

    // 1. Validate defect exists
    const defect = await ctx.db.get(defectId);
    if (!defect) {
      throw new Error('Defect not found');
    }

    // 2. Update record
    await ctx.db.patch(defectId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return defectId;
  },
});

export const remove = mutation({
  args: { defectId: v.id('defects') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.defectId);
  },
});
```

#### 4.9.4 Service/Repo/DTO Layer (for complex logic)

**When to use:**
- Business logic > 50 lines
- Shared logic across multiple API functions
- Complex validation or calculations
- Multi-step workflows

**Structure:**
```
convex/domains/defects/
├── service.ts    # Business logic
├── repo.ts       # Data access
├── dto.ts        # Data transfer objects
└── validators.ts # Reusable Convex validators
```

**Validators (DRY Enums):**
```tsx
// convex/domains/defects/validators.ts
import { v } from 'convex/values';

// Export validators for reuse
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

**Import in API functions:**
```tsx
// convex/defects.ts
import { DEFECT_STATUS, DEFECT_PRIORITY } from './domains/defects/validators';

export const create = mutation({
  args: {
    status: DEFECT_STATUS,
    priority: DEFECT_PRIORITY,
  },
  handler: async (ctx, args) => { ... }
});
```

**When to use:**
- Enum used in 3+ API functions
- Enum shared between query args and mutation args
- Enum needs to match schema exactly

**Benefits:**
- Single source of truth
- Type-safe across API surface
- Easier to add new enum values

**Service (business logic):**
```tsx
// convex/domains/defects/service.ts
import { query, mutation } from '../../_generated/server';
import type { Id } from '../../_generated/dataModel';
import * as repo from './repo';

// Constants and flows at top
const DEFECT_STATUS_FLOW: Record<DefectStatus, DefectStatus[]> = {
  open: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed'],
  closed: [],
};

// Helper functions
function isValidStatusTransition(current: DefectStatus, next: DefectStatus) {
  if (current === next) return true;
  return DEFECT_STATUS_FLOW[current]?.includes(next);
}

async function nextDefectNumber(ctx: MutationCtx, projectId: Id<'projects'>): Promise<number> {
  const existingDefects = await repo.listDefectsByProject(ctx, projectId);
  return existingDefects.length === 0 ? 1 : Math.max(...existingDefects.map(d => d.defectNumber || 0)) + 1;
}

// Public service functions
export async function createDefect(
  ctx: QueryCtx | MutationCtx,
  args: CreateDefectArgs
): Promise<Id<'defects'>> {
  // 1. Validate
  const project = await ctx.db.get(args.projectId);
  if (!project) throw new Error('Project not found');

  // 2. Business logic
  const priority = determinePriority(args);
  const assignee = await autoAssignDefect(ctx, args.projectId);

  // 3. Create record
  const defectId = await repo.createDefect(ctx, {
    ...args,
    priority,
    assignedTo: assignee,
    orgId: project.orgId,
  });

  // 4. Side effects
  await notifyAssignee(ctx, defectId, assignee);

  return defectId;
}

function determinePriority(args: CreateDefectArgs): Priority {
  // Complex priority logic...
}

async function autoAssignDefect(ctx: any, projectId: string) {
  // Find least busy worker...
}
```

**Helper function rules:**
- Pure functions first (validation, calculation)
- Async helpers next (auto-number, lookups)
- Not exported (internal to service)
- Named clearly (verb + noun)
- Used by multiple service functions

**Repo (data access):**
```tsx
// convex/domains/defects/repo.ts
import type { QueryCtx, MutationCtx } from '../../_generated/server';
import type { Id, Doc } from '../../_generated/dataModel';

export async function getDefectById(
  ctx: QueryCtx,
  defectId: Id<'defects'>
): Promise<Doc<'defects'> | null> {
  return await ctx.db.get(defectId);
}

export async function listByProject(
  ctx: QueryCtx,
  projectId: Id<'projects'>
): Promise<Doc<'defects'>[]> {
  return await ctx.db
    .query('defects')
    .withIndex('by_project', q => q.eq('projectId', projectId))
    .collect();
}

export async function createDefect(
  ctx: MutationCtx,
  data: DefectData
): Promise<Id<'defects'>> {
  return await ctx.db.insert('defects', {
    ...data,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
```

**Repo function naming:**
- `listXByY` - Query by indexed field Y (returns array)
- `getX` - Get by ID (returns single record or null)
- `insertX` - Create record (returns ID)
- `patchX` - Update record (returns void)
- `deleteX` - Delete record (returns void)

**DTO (enrichment functions):**
```tsx
// convex/domains/defects/dto.ts
import type { Doc } from '../../_generated/dataModel';

// List view (minimal enrichment)
export async function toDefectListItem(ctx: QueryCtx, defect: Doc<'defects'>) {
  // 1. Load related entities
  const creator = await ctx.db.get(defect.createdBy);
  const assignee = defect.assignedTo ? await ctx.db.get(defect.assignedTo) : null;

  // 2. Load counts (not full collections)
  const commentCount = await ctx.db
    .query('comments')
    .withIndex('by_entity', q => q.eq('entityId', defect._id))
    .collect()
    .then(items => items.length);

  // 3. Return spread + enriched fields
  return {
    ...defect,
    creatorName: creator?.fullName || 'Unknown',
    assigneeName: assignee?.name || null,
    commentCount,
  };
}

// Detail view (full enrichment)
export async function toDefectDetail(ctx: QueryCtx, defect: Doc<'defects'>) {
  const creator = await ctx.db.get(defect.createdBy);
  const assignee = defect.assignedTo ? await ctx.db.get(defect.assignedTo) : null;

  // Load full collections for detail view
  const comments = await ctx.db
    .query('comments')
    .withIndex('by_entity', q => q.eq('entityId', defect._id))
    .collect();

  const commentsWithWorkers = await Promise.all(
    comments.map(async (comment) => {
      const worker = await ctx.db.get(comment.workerId);
      return { ...comment, workerName: worker?.fullName || 'Unknown' };
    })
  );

  return {
    ...defect,
    creatorName: creator?.fullName || 'Unknown',
    assigneeName: assignee?.name || null,
    comments: commentsWithWorkers,
  };
}
```

**Rules:**
- **List DTOs**: Minimal enrichment (names, counts)
- **Detail DTOs**: Full enrichment (nested collections)
- **Never return raw Docs**: Always transform via DTO
- **Parallel loading**: Use Promise.all for multiple enrichments

**Performance considerations:**
- **List DTOs** - Minimize joins, limit sub-collections (first N items)
- **Detail DTOs** - Full data okay, but batch queries where possible
- **Use Promise.all()** - Parallelize fetches (photos, comments)
- **Index usage** - Always use indexes for queries (by_defect, by_project)

#### 4.9.5 Error Handling Pattern (Service Layer)

Service layer uses structured error helpers from `convex/lib/errors.ts`:

**Available helpers:**
```tsx
import { throwNotFound, throwValidation, throwForbidden, throwConflict } from '../../lib/errors';

// Not found (404)
if (!entity) throwNotFound('Entity not found', { entityId });

// Validation error (400)
if (!args.title?.trim()) throwValidation('Title is required');

// Forbidden (403)
if (entity.createdBy !== currentUserId) throwForbidden('Cannot edit others\' entities');

// Conflict (409)
if (existingEntity) throwConflict('Entity already exists', { name: args.name });
```

**Error structure:**
```tsx
// convex/lib/errors.ts
export type AppErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'FORBIDDEN' | 'CONFLICT' | 'INTERNAL';

export type AppErrorData = {
  code: AppErrorCode;
  message: string;
  details?: Value;  // Serializable Convex value
};

export function throwNotFound(message = 'Not found', details?: Value): never {
  throw new ConvexError<AppErrorData>({ code: 'NOT_FOUND', message, details });
}
```

**When to use:**
- Service layer only (not repo or API)
- After validation, before mutation
- Include helpful details (IDs, field names)
- Client receives structured error

**Pattern:**
```tsx
export async function update(ctx: MutationCtx, args: UpdateArgs) {
  // 1. Validate entity exists
  const entity = await repo.getEntity(ctx, args.entityId);
  if (!entity) throwNotFound('Entity not found', { entityId: args.entityId });

  // 2. Validate permissions
  if (entity.createdBy !== args.currentUserId) {
    throwForbidden('Cannot edit others\' entities');
  }

  // 3. Validate business rules
  if (args.status === 'closed' && entity.status === 'draft') {
    throwValidation('Cannot close draft entity directly');
  }

  // 4. Execute mutation
  await repo.patchEntity(ctx, args.entityId, updates);
  return args.entityId;
}
```

#### 4.9.6 Convex Lib Directory (Backend Utilities)

**Backend-only utilities in `convex/lib/`:**

```
convex/
├── lib/                        # Backend-only utilities (NOT shared with frontend)
│   ├── errors.ts               # Structured error handling (ConvexError)
│   ├── time.ts                 # ISO timestamp helpers (nowIso, todayIsoDate)
│   ├── patch.ts                # Patch helpers (pickDefined, patchIfAny)
│   ├── share_code.ts           # Share code generation (QR codes)
│   ├── audit.ts                # Audit log helpers (appendAuditLog)
│   └── media.ts                # File/media helpers (createFromUpload)
```

**Key utilities:**

**errors.ts - Structured error handling:**
```tsx
// convex/lib/errors.ts
import { ConvexError, type Value } from 'convex/values';

export type AppErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL';

export type AppErrorData = {
  code: AppErrorCode;
  message: string;
  details?: Value;
};

export function throwNotFound(message = 'Not found', details?: Value): never {
  throw new ConvexError<AppErrorData>({ code: 'NOT_FOUND', message, details });
}

export function throwValidation(message = 'Invalid request', details?: Value): never {
  throw new ConvexError<AppErrorData>({ code: 'VALIDATION', message, details });
}

export function throwForbidden(message = 'Forbidden', details?: Value): never {
  throw new ConvexError<AppErrorData>({ code: 'FORBIDDEN', message, details });
}
```

**time.ts - Timestamp helpers:**
```tsx
// convex/lib/time.ts
export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0]!;
}
```

**patch.ts - Patch helpers:**
```tsx
// convex/lib/patch.ts
export function pickDefined<T extends Record<string, unknown>>(updates: T): Partial<T> {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
}

export function hasAnyKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).length > 0;
}

export async function patchIfAny<T extends Record<string, unknown>>(
  ctx: PatchCtx,
  id: unknown,
  updates: T
): Promise<boolean> {
  const filtered = pickDefined(updates);
  if (!hasAnyKeys(filtered)) return false;
  await ctx.db.patch(id as any, filtered as any);
  return true;
}
```

**Usage:**
```tsx
// convex/domains/defects/service.ts
import { nowIso } from '../../lib/time';
import { throwNotFound } from '../../lib/errors';
import { pickDefined } from '../../lib/patch';

export async function update(ctx: MutationCtx, args: any) {
  const defect = await repo.getDefect(ctx, args.defectId);
  if (!defect) throwNotFound('Defect not found', { defectId: args.defectId });

  const { defectId, ...updates } = args;
  const filteredUpdates = pickDefined(updates);
  await repo.patchDefect(ctx, defectId, {
    ...filteredUpdates,
    updatedAt: nowIso(),
  });
  return defectId;
}
```

**Important:**
- `convex/lib/` utilities are backend-only (NOT imported by frontend)
- Frontend uses `lib/` (root level) for shared utilities
- Convex utilities must use serializable Convex values only

#### 4.9.7 API File Structure

**Header comments:**
```tsx
/**
 * Defects - Quality Assurance Convex functions
 * Defect management with photos, markup, comments, auto-numbering
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import * as defectsService from './domains/defects/service';
```

**Import pattern:**
```tsx
// 1. Convex core
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// 2. Validators (named imports)
import {
  DEFECT_STATUS,
  DEFECT_PRIORITY,
  DEFECT_CATEGORY,
} from './domains/defects/validators';

// 3. Service layer (wildcard import)
import * as defectsService from './domains/defects/service';
```

**Section separators:**
```tsx
// ==========================================
// Queries
// ==========================================

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    return await defectsService.listByProject(ctx, args);
  },
});

// ==========================================
// Mutations
// ==========================================

export const create = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    return await defectsService.create(ctx, args);
  },
});
```

**Clearing optional fields:**
```tsx
export const update = mutation({
  args: {
    defectId: v.id('defects'),
    title: v.optional(v.string()),
    assignedTo: v.optional(v.id('orgs')),

    // Explicit clear flags for optional FKs
    clearAssignedTo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { defectId, clearAssignedTo, ...updates } = args;

    const filteredUpdates = pickDefined(updates);

    // Handle clear flags
    if (clearAssignedTo) filteredUpdates.assignedTo = undefined;

    await repo.patchDefect(ctx, defectId, filteredUpdates);
    return defectId;
  },
});
```

**When to use:**
- Optional foreign keys that can be cleared (assignedTo, parentId, etc.)
- NOT needed for required fields or simple strings (those can be empty string)

### 4.10 Claude SDK & MCP Patterns

**CRITICAL:** This section documents TARGET architecture after Claude SDK migration. Current codebase uses OpenAI Agents SDK. See Section 4.19 for migration path.

#### 4.10.1 Skill Structure

**Every skill follows this structure:**

```
.claude/skills/database-write/
├── SKILL.md              # Skill instructions (loaded on invocation)
└── references/           # Reference docs (loaded on demand)
    ├── schema.md         # Database schema reference
    ├── validation.md     # Validation rules
    └── examples.md       # Common patterns
```

**SKILL.md format:**
```markdown
# Database Write Skill

## Purpose
Write data to Convex database via MCP server with changeset tracking.

## When to Use
- User requests creating/updating/deleting entities
- Workflow requires persisting state
- Operation is reversible (can be undone)

## Tools Available
- `db_write` - Write to database with changeset
- `undo` - Undo last changeset

## Instructions
1. Validate user intent and scope (projectId)
2. Check existing data with db_read if needed
3. Execute db_write with clear changeset description
4. Present result with undo option
5. If error, explain and suggest correction

## Safety Rules
- Always validate projectId scope
- Never write to wrong project
- Provide clear changeset descriptions
- Offer undo for consequential operations

## Examples
[See references/examples.md]
```

#### 4.10.2 MCP Tool Implementation

**Tool naming convention:**
- Use snake_case (MCP convention)
- Descriptive names: `db_read`, `db_write`, `undo`

**Tool implementation pattern:**
```tsx
// mcp-server-convex/tools/db-write.ts
import { McpServer } from '@modelcontextprotocol/sdk/server';
import { ConvexClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

export function registerDbWrite(server: McpServer, convex: ConvexClient) {
  server.tool(
    'db_write',
    'Write data to Convex database with changeset tracking',
    {
      table: {
        type: 'string',
        description: 'Table name (e.g., "defects")',
        required: true,
      },
      operation: {
        type: 'string',
        enum: ['create', 'update', 'delete'],
        description: 'Operation type',
        required: true,
      },
      data: {
        type: 'object',
        description: 'Data to write (structure depends on table)',
        required: true,
      },
      changesetDescription: {
        type: 'string',
        description: 'Human-readable description for undo',
        required: true,
      },
    },
    async (args) => {
      // 1. Validate scope (projectId must be in context)
      const projectId = server.context.get('projectId');
      if (!projectId) {
        throw new Error('No project context. Set projectId first.');
      }

      // 2. Validate table exists
      if (!VALID_TABLES.includes(args.table)) {
        throw new Error(`Invalid table: ${args.table}`);
      }

      // 3. Execute operation
      const result = await convex.mutation(api[args.table][args.operation], {
        ...args.data,
        projectId, // Enforce scope
      });

      // 4. Store changeset for undo
      await convex.mutation(api.changesets.create, {
        table: args.table,
        operation: args.operation,
        recordId: result,
        description: args.changesetDescription,
        projectId,
      });

      return {
        success: true,
        recordId: result,
        changeset: args.changesetDescription,
      };
    }
  );
}
```

#### 4.10.3 API Route Pattern (Claude SDK Integration)

**Target State (Post-Migration):**

**Endpoint: /api/chief/run**

```tsx
// app/api/chief/run/route.ts
import { query } from '@anthropic-ai/client';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'edge'; // ✅ Use edge runtime for streaming

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request
    const { message, projectId, sessionId } = await req.json();

    // 2. Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 3. Call Claude SDK with MCP context
          const result = await query({
            model: 'claude-opus-4-5',
            messages: [{ role: 'user', content: message }],
            mcp: {
              servers: {
                convex: {
                  command: 'node',
                  args: ['./mcp-server-convex/index.js'],
                  env: {
                    CONVEX_URL: process.env.CONVEX_URL!,
                    PROJECT_ID: projectId,
                  },
                },
              },
            },
            stream: true,
            onChunk: (chunk) => {
              // 4. Stream chunks to client
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            },
          });

          // 5. Close stream
          controller.close();
        } catch (error) {
          logger.error('Chief execution error', error, { projectId, sessionId });
          controller.error(error);
        }
      },
    });

    // 6. Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('Chief API error', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

**Pre-Migration Note:** Current implementation uses OpenAI Agents SDK. Pattern above is target after migration.

#### 4.10.4 Subagent Pattern

**When to use subagents:**
- Multi-step workflows (e.g., SWMS creation: template selection → customization → approval → distribution)
- Domain-specific expertise (e.g., safety compliance agent)
- Parallel execution (e.g., multiple incident reports simultaneously)

**Subagent invocation:**
```typescript
// In SKILL.md or agent logic
// Delegate to specialized subagent for complex workflow

// Example: SWMS creation workflow
const swmsAgent = await invokeSubagent('swms-creator', {
  projectId,
  activity: 'Concrete pouring',
  taskContext: {
    location: 'Level 3 slab',
    crew: ['John', 'Mary'],
    equipment: ['Pump truck', 'Vibrator'],
  },
});

// Subagent returns structured result
const { swmsId, requiresApproval, nextSteps } = swmsAgent.result;
```

### 4.11 CSS & Styling Standards

#### 4.11.1 CSS Variables (REQUIRED)

**ALL colors defined in globals.css:**
```css
/* app/globals.css */
@layer base {
  :root {
    /* Status colors - Background */
    --status-open-bg: 255 237 213;        /* orange-100 */
    --status-in-progress-bg: 219 234 254; /* blue-100 */
    --status-resolved-bg: 220 252 231;    /* green-100 */
    --status-closed-bg: 243 244 246;      /* gray-100 */

    /* Status colors - Text */
    --status-open-text: 194 65 12;        /* orange-800 */
    --status-in-progress-text: 30 64 175; /* blue-800 */
    --status-resolved-text: 22 101 52;    /* green-800 */
    --status-closed-text: 31 41 55;       /* gray-800 */

    /* Priority colors */
    --priority-low-bg: 243 244 246;
    --priority-low-text: 107 114 128;
    --priority-medium-bg: 254 249 195;
    --priority-medium-text: 161 98 7;
    --priority-high-bg: 254 226 226;
    --priority-high-text: 153 27 27;
    --priority-critical-bg: 220 38 38;
    --priority-critical-text: 255 255 255;
  }

  .dark {
    /* Dark mode variants... */
  }
}
```

**Usage in components:**
```tsx
// ✅ Use CSS variables
<span style={{
  backgroundColor: `rgb(var(--status-${status}-bg))`,
  color: `rgb(var(--status-${status}-text))`,
}} className="rounded-full px-2.5 py-0.5 text-xs font-medium">
  {label}
</span>

// ❌ NEVER hardcode colors
<span className="bg-orange-100 text-orange-800">
  {label}
</span>
```

#### 4.11.2 Tailwind Conventions

**Logical grouping (enforced by Prettier):**
```tsx
// ✅ Grouped by category
<div className="
  flex items-center justify-between gap-4
  p-4 rounded-lg
  bg-card border border-border
  hover:shadow-md transition-shadow
  text-foreground
">

// ❌ Random order
<div className="border p-4 flex hover:shadow-md bg-card gap-4 rounded-lg text-foreground">
```

**Order:**
1. Layout (flex, grid, position)
2. Spacing (p-, m-, gap-)
3. Sizing (w-, h-, max-, min-)
4. Background & border
5. Text
6. Effects (shadow, opacity, transition)
7. State variants (hover:, focus:, dark:)

#### 4.11.3 No Module CSS

```tsx
// ❌ Do NOT create module CSS files
import styles from './defect-card.module.css';

// ✅ Use Tailwind classes
<div className="p-4 rounded-lg bg-card">

// ✅ Use CSS variables for dynamic colors
<span style={{ backgroundColor: `rgb(var(--status-${status}-bg))` }}>
```

### 4.12 Logging Standards

#### 4.12.1 Logger Usage

```tsx
import { logger } from '@/lib/logger';

// ✅ Info for normal operations
logger.info('Created defect', {
  module: 'Defects',
  defectId,
  projectId,
});

// ✅ Warn for recoverable issues
logger.warn('Retry attempt', {
  module: 'API',
  attempt: 2,
  error: error.message,
});

// ✅ Error with full context
logger.error('Failed to create defect', error, {
  module: 'Defects',
  input: args,
  projectId,
});

// ❌ Don't use console.log
console.log('Created defect');

// ❌ Don't log sensitive data
logger.info('User login', { password: '...' }); // NO!
```

#### 4.12.2 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `debug` | Development only | Detailed state dumps |
| `info` | Normal operations | "Created defect", "User signed in" |
| `warn` | Recoverable errors | Retry attempts, deprecated API usage |
| `error` | Unrecoverable errors | Failed mutations, exceptions |

### 4.13 Testing Standards

#### 4.13.1 File Structure

```
components/defects/
├── defect-card.tsx
├── defect-card.test.tsx       # Unit tests
└── defect-card.stories.tsx    # Storybook (optional)
```

#### 4.13.2 Test Structure

```tsx
// components/defects/defect-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DefectCard } from './defect-card';

// Mock data
const mockDefect = {
  _id: '123',
  title: 'Test Defect',
  description: 'Test description',
  status: 'open',
  priority: 'high',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('DefectCard', () => {
  it('displays defect title', () => {
    render(<DefectCard defect={mockDefect} />);
    expect(screen.getByText('Test Defect')).toBeInTheDocument();
  });

  it('shows status badge', () => {
    render(<DefectCard defect={mockDefect} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('expands on click', () => {
    render(<DefectCard defect={mockDefect} />);
    const card = screen.getByText('Test Defect').closest('div');
    fireEvent.click(card!);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<DefectCard defect={mockDefect} onEdit={onEdit} />);
    const card = screen.getByText('Test Defect').closest('div');
    fireEvent.click(card!);
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
```

#### 4.13.3 What to Test

**Test:**
- Component renders correctly
- Props are displayed
- User interactions work (clicks, form submissions)
- Conditional rendering (loading states, errors)
- Event handlers called correctly

**Don't test:**
- Third-party libraries
- Implementation details
- Styling (unless critical to functionality)

### 4.14 Git Workflow

#### 4.14.1 Branch Naming

```bash
# Feature branches
feature/add-defect-export
feature/swms-signature-pad

# Bug fixes
fix/swms-validation-error
fix/checklist-date-format

# Chores (maintenance, refactor)
chore/update-dependencies
chore/refactor-defect-service

# Documentation
docs/add-api-documentation
docs/update-readme
```

#### 4.14.2 Commit Messages

**Format: Conventional Commits**

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Types:**
| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(defects): add export to PDF` |
| `fix` | Bug fix | `fix(swms): signature validation error` |
| `chore` | Maintenance | `chore: update dependencies` |
| `docs` | Documentation | `docs: add API documentation` |
| `refactor` | Code restructure | `refactor(defects): extract service layer` |
| `test` | Adding tests | `test(defects): add unit tests` |
| `style` | Formatting only | `style: fix linting errors` |

**Example:**
```
feat(defects): add export to PDF functionality

- Implemented PDF generation using Puppeteer
- Added export button to defect detail page
- Includes defect photos in export
- Handles multi-page layouts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**Short commits:**
```
fix(swms): signature validation error

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

#### 4.14.3 Pull Request Process

1. **Create branch** from `main`
2. **Make changes** following standards
3. **Commit** with conventional commit messages
4. **Push** to remote
5. **Create PR** with description
6. **Request review** from team/AI
7. **Address feedback**
8. **Merge** when approved

**PR title format:**
```
feat(defects): Add PDF export functionality
```

**PR description template:**
```markdown
## Summary
- Implemented PDF export for defects
- Added export button to detail page
- Includes photos in export

## Changes
- `components/defects/defect-detail.tsx` - Added export button
- `lib/pdf-export.ts` - New PDF generation utility
- `convex/defects.ts` - Added `getDefectWithPhotos` query

## Test Plan
- [ ] Export single defect with no photos
- [ ] Export defect with multiple photos
- [ ] Verify PDF layout on multi-page defects
- [ ] Test on mobile viewport

## Screenshots
[Attach screenshots if UI changes]

🤖 Generated with Claude Code
```

### 4.15 Documentation Standards

#### 4.15.1 Code Comments

**When to comment:**
- Complex algorithms or business logic
- Non-obvious workarounds
- Public API functions
- Regex patterns
- Magic numbers

**When NOT to comment:**
- Obvious code (don't repeat what code says)
- Every line
- Instead of refactoring unclear code

**Examples:**
```tsx
// ✅ Good comment - explains WHY
// Use setTimeout to avoid race condition with database replication
setTimeout(() => refreshData(), 100);

// ✅ Good comment - explains complex logic
// Calculate priority score: critical = 100, high = 75, medium = 50, low = 25
const priorityScore = PRIORITY_WEIGHTS[defect.priority];

// ❌ Bad comment - states the obvious
// Set the title to the value
setTitle(value);

// ❌ Bad comment - instead, refactor
// Check if user is admin
if (user.role === 'admin' || user.permissions.includes('admin')) {
  // Better: extract to function isAdmin(user)
}
```

#### 4.15.2 JSDoc (for public APIs)

```tsx
/**
 * Creates a new defect in the project.
 *
 * @param projectId - The project to create the defect in
 * @param args - Defect properties (title, description, priority)
 * @returns The ID of the created defect
 * @throws Error if project not found
 *
 * @example
 * const defectId = await createDefect(projectId, {
 *   title: 'Cracked tile',
 *   description: 'Bathroom floor tile is cracked',
 *   priority: 'high',
 * });
 */
export async function createDefect(
  projectId: string,
  args: CreateDefectArgs
): Promise<string> {
  // ...
}
```

#### 4.15.3 README (per module - optional)

```markdown
# Defects Module

## Overview
Manages construction defects from creation to resolution.

## Components
- `DefectDashboard` - List view with filters and search
- `DefectCard` - Summary card for grid display
- `DefectForm` - Create/edit form with photo upload
- `DefectDetail` - Full detail view with photos and comments

## API Functions
- `defects.listByProject` - Query defects by project
- `defects.get` - Get single defect by ID
- `defects.create` - Create new defect
- `defects.update` - Update defect properties
- `defects.delete` - Delete defect

## Hooks
- `useDefects(projectId)` - Load all defects for project
- `useDefect(defectId)` - Load single defect
- `useCreateDefect()` - Create defect mutation
- `useUpdateDefect()` - Update defect mutation

## Status Flow
Open → In Progress → Resolved → Closed

## Priority Levels
- Low (minor cosmetic issues)
- Medium (non-critical functional issues)
- High (significant functional issues)
- Critical (safety hazards, project blockers)
```

### 4.16 Performance Standards

#### 4.16.1 Bundle Size

**Targets:**
- Page bundle: < 200 KB (gzipped)
- Initial load: < 1 MB
- Lighthouse score: > 90

**Strategies:**
- Lazy load routes: `const Page = lazy(() => import('./page'))`
- Tree-shake imports: `import { Button } from '@/components/ui/button'` (not `from '@/components/ui'`)
- Dynamic imports for heavy components
- Image optimization with Next.js Image component

#### 4.16.2 File Size

**Max file size: 500 lines**

If file exceeds 500 lines:
- Split component into sub-components
- Extract logic to custom hooks
- Extract helpers to utils
- Move business logic to service layer

#### 4.16.3 React Performance

**Optimization checklist:**
```tsx
// ✅ Memoize expensive computations
const sorted = useMemo(() => items.sort(...), [items]);

// ✅ Memoize callbacks
const handleClick = useCallback(() => { ... }, [deps]);

// ✅ Memoize components
const MemoCard = memo(DefectCard);

// ✅ Avoid inline object creation
// ❌ Bad
<Component style={{ color: 'red' }} />
// ✅ Good
const style = { color: 'red' };
<Component style={style} />

// ✅ Use keys in lists
{items.map(item => <Item key={item.id} />)}
```

### 4.17 Accessibility Standards

**WCAG AA compliance required:**

```tsx
// ✅ All images have alt text
<img src={photo.url} alt={photo.description || 'Defect photo'} />

// ✅ Icon buttons have labels
<button aria-label="Edit defect">
  <PencilIcon />
</button>

// ✅ Form inputs have labels
<label htmlFor="title">Title</label>
<input id="title" name="title" />

// ✅ Color contrast meets AA (4.5:1 for text)
<span className="text-foreground bg-background">

// ✅ Keyboard navigation works
<button onKeyDown={handleKeyDown}>

// ✅ Focus indicators visible
<button className="focus:ring-2 focus:ring-blue-500">
```

**Checklist:**
- All interactive elements keyboard accessible
- Tab order logical
- ARIA labels on icon-only buttons
- Color contrast meets WCAG AA
- Focus indicators visible
- Screen reader announcements for dynamic content

### 4.18 Config Files

#### 4.18.1 ESLint Configuration

**Project uses ESLint 9 flat config format (`eslint.config.mjs`):**

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "trees/**",
    ".claude/adw/**",
    "public/pdf.worker.mjs",
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react/no-unescaped-entities': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    ignores: ['app/api/**', 'app/convex-provider.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/convex/_generated/api',
              message: 'UI must not import Convex generated api. Use hooks/** adapter hooks.',
            },
            {
              name: 'convex/react',
              message: 'UI must not call Convex hooks directly. Use hooks/** adapter hooks.',
            },
          ],
        },
      ],
    },
  },
]);
```

**Note:** Import order enforcement not yet configured. Add `eslint-plugin-import` to enable.

#### 4.18.2 TypeScript Configuration

**Actual config differs from ideal. Missing strict checks:**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Recommended additions:**
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`

#### 4.18.3 PostCSS Configuration (Tailwind v4)

**Project uses Tailwind CSS v4 via PostCSS:**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Key difference from Tailwind v3:**
- No `tailwind.config.js` file
- No `content` paths to configure
- Configuration done via CSS `@theme` directives in `app/globals.css`

### 4.19 Migration Path (Current State → Target State)

**CRITICAL:** This spec documents TARGET architecture. Current codebase differs significantly.

#### Current Architecture (Pre-Migration)

**AI Stack:**
- `@openai/agents` SDK (v0.3.3) - NOT Claude SDK
- `@openai/chatkit` + `@openai/chatkit-react` - UI layer
- Custom engine wrapper in `lib/ai/engine/`
- Tools in `lib/ai/tools/` (OpenAI Agents SDK format)

**Directory differences:**
- `lib/ai/` uses OpenAI Agents SDK (to be replaced)
- `lib/chatkit-adapter/` exists (to be removed)
- `components/chief-chatkit/` exists (to be replaced)
- `mcp-server-convex/` does NOT exist yet
- `.claude/` has ADW system, not skill structure documented in 4.10

**Dependency conflicts:**
```json
{
  "dependencies": {
    "@openai/agents": "^0.3.3",           // ❌ Remove
    "@openai/chatkit": "1.2.0",           // ❌ Remove
    "@openai/chatkit-react": "1.4.0"      // ❌ Remove
  }
}
```

#### Target Architecture (Post-Migration)

**AI Stack:**
- `@anthropic-ai/claude-agent-sdk` - Claude SDK
- `@modelcontextprotocol/sdk` - MCP server
- ShadCN components for Chief UI (not ChatKit)
- MCP tools in `mcp-server-convex/tools/`

**Directory changes:**
- Create `mcp-server-convex/` directory structure
- Remove `lib/chatkit-adapter/`
- Replace `components/chief-chatkit/` with `components/chief/`
- Transform `.claude/` to skill structure

**Migration checklist:**
1. ✅ Add Claude SDK dependencies
2. ✅ Create `mcp-server-convex/` structure
3. ✅ Convert tools from OpenAI format to MCP format
4. ✅ Replace ChatKit UI with ShadCN Chief components
5. ✅ Update API route to use Claude SDK
6. ✅ Transform `.claude/skills/` to documented pattern
7. ✅ Remove OpenAI dependencies
8. ✅ Remove ChatKit-related code

---

## 5. Relationships & Dependencies

### Feeds Into

| Spec | How Standards Apply |
|------|---------------------|
| **02-architecture.md** | Directory structure maps to layers (frontend/backend/AI) |
| **03-domain-model.md** | Naming conventions for entities, fields, relationships |
| **04-schema.md** | Schema definition patterns, index naming |
| **05-ai-system.md** | Claude SDK patterns, skill structure, MCP tools |
| **06-ui-system.md** | Component patterns, CSS variable usage |
| **07-mobile-demo.md** | Mobile-specific component structure |
| **08-integrations.md** | API route structure, error handling |

### Depends On

| Spec | Dependency |
|------|------------|
| **06-ui-system.md** | CSS variables defined here |
| **03-domain-model.md** | Entity names inform file names |
| **05-ai-system.md** | Claude SDK integration patterns |

---

## 6. Implementation Notes

### 6.1 Enforcement

**ESLint rules:**
```js
// eslint.config.mjs
// See Section 4.18.1 for full config
```

**Prettier config:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Pre-commit hooks:**
Not currently configured. To enable:

1. Install dependencies:
```bash
pnpm add -D husky lint-staged
```

2. Initialize husky:
```bash
pnpm exec husky init
```

3. Add to `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

4. Edit `.husky/pre-commit`:
```bash
pnpm exec lint-staged
```

### 6.2 VS Code Settings

**Recommended extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "lokalise.i18n-ally"
  ]
}
```

**Workspace settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### 6.3 Migration Strategy

**Adopting these standards in existing code:**

1. **New code first** - All new files follow standards immediately
2. **Touch once** - When editing a file, bring it up to standards
3. **Module by module** - Refactor one module at a time
4. **Breaking changes** - Document any breaking changes in migration notes

**Exceptions:**
Document any exceptions inline:
```tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: External API returns unknown shape, type assertion unsafe
const data = response.data as any;
```

---

## 7. Open Questions

### Q1: TypeScript Strict Mode for Existing Code
**Question**: Apply TypeScript strict mode to existing code or only new files?

**Options**:
- Apply to all code immediately (may break existing functionality)
- Apply module by module during refactor
- Only apply to new code

**Recommendation**: Module by module during refactor. Add `// @ts-nocheck` to old files until refactored.

---

### Q2: Test Coverage Requirements
**Question**: What test coverage % is required?

**Options**:
- 80% overall coverage (industry standard)
- 90% for critical paths (defects, SWMS)
- No hard requirement, test what matters

**Recommendation**: No hard requirement. Focus on testing critical user flows and complex business logic.

---

### Q3: Storybook for Component Development
**Question**: Should we use Storybook for component development?

**Options**:
- Required for all shared components
- Optional, use for complex components only
- Skip, not needed for this project size

**Recommendation**: Optional. Use for complex components (SWMS builder, checklist builder) but not required for simple components.

---

### Q4: Monorepo vs Single Repo
**Question**: Should backend, frontend, mobile be in separate repos or monorepo?

**Options**:
- Monorepo (all in one)
- Separate repos (frontend, backend, mobile)

**Recommendation**: Monorepo. Next.js + Convex are tightly coupled. Mobile is simulator, not separate app.

---

## Appendix

### A. ESLint Configuration (Full)

See Section 4.18.1 for current flat config format.

### B. Prettier Configuration (Full)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "proseWrap": "always"
}
```

### C. TypeScript Configuration (Full)

See Section 4.18.2 for current config.

### D. File Templates

#### Component Template
```tsx
// components/[module]/[component-name].tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { Entity } from '@/lib/types/entity';

interface ComponentNameProps {
  entity: Entity;
  onAction?: () => void;
}

export function ComponentName({ entity, onAction }: ComponentNameProps) {
  const [state, setState] = useState<string>('');

  const handleAction = () => {
    onAction?.();
  };

  return (
    <Card>
      {/* Component content */}
    </Card>
  );
}
```

#### Hook Template
```tsx
// hooks/use-[entity].ts
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export function useEntities(projectId: Id<'projects'>) {
  return useQuery(api.entities.listByProject, { projectId });
}

export function useEntity(entityId: Id<'entities'>) {
  return useQuery(api.entities.get, { entityId });
}

export function useCreateEntity() {
  return useMutation(api.entities.create);
}

export function useUpdateEntity() {
  return useMutation(api.entities.update);
}

export function useDeleteEntity() {
  return useMutation(api.entities.delete);
}
```

#### Convex API Template
```tsx
// convex/entities.ts
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('entities')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect();
  },
});

export const get = query({
  args: { entityId: v.id('entities') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.entityId);
  },
});

export const create = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    return await ctx.db.insert('entities', {
      orgId: project.orgId,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: {
    entityId: v.id('entities'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { entityId, ...updates } = args;
    await ctx.db.patch(entityId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return entityId;
  },
});

export const remove = mutation({
  args: { entityId: v.id('entities') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.entityId);
  },
});
```

#### Skill Template
```markdown
# [Skill Name]

## Purpose
[What this skill does in 1-2 sentences]

## When to Use
- [Scenario 1]
- [Scenario 2]
- [Scenario 3]

## Tools Available
- `tool_name` - [Description]
- `other_tool` - [Description]

## Instructions
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Safety Rules
- [Rule 1]
- [Rule 2]

## Examples
[See references/examples.md]
```

---

## Summary

This specification defines ALL coding standards for PRJ Construction rebuild:
- Complete directory structure from root to leaf
- File naming conventions (kebab-case, PascalCase, camelCase)
- Code organization patterns (barrel exports, layering, file structure)
- TypeScript conventions (strict mode, type definitions, inference)
- React/Next.js patterns (Server/Client components, hooks, performance)
- Convex patterns (schema, queries, mutations, service/repo/DTO)
- Claude SDK patterns (skills, MCP tools, subagents)
- CSS/styling standards (CSS variables only, Tailwind conventions)
- Testing standards (structure, what to test)
- Git workflow (branch naming, commit messages, PR process)
- Documentation standards (comments, JSDoc, README)

**Key Principles:**
1. **Convention over configuration** - One obvious way to do things
2. **AI-first codebase** - Predictable patterns for AI agents
3. **Separation of concerns** - Clear boundaries between layers
4. **Progressive disclosure** - Simple cases are simple, complex cases are possible

**Enforcement:**
- ESLint + Prettier for code formatting
- TypeScript strict mode
- Pre-commit hooks (optional, not yet configured)
- Code review checklist

**Critical Changes from Previous:**
- Removed ChatKit exception (now using ShadCN everywhere)
- Added Claude SDK patterns (skills, MCP tools, subagents)
- Added `.claude/` directory structure
- Added `mcp-server-convex/` structure
- Updated AI layer separation of concerns
- Added Section 4.19 documenting current state vs. target (migration path)

**Migration Status:**
- Spec documents TARGET architecture (post-Claude SDK migration)
- Current codebase uses OpenAI Agents SDK + ChatKit
- See Section 4.19 for full migration mapping

**Next Steps:**
- Apply standards to all new code immediately
- Refactor existing code module by module
- Document any exceptions inline
- Update this spec as patterns evolve
