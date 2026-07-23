"use client";

import { useMemo, useState } from "react";
import type { CatalogSection, SkillBaseline, StudentPlanLessonFull, SkillNode } from "@/lib/portal/types";
import { getSubskills, SUBSKILL_SLUG_MAP } from "@/lib/portal/planConfig";

// ── Layout constants (top → bottom) ──────────────────────────────────────────

const HUB_R   = 50;
const CAT_R   = 36;
const SUB_R   = 27;
const HUB_Y   = 58;
const CAT_Y   = 188;
const SUB_Y0  = 320;
const SUB_H   = 72;
const SUB_OFF = 37;
const COL_W   = 148;
const PAD_X   = 58;
const PAD_BOT = 38;

// ── Color helpers ─────────────────────────────────────────────────────────────

function nodeColors(score: number | undefined, inPlan: boolean, status?: string) {
  if (status === "completed")   return { fill: "#f0fdf4", stroke: "#4ade80", text: "#15803d" };
  if (status === "in_progress") return { fill: "#eff6ff", stroke: "#60a5fa", text: "#1d4ed8" };
  if (score !== undefined) {
    if (score <= 1) return { fill: "#fef2f2", stroke: "#fca5a5", text: "#dc2626" };
    if (score <= 3) return { fill: "#fffbeb", stroke: "#fcd34d", text: "#b45309" };
    if (score <= 5) return { fill: "#eff6ff", stroke: "#93c5fd", text: "#1d4ed8" };
    return { fill: "#f0fdf4", stroke: "#86efac", text: "#15803d" };
  }
  if (inPlan) return { fill: "#f8fafc", stroke: "#94a3b8", text: "#64748b" };
  return { fill: "#f9fafb", stroke: "#e5e7eb", text: "#d1d5db" };
}

function scoreLabel(score: number | undefined): string | null {
  if (score === undefined) return null;
  if (score === 6) return "Strong";
  if (score >= 4)  return "Proficient";
  if (score >= 2)  return "Developing";
  return "Needs Work";
}

// ── Text wrapping ─────────────────────────────────────────────────────────────

function wrap(text: string, maxChars: number, maxLines = 2): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    if (lines.length >= maxLines) break;
    const test = cur ? `${cur} ${word}` : word;
    if (test.length <= maxChars) { cur = test; continue; }
    if (cur) lines.push(cur);
    cur = word.length > maxChars ? word.slice(0, maxChars - 1) + "…" : word;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === 0) lines.push(text.slice(0, maxChars));
  return lines;
}

// ── Layout builder ────────────────────────────────────────────────────────────

interface NodeSpec {
  id: string; x: number; y: number; r: number;
  lines: string[]; sublabel?: string;
  fill: string; stroke: string; textColor: string;
  isHub?: boolean;
  skillNodeId?: number;   // set on leaf skill nodes that have a canonical skill_node match
  skillLabel?: string;    // full display name for aria-label
}
interface EdgeSpec { key: string; x1: number; y1: number; x2: number; y2: number }

function buildLayout(
  section:       CatalogSection,
  baseline:      SkillBaseline | undefined,
  planLessonMap: Record<number, StudentPlanLessonFull>,
  skillNodes:    SkillNode[],
) {
  const nodes: NodeSpec[] = [];
  const edges: EdgeSpec[] = [];
  const slugIndex = new Map(skillNodes.map(n => [n.slug, n.id]));

  const groups = section.categories.map(cat => ({ cat, subskills: getSubskills(cat.title) }));
  const nCats  = groups.length;
  const svgW   = PAD_X * 2 + nCats * COL_W;
  const hubX   = svgW / 2;

  let maxRows = 0;
  for (const g of groups) maxRows = Math.max(maxRows, Math.ceil(g.subskills.length / 2));
  const svgH = SUB_Y0 + Math.max(1, maxRows) * SUB_H + PAD_BOT;

  // Hub
  nodes.push({
    id: "hub", x: hubX, y: HUB_Y, r: HUB_R,
    lines: wrap(section.title, 13, 3),
    fill: "#0f172a", stroke: "#3b82f6", textColor: "#e2e8f0",
    isHub: true,
  });

  for (let i = 0; i < groups.length; i++) {
    const { cat, subskills } = groups[i];
    const catX = PAD_X + (i + 0.5) * COL_W;

    const catId       = String(cat.id);
    const catEntry    = baseline?.[catId];
    const catScore    = catEntry?.score;
    const catPlanLessons = cat.lessons.filter(l => l.id in planLessonMap);
    const catDone     = catPlanLessons.filter(l => planLessonMap[l.id]?.status === "completed").length;
    const catStatus   =
      catPlanLessons.length > 0 && catDone === catPlanLessons.length ? "completed"
      : catPlanLessons.some(l => planLessonMap[l.id]?.status === "in_progress") ? "in_progress"
      : undefined;
    const cc = nodeColors(catScore, catPlanLessons.length > 0, catStatus);

    nodes.push({
      id: `cat-${cat.id}`, x: catX, y: CAT_Y, r: CAT_R,
      lines: wrap(cat.title, 13, 2),
      sublabel: catScore !== undefined ? scoreLabel(catScore) ?? undefined : undefined,
      fill: cc.fill, stroke: cc.stroke, textColor: cc.text,
    });

    edges.push({ key: `h-c-${cat.id}`, x1: hubX, y1: HUB_Y + HUB_R, x2: catX, y2: CAT_Y - CAT_R });

    if (subskills.length === 0) {
      if (catPlanLessons.length > 0) {
        nodes.push({
          id: `sub-${cat.id}-lessons`, x: catX, y: SUB_Y0, r: SUB_R,
          lines: [`${catDone}/${catPlanLessons.length}`, "lessons"],
          fill: cc.fill, stroke: cc.stroke, textColor: cc.text,
        });
        edges.push({ key: `c-l-${cat.id}`, x1: catX, y1: CAT_Y + CAT_R, x2: catX, y2: SUB_Y0 - SUB_R });
      }
      continue;
    }

    for (let j = 0; j < subskills.length; j++) {
      const skill      = subskills[j];
      const col        = j % 2;
      const row        = Math.floor(j / 2);
      const subX       = catX + (col === 0 ? -SUB_OFF : SUB_OFF);
      const subY       = SUB_Y0 + row * SUB_H;
      const skillScore = catEntry?.subskills?.[skill]?.score;
      const sc         = nodeColors(skillScore, false);

      // Resolve to canonical skill_node ID via slug map
      const slug        = SUBSKILL_SLUG_MAP[skill];
      const skillNodeId = slug ? slugIndex.get(slug) : undefined;

      nodes.push({
        id: `sub-${cat.id}-${j}`,
        x: subX, y: subY, r: SUB_R,
        lines: wrap(skill, 10, 2),
        sublabel: skillScore !== undefined ? `${skillScore}/6` : undefined,
        fill: sc.fill, stroke: sc.stroke, textColor: sc.text,
        skillNodeId,
        skillLabel: skill,
      });

      edges.push({ key: `c-s-${cat.id}-${j}`, x1: catX, y1: CAT_Y + CAT_R, x2: subX, y2: subY - SUB_R });
    }
  }

  return { nodes, edges, svgW, svgH };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  section:       CatalogSection;
  skillBaseline?: SkillBaseline;
  planLessonMap: Record<number, StudentPlanLessonFull>;
  skillNodes?:   SkillNode[];
  onSkillClick?: (skillNodeId: number) => void;
}

