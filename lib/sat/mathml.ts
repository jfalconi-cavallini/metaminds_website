import katex from "katex";
import { decodeHtmlEntities } from "./html.ts";

type El = { tag: string; attrs: Record<string, string>; children: Node[] };
type Node = El | string;

const FUNCS: Record<string, string> = {
  sin: "\\sin",
  cos: "\\cos",
  tan: "\\tan",
  sec: "\\sec",
  csc: "\\csc",
  cot: "\\cot",
  log: "\\log",
  ln: "\\ln",
  arcsin: "\\arcsin",
  arccos: "\\arccos",
  arctan: "\\arctan",
};

const OPERATORS: Record<string, string> = {
  "−": "-",
  "–": "-",
  "—": "-",
  "×": "\\times ",
  "·": "\\cdot ",
  "⋅": "\\cdot ",
  "÷": "\\div ",
  "≤": "\\leq ",
  "≥": "\\geq ",
  "≠": "\\neq ",
  "≈": "\\approx ",
  "°": "^{\\circ}",
  "∠": "\\angle ",
  "±": "\\pm ",
  "π": "\\pi ",
  "△": "\\triangle ",
  "∞": "\\infty ",
  "{": "\\{",
  "}": "\\}",
  "%": "\\%",
  $: "\\$",
  "&": "\\&",
  "|": "\\vert ",
  "'": "^{\\prime}",
};

const OVERLINE = new Set(["\u00AF", "\u203E", "\u0304"]);

function stripInvisible(value: string): string {
  return value.replace(/[\u2060-\u2064\u200B\u00A0]/g, "");
}

/**
 * Replace each MathML island with KaTeX. The spoken `alttext` stays in a
 * screen-reader span. If a construct cannot be rendered, the MathML is kept.
 */
export function renderSatMath(html: string): string {
  return html.replace(/<math\b[^>]*>[\s\S]*?<\/math>/gi, (element) => {
    try {
      return renderMathElement(element);
    } catch {
      return wrapFallback(element);
    }
  });
}

/** LaTeX for one `<math>` element. Used by tests and by the KaTeX renderer. */
export function mathmlToLatex(mathHtml: string): string {
  const openEnd = mathHtml.indexOf(">");
  const close = mathHtml.toLowerCase().lastIndexOf("</math>");
  if (openEnd === -1 || close === -1) return "";
  const open = mathHtml.slice(0, openEnd + 1);
  const display = /\bdisplaystyle\s*=\s*(?:"true"|'true')/i.test(open);
  return nodesToLatex(parseFragment(mathHtml.slice(openEnd + 1, close)), display).trim();
}

function renderMathElement(element: string): string {
  const openEnd = element.indexOf(">");
  const open = openEnd === -1 ? element : element.slice(0, openEnd + 1);
  const latex = mathmlToLatex(element);
  const display = /\bdisplay\s*=\s*(?:"block"|'block')/i.test(open);
  if (!latex) return wrapFallback(element);
  const rendered = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: display,
    trust: false,
    output: "html",
  });
  if (rendered.includes("katex-error")) return wrapFallback(element);
  const alt = readAttr(open, "alttext");
  const cls = display ? "sat-math sat-math-display" : "sat-math";
  const visual = `<span class="${cls}"${alt ? ` aria-hidden="true"` : ""}>${rendered}</span>`;
  return alt ? `<span class="sr-only">${escapeHtml(alt)}</span>${visual}` : visual;
}

function wrapFallback(element: string): string {
  const openEnd = element.indexOf(">");
  const open = openEnd === -1 ? element : element.slice(0, openEnd + 1);
  if (/\bdisplay\s*=\s*(?:"block"|'block')/i.test(open)) return element;
  return `<span class="sat-math">${element}</span>`;
}

