import type { Metadata } from "next";
import { experiences } from "@/lib/mock-data";
import { formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Edit, Plus, Trash2, GripVertical } from "lucide-react";

export const metadata: Metadata = { title: "Experience" };

export default function AdminExperiences() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Experience</h1>
          <p className="mt-1 text-slate-500">{experiences.length} entries</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Entry
        </button>
      </div>

      <div className="space-y-3">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-sm"
          >
            <button className="mt-0.5 flex-shrink-0 cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing" title="Drag to reorder">
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{exp.role}</h2>
                    {exp.isCurrent && <Badge variant="green">Current</Badge>}
                  </div>
                  <p className="text-sm text-blue-600">{exp.company}</p>
                  <p className="text-xs text-slate-500">
                    {exp.location} · {formatDateShort(exp.startDate)} —{" "}
                    {exp.isCurrent ? "Present" : exp.endDate ? formatDateShort(exp.endDate) : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{exp.summary}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {exp.technologies.slice(0, 5).map((tech) => (
                  <Badge key={tech} variant="gray">{tech}</Badge>
                ))}
                {exp.technologies.length > 5 && (
                  <Badge variant="gray">+{exp.technologies.length - 5}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal placeholder */}
      <p className="mt-6 text-center text-xs text-slate-400">
        Click an entry to edit or drag to reorder
      </p>
    </div>
  );
}
