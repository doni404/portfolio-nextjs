import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { requireOwner } from "../../lib/editorial";
import { analyticsReport } from "../../lib/ga4";
import { prisma } from "../../lib/prisma";
import { ok } from "../../lib/response";

const router = Router();
router.use(requireAuth, requireOwner);
router.get("/", async (req, res, next) => {
  try {
    const days = z.coerce.number().refine((n) => [7, 30, 90].includes(n)).parse(req.query.days ?? 30);
    const liked = await prisma.blogPost.findMany({ where: { deletedAt: null, status: "published" }, select: { title: true, slug: true, _count: { select: { likes: true } } }, orderBy: { likes: { _count: "desc" } }, take: 20 });
    let traffic: unknown;
    try { traffic = await analyticsReport(days); } catch { traffic = { connected: false, message: "GA4 report unavailable. Check the numeric property ID, service-account Viewer access, and enabled Analytics Data API." }; }
    return ok(res, { traffic, liked });
  } catch (e) { next(e); }
});
export default router;
