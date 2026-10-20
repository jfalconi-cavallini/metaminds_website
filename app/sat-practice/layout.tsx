import type { Metadata } from "next";
import { SatPracticeShell } from "@/components/sat/SatPracticeShell";
import "./sat.css";

export const metadata: Metadata = {
  title: "SAT Practice | MetaMinds STEM Academy",
  description: "Practice SAT questions by section, domain, skill, and difficulty.",
};

export default function SatPracticeLayout({ children }: { children: React.ReactNode }) {
  return <SatPracticeShell>{children}</SatPracticeShell>;
}
