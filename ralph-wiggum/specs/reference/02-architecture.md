# 02-architecture.md

## Purpose & Scope

### What This Covers

This document defines the technical architecture for PRJ Construction's rebuild: how components are organized, what technologies power each layer, how data flows between systems, where security boundaries exist, and how the system deploys.

**In Scope:**
- System topology and layer relationships
- Technology stack decisions with rationale
- Data flow patterns (user → UI → agent → database)
- Deployment architecture (dev/production)
- Security boundaries and scope enforcement
- Agent integration via Claude SDK + MCP

**Out of Scope:**
- Database schema details → See 04-schema.md
- AI system implementation → See 05-ai-system.md
- UI component library → See 06-ui-system.md
- Mobile simulator specifics → See 07-mobile-demo.md

---

## Overview

PRJ Construction is a three-layer system built for AI-first operation. The architecture prioritizes real-time reactivity, agent autonomy, and operational simplicity.

**The Three Layers:**

1. **Frontend Layer** (Next.js + ShadCN): User interface for desktop and mobile simulator
2. **Backend Layer** (Convex): Real-time database with reactive queries, serverless functions
3. **Agent Layer** (Claude SDK): AI operations via MCP protocol for database access

**Key Architectural Principles:**

- **Reactive by Default:** Convex pushes updates to all clients in real-time (no polling)
- **Agent-First Design:** Chief can read/write data directly, not just advise
- **Unified UI Stack:** ShadCN + Tailwind everywhere (including Chief chat)
- **Scope Enforcement:** Org → Project → Entity hierarchy prevents cross-project leaks
- **Serverless Simplicity:** No infrastructure to manage (Convex cloud, Vercel)

---

## Core Concepts

### Concept 1: Reactive Data Layer (Convex)

**Problem:** Traditional REST APIs require polling for updates. In construction, data changes constantly (defects logged, tasks completed, permits issued). Users see stale data unless they refresh.

**Solution:** Convex provides real-time reactive queries. When data changes on backend, all subscribed clients receive updates instantly via WebSocket.

**How It Works:**
```
User A creates defect
    ↓
Convex mutation executes
    ↓
Database updates
    ↓
Convex pushes to all subscribers
    ↓
User B's UI updates automatically
    ↓
Chief's context refreshes
```

**Benefits:**
- No manual refresh needed
- Multi-user collaboration works naturally
- Chief sees latest data without re-querying
- Optimistic updates with automatic rollback on failure

**Trade-offs:**
- WebSocket dependency (requires persistent connection)
- More complex client state management
- Higher backend resource usage (maintain subscriptions)

---

### Concept 2: Agent-First Architecture

**Traditional SaaS:** Human clicks through forms → validates → submits → database writes

**PRJ Construction:** Chief interprets intent → validates → executes → presents result

**Implications:**

1. **Database must trust agent:** Scope enforcement in MCP layer, not UI
2. **Undo must be first-class:** All writes wrapped in changesets for rollback
3. **Validation happens in two places:** Agent validates intent, backend validates data
4. **UI becomes optional:** Agent can operate without UI open (scheduled runs, webhooks)

**Architecture Consequences:**
- MCP server becomes security boundary (not API routes)
- Backend functions must be pure (agent calls them directly)
- Audit logging mandatory (track who did what via agent)
- Error handling must be clear for agent to report to user

---

### Concept 3: MCP for Database Access

**What is MCP?**

Model Context Protocol - standard for connecting AI agents to external systems. Think of it as "GraphQL for AI tools."

**Why MCP instead of custom tools?**

| Aspect | Custom Tools | MCP Tools |
|--------|--------------|-----------|
| Protocol | Ad-hoc JSON | Standardized |
| Discovery | Manual docs | Auto-discovery |
| Validation | Custom code | Schema-based |
| Reusability | Agent-specific | Cross-agent |
| Maintenance | Per-agent updates | Central server |

**Architecture:**
```
Claude SDK
    ↓
MCP Client (built-in)
    ↓
MCP Server (Convex wrapper)
    ↓
Convex Database
```

**MCP Server Responsibilities:**
- Expose db_read, db_write, undo tools
- Enforce scope (projectId filtering)
- Validate schemas
- Handle changeset creation
- Return structured responses

**Benefits:**
- Claude SDK natively supports MCP (zero configuration)
- Can swap database without changing agent code
- Tools work with other MCP-compatible agents
- Clear separation: agent logic vs. data access

---

### Concept 4: Skills-Based Context

**Problem:** Current system loads 5000+ lines of instructions at session start. Every conversation gets full schema for 97 tables, even if user only asks about defects.

**Solution:** Skills are modular instruction bundles that load progressively based on what agent needs.

**Skill Structure:**
```
.claude/
├── CLAUDE.md                    # Global context (identity, behavior)
└── skills/
    ├── database-read/           # Query patterns
    │   ├── SKILL.md             # Metadata + instructions
    │   └── references/
    │       └── optimization.md
    ├── database-write/          # Mutation patterns
    │   ├── SKILL.md
    │   └── references/
    │       └── validation-rules.md
    ├── domain-defects/          # Defect-specific logic
    ├── domain-swms/             # SWMS-specific logic
    └── domain-schedule/         # Schedule-specific logic
```

**Loading Strategy:**
1. **Session start:** Load CLAUDE.md (identity, behavior, safety rules)
2. **User mentions "defects":** Load database-read + database-write + domain-defects skills
3. **User asks "create SWMS":** Load domain-swms skill with SWMS templates
4. **User navigates away:** Domain skills unload, context freed

