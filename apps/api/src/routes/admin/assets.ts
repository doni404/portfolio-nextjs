import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { ok } from "../../lib/response";
import { notFound } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

// GET /api/admin/assets
router.get("/", async (_req, res, next) => {
  try {
    const assets = await prisma.siteAsset.findMany({ orderBy: { key: "asc" } });
    return ok(res, assets);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/assets/:key
router.patch("/:key", async (req, res, next) => {
  try {
    const existing = await prisma.siteAsset.findUnique({ where: { key: req.params.key } });
    if (!existing) throw notFound("Asset");

    const schema = z.object({
      fileUrl: z.string().url().optional(),
      label: z.string().max(180).optional(),
      mimeType: z.string().max(120).optional(),
      sizeBytes: z.number().int().optional(),
    });

    const body = schema.parse(req.body);
    const asset = await prisma.siteAsset.update({
      where: { key: req.params.key },
      data: body,
    });

    return ok(res, asset);
  } catch (err) {
    next(err);
  }
});

export default router;
