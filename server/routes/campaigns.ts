import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../db";
import { CampaignBriefSchema, CampaignBriefInput } from "../schemas";
import { ResearchAgent } from "../services/research/researchAgent";
import { AngleGenerator } from "../services/angles/angleGenerator";
import { SpecGenerator } from "../services/spec/specGenerator";
import { GenerationOrchestrator } from "../services/orchestrator";

const router = Router();

// Multer setup with strict validation
const uploadDir = path.join(process.cwd(), "public", "uploads");
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    // Prevent path traversal and sanitize filename
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only JPEG, PNG, and WebP are permitted."));
    }
  },
});

const researchAgent = new ResearchAgent();
const angleGenerator = new AngleGenerator();
const specGenerator = new SpecGenerator();
const orchestrator = new GenerationOrchestrator();

// 1. POST /api/campaigns - Create campaign brief
router.post("/", upload.single("productImage"), async (req: Request, res: Response) => {
  try {
    let rawBody = req.body;
    if (typeof rawBody === "string") {
      rawBody = JSON.parse(rawBody);
    }

    const inputData = {
      name: rawBody.name || `${rawBody.productName || "BeastLife"} Campaign`,
      productName: rawBody.productName,
      productDescription: rawBody.productDescription,
      targetAudience: rawBody.targetAudience,
      campaignObjective: rawBody.campaignObjective,
      tone: rawBody.tone,
      cta: rawBody.cta,
      verifiedClaims: rawBody.verifiedClaims || null,
      productImagePath: req.file ? `/uploads/${req.file.filename}` : rawBody.productImagePath || null,
    };

    const validated = CampaignBriefSchema.parse(inputData);

    const campaign = await prisma.campaign.create({
      data: {
        name: validated.name || `${validated.productName} Campaign`,
        productName: validated.productName,
        productDescription: validated.productDescription,
        targetAudience: validated.targetAudience,
        campaignObjective: validated.campaignObjective,
        tone: validated.tone,
        cta: validated.cta,
        verifiedClaims: validated.verifiedClaims,
        productImagePath: validated.productImagePath,
        status: "DRAFT",
      },
    });

    await prisma.activityEvent.create({
      data: {
        campaignId: campaign.id,
        eventType: "CAMPAIGN_CREATED",
        message: `Campaign brief created for '${campaign.productName}'.`,
        details: JSON.stringify({ objective: campaign.campaignObjective, tone: campaign.tone }),
      },
    });

    res.status(201).json(campaign);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create campaign" });
  }
});

