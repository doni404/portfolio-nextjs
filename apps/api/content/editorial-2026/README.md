# Editorial Refresh

This package updates the five existing articles and three existing case studies.
It does not change the Prisma schema, create or delete content, reseed the database,
or change record IDs, slugs, publication dates, categories, tags, or comments.

## Preview And Apply

From `apps/api`, with `DATABASE_URL` pointing to the intended database:

```sh
npm run content:refresh
npm run content:refresh -- --apply
```

The first command is read-only. The second saves the previous presentation fields
to `storage/backups`, copies the covers to `UPLOAD_DIR` (default
`storage/uploads`), then updates all records in one transaction. A concurrent
admin edit cancels the transaction. Running the same package again is a no-op
unless the targeted fields have changed; do not rerun it after making new admin
edits unless you intend to replace those fields.

## Coolify Deployment

1. Back up the production PostgreSQL database and the API upload volume first.
   Keep the backups outside the containers being redeployed.
2. Deploy the updated API and web code. This update requires no new DB migration.
3. Confirm the API's persistent volume is mounted at its configured `UPLOAD_DIR`.
4. Open the **portfolio API container** terminal, not the database container.
5. In the API application directory (usually `/app`), run `npm run content:refresh`.
   Check the printed database hostname/name and upload directory before proceeding.
6. Review the changed slugs. The initial refresh targets five existing articles
   and three existing projects. Later cover-only revisions change only their
   relevant projects if the previous content package was already applied.
7. Run `npm run content:refresh -- --apply`, then copy the reported content-field
   backup somewhere persistent. It complements, not replaces, the full DB backup.
8. Open `/blogs` and `/projects`; check that the API serves the new `/uploads/`
   assets and the public web environment points to the production API URL.

The script is intentionally not a startup hook or migration. A normal redeploy
will not overwrite subsequent admin edits. Do not run `db:seed` or `db:reset`
to install this content.

Original project covers are retained as a `Technical workflow` or
`Original project visual` link when present.
No original uploaded images are deleted. Existing production upload files must
already be available on the persistent volume; the database alone does not
contain those files.

## Local And Production Databases

Local content edits do not automatically reach production when Git is pushed.
Git carries code and this content package, not the database or runtime uploads.
Run the same reviewed package once against each intended database. The updater
matches existing records by slug, so local and production UUIDs can differ.

Never restore the entire local database over production to publish these changes.
That could discard new server contacts, comments, accounts, and admin edits.
This updater changes only the named article/project presentation fields; it does
not touch those other records. It does overwrite the targeted content fields, so
review the package against any edits made in the production admin beforehand.
Missing or deleted target slugs cause it to stop rather than create new records.
It is not a general database synchronization or new-content import tool.

For the new milc and SmartMatch OCR records, use the separate create-only
[product-projects package](../product-projects-2026/README.md) and
`npm run content:add-products`. That import never overwrites existing slugs.

After this refresh, use the production admin as the source of truth for ordinary
content edits and uploads. Use local for development and previews. Future bulk
content releases should be similarly targeted and reviewed, not a full DB copy.
Schema changes are a separate step: use `npm run db:migrate` in the API container
only when a release includes unapplied Prisma migrations. Do not use migration
reset or seed commands for routine content publishing.

## Restore

```sh
npm run content:refresh -- --restore /absolute/path/to/backup.json
```

Restore only touches the backed-up fields. It refuses to overwrite a record that
has been edited since the refresh. Uploaded assets are left in place. Backups
contain content, not credentials, and are excluded from Git.

## Content Boundaries

- Blog articles stay on AWS architecture, payment webhooks, gRPC services,
  AI chatbots, and sensor anomaly detection. Primary documentation is cited
  directly in the article text.
- Trajectory's eight passing functional cases are not a throughput or SLA claim.
- Kawaijuku's 80% accuracy and ten-second response criteria are PoC targets,
  not measured results or proof of production deployment.
- i-Nose's 90.4% average balanced accuracy is for outlier detection, not COVID-19
  diagnosis. Unsupported diagnostic and edge-latency claims are not used.

## Artwork

The six AI-generated editorial covers are conceptual illustrations, not product
screenshots or evidence of the implementation. They use the common brief:

> Wide 16:9 professional editorial still life, physical miniature objects,
> off-white background, forest green, mint, and cobalt accents, soft studio
> lighting, crisp inspectable detail, ample breathing room, no text, no brand
> logos, no invented interface screenshots.

Subject prompts:

- `cloud.webp`: miniature cloud infrastructure, server racks, database cylinder,
  connected network paths and a protective boundary.
- `payments.webp`: event envelope, ordered delivery/retry queue, database, and a
  successful verification marker.
- `backend.webp`: distinct service modules connected through clear interface
  paths, storage, and a central orchestration boundary.
- `learning-ai.webp`: open book, conversation object, knowledge checkpoints, and
  AI processor. Used by the chatbot article, not the Kawaijuku project cover.
- `sensor-research.webp`: electronic sensor board, multichannel signals, and a
  neural filtering module. Used by the sensor article, not the i-Nose project cover.
- `drone.webp`: quadcopter, route/path markers, conversation object, and backend
  modules representing reservation lookup.

### Project Cover Sources

- `inose-equipment.webp`: a photorealistic, AI-generated reconstruction of the
  pink, blue, and burgundy i-Nose prototypes from two reference photographs.
  Generated with the built-in image tool. The case-study caption explicitly
  identifies it as generated, not an archival photo or evidence of diagnostic
  performance. The original image is retained as a separate reference, not the
  cover. See [the complete generation prompt](inose-cover-prompt.md).
- `inose-device.webp`: the actual 2021 i-Nose C-19 prototype, published by
  [ITS News](https://www.its.ac.id/news/en/its-develops-i-nose-c-19-covid-19-detector-through-underarm-sweat-odor/).
  [Original photograph](https://www.its.ac.id/news/wp-content/uploads/sites/2/2021/01/WhatsApp-Image-2021-01-16-at-19.10.30.jpeg).
  Converted to WebP without cropping or upscaling. It is linked as the original
  device photograph in the case study. ITS does not state an open reuse license
  on the article; confirm
  permission for portfolio publication with the rights holder before deployment.
- `kawaijuku-campus.webp`: Kawaijuku Nagoya campus photographed by Umako on
  22 February 2011, released under CC0 on
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Kawaijuku_Nagoya_Campus_110222.jpg).
  Resized to 1440px wide and converted to WebP. The caption identifies this as
  institutional context, not a screenshot or deployment location of the PoC.

Trajectory's `drone.webp` cover and all five blog covers are unchanged by these
cover revisions. The photo credits are associated with the specific asset filenames,
so an unrelated replacement uploaded through admin does not inherit those credits.
Homepage and project-list previews use stable 16:9 frames with `object-fit: cover`.
Case-study pages show the full cover image at its natural aspect ratio.

The portrait mark was generated using `apps/web/public/profile.png` as the sole
likeness reference: a clean vector-like head-and-shoulders illustration preserving
Doni's glasses, hair, facial features, neutral jacket, and cobalt shirt, with a
mint background. The PNG is used for the website mark and RGBA app icons.
It is a raster illustration, not an SVG.

The committed assets are one-time deployment inputs. Runtime copies live under
the API upload folder, so the public frontend does not duplicate project media.

## Regression Checks

From the repository root, using the existing API TypeScript runner:

```sh
apps/api/node_modules/.bin/tsx --test apps/web/tests/article-content.test.ts
```

These checks cover Markdown/rich-HTML headings, sanitization, code and table
formatting, and portable upload URLs. The web production build and responsive
browser checks should also pass before deployment.
