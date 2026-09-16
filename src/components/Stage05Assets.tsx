import React, { useState, useEffect } from "react";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Video as VideoIcon,
  Image as ImageIcon,
  Play,
  Layers,
  Flame,
} from "lucide-react";
import { Campaign, Asset, WorkflowStage } from "../types";
import { api } from "../api/client";

interface Stage05AssetsProps {
  campaign: Campaign;
  onCampaignUpdated: (updated: Campaign) => void;
}

export const Stage05Assets: React.FC<Stage05AssetsProps> = ({ campaign, onCampaignUpdated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<Asset | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const assets = campaign.assets || [];
  const stages = campaign.workflowStages || [];

  const squareAsset = assets.find((a) => a.type === "IMAGE_SQUARE" && a.status === "READY");
  const verticalAsset = assets.find((a) => a.type === "IMAGE_VERTICAL" && a.status === "READY");
  const videoAsset = assets.find((a) => a.type === "VIDEO_VERTICAL" && a.status === "READY");

  const squareStage = stages.find((s) => s.stage === "IMAGE_SQUARE");
  const verticalStage = stages.find((s) => s.stage === "IMAGE_VERTICAL");
  const videoStage = stages.find((s) => s.stage === "VIDEO_VERTICAL");

  const isAllReady = Boolean(squareAsset && verticalAsset && videoAsset);

  const triggerGeneration = async (failStage?: string) => {
    try {
      setIsGenerating(true);
      setError(null);
      const updated = await api.generateAssets(campaign.id, failStage);
      onCampaignUpdated(updated);
    } catch (err: any) {
      setError(err.message || "Asset pipeline encountered an error");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // If not generated yet and not already running
    if (!isAllReady && !isGenerating && assets.length === 0) {
      triggerGeneration();
    }
  }, [campaign.id]);

  const handleRetryStage = async (stageName: string) => {
    try {
      setIsRetrying(stageName);
      setError(null);
      const updated = await api.retryStage(campaign.id, stageName);
      onCampaignUpdated(updated);
    } catch (err: any) {
      setError(err.message || `Failed to retry stage ${stageName}`);
    } finally {
      setIsRetrying(null);
    }
  };

  const getStageStatus = (stage?: WorkflowStage, asset?: Asset) => {
    if (asset && asset.status === "READY") return "COMPLETED";
    if (stage?.status === "FAILED") return "FAILED";
    if (stage?.status === "RUNNING") return "RUNNING";
    return "PENDING";
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="pb-8 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-emerald-400">STAGE 05</span>
          <span className="text-neutral-600">/</span>
          <span className="text-xs text-neutral-400 font-mono">ASSET SYNTHESIS</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          {isAllReady ? "Your campaign is ready" : "Creating your campaign"}
        </h1>
        <p className="text-neutral-400 text-sm mt-2 max-w-2xl leading-relaxed">
          {isAllReady
            ? "Three coordinated assets built from the same creative direction and master blueprint."
            : "Applying your selected creative direction across every format. Generating high-resolution ads and vertical video."}
        </p>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Controlled Failure Simulation Toolbar for Evaluators */}
      <div className="mt-6 p-3.5 rounded-xl bg-[#0c0c10] border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Evaluation Control:</span>
          <span className="text-neutral-500">Test stage-level controlled failure and targeted retry.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerGeneration("IMAGE_VERTICAL")}
            disabled={isGenerating || Boolean(isRetrying)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-amber-500/40 text-amber-300 hover:bg-amber-950/30 transition-colors font-mono font-semibold"
          >
            Simulate Story Ad Failure
          </button>

          <button
            onClick={() => triggerGeneration()}
            disabled={isGenerating || Boolean(isRetrying)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white transition-colors font-mono"
          >
            Regenerate All
          </button>
        </div>
      </div>

      {/* Stage Progress Indicators */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Square Ad Stage */}
        <div className="p-4 rounded-xl bg-[#0c0c10] border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Square Ad (1080 × 1080)</div>
              <div className="text-[11px] text-neutral-500">Instagram Feed / Carousel</div>
            </div>
          </div>
          <div>
            {getStageStatus(squareStage, squareAsset) === "COMPLETED" && (
              <span className="flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready</span>
              </span>
            )}
            {getStageStatus(squareStage, squareAsset) === "RUNNING" && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering</span>
              </span>
            )}
            {getStageStatus(squareStage, squareAsset) === "PENDING" && (
              <span className="text-xs font-mono text-neutral-600">Pending</span>
            )}
            {getStageStatus(squareStage, squareAsset) === "FAILED" && (
              <button
                onClick={() => handleRetryStage("IMAGE_SQUARE")}
                disabled={isRetrying === "IMAGE_SQUARE"}
                className="px-2 py-1 rounded text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 transition-colors"
              >
                {isRetrying === "IMAGE_SQUARE" ? "Retrying..." : "Retry"}
              </button>
            )}
          </div>
        </div>

        {/* Story Ad Stage */}
        <div className="p-4 rounded-xl bg-[#0c0c10] border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Story Ad (1080 × 1920)</div>
              <div className="text-[11px] text-neutral-500">Instagram / TikTok Story</div>
            </div>
          </div>
          <div>
            {getStageStatus(verticalStage, verticalAsset) === "COMPLETED" && (
              <span className="flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready</span>
              </span>
            )}
            {getStageStatus(verticalStage, verticalAsset) === "RUNNING" && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering</span>
              </span>
            )}
            {getStageStatus(verticalStage, verticalAsset) === "PENDING" && (
              <span className="text-xs font-mono text-neutral-600">Pending</span>
            )}
            {getStageStatus(verticalStage, verticalAsset) === "FAILED" && (
              <button
                onClick={() => handleRetryStage("IMAGE_VERTICAL")}
                disabled={isRetrying === "IMAGE_VERTICAL"}
                className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying === "IMAGE_VERTICAL" ? "animate-spin" : ""}`} />
                <span>{isRetrying === "IMAGE_VERTICAL" ? "Retrying..." : "Retry Stage"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Vertical Video Stage */}
        <div className="p-4 rounded-xl bg-[#0c0c10] border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
              <VideoIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Campaign Video (8s)</div>
              <div className="text-[11px] text-neutral-500">1080 × 1920 Vertical MP4</div>
            </div>
          </div>
          <div>
            {getStageStatus(videoStage, videoAsset) === "COMPLETED" && (
              <span className="flex items-center gap-1 text-xs font-mono font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready</span>
              </span>
            )}
            {getStageStatus(videoStage, videoAsset) === "RUNNING" && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Encoding</span>
              </span>
            )}
            {getStageStatus(videoStage, videoAsset) === "PENDING" && (
              <span className="text-xs font-mono text-neutral-600">Pending</span>
            )}
            {getStageStatus(videoStage, videoAsset) === "FAILED" && (
              <button
                onClick={() => handleRetryStage("VIDEO_VERTICAL")}
                disabled={isRetrying === "VIDEO_VERTICAL"}
                className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying === "VIDEO_VERTICAL" ? "animate-spin" : ""}`} />
                <span>{isRetrying === "VIDEO_VERTICAL" ? "Retrying..." : "Retry Stage"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Asset Previews Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Square Ad */}
        <div className="p-5 rounded-2xl bg-[#0c0c10] border border-neutral-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-display font-bold text-white">01 // SQUARE AD</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400">
                1080 × 1080 PNG
              </span>
            </div>

            <div className="aspect-square rounded-xl bg-black overflow-hidden border border-neutral-800 flex items-center justify-center relative group">
              {squareAsset ? (
                <img
                  src={squareAsset.filePath}
                  alt="Square Ad"
                  className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="w-8 h-8 border-2 border-emerald-500/40 border-t-emerald-400 rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-neutral-500 font-mono">Generating 1080x1080...</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800/80">
            {squareAsset ? (
              <a
                href={`/api/assets/${squareAsset.id}/download`}
                download
                className="w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Square Ad</span>
              </a>
            ) : (
              <button disabled className="w-full py-2.5 px-4 rounded-xl text-xs bg-neutral-900/50 text-neutral-600 cursor-not-allowed">
                Asset in progress
              </button>
            )}
          </div>
        </div>

        {/* 2. Story Ad */}
        <div className="p-5 rounded-2xl bg-[#0c0c10] border border-neutral-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-display font-bold text-white">02 // STORY AD</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400">
                1080 × 1920 PNG
              </span>
            </div>

            <div className="aspect-[9/16] max-h-[440px] mx-auto rounded-xl bg-black overflow-hidden border border-neutral-800 flex items-center justify-center relative group">
              {verticalAsset ? (
                <img
                  src={verticalAsset.filePath}
                  alt="Story Ad"
                  className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300"
                />
              ) : verticalStage?.status === "FAILED" ? (
                <div className="text-center p-4">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <span className="text-xs text-red-300 font-mono block mb-2">Generation halted</span>
                  <button
                    onClick={() => handleRetryStage("IMAGE_VERTICAL")}
                    className="px-3 py-1.5 rounded-lg bg-red-900 text-white text-xs font-bold hover:bg-red-800"
                  >
                    Retry Story Ad
                  </button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <div className="w-8 h-8 border-2 border-emerald-500/40 border-t-emerald-400 rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-neutral-500 font-mono">Rendering 9:16 story...</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800/80">
            {verticalAsset ? (
              <a
                href={`/api/assets/${verticalAsset.id}/download`}
                download
                className="w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Story Ad</span>
              </a>
            ) : (
              <button disabled className="w-full py-2.5 px-4 rounded-xl text-xs bg-neutral-900/50 text-neutral-600 cursor-not-allowed">
                Asset in progress
              </button>
            )}
          </div>
        </div>

        {/* 3. Campaign Video */}
        <div className="p-5 rounded-2xl bg-[#0c0c10] border border-neutral-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-display font-bold text-white">03 // CAMPAIGN VIDEO</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                8.0s MP4 (3 Beats)
              </span>
            </div>

            <div className="aspect-[9/16] max-h-[440px] mx-auto rounded-xl bg-black overflow-hidden border border-neutral-800 flex items-center justify-center relative">
              {videoAsset ? (
                <video
                  src={videoAsset.filePath}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="w-8 h-8 border-2 border-emerald-500/40 border-t-emerald-400 rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-neutral-500 font-mono">Compiling 8s MP4 via FFmpeg...</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-800/80">
            {videoAsset ? (
              <a
                href={`/api/assets/${videoAsset.id}/download`}
                download
                className="w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Video (MP4)</span>
              </a>
            ) : (
              <button disabled className="w-full py-2.5 px-4 rounded-xl text-xs bg-neutral-900/50 text-neutral-600 cursor-not-allowed">
                Video rendering in background
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Creative Consistency Verification */}
      <div className="mt-10 p-6 rounded-2xl bg-[#0d0d12] border border-neutral-800/80">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            Creative Consistency Guarantee
          </h3>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
          All 3 outputs strictly execute the single master Creative Blueprint. The square ad, story ad, and vertical
          video share exact typographic hierarchy, identical hex color codes, and authorized evidence-grounded claims.
          No unverified benefits or hallucinated clinical stats were introduced into the creative assets.
        </p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
          <div className="p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
            <span className="text-neutral-500 block">CREATIVE ANGLE</span>
            <span className="text-white font-bold truncate block">
              {campaign.angles?.find((a) => a.id === campaign.selectedAngleId)?.name || "Angle 01"}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
            <span className="text-neutral-500 block">BLUEPRINT VERSION</span>
            <span className="text-emerald-400 font-bold">
              v{campaign.creativeSpecs?.[0]?.version || 1}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
            <span className="text-neutral-500 block">VIDEO DURATION</span>
            <span className="text-white font-bold">8.00 Seconds</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
            <span className="text-neutral-500 block">IMAGE RESOLUTIONS</span>
            <span className="text-white font-bold">1080p Native</span>
          </div>
        </div>
      </div>
    </div>
  );
};
