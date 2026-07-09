import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { created } from "../lib/response";

const router = Router();

// POST /api/contact
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(160),
      email: z.string().email().max(255),
      company: z.string().max(180).optional(),
      subject: z.string().max(220).optional(),
      message: z.string().min(10).max(5000),
    });

    const body = schema.parse(req.body);

    const ip = req.ip ?? req.socket.remoteAddress ?? "";
    const ipHash = Buffer.from(ip).toString("base64").slice(0, 128);

    const submission = await prisma.contactSubmission.create({
      data: {
        name: body.name,
        email: body.email,
        company: body.company ?? null,
        subject: body.subject ?? null,
        message: body.message,
        source: "contact_page",
        status: "new",
        ipHash,
        userAgent: req.headers["user-agent"] ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return created(res, {
      id: submission.id,
      message: "Your message has been received. I'll get back to you soon!",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
