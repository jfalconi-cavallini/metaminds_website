"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

interface NavItem {
  id: string;
  label: string;
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
  admin: { label: "Admin", badge: "bg-purple-100 text-purple-700" },
  tutor: { label: "Tutor", badge: "bg-green-100 text-green-700" },
  student: { label: "Student / Parent", badge: "bg-blue-100 text-blue-700" },
};

export default function DashboardShell({ role, userName, navItems, activeTab, onTabChange, children }: Props) {
  const meta   = roleMeta[role];
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white fixed inset-y-0 left-0">
        <div className="p-5 border-b border-gray-700">
          <div className="bg-white rounded-xl p-2 mb-4">
            <img
              src="/images/metaminds-logo2.png"
              alt="MetaMinds"
              className="w-full h-auto"
            />
          </div>
          <p className="font-semibold text-sm text-white">{userName}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>
            {meta.label}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="md:ml-64 flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="bg-white rounded-lg px-2 py-1 inline-flex">
            <img src="/images/metaminds-logo2.png" alt="MetaMinds" className="h-7 w-auto" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{userName}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden overflow-x-auto bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex min-w-max px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === item.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
