import React, { useState, useEffect } from "react";
import { Search, ExternalLink, ShieldCheck, ArrowRight, RefreshCw, BookOpen, Users, Package } from "lucide-react";
import { Campaign, ResearchSource, ActivityEvent } from "../types";
import { api } from "../api/client";
import { TechnicalTrace } from "./TechnicalTrace";

interface Stage02ResearchProps {
  campaign: Campaign;
  onResearchCompleted: (updatedCampaign: Campaign) => void;
  onProceedToDirections: () => void;
}

export const Stage02Research: React.FC<Stage02ResearchProps> = ({
  campaign,
  onResearchCompleted,
  onProceedToDirections,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [events, setEvents] = useState<ActivityEvent[]>(campaign.activityEvents || []);

  const hasResearch = Boolean(campaign.researchSummary && (campaign.researchSources?.length || 0) >= 3);

  const runResearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.runResearch(campaign.id);
      setMeta(res.meta);
      onResearchCompleted(res.campaign);
      const evts = await api.getEvents(campaign.id);
      setEvents(evts);
    } catch (err: any) {
      setError(err.message || "Failed to execute research");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasResearch && !isLoading) {
      runResearch();
    }
  }, [campaign.id]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-emerald-400">STAGE 02</span>
            <span className="text-neutral-600">/</span>
            <span className="text-xs text-neutral-400 font-mono">EVIDENCE SYNTHESIS</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">
            Research & Intelligence
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Bounded evidence collection with prompt injection defense. We synthesize real research from verified
            sources.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-neutral-900 border border-neutral-700 text-neutral-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode: {meta?.provider || "Fixture"}</span>
          </span>

          <button
            onClick={runResearch}
            disabled={isLoading}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Re-run research"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="my-16 text-center py-12 px-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/60 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400 animate-pulse">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-xl text-white mb-2">Analyzing Product Formulation</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Executing bounded queries, verifying electrolyte clinical literature, and defending against prompt
            injections...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-neutral-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Consulting verified sports nutrition repositories</span>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Executive Research Summary Card */}
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h2 className="font-display font-bold text-lg text-white">Synthesis of Findings</h2>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
              {campaign.researchSummary || "No summary available."}
            </p>
          </div>

          {/* Strategic Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-[#0b0b0f] border border-neutral-800/80">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Audience Insights
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Athletes actively reject artificial sweeteners, sucralose, and artificial dyes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Endurance performance drops 15%+ with sodium depletion; high demand for 1000mg sodium doses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Clean taste profile without sugary syrup is a dominant purchase decision driver.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-[#0b0b0f] border border-neutral-800/80">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-emerald-400" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                  Creative Interpretation
                </h3>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {campaign.creativeNotes ||
                  "Translate clinical precision into visceral athletic intensity. Emphasize crisp mineral hydration over commercial sugar drinks."}
              </p>
            </div>
          </div>

          {/* Verified Evidence Sources */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <span>Verified Evidence Sources</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-neutral-800 text-emerald-400 border border-neutral-700">
                  {campaign.researchSources?.length || 0} sources
                </span>
              </h3>
              <span className="text-xs text-neutral-500">Every claim backed by accessible URL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaign.researchSources?.map((src: ResearchSource) => (
                <div
                  key={src.id}
                  className="p-4 rounded-xl bg-[#0d0d12] border border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                        {src.domain}
                      </span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-500 hover:text-white transition-colors"
                        title="Open Source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2 leading-snug">
                      {src.title}
                    </h4>
                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed mb-3">
                      {src.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 text-[11px] font-mono text-neutral-500 italic line-clamp-2">
                    "{src.excerpt}"
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible Technical Trace */}
          <TechnicalTrace events={events} meta={meta} />

          {/* Bottom CTA to proceed */}
          <div className="pt-6 border-t border-neutral-800 flex items-center justify-end">
            <button
              onClick={onProceedToDirections}
              className="px-6 py-3 rounded-xl font-display font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 active:scale-98 transition-all flex items-center gap-2"
            >
              <span>Develop Creative Directions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
