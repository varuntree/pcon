# JTBD Specs Index

> Master index of all Jobs-To-Be-Done specifications for PRJ Construction rebuild.

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

---

## Batch 1: Foundation (P0)

| # | JTBD | File | Status |
|---|------|------|--------|
| 01 | Platform shell & navigation | `01-platform-shell.md` | [ ] |
| 02 | Org & project management | `02-org-project-mgmt.md` | [ ] |
| 03 | Worker/user management | `03-worker-management.md` | [ ] |

---

## Batch 2: Core Features (P1)

| # | JTBD | File | Status |
|---|------|------|--------|
| 04 | Defect tracking & resolution | `04-defect-management.md` | [ ] |
| 05 | SWMS creation & distribution | `05-swms-builder.md` | [ ] |
| 06 | Schedule & task management | `06-schedule-tasks.md` | [ ] |
| 11 | Checklist/prestart builder | `11-checklist-builder.md` | [ ] |
| 14 | Worker mobile shell & nav | `14-mobile-shell.md` | [ ] |
| 15 | Worker task execution | `15-worker-tasks.md` | [ ] |
| 16 | Worker safety compliance | `16-worker-safety.md` | [ ] |
| 17 | Worker SWMS acknowledgment | `17-worker-swms.md` | [ ] |
| 19 | QR code public flows | `19-qr-public-flows.md` | [ ] |
| 21 | File storage & media | `21-file-storage.md` | [ ] |
| 23 | QR code generation | `23-qr-generation.md` | [ ] |

---

## Batch 3: Secondary Features (P2)

| # | JTBD | File | Status |
|---|------|------|--------|
| 07 | Incident reporting | `07-incident-reporting.md` | [ ] |
| 08 | Permit management | `08-permit-management.md` | [ ] |
| 09 | Induction management | `09-induction-management.md` | [ ] |
| 10 | Toolbox talk management | `10-toolbox-management.md` | [ ] |
| 12 | Asset/plant management | `12-asset-management.md` | [ ] |
| 18 | Worker communication | `18-worker-communication.md` | [ ] |
| 22 | PDF generation | `22-pdf-generation.md` | [ ] |

---

## Batch 4: Tertiary (P3)

| # | JTBD | File | Status |
|---|------|------|--------|
| 13 | Site diary | `13-site-diary.md` | [ ] |
| 20 | Chief AI assistant | `20-chief-ai.md` | [ ] |

---

## Dependency Graph

```
Batch 1 (Foundation)
├── 01-platform-shell ──┬──> Batch 2+ (all UI depends on shell)
├── 02-org-project ─────┼──> Batch 2+ (all features scoped to project)
└── 03-worker-mgmt ─────┘──> Batch 2+ (assignments need workers)

Batch 2 (Core)
├── 11-checklist-builder ──> 16-worker-safety (prestarts use checklists)
├── 05-swms-builder ───────> 17-worker-swms (ack requires swms)
├── 21-file-storage ───────> 04, 05, 11, 15, 16 (photos/files)
└── 23-qr-generation ──────> 19-qr-public-flows

Batch 3/4 (Secondary)
└── Most are independent leaf nodes
```

---

## Tech Stack Reference

- **Frontend:** Next.js 15 (App Router), React, TypeScript
- **Backend:** Convex
- **Styling:** Tailwind CSS v4, Shadcn UI
- **See:** `specs/reference/09-standards.md` for full conventions

---

*Auto-generated. Update status as agents complete.*
