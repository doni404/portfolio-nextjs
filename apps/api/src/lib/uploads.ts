import fs from "node:fs";
import path from "node:path";

export const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads");

// Create the root once at startup so local development works without a setup step.
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
