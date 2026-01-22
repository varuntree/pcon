# UI System

## Index
- [Purpose](#purpose)
- [Scope](#scope)
- [Requirements](#requirements)
- [Component Props Reference](#component-props-reference)
- [Component List](#component-list)
- [Acceptance Criteria](#acceptance-criteria)
- [Dependencies](#dependencies)
- [Appendix](#appendix)

## Purpose
ShadCN-based component library + design system for construction management platform. AI-first interface prioritizing Chief chat with traditional CRUD as secondary.

## Scope

### In Scope
- ShadCN primitives (28 components)
- Design tokens (CSS variables for status/priority/notification colors)
- Layout components (AppShell, PageHeader, EmptyState, SplitPreview)
- Chief chat interface (message rendering, structured data, undo)
- Form patterns (validation, field composition, accessibility)
- Data display patterns (tables, cards, badges)
- Mobile-first responsive design
- Accessibility (WCAG AA compliance)
- Dark mode architecture (defined but inactive)

### Out of Scope
- Mobile worker simulator (mobile-worker.md)
- QR code public flows (mobile-qr.md)
- ChatKit widgets (replaced by ShadCN)
- OpenAI UI components (replaced by ShadCN)

## Requirements

### Design Philosophy
- **REQ-001**: AI-first interface - Chief chat primary, traditional UI secondary
- **REQ-002**: Intercom-inspired aesthetic - Rounded panels (12px), warm neutrals (#efefeb viewport), monochrome primary (#212121), orange accent (#f97316)
- **REQ-003**: Component composition - Complex UIs from simple primitives
- **REQ-004**: No external UI libraries - ShadCN + Tailwind only (no ChatKit, no Material UI, no OpenAI UI)

### Technology Stack
- **REQ-005**: Next.js 16 App Router + React 19 + TypeScript 5
- **REQ-006**: Tailwind CSS 4.0 (utility-first, @theme inline integration)
- **REQ-007**: ShadCN (Radix UI primitives + Tailwind, copy-paste not npm)
- **REQ-008**: Lucide React icons (standard icon library)

### Core Colors (Light Mode)
- **REQ-009**: Viewport background: `--background: #efefeb` (warm off-white)
- **REQ-010**: Panel background: `--card: #ffffff`
- **REQ-011**: Text foreground: `--foreground: #212121` (near-black)
- **REQ-012**: Brand accent: `--brand: #f97316` (orange)
- **REQ-013**: Shell divider: `--seam: #e1e2dd`
- **REQ-014**: Border: `--border: #e5e5e1`
- **REQ-015**: Focus ring: `--ring: color-mix(in oklab, var(--brand) 65%, white)`

### Typography
- **REQ-016**: Fonts - Inter variable (--font-sans), Geist Mono (--font-mono)
- **REQ-017**: Sizes - 11px (badges), 12px (table headers), 13px (buttons/tabs/chips), 14px (body/labels), 16px (default), 18px (dialog titles), 20px (page titles), 24px (hero)
- **REQ-018**: Weights - 400 (normal body), 500 (medium labels/nav), 600 (semibold headings), 700 (bold emphasis)

### Spacing & Layout
- **REQ-019**: Tailwind 4px scale (gap-1 to gap-8)
- **REQ-020**: Common patterns - space-y-4 (form fields), space-y-2 (label+input), gap-2 (buttons)
- **REQ-021**: Border radius - 12px base (--radius), buttons rounded-full, cards rounded-lg, inputs rounded-md, badges rounded-full

### Status Colors (50+ variants)
- **REQ-022**: Workflow states - open, in-progress, completed, closed, cancelled, resolved, todo
- **REQ-023**: Approval states - draft, pending, approved, rejected, expired, archived
- **REQ-024**: Asset states - active, available, assigned, inactive, maintenance, disposed
- **REQ-025**: Inspection states - not-started, passed, failed, skipped
- **REQ-026**: Schedule states - planned, delayed
- **REQ-027**: Incident states - under-investigation
- **REQ-028**: Pattern - `--status-{key}-bg` and `--status-{key}-text` CSS variables

### Priority Colors
- **REQ-029**: Levels - low, medium, high, urgent, critical
- **REQ-030**: Pattern - `--priority-{key}-bg` and `--priority-{key}-text` CSS variables

### Notification Colors
- **REQ-031**: Types - expiry, approval, action, status, system
- **REQ-032**: Pattern - `--notify-{type}-bg` and `--notify-{type}-text` CSS variables

### ShadCN Component Library (28 primitives)
- **REQ-033**: Components location - `components/ui/`
- **REQ-034**: Core primitives - Button, Card, Badge, Input, Textarea, Label, Select, Checkbox, Dialog, Sheet, Tabs, Table, DropdownMenu, Popover, Avatar, Skeleton, Progress, Switch, RadioGroup, Separator, ScrollArea, Toast (Sonner), Collapsible, VerticalStepper, VisuallyHidden
- **REQ-035**: Custom components - StatusBadge (dynamic CSS variable), PriorityBadge, FilterChip (interactive with dropdown)
- **REQ-106**: Additional utility components - CompactMetrics (card footers/chat metrics), ActivityTimeline (entity history), AttachmentsGrid (file previews), CommentThread (threaded comments)
- **REQ-107**: Table containerClassName prop - Outer container styling for custom scrolling/borders

### Layout Components
- **REQ-036**: AppShell - IconRail (60px left) + collapsible Sidebar (240px) + Main pane (rounded/bordered/shadow) + AI pane (320-420px right, hidden on Chief page at xl+ breakpoint, hidden on Chief page) + CommandPalette (⌘K) + mobile Sheet menu
- **REQ-037**: PageHeader - Title + subtitle + actions + tabs, responsive stacking
- **REQ-038**: EmptyState - Icon + title + description + action, centered with py-12
- **REQ-039**: ListPanel - Container for lists with optional header
- **REQ-040**: SplitPreviewLayout - 3-column (nav/editor/preview), responsive with Sheet for preview on mobile
- **REQ-041**: ListToolbar - Search + filters + actions
- **REQ-042**: Sidebar components - ModuleSidebar, NavGroup (collapsible), NavItem (active state with sidebar-accent bg), IconRail (global nav), ProjectSelector

### Chief Chat Interface
- **REQ-043**: ChiefChat container - ScrollArea message list + Input with Send button, Enter key support, loading indicator
- **REQ-044**: Message rendering - User (right-aligned, primary bg) vs Assistant (left-aligned with avatar at /chief-avatar.png, muted bg)
- **REQ-045**: Message structure - id, role, text (optional), data (optional structured), changesetId (optional for undo), timestamp
- **REQ-046**: DataRenderer for structured data types - defects_list, table, confirmation, questions, sources, stats
- **REQ-047**: QuestionsForm - Multi-field form (text/number/select/textarea/date/checkbox), validation, submit to Chief
- **REQ-048**: Undo button integration for changesetId
- **REQ-049**: Workflow shimmer animation - [data-chief-workflow-task="loading"]::after with chatkit-shimmer animation
- **REQ-108**: DataRenderer switch logic - Type-based rendering (defects_list → DefectsTable, table → Table with columns/rows, confirmation → Card with buttons, questions → QuestionsForm, sources → link list, stats → CompactMetrics, default → JSON pre)
- **REQ-109**: Confirmation data structure - title, description, confirmLabel (default "Confirm"), cancelLabel (default "Cancel"), respondToChief callbacks
- **REQ-110**: Sources data structure - Array of {url, title} objects rendered as link list
- **REQ-111**: Table data structure - columns (key, label), rows (array of objects with column keys)

### Page Layout Patterns
- **REQ-050**: Dashboard pattern - PageHeader + ListToolbar + stats cards (2-4 cols) + data grid (1-3 cols) + EmptyState
- **REQ-051**: Detail page pattern - Back button + title/description + actions dropdown + status/priority badges + metadata + Tabs (details/activity/attachments/comments)

### Form Patterns
- **REQ-052**: Standard form - Controlled inputs, required indicators (*), validation with error messages, aria-invalid for accessibility, Cancel + Submit buttons
- **REQ-053**: Field composition - Label + Input/Select/Textarea with space-y-2
- **REQ-054**: Validation - Required field asterisk, error display with aria-invalid and role="alert", errors object
- **REQ-102**: Required field indicators - Asterisk (*) in text-destructive color within Label
- **REQ-103**: Error display pattern - Input with aria-invalid prop, error message with text-sm text-destructive and role="alert"
- **REQ-104**: Validation logic pattern - Errors object with field keys, validation functions check required/min length/format
- **REQ-105**: Field validation timing - On submit and on blur for touched fields

### Data Display Patterns
- **REQ-055**: Data Table - Clickable rows, empty state in table, status/priority badges, avatar+name for assignments, actions dropdown with stopPropagation
- **REQ-056**: Card Grid - Responsive 1-3 cols, hover shadow, clickable cards, status badge in header, compact metrics, avatar+name in footer

### Loading States
- **REQ-057**: Skeleton placeholders for cards, tables, forms with pulse animation

### Empty States
- **REQ-058**: Three variants - empty list (with action), empty search (clear filters), empty tab (upload files)

### Responsive Design
- **REQ-059**: Breakpoints - sm: 640px (Mobile → Tablet), md: 768px (Tablet → Desktop), lg: 1024px (Desktop, sidebar visible), xl: 1280px (Large desktop, AI pane visible), 2xl: 1536px (Extra large)
- **REQ-060**: Grid breakpoints - 1 col mobile → 2 tablet → 3 desktop, 2 cols mobile → 4 desktop for stats
- **REQ-061**: Flex direction - flex-col on mobile, flex-row on desktop
- **REQ-062**: Hide/show by breakpoint - hidden md:block, block md:hidden
- **REQ-063**: Sidebar toggle - Desktop always visible, mobile Sheet overlay

### Mobile-First Patterns
- **REQ-064**: Touch targets - 44px minimum (WCAG requirement)
- **REQ-065**: Mobile utility classes - .mobile-full-width (w-full sm:w-auto), .mobile-stack (flex flex-col sm:flex-row gap-2), .mobile-fullscreen-dialog (fixed inset-0 sm:relative), .table-scroll-container (overflow-x-auto)
- **REQ-066**: Sheet component for mobile navigation/menus (slide-in panel from left/right/top/bottom)
- **REQ-067**: SplitPreviewLayout mobile - Shows editor only with preview in Sheet triggered by fixed bottom-right button (fixed bottom-right position)

### Accessibility (WCAG AA)
- **REQ-068**: Focus management - focus-visible:ring-2 with ring/25 opacity and offset-1, focus trap in modals
- **REQ-069**: ARIA support - aria-invalid for form validation, aria-label for icon buttons, role="alert" for errors
- **REQ-070**: Keyboard navigation - Tab, Enter/Space, Arrow keys, Escape (handled by Radix UI)
- **REQ-071**: Screen reader support - VisuallyHidden component for SR-only text
- **REQ-072**: Color contrast - All text meets WCAG AA 4.5:1+ (foreground/background, muted text, status badges)

### Dark Mode
- **REQ-073**: Dark mode architecture defined via custom Tailwind variant: `@custom-variant dark (&:is(.dark *))`
- **REQ-074**: Dark mode not active (no UI toggle implemented)
- **REQ-100**: Dark mode chart colors defined - chart-1 through chart-5 with muted oklch values (orange, cyan, blue, green, yellow)
- **REQ-101**: Dark mode warning colors defined - warning-bg and warning-text variants

### Animation
- **REQ-075**: Fade - animate-in fade-in-0 duration-200, animate-out fade-out-0 duration-200
- **REQ-076**: Zoom - zoom-in-95, zoom-out-95 (scale 95% to 100%)
- **REQ-077**: Slide - slide-in-from-top/bottom/left/right-2
- **REQ-078**: Spin - animate-spin (loading spinner)
- **REQ-079**: Pulse - animate-pulse (skeleton loading)
- **REQ-080**: Custom workflow shimmer - chatkit-shimmer 2s ease-in-out infinite

### Icon Standards
- **REQ-081**: Library - Lucide React
- **REQ-082**: Sizes - size-3 (12px badges), size-4 (16px buttons/nav), size-5 (20px headers), size-8 (32px empty states)
- **REQ-083**: Auto-sizing - Components use [&_svg:not([class*='size-'])]:size-4

### Component Organization
- **REQ-084**: Structure - `components/ui/` (ShadCN primitives + custom), `components/layout/` (AppShell, PageHeader, etc.), `components/chief/` (chat components), `components/shared/` (cross-module), `components/[module]/` (module-specific)
- **REQ-085**: CSS organization - All CSS variables + utilities in `app/globals.css`
- **REQ-086**: Constants organization - Status/priority configs in `lib/constants.ts` with pattern: `export const DEFECT_STATUSES = { open: { label: 'Open', cssVar: 'status-open' }, ... } as const;`

### Global Base Styles
- **REQ-091**: Tailwind base layer defaults - All elements use border-border for borders, outline-ring/50 for focus outlines
- **REQ-092**: Body defaults - bg-background text-foreground automatically applied
- **REQ-093**: Theme switching updates all borders/outlines globally
- **REQ-094**: Implementation in globals.css using `@layer base` with wildcard selector and body styles

### Shadow System
- **REQ-095**: Shadows NOT defined as CSS variables - Use Tailwind default utilities only (shadow, shadow-md, shadow-lg)
- **REQ-096**: No custom shadow CSS variables exist in system

### Font Variable Mapping
- **REQ-097**: Next.js font optimization - Defines --font-inter (Inter variable font) and --font-geist-mono (Geist Mono)
- **REQ-098**: Semantic mapping in globals.css - --font-sans maps to var(--font-inter), --font-mono maps to var(--font-geist-mono)
- **REQ-099**: Usage via Tailwind classes - font-sans uses Inter, font-mono uses Geist Mono

### Ticket Wallet (Mobile QR)
- **REQ-087**: Purpose - Dedicated color system for worker digital wallet (QR codes, certifications, permits)
- **REQ-088**: Gradient backgrounds - `--ticket-gradient-1-start: #1a1a2e, --ticket-gradient-1-end: #16213e`, `--ticket-gradient-2-start: #0f3460, --ticket-gradient-2-end: #16537e`, `--ticket-gradient-3-start: #1a3c40, --ticket-gradient-3-end: #1d5c63`
- **REQ-089**: Ticket state colors - `--ticket-valid-bg: #2d7a5f, --ticket-valid-text: #ffffff` (Valid/Active), `--ticket-expiring-bg: #c68520, --ticket-expiring-text: #ffffff` (Expiring Soon), `--ticket-expired-bg: #c45050, --ticket-expired-text: #ffffff` (Expired/Invalid)
- **REQ-090**: Usage - linear-gradient(135deg, var(--ticket-gradient-1-start), var(--ticket-gradient-1-end))
- **REQ-091**: Component - qr-code-display.tsx in `components/shared/`

## Component Props Reference

### StatusBadge Props
```tsx
interface StatusBadgeProps {
  status: string;  // e.g., "open", "completed"
  config: Record<string, { label: string; cssVar: string }>;
  className?: string;
  icon?: ReactNode;
}
```

### PriorityBadge Props
```tsx
interface PriorityBadgeProps {
  priority: string;  // e.g., "low", "high", "urgent"
  config: Record<string, { label: string; cssVar: string }>;
  className?: string;
  icon?: ReactNode;
}
```

### FilterChip Props
```tsx
interface FilterChipProps {
  label: string;
  value: string | string[];
  options: { value: string; label: string }[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;  // Default false
}
```

### QuestionsForm Field Structure
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
```

### Message Structure
```tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  data?: StructuredData;  // Optional structured data
  changesetId?: string;  // Optional for undo
  timestamp: string;
}
```

### CompactMetrics Props
```tsx
interface CompactMetricsProps {
  metrics: {
    label: string;
    value: string | number;
    variant?: 'status' | 'priority' | 'custom';
    colorKey?: string;
  }[];
}
```

### Table Props
- **containerClassName**: Style the outer container (useful for custom scrolling/borders)

```tsx
<Table containerClassName="max-h-[600px]">
  {/* Table content */}
</Table>
```

## Component List

| Component | Location | Variants | Purpose |
|-----------|----------|----------|---------|
| Button | `components/ui/button.tsx` | default, destructive, outline, secondary, ghost, link; sizes: default (h-9), sm (h-8), lg (h-10), icon | Primary interactive element |
| Card | `components/ui/card.tsx` | CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter | Container with sections |
| Badge | `components/ui/badge.tsx` | default, secondary, destructive, outline | Inline status labels |
| StatusBadge | `components/ui/status-badge.tsx` | Dynamic via CSS variables | Status-specific colors |
| PriorityBadge | `components/ui/priority-badge.tsx` | Dynamic via CSS variables | Priority-specific colors |
| FilterChip | `components/ui/filter-chip.tsx` | selected, unselected | Interactive filter with dropdown |
| Input | `components/ui/input.tsx` | - | Text input field |
| Textarea | `components/ui/textarea.tsx` | - | Multi-line text input |
| Label | `components/ui/label.tsx` | - | Form label |
| Select | `components/ui/select.tsx` | - | Dropdown selection |
| Checkbox | `components/ui/checkbox.tsx` | - | Boolean selection |
| Dialog | `components/ui/dialog.tsx` | DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter | Modal overlay |
| Sheet | `components/ui/sheet.tsx` | left, right, top, bottom | Slide-in panel |
| Tabs | `components/ui/tabs.tsx` | TabsList, TabsTrigger, TabsContent | Tabbed navigation |
| Table | `components/ui/table.tsx` | TableHeader, TableRow, TableHead, TableBody, TableCell | Data table |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem | Action menu |
| Popover | `components/ui/popover.tsx` | PopoverTrigger, PopoverContent | Floating content |
| Avatar | `components/ui/avatar.tsx` | AvatarImage, AvatarFallback | User photo |
| Skeleton | `components/ui/skeleton.tsx` | - | Loading placeholder |
| Progress | `components/ui/progress.tsx` | - | Progress bar |
| Switch | `components/ui/switch.tsx` | - | Toggle switch |
| RadioGroup | `components/ui/radio-group.tsx` | RadioGroupItem | Radio button group |
| Separator | `components/ui/separator.tsx` | horizontal, vertical | Divider line |
| ScrollArea | `components/ui/scroll-area.tsx` | - | Custom scrollbar |
| Toast (Sonner) | `components/ui/toast.tsx` | - | Notification toast |
| Collapsible | `components/ui/collapsible.tsx` | CollapsibleTrigger, CollapsibleContent | Expandable section |
| VerticalStepper | `components/ui/vertical-stepper.tsx` | - | Multi-step wizard |
| VisuallyHidden | `components/ui/visually-hidden.tsx` | - | Screen reader only |
| AppShell | `components/layout/app-shell.tsx` | - | Top-level layout with IconRail + Sidebar + Main + AI pane |
| PageHeader | `components/layout/page-header.tsx` | - | Page title + actions + tabs |
| EmptyState | `components/layout/empty-state.tsx` | list, search, tab | Empty content state |
| ListPanel | `components/layout/list-panel.tsx` | - | List container |
| SplitPreviewLayout | `components/layout/split-preview-layout.tsx` | - | 3-column nav/editor/preview |
| ListToolbar | `components/layout/list-toolbar.tsx` | - | Search + filters + actions |
| ChiefChat | `components/chief/chat-container.tsx` | - | Chat interface container |
| ChatMessage | `components/chief/chat-message.tsx` | user, assistant | Message bubble |
| DataRenderer | `components/chief/data-renderer.tsx` | defects_list, table, confirmation, questions, sources, stats | Structured data display |
| QuestionsForm | `components/chief/questions-form.tsx` | - | Multi-field form submission |
| CompactMetrics | `components/shared/compact-metrics.tsx` | - | Metrics display in card footers/chat |
| ActivityTimeline | `components/shared/activity-timeline.tsx` | - | Timeline view for entity history |
| AttachmentsGrid | `components/shared/attachments-grid.tsx` | - | Grid display of file attachments with previews |
| CommentThread | `components/shared/comment-thread.tsx` | - | Threaded comment display |
| SignatureCanvas | `components/shared/signature-pad.tsx` | - | Canvas-based signature (300x150, clear button) |
| PhotoCapture | `components/shared/photo-capture.tsx` | - | File input + preview grid |
| QRCodeDisplay | `components/shared/qr-code-display.tsx` | - | QR code rendering |

## Acceptance Criteria

### Design Token Implementation
- **AC-001**: All 50+ status color variants defined as CSS variables in `app/globals.css`
- **AC-002**: Priority colors (low, medium, high, urgent, critical) with bg/text variants
- **AC-003**: Notification colors (expiry, approval, action, status, system) with bg/text variants
- **AC-004**: Ticket wallet gradients (3 gradient pairs) + ticket state colors (valid, expiring, expired)
- **AC-005**: CSS variables mapped to Tailwind utilities via @theme inline
- **AC-006**: StatusBadge component uses dynamic CSS variable lookup: `backgroundColor: var(--status-${status}-bg)`
- **AC-007**: PriorityBadge component uses dynamic CSS variable lookup: `backgroundColor: var(--priority-${priority}-bg)`

### ShadCN Component Library
- **AC-008**: All 28 primitive components installed in `components/ui/`
- **AC-009**: Copy-paste implementation (not npm package) for full control
- **AC-010**: Components use Radix UI primitives + Tailwind CSS
- **AC-011**: Accessibility built-in (ARIA labels, keyboard nav, focus management)
- **AC-012**: Bundle size < 50KB tree-shaken vs 300KB for Material UI

### Layout System
- **AC-013**: AppShell implements IconRail (60px) + Sidebar (240px collapsible) + Main pane + AI pane (320-420px, xl+ breakpoint)
- **AC-014**: AI pane hidden on Chief page itself (`/orgs/[orgId]/chief/page.tsx`)
- **AC-015**: Mobile Sheet overlay for sidebar on breakpoint < lg
- **AC-016**: PageHeader responsive stacking (title/actions stack on mobile)
- **AC-017**: SplitPreviewLayout shows editor only on mobile, preview in Sheet via bottom-right button
- **AC-018**: EmptyState centered with py-12, icon + title + description + optional action

### Chief Chat Interface
- **AC-019**: ChiefChat container with ScrollArea + Input + Send button
- **AC-020**: User messages right-aligned with primary bg, Assistant left-aligned with avatar + muted bg
- **AC-021**: DataRenderer handles structured data types (defects_list, table, confirmation, questions, sources, stats)
- **AC-022**: QuestionsForm renders multi-field forms (text/number/select/textarea/date/checkbox) with validation
- **AC-023**: Undo button displayed when message includes changesetId
- **AC-024**: Workflow shimmer animation on loading states

### Form Validation
- **AC-025**: Required fields display asterisk (*)
- **AC-026**: Error messages shown below field with role="alert"
- **AC-027**: aria-invalid attribute set on invalid fields
- **AC-028**: Form submission disabled until all required fields valid
- **AC-029**: Cancel + Submit buttons in footer

### Responsive Breakpoints
- **AC-030**: sm (640px) - Mobile → Tablet
- **AC-031**: md (768px) - Tablet → Desktop
- **AC-032**: lg (1024px) - Desktop, sidebar visible
- **AC-033**: xl (1280px) - Large desktop, AI pane visible (except Chief page)
- **AC-034**: 2xl (1536px) - Extra large
- **AC-035**: Grid responsive: 1 col mobile → 2 tablet → 3 desktop
- **AC-036**: Flex direction changes: flex-col (mobile) → flex-row (desktop)

### Mobile-First Patterns
- **AC-037**: Touch targets minimum 44x44px (WCAG requirement)
- **AC-038**: Mobile utility classes implemented (.mobile-full-width, .mobile-stack, .mobile-fullscreen-dialog, .table-scroll-container)
- **AC-039**: Sheet component for mobile navigation (slide-in from left/right/top/bottom)
- **AC-040**: Mobile menu in AppShell uses Sheet

### Accessibility (WCAG AA)
- **AC-041**: Focus rings on all interactive elements (focus-visible:ring-2 with ring/25 opacity + offset-1)
- **AC-042**: Form validation with aria-invalid and role="alert"
- **AC-043**: Icon buttons have aria-label
- **AC-044**: Color contrast meets WCAG AA 4.5:1+ for all text
- **AC-045**: Keyboard navigation via Radix UI (Tab, Enter/Space, Arrow keys, Escape)
- **AC-046**: VisuallyHidden component for screen reader only text

### Animation & Interaction
- **AC-047**: Fade animation (fade-in/fade-out with duration-200)
- **AC-048**: Zoom animation (zoom-in-95/zoom-out-95)
- **AC-049**: Slide animation (slide-in-from-top/bottom/left/right-2)
- **AC-050**: Spin animation (animate-spin for loading)
- **AC-051**: Pulse animation (animate-pulse for skeletons)
- **AC-052**: Custom chatkit-shimmer animation (2s ease-in-out infinite)

### Icon System
- **AC-053**: Lucide React as standard icon library
- **AC-054**: Icon sizes: size-3 (12px badges), size-4 (16px buttons/nav), size-5 (20px headers), size-8 (32px empty states)
- **AC-055**: Auto-sizing via [&_svg:not([class*='size-'])]:size-4

### Component Organization
- **AC-056**: ShadCN primitives in `components/ui/`
- **AC-057**: Layout components in `components/layout/`
- **AC-058**: Chief chat components in `components/chief/`
- **AC-059**: Cross-module shared in `components/shared/`
- **AC-060**: Module-specific in `components/[module]/`
- **AC-061**: All CSS variables in `app/globals.css`
- **AC-062**: Status/priority configs in `lib/constants.ts` with pattern: `export const DEFECT_STATUSES = { open: { label: 'Open', cssVar: 'status-open' }, ... } as const;`

### Dark Mode
- **AC-063**: Dark mode CSS variables defined via `@custom-variant dark (&:is(.dark *))`
- **AC-064**: Dark mode not active (no UI toggle in current implementation)

### Performance
- **AC-065**: Page bundle < 200 KB gzipped
- **AC-066**: Initial load < 1 MB
- **AC-067**: Lighthouse score > 90

### Component Props & Structure
- **AC-068**: StatusBadge accepts status string, config object, optional className and icon
- **AC-069**: PriorityBadge accepts priority string, config object, optional className and icon
- **AC-070**: FilterChip accepts label, value, options array, onChange callback, optional multiple flag
- **AC-071**: QuestionsForm field structure includes name, label, type, optional required/placeholder/options/defaultValue
- **AC-072**: Message structure includes id, role, optional text/data/changesetId, required timestamp
- **AC-073**: CompactMetrics accepts metrics array with label, value, optional variant and colorKey
- **AC-074**: Table component supports containerClassName prop for outer container styling

### Global Styles
- **AC-075**: All elements have border-border applied via @layer base
- **AC-076**: All elements have outline-ring/50 applied via @layer base
- **AC-077**: Body has bg-background text-foreground applied automatically
- **AC-078**: Theme switching updates all borders/outlines globally

### Shadows & Fonts
- **AC-079**: No custom CSS variables for shadows (use Tailwind shadow/shadow-md/shadow-lg)
- **AC-080**: Font variables --font-inter and --font-geist-mono defined via Next.js optimization
- **AC-081**: Semantic font variables --font-sans and --font-mono map to Inter and Geist Mono
- **AC-082**: Tailwind classes font-sans and font-mono use mapped variables

### Dark Mode Colors
- **AC-083**: Chart colors 1-5 defined with muted oklch values for dark mode
- **AC-084**: Warning colors (bg/text) defined for dark mode

### Form Validation Details
- **AC-085**: Required field asterisk in text-destructive within Label
- **AC-086**: Error messages below field with text-sm text-destructive and role="alert"
- **AC-087**: Input has aria-invalid prop when errors present
- **AC-088**: Validation functions return errors object with field keys
- **AC-089**: Validation checks required, min length, and format rules

### Chief Chat Details
- **AC-090**: DataRenderer switch handles all 7 data types (defects_list, table, confirmation, questions, sources, stats, default)
- **AC-091**: Confirmation structure includes title, description, confirmLabel, cancelLabel, respondToChief callbacks
- **AC-092**: Sources structure is array of {url, title} objects
- **AC-093**: Table structure includes columns (key, label) and rows (array of objects)
- **AC-094**: Default case renders JSON pre with text-xs

### Additional Components
- **AC-095**: CompactMetrics component in `components/shared/compact-metrics.tsx`
- **AC-096**: ActivityTimeline component in `components/shared/activity-timeline.tsx`
- **AC-097**: AttachmentsGrid component in `components/shared/attachments-grid.tsx`
- **AC-098**: CommentThread component in `components/shared/comment-thread.tsx`

### Mobile Patterns
- **AC-099**: SplitPreviewLayout mobile preview button in fixed bottom-right position

### Documentation
- **AC-100**: Appendix includes global base styles implementation
- **AC-101**: Appendix includes shadow system clarification
- **AC-102**: Appendix includes font variable mapping
- **AC-103**: Appendix includes dark mode color variables
- **AC-104**: Appendix includes form validation patterns
- **AC-105**: Appendix includes animation patterns reference table
- **AC-106**: Appendix includes responsive breakpoints table
- **AC-107**: Appendix includes DataRenderer full implementation
- **AC-108**: Appendix includes icon size standards with auto-sizing

## Dependencies

### Direct Dependencies
- Next.js 16 (App Router, React Server Components, streaming)
- React 19
- TypeScript 5
- Tailwind CSS 4.0 (utility-first, @theme inline)
- ShadCN components (Radix UI + Tailwind)
- Lucide React (icons)
- Sonner (toast notifications)

### Internal Dependencies
- `lib/constants.ts` - Status/priority config objects
- `app/globals.css` - All CSS variables
- Design tokens defined in foundation.md
- Chief agent interface (chief-agent.md)
- Mobile worker patterns (mobile-worker.md for mobile utilities)

### No External Dependencies
- No ChatKit (replaced by ShadCN)
- No Material UI (replaced by ShadCN)
- No OpenAI UI components (replaced by ShadCN)
- No Chakra UI (replaced by ShadCN)
- No Ant Design (replaced by ShadCN)

### Build Dependencies
- PostCSS (@tailwindcss/postcss for Tailwind v4)
- VS Code (formatOnSave, Prettier, ESLint, Tailwind IntelliSense)

## Appendix

### A. Global Base Styles Implementation

**Purpose:** Tailwind base layer defaults applied to all elements.

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
- All elements use `--border` for borders (no need to specify `border-border`)
- All elements use `--ring` at 50% opacity for outlines (focus states)
- Body has viewport background + foreground text automatically
- Theme switching updates all borders/outlines globally

### B. Shadow System Clarification

**IMPORTANT:** Shadows are NOT defined as CSS variables. Use Tailwind's default utilities:

```tsx
<Card className="shadow">           // Subtle shadow
<Popover className="shadow-md">    // Moderate shadow
<Dialog className="shadow-lg">     // Prominent shadow
```

No custom CSS variables exist for shadows.

### C. Font Variable Mapping

**Next.js provides font variables that are mapped to Tailwind:**

```css
/* Next.js layout defines these via font optimization */
--font-inter: ...;           /* Inter variable font */
--font-geist-mono: ...;      /* Geist Mono */

/* globals.css maps to semantic names */
--font-sans: var(--font-inter);
--font-mono: var(--font-geist-mono);
```

**Usage:**
```tsx
<body className="font-sans">  // Uses Inter variable font
<code className="font-mono">  // Uses Geist Mono
```

### D. Dark Mode Color Variables

#### Chart Colors (Dark Mode)

```css
--chart-1: oklch(0.60 0.12 41);  /* Muted orange */
--chart-2: oklch(0.60 0.08 185);  /* Muted cyan */
--chart-3: oklch(0.55 0.05 227);  /* Muted blue */
--chart-4: oklch(0.70 0.10 84);  /* Muted green */
--chart-5: oklch(0.65 0.10 70);  /* Muted yellow */
```

#### Warning Colors (Dark Mode)

```css
--warning-bg: [dark mode value];
--warning-text: [dark mode value];
```

### E. Form Validation Patterns

#### Required Field Indicators
```tsx
<Label>
  Title
  <span className="text-destructive">*</span>
</Label>
```

#### Error Display
```tsx
<Input aria-invalid={!!errors.title} />
{errors.title && (
  <p className="text-sm text-destructive" role="alert">
    {errors.title}
  </p>
)}
```

#### Validation Logic
```tsx
const validate = () => {
  const errors: Record<string, string> = {};
  if (!formData.title) {
    errors.title = 'Title is required';
  }
  if (formData.title && formData.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }
  return errors;
};
```

### F. Animation Patterns Reference

| Pattern | Classes | Usage |
|---------|---------|-------|
| Fade In | `animate-in fade-in-0 duration-200` | Dialog/popover entrance |
| Fade Out | `animate-out fade-out-0 duration-200` | Dialog/popover exit |
| Zoom In | `zoom-in-95` | Scale from 95% to 100% |
| Zoom Out | `zoom-out-95` | Scale from 100% to 95% |
| Slide Top | `slide-in-from-top-2` | Sheet from top |
| Slide Bottom | `slide-in-from-bottom-2` | Sheet from bottom |
| Slide Left | `slide-in-from-left-2` | Sheet from left |
| Slide Right | `slide-in-from-right-2` | Sheet from right |
| Spin | `animate-spin` | Loading spinner |
| Pulse | `animate-pulse` | Skeleton loading |
| Workflow Shimmer | `data-chief-workflow-task="loading"` | Chief task loading state |

### G. Responsive Breakpoints Table

| Breakpoint | Width | Description | Common Usage |
|------------|-------|-------------|--------------|
| sm | 640px | Mobile → Tablet | Grid 1→2 cols, show more nav items |
| md | 768px | Tablet → Desktop | Grid 2→3 cols, horizontal layouts |
| lg | 1024px | Desktop | Sidebar visible, full navigation |
| xl | 1280px | Large Desktop | AI pane visible (except Chief page) |
| 2xl | 1536px | Extra Large | Maximum content width |

### H. DataRenderer Implementation Details

**Full switch logic for structured data types:**

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
            <a key={i} href={source.url} className="block text-sm text-primary hover:underline">
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

### I. Icon Size Standards

**Standard sizes with auto-sizing:**

- **size-3** (12px): Badges, inline indicators
- **size-4** (16px): Buttons, navigation items (default)
- **size-5** (20px): Page headers, section titles
- **size-8** (32px): Empty states, hero sections

**Auto-sizing pattern:** Components use `[&_svg:not([class*='size-'])]:size-4` to automatically size icons without explicit classes.
