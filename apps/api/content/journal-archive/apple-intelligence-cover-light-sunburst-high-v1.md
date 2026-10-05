# Apple Intelligence Cover: Smooth Light

## Provenance

- Mode: user-requested OpenAI Image API through the bundled imagegen CLI, continuing the Sunburst comparison; not the Codex built-in image tool.
- Requested model: `gpt-image-2.5-sunburst`.
- Quality: `high`.
- Pattern: `smooth-light`, defined in [cover prompt patterns](cover-prompt-patterns.md).
- Size: `auto`, with a 16:9 composition requested in the prompt.
- Output: one PNG, 1672 x 941 pixels.
- Generation duration reported by the CLI: 27.7 seconds.
- Generated: 2026-10-05T04:27:06Z.
- Usage-log job: `13dcb5fe-f364-4478-a38e-6accf991029b`.
- Asset: `assets/apple-intelligence-light-sunburst-high-v1.png`.
- Asset SHA-256: `ffbb26cf22e381b0d49d1676ed098137fc5072201fb4b2a0a30b60e4cf2f5b26`.
- Exact unaugmented prompt: [prompt file](apple-intelligence-cover-light-sunburst-high-v1.prompt.txt).
- Prior cover retained: `assets/apple-intelligence-privacy-personal-ai-2024-60b5a4ea0df7.webp`.

The Apple mark is used for editorial identification in a generated conceptual illustration. The scene is not an official advertisement, real product photograph, privacy certification, or product screenshot. The headline asks a question; it does not claim independently audited privacy.

No article text, publication date, automated model setting, or automation ON/OFF setting was changed. The two prompt patterns are reusable manual templates, not a scheduled automation change.

## Accounting

The bundled CLI saves images but does not expose token usage or request IDs. The local usage log retains a USD 0.50 reservation with unknown usage. This is a budget hold, not a confirmed charge. Reconcile it with the OpenAI billing dashboard before releasing the hold.

## Reproduction

Load `OPENAI_API_KEY` securely from the API environment without printing it. Do not repeat this paid API call simply to view the saved image.

```sh
python "$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py" generate \
  --model gpt-image-2.5-sunburst \
  --quality high \
  --size auto \
  --n 1 \
  --output-format png \
  --background opaque \
  --no-augment \
  --prompt-file content/journal-archive/apple-intelligence-cover-light-sunburst-high-v1.prompt.txt \
  --out output/imagegen/apple-intelligence-light-sunburst-high-v1.png
```

Official model reference: [GPT Image 2.5 Sunburst](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst).