**Benefits:**
- Smaller context window usage (load only what's needed)
- Faster responses (less text to process)
- Easier maintenance (edit skill file, not monolithic prompt)
- Clearer organization (each domain self-contained)

**Trade-offs:**
- Skill loading adds latency (1-2 second delay)
- Agent might miss context if skills don't load
- Need clear boundaries (what goes in global vs. skill)

---

## Detailed Specification

### 4.1 System Topology

#### Complete System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER DEVICES                          │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Desktop Browser │         │  Mobile Simulator│         │
│  │  (Chrome/Safari) │         │  (Touch UI)      │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
└───────────┼──────────────────────────┼────────────────────┘
            │                          │
            └──────────────┬───────────┘
                           │ HTTPS
            ┌──────────────▼──────────────┐
            │     Next.js 16 Frontend      │
            │   (Vercel Edge Network)      │
            │                              │
            │  ┌────────────────────────┐  │
            │  │  React Server          │  │
            │  │  Components (RSC)      │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │  ┌───────────▼────────────┐  │
            │  │  ShadCN UI Components  │  │
            │  │  (Tailwind styling)    │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │  ┌───────────▼────────────┐  │
            │  │  API Routes            │  │
            │  │  /api/chief/run        │  │
            │  │  /api/chief/undo       │  │
            │  └───────────┬────────────┘  │
            └──────────────┼───────────────┘
                           │
                ┌──────────▼──────────┐
                │  Convex React Client│
                │  (reactive queries) │
                └──────────┬──────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐  ┌──▼───────┐  ┌──▼────────────┐
    │ Chief Agent  │  │ Convex   │  │ Convex Actions│
    │ (Claude SDK) │  │ Queries  │  │ (external API)│
    │              │  │ Mutations│  │               │
    │ ┌──────────┐ │  └─────┬────┘  └───────────────┘
    │ │  Skills  │ │        │
    │ │  Loading │ │        │
    │ └─────┬────┘ │        │
    │       │      │        │
    │ ┌─────▼────┐ │        │
    │ │   MCP    │ │        │
    │ │  Client  │ │        │
    │ └─────┬────┘ │        │
    └───────┼──────┘        │
            │               │
    ┌───────▼───────────────▼────────┐
    │    MCP Server (Convex)         │
    │  ┌──────────────────────────┐  │
    │  │ db_read tool             │  │
    │  │ db_write tool            │  │
    │  │ undo tool                │  │
    │  │ Scope enforcement        │  │
    │  └────────────┬─────────────┘  │
    └───────────────┼────────────────┘
                    │
    ┌───────────────▼────────────────┐
    │      Convex Database           │
    │      (Cloud Deployment)        │
    │                                │
    │  ┌──────────────────────────┐  │
    │  │  52 Tables               │  │
    │  │  Reactive subscriptions  │  │
    │  │  Indexes                 │  │
    │  │  Changesets for undo     │  │
    │  └──────────────────────────┘  │
    └────────────────────────────────┘
```

#### Component Descriptions

**Frontend Layer: Next.js 16 App Router**

- **Purpose:** Render UI, handle user interactions, stream agent responses
- **Technology:** Next.js 16 (App Router), React Server Components
- **Key Files:**
  - `app/(platform)/` - Authenticated routes (dashboard, projects, etc.)
  - `app/(public)/` - Public routes (QR code flows, shared links)
  - `app/api/chief/` - Agent streaming endpoints
- **Responsibilities:**
  - Render page layouts (server-side)
  - Hydrate interactive components (client-side)
  - Subscribe to Convex reactive queries
  - Stream agent responses (Server-Sent Events)
  - Handle optimistic updates with rollback

**UI Layer: ShadCN + Tailwind**

- **Purpose:** Consistent, accessible component library
- **Technology:** ShadCN (shadcn/ui), Tailwind CSS
- **Key Components:**
  - `components/ui/` - Primitives (button, input, dialog, table)
  - `components/<domain>/` - Feature components (defect-card, swms-builder)
- **Styling Strategy:**
  - CSS variables in `globals.css` for status/priority colors
  - Tailwind utility classes for layout
  - No hardcoded colors (all via variables)
- **Accessibility:** WCAG 2.1 AA compliant (keyboard nav, ARIA labels)

**API Layer: Next.js API Routes**

- **Purpose:** Proxy between frontend and agent, handle streaming
- **Key Endpoints:**
  - `POST /api/chief/run` - Execute agent with streaming response
  - `POST /api/chief/undo` - Rollback changeset
- **Response Format:** Server-Sent Events (SSE) for real-time streaming
- **Error Handling:** Structured errors returned as JSON in stream

**Agent Layer: Claude Agents SDK**

- **Purpose:** Orchestrate AI operations, execute tools, manage context
- **Technology:** Claude Agents SDK (TypeScript)
- **Entry Point:** `query()` function from SDK
- **Configuration:**
  - MCP servers for database access
  - Skills for progressive context loading
  - Hooks for monitoring/validation
- **Models:** Claude Sonnet (default), Opus (complex reasoning)

**MCP Server: Convex Wrapper**

- **Purpose:** Expose Convex database as MCP tools
- **Implementation:** Custom Node.js process, stdio transport
- **Tools Provided:**
  - `mcp__convex__db_read` - Query with scope filtering
  - `mcp__convex__db_write` - Mutate with changeset support
  - `mcp__convex__undo` - Rollback changeset
- **Security:** Enforces projectId filtering, validates schemas

**Data Layer: Convex Cloud**

- **Purpose:** Real-time database, serverless functions
- **Technology:** Convex (hosted cloud service)
- **Architecture:**
  - Tables (52 total after cleanup)
  - Indexes (by_project, by_status, etc.)
  - Functions (queries, mutations, actions)
  - Subscriptions (WebSocket for real-time)
- **Deployment:** Separate dev and production instances

---

### 4.2 Technology Stack

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Frontend** | Next.js | 16 | App Router, React Server Components, streaming support, Vercel deployment |
| **UI Library** | ShadCN | latest | Accessible components, Tailwind-native, customizable, copy-paste vs. npm |
| **Styling** | Tailwind CSS | 3.x | Utility-first, no custom CSS, consistency via design tokens |
| **Backend** | Convex | latest | Real-time reactivity, serverless, TypeScript-first, managed hosting |
| **Agent SDK** | Claude SDK | latest | Native skills/subagents, MCP support, progressive context loading |
| **AI Model** | Claude | Sonnet/Opus | Best reasoning, tool use, long context, fast iteration (Sonnet 4.5) |
| **Protocol** | MCP | 1.x | Standard tool protocol, agent-agnostic, schema validation |
| **Language** | TypeScript | 5.x | Type safety across stack (frontend + backend + MCP server) |
| **Deployment** | Vercel + Convex | - | Zero-config hosting, edge network (Vercel), managed DB (Convex) |

**Why Next.js 16?**

- App Router enables React Server Components (less client JS)
- Streaming support for agent responses (non-blocking UI)
- API routes for agent orchestration
- Vercel deployment (zero config, edge network)
- File-based routing (clear project structure)

**Why ShadCN over other UI libraries?**

| Library | Pros | Cons |
|---------|------|------|
| **Material UI** | Comprehensive | Heavy bundle, opinionated design |
| **Chakra UI** | Theme-first | Breaking changes, bundle size |
| **Ant Design** | Enterprise features | Not Tailwind-native, heavy |
| **ShadCN** | Tailwind-native, copy-paste, full control | Manual updates per component |

**Decision:** ShadCN - full control, no bundle bloat, Tailwind consistency

**Why Convex over traditional database?**

| Approach | Architecture | Latency | Complexity |
|----------|-------------|---------|------------|
| **PostgreSQL + REST** | Client → API → DB | 100-500ms | High (schema migrations, ORM, caching) |
| **Supabase** | Client → Supabase → Postgres | 50-200ms | Medium (realtime subscriptions, RLS) |
| **Convex** | Client → Convex (reactive) | 10-50ms | Low (managed, TypeScript, reactive) |

**Decision:** Convex - real-time built-in, serverless, TypeScript-first

**Why Claude SDK over building custom agent?**

- Native MCP support (no custom protocol needed)
- Skills system (progressive context loading)
- Subagents for orchestration (parallel execution)
- Hooks for monitoring (pre/post tool execution)
- Future-proof (improves as models improve)

---

### 4.3 Data Flow Patterns

#### Pattern 1: User → UI → Convex (Standard CRUD)

**Flow:**
```
User clicks "Create Defect"
    ↓
React component calls useConvex hook
    ↓
Hook calls Convex mutation (createDefect)
    ↓
Mutation validates + inserts record
    ↓
Convex pushes update to all subscribers
    ↓
UI updates automatically (reactive query)
```

**Example Code:**
```typescript
// Component
const createDefect = useMutation(api.defects.create);

await createDefect({
  projectId: currentProject._id,
  title: "Cracked foundation",
  priority: "high"
});

// Convex mutation
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("defects", {
      ...args,
      status: "open",
      createdAt: new Date().toISOString(),
      createdBy: ctx.auth.userId
    });
  }
});

