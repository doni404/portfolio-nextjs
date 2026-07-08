import type { Metadata } from "next";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "New Blog Post" };

export default function NewBlog() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Blog Post</h1>
        <p className="mt-1 text-slate-500">Create and publish a new article</p>
      </div>
      <BlogEditor />
    </div>
  );
}
