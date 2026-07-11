import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ok, paginated, created, noContent } from "../../lib/response";
import { notFound } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

const projectBodySchema = z.object({
  title: z.string().min(1).max(220),
  slug: z.string().min(1).max(260).regex(/^[a-z0-9-]+$/),
  summary: z.string().min(1),
  problem: z.string().optional(),
  solution: z.string().optional(),
  role: z.string().optional(),
  outcome: z.string().optional(),
  stack: z.array(z.string()).default([]),
  categorySlug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  year: z.number().int().optional(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  links: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .default([]),
});

// GET /api/admin/projects
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(["draft", "published", "archived"]).optional(),
      sort: z.enum(["latest", "created", "year", "manual"]).default("latest"),
    });
    const query = schema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where.status = query.status;

    const orderBy = {
      latest: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      created: [{ createdAt: "desc" }],
      year: [{ year: "desc" }, { updatedAt: "desc" }],
      manual: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    }[query.sort] as
      | { updatedAt: "desc" }[]
      | { createdAt: "desc" }[]
      | ({ year: "desc" } | { updatedAt: "desc" })[]
      | ({ sortOrder: "asc" } | { updatedAt: "desc" })[];

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return paginated(
      res,
      projects.map((p) => ({ ...p, tags: p.tags.map((t) => t.tag) })),
      total,
      query.page,
      query.pageSize
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/projects/:id
router.get("/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (!project) throw notFound("Project");
    return ok(res, { ...project, tags: project.tags.map((t) => t.tag) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/projects
router.post("/", async (req, res, next) => {
  try {
    const body = projectBodySchema.parse(req.body);

    let categoryId: string | null = null;
    if (body.categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
      if (cat) categoryId = cat.id;
    }

    const tagIds = await resolveTagIds(body.tags);

    const project = await prisma.project.create({
      data: {
        title: body.title,
        slug: body.slug,
        summary: body.summary,
        problem: body.problem || null,
        solution: body.solution || null,
        role: body.role || null,
        outcome: body.outcome || null,
        stack: body.stack,
        categoryId,
        featured: body.featured,
        sortOrder: body.sortOrder,
        year: body.year ?? null,
        status: body.status,
        links: body.links,
        tags: { create: tagIds.map((id) => ({ tagId: id })) },
      },
    });

    return created(res, project);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/projects/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw notFound("Project");

    const body = projectBodySchema.partial().parse(req.body);

    let categoryId = existing.categoryId;
    if (body.categorySlug !== undefined) {
      categoryId = body.categorySlug
        ? (await prisma.category.findUnique({ where: { slug: body.categorySlug } }))?.id ?? null
        : null;
    }

    const updateData: Record<string, unknown> = { ...body, categoryId };
    delete updateData.categorySlug;
    delete updateData.tags;

    if (body.tags !== undefined) {
      await prisma.projectTag.deleteMany({ where: { projectId: req.params.id } });
      const tagIds = await resolveTagIds(body.tags);
      updateData.tags = { create: tagIds.map((id) => ({ tagId: id })) };
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return ok(res, project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/projects/:id  (soft delete)
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw notFound("Project");

    await prisma.project.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), status: "archived" },
    });

    return noContent(res);
  } catch (err) {
    next(err);
  }
});

async function resolveTagIds(tagNames: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    ids.push(tag.id);
  }
  return ids;
}

export default router;