// Reactive query elsewhere
const defects = useQuery(api.defects.listByProject, { projectId });
// Auto-updates when new defect created
```

**Characteristics:**
- Optimistic updates (UI updates before server confirms)
- Automatic rollback on error
- Zero polling (push-based)
- Type-safe (end-to-end TypeScript)

---

#### Pattern 2: User → Chief → Convex (AI-Mediated)

**Flow:**
```
User: "Create high priority defect: cracked foundation"
    ↓
UI sends to /api/chief/run
    ↓
API route calls Claude SDK query()
    ↓
Agent interprets intent, loads database-write skill
    ↓
Agent calls mcp__convex__db_write tool
    ↓
MCP server validates scope + schema
    ↓
MCP server creates changeset
    ↓
MCP server executes Convex mutation
    ↓
MCP returns changeset ID + result
    ↓
Agent streams response to UI
    ↓
UI renders result with Undo button
    ↓
Convex pushes update to all clients
```

**Example Code:**
```typescript
// API route
export async function POST(req: Request) {
  const { message, projectId, threadId } = await req.json();

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    for await (const chunk of query({
      prompt: message,
      options: {
        mcpServers: {
          convex: {
            command: "node",
            args: ["mcp-server-convex/index.js"],
            env: {
              CONVEX_URL: process.env.CONVEX_URL,
              PROJECT_ID: projectId
            }
          }
        },
        settingSources: ["project"],
        resume: threadId
      }
    })) {
      await writer.write(
        new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
      );
    }
    await writer.close();
  })();

  return new Response(stream.readable, {
    headers: { "Content-Type": "text/event-stream" }
  });
}

// MCP Server tool
server.addTool({
  name: "db_write",
  inputSchema: { /* ... */ },
  async run({ operations }) {
    const changesetId = generateId();

    // Validate scope
    operations.forEach(op => {
      if (!op.data.projectId) {
        op.data.projectId = getCurrentProjectId();
      }
      if (op.data.projectId !== getCurrentProjectId()) {
        throw new Error("Cannot write to different project");
      }
    });

    // Execute in Convex
    const results = await convex.mutation(api.changesets.execute, {
      changesetId,
      operations
    });

    return {
      type: "text",
      text: JSON.stringify({ changesetId, results })
    };
  }
});
```

**Characteristics:**
- Agent validates intent before execution
- Scope enforcement in MCP layer (not UI)
- Changeset creation for undo
- Streaming response (user sees progress)
- Same reactive updates as Pattern 1

---

#### Pattern 3: Chief → User (Proactive)

**Flow:**
```
Scheduled Cron Job (daily 6am)
    ↓
Trigger Chief agent with prompt:
"Review yesterday's activities, identify issues"
    ↓
Agent loads recent data via mcp__convex__db_read
    ↓
Agent analyzes patterns (missing permits, overdue defects)
    ↓
Agent creates notification records via mcp__convex__db_write
    ↓
User opens app
    ↓
UI shows notifications from Chief
```

**Use Cases:**
- Daily site reports
- Compliance reminders (expiring permits)
- Risk alerts (high-priority defects not assigned)
- Workflow automation (close resolved defects after 7 days)

**Implementation:**
```typescript
// Convex scheduled function
export const dailyReview = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();

    for (const project of projects) {
      // Trigger Chief agent via API
      await fetch("/api/chief/scheduled", {
        method: "POST",
        body: JSON.stringify({
          projectId: project._id,
          prompt: "Review yesterday's activities, identify issues"
        })
      });
    }
  }
});
```

**Characteristics:**
- No user action required
- Agent operates autonomously
- Results saved to database (not just messages)
- User sees summary on next login

---

#### Pattern 4: Real-time Sync

**Flow:**
```
User A: Creates defect (desktop)
    ↓
Convex mutation executes
    ↓
Database record inserted
    ↓
Convex detects subscribers to defects query
    ↓
Pushes update to User B (mobile simulator)
    ↓
User B's defect list updates instantly
    ↓
Chief's context refreshes (if monitoring defects)
```

**Subscription Management:**
```typescript
// Client subscribes
const defects = useQuery(api.defects.listByProject, { projectId });

// Convex tracks subscription
subscribers.add({
  queryName: "defects.listByProject",
  args: { projectId: "abc123" },
  clientId: "user_b_session"
});

// On mutation
export const create = mutation({
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("defects", args);

    // Convex automatically:
    // 1. Detects affected queries (defects.listByProject)
    // 2. Re-executes queries for all subscribers
    // 3. Pushes updated results via WebSocket

    return id;
  }
});
```

**Benefits:**
- Zero polling overhead
- Instant updates (10-50ms latency)
- Works across tabs, devices, users
- Scales to thousands of concurrent users

**Trade-offs:**
- Requires persistent WebSocket connection
- Offline mode needs special handling
- Higher backend resource usage (maintain subscriptions)

---

### 4.4 API Architecture

#### Convex Functions

Convex provides three function types:

| Type | Purpose | Access | Use Case |
|------|---------|--------|----------|
| **Query** | Read data | Client + backend | List defects, get project details |
| **Mutation** | Write data | Client + backend | Create defect, update status |
| **Action** | External calls | Backend only | Send email, call webhook, generate PDF |

**Query Example:**
```typescript
// convex/defects.ts
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("defects")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .order("desc")
      .take(100);
  }
});

// Client usage
const defects = useQuery(api.defects.listByProject, { projectId });
```

**Mutation Example:**
```typescript
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )
  },
  handler: async (ctx, args) => {
    // Validate project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Insert
    return ctx.db.insert("defects", {
      ...args,
      status: "open",
      createdAt: new Date().toISOString(),
      createdBy: ctx.auth.userId
    });
  }
});

