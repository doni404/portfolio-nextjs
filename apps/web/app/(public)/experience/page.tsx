import type { Metadata } from "next";
import { MapPin, Calendar } from "lucide-react";
import { publicApi } from "@/lib/server-api";
import { buildMetadata } from "@/lib/metadata";
import { formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description:
    "Career timeline of Doni Putra Purbawa — Backend Engineering Manager, Cloud Architect, and Machine Learning Engineer.",
  path: "/experience",
  imageTitle: "Engineering Experience",
  imageDescription: "Career timeline across backend engineering, cloud architecture, fintech, and machine learning.",
});

export default async function Experience() {
  const res = await publicApi.getExperiences();
  const experiences = res?.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Experience</h1>
          <p className="mt-2 max-w-xl text-slate-500">
            Career progression from backend developer to engineering manager, with a focus on
            fintech, cloud infrastructure, and AI systems.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 h-full w-px bg-slate-200 sm:left-6" />

          <div className="space-y-10">
            {experiences.map((exp, index) => (
              <div key={exp.id} className="relative flex gap-6 sm:gap-8">
                {/* Timeline dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 sm:h-12 sm:w-12 sm:rounded-xl ${
                      exp.isCurrent
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    <span className="text-xs font-bold sm:text-sm">{index + 1}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-slate-900">{exp.role}</h2>
                          {exp.isCurrent && (
                            <Badge variant="green">Current</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 font-semibold text-blue-600">{exp.company}</p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {formatDateShort(exp.startDate)} —{" "}
                            {exp.isCurrent ? "Present" : exp.endDate ? formatDateShort(exp.endDate) : ""}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-end gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{exp.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{exp.summary}</p>

                    {/* Highlights */}
                    <ul className="mt-4 space-y-2">
                      {exp.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2.5 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                          <span className="text-slate-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Technologies */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {exp.technologies.map((tech) => (
                        <Badge key={tech} variant="gray">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education note */}
        <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="font-semibold text-slate-900">Education</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Master of Informatics Engineering
              </p>
              <p className="text-xs text-slate-500">ITS, Surabaya · GPA 4.00/4.00 · 2020–2022</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Bachelor of Informatics Engineering
              </p>
              <p className="text-xs text-slate-500">
                Universitas Brawijaya · GPA 3.79/4.00 · 2013–2017
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
