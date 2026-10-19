"use client";

import { SatPracticeApp } from "./SatPracticeApp";

export function PracticeEntry({ userId }: { userId: string }) {
  return <SatPracticeApp userId={userId} />;
}