// Client usage
const createDefect = useMutation(api.defects.create);
await createDefect({ projectId, title: "Issue", priority: "high" });
```

**Action Example:**
```typescript
export const generatePDF = action({
  args: { defectId: v.id("defects") },
  handler: async (ctx, args) => {
    // Query data
    const defect = await ctx.runQuery(api.defects.get, { id: args.defectId });

    // Call external service
    const pdf = await fetch("https://pdf-service.com/generate", {
      method: "POST",
      body: JSON.stringify(defect)
    });

    // Store result
    await ctx.runMutation(api.defects.attachPDF, {
      id: args.defectId,
      pdfUrl: pdf.url
    });
  }
});
```

---

#### Next.js API Routes

**Agent Execution: POST /api/chief/run**

```typescript
// app/api/chief/run/route.ts
export async function POST(req: Request) {
  const { message, projectId, threadId } = await req.json();

  // Validate request
  if (!message || !projectId) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Execute agent in background
  (async () => {
    try {
      for await (const chunk of query({
        prompt: message,
        options: {
          allowedTools: [
            "mcp__convex__db_read",
            "mcp__convex__db_write",
            "mcp__convex__undo"
          ],
          mcpServers: {
            convex: {
              command: "node",
              args: ["mcp-server-convex/index.js"],
              env: {
                CONVEX_URL: process.env.CONVEX_URL!,
                PROJECT_ID: projectId
              }
            }
          },
          settingSources: ["project"],
          cwd: process.cwd(),
          resume: threadId
        }
      })) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      }

      await writer.close();
    } catch (error) {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({
          type: "error",
          error: error.message
        })}\n\n`)
      );
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
```

**Undo Operation: POST /api/chief/undo**

```typescript
// app/api/chief/undo/route.ts
export async function POST(req: Request) {
  const { changesetId } = await req.json();

  try {
    // Call MCP tool directly
    const result = await executeMCPTool("mcp__convex__undo", {
      changesetId
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}
```

---

### 4.5 Agent Architecture

#### Claude SDK Integration

**Entry Point: query() function**

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Show open defects and close resolved ones",
  options: {
    // MCP servers for tools
    mcpServers: {
      convex: { /* config */ }
    },

    // Load skills from .claude/
    settingSources: ["project"],

    // Resume conversation
    resume: threadId,

    // Tool restrictions
    allowedTools: ["mcp__convex__db_read", "mcp__convex__db_write"],

    // Monitoring hooks
    hooks: {
      PreToolUse: async ({ toolName, input }) => { /* log */ },
      PostToolUse: async ({ output }) => { /* track */ }
    }
  }
})) {
  // Stream message chunks to UI
  console.log(message);
}
```

**Benefits over OpenAI Agents SDK:**

| Feature | OpenAI SDK | Claude SDK |
|---------|------------|------------|
| Tool protocol | Custom JSON | MCP (standard) |
| Context loading | String concatenation | Skills (progressive) |
| Subagents | Manual implementation | Built-in Task tool |
| Streaming | Manual SSE setup | Native async iteration |
| Session management | Custom state | Built-in resume |

---

#### MCP Server for Convex

**Architecture:**

```
Node.js Process (stdio transport)
    ↓
MCP Server (standard protocol)
    ↓
Convex HTTP Client
    ↓
Convex Cloud API
```

**Implementation:**

```typescript
// mcp-server-convex/index.ts
import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk/mcp";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);
const projectId = process.env.PROJECT_ID!;

const server = createSdkMcpServer({
  name: "convex",
  version: "1.0.0"
});

// db_read tool
server.addTool({
  name: "db_read",
  description: "Query database tables with automatic scope filtering",
  inputSchema: {
    type: "object",
    properties: {
      table: {
        type: "string",
        enum: ["defects", "swms", "tasks", /* ... all 52 tables */]
      },
      query: {
        type: "object",
        properties: {
          filter: { type: "object" },
          limit: { type: "number", maximum: 100 },
          orderBy: {
            type: "object",
            properties: {
              field: { type: "string" },
              direction: { type: "string", enum: ["asc", "desc"] }
            }
          }
        }
      }
    },
    required: ["table"]
  },
  async run({ table, query }) {
    // Auto-inject projectId filter
    const scopedQuery = {
      ...query,
      filter: {
        ...query?.filter,
        projectId
      }
    };

    // Execute Convex query
    const results = await convex.query(
      api[table].list,
      scopedQuery
    );

    return {
      type: "text",
      text: JSON.stringify({
        records: results,
        count: results.length,
        scope: { projectId }
      })
    };
  }
});

// db_write tool
server.addTool({
  name: "db_write",
  description: "Create/update/delete records with validation and undo",
  inputSchema: {
    type: "object",
    properties: {
      operations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["create", "update", "delete"] },
            table: { type: "string", enum: [/* 52 tables */] },
            data: { type: "object" },
            id: { type: "string" },
            reason: { type: "string" }
          },
          required: ["type", "table"]
        }
      }
    },
    required: ["operations"]
  },
  async run({ operations }) {
    const changesetId = generateId();

    // Validate + inject projectId
    operations.forEach(op => {
      if (op.data && !op.data.projectId) {
        op.data.projectId = projectId;
      }
      if (op.data?.projectId !== projectId) {
        throw new Error("Cannot write to different project");
      }
    });

    // Execute in Convex (atomic)
    const results = await convex.mutation(api.changesets.execute, {
      changesetId,
      operations
    });

    return {
      type: "text",
      text: JSON.stringify({
        changesetId,
        results,
        undoAvailable: true
      })
    };
  }
});

// undo tool
server.addTool({
  name: "undo",
  description: "Rollback a changeset",
  inputSchema: {
    type: "object",
    properties: {
      changesetId: { type: "string" }
    },
    required: ["changesetId"]
  },
  async run({ changesetId }) {
    await convex.mutation(api.changesets.undo, { changesetId });

    return {
      type: "text",
      text: JSON.stringify({ success: true })
    };
  }
});

export default server;
```

**Key Responsibilities:**

1. **Scope Enforcement:** Automatically inject projectId filter on reads, validate on writes
2. **Schema Validation:** Validate tool inputs against schema before execution
3. **Changeset Management:** Wrap writes in changesets for undo
4. **Error Handling:** Return structured errors to agent
5. **Audit Logging:** Log all operations for compliance

---

#### Skills Structure

**Directory Layout:**

```
.claude/
├── CLAUDE.md                          # Global instructions
└── skills/
    ├── database-read/
    │   ├── SKILL.md                   # Query patterns
    │   └── references/
    │       └── optimization.md
    ├── database-write/
    │   ├── SKILL.md                   # Mutation patterns
    │   └── references/
    │       └── validation-rules.md
    ├── database-schema/
    │   ├── SKILL.md                   # Schema manifest
    │   └── references/
    │       ├── core-tables.md
    │       ├── swms-tables.md
    │       └── safety-tables.md
    ├── domain-defects/
    │   ├── SKILL.md                   # Defect-specific logic
    │   └── references/
    │       └── defect-workflows.md
    ├── domain-swms/
    │   ├── SKILL.md
    │   └── references/
    │       ├── swms-templates.md
    │       └── australian-standards.md
    └── domain-schedule/
        ├── SKILL.md
        └── references/
            └── gantt-patterns.md
