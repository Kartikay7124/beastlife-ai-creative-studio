import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import campaignsRouter from "./server/routes/campaigns";
import assetsRouter from "./server/routes/assets";
import healthRouter from "./server/routes/health";
import geminiRouter from "./server/routes/gemini";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser with generous limit for data
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Static generated assets & uploads from public directory
  const publicDir = path.join(process.cwd(), "public");
  app.use(express.static(publicDir));
  app.use("/generated", express.static(path.join(publicDir, "generated")));
  app.use("/uploads", express.static(path.join(publicDir, "uploads")));

  // Mount API routes
  app.use("/api", healthRouter);
  app.use("/api/campaigns", campaignsRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/gemini", geminiRouter);

  // Guard: Catch-all 404 handler strictly for /api routes.
  // Guarantees API consumers NEVER receive Vite or SPA HTML (<!doctype html>) on invalid or missing routes.
  app.all("/api/*", (req, res) => {
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

  // Vite middleware in development vs static bundle in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BeastLife Studio] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
