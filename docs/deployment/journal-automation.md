# Journal Automation

## Current Defaults

- Automation OFF; two draft attempts per day, adjustable from 1 to 5.
- $5 monthly estimated AI budget, adjustable in admin. Budget takes priority over daily cadence.
- Human review is required to publish every AI-generated draft. The worker cannot publish.
- Images are optional. Generated covers are labeled as editorial illustrations, not product screenshots.
- Discovery uses Google Trends US/Indonesia/Japan RSS, Google News technology and Japan daily-life coverage, recent arXiv AI papers, and source-backed web research. Trends supplies approximate search-interest hints when available; the other feeds supply recent headlines. These are hints, not proof of social virality or measured Google search-result positions. Instagram and Threads are not scraped. The worker researches one selected beat per slot, not every configured topic with a separate paid search. Within that beat, the model weighs freshness, source quality, concrete reader impact, and optional search-interest hints; it does not produce a measured numeric viral ranking.
- Defaults rotate across industry/leadership, policy/safety, work/education, consumer products, science/research, cloud/security/devtools, and model releases. Selection favors under-covered beats in the last ten articles. With other beats enabled, at most one of the last five new articles is a model-release story. Custom topics remain configurable in admin.
- Each live draft stores its editorial beat and a concrete newsworthiness rationale. Industry/policy research requires at least two source domains and attributed disputed claims. A slot without a verified fresh story fails safely instead of inventing a story or silently switching to another model launch.
- When Japan and other topics are enabled, a three-attempt day reserves **slot 1 for Japan Life**, then two rotating non-Japan beats. Two attempts reserve one for each group; four/five reserve two Japan slots. With one attempt, the groups alternate on consecutive Jakarta dates. Japan is not added if it is absent from the topic settings. The admin shows the saved daily plan. This is an attempt allocation, not a promise of completed articles: budget, evidence failures, outages, and a paused worker still take priority. Failed slots are not replaced by extra paid attempts. Existing posts/drafts remain unchanged.
- If research misspells a source URL, one separately budgeted `source_resolution` call can match it to the same article among the retrieved URLs. Its structured output cannot invent a new URL or change facts/dates. An uncertain match fails safely; there is no paid retry loop. Exact retrieved references are preserved.
- Docker builds run in GitHub Actions. A lightweight Coolify scheduled task orchestrates remote OpenAI requests; it does not run AI models or build images on EC2. GitHub's editorial workflow is a manual fallback, not the daily scheduler.
- Text research, writing, and review use `gpt-6-luna` with low reasoning effort. Covers use `gpt-image-2.5-flare`, medium quality, at 1536x864.
- AI selects `smooth-light` or `bold-dark` for each story, with a saved rationale and short factual headline. Relevant brands may appear as editorial references; named public leaders use clearly illustrated portraits, not invented event photos. The review stage checks this direction before generating a cover.
- New automated drafts over three minutes include one professional in-article explainer image; seven-minute-or-longer drafts include two. This uses actual prose length at 220 words/minute, excluding sources and placement markers. AI chooses a source-grounded workflow, comparison, or checklist beside the relevant section, not a repeated cover. Its visual plan is checked during the existing consistency review and, if necessary, the single allowed revision. Diagrams are rendered locally as small, immutable SVG images in the persistent API uploads folder, with escaped text, no scripts/remote assets, descriptive alt text, captions, reserved dimensions, and full-size links. There is **no additional paid image API request**; visual-plan tokens are included in the normal writing/review usage logs and monthly budget. Images inside the article do not depend on the optional cover toggle. Existing articles are not silently rewritten, and legacy worker drafts stay compatible during rolling deployment.

## Deploy Code And Content Separately

Do not replace the production database with a local dump. Preserve production messages, comments, admin accounts, and projects.

1. Back up production PostgreSQL and the API uploads volume.
2. Deploy the updated API image through the existing CI/CD workflow. The image starts with `npm run db:migrate` (`prisma migrate deploy`), then starts the API only after migrations succeed. These migrations are additive; repeated starts apply only pending migrations. Keep Coolify's command override empty so this startup step is not bypassed. Do not reset or seed the database.
3. In the **portfolio API** container terminal, run the journal import in `/app`:

   ```sh
   npm run content:journal
   npm run content:journal -- --apply
   ```

   The first command is a dry run. The second backs up and soft-deletes the six known sample slugs, then inserts missing archive posts. For installations with the initial model-heavy archive, it also retires ten explicitly listed, untouched seeded posts. Edited or unrelated posts are preserved and reported. It does not overwrite posts already imported. Covers are copied into the persistent API uploads directory.

