# 05: AI System Architecture

> Complete AI system specification for PRJ Construction rebuild using Claude Agents SDK

**Date:** 2026-01-21
**Status:** Specification
**Dependencies:** 01-vision.md, 02-architecture.md, 04-schema.md

---

## 1. Purpose & Scope

### What This Document Covers

This spec defines Chief's AI architecture—the complete operational intelligence layer for PRJ Construction.

**In Scope:**
- Claude Agents SDK integration patterns
- MCP server for database access (Convex)
- Skills structure and progressive loading
- Subagent orchestration for workflows
- Tool definitions and execution
- Prompt architecture and instruction design
- Autonomy levels (Advisor → Operator → Autopilot)
- Undo system and changeset management
- Session management and context
- Hooks for monitoring and control

**Out of Scope:**
- UI components → see 06-ui-system.md
- Database tables → see 04-schema.md
- Business domain logic → see 03-domain-model.md

### Critical Constraint

**CLAUDE SDK ONLY**: This spec describes the system using exclusively Claude Agents SDK. Zero references to OpenAI Agents SDK or ChatKit.

The AI system is built on:
- Claude Agents SDK (TypeScript) for orchestration
- MCP (Model Context Protocol) for database access
- Skills for modular instruction loading
- Subagents for complex workflow delegation
- ShadCN + Tailwind for UI (no ChatKit)

---

## 2. Overview

### Chief's Role

Chief is the **AI operations layer** for construction—not a chatbot, but the thing that runs operations while humans observe and approve.

**Core Identity:**
- Monitors project state across all domains
- Identifies what needs attention (overdue, expiring, stalled)
- Executes routine/reversible actions directly
- Escalates significant decisions to humans
- Learns from interactions and corrections

**Design Principle:** Speed over caution. Chief biases toward action and course-corrects. Construction moves fast; Chief keeps pace.

### System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                   Chat UI (ShadCN)                           │
│          Message List · Input · Action Buttons               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│            Next.js API Route: /api/chief/run                │
│                  (Server-Sent Events)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Claude Agents SDK                           │
│                   query() function                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   CLAUDE.md  │  │    Skills    │  │  Subagents   │      │
│  │   (global)   │  │  (modular)   │  │ (workflows)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │           MCP Server (Convex)                    │       │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │       │
│  │  │db_read  │  │db_write │  │  undo   │          │       │
│  │  └─────────┘  └─────────┘  └─────────┘          │       │
│  └──────────────────────┬────────────────────────────┘      │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│               Convex Database (Cloud)                        │
│                    52 tables                                 │
└─────────────────────────────────────────────────────────────┘
```

### Execution Flow

1. **User message** → UI sends to API route
2. **API route** → Invokes `query()` with message + context
3. **Claude SDK** → Loads CLAUDE.md + relevant skills
4. **Agent reasoning** → Decides which tools/subagents to use
5. **Tool execution** → Calls MCP tools (db_read, db_write)
6. **MCP server** → Enforces scope, executes Convex operations
7. **Streaming response** → Events flow back to UI
8. **UI rendering** → Shows text + structured data + undo

---

## 3. Core Concepts

### Concept 1: Agent-First Architecture

Chief is central, not peripheral. Operations flow through Chief.

**Traditional SaaS:** Human clicks through forms → Software stores data
**PRJ Construction:** Chief monitors/acts → Human approves/handles exceptions

**Implication:** UI becomes secondary. Chief is primary interaction surface.

### Concept 2: MCP for Database Access

Claude accesses Convex via Model Context Protocol—a standard interface between AI and data systems.

**Why MCP:**
- Standard protocol (not custom tools)
- Supports multiple data sources
- Future-proof (adopted by OpenAI, Anthropic, others)
- Security boundaries enforced at protocol level

**Architecture:**
- MCP server runs as Node.js process
- Communicates via stdin/stdout (JSON-RPC)
- Enforces projectId scope automatically
- Returns structured data to agent

### Concept 3: Skills for Modular Context

Chief doesn't load all instructions upfront. Skills load progressively based on task.

**Structure:**
- **CLAUDE.md:** Global identity, behavior, rules
- **Skills:** Task-specific instructions (database-write, swms-creator)
- **References:** Detailed docs within skills (loaded on demand)
- **Scripts:** Executable code (never loaded, only output)

**Loading Hierarchy:**
1. CLAUDE.md (always loaded, ~500 lines)
2. Skill metadata (name + description, ~100 words each)
3. Skill body (loaded when triggered, ~300 lines)
4. Skill references (loaded as needed, ~1000 lines)

**Benefit:** Context stays focused. 5 skills available ≠ 5 skills loaded.

**Critical Requirement:** Skills will NOT load unless `settingSources` is configured:

```typescript
// Skills will not load (missing settingSources)
query({
  prompt: "Use domain-swms skill",
  options: {
    allowedTools: ['Skill', 'mcp__convex__db_read'],
    cwd: process.cwd()
  }
})

// Correct - skills load from .claude/skills/
query({
  prompt: "Use domain-swms skill",
  options: {
    allowedTools: ['Skill', 'mcp__convex__db_read'],
    cwd: process.cwd(),
    settingSources: ['project']  // REQUIRED
  }
})
```

| settingSources value | Loads from |
|---------------------|-----------|
| `['project']` | `.claude/` in cwd |
| `['user']` | `~/.claude/` |
| `['project', 'user']` | Both (project overrides user) |

Omitting settingSources means CLAUDE.md and skills are ignored.

### Concept 4: Subagents for Complex Workflows

Orchestrator delegates to specialized agents for focused subtasks.

**Example: SWMS Creation**
- **Orchestrator:** Coordinates overall workflow
- **hazard-analyzer:** Identifies construction hazards (Opus model)
- **swms-validator:** Checks compliance (Sonnet model)
- **swms-writer:** Creates document (Sonnet model)

**Benefits:**
- Parallel execution (3 agents run concurrently)
- Specialized models (Opus for analysis, Sonnet for writing)
- Isolated context (each agent focused on one job)
- Reusable (same agents across projects)

**Task Tool Required:** Subagents cannot be invoked without the Task tool.

```typescript
// Subagents unavailable
query({
  prompt: "Use code-reviewer agent",
  options: {
    allowedTools: ['Read', 'Grep'],
    agents: { 'code-reviewer': {...} }  // Won't be invoked
  }
})

// Subagents available
query({
  prompt: "Use code-reviewer agent",
  options: {
    allowedTools: ['Read', 'Grep', 'Task'],  // Task required
    agents: { 'code-reviewer': {...} }
  }
})
```

**Model Selection Values:**

AgentDefinition supports these model values:
- `'sonnet'` - Claude Sonnet (balanced)
- `'opus'` - Claude Opus (highest reasoning)
- `'haiku'` - Claude Haiku (fastest, simple tasks)
- `'inherit'` - Use parent agent's model

Example:
```typescript
agents: {
  'analyzer': {
    description: 'Deep hazard analysis',
    prompt: '...',
    model: 'opus'  // Not 'claude-opus-4-5-20250929'
  }
}
```

### Concept 5: Progressive Autonomy

Chief's behavior evolves with trust:

**Level 1: Advisor**
- Observes everything
- Surfaces what needs attention
- User takes all actions
- No db_write without explicit request

**Level 2: Operator (Current Target)**
- Executes routine/reversible actions
- Uses db_write with undo
- Confirms before high-risk actions
- User approves significant changes

**Level 3: Autopilot (Future)**
- Handles operations autonomously
- User sees summaries
- Intervention only for exceptions
- Requires trust establishment

**Implementation:** Autonomy level configured per org. Starts at Advisor, progresses as trust builds.

---

## 4. Detailed Specification

### 4.1 Architecture Components

#### Component 1: Entry Point (Next.js API Route)

**Location:** `app/api/chief/run/route.ts`

**Purpose:** Streaming endpoint for Chief conversations

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

export async function POST(req: Request) {
  const { message, projectId, conversationId, sessionId } = await req.json();

  // Create streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Execute agent in background
  (async () => {
    try {
      for await (const event of query({
        prompt: message,
        options: {
          resume: sessionId, // Continue conversation
          cwd: process.cwd(),
          settingSources: ['project'], // Load .claude/ directory
          allowedTools: [
            'mcp__convex__db_read',
            'mcp__convex__db_write',
            'mcp__convex__undo',
            'Skill',
            'Task'
          ],
          mcpServers: {
            convex: {
              command: 'node',
              args: ['mcp-server-convex/index.js'],
              env: {
                CONVEX_URL: process.env.CONVEX_URL!,
                PROJECT_ID: projectId
              }
            }
          },
          hooks: {
            PreToolUse: preToolUseHandler,
            PostToolUse: postToolUseHandler
          }
        }
      })) {
        // Stream event to client
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );

        // Capture session ID
        if (event.type === 'system' && event.subtype === 'init') {
          await saveSessionId(conversationId, event.session_id);
        }
      }

      await writer.close();
    } catch (error) {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
      );
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

**MCP Tool Input Mode Constraint:**

**Critical:** Custom in-process MCP servers require streaming input mode.

Single message input:
```typescript
// This WILL NOT work with custom MCP servers
query({
  prompt: "Use custom tool",
  options: { mcpServers: { custom: customServer } }
})
```

Streaming input (required):
```typescript
async function* generateMessages() {
  yield { type: "user" as const, message: { role: "user" as const, content: "Use custom tool" } };
}