// 2. GET /api/campaigns - List all campaigns (newest first)
router.get("/", async (_req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        researchSources: true,
        angles: true,
        creativeSpecs: { orderBy: { version: "desc" }, take: 1 },
        assets: true,
        workflowStages: true,
      },
    });
    res.json(campaigns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/campaigns/sample - Load deterministic BeastLife sample campaign
router.post("/sample", async (_req: Request, res: Response) => {
  try {
    const sample = await prisma.campaign.create({
      data: {
        name: "Apex Hydro-Fuel Launch",
        productName: "Apex Hydro-Fuel",
        productDescription:
          "Hypotonic electrolyte and mineral replenishment formula engineered with 1000mg sodium, 200mg potassium, 60mg magnesium malate, and pink Himalayan rock salt. Zero artificial sweeteners, zero sugar, zero artificial food coloring.",
        targetAudience: "Competitive endurance athletes, CrossFit practitioners, and hybrid fitness athletes.",
        campaignObjective: "Product Launch",
        tone: "Bold",
        cta: "Fuel Your Session",
        verifiedClaims:
          "Zero sugar & zero artificial additives\n1000mg sodium + 200mg potassium precision ratio\nInformed-Sport batch tested for athletic compliance",
        status: "DRAFT",
      },
    });

    await prisma.activityEvent.create({
      data: {
        campaignId: sample.id,
        eventType: "SAMPLE_CAMPAIGN_LOADED",
        message: "Loaded verified BeastLife sample campaign.",
      },
    });

    res.status(201).json(sample);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/campaigns/:id - Get single campaign
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        researchSources: true,
        angles: { orderBy: { angleNumber: "asc" } },
        creativeSpecs: { orderBy: { version: "desc" } },
        assets: true,
        workflowStages: true,
        activityEvents: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. PATCH /api/campaigns/:id - Update brief fields
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. POST /api/campaigns/:id/research - Run research agent
router.post("/:id/research", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "RESEARCHING" },
    });

    const brief: CampaignBriefInput = {
      name: campaign.name,
      productName: campaign.productName,
      productDescription: campaign.productDescription,
      targetAudience: campaign.targetAudience,
      campaignObjective: campaign.campaignObjective as any,
      tone: campaign.tone as any,
      cta: campaign.cta,
      verifiedClaims: campaign.verifiedClaims,
      productImagePath: campaign.productImagePath,
    };

    const researchResult = await researchAgent.run(brief);

    // Save sources to DB
    await prisma.researchSource.deleteMany({ where: { campaignId: campaign.id } });
    for (const src of researchResult.output.sources) {
      await prisma.researchSource.create({
        data: {
          campaignId: campaign.id,
          title: src.title,
          url: src.url,
          domain: src.domain,
          summary: src.summary,
          excerpt: src.excerpt,
        },
      });
    }

    // Update campaign record
    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "RESEARCH_READY",
        researchSummary: researchResult.output.summary,
        creativeNotes: researchResult.output.creativeInterpretation,
      },
      include: { researchSources: true },
    });

    // Log events
    await prisma.activityEvent.create({
      data: {
        campaignId: campaign.id,
        eventType: "RESEARCH_COMPLETED",
        message: `Research agent completed (${researchResult.provider} mode). Collected ${researchResult.output.sources.length} sources.`,
        details: JSON.stringify({
          durationMs: researchResult.durationMs,
          searchCount: researchResult.searchCount,
          pageReadCount: researchResult.pageReadCount,
          provider: researchResult.provider,
        }),
      },
    });

    res.json({
      campaign: updated,
      research: researchResult.output,
      meta: {
        provider: researchResult.provider,
        durationMs: researchResult.durationMs,
        searchCount: researchResult.searchCount,
        pageReadCount: researchResult.pageReadCount,
        trace: researchResult.trace,
      },
    });
  } catch (err: any) {
    await prisma.campaign.update({
      where: { id: req.params.id },
      data: { status: "FAILED" },
    });
    res.status(500).json({ error: err.message || "Research failed" });
  }
});

