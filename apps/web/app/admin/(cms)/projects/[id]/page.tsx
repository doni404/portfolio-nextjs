import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/lib/mock-data";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  return { title: project ? `Edit: ${project.title}` : "Edit Project" };
}

export default async function EditProject({ params }: PageProps) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Edit Project</h1>
      <p className="mb-6 text-slate-500">{project.title}</p>
      <ProjectEditor project={project} />
    </div>
  );
}
