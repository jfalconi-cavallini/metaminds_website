"use client";

import { useEffect } from "react";

interface Props {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** "md" (default) | "xl" for wide content like calendars */
  size?: "md" | "xl";
}

export default function Modal({ onClose, title, subtitle, children, size = "md" }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full z-10 flex flex-col max-h-[calc(100vh-2rem)] ${size === "xl" ? "max-w-2xl" : "max-w-md"}`}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-blue-600 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4 mt-0.5 shrink-0"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