```

**Example Skill: database-write**

```markdown
<!-- .claude/skills/database-write/SKILL.md -->
---
name: database-write
description: Create, update, or delete database records with validation and undo support
---

When writing to the database:

## Validation Steps
1. Verify all required fields present
2. Validate enum values
3. Check relationships exist (foreign keys)
4. Auto-populate: projectId (from scope), timestamps, createdBy

## Execution Pattern
Use `mcp__convex__db_write` tool with operations array:

```typescript
{
  operations: [{
    type: "create" | "update" | "delete",
    table: "tableName",
    data: {...},
    id: "...",
    reason: "Why this change"
  }]
}
```

## Post-Write
1. Return changeset ID for undo
2. Present confirmation to user
3. Suggest next actions

## Common Validations
Load `references/validation-rules.md` for field-specific rules.

## Scope Rules
- projectId auto-injected (cannot override)
- Cannot write to other projects
- Validate related IDs in same project
```

**Loading Behavior:**

```
User: "Show open defects"
    ↓
Agent detects "defects" keyword
    ↓
Loads: database-read + domain-defects skills
    ↓
Executes query with defect-specific optimizations

User: "Create new SWMS"
    ↓
Agent detects "SWMS" + "create"
    ↓
Loads: database-write + domain-swms skills
    ↓
Loads: references/swms-templates.md
    ↓
Executes with SWMS-specific validation
```

---

#### Subagent Pattern

**Use Case: SWMS Creation (multi-step workflow)**

```typescript
// .claude/agents/swms-orchestrator.md

for await (const message of query({
  prompt: "Create SWMS for concrete pouring with hazard analysis",
  options: {
    agents: {
      "hazard-analyzer": {
        description: "Identifies hazards for construction activities",
        prompt: `You identify construction hazards and suggest controls.
Reference AS/NZS standards and industry best practices.`,
        tools: ["Read"],
        model: "opus" // Complex reasoning
      },
      "swms-validator": {
        description: "Validates SWMS data against regulations",
        prompt: `You validate SWMS documents for compliance.
Check required fields, hazard/control matching, standards.`,
        tools: ["mcp__convex__db_read"],
        model: "sonnet"
      },
      "swms-writer": {
        description: "Creates SWMS documents from validated data",
        prompt: `You create SWMS documents following templates.
Format output according to organizational standards.`,
        tools: ["mcp__convex__db_write", "Read"],
        model: "sonnet"
      }
    },
    allowedTools: ["Task", "mcp__convex__db_read", "mcp__convex__db_write"]
  }
})) {
  // Orchestrator flow:
  // 1. Task → hazard-analyzer (identify hazards)
  // 2. Task → swms-validator (validate completeness)
  // 3. Task → swms-writer (create document)
  // 4. Present result with undo option
}
```

**Benefits:**

- **Parallel execution:** Hazard analysis + validation run concurrently
- **Specialized models:** Opus for complex analysis, Sonnet for structured writing
- **Clear separation:** Each subagent has focused responsibility
- **Easier testing:** Test each subagent independently

---

### 4.6 Deployment Architecture

#### Development Environment

**Local Setup:**

```
Developer Machine
    ↓
├── Next.js Dev Server (localhost:3000)
│   ├── Hot module reload
│   ├── React Fast Refresh
│   └── TypeScript type checking
    ↓
├── Convex Cloud (dev deployment: dev:hip-ferret-424)
│   ├── Shared across all worktrees
│   ├── Schema synced automatically
│   └── Functions deployed on save
    ↓
└── MCP Server (node mcp-server-convex/index.js)
    ├── Runs locally via Claude SDK
    └── Connects to Convex cloud
```

**Worktree Development:**

Multiple developers can work on separate branches simultaneously:

```
Main Repo (main branch)
    └── trees/
        ├── feature-defects/    (Next.js: 3001, Convex: shared)
        ├── feature-swms/       (Next.js: 3002, Convex: shared)
        └── bugfix-schedule/    (Next.js: 3003, Convex: shared)
```

**Port Assignment:** Deterministic from worktree name (hash to 3001-3015)

**Convex Deployment:** All worktrees share `dev:hip-ferret-424` deployment

---

#### Production Environment

**Deployment Flow:**

```
GitHub main branch
    ↓
├── Vercel (automatic deploy)
│   ├── Build Next.js app
│   ├── Deploy to edge network
│   ├── Custom domain (prj.construction)
│   └── Environment variables from Vercel
    ↓
└── Convex Production (prod:hip-ferret-424)
    ├── Schema deployed via CI
    ├── Functions deployed via CI
    └── Separate from dev deployment
```

**CI/CD Pipeline:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Deploy Convex schema + functions
      - name: Deploy Convex
        run: |
          npx convex deploy --prod
        env:
          CONVEX_DEPLOYMENT: prod:hip-ferret-424

      # Vercel deployment (automatic)
      # Triggered by GitHub integration
```

**Environment Variables:**

| Variable | Dev | Prod |
|----------|-----|------|
| `CONVEX_URL` | dev deployment URL | prod deployment URL |
| `CONVEX_DEPLOYMENT` | dev:hip-ferret-424 | prod:hip-ferret-424 |
| `ANTHROPIC_API_KEY` | Dev key | Prod key |
| `NODE_ENV` | development | production |

---

#### Scaling Considerations

**Convex Scaling (Automatic):**

- Serverless functions scale automatically (no config needed)
- Database scales to handle load (managed by Convex)
- WebSocket connections pooled and load-balanced

**Vercel Scaling:**

- Edge network (CDN) for static assets
- Serverless functions for API routes (auto-scale)
- Geographic distribution (routes to nearest edge node)

**Agent Execution:**

- Runs in Next.js serverless functions (Vercel)
- Each request gets isolated execution
- Parallel requests handled automatically
- Rate limits enforced by Anthropic API

**Bottlenecks:**

1. **Anthropic API rate limits:** 500 requests/min (Tier 3)
2. **MCP server spawn time:** 1-2 seconds per agent execution
3. **Convex subscription limits:** 10,000 concurrent connections (free tier)

**Mitigation:**

- Cache agent responses for common queries
- Pool MCP server connections (reuse process)
- Upgrade Convex plan for higher limits

---

### 4.7 Security Architecture

#### Scope Enforcement