4. Preserve the printed `storage/backups/journal-.../backup.json` outside the container before redeploying. An uploads-only mount does **not** persist `storage/backups`; copy it to your backup destination or set `EDITORIAL_BACKUP_DIR` to a dedicated persistent mount.
5. Deploy the web image, then verify `/blogs`, each year filter, RSS, sitemap, and `/admin/automation`.

After the generated initial covers are packaged in the API image, install them without new OpenAI charges:

```sh
npm run content:journal-covers:install
npm run content:journal-covers:install -- --apply
```

This backs up old cover references, preserves edited article text and custom uploaded covers, and copies packaged assets into persistent uploads. The journal import already selects these covers for newly inserted posts. Do not run the paid `content:journal-covers -- --apply` command on production to reproduce existing artwork; that command generates new images and records their charges.

Do **not** run `db:reset`, `prisma migrate reset`, or the legacy `db:seed` in production. The legacy bootstrap seed contains demo messages and articles.

When local paid tests used the same OpenAI project, transfer their usage history so the production monthly budget includes those calls. With automation OFF, export to an ignored backup file using `node scripts/transfer-editorial-usage.mjs --export storage/backups/local-usage.json`. Transfer that file privately, then run `node scripts/transfer-editorial-usage.mjs --import /private/path/local-usage.json` for a dry run, and repeat with `--apply`. Existing job IDs are preserved, imports use maintenance slots, uncertain charges remain held, and no local accounts, lease tokens or draft contents are exported. Do not commit this file.

The archive contains 5 posts about 2024 events, 5 about 2025, and 3 about 2026. `story_date` is the original announcement date; `published_at` is the actual import/publication date. Search structured data does not backdate publication. These are retrospective explainers, not historical breaking-news posts.

The mixed archive covers AI leadership, labor-market research, personal privacy, search, regulation, a software outage, developer tooling, support lifecycles, and science. Only two of the thirteen pieces are model-release explainers. The September 2026 pacing article distinguishes a public proposal and reported support from a binding agreement.

To undo an import, use its backup:

```sh
npm run content:journal -- --restore /path/to/backup.json
npm run content:journal -- --restore /path/to/backup.json --apply
```

Restore refuses to overwrite posts edited since the import. Original comments remain attached to their original, archived posts.

## Configure The Worker

1. Generate a dedicated random worker token of at least 32 characters, for example `openssl rand -hex 32`. Store it securely; never commit it or paste it into chat.
2. Add runtime variables to the **API** in Coolify:

   ```dotenv
   AUTOMATION_WORKER_TOKEN=<dedicated token>
   OPENAI_API_KEY=<restricted OpenAI project key>
   FRONTEND_URL=https://doniputra.com
   ```

   Enable at runtime, not build time. Restart/redeploy the API after changing runtime configuration. Email is optional. Configure SES using the section below, or keep the existing Resend adapter with `EDITORIAL_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and a verified `EDITORIAL_EMAIL_FROM`.

3. For the optional manual GitHub fallback, under repository **Settings > Secrets and variables > Actions**, add encrypted secrets:
   - `OPENAI_API_KEY`: a dedicated restricted OpenAI project key.
   - `AUTOMATION_WORKER_TOKEN`: the matching token from the API.
4. For that fallback, add repository variables:
   - `EDITORIAL_API_URL=https://api.doniputra.com`
   - `EDITORIAL_WORKER_ENABLED=true`
5. In `/admin/automation`, choose Morning (09:00), Evening (19:00), or a custom time in Asia/Jakarta. Set topics, daily count, monthly limit, and cover preference. The review email can stay blank. Save with automation OFF first.
6. In Coolify **portfolio-api-ghcr > Scheduled Tasks**, create **Prepare journal drafts** with frequency `*/10 * * * *`, timeout `1800` seconds, and command:

   ```sh
   cd /app && EDITORIAL_API_URL=http://127.0.0.1:4000 node --max-old-space-size=128 scripts/editorial-worker.mjs
   ```

   Leave the container name blank for this single-container application. The task inherits runtime credentials; do not put secrets in its command. For another API port, adjust the loopback URL. Coolify records every execution and output. The DB locks prevent overlapping workers from starting duplicate jobs.
