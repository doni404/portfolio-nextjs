# Product Requirements Document: Doni Putra Portfolio & Knowledge Hub

## 1. Overview

Build a modern personal portfolio website for Doni Putra Purbawa that presents him as a Senior Backend Engineer with strong fintech, cloud, and AI experience. The website should feel professional, simple, and cool, while also supporting a Medium-like blog section for sharing IT knowledge, AI articles, backend engineering notes, cloud architecture lessons, and career insights.

The site should balance two purposes:

- Professional portfolio for recruiters, hiring managers, technical leads, and potential collaborators.
- Knowledge publishing platform for articles, tutorials, case studies, and engineering opinions.

The first version should be lightweight, fast, polished, and easy to maintain.

## 2. Goals

- Communicate Doni's profile clearly within the first viewport: Senior Backend Engineer focused on fintech, cloud, backend systems, and AI.
- Provide a professional online presence that supports job applications, consulting opportunities, networking, and personal branding.
- Create a blog experience that feels credible and pleasant to read, similar in spirit to Medium but tailored to Doni's personal brand.
- Make it easy to publish technical articles under `/blogs`.
- Highlight real expertise through projects, work experience, technical skills, certifications, publications, and education.
- Keep the layout simple, modern, responsive, and fast.

## 3. Product Decisions

- Primary language: English.
- Frontend: Next.js.
- Backend: Express.js.
- Database: PostgreSQL.
- ORM and migration tool: Prisma.
- Testing target: TestSprite, supported by local unit, integration, API, and E2E test commands.
- CI/CD: GitHub Actions.
- Deployment target: AWS EC2 t3.micro running Amazon Linux 2023 with Coolify.
- Production database target: PostgreSQL managed by Coolify on the same EC2 instance for the first deployment.
- GitHub repository: `https://github.com/doni404/portfolio-nextjs`.
- CMS: simple custom admin CMS under `/admin`.
- Blog comments: included in MVP with moderation.
- CV download: included in MVP when the PDF asset is available.
- AI-powered blog search: not included in MVP.

## 4. Non-Goals

- Do not build a full social platform with user accounts, following, or paid memberships in MVP.
- Do not build a complex enterprise CMS, visual page builder, or multi-tenant admin system in MVP.
- Do not create a flashy visual-heavy landing page that hides the actual portfolio content.
- Do not overload the site with animations that reduce readability or performance.
- Do not build AI-powered semantic search in MVP.

## 5. Target Audience

- Recruiters and hiring managers evaluating Doni for backend, cloud, fintech, AI, or Japan-facing roles.
- Engineering managers and technical leads looking for senior backend capability.
- Developers reading blog content about backend systems, AWS, payments, AI, LLMs, and machine learning.
- Potential collaborators, startup founders, or companies interested in technical consulting.
- Professional contacts from Indonesia, Japan, and global remote teams.

## 6. Positioning

Primary positioning:

> Senior Backend Engineer building reliable fintech, cloud, and AI-powered systems.

Supporting themes:

- Backend systems: Java, Node.js, Golang, Python, REST APIs, microservices, gRPC, system design.
- Cloud infrastructure: AWS EC2, RDS, S3, Lambda, IAM, CloudWatch, Docker, Linux, GitHub Actions.
- Payments: Stripe, PayPal, GMO, Square, subscription billing, webhooks.
- AI and ML: OpenAI, Gemini, chatbot systems, recommendation systems, anomaly detection, TensorFlow.
- Japan connection: work experience with Japanese company, student exchange at Saga University, JLPT N4, open to Japan relocation.

## 7. Information Architecture

### Primary Navigation

- Home: `/`
- About: `/about`
- Experience: `/experience`
- Projects: `/projects`
- Blogs: `/blogs`
- Contact: `/contact`
- Admin: `/admin`

### Optional Future Navigation

- Talks: `/talks`
- Uses: `/uses`
- Publications: `/publications`
- Newsletter: `/newsletter`

## 8. Page Requirements

### 8.1 Home Page

Purpose: Give a quick, high-confidence snapshot of Doni's identity and expertise.

Required sections:

- Hero
  - Name: Doni Putra Purbawa.
  - Role: Senior Backend Engineer.
  - Short positioning statement focused on fintech, cloud, backend architecture, and AI.
  - Primary CTA: "View Projects" or "Read Blogs".
  - Secondary CTA: "Contact Me" or "Download CV".
- Expertise summary
  - Backend architecture.
  - Cloud infrastructure.
  - Payment systems.
  - AI-powered applications.
