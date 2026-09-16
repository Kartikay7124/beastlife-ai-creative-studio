import { ResearchProvider, SearchResult, PageContent } from "./researchProvider";

export class FixtureResearchProvider implements ResearchProvider {
  name: "fixture" = "fixture";

  private mockPages: Record<string, { title: string; domain: string; content: string }> = {
    "https://journal.acsm.org/research/electrolyte-dynamics-athletic-performance": {
      title: "Electrolyte Depletion & High-Intensity Athletic Output: A Meta-Analysis",
      domain: "journal.acsm.org",
      content: `The American College of Sports Medicine research confirms that sodium and potassium replenishment at precise osmolality (280-300 mOsm/kg) preserves peak cardiac stroke volume and reduces time-to-exhaustion by up to 18% in ambient temperatures above 24°C. Rapid absorption depends heavily on hypotonic solute concentrations rather than high sucrose loads. Clean mineral ratios (4:1 sodium to potassium) prevent cellular dehydration during repeated anaerobic bursts.`,
    },
    "https://sportsnutrition.org/studies/bioavailable-hydration-standards": {
      title: "Bioavailability in Modern Hydration Formulations: Mineral Salt Absorption",
      domain: "sportsnutrition.org",
      content: `Comparative clinical analysis shows athletes prioritize three primary criteria in daily supplementation: zero artificial coloring, rapid solubility in cold water, and lack of gastrointestinal distress. Standard commercial sports drinks average 34g of refined sugars per serving, causing osmotic gastric delay. Micro-granulated pink Himalayan rock salt and magnesium malate demonstrated superior cellular retention over 4 hours post-workout.`,
    },
    "https://barbend.com/industry-report/consumer-shift-performance-supplements": {
      title: "Consumer Trend Report: The Rise of Minimalist, High-Efficacy Training Essentials",
      domain: "barbend.com",
      content: `Modern fitness enthusiasts and hybrid athletes are abandoning overly sweet, neon-colored pre-workouts in favor of unflavored or crisp natural citrus electrolytes with transparent labels. Audience sentiment surveys indicate that 84% of CrossFit, marathon, and combat sports practitioners read the active ingredient panel before purchasing and actively seek zero-sugar formulations with verified third-party batch testing.`,
    },
    "https://clinicalhydration.org/guidelines/recovery-protocols": {
      title: "Clinical Guidelines for Rapid Fluid & Mineral Homeostasis in Athletes",
      domain: "clinicalhydration.org",
      content: `Adequate cellular replenishment requires balanced magnesium and chloride alongside sodium. In double-blind recovery trials, athletes receiving bioavailable chelated minerals maintained higher muscular power output on subsequent training sessions compared to plain water or high-carbohydrate alternatives.`,
    },
  };

  async searchWeb(query: string): Promise<SearchResult[]> {
    return [
      {
        title: "Electrolyte Depletion & High-Intensity Athletic Output",
        url: "https://journal.acsm.org/research/electrolyte-dynamics-athletic-performance",
        snippet: "Clinical studies on electrolyte replenishment, osmolality, and cellular retention in endurance and strength training.",
      },
      {
        title: "Bioavailability in Modern Hydration Formulations",
        url: "https://sportsnutrition.org/studies/bioavailable-hydration-standards",
        snippet: "Analysis of mineral salt absorption, GI distress prevention, and zero-sugar hydration efficacy.",
      },
      {
        title: "Consumer Trend Report: Minimalist High-Efficacy Training Essentials",
        url: "https://barbend.com/industry-report/consumer-shift-performance-supplements",
        snippet: "Audience sentiment and demand patterns for clean labels, batch testing, and uncompromised athletic performance.",
      },
      {
        title: "Clinical Guidelines for Rapid Fluid & Mineral Homeostasis",
        url: "https://clinicalhydration.org/guidelines/recovery-protocols",
        snippet: "Evidence-based protocols for muscular recovery and cellular hydration using chelated minerals.",
      },
    ];
  }

  async readPage(url: string): Promise<PageContent> {
    const page = this.mockPages[url];
    if (page) {
      return {
        url,
        title: page.title,
        domain: page.domain,
        content: page.content,
      };
    }
    // Fallback deterministic page
    const parsed = new URL(url);
    return {
      url,
      title: `Analysis & Scientific Review for ${parsed.hostname}`,
      domain: parsed.hostname,
      content: `Evidence-based research regarding training optimization, consumer behavior, and factual ingredient efficacy for athletic performance products.`,
    };
  }
}
