import { prisma } from "../db";
import { FixtureImageProvider } from "./assets/fixtureImageProvider";
import { GeminiImageProvider } from "./assets/geminiImageProvider";
import { ImageProvider } from "./assets/imageProvider";
import { VideoRenderer } from "./assets/videoRenderer";
import { CreativeSpecData, CreativeSpecSchema } from "../schemas";

export class GenerationOrchestrator {
  private imageProvider: ImageProvider;
  private videoRenderer: VideoRenderer;

  constructor() {
    const imgMode = process.env.IMAGE_PROVIDER || "fixture";
    this.imageProvider = imgMode === "gemini" ? new GeminiImageProvider() : new FixtureImageProvider();
    this.videoRenderer = new VideoRenderer();
  }

  private async logEvent(campaignId: string, eventType: string, message: string, stage?: string, details?: any) {
    await prisma.activityEvent.create({
      data: {
        campaignId,
        eventType,
        message,
        stage,
        details: details ? JSON.stringify(details) : null,
      },
    });
  }

  private async setStageStatus(
    campaignId: string,
    stage: string,
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED",
    error?: string,
    metadata?: any
  ) {
    const existing = await prisma.workflowStage.findFirst({
      where: { campaignId, stage },
    });

    if (existing) {
      await prisma.workflowStage.update({
        where: { id: existing.id },
        data: {
          status,
          error: error || null,
          completedAt: status === "COMPLETED" || status === "FAILED" ? new Date() : existing.completedAt,
          startedAt: status === "RUNNING" ? new Date() : existing.startedAt,
          metadata: metadata ? JSON.stringify(metadata) : existing.metadata,
        },
      });
    } else {
      await prisma.workflowStage.create({
        data: {
          campaignId,
          stage,
          status,
          error: error || null,
          startedAt: status === "RUNNING" ? new Date() : null,
          completedAt: status === "COMPLETED" || status === "FAILED" ? new Date() : null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    }
  }

  async runFullPipeline(campaignId: string, simulatedFailureStage?: string | null) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creativeSpecs: { orderBy: { version: "desc" }, take: 1 },
        angles: true,
        assets: true,
        workflowStages: true,
      },
    });

    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
    if (!campaign.selectedAngleId) throw new Error("No creative angle selected for campaign");

    const specRecord = campaign.creativeSpecs[0];
    if (!specRecord) throw new Error("No master CreativeSpec found for campaign");