7. With automation OFF, use **Execute Now** and verify Success and a fresh authenticated heartbeat. This makes no paid requests. Confirm **Worker connected** in admin, then enable automation when ready. Review the first draft, sources, costs, and cover before leaving automation ON.

Coolify checks every ten minutes while the server and API are running. The API starts draft preparation only at or after the selected Jakarta time, and enforces the daily quota even for manual runs. A server outage delays preparation until a later check on the same day; missed days are not backfilled. This is preparation cadence, not automatic publishing: every draft still needs human approval. Failed attempts also count toward the daily quota to prevent retry loops. GitHub cron was removed because checks were delayed/dropped and one job could not acquire a hosted runner. See [GitHub schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [Coolify scheduled tasks](https://coolify.io/docs/core/automation/scheduled-tasks/overview).

Worker status comes from the last authenticated heartbeat, not a manual environment flag. A heartbeat remains fresh for 90 minutes. With a configured token but no fresh heartbeat, admin shows **Waiting for heartbeat**. An OFF run still refreshes the connection and makes no OpenAI requests. A credential-only local check is available with `node scripts/editorial-worker.mjs --heartbeat-only`.

Turning OFF in admin blocks new jobs and new paid stages. An already-started provider request may finish and be logged; its result can still be saved as an unpublished draft. Disable the Coolify task as a second stop control when needed. `EDITORIAL_WORKER_ENABLED` controls only the manual GitHub fallback.

## Configure AWS SES Notifications

SES sends transactional notifications; it is not a mailbox. Use `Doni Putra Journal <info@doniputra.com>` as the visible sender and a monitored Reply-To, currently `doniputrapurbawa@gmail.com`. A Hostinger mailbox can receive mail for `info@` later while SES continues sending from either EC2 or another hosting provider. Do not replace the domain's existing mailbox MX records with SES receiving records just to send notifications.

1. The supplied SES screenshot confirms `doniputra.com` is verified in Jakarta (`ap-southeast-3`). No separate mailbox or `info@` identity is required for basic sending from this domain. Keep this region for the API, and verify its DKIM status. Review existing DMARC and SPF records before making changes; do not create duplicate SPF TXT records. If using a custom MAIL FROM, use a dedicated subdomain such as `bounce.doniputra.com` and the region-specific records SES supplies for that subdomain.
2. In sandbox mode, verify the review recipient as well (`doniputrapurbawa@gmail.com`). Sandbox status and identities are region-specific. For sending to unverified recipients later, request production access and configure bounce/complaint handling first. These notifications go only to the owner-selected review address; this is not a bulk newsletter implementation.
3. Prefer an EC2 instance role with least-privilege `ses:SendEmail` permission. Verify the Docker container can resolve that role through the SDK credential chain. Do not open metadata access broadly across unrelated containers. If no working role is available (including a later non-AWS host), provide dedicated, restricted credentials as API runtime secrets, never GitHub build args or web variables. A scoped example, replacing region/account and identity as appropriate:

   ```json
   { "Version": "2012-10-17", "Statement": [{ "Effect": "Allow", "Action": "ses:SendEmail", "Resource": ["arn:aws:ses:REGION:ACCOUNT_ID:identity/doniputra.com", "arn:aws:ses:REGION:ACCOUNT_ID:identity/doniputrapurbawa@gmail.com"], "Condition": { "StringEquals": { "ses:FromAddress": "info@doniputra.com" }, "ForAllValues:StringEquals": { "ses:Recipients": ["doniputrapurbawa@gmail.com"] } } }] }
   ```

   For a new installation, create an IAM role named **portfolio-ses-notifications** with trusted entity **AWS service > EC2**, then **Add permissions > Create inline policy > JSON** using [`portfolio-ses-send-policy.json`](./portfolio-ses-send-policy.json). Name the policy **PortfolioSESNotificationSend**. This deployment already uses role **PortfolioSESNotificationSend** and inline policy **PortfolioSESNotificationSendPolicy**; edit that existing policy rather than creating or replacing its role. The policy is scoped to the verified Jakarta identities, the `info@` sender, and the owner's Gmail recipient, not general AWS administrator access. In sandbox mode, SES also authorizes the verified recipient identity: include its exact ARN or sending can fail with `AccessDeniedException` naming that recipient. If the review recipient changes, verify it in the same region and update both its resource ARN and recipient condition. Keep the personal IAM user `u-doni` separate; do not generate personal-user keys for the app. Attach the role through **EC2 > Instance > Actions > Security > Modify IAM role**. If an instance profile is already attached, add the scoped SES policy to its existing role instead of replacing unrelated permissions. Before changing the EC2 metadata hop limit for Docker, inspect its current configuration and assess exposure to other containers; do not blindly make metadata accessible. Test the SDK from the API container without printing temporary credentials.

4. In Coolify **portfolio-api-ghcr > Environment Variables**, set Runtime ON / Buildtime OFF:

   ```dotenv
   EDITORIAL_EMAIL_PROVIDER=ses
   SES_REGION=ap-southeast-3
   EDITORIAL_EMAIL_FROM=Doni Putra Journal <info@doniputra.com>
   EDITORIAL_EMAIL_REPLY_TO=doniputrapurbawa@gmail.com
   FRONTEND_URL=https://doniputra.com
   # Only when a working role is not available:
   AWS_ACCESS_KEY_ID=<dedicated restricted IAM access key>
   AWS_SECRET_ACCESS_KEY=<secret key>
   # AWS_SESSION_TOKEN=<token, only when using temporary credentials>
   ```

5. Restart the API. In `/admin/automation`, save the review email address, then click **Send test email**. The route is owner-only, uses only the saved recipient, is limited to three requests per minute (shared with resends), and records a safe audit result. Confirm the email in the inbox or spam folder. No OpenAI request or article publication occurs during this test.
6. Each completed automated draft triggers a text/HTML review notification with its title, summary, and authenticated admin link. A database compare-and-set prevents concurrent sends for the same job. `sent` means accepted by the provider, **not confirmed inbox delivery**. `unknown` means the response was ambiguous; `sending` may mean an interrupted process. Check the provider/inbox before manually resending. SES requests use one attempt and are never automatically retried after a timeout. Configuration readiness is not a claim that IAM, DKIM, sandbox permissions, or delivery have been verified.

The existing AI budget excludes SES fees. Check the selected SES pricing plan; the published à-la-carte outbound rate is $0.10 per 1,000 recipients, while newer accounts may default to Essentials at $0.16 per 1,000. At three owner notifications per day (90/month), base sending is roughly $0.009–$0.0144, before optional features, data charges, taxes, and credits. Do not enable paid add-ons for this low-volume test.

References: [SES identities](https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html), [SES sandbox](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html), [SDK credential chain](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html), [SES pricing](https://aws.amazon.com/ses/pricing/).

## Budget And Logs

Each stage must reserve funds before contacting OpenAI. Research, writing, review, and cover generation have separate request IDs, token counts, estimated cost, and a pricing snapshot. Unknown usage stays reserved rather than appearing free. Ambiguous paid failures are not retried automatically. An expired job blocks further jobs until stopped from admin; its uncertain cost remains held.

The dashboard shows today's attempts and the same schedule/quota/budget gates used when claiming a job. Research failures include safe reason codes (for example, a source was not retrieved or an event is stale), never provider messages or credentials. Research source URLs must match retrieved evidence. Only AP headline-slug aliases with the same immutable article ID and standard tracking parameters are normalized back to the exact retrieved URL; unrelated paths, hosts and data query parameters remain distinct.

A rejected consistency review can request one deliberate writing revision and one new review, with separate `revision` and `revision_review` usage entries. If that review still rejects the draft, the job stops; there is no revision loop. Initial archive-cover maintenance is logged and budgeted but uses negative slots so it does not consume scheduled news quota.

Estimates are **not invoices or an absolute provider spending cap**. A running request can exceed its reservation; unrelated uses of the same key are not tracked. Use a dedicated OpenAI project, its billing alerts, and the provider billing dashboard. UTC defines billing months; Jakarta time defines daily quota resets.

The 2026-10-05 local Luna test cost approximately $0.029 for research, writing, review, one revision, a second review, and a low-quality cover. The 13 initial medium-quality covers averaged approximately $0.009 each; substituting a medium cover gives an estimate around $0.034 per similar draft (roughly 29 per $1). These are one-run workload estimates, not guaranteed yields. Budget for 20-30 articles per $1 to allow longer searches and rejected jobs. At a similar workload, 60 drafts would cost about $2 before contingency, taxes, email, and hosting. Human review remains required to publish. The initial archive import makes no paid API calls; optional cover generation does.

Current model/rate defaults were checked on 2026-10-05. The shared `src/lib/editorial-models.json` configures model IDs and standard rates for both worker and API. Each reservation keeps its own pricing snapshot; historical GPT-5.4 Mini costs are not repriced as Luna costs. References: [OpenAI pricing](https://developers.openai.com/api/docs/pricing), [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [web search](https://developers.openai.com/api/docs/guides/tools-web-search), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [image generation](https://developers.openai.com/api/docs/guides/image-generation).

## Connect Real GA4 Reporting

The public measurement tag and server reporting credentials are separate. A `G-...` measurement ID is **not** the numeric property ID.

1. In Google Cloud, enable **Google Analytics Data API** for the service-account project.
2. Create a dedicated service account. Download its JSON key and protect it as a secret.
3. In GA4 **Admin > Property access management**, grant the service-account email **Viewer** access to this property's reports.
4. Add API runtime variables in Coolify:

   ```dotenv
   GA4_PROPERTY_ID=<numeric property ID>
   GOOGLE_SERVICE_ACCOUNT_JSON=<complete JSON on one line>
   ```

5. Restart the API and open `/admin/analytics`.

For local development, store the JSON in project-root `.secrets/`, ignore that directory in Git, and set `GOOGLE_APPLICATION_CREDENTIALS` to the file's absolute path in `apps/api/.env`. Restrict the directory to mode `700` and the JSON to `600`. Never store it under `public/`, uploads, or a committed config folder. Inline `GOOGLE_SERVICE_ACCOUNT_JSON` takes precedence when both methods are configured. For a production file-based setup, use a read-only secret mount rather than copying the key into the image. The key does not need build-time availability.

Reports show actual active users, sessions, views, engagement, journal articles, landing pages, sources, and reader events through yesterday. They are cached for five minutes. Google reporting delay, privacy thresholds, consent, and ad blockers can affect counts. Missing credentials show a disconnected state, not invented visitor counts. Article likes are stored separately in PostgreSQL; they are anonymous actions, not verified unique people.

Reference: [GA4 Data API quickstart](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart).

## Editorial Review

Open a draft from its email or the admin job history. Check every material claim against the source, confirm dates, label vendor benchmarks and preprints, review the illustration, and add your engineering perspective. Confirm the review checkbox before publishing.

The model consistency check is not independent fact verification. Original synthesis plus citations reduces copying risk but cannot guarantee originality or SEO rankings. Do not auto-publish medical advice, confidential material, unsupported performance claims, or low-value rewrites. Interactive flows are safe structured steps rendered by the site, never generated executable JavaScript.

## Verification

For an explicit paid local smoke test, with automation OFF and a positive configured budget:

```sh
npm run editorial:test
```

The runner refuses production/remote databases, starts an isolated authenticated loopback worker, runs one real job, captures paid responses in ignored `storage/backups/editorial-test-*`, and restores automation OFF. No draft is automatically published. `--maintenance` explicitly logs a diagnostic job outside scheduled slots, still enforcing all paid-stage budget reservations. Never use it as a scheduled quota bypass. Known completed responses from a failed test can be resumed explicitly with `--resume <job-id> --backup <local-response-directory>`; uncertain usage or an existing draft refuses recovery. Email is skipped when not configured. This does not configure a production worker or SES.

```sh
cd apps/api
npm run db:generate
npm run build
node --test tests/*.test.mjs
cd ../web
npm run lint
npm run typecheck
npm test
```

Tests mock paid generation. No OpenAI key is needed to test the pipeline. Existing Prisma transitive dependency audit findings should be addressed in a separate dependency-maintenance change rather than an unreviewed major upgrade here.
