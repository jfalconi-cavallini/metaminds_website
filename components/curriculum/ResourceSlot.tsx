"use client";

import React, { useRef, useState } from "react";
import { Upload, ExternalLink, Loader2, FileText, X } from "lucide-react";
import type { LessonResource, ResourceType } from "@/lib/portal/types";
import { supabase } from "@/lib/supabase";
import { updateLessonResource } from "@/lib/portal/db";

// ── Constants ─────────────────────────────────────────────────────────────────

export const RESOURCE_ORDER: ResourceType[] = [
  "lesson_deck", "guided_practice", "tutor_guide",
  "homework_l1", "homework_l2", "homework_l3",
  "answer_key", "mastery_check",
];

export const RESOURCE_LABELS: Record<string, string> = {
  lesson_deck:     "Lesson Deck",
  guided_practice: "Guided Practice",
  tutor_guide:     "Tutor Guide",
  homework_l1:     "Homework Level 1",
  homework_l2:     "Homework Level 2",
  homework_l3:     "Homework Level 3",
  answer_key:      "Answer Key",
  mastery_check:   "Mastery Check",
};

export const RESOURCE_TAGS: Record<string, { label: string; color: string }> = {
  lesson_deck:     { label: "In-Class",   color: "bg-violet-50 text-violet-600" },
  guided_practice: { label: "In-Class",   color: "bg-violet-50 text-violet-600" },
  tutor_guide:     { label: "In-Class",   color: "bg-violet-50 text-violet-600" },
  homework_l1:     { label: "Homework",   color: "bg-blue-50 text-blue-600" },
  homework_l2:     { label: "Homework",   color: "bg-blue-50 text-blue-600" },
  homework_l3:     { label: "Homework",   color: "bg-blue-50 text-blue-600" },
  answer_key:      { label: "Reference",  color: "bg-amber-50 text-amber-600" },
  mastery_check:   { label: "Assessment", color: "bg-emerald-50 text-emerald-600" },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  resource: LessonResource;
  isBuilder: boolean;
  onUpdate: (updated: LessonResource) => void;
}

export default function ResourceSlot({ resource, isBuilder, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false);
  const [msg,       setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteUrl,  setPasteUrl]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const tag    = RESOURCE_TAGS[resource.type as string] ?? { label: "File", color: "bg-gray-50 text-gray-400" };
  const hasUrl = !!resource.url;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const form = new FormData();
      form.append("file", file);
      form.append("resourceId", String(resource.id));
      const res = await fetch("/api/cms/upload-resource", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const json = await res.json() as { resource?: { url: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      if (json.resource) onUpdate({ ...resource, url: json.resource.url });
      setMsg({ ok: true, text: "Uploaded" });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed" });
    } finally { setUploading(false); }
  }

  async function savePasteUrl() {
    if (!pasteUrl.trim()) return;
    try {
      const updated = await updateLessonResource(resource.id, { url: pasteUrl.trim() });
      onUpdate(updated);
      setPasteUrl(""); setPasteMode(false);
      setMsg({ ok: true, text: "Saved" });
      setTimeout(() => setMsg(null), 2000);
    } catch { setMsg({ ok: false, text: "Failed to save URL" }); }
  }

  async function clearResource() {
    try {
      const updated = await updateLessonResource(resource.id, { url: null, storagePath: null });
      onUpdate(updated);
    } catch { /* ignore */ }
  }

  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-0">
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.png,.jpg" className="hidden" onChange={handleUpload} />

      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${hasUrl ? "bg-blue-50" : "bg-gray-50"}`}>
          <FileText className={`w-4 h-4 ${hasUrl ? "text-blue-500" : "text-gray-300"}`} />
        </div>

        {/* Label + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-gray-800">{RESOURCE_LABELS[resource.type as string] ?? resource.type}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${tag.color}`}>{tag.label}</span>
          </div>
          {hasUrl
            ? <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Uploaded</p>
            : <p className="text-[10px] text-gray-300 mt-0.5">Not uploaded</p>
          }
          {msg && (
            <p className={`text-[10px] font-medium mt-0.5 ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasUrl && (
            <a href={resource.url!} target="_blank" rel="noopener noreferrer"
              className="w-6 h-6 rounded-md bg-gray-50 hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
              title="Preview">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {isBuilder && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title={hasUrl ? "Replace file" : "Upload file"}
                className="w-6 h-6 rounded-md bg-gray-50 hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-40"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              </button>
              {hasUrl && (
                <button onClick={clearResource} title="Remove"
                  className="w-6 h-6 rounded-md bg-gray-50 hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Paste URL row — builder only */}
      {isBuilder && !hasUrl && !pasteMode && (
        <button onClick={() => setPasteMode(true)} className="mt-1.5 ml-11 text-[10px] text-gray-300 hover:text-blue-500 font-medium">
          + Paste URL
        </button>
      )}
      {isBuilder && pasteMode && (
        <div className="mt-2 ml-11 flex gap-2">
          <input
            autoFocus
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") savePasteUrl(); if (e.key === "Escape") { setPasteMode(false); setPasteUrl(""); } }}
            placeholder="https://docs.google.com/…"
            className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button onClick={savePasteUrl} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Save</button>
          <button onClick={() => { setPasteMode(false); setPasteUrl(""); }} className="px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">✕</button>
        </div>
      )}
    </div>
  );
}
