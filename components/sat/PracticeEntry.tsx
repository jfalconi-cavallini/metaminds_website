"use client";

import { SatPracticeApp } from "./SatPracticeApp";

export function PracticeEntry({ userId, mockFallback = false }: { userId: string; mockFallback?: boolean }) {
  return <SatPracticeApp userId={userId} mockFallback={mockFallback} />;
}
