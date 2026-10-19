export type MathSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

const MATH_PATTERN = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;

export function splitMath(input: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let last = 0;
  for (const match of input.matchAll(MATH_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ kind: "text", value: input.slice(last, index) });
    if (match[1] !== undefined) {
      segments.push({ kind: "math", value: match[1].trim(), display: true });
    } else {
      segments.push({ kind: "math", value: (match[2] ?? "").trim(), display: false });
    }
    last = index + match[0].length;
  }
  if (last < input.length) segments.push({ kind: "text", value: input.slice(last) });
  if (segments.length === 0) segments.push({ kind: "text", value: input });
  return segments;
}
