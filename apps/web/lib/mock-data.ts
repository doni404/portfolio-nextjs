export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  publishedAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  readingTime: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
  seoTitle?: string;
  seoDescription?: string;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  problem: string;
  solution: string;
  role: string;
  stack: string[];
  outcome: string;
  year: number;
  category: string;
  featured: boolean;
  sortOrder: number;
  status: "published" | "draft" | "archived";
  links?: { label: string; url: string }[];
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  summary: string;
  highlights: string[];
  technologies: string[];
  sortOrder: number;
};

export type Comment = {
  id: string;
  postId: string;
  postTitle: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "spam";
  createdAt: string;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Designing Reliable Payment Webhooks for Production Systems",
    slug: "designing-reliable-payment-webhooks-production-systems",
    excerpt:
      "Learn how to design idempotent, resilient webhook handlers for Stripe, PayPal, and GMO that survive retries, network failures, and race conditions.",
    content: `# Designing Reliable Payment Webhooks for Production Systems

Payment webhooks are the backbone of any modern billing system. When a payment is processed, refunded, or fails, your system receives a webhook notification from the payment provider. Getting this right is critical — a missed or double-processed webhook can mean lost revenue or duplicate charges.

## The Core Problem

Webhooks are HTTP POST requests sent by payment providers to your endpoint. The fundamental challenge is that **the same event can be delivered multiple times**. Network issues, timeouts, and provider retry logic mean you cannot assume a webhook arrives exactly once.

## Idempotency is Everything

The most important property your webhook handler must have is **idempotency** — processing the same event twice should produce the same result as processing it once.

\`\`\`typescript
async function handleStripeWebhook(event: Stripe.Event) {
  // Check if we've already processed this event
  const existing = await db.processedEvents.findUnique({
    where: { stripeEventId: event.id }
  });
  
  if (existing) {
    return { status: 'already_processed' };
  }

  // Process in a transaction
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

\`\`\`typescript
app.post('/webhooks/stripe', async (req, res) => {
  // Verify signature
  const event = verifyStripeSignature(req);
  
  // Enqueue for processing
  await queue.add('stripe-webhook', { event });
  
  // Acknowledge immediately
  res.json({ received: true });
});
\`\`\`

## Key Lessons from Production

1. **Store raw event payloads** — you'll need them for debugging
2. **Implement retry-with-backoff** for downstream service calls
3. **Alert on processing failures** — a dead webhook means lost business logic
4. **Test with provider simulators** — Stripe CLI is excellent for this
5. **Monitor webhook latency** — providers retry if you're slow to respond

## GMO Payment Gateway Specifics

Working with GMO (a Japanese payment provider) required special handling because their webhook format differs significantly from Stripe. Key differences include form-encoded bodies instead of JSON and different signature algorithms.

Production webhook reliability comes down to: verify early, acknowledge fast, process idempotently, and monitor everything.`,
    publishedAt: "2024-03-15",
    updatedAt: "2024-03-15",
    category: "Payment Systems",
    tags: ["Stripe", "PayPal", "GMO", "Webhooks", "Node.js"],
    readingTime: 8,
    featured: true,
    status: "published",
  },
  {
    id: "2",
    title: "How I Structure Backend Services with Microservices and gRPC",
    slug: "structure-backend-services-microservices-grpc",
    excerpt:
      "A practical guide to designing microservices communication with gRPC, including service discovery, error handling, and the lessons learned from production systems.",
    content: `# How I Structure Backend Services with Microservices and gRPC

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

message PaymentRequest {
  string order_id = 1;
  int64 amount_cents = 2;
  string currency = 3;
  string provider = 4;
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
  // Unknown errors become INTERNAL
  logger.error(err);
  throw { code: status.INTERNAL, message: 'Internal server error' };
}
\`\`\`

## Production Lessons

The biggest surprise was how much time goes into **observability**, not code. Every gRPC call needs distributed tracing, structured logs with correlation IDs, and SLO-based alerting.`,
    publishedAt: "2024-02-20",
    updatedAt: "2024-02-20",
    category: "Backend Engineering",
    tags: ["gRPC", "Microservices", "Node.js", "System Design"],
    readingTime: 10,
    featured: false,
    status: "published",
  },
  {
    id: "3",
    title: "Practical AWS Architecture for Small Engineering Teams",
    slug: "practical-aws-architecture-small-engineering-teams",
    excerpt:
      "How to build a cost-effective, production-ready AWS setup for a startup or small team — covering EC2, RDS, S3, IAM, and the monitoring stack that actually matters.",
    content: `# Practical AWS Architecture for Small Engineering Teams

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
    publishedAt: "2024-01-10",
    updatedAt: "2024-01-10",
    category: "Cloud & DevOps",
    tags: ["AWS", "EC2", "RDS", "IAM", "Infrastructure"],
    readingTime: 12,
    featured: true,
    status: "published",
  },
  {
    id: "4",
    title: "Building AI Chatbots with LLM APIs in Backend Systems",
    slug: "building-ai-chatbots-llm-apis-backend-systems",
    excerpt:
      "A backend engineer's guide to integrating OpenAI and Gemini APIs — covering streaming, context management, rate limiting, cost control, and production patterns.",
    content: `# Building AI Chatbots with LLM APIs in Backend Systems

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
    publishedAt: "2023-12-05",
    updatedAt: "2023-12-05",
    category: "AI & LLM",
    tags: ["OpenAI", "Gemini", "AI", "Node.js", "Backend Engineering"],
    readingTime: 9,
    featured: false,
    status: "published",
  },
  {
    id: "5",
    title: "Lessons from Deep Learning Anomaly Detection on Sensor Data",
    slug: "lessons-deep-learning-anomaly-detection-sensor-data",
    excerpt:
      "What I learned building an ML model for COVID-19 detection using electronic nose sensor data — from data preprocessing and TensorFlow model design to edge inference on Raspberry Pi.",
    content: `# Lessons from Deep Learning Anomaly Detection on Sensor Data

This post covers the research and engineering behind the i-Nose C-19 project — a deep learning system for detecting COVID-19 biomarkers using an electronic nose (e-nose) sensor array and TensorFlow.

## The Problem

Traditional COVID-19 detection required expensive lab equipment or slow antigen tests. We explored whether exhaled breath patterns captured by MOS (Metal Oxide Semiconductor) sensors could distinguish COVID-19 positive samples.

## Data Collection Challenges

The hardest part wasn't the model — it was the data pipeline. Each breath sample produced a time-series of 8 sensor readings over 60 seconds. Noise, sensor drift, and environmental variation required careful preprocessing.

\`\`\`python
def preprocess_sensor_data(raw_readings: np.ndarray) -> np.ndarray:
    # Normalize per-sensor to account for drift
    normalized = (raw_readings - raw_readings.mean(axis=0)) / raw_readings.std(axis=0)
    
    # Extract features: baseline ratio, area under curve, peak response
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
    publishedAt: "2023-11-01",
    updatedAt: "2023-11-01",
    category: "Machine Learning",
    tags: [
      "TensorFlow",
      "Deep Learning",
      "Anomaly Detection",
      "Python",
      "Raspberry Pi",
    ],
    readingTime: 11,
    featured: false,
    status: "published",
  },
  {
    id: "6",
    title: "Draft: Advanced PostgreSQL Query Optimization",
    slug: "advanced-postgresql-query-optimization",
    excerpt: "Work in progress — techniques for optimizing complex queries.",
    content: "Draft content...",
    publishedAt: "2024-04-01",
    updatedAt: "2024-04-01",
    category: "Backend Engineering",
    tags: ["PostgreSQL", "Database"],
    readingTime: 7,
    featured: false,
    status: "draft",
  },
];

export const projects: Project[] = [
  {
    id: "1",
    title: "Payment Gateway & Subscription Platform",
    slug: "payment-gateway-subscription-platform",
    summary:
      "A unified payment backend supporting Stripe, PayPal, GMO, and Square with subscription billing, webhook processing, and financial reconciliation.",
    problem:
      "The company needed to support payments across multiple providers (Stripe for global, GMO for Japan, PayPal for legacy integrations) with consistent subscription management and reliable reconciliation.",
    solution:
      "Built a provider-agnostic payment abstraction layer in Node.js with adapter patterns for each provider. Implemented idempotent webhook processing with PostgreSQL event deduplication, automated retry logic, and a reconciliation job that runs nightly.",
    role: "Lead Backend Engineer — designed the architecture, implemented all payment adapters, led code review, and maintained production operations.",
    stack: ["Node.js", "TypeScript", "Stripe", "PayPal", "GMO", "Square", "PostgreSQL", "Redis", "AWS SQS"],
    outcome:
      "Processed over $2M in transactions with 99.97% webhook processing reliability. Reduced payment failures by 40% through intelligent retry logic. Supported 3 new payment providers without changing core billing logic.",
    year: 2022,
    category: "Payment Systems",
    featured: true,
    sortOrder: 1,
    status: "published",
  },
  {
    id: "2",
    title: "Scalable Backend Microservices on AWS",
    slug: "scalable-backend-microservices-aws",
    summary:
      "Decomposed a monolithic backend into domain-focused microservices on AWS with Docker, gRPC internal communication, and auto-scaling infrastructure.",
    problem:
      "A growing monolith was causing deployment friction, scaling bottlenecks, and increasingly complex CI/CD pipelines. Teams stepped on each other during deployments.",
    solution:
      "Migrated to microservices with clear domain boundaries (auth, payments, notifications, analytics). Used gRPC for internal service communication and REST for public APIs. Deployed on EC2 with Docker Compose for MVP and later ECS for production scaling.",
    role: "Cloud Solution Architect and Backend Lead — defined service boundaries, designed gRPC contracts, led infrastructure migration, and mentored team on Docker and AWS.",
    stack: ["Node.js", "Docker", "gRPC", "AWS EC2", "AWS ALB", "RDS", "Redis", "GitHub Actions"],
    outcome:
      "Reduced deployment time from 45 minutes to 8 minutes. Enabled independent scaling of payment processing (3x) during peak periods. Team velocity increased 30% after clear service ownership was established.",
    year: 2021,
    category: "Cloud & DevOps",
    featured: true,
    sortOrder: 2,
    status: "published",
  },
  {
    id: "3",
    title: "AI Chatbot & Recommendation Backend",
    slug: "ai-chatbot-recommendation-backend",
    summary:
      "Backend orchestration layer for an AI-powered customer support chatbot with product recommendations using OpenAI GPT-4, vector similarity search, and real-time streaming.",
    problem:
      "Customer support volume was growing faster than the team. The goal was to resolve 60%+ of common queries automatically while maintaining quality, with smart product recommendations integrated into conversations.",
    solution:
      "Built a backend orchestration service that manages conversation context, handles streaming responses, integrates with a vector database for product knowledge retrieval (RAG pattern), and falls back gracefully to human agents when confidence is low.",
    role: "Backend Lead — designed the orchestration architecture, built the RAG pipeline, implemented streaming, and integrated with the existing product catalog API.",
    stack: ["Node.js", "TypeScript", "OpenAI", "Gemini", "pgvector", "PostgreSQL", "Redis", "AWS Lambda"],
    outcome:
      "Automated resolution of 68% of support queries. Average response time dropped from 4 hours to under 30 seconds. Recommendation click-through rate was 22%, significantly above the 8% baseline.",
    year: 2023,
    category: "AI/LLM Applications",
    featured: true,
    sortOrder: 3,
    status: "published",
  },
  {
    id: "4",
    title: "i-Nose C-19 ML Model",
    slug: "i-nose-c19-ml-model",
    summary:
      "Deep learning model for non-invasive COVID-19 detection using electronic nose sensor arrays, deployed for edge inference on Raspberry Pi.",
    problem:
      "Needed a fast, non-invasive preliminary COVID-19 screening tool that could work without lab equipment, using exhaled breath biomarker patterns captured by MOS sensors.",
    solution:
      "Designed and trained a CNN-LSTM hybrid model in TensorFlow to classify 8-channel time-series sensor data. Built the data preprocessing pipeline, handled sensor drift correction, and optimized the model for TFLite edge deployment.",
    role: "Machine Learning Engineer — led model design, preprocessing pipeline, training experiments, quantization for edge deployment, and co-authored the research paper.",
    stack: ["Python", "TensorFlow", "TFLite", "NumPy", "scikit-learn", "Raspberry Pi"],
    outcome:
      "Achieved 94% classification accuracy on held-out test data. Published in Elsevier Q1 journal. TFLite model ran in under 200ms on Raspberry Pi 4, enabling real-time screening.",
    year: 2021,
    category: "Machine Learning",
    featured: false,
    sortOrder: 4,
    status: "published",
  },
];

export const experiences: Experience[] = [
  {
    id: "1",
    company: "Gloding, Inc.",
    role: "Backend Engineering Manager (Hands-on)",
    location: "Japan (Remote from Indonesia)",
    startDate: "2020-01-01",
    endDate: undefined,
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
    id: "2",
    company: "Gloding, Inc.",
    role: "Cloud Solution Architect (Hands-on)",
    location: "Japan (Remote from Indonesia)",
    startDate: "2018-01-01",
    endDate: "2020-01-01",
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
    id: "3",
    company: "Gloding, Inc.",
    role: "Backend Developer",
    location: "Japan (Remote from Indonesia)",
    startDate: "2017-10-01",
    endDate: "2018-01-01",
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
    id: "4",
    company: "PT. Hikari Solusindo Sukses",
    role: "Machine Learning Engineer (Contract)",
    location: "Indonesia",
    startDate: "2021-08-01",
    endDate: "2021-12-01",
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

export const comments: Comment[] = [
  {
    id: "1",
    postId: "1",
    postTitle: "Designing Reliable Payment Webhooks for Production Systems",
    authorName: "Alex Chen",
    authorEmail: "alex@example.com",
    content:
      "Great article! The idempotency pattern using event IDs saved us from double-billing issues in production. We use the same approach with SQS message deduplication.",
    status: "approved",
    createdAt: "2024-03-16T10:23:00Z",
  },
  {
    id: "2",
    postId: "1",
    postTitle: "Designing Reliable Payment Webhooks for Production Systems",
    authorName: "Sarah Kim",
    authorEmail: "sarah@example.com",
    content:
      "How do you handle the case where the database transaction succeeds but the response to Stripe times out? Do you have a reconciliation job for that?",
    status: "pending",
    createdAt: "2024-03-17T14:45:00Z",
  },
  {
    id: "3",
    postId: "2",
    postTitle: "How I Structure Backend Services with Microservices and gRPC",
    authorName: "Miguel Santos",
    authorEmail: "miguel@example.com",
    content:
      "We're migrating from REST to gRPC for internal services and this breakdown of status codes is exactly what I needed. Bookmarked!",
    status: "pending",
    createdAt: "2024-02-21T09:12:00Z",
  },
  {
    id: "4",
    postId: "3",
    postTitle: "Practical AWS Architecture for Small Engineering Teams",
    authorName: "spam_bot_9000",
    authorEmail: "spam@malicious.xyz",
    content: "CLICK HERE FOR FREE AWS CREDITS!!! Visit spam-site.xyz",
    status: "spam",
    createdAt: "2024-01-11T03:00:00Z",
  },
  {
    id: "5",
    postId: "3",
    postTitle: "Practical AWS Architecture for Small Engineering Teams",
    authorName: "Yuki Tanaka",
    authorEmail: "yuki@example.com",
    content:
      "The point about not copying enterprise patterns before you have enterprise problems really resonated. We over-engineered our first startup's AWS setup badly.",
    status: "approved",
    createdAt: "2024-01-12T16:30:00Z",
  },
];

export const contactSubmissions: ContactSubmission[] = [
  {
    id: "1",
    name: "Haruto Yamamoto",
    email: "haruto@techco-japan.com",
    company: "TechCo Japan",
    subject: "Backend Engineering Role - Fintech Startup",
    message:
      "Hi Doni, we're a Japanese fintech startup looking for a senior backend engineer with payment experience. Your profile is exactly what we need. Would you be open to a call?",
    status: "read",
    createdAt: "2024-03-18T08:00:00Z",
  },
  {
    id: "2",
    name: "Budi Santoso",
    email: "budi@startup.id",
    company: "Startup.id",
    subject: "Technical Consulting - AWS Architecture",
    message:
      "Doni, I read your AWS architecture article. We need help designing our infrastructure for scale. Would you be available for a consulting engagement?",
    status: "new",
    createdAt: "2024-03-20T11:30:00Z",
  },
  {
    id: "3",
    name: "Emma Wilson",
    email: "emma@remotework.io",
    company: "RemoteWork.io",
    subject: "AI Backend Engineer Position",
    message:
      "We're building an AI-first product and looking for someone with LLM integration experience. Your chatbot article was insightful. Are you open to remote opportunities?",
    status: "new",
    createdAt: "2024-03-21T14:15:00Z",
  },
  {
    id: "4",
    name: "Rizki Pratama",
    email: "rizki@dev.com",
    subject: "Question about gRPC article",
    message:
      "Hi, I have a question about the gRPC error handling pattern you described. How do you propagate errors from nested service calls while preserving the original status code?",
    status: "replied",
    createdAt: "2024-02-22T09:00:00Z",
  },
];

export const categories = [
  "Backend Engineering",
  "Cloud & DevOps",
  "Payment Systems",
  "AI & LLM",
  "Machine Learning",
  "Career & Japan",
  "Tutorials",
];

export const dashboardStats = {
  publishedPosts: 5,
  draftPosts: 1,
  pendingComments: 2,
  newContactSubmissions: 2,
  featuredProjects: 3,
};
