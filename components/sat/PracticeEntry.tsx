"use client";

import dynamic from "next/dynamic";
import { SAT_PRACTICE_ACCESS } from "@/lib/sat/access";
import { SatPracticeApp } from "./SatPracticeApp";

const StudentsPracticeGate = dynamic(
  () => import("./StudentsPracticeGate").then((mod) => mod.StudentsPracticeGate),
  {
    ssr: false,
    loading: () => (
      <p className="py-16 text-center text-sm text-[#F4EFE4]">Checking your portal session.</p>
    ),
  },
);

export function PracticeEntry() {
  if (SAT_PRACTICE_ACCESS === "public") return <SatPracticeApp />;
  return <StudentsPracticeGate />;
}