- Featured projects
  - 3 selected projects or case studies.
  - Each item should include title, summary, stack, and result/impact.
- Latest blogs
  - Show 3 latest posts from `/blogs`.
  - Include category, title, short excerpt, publish date, and reading time.
- Professional highlights
  - 6+ years backend experience.
  - Payment gateway integrations.
  - AWS production infrastructure.
  - LLM integrations and ML research.
- Contact band
  - Short invitation to collaborate, hire, or discuss backend/cloud/AI systems.

Acceptance criteria:

- User understands Doni's professional identity within 5 seconds.
- Latest blog posts are visible without navigating to `/blogs`.
- Primary CTAs are visible and clear on desktop and mobile.

### 8.2 About Page

Purpose: Tell Doni's professional story with credibility and personality.

Required content:

- Short biography.
- Career focus and engineering philosophy.
- Current location: Indonesia.
- Japan connection and relocation interest.
- Education summary:
  - Master of Informatics Engineering, ITS, GPA 4.00/4.00.
  - Bachelor of Informatics Engineering, Brawijaya University, GPA 3.79/4.00.
  - Saga University student exchange.
- Publications and book contribution:
  - Elsevier Q1 research on deep learning anomaly detection.
  - Co-author of "Machine Learning & Deep Learning using Python".
- Certifications:
  - AWS Certified Cloud Practitioner.
  - JLPT N4.
  - TOEIC 765.

Acceptance criteria:

- About page feels human but still professional.
- Recruiters can quickly identify education, certification, location, and relocation context.

### 8.3 Experience Page

Purpose: Show career progression and credibility.

Required content:

- Timeline-style layout.
- Roles:
  - Backend Engineering Manager (Hands-on), Gloding, Inc., Japan, Jan 2020 - Present.
  - Cloud Solution Architect (Hands-on), Gloding, Inc., Japan, Jan 2018 - Jan 2020.
  - Backend Developer, Gloding, Inc., Japan, Oct 2017 - Jan 2018.
  - Machine Learning Engineer (Contract), PT. Hikari Solusindo Sukses, Indonesia, Aug 2021 - Dec 2021.
- Each role should include:
  - Company and location.
  - Period.
  - 3-5 impact-oriented bullet points.
  - Relevant technologies.

Acceptance criteria:

- Experience is scannable.
- Technical impact is visible without reading long paragraphs.
- Role history aligns with the CV.

### 8.4 Projects Page

Purpose: Demonstrate applied engineering ability through selected work.

Required project categories:

- Backend systems.
- Payment integrations.
- Cloud infrastructure.
- AI/LLM applications.
- Machine learning and anomaly detection.

Recommended MVP project cards:

- Payment Gateway & Subscription Platform
  - Stripe, PayPal, GMO, Square, webhooks, billing.
- Scalable Backend Microservices on AWS
  - Docker, gRPC, EC2 Auto Scaling, ALB, RDS, Redis.
- AI Chatbot & Recommendation Backend
  - OpenAI, Gemini, vector database, backend orchestration.
- i-Nose C-19 ML Model
  - Deep learning, anomaly detection, TensorFlow, Raspberry Pi edge inference.

Each project should include:

- Problem.
- Solution.
- Tech stack.
- Role/contribution.
- Outcome or lesson learned.
- Optional link to blog deep dive.

Acceptance criteria:

- At least 3 projects exist in MVP.
- Projects are written as case studies, not only portfolio thumbnails.
- Each project can optionally connect to related blog posts.

### 8.5 Blogs Page

Purpose: Provide a Medium-like publishing hub for technical writing.

Route: `/blogs`

Required features:

- Blog index with articles sorted newest first.
- Featured article area.
- Category filter.
- Keyword search by title, excerpt, tags, or content using PostgreSQL full-text search or a simple SQL search for MVP.
- Article cards with:
  - Title.
  - Excerpt.
  - Cover image or simple visual accent.
  - Publish date.
  - Reading time.
  - Category.
  - Tags.
- Empty state for categories without posts.
- Pagination or "Load more" when posts exceed 10-12 articles.

Recommended categories:

- Backend Engineering.
- Cloud & DevOps.
- Payment Systems.
- AI & LLM.
- Machine Learning.
- Career & Japan.
- Tutorials.

Acceptance criteria:

- `/blogs` feels like a real publication hub, not a small portfolio add-on.
- Articles are easy to scan and filter.
- The page works well on mobile.

### 8.6 Blog Detail Page

Route: `/blogs/[slug]`

Required features:

- Clean reading layout with comfortable typography.
- Article title, subtitle/excerpt, publish date, update date, reading time, category, and tags.
- Author block for Doni.
- Table of contents for long articles.
- Code block styling with syntax highlighting.
- Images with captions.
- Callouts for notes, warnings, and key takeaways.
- Related articles.
- Share links.
- Comment list with approved comments.
- Comment submission form.
- Comment moderation state so new comments are not shown until approved.
- "Back to blogs" navigation.

Nice-to-have features:

- Copy code button.
- Estimated reading progress.
- Newsletter or contact CTA at article end.

Acceptance criteria:

- Reading experience is calm, fast, and distraction-free.
- Code snippets are readable on mobile.
- Article content supports technical depth.
- Readers can submit comments without an account.
- Unapproved comments are hidden from public pages.

### 8.7 Contact Page

Purpose: Make it easy to reach Doni.

Required content:

- Email.
  - Primary contact email: `doniputrapurbawa@gmail.com`.
- LinkedIn.
- Website/domain reference.
- Location and relocation note.
- Short contact form submitted to the Express.js backend.
- Simple CTA for hiring, collaboration, or technical discussion.

Acceptance criteria:

- Contact options are visible and usable.
- Contact page does not require account creation.
- Contact form submissions are stored in PostgreSQL and protected from spam abuse.

### 8.8 Admin CMS

Purpose: Let Doni manage portfolio and blog content without editing the database or seed files directly.

Route group:

