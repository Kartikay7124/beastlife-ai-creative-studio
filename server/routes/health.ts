import { Router, Request, Response } from "express";

const router = Router();

// GET /api/health - EXACTLY { "ok": true }
router.get("/health", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ ok: true }));
});

// GET /api/healthz
router.get("/healthz", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify({ ok: true }));
});

export default router;
