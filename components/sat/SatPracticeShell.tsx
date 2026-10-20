"use client";

import DashboardShell from "@/components/DashboardShell";
import { practiceShellNav } from "@/components/portal/portalNav";
import { useAuth } from "@/lib/auth";

export function SatPracticeShell({ children }: { children: React.ReactNode }) {
  const { user, authLoaded } = useAuth();
  const role = user?.role === "admin" || user?.role === "tutor" ? user.role : "student";
  const fallback = role === "admin" ? "Admin" : role === "tutor" ? "Tutor" : "Student";
  const userName = !authLoaded ? "Loading…" : (user?.fullName?.trim() || fallback);

  return (
    <DashboardShell
      role={role}
      userName={userName}
      navItems={practiceShellNav(role)}
      activeTab=""
      onTabChange={() => {}}
    >
      <div className="sat-practice text-gray-900">{children}</div>
    </DashboardShell>
  );
}
