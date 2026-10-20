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

/** Scroll long inline equations without changing the math element's own display. */
function wrapInlineMath(html: string): string {
  return html.replace(/<math\b([^>]*)>[\s\S]*?<\/math>/gi, (element, attrs: string) => {
    if (/\bdisplay\s*=\s*(?:"block"|'block')/i.test(attrs)) return element;
    return `<span class="sat-math">${element}</span>`;
  });
}

export function QuestionContent({ format, text }: { format: SatFormat; text: string }) {
  const html = useMemo(() => {
    if (format !== "html") return "";
    try {
      return wrapInlineMath(prepareSatHtml(text));
    } catch {
      return plainText(text);
    }
  }, [format, text]);

  if (format === "html") {
    return <div className="sat-html min-w-0 max-w-full" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <MathText text={text} />;
}
