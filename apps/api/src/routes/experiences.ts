import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ok } from "../lib/response";

const router = Router();

// GET /api/experiences
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

export default router;
