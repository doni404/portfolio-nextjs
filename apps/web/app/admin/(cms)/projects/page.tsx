import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Edit, Eye, Trash2, Star } from "lucide-react";
import { projects } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Projects" };

export default function AdminProjects() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="mt-1 text-slate-500">{projects.length} case studies</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-sm"
          >
            {/* Actions */}
            <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Link
                href={`/projects#${project.slug}`}
                target="_blank"
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Link>
              <Link
                href={`/admin/projects/${project.id}`}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 flex items-start gap-2 pr-20">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      project.status === "published"
                        ? "green"
                        : project.status === "draft"
                        ? "yellow"
                        : "gray"
                    }
                  >
                    {project.status}
                  </Badge>
                  {project.featured && (
                    <span className="text-amber-500" title="Featured">
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{project.title}</h3>
                <p className="mt-0.5 text-xs text-blue-600">{project.category} · {project.year}</p>
              </div>
            </div>

            <p className="text-sm text-slate-500 line-clamp-2">{project.summary}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.stack.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="gray">{tech}</Badge>
              ))}
              {project.stack.length > 4 && (
                <Badge variant="gray">+{project.stack.length - 4}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
