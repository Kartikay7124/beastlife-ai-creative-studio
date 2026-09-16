import { CampaignBriefInput, CreativeAngleData, CreativeAnglesListSchema, ResearchOutput } from "../../schemas";
import { geminiProvider } from "../gemini/geminiProvider";

export class AngleGenerator {
  async generate(brief: CampaignBriefInput, research: ResearchOutput): Promise<CreativeAngleData[]> {
    const useGemini = process.env.AI_PROVIDER === "gemini" && geminiProvider.isConfigured();

    if (useGemini) {
      try {
        return await this.generateWithGemini(brief, research);
      } catch (err: any) {
        console.warn("[AngleGenerator] Gemini angle generation failed, falling back to deterministic angles:", err?.message || err);
        return this.generateDeterministic(brief, research);
      }
    }

    return this.generateDeterministic(brief, research);
  }

  private generateDeterministic(brief: CampaignBriefInput, research: ResearchOutput): CreativeAngleData[] {
    const s1 = research.sources[0]?.url || "https://journal.acsm.org";
    const s2 = research.sources[1]?.url || "https://sportsnutrition.org";
    const s3 = research.sources[2]?.url || "https://barbend.com";

    const angles: CreativeAngleData[] = [
      {
        angleNumber: 1,
        name: "The Uncompromised Standard",
        audienceInsight: "Dedicated athletes refuse sugar-loaded sports drinks that compromise their nutrition standards and digestive comfort during heavy training.",
        hook: `NO SUGAR. NO EXCUSES. RAW ${brief.productName.toUpperCase()}.`,
        visualDirection: "Ultra high-contrast editorial photography on obsidian matte background, dynamic water droplets, BeastLife emerald green lightning accents, and sharp typography.",
        rationale: "Positions the product as the uncompromising baseline for elite performance, directly addressing the audience's demand for clean label integrity.",
        sourceIds: [s1, s2],
      },
      {
        angleNumber: 2,
        name: "Cellular Osmolality & Recovery",
        audienceInsight: "Athletes know that standard water alone fails to prevent muscular cramping when sodium and key mineral ratios are depleted.",
        hook: "REPLENISH BEFORE YOU HIT THE WALL.",
        visualDirection: "Technical macro imagery showing effervescent mineral dissolution in ice-cold shaker, split-second splash freeze, clinical precision calipers, and bold neon-green callouts.",
        rationale: "Leverages scientific evidence from hydration research to establish functional superiority and immediate muscular recovery.",
        sourceIds: [s1, s3],
      },
      {
        angleNumber: 3,
        name: "Beast Mode Ritual",
        audienceInsight: "Elite training is a discipline of daily micro-rituals. The pre-training hydration mix signals the psychological transition into relentless intensity.",
        hook: "FUEL THE ENGINE. UNLEASH THE BEAST.",
        visualDirection: "Gritty athletic documentary style, heavy barbell knurling, focused eye contact, dark shadows with backlit rim lighting in BeastLife signature green.",
        rationale: "Taps into the emotional identity and athletic dedication of the BeastLife community while remaining fully grounded in factual product benefits.",
        sourceIds: [s2, s3],
      },
    ];

    return CreativeAnglesListSchema.parse(angles);
  }

  private async generateWithGemini(brief: CampaignBriefInput, research: ResearchOutput): Promise<CreativeAngleData[]> {
    const prompt = `You are the BeastLife Creative Director. Based on the product brief and research evidence below, generate EXACTLY 3 distinct creative directions.

Brief:
- Product: ${brief.productName}
- Description: ${brief.productDescription}
- Audience: ${brief.targetAudience}
- Objective: ${brief.campaignObjective}
- Tone: ${brief.tone}
- CTA: ${brief.cta}
- Verified Claims: ${brief.verifiedClaims || "None provided"}

Research Synthesis:
${research.summary}

Sources:
${research.sources.map((s, i) => `[Source ${i + 1}]: ${s.title} (${s.url})`).join("\n")}

REQUIREMENTS:
1. Generate EXACTLY 3 creative angles. No more, no fewer.
2. The 3 angles must be meaningfully distinct in concept, emotional hook, and visual execution.
3. CLAIM SAFETY: DO NOT invent benefits, clinical guarantees, or certifications not in the brief.
4. Each angle must reference at least one of the real research source URLs in sourceIds.

Output strictly valid JSON matching this schema:
[
  {
    "angleNumber": 1,
    "name": "Angle Title",
    "audienceInsight": "Deeper insight from research",
    "hook": "Strong bold headline",
    "visualDirection": "Visual and aesthetic direction",
    "rationale": "Why this direction works",
    "sourceIds": ["url1", "url2"]
  },
  {
    "angleNumber": 2,
    "name": "Angle Title",
    "audienceInsight": "Deeper insight from research",
    "hook": "Strong bold headline",
    "visualDirection": "Visual and aesthetic direction",
    "rationale": "Why this direction works",
    "sourceIds": ["url1", "url2"]
  },
  {
    "angleNumber": 3,
    "name": "Angle Title",
    "audienceInsight": "Deeper insight from research",
    "hook": "Strong bold headline",
    "visualDirection": "Visual and aesthetic direction",
    "rationale": "Why this direction works",
    "sourceIds": ["url1", "url2"]
  }
]`;

    const text = await geminiProvider.generateContent(prompt, {
      model: "gemini-3.8-flash",
      responseMimeType: "application/json",
    });

    const data = geminiProvider.parseJsonResponse<any>(text, "Creative angles");
    return CreativeAnglesListSchema.parse(data);
  }
}
