import React, { useState, useEffect } from "react";
import { History, ArrowRight, Sparkles, CheckCircle2, Clock, AlertTriangle, Layers } from "lucide-react";
import { Campaign } from "../types";
import { api } from "../api/client";

interface CampaignsHistoryProps {
  onSelectCampaign: (campaign: Campaign) => void;
  onNewCampaign: () => void;
}

export const CampaignsHistory: React.FC<CampaignsHistoryProps> = ({
  onSelectCampaign,
  onNewCampaign,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await api.getCampaigns();
        setCampaigns(data);
      } catch (err: any) {
        setError(err.message || "Failed to load campaigns");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-red-950 text-red-400 border border-red-800">
            <AlertTriangle className="w-3 h-3" />
            <span>Attention</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
            <Clock className="w-3 h-3" />
            <span>{status.replace(/_/g, " ")}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-neutral-400 font-mono">PERSISTENT STORAGE</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white tracking-tight">
            Campaign Archives
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            All campaigns and generated creative assets are safely persisted in your local SQLite database.
          </p>
        </div>

        <button
          onClick={onNewCampaign}
          className="px-4 py-2.5 rounded-xl font-display font-bold text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow"
        >
          + New Campaign
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="my-16 text-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs text-neutral-400 font-mono">Loading campaign database...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="my-16 text-center py-12 px-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 max-w-md mx-auto">
          <Layers className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-white mb-1">No campaigns created yet</h3>
          <p className="text-xs text-neutral-400 mb-6">
            Enter a product brief to research the market and build your first coordinated ad campaign.
          </p>
          <button
            onClick={onNewCampaign}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400"
          >
            Create Your First Campaign
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              onClick={() => onSelectCampaign(camp)}
              className="p-5 rounded-xl bg-[#0c0c10] border border-neutral-800 hover:border-neutral-700 hover:bg-[#0f0f14] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-display font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                    {camp.productName}
                  </span>
                  {getStatusBadge(camp.status)}
                </div>
                <p className="text-xs text-neutral-400 line-clamp-1 max-w-2xl mb-2">
                  {camp.productDescription}
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500">
                  <span>Objective: {camp.campaignObjective}</span>
                  <span>•</span>
                  <span>Tone: {camp.tone}</span>
                  <span>•</span>
                  <span>{new Date(camp.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="text-emerald-400">
                    {camp.assets?.filter((a) => a.status === "READY").length || 0} / 3 assets ready
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-neutral-400 group-hover:text-white text-xs font-semibold shrink-0">
                <span>Open Studio</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
