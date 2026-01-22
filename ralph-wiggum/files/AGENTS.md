## Project Structure

```
pcon/
├── ralph-wiggum/           # Ralph orchestration (you are here)
│   ├── files/              # Ralph config files
│   ├── specs/              # Application specifications
│   └── references/         # Reference docs
├── src/                    # Next.js frontend
│   ├── app/                # App Router routes
│   │   ├── (platform)/     # Authenticated routes
│   │   └── (public)/w/     # Public QR flows
│   ├── components/         # React components
│   │   ├── ui/             # ShadCN primitives
│   │   └── [domain]/       # Domain components
│   ├── hooks/              # React hooks
│   └── lib/                # Utilities
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema (52 tables)
│   ├── domains/            # Domain logic
│   │   └── [entity]/       # service.ts, repo.ts, dto.ts
│   └── lib/                # Shared backend utils
└── .claude/                # AI configuration
    └── skills/             # Chief agent skills
```

## Build & Run

```bash
# Install dependencies (from pcon/ root)
npm install

# Start Convex dev server (terminal 1)
npx convex dev

# Start Next.js dev server (terminal 2)
npm run dev
```

## Validation

Run after implementing to get immediate feedback:

```bash
# TypeScript check
npx tsc --noEmit

# Lint
npm run lint

# Convex schema validation (happens on npx convex dev)
npx convex deploy --dry-run

# Full build
npm run build
```

## Chrome E2E Testing (MCP)

For UI verification, use Claude-in-Chrome MCP tools:

```
1. Get tab context: mcp__claude-in-chrome__tabs_context_mcp
2. Create tab: mcp__claude-in-chrome__tabs_create_mcp
3. Navigate: mcp__claude-in-chrome__navigate (url, tabId)
4. Read page: mcp__claude-in-chrome__read_page (tabId)
5. Find elements: mcp__claude-in-chrome__find (query, tabId)
6. Click/type: mcp__claude-in-chrome__computer (action, tabId)
7. Screenshot: mcp__claude-in-chrome__computer (action: screenshot, tabId)
```

Test patterns:
- After implementing UI component → navigate → verify elements exist
- Public QR flows: `/w/[flow]/[code]` → complete flow → verify success
- Forms: fill inputs → submit → verify response

## Codebase Patterns

### Convex
- All tables have `by_project` index
- Use `Id<"tableName">` and `Doc<"tableName">` types
- Validators in `convex/lib/validators.ts` for DRY enums
- Service layer for >50 line logic

### React
- Server Components default, `'use client'` only when needed
- Hooks pattern: `use-[entity].ts` returns `{ data, actions, isLoading }`
- No direct Convex imports in UI (use hooks)

### AI/MCP
- Skills in `.claude/skills/[domain].md`
- All DB access via MCP tools (db_read, db_write, undo)
- projectId auto-injected, cannot override

## Tech Stack Quick Ref

- Frontend: Next.js 16, React 19, TypeScript 5, Tailwind 4, ShadCN
- Backend: Convex (serverless DB + functions)
- AI: Claude SDK, MCP for DB access
- Deploy: Vercel (frontend), Convex Cloud (backend)
