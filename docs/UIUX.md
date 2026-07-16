# MetaMinds UI/UX Patterns

**Component-level implementation guide.**

---

## The Design Template System

Before implementing any new tab or section:

1. Check `public/images/template/` for a matching PNG
2. Open it with the `Read` tool to see the design
3. Implement to match — do not deviate without product approval

**Current templates:**
- `Student Homework.png`
- `Student Schedule.png`
- `Student Progress.png`
- `Student Session Notes.png`
- `Student Updates.png`
- `Student Resources.png`

Add new templates to `public/images/template/` before starting implementation.

---

## Stat Card Pattern

Used at the top of: Schedule, Session Notes, Updates, Progress tabs.

### Standard Icon Stat Card (horizontal layout)
```tsx
<div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
  <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
    <Icon className={`w-4 h-4 ${iconColor}`} />
  </div>
  <div className="min-w-0">
    <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
    <p className="text-[10px] font-medium text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>
  </div>
</div>
```

### Circular SVG Progress Card (Progress tab)
```tsx
const r = 26;
const circ = 2 * Math.PI * r;
const dash = Math.min(pct, 100) / 100 * circ;
<div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center">
  <div className="relative w-16 h-16 mb-3">
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} stroke="#f1f5f9" strokeWidth="6" fill="none" />
      <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="6" fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <p className="text-sm font-bold text-gray-900">{label}</p>
    </div>
  </div>
  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{sub}</p>
</div>
```

---

## Two-Column List + Detail Pattern

Used in: Session Notes, Updates.

```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
  {/* List column */}
  <div className="lg:col-span-2 space-y-2">
    {/* Search bar */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input type="text" placeholder="Search..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
    {/* List items */}
    {items.map((item, i) => {
      const isSelected = selectedId === item.id;
      return (
        <motion.button key={item.id}
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: i * 0.04 }}
          onClick={() => setSelectedId(isSelected ? null : item.id)}
          className={`w-full text-left bg-white rounded-2xl border shadow-sm transition-all overflow-hidden ${
            isSelected ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-100 hover:border-gray-200 hover:shadow-md"
          }`}
        >
          <div className="flex overflow-hidden">
            {/* Accent bar */}
            <div className={`w-1 shrink-0 self-stretch ${isSelected ? "bg-blue-500" : "bg-gray-100"}`} />
            {/* Content */}
            <div className="flex-1 p-4 min-w-0">
              {/* Number + title + date */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                  }`}>{i + 1}</span>
                  <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                </div>
                <p className="text-[10px] text-gray-400 shrink-0 mt-px">{item.date}</p>
              </div>
              {/* Preview */}
              <div className="pl-7">
                <p className="text-xs text-gray-500 leading-relaxed"
                  style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.preview}
                </p>
              </div>
            </div>
          </div>
        </motion.button>
      );
    })}
  </div>

  {/* Detail column */}
  <div className="lg:col-span-3">
    {selectedItem ? (
      <motion.div key={selectedItem.id}
        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Panel header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h2 className="text-base font-bold text-gray-900">{selectedItem.title}</h2>
            <button onClick={() => setSelectedId(null)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">{selectedItem.date}</span>
          </div>
        </div>
        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Content Label</p>
          {/* content here */}
        </div>
      </motion.div>
    ) : (
      /* Empty state placeholder */
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-center p-12 min-h-[320px]">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Select an item to view details</p>
        </div>
      </div>
    )}
  </div>
</div>
```

---

## Horizontal Session Card Pattern

Used in: Schedule tab upcoming sessions.

```tsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex items-center hover:shadow-md transition-shadow">
  {/* Left accent bar */}
  <div className="w-1 self-stretch shrink-0 bg-blue-500" />
  {/* Date block */}
  <div className="px-4 py-4 text-center shrink-0 w-[72px] border-r border-gray-100">
    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Mon</p>
    <p className="text-2xl font-bold leading-none mt-0.5 text-blue-600">15</p>
    <p className="text-[10px] font-medium text-gray-400 mt-0.5">Jul</p>
  </div>
  {/* Content */}
  <div className="flex-1 px-4 py-4 min-w-0">
    <p className="font-bold text-gray-900 text-sm truncate">SAT Math</p>
    <div className="flex items-center gap-1.5 mt-1">
      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
      <p className="text-xs text-gray-500">4:00 PM · 1 hr</p>
    </div>
  </div>
  {/* Session type badge */}
  <div className="px-3 shrink-0 hidden sm:block">
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
      <Video className="w-2.5 h-2.5" /> Online
    </span>
  </div>
  {/* Actions */}
  <div className="pr-4 pl-2 shrink-0 flex items-center gap-1.5">
    <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
      <Video className="w-3.5 h-3.5" /> Join
    </button>
  </div>
</div>
```

---

## Filter Tab Group Pattern

Used in: Homework tab.

```tsx
<div className="flex items-center gap-3">
  {/* Pill group */}
  <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 flex-1">
    {tabs.map(({ key, label, count }) => (
      <button key={key} onClick={() => setFilter(key)}
        className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
          filter === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}>
        {label} <span className={`text-xs ${filter === key ? "text-blue-600" : "text-gray-400"}`}>({count})</span>
      </button>
    ))}
  </div>
  {/* View All button outside the group */}
  <button onClick={() => setFilter("all")}
    className="shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
    <BookOpen className="w-3.5 h-3.5" />
    View All
  </button>
</div>
```

---

## Badge Pattern

```tsx
// Status badges (homework)
const mkStatusBadge = (status: string) => {
  const map = {
    completed: "text-emerald-700 bg-emerald-50 border-emerald-200",
    submitted: "text-blue-700 bg-blue-50 border-blue-200",
    overdue:   "text-red-700 bg-red-50 border-red-200",
    pending:   "text-indigo-700 bg-indigo-50 border-indigo-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2.5 py-1 rounded-full ${map[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {label}
    </span>
  );
};
```

---

## Section Label Pattern

```tsx
<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
  Section Title
</p>
```

---

## Line Clamp (Multi-line Text Truncation)

For 2-line truncation (TypeScript-safe inline style):
```tsx
<p style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
  {longText}
</p>
```

---

## Gradient Accent Card Pattern

Used in: Progress tab Study Tip, future achievement cards.

```tsx
<div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
      <Zap className="w-3.5 h-3.5 text-white" />
    </div>
    <h2 className="text-sm font-bold text-white/90">Card Title</h2>
  </div>
  <p className="text-[15px] font-medium leading-relaxed text-white/95">Content here</p>
  <div className="mt-4 pt-4 border-t border-white/20">
    {/* Supplemental content */}
  </div>
</div>
```

---

## Animated Progress Bar Pattern

```tsx
<div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: `${pct}%` }}
    transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
  />
</div>
```

---

## Related Documents

- `docs/DesignPrinciples.md` — Why these patterns exist
- `docs/EngineeringStandards.md` — Tailwind conventions
- `public/images/template/` — Visual references
