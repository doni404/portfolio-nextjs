import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminApi } from "@/lib/server-api";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export const metadata: Metadata = { title: "Edit Project" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProject({ params }: Props) {
  const { id } = await params;
  const res = await adminApi.getProject(id);
  const project = res?.data;
  if (!project) notFound();

  return (
    <div className="admin-page">
      <ProjectEditor project={project} />
    </div>
  );
}
