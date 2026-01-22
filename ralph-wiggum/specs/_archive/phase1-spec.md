# Phase 1: Spec Creation Plan

## Execution Status

| Step | Status | Agents | Output | Completed |
|------|--------|--------|--------|-----------|
| **1A: Extraction** | ✅ DONE | 9 | `_extraction/from-*.md` (9 files, ~370KB, 4,255 lines) | 2025-01-22 12:10 |
| **1B: Assembly** | ✅ DONE | 23 | `target/*.md` (23 files, ~500KB, 11,053 lines) | 2025-01-22 12:21 |
| **2A: Validation** | ✅ DONE | 23 | `_extraction/validation-*.md` (23 files) | 2025-01-22 12:35 |
| **2B: Gap-Fill** | ✅ DONE | 23 | Updated `target/*.md` (23 files enhanced) | 2025-01-22 |

---

## Overview

Transform 9 large reference specs (~760KB, 26K lines) into ~23 Ralph-friendly specs (~500-1000 tokens each).

**Strategy**: Source-First Extraction → Target Assembly → Validation → Gap-Fill

---

## Source Files (Reference)

| # | File | Size | Lines | Content |
|---|------|------|-------|---------|
| 1 | 01-vision.md | 52KB | 1,272 | Users, JTBDs, features, Chief AI |
| 2 | 02-architecture.md | 62KB | 2,238 | Tech stack, layers, patterns |
| 3 | 03-domain-model.md | 120KB | 4,063 | 97 entities, relationships, workflows |
| 4 | 04-schema.md | 128KB | 4,983 | 52 tables, fields, indexes |
| 5 | 05-ai-system.md | 79KB | 2,805 | Chief agent, skills, MCP tools |
| 6 | 06-ui-system.md | 76KB | 3,074 | Components, patterns, pages |
| 7 | 07-mobile-demo.md | 91KB | 2,730 | 51 screens, QR workflows |
| 8 | 08-integrations.md | 63KB | 1,699 | Files, PDF, external APIs |
| 9 | 09-standards.md | 89KB | 3,153 | Coding, testing, conventions |

---

## Target Specs (23 files)

### Reference Specs (not for Ralph planning)
| # | File | Purpose |
|---|------|---------|
| R1 | `_reference/architecture.md` | Tech stack, patterns, conventions |
| R2 | `_reference/schema.md` | Data model overview, relationships |
| R3 | `_reference/standards.md` | Coding standards, testing, accessibility |

### Feature Specs (for Ralph planning)
| # | File | Domain | Covers |
|---|------|--------|--------|
| 1 | `AUDIENCE_JTBD.md` | Core | Users, jobs to be done, outcomes |
| 2 | `foundation.md` | Core | Orgs, projects, workers, trades |
| 3 | `site-operations.md` | Site | Scheduling, diary, toolbox, sign-on |
| 4 | `site-documents.md` | Site | Documents, drawings, folders, uploads |
| 5 | `safety-swms.md` | Safety | SWMS templates, documents, signatures |
| 6 | `safety-permits.md` | Safety | Permit types, instances, 9-state lifecycle |
| 7 | `safety-inductions.md` | Safety | Induction types, invites, completions, certs |
| 8 | `safety-incidents.md` | Safety | Incident reports, investigation, actions |
| 9 | `safety-compliance.md` | Safety | SDS library, registers, sign-on config |
| 10 | `asset-management.md` | Asset | Registry, assets, allocations |
| 11 | `asset-operations.md` | Asset | Prestarts, maintenance, activity |
| 12 | `quality-checklists.md` | Quality | Templates, instances, 14 field types |
| 13 | `quality-defects.md` | Quality | Defects, actions, lifecycle |
| 14 | `communications.md` | Comms | Notifications, messages, alerts |
| 15 | `chief-agent.md` | AI | Chief identity, behavior, autonomy |
| 16 | `chief-tools.md` | AI | Skills, MCP tools, db operations |
| 17 | `mobile-worker.md` | Mobile | Worker screens, task flows |
| 18 | `mobile-qr.md` | Mobile | 7 QR public workflows |
| 19 | `integrations.md` | Integration | Files, PDF, external APIs |
| 20 | `ui-system.md` | UI | Components, patterns, layouts |

