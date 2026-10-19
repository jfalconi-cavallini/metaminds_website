import type { ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findGame, games, type ReactGameSlug } from "@/lib/games";
import SpellingBeeGame from "../../../spelling-bee/SpellingBeeGame";
import LinearEquationsGame from "../../../linear-equations/LinearEquationsGame";
import Grade7MathGame from "../../../grade-7-math-mix/Grade7MathGame";

const VIEWS: Record<ReactGameSlug, ComponentType> = {
  "spelling-bee": SpellingBeeGame,
  "linear-equations": LinearEquationsGame,
  "grade-7-math-mix": Grade7MathGame,
};

type Props = { params: Promise<{ level: string; subject: string; slug: string }> };

export function generateStaticParams() {
  return games
    .filter((game) => game.kind === "react")
    .map((game) => ({
      level: game.level,
      subject: game.subject.toLowerCase(),
      slug: game.slug,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { level, subject, slug } = await params;
  const game = findGame(level, subject, slug);
  if (!game || game.kind !== "react") return { title: "Games | MetaMinds STEM Academy" };
  return {
    title: `${game.title} | MetaMinds STEM Academy`,
    description: game.description,
  };
}

export default async function GamePage({ params }: Props) {
  const { level, subject, slug } = await params;
  const game = findGame(level, subject, slug);
  if (!game || game.kind !== "react") notFound();
  const View = VIEWS[game.slug];
  return <View />;
}