- `/admin/login`
- `/admin`
- `/admin/blogs`
- `/admin/blogs/new`
- `/admin/blogs/[id]`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/[id]`
- `/admin/experiences`
- `/admin/comments`
- `/admin/contact-submissions`
- `/admin/assets`
- `/admin/settings`

Required features:

- Secure admin login.
- Dashboard summary:
  - Total published blog posts.
  - Draft blog posts.
  - Pending comments.
  - New contact submissions.
  - Featured projects.
- Blog management:
  - Create, edit, publish, unpublish, archive, and soft-delete posts.
  - Edit title, slug, excerpt, content, cover image URL, category, tags, featured state, SEO title, SEO description, and reading time.
  - Rich text editor powered by TipTap (WYSIWYG) with toolbar for headings, bold, italic, underline, strikethrough, highlight, inline code, code blocks with syntax highlighting, bullet lists, ordered lists, blockquotes, links, images, text alignment, and horizontal rules.
  - Content stored and served as HTML.
  - Live preview tab in the editor shows rendered article with real typography.
  - SEO & Meta tab with character counters and SERP preview.
- Project management:
  - Create, edit, publish, archive, and reorder projects.
  - Edit problem, solution, role, stack, outcome, category, tags, and featured state.
- Experience management:
  - Create, edit, reorder, and hide/show experience entries.
  - Edit company, role, location, date range, summary, highlights, and technologies.
- Comment moderation:
  - View pending, approved, rejected, and spam comments.
  - Approve, reject, mark as spam, or soft-delete comments.
- Contact submissions:
  - View submitted contact form messages.
  - Mark as read, replied, or archived.
- Asset/settings management:
  - Update CV PDF URL or uploaded file metadata.
  - Update profile image URL and default Open Graph image URL.

Acceptance criteria:

- Admin pages are not accessible without authentication.
- Doni can manage blog, project, and experience content from `/admin`.
- Doni can moderate comments from `/admin/comments`.
- Doni can review contact messages from `/admin/contact-submissions`.
- Public pages only show published content.

## 9. Design Direction

Overall style:

- Simple, modern, professional.
- Technical but approachable.
- Calm layout with strong typography and generous spacing.
- Cool visual detail through subtle accents, not heavy decoration.

Recommended visual language:

- Light-first theme with optional dark mode.
- Neutral background with one strong accent color.
- Use clean typography, likely a sans-serif for UI and a highly readable serif or sans-serif for blog articles.
- Use small system diagrams, code snippets, and architecture-inspired details where relevant.
- Avoid clutter, oversized decorative sections, and one-color monotony.

Suggested palette direction:

- Base: near-white, charcoal, soft gray.
- Accent: electric blue, emerald, or cyan.
- Secondary accents: restrained amber or violet only for highlights.

Layout principles:

- Home page should feel like a portfolio dashboard plus editorial surface.
- Blog pages should prioritize readability over decoration.
- Cards should be simple, with subtle borders and small radius.
- Navigation should be sticky or easily reachable but not visually heavy.
- Mobile layout must be first-class.

## 10. Content Model

### Blog Post Fields

- `id`
- `title`
- `slug`
- `description`
- `publishedAt`
- `updatedAt`
- `category`
- `tags`
- `readingTime`
- `coverImage`
- `featured`
- `status`
- `author`
- `content`
- `seoTitle`
- `seoDescription`

### Project Fields

- `id`
- `title`
- `slug`
- `summary`
- `problem`
- `solution`
- `role`
- `stack`
- `outcome`
- `year`
- `category`
- `links`
- `relatedPosts`
- `featured`
- `sortOrder`

### Experience Fields

- `id`
- `company`
- `role`
- `location`
- `startDate`
- `endDate`
- `summary`
- `highlights`
- `technologies`
- `sortOrder`

### Comment Fields

- `id`
- `postId`
- `parentId`
- `authorName`
- `authorEmail`
- `authorWebsite`
- `content`
- `status`
- `ipHash`
- `userAgent`
- `createdAt`
- `approvedAt`

### Contact Submission Fields

- `id`
- `name`
- `email`
- `company`
- `subject`
- `message`
- `source`
- `status`
- `createdAt`

### Admin User Fields

- `id`
- `email`
- `passwordHash`
- `name`
- `role`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

### Audit Log Fields

- `id`
- `adminUserId`
- `action`
- `entityType`
- `entityId`
- `metadata`
- `createdAt`

## 11. Recommended MVP Scope

MVP pages:

- Home.
- About.
- Experience.
- Projects.
- Blogs index.
- Blog detail.
- Contact.
- Admin login.
- Admin dashboard.
- Admin blog management.
- Admin project management.
- Admin experience management.
- Admin comment moderation.
- Admin contact inbox.

MVP functionality:

- Dynamic content served from PostgreSQL through the Express.js API.
- Responsive layout.
- SEO metadata per page.
- Blog filtering by category.
- Blog search.
- Blog comments with moderation.
- Contact form persistence.
- Admin authentication.
- Simple admin CMS for experience, project, blog, comments, contact submissions, and CV asset settings.
- Syntax highlighting for code snippets.
- RSS feed.
- Sitemap.
- Open Graph images.
- Download CV link.

MVP content:

- 3 project case studies.
- 5 starter blog posts.
- Full experience timeline.
- About page based on CV.
- Contact details.
  - Primary email: `doniputrapurbawa@gmail.com`.

Suggested starter blog posts:

- "Designing Reliable Payment Webhooks for Production Systems"
- "How I Structure Backend Services with Microservices and gRPC"
- "Practical AWS Architecture for Small Engineering Teams"
- "Building AI Chatbots with LLM APIs in Backend Systems"
- "Lessons from Deep Learning Anomaly Detection on Sensor Data"

## 12. System Architecture

### Frontend

- Framework: Next.js with App Router.
- Language: TypeScript.
- Styling: Tailwind CSS with shared design tokens.
- Rich text editor: TipTap (WYSIWYG) with extensions — StarterKit, CodeBlockLowlight (syntax highlighting via lowlight), Image, Link, Placeholder, CharacterCount, TextAlign, Underline, Highlight. Content stored as HTML.
- Rendering:
  - Static generation for marketing-style pages where possible.
  - Server-side or incremental rendering for blog listing and detail pages.
  - Client components only for interactive pieces such as search, filters, comments, and forms.
- Content source: Express.js API backed by PostgreSQL.
- Assets:
  - CV PDF served from `/public/files/` or object storage.
  - Blog images served from `/public/images/` for MVP, with object storage as a future option.
  - Profile photo served from `/public/profile.png`.

### Backend

- Runtime: Node.js.
- Framework: Express.js.
- Language: TypeScript.
- Database: PostgreSQL.
- ORM/query layer: Prisma for schema modeling, migrations, query client generation, and seed workflow.
- Validation: Zod or Joi for request validation. Recommended: Zod.
- Security middleware:
  - Helmet.
  - CORS with explicit frontend origin.
  - Rate limiting for contact and comment endpoints.
  - Request body size limits.
- Logging: structured request logging with pino or morgan.

### Deployment

- Target server: AWS EC2 t3.micro.
- Recommended server if budget allows: AWS EC2 t3.small.
- Operating system: Amazon Linux 2023.
- Deployment platform: Coolify.
- Frontend: Next.js deployed as a Coolify application.
- Backend: Express.js API deployed as a Coolify application.
- Database: PostgreSQL managed by Coolify on the same EC2 instance for the first deployment.
- CI/CD: GitHub Actions runs quality checks; Coolify handles production deployment from `main` or via deploy webhook.
- Static assets: Next.js public directory for MVP; S3-compatible storage later if needed.
- TLS: Coolify-managed reverse proxy and Let's Encrypt certificate.

Important constraint:

- t3.micro is better than t3.nano, but still has only 1 GB RAM. Coolify's official minimum recommendation is 2 CPU cores, 2 GB RAM, and 30 GB storage, so the server should use swap and be monitored closely. Upgrade to t3.small if builds, PostgreSQL, or Coolify become unstable.

### Repository Shape

Repository:

- GitHub: `https://github.com/doni404/portfolio-nextjs`
- Repository name: `portfolio-nextjs`

