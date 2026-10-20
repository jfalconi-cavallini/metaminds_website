import type { ElementType } from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Map as MapIcon,
  PenLine,
  Settings as SettingsIcon,
  TrendingUp,
  User,
} from "lucide-react";

export interface PortalNavItem {
  id: string;
  label: string;
  icon?: ElementType<{ className?: string }>;
  badge?: string;
  /** In-app route. Rendered as a link instead of a portal tab. */
  href?: string;
}

export const SAT_PRACTICE_HREF = "/sat-practice";

export const STUDENT_NAV_ITEMS: PortalNavItem[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "sessions", label: "Schedule", icon: Calendar },
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "notes", label: "Session Notes", icon: FileText },
  { id: "updates", label: "Updates", icon: Bell },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "hours", label: "Hours", icon: Clock },
  { id: "path", label: "Learning Path", icon: MapIcon },
  { id: "sat-practice", label: "SAT Practice", icon: PenLine, href: SAT_PRACTICE_HREF },
  { id: "lab", label: "MetaMinds Lab", icon: FlaskConical, badge: "Soon" },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export const TUTOR_NAV_ITEMS: PortalNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "My Students" },
  { id: "schedule", label: "Schedule" },
  { id: "notes", label: "Session Notes" },
  { id: "homework", label: "Homework" },
  { id: "courses", label: "Courses" },
  { id: "sat-practice", label: "SAT Practice", href: SAT_PRACTICE_HREF, badge: "Preview" },
  { id: "settings", label: "Settings" },
];

export const ADMIN_NAV_ITEMS: PortalNavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "students", label: "Students" },
  { id: "tutors", label: "Tutors" },
  { id: "sessions", label: "Sessions" },
  { id: "packages", label: "Packages" },
  { id: "courses", label: "Courses" },
  { id: "curriculum", label: "Curriculum" },
  { id: "emails", label: "Emails" },
  { id: "sat-practice", label: "SAT Practice", href: SAT_PRACTICE_HREF, badge: "Preview" },
];

export function portalTabIds(items: readonly PortalNavItem[]): string[] {
  return items.filter((item) => !item.href).map((item) => item.id);
}

/** Read `?tab=` once, then drop it so later tab clicks are not overwritten on refresh. */
export function consumePortalTabParam(validIds: readonly string[]): string | null {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("tab");
  if (requested === null) return null;
  params.delete("tab");
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
  return validIds.includes(requested) ? requested : null;
}

export function practiceShellNav(role: "student" | "tutor" | "admin"): PortalNavItem[] {
  const portalPath = role === "admin" ? "/portal/admin" : role === "tutor" ? "/portal/tutor" : "/portal/student";
  const items = role === "admin" ? ADMIN_NAV_ITEMS : role === "tutor" ? TUTOR_NAV_ITEMS : STUDENT_NAV_ITEMS;
  return items.map((item) => (
    item.href ? item : { ...item, href: `${portalPath}?tab=${encodeURIComponent(item.id)}` }
  ));
}
