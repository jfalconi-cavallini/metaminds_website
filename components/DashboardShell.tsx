"use client";

import type { ElementType } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

interface NavItem {
  id: string;
  label: string;
  icon?: ElementType<{ className?: string }>;
  badge?: string;
}

interface Props {
  role: "admin" | "tutor" | "student";
  userName: string;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

const roleMeta = {
  admin:   { label: "Admin",            badge: "bg-purple-100 text-purple-700" },
  tutor:   { label: "Tutor",            badge: "bg-green-100 text-green-700"   },
  student: { label: "Student / Parent", badge: "bg-blue-100 text-blue-700"     },
};

export default function DashboardShell({ role, userName, navItems, activeTab, onTabChange, children }: Props) {
  const meta   = roleMeta[role];
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed inset-y-0 left-0 shadow-xl">
        {/* Logo + user */}
        <div className="p-5 border-b border-slate-700/60">
          <div className="bg-white rounded-2xl overflow-hidden mb-4">
            <img
              src="/images/metaminds-logo2.png"
              alt="MetaMinds"
              className="w-full h-auto block"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 select-none">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">{userName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>
                {meta.label}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {Icon && (
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/60">
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="md:ml-64 flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="bg-white rounded-xl overflow-hidden inline-flex">
            <img src="/images/metaminds-logo2.png" alt="MetaMinds" className="h-9 w-auto block" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
              {initials}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{userName}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden overflow-x-auto bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex min-w-max px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === item.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
