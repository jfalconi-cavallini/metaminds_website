import { SAT_SKILL_TREE, type SkillNodeSeed } from "../portal/satSkillSeed.ts";
import type { SatDifficulty, SatQuestion, SatSection, SatSource } from "./types.ts";

export interface CatalogOption {
  slug: string;
  title: string;
}

const SECTION_CATEGORY: Record<SatSection, string> = {
  math: "Math",
  reading_writing: "Reading & Writing",
};

export function sectionLabel(section: SatSection): string {
  return section === "math" ? "Math" : "Reading and Writing";
}

export function sourceLabel(source: SatSource): string {
  return source === "metaminds" ? "MetaMinds" : "Test set";
}

export function difficultyLabel(difficulty: SatDifficulty): string {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "medium") return "Medium";
  return "Hard";
}

function inSection(node: SkillNodeSeed, section: SatSection | "any"): boolean {
  if (section === "any") return true;
  return node.category === SECTION_CATEGORY[section];
}

export function domainOptions(section: SatSection | "any"): CatalogOption[] {
  return SAT_SKILL_TREE
    .filter((node) => node.parentSlug === null && inSection(node, section))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((node) => ({ slug: node.slug, title: node.title }));
}

export function skillOptions(section: SatSection | "any", domain: string | "any"): CatalogOption[] {
  return SAT_SKILL_TREE
    .filter((node) => {
      if (node.parentSlug === null) return false;
      if (!inSection(node, section)) return false;
      if (domain !== "any" && node.parentSlug !== domain) return false;
      return true;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((node) => ({ slug: node.slug, title: node.title }));
}

export function skillTitle(slug: string): string {
  return SAT_SKILL_TREE.find((node) => node.slug === slug)?.title ?? slug;
}

export function domainTitle(slug: string): string {
  return SAT_SKILL_TREE.find((node) => node.slug === slug)?.title ?? slug;
}

function firstSeen(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    labels.push(value);
  }
  return labels;
}

/** Domain labels present on the loaded questions, in first-seen order. */
export function domainsInQuestions(
  questions: readonly Pick<SatQuestion, "section" | "domain">[],
  section: SatSection | "any",
): string[] {
  return firstSeen(
    questions
      .filter((question) => section === "any" || question.section === section)
      .map((question) => question.domain),
  );
}

/** Skill labels present on the loaded questions, in first-seen order. */
export function skillsInQuestions(
  questions: readonly Pick<SatQuestion, "section" | "domain" | "skill">[],
  section: SatSection | "any",
  domain: string | "any",
): string[] {
  return firstSeen(
    questions
      .filter((question) => {
        if (section !== "any" && question.section !== section) return false;
        if (domain !== "any" && question.domain !== domain) return false;
        return true;
      })
      .map((question) => question.skill),
  );
}
