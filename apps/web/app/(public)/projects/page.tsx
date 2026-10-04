import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publicApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/metadata";
import { ProjectImage } from "@/components/public/ProjectImage";

export const metadata: Metadata = buildMetadata({
  title: "Projects",
  description:
    "Technical case studies in voice-powered AI editing, document intelligence, cloud architecture, conversational AI, and electronic-nose research by Doni Putra Purbawa.",
  path: "/projects",
  imageTitle: "Selected work",
});

export default async function Projects() {
  const res = await publicApi.getProjects({ pageSize: "100" });
  const projects = [...(res?.data ?? [])].sort(
    (a, b) =>
      (b.year ?? 0) - (a.year ?? 0) ||
      a.sortOrder - b.sortOrder ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return (
    <div className="projects-page">
      <section className="page-masthead">
        <div className="site-container">
          <p className="eyebrow">Selected work</p>
          <h1>
            Built with purpose<span>.</span>
          </h1>
          <p>
            Real problems. Considered architecture. Practical outcomes.
            <br />A closer look at the systems and research behind my work.
          </p>
        </div>
      </section>
      <div className="site-container project-catalog">
        {projects.map((project, i) => (
          <article
            key={project.id}
            id={project.slug}
            className="project-catalog-item"
          >
            <Link
              href={`/projects/${project.slug}`}
              className="project-catalog-cover"
              aria-label={`Read ${project.title}`}
            >
              <ProjectImage project={project} priority={i === 0} />
            </Link>
            <div className="project-catalog-copy">
              <p className="article-category">
                {project.category?.name ?? "Project"}
                <span>{project.year}</span>
              </p>
              <h2>
                <Link href={`/projects/${project.slug}`}>{project.title}</Link>
              </h2>
              <p>{project.summary}</p>
              <div className="stack-list">
                {project.stack.slice(0, 5).map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
              <Link href={`/projects/${project.slug}`} className="text-link">
                Explore case study <ArrowUpRight size={17} />
              </Link>
            </div>
          </article>
        ))}
        {projects.length === 0 && (
          <div className="empty-state">
            {res
              ? "New case studies are on their way."
              : "Projects are temporarily unavailable. Please try again shortly."}
          </div>
        )}
      </div>
    </div>
  );
}
