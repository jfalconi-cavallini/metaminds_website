"use client";

import React, { useState } from "react";
import { Search, X, ChevronDown, ChevronRight, Check } from "lucide-react";
import type { SkillNode } from "@/lib/portal/types";

interface Props {
  nodes:    SkillNode[];
  value:    number[];
  onChange: (ids: number[]) => void;
}

/**
 * Controlled multi-select for skill nodes.
 * Groups nodes by category → domain; supports free-text search.
 * Parent manages selected IDs; this component manages its own UI state.
 */
export default function SkillPicker({ nodes, value, onChange }: Props) {
  const [search,          setSearch]          = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());

  const domains      = nodes.filter((n) => n.parentId === null);
  const skills       = nodes.filter((n) => n.parentId !== null);
  const categories   = [...new Set(nodes.map((n) => n.category))].sort();

  const skillsByDomain = new Map<number, SkillNode[]>();
  for (const s of skills) {
    if (s.parentId === null) continue;
    if (!skillsByDomain.has(s.parentId)) skillsByDomain.set(s.parentId, []);
    skillsByDomain.get(s.parentId)!.push(s);
  }

  const q        = search.toLowerCase().trim();
  const filtered = q ? skills.filter((s) => s.title.toLowerCase().includes(q)) : null;

  const selectedNodes = nodes.filter((n) => value.includes(n.id));

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  function toggleDomain(id: number) {
    const next = new Set(expandedDomains);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedDomains(next);
  }

  if (nodes.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selectedNodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNodes.map((n) => (
            <span
              key={n.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium"
            >
              {n.title}
              <button
                onClick={() => toggle(n.id)}
                className="hover:text-blue-900 transition-colors"
                aria-label={`Remove ${n.title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills…"
          className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Skill tree */}
      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
        {filtered ? (
          /* Search results — flat list */
          filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-5">No skills match &quot;{search}&quot;</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const selected = value.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      selected ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    <span>{s.title}</span>
                    {selected && <Check className="w-3.5 h-3.5 shrink-0 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          )
        ) : (
          /* Grouped view — category → domain → skills */
          categories.map((cat) => (
            <div key={cat}>
              {/* Category header */}
              <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 border-b border-gray-100">
                {cat}
              </div>

              {domains
                .filter((d) => d.category === cat)
                .map((domain) => {
                  const domainSkills = skillsByDomain.get(domain.id) ?? [];
                  const isExpanded   = expandedDomains.has(domain.id);
                  const nSelected    = domainSkills.filter((s) => value.includes(s.id)).length;

                  return (
                    <div key={domain.id}>
                      {/* Domain row (expandable) */}
                      <button
                        onClick={() => toggleDomain(domain.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      >
                        {isExpanded
                          ? <ChevronDown  className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                        <span className="flex-1 text-left">{domain.title}</span>
                        {nSelected > 0 && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">
                            {nSelected}
                          </span>
                        )}
                      </button>

                      {/* Skill rows */}
                      {isExpanded && domainSkills.map((s) => {
                        const sel = value.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggle(s.id)}
                            className={`w-full text-left pl-9 pr-3 py-1.5 text-xs flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${
                              sel ? "text-blue-700 bg-blue-50/50" : "text-gray-600"
                            }`}
                          >
                            <span>{s.title}</span>
                            {sel && <Check className="w-3.5 h-3.5 shrink-0 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          ))
        )}
      </div>

      {value.length === 0 && (
        <p className="text-[11px] text-gray-400">
          Tagging skills helps build this student&apos;s learning history.
        </p>
      )}
    </div>
  );
}