export default function SATRoadmapGraph({
  section, skillBaseline, planLessonMap,
  skillNodes = [], onSkillClick,
}: Props) {
  const { nodes, edges, svgW, svgH } = useMemo(
    () => buildLayout(section, skillBaseline, planLessonMap, skillNodes),
    [section, skillBaseline, planLessonMap, skillNodes],
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="w-full overflow-x-auto py-2">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width={svgW}
        height={svgH}
        style={{ minWidth: Math.min(svgW, 400), display: "block", margin: "0 auto" }}
      >
        {/* Edges */}
        {edges.map(e => (
          <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 3" />
        ))}

        {/* Nodes */}
        {nodes.map(n => {
          const isHub        = !!n.isHub;
          const isClickable  = !!n.skillNodeId && !!onSkillClick;
          const isActive     = activeId === n.id;
          const fSize        = isHub ? 10 : n.r <= 27 ? 8 : 9;
          const fWeight      = isHub ? "700" : "600";
          const totalLines   = n.lines.length + (n.sublabel ? 1 : 0);
          const lineH        = isHub ? 13 : 11;
          const startY       = n.y - ((totalLines * lineH) / 2) + lineH / 2;

          const interactiveProps = isClickable ? {
            role:        "button" as const,
            tabIndex:    0,
            onClick:     () => onSkillClick!(n.skillNodeId!),
            onKeyDown:   (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSkillClick!(n.skillNodeId!);
              }
            },
            onMouseEnter: () => setActiveId(n.id),
            onMouseLeave: () => setActiveId(null),
            onFocus:      () => setActiveId(n.id),
            onBlur:       () => setActiveId(null),
            "aria-label": `Open details for ${n.skillLabel ?? n.lines.join(" ")}`,
            style:        { cursor: "pointer", outline: "none" },
          } : { style: { cursor: "default" } };

          return (
            <g key={n.id} {...interactiveProps}>
              {/* Hover / focus ring */}
              {isClickable && isActive && (
                <circle cx={n.x} cy={n.y} r={n.r + 4}
                  fill="none" stroke="#3b82f6" strokeWidth={2.5} opacity={0.6} />
              )}
              {/* Shadow */}
              <circle cx={n.x + 1} cy={n.y + 2} r={n.r} fill="rgba(0,0,0,0.07)" />
              {/* Main circle */}
              <circle cx={n.x} cy={n.y} r={n.r}
                fill={n.fill}
                stroke={isClickable && isActive ? "#3b82f6" : n.stroke}
                strokeWidth={isHub ? 2.5 : isActive ? 2.5 : 2} />
              {/* Label lines */}
              {n.lines.map((line, i) => (
                <text key={i}
                  x={n.x} y={startY + i * lineH}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fSize} fontWeight={fWeight} fill={n.textColor}
                  style={{ fontFamily: "system-ui, sans-serif", pointerEvents: "none" }}
                >
                  {line}
                </text>
              ))}
              {/* Score sub-label */}
              {n.sublabel && (
                <text x={n.x} y={startY + n.lines.length * lineH}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={isHub ? 10 : 7.5} fontWeight="700"
                  fill={isHub ? "#93c5fd" : n.textColor}
                  opacity={0.85}
                  style={{ fontFamily: "system-ui, sans-serif", pointerEvents: "none" }}
                >
                  {n.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
