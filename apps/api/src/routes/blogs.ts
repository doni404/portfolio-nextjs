import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { paginated, ok } from "../lib/response";
import { notFound, badRequest } from "../lib/errors";

const router = Router();

// GET /api/blogs
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(10),
      category: z.string().optional(),
      tag: z.string().optional(),
      featured: z.enum(["true", "false"]).optional(),
      q: z.string().optional(),
    });

    const query = schema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where: Record<string, unknown> = {
      status: "published",
      deletedAt: null,
    };

    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.tag) {
      where.tags = { some: { tag: { slug: query.tag } } };
    }
    if (query.featured === "true") {
      where.featured = true;
    }
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { excerpt: { contains: query.q, mode: "insensitive" } },
        { content: { contains: query.q, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          featured: true,
          readingTimeMinutes: true,
          publishedAt: true,
          updatedAt: true,
          status: true,
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
          author: { select: { id: true, name: true, slug: true, avatarUrl: true } },
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

// GET /api/blogs/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, status: "published", deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        author: { select: { id: true, name: true, slug: true, avatarUrl: true, title: true, bio: true } },
      },
    });

    if (!post) throw notFound("Blog post");

    return ok(res, { ...post, tags: post.tags.map((t) => t.tag) });
  } catch (err) {
    next(err);
  }
});

// GET /api/blogs/:slug/comments
router.get("/:slug/comments", async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, status: "published", deletedAt: null },
      select: { id: true },
    });

    if (!post) throw notFound("Blog post");

    const comments = await prisma.comment.findMany({
      where: { blogPostId: post.id, status: "approved", deletedAt: null, parentId: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        authorName: true,
        authorWebsite: true,
        content: true,
        approvedAt: true,
        createdAt: true,
        replies: {
          where: { status: "approved", deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            authorName: true,
            authorWebsite: true,
            content: true,
            approvedAt: true,
            createdAt: true,
          },
        },
      },
    });

    return ok(res, comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/blogs/:slug/comments
router.post("/:slug/comments", async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug: req.params.slug, status: "published", deletedAt: null },
      select: { id: true },
    });

    if (!post) throw notFound("Blog post");

    const schema = z.object({
      authorName: z.string().min(1).max(120),
      authorEmail: z.string().email().max(255),
      authorWebsite: z.string().url().optional().or(z.literal("")),
      content: z.string().min(2).max(5000),
      parentId: z.string().uuid().optional(),
    });

    const body = schema.parse(req.body);

    if (body.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: body.parentId } });
      if (!parent || parent.blogPostId !== post.id) {
        throw badRequest("Invalid parent comment");
      }
    }

    const ip = req.ip ?? req.socket.remoteAddress ?? "";
    const ipHash = Buffer.from(ip).toString("base64").slice(0, 128);

    const comment = await prisma.comment.create({
      data: {
        blogPostId: post.id,
        parentId: body.parentId ?? null,
        authorName: body.authorName,
        authorEmail: body.authorEmail,
        authorWebsite: body.authorWebsite || null,
        content: body.content,
        status: "pending",
        ipHash,
        userAgent: req.headers["user-agent"] ?? null,
      },
      select: {
        id: true,
        authorName: true,
        content: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      data: comment,
      message: "Comment submitted and pending moderation.",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
