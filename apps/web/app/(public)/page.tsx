import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Mail,
  Server,
  Cloud,
  CreditCard,
  Brain,
  Calendar,
  Clock,
} from "lucide-react";
import { publicApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/metadata";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = buildMetadata({
  title: "Cloud Architect & Senior Backend Engineer",
  description:
    "Portfolio of Doni Putra Purbawa, Cloud Architect and Senior Backend Engineer building AWS infrastructure, fintech platforms, and AI-powered backend systems.",
  path: "/",
  imageTitle: "Doni Putra Purbawa",
  imageDescription: "Cloud Architect and Senior Backend Engineer for AWS, fintech, microservices, and AI systems.",
});

const expertise = [
  {
    icon: Cloud,
    title: "Cloud Architecture",
    description:
      "Designing AWS production environments with EC2, RDS, S3, CloudFront, IAM, observability, and CI/CD foundations.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Server,
    title: "Backend Platforms",
    description:
      "Building scalable REST APIs, microservices, and gRPC services with Node.js, Java, Golang, and PostgreSQL.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: CreditCard,
    title: "Payment Systems",
    description:
      "Stripe, PayPal, GMO, Square integrations with subscription billing, webhook processing, and reconciliation.",
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: Brain,
    title: "AI-Powered Applications",
    description:
      "LLM orchestration with OpenAI and Gemini, RAG pipelines, vector search, and ML model deployment.",
    color: "text-amber-600 bg-amber-50",
  },
];

const highlights = [
  "Cloud architecture for production SaaS workloads on AWS",
  "6+ years backend and platform engineering experience",
  "Hands-on infrastructure design across EC2, RDS, S3, CloudFront, IAM, and CI/CD",
  "Payment gateway integrations across 4 providers",
  "LLM integrations and ML research published in Q1 journal",
  "Engineering Manager leading a team of 6 engineers",
  "Open to Japan relocation — JLPT N4",
];

export default async function Home() {
  const [projectsRes, blogsRes] = await Promise.all([
    publicApi.getProjects({ featured: "true", pageSize: "3" }),
    publicApi.getBlogs({ pageSize: "3" }),
  ]);

  const featuredProjects = projectsRes?.data ?? [];
  const latestPosts = blogsRes?.data ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-white" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            {/* Profile photo */}
            <div className="order-first flex-shrink-0 lg:order-last">
              <div className="relative mx-auto w-fit lg:mx-0">
                <img
                  src="/profile.png"
                  alt="Doni Putra Purbawa"
                  className="h-48 w-48 rounded-2xl object-cover shadow-xl ring-4 ring-white sm:h-56 sm:w-56"
                />
                <div className="absolute -bottom-3 -right-3 rounded-xl border border-white bg-blue-600 px-3 py-1.5 shadow-lg">
                  <p className="text-xs font-semibold text-white">Available</p>
                </div>
              </div>
            </div>

          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Available for new opportunities
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Doni Putra Purbawa
            </h1>
            <p className="mt-3 text-xl font-medium text-blue-600 sm:text-2xl">
              Cloud Architect & Senior Backend Engineer
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              Designing AWS cloud architecture and reliable backend platforms for fintech, SaaS,
              and AI-powered products. 6+ years turning complex requirements into production-grade
              systems.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                View Projects <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Read Blogs
              </Link>
              <a
                href="/files/doni-putra-purbawa-cv.pdf"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Download CV
              </a>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Core Expertise</h2>
            <p className="mt-2 text-slate-500">
              Focused on cloud architecture, backend platforms, and production reliability
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {expertise.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className={`mb-4 inline-flex rounded-lg p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Featured Projects</h2>
              <p className="mt-1 text-slate-500">Selected case studies from production systems</p>
            </div>
            <Link
              href="/projects"
              className="hidden items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 sm:flex"
            >
              All projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects#${project.slug}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="mb-3">
                  <Badge variant="blue">{project.category?.name ?? "Project"}</Badge>
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-blue-700">
                  {project.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-500">
                  {project.summary}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.stack.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="gray">
                      {tech}
                    </Badge>
                  ))}
                  {project.stack.length > 4 && (
                    <Badge variant="gray">+{project.stack.length - 4}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/projects"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all projects <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Blogs */}
      <section className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Latest Articles</h2>
              <p className="mt-1 text-slate-500">Technical writing on backend, cloud, and AI</p>
            </div>
            <Link
              href="/blogs"
              className="hidden items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 sm:flex"
            >
              All articles <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {latestPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blogs/${post.slug}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="mb-3">
                  <Badge variant="blue">{post.category?.name ?? "Article"}</Badge>
                </div>
                <h3 className="mb-2 font-semibold text-slate-900 group-hover:text-blue-700 line-clamp-2">
                  {post.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTimeMinutes} min read
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center sm:hidden">
            <Link href="/blogs" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all articles <ArrowRight className="inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Professional Highlights
              </h2>
              <p className="mt-2 text-slate-500">
                A snapshot of what I bring to engineering teams
              </p>
              <ul className="mt-6 space-y-3">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    </div>
                    <span className="text-slate-700">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-blue-100 bg-blue-50 p-8">
              <h3 className="text-xl font-bold text-slate-900">Open to Opportunities</h3>
              <p className="mt-3 text-slate-600">
                I&apos;m available for cloud architect, senior backend, or platform engineering
                roles — remote or relocating to Japan. Let&apos;s talk about how I can help your
                team design and ship reliable systems.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <Mail className="h-4 w-4" /> Get In Touch
                </Link>
                <a
                  href="/files/doni-putra-purbawa-cv.pdf"
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  <Download className="h-4 w-4" /> Download CV
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
