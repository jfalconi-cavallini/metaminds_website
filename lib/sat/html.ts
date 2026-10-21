import sanitizeHtml from "sanitize-html";

const HTML_TAGS = [
  "p", "br", "div", "span", "em", "strong", "b", "i", "u", "sub", "sup",
  "ul", "ol", "li", "blockquote", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "a", "img", "figure", "figcaption",
  "pre", "code",
];

const MATHML_TAGS = [
  "math", "mi", "mn", "mo", "mtext", "mspace", "ms", "mglyph", "maction",
  "mrow", "mfrac", "msqrt", "mroot", "mstyle", "merror", "mpadded",
  "mphantom", "mfenced", "menclose",
  "msub", "msup", "msubsup", "munder", "mover", "munderover",
  "mmultiscripts", "mprescripts", "none",
  "mtable", "mtr", "mtd", "mlabeledtr",
  "mlongdiv", "mscarries", "mscarry", "msgroup", "msline", "msrow", "mstack",
  "maligngroup", "malignmark",
  "semantics", "annotation", "annotation-xml",
];

const MATHML_ATTRIBUTES = [
  "displaystyle", "mathvariant", "mathsize", "display", "xmlns", "encoding",
  "stretchy", "fence", "separator", "accent", "accentunder",
  "lspace", "rspace", "minsize", "maxsize", "largeop", "movablelimits",
  "symmetric", "columnalign", "rowalign", "columnspan", "rowspan",
  "columnlines", "rowlines", "frame", "framespacing", "width", "height",
  "depth", "linethickness", "notation", "open", "close", "separators",
  "bevelled", "align", "linebreak", "scriptlevel", "alttext",
];

/** Figure markup from the question bank. foreignObject and animation stay out. */
const SVG_TAGS = [
  "svg", "g", "defs", "path", "use", "line", "rect", "text", "tspan",
  "marker", "clippath", "pattern", "polygon", "polyline", "circle", "ellipse",
  "style", "title", "desc",
];

const SVG_ATTRIBUTES = [
  "id", "class", "style", "role", "aria-hidden", "aria-label", "aria-level",
  "transform", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "stroke-opacity", "stroke-dasharray", "stroke-dashoffset", "fill-opacity", "opacity",
  "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height",
  "d", "points", "dx", "dy", "viewbox", "preserveaspectratio", "xmlns", "xmlns:xlink",
  "xlink:href", "href", "marker-start", "marker-end", "marker-mid",
  "markerwidth", "markerheight", "refx", "refy", "orient", "markerunits",
  "clip-path", "clippathunits", "patternunits", "patterncontentunits", "patterntransform",
  "text-anchor", "dominant-baseline", "font-family", "font-size", "font-style", "font-weight",
  "version", "type",
];

const RICH_ATTRIBUTES = ["class", "style", "role", "aria-hidden", "aria-label", "aria-level"];

const STYLE_PROPS = [
  "fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap",
  "stroke-opacity", "stroke-dasharray", "stroke-dashoffset", "fill-opacity", "opacity",
  "font", "font-family", "font-size", "font-style", "font-weight",
  "text-anchor", "dominant-baseline", "text-align", "text-decoration",
  "vertical-align", "caption-side", "color", "width", "height",
  "padding-left", "margin-left", "margin-right", "margin-bottom", "margin-top",
  "text-indent", "border-color", "border-style", "border-collapse",
  "list-style-type", "justify-content",
];

/** Reject CSS that can load a URL or break out of a declaration. */
const SAFE_STYLE_VALUE = /^(?!.*(?:url\s*\(|expression\s*\(|javascript:|@import|-moz-binding))[^<>]*$/i;

const CLASS_TOKEN = /^[A-Za-z][\w-]*$/;
const CLASS_DENY = new Set([
  "absolute", "fixed", "sticky", "relative", "static",
  "hidden", "invisible", "contents", "collapse",
  "flex", "inline-flex", "grid", "inline-grid", "block", "inline", "inline-block",
]);

const SVG_CAMEL: Record<string, string> = {
  viewbox: "viewBox",
  preserveaspectratio: "preserveAspectRatio",
  markerwidth: "markerWidth",
  markerheight: "markerHeight",
  refx: "refX",
  refy: "refY",
  markerunits: "markerUnits",
  clippathunits: "clipPathUnits",
  patternunits: "patternUnits",
  patterncontentunits: "patternContentUnits",
  patterntransform: "patternTransform",
};

const SAFE_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,/i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: "\u00A0",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201D",
  ldquo: "\u201C",
  mdash: "\u2014",
  ndash: "\u2013",
  hellip: "\u2026",
};

/** One decode pass. `&amp;nbsp;` becomes `&nbsp;`, and `&lt;p&gt;` becomes `<p>`. */
export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (entity, body: string) => {
    if (body.startsWith("#")) {
      const code = body[1] === "x" || body[1] === "X"
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return entity;
      return String.fromCodePoint(code);
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body) ? NAMED_ENTITIES[body] : entity;
  });
}

