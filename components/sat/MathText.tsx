"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { splitMath } from "@/lib/sat/math";

export function MathText({ text }: { text: string }) {
  const segments = splitMath(text);
  return (
    <span className="whitespace-pre-wrap">
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={index}>{segment.value}</span>;
        }
        const html = katex.renderToString(segment.value, {
          throwOnError: false,
          displayMode: segment.display,
        });
        return (
          <span
            key={index}
            className={segment.display ? "my-2 block overflow-x-auto" : "inline"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}
