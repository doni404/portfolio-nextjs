import type { Metadata } from "next";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export const metadata: Metadata = { title: "New Project" };

export default function NewProject() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">New Project</h1>
      <ProjectEditor />
    </div>
  );
}
