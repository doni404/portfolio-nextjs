import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ok, created, noContent } from "../../lib/response";
import { notFound } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

const experienceBodySchema = z.object({
  company: z.string().min(1).max(180),
  role: z.string().min(1).max(180),
  location: z.string().max(180).optional(),
  startDate: z.string().pipe(z.coerce.date()),
  endDate: z.string().pipe(z.coerce.date()).optional().nullable(),
  isCurrent: z.boolean().default(false),
  summary: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
});

// GET /api/admin/experiences
router.get("/", async (_req, res, next) => {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return ok(res, experiences);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/experiences/reorder — bulk update sort order
router.patch("/reorder", async (req, res, next) => {
  try {
    const schema = z.array(
      z.object({ id: z.string().uuid(), sortOrder: z.number().int() })
    );
    const items = schema.parse(req.body);

    await prisma.$transaction(
      items.map((item) =>
        prisma.experience.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return ok(res, { updated: items.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/experiences/:id
router.get("/:id", async (req, res, next) => {
  try {
    const exp = await prisma.experience.findUnique({ where: { id: req.params.id } });
    if (!exp) throw notFound("Experience");
    return ok(res, exp);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/experiences
router.post("/", async (req, res, next) => {
  try {
    const body = experienceBodySchema.parse(req.body);
    const exp = await prisma.experience.create({ data: body });
    return created(res, exp);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/experiences/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.experience.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Experience");

    const body = experienceBodySchema.partial().parse(req.body);
    const exp = await prisma.experience.update({
      where: { id: req.params.id },
      data: body,
    });
    return ok(res, exp);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/experiences/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.experience.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Experience");

    await prisma.experience.delete({ where: { id: req.params.id } });
    return noContent(res);
  } catch (err) {
    next(err);
  }
});

export default router;
