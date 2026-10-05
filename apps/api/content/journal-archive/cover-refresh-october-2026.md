# October Cover Refresh

Eight selected covers replace the original generic illustrations. Previous assets
remain available, and the installer preserves edited articles and custom uploads.

The exact prompts, chosen pattern and editorial rationale are in
[the prompt set](cover-refresh-october-2026.json). Five smooth-light compositions
and three bold-dark compositions reflect the subject rather than a forced rotation.

## Execution

- AI jobs: OpenAI Image API, `gpt-image-2.5-sunburst`, high quality, size auto.
- Anthropic defense dispute: the same API settings, with a visibly illustrated
  Dario Amodei portrait, not a photograph of a real event.
- Windows 10, Google AI Mode, GitHub Copilot, DeepSeek-R1, Anthropic Economic
  Index and EU AI Act: Codex built-in image generation, not the user's API key.

The final PNGs are in `assets/`; the manifest contains their dimensions, hashes,
prompt hashes and provenance. All selected images are 1672 x 941 pixels.
Brand marks identify the editorial subjects and do not imply endorsement.

## Accounting

The API sample jobs are `1b01e39e-3d84-42f6-bf67-16e8048dd630` and
`3e842c81-7d6b-4701-aed7-637e5942581d`. Each retains a USD 0.50 budget hold:
the bundled CLI does not return request IDs or token usage. These holds are not
confirmed charges. Do not release them without reconciling provider billing.
The monthly cap remains USD 5 and scheduled automation remains OFF.

## Installation

```sh
npm run content:journal-covers:install
npm run content:journal-covers:install -- --apply
```

The first command is a dry run; neither command calls a paid image API.
