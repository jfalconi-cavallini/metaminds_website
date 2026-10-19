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
  "math", "mi", "mn", "mo", "mtext", "mspace", "ms", "mglyph",
  "mrow", "mfrac", "msqrt", "mroot", "mstyle", "merror", "mpadded",
  "mphantom", "mfenced", "menclose",
  "msub", "msup", "msubsup", "munder", "mover", "munderover",
  "mmultiscripts", "mprescripts", "none",
  "mtable", "mtr", "mtd", "mlabeledtr",
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