**Hierarchy:** Org → Project → Entity

```
orgs (orgId)
    ↓
projects (projectId, orgId)
    ↓
defects (defectId, projectId)
```

**Enforcement Points:**

1. **MCP Server (Primary Boundary):**
   ```typescript
   // Auto-inject projectId on reads
   const scopedQuery = {
     ...query,
     filter: { ...query?.filter, projectId: currentProjectId }
   };

   // Validate projectId on writes
   if (data.projectId !== currentProjectId) {
     throw new Error("Cannot write to different project");
   }
   ```

2. **Convex Indexes:**
   ```typescript
   defineTable({
     // Every table scoped to project
     projectId: v.id("projects"),
     // ...other fields
   }).index("by_project", ["projectId"])
   ```

3. **UI Layer (Secondary):**
   ```typescript
   // Filter UI to current project (not security boundary)
   const defects = useQuery(api.defects.listByProject, {
     projectId: currentProject._id
   });
   ```

**Cross-Project Protections:**

- Agent CANNOT read data from other projects (MCP blocks)
- Agent CANNOT write to other projects (MCP validates)
- Agent CANNOT assign workers from other projects (validation)
- Agent CANNOT reference entities from other projects (FK checks)

---

#### Data Boundaries

**Query Scoping:**

```typescript
// Every query automatically filtered
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Explicit projectId required
    return ctx.db
      .query("defects")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .collect();
  }
});

// MCP server validates projectId matches current context
if (args.projectId !== getCurrentProjectId()) {
  throw new Error("Project scope mismatch");
}
```

**Mutation Validation:**

```typescript
export const create = mutation({
  handler: async (ctx, args) => {
    // 1. Validate project exists
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // 2. Validate user has access to project
    const hasAccess = await checkProjectAccess(ctx.auth.userId, args.projectId);
    if (!hasAccess) throw new Error("Access denied");

    // 3. Validate related entities in same project
    if (args.assignedTo) {
      const worker = await ctx.db.get(args.assignedTo);
      if (worker.projectId !== args.projectId) {
        throw new Error("Worker not in project");
      }
    }

    // 4. Insert
    return ctx.db.insert("defects", args);
  }
});
```

**Audit Logging:**

All mutations logged for compliance:

```typescript
// After every write
await ctx.db.insert("activityLogs", {
  entityType: "defect",
  entityId: result._id,
  activityType: "created",
  actorId: ctx.auth.userId,
  actorType: "ai", // or "human"
  metadata: { changesetId, reason },
  createdAt: new Date().toISOString()
});
```

---

#### No Authentication (Current)

**Current State:**

- Single demo user (`user_demo_001`)
- No login required
- No permissions system
- Full access to all projects

**Why Deferred:**

- Focus on core functionality first
- Authentication adds complexity (auth provider, session management)
- Demo/testing easier without auth
- Rebuild complete before adding auth

**Future Plan:**

- Add Clerk or Auth0 integration
- Role-based access control (admin, supervisor, worker)
- Project-level permissions (view, edit, approve)
- Worker-level restrictions (mobile simulator only)

**Security Note:**

Current lack of auth is acceptable because:
- Application is NOT public-facing (internal demo only)
- Deployment behind firewall/VPN
- Audit logging tracks all operations
- Scope enforcement prevents cross-project leaks

---

### 4.8 Performance Considerations

#### Convex Optimizations

**Index Strategy:**

```typescript
// Primary index: by_project (always used)
defineTable({
  projectId: v.id("projects"),
  status: v.string(),
  priority: v.string(),
  createdAt: v.string()
})
  .index("by_project", ["projectId"])
  .index("by_project_status", ["projectId", "status"])
  .index("by_project_priority", ["projectId", "priority", "createdAt"]);
```

**Query Patterns:**

```typescript
// Good: Uses by_project index
ctx.db
  .query("defects")
  .withIndex("by_project", q => q.eq("projectId", projectId))
  .collect();

// Better: Uses composite index for filtering
ctx.db
  .query("defects")
  .withIndex("by_project_status", q =>
    q.eq("projectId", projectId).eq("status", "open")
  )
  .collect();

// Bad: Full table scan (no index)
ctx.db
  .query("defects")
  .filter(q => q.eq(q.field("projectId"), projectId))
  .collect();
```

**Query Batching:**

```typescript
// Bad: N+1 queries
const defects = await ctx.db.query("defects").collect();
for (const defect of defects) {
  defect.assignedToName = await ctx.db.get(defect.assignedTo).name;
}

// Good: Batch load workers
const defects = await ctx.db.query("defects").collect();
const workerIds = [...new Set(defects.map(d => d.assignedTo))];
const workers = await Promise.all(workerIds.map(id => ctx.db.get(id)));
const workerMap = Object.fromEntries(workers.map(w => [w._id, w]));
defects.forEach(d => {
  d.assignedToName = workerMap[d.assignedTo]?.name;
});
```

**Subscription Management:**

```typescript
// Good: Scoped subscription
const defects = useQuery(api.defects.listByProject, { projectId });

// Bad: Subscribe to all defects (receives all updates)
const allDefects = useQuery(api.defects.list, {});
```

---

#### Agent Optimizations

**Skill Progressive Loading:**

```
Session start: Load CLAUDE.md (500 lines)
    ↓
User mentions "defects": Load domain-defects skill (+300 lines)
    ↓
User asks "create": Load database-write skill (+400 lines)
    ↓
Total context: 1200 lines (vs. 5000+ monolithic)
```

**Context Management:**

