import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ok, paginated } from "../../lib/response";
import { notFound } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

// GET /api/admin/contact-submissions/new-count
router.get("/new-count", async (_req, res, next) => {
  try {
    const count = await prisma.contactSubmission.count({ where: { status: "new" } });
    return ok(res, { count });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/contact-submissions
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(["new", "read", "replied", "archived"]).optional(),
    });

    const query = schema.parse(req.query);
    const skip = (query.page - 1) * query.pageSize;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactSubmission.count({ where }),
    ]);

    return paginated(res, submissions, total, query.page, query.pageSize);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/contact-submissions/:id/status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const existing = await prisma.contactSubmission.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) throw notFound("Contact submission");

    const schema = z.object({
      status: z.enum(["new", "read", "replied", "archived"]),
    });

    const { status } = schema.parse(req.body);

    const submission = await prisma.contactSubmission.update({
      where: { id: req.params.id },
      data: { status },
    });

    return ok(res, submission);
  } catch (err) {
    next(err);
  }
});

export default router;
