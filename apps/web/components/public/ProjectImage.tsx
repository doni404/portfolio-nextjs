import Image from "next/image";
import type { Project } from "@/lib/server-api";
import { mediaUrl } from "@/lib/media";
import { projectCover } from "@/lib/project-cover";

export function ProjectImage({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  if (!project.coverImageUrl) return null;
  const cover = projectCover(project.coverImageUrl, project.title);
  return (
    <Image
      src={mediaUrl(project.coverImageUrl)!}
      alt={cover.alt}
      width={cover.width}
      height={cover.height}
      unoptimized={project.coverImageUrl.includes("/uploads/")}
      preload={priority}
      sizes="(max-width: 767px) 100vw, 700px"
      className="project-image"
      style={{
        aspectRatio: `${cover.width} / ${cover.height}`,
        objectPosition: cover.position,
      }}
    />
  );
}
