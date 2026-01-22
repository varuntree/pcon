0a. Study `ralph-wiggum/specs/AUDIENCE_JTBD.md` to understand who we're building for and their Jobs to Be Done.
0b. Study `ralph-wiggum/specs/*` with up to 250 parallel Sonnet subagents to learn JTBD activities and domain specifications.
0c. Study @ralph-wiggum/files/IMPLEMENTATION_PLAN.md (if present) to understand the plan so far.
0d. Study `convex/*` with up to 250 parallel Sonnet subagents to understand existing database schema and backend.
0e. Study `src/lib/*` and `src/components/ui/*` with up to 250 parallel Sonnet subagents to understand shared utilities & UI primitives.
0f. For reference, the application source code is in `src/*` (frontend) and `convex/*` (backend).

1. Sequence the specs into a user journey map for each audience (Project Managers, Field Workers, Business Owners). Consider how activities flow into each other and what dependencies exist. The journey follows:

**Project Manager Journey**: Morning briefing → Proactive identification → Draft execution → Follow-ups → Compliance → Escalation
**Field Worker Journey**: Site sign-in → View tasks → Sign SWMS → Conduct checklists → Report incidents → Submit prestarts → Sign out
**Business Owner Journey**: Multi-project dashboard → Risk monitoring → Compliance assurance → Operational metrics

2. Determine the next SLC release. Use up to 500 Sonnet subagents to compare `src/*` and `convex/*` against `ralph-wiggum/specs/*`. Use an Opus subagent to analyze findings. Ultrathink. Given what's already implemented, recommend which activities (at what capability depths) form the most valuable next release.

**SLC Releases Structure:**
- **R1: Foundation** - orgs, projects, workers, trades, workPackages, basic auth, app shell, navigation
- **R2: Safety Core** - SWMS (templates, documents, signing), Permits (lifecycle), Inductions (wizard), Incidents (reporting)
- **R3: Quality + Assets** - Checklists (16 field types), Defects (lifecycle), Assets (registers, prestarts, allocations)
- **R4: Site Ops + Mobile** - Diaries, Toolbox, Schedule, Sign-on, Public QR flows (/w/*)
- **R5: Chief AI** - MCP tools, Skills system, Autonomy levels, Morning briefs, Pattern detection

Prefer thin horizontal slices - the narrowest scope that still delivers real value. A good slice is:
- **Simple**: Narrow, achievable
- **Lovable**: People want to use it
- **Complete**: Fully accomplishes a meaningful job, not a broken preview

3. Use an Opus subagent (ultrathink) to analyze and synthesize the findings, prioritize tasks, and create/update @ralph-wiggum/files/IMPLEMENTATION_PLAN.md as a bullet point list sorted in priority of items yet to be implemented for the recommended SLC release.

Begin plan with:
- **Release**: Which SLC release (R1-R5)
- **What's included**: Activities and capability depths
- **Why this release**: Value delivered, audience served
- **Dependencies**: What must exist first

Then list prioritized tasks for that scope. Consider TODOs, placeholders, minimal implementations, skipped tests - but scoped to the release. Note discoveries outside scope as future work.

IMPORTANT: Plan only. Do NOT implement anything. Do NOT assume functionality is missing; confirm with code search first. Treat `src/lib` and `src/components/ui` as the project's standard library for shared utilities and components. Prefer consolidated, idiomatic implementations there over ad-hoc copies.

ULTIMATE GOAL: Achieve the most valuable next SLC release for the audiences defined in `ralph-wiggum/specs/AUDIENCE_JTBD.md`. Each release should be shippable and deliver real value. If an element is missing from specs, search first to confirm it doesn't exist, then if needed author the specification at ralph-wiggum/specs/FILENAME.md. If you create a new element then document the plan to implement it in @ralph-wiggum/files/IMPLEMENTATION_PLAN.md using a subagent.
