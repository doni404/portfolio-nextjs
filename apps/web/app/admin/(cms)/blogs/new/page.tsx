import type { Metadata } from "next";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "New Blog Post" };

export default function NewBlog() {
  return (
    <div className="p-6 lg:p-8">
      <BlogEditor />
    </div>
  );
}
