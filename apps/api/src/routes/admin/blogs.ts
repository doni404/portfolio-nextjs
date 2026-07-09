import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ok, paginated, created, noContent } from "../../lib/response";
import { notFound } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

const blogBodySchema = z.object({
  title: z.string().min(1).max(220),
  slug: z.string().min(1).max(260).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(1).max(2000),
  content: z.string().min(1),
  categorySlug: z.string().optional(),
  tags: z.array(z.string()).default([]),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  readingTimeMinutes: z.number().int().min(1).max(120).default(5),
  seoTitle: z.string().max(220).optional(),
  seoDescription: z.string().max(320).optional(),
});

// GET /api/admin/blogs
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(["draft", "published", "archived"]).optional(),
      q: z.string().optional(),
    });

    const query = schema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { slug: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          status: true,
          featured: true,
          readingTimeMinutes: true,
          publishedAt: true,
          updatedAt: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return paginated(
      res,
      posts.map((p) => ({ ...p, tags: p.tags.map((t) => t.tag) })),
      total,
      query.page,
      query.pageSize
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/blogs/:id
router.get("/:id", async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (!post) throw notFound("Blog post");

    return ok(res, { ...post, tags: post.tags.map((t) => t.tag) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/blogs
router.post("/", async (req, res, next) => {
  try {
    const body = blogBodySchema.parse(req.body);

    const author = await prisma.author.findFirst({ where: { slug: "doni-putra-purbawa" } });
    if (!author) throw notFound("Author");

    let categoryId: string | null = null;
    if (body.categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
      if (cat) categoryId = cat.id;
    }

    const tagIds = await resolveTagIds(body.tags);

    const post = await prisma.blogPost.create({
      data: {
        authorId: author.id,
        categoryId,
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        coverImageUrl: body.coverImageUrl || null,
        status: body.status,
        featured: body.featured,
        readingTimeMinutes: body.readingTimeMinutes,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        publishedAt: body.status === "published" ? new Date() : null,
        tags: { create: tagIds.map((id) => ({ tagId: id })) },
      },
    });

    await writeAuditLog(req.admin!.adminId, "create", "blog_post", post.id);

    return created(res, post);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/blogs/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.blogPost.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw notFound("Blog post");

    const body = blogBodySchema.partial().parse(req.body);

    let categoryId = existing.categoryId;
    if (body.categorySlug !== undefined) {
      if (body.categorySlug) {
        const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
        categoryId = cat?.id ?? null;
      } else {
        categoryId = null;
      }
    }

    const wasPublished = existing.status === "published";
    const nowPublished = body.status === "published";
    const publishedAt =
      !wasPublished && nowPublished ? new Date() : existing.publishedAt;

    const updateData: Record<string, unknown> = {
      ...body,
      categoryId,
      publishedAt,
    };
    delete updateData.categorySlug;
    delete updateData.tags;

    if (body.tags !== undefined) {
      await prisma.blogPostTag.deleteMany({ where: { blogPostId: req.params.id } });
      const tagIds = await resolveTagIds(body.tags);
      updateData.tags = { create: tagIds.map((id) => ({ tagId: id })) };
    }

    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await writeAuditLog(req.admin!.adminId, "update", "blog_post", post.id);

    return ok(res, post);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/blogs/:id  (soft delete)
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.blogPost.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw notFound("Blog post");

    await prisma.blogPost.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), status: "archived" },
    });

    await writeAuditLog(req.admin!.adminId, "delete", "blog_post", req.params.id);

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

async function writeAuditLog(adminUserId: string, action: string, entityType: string, entityId: string) {
  await prisma.auditLog.create({
    data: { adminUserId, action, entityType, entityId },
  });
}

export default router;
