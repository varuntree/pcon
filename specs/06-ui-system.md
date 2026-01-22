# 06: UI System Specification

> Complete UI system for PRJ Construction: ShadCN + Tailwind, design tokens, component library, Chief chat interface, all UI patterns.

---

## 1. Purpose & Scope

### What This Document Covers

**Design Tokens**
- Complete CSS variable system (colors, spacing, typography, shadows)
- Status/priority color system (50+ variants)
- Border radii, brand colors, semantic colors

**Component Library**
- 28 ShadCN primitives (buttons, forms, cards, dialogs, etc.)
- Custom components (StatusBadge, PriorityBadge, FilterChip)
- Layout components (AppShell, PageHeader, EmptyState)
- Shared utilities (LoadingState, SignaturePad, QRCode)

**Chief Chat Interface (ShadCN-based)**
- Chat container and message rendering
- Structured data renderers (tables, confirmations, forms)
- Questions form component
- Undo button integration

**Page Layout Patterns**
- Platform shell (sidebar + main + AI pane)
- Dashboard pattern (header + filters + stats + grid)
- Detail page pattern (header + tabs + content)
- Split preview layout (3-column builder)

**Form Patterns**
- Standard form layout
- Field composition (Label + Input/Select/Textarea)
- Validation and error states
- Multi-step forms

**Data Display Patterns**
- Table layouts with actions
- Card grids with metrics
- Empty states
- Loading skeletons

**Responsive Design**
- Mobile-first patterns
- Touch-friendly targets (44px minimum)
- Collapsible layouts
- Sheet overlays

**Accessibility**
- Focus management
- ARIA support
- Keyboard navigation
- Screen reader support

### What This Does NOT Cover

**Mobile Simulator Specifics**: See 07-mobile-demo.md for worker persona UI
**Business Logic**: See 03-domain-model.md for entities and relationships
**AI System Internals**: See 05-ai-system.md for Chief architecture
**Backend Schema**: See 04-schema.md for data structures

---

## 2. Overview

### Design Philosophy

