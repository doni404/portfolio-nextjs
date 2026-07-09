import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ok } from "../lib/response";

const router = Router();

// GET /api/profile
router.get("/", async (_req, res, next) => {
  try {
    const [author, skills, certifications, education] = await Promise.all([
      prisma.author.findFirst({ where: { slug: "doni-putra-purbawa" } }),
      prisma.skill.findMany({ orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }] }),
      prisma.certification.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.education.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    // Group skills by groupName
    const skillGroups = skills.reduce<Record<string, string[]>>((acc, skill) => {
      if (!acc[skill.groupName]) acc[skill.groupName] = [];
      acc[skill.groupName].push(skill.name);
      return acc;
    }, {});

    return ok(res, { author, skillGroups, certifications, education });
  } catch (err) {
    next(err);
  }
});

export default router;
