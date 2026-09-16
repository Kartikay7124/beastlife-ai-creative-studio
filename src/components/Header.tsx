import React from "react";
import { Zap, History, PlusCircle, Sparkles } from "lucide-react";

interface HeaderProps {
  currentView: "workflow" | "history";
  onViewChange: (view: "workflow" | "history") => void;
  onNewCampaign: () => void;
  hasActiveCampaign: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onNewCampaign,
  hasActiveCampaign,
}) => {
  return (
    <header className="border-b border-neutral-800/80 bg-[#0a0a0d]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewChange("workflow")}>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-lg tracking-wider text-white">BEASTLIFE</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                STUDIO
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 tracking-wide">Research. Create. Go Beast Mode.</p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange("workflow")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === "workflow"
                ? "bg-neutral-800 text-white border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Creative Studio
          </button>

          <button
            onClick={() => onViewChange("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentView === "history"
                ? "bg-neutral-800 text-white border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Campaigns</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={onNewCampaign}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-black hover:bg-emerald-400 active:scale-98 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>
    </header>
  );
};
