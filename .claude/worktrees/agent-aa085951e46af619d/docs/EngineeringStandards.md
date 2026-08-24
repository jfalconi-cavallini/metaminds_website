# MetaMinds Engineering Standards

**Every engineer working on this codebase follows these rules.**

---

## TypeScript

- Strict mode is on. Zero type errors. Always run `npx tsc --noEmit` before committing.
- No `any`. Use `unknown` + type narrowing, or define a proper interface.
- Domain types belong in `lib/portal/types.ts`. Never define them inside component files.
- Use discriminated unions for state that has multiple modes:
  ```typescript
  type ParsedMessage =
    | { type: "raw"; text: string }
    | { type: "structured"; summary: string; wentWell: string[]; improve: string[]; nextSteps: string[] };
  ```
- Use `as const` when TypeScript needs to narrow string literal types in arrays:
  ```typescript
  ([{ label: "Total", Icon: Bell, iconBg: "bg-blue-50" }] as const).map(...)
  ```
- Prefer `interface` for object shapes, `type` for unions and aliases.

---

## Component Rules

### IIFE Tab Pattern

Tabs inside portal pages use the IIFE pattern. This is intentional — it keeps tab logic scoped without creating dozens of separate components.

```tsx
{tab === "notes" && (() => {
  // ✅ Computed values from parent state
  const filtered = notes.filter(n => ...);

  // ✅ Helper functions (no hooks)
  const mkBadge = (status: string) => <span>...</span>;

  // ❌ NEVER — hooks cannot be used inside IIFEs
  // const [local, setLocal] = useState(false);

  return <div>{filtered.map(n => mkBadge(n.status))}</div>;
})()}
```

All `useState` and `useEffect` for tab functionality must be declared at the **top level of the portal component**. Name them with a tab prefix when they belong to a specific tab:

```typescript
// ✅ Good — clearly scoped, lives at component level
const [notesSearch, setNotesSearch] = useState("");
const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
```

### Fragment for Expandable Table Rows

When rendering pairs of `<tr>` elements (row + expand panel), use `React.Fragment` with a `key`:

```tsx
import { Fragment } from "react";

{items.map((item) => (
  <Fragment key={item.id}>
    <tr>...</tr>
    {expandedIds.has(item.id) && (
      <tr><td colSpan={5}>...</td></tr>
    )}
  </Fragment>
))}
```

Never wrap `<tr>` elements in a `<div>` — it breaks the HTML table model.

---

## Data Layer Rules

- All DB operations go through `lib/portal/db.ts`. No component imports Supabase directly for data.
- Every fetch function must handle errors by `throw`ing them. Let the portal component handle UX.
- Every DB row must go through a `rowTo[Entity]()` mapper before being used in the UI.
- Never trust DB column names in component code — only use the TypeScript interface fields.

```typescript
// ✅ Good
const student = await fetchStudentById(id);
student.allowInPerson; // TypeScript knows this exists

// ❌ Bad
const { data } = await supabase.from("students").select("*").eq("id", id).single();
data.allow_in_person; // Bypasses the mapper, loses type safety
```

---

## Styling Rules

### Tailwind Classes

- **Card pattern:** `bg-white rounded-2xl border border-gray-100 shadow-sm`
- **Input pattern:** `rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- **Section labels:** `text-[10px] font-bold text-gray-400 uppercase tracking-widest`
- **Primary button:** `bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors`
- **Danger button:** `text-red-500 hover:text-red-700`
- **On hover shadow:** `hover:shadow-md transition-shadow`

### Color Semantics

| Color | Meaning |
|-------|---------|
| Blue | Primary action, online sessions |
| Violet | Premium / in-person sessions |
| Emerald | Success, completion, graded |
| Amber | Warning, due soon, areas to improve |
| Red | Overdue, danger, cancel |
| Indigo | Upcoming / future items |
| Gray | Neutral, disabled, metadata |

### Do Not

- Do not use arbitrary Tailwind values (`w-[73px]`) unless there is no standard equivalent
- Do not use inline `style` props except for dynamic values (SVG dasharray, line-clamp, webkit)
- Do not mix Tailwind and CSS modules in the same component
- Do not change `rounded-2xl` to `rounded-lg` for cards — consistency matters

---

## Design Reference Images

Before implementing any new tab or section:

1. Check `public/images/template/` for a matching design image
2. Read it with the `Read` tool to see the visual
3. Implement to match the design — do not deviate without discussing with the CEO

The template images are the canonical design reference. They are not suggestions.

---

## State Management

No global state management library (Redux, Zustand, etc.) is used. Each portal page manages its own state via React `useState`. This is appropriate for the current scale.

When the codebase grows to need shared state across pages, the decision to introduce state management should be documented here before implementation.

---

## API Route Rules

- API routes go under `app/api/[route]/route.ts`
- Always validate authentication in API routes: check `supabase.auth.getSession()`
- Always return JSON with a consistent shape: `{ success: true, data: ... }` or `{ error: "message" }`
- File uploads: validate file size (max 10MB), validate MIME type before saving
- Never expose internal error messages to the client — log them server-side, return generic messages

---

## Commit Standards

### Commit Message Format

```
<type>: <short description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

Examples:
- `feat: add Progress tab to student portal`
- `fix: correct homework filter count for graded items`
- `docs: add MentorPipeline.md to docs/`
- `refactor: extract WeeklyCalendar into shared component`

### Before Every Commit

1. `npx tsc --noEmit` — must pass with zero errors
2. Visually test the feature in the browser (not just console)
3. Check that no `console.log` debug statements remain
4. Ensure no `.env` file changes are staged

---

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` | `app/portal/student/page.tsx` |
| Components | PascalCase.tsx | `WeeklyCalendar.tsx` |
| Utilities | camelCase.ts | `utils.ts`, `db.ts` |
| Types | camelCase.ts | `types.ts` |
| Knowledge files | kebab-case.md | `linear-systems.md` |
| Doc files | PascalCase.md | `Vision.md`, `Database.md` |

---

## Performance Rules

- Do not run data fetches inside render functions — fetch in `useEffect`
- Do not create new objects/arrays inside JSX render (e.g., `<Component items={[1,2,3]}>` on every render) — define them outside
- Use `motion` from Framer Motion only for meaningful transitions, not every `<div>`
- Image assets go in `public/images/` and are served statically — no next/image optimization needed at current scale

---

## Security Rules

- Never commit `.env` or `.env.local`
- Never log Supabase session tokens to the console
- File upload: validate server-side, not just client-side
- Email addresses from user input must be validated before being used in Supabase Auth calls
- Admin routes (`/portal/admin`) must check admin email whitelist on every page load, not just on login

---

## Knowledge Base Rules

- Knowledge files use `.md` with YAML frontmatter (see `docs/CurriculumSystem.md`)
- Every lesson file must have: `id`, `subject`, `module`, `lesson`, `skills[]`, `difficulty`, `estimated_minutes`, `prerequisites[]`, `last_reviewed`
- Never modify an approved lesson file without incrementing `last_reviewed`
- All skill IDs use the format: `[subject]-[module]-[concept]` (e.g., `sat-algebra-linear-systems`)
- A skill must exist in the taxonomy before a lesson can reference it

---

## Related Documents

- `docs/Architecture.md` — System design decisions
- `docs/Database.md` — Schema standards
- `docs/UIUX.md` — Design system details
- `CLAUDE.md` — Quick reference for AI sessions
