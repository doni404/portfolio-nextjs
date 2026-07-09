import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { ok } from "../../lib/response";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/dashboard
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const [
      publishedPosts,
      draftPosts,
      pendingComments,
      newContactSubmissions,
      featuredProjects,
      recentComments,
      recentSubmissions,
    ] = await Promise.all([
      prisma.blogPost.count({ where: { status: "published", deletedAt: null } }),
      prisma.blogPost.count({ where: { status: "draft", deletedAt: null } }),
      prisma.comment.count({ where: { status: "pending", deletedAt: null } }),
      prisma.contactSubmission.count({ where: { status: "new" } }),
      prisma.project.count({ where: { featured: true, status: "published", deletedAt: null } }),
      prisma.comment.findMany({
        where: { status: "pending", deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          authorName: true,
          content: true,
          status: true,
          createdAt: true,
          blogPost: { select: { title: true, slug: true } },
        },
      }),
      prisma.contactSubmission.findMany({
        where: { status: "new" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, subject: true, createdAt: true, status: true },
      }),
    ]);

    return ok(res, {
      stats: {
        publishedPosts,
        draftPosts,
        pendingComments,
        newContactSubmissions,
        featuredProjects,
      },
      recentComments,
      recentSubmissions,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
