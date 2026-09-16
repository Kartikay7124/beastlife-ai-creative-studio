import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Palette, Type, Video, MessageSquare, Box } from "lucide-react";
import { Campaign, CreativeSpec, VideoBeat } from "../types";
import { api } from "../api/client";

interface Stage04BlueprintProps {
  campaign: Campaign;
  onSpecGenerated: (updatedCampaign: Campaign) => void;
  onProceedToAssets: () => void;
}

export const Stage04Blueprint: React.FC<Stage04BlueprintProps> = ({
  campaign,
  onSpecGenerated,
  onProceedToAssets,
}) => {
  const [spec, setSpec] = useState<CreativeSpec | null>(
    campaign.creativeSpecs && campaign.creativeSpecs.length > 0 ? campaign.creativeSpecs[0] : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrGenerateSpec = async () => {
      if (spec) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.generateSpec(campaign.id);
        setSpec(data);
        const updated = await api.getCampaign(campaign.id);
        onSpecGenerated(updated);
      } catch (err: any) {
        setError(err.message || "Failed to generate Creative Blueprint");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrGenerateSpec();
  }, [campaign.id]);

  let approvedClaimsList: string[] = [];
  let paletteList: string[] = [];
  let videoBeatsList: VideoBeat[] = [];

  if (spec) {
    try {
      approvedClaimsList = JSON.parse(spec.approvedClaims || "[]");
      paletteList = JSON.parse(spec.palette || "[]");
      videoBeatsList = JSON.parse(spec.videoOutline || "[]");
    } catch {}
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="pb-8 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-emerald-400">STAGE 04</span>
          <span className="text-neutral-600">/</span>
          <span className="text-xs text-neutral-400 font-mono">MASTER SPECIFICATION</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          Creative Blueprint
        </h1>
        <p className="text-neutral-400 text-sm mt-2 max-w-2xl leading-relaxed">
          The visual system that will guide every asset in this campaign. The square ad, vertical ad, and video all
          derive strictly from this blueprint.
        </p>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-sm">
          {error}
        </div>
      )}

      {isLoading || !spec ? (
        <div className="my-16 text-center py-12">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg text-white">Assembling Master CreativeSpec</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Harmonizing typography, palette, claims, and 3-beat video storyboard...
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Section 1: Message */}
          <div className="p-6 rounded-2xl bg-[#0c0c10] border border-neutral-800/80">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">
                01 // Message Architecture
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#121217] border border-neutral-800">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Hook</span>
                <p className="text-sm font-bold text-emerald-300">"{spec.hook}"</p>
              </div>
              <div className="p-4 rounded-xl bg-[#121217] border border-neutral-800 md:col-span-2">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Approved Copy</span>
                <p className="text-xs text-neutral-300 leading-relaxed">{spec.approvedCopy}</p>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
              <span className="font-mono text-neutral-400 font-semibold">CALL TO ACTION:</span>
              <span className="text-white font-bold">{spec.cta}</span>
            </div>
          </div>

          {/* Section 2: Product & Verified Claims */}
          <div className="p-6 rounded-2xl bg-[#0c0c10] border border-neutral-800/80">
            <div className="flex items-center gap-2 mb-4">
              <Box className="w-4 h-4 text-emerald-400" />
              <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">
                02 // Product Identity & Verified Claims
              </h2>
            </div>
            <div className="p-4 rounded-xl bg-[#121217] border border-neutral-800 mb-4">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                Product Identity Lockup
              </span>
              <p className="text-sm text-white font-medium">{spec.productIdentity}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Strictly Approved Claims (No unverified claims permitted):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {approvedClaimsList.map((claim, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{claim}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Visual Direction & Look and Feel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Setup */}
            <div className="p-6 rounded-2xl bg-[#0c0c10] border border-neutral-800/80">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">
                  03 // Visual Direction
                </h2>
              </div>
              <div className="space-y-3 text-xs text-neutral-300">
                <div>
                  <span className="text-neutral-400 block font-mono text-[10px] uppercase mb-1">Scene Description</span>
                  <p className="p-3 rounded-lg bg-[#121217] border border-neutral-800 leading-relaxed">
                    {spec.scene}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 block font-mono text-[10px] uppercase mb-1">Composition Rules</span>
                  <p className="p-3 rounded-lg bg-[#121217] border border-neutral-800 leading-relaxed">
                    {spec.composition}
                  </p>
                </div>
              </div>
            </div>

            {/* Look & Feel */}
            <div className="p-6 rounded-2xl bg-[#0c0c10] border border-neutral-800/80">
              <div className="flex items-center gap-2 mb-4">
                <Type className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">
                  04 // Look & Feel
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-neutral-400 block font-mono text-[10px] uppercase mb-2">Color Palette</span>
                  <div className="flex flex-wrap gap-2">
                    {paletteList.map((hex, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
                      >
                        <div
                          className="w-4 h-4 rounded-md border border-white/20 shadow-sm"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-xs font-mono text-neutral-300 uppercase">{hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-neutral-300 space-y-2">
                  <div>
                    <span className="text-neutral-400 block font-mono text-[10px] uppercase mb-1">Typography Hierarchy</span>
                    <p className="p-3 rounded-lg bg-[#121217] border border-neutral-800">{spec.typography}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400 block font-mono text-[10px] uppercase mb-1">Visual Treatment</span>
                    <p className="p-3 rounded-lg bg-[#121217] border border-neutral-800">{spec.visualTreatment}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: 3-Beat Video Storyboard */}
          <div className="p-6 rounded-2xl bg-[#0c0c10] border border-neutral-800/80">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <h2 className="font-display font-bold text-base text-white uppercase tracking-wider">
                  05 // 8-Second Vertical Video Storyboard (3 Beats)
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                1080 × 1920 MP4
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {videoBeatsList.map((beat, bIdx) => (
                <div key={bIdx} className="p-4 rounded-xl bg-[#121217] border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                        {beat.timeRange}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        {beat.beatType}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                      {beat.visualDescription}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-neutral-800/60">
                    <span className="text-[10px] font-mono text-neutral-400 block">ON-SCREEN TEXT:</span>
                    <span className="text-xs font-bold text-white font-display">"{beat.onScreenText}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>The orchestrator will now execute the 3 coordinated formats concurrently.</span>
            </div>

            <button
              onClick={onProceedToAssets}
              className="px-6 py-3 rounded-xl font-display font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 active:scale-98 transition-all flex items-center gap-2"
            >
              <span>Create Campaign Assets</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
