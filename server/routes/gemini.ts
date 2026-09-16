import { Router, Request, Response } from "express";
import { geminiProvider } from "../services/gemini/geminiProvider";

const router = Router();

// GET /api/gemini/health - Check Gemini integration status
router.get("/health", async (_req: Request, res: Response) => {
  const configured = geminiProvider.isConfigured();
  res.json({
    ok: true,
    configured,
    provider: process.env.AI_PROVIDER || "gemini",
    defaultModel: "gemini-3.8-flash",
  });
});

// POST /api/gemini/generate - Generic server-side generation proxy
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { prompt, model, systemInstruction, responseMimeType } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' in request body." });
    }

    if (!geminiProvider.isConfigured()) {
      return res.status(503).json({
        error: "Gemini API is not configured on the server. Please ensure GEMINI_API_KEY is provided.",
      });
    }

    const text = await geminiProvider.generateContent(prompt, {
      model,
      systemInstruction,
      responseMimeType,
    });

    res.json({ ok: true, text });
  } catch (err: any) {
    console.error("[Gemini Route Error]:", err);
    res.status(500).json({
      error: err.message || "Gemini generation failed",
      details: err.stack,
    });
  }
});

// POST /api/gemini/diagnostic - Diagnostic endpoint to verify REST & SDK connectivity
router.post("/diagnostic", async (_req: Request, res: Response) => {
  try {
    if (!geminiProvider.isConfigured()) {
      return res.status(400).json({ error: "GEMINI_API_KEY is not set." });
    }

    const result = await geminiProvider.generateContentRest("Ping", "gemini-3.8-flash");
    res.json({
      ok: true,
      diagnostic: "Gemini REST API connected successfully",
      status: result.status,
      contentType: result.contentType,
      responseSnippet: result.text.slice(0, 100),
    });
  } catch (err: any) {
    res.status(502).json({
      ok: false,
      error: err.message,
    });
  }
});

export default router;
