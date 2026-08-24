# MetaMinds Design Principles

---

## Core Principles

### 1. Clarity Over Cleverness
Every screen should be instantly understandable. A parent checking in on their child at 10pm should see what matters in 5 seconds without reading anything.

### 2. Progress Is Always Visible
Every interaction should reinforce the feeling of moving forward. Completion rings, mastery bars, achievement badges, numbered notes — these are not decorations, they are the product.

### 3. Data Density Done Right
We show a lot of information. But we never make it feel overwhelming. White space, card separation, consistent type scale, and clear hierarchy keep dense layouts readable.

### 4. Trust Through Consistency
Parents and students should always know where things are. Nav items don't move. Cards look the same across tabs. Badges use the same color every time. Predictability builds trust.

### 5. Mobile Is Real
Many parents check updates on their phones. Many students do homework on a tablet. The design must work at 375px and 1440px. Design for mobile first, enhance for desktop.

### 6. Actions Have Hierarchy
Not everything is equally important. The most important action on any screen should be obvious. Secondary actions should be accessible but not compete. Destructive actions (cancel, delete) should never be the loudest thing on the screen.

---

## Layout System

### Card Pattern

The fundamental UI unit:

```
bg-white rounded-2xl border border-gray-100 shadow-sm
```

Hover state (when interactive):
```
hover:shadow-md transition-shadow
```

Selected state (when selectable):
```
ring-1 ring-blue-200 border-blue-300
```

### Page Layout

All portal pages share:
- `DashboardShell` wrapper (slate-900 sidebar, white content area)
- `max-w-5xl mx-auto` content container
- `p-6` page padding
- `space-y-6` between major sections

### Two-Column Detail Pattern

Session Notes, Updates — any "list + detail" interface:
```
grid grid-cols-1 lg:grid-cols-5 gap-4 items-start
  Left: lg:col-span-2  (list)
  Right: lg:col-span-3 (detail panel)
```

### Four-Card Stat Row

Used across multiple tabs (Schedule, Notes, Updates, Progress):
```
grid grid-cols-2 lg:grid-cols-4 gap-3 (or gap-4)
```

---

## Typography Scale

| Use | Classes |
|-----|---------|
| Page title | `text-2xl font-bold text-gray-900` |
| Section title | `text-base font-bold text-gray-900` |
| Card title | `text-sm font-bold text-gray-900` |
| Body text | `text-sm text-gray-700 leading-relaxed` |
| Meta / subtitle | `text-sm text-gray-400` |
| Section label | `text-[10px] font-bold text-gray-400 uppercase tracking-widest` |
| Badge text | `text-[11px] font-semibold` |
| Table header | `text-[11px] font-semibold text-gray-400 uppercase tracking-wide` |
| Timestamp / date | `text-[10px] text-gray-400` |

---

## Color System

### Semantic Colors

| Color | Token | Usage |
|-------|-------|-------|
| Blue | `blue-600` | Primary action, online sessions, links |
| Violet | `violet-600` | In-person sessions, premium content |
| Emerald | `emerald-600` | Success, completion, graded, what went well |
| Amber | `amber-600` | Warning, due soon, areas to improve |
| Red | `red-600` | Overdue, danger, cancel |
| Indigo | `indigo-600` | Upcoming/future items |
| Purple | `purple-600` | Admin role |
| Green | `green-600` | Tutor role |
| Gray | `gray-400`–`gray-900` | Text hierarchy, neutral states |

### Background Tints (icon backgrounds, badges, section fills)

| Color | Light BG | Usage |
|-------|---------|-------|
| Blue | `bg-blue-50` | Primary feature icon backgrounds |
| Violet | `bg-violet-50` | In-person / premium |
| Emerald | `bg-emerald-50` | Success states |
| Amber | `bg-amber-50` | Warnings |
| Red | `bg-red-50` | Errors / overdue |
| Gray | `bg-gray-50`–`bg-gray-100` | Neutral, disabled |

---

## Icon System

**Library:** lucide-react (always import named; never use the bundle)

### Icon Sizes

| Context | Class |
|---------|-------|
| Stat card icon | `w-4 h-4` (in `w-9 h-9` container) |
| Nav icon | `w-4 h-4` |
| Inline text icon | `w-3.5 h-3.5` |
| Small indicator | `w-3 h-3` |
| Large empty state | `w-6 h-6`–`w-8 h-8` |

### Current Icon Assignments

| Concept | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Schedule | `Calendar` |
| Homework | `BookOpen` |
| Session Notes | `FileText` |
| Updates | `Bell` |
| Progress | `TrendingUp` |
| Hours | `Clock` |
| Resources | `Paperclip` |
| MetaMinds Lab | `FlaskConical` |
| In-person session | `MapPin` |
| Online session | `Video` |
| Completed / checkmark | `CheckCircle` |
| Warning / tip | `Lightbulb` |
| Study tip | `Zap` |
| Achievements / session impact | `Star` |
| Search | `Search` |
| Close | `X` |
| Expand | `ChevronRight` |
| Reschedule | `RotateCcw` |
| New / add | `Plus` |
| External link | `ExternalLink` |
| Message | `MessageCircle` |
| Thumbs | `ThumbsUp`, `ThumbsDown` |

---

## Motion & Animation

**Library:** Framer Motion (`motion` from `"framer-motion"`)

Use animation for:
- Card entry: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.05 }}`
- Detail panel slide in: `initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}`
- Progress bar fill: `initial={{ width: 0 }} animate={{ width: "X%" }} transition={{ duration: 0.6, ease: "easeOut" }}`
- Bar chart bars: `initial={{ height: 0 }} animate={{ height: "Xpx" }} transition={{ duration: 0.5 }}`

Do not animate:
- Color changes (use CSS `transition-colors` instead)
- Shadow changes (use CSS `transition-shadow` instead)
- Font weight or size changes
- Anything on every single keypress (throttle user interaction animations)

---

## Empty States

Every list or section that can be empty needs a thoughtful empty state.

Pattern:
```tsx
<div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
    <Icon className="w-7 h-7 text-gray-300" />
  </div>
  <p className="text-sm font-semibold text-gray-500">[What's missing]</p>
  <p className="text-xs text-gray-400 mt-1">[When it will appear / what to do]</p>
  [Optional: Primary action button]
</div>
```

---

## Design Anti-Patterns (Do Not)

- Do not use more than 3 font sizes on a single card
- Do not show empty sections — hide them entirely with conditional rendering
- Do not use red for anything that isn't an error or danger state
- Do not stack more than 4 levels of visual hierarchy
- Do not design tab content without first checking `public/images/template/`
- Do not use `text-black` — use `text-gray-900` for the darkest text
- Do not center-align body text (only use center for empty states and standalone numbers)

---

## Related Documents

- `docs/UIUX.md` — Component-level implementation patterns
- `docs/Brand.md` — Color and voice choices rooted in brand identity
- `docs/EngineeringStandards.md` — Tailwind class conventions