// 7. GET /api/campaigns/:id/research - Get research output & sources
router.get("/:id/research", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { researchSources: true },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    res.json({
      summary: campaign.researchSummary,
      creativeInterpretation: campaign.creativeNotes,
      sources: campaign.researchSources,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/campaigns/:id/angles - Generate or fetch exactly 3 angles
router.get("/:id/angles", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { angles: true, researchSources: true },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    // If angles already exist, return them
    if (campaign.angles && campaign.angles.length === 3) {
      return res.json(campaign.angles);
    }

    const brief: CampaignBriefInput = {
      name: campaign.name,
      productName: campaign.productName,
      productDescription: campaign.productDescription,
      targetAudience: campaign.targetAudience,
      campaignObjective: campaign.campaignObjective as any,
      tone: campaign.tone as any,
      cta: campaign.cta,
      verifiedClaims: campaign.verifiedClaims,
    };

    const researchOutput = {
      summary: campaign.researchSummary || "Research findings synthesized for sports nutrition formulation.",
      audienceObservations: ["High demand for clean zero-sugar electrolytes."],
      productObservations: ["Formulation relies on precision sodium-potassium balance."],
      creativeInterpretation: campaign.creativeNotes || "High contrast athletic intensity paired with crisp hydration.",
      sources: campaign.researchSources.map((s) => ({
        title: s.title,
        url: s.url,
        domain: s.domain,
        summary: s.summary,
        excerpt: s.excerpt,
      })),
    };

    const angles = await angleGenerator.generate(brief, researchOutput);

    // Persist to DB
    await prisma.creativeAngle.deleteMany({ where: { campaignId: campaign.id } });
    for (const a of angles) {
      await prisma.creativeAngle.create({
        data: {
          campaignId: campaign.id,
          angleNumber: a.angleNumber,
          name: a.name,
          audienceInsight: a.audienceInsight,
          hook: a.hook,
          visualDirection: a.visualDirection,
          rationale: a.rationale,
          sourceIds: JSON.stringify(a.sourceIds),
        },
      });
    }

    await prisma.activityEvent.create({
      data: {
        campaignId: campaign.id,
        eventType: "ANGLES_GENERATED",
        message: `Generated exactly 3 creative directions from research.`,
      },
    });

    const saved = await prisma.creativeAngle.findMany({
      where: { campaignId: campaign.id },
      orderBy: { angleNumber: "asc" },
    });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alias: POST /api/campaigns/:id/angles - Generate or fetch exactly 3 angles
router.post("/:id/angles", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { angles: true, researchSources: true },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    if (campaign.angles && campaign.angles.length === 3) {
      return res.json(campaign.angles);
    }

    const brief: CampaignBriefInput = {
      name: campaign.name,
      productName: campaign.productName,
      productDescription: campaign.productDescription,
      targetAudience: campaign.targetAudience,
      campaignObjective: campaign.campaignObjective as any,
      tone: campaign.tone as any,
      cta: campaign.cta,
      verifiedClaims: campaign.verifiedClaims,
    };

    const researchOutput = {
      summary: campaign.researchSummary || "Research findings synthesized for sports nutrition formulation.",
      audienceObservations: ["High demand for clean zero-sugar electrolytes."],
      productObservations: ["Formulation relies on precision sodium-potassium balance."],
      creativeInterpretation: campaign.creativeNotes || "High contrast athletic intensity paired with crisp hydration.",
      sources: campaign.researchSources.map((s) => ({
        title: s.title,
        url: s.url,
        domain: s.domain,
        summary: s.summary,
        excerpt: s.excerpt,
      })),
    };

    const angles = await angleGenerator.generate(brief, researchOutput);

    await prisma.creativeAngle.deleteMany({ where: { campaignId: campaign.id } });
    for (const a of angles) {
      await prisma.creativeAngle.create({
        data: {
          campaignId: campaign.id,
          angleNumber: a.angleNumber,
          name: a.name,
          audienceInsight: a.audienceInsight,
          hook: a.hook,
          visualDirection: a.visualDirection,
          rationale: a.rationale,
          sourceIds: JSON.stringify(a.sourceIds),
        },
      });
    }

    await prisma.activityEvent.create({
      data: {
        campaignId: campaign.id,
        eventType: "ANGLES_GENERATED",
        message: `Generated exactly 3 creative directions from research.`,
      },
    });

    const saved = await prisma.creativeAngle.findMany({
      where: { campaignId: campaign.id },
      orderBy: { angleNumber: "asc" },
    });
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /api/campaigns/:id/select-angle - Select 1 of the 3 angles
router.post("/:id/select-angle", async (req: Request, res: Response) => {
  try {
    const { angleId } = req.body;
    if (!angleId) return res.status(400).json({ error: "angleId is required" });

    const angle = await prisma.creativeAngle.findFirst({
      where: { id: angleId, campaignId: req.params.id },
    });
    if (!angle) return res.status(404).json({ error: "Angle not found for this campaign" });

    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        selectedAngleId: angle.id,
        status: "ANGLE_SELECTED",
      },
    });

    await prisma.activityEvent.create({
      data: {
        campaignId: req.params.id,
        eventType: "ANGLE_SELECTED",
        message: `User selected Angle #${angle.angleNumber}: '${angle.name}'.`,
      },
    });

    res.json({ campaign: updated, selectedAngle: angle });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. POST /api/campaigns/:id/spec - Generate master CreativeSpec
router.post("/:id/spec", async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        angles: true,
        researchSources: true,
        creativeSpecs: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (!campaign.selectedAngleId) {
      return res.status(400).json({ error: "Must select a creative angle before generating CreativeSpec" });
    }

    const selectedAngle = campaign.angles.find((a) => a.id === campaign.selectedAngleId);
    if (!selectedAngle) return res.status(400).json({ error: "Selected angle invalid" });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "SPEC_GENERATING" },
    });

    const brief: CampaignBriefInput = {
      name: campaign.name,
      productName: campaign.productName,
      productDescription: campaign.productDescription,
      targetAudience: campaign.targetAudience,
      campaignObjective: campaign.campaignObjective as any,
      tone: campaign.tone as any,
      cta: campaign.cta,
      verifiedClaims: campaign.verifiedClaims,
    };

    const researchOutput = {
      summary: campaign.researchSummary || "",
      audienceObservations: [],
      productObservations: [],
      creativeInterpretation: campaign.creativeNotes || "",
      sources: campaign.researchSources.map((s) => ({
        title: s.title,
        url: s.url,
        domain: s.domain,
        summary: s.summary,
        excerpt: s.excerpt,
      })),
    };

    const specData = await specGenerator.generate(brief, researchOutput, {
      angleNumber: selectedAngle.angleNumber,
      name: selectedAngle.name,
      audienceInsight: selectedAngle.audienceInsight,
      hook: selectedAngle.hook,
      visualDirection: selectedAngle.visualDirection,
      rationale: selectedAngle.rationale,
      sourceIds: JSON.parse(selectedAngle.sourceIds || "[]"),
    });

    const nextVersion = campaign.creativeSpecs[0] ? campaign.creativeSpecs[0].version + 1 : 1;

    const savedSpec = await prisma.creativeSpec.create({
      data: {
        campaignId: campaign.id,
        version: nextVersion,
        hook: specData.hook,
        approvedCopy: specData.approvedCopy,
        cta: specData.cta,
        productIdentity: specData.productIdentity,
        approvedClaims: JSON.stringify(specData.approvedClaims),
        scene: specData.scene,
        palette: JSON.stringify(specData.palette),
        composition: specData.composition,
        typography: specData.typography,
        visualTreatment: specData.visualTreatment,
        videoOutline: JSON.stringify(specData.videoOutline),
      },
    });

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "SPEC_READY" },
    });

    await prisma.activityEvent.create({
      data: {
        campaignId: campaign.id,
        eventType: "CREATIVE_SPEC_CREATED",
        message: `Created master CreativeSpec v${nextVersion} to guide all formats.`,
      },
    });

    res.json(savedSpec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GET /api/campaigns/:id/spec - Return active CreativeSpec
router.get("/:id/spec", async (req: Request, res: Response) => {
  try {
    const spec = await prisma.creativeSpec.findFirst({
      where: { campaignId: req.params.id },
      orderBy: { version: "desc" },
    });
    if (!spec) return res.status(404).json({ error: "CreativeSpec not found" });
    res.json(spec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. POST /api/campaigns/:id/generate - Run asset generation pipeline
router.post("/:id/generate", async (req: Request, res: Response) => {
  try {
    const { failStage } = req.body || {};
    // Trigger orchestration
    await orchestrator.runFullPipeline(req.params.id, failStage);

    const updated = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        assets: true,
        workflowStages: true,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. POST /api/campaigns/:id/stages/:stage/retry - Targeted retry for failed stage
router.post("/:id/stages/:stage/retry", async (req: Request, res: Response) => {
  try {
    const { id, stage } = req.params;
    await orchestrator.retryStage(id, stage);

    const updated = await prisma.campaign.findUnique({
      where: { id },
      include: {
        assets: true,
        workflowStages: true,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. GET /api/campaigns/:id/events - Return activity events / technical trace
router.get("/:id/events", async (req: Request, res: Response) => {
  try {
    const events = await prisma.activityEvent.findMany({
      where: { campaignId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
