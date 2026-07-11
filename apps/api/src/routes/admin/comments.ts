import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ok, paginated, noContent } from "../../lib/response";
import { notFound } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

// GET /api/admin/comments/pending-count
router.get("/pending-count", async (_req, res, next) => {
  try {
    const count = await prisma.comment.count({
      where: { status: "pending", deletedAt: null },
    });
    return ok(res, { count });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/comments
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(["pending", "approved", "rejected", "spam"]).optional(),
    });

    const query = schema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where.status = query.status;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authorName: true,
          authorEmail: true,
          authorWebsite: true,
          content: true,
          status: true,
          createdAt: true,
          approvedAt: true,
          blogPost: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return paginated(res, comments, total, query.page, query.pageSize);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/comments/:id/status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const existing = await prisma.comment.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw notFound("Comment");

    const schema = z.object({
      status: z.enum(["pending", "approved", "rejected", "spam"]),
    });

    const { status } = schema.parse(req.body);

    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: {
        status,
        approvedAt: status === "approved" ? new Date() : existing.approvedAt,
      },
      select: {
        id: true,
        status: true,
        approvedAt: true,
        updatedAt: true,
      },
    });

    return ok(res, comment);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/comments/:id  (soft delete)
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.comment.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) throw notFound("Comment");

    await prisma.comment.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    return noContent(res);
  } catch (err) {
    next(err);
  }
});

export default router;
