import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { publicApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/metadata";
import { articleContent } from "@/lib/article-content";
import { mediaUrl } from "@/lib/media";
import { projectCover } from "@/lib/project-cover";
import { ProjectImage } from "@/components/public/ProjectImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbs, projectSchema } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = (await publicApi.getProject(slug))?.data;
  return project
    ? buildMetadata({
        title: project.title,
        description: project.summary,
        path: `/projects/${project.slug}`,
        image: mediaUrl(project.coverImageUrl),
      })
    : buildMetadata({
        title: "Project Not Found",
        path: `/projects/${slug}`,
        noIndex: true,
      });
}
export default async function ProjectDetail({ params }: Props) {
  const { slug } = await params;
  const [result, all] = await Promise.all([
    publicApi.getProject(slug),
    publicApi.getProjects({ pageSize: "100" }),
  ]);
  const project = result?.data;
  if (!project) notFound();
  const cover = projectCover(project.coverImageUrl, project.title);
  const liveProduct = project.links?.find(
    (link) => link.label === "Live product" && link.url.startsWith("https://"),
  );
  const sections = [
    ["The challenge", "challenge", project.problem],
    ["Architecture & approach", "approach", project.solution],
    ["My contribution", "contribution", project.role],
    ["Results & boundaries", "results", project.outcome],
  ].filter((section) => section[2]);
  const workflow = project.links?.find(
    (link) => link.label === "Technical workflow",
  );
  const next = all?.data.find((item) => item.id !== project.id);
  return (
    <div className="project-detail-page">
      <JsonLd data={[
        projectSchema(project),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }, { name: project.title, path: `/projects/${project.slug}` }]),
      ]} />
      <header className="project-detail-header site-container">
        <Link href="/projects" className="text-link">
          <ArrowLeft size={16} /> Selected work
        </Link>
        <p className="article-category">
          {project.category?.name ?? "Case study"}
          <span>{project.year}</span>
        </p>
        <h1>{project.title}</h1>
        <p className="reader-deck">{project.summary}</p>
        <div className="stack-list">
          {project.stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        {liveProduct && (
          <a
            href={liveProduct.url}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button mint-button project-live-link"
          >
            Visit product <ArrowUpRight size={18} />
          </a>
        )}
      </header>
      {project.coverImageUrl && (
        <figure className="site-container project-detail-cover">
          <ProjectImage project={project} priority />
          {cover.caption && (
            <figcaption>
              {cover.caption}{" "}
              {cover.credit && (
                <a
                  href={cover.credit.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {cover.credit.label}
                </a>
              )}
            </figcaption>
          )}
        </figure>
      )}
      <div className="site-container project-detail-layout">
        <aside className="case-navigation">
          <p className="eyebrow">Case study</p>
          <nav aria-label="Case study sections">
            {sections.map(([title, id]) => (
              <a key={id} href={`#${id}`}>
                {title}
              </a>
            ))}
            {workflow && <a href="#workflow">Technical workflow</a>}
          </nav>
          <Link href="/contact" className="text-link">
            Discuss a project <ArrowUpRight size={15} />
          </Link>
        </aside>
        <div className="project-detail-body">
          {sections.map(([title, id, body]) => (
            <section key={id} id={id}>
              <p className="eyebrow">{title}</p>
              <div
                className="prose reading-prose"
                dangerouslySetInnerHTML={{
                  __html: articleContent(body!, id).html,
                }}
              />
            </section>
          ))}
          {workflow && (
            <section id="workflow" className="technical-workflow">
              <h2>Technical workflow</h2>
              <a
                href={mediaUrl(workflow.url)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open full-size technical workflow"
              >
                <Image
                  src={mediaUrl(workflow.url)!}
                  alt={`${project.title} technical workflow supplied by Doni Putra`}
                  width={1306}
                  height={1204}
                  unoptimized
                  sizes="(max-width:767px) 100vw, 800px"
                />
              </a>
              <p>
                Original project reference image. The written case study takes
                precedence where an illustrative diagram differs from the
                documented implementation.
              </p>
            </section>
          )}
          {project.links?.filter((link) => link.label !== "Technical workflow")
            .length > 0 && (
            <section className="case-resources">
              <h2>References & further reading</h2>
              {project.links
                .filter((link) => link.label !== "Technical workflow")
                .map((link) => (
                  <a
                    key={link.url}
                    href={mediaUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link"
                  >
                    {link.label}
                    <ExternalLink size={14} />
                  </a>
                ))}
            </section>
          )}
        </div>
      </div>
      <div className="site-container case-next">
        <Link href="/projects" className="text-link">
          <ArrowLeft size={16} /> All projects
        </Link>
        {next && (
          <Link href={`/projects/${next.slug}`}>
            Next case study
            <em>
              {next.title} <ArrowUpRight size={20} />
            </em>
          </Link>
        )}
      </div>
    </div>
  );
}
