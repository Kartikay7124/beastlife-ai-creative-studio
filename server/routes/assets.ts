import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../db";

const router = Router();

// GET /api/assets/:id/download
router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
    });

    if (!asset || !asset.filePath) {
      return res.status(404).json({ error: "Asset not found" });
    }

    // Resolve safe path
    // filePath starts with /generated/... or /uploads/...
    const relativePath = asset.filePath.replace(/^\//, "");
    const safePath = path.resolve(process.cwd(), "public", relativePath);

    // Prevent path traversal outside public/
    const publicRoot = path.resolve(process.cwd(), "public");
    if (!safePath.startsWith(publicRoot)) {
      return res.status(403).json({ error: "Access denied: invalid asset path" });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: "Asset file not found on disk" });
    }

    const ext = path.extname(safePath);
    const friendlyName = `${asset.type.toLowerCase()}_${asset.width}x${asset.height}${ext}`;

    res.download(safePath, friendlyName);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