query({
  prompt: generateMessages(),  // Must be async generator
  options: { mcpServers: { custom: customServer } }
})
```

External stdio/HTTP MCP servers work with both modes.

#### Component 2: MCP Server (Convex)

**Location:** `mcp-server-convex/index.ts`

**Purpose:** Bridge between Claude and Convex database

**Implementation:**

```typescript
import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk/mcp';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.CONVEX_URL!);
const projectId = process.env.PROJECT_ID!;

const server = createSdkMcpServer({
  name: 'convex',
  version: '1.0.0'
});

// Tool 1: db_read
server.addTool({
  name: 'db_read',
  description: `Query Convex database tables with automatic projectId filtering.
Returns up to 100 records per query.

Use when:
- Viewing existing data
- Checking for duplicates before write
- Analyzing project state

Scope: Automatically filters by projectId. Cannot read cross-project data.`,

  inputSchema: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        enum: [
          'projects', 'tasks', 'defects', 'swmsDocuments', 'workers',
          'incidents', 'permits', 'checklists', 'assets', 'schedule',
          // ... all 52 tables
        ],
        description: 'Table to query'
      },
      filter: {
        type: 'object',
        description: 'Field filters (e.g., { status: "open", priority: "high" })'
      },
      limit: {
        type: 'number',
        maximum: 100,
        default: 20,
        description: 'Maximum records to return'
      },
      orderBy: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          direction: { type: 'string', enum: ['asc', 'desc'] }
        },
        description: 'Sort specification'
      }
    },
    required: ['table']
  },

  async run({ table, filter, limit, orderBy }) {
    // Inject projectId for scope enforcement
    const scopedFilter = {
      ...filter,
      projectId
    };

    // Query Convex
    const result = await convex.query(api[table].list, {
      filter: scopedFilter,
      limit: limit || 20,
      orderBy
    });

    return {
      type: 'text',
      text: JSON.stringify({
        records: result,
        count: result.length,
        scope: { projectId }
      }, null, 2)
    };
  }
});

// Tool 2: db_write
server.addTool({
  name: 'db_write',
  description: `Create, update, or delete records with validation and undo support.
All operations wrapped in changeset for atomic execution and rollback.

Use when:
- Creating new records (defects, tasks, documents)
- Updating existing records (status changes, assignments)
- Deleting records (cleanup, resolution)

Always provide clear reason for audit trail.

Scope: All operations must be within current projectId.`,

  inputSchema: {
    type: 'object',
    properties: {
      operations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['create', 'update', 'delete'],
              description: 'Operation type'
            },
            table: {
              type: 'string',
              description: 'Target table'
            },
            id: {
              type: 'string',
              description: 'Record ID (required for update/delete)'
            },
            data: {
              type: 'object',
              description: 'Record data (required for create/update)'
            },
            reason: {
              type: 'string',
              description: 'Why this change is being made'
            }
          },
          required: ['type', 'table', 'reason']
        }
      }
    },
    required: ['operations']
  },

  async run({ operations }) {
    // Validate all operations
    for (const op of operations) {
      if (op.type === 'create' || op.type === 'update') {
        if (!op.data) {
          throw new Error(`${op.type} requires data field`);
        }
      }
      if (op.type === 'update' || op.type === 'delete') {
        if (!op.id) {
          throw new Error(`${op.type} requires id field`);
        }
      }
    }

    // Inject projectId
    const scopedOperations = operations.map(op => ({
      ...op,
      data: op.data ? { ...op.data, projectId } : undefined
    }));

    // Execute via Convex mutation (atomic)
    const result = await convex.mutation(api.changesets.execute, {
      operations: scopedOperations,
      projectId
    });

    return {
      type: 'text',
      text: JSON.stringify({
        changesetId: result.changesetId,
        results: result.results,
        undoAvailable: true
      }, null, 2)
    };
  }
});

// Tool 3: undo
server.addTool({
  name: 'undo',
  description: `Reverse a changeset by replaying inverse operations.
All changes from the changeset are rolled back atomically.

Use when:
- User requests undo
- Mistake detected immediately after write
- Testing scenario needs rollback

Limitations:
- Cannot undo changesets older than 24 hours
- Cannot undo if dependent data created
- Cannot undo already-undone changesets`,

  inputSchema: {
    type: 'object',
    properties: {
      changesetId: {
        type: 'string',
        description: 'ID of changeset to undo'
      }
    },
    required: ['changesetId']
  },

  async run({ changesetId }) {
    // Execute undo via Convex
    const result = await convex.mutation(api.changesets.undo, {
      changesetId,
      projectId // Validate changeset belongs to project
    });

    if (!result.success) {
      return {
        type: 'text',
        text: JSON.stringify({
          success: false,
          reason: result.reason
        }, null, 2)
      };
    }

    return {
      type: 'text',
      text: JSON.stringify({
        success: true,
        operationsReversed: result.operationsReversed,
        message: 'Changeset successfully undone'
      }, null, 2)
    };
  }
});

