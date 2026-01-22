# Chief Tools & Skills

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Entities](#entities)
- [Workflows](#workflows)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)
- [Tool Registry](#tool-registry)
- [db_read Operations Detail](#db_read-operations-detail)
- [ai.read_document Tool](#airead_document-tool)
- [ai.present Artifact Types](#aipresent-artifact-types)
- [Skill Structure Example (database-write)](#skill-structure-example-database-write)
- [Context Injection](#context-injection)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Build Order](#build-order)
- [Skill Authoring Guidelines](#skill-authoring-guidelines)
- [Migration from OpenAI Agents SDK](#migration-from-openai-agents-sdk)
- [Open Questions](#open-questions)
- [Dependencies Summary](#dependencies-summary)

## Purpose
Technical specification for Chief's operational capabilities: MCP tools for database access, skills system for progressive context loading, subagent orchestration, hooks for monitoring, and changeset/undo mechanism for trust establishment.

## Scope

### In Scope
- Skills system (progressive loading from .claude/)
- MCP tools (db_read, db_write, undo)
- Subagent workflows (up to 7 concurrent)
- Hooks system (PreToolUse, PostToolUse)
- Changeset/undo mechanism (24hr window)
- Streaming responses (SSE from API route)
- Tool registry and context injection

### Out of Scope
- Agent identity and behavior (chief-agent.md)
- UI rendering (ui-system.md)
- Schema definitions (foundation.md)

## Requirements

### Skills System
**REQ-001: Progressive Loading**
- Skills load from `.claude/CLAUDE.md` (global, always loaded ~500 lines) + `.claude/skills/` (task-specific, on-demand)
- Loading hierarchy: CLAUDE.md → Skill metadata (name+description ~100 words) → Skill body (~300 lines) → References (~1000 lines)
- Benefits: Context stays focused, 5 skills available ≠ 5 skills loaded
- Requires `settingSources: ['project']` to load from cwd .claude/

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

**Testing Coverage:** Test skill loading with diverse queries, iterate descriptions based on failures

**REQ-002: Skill Discovery**
- Claude matches task against skill descriptions
- Risk: Description quality critical (poor description = skill never loads)
- Core skills (always available): database-read, database-write, database-undo, context-loader
- Domain skills (load on demand): domain-swms, domain-defects, domain-checklists, domain-inductions, domain-permits, domain-assets, domain-schedule, domain-incidents, domain-toolbox, domain-diaries, domain-workers

**REQ-003: Skill Structure**
- Location: `.claude/skills/<name>/SKILL.md` with frontmatter (name, description)
- Frontmatter: name, description (third person, specific, include triggers, clear boundaries)
- Body: Purpose, When to Use, Tools Available, Instructions (step-by-step with examples), Safety Rules, Common Mistakes
- References: `references/` folder for extensive docs (schema.md, validation.md, examples.md) loaded on demand
- Authoring guidelines: One responsibility per skill, 300-500 lines, use references/ for extensive docs

### MCP Tools
**REQ-004: db_read with Scope Enforcement**
- Tool name: `mcp__convex__db_read`
- Operations: describe_schema, describe_table, get, multi_get, list, search_text, document_metadata, drawing_metadata, document_chunks
- Scope enforcement: Auto-injects projectId filter based on table.scopeHint ('project' tables require projectId, 'org' tables require orgId, 'mixed' use available scope)
- Scope injection rules: Cannot override projectId, enforced at MCP server level before Convex access
- Limits: max 20 requests per call, max 100 records per list, max 50 IDs per multi_get
- Index enforcement: indexEnforcementMode (index_only|allow_scan), auto-selects index if projectId/orgId available
- Table/index normalization: Case-insensitive matching, auto-suggestion via scoreSuggestion() (prefix match +100, substring +30, reverse +10, length penalty -0.2/char)
- Error handling: Unknown table → return top 8 suggestions; Unknown index → return available indexes

**REQ-005: db_write with Changeset Creation**
- Tool name: `mcp__convex__db_write`
- Parameters: scope (bootstrap|onboarding|ops_gap|variation|artifact|close_out|other), title (1-200 chars), summary, priority (low|medium|high), items[] (1-25 operations)
- Operation types: create (targetTable, payload), update (targetTable, targetId, payload), delete (targetTable, targetId), call (targetTable, payload with opKey/args)
- Payload coercion: Plain object, Array [{ key, value }], Stringified JSON
- Validation: projectId auto-injected, schema validation before execution, FK relationships checked
- Execution: Atomic transaction in Convex, creates changeset for undo, returns executionId + results[]
- Result artifact: kind='result', entityType, operation, title, description, chips, viewPath, executionId, undoable

**REQ-006: undo within 24hr Window**
- Tool name: `mcp__convex__undo`
- Input: changesetId (from db_write result)
- Execution: Validates changeset (projectId match, status='executed', age <24hrs, no dependents) → builds reverse operations → executes atomically → marks undone
- Reverse operations: create → delete, update → update with previousData, delete → create with previousData (reversed order for dependencies)
- Limitations: Cannot undo if >24hrs old, dependent data exists, already undone, status not 'executed'
- Returns: success flag

### Subagents
**REQ-007: Up to 7 Concurrent**
- Parallel execution: Claude SDK runs up to 7 subagents concurrently
- Requires Task tool
- Model selection: 'sonnet', 'opus', 'haiku', 'inherit' (not full model IDs)
- Orchestrator pattern: Opus (complex reasoning), Analyzer = Opus (deep analysis), Validator = Sonnet (pattern matching), Writer = Sonnet (structured output), Query handler = Haiku (simple/fast)
- Example workflows: SWMS creation (hazard-analyzer → swms-validator → swms-writer), incident investigation (incident-investigator → corrective-action-planner → compliance-reviewer)
- Lifecycle hooks: SubagentStart, SubagentStop for tracking
- Context detection: Messages include parent_tool_use_id when from within subagent

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

**Detecting Subagent Context:**

Messages include `parent_tool_use_id` when from within subagent:

```typescript
for await (const message of query({...})) {
  if (message.parent_tool_use_id) {
    console.log("Message from inside subagent");
  }
}
```

### Hooks System
**REQ-008: PreToolUse and PostToolUse**
- PreToolUse: Log tool name, input, timestamp, projectId before execution
- PostToolUse: Log success/error, duration after execution
- Monitoring metrics: tool call frequency, success rate, execution time, session duration, skill load times

**Hook Matcher Patterns:**

Hooks can target specific tools via matcher strings:

```typescript
hooks: {
  PreToolUse: [
    { matcher: 'Bash', hooks: [bashValidator] },
    { matcher: 'Write|Edit', hooks: [fileProtector] },
    { matcher: '^mcp__', hooks: [dbGuard] },
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

**Permission Evaluation Flow:**

SDK evaluates permissions in this order:
1. **Hooks** - PreToolUse hooks run first, can allow/deny/continue
2. **Permission rules** - Deny rules → Allow rules → Ask rules
3. **Permission mode** - Static configuration
4. **canUseTool callback** - Runtime decision (must return within 60s)

Each layer can override previous layer if more restrictive. Hooks have highest priority.

**Subagent Lifecycle Hooks:**

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

### Changeset/Undo Mechanism
**REQ-009: Full Undo Capability**
- Schema: operations[] array with opId, kind, operation (create|update|delete|call), targetTable, targetId, createdId, deletedId, before (snapshot), patch (delta applied), ok (success flag), message, undoneAt, undoneByUserId
- Status: pending|executed|undone|failed
- Tracking: executionId links to aiRuns for AI reasoning session
- UI flow: User clicks undo → API calls mcp__convex__undo → MCP executes mutation → result streamed → confirmation displayed
- Audit trail: All operations logged to executions table with projectId, scope, title, summary, status, createdBy (ai|admin), createdByUserId, createdAt, undoneAt, undoneByUserId

### Streaming Responses
**REQ-010: SSE from API Route**
- Endpoint: POST /api/chief/run
- Runtime: `export const runtime = 'edge'` for streaming
- Message types: system.init (session_id), assistant (content), tool.call (toolName, input), tool.result (toolName, result), result.success, result.error_*
- TransformStream: query() from @anthropic-ai/claude-agent-sdk, SSE response via ReadableStream, encoder, controller
- Session management: Capturing sessions (session_id from system.init event), Resuming (resume: sessionId), Forking (resume + forkSession = new ID)
- Conversation compaction: Automatic when approaching token limits, summarizes earlier messages, system.subtype 'compact_boundary' marker, PreCompact hook to save state
- maxTurns option: Limits agent reasoning cycles (1 = one-shot, 5-10 = bounded tasks, omitted = no limit)

**Message Type Handling:**

```typescript
for await (const message of query({...})) {
  switch (message.type) {
    case 'system':
      if (message.subtype === 'init') {
        console.log('Session:', message.session_id);
      } else if (message.subtype === 'compact_boundary') {
        console.log('Conversation compacted at this point');
      }
      break;

    case 'assistant':
      if (message.message?.content) {
        for (const block of message.message.content) {
          if ('text' in block) {
            displayText(block.text);
          } else if ('name' in block) {
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

**maxTurns Option:** Limits agent reasoning cycles before stopping.

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
- `maxTurns: 1` for simple queries
- `maxTurns: 5-10` for bounded tasks (avoid runaway loops)
- No limit for open-ended work

**Note:** Agent may stop before maxTurns if task complete.

## Entities

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| executions | projectId, scope (bootstrap\|onboarding\|ops_gap\|variation\|artifact\|close_out\|other), title, summary, status (applied\|undone\|partial), createdBy (ai\|admin), createdByUserId, createdAt, undoneAt, undoneByUserId, operations[] | Changeset tracking with full db write/undo capability, operations array provides before/after snapshots |
| aiRuns | projectId (optional), sessionId, userId, status (running\|completed\|failed\|cancelled), prompt, response, executionIds[], metadata, createdAt, updatedAt | AI reasoning sessions, links to database executions via executionIds array |
| conversations | orgId, projectId (optional), sessionId (Claude SDK session ID for resume), title, status (active\|archived), metadata, createdAt, updatedAt | Generic Claude SDK conversation threads (replaces chatkitThreads), sessionId for resumption |
| conversationMessages | conversationId, role (user\|assistant\|system), content, toolCalls[], toolResults[], metadata, createdAt | Generic conversation messages (replaces chatkitItems), immutable after creation |

### Execution Operations Schema
```typescript
{
  opId: string,
  kind: string,
  operation: 'create' | 'update' | 'delete' | 'call',
  targetTable: string,
  targetId?: string,
  createdId?: string,
  deletedId?: string,
  before?: Record<string, any>, // snapshot
  patch?: Record<string, any>, // delta applied
  ok: boolean, // success flag
  message?: string,
  undoneAt?: string,
  undoneByUserId?: string
}
```

## Workflows

### Skill Loading Workflow
1. Claude SDK starts with CLAUDE.md (~500 lines always loaded)
2. User mentions domain keyword (e.g., "defects")
3. Claude matches task against skill descriptions
4. Skill metadata loaded (name+description ~100 words)
5. Skill body loaded (~300 lines)
6. References loaded on demand (~1000 lines)
7. Skill unloads when navigating away from module

### Database Write Workflow
1. Chief performs db_read before EVERY db_write (verify data, check relationships, confirm scope)
2. Validate required fields, field types (enums, timestamps, IDs), FK relationships
3. Auto-populate projectId, createdAt, createdBy, _id
4. Execute mcp__convex__db_write with operations[] array
5. MCP server validates scope (projectId must match context)
6. MCP server creates changeset (operations with before/after snapshots)
7. MCP server executes atomically in Convex
8. Returns { success: true, recordId, changesetId, undoable: true }
9. Chief presents confirmation with undo option
10. Chief suggests next actions

### Undo Workflow
1. User clicks undo button (within 24hrs of db_write)
2. API calls mcp__convex__undo with changesetId
3. MCP server validates changeset (projectId, status, age <24hrs, no dependents)
4. Builds reverse operations (create → delete, update → update with previousData, delete → create with previousData)
5. Executes reversed operations in reverse order (for dependencies)
6. Marks changeset status = 'undone', sets undoneAt, undoneByUserId
7. Result streamed to UI
8. Confirmation displayed

### Subagent Orchestration Workflow (SWMS Example)
1. User requests "Create SWMS for concrete pouring"
2. Chief loads domain-swms skill
3. Chief invokes Task tool with subagents:
   - hazard-analyzer (Opus): Identify hazards
   - swms-validator (Sonnet): Validate completeness
   - swms-writer (Sonnet): Create document
4. Subagents execute in parallel (up to 3 concurrent)
5. Results aggregated by orchestrator
6. Chief uses db_write to create swmsDocument
7. Present result with undo option

### Session Resume Workflow
1. User opens Chief chat
2. API route receives POST /api/chief/run with conversationId
3. Load conversation from conversations table (sessionId)
4. query() called with resume: sessionId
5. Claude SDK loads previous context
6. User continues conversation seamlessly
7. New messages appended to conversationMessages table

## Acceptance Criteria

**AC-001: Skills Load Progressively**
- GIVEN Chief conversation starts
- WHEN user mentions domain keyword
- THEN relevant skill loads within 1-2s
- AND skill description matches task
- AND references load on demand

**AC-002: db_read Enforces Scope**
- GIVEN Chief executes db_read
- WHEN table hint = 'project'
- THEN projectId auto-injected from context
- AND cannot override projectId
- AND returns only records in scope

**AC-003: db_write Creates Changeset**
- GIVEN Chief executes db_write
- WHEN operations[] provided
- THEN changeset created with operations
- AND each operation has before snapshot
- AND executionId returned
- AND undoable flag = true if <24hrs

**AC-004: Undo Reverses Changes**
- GIVEN changeset created within 24hrs
- WHEN user clicks undo with changesetId
- THEN reverse operations execute atomically
- AND changeset status = 'undone'
- AND original data restored
- AND confirmation displayed

**AC-005: Subagents Execute in Parallel**
- GIVEN Chief invokes Task tool
- WHEN multiple subagents specified
- THEN up to 7 run concurrently
- AND results aggregated
- AND lifecycle hooks fire (SubagentStart, SubagentStop)

**AC-006: Hooks Monitor Tool Execution**
- GIVEN Chief executes any tool
- WHEN PreToolUse hook fires
- THEN tool name, input, timestamp logged
- WHEN PostToolUse hook fires
- THEN success/error, duration logged

**AC-007: Streaming Responses Deliver in Real-Time**
- GIVEN Chief processes user message
- WHEN agent reasoning generates chunks
- THEN chunks stream via SSE
- AND UI renders progressively
- AND session_id captured for resume

## Dependencies

### Internal
- **foundation.md**: projectId/orgId scope enforcement, schema structure
- **chief-agent.md**: Agent identity, autonomy levels, behavior rules
- **ui-system.md**: Chief chat interface, artifact rendering
- **_reference/schema.md**: Database tables (executions, aiRuns, conversations)

### External
- **Claude Agents SDK**: query() function, MCP support, skills system, subagents, hooks
- **MCP (Model Context Protocol)**: Standard protocol between AI and data systems
- **Convex**: Database backend, reactive queries, mutations, actions
- **Next.js**: API route for /api/chief/run (SSE streaming)
- **ShadCN**: Chief chat UI components (no ChatKit widgets)

## Tool Registry

### Core MCP Tools
| Tool | Operation | Parameters | Returns |
|------|-----------|------------|---------|
| mcp__convex__db_read | Query database | op (describe_schema\|describe_table\|get\|multi_get\|list\|search_text\|document_metadata\|drawing_metadata\|document_chunks), table, index, filters, limit, orderBy | records[], count, scope metadata |
| mcp__convex__db_write | Mutate database | scope, title, summary, priority, items[] (type, table, data, id, reason) | executionId, results[], undoable flag |
| mcp__convex__undo | Reverse changeset | changesetId | success flag |

### AI Tools (Non-MCP)
| Tool | Purpose | Parameters | Returns |
|------|---------|------------|---------|
| ai.preamble | Update status line | title, detail (construction domain terms only) | void |
| ai.present | Render ChatKit widgets | artifact type (result\|questions\|confirm\|sources\|intake), structured data | void |
| ai.ui_navigate | Suggest navigation | path, module, submodule, entityType, pageNumber, ctaLabel, description, external | void |
| ai.read_document | Read/analyze documents | documentId, focus (optional directive) | summary, extracted facts, suggestedDocType, confidence |

### Built-in Tools (Claude SDK)
Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion, Task, Skill

## db_read Operations Detail

### describe_schema
- Purpose: List all tables
- Parameters: None (auto-injects scope)
- Returns: tables[] (caps at maxTablesInDescribeSchema = 100)
- Use case: "What tables exist in this project?"

### describe_table
- Purpose: Get table structure (fields, indexes, searchIndexes)
- Parameters: table (string, case-insensitive, auto-suggests if typo)
- Returns: fields[] (caps at maxFieldsInDescribeTable = 200), indexes[], searchIndexes[]
- Auto-suggestion: scoreSuggestion() algorithm with prefix/substring/reverse/length penalty

### get
- Purpose: Single record by ID
- Parameters: table, id, select[] (optional field subset), includeLargeFields (boolean)
- Returns: Record or null
- Scope: Auto-injected projectId filter if table hint = 'project'

### multi_get
- Purpose: Multiple records by IDs (max maxIdsPerMultiGet = 50)
- Parameters: table, ids[], select[], includeLargeFields
- Returns: records[] (nulls for missing)
- Use case: Batch fetch workers by IDs

### list
- Purpose: Query with index
- Parameters: table, index (optional, auto-selected), indexEq (filter), filters, order, allowScan (boolean)
- Returns: records[] (max maxRowsPerList = 100), count
- Index selection: Auto-picks index if projectId/orgId available, enforces indexEnforcementMode (index_only|allow_scan)
- Scope injection: Based on table.scopeHint ('project' → projectId, 'org' → orgId, 'mixed' → use available)

### search_text
- Purpose: Full-text search with searchIndex
- Parameters: table, searchIndex, query (search string), filters
- Returns: records[] (max 100)
- Scope: Auto-injects projectId/orgId filters

### document_metadata
- Purpose: Document with chunk preview (first 6 chunks)
- Parameters: documentId
- Returns: document + chunks[] (caps at maxPreviewChars = 2000)
- Use case: Quick preview before full retrieval

### drawing_metadata
- Purpose: Drawing metadata with annotations
- Parameters: drawingId
- Returns: drawing object with annotations[]

### document_chunks
- Purpose: Paginated chunks
- Parameters: documentId, page (default 0)
- Returns: chunks[] (caps at maxChunksPerPage = 6, maxCharsPerChunk = 4000)
- Use case: Progressive loading for large documents

## ai.read_document Tool

### Purpose
Read and analyze project/org documents from sourceDocuments table

### Parameters
- `documentId`: string (required)
- `focus`: string (optional directive like "extract expiry date")

### Processing Flow
1. Scope validation (projectId/orgId match)
2. Document lookup from sourceDocuments table
3. Type detection:
   - Text-like (txt, csv, md, json): Direct download
   - PDF: tryExtractPdfText via pdfjs-dist
   - Other: OpenAI vision API
4. Fallback chain: OpenAI with fileUrl → OpenAI with blob upload → Local PDF extraction → Error

### OpenAI Analysis Returns
- summary: ≤120 words
- suggestedDocType: string
- suggestedTitle: string
- suggestedTags: string[]
- confidence: number (0-1)
- questions: string[] (clarifying questions)
- extracted: string[] (≤12 key facts)

### Limits
- MAX_TEXT_CHARS: 40,000
- MAX_DOWNLOAD_BYTES_FOR_AI: 30MB
- PDF max pages: 50
- PDF max chars: 80,000

### Focus Handling
If focus provided, prioritize extracting relevant details in "extracted" field

## ai.present Artifact Types

### result
**Purpose**: Display db_write result
**Fields**: entityType, operation (created|updated|deleted), title, description, chips[], viewPath, executionId, undoable
**Multi-operation**: operations[] array (max 25)
**Hydration**: Auto-hydrated via hydrateResultArtifact() to resolve entity metadata
**Chips**: status (blue), priority (orange), info (gray), warning (yellow)

### questions
**Purpose**: Gather missing info via bounded choices
**Fields**: questions[] with id, question, options[], multiSelect
**Constraint**: ONLY bounded choices, NEVER free-form
**Use case**: "Which worker? [John, Mary, Sarah]"

### confirm
**Purpose**: Verify destructive/bulk actions
**Fields**: title, message, items[], warning, confirmLabel, confirmVariant
**Use case**: "Delete 15 defects? [Cancel] [Delete]"

### sources
**Purpose**: Web search citations
**Fields**: items[] with title, url, snippet, favicon
**Use case**: Display search results with clickable links

### intake
**Purpose**: File upload analysis (system-triggered)
**Fields**: intakeId, fileName, status, analysis
**Use case**: Show document processing status

## Skill Structure Example (database-write)

### Location
`.claude/skills/database-write/SKILL.md`

### Frontmatter
```yaml
name: database-write
description: Write data to Convex database via MCP server with changeset tracking
```

### Body
**Purpose**: Enable Chief to create/update/delete records with full undo capability

**When to Use**:
- User requests creating/updating/deleting entities
- Workflow requires persisting state
- Operation is reversible

**Tools Available**:
- mcp__convex__db_write

**Instructions**:
1. Validate user intent and scope (projectId)
2. Check existing data with db_read if needed (ALWAYS db_read before db_write)
3. Execute db_write with clear changeset description (scope, title, summary)
4. Present result with undo option (use ai.present with result artifact)
5. If error, explain and suggest correction

**Safety Rules**:
- Always validate projectId scope (cannot write to wrong project)
- Never write without db_read first (verify data, check relationships)
- Provide clear changeset descriptions (title 1-200 chars, summary explains "why")
- Offer undo for consequential operations (undoable flag in result)

**Validation Steps**:
- Verify required fields (projectId, createdAt, createdBy, status for most tables)
- Validate enums (use exact values from schema)
- Check FK relationships (must reference existing records in same projectId)
- Auto-populate projectId/timestamps/createdBy (MCP server injects)

**Execution Pattern**:
```typescript
mcp__convex__db_write({
  scope: 'ops_gap', // or bootstrap|onboarding|variation|artifact|close_out|other
  title: 'Created defect #42',
  summary: 'Critical electrical defect raised by John, assigned to ABC Electrical',
  priority: 'high',
  items: [
    {
      type: 'create',
      targetTable: 'defects',
      payload: {
        title: 'Exposed electrical panel',
        description: 'Panel cover missing on Level 2',
        priority: 'critical',
        status: 'open',
        assignedTo: 'org_abc_electrical',
        // projectId auto-injected by MCP server
        // createdAt, createdBy auto-populated
      }
    }
  ]
})
```

**Post-write**:
1. Return changesetId for undo
2. Present confirmation with ai.present (result artifact)
3. Suggest next actions (e.g., "Notify John?")

### References
- `validation-rules.md`: Field-specific rules per table
- `scope-rules.md`: projectId auto-injection, cannot override, validate related IDs

## Context Injection

### ChiefRequestContext Interface
```typescript
{
  projectId: string,
  orgId: string,
  userId: string,
  currentPath: string,
  screen: {
    currentPath: string,
    context: Record<string, any>
  },
  conversationId: string,
  sessionId: string
}
```

### Scope Injection Rules
Based on table.scopeHint:
- `'project'`: Requires projectId filter (auto-injected, cannot override)
- `'org'`: Requires orgId filter (auto-injected, cannot override)
- `'mixed'`: Use available scope (projectId or orgId)
- `'global'`: No scope enforcement

### projectId Inference
1. context.projectId (explicit)
2. inferProjectIdFromPath(currentPath) → parse `/projects/:projectId/*`
3. inferProjectIdFromPath(screen.currentPath) → fallback to screen context
4. Error if cannot infer

### Context Passed to All Tools
All MCP tools receive ChiefRequestContext, tools close over context

## Error Handling

### MCP Tool Errors
**Structured format**: `{ error: "error_code", message: "description", fields: [] }`
**Agent behavior**: Interpret errors and explain to user (not raw messages)
**Codes**: SCOPE_VIOLATION, VALIDATION_FAILED, UNDO_TOO_OLD, UNDO_HAS_DEPENDENTS, CHANGESET_ALREADY_UNDONE, MCP_CONNECTION_FAILED, PERMISSION_DENIED

### Scope Violations
- Agent explains cannot write to different project
- Asks if user wants to switch projects
- Example: "I cannot create this defect in Project A. Your current context is Project B. Switch to Project A?"

### Validation Errors
- Agent asks for correction with specific options
- Example: "Priority must be 'low', 'medium', 'high', or 'critical'. You provided 'urgent'. Did you mean 'high'?"

### Undo Limitations
- Age >24hrs: "This changeset is >24 hours old and cannot be undone. Would you like to manually reverse the changes?"
- Dependent data: "This changeset cannot be undone because dependent data exists (3 comments on defect #42). Delete comments first?"
- Already undone: "This changeset was already undone on [timestamp] by [user]."

## Performance Considerations

### Data Access Policy
- maxRequestsPerCall: 20 (parallel db_read requests)
- maxTablesInDescribeSchema: 100
- maxFieldsInDescribeTable: 200
- maxRowsPerList: 100
- maxIdsPerMultiGet: 50
- maxPreviewChars: 2000 (document previews)
- maxChunksPerPage: 6
- maxCharsPerChunk: 4000
- indexEnforcementMode: index_only|allow_scan

### Skill Optimization
- Progressive loading: 1200 lines (skills) vs 5000+ (monolithic)
- Context management: Load only relevant schemas, cache skills, unload when switching modules
- Parallel subagent execution: Concurrent vs sequential (up to 7 concurrent)

### Agent Optimizations
- Skill progressive loading: Avoid loading all skills upfront
- Context management: Load only relevant table schemas on demand
- Parallel subagent execution: Use Task tool for concurrent workflows
- MCP server lifecycle: Spawn per request (isolated, 1-2s latency) vs long-running (no latency, state management complexity)
- Recommendation: Start with spawn per request

## Build Order

### Phase 1: MCP Server (Weeks 1-2)
1. Create mcp-server-convex/ directory
2. Implement db_read tool (all 9 operations)
3. Implement db_write tool (create/update/delete/call)
4. Implement undo tool
5. Test tools with Claude SDK locally (isolation testing)
6. Validate scope enforcement (cross-project blocks)

### Phase 2: API Route (Week 2-3)
1. Create app/api/chief/run/route.ts
2. Implement POST handler with TransformStream
3. Configure query() from @anthropic-ai/claude-agent-sdk
4. Configure mcpServers with convex config (command, args, env)
5. Test SSE streaming with real messages
6. Test session capture and resume

### Phase 3: CLAUDE.md (Week 3)
1. Extract identity, behavior, core rules to .claude/CLAUDE.md (~500 lines)
2. Define "What You Do/Don't Do"
3. Document autonomy levels (Advisor/Operator/Autopilot)
4. List tools available
5. List skills available (metadata only)

### Phase 4: Core Skills (Week 3-4)
1. database-read: Query patterns, index usage
2. database-write: Create/update/delete with validation
3. database-undo: Changeset reversal
4. context-loader: Load relevant schemas on demand

### Phase 5: Domain Skills (Weeks 4-6)
1. domain-defects: Defect lifecycle, prioritization
2. domain-swms: SWMS creation, hazard analysis
3. domain-checklists: Template building, instance conduct
4. domain-inductions: Site/plant induction workflows
5. domain-permits: Permit application, approval
6. domain-assets: Equipment management
7. domain-schedule: Task scheduling, dependencies
8. domain-incidents: Incident reporting, investigation
9. domain-toolbox: Toolbox meetings, attendance
10. domain-diaries: Site diary entries
11. domain-workers: Worker assignments, certifications

### Phase 6: Subagents (Weeks 5-6)
1. SWMS subagent orchestrator (hazard-analyzer → swms-validator → swms-writer)
2. Incident subagent orchestrator (incident-investigator → corrective-action-planner → compliance-reviewer)
3. Test parallel execution (up to 7 concurrent)
4. Test SubagentStart/SubagentStop hooks

### Phase 7: Hooks & Monitoring (Week 6)
1. Implement PreToolUse hook (logging)
2. Implement PostToolUse hook (success/error tracking)
3. Monitor tool call frequency, success rate, execution time
4. Monitor session duration, skill load times

## Skill Authoring Guidelines

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
- [ ] Works in isolation (fresh session)

## Migration from OpenAI Agents SDK

### Pre-Migration State
- Stack: @openai/agents, @openai/chatkit
- Tools: Custom JSON format in lib/ai/engine/
- UI: ChatKit widgets in components/chief-chatkit/
- Adapter: lib/chatkit-adapter/ for UI rendering

### Post-Migration State
- Stack: @anthropic-ai/claude-agent-sdk, @modelcontextprotocol/sdk
- Tools: MCP standard format in mcp-server-convex/
- UI: ShadCN components in components/chief/
- Adapter: None (direct artifact rendering)

### Migration Steps
1. Add Claude SDK dependencies (@anthropic-ai/claude-agent-sdk, @modelcontextprotocol/sdk)
2. Create mcp-server-convex/ directory with package.json, tsconfig.json, index.ts, server.ts, tools/
3. Convert tools to MCP format (db-read.ts, db-write.ts, undo.ts)
4. Replace ChatKit with ShadCN (chat-container.tsx, chat-message.tsx, data-renderer.tsx)
5. Update API route app/api/chief/run/route.ts (query() from Claude SDK, TransformStream SSE)
6. Transform .claude/skills/ to SKILL.md format with frontmatter
7. Remove OpenAI dependencies (@openai/agents, @openai/chatkit)
8. Remove lib/ai/engine/, lib/chatkit-adapter/, components/chief-chatkit/

### Timeline
8-13 weeks total:
- MCP server: 1-2 weeks
- API route: 1 week
- Instruction migration: 2-3 weeks
- Subagents: 1-2 weeks
- UI replacement: 2-3 weeks
- Optimization: 1-2 weeks

## Open Questions

### Q1: Autonomy Progression Mechanism?
**Options**:
- Manual setting (org admin configures level)
- Automatic (metrics-based: approval rate >90% for 2 weeks → promote)
- Hybrid (recommendations + approval: Chief suggests "I've had 95% approval for 3 weeks, promote to Operator?")

**Recommendation**: Hybrid (recommendations + approval)

### Q2: Skill Discovery Reliability?
**Risk**: Description quality critical, poor description = skill never loads
**Mitigation**: Test skill loading with diverse queries, iterate descriptions based on failures
**Open**: Should we add explicit skill triggers (keywords) vs relying on description matching?

### Q3: Multi-Project Context?
**Current**: Single project scope (projectId in context)
**Question**: Should Chief support cross-project operations (e.g., "Move defect from Project A to Project B")?
**Position**: No for MVP, scope strictly enforced per project

### Q4: External Communication?
**Question**: Should Chief send emails/Slack autonomously (with pre-approval)?
**Current Position**: Human must send, Chief drafts only
**Reconsider If**: Trust reaches very high levels (95%+ approval rate) and communications are routine (permit renewal confirmations)
**Decision Timeline**: After 12+ months of usage data

### Q5: Skill Versioning?
**Current**: No versioning for MVP (always latest)
**Question**: Should skills have versions to prevent breaking changes?
**Position**: Add versioning if breaking changes become common
**Triggers**: Skill API changes require versioning, version pinning per org

## Dependencies Summary

**Internal Specs**:
- foundation.md: projectId/orgId scope hierarchy
- chief-agent.md: Identity, autonomy, behavior
- ui-system.md: Chief chat UI, artifact rendering
- _reference/schema.md: executions, aiRuns, conversations tables

**External Libraries**:
- @anthropic-ai/claude-agent-sdk: query(), MCP support, skills, subagents, hooks
- @modelcontextprotocol/sdk: MCP protocol implementation
- Convex: Database backend (mutations, queries, actions)
- Next.js: API route for /api/chief/run (SSE streaming)
- ShadCN: Chief chat components (no ChatKit)
