# Journal Cover Prompt Patterns

These are two reusable art-direction templates for manually selected journal covers. They are not wired into scheduled automation yet. The automated model and ON/OFF settings stay unchanged.

For both patterns, provide the article's verified topic, a short accurate hook, an optional relevant brand, and a concrete visual metaphor before generation. Never turn a proposal into a completed event, a marketing claim into an audited fact, or a conceptual image into a purported real screenshot.

## Pattern A: Bold Dark

Use for reliability incidents, frontier-AI debates, infrastructure, or dramatic technical changes where a high-contrast visual supports the story.

```text
Create a professional editorial cover for {ARTICLE_TITLE}.
The factual topic is {FACTUAL_TOPIC}; the image must not imply {MISLEADING_CLAIM}.
Use a wide 16:9 canvas, a near-black charcoal background, natural metallic materials,
and controlled studio lighting. Keep the composition to two or three large elements.
The main subject is {CONCRETE_SUBJECT}; the secondary visual is {VISUAL_METAPHOR}.
Use white type and one bright accent {ACCENT_COLOR}, with a small contrasting accent
only where needed. Render {EYEBROW}, {SHORT_HEADLINE}, and {OPTIONAL_SUBLINE} once each,
in that hierarchy. Make the headline dominant, sharp, and readable at thumbnail size.
Use 7 percent safe margins. Keep key objects fully legible and text unclipped.
If a relevant brand is requested, depict {BRAND_LOGO} accurately and prominently,
as editorial identification, not endorsement or an invented official product UI.
Avoid clutter, generic neural networks, decorative glowing orbs, fake statistics,
unrelated celebrity portraits, invented quotations, and fake screenshots.
This is a conceptual editorial illustration, not a factual photograph.
```

Reference example: [AI pacing exact prompt](ai-pacing-cover-sunburst-high-v1.prompt.txt).

## Pattern B: Smooth Light

Use for consumer products, privacy, personal AI, brand-focused explainers, and practical tools where a bright calm treatment suits the topic. Light does not mean low contrast or generic pastel art.

```text
Create a professional editorial cover for {ARTICLE_TITLE}.
The factual topic is {FACTUAL_TOPIC}; the image must not imply {MISLEADING_CLAIM}.
Use a wide 16:9 canvas with a luminous near-white background, a pale cool studio surface,
soft natural daylight, grounded shadows, and generous negative space. No dark scene.
Show {CONCRETE_SUBJECT} and one simple {VISUAL_METAPHOR} using smooth, realistic materials.
If relevant, make {BRAND_LOGO} recognizable, accurate, and a first-glance visual signal.
Use it only as editorial identification, without implying endorsement or fabricating UI.
Use dark graphite type and one controlled, saturated accent {ACCENT_COLOR}; optional
secondary colors should come from the physical subject or the brand, not arbitrary gradients.
Render {EYEBROW} and {SHORT_HEADLINE} exactly once each. Preserve punctuation, especially
question marks when the article asks a question rather than establishes a conclusion.
Keep type sharp and readable at thumbnail size, within 7 percent outer safe margins.
Avoid weak contrast, washed-out text, beige filler, clutter, neon lighting, bokeh blobs,
decorative orbs, generic stock illustrations, fake certification badges, and fake screenshots.
This is a conceptual editorial illustration, not an official advertisement or real product photo.
```

Reference example: [Apple Intelligence exact prompt](apple-intelligence-cover-light-sunburst-high-v1.prompt.txt).

## Selection And Review

- Choose the pattern for the story, not an arbitrary dark/light alternation.
- Use a short hook faithful to the article instead of squeezing the full SEO title into the image.
- Include a brand logo only when the article is genuinely about that brand; omit it for broader stories.
- Inspect logo geometry, spelling, punctuation, material realism, safe margins, and small-thumbnail legibility.
- Keep the previous asset and back up the database reference before installation.
- Save the exact final prompt, requested model, quality, output dimensions, and provenance for each cover.
- Keep paid API usage logged; unknown usage remains a budget hold, never a fabricated zero-dollar charge.

Model and quality are separate API parameters, not part of the prompt template. Current manually requested comparison samples use `gpt-image-2.5-sunburst` with `quality=high` via the bundled imagegen CLI. See [official model documentation](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst).
