import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import { createApp } from "./server/app";

async function startServer() {
  const PORT = 3000;
  const publicDir = path.join(process.cwd(), "public");

  // Ensure persistent runtime directories exist
  try {
    fs.mkdirSync(path.join(publicDir, "generated"), { recursive: true });
    fs.mkdirSync(path.join(publicDir, "uploads"), { recursive: true });
    fs.mkdirSync(path.join(process.cwd(), "storage", "temp"), { recursive: true });

    // Sync database schema on startup if dev.db doesn't exist
    const dbPath = path.join(process.cwd(), "dev.db");
    if (!fs.existsSync(dbPath)) {
      try {
        execSync("npx prisma db push --skip-generate", { stdio: "ignore" });
      } catch (dbErr) {
        console.warn("[BeastLife Studio] Prisma db push note:", dbErr);
      }
    }
  } catch (err) {
    console.warn("[BeastLife Studio] Storage/DB init note:", err);
  }

  // Create Express application with all API routes, CORS, body parsers, and error handlers
  const app = createApp();

  // Static files from public directory
  app.use(express.static(publicDir));

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

    // Fallback: only serve index.html for non-API client-side routes.
    // Explicit guard guarantees /api/* requests never return HTML.
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({
          error: `API route not found: ${req.method} ${req.originalUrl}`,
          status: 404,
        });
      }
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

