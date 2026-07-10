import type { Metadata } from "next";
import { publicApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/metadata";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Projects",
  description:
    "Case studies from Doni Putra Purbawa — payment systems, microservices, AI applications, and machine learning projects.",
  path: "/projects",
  imageTitle: "Backend & AI Projects",
  imageDescription: "Selected case studies in payment systems, microservices, AI applications, and machine learning.",
});

const categoryColors: Record<string, "blue" | "green" | "purple" | "yellow" | "red" | "gray"> = {
  "Payment Systems": "purple",
  "Cloud & DevOps": "green",
  "AI/LLM Applications": "blue",
  "Machine Learning": "yellow",
  "Backend Engineering": "blue",
};

export default async function Projects() {
  const res = await publicApi.getProjects({ pageSize: "50" });
  const publishedProjects = [...(res?.data ?? [])].sort((a, b) => {
    const yearDiff = (b.year ?? 0) - (a.year ?? 0);
    if (yearDiff !== 0) return yearDiff;

    const bDate = new Date(b.updatedAt ?? b.createdAt).getTime();
    const aDate = new Date(a.updatedAt ?? a.createdAt).getTime();
    return bDate - aDate;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Projects</h1>
          <p className="mt-2 max-w-xl text-slate-500">
            Selected case studies demonstrating applied backend engineering across payment systems,
            cloud infrastructure, AI applications, and machine learning.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-8">
          {publishedProjects.map((project) => (
            <article
              key={project.id}
              id={project.slug}
              className="scroll-mt-20 rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              {/* Card header */}
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          categoryColors[project.category?.name ?? ""] ?? "blue"
                        }
                      >
                        {project.category?.name ?? "Project"}
                      </Badge>
                      <Badge variant="gray">{project.year}</Badge>
                      {project.featured && <Badge variant="yellow">Featured</Badge>}
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">{project.title}</h2>
                  </div>
                  {project.links?.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {link.label} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
                <p className="mt-2 text-slate-600 leading-relaxed">{project.summary}</p>
              </div>

              {/* Body */}
              <div className="grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="px-6 py-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Problem
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">{project.problem}</p>
                </div>
                <div className="px-6 py-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Solution
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">{project.solution}</p>
                </div>
              </div>

              <div className="grid gap-0 divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="px-6 py-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    My Role
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">{project.role}</p>
                </div>
                <div className="px-6 py-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Outcome
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">{project.outcome}</p>
                </div>
              </div>

              {/* Stack */}
              <div className="border-t border-slate-100 px-6 py-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <Badge key={tech} variant="gray">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
