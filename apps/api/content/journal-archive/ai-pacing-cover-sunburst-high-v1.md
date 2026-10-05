# AI Pacing Cover: Sunburst High Sample

## Provenance

- Mode: user-requested OpenAI Image API through the bundled imagegen CLI, not the Codex built-in image tool.
- Requested model: `gpt-image-2.5-sunburst`.
- Quality: `high`.
- Size: `auto`, with a 16:9 landscape composition requested in the prompt.
- Output: one PNG, 1672 x 941 pixels.
- Generation duration reported by the CLI: 30.0 seconds.
- Generated: 2026-10-05T03:24:37Z.
- Usage-log job: `b285100c-d678-46e4-b28f-eff36ffdd560`.
- Asset: `assets/ai-pacing-sunburst-high-v1.png`.
- Asset SHA-256: `716e1987b644ff5ad15d6e71c6f1d4d26aba8aa8ff3cc93491d0a63e3c4b06e3`.
- Exact unaugmented prompt: [prompt file](ai-pacing-cover-sunburst-high-v1.prompt.txt).
- Prior cover retained: `assets/dario-amodei-ai-slowdown-pace-frontier-2026-1198c0af400f.webp`.

This is a conceptual editorial illustration. It does not depict actual hardware or claim a signed AI pause agreement. No article text, publication date, automated model setting, or automation ON/OFF setting was changed for this sample.

## Accounting

The bundled CLI saves the image but does not expose the response's token usage or request ID. The local usage log therefore retains a USD 0.50 reservation with unknown usage. This is a budget hold, not a confirmed API charge or a claimed token-based estimate. Reconcile it against the OpenAI billing dashboard before releasing the hold.

## Reproduction

Load `OPENAI_API_KEY` securely from the local API environment without printing it. This command makes a paid API request; do not rerun it merely to inspect the existing image.

```sh
python "$CODEX_HOME/skills/.system/imagegen/scripts/image_gen.py" generate \
  --model gpt-image-2.5-sunburst \
  --quality high \
  --size auto \
  --n 1 \
  --output-format png \
  --background opaque \
  --no-augment \
  --prompt-file content/journal-archive/ai-pacing-cover-sunburst-high-v1.prompt.txt \
  --out output/imagegen/ai-pacing-sunburst-high-v1.png
```

Official references: [Sunburst model](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst), [image prompting](https://developers.openai.com/api/docs/guides/image-prompting).
