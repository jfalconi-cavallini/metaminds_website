import type { Metadata } from "next";
import LinearEquationsGame from "./LinearEquationsGame";

export const metadata: Metadata = {
  title: "Linear Equations | MetaMinds STEM Academy",
  description: "Solve linear equations in one variable. Three levels. No login required.",
};

export default function LinearEquationsPage() {
  return <LinearEquationsGame />;
}