Recommended monorepo:

```text
apps/
  web/       # Next.js frontend
  api/       # Express.js backend
packages/
  shared/    # Shared TypeScript types and validation schemas
docs/
  portfolio-website-prd.md
```

Additional planning docs:

- Prisma schema draft: `docs/db/schema.prisma`
- SQL migration draft: `docs/db/001_initial_schema.sql`
- Seed plan: `docs/db/seed-plan.md`
- TestSprite plan: `docs/testing/testsprite-plan.md`
- Coolify AWS EC2 deployment plan: `docs/deployment/coolify-aws-ec2-amazon-linux-2023.md`
- Coolify setup checklist: `docs/deployment/coolify-setup-steps.md`
- Manual AWS EC2 fallback deployment plan: `docs/deployment/aws-ec2-amazon-linux-2023.md`
- GitHub Actions CI/CD plan: `docs/ci-cd/github-actions-plan.md`

## 13. API Plan

### Public API Endpoints

- `GET /api/health`
  - Returns service status.
- `GET /api/profile`
  - Returns profile summary, skills, certifications, and contact links.
- `GET /api/experiences`
  - Returns ordered experience timeline.
- `GET /api/projects`
  - Supports featured, category, tag, and pagination filters.
- `GET /api/projects/:slug`
  - Returns project detail.
- `GET /api/blogs`
  - Supports pagination, category, tag, featured, and keyword search.
- `GET /api/blogs/:slug`
  - Returns blog post detail.
- `GET /api/blogs/:slug/comments`
  - Returns approved comments for a blog post.
- `POST /api/blogs/:slug/comments`
  - Creates a pending comment.
- `POST /api/contact`
  - Stores a contact submission and optionally sends notification email.
- `GET /api/rss.xml`
  - Returns RSS feed, or frontend can generate it from the blog API.

### Admin API Endpoints

Admin endpoints must be protected by authentication.

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/blogs`
- `POST /api/admin/blogs`
- `PATCH /api/admin/blogs/:id`
- `DELETE /api/admin/blogs/:id`
- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `PATCH /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`
- `GET /api/admin/experiences`
- `POST /api/admin/experiences`
- `PATCH /api/admin/experiences/:id`
- `DELETE /api/admin/experiences/:id`
- `GET /api/admin/comments`
- `PATCH /api/admin/comments/:id/status`
- `GET /api/admin/contact-submissions`
- `PATCH /api/admin/contact-submissions/:id/status`
- `GET /api/admin/assets`
- `PATCH /api/admin/assets/:key`

### API Response Standards

- Use JSON responses.
- Return predictable error objects:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  }
}
```

- Paginated endpoints should return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

## 14. Database Plan

### Database

- Engine: PostgreSQL 15+.
- Naming convention: snake_case tables and columns.
- Primary keys: UUID.
- Timestamps: `created_at`, `updated_at`, and optional `deleted_at`.
- Content status fields should use constrained strings or PostgreSQL enums.
- Use soft delete only where recovery is useful, such as posts, projects, and comments.
- Use indexes on slugs, status fields, published dates, foreign keys, and search fields.

### Core Tables

- `authors`
  - Stores Doni as the initial content author and allows future guest authors.
- `categories`
  - Shared taxonomy for blog posts and optional projects.
- `tags`
  - Shared flexible labels.
- `blog_posts`
  - Stores article metadata and content.
- `blog_post_tags`
  - Many-to-many relation between posts and tags.
- `comments`
  - Stores reader comments with moderation state.
- `projects`
  - Stores project case studies.
- `project_tags`
  - Many-to-many relation between projects and tags.
- `experiences`
  - Stores work timeline.
- `skills`
  - Stores grouped technical skills.
- `certifications`
  - Stores certificates and language tests.
- `education`
  - Stores degrees and exchange program.
- `contact_submissions`
  - Stores contact form messages.
- `site_assets`
  - Stores metadata for files such as CV PDF, profile image, and Open Graph images.
- `admin_users`
  - Stores admin login accounts for the CMS.
- `audit_logs`
  - Stores important admin actions for traceability.

### PostgreSQL Extensions

