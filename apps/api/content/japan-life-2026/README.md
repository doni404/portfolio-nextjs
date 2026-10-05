# Japan Life: Initial Journal Package

Ten original English practical guides, checked against official sources on October 5, 2026. They are current-reference guides, not invented news events from today. Reading times are calculated from visible Markdown text at 220 words per minute; URLs, image descriptions, and the Sources section do not inflate them.

## Content and Covers

The first five guides cover train payments (5 minutes), konbini printing (4), parcels and luggage (6), household sorting (8), and a weather/local-information phone setup (7). The next five cover station lockers (5), rainy-day laundry (4), supermarket shopping (6), public libraries (7), and cash-payment backup (3). Each article links official sources near factual claims and distinguishes local examples from nationwide rules.

The ten PNG covers and four inline visuals in `assets/` were made with Codex's built-in image generation, not this project's OpenAI API key. The prompt set is in `cover-prompts.json`. They are conceptual artwork, not documentary photos or endorsements. Lockers and shopping each have two inline visuals with descriptive alt text and illustrative captions.

Inline Markdown uses `(asset:KEY)` placeholders mapped by each post's `inlineAssets`. The importer validates every PNG, substitutes immutable upload URLs, and refuses unresolved or unreferenced assets. No attachment paths from the authoring computer are published.

## Safe Import

From `apps/api`, run:

```sh
npm run build
npm run db:migrate
npm run content:japan-life
npm run content:japan-life -- --apply
```

The first import command is a dry run. Applying only inserts absent slugs, stages immutable cover and inline-image files under the API's persistent `uploads/blogs/japan-life/` directory, and records created IDs in a private import log. It never replaces or deletes existing articles, including archived articles, or changes featured flags. Repeating it preserves admin edits.

On Coolify, deploy the new API image first, then run the dry run and apply commands in the API container with its existing database environment and persistent uploads mount. Do not run a full seed, database reset, or local database restore.

The topic migration adds Japan Life only to the untouched seven-topic default mix. Custom topic selections are preserved; add `Japan life & practical hacks` in Admin > Journal Automation when using a custom mix. The ON/OFF setting, schedule, quota, and $5 budget are not changed.

## Freshness

The worker prioritizes verified events from today or the last 24 hours, then expands to seven days and at most thirty days. It must keep the real event date and may decline a slot rather than invent fresh news. Site search searches published database articles, not the live web. Human review and publishing remain required.
