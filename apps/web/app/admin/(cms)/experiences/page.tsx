import type { Metadata } from "next";
import { adminApi } from "@/lib/server-api";
import { ExperienceList } from "@/components/admin/ExperienceList";

export const metadata: Metadata = { title: "Experience" };

export default async function AdminExperiences() {
  const res = await adminApi.getExperiences();
  const experiences = res?.data ?? [];

  return (
    <div className="admin-page">
      <ExperienceList initialExperiences={experiences} />
    </div>
  );
}