PRJ Construction's UI is built on ShadCN primitives with a consistent design language inspired by Intercom:
- **Rounded panels** (12px radius) create friendly, modern feel
- **Warm neutrals** (#efefeb viewport, white panels) avoid harsh contrast
- **Monochrome primary** (near-black #212121) with orange accent (#f97316)
- **Muted colors** for status/priority (50+ CSS variables)
- **Component composition** - build complex UIs from simple primitives

### Technology Stack

**Core Framework**
- Next.js 16 App Router
- React 19
- TypeScript 5

**Styling**
- Tailwind CSS 4.0 (utility-first)
- CSS Variables (theming)
- tw-animate-css (animations)

**Component Library**
- ShadCN (Radix UI primitives + Tailwind)
- Lucide React (icons)
- Custom components built on ShadCN patterns

**No External UI Libraries**
- No ChatKit widgets
- No OpenAI UI components
- Everything built with ShadCN + Tailwind

---

## 3. Core Concepts

### Concept 1: CSS Variables for Theming

**All colors via CSS variables** - No hardcoded Tailwind color classes.

**Why:**
- Consistent theming across entire app
- Easy to update colors globally
- Dark mode support (defined but not active)
- Status/priority colors managed centrally

**Pattern:**
```css
/* Definition in globals.css */
--status-open-bg: #fef5f5;
--status-open-text: #b44343;

/* Usage in component */
style={{
  backgroundColor: 'var(--status-open-bg)',
  color: 'var(--status-open-text)'
}}
```

### Concept 2: ShadCN as Foundation

**Pre-built accessible components** - Radix UI primitives wrapped with Tailwind styling.

**Why:**
- Accessibility built-in (ARIA, keyboard nav, focus management)
- Consistent patterns across all modules
- Customizable via CSS variables
- No library lock-in (own the code)

**Components live in:** `components/ui/`

### Concept 3: Component Composition

**Build complex UIs from simple primitives** - No monolithic components.

**Pattern:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardAction><Button /></CardAction>
  </CardHeader>
  <CardContent>
    <StatusBadge />
    <CompactMetrics />
  </CardContent>
</Card>
```

### Concept 4: Consistent Patterns Everywhere

**Same patterns across all modules** - Dashboard, forms, cards, tables all follow established patterns.

**Benefits:**
- Faster development (copy established patterns)
- Easier learning curve
- Predictable UX
- Maintainable codebase

---

## 4. Detailed Specification

### 4.1 Design Tokens

#### 4.1.0 Dark Mode Activation

**Mechanism:** Custom Tailwind variant `@custom-variant dark (&:is(.dark *));`

**How Dark Mode Works:**
1. Add `dark` class to root element: `<html class="dark">`
2. All dark mode CSS variables activate automatically
3. Use `dark:` prefix in Tailwind for dark-specific styles

**Example:**
```tsx
// Light mode: white background
// Dark mode: dark gray background
<div className="bg-card dark:bg-card">

// Manual overrides
<span className="text-foreground dark:text-muted-foreground">
```

**Current State:** Dark mode defined but not active. No UI toggle implemented.

#### 4.1.1 Border Radius

```css
--radius: 0.75rem;  /* 12px - base radius */
--radius-sm: 0.5rem;  /* 8px */
--radius-md: 0.625rem;  /* 10px */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1rem;  /* 16px */
```

**Usage:**
- Buttons: `rounded-full` (pill shape)
- Cards/Panels: `rounded-lg` (12px)
- Inputs: `rounded-md` (10px)
- Badges: `rounded-full` (pill shape)

#### 4.1.2 Core Colors (Light Mode)

```css
/* Backgrounds */
--background: #efefeb;  /* Viewport: Warm off-white */
--card: #ffffff;  /* Panels: Pure white */
--popover: #ffffff;  /* Dropdowns: White */

/* Text */
--foreground: #212121;  /* Near-black */
--card-foreground: #212121;
--popover-foreground: #212121;

/* Brand */
--brand: #f97316;  /* Orange accent (Intercom-inspired) */
--seam: #e1e2dd;  /* Shell divider (cooler than border) */

/* Semantic Colors */
--primary: #212121;  /* Monochrome primary */
--primary-foreground: #ffffff;

--secondary: #f6f6f3;  /* Subtle warm neutral */
--secondary-foreground: oklch(0.25 0 0);

--muted: #f8f8f6;  /* Muted background */
--muted-foreground: oklch(0.42 0 0);

--accent: #f3f3ef;  /* Hover/selection surface */
--accent-foreground: oklch(0.25 0 0);

--destructive: oklch(0.55 0.2 25);  /* Muted red */

/* Borders & Inputs */
--border: #e5e5e1;  /* Subtle neutral */
--input: #e5e5e1;  /* Input border */
--ring: color-mix(in oklab, var(--brand) 65%, white);  /* Focus ring */
```

#### 4.1.2b Core Colors (Dark Mode)

**IMPORTANT:** Dark mode defined but not currently active in UI.

```css
/* Backgrounds */
--background: oklch(0.12 0 0);  /* Dark gray */
--card: oklch(0.15 0 0);        /* Slightly lighter */
--popover: oklch(0.15 0 0);

/* Text */
--foreground: oklch(0.95 0 0);  /* Near-white */
--card-foreground: oklch(0.95 0 0);
--popover-foreground: oklch(0.95 0 0);

/* Semantic */
--primary: oklch(0.95 0 0);     /* Light gray (inverted) */
--primary-foreground: oklch(0.12 0 0);

--secondary: oklch(0.22 0 0);
--secondary-foreground: oklch(0.95 0 0);

--muted: oklch(0.22 0 0);
--muted-foreground: oklch(0.65 0 0);

--accent: oklch(0.22 0 0);
--accent-foreground: oklch(0.95 0 0);

--destructive: oklch(0.50 0.18 25);

/* Borders & Inputs */
--border: oklch(0.25 0 0);
--input: oklch(0.25 0 0);
--ring: oklch(0.50 0 0);
--seam: oklch(0.25 0 0);

/* Charts */
--chart-1: oklch(0.60 0.12 41);
--chart-2: oklch(0.60 0.08 185);
--chart-3: oklch(0.55 0.05 227);
--chart-4: oklch(0.70 0.10 84);
--chart-5: oklch(0.65 0.10 70);
```

#### 4.1.3 Sidebar Colors

```css
--sidebar: #fafbf8;  /* Subtly lighter than viewport */
--sidebar-foreground: oklch(0.35 0 0);
--sidebar-primary: oklch(0.15 0 0);
--sidebar-primary-foreground: oklch(1 0 0);
--sidebar-accent: #ffffff;  /* Active state: White */
--sidebar-accent-foreground: #212121;
--sidebar-border: #e5e5e1;
--sidebar-ring: oklch(0.55 0 0);
```

#### 4.1.3b Sidebar Colors (Dark Mode)

```css
--sidebar: oklch(0.12 0 0);
--sidebar-foreground: oklch(0.95 0 0);
--sidebar-primary: oklch(0.95 0 0);
--sidebar-primary-foreground: oklch(0.12 0 0);
--sidebar-accent: oklch(0.22 0 0);
--sidebar-accent-foreground: oklch(0.95 0 0);
--sidebar-border: oklch(0.25 0 0);
--sidebar-ring: oklch(0.50 0 0);
```

#### 4.1.3c Warning Colors (Light Mode)

```css
--warning-bg: #fdf8ef;
--warning-text: #a16520;
--warning-border: #e5c9a3;
--warning-icon: #b8762d;
```

#### 4.1.3d Warning Colors (Dark Mode)

```css
--warning-bg: #3d2f1a;
--warning-text: #e5b871;
--warning-border: #5c4a2a;
--warning-icon: #d4a34a;
```

#### 4.1.4 Status Colors

**Pattern:** `--status-{key}-bg` and `--status-{key}-text`

**Workflow States:**
```css
--status-open-bg: #fef5f5;
--status-open-text: #b44343;

--status-in-progress-bg: #f0f5fa;
--status-in-progress-text: #3b6fa0;

--status-completed-bg: #f0f7f4;
--status-completed-text: #1e6b52;

--status-closed-bg: #f0f0f0;
--status-closed-text: #6b6b6b;

--status-cancelled-bg: #f5f5f5;
--status-cancelled-text: #6b6b6b;

--status-resolved-bg: #f5f5f5;
--status-resolved-text: #525252;

--status-todo-bg: #f5f9f5;
--status-todo-text: #2d6a4f;
```

**Approval States:**
```css
--status-draft-bg: #f5f5f5;
--status-draft-text: #525252;

--status-pending-bg: #fdf8ef;
--status-pending-text: #a16520;

--status-approved-bg: #f0f7f4;
--status-approved-text: #1e6b52;

--status-rejected-bg: #fef5f5;
--status-rejected-text: #b44343;

--status-expired-bg: #fdf8ef;
--status-expired-text: #a16520;

--status-archived-bg: #f0f0f0;
--status-archived-text: #6b6b6b;
```

**Asset States:**
```css
--status-active-bg: #f0f7f4;
--status-active-text: #1e6b52;

--status-available-bg: #f0f5fa;
--status-available-text: #3b6fa0;

--status-assigned-bg: #fdf8ef;
--status-assigned-text: #a16520;

--status-inactive-bg: #f5f5f5;
--status-inactive-text: #6b6b6b;

--status-maintenance-bg: #fdf8ef;
--status-maintenance-text: #a16520;

--status-disposed-bg: #fef5f5;
--status-disposed-text: #b44343;
```

**Inspection States:**
```css
--status-not-started-bg: #f5f5f5;
--status-not-started-text: #6b6b6b;

--status-passed-bg: #f0f7f4;
--status-passed-text: #1e6b52;

--status-failed-bg: #fef5f5;
--status-failed-text: #b44343;

--status-skipped-bg: #f5f5f5;
--status-skipped-text: #6b6b6b;
```

**Schedule States:**
```css
--status-planned-bg: #f5f5f5;
--status-planned-text: #6b6b6b;

--status-delayed-bg: #fef5f5;
--status-delayed-text: #b44343;
```

**Incident States:**
```css
--status-under-investigation-bg: #fdf8ef;
--status-under-investigation-text: #a16520;
```

#### 4.1.5 Priority Colors

```css
--priority-low-bg: #f5f5f5;
--priority-low-text: #6b6b6b;

--priority-medium-bg: #f0f5fa;
--priority-medium-text: #3b6fa0;

--priority-high-bg: #fdf8ef;
--priority-high-text: #a16520;

--priority-urgent-bg: #fef5f5;
--priority-urgent-text: #b44343;

--priority-critical-bg: #fdf0f0;
--priority-critical-text: #993333;
```

#### 4.1.6 Warning/Notification Colors

```css
/* Warning */
--warning-bg: #fdf8ef;
--warning-text: #a16520;
--warning-border: #e5c9a3;
--warning-icon: #b8762d;

/* Notification Types */
--notify-expiry-bg: #fef5f5;
--notify-expiry-text: #b44343;

--notify-approval-bg: #fdf8ef;
--notify-approval-text: #a16520;

--notify-action-bg: #f0f5fa;
--notify-action-text: #3b6fa0;

--notify-status-bg: #f0f7f4;
--notify-status-text: #1e6b52;

--notify-system-bg: #f5f5f5;
--notify-system-text: #525252;
```

#### 4.1.7 Filter Chip Colors

```css
--chip-bg: #ffffff;
--chip-text: #3a3a3a;
--chip-border: #e5e5e1;

--chip-selected-bg: #f3f3ef;
--chip-selected-text: #212121;
--chip-selected-border: #e1e2dd;
```

#### 4.1.8 Typography

**Font Families:**
```css
--font-sans: 'Inter', system-ui, sans-serif;  /* Variable font */
--font-mono: 'Geist Mono', monospace;
```

**Font Variable Mapping (Tailwind Integration):**
```css
--font-sans: var(--font-inter);        /* font-sans class */
--font-mono: var(--font-geist-mono);   /* font-mono class */
```

**Usage:**
```tsx
<body className="font-sans">  {/* Uses Inter variable font */}
<code className="font-mono">  {/* Uses Geist Mono */}
```

**Note:** `--font-inter` and `--font-geist-mono` are provided by Next.js font optimization (defined in root layout).

**Font Sizes (Tailwind classes):**
| Class | Size | Usage |
|-------|------|-------|
| `text-[11px]` | 11px | Badges, compact labels |
| `text-xs` | 12px | Table headers, captions |
| `text-[13px]` | 13px | Buttons, tabs, filter chips |
| `text-sm` | 14px | Body text, form labels, descriptions |
| `text-base` | 16px | Default body |
| `text-lg` | 18px | Dialog titles |
| `text-xl` | 20px | Page titles (PageHeader) |
| `text-2xl` | 24px | Hero titles |

**Font Weights:**
| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, nav items |
| `font-semibold` | 600 | Headings, card titles |
| `font-bold` | 700 | Emphasis |

#### 4.1.9 Spacing

**Tailwind Scale (4px base):**
| Class | Size | Usage |
|-------|------|-------|
| `gap-1` | 4px | Tight inline elements |
| `gap-2` | 8px | Form fields, buttons |
| `gap-3` | 12px | Card/panel spacing |
| `gap-4` | 16px | Section spacing |
| `gap-6` | 24px | Page sections |
| `gap-8` | 32px | Major sections |

**Common Patterns:**
- Form field groups: `space-y-4`
- Label + Input: `space-y-2`
- Page container: `space-y-6`
- Button groups: `gap-2`

#### 4.1.10 Shadows

**CORRECTION:** The shadows documented are NOT defined as CSS variables in globals.css. These are Tailwind's default shadow utilities.

**Usage:** Use Tailwind classes directly:
```tsx
<Card className="shadow">           {/* Subtle shadow */}
<Popover className="shadow-md">    {/* Moderate shadow */}
<Dialog className="shadow-lg">     {/* Prominent shadow */}
```

No custom CSS variables exist for shadows in this system.

#### 4.1.11 Chart Colors

```css
--chart-1: oklch(0.55 0.15 41);  /* Muted orange */
--chart-2: oklch(0.55 0.1 185);  /* Muted cyan */
--chart-3: oklch(0.45 0.06 227);  /* Muted blue */
--chart-4: oklch(0.65 0.12 84);  /* Muted green */
--chart-5: oklch(0.60 0.12 70);  /* Muted yellow */
```

#### 4.1.12 Ticket Wallet Colors

**Purpose:** Dedicated color system for worker digital wallet (QR codes, certifications, permits).

**Gradient Backgrounds:**
```css
--ticket-gradient-1-start: #1a1a2e;
--ticket-gradient-1-end: #16213e;

--ticket-gradient-2-start: #0f3460;
--ticket-gradient-2-end: #16537e;

--ticket-gradient-3-start: #1a3c40;
--ticket-gradient-3-end: #1d5c63;
```

**Ticket State Colors:**
```css
/* Valid/Active */
--ticket-valid-bg: #2d7a5f;
--ticket-valid-text: #ffffff;

/* Expiring Soon */
--ticket-expiring-bg: #c68520;
--ticket-expiring-text: #ffffff;

/* Expired/Invalid */
--ticket-expired-bg: #c45050;
--ticket-expired-text: #ffffff;
```

**Usage:**
```tsx
<div style={{
  background: `linear-gradient(135deg, var(--ticket-gradient-1-start), var(--ticket-gradient-1-end))`
}}>
  <div style={{
    backgroundColor: 'var(--ticket-valid-bg)',
    color: 'var(--ticket-valid-text)'
  }}>
    Valid until 2026-12-31
  </div>
</div>
```

#### 4.1.13 Tailwind Theme Integration

**Purpose:** CSS variables mapped to Tailwind utilities via `@theme inline`.

**Color Mappings:**
```css
--color-background: var(--background);     /* bg-background */
--color-foreground: var(--foreground);     /* text-foreground */
--color-brand: var(--brand);               /* bg-brand, text-brand */
--color-seam: var(--seam);                 /* border-seam */
--color-primary: var(--primary);           /* bg-primary */
--color-secondary: var(--secondary);       /* bg-secondary */
--color-muted: var(--muted);               /* bg-muted */
--color-accent: var(--accent);             /* bg-accent */
--color-destructive: var(--destructive);   /* bg-destructive */
--color-border: var(--border);             /* border-border */
--color-input: var(--input);               /* border-input */
--color-ring: var(--ring);                 /* ring-ring */
```

**Sidebar Mappings:**
```css
--color-sidebar: var(--sidebar);                               /* bg-sidebar */
--color-sidebar-foreground: var(--sidebar-foreground);         /* text-sidebar-foreground */
--color-sidebar-accent: var(--sidebar-accent);                 /* bg-sidebar-accent */
--color-sidebar-border: var(--sidebar-border);                 /* border-sidebar-border */
```

**Chart Mappings:**
```css
--color-chart-1: var(--chart-1);  /* bg-chart-1 */
--color-chart-2: var(--chart-2);  /* bg-chart-2 */
--color-chart-3: var(--chart-3);  /* bg-chart-3 */
--color-chart-4: var(--chart-4);  /* bg-chart-4 */
--color-chart-5: var(--chart-5);  /* bg-chart-5 */
```

**Radius Mappings:**
```css
--radius-sm: calc(var(--radius) - 4px);  /* rounded-sm = 8px */
--radius-md: calc(var(--radius) - 2px);  /* rounded-md = 10px */
--radius-lg: var(--radius);              /* rounded-lg = 12px */
--radius-xl: calc(var(--radius) + 4px);  /* rounded-xl = 16px */
```

**Usage:**
```tsx
// Use Tailwind utilities instead of style prop
<div className="bg-background text-foreground">
<Button className="bg-brand">Brand Button</Button>
<Card className="bg-card rounded-lg border-border">
```

**Why This Matters:**
- Enables using semantic names in Tailwind classes
- `bg-background` instead of `bg-[#efefeb]`
- `border-border` instead of `border-[#e5e5e1]`
- Maintains theming consistency

#### 4.1.14 Global Base Styles

**Purpose:** Tailwind base layer applies defaults to all elements.

**Implementation:**
```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Effect:**
- All elements use `--border` color for borders by default
- All elements use `--ring` at 50% opacity for outlines (focus states)
- Body has viewport background + foreground text by default

**Why This Matters:**
- No need to specify `border-border` on every bordered element
- Consistent focus outline system-wide
- Theme switching automatically updates all borders/outlines

---

### 4.2 ShadCN Component Library

#### 4.2.1 Button

**File:** `components/ui/button.tsx`

**Variants:**
```tsx
variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
```

- `default`: Primary black background, white text
- `destructive`: Red background for dangerous actions
- `outline`: Border with card background
- `secondary`: Neutral secondary background
- `ghost`: Transparent, hover shows accent
- `link`: Underline text

**Sizes:**
```tsx
size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'
```

- `default`: h-9 (36px), px-4
- `sm`: h-8 (32px), px-3
- `lg`: h-10 (40px), px-6
- `icon`: size-9 (square)
- `icon-sm`: size-8
- `icon-lg`: size-10

**Features:**
- Rounded full (pill shape)
- Focus ring with offset
- Disabled states (50% opacity)
- SVG icon auto-sizing (size-4)
- `asChild` prop for composition (Slot pattern)

**Examples:**
```tsx
<Button variant="default">Submit</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
<Button variant="destructive">Delete</Button>
```

#### 4.2.2 Card

**File:** `components/ui/card.tsx`

**Components:**
- `Card`: Container with rounded border
- `CardHeader`: Top section with grid layout
- `CardTitle`: Heading (text-sm, font-semibold)
- `CardDescription`: Subtitle (text-sm, muted)
- `CardAction`: Top-right action area
- `CardContent`: Main content (px-5, pb-5)
- `CardFooter`: Bottom section

**Grid Layout:**
CardHeader uses CSS Grid for automatic title/action positioning:
```tsx
<div className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto] gap-x-4">
  {/* Title spans first column */}
  {/* Action in second column, spans all rows */}
  {/* Description spans first column */}
</div>
```

**Example:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Defect #1234</CardTitle>
    <CardDescription>Electrical issue in Unit 5</CardDescription>
    <CardAction><StatusBadge status="open" /></CardAction>
  </CardHeader>
  <CardContent>
    <CompactMetrics metrics={metrics} />
  </CardContent>
  <CardFooter>
    <Button variant="outline">View Details</Button>
  </CardFooter>
</Card>
```

#### 4.2.3 Badge

**File:** `components/ui/badge.tsx`

**Variants:**
- `default`: Primary background
- `secondary`: Secondary background
- `destructive`: Red background
- `outline`: Border only

**Features:**
- Rounded full (pill)
- Text size: 11px
- Font weight: medium
- SVG icon support (size-3)
- Hover states on links

**Example:**
```tsx
<Badge variant="default">New</Badge>
<Badge variant="outline">Draft</Badge>
<Badge variant="secondary">3 items</Badge>
```

#### 4.2.4 StatusBadge

**File:** `components/ui/status-badge.tsx`

**Purpose:** Dynamic badge using CSS variable color system.

**Props:**
```tsx
interface StatusBadgeProps {
  status: string;  // e.g., "open", "completed"
  config: Record<string, { label: string; cssVar: string }>;
  className?: string;
  icon?: ReactNode;
}
```

**Logic:**
```tsx
const { label, cssVar } = config[status] || { label: status, cssVar: 'status-open' };

<span
  style={{
    backgroundColor: `var(--${cssVar}-bg)`,
    color: `var(--${cssVar}-text)`,
  }}
  className={cn(
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none",
    className
  )}
>
  {icon}
  {label}
</span>
```

**Example:**
```tsx
const DEFECT_STATUSES = {
  open: { label: 'Open', cssVar: 'status-open' },
  in_progress: { label: 'In Progress', cssVar: 'status-in-progress' },
  completed: { label: 'Completed', cssVar: 'status-completed' }
};

<StatusBadge status="open" config={DEFECT_STATUSES} />
```

#### 4.2.5 PriorityBadge

**File:** `components/ui/priority-badge.tsx`

**Purpose:** Similar to StatusBadge but for priorities.

**Props:**
```tsx
interface PriorityBadgeProps {
  priority: string;  // e.g., "high", "critical"
  config: Record<string, { label: string; cssVar: string }>;
  className?: string;
  icon?: ReactNode;
}
```

**Example:**
```tsx
const PRIORITIES = {
  low: { label: 'Low', cssVar: 'priority-low' },
  medium: { label: 'Medium', cssVar: 'priority-medium' },
  high: { label: 'High', cssVar: 'priority-high' },
  critical: { label: 'Critical', cssVar: 'priority-critical' }
};

<PriorityBadge priority="high" config={PRIORITIES} />
```

#### 4.2.6 FilterChip

**File:** `components/ui/filter-chip.tsx`

**Purpose:** Interactive filter button with dropdown.

**Props:**
```tsx
interface FilterChipProps {
  label: string;  // Display text
  value: string | string[];  // Current selection
  options: { value: string; label: string }[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;  // Default false
}
```

**Features:**
- Popover dropdown
- Single/multiple selection
- Shows count when multiple selected ("Status (3)")
- Clear selection button
- Uses chip CSS variables

**Example:**
```tsx
<FilterChip
  label="Status"
  value={selectedStatus}
  options={[
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ]}
  onChange={setSelectedStatus}
  multiple
/>
```

#### 4.2.7 Input

**File:** `components/ui/input.tsx`

**Features:**
- Height: h-9 (36px)
- Rounded: rounded-md (10px)
- Focus ring
- Placeholder styling (muted-foreground)
- File input support
- Disabled states (50% opacity, cursor-not-allowed)
- `aria-invalid` support (red ring)

**Types:**
- `text`, `email`, `password`, `number`, `tel`, `url`
- `file`, `date`, `time`, `datetime-local`
- `search` (with search icon support)

**Example:**
```tsx
<Input type="text" placeholder="Enter name" />
<Input type="email" aria-invalid={!!error} />
<Input type="file" accept="image/*" />
```

#### 4.2.8 Textarea

**File:** `components/ui/textarea.tsx`

**Features:**
- Min height: h-16 (64px)
- Auto-resizing: `field-sizing: content`
- Focus ring
- Same styling as Input

**Example:**
```tsx
<Textarea placeholder="Enter description" rows={4} />
```

#### 4.2.9 Label

**File:** `components/ui/label.tsx`

**Features:**
- Text size: sm (14px)
- Font weight: medium
- Flex layout with gap-2 (supports inline icons)
- Peer disabled support (50% opacity)

**Example:**
```tsx
<Label htmlFor="email">
  <Mail className="size-4" />
  Email Address
</Label>
<Input id="email" type="email" />
```

#### 4.2.10 Select

**File:** `components/ui/select.tsx`

**Components:**
- `Select`: Root container
- `SelectTrigger`: Button trigger
- `SelectValue`: Placeholder/value display
- `SelectContent`: Dropdown portal
- `SelectItem`: Individual option
- `SelectGroup`, `SelectLabel`, `SelectSeparator`

**Trigger Sizes:**
- `default`: h-9
- `sm`: h-8

**Features:**
- Chevron icon (auto-rotates when open)
- Keyboard navigation
- Scroll buttons for long lists
- Check indicator on selected item

**Example:**
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Statuses</SelectLabel>
      <SelectItem value="open">Open</SelectItem>
      <SelectItem value="closed">Closed</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

#### 4.2.11 Checkbox

**File:** `components/ui/checkbox.tsx`

**Features:**
- Size: 4 (16px)
- Rounded: 6px
- Checked state: Foreground background with check icon
- Focus ring
- Disabled support (50% opacity)
- Indeterminate state support

**Example:**
```tsx
<div className="flex items-center gap-2">
  <Checkbox id="terms" checked={agreed} onCheckedChange={setAgreed} />
  <Label htmlFor="terms">I agree to terms</Label>
</div>
```

#### 4.2.12 Dialog

**File:** `components/ui/dialog.tsx`

**Components:**
- `Dialog`: Root container
- `DialogTrigger`: Button to open
- `DialogContent`: Modal content (max-w-lg, centered)
- `DialogHeader`, `DialogFooter`
- `DialogTitle`, `DialogDescription`
- `DialogClose`: Close button

**Features:**
- Backdrop overlay (40% opacity)
- Animations (fade + zoom)
- Auto-adds VisuallyHidden title if missing (a11y)
- Optional close button (default: true)
- Escape key to close

**Example:**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Add Defect</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Defect</DialogTitle>
      <DialogDescription>
        Report a quality issue on the project.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Form fields */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSubmit}>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 4.2.13 Sheet

**File:** `components/ui/sheet.tsx`

**Purpose:** Slide-in panel (drawer).

**Components:**
- `Sheet`: Root
- `SheetTrigger`: Button
- `SheetContent`: Panel
- `SheetHeader`, `SheetFooter`
- `SheetTitle`, `SheetDescription`
- `SheetClose`: Close button

**Sides:**
- `right` (default): w-3/4, sm:max-w-sm
- `left`: w-3/4, sm:max-w-sm
- `top`, `bottom`: Full width, auto height

**Features:**
- Slide animations (from specified side)
- Backdrop overlay
- Close button (top-right)
- Escape key to close

**Example:**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon"><MenuIcon /></Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    <nav className="space-y-2">
      {/* Nav items */}
    </nav>
  </SheetContent>
</Sheet>
```

#### 4.2.14 Tabs

**File:** `components/ui/tabs.tsx`

**Components:**
- `Tabs`: Root container
- `TabsList`: Rounded full container (bg-secondary, border)
- `TabsTrigger`: Individual tab (rounded full pill)
- `TabsContent`: Panel content

**Features:**
- Active state: White bg, border, shadow
- Horizontal scroll support
- Focus rings
- Keyboard navigation (arrow keys)

**Example:**
```tsx
<Tabs value={tab} onValueChange={setTab} defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="attachments">Attachments</TabsTrigger>
  </TabsList>
  <TabsContent value="details">
    {/* Details content */}
  </TabsContent>
  <TabsContent value="activity">
    {/* Activity content */}
  </TabsContent>
  <TabsContent value="attachments">
    {/* Attachments content */}
  </TabsContent>
</Tabs>
```

#### 4.2.15 Table

**File:** `components/ui/table.tsx`

**Components:**
- `Table`: Wrapper with container + scroll
- `TableHeader`: thead
- `TableBody`: tbody
- `TableFooter`: tfoot
- `TableRow`: tr (hover background)
- `TableHead`: th (text-xs, font-semibold)
- `TableCell`: td
- `TableCaption`: caption

**Features:**
- Outer border + rounded container
- Horizontal scroll on mobile
- Hover rows (accent background)
- Checkbox alignment support

**Props:**
- `containerClassName`: Style the outer container

**Example:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Priority</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell><StatusBadge status={item.status} config={STATUSES} /></TableCell>
        <TableCell><PriorityBadge priority={item.priority} config={PRIORITIES} /></TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### 4.2.16 DropdownMenu

**File:** `components/ui/dropdown-menu.tsx`

**Components:**
- `DropdownMenu`: Root
- `DropdownMenuTrigger`: Button
- `DropdownMenuContent`: Panel
- `DropdownMenuItem`: Item (default/destructive variants)
- `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`
- `DropdownMenuLabel`, `DropdownMenuSeparator`
- `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`

**Features:**
- Nested submenus
- Destructive variant (red text)
- Keyboard navigation
- Checkboxes/radio groups
- Shortcut display

**Example:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      <Edit className="size-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Share className="size-4" />
      Share
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      <Trash className="size-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### 4.2.17 Popover

**File:** `components/ui/popover.tsx`

**Components:**
- `Popover`: Root
- `PopoverTrigger`: Button
- `PopoverContent`: Floating panel (w-72, p-4, rounded)

**Features:**
- Portal rendering
- Animations (fade + zoom + slide)
- Align options (start, center, end)
- Side options (top, right, bottom, left)

**Example:**
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Info</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <h4 className="font-semibold">Additional Info</h4>
      <p className="text-sm text-muted-foreground">
        Detailed information goes here.
      </p>
    </div>
  </PopoverContent>
</Popover>
```

#### 4.2.18 Avatar

**File:** `components/ui/avatar.tsx`

**Components:**
- `Avatar`: Rounded container (size-8, rounded-full)
- `AvatarImage`: Image element
- `AvatarFallback`: Text fallback (initials)

**Example:**
```tsx
<Avatar>
  <AvatarImage src="/avatars/john.jpg" alt="John Doe" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

#### 4.2.19 Skeleton

**File:** `components/ui/skeleton.tsx`

**Purpose:** Loading placeholder with pulse animation.

**Example:**
```tsx
<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-[80%]" />
  <Skeleton className="h-10 w-full" />
</div>
```

#### 4.2.20 Progress

**File:** `components/ui/progress.tsx`

**Features:**
- Height: h-2
- Rounded full
- Animated indicator

**Example:**
```tsx
<Progress value={60} max={100} />
```

#### 4.2.21 Switch

**File:** `components/ui/switch.tsx`

**Features:**
- Width: 44px, Height: 24px
- Rounded full
- Animated thumb
- Disabled support

**Example:**
```tsx
<div className="flex items-center gap-2">
  <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

#### 4.2.22 RadioGroup

**File:** `components/ui/radio-group.tsx`

**Components:**
- `RadioGroup`: Container
- `RadioGroupItem`: Individual radio button

**Example:**
```tsx
<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option2" id="option2" />
    <Label htmlFor="option2">Option 2</Label>
  </div>
</RadioGroup>
```

#### 4.2.23 Separator

**File:** `components/ui/separator.tsx`

**Features:**
- Horizontal/vertical divider
- Uses border color
- Orientation support

**Example:**
```tsx
<Separator orientation="horizontal" />
<Separator orientation="vertical" className="h-6" />
```

#### 4.2.24 ScrollArea

**File:** `components/ui/scroll-area.tsx`

**Purpose:** Custom scrollbar container.

**Example:**
```tsx
<ScrollArea className="h-[400px]">
  {/* Long content */}
</ScrollArea>
```

#### 4.2.25 Toast (Sonner)

**File:** `components/ui/sonner.tsx`

**Purpose:** Toast notifications.

**Usage:**
```tsx
import { toast } from 'sonner';

// Success
toast.success('Defect created successfully');

// Error
toast.error('Failed to save defect');

// Loading
toast.loading('Creating defect...');

// Promise
toast.promise(createDefect(), {
  loading: 'Creating...',
  success: 'Created!',
  error: 'Failed'
});
```

#### 4.2.26 Collapsible

**File:** `components/ui/collapsible.tsx`

**Components:**
- `Collapsible`: Root
- `CollapsibleTrigger`: Toggle button
- `CollapsibleContent`: Expandable content

**Example:**
```tsx
<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">
      <ChevronDown className="size-4" />
      Advanced Options
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Hidden content */}
  </CollapsibleContent>
</Collapsible>
```

#### 4.2.27 VerticalStepper

**File:** `components/ui/vertical-stepper.tsx`

**Purpose:** Step indicator for multi-step flows.

**Example:**
```tsx
<VerticalStepper
  steps={[
    { label: 'Basic Info', status: 'completed' },
    { label: 'Details', status: 'current' },
    { label: 'Review', status: 'upcoming' }
  ]}
  currentStep={1}
/>
```

#### 4.2.28 VisuallyHidden

**File:** `components/ui/visually-hidden.tsx`

**Purpose:** Screen reader only text.

**Example:**
```tsx
<button>
  <VisuallyHidden>Close dialog</VisuallyHidden>
  <X className="size-4" />
</button>
```

---

### 4.3 Layout Components

#### 4.3.1 AppShell

**File:** `components/layout/app-shell.tsx`

**Purpose:** Top-level layout for authenticated platform.

**Structure:**
```
┌─────────────────────────────────────────────┐
│ Icon Rail (left, 60px)                      │
├──────┬───────────────────────────┬──────────┤
│ Side │ Main Pane                 │ AI Pane  │
│ bar  │ ┌────────────────────────┐│ (right,  │
│ (240 │ │ Header                 ││ 320-420) │
│ px,  │ ├────────────────────────┤│          │
│ coll │ │ Page Content           ││          │
│ apsi │ │                        ││          │
│ ble) │ │                        ││          │
│      │ └────────────────────────┘│          │
└──────┴───────────────────────────┴──────────┘
```

**Features:**
- Icon rail navigation (left, always visible)
- Collapsible sidebar (desktop only, in project context)
- Main content pane (rounded, bordered, shadow)
- AI assistant pane (right, hidden on Chief page, xl+ breakpoint)
- Command palette (⌘K)
- Mobile menu (Sheet)
- Responsive breakpoints

**State:**
- Sidebar collapsed state (persisted to localStorage)
- Command palette open/closed

**Layout Logic:**
```tsx
<div className="flex h-screen">
  <IconRail />
  <div className="flex-1 p-3 lg:p-4">
    <div className="flex gap-3">
      {inProjectContext && <Sidebar collapsed={collapsed} />}
      <div className="flex-1 flex gap-3">
        <MainPane>
          <Header />
          <main>{children}</main>
        </MainPane>
        {!isChiefPage && <ChiefAISidebar className="hidden xl:block" />}
      </div>
    </div>
  </div>
</div>
```

#### 4.3.2 PageHeader

**File:** `components/layout/page-header.tsx`

**Purpose:** Consistent page title + actions + tabs.

**Props:**
```tsx
interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
}
```

**Layout:**
```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h1 className="text-xl font-semibold">{title}</h1>
      {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
  {tabs}
</div>
```

**Responsive:** Stacks on mobile (flex-col sm:flex-row)

**Example:**
```tsx
<PageHeader
  title="Defects"
  subtitle="Manage quality issues across all projects"
  actions={
    <>
      <Button variant="outline">Export</Button>
      <Button>Add Defect</Button>
    </>
  }
  tabs={
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="open">Open</TabsTrigger>
        <TabsTrigger value="closed">Closed</TabsTrigger>
      </TabsList>
    </Tabs>
  }
/>
```

#### 4.3.3 EmptyState

**File:** `components/layout/empty-state.tsx`

**Purpose:** Placeholder when no data.

**Props:**
```tsx
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}
```

**Layout:**
```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  {icon && <div className="rounded-full bg-muted p-4 mb-4">{icon}</div>}
  <h3 className="text-lg font-semibold">{title}</h3>
  {description && <p className="text-muted-foreground mb-4">{description}</p>}
  {action}
</div>
```

**Example:**
```tsx
<EmptyState
  icon={<FolderIcon className="size-8 text-muted-foreground" />}
  title="No projects found"
  description="Get started by creating your first project."
  action={<Button>Create Project</Button>}
/>
```

#### 4.3.4 ListPanel

**File:** `components/layout/list-panel.tsx`

**Purpose:** Container for lists with optional header.

**Props:**
```tsx
interface ListPanelProps {
  header?: ReactNode;
  children: ReactNode;
}
```

**Layout:**
```tsx
<div className="rounded-lg border">
  {header && <div className="border-b px-4 py-3">{header}</div>}
  <div>{children}</div>
</div>
```

**Example:**
```tsx
<ListPanel header={<h3 className="font-semibold">Recent Defects</h3>}>
  <div className="divide-y">
    {items.map(item => <ItemRow key={item.id} item={item} />)}
  </div>
</ListPanel>
```

#### 4.3.5 SplitPreviewLayout

**File:** `components/layout/split-preview-layout.tsx`

**Purpose:** 3-column layout for builder UIs (nav, editor, preview).

**Props:**
```tsx
interface SplitPreviewLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  nav?: ReactNode;  // Left nav (3-4 cols)
  editor: ReactNode;  // Main editor (6-8 cols)
  preview: ReactNode;  // Right preview (3-4 cols, sticky)
  previewTitle: string;  // For mobile sheet
}
```

**Responsive:**
- Desktop (lg+): 3 columns
- Tablet (md): Nav + editor, preview in Sheet
- Mobile: Editor only, preview in Sheet

**Layout:**
```tsx
<div className="space-y-6">
  <PageHeader title={title} subtitle={subtitle} actions={actions} />

  <div className="grid grid-cols-12 gap-6">
    {/* Nav (hidden on mobile) */}
    {nav && <div className="hidden lg:block lg:col-span-3">{nav}</div>}

    {/* Editor */}
    <div className={cn(
      "col-span-12",
      nav && "lg:col-span-6",
      !nav && "lg:col-span-8"
    )}>
      {editor}
    </div>

    {/* Preview (hidden on tablet/mobile, shown in Sheet) */}
    <div className="hidden lg:block lg:col-span-3 sticky top-6">
      {preview}
    </div>
  </div>

  {/* Mobile preview button */}
  <Sheet>
    <SheetTrigger asChild className="lg:hidden">
      <Button variant="outline" className="fixed bottom-4 right-4">
        Preview
      </Button>
    </SheetTrigger>
    <SheetContent side="right">
      <SheetHeader><SheetTitle>{previewTitle}</SheetTitle></SheetHeader>
      {preview}
    </SheetContent>
  </Sheet>
</div>
```

**Example:**
```tsx
<SplitPreviewLayout
  title="SWMS Builder"
  nav={<SectionNav sections={sections} />}
  editor={<SWMSEditor />}
  preview={<SWMSPreview />}
  previewTitle="SWMS Preview"
/>
```

#### 4.3.6 ListToolbar

**File:** `components/layout/list-toolbar.tsx`

**Purpose:** Toolbar with search + filters.

**Props:**
```tsx
interface ListToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  actions?: ReactNode;
}
```

**Layout:**
```tsx
<div className="flex items-center gap-3 flex-wrap">
  <Input
    placeholder={searchPlaceholder}
    value={searchValue}
    onChange={e => onSearchChange?.(e.target.value)}
    className="w-64"
  />
  {filters}
  <div className="ml-auto flex gap-2">{actions}</div>
</div>
```

**Example:**
```tsx
<ListToolbar
  searchPlaceholder="Search defects..."
  searchValue={search}
  onSearchChange={setSearch}
  filters={
    <>
      <FilterChip label="Status" value={status} options={statusOptions} onChange={setStatus} />
      <FilterChip label="Priority" value={priority} options={priorityOptions} onChange={setPriority} />
    </>
  }
  actions={<Button>Export</Button>}
/>
```

#### 4.3.7 Sidebar Components

**ModuleSidebar** (`components/layout/module-sidebar.tsx`)
- Project module navigation
- Collapsible groups
- Active state highlighting

**NavGroup** (`components/layout/nav-group.tsx`)
- Collapsible nav section
- Icon + title
- Expand/collapse animation

**NavItem** (`components/layout/nav-item.tsx`)
- Individual nav link
- Icon + label
- Active state (sidebar-accent background)

**IconRail** (`components/layout/icon-rail.tsx`)
- Left icon rail (global nav)
- 60px wide
- Top: Dashboard, Projects, Orgs
- Bottom: Settings, Help

**ProjectSelector** (`components/layout/project-selector.tsx`)
- Dropdown for switching projects
- Shows current project
- Search/filter projects

---

### 4.4 Chief Chat Interface (ShadCN-based)

**CRITICAL:** Chief chat is built entirely with ShadCN components. No ChatKit widgets.

#### 4.4.1 Chat Container

**File:** `components/chief/chat-container.tsx`

**Purpose:** Main chat interface with messages + input.

**Structure:**
```tsx
export function ChiefChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Call AI endpoint
    const response = await sendMessage(input);

    // Add assistant message
    const assistantMsg: Message = {
      id: generateId(),
      role: 'assistant',
      text: response.text,
      data: response.data,  // Structured data
      changesetId: response.changesetId,  // For undo
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="size-4" />
              <span className="text-sm">Chief is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Chief anything..."
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={isLoading}
          />
          <Button onClick={send} disabled={!input.trim() || isLoading}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Features:**
- Scrollable message list
- Loading indicator
- Input with Enter key support
- Disabled state during loading

#### 4.4.2 Message Rendering

**File:** `components/chief/chat-message.tsx`

**Purpose:** Render individual message with text/data/undo.

**Structure:**
```tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  data?: StructuredData;  // Tables, forms, confirmations
  changesetId?: string;  // For undo
  timestamp: string;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar (assistant only) */}
      {!isUser && (
        <Avatar className="size-8">
          <AvatarImage src="/chief-avatar.png" />
          <AvatarFallback>C</AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div className={cn(
        "rounded-lg px-4 py-2 max-w-[80%] space-y-3",
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted'
      )}>
        {/* Text content */}
        {message.text && (
          <div className="text-sm whitespace-pre-wrap">{message.text}</div>
        )}

        {/* Structured data rendering */}
        {message.data && <DataRenderer data={message.data} />}

        {/* Undo button */}
        {message.changesetId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => undoChangeset(message.changesetId)}
          >
            <Undo className="size-4 mr-2" />
            Undo
          </Button>
        )}

        {/* Timestamp */}
        <div className="text-xs opacity-50">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
