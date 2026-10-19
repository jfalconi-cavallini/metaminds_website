import { SAT_SKILL_TREE, type SkillNodeSeed } from "../portal/satSkillSeed.ts";
import type { SatDifficulty, SatSection } from "./types";

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
