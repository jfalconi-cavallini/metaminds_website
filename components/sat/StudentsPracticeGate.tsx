"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SatPracticeApp } from "./SatPracticeApp";

export function StudentsPracticeGate() {
  const { user, authLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoaded && !user) router.replace("/login");
  }, [authLoaded, user, router]);

  if (!authLoaded || !user) {
    return <p className="py-16 text-center text-sm text-[#F4EFE4]">Checking your portal session.</p>;
  }

  return <SatPracticeApp />;
}
