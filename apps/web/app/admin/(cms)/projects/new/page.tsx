import type { Metadata } from "next";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export const metadata: Metadata = { title: "New Project" };

export default function NewProject() {
  return (
    <div className="admin-page">
      <ProjectEditor />
    </div>
  );
}
