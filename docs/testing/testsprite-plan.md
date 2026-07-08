# TestSprite Plan

## Purpose

Use TestSprite to validate the portfolio website against the PRD, API behavior, and user-facing flows. TestSprite should be used as the assisted product testing layer, while the repository should still keep local deterministic tests for daily development.

## Test Targets

- Frontend: Next.js app.
- Backend: Express.js API.
- Database: PostgreSQL managed by Prisma.
- CI/CD: GitHub Actions.
- Deployment target: AWS EC2 t3.nano, Amazon Linux 2023.

## Required Local Test Commands

These commands should exist before TestSprite is used in CI or release checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:api
pnpm test:e2e
pnpm prisma:migrate:deploy
pnpm db:seed
```

## Recommended Test Stack Under TestSprite

- Unit tests: Vitest.
- API integration tests: Vitest or Jest with Supertest.
- E2E/browser tests: Playwright.
- Database tests: Prisma against a disposable PostgreSQL test database.
- Contract reference: OpenAPI spec generated from or maintained beside Express.js routes.

## Test Environments

### Local

- Next.js dev server.
- Express.js dev server.
- PostgreSQL local database.
- Prisma migrations and seed data.

### Staging

- Same as production topology where possible.
- TestSprite should run against staging before production deployment.
- Use seed content that does not include private contact data.

### Production Smoke

- Run only non-destructive tests.
- Do not submit public comments unless using a clearly marked test article or hidden staging endpoint.
- Verify health, homepage, blog index, a blog detail page, CV download, and contact page load.

## TestSprite Inputs

Provide TestSprite with:

- GitHub repository: `https://github.com/doni404/portfolio-nextjs`.
- PRD: `docs/portfolio-website-prd.md`.
- Prisma schema: `docs/db/schema.prisma`.
- SQL schema reference: `docs/db/001_initial_schema.sql`.
- Seed plan: `docs/db/seed-plan.md`.
- API base URL for local/staging.
- Frontend base URL for local/staging.
- OpenAPI spec once backend routes are implemented.
- GitHub Actions plan: `docs/ci-cd/github-actions-plan.md`.

## Critical User Flows

### Portfolio Discovery

- Visitor opens home page.
- Visitor understands Doni's role and focus within the first viewport.
- Visitor navigates to Experience.
- Visitor opens Projects.
- Visitor opens Contact.

Expected result:

- All pages load successfully.
- Navigation is clear on desktop and mobile.
- No major layout overlap or unreadable text.

### Blog Reading

- Visitor opens `/blogs`.
- Visitor filters by category.
- Visitor searches with a keyword.
- Visitor opens a blog detail page.
- Visitor sees title, metadata, content, tags, related articles, and comments.

Expected result:

- Blog list returns published posts only.
- Filtering and search return relevant results.
- Blog detail page is readable on mobile and desktop.

### Comment Submission

- Visitor opens a blog detail page.
- Visitor fills comment name, email, optional website, and content.
- Visitor submits comment.

Expected result:

- API creates comment with `pending` status.
- Public page does not show the pending comment.
- Approved comments are visible.
- Invalid email, empty content, and excessive content length are rejected.
- Rate limit blocks repeated abuse.

### Contact Submission

- Visitor opens Contact.
- Visitor submits name, email, optional company, subject, and message.

Expected result:

- API creates contact submission with `new` status.
- Invalid email and empty message are rejected.
- Rate limit blocks repeated abuse.

### Admin CMS

- Admin opens `/admin/login`.
- Admin logs in with valid credentials.
- Admin creates a draft blog post.
- Admin previews and publishes the blog post.
- Admin edits a project.
- Admin reorders or edits an experience entry.
- Admin approves a pending comment.
- Admin marks a contact submission as read.
- Admin logs out.

Expected result:

- Unauthenticated users cannot access `/admin`.
- Valid admin can manage blog, project, and experience content.
- Public pages only show published content.
- Admin actions update audit logs.
- Invalid login is rejected.

### CV Download

- Visitor clicks "Download CV".

Expected result:

- CV PDF downloads or opens successfully.
- Missing CV asset shows a graceful fallback.

## API Tests

Required endpoint coverage:

- `GET /api/health`
- `GET /api/profile`
- `GET /api/experiences`
- `GET /api/projects`
- `GET /api/projects/:slug`
- `GET /api/blogs`
- `GET /api/blogs/:slug`
- `GET /api/blogs/:slug/comments`
- `POST /api/blogs/:slug/comments`
- `POST /api/contact`
- `GET /api/assets/cv`
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/blogs`
- `POST /api/admin/blogs`
- `PATCH /api/admin/blogs/:id`
- `GET /api/admin/projects`
- `PATCH /api/admin/projects/:id`
- `GET /api/admin/experiences`
- `PATCH /api/admin/experiences/:id`
- `GET /api/admin/comments`
- `PATCH /api/admin/comments/:id/status`
- `GET /api/admin/contact-submissions`
- `PATCH /api/admin/contact-submissions/:id/status`

Required negative tests:

- Unknown project slug returns 404.
- Unknown blog slug returns 404.
- Draft blog posts are not public.
- Pending/rejected/spam comments are not public.
- Invalid comment payload returns 400.
- Invalid contact payload returns 400.
- Excessive submission rate returns 429.
- Unauthenticated admin request returns 401.
- Admin request with insufficient or invalid session returns 401.
- Admin publish with invalid slug or missing title returns 400.

## Database Tests

- Prisma migration applies cleanly to an empty PostgreSQL database.
- Seed script creates required author, categories, tags, posts, projects, experience, education, certifications, skills, and CV asset.
- Seed script can be rerun without duplicate records.
- Deleting a blog post cascades join records and comments as designed.
- Blog search returns published posts and excludes drafts.

## Release Gate

Release is allowed when:

- TestSprite critical flows pass on staging.
- Local lint, typecheck, unit, API, and E2E tests pass.
- Prisma migrations apply cleanly.
- Seed script runs successfully on a fresh database.
- Production smoke checks pass after deployment.