export default server;
```

**Key Behaviors:**
- **Scope Enforcement:** projectId injected automatically, cannot be overridden
- **Validation:** All operations validated before execution
- **Atomic Execution:** All operations succeed or all fail
- **Undo Support:** Every write creates reversible changeset
- **Clear Errors:** Actionable error messages for debugging

**Tool Registry:**

Beyond the 3 core MCP tools, system includes additional tools via factory pattern.

**Location:** `lib/ai/tools/create-toolkit.ts`

**Purpose:** Factory function that assembles tool set based on context and model capabilities

```typescript
export function createToolkit(params: {
  context: ChiefRequestContext;
  modelEntry: ModelRegistryEntry;
}): ChiefAgentsTool[]
```

**Tools Included:**
1. `ai.preamble` - Status line updates (always)
2. `ai.db_read` - Database queries (always)
3. `ai.read_document` - Document analysis (always)
4. `ai.db_write` - Database mutations (always)
5. `ai.present` - Widget rendering (always)
6. `ai.ui_navigate` - Navigation suggestions (always)
7. `web_search` - Web search (conditional on modelEntry.supportsWebSearch)

**Context Injection:** All tools receive ChiefRequestContext containing:
- `projectId`: Current project scope
- `orgId`: Organization scope
- `userId`: Current user
- `currentPath`: UI path for inference
- `screen`: Mobile simulator state

**Additional Tool Details:**

##### Tool: ai.preamble

**Purpose:** Update user-visible status line with construction domain language

**Schema:**
```typescript
{
  text: string // Format: "Title — Detail" using construction terms
}
```

**Rules:**
- REQUIRED: Use domain terms (defects, permits, SWMS, workers, inspections)
- FORBIDDEN: Technical terms (database, table, query, fetch, mutation)
- Format: "Finding defects — Looking for open issues in Zone A"

**Examples:**
✓ "Finding defects — Looking for high priority issues"
✓ "Reviewing permits — Checking expiry dates"
✗ "Searching database — Fetching records"
✗ "Processing — Analyzing results"

**Usage:** Called before long operations to show progress

##### Tool: ai.present

**Purpose:** Render ChatKit widgets with structured data

**Artifact Types:**

1. **result** - Operation outcome (after create/update/delete)
   - Single operation: entityType, operation, title, description, chips, viewPath, executionId
   - Multi-operation: operations[] array with max 25 items
   - Undo support via executionId

2. **questions** - Gather missing info via bounded choices
   - questions[] with id, question, options[], multiSelect
   - ONLY for bounded choices (status, priority, category)
   - NEVER for free-form fields (title, description)

3. **confirm** - Verify destructive/bulk actions
   - title, message, items[], warning, confirmLabel, confirmVariant
   - Use before delete/archive/bulk operations

4. **sources** - Web search citations
   - items[] with title, url, snippet, favicon
   - Always paired with text summary

5. **intake** - File upload analysis (system-triggered)
   - intakeId, fileName, status, analysis
   - Usually auto-triggered on file upload

**Hydration:** Result artifacts auto-hydrated via `hydrateResultArtifact()` to resolve entity metadata

##### Tool: ai.ui_navigate

**Purpose:** Suggest navigating user to specific page

**Parameters:**
- `path`: Direct path (if known)
- `module`: Module name (e.g., "site", "safety")
- `submodule`: Submodule name (e.g., "defects", "permits")
- `entityType`: Entity type + entityId for detail pages
- `pageNumber`: Pagination support
- `ctaLabel`: Button text
- `description`: Navigation context
- `external`: Flag for external URLs

**Path Resolution:**
1. If entityType + entityId provided → buildEntityUrl()
2. If submodule provided → resolveSubmodule() + buildProjectUrl()
3. If path provided → validate and normalize
4. Auto-inject projectId if context available

**Output:** Artifact with kind='result', viewPath set for navigation trigger

##### Tool: ai.read_document

**Purpose:** Read and analyze project/org documents from sourceDocuments table

**Parameters:**
- `documentId`: Document ID to read
- `focus`: Optional focus directive (e.g., "extract expiry date")

**Processing Pipeline:**
1. **Scope validation** - Check projectId/orgId present
2. **Document lookup** - Query aiDocuments.getForRead
3. **Type detection:**
   - Text-like (txt, csv, md, json) → direct download, return preview
   - PDF → tryExtractPdfText() via pdfjs-dist
   - Other → OpenAI vision API analysis
4. **Fallback chain:**
   - OpenAI with fileUrl
   - OpenAI with blob upload
   - Local PDF text extraction
   - Error

**OpenAI Analysis:** Uses GPT-4o-mini by default, returns structured JSON:
- summary (≤120 words)
- suggestedDocType (insurance, certificate, sds, swms, permit)
- suggestedTitle (≤80 chars)
- suggestedTags (≤8)
- confidence (0-1)
- questions (0-3 clarifying)
- extracted (≤12 key facts)

**Limits:**
- MAX_TEXT_CHARS: 40,000
- MAX_DOWNLOAD_BYTES_FOR_AI: 30MB
- PDF max pages: 50
- PDF max chars: 80,000

**Focus Handling:** If focus provided, prioritize extracting relevant details in "extracted" field

##### db_read Operations

**Request Schema:** Discriminated union by `op` field, max 20 requests per call

1. **describe_schema** - List all tables
   - Returns: schemaVersion, tables[] (name, scopeHint, description)
   - Caps at maxTablesInDescribeSchema

2. **describe_table** - Get table structure
   - Args: table name
   - Returns: schemaVersion, table (fields[], indexes[], searchIndexes[])
   - Caps at maxFieldsInDescribeTable
   - Auto-suggests similar tables if unknown

3. **get** - Single record by ID
   - Args: table, id
   - Optional: select[], includeLargeFields
   - Returns: record or NOT_FOUND

4. **multi_get** - Multiple records by IDs
   - Args: table, ids[] (max maxIdsPerMultiGet)
   - Optional: select[], includeLargeFields
   - Returns: array of records (nulls for missing)

5. **list** - Query with index
   - Args: table, index, indexEq[], filters[], order, allowScan
   - Optional: select[], includeLargeFields, limit, cursor
   - Auto-selects index if projectId/orgId available
   - Enforces indexEnforcementMode policy
   - Returns: records[], cursorNext, truncated flag

6. **search_text** - Full-text search
   - Args: table, searchIndex, searchField, query, filters[]
   - Optional: select[], limit, cursor
   - Auto-injects scope filters
   - Returns: records[], cursorNext

7. **document_metadata** - Document with chunk preview
   - Args: documentId, previewChars
   - Optional: select[]
   - Returns: document + first 6 chunks
   - Caps at maxPreviewChars

8. **drawing_metadata** - Drawing metadata
   - Args: drawingId
   - Optional: select[]
   - Returns: drawing record with annotations

9. **document_chunks** - Paginated chunks
   - Args: documentId, limit, cursor
   - Returns: chunks[], cursorNext
   - Caps at maxChunksPerPage

**Table/Index Normalization:**
- Case-insensitive matching
- Auto-suggestion via scoreSuggestion() algorithm
- Prefix matching + substring matching + length penalty

**Scope Enforcement:**
- projectId/orgId auto-injected based on table.scopeHint
- 'project' tables → require projectId, filter by projectId
- 'org' tables → require orgId, filter by orgId
- 'mixed' tables → use available scope
- Cannot override via request args

##### db_write Advanced Features

**Scope Taxonomy:**
- `bootstrap`: Initial project setup
- `onboarding`: New user/worker onboarding
- `ops_gap`: Operational issue resolution
- `variation`: Scope change handling
- `artifact`: Document/file creation
- `close_out`: Project completion tasks
- `other`: General operations

**Parameters:**
- `scope`: Required scope classification
- `title`: Operation summary (1-200 chars)
- `summary`: Detailed description
- `priority`: low | medium | high (default: medium)
- `items[]`: Operations array (1-25 items)

**Operation Types:**
1. **create** - Insert new record
   - Requires: targetTable, payload
   - Returns: createdId

2. **update** - Patch existing record
   - Requires: targetTable, targetId, payload
   - Returns: targetId

3. **delete** - Remove record
   - Requires: targetTable, targetId
   - Returns: targetId

4. **call** - Execute custom operation
   - Requires: targetTable, payload: { opKey, args }
   - For complex operations beyond CRUD
   - Returns: operation-specific result

**Payload Coercion:**
- Plain object → pass through
- Array [{ key, value }, ...] → Object.fromEntries()
- Stringified JSON → JSON.parse()
- Enables flexible input formats

**projectId Inference:**
1. context.projectId (explicit)
2. inferProjectIdFromPath(context.currentPath)
3. inferProjectIdFromPath(context.screen?.currentPath)
4. Error if none available

**Execution Tracking:**
- Returns: executionId (for undo), results[] (per-operation status)
- Stored in executions table with createdByUserId
- Result artifact with viewPath for first created/updated entity

**Chips Generation:** Auto-builds chips from results:
- Status: "Applied" (all ok) | "Partial" (some failed)
- Priority: low | medium | high
- Info: "N succeeded"
- Warning: "N failed" (if any)

##### Data Access Policy

**File:** `lib/ai/policy.ts`

**Constants:**
```typescript
export const DEFAULT_DATA_POLICY = {
  maxRequestsPerCall: 20,            // Max batched requests in db_read
  maxTablesInDescribeSchema: 100,    // Schema introspection limit
  maxFieldsInDescribeTable: 200,     // Table structure limit
  maxRowsPerList: 100,               // List query page size
  maxIdsPerMultiGet: 50,             // Multi-get batch limit
  maxPreviewChars: 2000,             // Document preview chars
  maxChunksPerPage: 6,               // Document chunks per page
  maxCharsPerChunk: 4000,            // Chunk size limit
  indexEnforcementMode: 'index_only' | 'allow_scan', // Query strategy
};
```

**Purpose:**
- Prevent excessive data transfer
- Enforce pagination
- Control query performance
- Limit token consumption

**Enforcement:** Applied in executeDbRead() before Convex queries

##### Error Handling with Smart Suggestions

**Algorithm:** `scoreSuggestion(input, candidate)`
- Prefix matching (exact chars from start)
- Exact match bonus (+100)
- Substring match bonus (+30)
- Reverse substring bonus (+10)
- Length difference penalty (-0.2 per char)

**Table Name Resolution:**
1. Exact match → return
2. Case-insensitive match → return
3. No match → return top 8 suggestions
4. Error: "Unknown data area requested: X. Did you mean: A, B, C?"

**Index Name Resolution:**
1. Validate table exists
2. Exact match → return
3. Case-insensitive match → return
4. No match → return top 8 suggestions
5. Error: "Unknown index: table.index. Available indexes: A, B, C"

**Search Index Resolution:** Same pattern as index resolution

**Benefits:**
- Reduces trial-and-error
- Handles typos gracefully
- Guides agent to correct names
- Improves success rate

##### Auto-Index Selection

**Function:** `pickAutoIndex(tableName, context)`

**Strategy:**
1. If context.projectId present:
   - Find indexes with projectId as first field
   - Sort by field count (prefer simpler indexes)
   - Return shortest matching index

2. If context.orgId present (and no projectId):
   - Find indexes with orgId as first field
   - Sort by field count
   - Return shortest matching index

3. If neither present:
   - Return null (require explicit index or scan)

**Example:**
- Table: defects
- Indexes: by_project (projectId), by_project_status (projectId, status)
- Context: { projectId: "proj_123" }
- Selected: by_project (simpler index preferred)
- Warning added: "Auto-selected index: by_project"

**Fallback:** If no suitable index and allowScan=false → INDEX_REQUIRED error

##### Scope Injection Rules

**Decision Matrix:**

| Table Hint | Index Fields | context.projectId | Action |
|------------|--------------|-------------------|--------|
| project | includes projectId | present | Inject projectId filter |
| project | no projectId | present | Error (can't scope) |
| org | includes orgId | present | Inject orgId filter |
| mixed | includes projectId | present | Inject projectId filter |
| mixed | includes orgId | present (no proj) | Inject orgId filter |
| mixed | both | both present | Inject both |
| global | - | - | No injection |

**Implementation:**
```typescript
const shouldInjectProject =
  Boolean(context.projectId) &&
  hasField(tableName, 'projectId') &&
  (table.scopeHint === 'project' ||
   (table.scopeHint === 'mixed' && indexUsesProject));