---

## Execution Plan

### ITERATION 1: Extract & Draft

#### Step 1A: Extraction (9 parallel Sonnet agents)

Each agent reads ONE source file and extracts content organized by ALL target spec topics.

| Agent | Source | Output |
|-------|--------|--------|
| E1 | `reference/01-vision.md` | `_extraction/from-01-vision.md` |
| E2 | `reference/02-architecture.md` | `_extraction/from-02-architecture.md` |
| E3 | `reference/03-domain-model.md` | `_extraction/from-03-domain-model.md` |
| E4 | `reference/04-schema.md` | `_extraction/from-04-schema.md` |
| E5 | `reference/05-ai-system.md` | `_extraction/from-05-ai-system.md` |
| E6 | `reference/06-ui-system.md` | `_extraction/from-06-ui-system.md` |
| E7 | `reference/07-mobile-demo.md` | `_extraction/from-07-mobile-demo.md` |
| E8 | `reference/08-integrations.md` | `_extraction/from-08-integrations.md` |
| E9 | `reference/09-standards.md` | `_extraction/from-09-standards.md` |

**Extraction Output Format:**
```markdown
# Extracted from: {filename}

## For: AUDIENCE_JTBD.md
- [bullet points of relevant content]

## For: foundation.md
- [bullet points of relevant content]

## For: site-operations.md
- [bullet points of relevant content]

... (repeat for all 23 target specs)

## For: ui-system.md
- [bullet points of relevant content]
```

**Agent Prompt Template (Extraction):**
```
Read the file {source_path} completely.

Extract ALL relevant content and organize it by these target spec topics:
1. AUDIENCE_JTBD.md - Users, personas, jobs to be done, outcomes
2. foundation.md - Orgs, projects, workers, trades, assignments
3. site-operations.md - Scheduling, diary, toolbox meetings, sign-on/off
4. site-documents.md - Documents, drawings, folders, uploads, chunking
5. safety-swms.md - SWMS templates, documents, signatures, assignments
6. safety-permits.md - Permit types, instances, lifecycle, approvals
7. safety-inductions.md - Induction types, invites, completions, certifications
8. safety-incidents.md - Incident reports, investigation, corrective actions
9. safety-compliance.md - SDS library, registers, sign-on config
10. asset-management.md - Asset registry, assets, allocations, bookings
11. asset-operations.md - Prestarts, maintenance, service logs
12. quality-checklists.md - Checklist templates, instances, field types
13. quality-defects.md - Defects, actions, comments, lifecycle
14. communications.md - Notifications, messages, preferences
15. chief-agent.md - Chief identity, behavior, autonomy levels
16. chief-tools.md - Skills system, MCP tools, db operations
17. mobile-worker.md - Mobile screens, worker task flows
18. mobile-qr.md - QR public workflows (7 flows)
19. integrations.md - File storage, PDF generation, external APIs
20. ui-system.md - UI components, patterns, layouts
21. _reference/architecture.md - Tech stack, layers, patterns
22. _reference/schema.md - Tables, fields, indexes, relationships
23. _reference/standards.md - Coding standards, testing, conventions

For each topic, extract:
- Entities/tables mentioned
- Features/capabilities
- Workflows/processes
- Business rules
- Acceptance criteria hints
- Dependencies on other topics

Be EXHAUSTIVE. Do not summarize - extract actual content.
Write output to: {output_path}
```

---

#### Step 1B: Assembly (23 parallel Sonnet agents)

Each agent creates ONE target spec by reading ALL 9 extraction files.