Enable:

```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Migration Schema Draft

```sql
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'rejected', 'spam');
CREATE TYPE contact_status AS ENUM ('new', 'read', 'replied', 'archived');
CREATE TYPE admin_role AS ENUM ('owner', 'editor');

CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(160),
  bio TEXT,
  avatar_url TEXT,
  email VARCHAR(255),
  website_url TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(40) NOT NULL DEFAULT 'blog',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES authors(id),
  category_id UUID REFERENCES categories(id),
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(260) NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT false,
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  seo_title VARCHAR(220),
  seo_description VARCHAR(320),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED
);

CREATE TABLE blog_post_tags (
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, tag_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name VARCHAR(120) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  author_website TEXT,
  content TEXT NOT NULL,
  status comment_status NOT NULL DEFAULT 'pending',
  ip_hash VARCHAR(128),
  user_agent TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(260) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  problem TEXT,
  solution TEXT,
  role TEXT,
  outcome TEXT,
  stack TEXT[] NOT NULL DEFAULT '{}',
  category_id UUID REFERENCES categories(id),
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  year INTEGER,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE project_tags (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company VARCHAR(180) NOT NULL,
  role VARCHAR(180) NOT NULL,
  location VARCHAR(180),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  summary TEXT,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  technologies TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  proficiency VARCHAR(40),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(220) NOT NULL,
  issuer VARCHAR(180),
  score VARCHAR(80),
  issued_at DATE,
  expires_at DATE,
  credential_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution VARCHAR(220) NOT NULL,
  degree VARCHAR(220) NOT NULL,
  location VARCHAR(180),
  start_year INTEGER,
  end_year INTEGER,
  gpa VARCHAR(40),
  highlights TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(180),
  subject VARCHAR(220),
  message TEXT NOT NULL,
  source VARCHAR(80) DEFAULT 'contact_page',
  status contact_status NOT NULL DEFAULT 'new',
  ip_hash VARCHAR(128),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE site_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(120) NOT NULL UNIQUE,
  label VARCHAR(180) NOT NULL,
  file_url TEXT NOT NULL,
  mime_type VARCHAR(120),
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(120) NOT NULL,
  role admin_role NOT NULL DEFAULT 'owner',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status_published_at ON blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_search_vector ON blog_posts USING GIN(search_vector);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_comments_blog_post_status ON comments(blog_post_id, status, created_at DESC);
CREATE INDEX idx_projects_status_featured ON projects(status, featured, sort_order);
CREATE INDEX idx_contact_submissions_status_created ON contact_submissions(status, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_admin_user ON audit_logs(admin_user_id, created_at DESC);
```

### Migration File Plan

Use Prisma migrations as the primary migration workflow. The standalone SQL draft can be used as a reference for indexes, generated search vectors, and database-level details that may require raw SQL inside a Prisma migration.

Prisma schema draft: `docs/db/schema.prisma`.
Standalone SQL draft: `docs/db/001_initial_schema.sql`.

- `001_init_extensions_and_enums`
  - Enables PostgreSQL extensions.
  - Creates content, comment, contact, and admin role enums.
- `002_create_content_taxonomy`
  - Creates authors, categories, and tags.
- `003_create_blog_posts`
  - Creates blog posts, post tags, full-text search vector, and indexes.
- `004_create_comments`
  - Creates moderated comment storage.
- `005_create_projects`
  - Creates projects and project tags.
- `006_create_profile_content`
  - Creates experiences, skills, certifications, education, and site assets.
- `007_create_contact_submissions`
  - Creates contact form storage and indexes.
- `008_create_admin_cms`
  - Creates admin users and audit logs.

### Seed Plan

Seed data should create a complete launch-ready portfolio.

Standalone seed plan: `docs/db/seed-plan.md`.

Seed records:

- Author:
  - Doni Putra Purbawa.
  - Email: `doniputrapurbawa@gmail.com`.
- Categories:
  - Backend Engineering.
  - Cloud & DevOps.
  - Payment Systems.
  - AI & LLM.
  - Machine Learning.
  - Career & Japan.
  - Tutorials.
- Tags:
  - Golang, Node.js, Java, Python, AWS, Docker, PostgreSQL, Redis, gRPC, REST API, Stripe, PayPal, GMO, Square, OpenAI, Gemini, TensorFlow, System Design.
- Experiences:
  - Backend Engineering Manager (Hands-on), Gloding, Inc.
  - Cloud Solution Architect (Hands-on), Gloding, Inc.
  - Backend Developer, Gloding, Inc.
  - Machine Learning Engineer (Contract), PT. Hikari Solusindo Sukses.
- Projects:
  - Payment Gateway & Subscription Platform.
  - Scalable Backend Microservices on AWS.
  - AI Chatbot & Recommendation Backend.
  - i-Nose C-19 ML Model.
- Blog posts:
  - The 5 starter articles listed in MVP content.
- Skills:
  - Languages, Cloud & Infrastructure, Backend & Architecture, Payment Integration, Databases, Tools, AI & Machine Learning.
- Certifications:
  - JLPT N4.
  - AWS Certified Cloud Practitioner.
  - TOEIC 765.
- Education:
  - Master of Informatics Engineering, ITS.
  - Bachelor of Informatics Engineering, Brawijaya University.
  - Saga University Student Exchange.
- Site assets:
  - CV PDF asset with key `cv_pdf`.
  - Profile image placeholder if a real image is not available yet.
- Admin user:
  - Create one owner account for `doniputrapurbawa@gmail.com`.
  - Password should be provided through an environment variable during seeding, never hardcoded.

Seed command:

```bash
pnpm db:seed
```

Expected seed behavior:

- Idempotent where possible using slugs and unique keys.
- Safe to rerun locally.
- Does not overwrite manually edited production content unless explicitly requested.

## 15. Backend Behavior Requirements

### Admin CMS

- Admin CMS lives under `/admin`.
- Admin authentication should use secure password hashing with bcrypt or argon2.
- MVP can use a single owner account.
- Session should use secure HTTP-only cookies or signed JWT stored in HTTP-only cookies.
- Public users must never access admin APIs.
- Admin mutations should write audit logs for publish, archive, delete, approve, reject, and asset changes.
- Admin content saves should validate slugs, required fields, status values, and SEO length limits.
- Public APIs must filter out draft, archived, and soft-deleted content.

### Comments

- Comments are public-submitted and accountless.
- New comments default to `pending`.
- Public blog pages only show `approved` comments.
- Backend validates author name, email, and content.
- Backend rate limits comment submissions by IP hash.
- Backend stores email for moderation/contact purposes but never exposes it publicly.
- Optional first version: email notification to site owner for new pending comments.

### Contact Form

- Contact submissions are stored as `new`.
- Required fields: name, email, message.
- Optional fields: company, subject.
- Backend validates email format and message length.
- Backend rate limits submissions by IP hash.
- Optional first version: email notification to site owner.
  - Notification recipient: `doniputrapurbawa@gmail.com`.

### CV Download

- Store CV metadata in `site_assets` with key `cv_pdf`.
- Frontend exposes "Download CV" buttons on Home, About, and Contact.
- Backend can expose `GET /api/assets/cv` if the CV URL should be fetched dynamically.
- MVP can also serve the PDF directly from Next.js public assets.

## 16. Future Enhancements

- Dark mode.
- Newsletter subscription.
- Rich editor with image upload and drag-and-drop media library.
- Blog series support.
- Multilingual content: English, Indonesian, Japanese.
- Advanced search with richer ranking and filters.
- Tags landing pages.
- Reading lists.
- AI-powered "Ask Doni's Blog" search assistant.
- Analytics dashboard for article performance.
- Automatic social preview image generation.

## 17. SEO Requirements

- Every page must include title, description, canonical URL, and Open Graph metadata.
- Blog posts must include structured data for articles.
- Homepage should include structured data for person/profile.
- Sitemap must include all public pages and blog posts.
- RSS feed must be available at `/rss.xml`.
- Slugs should be readable and stable.
- Images must include meaningful alt text.
- Page performance should support strong Core Web Vitals.

Target SEO themes:

- Senior Backend Engineer.
- Backend Engineer Indonesia.
- Backend Engineer Japan.
- AWS Backend Engineer.
- Fintech Backend Engineer.
- Payment Gateway Integration.
- AI Backend Engineer.
- LLM Integration.
- Machine Learning Anomaly Detection.

## 18. Performance Requirements

- Lighthouse performance target: 90+ on mobile and desktop.
- First contentful paint should feel immediate on common connections.
- Avoid unnecessary client-side JavaScript.
- Blog article pages should use Next.js server rendering, static generation, or incremental static regeneration where practical.
- Images should be optimized, responsive, and lazy-loaded where appropriate.
- Fonts should be loaded efficiently.
- Backend APIs should respond quickly for public read endpoints and use database indexes for blog/project queries.

## 19. Accessibility Requirements

- WCAG 2.1 AA baseline.
- Keyboard-navigable menus, filters, search, and CTAs.
- Sufficient color contrast.
- Visible focus states.
- Semantic HTML structure.
- Proper heading hierarchy.
- Descriptive link text.
- Alt text for meaningful images.
- Reduced motion support if animation is used.

## 20. Technical Recommendation

Recommended stack:

- Frontend framework: Next.js with App Router.
- Frontend language: TypeScript.
- Backend framework: Express.js.
- Backend language: TypeScript.
- Database: PostgreSQL.
- ORM/migrations: Prisma.
- Styling: Tailwind CSS with design tokens.
- Search: PostgreSQL full-text search for MVP.
- Testing: TestSprite for generated/assisted product testing, plus local unit, integration, API, and E2E tests.
- CI/CD: GitHub Actions for pull request checks and production deployment.
- Deployment: AWS EC2 t3.micro with Amazon Linux 2023, Coolify, Docker, Next.js, Express.js, and Coolify-managed PostgreSQL.
- Analytics: Plausible, Umami, or Vercel Analytics.

Recommended implementation approach:

- Build the frontend as a polished public website in Next.js.
- Build the backend as an Express.js JSON API.
- Store portfolio, blog, comments, and contact data in PostgreSQL.
- Use Prisma for database schema, migrations, generated client, and seed scripts.
- Use GitHub Actions for CI checks and build verification; use Coolify for deployment, Prisma migrations, environment variables, HTTPS, and container lifecycle.
- Build a simple custom `/admin` CMS instead of using a heavy external CMS.
- Add comment moderation endpoints early because comments are part of MVP.
- Prepare a TestSprite-friendly test specification from the PRD and API contract.

## 21. Analytics

Track:

- Page views.
- Blog post views.
- Project case study views.
- CV download clicks.
- Contact clicks.
- Search queries on `/blogs`.
- Comment submissions.
- Category filter usage.
- External link clicks to LinkedIn, GitHub, or publications.

Success metrics:

- Visitors can reach contact information within 2 clicks.
- Blog readers visit at least one related article.
- Readers submit comments on blog posts.
- Recruiters view at least one project or experience page after landing on home.
- CV download and contact click rates increase after launch.

## 22. Acceptance Criteria

The website is ready for launch when:

- All MVP pages exist and are responsive.
- `/blogs` supports article browsing, category filtering, and search.
- Blog detail pages support approved public comments and pending comment submission.
- Express.js backend exposes required public APIs.
- PostgreSQL schema, migrations, and seed data are available.
- Prisma schema and seed workflow are available.
- TestSprite test plan is prepared.
- Coolify AWS EC2 deployment plan is prepared for Amazon Linux 2023.
- GitHub Actions CI/CD plan is prepared.
- At least 5 blog posts and 3 project case studies are published.
- The homepage clearly communicates Doni's role and focus within the first viewport.
- SEO metadata, sitemap, RSS, and Open Graph data are implemented.
- Lighthouse scores are 90+ for performance, accessibility, best practices, and SEO.
- Contact links work.
- Contact form submissions are stored successfully.
- Admin login works.
- Admin CMS can create and edit blog posts, projects, and experiences.
- Admin CMS can moderate comments and review contact submissions.
- CV download works.
- No major layout shifts, overlapping text, or unreadable mobile UI exist.

## 23. Resolved Decisions

- Primary language is English.
- Blog comments are included in MVP.
- CV download should be supported when the PDF file is available.
- AI-powered blog search is not needed in MVP.
- Frontend should use Next.js.
- Backend should use Express.js.
- Database should use PostgreSQL.
- ORM and migrations should use Prisma.
- Testing should include TestSprite.
- CI/CD should use GitHub Actions.
- Deployment should target AWS EC2 t3.micro with Amazon Linux 2023 and Coolify.
- First production database can be PostgreSQL managed by Coolify on the same EC2 instance.
- Canonical GitHub repository is `doni404/portfolio-nextjs`.
- Content should be managed by a simple custom CMS under `/admin`.
- Admin blog editor uses TipTap rich text editor (WYSIWYG), not plain Markdown.
- Blog content is stored and rendered as HTML.
- Profile photo (`profile.png`) is used throughout the site on Home hero, About page, blog article author sections, and admin sidebar.

## 24. Remaining Open Questions

- Besides the portfolio repository, which GitHub repositories should be public-facing on the website?
- Should email notifications be sent for new comments and contact submissions?
- Should production use separate API subdomain `api.doniputra.com` or same-domain routing under `doniputra.com/api`?
- Should admin content editing use plain Markdown textarea first, or a richer editor like TipTap later? **Resolved: TipTap rich text editor implemented in MVP.**
