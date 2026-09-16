import express from "express";
import path from "path";
import campaignsRouter from "./routes/campaigns";
import assetsRouter from "./routes/assets";
import healthRouter from "./routes/health";
import geminiRouter from "./routes/gemini";

export function createApp(): express.Application {
  const app = express();
  const publicDir = path.join(process.cwd(), "public");

  // CORS support for separated frontend & backend deployments (e.g. AI Studio published / Vercel frontend)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // JSON body parser with generous limit for data
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Root health endpoints for container/orchestrator health checks
  app.get(["/health", "/healthz"], (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // Static generated assets & uploads from public directory
  app.use("/generated", express.static(path.join(publicDir, "generated")));
  app.use("/uploads", express.static(path.join(publicDir, "uploads")));

  // Mount API routes
  app.use("/api", healthRouter);
  app.use("/api/campaigns", campaignsRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/gemini", geminiRouter);

  // Guard: Catch-all 404 handler strictly for all /api and /api/* routes.
  // Guarantees API consumers NEVER receive Vite or SPA HTML (<!doctype html>) on invalid or missing routes.
  app.all(/^\/api(\/.*)?$/, (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404,
    });
  });

  // Explicit JSON error handler for /api routes
  app.use("/api", (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[API Error Handler]", err);
    const status = typeof err.status === "number" ? err.status : 500;
    res.status(status).json({
      error: err.message || "Internal server error",
      status,
    });
  });

  return app;
}

export const app = createApp();
