import type { Metadata } from "next";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "New Blog Post" };

export default function NewBlog() {
  return (
    <div className="admin-page">
      <BlogEditor />
    </div>
  );
}
