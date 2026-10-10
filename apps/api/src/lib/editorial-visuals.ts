import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { articleWordCount, readingTimeMinutes } from "./reading-time";

const plainText = (min: number, max: number) => z.string().trim().min(min).max(max).refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Use single-line plain text");
export const inlineVisualSchema = z.object({
  id: z.enum(["visual-1", "visual-2"]),
  kind: z.enum(["flow", "comparison", "checklist"]),
  title: plainText(5, 72),
  summary: plainText(20, 180),
  items: z.array(z.object({ label: plainText(3, 40), description: plainText(20, 180) })).min(2).max(4),
  alt: plainText(30, 420),
  caption: plainText(20, 240),
});
export type InlineVisual = z.infer<typeof inlineVisualSchema>;
type VisualDraft = { content: string; inlineVisuals?: InlineVisual[] };

export function requiredInlineVisualCount(content: string) {
  const minutes = readingTimeMinutes(content.replace(/\[\[visual-[12]\]\]/g, ""));
  return minutes >= 7 ? 2 : minutes > 3 ? 1 : 0;
}

export function inlineVisualIssues(draft: VisualDraft) {
  const parsed = z.array(inlineVisualSchema).max(2).safeParse(draft.inlineVisuals);
  if (!parsed.success) return ["Provide a valid inlineVisuals array of source-grounded explanatory visuals."];
  const visuals = parsed.data;
  const issues: string[] = [];
  const count = requiredInlineVisualCount(draft.content);
  if (visuals.length !== count) issues.push(`The actual article length requires ${count} inline visual(s), not ${visuals.length}.`);
  if (visuals.some((visual, index) => visual.id !== `visual-${index + 1}`)) issues.push("Use ordered, unique visual-1 and visual-2 identifiers.");
  const markers = [...draft.content.matchAll(/\[\[visual-[^\]]*\]\]/g)];
  if (markers.length !== visuals.length) issues.push("Each inline visual needs exactly one standalone placement marker.");
  let previous = -1;
  for (const visual of visuals) {
    const marker = `[[${visual.id}]]`;
    const location = draft.content.indexOf(marker);
    if (location < 0 || location !== draft.content.lastIndexOf(marker) || !new RegExp(`(?:^|\n)\\[\\[${visual.id}\\]\\](?:\n|$)`).test(draft.content)) {
      issues.push(`Place ${marker} exactly once on its own line beside the relevant explanation.`);
      continue;
    }
    if (location <= previous) issues.push("Inline visual markers must follow their array order.");
    if (articleWordCount(draft.content.slice(0, location)) < 100 || articleWordCount(draft.content.slice(location + marker.length)) < 80) issues.push("Place visuals within the article, after its opening and before its conclusion.");
    if (previous >= 0 && articleWordCount(draft.content.slice(previous, location)) < 150) issues.push("Separate two visuals with at least 150 words of useful explanation.");
    previous = location + marker.length;
  }
  if (markers.some(([marker]) => !visuals.some((visual) => marker === `[[${visual.id}]]`))) issues.push("Remove unknown inline visual markers.");
  return issues;
}

const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

