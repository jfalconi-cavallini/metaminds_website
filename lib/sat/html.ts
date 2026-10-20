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
  "bevelled", "align", "linebreak", "scriptlevel",
];

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
  return expandMfenced(sanitizeSatHtml(decodeHtmlEntities(input)));
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

/**
 * Render path for format "html". Keeps a small HTML set plus MathML.
 * Drops scripts, event handlers, and non-https URLs.
 */
export function sanitizeSatHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [...HTML_TAGS, ...MATHML_TAGS],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      ...mathAttributes(),
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesByTag: { img: ["https", "data"] },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    exclusiveFilter(frame) {
      if (frame.tag !== "img") return false;
      const src = frame.attribs.src ?? "";
      return !(src.startsWith("https://") || SAFE_IMAGE.test(src));
    },
  });
}
