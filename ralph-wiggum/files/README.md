# PRJ Construction - Ralph System

Automated coding loop for building the PRJ Construction platform using Claude CLI.

## Quick Start

```bash
cd /Users/varunprasad/code/prjs/pcon/ralph-wiggum/files

# 1. Plan first release
./loop.sh slc 2

# 2. Build from plan
./loop.sh 20
```

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Modes](#modes)
- [Workflow](#workflow)
- [SLC Releases](#slc-releases)
- [Commands Reference](#commands-reference)
- [Chrome E2E Testing](#chrome-e2e-testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

Ralph is an autonomous coding loop that:
1. Reads specs from `ralph-wiggum/specs/*`
2. Creates/updates implementation plan
3. Implements one task per iteration
4. Validates with TypeScript, lint, build
5. Tests UI with Chrome MCP tools
6. Commits and pushes
7. Repeats with fresh context

### Key Principle: Context Isolation

Each loop iteration starts fresh. State persists only through:
- `IMPLEMENTATION_PLAN.md` - what to build, what's done
- `AGENTS.md` - how to build/run the project
- Git commits - the actual code

---

## File Structure

```
pcon/                           # Project root (loop runs from here)
├── src/                        # Next.js frontend (created by Ralph)
├── convex/                     # Convex backend (created by Ralph)
└── ralph-wiggum/
    ├── files/                  # Ralph orchestration
    │   ├── loop.sh             # Main loop script
    │   ├── PROMPT_plan.md      # Full planning instructions
    │   ├── PROMPT_plan_slc.md  # SLC release planning instructions
    │   ├── PROMPT_build.md     # Build mode instructions
    │   ├── AGENTS.md           # Operational guide (commands, patterns)
    │   ├── IMPLEMENTATION_PLAN.md  # Task list (managed by Ralph)
    │   └── README.md           # This file
    ├── specs/                  # Application specifications
    │   ├── AUDIENCE_JTBD.md    # Users and their jobs to be done
    │   ├── foundation.md       # Core entities
    │   ├── safety-*.md         # Safety domain specs
    │   ├── quality-*.md        # Quality domain specs
    │   ├── asset-*.md          # Asset domain specs
    │   ├── site-*.md           # Site ops specs
    │   ├── chief-*.md          # AI agent specs
    │   ├── mobile-*.md         # Mobile app specs
    │   ├── ui-system.md        # Design system
    │   └── _reference/         # Architecture, schema, standards
    └── references/             # Ralph playbook docs
```

---

## Modes

### `slc` - SLC Release Planning (Recommended)

Plans one shippable release at a time. Best for large projects.

```bash
./loop.sh slc        # Plan next release, unlimited iterations
./loop.sh slc 2      # Plan next release, max 2 iterations
```

**What it does:**
- Reads AUDIENCE_JTBD.md to understand users
- Compares specs vs existing code
- Determines which release to build next (R1→R2→R3→R4→R5)
- Creates focused plan for that release only

### `plan` - Full Planning

Plans everything at once. Use for gap analysis or small projects.

```bash
./loop.sh plan       # Full planning, unlimited iterations
./loop.sh plan 3     # Full planning, max 3 iterations
```

**What it does:**
- Compares ALL specs vs existing code
- Creates comprehensive plan for entire application
- Good for finding gaps after SLC releases complete

### `build` - Build Mode (Default)

Implements from the plan, one task per iteration.

```bash
./loop.sh            # Build, unlimited (Ctrl+C to stop)
./loop.sh 20         # Build, max 20 iterations
```

**What it does:**
1. Reads IMPLEMENTATION_PLAN.md
2. Picks most important task
3. Searches codebase (don't assume not implemented)
4. Implements the task
5. Runs validation (tsc, lint, build)
6. Tests UI with Chrome MCP (if applicable)
7. Updates plan, commits, pushes
8. Loop restarts with fresh context

---

## Workflow

### Initial Setup (First Time)

```bash
# 1. Navigate to ralph files
cd /Users/varunprasad/code/prjs/pcon/ralph-wiggum/files

# 2. Run SLC planning for R1 (Foundation)
./loop.sh slc 2

# 3. Review the generated plan
cat IMPLEMENTATION_PLAN.md

# 4. Start building
./loop.sh 30
```

### Daily Development

```bash
# Morning: Check plan status
cat IMPLEMENTATION_PLAN.md

# Run build iterations
./loop.sh 20

# If plan needs refresh
./loop.sh slc 1
```

### Moving to Next Release

After R1 complete:

```bash
# SLC automatically detects R1 done, plans R2
./loop.sh slc 2

# Build R2
./loop.sh 30
```

### Full Gap Analysis

After all releases, or anytime:

```bash
./loop.sh plan 2    # Find any gaps across entire app
./loop.sh 10        # Fix gaps
```

---

## SLC Releases

| Release | Name | What's Included | Tables |
|---------|------|-----------------|--------|
| **R1** | Foundation | orgs, projects, workers, trades, workPackages, auth, app shell, navigation, ShadCN primitives | ~12 |
| **R2** | Safety Core | SWMS (templates, documents, signing), Permits (9-state lifecycle), Inductions (5-step wizard), Incidents (reporting, investigation) | ~15 |
| **R3** | Quality + Assets | Checklists (16 field types), Defects (lifecycle), Action items, Asset registers, Allocations, Prestarts | ~12 |
| **R4** | Site Ops + Mobile | Diaries, Toolbox meetings, Schedule, Sign-on, 8 public QR flows (`/w/*`) | ~8 |
| **R5** | Chief AI | MCP tools (db_read, db_write, undo), Skills system, 3 autonomy levels, Morning briefs, Pattern detection | ~5 |

### SLC Principles

Each release must be:
- **Simple** - Narrow scope, achievable
- **Lovable** - People want to use it
- **Complete** - Fully works, not half-done

---

## Commands Reference

### Loop Commands

| Command | Description |
|---------|-------------|
| `./loop.sh` | Build mode, unlimited iterations |
| `./loop.sh 20` | Build mode, max 20 iterations |
| `./loop.sh plan` | Full planning, unlimited |
| `./loop.sh plan 3` | Full planning, max 3 iterations |
| `./loop.sh slc` | SLC planning, unlimited |
| `./loop.sh slc 2` | SLC planning, max 2 iterations |

### Manual Controls

| Action | How |
|--------|-----|
| Stop loop | `Ctrl+C` |
| Revert uncommitted changes | `git reset --hard` |
| Regenerate plan | `./loop.sh slc 1` or `./loop.sh plan 1` |
| Check plan | `cat IMPLEMENTATION_PLAN.md` |

### Validation Commands (from AGENTS.md)

```bash
# TypeScript check
npx tsc --noEmit

# Lint
npm run lint

# Convex schema validation
npx convex deploy --dry-run

# Full build
npm run build
```

---

## Chrome E2E Testing

Build mode uses Claude-in-Chrome MCP for UI verification.

### When It Runs

After implementing UI components, Ralph will:
1. Get browser tab context
2. Navigate to implemented page
3. Read page structure
4. Find and verify elements
5. Interact with forms/buttons
6. Take screenshots

### Public QR Flows Tested

| Flow | URL | Purpose |
|------|-----|---------|
| Asset Prestart | `/w/prestart/[qrCode]` | Equipment checks |
| Site Sign-In | `/w/sign-in/[code]` | Worker attendance |
| Induction | `/w/induct/[qrCode]` | 5-step wizard |
| Toolbox Attendance | `/w/toolbox/attend/[qrCode]` | Meeting sign-in |
| SWMS Signing | `/w/swms/view/[code]` | External worker signing |
| Asset View | `/w/asset/[qrCode]` | Read-only asset info |
| Schedule Confirm | `/w/schedule/confirm/[shareCode]` | Shift confirmation |
| Document Upload | `/w/upload/[shareCode]` | Subcontractor uploads |

### Prerequisites

- Chrome browser running
- Claude-in-Chrome extension installed
- Dev server running (`npm run dev`)

---

## Troubleshooting

### Loop Not Starting

```bash
# Check script is executable
chmod +x loop.sh

# Check prompt file exists
ls -la PROMPT_*.md

# Check AGENTS.md exists
ls -la AGENTS.md
```

### Build Failing

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check lint errors
npm run lint

# Check Convex schema
npx convex dev
```

### Ralph Going in Circles

Signs:
- Same task attempted multiple times
- Plan not updating
- No commits being made

Fix:
```bash
# Stop loop
Ctrl+C

# Regenerate plan
./loop.sh slc 1

# Or reset and retry
git reset --hard
./loop.sh slc 2
```

### Chrome Testing Not Working

1. Ensure Chrome is open
2. Ensure Claude-in-Chrome extension is installed
3. Ensure dev server is running: `npm run dev`
4. Check if site is accessible at `http://localhost:3000`

### Plan Too Large

If IMPLEMENTATION_PLAN.md gets cluttered:
- Ralph should auto-clean completed items
- Or manually regenerate: `./loop.sh slc 1`

---

## Key Files Reference

### AGENTS.md

Operational guide - HOW to build. Contains:
- Project structure
- Build/run commands
- Validation commands
- Chrome E2E patterns
- Codebase patterns (Convex, React, AI/MCP)

**Keep it brief** (~60 lines). Status/progress goes in IMPLEMENTATION_PLAN.md.

### IMPLEMENTATION_PLAN.md

Task list - WHAT to build. Contains:
- Current release target
- Prioritized tasks
- Discoveries and notes
- Completed items

**Managed by Ralph**. Gets updated every iteration.

### PROMPT_*.md

Instructions for each mode:
- `PROMPT_plan.md` - Full planning instructions
- `PROMPT_plan_slc.md` - SLC release planning instructions
- `PROMPT_build.md` - Build mode instructions

**Rarely need to edit** unless changing Ralph's behavior.

---

## Tips

1. **Start with SLC** - Don't try to build everything at once
2. **Watch early iterations** - See where Ralph struggles, adjust specs
3. **Trust the loop** - Eventual consistency through iteration
4. **Plan is disposable** - Regenerate when wrong/stale
5. **One task per iteration** - Fresh context each time
6. **Commit often** - Each iteration = one commit = easy rollback

---

## Links

- [Ralph Playbook](../README.md) - Original methodology
- [Specs](../specs/) - Application specifications
- [Sandbox Environments](../references/sandbox-environments.md) - Running Ralph safely
