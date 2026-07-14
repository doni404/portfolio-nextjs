import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ok, paginated } from "../lib/response";
import { notFound } from "../lib/errors";

const router = Router();

function publicAssetUrl(req: Parameters<Parameters<typeof router.get>[1]>[0], value: string | null) {
  if (!value) return value;

  // Accept both the new portable path and older rows that stored localhost/API URLs.
  const pathname = value.startsWith("/uploads/")
    ? value
    : (() => {
        try {
          const parsed = new URL(value);
          return parsed.pathname.startsWith("/uploads/") ? parsed.pathname : null;
        } catch {
          return null;
        }
      })();

  return pathname ? `${req.protocol}://${req.get("host")}${pathname}` : value;
}

const projectSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  problem: true,
  solution: true,
  role: true,
  stack: true,
  outcome: true,
  year: true,
  featured: true,
  sortOrder: true,
  status: true,
  coverImageUrl: true,
  links: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
} as const;

// GET /api/projects
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      category: z.string().optional(),
      featured: z.enum(["true", "false"]).optional(),
    });

    const query = schema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where: Record<string, unknown> = { status: "published", deletedAt: null };
    if (query.category) where.category = { slug: query.category };
    if (query.featured === "true") where.featured = true;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ sortOrder: "asc" }, { year: "desc" }],
        select: projectSelect,
      }),
      prisma.project.count({ where }),
    ]);

    return paginated(
      res,
      projects.map((p) => ({
        ...p,
        coverImageUrl: publicAssetUrl(req, p.coverImageUrl),
        tags: p.tags.map((t) => t.tag),
      })),
      total,
      query.page,
      query.pageSize
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { slug: req.params.slug, status: "published", deletedAt: null },
      select: projectSelect,
    });

    if (!project) throw notFound("Project");

    return ok(res, {
      ...project,
      coverImageUrl: publicAssetUrl(req, project.coverImageUrl),
      tags: project.tags.map((t) => t.tag),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
