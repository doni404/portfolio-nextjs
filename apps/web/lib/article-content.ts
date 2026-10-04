import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { Parser } from "htmlparser2";
import { mediaUrl } from "./media";

export type ArticleHeading = { id: string; text: string; level: number };

export function articleContent(content: string, prefix = "section") {
  let index = 0;
  const heading: sanitizeHtml.Transformer = (tagName, attribs) => ({
    tagName,
    attribs: { ...attribs, id: `${prefix}-${++index}` },
  });
  const html = sanitizeHtml(marked.parse(content, { async: false }) as string, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
      "mark",
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      h2: ["id"],
      h3: ["id"],
      code: ["class"],
      img: ["src", "alt", "width", "height", "loading"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    transformTags: {
      h2: heading,
      h3: heading,
      img: (tagName, attrs) => ({
        tagName,
        attribs: { ...attrs, src: mediaUrl(attrs.src) ?? "", loading: "lazy" },
      }),
      a: (tagName, attrs) => ({
        tagName,
        attribs: { ...attrs, rel: "noopener noreferrer" },
      }),
    },
  });
  const headings: ArticleHeading[] = [];
  let current: ArticleHeading | undefined;
  const parser = new Parser(
    {
      onopentag(tag, attrs) {
        if (tag === "h2" || tag === "h3")
          current = { id: attrs.id, text: "", level: Number(tag[1]) };
      },
      ontext(text) {
        if (current) current.text += text;
      },
      onclosetag(tag) {
        if (current && (tag === "h2" || tag === "h3")) {
          headings.push({ ...current, text: current.text.trim() });
          current = undefined;
        }
      },
    },
    { decodeEntities: true },
  );
  parser.write(html);
  parser.end();
  return { html, headings };
}
