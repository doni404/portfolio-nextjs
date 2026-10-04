# GitHub Images and Coolify Deployment

The implemented workflow is `.github/workflows/images.yml`. Production images
are built on GitHub-hosted Ubuntu runners, not on the portfolio EC2 instance.
Coolify pulls and runs the images; PostgreSQL and uploads remain on EC2.

## Pipeline

1. Pull requests and relevant `main` pushes run the deployment-script tests, API
   build/tests, and web lint/tests/typecheck with Node 22 and the npm lockfiles.
2. Main pushes build separate Linux AMD64 API and web images. The web image uses
   Next.js standalone output. Both images run as the non-root `node` user.
3. Images are published to private GHCR packages with immutable commit tags:
   - `ghcr.io/doni404/portfolio-nextjs-api:sha-<full-commit-sha>`
   - `ghcr.io/doni404/portfolio-nextjs-web:sha-<full-commit-sha>`
4. When `COOLIFY_DEPLOY_ENABLED=true`, the deploy job validates that both targets
   are Docker Image applications, sets the API tag, and requests deployment.
5. It waits for Coolify success and an HTTPS health response with the exact
   revision before deploying and checking the web image.

The workflow is serialized. API and web builds may run in parallel on separate
GitHub runners, but deployments to the small EC2 instance run sequentially.
Pull requests never publish images or use production credentials. Manual runs
can build without deploying by clearing the `deploy` input.

## Repository Variables

Set these under GitHub Settings > Secrets and variables > Actions > Variables.

| Variable | Value |
| --- | --- |
| `COOLIFY_URL` | `https://coolify.doniputra.com` |
| `COOLIFY_API_APP_UUID` | UUID of the new API Docker Image application |
| `COOLIFY_WEB_APP_UUID` | UUID of the new web Docker Image application |
| `COOLIFY_DEPLOY_ENABLED` | `false` during setup; `true` after cutover |
| `NEXT_PUBLIC_SITE_URL` | `https://doniputra.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.doniputra.com` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Existing public GA4 measurement ID |
| `GOOGLE_SITE_VERIFICATION` | Existing public verification value, if used |

The public URL defaults are in the workflow, but the GA and verification values
must be supplied to preserve those integrations. `NEXT_PUBLIC_*` values are
compiled into the web image; changing them requires a new image build.

## Credentials

- The workflow uses its short-lived `GITHUB_TOKEN` to publish packages. No
  personal write token is needed for builds.
- GitHub secret `COOLIFY_TOKEN` holds a Coolify API token with Read, Write, and
  Deploy permissions, without Root or Read sensitive data. Treat it as a
  production credential. Use a bounded expiry and rotate it before expiration.
- EC2 needs a GitHub credential with only `read:packages` for private GHCR pulls.
  Authenticate Docker as Coolify's configured server user. Do not put this
  credential in the repository, image, build arguments, or workflow logs.
- Runtime database/authentication secrets stay in Coolify and are not passed to
  the image build. Docker contexts exclude `.env*`, keys, dumps, and uploads.

See `docs/deployment/github-images-coolify.md` for the first cutover, storage,
migrations, verification, and rollback. Leave the old source applications on
manual deployment and keep them until the image deployment has been verified.

## Billing

Standard GitHub-hosted runners are free for public repositories. Personal
GitHub Free accounts include 2,000 minutes per month for private repositories;
check account usage before enabling paid overages. GHCR container storage and
bandwidth are currently free, but this can change. External builds improve EC2
deployment load; they do not eliminate EC2, EBS, or public IPv4 charges.

Official references:
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/billing/concepts/product-billing/github-packages