// Conservative glyph widths and dynamic row heights also handle long unbroken labels.
function wrap(value: string, width: number, size: number) {
  const measure = (text: string) => [...text].reduce((sum, character) => sum + size * (
    /[MW@%]/.test(character) ? 1 : /[mw]/.test(character) ? 0.92 : /[A-Z]/.test(character) ? 0.8 : /[a-z0-9]/.test(character) ? 0.68 : /[\s.,:;!'|]/.test(character) ? 0.4 : 1
  ), 0);
  const words = value.split(/\s+/).flatMap((word) => {
    const chunks: string[] = [];
    for (const character of word) {
      if (!chunks.length || measure(chunks.at(-1)! + character) > width) chunks.push(character);
      else chunks[chunks.length - 1] += character;
    }
    return chunks;
  });
  const lines: string[] = [];
  for (const word of words) {
    if (!lines.length || measure(`${lines.at(-1)} ${word}`) > width) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  return lines;
}
function text(lines: string[], x: number, y: number, size: number, color: string, weight = 400) {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${lines.map((line, index) => `<tspan x="${x}" dy="${index ? size * 1.4 : 0}">${escape(line)}</tspan>`).join("")}</text>`;
}

export function renderInlineVisual(value: InlineVisual) {
  const visual = inlineVisualSchema.parse(value);
  const title = wrap(visual.title, 648, 38);
  const summary = wrap(visual.summary, 648, 24);
  const labels = { flow: "PROCESS", comparison: "AT A GLANCE", checklist: "CHECKLIST" };
  const accents = ["#19785c", "#2764c0", "#b9503e", "#6555a6"];
  let y = 85 + title.length * 53;
  let svg = text([labels[visual.kind]], 36, 42, 16, "#19785c", 700);
  svg += text(title, 36, 94, 38, "#192c28", 700);
  svg += text(summary, 36, y, 24, "#4c635c");
  y += summary.length * 34 + 42;
  const comparison = visual.kind === "comparison";
  for (let index = 0; index < visual.items.length; index++) {
    const item = visual.items[index];
    const label = wrap(item.label, comparison ? 270 : 564, 28);
    const description = wrap(item.description, comparison ? 270 : 564, 24);
    const rowHeight = 46 + label.length * 40 + description.length * 34;
    const x = comparison ? 36 + (index % 2) * 338 : 36;
    const width = comparison ? 310 : 648;
    if (comparison && index % 2 === 1) {
      // Paired columns share their tallest row; the next pair starts beneath both.
      const prior = visual.items[index - 1];
      const priorHeight = 46 + wrap(prior.label, 270, 28).length * 40 + wrap(prior.description, 270, 24).length * 34;
      y -= priorHeight + 20;
    }
    svg += `<rect x="${x}" y="${y}" width="${width}" height="${rowHeight}" rx="6" fill="${comparison ? "#f2f6fb" : "#f2f7f4"}"/><rect x="${x}" y="${y}" width="4" height="${rowHeight}" fill="${accents[index]}"/>`;
    if (!comparison) {
      svg += visual.kind === "checklist"
        ? `<path d="M${x + 23} ${y + 36}l7 7 13-17" fill="none" stroke="${accents[index]}" stroke-width="3" stroke-linecap="round"/>`
        : text([String(index + 1).padStart(2, "0")], x + 18, y + 41, 21, accents[index], 700);
    }
    const textX = x + (comparison ? 20 : 62);
    svg += text(label, textX, y + 40, 28, "#192c28", 700);
    svg += text(description, textX, y + 48 + label.length * 40, 24, "#40564f");
    if (comparison && index % 2 === 1) {
      const prior = visual.items[index - 1];
      const priorHeight = 46 + wrap(prior.label, 270, 28).length * 40 + wrap(prior.description, 270, 24).length * 34;
      y += Math.max(rowHeight, priorHeight) + 20;
    } else y += rowHeight + 20;
    if (visual.kind === "flow" && index < visual.items.length - 1) {
      svg += `<path d="M62 ${y - 16}v12m-5-5 5 5 5-5" fill="none" stroke="#8aaba0" stroke-width="2"/>`;
      y += 8;
    }
  }
  const height = y + 22;
  return { width: 720, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}" role="img" aria-labelledby="title description"><title id="title">${escape(visual.title)}</title><desc id="description">${escape(visual.alt)}</desc><rect width="720" height="${height}" fill="#ffffff"/><g font-family="Arial, Helvetica, sans-serif">${svg}</g></svg>` };
}

export async function installInlineVisuals(draft: VisualDraft, jobId: string, uploadRoot: string) {
  // Legacy workers remain compatible during rolling deployment; new workers always supply the plan.
  if (draft.inlineVisuals === undefined) return { content: draft.content, visuals: [] };
  const issues = inlineVisualIssues(draft);
  if (issues.length) throw new Error(issues.join(" "));
  if (!/^[a-f0-9-]{36}$/.test(jobId)) throw new Error("Invalid visual storage identifier");
  let content = draft.content;
  const visuals = [];
  for (const visual of draft.inlineVisuals) {
    const rendered = renderInlineVisual(visual);
    const hash = createHash("sha256").update(rendered.svg).digest("hex").slice(0, 16);
    const filename = `inline-${hash}.svg`;
    const directory = path.join(uploadRoot, "blogs", "generated", jobId);
    await fs.mkdir(directory, { recursive: true });
    const bytes = Buffer.from(rendered.svg);
    const file = path.join(directory, filename);
    await fs.writeFile(file, bytes, { flag: "wx" }).catch(async (error) => {
      if (error.code !== "EEXIST") throw error;
      if (!(await fs.readFile(file)).equals(bytes)) throw new Error("An existing inline visual cannot be overwritten");
    });
    const url = `/uploads/blogs/generated/${jobId}/${filename}`;
    const figure = `<figure class="article-visual"><a href="${url}" target="_blank" rel="noopener noreferrer" title="Open full-size visual"><img src="${url}" alt="${escape(visual.alt)}" width="${rendered.width}" height="${rendered.height}" loading="lazy" decoding="async"></a><figcaption>${escape(visual.caption)}</figcaption></figure>`;
    content = content.replace(`[[${visual.id}]]`, figure);
    visuals.push({ id: visual.id, kind: visual.kind, title: visual.title, alt: visual.alt, caption: visual.caption, url });
  }
  return { content, visuals };
}
