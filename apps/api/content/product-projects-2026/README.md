# Product Projects: milc, SmartMatch OCR, And Planpresso

This package creates three published projects without modifying any existing row.
It uses the existing Project schema, category, Markdown fields, and upload layout.
Project months are included in the solution text; `createdAt` remains the real
database insertion time rather than an invented launch day.

## Review And Import

From the API application directory with the intended `DATABASE_URL`:

```sh
npm run content:add-products
npm run content:add-products -- --apply
```

The default is a read-only preview. Applying saves an existing-project snapshot
under `storage/backups`, stages the missing projects' WebP covers under `UPLOAD_DIR`, and creates
missing slugs in one database transaction. Existing slugs are always skipped,
including archived or deleted projects. Rerunning will not overwrite later admin
edits or create duplicates. Different files at the same asset path are not overwritten.

The import never updates or deletes existing projects, categories, articles,
contacts, comments, accounts, or uploads. It requires the existing `ai-llm`
category and does not reseed the database. To withdraw an imported project, use
the admin's archive/status controls rather than replacing the database.

## Production

1. Back up the production database and API upload volume independently.
2. Deploy the API package and web changes when approved. No new schema migration
   is needed for these projects.
3. Confirm that the API upload directory uses persistent storage.
4. In the portfolio API container, run the read-only preview above. Check the
   printed database host/name and upload directory.
5. Apply the import and retain the reported snapshot outside the container.
6. Check `/projects/milc-voice-ai-text-editing` and
   `/projects/smartmatch-ocr-ai-document-processing`, and
   `/projects/planpresso-ai-prd-planner`, including cover URLs and
   the Visit product links.

Git carries this reviewed content package, not the local database. Apply the
same create-only import to the server; never restore the local database over
production to publish projects. This command is separate from `content:refresh`,
which updates the earlier five articles and three projects. After an upgrade,
existing milc and SmartMatch rows are skipped; only the missing Planpresso row
and its cover are added.

## Evidence

Reviewed on 4 October 2026. January 2026 (milc) and April 2026 (SmartMatch) are
project dates supplied by Doni, not independently verified public launch dates.
Doni also confirmed Node.js/Express for both APIs and Electron for milc's app.

- [milc product site](https://milc.work/en): Windows/macOS product experience,
  voice input, selected-text transformations, shortcut bar, keyboard commands,
  rewriting, translation, summarization, and tone/reply assistance.
- [milc security policy](https://milc.work/en/security): transient text processing,
  cloud-mediated external AI calls, OpenAI/Gemini examples, operational/account
  data separation, Stripe payment processing, TLS, and content-free operational
  logs. These are published policy commitments, not an independent audit.
- [SmartMatch product site](https://smartmatch.gloding.com/): document intake,
  configurable extraction, source evidence, validation, human review, finalization,
  and API output.
- [SmartMatch API reference](https://smartmatch.gloding.com/api/docs) and
  [OpenAPI specification](https://smartmatch.gloding.com/openapi.yaml): immutable
  target-profile versions, asynchronous jobs, OIDC/JWT, roles, idempotency keys,
  separate reviewer/approver identities, permission-gated intermediate results,
  finalized external data, state errors, and audit history.

The reviewed OpenAPI file was version 1.0.0, using OpenAPI 3.1.0. SHA-256:
`eb0440783491033f516d58a6245290a6015fbced0ffb658add0f87b3cce1a49a`.

No AWS service, database engine, speech-recognition provider, production SLA,
adoption count, diagnostic/processing accuracy, or measured latency is invented.
SmartMatch's specification names Google Document AI as an example provider,
not proof that it is the only deployed engine. Its marketing metrics are omitted
as measured outcomes. milc is not described as an offline AI engine.

## Artwork

The built-in image tool generated the covers from the original public logo
references. Prompt text and source URLs are in [cover-prompts.md](cover-prompts.md).
The logos were reused, not redesigned. Generated UI is explanatory, not an actual
product screenshot; the public detail-page caption makes this explicit.

- `assets/milc.webp`: 1440 x 810, voice command and selected-text editing.
- `assets/smartmatch.webp`: 1440 x 810, source document, review, and finalized data.
- `assets/planpresso.webp`: 1440 x 810, planning workspace, PRD, and agent pack.
- `assets/*-logo-reference.png`: original branding used as generation references.

Only cover files are copied to `storage/uploads/projects/<slug>/`. The frontend
does not duplicate them under `public`. Full original generation outputs remain
in Codex's generated-images directory.

## Planpresso Evidence

Reviewed on 8 October 2026 from the owner's Planpresso project thread, repository
README, database architecture and builder-adapter documentation, and the deployed
[product](https://planpresso.doniputra.com/) and
[authored sample](https://planpresso.doniputra.com/sample).

The repository confirms Next.js/TypeScript, Prisma/PostgreSQL, Better Auth,
OpenAI structured generation, leased background jobs, fourteen-section PRDs,
versions, and seven export adapters. The deployment record confirms a private
beta, separate web/worker services, GitHub-built images, and an isolated backup
restore. Older planning notes are not treated as current production status.

Payments and file processing remain disabled. Adapter file structures are tested,
but packs have not been executed inside all seven tools. No adoption, productivity,
latency, production-scale reliability, or fully independent database isolation is
claimed. Private repository paths, host identifiers, credentials, and logs are
not included in the public case study. October 2026 is the verified beta deployment
month; the import does not invent a historical database creation date.