/**
 * HTML questions only. Text questions stay on the KaTeX path and are not decoded.
 * Decode escaped markup, then sanitize. MathML structure stays; scripts do not.
 * `mfenced` is rewritten to an `mrow` of operators because browsers lay out that form.
 */
export function prepareSatHtml(input: string): string {
  const clean = sanitizeSatHtml(decodeHtmlEntities(input));
  return expandMfenced(normalizeSatMarkup(clean));
}

function readAttr(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  if (!match) return undefined;
  return decodeHtmlEntities(match[1] ?? match[2] ?? "");
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Top-level elements inside one MathML parent. Whitespace between them is ignored. */
function topLevelPieces(inner: string): string[] {
  const pieces: string[] = [];
  let depth = 0;
  let chunkStart = -1;
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] !== "<") continue;
    const end = inner.indexOf(">", i);
    if (end === -1) break;
    const raw = inner.slice(i, end + 1);
    const name = raw.match(/^<\/?\s*([A-Za-z][\w:-]*)/)?.[1];
    if (!name) {
      i = end;
      continue;
    }
    const closing = raw.startsWith("</");
    const selfClosing = /\/>$/.test(raw);
    if (!closing) {
      if (depth === 0) chunkStart = i;
      if (!selfClosing) depth += 1;
      else if (depth === 0 && chunkStart >= 0) {
        pieces.push(inner.slice(chunkStart, end + 1));
        chunkStart = -1;
      }
    } else {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && chunkStart >= 0) {
        pieces.push(inner.slice(chunkStart, end + 1));
        chunkStart = -1;
      }
    }
    i = end;
  }
  return pieces;
}

/** Chrome lays out `mrow` and leaves `mfenced` as ordinary boxes. */
export function expandMfenced(html: string): string {
  const innerFence = /<mfenced\b([^>]*)>((?:(?!<mfenced\b)[\s\S])*?)<\/mfenced>/gi;
  let current = html;
  for (let pass = 0; pass < 20; pass++) {
    const next = current.replace(innerFence, (_match, attrs: string, inner: string) => {
      const open = escapeText(readAttr(attrs, "open") ?? "(");
      const close = escapeText(readAttr(attrs, "close") ?? ")");
      const separators = readAttr(attrs, "separators") ?? ",";
      const pieces = topLevelPieces(inner);
      const body = pieces.length <= 1
        ? inner
        : pieces.map((piece, index) => {
          if (index === 0) return piece;
          const separator = separators[index - 1] ?? separators[separators.length - 1] ?? ",";
          return `<mo>${escapeText(separator)}</mo>${piece}`;
        }).join("");
      return `<mrow><mo>${open}</mo>${body}<mo>${close}</mo></mrow>`;
    });
    if (next === current) return current;
    current = next;
  }
  return current;
}

function mathAttributes(): Record<string, string[]> {
  const attributes: Record<string, string[]> = {};
  for (const tag of MATHML_TAGS) attributes[tag] = MATHML_ATTRIBUTES;
  return attributes;
}

function svgAttributes(): Record<string, string[]> {
  const attributes: Record<string, string[]> = {};
  for (const tag of SVG_TAGS) attributes[tag] = SVG_ATTRIBUTES;
  return attributes;
}

function styleAllowlist(): Record<string, RegExp[]> {
  const props: Record<string, RegExp[]> = {};
  for (const prop of STYLE_PROPS) props[prop] = [SAFE_STYLE_VALUE];
  return props;
}

function richAttributes(): Record<string, string[]> {
  const tags = [
    "p", "div", "span", "li", "ul", "ol", "blockquote", "figure", "figcaption",
    "h1", "h2", "h3", "h4", "h5", "h6", "table", "caption", "em", "strong", "i", "b", "u",
  ];
  const attributes: Record<string, string[]> = {};
  for (const tag of tags) attributes[tag] = RICH_ATTRIBUTES;
  return attributes;
}

