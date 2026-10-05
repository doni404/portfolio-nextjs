import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Cloud,
  CreditCard,
  Download,
  Plus,
  Rss,
  Server,
} from "lucide-react";
import { publicApi } from "@/lib/server-api";
import { buildMetadata, siteConfig } from "@/lib/metadata";
import { ArticleMeta } from "@/components/public/ArticleMeta";
import { ProjectImage } from "@/components/public/ProjectImage";
import { ArchitectureScene } from "@/components/public/ArchitectureScene";

export const metadata: Metadata = buildMetadata({
  description:
    "Doni Putra Purbawa's journal and portfolio. Practical perspectives on AI, cloud architecture, fintech, and the engineering behind reliable products.",
  path: "/",
  imageTitle: "Doni Putra Purbawa",
  imageDescription:
    "Independent thinking. Practical engineering. AI, cloud, and what comes next.",
});

const expertise = [
  {
    icon: Cloud,
    title: "Cloud architecture",
    text: "AWS production environments with EC2, RDS, S3, CloudFront, IAM, observability, and CI/CD. Infrastructure that teams can operate with confidence.",
  },
  {
    icon: Server,
    title: "Backend platforms",
    text: "REST APIs, microservices, and gRPC services with Node.js, Java, Go, and PostgreSQL. Clear boundaries, reliable data flows, and maintainable integrations.",
  },
  {
    icon: Brain,
    title: "Applied AI",
    text: "LLM orchestration with OpenAI and Gemini, RAG pipelines, vector search, and machine learning model deployment. Connecting intelligence to useful product experiences.",
  },
  {
    icon: CreditCard,
    title: "Fintech & payments",
    text: "Stripe, PayPal, GMO, and Square integrations, including subscription billing, resilient webhooks, and reconciliation.",
  },
];

