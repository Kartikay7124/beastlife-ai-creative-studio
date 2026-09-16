import React, { useState, useEffect } from "react";
import { Check, Sparkles, ArrowRight, Lightbulb, Compass, Eye, Shield } from "lucide-react";
import { Campaign, CreativeAngle } from "../types";
import { api } from "../api/client";

interface Stage03DirectionProps {
  campaign: Campaign;
  onAngleSelected: (updatedCampaign: Campaign) => void;
  onProceedToBlueprint: () => void;
}

export const Stage03Direction: React.FC<Stage03DirectionProps> = ({
  campaign,
  onAngleSelected,
  onProceedToBlueprint,
}) => {
  const [angles, setAngles] = useState<CreativeAngle[]>(campaign.angles || []);
  const [selectedId, setSelectedId] = useState<string | null>(campaign.selectedAngleId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAngles = async () => {
      if (angles.length === 3) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getAngles(campaign.id);
        setAngles(data);
        if (!selectedId && data.length > 0) {
          // Default select angle 1 if none chosen
          setSelectedId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load creative directions");
      } finally {
        setIsLoading(false);
      }
    };
    loadAngles();
  }, [campaign.id]);

  const handleSelect = async (angleId: string) => {
    try {
      setIsSaving(true);
      setSelectedId(angleId);
      const res = await api.selectAngle(campaign.id, angleId);
      onAngleSelected(res.campaign);
    } catch (err: any) {
      setError(err.message || "Failed to save selected angle");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="pb-8 border-b border-neutral-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-bold text-emerald-400">STAGE 03</span>
          <span className="text-neutral-600">/</span>
          <span className="text-xs text-neutral-400 font-mono">CREATIVE STRATEGY</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          Choose your creative direction
        </h1>
        <p className="text-neutral-400 text-sm mt-2 max-w-2xl leading-relaxed">
          Three directions were developed from the research. Pick the one that best fits your campaign.
        </p>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="my-16 text-center py-12">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg text-white">Synthesizing 3 Angles from Research</h3>
          <p className="text-xs text-neutral-400 mt-1">Grounding hooks and imagery directly in verified claims...</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Exactly 3 Angles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {angles.map((angle) => {
              const isSelected = selectedId === angle.id;
              let sourcesList: string[] = [];
              try {
                sourcesList = JSON.parse(angle.sourceIds || "[]");
              } catch {}

              return (
                <div
                  key={angle.id}
                  className={`rounded-2xl transition-all duration-200 flex flex-col justify-between border ${
                    isSelected
                      ? "bg-[#0f1510] border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/30"
                      : "bg-[#0c0c10] border-neutral-800/80 hover:border-neutral-700"
                  } p-6 relative`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-black shadow">
                      SELECTED DIRECTION
                    </div>
                  )}

                  <div>
                    {/* Top Label */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                        ANGLE 0{angle.angleNumber}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-xl text-white mb-3 tracking-tight">
                      {angle.name}
                    </h3>

                    {/* Hook Callout */}
                    <div className="p-3 rounded-xl bg-black/40 border border-neutral-800/80 mb-4">
                      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                        Campaign Hook
                      </div>
                      <div className="text-sm font-display font-bold text-emerald-300 italic">
                        "{angle.hook}"
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3.5 text-xs text-neutral-300">
                      <div>
                        <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-1">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Audience Insight</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed">{angle.audienceInsight}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-1">
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Visual Direction</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed">{angle.visualDirection}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-neutral-400 font-semibold mb-1">
                          <Compass className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Why It Works</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed">{angle.rationale}</p>
                      </div>

                      {sourcesList.length > 0 && (
                        <div className="pt-2 border-t border-neutral-800/80">
                          <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mb-1">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            <span>Grounded in Evidence:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {sourcesList.map((src, sIdx) => {
                              try {
                                const domain = new URL(src).hostname.replace("www.", "");
                                return (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 rounded bg-neutral-900 text-[10px] font-mono text-neutral-400 border border-neutral-800"
                                  >
                                    {domain}
                                  </span>
                                );
                              } catch {
                                return null;
                              }
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select Button */}
                  <div className="mt-6 pt-4 border-t border-neutral-800/80">
                    <button
                      onClick={() => handleSelect(angle.id)}
                      disabled={isSaving}
                      className={`w-full py-2.5 px-4 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? "bg-emerald-500 text-black cursor-default shadow"
                          : "bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>Choose this direction</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action */}
          <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
            <div className="text-xs text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Selecting a direction locks the visual grammar for the master blueprint.</span>
            </div>

            <button
              onClick={onProceedToBlueprint}
              disabled={!selectedId}
              className="px-6 py-3 rounded-xl font-display font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 active:scale-98 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              <span>Generate Creative Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
