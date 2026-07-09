import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminApi } from "@/lib/server-api";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "Edit Blog Post" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBlog({ params }: Props) {
  const { id } = await params;
  const res = await adminApi.getBlog(id);
  const post = res?.data;
  if (!post) notFound();

  return (
    <div className="p-6 lg:p-8">
      <BlogEditor post={post} />
    </div>
  );
}
