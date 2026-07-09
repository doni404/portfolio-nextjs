import type { Metadata } from "next";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export const metadata: Metadata = { title: "New Project" };

export default function NewProject() {
  return (
    <div className="p-6 lg:p-8">
      <ProjectEditor />
    </div>
  );
}
