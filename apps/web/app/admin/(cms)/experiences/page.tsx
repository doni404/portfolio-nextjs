import type { Metadata } from "next";
import { adminApi } from "@/lib/server-api";
import { ExperienceList } from "@/components/admin/ExperienceList";

export const metadata: Metadata = { title: "Experience" };

export default async function AdminExperiences() {
  const res = await adminApi.getExperiences();
  const experiences = res?.data ?? [];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Experience</h1>
        <p className="mt-1 text-sm text-slate-500">
          {experiences.length} {experiences.length === 1 ? "entry" : "entries"} · drag to reorder
        </p>
      </div>

      <ExperienceList initialExperiences={experiences} />
    </div>
  );
}
