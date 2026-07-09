import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { ok } from "../../lib/response";
import { unauthorized } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// POST /api/admin/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const body = schema.parse(req.body);

    const user = await prisma.adminUser.findUnique({ where: { email: body.email } });
    if (!user) throw unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw unauthorized("Invalid email or password");

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
    const token = jwt.sign(
      { adminId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return ok(res, {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/auth/me — update name / email
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(120).optional(),
      email: z.string().email().optional(),
    });

    const body = schema.parse(req.body);

    const user = await prisma.adminUser.update({
      where: { id: req.admin!.adminId },
      data: body,
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    });

    return ok(res, user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/auth/password — change password
router.patch("/password", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.adminUser.findUnique({
      where: { id: req.admin!.adminId },
    });
    if (!user) throw unauthorized();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw unauthorized("Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return ok(res, { message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  return res.json({ data: { message: "Logged out successfully" } });
});

// GET /api/admin/auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: req.admin!.adminId },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true },
    });
    if (!user) throw unauthorized();
    return ok(res, user);
  } catch (err) {
    next(err);
  }
});

export default router;
