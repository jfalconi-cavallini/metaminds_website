import type { Metadata } from "next";
import SpellingBeeGame from "./SpellingBeeGame";

export const metadata: Metadata = {
  title: "Spelling Bee Practice | MetaMinds STEM Academy",
  description:
    "Listen to each word and type the spelling. Practice for grade 4, grade 5, or a mix of both.",
};

export default function SpellingBeePage() {
  return <SpellingBeeGame />;
}
