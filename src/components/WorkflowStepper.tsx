import React from "react";
import { Check } from "lucide-react";

export type StepNumber = 1 | 2 | 3 | 4 | 5;

interface WorkflowStepperProps {
  currentStep: StepNumber;
  onStepClick: (step: StepNumber) => void;
  maxAccessibleStep: StepNumber;
}

const STEPS = [
  { id: 1, label: "Brief", sub: "Product context" },
  { id: 2, label: "Research", sub: "Market & sources" },
  { id: 3, label: "Direction", sub: "3 creative angles" },
  { id: 4, label: "Blueprint", sub: "Master spec" },
  { id: 5, label: "Assets", sub: "Coordinated ads" },
] as const;

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}) => {
  return (
    <div className="border-b border-neutral-800/80 bg-[#0c0c10]/70 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isAccessible = step.id <= maxAccessibleStep;

          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <div
                  className={`h-px flex-1 mx-2 sm:mx-4 transition-colors ${
                    isCompleted ? "bg-emerald-500/60" : "bg-neutral-800"
                  }`}
                />
              )}
              <button
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick(step.id as StepNumber)}
                className={`group flex items-center gap-3 text-left transition-all ${
                  isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-black shadow-sm"
                      : isCurrent
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500 shadow-sm"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : `0${step.id}`}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={`text-sm font-semibold tracking-tight transition-colors ${
                      isCurrent ? "text-white" : isCompleted ? "text-neutral-200" : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-neutral-400">{step.sub}</div>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
