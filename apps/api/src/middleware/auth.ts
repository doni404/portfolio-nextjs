import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { unauthorized } from "../lib/errors";

export interface AuthPayload {
  adminId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.token ??
      req.headers.authorization?.replace(/^Bearer\s+/, "");

    if (!token) throw unauthorized();

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const payload = jwt.verify(token, secret) as AuthPayload;
    req.admin = payload;
    next();
  } catch {
    next(unauthorized("Invalid or expired session. Please log in again."));
  }
}