if (shouldInjectProject && context.projectId) {
  ensureEq(filters, 'projectId', context.projectId);
}
```

**Purpose:**
- Prevent cross-project data leaks
- Enforce least privilege
- Simplify agent logic (no manual filtering)
- Cannot be overridden by agent

##### Result Artifact Processing

**Flow:**
1. executeDbWrite() returns executionId + results[]
2. Build viewPath for first operation:
   - Use createdId (create) or targetId (update/delete)
   - Call buildViewPathFromTable(projectId, targetTable, recordId)
   - Maps table names to UI routes
3. Build chips from results (status, priority, success count, fail count)
4. Construct AIArtifact:
   ```typescript
   {
     kind: 'result',
     entityType: firstItem.kind,
     operation: 'created' | 'updated' | 'deleted',
     title: parsed.data.title,
     description: parsed.data.summary,
     chips: [...],
     viewPath: "...path...",
     executionId: "...",
     undoable: true
   }
   ```
5. Hydrate via hydrateResultArtifact() - resolves entity metadata
6. Return as JSON string

**buildViewPathFromTable():** Mapping function (lib/ai/navigation.ts)
- defects → /projects/:projectId/defects/:defectId
- swmsDocuments → /projects/:projectId/swms/:swmsId
- workers → /projects/:projectId/workers/:workerId
- etc.

**Chip Variants:**
- status: blue (Applied, Open, Approved)
- priority: orange (Low, Medium, High)
- info: gray (counts, metadata)
- warning: yellow (Partial, errors)

##### ChiefRequestContext Interface

**Definition:** Core context object passed to all tools

```typescript
interface ChiefRequestContext {
  projectId?: string | null;      // Current project scope
  orgId?: string | null;          // Organization scope
  userId?: string;                // User executing action
  currentPath?: string;           // UI path for inference
  screen?: {                      // Mobile simulator state
    currentPath?: string;
    context?: Record<string, unknown>;
  };
  conversationId?: string;        // Chat thread ID
  sessionId?: string;             // Claude SDK session
}
```

**Source:** Constructed in API route, passed to createToolkit()

**Inheritance:** Each tool creator receives context and closes over it:
```typescript
export function createDbReadTool(context: ChiefRequestContext) {
  return tool({
    name: 'ai.db_read',
    // context accessible in execute()
    execute: async (params) => executeDbRead(context, params)
  });
}
```

**Scope Enforcement:** Tools use context.projectId and context.orgId for all queries

##### Built-in Tools (Claude SDK)

Beyond MCP tools, Claude SDK provides:

| Tool | Description | Use Case |
|------|-------------|----------|
| **Read** | Read any file in working directory | Load context, analyze code |
| **Write** | Create new files | Generate documents, code |
| **Edit** | Make precise edits to files | Modify existing code |
| **Bash** | Run terminal commands | Test, build, git operations |
| **Glob** | Find files by pattern | Locate files across codebase |
| **Grep** | Search file contents with regex | Find code patterns |
| **WebSearch** | Search web for current info | Research, fact-checking |
| **WebFetch** | Fetch and parse web pages | Documentation, articles |
| **AskUserQuestion** | Ask clarifying questions | Disambiguation, choices |
| **Task** | Invoke subagents | Delegate complex subtasks |
| **Skill** | Load specialized instructions | Domain expertise on demand |

**Naming:** Built-in tools use simple names. MCP tools use `mcp__<server>__<tool>` pattern.

#### Component 3: Skills System

**Location:** `.claude/`

**Directory Structure:**

```
.claude/
├── CLAUDE.md                      # Global instructions (always loaded)
└── skills/
    ├── database-read/
    │   ├── SKILL.md               # When/how to query
    │   └── references/
    │       └── query-patterns.md  # Complex query examples
    ├── database-write/
    │   ├── SKILL.md               # Write rules, validation
    │   └── references/
    │       ├── validation-rules.md
    │       └── field-defaults.md
    ├── database-undo/
    │   └── SKILL.md               # Undo workflow
    ├── domain-swms/
    │   ├── SKILL.md
    │   └── references/
    │       ├── swms-schema.md
    │       ├── swms-sections.md
    │       └── hazard-library.md
    ├── domain-defects/
    │   ├── SKILL.md
    │   └── references/
    │       └── defect-priorities.md
    ├── domain-checklists/
    │   └── SKILL.md
    ├── domain-inductions/
    │   └── SKILL.md
    ├── domain-permits/
    │   └── SKILL.md
    ├── domain-assets/
    │   └── SKILL.md
    ├── domain-schedule/
    │   └── SKILL.md
    └── context-loader/
        └── SKILL.md
```

**CLAUDE.md (Global Instructions):**

```markdown
# Chief: AI Operations Layer for Construction

## Identity

You are Chief, an AI that runs construction operations.

You are not an assistant that helps users.
You ARE the operations layer.

Users observe and approve.
You execute.

## Behavior

**Speed over caution**
- Act quickly, course-correct if needed
- Construction moves fast; you keep pace

**Ask when uncertain**
- One clarifying question beats wrong assumption
- Prefer asking over guessing on important matters

**Minimal explanation for routine**
- Don't over-explain simple actions
- Users trust you to handle routine work

**Full context for significant**
- Explain reasoning for major decisions
- Show your thinking on high-risk actions

## Core Rules

1. **Always db_read before db_write** - Check before change
2. **Use db_write for ALL mutations** - Enables undo
3. **Present structured data for UI** - Clear, parsable results
4. **Stay within project scope** - Automatic, cannot override
5. **Offer undo after mutations** - Every write reversible

## What You Do

- Monitor project state across all domains
- Identify what needs attention (overdue, expiring, stalled)
- Execute routine/reversible actions directly
- Escalate significant decisions to humans
- Learn from corrections and preferences

## What You Do NOT Do

