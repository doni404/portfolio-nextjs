import { PrismaClient, ContentStatus, CommentStatus, ContactStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { marked } from "marked";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function mdToHtml(md: string): string {
  return marked.parse(md) as string;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD environment variable is required");
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.adminUser.upsert({
    where: { email: "doniputrapurbawa@gmail.com" },
    update: {},
    create: {
      email: "doniputrapurbawa@gmail.com",
      passwordHash,
      name: "Doni Putra Purbawa",
      role: "owner",
    },
  });
  console.log(`✅ Admin user: ${adminUser.email}`);

  // ── Author ──────────────────────────────────────────────────────────────────
  const author = await prisma.author.upsert({
    where: { slug: "doni-putra-purbawa" },
    update: {},
    create: {
      name: "Doni Putra Purbawa",
      slug: "doni-putra-purbawa",
      title: "Senior Backend Engineer",
      bio: "Senior Backend Engineer building reliable fintech, cloud, and AI-powered systems. 6+ years of experience with Node.js, Java, Golang, AWS, and payment integrations. Based in Indonesia, open to Japan relocation.",
      avatarUrl: "/profile.png",
      email: "doniputrapurbawa@gmail.com",
      linkedinUrl: "https://linkedin.com/in/doniputrapurbawa",
    },
  });
  console.log(`✅ Author: ${author.name}`);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryData = [
    { name: "Backend Engineering", slug: "backend-engineering", sortOrder: 1 },
    { name: "Cloud & DevOps", slug: "cloud-devops", sortOrder: 2 },
    { name: "Payment Systems", slug: "payment-systems", sortOrder: 3 },
    { name: "AI & LLM", slug: "ai-llm", sortOrder: 4 },
    { name: "Machine Learning", slug: "machine-learning", sortOrder: 5 },
    { name: "Career & Japan", slug: "career-japan", sortOrder: 6 },
    { name: "Tutorials", slug: "tutorials", sortOrder: 7 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, type: "blog" },
    });
    categories[cat.name] = created.id;
  }
  console.log(`✅ Categories: ${categoryData.length}`);

  // ── Tags ────────────────────────────────────────────────────────────────────
  const tagNames = [
    "Golang", "Node.js", "Java", "Python", "TypeScript",
    "AWS", "Docker", "PostgreSQL", "Redis", "gRPC",
    "REST API", "Stripe", "PayPal", "GMO", "Square",
    "OpenAI", "Gemini", "TensorFlow", "System Design",
    "Microservices", "Webhooks", "EC2", "RDS", "IAM",
    "Infrastructure", "Deep Learning", "Anomaly Detection",
    "Raspberry Pi", "AI", "Kubernetes",
  ];

  const tagIds: Record<string, string> = {};
  for (const name of tagNames) {
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    tagIds[name] = tag.id;
  }
  console.log(`✅ Tags: ${tagNames.length}`);

  // ── Experiences ─────────────────────────────────────────────────────────────
  const experienceData = [
    {
      company: "Gloding, Inc.",
      role: "Backend Engineering Manager (Hands-on)",
      location: "Japan (Remote from Indonesia)",
      startDate: new Date("2020-01-01"),
      endDate: null,
      isCurrent: true,
      summary:
        "Lead backend engineering for a Japanese SaaS company, managing architecture decisions, team growth, and production systems serving thousands of users across Japan.",
      highlights: [
        "Grew backend team from 2 to 6 engineers while maintaining high delivery pace",
        "Architected migration from monolith to microservices, reducing deployment time by 83%",
        "Led integration of GPT-4 and Gemini APIs for customer-facing AI features",
        "Established engineering standards: code review process, incident response, on-call rotation",
        "Collaborated directly with Japanese leadership on product roadmap and technical strategy",
      ],
      technologies: ["Node.js", "TypeScript", "Java", "Golang", "AWS", "Docker", "PostgreSQL", "Redis", "gRPC"],
      sortOrder: 1,
    },
    {
      company: "Gloding, Inc.",
      role: "Cloud Solution Architect (Hands-on)",
      location: "Japan (Remote from Indonesia)",
      startDate: new Date("2018-01-01"),
      endDate: new Date("2020-01-01"),
      isCurrent: false,
      summary:
        "Designed and implemented cloud infrastructure on AWS for production workloads, focusing on reliability, security, and cost efficiency.",
      highlights: [
        "Designed multi-AZ AWS architecture supporting 99.9% uptime SLA",
        "Implemented Infrastructure as Code with CloudFormation, eliminating manual provisioning",
        "Built CI/CD pipelines with GitHub Actions, reducing release cycle from weekly to daily",
        "Reduced AWS infrastructure costs by 35% through reserved instances and right-sizing",
        "Established security posture with IAM least-privilege, VPC isolation, and CloudTrail auditing",
      ],
      technologies: ["AWS EC2", "RDS", "S3", "CloudFront", "IAM", "CloudWatch", "CloudFormation", "Docker", "Nginx"],
      sortOrder: 2,
    },
    {
      company: "Gloding, Inc.",
      role: "Backend Developer",
      location: "Japan (Remote from Indonesia)",
      startDate: new Date("2017-10-01"),
      endDate: new Date("2018-01-01"),
      isCurrent: false,
      summary:
        "Built REST APIs and backend services for the core product, including payment integrations and notification systems.",
      highlights: [
        "Developed RESTful APIs consumed by iOS, Android, and web clients",
        "Integrated Stripe and GMO payment gateways for Japan market billing",
        "Built push notification service using AWS SNS supporting 50K+ devices",
        "Improved API response time by 60% through query optimization and Redis caching",
      ],
      technologies: ["Node.js", "Express.js", "PostgreSQL", "Redis", "Stripe", "GMO", "AWS SNS"],
      sortOrder: 3,
    },
    {
      company: "PT. Hikari Solusindo Sukses",
      role: "Machine Learning Engineer (Contract)",
      location: "Indonesia",
      startDate: new Date("2021-08-01"),
      endDate: new Date("2021-12-01"),
      isCurrent: false,
      summary:
        "Contract research and engineering work on deep learning for medical IoT applications, resulting in a published Elsevier Q1 paper.",
      highlights: [
        "Designed CNN-LSTM model for COVID-19 detection from e-nose sensor time-series",
        "Built data preprocessing pipeline handling sensor drift and environmental noise",
        "Achieved 94% classification accuracy, exceeding project targets",
        "Optimized TensorFlow model to TFLite for Raspberry Pi edge deployment",
        "Co-authored paper published in Elsevier Q1 journal on deep learning anomaly detection",
      ],
      technologies: ["Python", "TensorFlow", "TFLite", "scikit-learn", "NumPy", "Raspberry Pi"],
      sortOrder: 4,
    },
  ];

  for (const exp of experienceData) {
    await prisma.experience.upsert({
      where: {
        id: (
          await prisma.experience.findFirst({ where: { company: exp.company, role: exp.role } })
        )?.id ?? "00000000-0000-0000-0000-000000000000",
      },
      update: {},
      create: exp,
    });
  }
  console.log(`✅ Experiences: ${experienceData.length}`);

  // ── Skills ──────────────────────────────────────────────────────────────────
  const skillGroups = [
    {
      group: "Languages",
      skills: ["Java", "Node.js (TypeScript)", "Golang", "Python"],
    },
    {
      group: "Cloud & Infrastructure",
      skills: ["AWS EC2", "AWS RDS", "AWS S3", "AWS Lambda", "Docker", "Nginx", "GitHub Actions"],
    },
    {
      group: "Backend & Architecture",
      skills: ["REST APIs", "gRPC", "Microservices", "System Design", "Event-Driven Architecture"],
    },
    {
      group: "Payment Integration",
      skills: ["Stripe", "PayPal", "GMO", "Square", "Webhook Processing"],
    },
    {
      group: "Databases",
      skills: ["PostgreSQL", "Redis", "MySQL", "pgvector"],
    },
    {
      group: "AI & Machine Learning",
      skills: ["OpenAI API", "Gemini API", "TensorFlow", "TFLite", "RAG Pattern", "LLM Integration"],
    },
    {
      group: "Tools",
      skills: ["Prisma", "Git", "Linux", "PM2", "Postman"],
    },
  ];

  let skillOrder = 0;
  for (const grp of skillGroups) {
    for (const name of grp.skills) {
      const existing = await prisma.skill.findFirst({ where: { name, groupName: grp.group } });
      if (!existing) {
        await prisma.skill.create({
          data: { groupName: grp.group, name, sortOrder: skillOrder++ },
        });
      }
    }
  }
  console.log("✅ Skills");

  // ── Certifications ──────────────────────────────────────────────────────────
  const certData = [
    { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", sortOrder: 1 },
    { name: "JLPT N4", issuer: "Japan Foundation", score: "N4", sortOrder: 2 },
    { name: "TOEIC", issuer: "ETS", score: "765", sortOrder: 3 },
  ];

  for (const cert of certData) {
    const existing = await prisma.certification.findFirst({ where: { name: cert.name } });
    if (!existing) {
      await prisma.certification.create({ data: cert });
    }
  }
  console.log("✅ Certifications");

  // ── Education ───────────────────────────────────────────────────────────────
  const eduData = [
    {
      institution: "Institut Teknologi Sepuluh Nopember (ITS)",
      degree: "Master of Informatics Engineering",
      location: "Surabaya, Indonesia",
      startYear: 2019,
      endYear: 2021,
      gpa: "4.00/4.00",
      highlights: ["Deep learning research", "Published Elsevier Q1 paper"],
      sortOrder: 1,
    },
    {
      institution: "Universitas Brawijaya",
      degree: "Bachelor of Informatics Engineering",
      location: "Malang, Indonesia",
      startYear: 2013,
      endYear: 2017,
      gpa: "3.79/4.00",
      highlights: ["Backend systems focus", "Software engineering projects"],
      sortOrder: 2,
    },
    {
      institution: "Saga University",
      degree: "Student Exchange Program",
      location: "Saga, Japan",
      startYear: 2016,
      endYear: 2017,
      gpa: null,
      highlights: ["Japanese language and culture", "Computer Science coursework"],
      sortOrder: 3,
    },
  ];

  for (const edu of eduData) {
    const existing = await prisma.education.findFirst({ where: { institution: edu.institution, degree: edu.degree } });
    if (!existing) {
      await prisma.education.create({ data: edu });
    }
  }
  console.log("✅ Education");

  // ── Site Assets ─────────────────────────────────────────────────────────────
  await prisma.siteAsset.upsert({
    where: { key: "profile_image" },
    update: {},
    create: {
      key: "profile_image",
      label: "Profile Photo",
      fileUrl: "/profile.png",
      mimeType: "image/png",
    },
  });
  await prisma.siteAsset.upsert({
    where: { key: "cv_pdf" },
    update: {},
    create: {
      key: "cv_pdf",
      label: "Curriculum Vitae (PDF)",
      fileUrl: "/files/doni-putra-purbawa-cv.pdf",
      mimeType: "application/pdf",
    },
  });
  console.log("✅ Site assets");

  // ── Blog Posts ──────────────────────────────────────────────────────────────
  const blogPostsData = [
    {
      title: "Designing Reliable Payment Webhooks for Production Systems",
      slug: "designing-reliable-payment-webhooks-production-systems",
      excerpt:
        "Learn how to design idempotent, resilient webhook handlers for Stripe, PayPal, and GMO that survive retries, network failures, and race conditions.",
      markdownContent: `# Designing Reliable Payment Webhooks for Production Systems

Payment webhooks are the backbone of any modern billing system. When a payment is processed, refunded, or fails, your system receives a webhook notification from the payment provider. Getting this right is critical — a missed or double-processed webhook can mean lost revenue or duplicate charges.

## The Core Problem

Webhooks are HTTP POST requests sent by payment providers to your endpoint. The fundamental challenge is that **the same event can be delivered multiple times**. Network issues, timeouts, and provider retry logic mean you cannot assume a webhook arrives exactly once.

## Idempotency is Everything

The most important property your webhook handler must have is **idempotency** — processing the same event twice should produce the same result as processing it once.

\`\`\`typescript
async function handleStripeWebhook(event: Stripe.Event) {
  const existing = await db.processedEvents.findUnique({
    where: { stripeEventId: event.id }
  });
  
  if (existing) {
    return { status: 'already_processed' };
  }

  await db.$transaction(async (tx) => {
    await processPaymentEvent(tx, event);
    await tx.processedEvents.create({
      data: { stripeEventId: event.id, processedAt: new Date() }
    });
  });
}
\`\`\`

## Signature Verification

Always verify the webhook signature before processing. Every major provider gives you a signing secret.

\`\`\`typescript
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.rawBody,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
\`\`\`

## Queue-Based Processing

For high-volume systems, don't process webhooks synchronously. Acknowledge quickly (200 OK), then queue for async processing.

## Key Lessons from Production

1. **Store raw event payloads** — you'll need them for debugging
2. **Implement retry-with-backoff** for downstream service calls
3. **Alert on processing failures** — a dead webhook means lost business logic
4. **Test with provider simulators** — Stripe CLI is excellent for this
5. **Monitor webhook latency** — providers retry if you're slow to respond

Production webhook reliability comes down to: verify early, acknowledge fast, process idempotently, and monitor everything.`,
      category: "Payment Systems",
      tags: ["Stripe", "PayPal", "GMO", "Webhooks", "Node.js"],
      readingTime: 8,
      featured: true,
      status: "published" as ContentStatus,
      publishedAt: new Date("2024-03-15"),
    },
    {
      title: "How I Structure Backend Services with Microservices and gRPC",
      slug: "structure-backend-services-microservices-grpc",
      excerpt:
        "A practical guide to designing microservices communication with gRPC, including service discovery, error handling, and the lessons learned from production systems.",
      markdownContent: `# How I Structure Backend Services with Microservices and gRPC

After years of building monolithic backends and gradually splitting them into microservices, I've developed a set of patterns that work well in production. This post covers the architecture decisions, gRPC design, and operational lessons from running microservices on AWS.

## Why gRPC Over REST for Internal Services

When services talk to each other internally, REST's text-based overhead becomes wasteful. gRPC gives you:

- **Binary protocol** via Protocol Buffers — smaller payloads, faster serialization
- **Strong typing** from generated clients
- **Bidirectional streaming** for real-time use cases
- **Built-in deadlines and cancellation**

## Service Boundary Principles

The hardest part of microservices isn't the technology — it's defining the right boundaries.

\`\`\`protobuf
syntax = "proto3";

service PaymentService {
  rpc ProcessPayment (PaymentRequest) returns (PaymentResponse);
  rpc GetPaymentStatus (StatusRequest) returns (PaymentStatus);
  rpc StreamPaymentEvents (EventFilter) returns (stream PaymentEvent);
}
\`\`\`

## Error Handling with gRPC Status Codes

gRPC has rich status codes. Use them semantically.

\`\`\`typescript
import { status } from '@grpc/grpc-js';

function handlePaymentError(err: Error): never {
  if (err instanceof ValidationError) {
    throw { code: status.INVALID_ARGUMENT, message: err.message };
  }
  if (err instanceof NotFoundError) {
    throw { code: status.NOT_FOUND, message: err.message };
  }
  logger.error(err);
  throw { code: status.INTERNAL, message: 'Internal server error' };
}
\`\`\`

## Production Lessons

The biggest surprise was how much time goes into **observability**, not code. Every gRPC call needs distributed tracing, structured logs with correlation IDs, and SLO-based alerting.`,
      category: "Backend Engineering",
      tags: ["gRPC", "Microservices", "Node.js", "System Design"],
      readingTime: 10,
      featured: false,
      status: "published" as ContentStatus,
      publishedAt: new Date("2024-02-20"),
    },
    {
      title: "Practical AWS Architecture for Small Engineering Teams",
      slug: "practical-aws-architecture-small-engineering-teams",
      excerpt:
        "How to build a cost-effective, production-ready AWS setup for a startup or small team — covering EC2, RDS, S3, IAM, and the monitoring stack that actually matters.",
      markdownContent: `# Practical AWS Architecture for Small Engineering Teams

Most AWS architecture guides assume you have a DevOps team and a large budget. This guide is for small engineering teams who need to run production workloads reliably without burning money on over-engineered infrastructure.

## Start Simple, Scale Intentionally

The biggest mistake I see small teams make is copying enterprise architecture patterns before they have enterprise-scale problems.

For a typical early-stage product, this is enough:

\`\`\`
├── VPC (single region, 2 AZs)
│   ├── Public Subnets
│   │   └── ALB (Application Load Balancer)
│   └── Private Subnets
│       ├── EC2 Auto Scaling Group
│       └── RDS PostgreSQL (Multi-AZ when ready)
├── S3 (static assets, backups)
├── CloudFront (CDN for static assets)
└── Route 53 (DNS)
\`\`\`

## IAM: The Foundation You Can't Skip

Proper IAM from day one saves enormous pain later. Never use root credentials. Create per-service IAM roles with least privilege.

## Cost Optimization Without Sacrificing Reliability

On a t3.nano or t3.micro: configure swap space, limit Node.js heap, use PM2 cluster mode judiciously, and monitor memory with CloudWatch custom metrics.

The key insight: **monitoring is not optional**, it's how you sleep at night.`,
      category: "Cloud & DevOps",
      tags: ["AWS", "EC2", "RDS", "IAM", "Infrastructure"],
      readingTime: 12,
      featured: true,
      status: "published" as ContentStatus,
      publishedAt: new Date("2024-01-10"),
    },
    {
      title: "Building AI Chatbots with LLM APIs in Backend Systems",
      slug: "building-ai-chatbots-llm-apis-backend-systems",
      excerpt:
        "A backend engineer's guide to integrating OpenAI and Gemini APIs — covering streaming, context management, rate limiting, cost control, and production patterns.",
      markdownContent: `# Building AI Chatbots with LLM APIs in Backend Systems

LLM APIs have changed how we build product features. This post covers the backend patterns I've learned from integrating OpenAI and Gemini into production systems.

## Streaming Responses

For good UX, stream tokens to the client as they arrive. In Node.js with Express:

\`\`\`typescript
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: req.body.messages,
    stream: true,
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      res.write(\`data: \${JSON.stringify({ content })}\n\n\`);
    }
  }
  
  res.end();
});
\`\`\`

## Context Window Management

Managing the conversation history to stay within token limits is critical. I use a sliding window approach that preserves the system prompt and recent messages.

## Cost Control

LLM APIs are pay-per-token. Production cost control requires: input/output token counting per request, per-user rate limits, caching for repeated queries, and model tiering (use GPT-4o-mini for simple tasks).

The biggest win is always caching — many user queries are semantically similar.`,
      category: "AI & LLM",
      tags: ["OpenAI", "Gemini", "AI", "Node.js", "Backend Engineering"],
      readingTime: 9,
      featured: false,
      status: "published" as ContentStatus,
      publishedAt: new Date("2023-12-05"),
    },
    {
      title: "Lessons from Deep Learning Anomaly Detection on Sensor Data",
      slug: "lessons-deep-learning-anomaly-detection-sensor-data",
      excerpt:
        "What I learned building an ML model for COVID-19 detection using electronic nose sensor data — from data preprocessing and TensorFlow model design to edge inference on Raspberry Pi.",
      markdownContent: `# Lessons from Deep Learning Anomaly Detection on Sensor Data

This post covers the research and engineering behind the i-Nose C-19 project — a deep learning system for detecting COVID-19 biomarkers using an electronic nose (e-nose) sensor array and TensorFlow.

## The Problem

Traditional COVID-19 detection required expensive lab equipment or slow antigen tests. We explored whether exhaled breath patterns captured by MOS (Metal Oxide Semiconductor) sensors could distinguish COVID-19 positive samples.

## Data Collection Challenges

The hardest part wasn't the model — it was the data pipeline. Each breath sample produced a time-series of 8 sensor readings over 60 seconds. Noise, sensor drift, and environmental variation required careful preprocessing.

\`\`\`python
def preprocess_sensor_data(raw_readings: np.ndarray) -> np.ndarray:
    normalized = (raw_readings - raw_readings.mean(axis=0)) / raw_readings.std(axis=0)
    features = np.concatenate([
        normalized.max(axis=0),
        normalized.mean(axis=0),
        np.trapz(normalized, axis=0),
    ])
    return features
\`\`\`

## Model Architecture

We evaluated LSTM, CNN-LSTM hybrid, and a feedforward network. The CNN-LSTM hybrid performed best, capturing both local patterns and temporal dependencies.

## Edge Inference on Raspberry Pi

Deploying TensorFlow Lite on a Raspberry Pi 4 required model quantization to reduce size from 12MB to 3MB while preserving accuracy within 2%.

## Published Results

The work was published in an Elsevier Q1 journal with 94% classification accuracy on held-out test data. The key lesson: ML research that ends up in a real device teaches you things no Kaggle competition can.`,
      category: "Machine Learning",
      tags: ["TensorFlow", "Deep Learning", "Anomaly Detection", "Python", "Raspberry Pi"],
      readingTime: 11,
      featured: false,
      status: "published" as ContentStatus,
      publishedAt: new Date("2023-11-01"),
    },
    {
      title: "Draft: Advanced PostgreSQL Query Optimization",
      slug: "advanced-postgresql-query-optimization",
      excerpt: "Work in progress — techniques for optimizing complex queries in PostgreSQL.",
      markdownContent: "<p>Draft content — coming soon.</p>",
      category: "Backend Engineering",
      tags: ["PostgreSQL"],
      readingTime: 7,
      featured: false,
      status: "draft" as ContentStatus,
      publishedAt: null,
    },
  ];

  const postIdBySlug: Record<string, string> = {};

  for (const post of blogPostsData) {
    const catId = categories[post.category];
    const content = mdToHtml(post.markdownContent);

    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      postIdBySlug[post.slug] = existing.id;
      continue;
    }

    const created = await prisma.blogPost.create({
      data: {
        authorId: author.id,
        categoryId: catId ?? null,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content,
        status: post.status,
        featured: post.featured,
        readingTimeMinutes: post.readingTime,
        publishedAt: post.publishedAt,
        tags: {
          create: post.tags
            .filter((t) => tagIds[t])
            .map((t) => ({ tagId: tagIds[t] })),
        },
      },
    });
    postIdBySlug[post.slug] = created.id;
  }
  console.log(`✅ Blog posts: ${blogPostsData.length}`);

  // ── Projects ────────────────────────────────────────────────────────────────
  const projectsData = [
    {
      title: "Trajectory AI Chatbot for Drone Flight Route Reservations",
      slug: "ai-chatbot-drone-flight-route-reservations",
      summary:
        "Conversational AI platform built for Trajectory's drone flight operations, helping operators query flight areas, routes, and reservation schedules through Rocket.Chat, Amazon Lex V2, and Go-based backend services.",
      problem:
        "Users needed a reliable conversational way to retrieve drone flight route and reservation information across multiple systems. The solution also had to handle Japanese NLU constraints, authentication, time ranges, and service-to-service communication.",
      solution:
        "Built a Rocket.Chat-integrated chatbot server using Go and Gin with Amazon Lex V2 for intent and slot extraction. Connected it to a Go and Gin reservation resource server over gRPC and PostgreSQL/RDS, with MongoDB for chat data and Amazon S3 for attachments. Refined slot design with FreeFormInput, TimeEnd, session timeout, and error handling.",
      role: "Cloud Architect & Senior Backend Engineer - designed service boundaries and integration flows, implemented chatbot and reservation services, integrated Amazon Lex and Rocket.Chat webhooks, refined Japanese conversation flows, supported authentication and deployment, and led end-to-end testing.",
      stack: ["Go", "Gin", "Amazon Lex V2", "Rocket.Chat", "gRPC", "PostgreSQL", "Amazon RDS", "MongoDB", "Amazon S3", "Docker", "AWS EC2", "AWS ALB", "Route 53", "CloudWatch"],
      outcome:
        "Delivered ChatBot Server v0.4.2 with all eight functional test cases passing in the final report. Resolved route-list presentation, time-range queries, Japanese slot handling, admin-user filtering, and session-timeout issues.",
      year: 2026,
      category: "AI & LLM",
      featured: true,
      sortOrder: 1,
      coverImageUrl: null,
      links: [],
    },
    {
      title: "Interactive AI Learning Platform PoC",
      slug: "interactive-ai-learning-platform-poc",
      summary:
        "AI-powered interactive lecture platform designed to help students ask questions in real time, receive instant explanations, and complete adaptive knowledge checks.",
      problem:
        "Traditional video-based learning can leave students waiting for clarification and makes it difficult to identify knowledge gaps. The PoC needed to combine real-time Q&A, progress visibility, and personalized follow-up within one learning experience.",
      solution:
        "Defined a phased PoC architecture combining lecture content processing, AI question answering, automatically generated or instructor-authored checkpoints, instant explanation generation, learning history, and an AI tutor avatar. The plan included model and API comparison, structured content ingestion, backend services, a responsive student UI, admin history management, and AWS deployment.",
      role: "Cloud Architect & Senior Backend Engineer - contributed to the cloud and backend architecture, AI integration boundaries, data flows, API and error-handling approach, and operational plan for a secure, extensible education platform.",
      stack: ["AWS", "OpenAI API", "Google Cloud AI", "LLM Evaluation", "Backend APIs", "PostgreSQL", "Responsive Web UI", "AI Tutor Avatar"],
      outcome:
        "Defined a 10-month, four-phase PoC plan covering AI model research, real-time Q&A, checkpoint generation, student UI, history and admin workflows, pilot evaluation, and tuning. Success criteria targeted at least 80% question-answering accuracy, responses within 10 seconds, and a smooth interactive learning experience, with production-scale delivery treated as a follow-on phase.",
      year: 2025,
      category: "AI & LLM",
      featured: false,
      sortOrder: 2,
      coverImageUrl: null,
      links: [],
    },
    {
      title: "i-Nose C-19 ML Model",
      slug: "i-nose-c19-ml-model",
      summary:
        "Deep learning model for non-invasive COVID-19 detection using electronic nose sensor arrays, deployed for edge inference on Raspberry Pi.",
      problem:
        "Electronic nose signals from underarm sweat can contain invalid or anomalous observations that reduce data quality and make downstream respiratory-infection screening less reliable.",
      solution:
        "Developed an adaptive filtering approach that combines a deep neural network with self-feature extraction to detect outliers in electronic-nose signals. Compared the method with SVM, Naive Bayes, k-NN, Random Forest, XGBoost, and Euclidean z-score baselines, with a focus on real-time use.",
      role: "First author and Machine Learning Engineer - contributed to the signal-processing and machine-learning design, feature extraction, model training and evaluation, comparative analysis, and research publication.",
      stack: ["Python", "TensorFlow", "TFLite", "NumPy", "scikit-learn", "Raspberry Pi"],
      outcome:
        "The adaptive DNN with self-feature extraction achieved 90.4% average balanced accuracy for outlier detection and outperformed the evaluated baseline methods. The approach was designed to support real-time electronic-nose filtering and improve downstream screening performance. Published in the peer-reviewed Elsevier journal Sensing and Bio-Sensing Research, Volume 36, Article 100492 (2022).",
      year: 2021,
      category: "Machine Learning",
      featured: false,
      sortOrder: 3,
      coverImageUrl: null,
      links: [
        {
          label: "University news",
          url: "https://www.its.ac.id/news/en/its-develops-i-nose-c-19-covid-19-detector-through-underarm-sweat-odor/",
        },
        {
          label: "Research paper",
          url: "https://www.sciencedirect.com/science/article/pii/S2214180422000216",
        },
      ],
    },
  ];

  for (const proj of projectsData) {
    const existing = await prisma.project.findUnique({ where: { slug: proj.slug } });
    if (existing) continue;

    const catId = categories[proj.category];
    await prisma.project.create({
      data: {
        title: proj.title,
        slug: proj.slug,
        summary: proj.summary,
        problem: proj.problem,
        solution: proj.solution,
        role: proj.role,
        stack: proj.stack,
        outcome: proj.outcome,
        year: proj.year,
        categoryId: catId ?? null,
        featured: proj.featured,
        sortOrder: proj.sortOrder,
        status: "published",
        coverImageUrl: proj.coverImageUrl,
        links: proj.links,
      },
    });
  }
  console.log(`✅ Projects: ${projectsData.length}`);

  // ── Comments (seed demo data) ───────────────────────────────────────────────
  const webhookPostId = postIdBySlug["designing-reliable-payment-webhooks-production-systems"];
  const grpcPostId = postIdBySlug["structure-backend-services-microservices-grpc"];
  const awsPostId = postIdBySlug["practical-aws-architecture-small-engineering-teams"];

  if (webhookPostId) {
    const existingComment = await prisma.comment.findFirst({
      where: { blogPostId: webhookPostId, authorName: "Alex Chen" },
    });
    if (!existingComment) {
      await prisma.comment.createMany({
        data: [
          {
            blogPostId: webhookPostId,
            authorName: "Alex Chen",
            authorEmail: "alex@example.com",
            content:
              "Great article! The idempotency pattern using event IDs saved us from double-billing issues in production.",
            status: CommentStatus.approved,
            approvedAt: new Date("2024-03-16T10:23:00Z"),
            createdAt: new Date("2024-03-16T10:23:00Z"),
          },
          {
            blogPostId: webhookPostId,
            authorName: "Sarah Kim",
            authorEmail: "sarah@example.com",
            content:
              "How do you handle the case where the database transaction succeeds but the response to Stripe times out?",
            status: CommentStatus.pending,
            createdAt: new Date("2024-03-17T14:45:00Z"),
          },
        ],
      });
    }
  }

  if (grpcPostId) {
    const existingComment = await prisma.comment.findFirst({
      where: { blogPostId: grpcPostId, authorName: "Miguel Santos" },
    });
    if (!existingComment) {
      await prisma.comment.create({
        data: {
          blogPostId: grpcPostId,
          authorName: "Miguel Santos",
          authorEmail: "miguel@example.com",
          content:
            "We're migrating from REST to gRPC for internal services and this breakdown of status codes is exactly what I needed.",
          status: CommentStatus.pending,
          createdAt: new Date("2024-02-21T09:12:00Z"),
        },
      });
    }
  }

  if (awsPostId) {
    const existingComment = await prisma.comment.findFirst({
      where: { blogPostId: awsPostId, authorName: "Yuki Tanaka" },
    });
    if (!existingComment) {
      await prisma.comment.createMany({
        data: [
          {
            blogPostId: awsPostId,
            authorName: "spam_bot_9000",
            authorEmail: "spam@malicious.xyz",
            content: "CLICK HERE FOR FREE AWS CREDITS!!!",
            status: CommentStatus.spam,
            createdAt: new Date("2024-01-11T03:00:00Z"),
          },
          {
            blogPostId: awsPostId,
            authorName: "Yuki Tanaka",
            authorEmail: "yuki@example.com",
            content:
              "The point about not copying enterprise patterns before you have enterprise problems really resonated.",
            status: CommentStatus.approved,
            approvedAt: new Date("2024-01-12T16:30:00Z"),
            createdAt: new Date("2024-01-12T16:30:00Z"),
          },
        ],
      });
    }
  }
  console.log("✅ Sample comments");

  // ── Contact Submissions ─────────────────────────────────────────────────────
  const existingContact = await prisma.contactSubmission.findFirst({
    where: { email: "haruto@techco-japan.com" },
  });
  if (!existingContact) {
    await prisma.contactSubmission.createMany({
      data: [
        {
          name: "Haruto Yamamoto",
          email: "haruto@techco-japan.com",
          company: "TechCo Japan",
          subject: "Backend Engineering Role - Fintech Startup",
          message:
            "Hi Doni, we're a Japanese fintech startup looking for a senior backend engineer with payment experience. Would you be open to a call?",
          status: ContactStatus.read,
          createdAt: new Date("2024-03-18T08:00:00Z"),
        },
        {
          name: "Budi Santoso",
          email: "budi@startup.id",
          company: "Startup.id",
          subject: "Technical Consulting - AWS Architecture",
          message:
            "Doni, I read your AWS architecture article. We need help designing our infrastructure for scale. Would you be available for a consulting engagement?",
          status: ContactStatus.new,
          createdAt: new Date("2024-03-20T11:30:00Z"),
        },
        {
          name: "Emma Wilson",
          email: "emma@remotework.io",
          company: "RemoteWork.io",
          subject: "AI Backend Engineer Position",
          message:
            "We're building an AI-first product and looking for someone with LLM integration experience. Are you open to remote opportunities?",
          status: ContactStatus.new,
          createdAt: new Date("2024-03-21T14:15:00Z"),
        },
        {
          name: "Rizki Pratama",
          email: "rizki@dev.com",
          subject: "Question about gRPC article",
          message:
            "How do you propagate errors from nested service calls while preserving the original gRPC status code?",
          status: ContactStatus.replied,
          createdAt: new Date("2024-02-22T09:00:00Z"),
        },
      ],
    });
  }
  console.log("✅ Contact submissions");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
