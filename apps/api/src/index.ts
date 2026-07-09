import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { errorHandler } from "./middleware/errorHandler";

// Public routes
import healthRouter from "./routes/health";
import profileRouter from "./routes/profile";
import experiencesRouter from "./routes/experiences";
import projectsRouter from "./routes/projects";
import blogsRouter from "./routes/blogs";
import contactRouter from "./routes/contact";

// Admin routes
import adminAuthRouter from "./routes/admin/auth";
import adminDashboardRouter from "./routes/admin/dashboard";
import adminBlogsRouter from "./routes/admin/blogs";
import adminProjectsRouter from "./routes/admin/projects";
import adminExperiencesRouter from "./routes/admin/experiences";
import adminCommentsRouter from "./routes/admin/comments";
import adminContactRouter from "./routes/admin/contact-submissions";
import adminAssetsRouter from "./routes/admin/assets";

const app = express();
const PORT = process.env.PORT ?? 4000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// In development, accept any localhost port so that `next dev` port-hopping
// (3000, 3001, 3002…) never causes CORS failures.
const isDev = process.env.NODE_ENV !== "production";
const corsOrigin = isDev
  ? (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
      if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: blocked origin ${origin}`));
      }
    }
  : FRONTEND_URL;

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.set("trust proxy", 1);

// ─── General middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── Rate limiters ────────────────────────────────────────────────────────────
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." } },
});

// ─── Public routes ────────────────────────────────────────────────────────────
app.use("/api/health", standardLimiter, healthRouter);
app.use("/api/profile", standardLimiter, profileRouter);
app.use("/api/experiences", standardLimiter, experiencesRouter);
app.use("/api/projects", standardLimiter, projectsRouter);
app.use("/api/blogs", standardLimiter, blogsRouter);
app.use("/api/contact", strictLimiter, contactRouter);

// comment submissions also get strict rate limiting
app.use("/api/blogs/:slug/comments", (req, res, next) => {
  if (req.method === "POST") return strictLimiter(req, res, next);
  next();
});

// ─── Admin routes ─────────────────────────────────────────────────────────────
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/admin/dashboard", adminDashboardRouter);
app.use("/api/admin/blogs", adminBlogsRouter);
app.use("/api/admin/projects", adminProjectsRouter);
app.use("/api/admin/experiences", adminExperiencesRouter);
app.use("/api/admin/comments", adminCommentsRouter);
app.use("/api/admin/contact-submissions", adminContactRouter);
app.use("/api/admin/assets", adminAssetsRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV ?? "development"}`);
  console.log(`   Frontend:    ${FRONTEND_URL}`);
});

export default app;