| Agent | Target Spec | Output Path |
|-------|-------------|-------------|
| A1 | AUDIENCE_JTBD.md | `target/AUDIENCE_JTBD.md` |
| A2 | foundation.md | `target/foundation.md` |
| A3 | site-operations.md | `target/site-operations.md` |
| A4 | site-documents.md | `target/site-documents.md` |
| A5 | safety-swms.md | `target/safety-swms.md` |
| A6 | safety-permits.md | `target/safety-permits.md` |
| A7 | safety-inductions.md | `target/safety-inductions.md` |
| A8 | safety-incidents.md | `target/safety-incidents.md` |
| A9 | safety-compliance.md | `target/safety-compliance.md` |
| A10 | asset-management.md | `target/asset-management.md` |
| A11 | asset-operations.md | `target/asset-operations.md` |
| A12 | quality-checklists.md | `target/quality-checklists.md` |
| A13 | quality-defects.md | `target/quality-defects.md` |
| A14 | communications.md | `target/communications.md` |
| A15 | chief-agent.md | `target/chief-agent.md` |
| A16 | chief-tools.md | `target/chief-tools.md` |
| A17 | mobile-worker.md | `target/mobile-worker.md` |
| A18 | mobile-qr.md | `target/mobile-qr.md` |
| A19 | integrations.md | `target/integrations.md` |
| A20 | ui-system.md | `target/ui-system.md` |
| A21 | _reference/architecture.md | `target/_reference/architecture.md` |
| A22 | _reference/schema.md | `target/_reference/schema.md` |
| A23 | _reference/standards.md | `target/_reference/standards.md` |

**Assembly Output Format (Spec Template):**
```markdown
# {Topic Name}

## Purpose
One sentence describing what this topic covers.

## Scope
### In Scope
- Item 1
- Item 2

### Out of Scope
- Covered in {other-spec}.md

## Requirements

### {Sub-area 1}
- REQ-001: Requirement description
- REQ-002: Requirement description

### {Sub-area 2}
- REQ-003: Requirement description

## Acceptance Criteria
- [ ] AC-001: Observable outcome
- [ ] AC-002: Observable outcome

## Entities
| Table | Key Fields | Purpose |
|-------|------------|---------|
| table1 | field1, field2 | Description |

## Workflows
### Workflow 1: {Name}
1. Step 1
2. Step 2
3. Step 3

## Dependencies
- **Requires**: foundation.md (workers), ...
- **Required by**: mobile-worker.md, ...

## Edge Cases
- Edge case 1: How handled
- Edge case 2: How handled
```

**Agent Prompt Template (Assembly):**
```
You are creating the spec file: {spec_name}

Read ALL extraction files:
- _extraction/from-01-vision.md
- _extraction/from-02-architecture.md
- _extraction/from-03-domain-model.md
- _extraction/from-04-schema.md
- _extraction/from-05-ai-system.md
- _extraction/from-06-ui-system.md
- _extraction/from-07-mobile-demo.md
- _extraction/from-08-integrations.md
- _extraction/from-09-standards.md

Find the section "## For: {spec_name}" in each file.
Synthesize ALL extracted content into a single coherent spec.

Follow this template:
[TEMPLATE AS ABOVE]

Requirements:
- Be comprehensive - include ALL extracted content
- Use clear requirement IDs (REQ-001, etc.)
- List ALL entities/tables from schema
- Document ALL workflows mentioned
- Keep token count ~800-1200 (concise but complete)

Write output to: {output_path}
```

---

### ITERATION 2: Validate & Complete

#### Step 2A: Validation (23 parallel Sonnet agents)

Each agent validates ONE target spec against ORIGINAL source files.

**Validation Agent Assignment:**
| Agent | Validates | Primary Sources to Check |
|-------|-----------|--------------------------|
| V1 | AUDIENCE_JTBD.md | 01-vision |
| V2 | foundation.md | 03-domain-model, 04-schema |
| V3 | site-operations.md | 03-domain-model, 04-schema, 07-mobile |
| V4 | site-documents.md | 03-domain-model, 04-schema |
| V5 | safety-swms.md | 03-domain-model, 04-schema, 05-ai, 07-mobile |
| V6 | safety-permits.md | 03-domain-model, 04-schema, 07-mobile |
| V7 | safety-inductions.md | 03-domain-model, 04-schema, 07-mobile |
| V8 | safety-incidents.md | 03-domain-model, 04-schema, 05-ai, 07-mobile |
| V9 | safety-compliance.md | 03-domain-model, 04-schema |
| V10 | asset-management.md | 03-domain-model, 04-schema |
| V11 | asset-operations.md | 03-domain-model, 04-schema, 07-mobile |
| V12 | quality-checklists.md | 03-domain-model, 04-schema, 07-mobile |
| V13 | quality-defects.md | 03-domain-model, 04-schema, 07-mobile |
| V14 | communications.md | 03-domain-model, 04-schema |
| V15 | chief-agent.md | 01-vision, 05-ai-system |
| V16 | chief-tools.md | 05-ai-system, 02-architecture |
| V17 | mobile-worker.md | 07-mobile-demo |
| V18 | mobile-qr.md | 07-mobile-demo |
| V19 | integrations.md | 08-integrations |
| V20 | ui-system.md | 06-ui-system |
| V21 | _reference/architecture.md | 02-architecture |
| V22 | _reference/schema.md | 04-schema |
| V23 | _reference/standards.md | 09-standards |