```

**Features:**
- User messages: right-aligned, primary background
- Assistant messages: left-aligned with avatar, muted background
- Text rendering with whitespace preserved
- Structured data rendering (see below)
- Undo button for database writes
- Timestamp display

#### 4.4.3 Data Renderers

**File:** `components/chief/data-renderer.tsx`

**Purpose:** Render structured data from AI responses.

**Data Types:**
```tsx
type StructuredData =
  | { type: 'defects_list'; records: Defect[] }
  | { type: 'table'; columns: Column[]; rows: Row[] }
  | { type: 'confirmation'; title: string; description: string; confirmLabel?: string; cancelLabel?: string }
  | { type: 'questions'; fields: QuestionField[] }
  | { type: 'sources'; sources: Source[] }
  | { type: 'stats'; metrics: Metric[] };
```

**Renderer:**
```tsx
export function DataRenderer({ data }: { data: StructuredData }) {
  switch (data.type) {
    case 'defects_list':
      return <DefectsTable defects={data.records} />;

    case 'table':
      return (
        <Table>
          <TableHeader>
            <TableRow>
              {data.columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, i) => (
              <TableRow key={i}>
                {data.columns.map(col => (
                  <TableCell key={col.key}>{row[col.key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

    case 'confirmation':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{data.title}</CardTitle>
            <CardDescription>{data.description}</CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button onClick={() => respondToChief('yes')}>
              {data.confirmLabel || 'Confirm'}
            </Button>
            <Button variant="outline" onClick={() => respondToChief('no')}>
              {data.cancelLabel || 'Cancel'}
            </Button>
          </CardFooter>
        </Card>
      );

    case 'questions':
      return <QuestionsForm fields={data.fields} />;

    case 'sources':
      return (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Sources</h4>
          {data.sources.map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-primary hover:underline"
            >
              {source.title}
            </a>
          ))}
        </div>
      );

    case 'stats':
      return <CompactMetrics metrics={data.metrics} />;

    default:
      return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
  }
}
```

**Features:**
- Generic table renderer
- Entity-specific renderers (defects, actions, etc.)
- Confirmation dialogs
- Questions forms
- Source citations
- Stats/metrics display
- Fallback JSON display

#### 4.4.4 Questions Form

**File:** `components/chief/questions-form.tsx`

**Purpose:** Render multi-field form for Chief to gather input.

**Structure:**
```tsx
interface QuestionField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];  // For select
  defaultValue?: any;
}

export function QuestionsForm({ fields }: { fields: QuestionField[] }) {
  const [values, setValues] = useState<Record<string, any>>({});

  const handleSubmit = () => {
    // Validate required fields
    const missing = fields.filter(f => f.required && !values[f.name]);
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    // Send to Chief
    respondToChief(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information Needed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>

            {field.type === 'text' && (
              <Input
                id={field.name}
                value={values[field.name] || ''}
                onChange={e => setValues({...values, [field.name]: e.target.value})}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                id={field.name}
                value={values[field.name] || ''}
                onChange={e => setValues({...values, [field.name]: e.target.value})}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === 'select' && (
              <Select
                value={values[field.name]}
                onValueChange={v => setValues({...values, [field.name]: v})}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'date' && (
              <Input
                id={field.name}
                type="date"
                value={values[field.name] || ''}
                onChange={e => setValues({...values, [field.name]: e.target.value})}
                required={field.required}
              />
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={values[field.name] || false}
                  onCheckedChange={checked => setValues({...values, [field.name]: checked})}
                />
                <Label htmlFor={field.name}>{field.label}</Label>
              </div>
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit}>Submit</Button>
      </CardFooter>
    </Card>
  );
}
```

**Features:**
- Dynamic field rendering based on type
- Required field validation
- Placeholder support
- Select with options
- Checkbox support
- Submit to Chief

---

### 4.5 Page Layout Patterns

#### 4.5.1 Dashboard Pattern

**Purpose:** Module dashboard with stats + filters + grid.

**Structure:**
```tsx
<div className="space-y-6">
  {/* Header */}
  <PageHeader
    title="Defects"
    subtitle="Manage quality issues"
    actions={<Button>Add Defect</Button>}
  />

  {/* Search and filters */}
  <ListToolbar
    searchPlaceholder="Search defects..."
    searchValue={search}
    onSearchChange={setSearch}
    filters={
      <>
        <FilterChip label="Status" value={status} options={statusOptions} onChange={setStatus} />
        <FilterChip label="Priority" value={priority} options={priorityOptions} onChange={setPriority} />
      </>
    }
  />

  {/* Stats cards */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{openCount}</div>
      </CardContent>
    </Card>
    {/* More stats... */}
  </div>

  {/* Data grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map(item => <DefectCard key={item.id} defect={item} />)}
  </div>

  {/* Empty state */}
  {items.length === 0 && (
    <EmptyState
      icon={<AlertCircle className="size-8" />}
      title="No defects found"
      description="Try adjusting your filters"
    />
  )}
</div>
```

**Features:**
- Consistent header with actions
- Search + filters
- Stats cards (2-4 columns)
- Responsive grid (1-3 columns)
- Empty state

#### 4.5.2 Detail Page Pattern

**Purpose:** Entity detail with tabs + actions.

**Structure:**
```tsx
<div className="space-y-6">
  {/* Header with actions */}
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={goBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold">{entity.title}</h1>
      </div>
      <p className="text-muted-foreground">{entity.description}</p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline">
        <Edit className="size-4 mr-2" />
        Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Share</DropdownMenuItem>
          <DropdownMenuItem>Export</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  {/* Status bar */}
  <div className="flex items-center gap-4 flex-wrap">
    <StatusBadge status={entity.status} config={STATUSES} />
    <PriorityBadge priority={entity.priority} config={PRIORITIES} />
    <span className="text-sm text-muted-foreground">
      Created {formatDate(entity.createdAt)} by {entity.createdBy}
    </span>
  </div>

  {/* Tabbed content */}
  <Tabs defaultValue="details">
    <TabsList>
      <TabsTrigger value="details">Details</TabsTrigger>
      <TabsTrigger value="activity">Activity</TabsTrigger>
      <TabsTrigger value="attachments">Attachments</TabsTrigger>
      <TabsTrigger value="comments">Comments</TabsTrigger>
    </TabsList>

    <TabsContent value="details" className="space-y-6">
      {/* Details content */}
    </TabsContent>

    <TabsContent value="activity">
      <ActivityTimeline activities={entity.activities} />
    </TabsContent>

    <TabsContent value="attachments">
      <AttachmentsGrid attachments={entity.attachments} />
    </TabsContent>

    <TabsContent value="comments">
      <CommentThread comments={entity.comments} />
    </TabsContent>
  </Tabs>
</div>
```

**Features:**
- Back button navigation
- Title + description
- Action buttons + dropdown menu
- Status/priority badges
- Metadata display
- Tabbed content sections

---

### 4.6 Form Patterns

#### 4.6.1 Standard Form

**Purpose:** Create/edit entity form.

**Structure:**
```tsx
export function EntityForm({ onSubmit, initialData }: EntityFormProps) {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Text field */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title || ''}
            onChange={e => setFormData({...formData, title: e.target.value})}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={e => setFormData({...formData, description: e.target.value})}
            rows={4}
          />
        </div>

        {/* Select */}
        <div className="space-y-2">
          <Label htmlFor="priority">
            Priority
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.priority}
            onValueChange={v => setFormData({...formData, priority: v})}
          >
            <SelectTrigger id="priority" aria-invalid={!!errors.priority}>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority}</p>
          )}
        </div>

        {/* Date field */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate || ''}
            onChange={e => setFormData({...formData, dueDate: e.target.value})}
          />
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="urgent"
            checked={formData.urgent || false}
            onCheckedChange={checked => setFormData({...formData, urgent: checked})}
          />
          <Label htmlFor="urgent">Mark as urgent</Label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </form>
  );
}
```

**Features:**
- Controlled inputs
- Required field indicators (*)
- Validation with error messages
- `aria-invalid` for accessibility
- Cancel + Submit buttons

---

### 4.7 Data Display Patterns

#### 4.7.1 Data Table

**Purpose:** Tabular data with actions.

**Structure:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Priority</TableHead>
      <TableHead>Assigned To</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.length === 0 ? (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-8">
          <EmptyState
            icon={<Inbox className="size-8" />}
            title="No items found"
          />
        </TableCell>
      </TableRow>
    ) : (
      items.map(item => (
        <TableRow key={item.id} className="cursor-pointer" onClick={() => navigate(item.id)}>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell><StatusBadge status={item.status} config={STATUSES} /></TableCell>
          <TableCell><PriorityBadge priority={item.priority} config={PRIORITIES} /></TableCell>
          <TableCell>
            {item.assignedTo ? (
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={item.assignedTo.avatar} />
                  <AvatarFallback>{item.assignedTo.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{item.assignedTo.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); edit(item.id); }}>
                  <Edit className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); duplicate(item.id); }}>
                  <Copy className="size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={e => { e.stopPropagation(); deleteItem(item.id); }}>
                  <Trash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>
```

**Features:**
- Clickable rows (navigate to detail)
- Empty state in table
- Status/priority badges
- Avatar + name for assignments
- Actions dropdown (with stopPropagation)

#### 4.7.2 Card Grid

**Purpose:** Card-based display.

**Structure:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(item.id)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          <StatusBadge status={item.status} config={STATUSES} />
        </div>
        <CardDescription className="line-clamp-2">{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <CompactMetrics
          metrics={[
            { label: 'Priority', value: item.priority, variant: 'priority', colorKey: item.priority },
            { label: 'Due', value: formatDate(item.dueDate), variant: 'custom' }
          ]}
        />
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage src={item.assignedTo?.avatar} />
            <AvatarFallback>{item.assignedTo?.initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{item.assignedTo?.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); viewDetail(item.id); }}>
          View →
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

**Features:**
- Responsive grid (1-3 columns)
- Hover shadow
- Clickable cards
- Status badge in header
- Compact metrics
- Avatar + name in footer
- Action button (with stopPropagation)

---

### 4.8 Loading States

**Purpose:** Skeleton placeholders during data loading.

**Card Skeleton:**
```tsx
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[200px]" />
    <Skeleton className="h-4 w-[300px]" />
  </CardHeader>
  <CardContent className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-[80%]" />
  </CardContent>
</Card>
```

**Table Skeleton:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      {[1,2,3,4].map(i => (
        <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    {[1,2,3].map(row => (
      <TableRow key={row}>
        {[1,2,3,4].map(col => (
          <TableCell key={col}><Skeleton className="h-4 w-24" /></TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Form Skeleton:**
```tsx
<div className="space-y-4">
  {[1,2,3].map(i => (
    <div key={i} className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
  ))}
</div>
```

---

### 4.9 Empty States

**Purpose:** Placeholder when no data to display.

**Empty List:**
```tsx
<EmptyState
  icon={<Inbox className="size-8 text-muted-foreground" />}
  title="No defects found"
  description="Create your first defect to get started."
  action={<Button>Add Defect</Button>}
/>
```

**Empty Search:**
```tsx
<EmptyState
  icon={<Search className="size-8 text-muted-foreground" />}
  title="No results found"
  description="Try adjusting your search or filters."
  action={<Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
/>
```

**Empty Tab:**
```tsx
<TabsContent value="attachments">
  {attachments.length === 0 ? (
    <EmptyState
      icon={<Paperclip className="size-8 text-muted-foreground" />}
      title="No attachments"
      description="Upload files to attach them to this defect."
      action={<Button>Upload Files</Button>}
    />
  ) : (
    <AttachmentsGrid attachments={attachments} />
  )}
</TabsContent>
```

---

### 4.10 Responsive Design

#### 4.10.1 Responsive Patterns

**Grid Breakpoints:**
```tsx
// 1 column on mobile, 2 on tablet, 3 on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// 2 columns on mobile, 4 on desktop (stats)
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

**Flex Direction:**
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
```

**Hide/Show by Breakpoint:**
```tsx
// Hidden on mobile, visible on desktop
<div className="hidden md:block">

// Visible on mobile, hidden on desktop
<div className="block md:hidden">
```

**Sidebar Toggle:**
```tsx
// Desktop: Always visible sidebar
<aside className="hidden lg:block w-64">

// Mobile: Sheet overlay
<Sheet>
  <SheetTrigger className="lg:hidden">
    <MenuIcon />
  </SheetTrigger>
  <SheetContent side="left">
    <nav>{/* Nav items */}</nav>
  </SheetContent>
</Sheet>
```

#### 4.10.2 Touch-Friendly Targets

**Minimum Size (WCAG):**
```tsx
// 44px minimum touch target
<Button size="default" className="min-h-[44px] min-w-[44px]">

// Utility class
<button className="touch-target">
```

#### 4.10.3 Mobile-First Utility Classes

```css
/* Full width on mobile, auto on desktop */
.mobile-full-width {
  @apply w-full sm:w-auto;
}

/* Stack on mobile, row on desktop */
.mobile-stack {
  @apply flex flex-col sm:flex-row gap-2;
}

/* Full-screen dialog on mobile */
.mobile-fullscreen-dialog {
  @apply fixed inset-0 sm:relative sm:inset-auto sm:max-w-lg sm:rounded-lg;
}

/* Horizontal scroll for tables */
.table-scroll-container {
  @apply overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0;
}
```

---

### 4.11 Accessibility

#### 4.11.1 Focus Management

**All interactive elements have focus rings:**
```tsx
focus-visible:ring-2
focus-visible:ring-ring/25
focus-visible:ring-offset-1
focus-visible:ring-offset-background
```

**Focus trap in modals** (handled by Radix UI)

#### 4.11.2 ARIA Support

**Form validation:**
```tsx
<Input aria-invalid={!!errors.email} />
<p id="email-error" role="alert">{errors.email}</p>
```

**Button labels:**
```tsx
<Button aria-label="Close dialog">
  <X className="size-4" />
</Button>
```

**Screen reader only text:**
```tsx
<VisuallyHidden>Navigation menu</VisuallyHidden>
```

#### 4.11.3 Keyboard Navigation

- Tab: Move between interactive elements
- Enter/Space: Activate buttons/checkboxes
- Arrow keys: Navigate dropdowns/tabs/radio groups
- Escape: Close modals/dropdowns
- All handled by Radix UI primitives

#### 4.11.4 Color Contrast

All text meets WCAG AA standards:
- Foreground on background: 4.5:1+
- Muted text on background: 4.5:1+
- Status badge text on badge background: 4.5:1+

---

## 5. Relationships & Dependencies

### Depends On

**03-domain-model.md** - Entity structures, statuses, priorities (what to display)
**04-schema.md** - Data structures (field names, types)
**05-ai-system.md** - Chief chat data structures (Message, StructuredData types)

### Feeds Into

**07-mobile-demo.md** - Shared patterns adapted for mobile
**Implementation** - Direct mapping to React components

---

## 6. Implementation Notes

### Component Organization

```
components/
├── ui/                      # ShadCN primitives + custom
│   ├── button.tsx
│   ├── card.tsx
│   ├── status-badge.tsx    # Custom
│   ├── priority-badge.tsx  # Custom
│   ├── filter-chip.tsx     # Custom
│   └── ...
├── layout/                  # Layout components
│   ├── app-shell.tsx
│   ├── page-header.tsx
│   ├── empty-state.tsx
│   ├── split-preview-layout.tsx
│   └── ...
├── chief/                   # Chief chat components
│   ├── chat-container.tsx
│   ├── chat-message.tsx
│   ├── data-renderer.tsx
│   ├── questions-form.tsx
│   └── ...
├── shared/                  # Cross-module components
│   ├── loading-state.tsx
│   ├── compact-metrics.tsx
│   ├── signature-pad.tsx
│   ├── qr-code-display.tsx
│   └── ...
└── [module]/                # Module-specific
    ├── index.ts             # Barrel export
    ├── module-dashboard.tsx
    ├── module-card.tsx
    ├── module-form.tsx
    └── ...
```

### CSS Organization

```
app/
└── globals.css              # All CSS variables + utilities
```

### Constants Organization

```
lib/
└── constants.ts             # Status/priority configs
```

**Pattern:**
```tsx
export const DEFECT_STATUSES = {
  open: { label: 'Open', cssVar: 'status-open' },
  in_progress: { label: 'In Progress', cssVar: 'status-in-progress' },
  completed: { label: 'Completed', cssVar: 'status-completed' }
} as const;

export type DefectStatus = keyof typeof DEFECT_STATUSES;
```

### Icon Usage

**Library:** Lucide React

**Import:**
```tsx
import { Edit, Trash, MoreHorizontal } from 'lucide-react';
```

**Common Sizes:**
- `size-3` (12px): Badges
- `size-4` (16px): Buttons, nav items
- `size-5` (20px): Headers
- `size-8` (32px): Empty states

**Auto-sizing in components:**
Most components apply `[&_svg:not([class*='size-'])]:size-4`

---

## 7. Open Questions

**None** - UI system fully specified.

---

## Appendix

### A. Complete CSS Variable Reference

See section 4.1 for all CSS variables (colors, spacing, typography, shadows).

### B. Component Props Reference

See section 4.2 for all component TypeScript interfaces.

### C. Animation Patterns

**Fade In/Out:**
```tsx
animate-in fade-in-0 duration-200
animate-out fade-out-0 duration-200
```

**Zoom:**
```tsx
zoom-in-95  // Scale from 95% to 100%
zoom-out-95
```

**Slide:**
```tsx
slide-in-from-top-2
slide-in-from-bottom-2
slide-in-from-left-2
slide-in-from-right-2
```

**Spin:**
```tsx
animate-spin  // Loading spinner
```

**Pulse:**
```tsx
animate-pulse  // Skeleton loading
```

**Custom (Workflow Shimmer):**
```tsx
// Applied to Chief workflow tasks in loading state
[data-chief-workflow-task="loading"]::after {
  animation: chatkit-shimmer 2s ease-in-out infinite;
}
```

### D. Responsive Breakpoint Reference

| Breakpoint | Size | Usage |
|------------|------|-------|
| `sm` | 640px | Mobile → Tablet |
| `md` | 768px | Tablet → Desktop |
| `lg` | 1024px | Desktop (sidebar visible) |
| `xl` | 1280px | Large desktop (AI pane visible) |
| `2xl` | 1536px | Extra large |

### E. Form Validation Patterns

**Required Fields:**
```tsx
<Label>
  Title
  <span className="text-destructive">*</span>
</Label>
```

**Error Display:**
```tsx
<Input aria-invalid={!!errors.title} />
{errors.title && (
  <p className="text-sm text-destructive" role="alert">
    {errors.title}
  </p>
)}
```

**Validation Logic:**
```tsx
const validate = () => {
  const errors: Record<string, string> = {};
  if (!formData.title) errors.title = 'Title is required';
  if (formData.title && formData.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }
  return errors;
};
```

---

**END OF UI SYSTEM SPECIFICATION**
