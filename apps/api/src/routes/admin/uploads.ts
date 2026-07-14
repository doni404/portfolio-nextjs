import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { UPLOAD_ROOT } from "../../lib/uploads";
import { badRequest, notFound } from "../../lib/errors";
import { ok } from "../../lib/response";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const extensionByMimeType: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(badRequest("Only PNG, JPEG, WebP, and GIF images are supported."));
      return;
    }
    callback(null, true);
  },
});

router.use(requireAuth);

// POST /api/admin/uploads/project-cover
router.post("/project-cover", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest("Please choose an image to upload.");

    const { projectSlug } = z
      .object({ projectSlug: z.string().min(1).max(260).regex(/^[a-z0-9-]+$/) })
      .parse(req.body);

    const project = await prisma.project.findFirst({
      where: { slug: projectSlug, deletedAt: null },
      select: { id: true, coverImageUrl: true },
    });
    if (!project) throw notFound("Project");

    const projectDirectory = path.join(UPLOAD_ROOT, "projects", projectSlug);
    await fs.mkdir(projectDirectory, { recursive: true });

    const filename = `${Date.now()}-${crypto.randomUUID()}${extensionByMimeType[req.file.mimetype]}`;
    await fs.writeFile(path.join(projectDirectory, filename), req.file.buffer);

    const uploadPath = `/uploads/projects/${projectSlug}/${filename}`;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}${uploadPath}`;

    await prisma.project.update({
      where: { id: project.id },
      // Store a portable path; the API adds the current host when serving it.
      data: { coverImageUrl: uploadPath },
    });

    await removePreviousUpload(project.coverImageUrl, baseUrl);

    return ok(res, {
      url,
      path: uploadPath,
      filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

async function removePreviousUpload(previousUrl: string | null, baseUrl: string) {
  if (!previousUrl) return;

  try {
    const pathname = new URL(previousUrl, baseUrl).pathname;
    if (!pathname.startsWith("/uploads/")) return;

    const relativePath = pathname.slice("/uploads/".length);
    const uploadRoot = path.resolve(UPLOAD_ROOT);
    const previousPath = path.resolve(uploadRoot, relativePath);
    if (!previousPath.startsWith(`${uploadRoot}${path.sep}`)) return;

    await fs.unlink(previousPath);
  } catch {
    // A missing or externally managed previous file should not fail the upload.
  }
}

export default router;