- Load only relevant table schemas (not all 52)
- Cache loaded skills for session (don't reload)
- Unload domain skills when switching context

**Parallel Subagent Execution:**

```typescript
// Sequential (slow): 30 seconds total
await Task("analyze-hazards");  // 15s
await Task("validate-swms");    // 10s
await Task("create-document");  // 5s

// Parallel (fast): 15 seconds total
const [hazards, validation] = await Promise.all([
  Task("analyze-hazards"),  // 15s
  Task("validate-swms")     // 10s (runs in parallel)
]);
await Task("create-document", { hazards, validation }); // 5s
```

---

#### Frontend Optimizations

**React Server Components:**

```typescript
// Server component (no JS sent to client)
export default async function DefectsPage({ params }) {
  const defects = await fetchDefects(params.projectId);

  return (
    <div>
      <h1>Defects</h1>
      {/* Static HTML, no hydration */}
      <DefectsList defects={defects} />
    </div>
  );
}

// Client component (interactive, requires JS)
"use client";
export function DefectCard({ defect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div onClick={() => setExpanded(!expanded)}>
      {/* Interactive behavior */}
    </div>
  );
}
```

**Streaming Responses:**

```typescript
// API route streams chunks as available
export async function POST(req: Request) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    for await (const chunk of agentExecution()) {
      await writer.write(encoder.encode(`data: ${chunk}\n\n`));
      // UI updates immediately (non-blocking)
    }
    await writer.close();
  })();

  return new Response(stream.readable);
}
```

**Optimistic Updates:**

```typescript
// Update UI immediately, rollback if fails
const createDefect = useMutation(api.defects.create);

// Optimistic update
setLocalDefects([...localDefects, newDefect]);

try {
  const result = await createDefect(newDefect);
  // Success: Convex will push authoritative update
} catch (error) {
  // Rollback optimistic update
  setLocalDefects(localDefects);
  toast.error("Failed to create defect");
}
```

---

### 4.9 Error Handling

#### Agent Errors

**Tool Failures:**

```typescript
// MCP server catches and returns structured error
try {
  const results = await convex.mutation(api.defects.create, data);
  return { type: "text", text: JSON.stringify(results) };
} catch (error) {
  return {
    type: "text",
    text: JSON.stringify({
      error: "validation_failed",
      message: error.message,
      fields: error.invalidFields // Structured data
    })
  };
}

// Agent interprets error and explains to user
if (result.error === "validation_failed") {
  present({
    type: "error",
    title: "Cannot Create Defect",
    description: `Missing required fields: ${result.fields.join(", ")}`,
    actions: [{ label: "Try Again", action: "retry" }]
  });
}
```

**Scope Violations:**

```typescript
// MCP server blocks cross-project access
if (data.projectId !== currentProjectId) {
  throw new Error("Cannot write to different project");
}

// Agent receives error
// Explains to user (not raw error message)
"I cannot create a defect in Project B because you're currently in Project A.
Would you like me to switch projects first?"
```

**Validation Errors:**

```typescript
// Convex mutation validates
if (!args.priority || !["low", "medium", "high", "critical"].includes(args.priority)) {
  throw new Error(`Invalid priority: ${args.priority}`);
}

// Agent catches, asks user for correction
"The priority must be one of: low, medium, high, critical.
Which priority should I use for this defect?"
```

---

#### Database Errors

**Transaction Failures:**

```typescript
// Convex mutations are atomic
export const createDefectWithPhoto = mutation({
  handler: async (ctx, args) => {
    const defectId = await ctx.db.insert("defects", args.defect);

    // If this fails, defect insert rolls back automatically
    await ctx.db.insert("defectPhotos", {
      defectId,
      ...args.photo
    });

    return defectId;
  }
});
```

**Conflict Resolution:**

```typescript
// Optimistic locking via version field
export const update = mutation({
  args: {
    id: v.id("defects"),
    updates: v.object({ /* ... */ }),
    version: v.number()
  },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.id);

    if (current.version !== args.version) {
      throw new Error("Record was modified by another user");
    }

    await ctx.db.patch(args.id, {
      ...args.updates,
      version: current.version + 1
    });
  }
});
```

---

#### Frontend Errors

**Network Failures:**

```typescript
// Convex client auto-reconnects on network issues
const defects = useQuery(api.defects.listByProject, { projectId });

if (defects === undefined) {
  // Loading or reconnecting
  return <Spinner />;
}

// Convex handles:
// - WebSocket disconnect → reconnect
// - Missed updates → re-sync
// - Stale data → refresh
```

**Optimistic Update Rollback:**

```typescript
const [optimisticDefects, setOptimisticDefects] = useState([]);
const createDefect = useMutation(api.defects.create);

async function handleCreate(data) {
  // Add optimistically
  const tempId = "temp_" + Date.now();
  setOptimisticDefects([...optimisticDefects, { ...data, _id: tempId }]);

  try {
    const result = await createDefect(data);
    // Success: remove optimistic, Convex will push real record
    setOptimisticDefects(optimisticDefects.filter(d => d._id !== tempId));
  } catch (error) {
    // Failure: rollback optimistic
    setOptimisticDefects(optimisticDefects.filter(d => d._id !== tempId));
    toast.error("Failed to create defect");
  }
}
```

---

## Relationships & Dependencies

### Depends On

- **01-vision.md** - Product vision drives architectural choices (AI-first, reactive, simple)

### Feeds Into

- **04-schema.md** - Architecture determines database design (reactive queries, scope enforcement)
- **05-ai-system.md** - Agent layer builds on MCP + Skills patterns defined here
- **06-ui-system.md** - Frontend patterns follow React Server Components + ShadCN decisions
- **07-mobile-demo.md** - Mobile simulator uses same tech stack (Next.js, Convex, ShadCN)
- **08-integrations.md** - External integrations follow Convex Actions pattern

---

## Implementation Notes

### Build Order

1. **Convex Schema + Basic Functions** (Week 1)
   - Define 52 tables
   - Create indexes
   - Implement queries/mutations for core entities (projects, defects, tasks)

2. **MCP Server for Database Access** (Week 2)
   - Implement db_read, db_write, undo tools
   - Add scope enforcement
   - Test with Claude SDK locally

3. **Claude SDK Integration** (Week 2-3)
   - Create API routes for agent execution
   - Implement streaming responses
   - Test tool execution flow

4. **ShadCN UI Components** (Week 3-4)
   - Set up design tokens (CSS variables)
   - Create primitive components (button, input, table)
   - Build feature components (defect-card, task-list)

5. **Chief Chat Interface** (Week 4-5)
   - Build chat UI (message list, input, streaming)
   - Implement response renderers (structured data types)
   - Add undo button functionality

6. **Skills Migration** (Week 5-6)
   - Extract instructions to .claude/CLAUDE.md
   - Create domain skills (defects, swms, schedule)
   - Test progressive loading

---

### Key Integration Points

**Convex ↔ MCP Server:**

- MCP server spawns as separate process (node mcp-server-convex/index.js)
- Communicates via stdio (standard input/output)
- Convex HTTP Client used for database access
- Scope context passed via environment variables

**Claude SDK ↔ Next.js Streaming:**

- API route creates TransformStream for SSE
- query() returns async iterator of chunks
- Each chunk encoded as `data: {json}\n\n`
- UI consumes EventSource or fetch stream

**ShadCN ↔ Agent Responses:**

- Agent returns structured data (not HTML)
- UI components render based on data type
- Consistent styling via Tailwind classes
- Accessible patterns (keyboard nav, ARIA)

---

## Open Questions

### 1. MCP Server Lifecycle

**Question:** Should MCP server be long-running process or spawned per request?

**Options:**

A. **Spawn per request:**
   - Pros: Isolated, no state leakage, auto-cleanup
   - Cons: 1-2s startup latency, resource overhead

B. **Long-running process:**
   - Pros: No startup latency, connection pooling
   - Cons: State management, memory leaks, restart complexity

**Recommendation:** Start with A (spawn per request), optimize to B if latency becomes issue.

---

### 2. Skill Granularity

**Question:** How many skills should we create? One per table? One per domain?

**Options:**

A. **Coarse-grained (9 skills):**
   - database-read, database-write, swms, defects, schedule, safety, quality, assets, operations
   - Pros: Fewer files, simpler management
   - Cons: Larger context per skill, less granular loading

B. **Fine-grained (30+ skills):**
   - One skill per table (defects, swms, tasks, etc.)
   - Pros: Minimal context loaded, precise targeting
   - Cons: More files to manage, loading overhead

**Recommendation:** Start with A (coarse-grained), split if context size becomes issue.

---

### 3. Session Persistence

**Question:** Where should we store agent session state (for resume)?

**Options:**

A. **Convex database:**
   - Pros: Centralized, survives restarts, queryable
   - Cons: Database bloat, cleanup strategy needed

B. **Redis/external cache:**
   - Pros: Fast, TTL-based expiry
   - Cons: Additional infrastructure, cost

C. **Claude SDK managed:**
   - Pros: Zero infrastructure, handled by SDK
   - Cons: Less control, opaque storage

**Recommendation:** Start with A (Convex), migrate to C when Claude SDK matures.

---

### 4. Real-time Sync for Agent

**Question:** Should agent re-query database on every message, or subscribe to changes?

**Options:**

A. **Re-query every message:**
   - Pros: Simple, always fresh data
   - Cons: Redundant queries, higher latency

B. **Subscribe to Convex (via WebSocket):**
   - Pros: Instant updates, less querying
   - Cons: Persistent connection, state management

**Recommendation:** Start with A (re-query), evaluate B if responsiveness critical.

---

## Appendix

### A. Technology Comparison

#### Why Convex over Supabase?

| Feature | Convex | Supabase |
|---------|--------|----------|
| **Real-time** | Built-in reactive queries | Realtime subscriptions (separate feature) |
| **TypeScript** | First-class (schema → types) | Requires codegen |
| **Functions** | Serverless (queries/mutations) | Edge functions (separate service) |
| **Schema** | Code-first (TypeScript) | SQL migrations |
| **Developer UX** | Single deployment command | Multiple services (DB, Auth, Storage, Edge) |
| **Cost** | Generous free tier | Free tier limited (500MB DB, 2GB storage) |

**Decision:** Convex - simpler, TypeScript-native, real-time built-in

---

#### Why ShadCN over Material UI?

| Feature | ShadCN | Material UI |
|---------|--------|--------------|
| **Bundle size** | ~50KB (tree-shaken) | ~300KB (full library) |
| **Customization** | Full control (copy-paste) | Theme overrides (limited) |
| **Tailwind** | Native | Requires emotion/styled-components |
| **Dependencies** | Radix UI primitives | @mui/* packages |
| **Versioning** | No breaking changes (you own code) | Major versions (v4 → v5 → v6) |

**Decision:** ShadCN - lightweight, full control, Tailwind-native

---

### B. Scaling Considerations

#### Horizontal Scaling

**Convex:**
- Automatically scales backend functions (no config)
- Database scales to handle load (managed by Convex)
- WebSocket connections load-balanced across servers

**Vercel:**
- Edge network for static assets (global CDN)
- Serverless functions auto-scale (per-request isolation)
- Geographic distribution (route to nearest edge)

**Agent Execution:**
- Each request spawns isolated agent process
- Parallel requests handled automatically by Vercel
- No shared state between executions

#### Vertical Scaling

**Convex Limits (Free Tier):**
- 10,000 concurrent WebSocket connections
- 1GB database storage
- 100,000 function executions/day

**Upgrade Path:**
- Pro tier: 100,000 connections, 10GB storage, unlimited executions
- Enterprise: Custom limits

**Vercel Limits (Hobby Tier):**
- 100GB bandwidth/month
- 100 hours serverless execution/month

**Upgrade Path:**
- Pro tier: 1TB bandwidth, 1000 hours execution

#### Bottleneck Analysis

| Component | Limit | Mitigation |
|-----------|-------|------------|
| **Anthropic API** | 500 req/min | Cache responses, batch requests |
| **MCP Spawn Time** | 1-2s per request | Pool connections, keep-alive |
| **Convex Subscriptions** | 10,000 concurrent | Upgrade plan, optimize queries |
| **Vercel Functions** | 10s max duration | Break into smaller operations |

---

### C. Monitoring Strategy

#### Application Metrics

**Convex Dashboard:**
- Function execution times (P50, P95, P99)
- Error rates per function
- Database query performance
- WebSocket connection count

**Vercel Analytics:**
- Page load times
- API route latency
- Geographic distribution
- Error tracking

**Custom Logging:**

```typescript
// Structured logging in Convex
console.log({
  level: "info",
  function: "defects.create",
  userId: ctx.auth.userId,
  projectId: args.projectId,
  duration: Date.now() - startTime
});
```

#### Agent Metrics

**Track via Hooks:**

```typescript
// In query() options
hooks: {
  PreToolUse: async ({ toolName, input }) => {
    await logToolUse({
      toolName,
      input,
      timestamp: Date.now(),
      projectId: currentProjectId
    });
  },

  PostToolUse: async ({ toolName, output, error, durationMs }) => {
    await logToolResult({
      toolName,
      success: !error,
      error: error?.message,
      duration: durationMs
    });
  }
}
```

**Metrics to Track:**

- Tool call frequency (which tools used most)
- Tool success rate (validation errors, scope violations)
- Average execution time per tool
- Agent session duration
- Skill load times

#### Alerts

**Critical Alerts:**
- Error rate > 5% for any Convex function
- Agent API rate limit exceeded
- MCP server spawn failures
- WebSocket disconnections > 10% users

**Warning Alerts:**
- P95 latency > 1s for any function
- Database storage > 80% limit
- Bandwidth usage > 80% limit

---

### D. Security Considerations

#### Threat Model

**Threats NOT in Scope (Current):**

- Public access (app is internal)
- Multi-tenancy attacks (single demo user)
- Authentication bypass (no auth yet)

**Threats IN Scope:**

1. **Cross-project data leaks:**
   - Mitigation: Scope enforcement in MCP server (mandatory projectId)

2. **Agent prompt injection:**
   - Mitigation: Validate tool inputs, sanitize user messages

3. **Excessive database writes:**
   - Mitigation: Rate limiting, changeset size limits

4. **Audit trail tampering:**
   - Mitigation: Append-only activity logs, separate table

#### Security Roadmap

**Phase 1 (Current):**
- Scope enforcement
- Audit logging
- Input validation

**Phase 2 (Post-Auth):**
- Role-based access control
- Project-level permissions
- Worker restrictions

**Phase 3 (Production):**
- Encryption at rest
- Field-level encryption (PII)
- Compliance certifications (SOC 2, ISO 27001)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-21
**Next Review:** After MCP server implementation (Phase 1)