function readAttr(open: string, name: string): string {
  const match = open.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return decodeHtmlEntities(match?.[1] ?? match?.[2] ?? "");
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function parseFragment(html: string): Node[] {
  const nodes: Node[] = [];
  let index = 0;
  while (index < html.length) {
    if (html[index] !== "<") {
      const next = html.indexOf("<", index);
      const end = next === -1 ? html.length : next;
      nodes.push(stripInvisible(decodeHtmlEntities(html.slice(index, end))));
      index = end;
      continue;
    }
    const close = html.indexOf(">", index);
    if (close === -1) break;
    const raw = html.slice(index, close + 1);
    const match = raw.match(/^<\/?\s*([A-Za-z][\w:-]*)\b([^>]*)>/);
    if (!match) {
      index = close + 1;
      continue;
    }
    const tag = match[1].toLowerCase();
    if (raw.startsWith("</")) {
      index = close + 1;
      continue;
    }
    const attrs = parseAttrs(match[2] ?? "");
    if (/\/>$/.test(raw)) {
      nodes.push({ tag, attrs, children: [] });
      index = close + 1;
      continue;
    }
    const innerStart = close + 1;
    const innerEnd = findClose(html, innerStart, tag);
    nodes.push({ tag, attrs, children: parseFragment(html.slice(innerStart, innerEnd)) });
    index = innerEnd;
    const closer = html.slice(index).match(new RegExp(`^</\\s*${tag}\\s*>`, "i"));
    if (closer) index += closer[0].length;
  }
  return nodes;
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of source.matchAll(/([:@\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[(match[1] ?? "").toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? "");
  }
  return attrs;
}

function findClose(html: string, from: number, tag: string): number {
  let depth = 1;
  let index = from;
  const openRe = new RegExp(`^<${tag}\\b[^>]*>`, "i");
  const closeRe = new RegExp(`^</\\s*${tag}\\s*>`, "i");
  while (index < html.length) {
    const next = html.indexOf("<", index);
    if (next === -1) return html.length;
    const rest = html.slice(next);
    const close = rest.match(closeRe);
    if (close) {
      depth -= 1;
      if (depth === 0) return next;
      index = next + close[0].length;
      continue;
    }
    const open = rest.match(openRe);
    if (open && !/\/>$/.test(open[0])) {
      depth += 1;
      index = next + open[0].length;
      continue;
    }
    const any = rest.match(/^<[^>]*>/);
    index = next + (any?.[0].length ?? 1);
  }
  return html.length;
}

function nodesToLatex(nodes: Node[], display: boolean): string {
  return nodes.map((node) => nodeToLatex(node, display)).join("");
}

function nodeToLatex(node: Node, display: boolean): string {
  if (typeof node === "string") return "";
  const { tag, attrs, children } = node;
  if (tag === "annotation" || tag === "annotation-xml") return "";
  if (tag === "semantics") {
    const first = children.find((child) => typeof child !== "string" || child.trim() !== "");
    return first ? nodeToLatex(first, display) : "";
  }
  if (tag === "mstyle") return nodesToLatex(children, attrs.displaystyle === "true" || display);
  if (tag === "math" || tag === "mrow" || tag === "mpadded" || tag === "maction") {
    return nodesToLatex(children, display);
  }
  if (tag === "mi") return identifier(textOf(children), attrs);
  if (tag === "mn") return escapeLatex(textOf(children).trim());
  if (tag === "mo") return operator(textOf(children).trim());
  if (tag === "mtext" || tag === "ms") {
    const text = stripInvisible(textOf(children));
    return text.trim() ? `\\text{${escapeLatex(text.trim())}}` : "";
  }
  if (tag === "mfrac") {
    const [num, den] = elements(children);
    const cmd = display ? "\\dfrac" : "\\frac";
    return `${cmd}{${num ? nodeToLatex(num, false) : ""}}{${den ? nodeToLatex(den, false) : ""}}`;
  }
  if (tag === "msup") {
    const [base, exp] = elements(children);
    return `${group(base, display)}^{${exp ? nodeToLatex(exp, false) : ""}}`;
  }
  if (tag === "msub") {
    const [base, sub] = elements(children);
    return `${group(base, display)}_{${sub ? nodeToLatex(sub, false) : ""}}`;
  }
  if (tag === "msubsup") {
    const [base, sub, exp] = elements(children);
    return `${group(base, display)}_{${sub ? nodeToLatex(sub, false) : ""}}^{${exp ? nodeToLatex(exp, false) : ""}}`;
  }
  if (tag === "msqrt") return `\\sqrt{${nodesToLatex(children, false)}}`;
  if (tag === "mroot") {
    const [rad, idx] = elements(children);
    return `\\sqrt[${idx ? nodeToLatex(idx, false) : ""}]{${rad ? nodeToLatex(rad, false) : ""}}`;
  }
  if (tag === "mover" || (tag === "menclose" && (attrs.notation ?? "").split(/\s+/).includes("top"))) {
    const parts = elements(children);
    const accent = parts[parts.length - 1];
    const overline = tag === "menclose" || (accent?.tag === "mo" && OVERLINE.has(textOf(accent.children).trim()));
    const base = overline && tag === "mover" ? parts.slice(0, -1) : parts;
    if (overline) return `\\overline{${base.map((part) => nodeToLatex(part, false)).join("")}}`;
  }
  if (tag === "mspace") return " ";
  if (tag === "mphantom") return `\\phantom{${nodesToLatex(children, display)}}`;
  if (tag === "mfenced") {
    const open = operator(attrs.open ?? "(");
    const close = operator(attrs.close ?? ")");
    return `${open}${nodesToLatex(children, display)}${close}`;
  }
  return nodesToLatex(children, display);
}

function elements(children: Node[]): El[] {
  return children.filter((node): node is El => typeof node !== "string");
}

function textOf(children: Node[]): string {
  return children.map((child) => typeof child === "string" ? child : textOf(child.children)).join("");
}

function group(node: El | undefined, display: boolean): string {
  return `{${node ? nodeToLatex(node, display) : ""}}`;
}

function identifier(raw: string, attrs: Record<string, string>): string {
  const text = stripInvisible(raw).trim();
  if (!text) return "";
  if (text === "π" || text === "pi") return "\\pi ";
  if (text === "$") return "\\$";
  if (attrs.mathvariant === "script" && text === "l") return "\\ell ";
  const func = FUNCS[text];
  if (func) return `${func} `;
  if (attrs.mathvariant === "normal" || text.length > 1) return `\\mathrm{${escapeLatex(text)}}`;
  return escapeLatex(text);
}

function operator(text: string): string {
  const cleaned = stripInvisible(text).trim();
  if (!cleaned) return "";
  const mapped = OPERATORS[cleaned];
  if (mapped !== undefined) return mapped;
  if (OVERLINE.has(cleaned)) return "";
  return escapeLatex(cleaned);
}

function escapeLatex(value: string): string {
  return value.replace(/[\\{}$%&#_^~]/g, (char) => {
    if (char === "~") return "\\textasciitilde ";
    if (char === "\\") return "\\textbackslash ";
    if (char === "^") return "\\^{}";
    return `\\${char}`;
  });
}