/**
 * Render path for format "html". Keeps a small HTML set plus MathML.
 * Drops scripts, event handlers, and non-https URLs.
 */
export function sanitizeSatHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [...HTML_TAGS, ...MATHML_TAGS, ...SVG_TAGS],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height"],
      td: ["colspan", "rowspan", ...RICH_ATTRIBUTES],
      th: ["colspan", "rowspan", "scope", ...RICH_ATTRIBUTES],
      ...richAttributes(),
      ...mathAttributes(),
      ...svgAttributes(),
    },
    allowedStyles: { "*": styleAllowlist() },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["https", "data"] },
    allowProtocolRelative: false,
    allowVulnerableTags: true,
    disallowedTagsMode: "discard",
    exclusiveFilter(frame) {
      if (frame.tag !== "img") return false;
      const src = frame.attribs.src ?? "";
      return !(src.startsWith("https://") || SAFE_IMAGE.test(src));
    },
  });
}

const FRAGMENT_REF = /^#[A-Za-z_][\w.-]*$/;
const CLIP_REF = /^url\(\s*(#[A-Za-z_][\w.-]*)\s*\)$/i;

/**
 * Keep figure structure, hide screen-reader spans, and stop a question's
 * `<style>` from restyling the rest of the page.
 */
function normalizeSatMarkup(html: string): string {
  const styled = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (element) => {
    const css = element.replace(/^<style\b[^>]*>/i, "").replace(/<\/style>$/i, "");
    const scoped = scopeSvgCss(css);
    return scoped ? `<style>${scoped}</style>` : "";
  });
  return styled.replace(/<([a-zA-Z][\w:-]*)\b([^>]*)>/g, (full, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    let next = filterClassAttr(attrs);
    if (SVG_TAGS.includes(name)) next = rewriteSvgAttrs(next);
    return next === attrs ? full : `<${tag}${next}>`;
  });
}

function filterClassAttr(attrs: string): string {
  return attrs.replace(/\sclass\s*=\s*"([^"]*)"/gi, (_match, value: string) => {
    const kept = value.split(/\s+/).filter((token) => CLASS_TOKEN.test(token) && !CLASS_DENY.has(token));
    return kept.length ? ` class="${kept.join(" ")}"` : "";
  });
}

function rewriteSvgAttrs(attrs: string): string {
  let next = keepAttr(attrs, "xlink:href", (value) => FRAGMENT_REF.test(value) ? value : null);
  next = keepAttr(next, "href", (value) => FRAGMENT_REF.test(value) ? value : null);
  next = keepAttr(next, "clip-path", (value) => {
    const match = value.match(CLIP_REF);
    return match ? `url(${match[1]})` : null;
  });
  return next.replace(/\s([a-z]+)=/g, (match, name: string) => {
    const camel = SVG_CAMEL[name];
    return camel ? ` ${camel}=` : match;
  });
}

function keepAttr(attrs: string, name: string, keep: (value: string) => string | null): string {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "gi");
  return attrs.replace(pattern, (_match, value: string) => {
    const kept = keep(value);
    return kept === null ? "" : ` ${name}="${escapeText(kept)}"`;
  });
}

function scopeSvgCss(css: string): string {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  if (/[<>]/.test(withoutComments)) return "";
  const rules: string[] = [];
  for (const chunk of withoutComments.split("}")) {
    const bodyStart = chunk.indexOf("{");
    if (bodyStart === -1) continue;
    const selectors = chunk.slice(0, bodyStart).trim();
    const body = chunk.slice(bodyStart + 1).trim();
    if (!selectors || !body) continue;
    if (/url\s*\(|expression\s*\(|javascript:|@import|-moz-binding|position\s*:/i.test(body)) continue;
    const scoped = selectors.split(",").map((selector) => {
      const trimmed = selector.trim();
      if (!trimmed || trimmed.length > 80) return "";
      if (!/^[*]?[.\w][\w\s.#:[\]_-]*$/.test(trimmed) && trimmed !== "*") return "";
      if (trimmed === "*") return ".sat-html svg, .sat-html svg *";
      return `.sat-html ${trimmed}`;
    }).filter(Boolean);
    if (scoped.length === 0) continue;
    rules.push(`${scoped.join(",")}{${body}}`);
  }
  return rules.join("");
}