- Replace human judgment on high-stakes decisions
- Communicate with external parties (subcontractors, clients)
- Enforce compliance (guide, don't block)
- Impose process changes (follow org configuration)

## Autonomy

Current level: **Operator**

- Execute routine/reversible actions with undo
- Confirm before high-risk actions
- Learn from user corrections

## Tools Available

- `mcp__convex__db_read` - Query database
- `mcp__convex__db_write` - Mutate database
- `mcp__convex__undo` - Reverse changeset
- `Skill` - Load specialized instructions
- `Task` - Delegate to subagents

## Skills Available

Skills load automatically when relevant.
You have access to:
- Database operations (read, write, undo)
- Domain expertise (SWMS, defects, permits, etc.)
- Context loading (project data, standards)

See `.claude/skills/` for available skills.
```

**Skill Example: database-write**

**File:** `.claude/skills/database-write/SKILL.md`

```markdown
---
name: database-write
description: Create, update, or delete database records with validation and undo support. Use when user requests data changes, or when you identify actions to take.
---

## When to Use

- Creating new records (defects, tasks, SWMS, etc.)
- Updating existing records (status changes, assignments)
- Deleting records (cleanup, resolution)

## Pre-Write Checks

Before EVERY write:

1. **Read first** - Use db_read to check for duplicates or conflicts
2. **Validate data** - Ensure all required fields present
3. **Check relationships** - Verify foreign keys exist
4. **Confirm scope** - Must be within current projectId (automatic)

## Validation Steps

### Required Fields

Check table requirements:
- Every table needs projectId (auto-injected)
- Most tables need: createdAt, createdBy, status
- Load `references/validation-rules.md` for table-specific rules

### Field Types

- **Enums:** Must match exact values (e.g., status: "open" | "in_progress" | "closed")
- **Timestamps:** ISO 8601 strings (e.g., "2026-01-21T10:30:00Z")
- **IDs:** Must reference existing records (verify with db_read)

### Auto-Populate

These fields populate automatically:
- `projectId` - From scope (cannot override)
- `createdAt` - Current timestamp
- `createdBy` - Current user ID
- `_id` - Generated by Convex

## Write Pattern

```typescript
mcp__convex__db_write({
  operations: [{
    type: "create",
    table: "defects",
    data: {
      title: "Cracked foundation in Building A",
      description: "Hairline crack observed during inspection",
      priority: "high",
      status: "open",
      assignedTo: "worker_123" // Verified exists via db_read
    },
    reason: "User reported structural issue during site walk"
  }]
})
```

## After Write

1. **Present confirmation** - Show what was created/updated
2. **Show undo option** - Display changesetId for reversal
3. **Suggest next actions** - What typically follows?

Example:
> Created defect #456: "Cracked foundation in Building A"
> Priority: High | Status: Open | Assigned to: John Smith
>
> [Undo this change]
>
> Next: Would you like to attach photos or create a corrective action?

## Common Validations

Load `references/validation-rules.md` for detailed field rules per table.

## Scope Rules

- **projectId auto-injected** - Cannot write to other projects
- **Validate related IDs** - Must be in same project
- **Cannot override scope** - Security boundary enforced
```

**File:** `.claude/skills/database-write/references/validation-rules.md`

```markdown
# Field Validation Rules

## Defects

- `title`: 1-200 chars, required
- `description`: max 5000 chars
- `priority`: enum ["low", "medium", "high", "critical"], required
- `status`: enum ["open", "in_progress", "resolved", "closed"], required
- `assignedTo`: must exist in workers table, same projectId

## SWMS Documents

- `title`: 1-100 chars, required
- `sections`: array of section objects, min 1, max 20
- `status`: enum ["draft", "pending_approval", "approved", "archived"]
- `approvedBy`: if status = "approved", must be valid userId with approval permission

## Tasks

- `title`: 1-200 chars, required
- `dueDate`: ISO timestamp, must be future date
- `assignedTo`: array of worker IDs, all must exist in project
- `dependencies`: array of task IDs, all must exist

## Workers

- `name`: 1-100 chars, required
- `email`: valid email format
- `phone`: optional, valid phone format
- `certifications`: array of certification objects

## Incidents

- `type`: enum ["injury", "near_miss", "property_damage", "environmental"]
- `severity`: enum ["minor", "moderate", "major", "critical"]
- `reportedAt`: ISO timestamp, required
- `investigatedBy`: userId, required if status = "investigating"
```

**Skill Example: domain-swms**

**File:** `.claude/skills/domain-swms/SKILL.md`

```markdown
---
name: domain-swms
description: Create, manage, and track Safe Work Method Statements. Use when user mentions SWMS, safe work, hazards, high-risk work, or JSAs.
---

## SWMS Overview

SWMS documents identify hazards and controls for high-risk construction work.

**Purpose:** Ensure workers understand risks and control measures before starting work.

**Required by:** Australian WHS Regulations for high-risk construction work.

## When to Use

- Creating new SWMS
- Editing existing SWMS
- Assigning SWMS to workers
- Checking SWMS signatures
- SWMS compliance queries

## SWMS Structure

13 section types (load `references/swms-sections.md` for details):

1. **Project Details** - Site info, dates, contacts
2. **Scope of Work** - What work is covered
3. **Legislation** - Applicable WHS regulations
4. **Definitions** - Terms used in document
5. **Responsibilities** - Who does what
6. **Training** - Required competencies
7. **PPE** - Personal protective equipment
8. **Hazards & Controls** - Risk assessment (CRITICAL)
9. **Emergency Procedures** - What if something goes wrong
10. **Plant & Equipment** - Tools and machinery
11. **Environmental** - Environmental controls
12. **Sign-Off** - Approval signatures
13. **Review** - Change history

## Creation Workflow

### Step 1: Check for Templates

```typescript
mcp__convex__db_read({
  table: "swmsTemplates",
  filter: { category: workType }
})
```

If template exists, use it. If not, create from scratch.

### Step 2: Build Sections

Focus on Hazards & Controls section (most critical):

**Pattern:**
- Identify activity (e.g., "Working at height")
- List hazards (e.g., "Falls from elevation")
- Map controls (e.g., "Scaffolding, harnesses, edge protection")
- Rate risk (before/after controls)

Load `references/hazard-library.md` for common construction hazards.

### Step 3: Review for Completeness

Check:
- [ ] All 13 sections present
- [ ] Hazards & Controls section has at least 3 entries
- [ ] Each hazard has at least 2 controls
- [ ] PPE section lists required equipment
- [ ] Emergency procedures include evacuation plan

### Step 4: Publish

```typescript
mcp__convex__db_write({
  operations: [{
    type: "create",
    table: "swmsDocuments",
    data: {
      title: "Working at Height - Building A",
      workType: "height",
      sections: [...],
      status: "draft" // or "pending_approval"
    },
    reason: "Created SWMS for height work as requested by user"
  }]
})
```

### Step 5: Assign to Workers

```typescript
mcp__convex__db_write({
  operations: workers.map(w => ({
    type: "create",
    table: "swmsAssignments",
    data: {
      swmsId: createdDocId,
      workerId: w.id,
      status: "pending_signature"
    },
    reason: "Assigned SWMS to workers for upcoming task"
  }))
})
```

## Common Queries

**"Show unsigned SWMS"**
```typescript
mcp__convex__db_read({
  table: "swmsDocuments",
  filter: { status: "approved" }
})
// Then check assignments for pending_signature
```

**"SWMS expiring soon"**
```typescript
mcp__convex__db_read({
  table: "swmsDocuments",
  filter: { expiryDate: { $lt: futureDate } }
})
```

## References

- `swms-schema.md` - Full table schema
- `swms-sections.md` - Section type details
- `hazard-library.md` - Common construction hazards
```

#### Component 4: Subagents (Workflow Orchestration)

**Location:** `.claude/agents/` (optional, or defined programmatically)

**Purpose:** Specialized agents for complex multi-step workflows

**Example: SWMS Creation Orchestrator**

```typescript
// Defined in code or .claude/agents/swms-orchestrator.md
const swmsAgents = {
  'hazard-analyzer': {
    description: 'Identifies construction hazards and suggests controls based on work type',
    prompt: `You analyze construction activities for hazards.

Reference Australian WHS standards and construction industry best practices.

For each activity:
1. List all potential hazards
2. Rate severity (minor/moderate/major/critical)
3. Suggest 3+ control measures per hazard
4. Prioritize controls by effectiveness

Output structured hazard/control pairs in JSON format.`,
    tools: ['Read'], // Load hazard library
    model: 'opus' // Higher reasoning for analysis
  },

  'swms-validator': {
    description: 'Validates SWMS completeness and compliance with Australian WHS regulations',
    prompt: `You validate SWMS documents.

Check:
- All 13 required sections present
- Hazard/control matching (each hazard has 2+ controls)
- Compliance with WHS regulations
- Completeness of emergency procedures
- PPE specifications adequate

Return validation report with pass/fail + issues list.`,
    tools: ['mcp__convex__db_read'], // Check standards
    model: 'sonnet'
  },

  'swms-writer': {
    description: 'Creates SWMS document from validated hazard data and template',
    prompt: `You format and write SWMS documents.

Follow organizational templates.
Use clear, simple language (construction workers are audience).
Ensure all sections complete and formatted consistently.

Output final SWMS ready for db_write.`,
    tools: ['mcp__convex__db_read', 'mcp__convex__db_write'],
    model: 'sonnet'
  }
};

// Usage in API route
for await (const message of query({
  prompt: "Create SWMS for concrete pouring at Building A",
  options: {
    allowedTools: ['Task', 'mcp__convex__db_read', 'mcp__convex__db_write', 'Read'],
    agents: swmsAgents,
    settingSources: ['project']
  }
})) {
  // Orchestrator flow:
  // 1. Task → hazard-analyzer (identify hazards for concrete work)
  // 2. Task → swms-validator (validate structure)
  // 3. Task → swms-writer (create document with validated data)
  // 4. Present result with undo option
}
```

**Model Selection Strategy:**

| Agent Type | Model | Rationale |
|------------|-------|-----------|
| Orchestrator | Opus | Complex reasoning, delegation decisions |
| Analyzer | Opus | Deep domain analysis, critical thinking |
| Validator | Sonnet | Pattern matching, rules checking |
| Writer | Sonnet | Structured output generation |
| Query handler | Haiku | Simple lookups, fast responses |

**Parallel Execution:**

Claude SDK runs up to 7 subagents concurrently. Example:

```typescript
// SWMS bulk creation: 7 subagents process 7 work packages simultaneously
// Each subagent creates one SWMS document
// 7x speedup vs sequential
```

**Detecting Subagent Context:**

Messages include `parent_tool_use_id` when from within subagent:

```typescript
for await (const message of query({...})) {
  if (message.parent_tool_use_id) {
    console.log("Message from inside subagent");
    console.log("Parent tool use ID:", message.parent_tool_use_id);
  }
}
```

**Use Case:** Different logging/handling for subagent vs orchestrator messages.

#### Component 5: Hooks (Monitoring & Control)

**Purpose:** Intercept agent execution for logging, validation, permission checks

**Implementation:**

```typescript
// In API route
const hooks = {
  PreToolUse: async ({ toolName, input }) => {
    // Log all tool usage
    await logToolCall({
      tool: toolName,
      input,
      timestamp: Date.now(),
      conversationId
    });

    // Custom validation for writes
    if (toolName === 'mcp__convex__db_write') {
      const autonomyLevel = await getAutonomyLevel(orgId);
      const riskLevel = assessRisk(input.operations);

      if (autonomyLevel === 'advisor' || riskLevel === 'high') {
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: `${riskLevel} risk operation requires approval`
          }
        };
      }
    }

    return {}; // Allow
  },

  PostToolUse: async ({ toolName, output, error }) => {
    // Track success/failure
    await logToolResult({
      tool: toolName,
      success: !error,
      timestamp: Date.now(),
      conversationId
    });

    // Store changeset for undo tracking
    if (toolName === 'mcp__convex__db_write' && output) {
      const result = JSON.parse(output);
      await storeUndoOpportunity({
        changesetId: result.changesetId,
        conversationId,
        timestamp: Date.now()
      });
    }

    // Error recovery
    if (error) {
      await notifyError({
        tool: toolName,
        error,
        conversationId
      });
    }

    return {};
  }
};
```

**Hook Matcher Patterns:**

Hooks can target specific tools via matcher strings:

```typescript
hooks: {
  PreToolUse: [
    { matcher: 'Bash', hooks: [bashValidator] },
    { matcher: 'Write|Edit', hooks: [fileProtector] },
    { matcher: '^mcp__convex__', hooks: [dbGuard] },
    { hooks: [globalLogger] }  // No matcher = all tools
  ]
}
```

| Pattern | Matches |
|---------|---------|
| `'Bash'` | Exactly the Bash tool |
| `'Write\|Edit'` | Write OR Edit tools |
| `'^mcp__'` | All MCP tools (regex pattern) |
| Omitted | All tools |

**Regex Support:** Full regex syntax supported in matcher strings.

**Complete Hook Output Options:**

```typescript
interface HookOutput {
  // Flow control
  continue?: boolean;              // Should agent continue? (default: true)
  stopReason?: string;             // Message when continue is false