    const spec: CreativeSpecData = CreativeSpecSchema.parse({
      hook: specRecord.hook,
      approvedCopy: specRecord.approvedCopy,
      cta: specRecord.cta,
      productIdentity: specRecord.productIdentity,
      approvedClaims: JSON.parse(specRecord.approvedClaims || "[]"),
      scene: specRecord.scene,
      palette: JSON.parse(specRecord.palette || "[]"),
      composition: specRecord.composition,
      typography: specRecord.typography,
      visualTreatment: specRecord.visualTreatment,
      videoOutline: JSON.parse(specRecord.videoOutline || "[]"),
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "ASSETS_GENERATING" },
    });

    await this.logEvent(campaignId, "ASSET_PIPELINE_START", "Starting multi-format creative asset pipeline guided by master CreativeSpec.");

    const failureTarget = simulatedFailureStage || process.env.FIXTURE_FAIL_STAGE;

    // 1. Check/Run Square Ad
    const existingSquare = campaign.assets.find((a) => a.type === "IMAGE_SQUARE" && a.status === "READY");
    if (!existingSquare) {
      await this.runStageImageSquare(campaignId, spec, campaign.productName, failureTarget === "IMAGE_SQUARE");
    }

    // 2. Check/Run Vertical Ad
    const existingVertical = campaign.assets.find((a) => a.type === "IMAGE_VERTICAL" && a.status === "READY");
    if (!existingVertical) {
      await this.runStageImageVertical(campaignId, spec, campaign.productName, failureTarget === "IMAGE_VERTICAL");
    }

    // Check if vertical or square failed
    const failedStages = await prisma.workflowStage.findMany({
      where: {
        campaignId,
        stage: { in: ["IMAGE_SQUARE", "IMAGE_VERTICAL"] },
        status: "FAILED",
      },
    });

    if (failedStages.length > 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "FAILED" },
      });
      await this.logEvent(campaignId, "ASSET_PIPELINE_HALTED", "Asset generation encountered a stage error. Pipeline halted for targeted retry.");
      return;
    }

    // 3. Check/Run Video
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "VIDEO_RENDERING" },
    });

    const existingVideo = campaign.assets.find((a) => a.type === "VIDEO_VERTICAL" && a.status === "READY");
    if (!existingVideo) {
      await this.runStageVideo(campaignId, spec, campaign.productName, failureTarget === "VIDEO_VERTICAL");
    }

    // Final check
    const finalFailed = await prisma.workflowStage.findMany({
      where: { campaignId, status: "FAILED" },
    });

    if (finalFailed.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED" },
      });
      await this.logEvent(campaignId, "ASSET_PIPELINE_COMPLETE", "All 3 coordinated creative assets ready (Square Ad, Story Ad, Vertical Video).");
    } else {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "FAILED" },
      });
    }
  }

  async runStageImageSquare(campaignId: string, spec: CreativeSpecData, productName: string, shouldFail: boolean) {
    await this.setStageStatus(campaignId, "IMAGE_SQUARE", "RUNNING");
    await this.logEvent(campaignId, "STAGE_START", "Rendering 1080x1080 Square Ad using CreativeSpec.", "IMAGE_SQUARE");

    if (shouldFail) {
      const err = "Simulated controlled failure on IMAGE_SQUARE";
      await this.setStageStatus(campaignId, "IMAGE_SQUARE", "FAILED", err);
      await this.logEvent(campaignId, "STAGE_FAILED", err, "IMAGE_SQUARE");
      return;
    }

    try {
      const res = await this.imageProvider.generateSquareAd(spec, productName, campaignId);
      // Upsert asset record
      await prisma.asset.deleteMany({
        where: { campaignId, type: "IMAGE_SQUARE" },
      });
      await prisma.asset.create({
        data: {
          campaignId,
          type: "IMAGE_SQUARE",
          format: res.format,
          width: res.width,
          height: res.height,
          filePath: res.filePath,
          provider: res.provider,
          status: "READY",
        },
      });
      await this.setStageStatus(campaignId, "IMAGE_SQUARE", "COMPLETED", undefined, { width: res.width, height: res.height });
      await this.logEvent(campaignId, "STAGE_COMPLETE", `Square Ad generated (${res.width}x${res.height}) via ${res.provider}.`, "IMAGE_SQUARE");
    } catch (err: any) {
      await this.setStageStatus(campaignId, "IMAGE_SQUARE", "FAILED", err.message);
      await this.logEvent(campaignId, "STAGE_FAILED", `Square Ad generation failed: ${err.message}`, "IMAGE_SQUARE");
    }
  }

  async runStageImageVertical(campaignId: string, spec: CreativeSpecData, productName: string, shouldFail: boolean) {
    await this.setStageStatus(campaignId, "IMAGE_VERTICAL", "RUNNING");
    await this.logEvent(campaignId, "STAGE_START", "Rendering 1080x1920 Story Ad using CreativeSpec.", "IMAGE_VERTICAL");

    if (shouldFail) {
      const err = "Simulated controlled failure on IMAGE_VERTICAL";
      await this.setStageStatus(campaignId, "IMAGE_VERTICAL", "FAILED", err);
      await this.logEvent(campaignId, "STAGE_FAILED", err, "IMAGE_VERTICAL");
      return;
    }

    try {
      const res = await this.imageProvider.generateVerticalAd(spec, productName, campaignId);
      await prisma.asset.deleteMany({
        where: { campaignId, type: "IMAGE_VERTICAL" },
      });
      await prisma.asset.create({
        data: {
          campaignId,
          type: "IMAGE_VERTICAL",
          format: res.format,
          width: res.width,
          height: res.height,
          filePath: res.filePath,
          provider: res.provider,
          status: "READY",
        },
      });
      await this.setStageStatus(campaignId, "IMAGE_VERTICAL", "COMPLETED", undefined, { width: res.width, height: res.height });
      await this.logEvent(campaignId, "STAGE_COMPLETE", `Vertical Ad generated (${res.width}x${res.height}) via ${res.provider}.`, "IMAGE_VERTICAL");
    } catch (err: any) {
      await this.setStageStatus(campaignId, "IMAGE_VERTICAL", "FAILED", err.message);
      await this.logEvent(campaignId, "STAGE_FAILED", `Vertical Ad generation failed: ${err.message}`, "IMAGE_VERTICAL");
    }
  }

  async runStageVideo(campaignId: string, spec: CreativeSpecData, productName: string, shouldFail: boolean) {
    await this.setStageStatus(campaignId, "VIDEO_VERTICAL", "RUNNING");
    await this.logEvent(campaignId, "STAGE_START", "Rendering 1080x1920 8s Vertical MP4 Video via FFmpeg.", "VIDEO_VERTICAL");

    if (shouldFail) {
      const err = "Simulated controlled failure on VIDEO_VERTICAL";
      await this.setStageStatus(campaignId, "VIDEO_VERTICAL", "FAILED", err);
      await this.logEvent(campaignId, "STAGE_FAILED", err, "VIDEO_VERTICAL");
      return;
    }

    try {
      const res = await this.videoRenderer.render(spec, productName, campaignId);
      await prisma.asset.deleteMany({
        where: { campaignId, type: "VIDEO_VERTICAL" },
      });
      await prisma.asset.create({
        data: {
          campaignId,
          type: "VIDEO_VERTICAL",
          format: res.format,
          width: res.width,
          height: res.height,
          duration: res.duration,
          filePath: res.filePath,
          provider: res.provider,
          status: "READY",
        },
      });
      await this.setStageStatus(campaignId, "VIDEO_VERTICAL", "COMPLETED", undefined, { duration: res.duration });
      await this.logEvent(campaignId, "STAGE_COMPLETE", `Vertical Video rendered (${res.width}x${res.height}, ${res.duration}s) via FFmpeg.`, "VIDEO_VERTICAL");
    } catch (err: any) {
      await this.setStageStatus(campaignId, "VIDEO_VERTICAL", "FAILED", err.message);
      await this.logEvent(campaignId, "STAGE_FAILED", `Video rendering failed: ${err.message}`, "VIDEO_VERTICAL");
    }
  }

  async retryStage(campaignId: string, stageName: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creativeSpecs: { orderBy: { version: "desc" }, take: 1 },
      },
    });
    if (!campaign) throw new Error("Campaign not found");
    const specRecord = campaign.creativeSpecs[0];
    if (!specRecord) throw new Error("CreativeSpec not found");

    const spec: CreativeSpecData = CreativeSpecSchema.parse({
      hook: specRecord.hook,
      approvedCopy: specRecord.approvedCopy,
      cta: specRecord.cta,
      productIdentity: specRecord.productIdentity,
      approvedClaims: JSON.parse(specRecord.approvedClaims || "[]"),
      scene: specRecord.scene,
      palette: JSON.parse(specRecord.palette || "[]"),
      composition: specRecord.composition,
      typography: specRecord.typography,
      visualTreatment: specRecord.visualTreatment,
      videoOutline: JSON.parse(specRecord.videoOutline || "[]"),
    });

    // Increment retry count
    const stage = await prisma.workflowStage.findFirst({
      where: { campaignId, stage: stageName },
    });
    if (stage) {
      await prisma.workflowStage.update({
        where: { id: stage.id },
        data: { retryCount: stage.retryCount + 1 },
      });
    }

    await this.logEvent(campaignId, "STAGE_RETRY", `Initiating targeted retry for failed stage: ${stageName}`);

    if (stageName === "IMAGE_SQUARE") {
      await this.runStageImageSquare(campaignId, spec, campaign.productName, false);
    } else if (stageName === "IMAGE_VERTICAL") {
      await this.runStageImageVertical(campaignId, spec, campaign.productName, false);
    } else if (stageName === "VIDEO_VERTICAL") {
      await this.runStageVideo(campaignId, spec, campaign.productName, false);
    }

    // Check if video can now run or if campaign is completed
    const remainingFailed = await prisma.workflowStage.findMany({
      where: { campaignId, status: "FAILED" },
    });

    const hasSquare = await prisma.asset.findFirst({ where: { campaignId, type: "IMAGE_SQUARE", status: "READY" } });
    const hasVertical = await prisma.asset.findFirst({ where: { campaignId, type: "IMAGE_VERTICAL", status: "READY" } });
    const hasVideo = await prisma.asset.findFirst({ where: { campaignId, type: "VIDEO_VERTICAL", status: "READY" } });

    if (hasSquare && hasVertical && !hasVideo) {
      // Continue pipeline to video
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "VIDEO_RENDERING" },
      });
      await this.runStageVideo(campaignId, spec, campaign.productName, false);
    }

    const finalAssets = await prisma.asset.findMany({
      where: { campaignId, status: "READY" },
    });

    if (finalAssets.length >= 3 && remainingFailed.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED" },
      });
    }
  }
}