export default async function Home() {
  const [projectsRes, blogsRes] = await Promise.all([
    publicApi.getProjects({ pageSize: "3" }),
    publicApi.getBlogs({ pageSize: "4" }),
  ]);
  const projects = projectsRes?.data ?? [];
  const posts = blogsRes?.data ?? [];
  const [lead, ...otherPosts] = posts;

  return (
    <>
      <section className="home-hero">
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              AI, engineering &amp; a little perspective
            </p>
            <h1>
              Doni Putra<span>.</span>
            </h1>
            <p className="hero-statement">
              Making sense of AI.
              <br />
              Building what comes <em>next.</em>
            </p>
            <p className="hero-description">
              Exploring AI news, research, and the ideas shaping how we work,
              with a hands-on perspective from cloud and backend engineering.
            </p>
            <div className="hero-actions">
              <Link href="/blogs" className="action-button mint-button">
                Explore the journal <ArrowUpRight size={18} />
              </Link>
              <Link href="/projects" className="hero-text-link">
                Selected work <ArrowRight size={17} />
              </Link>
            </div>
            <Link href="/about" className="hero-author">
              <Image
                src="/profile.png"
                width={44}
                height={44}
                alt="Doni Putra Purbawa"
                preload
              />
              <span>
                Doni Putra Purbawa
                <small>{siteConfig.authorTagline}</small>
              </span>
            </Link>
          </div>
          <ArchitectureScene />
        </div>
        <div className="site-container hero-footnote">
          <span>Independent thinking. Practical engineering.</span>
          <span>
            Indonesia <span aria-hidden="true">/</span> Open to the world{" "}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </section>

      <section className="editorial-section" id="journal">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The journal</p>
              <h2>
                Ideas worth a closer look<span>.</span>
              </h2>
            </div>
            <Link href="/blogs" className="text-link">
              All articles <ArrowUpRight size={17} />
            </Link>
          </div>
          {lead ? (
            <div className="journal-grid">
              <Link href={`/blogs/${lead.slug}`} className="lead-article">
                {lead.coverImageUrl && (
                  <Image
                    src={lead.coverImageUrl}
                    width={1200}
                    height={630}
                    unoptimized={lead.coverImageUrl.includes("/uploads/")}
                    alt={lead.title}
                    className="article-cover"
                    sizes="(max-width: 767px) 100vw, 700px"
                  />
                )}
                <div className="article-category">
                  {lead.category?.name ?? "Engineering"}
                  <ArrowUpRight size={22} />
                </div>
                <h3>{lead.title}</h3>
                <p>{lead.excerpt}</p>
                <ArticleMeta post={lead} />
                <span className="text-link">
                  Read the story <ArrowRight size={17} />
                </span>
              </Link>
              <div className="journal-list">
                {otherPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/blogs/${post.slug}`}
                    className="journal-entry"
                  >
                    <span className="entry-number">0{index + 2}</span>
                    <div>
                      <p className="article-category">
                        {post.category?.name ?? "Engineering"}
                      </p>
                      <h3>{post.title}</h3>
                      <ArticleMeta post={post} />
                    </div>
                    <ArrowUpRight size={18} />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>The next story is on its way.</p>
              <Link href="/blogs" className="text-link">
                Visit the journal <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="follow-band">
        <div className="site-container follow-inner">
          <div>
            <p className="eyebrow">Stay curious</p>
            <h2>
              A little signal.
              <br />
              Less noise.
            </h2>
          </div>
          <div>
            <p>
              New articles on AI, cloud, and the engineering behind it all.
              Follow the journal in your favorite feed reader.
            </p>
            <a href="/rss.xml" className="action-button forest-button">
              <Rss size={17} /> Follow via RSS <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <section className="editorial-section" id="work">
        <div className="site-container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">From thinking to building</p>
              <h2>
                Selected work<span>.</span>
              </h2>
            </div>
            <Link href="/projects" className="text-link">
              All projects <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="selected-projects">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}`}
                className={`selected-project ${index === 0 ? "primary-project" : ""}`}
              >
                {project.coverImageUrl && (
                  <div className="project-image-wrap">
                    <ProjectImage project={project} />
                  </div>
                )}
                <div className="project-preview-copy">
                  <p className="article-category">
                    {project.category?.name ?? "Project"}
                    {project.year && <span>{project.year}</span>}
                  </p>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <div className="stack-list">
                    {project.stack.slice(0, 4).map((tech) => (
                      <span key={tech}>{tech}</span>
                    ))}
                  </div>
                  <span className="text-link">
                    Explore project <ArrowUpRight size={17} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {projects.length === 0 && (
            <div className="empty-state">
              <Link href="/projects" className="text-link">
                Browse projects <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="expertise-section" id="expertise">
        <div className="site-container expertise-grid">
          <div>
            <p className="eyebrow">Behind the work</p>
            <h2>
              Built on
              <br />
              real experience<span>.</span>
            </h2>
            <p>
              6+ years building backend and platform systems, leading a team of
              6 engineers, and connecting cloud, fintech, and AI.
            </p>
            <div className="expertise-links">
              <Link href="/experience" className="text-link">
                My experience <ArrowUpRight size={17} />
              </Link>
              <a href="/files/doni-putra-purbawa-cv.pdf" className="text-link">
                <Download size={16} /> Download CV
              </a>
            </div>
          </div>
          <div className="expertise-accordion">
            {expertise.map(({ icon: Icon, title, text }, index) => (
              <details key={title} open={index === 0}>
                <summary>
                  <Icon size={20} />
                  <span>{title}</span>
                  <Plus size={18} className="accordion-plus" />
                </summary>
                <p>{text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-band">
        <div className="site-container contact-band-inner">
          <div>
            <p className="eyebrow">Good work starts with a conversation</p>
            <h2>
              What are you
              <br />
              building next?
            </h2>
          </div>
          <Link href="/contact" className="action-button mint-button">
            Let&apos;s talk <ArrowUpRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}