  // Context injection
  systemMessage?: string;          // Message for Claude to see

  // Hook-specific outputs
  hookSpecificOutput?: {
    hookEventName: string;         // Echo of input hook_event_name

    // Permission control
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;  // Explanation for Claude

    // Tool input modification
    updatedInput?: object;         // Modified tool parameters

    // Additional context
    additionalContext?: string;    // Extra info for Claude
  };
}
```

**Usage Examples:**

**Block action:**
```typescript
return {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: 'Cannot delete production data'
  }
};
```

**Modify input:**
```typescript
return {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    updatedInput: {
      ...input,
      filter: { ...input.filter, projectId: currentProjectId }  // Inject scope
    }
  }
};
```

**Ask user:**
```typescript
return {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    permissionDecision: 'ask',
    permissionDecisionReason: 'High-risk delete operation requires approval'
  }
};
```

**Stop agent:**
```typescript
return {
  continue: false,
  stopReason: 'Rate limit exceeded, retry in 60s'
};
```

**Subagent Lifecycle Hooks:**

Track subagent execution:

```typescript
hooks: {
  SubagentStart: async (input) => {
    console.log('Subagent starting:', input.agent_type);
    await logSubagentStart(input);
    return {};
  },
  SubagentStop: async (input) => {
    console.log('Subagent completed:', input.agent_type);
    await logSubagentResult(input);
    return {};
  }
}
```

**Use Case:** Performance monitoring, cost tracking per subagent.

**Permission Evaluation Flow:**

SDK evaluates permissions in this order:

1. **Hooks** - PreToolUse hooks run first, can allow/deny/continue
2. **Permission rules** - Deny rules → Allow rules → Ask rules
3. **Permission mode** - Static configuration (acceptEdits, bypassPermissions, etc.)
4. **canUseTool callback** - Runtime decision function

Each layer can override previous layer if more restrictive. Hooks have highest priority.

### 4.2 Autonomy System

#### Level 1: Advisor

**Behavior:**
- Chief observes, reports, recommends
- No db_write without explicit request
- User takes all actions
- Chief provides analysis and suggestions

**Configuration:**
```typescript
const advisorConfig = {
  autonomyLevel: 'advisor',
  autoApproveWrites: false,
  requireConfirmation: 'always'
};
```

#### Level 2: Operator (Current Target)

**Behavior:**
- Chief executes routine/reversible actions
- Uses db_write with undo available
- Confirms before high-risk actions
- Learns from corrections

**Risk Assessment:**

```typescript
function assessRisk(operations: Operation[]): RiskLevel {
  let riskLevel: RiskLevel = 'low';

  for (const op of operations) {
    // Deletion always high risk
    if (op.type === 'delete') {
      return 'high';
    }

    // Multiple records = higher risk
    if (operations.length > 5) {
      riskLevel = 'medium';
    }

    // Certain tables = higher risk
    if (['workers', 'projects', 'swmsDocuments'].includes(op.table)) {
      riskLevel = 'medium';
    }

    // Status changes = low risk
    if (op.type === 'update' && Object.keys(op.data).length === 1 && 'status' in op.data) {
      riskLevel = 'low';
    }
  }

  return riskLevel;
}
```

**Autonomy Decision:**

```typescript
async function checkAutonomy(operations: Operation[]): Promise<AutonomyDecision> {
  const riskLevel = assessRisk(operations);
  const reversible = areOperationsReversible(operations);
  const autonomyLevel = await getAutonomyLevel(orgId);

  if (autonomyLevel === 'advisor') {
    return {
      proceed: false,
      confirm: true,
      message: 'Advisor mode: All writes require approval'
    };
  }

  if (autonomyLevel === 'operator') {
    if (riskLevel === 'low' && reversible) {
      return {
        proceed: true,
        confirm: false,
        showUndo: true
      };
    }

    if (riskLevel === 'medium') {
      return {
        proceed: false,
        confirm: true,
        message: 'Medium risk: Confirm before proceeding'
      };
    }

    if (riskLevel === 'high') {
      return {
        proceed: false,
        escalate: true,
        message: 'High risk: Human decision required'
      };
    }
  }

  if (autonomyLevel === 'autopilot') {
    if (riskLevel === 'critical') {
      return {
        proceed: false,
        escalate: true,
        message: 'Critical risk: Human override required'
      };
    }

    return {
      proceed: true,
      confirm: false,
      logOnly: true
    };
  }

  return { proceed: false, confirm: true };
}
```

#### Level 3: Autopilot (Future)

**Behavior:**
- Chief handles operations autonomously
- User sees summaries
- Intervention only for exceptions
- Requires established trust

**Not Implemented:** Future enhancement after Operator level proven.

### 4.3 Undo System

#### Changeset Architecture

**Schema:**

```typescript
type Changeset = {
  _id: string;
  operations: Operation[];
  status: 'pending' | 'executed' | 'undone' | 'failed';
  reason: string;
  projectId: string;
  conversationId?: string;
  createdAt: string;
  executedAt?: string;
  undoneAt?: string;
  createdBy: string;
};

type Operation = {
  type: 'create' | 'update' | 'delete';
  table: string;
  id?: string; // For update/delete
  data?: Record<string, any>; // For create/update
  previousData?: Record<string, any>; // For undo
};
```

#### Changeset Execution

**Convex Function:** `api.changesets.execute`

```typescript
export const execute = mutation({
  args: {
    operations: v.array(v.object({
      type: v.string(),
      table: v.string(),
      id: v.optional(v.string()),
      data: v.optional(v.any()),
      reason: v.string()
    })),
    projectId: v.id('projects')
  },
  handler: async (ctx, args) => {
    // Create changeset record
    const changesetId = await ctx.db.insert('changesets', {
      operations: [],
      status: 'pending',
      reason: args.operations[0]?.reason || 'Batch operation',
      projectId: args.projectId,
      createdAt: new Date().toISOString(),
      createdBy: await getCurrentUserId(ctx)
    });

    const results = [];
    const executedOps: Operation[] = [];

    // Execute each operation
    for (const op of args.operations) {
      try {
        let result;
        let previousData;

        switch (op.type) {
          case 'create':
            result = await ctx.db.insert(op.table, op.data);
            executedOps.push({ ...op, id: result });
            break;

          case 'update':
            previousData = await ctx.db.get(op.id);
            await ctx.db.patch(op.id, op.data);
            executedOps.push({ ...op, previousData });
            result = op.id;
            break;

          case 'delete':
            previousData = await ctx.db.get(op.id);
            await ctx.db.delete(op.id);
            executedOps.push({ ...op, previousData });
            result = op.id;
            break;
        }

        results.push({ id: result, success: true });
      } catch (error) {
        // Rollback on error
        await ctx.db.patch(changesetId, {
          status: 'failed',
          error: String(error)
        });
        throw error;
      }
    }

    // Mark executed
    await ctx.db.patch(changesetId, {
      operations: executedOps,
      status: 'executed',
      executedAt: new Date().toISOString()
    });

    return {
      changesetId,
      results
    };
  }
});
```

#### Undo Execution

**Convex Function:** `api.changesets.undo`

```typescript
export const undo = mutation({
  args: {
    changesetId: v.id('changesets'),
    projectId: v.id('projects')
  },
  handler: async (ctx, args) => {
    // Load changeset
    const changeset = await ctx.db.get(args.changesetId);

    if (!changeset) {
      return { success: false, reason: 'Changeset not found' };
    }

    // Validation
    if (changeset.projectId !== args.projectId) {
      return { success: false, reason: 'Changeset not in current project' };
    }

    if (changeset.status !== 'executed') {
      return { success: false, reason: `Cannot undo ${changeset.status} changeset` };
    }

    if (changeset.undoneAt) {
      return { success: false, reason: 'Already undone' };
    }

    // Check age (24 hour limit)
    const age = Date.now() - new Date(changeset.executedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      return { success: false, reason: 'Changeset too old (>24hrs)' };
    }

    // Build reverse operations
    const reverseOps = changeset.operations.map(op => {
      switch (op.type) {
        case 'create':
          return { type: 'delete', table: op.table, id: op.id };
        case 'update':
          return { type: 'update', table: op.table, id: op.id, data: op.previousData };
        case 'delete':
          return { type: 'create', table: op.table, data: op.previousData };
      }
    }).reverse(); // Reverse order for dependencies

    // Execute reverse (atomic)
    try {
      for (const op of reverseOps) {
        switch (op.type) {
          case 'create':
            await ctx.db.insert(op.table, op.data);
            break;
          case 'update':
            await ctx.db.patch(op.id, op.data);
            break;
          case 'delete':
            await ctx.db.delete(op.id);
            break;
        }
      }

      // Mark undone
      await ctx.db.patch(args.changesetId, {
        status: 'undone',
        undoneAt: new Date().toISOString()
      });

      return {
        success: true,
        operationsReversed: reverseOps.length
      };
    } catch (error) {
      return {
        success: false,
        reason: `Undo failed: ${String(error)}`
      };
    }
  }
});
```

#### Undo Limitations

**Cannot undo if:**
- Changeset older than 24 hours
- Dependent data created (foreign key constraints)
- Already undone
- Changeset status not 'executed'

**UI Flow:**
1. User clicks undo button (or says "undo")
2. UI sends undo request with changesetId
3. API route calls `mcp__convex__undo` tool
4. MCP server executes undo mutation
5. Result streamed back to UI
6. Confirmation displayed

### 4.4 Session Management

#### Capturing Sessions

```typescript
let currentSessionId: string | undefined;

