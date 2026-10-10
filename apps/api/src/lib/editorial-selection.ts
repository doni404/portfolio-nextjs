import beats from "./editorial-beats.json";

type Post = { title?: string; editorialMeta?: unknown };
type Job = { day: string; slot: number };

export function coveredBeat(post: Post): string | null {
  const meta = post.editorialMeta as { beat?: string } | null;
  if (meta?.beat && [...beats.map((beat) => beat.id), "custom"].includes(meta.beat)) return meta.beat;
  return /(?:GPT[- ]?\d|Claude (?:Opus|Sonnet|\d)|Gemini \d|Llama \d|Qwen\d|DeepSeek[- ]?R\d)/i.test(post.title ?? "") ? "models" : null;
}

export function enabledBeats(topics: string[]) {
  const aliases: Record<string, RegExp> = { industry: /industry|leadership|ceo|business/i, policy: /policy|safety|regulat|governance/i, work: /work(?:,|\s|$)|society|education|jobs/i, products: /products|consumer/i, research: /research|science|paper/i, engineering: /cloud|developer|security|engineering/i, models: /model releases|llm/i };
  const available = topics.flatMap((topic) => {
    if (/^(AI|technology|AI & technology)$/i.test(topic.trim())) return beats.filter((beat) => beat.id !== "japan");
    if (/japan|japanese|nihon/i.test(topic)) return beats.filter((beat) => beat.id === "japan");
    const matches = beats.filter((beat) => aliases[beat.id]?.test(topic));
    return matches.length ? matches : [{ id: "custom", label: topic, angle: `Find a consequential story specifically about ${topic}.` }];
  });
  return [...new Map(available.map((beat) => [beat.id, beat])).values()];
}

export function dailyBeatPlan(topics: string[], dailyLimit: number, day: string) {
  const available = enabledBeats(topics);
  const count = Math.max(1, Math.min(5, Number.isInteger(dailyLimit) ? dailyLimit : 3));
  const japan = available.some((beat) => beat.id === "japan");
  const other = available.some((beat) => beat.id !== "japan");
  const ordinal = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400_000);
  // Reserve Japan early so a budget pause cannot always consume its slot last.
  const japanSlots = japan && other ? (count === 1 ? (ordinal % 2 === 0 ? 1 : 0) : Math.floor(count / 2)) : japan ? count : 0;
  return Array.from({ length: count }, (_, index) => {
    const isJapan = japan && (!other || (index % 2 === 0 && index / 2 < japanSlots));
    return { slot: index + 1, group: isJapan ? "japan" : "other", label: isJapan ? "Japan Life" : "Rotating topics" };
  });
}

export function selectBeat(topics: string[], recent: Post[], job: Job, dailyLimit = 3) {
  const plan = dailyBeatPlan(topics, dailyLimit, job.day);
  const group = plan[(job.slot - 1) % plan.length]?.group;
  const available = enabledBeats(topics).filter((beat) => group === "japan" ? beat.id === "japan" : beat.id !== "japan");
  const history = recent.slice(0, 10).map(coveredBeat);
  const eligible = available.filter((beat) => beat.id !== "models" || available.length === 1 || !history.slice(0, 4).includes("models"));
  if (!eligible.length) throw new Error("RESEARCH_FAILED");
  const offset = (Number(job.day.replaceAll("-", "")) + job.slot) % eligible.length;
  const rotated = [...eligible.slice(offset), ...eligible.slice(0, offset)];
  const count = (id: string) => history.filter((beat) => beat === id).length;
  return rotated.sort((a, b) => count(a.id) - count(b.id) || Number(history[0] === a.id) - Number(history[0] === b.id))[0];
}
