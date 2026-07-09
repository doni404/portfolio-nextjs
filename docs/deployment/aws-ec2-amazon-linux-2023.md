# Manual AWS EC2 Deployment Plan: Amazon Linux 2023

## Status

This is now the manual fallback plan.

Primary recommended deployment plan: `docs/deployment/coolify-aws-ec2-amazon-linux-2023.md`.

Use this document only if Coolify is not used.

## Target

- Instance type: t3.micro minimum.
- Operating system: Amazon Linux 2023.
- Runtime: Node.js.
- Frontend: Next.js.
- Backend: Express.js.
- Database: PostgreSQL installed on the same EC2 instance.
- Reverse proxy: Nginx.
- Process manager: PM2 or systemd.
- ORM/migrations: Prisma.
- CI/CD: GitHub Actions.
- GitHub repository: `https://github.com/doni404/portfolio-nextjs`.

## Important t3.micro Constraints

t3.micro is acceptable for a low-traffic personal portfolio MVP, but it has limited memory. Use it carefully.

Required mitigations:

- Add swap space.
- Keep only essential services running.
- Use production builds, not dev servers.
- Run one Next.js process and one Express.js process.
- Configure log rotation.
- Monitor memory and disk usage.
- Upgrade to t3.small if builds, PostgreSQL, or runtime memory become unstable.

## Suggested Ports

- Nginx: `80`, `443`
- Next.js frontend: `3000`
- Express.js API: `4000`
- PostgreSQL: `5432`, local-only

PostgreSQL should not be publicly accessible. Keep port `5432` closed in the EC2 security group.

## EC2 Security Group

Allow inbound:

- SSH `22` from trusted IP only.
- HTTP `80` from internet.
- HTTPS `443` from internet.

Do not allow inbound:

- PostgreSQL `5432` from internet.
- Next.js `3000` from internet.
- Express.js `4000` from internet.

## Server Setup

Update packages:

```bash
sudo dnf update -y
```

Install useful tools:

```bash
sudo dnf install -y git nginx tar gzip
```

Add swap space:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Install Node.js. Prefer the current project LTS version when the implementation starts:

```bash
node --version
npm --version
```

If Node.js is not installed, install it through an approved project method such as NodeSource, nvm for the deploy user, or the Amazon Linux package repository.

Install pnpm:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## PostgreSQL Setup

Install PostgreSQL after confirming the desired version for Amazon Linux 2023:

```bash
sudo dnf install -y postgresql15 postgresql15-server
```

Initialize database:

```bash
sudo postgresql-setup --initdb
```

Enable and start PostgreSQL:

```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
```

Create application database and user:

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE portfolio;
CREATE USER portfolio_app WITH ENCRYPTED PASSWORD 'replace-with-strong-password';
GRANT ALL PRIVILEGES ON DATABASE portfolio TO portfolio_app;
\q
```

The app `DATABASE_URL` should look like:

```text
postgresql://portfolio_app:replace-with-strong-password@localhost:5432/portfolio
```

## Application Environment

Create production env files during implementation:

```text
DATABASE_URL=postgresql://portfolio_app:replace-with-strong-password@localhost:5432/portfolio
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://doniputra.com
API_BASE_URL=https://doniputra.com/api
CONTACT_NOTIFICATION_EMAIL=doniputrapurbawa@gmail.com
ADMIN_SEED_PASSWORD=replace-with-strong-initial-password
SESSION_SECRET=replace-with-long-random-secret
```

Recommended secrets:

- `DATABASE_URL`
- `SESSION_SECRET` if admin auth is added.
- `ADMIN_SEED_PASSWORD` for creating the first admin owner account.
- `CONTACT_NOTIFICATION_EMAIL` if email notification is added.
- SMTP credentials if email notification is added.

## Build And Migration Flow

GitHub Actions plan: `docs/ci-cd/github-actions-plan.md`.

From the repository root:

```bash
git clone https://github.com/doni404/portfolio-nextjs.git
cd portfolio-nextjs
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm db:seed
pnpm build
```

Expected package scripts:

```json
{
  "scripts": {
    "build": "pnpm --filter web build && pnpm --filter api build",
    "prisma:generate": "pnpm --filter api prisma generate",
    "prisma:migrate:deploy": "pnpm --filter api prisma migrate deploy",
    "db:seed": "pnpm --filter api prisma db seed"
  }
}
```

## Process Management

### Option A: PM2

Install PM2:

```bash
pnpm add -g pm2
```

Start services:

```bash
pm2 start apps/api/dist/server.js --name portfolio-api
pm2 start "pnpm --filter web start" --name portfolio-web
pm2 save
pm2 startup
```

### Option B: systemd

Use systemd if you prefer native Linux service management. Create separate services:

- `portfolio-api.service`
- `portfolio-web.service`

Each service should run as a non-root deploy user.

## Nginx Reverse Proxy

Nginx should:

- Proxy `/api` to Express.js on `localhost:4000`.
- Proxy all other routes to Next.js on `localhost:3000`.
- Serve HTTPS through Let's Encrypt.

Example server block:

```nginx
server {
  listen 80;
  server_name doniputra.com www.doniputra.com;

  location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Validate and reload:

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
```

## Health Checks

Required checks:

```bash
curl http://localhost:4000/api/health
curl http://localhost:3000
curl https://doniputra.com
curl https://doniputra.com/api/health
```

## Backup Plan

At minimum, schedule PostgreSQL dumps:

```bash
pg_dump "$DATABASE_URL" > portfolio-$(date +%Y%m%d).sql
```

Recommended:

- Store backups outside the EC2 instance.
- Keep daily backups for 7 days.
- Keep weekly backups for 4 weeks.
- Test restore before relying on backups.

## Production Smoke Test

After each deployment:

- Open homepage.
- Open `/blogs`.
- Open a blog detail page.
- Submit a test contact form only if production test submissions are acceptable.
- Verify comment submission on a test article or staging only.
- Verify CV download.
- Verify `/api/health`.
- Check server memory, disk, and service logs.
