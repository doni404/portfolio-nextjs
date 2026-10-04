# Deploy Prebuilt GitHub Images to Coolify

## Safety Rules

- Do not run `db:reset`, `db:seed`, or restore a local database over production.
- This release changes packaging, not the database schema.
- Keep the PostgreSQL resource and existing uploaded media volume unchanged.
- Leave source-built applications available for rollback, with auto deploy off.
- Use Docker Image resources, not source-build resources or Compose `build:`.
- Keep server Concurrent builds set to 1.

## Before the First Switch

1. Stop or cancel any active source build in Coolify. Confirm there is no active
   build and that the existing containers have recovered.
2. Set both existing applications' Advanced > Deployment > Auto deploy to
   **Manual deployments only** before pushing the workflow commit.
3. Back up the production PostgreSQL database and the uploads volume. Validate
   the database archive with `pg_restore --list` and the media archive with
   `tar -tzf`. A backup on the same EC2 disk is useful for rollback, not disaster
   recovery; keep another encrypted copy off-instance.
4. Configure the GitHub variables and `COOLIFY_TOKEN` secret described in
   `docs/ci-cd/github-actions-plan.md`, with deployment disabled initially.
5. Push `main` and confirm both private GHCR images exist and checks are green.
6. Log Docker into GHCR on the deployment server using the read-only package
   credential. Use `--password-stdin`, never a password command-line argument.

## Create Image Applications

Create two **Docker Image** resources in the existing production environment.
Use the exact image names and `sha-<full-commit-sha>` tag from the successful
GitHub run. No install, build, or custom start command is needed.

| Setting | API | Web |
| --- | --- | --- |
| Image | `ghcr.io/doni404/portfolio-nextjs-api` | `ghcr.io/doni404/portfolio-nextjs-web` |
| Exposed port | `4000` | `3000` |
| Health path | `/api/health` | `/api/health` |
| Health host/scheme | `127.0.0.1`, HTTP | `127.0.0.1`, HTTP |
| Health start period | 60 seconds | 60 seconds |
| Production domain | `https://api.doniputra.com` | `https://doniputra.com` |

Do not give the replacement and old application the same public domain at the
same time. First start/check replacements without the production domain, then
move the domain from the old application to the healthy replacement. Expect a
brief routing transition. Do not delete the old applications during cutover.

Copy the existing runtime variables into the replacement application without
changing values or printing credentials. In particular:

- API: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL=https://doniputra.com`,
  `UPLOAD_DIR=/app/storage/uploads`, and any existing email/provider settings.
- Web: `API_URL` pointing to the reachable API service (the HTTPS public API
  URL also works), plus existing runtime configuration.
- `NODE_ENV=production` is already in both runtime images. Build-time public
  settings now belong in GitHub variables, not only in Coolify.

## Preserve Uploaded Images

The existing API volume is:

```text
j62mt819r6nw6p75d21mch4w-portfolio-api-uploads
```

Mount **that same existing volume**, not a new empty volume, at:

```text
/app/storage/uploads
```

Coolify may prefix newly created volume names with the new resource UUID. Check
the effective Docker mount, not only the label shown in the form. An absolute
bind mount to the existing data directory is an alternative when reuse is not
available, but it ties the application to this host. Do not delete the original
volume even if a bind mount is used.

The new image runs as UID/GID 1000. Check the existing directory ownership and
make it writable by this user before deployment. After a verified backup, a
one-time `chown -R 1000:1000` on **only the verified uploads data directory** is
appropriate. Never use world-writable permissions or change PostgreSQL storage
ownership. Test a disposable file create/delete as the container's normal user.

Confirm old project/blog cover URLs return image content, not an HTML error.
Package content images are not a replacement for persistent uploads.

## Enable Automatic Deployment

1. Put the replacement UUIDs in `COOLIFY_API_APP_UUID` and
   `COOLIFY_WEB_APP_UUID`. The script refuses targets connected to a Git source.
2. Verify public health endpoints identify the new full commit revision.
3. Set `COOLIFY_DEPLOY_ENABLED=true`.
4. Run the workflow manually with deployment enabled to verify the full chain.
5. Future relevant pushes to `main` now build on GitHub and deploy API, then web.

The workflow updates only the image tag. It does not change domains, secrets,
storage, permissions, database contents, or schema. A failed API deployment
prevents web deployment. A healthy response from an old revision does not pass.

## Future Database Migrations

The API runtime contains the Prisma 6 CLI, schema, and migration history. After
backup and review, run this inside the **API container**, not the PostgreSQL
shell or EC2 home directory:

```bash
npm run db:migrate
```

It runs `prisma migrate deploy`, applying only pending migrations. Never use
`migrate dev`, `reset`, or seeds in production. For future schema changes, plan
backward-compatible migrations and explicit ordering before deployment; the
current CI does not apply them automatically.

Dependency audit note: Prisma 6's CLI currently pulls a `deepmerge-ts` version
with a stack-exhaustion advisory. The CLI only processes trusted local
configuration here, not public API input. Upgrading Prisma across a major
version requires a separate migration review; do not use a forced audit fix
on production. The compatible Next.js, editor, and upload middleware fixes
are included in this release.

## Verify and Roll Back

Check API health/DB connection, web health revision, homepage, project detail
pages, blog detail pages, RSS, sitemap, robots, social images, and an existing
uploaded cover. Confirm the admin login and counts still match production.

For an application-only rollback, select the previous known-good `sha-...` tag
in the relevant Docker Image application and deploy it. If API and web must
roll back together, restore API first and verify health before web. This does
not roll back database migrations or content edits. Do not blindly retry a
timed-out job; inspect Coolify's deployment status first to avoid duplicate
requests.

Keep production backups off-instance before removing old image/application
resources. Registry images are release artifacts, not database or media backups.
