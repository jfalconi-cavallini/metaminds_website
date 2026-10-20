"use client";

import { useMemo } from "react";
import { prepareSatHtml } from "@/lib/sat/html";
import type { SatFormat } from "@/lib/sat/types";
import { MathText } from "./MathText";

function plainText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function QuestionContent({ format, text }: { format: SatFormat; text: string }) {
  const html = useMemo(() => {
    if (format !== "html") return "";
    try {
      return prepareSatHtml(text);
    } catch {
      return plainText(text);
    }
  }, [format, text]);

  if (format === "html") {
    return <div className="sat-html" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <MathText text={text} />;
}
