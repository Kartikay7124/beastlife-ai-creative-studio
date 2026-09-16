import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { WorkflowStepper, StepNumber } from "./components/WorkflowStepper";
import { Stage01Brief } from "./components/Stage01Brief";
import { Stage02Research } from "./components/Stage02Research";
import { Stage03Direction } from "./components/Stage03Direction";
import { Stage04Blueprint } from "./components/Stage04Blueprint";
import { Stage05Assets } from "./components/Stage05Assets";
import { CampaignsHistory } from "./components/CampaignsHistory";
import { Campaign } from "./types";
import { api } from "./api/client";

export function App() {
  const [currentView, setCurrentView] = useState<"workflow" | "history">("workflow");
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<StepNumber>(1);

  // Compute maximum accessible step based on campaign state
  const computeMaxStep = (campaign: Campaign | null): StepNumber => {
    if (!campaign) return 1;
    if (campaign.assets && campaign.assets.length > 0) return 5;
    if (campaign.creativeSpecs && campaign.creativeSpecs.length > 0) return 5;
    if (campaign.selectedAngleId) return 4;
    if (campaign.angles && campaign.angles.length === 3) return 3;
    if (campaign.researchSummary) return 3;
    return 2;
  };

  const handleCampaignCreated = (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setCurrentStep(2);
    setMaxAccessibleStep(2);
  };

  const handleResearchCompleted = (updated: Campaign) => {
    setActiveCampaign(updated);
    const max = computeMaxStep(updated);
    setMaxAccessibleStep(Math.max(max, 3) as StepNumber);
  };

  const handleAngleSelected = (updated: Campaign) => {
    setActiveCampaign(updated);
    setMaxAccessibleStep(4);
  };

  const handleSpecGenerated = (updated: Campaign) => {
    setActiveCampaign(updated);
    setMaxAccessibleStep(5);
  };

  const handleCampaignUpdated = (updated: Campaign) => {
    setActiveCampaign(updated);
    const max = computeMaxStep(updated);
    setMaxAccessibleStep(max);
  };

  const handleSelectFromHistory = (campaign: Campaign) => {
    setActiveCampaign(campaign);
    const max = computeMaxStep(campaign);
    setMaxAccessibleStep(max);
    setCurrentStep(max);
    setCurrentView("workflow");
  };

  const handleNewCampaign = () => {
    setActiveCampaign(null);
    setCurrentStep(1);
    setMaxAccessibleStep(1);
    setCurrentView("workflow");
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f3f4f6] flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* BeastLife Studio Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onNewCampaign={handleNewCampaign}
        hasActiveCampaign={Boolean(activeCampaign)}
      />

      {/* Main View Area */}
      {currentView === "history" ? (
        <main className="flex-1">
          <CampaignsHistory
            onSelectCampaign={handleSelectFromHistory}
            onNewCampaign={handleNewCampaign}
          />
        </main>
      ) : (
        <main className="flex-1 flex flex-col">
          {/* 5-Step Guided Stepper (visible once campaign starts or on Step 1) */}
          <WorkflowStepper
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            maxAccessibleStep={maxAccessibleStep}
          />

          {/* Active Step Content */}
          <div className="flex-1">
            {currentStep === 1 && (
              <Stage01Brief onCampaignCreated={handleCampaignCreated} />
            )}

            {currentStep === 2 && activeCampaign && (
              <Stage02Research
                campaign={activeCampaign}
                onResearchCompleted={handleResearchCompleted}
                onProceedToDirections={() => {
                  setCurrentStep(3);
                  setMaxAccessibleStep((prev) => Math.max(prev, 3) as StepNumber);
                }}
              />
            )}

            {currentStep === 3 && activeCampaign && (
              <Stage03Direction
                campaign={activeCampaign}
                onAngleSelected={handleAngleSelected}
                onProceedToBlueprint={() => {
                  setCurrentStep(4);
                  setMaxAccessibleStep((prev) => Math.max(prev, 4) as StepNumber);
                }}
              />
            )}

            {currentStep === 4 && activeCampaign && (
              <Stage04Blueprint
                campaign={activeCampaign}
                onSpecGenerated={handleSpecGenerated}
                onProceedToAssets={() => {
                  setCurrentStep(5);
                  setMaxAccessibleStep(5);
                }}
              />
            )}

            {currentStep === 5 && activeCampaign && (
              <Stage05Assets
                campaign={activeCampaign}
                onCampaignUpdated={handleCampaignUpdated}
              />
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-[#060608] py-4 px-4 sm:px-8 text-center text-xs text-neutral-400 font-mono">
        <span>BeastLife AI Creative Studio • Strictly Evidence-Grounded Creative Synthesis</span>
      </footer>
    </div>
  );
}

export default App;