for await (const message of query({...})) {
  if (message.type === 'system' && message.subtype === 'init') {
    currentSessionId = message.session_id;

    // Store in Convex
    await convex.mutation(api.conversations.updateSession, {
      conversationId,
      sessionId: currentSessionId
    });
  }
}
```

#### Resuming Conversations

```typescript
// Load conversation
const conversation = await convex.query(api.conversations.get, {
  conversationId
});

// Resume with full context
for await (const message of query({
  prompt: "Continue where we left off",
  options: {
    resume: conversation.sessionId, // Restores full history
    allowedTools: [...],
    mcpServers: {...}
  }
})) {
  // Continues with memory of previous conversation
}
```

**Session Storage Schema:**

```typescript
// Convex table: conversations
{
  _id: string,
  projectId: string,
  sessionId: string,
  createdAt: string,
  lastMessageAt: string,
  messageCount: number
}
```

#### Forking Sessions

Create branched sessions to explore different approaches without modifying original:

```typescript
// Resume modifies original session
query({
  prompt: "Continue task",
  options: { resume: sessionId }
})

// Fork creates new branch
query({
  prompt: "Try different approach",
  options: { resume: sessionId, forkSession: true }
})
```

| Behavior | resume only | resume + forkSession |
|----------|-------------|----------------------|
| Session ID | Same as original | New ID generated |
| History | Appends to original | Creates new branch |
| Original | Modified | Preserved unchanged |

**Use case:** Testing alternative implementations without losing working version.

### 4.5 Streaming & Message Types

#### Event Types

| Event | When Fired | Payload |
|-------|-----------|---------|
| `system.init` | Session start | `{ session_id }` |
| `assistant` | Claude response | `{ message: { content: [...] } }` |
| `tool.call` | Tool invoked | `{ toolName, input }` |
| `tool.result` | Tool completed | `{ toolName, result }` |
| `result.success` | Run completed | `{ result }` |
| `result.error_*` | Run failed | `{ error }` |

#### Message Handling

```typescript
for await (const message of query({...})) {
  switch (message.type) {
    case 'system':
      if (message.subtype === 'init') {
        console.log('Session:', message.session_id);
      }
      break;

    case 'assistant':
      if (message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block) {
            // Render text
            displayText(block.text);
          } else if ('name' in block) {
            // Tool use
            displayToolCall(block.name);
          }
        }
      }
      break;

    case 'result':
      if (message.subtype === 'success') {
        console.log('Done:', message.result);
      } else {
        console.error('Error:', message.subtype);
      }
      break;
  }
}
```

**Conversation Compaction:**

**Purpose:** Reduce context length when approaching token limits.

**Automatic Compaction:**

Claude SDK automatically compacts conversation history when context fills up. Compaction summarizes earlier messages to preserve memory while reducing tokens.

**Detecting Compaction:**

```typescript
for await (const message of query({...})) {
  if (message.type === 'system' && message.subtype === 'compact_boundary') {
    console.log('Conversation compacted at this point');
  }
}
```

**PreCompact Hook:**

Intercept before compaction to save state:

```typescript
hooks: {
  PreCompact: async (input) => {
    await saveConversationState(input);
    return {};  // Allow compaction
  }
}
```

**Use Case:** Save full conversation history before summarization, track memory pressure.

**Controlling Agent Loop Length:**

**maxTurns option:** Limits agent reasoning cycles before stopping.

```typescript
query({
  prompt: "Analyze this codebase",
  options: {
    maxTurns: 5  // Agent can call tools up to 5 times
  }
})
```

| Value | Behavior |
|-------|----------|
| Omitted | No limit (agent runs until task complete) |
| `1` | One-shot (single response, no tool loops) |
| `N` | Up to N tool use cycles |

**Use Case:**
- `maxTurns: 1` for simple queries (explanation, quick analysis)
- `maxTurns: 5-10` for bounded tasks (avoid runaway loops)
- No limit for open-ended work (implementation, debugging)

**Note:** Agent may stop before maxTurns if task complete. This is a ceiling, not target.

### 4.6 Scope Enforcement

#### Automatic Filtering

**MCP Server Implementation:**

```typescript
// Every db_read call
const scopedFilter = {
  ...filter,
  projectId: getCurrentProjectId() // Injected automatically
};

