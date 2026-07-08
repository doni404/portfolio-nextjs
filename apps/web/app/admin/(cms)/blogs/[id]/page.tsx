import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/mock-data";
import { BlogEditor } from "@/components/admin/BlogEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);
  return { title: post ? `Edit: ${post.title}` : "Edit Post" };
}

export default async function EditBlog({ params }: PageProps) {
  const { id } = await params;
  const post = blogPosts.find((p) => p.id === id);
  if (!post) notFound();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Edit Blog Post</h1>
        <p className="mt-1 text-slate-500 truncate">{post.title}</p>
      </div>
      <BlogEditor post={post} />
    </div>
  );
}
