import React, { useState } from "react";
import { ChevronDown, ChevronUp, Terminal, Activity } from "lucide-react";
import { ActivityEvent } from "../types";

interface TechnicalTraceProps {
  events: ActivityEvent[];
  meta?: {
    provider?: string;
    durationMs?: number;
    searchCount?: number;
    pageReadCount?: number;
    trace?: Array<{ step: string; details: string; timestamp: string }>;
  };
}

export const TechnicalTrace: React.FC<TechnicalTraceProps> = ({ events, meta }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-8 border border-neutral-800 rounded-xl bg-[#0b0b0f] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-mono font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-neutral-500" />
          <span>View technical trace</span>
          {meta?.provider && (
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
              provider: {meta.provider}
            </span>
          )}
          {meta?.durationMs && (
            <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
              {meta.durationMs}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-neutral-500">{isOpen ? "Hide" : "Expand"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-neutral-800/80 bg-[#070709] font-mono text-xs text-neutral-300 space-y-3">
          {meta && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 border-b border-neutral-800/60 text-[11px]">
              <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-500 block">PROVIDER</span>
                <span className="text-emerald-400 font-bold">{meta.provider || "fixture"}</span>
              </div>
              <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-500 block">WEB SEARCHES</span>
                <span className="text-white font-bold">{meta.searchCount ?? 3} / 5</span>
              </div>
              <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-500 block">PAGE READS</span>
                <span className="text-white font-bold">{meta.pageReadCount ?? 3} / 6</span>
              </div>
              <div className="p-2 rounded bg-neutral-900/80 border border-neutral-800">
                <span className="text-neutral-500 block">EXECUTION TIME</span>
                <span className="text-white font-bold">{meta.durationMs ? `${meta.durationMs}ms` : "Fast"}</span>
              </div>
            </div>
          )}

          {meta?.trace && meta.trace.length > 0 && (
            <div className="space-y-1.5 pb-3 border-b border-neutral-800/60">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                Execution Steps
              </div>
              {meta.trace.map((t, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px]">
                  <span className="text-emerald-500 font-bold">[{t.step}]</span>
                  <span className="text-neutral-300 flex-1">{t.details}</span>
                  <span className="text-neutral-600 text-[10px]">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
              Activity Stream
            </div>
            {events.length === 0 ? (
              <div className="text-neutral-500 text-xs italic">No activity recorded yet.</div>
            ) : (
              events.slice(0, 8).map((evt) => (
                <div key={evt.id} className="flex items-start gap-2 text-[11px]">
                  <Activity className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-neutral-400 font-medium">[{evt.eventType}]</span>
                  <span className="text-neutral-200">{evt.message}</span>
                  <span className="text-neutral-600 text-[10px] ml-auto">
                    {new Date(evt.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
