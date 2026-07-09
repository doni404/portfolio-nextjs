# GitHub Actions CI/CD Plan

## Purpose

Use GitHub Actions as the main CI system for `doni404/portfolio-nextjs`, with Coolify handling production deployment.

The pipeline should protect code quality on pull requests and main branch changes. Production deployment should be managed by Coolify through GitHub integration or a deploy webhook after CI passes.

## Repository

- GitHub: `https://github.com/doni404/portfolio-nextjs`
- Default branch: `main`

## Pipeline Overview

### Pull Request CI

Runs on:

- Pull requests targeting `main`.

Required jobs:

- Install dependencies with pnpm.
- Generate Prisma client.
- Run lint.
- Run typecheck.
- Run unit tests.
- Run API tests against a test PostgreSQL service.
- Run build for Next.js and Express.js.
- Optionally run Playwright E2E tests.

Recommended commands:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm test:api
pnpm build
```

### Main Branch CI

Runs on:

- Push to `main`.

Required jobs:

- Run the same checks as pull request CI.
- Build production artifacts.
- Deploy to AWS EC2 only after checks pass.

### Production Deploy

Runs on:

- Successful push to `main`.
- Optional manual trigger through `workflow_dispatch`.

Deployment strategy:

- Preferred MVP: Coolify deploys from `main` using its GitHub integration.
- Optional later: GitHub Actions calls a Coolify deploy webhook after CI passes.
- Coolify installs dependencies, builds containers, runs configured deployment commands, and restarts applications.
- GitHub Actions can still run post-deploy smoke checks if deployment is triggered by webhook.

## Required GitHub Secrets

- `PRODUCTION_URL`
  - Public site URL, for example `https://doniputra.com`.

Optional secrets:

- `COOLIFY_DEPLOY_WEBHOOK`
  - Coolify webhook URL if GitHub Actions triggers deployment.
- `TESTSPRITE_API_KEY`
- `TESTSPRITE_PROJECT_ID`
- `SLACK_WEBHOOK_URL`

## Required GitHub Variables

- `NODE_VERSION`
  - Recommended: current LTS used by the project.
- `PNPM_VERSION`
  - Pin the pnpm version used by the project.

## Suggested Workflow Files

```text
.github/
  workflows/
    ci.yml
    deploy.yml
```

## Example `ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: portfolio_test
          POSTGRES_USER: portfolio
          POSTGRES_PASSWORD: portfolio
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://portfolio:portfolio@localhost:5432/portfolio_test
      NODE_ENV: test

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ vars.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ vars.NODE_VERSION }}
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma:generate
      - run: pnpm prisma:migrate:deploy
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm test:api
      - run: pnpm build
```

## Example `deploy.yml`

Use this only if you choose GitHub Actions to trigger a Coolify deploy webhook. If Coolify is configured for automatic push-to-deploy from `main`, this workflow is not required.

```yaml
name: Deploy

on:
  workflow_dispatch:
  push:
    branches: [main]

concurrency:
  group: production-deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Trigger Coolify deployment
        run: curl --fail --request GET "${{ secrets.COOLIFY_DEPLOY_WEBHOOK }}"

      - name: Smoke check
        run: |
          curl --fail ${{ secrets.PRODUCTION_URL }}
          curl --fail ${{ secrets.PRODUCTION_URL }}/api/health
```

## TestSprite Placement

Use TestSprite after the app is available in staging or production-like preview.

Recommended flow:

- Pull request CI runs deterministic local tests.
- Main branch deploys to staging or production.
- TestSprite runs critical user flows against the deployed URL.
- Production smoke checks run after deploy.

If TestSprite provides a GitHub Action or CLI in the implementation phase, add a separate job:

```text
testsprite:
  needs: deploy
  runs-on: ubuntu-latest
```

The job should use:

- `TESTSPRITE_API_KEY`
- `TESTSPRITE_PROJECT_ID`
- `PRODUCTION_URL` or staging URL.

## Deployment Safety

- Use GitHub Environments for production approval if manual review is desired.
- Use `concurrency` to prevent two deployments from running at the same time.
- Keep database migrations backward-compatible where possible.
- Back up PostgreSQL before risky schema changes.
- Store production application secrets in Coolify environment variables.
- Do not run destructive reset commands in production.

## Release Gate

Deployment is considered successful when:

- CI passes.
- Coolify deployment succeeds.
- Prisma migrations apply successfully through the Coolify deployment command.
- `GET /api/health` returns success.
- Homepage loads.
- Blog index loads.
- CV download works.
- TestSprite critical flows pass when enabled.