**Validation Output Format:**
```markdown
# Validation: {spec_name}

## Coverage Score: X/10

## Entities Check
| Entity | In Spec? | Missing Fields |
|--------|----------|----------------|
| table1 | Yes | field_x, field_y |
| table2 | No | ALL |

## Workflows Check
| Workflow | In Spec? | Missing Steps |
|----------|----------|---------------|
| workflow1 | Yes | step 3 |
| workflow2 | No | ALL |

## Missing Items
- [ ] Entity: {name} - not documented
- [ ] Workflow: {name} - incomplete
- [ ] Feature: {name} - not mentioned
- [ ] Business Rule: {description}

## Suggested Additions
```markdown
[actual content to add]
```
```

---

#### Step 2B: Gap-Fill (variable Sonnet agents)

Based on validation results, deploy agents to UPDATE specs with missing content.

**Gap-Fill Agent Prompt:**
```
Read the validation report: _extraction/validation-{spec_name}.md
Read the current spec: target/{spec_name}

Add ALL missing items identified in the validation:
- Missing entities
- Missing workflows
- Missing features
- Missing business rules

Update the spec file in place.
Maintain the existing structure and format.
```

---

## Agent Budget

| Phase | Step | Agents | Running Total |
|-------|------|--------|---------------|
| 1 | 1A: Extraction | 9 | 9 |
| 1 | 1B: Assembly | 23 | 32 |
| 2 | 2A: Validation | 23 | 55 |
| 2 | 2B: Gap-Fill | ~10-20 | 65-75 |

**Execution**: Run in batches of up to 50 parallel agents.

---

## File Structure (Final)

```
specs/
├── phase1-spec.md              # This plan
├── reference/                  # Original source files (read-only)
│   ├── 01-vision.md
│   ├── 02-architecture.md
│   ├── 03-domain-model.md
│   ├── 04-schema.md
│   ├── 05-ai-system.md
│   ├── 06-ui-system.md
│   ├── 07-mobile-demo.md
│   ├── 08-integrations.md
│   └── 09-standards.md
├── _extraction/                # Intermediate extraction outputs
│   ├── from-01-vision.md
│   ├── from-02-architecture.md
│   ├── from-03-domain-model.md
│   ├── from-04-schema.md
│   ├── from-05-ai-system.md
│   ├── from-06-ui-system.md
│   ├── from-07-mobile-demo.md
│   ├── from-08-integrations.md
│   ├── from-09-standards.md
│   └── validation-*.md         # Validation reports (Iteration 2)
└── target/                     # Final Ralph-friendly specs
    ├── AUDIENCE_JTBD.md
    ├── foundation.md
    ├── site-operations.md
    ├── site-documents.md
    ├── safety-swms.md
    ├── safety-permits.md
    ├── safety-inductions.md
    ├── safety-incidents.md
    ├── safety-compliance.md
    ├── asset-management.md
    ├── asset-operations.md
    ├── quality-checklists.md
    ├── quality-defects.md
    ├── communications.md
    ├── chief-agent.md
    ├── chief-tools.md
    ├── mobile-worker.md
    ├── mobile-qr.md
    ├── integrations.md
    ├── ui-system.md
    └── _reference/
        ├── architecture.md
        ├── schema.md
        └── standards.md
```

---

## Success Criteria

1. All 23 target specs created
2. All 52 schema tables covered in at least one spec
3. All major workflows documented
4. Each spec ~800-1200 tokens (concise but complete)
5. Zero orphaned entities (everything mapped)
6. Clear dependencies between specs
