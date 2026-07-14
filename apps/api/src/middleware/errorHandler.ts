import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors";
import { ZodError } from "zod";
import multer from "multer";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "The image must be 8 MB or smaller."
      : "The image upload could not be processed.";
    return res.status(400).json({
      error: { code: "UPLOAD_ERROR", message },
    });
  }

  console.error("[UnhandledError]", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