// Every db_write call
const scopedOperations = operations.map(op => ({
  ...op,
  data: op.data ? {
    ...op.data,
    projectId: getCurrentProjectId() // Injected automatically
  } : undefined
}));
```

**Validation:**

```typescript
// Before write execution
for (const op of operations) {
  if (op.data?.projectId && op.data.projectId !== getCurrentProjectId()) {
    throw new Error('Cannot write to different project');
  }

  // Validate foreign keys in same project
  if (op.data?.assignedTo) {
    const worker = await ctx.db.get(op.data.assignedTo);
    if (!worker || worker.projectId !== getCurrentProjectId()) {
      throw new Error('Worker not in current project');
    }
  }
}
```

**Security:** Scope cannot be overridden by agent. Enforced at MCP server level before Convex access.

---

## 5. Relationships & Dependencies

### Depends On

| Document | Why |
|----------|-----|
| 01-vision.md | Defines what Chief should achieve (autonomy levels, trust model) |
| 02-architecture.md | System structure (Next.js, Convex, deployment) |
| 04-schema.md | Database tables for MCP tool access |

### Feeds Into

| Document | How |
|----------|-----|
| 06-ui-system.md | Chat interface must render streaming events, structured data, undo buttons |
| Backend implementation | MCP server, Convex functions, API routes |

---

## 6. Implementation Notes

### Build Order

1. **MCP Server (Phase 1)**
   - Implement db_read with scope filtering
   - Implement db_write with changeset support
   - Implement undo with validation
   - Test scope enforcement thoroughly
   - Validate atomic operations work

2. **API Route (Phase 2)**
   - Create `/api/chief/run` endpoint
   - Wire up streaming SSE
   - Add session management
   - Test resume functionality

3. **CLAUDE.md (Phase 3)**
   - Write global instructions
   - Define identity, behavior, rules
   - Test baseline agent behavior

4. **Core Skills (Phase 4)**
   - database-read skill
   - database-write skill
   - database-undo skill
   - Test progressive loading

5. **Domain Skills (Phase 5)**
   - One skill per module (swms, defects, etc.)
   - Bundle references
   - Test trigger conditions

6. **Subagents (Phase 6)**
   - SWMS orchestrator + subagents
   - Test parallel execution
   - Validate model selection

7. **Hooks & Monitoring (Phase 7)**
   - Implement PreToolUse/PostToolUse
   - Add logging
   - Add analytics

### Testing Strategy

**Unit Tests:**
- Each MCP tool (db_read, db_write, undo)
- Scope enforcement logic
- Changeset creation/reversal
- Validation rules

**Integration Tests:**
- Full query() execution end-to-end
- Skill loading (metadata → body → references)
- Subagent delegation
- Session resume

**End-to-End Tests:**
- Create defect workflow
- SWMS creation workflow
- Batch operations + undo
- Scope violation attempts

**Performance Tests:**
- Parallel subagent execution (7 concurrent)
- Large result set handling
- Session resume latency

### Migration Path (from OpenAI SDK)

| Phase | Work | Timeline |
|-------|------|----------|
| 1 | MCP server | 1-2 weeks |
| 2 | API route adaptation | 1 week |
| 3 | Instruction migration to skills | 2-3 weeks |
| 4 | Subagent definitions | 1-2 weeks |
| 5 | UI replacement (see 06-ui-system.md) | 2-3 weeks |
| 6 | Optimization & monitoring | 1-2 weeks |

**Total:** 8-13 weeks

---

## 7. Open Questions

### Question 1: Autonomy Progression

**Q:** How does org transition from Advisor → Operator → Autopilot?
**Options:**
- A) Manual setting (admin toggles in UI)
- B) Automatic (based on success rate metrics)
- C) Hybrid (recommendations + manual approval)

**Recommendation:** C (Hybrid). Track metrics, recommend upgrade, require admin approval.

### Question 2: Skill Discovery

**Q:** How does Claude decide which skill to load?
**Current:** Matches task against skill descriptions.
**Risk:** Description quality critical. Poor description = skill never loads.

**Mitigation:** Provide skill authoring guidelines, test coverage for all trigger phrases.

### Question 3: Multi-Project Context

**Q:** Should Chief have cross-project awareness?
**Current:** Scope strictly enforced per project.
**Future:** May need to identify patterns across projects (e.g., "This subcontractor has issues on 3 projects").

**Decision:** Defer to Phase 2. Single-project scope for MVP.

### Question 4: External Communication

**Q:** Should Chief send emails/Slack messages?
**Current:** No external communication.
**Rationale:** External parties expect human communication. Chief stays internal.

**Exception:** Notifications to internal team members (part of same org).

### Question 5: Skill Versioning

**Q:** How to handle skill updates without breaking existing behavior?
**Options:**
- A) Version in filename (database-write-v2.md)
- B) Semantic versioning in frontmatter
- C) No versioning (always latest)

**Recommendation:** C for MVP. Add versioning if breaking changes become common.

---

## 8. User Input & Approvals

### AskUserQuestion Tool

Claude uses `AskUserQuestion` tool to ask clarifying questions when uncertain.

**Tool Structure:**
```typescript
{
  toolName: "AskUserQuestion",
  input: {
    questions: [{
      question: "Which defect should I assign?",
      header: "Defect Selection",
      options: [
        { label: "#123 - Cracked foundation", description: "High priority" },
        { label: "#456 - Paint peeling", description: "Low priority" }
      ],
      multiSelect: false
    }]
  }
}
```

**Handler Pattern:**
```typescript
canUseTool: async (toolName, input) => {
  if (toolName === "AskUserQuestion") {
    // Present questions to user
    const answers = await promptUserForAnswers(input.questions);

    return {
      behavior: "allow",
      updatedInput: {
        questions: input.questions,
        answers: {
          "Which defect should I assign?": "#123 - Cracked foundation"
        }
      }
    };
  }

  // Handle other tool permissions
  return { behavior: "allow" };
}
```

**Timeout:** canUseTool callbacks must return within 60 seconds or Claude will try different approach.

---

## 9. Slash Commands

### Built-in Commands

- `/compact` - Compact conversation history (reduce token usage)
- `/clear` - Clear conversation and start fresh
- `/help` - Get help

### Custom Commands

Create `.claude/commands/<name>.md`:

```markdown
---
allowed-tools: Read, Grep, Glob
description: Find all SWMS documents in project
---

Search the project for all SWMS documents and list them with status.
```

Use with: `/find-swms`

### With Arguments

Create `.claude/commands/assign-defect.md`:

```markdown
---
argument-hint: [defect-id] [worker-name]
description: Assign defect to worker
---

Assign defect #$1 to worker $2. Update status to "assigned".
```

Use with: `/assign-defect 123 "John Smith"`

### Discovery

```typescript
for await (const message of query({ prompt: "Hello", options: { maxTurns: 1 } })) {
  if (message.type === "system" && message.subtype === "init") {
    console.log("Available commands:", message.slash_commands);
  }
}
```

**Use Case:** Common operations as shortcuts (e.g., `/create-swms`, `/daily-report`).

---

## 10. Appendix

### A. Complete Skill Inventory

**Core Skills (Always Available):**
- `database-read` - Query patterns and optimization
- `database-write` - Validation rules and write patterns
- `database-undo` - Undo workflow and limitations
- `context-loader` - Load project/org/user context

**Domain Skills (Load on Demand):**
- `domain-swms` - SWMS creation, assignment, tracking
- `domain-defects` - Defect lifecycle, prioritization
- `domain-checklists` - Template building, instance conduct
- `domain-inductions` - Site/plant induction workflows
- `domain-permits` - Permit application, approval, tracking
- `domain-assets` - Equipment management, maintenance
- `domain-schedule` - Task scheduling, dependencies
- `domain-incidents` - Incident reporting, investigation
- `domain-toolbox` - Toolbox meetings, attendance
- `domain-diaries` - Site diary entries
- `domain-workers` - Worker management, certifications

### B. Subagent Definitions

**SWMS Workflow:**
- `swms-orchestrator` - Main workflow controller
- `hazard-analyzer` - Identifies hazards (Opus)
- `swms-validator` - Checks compliance (Sonnet)
- `swms-writer` - Creates document (Sonnet)

**Incident Investigation:**
- `incident-orchestrator` - Investigation workflow
- `incident-investigator` - Gathers evidence (Sonnet)
- `corrective-action-planner` - Develops actions (Opus)
- `compliance-reviewer` - Regulatory check (Haiku)

**Bulk Operations:**
- `batch-orchestrator` - Coordinates batch work
- `item-processor` - Processes one item (Sonnet, 7 concurrent)
- `results-aggregator` - Summarizes results (Haiku)

### C. Prompt Library

**Clarification Prompts:**

```
"I need to clarify: Are you asking about [option A] or [option B]?"

"To proceed, I need to know: [specific information needed]"

"I see multiple defects that match. Which one? [list with IDs]"
```

**Confirmation Prompts:**

```
"This will [action] [count] records. Confirm to proceed."

"High-risk action: [describe]. Are you sure?"

"I found [count] similar records. Create new anyway?"
```

**Undo Prompts:**

```
"Created [entity]. [Undo link]"

"Updated [count] records. [Undo link]"

"Action complete. Say 'undo' to reverse."
```

### D. Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `SCOPE_VIOLATION` | Attempted cross-project access | Block, log security event |
| `VALIDATION_FAILED` | Required field missing | Show validation errors, request data |
| `UNDO_TOO_OLD` | Changeset >24hrs | Explain limitation, suggest manual fix |
| `UNDO_HAS_DEPENDENTS` | Cannot undo, dependent data exists | List dependents, suggest alternatives |
| `CHANGESET_ALREADY_UNDONE` | Attempted double undo | Inform user, show current state |
| `MCP_CONNECTION_FAILED` | MCP server unreachable | Retry, escalate if persistent |
| `PERMISSION_DENIED` | User lacks permission | Explain required permission, suggest who to ask |

### E. MCP Server Environment

**Environment Variables:**

```bash
# Required
CONVEX_URL=https://your-deployment.convex.cloud
PROJECT_ID=proj_123

# Optional
MCP_LOG_LEVEL=info  # debug, info, warn, error
MCP_MAX_RETRIES=3
MCP_TIMEOUT_MS=30000
```

**Logging:**

All logs to stderr (stdout reserved for JSON-RPC):

```typescript
console.error('[MCP] Tool call:', toolName);
console.error('[MCP] Scope filter:', scopedFilter);
console.error('[MCP] Result count:', result.length);
```

### F. Skill Authoring Guidelines

**Description Best Practices:**

1. **Be specific:** "Creates SWMS documents" not "Helps with safety"
2. **Include triggers:** "Use when user mentions SWMS, JSA, safe work, hazards"
3. **Third person:** "Creates X" not "I create X"
4. **Clear boundaries:** What this skill does vs doesn't do

**Instruction Best Practices:**

1. **Step-by-step:** Number sequential steps
2. **Examples:** Show concrete examples, not abstract patterns
3. **Validation:** List what to check before proceeding
4. **References:** Link to detailed docs for complex rules
5. **Common mistakes:** What to avoid

**Keep Skills Focused:**

- One primary responsibility per skill
- 300-500 lines (skill body)
- Split large skills into multiple skills
- Use references/ for extensive documentation

**Testing Checklist:**

- [ ] Skill loads when description matches task
- [ ] All trigger phrases tested
- [ ] References load correctly
- [ ] Scripts execute without errors
- [ ] Works in isolation (fresh session)

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-21 | Initial specification |
| 2026-01-21 | Merged gaps from tools, instructions, engine, backend, SDK |

---

> Chief exists to make construction operations run themselves.
> Humans set expectations. Chief closes loops.
> That's the job.
