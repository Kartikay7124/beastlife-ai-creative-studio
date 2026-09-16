import { CampaignBriefInput, CreativeAngleData, CreativeSpecData, CreativeSpecSchema, ResearchOutput } from "../../schemas";
import { geminiProvider } from "../gemini/geminiProvider";

export class SpecGenerator {
  async generate(
    brief: CampaignBriefInput,
    research: ResearchOutput,
    selectedAngle: CreativeAngleData
  ): Promise<CreativeSpecData> {
    const useGemini = process.env.AI_PROVIDER === "gemini" && geminiProvider.isConfigured();

    if (useGemini) {
      try {
        return await this.generateWithGemini(brief, research, selectedAngle);
      } catch (err: any) {
        console.warn("[SpecGenerator] Gemini spec generation failed, falling back to deterministic spec:", err?.message || err);
        return this.generateDeterministic(brief, research, selectedAngle);
      }
    }

    return this.generateDeterministic(brief, research, selectedAngle);
  }

  private generateDeterministic(
    brief: CampaignBriefInput,
    _research: ResearchOutput,
    selectedAngle: CreativeAngleData
  ): CreativeSpecData {
    // Extract approved claims from verified claims or product description
    const approvedClaims = brief.verifiedClaims
      ? brief.verifiedClaims.split("\n").map((c) => c.trim()).filter(Boolean)
      : ["Zero artificial sweeteners", "Rapid cellular mineral replenishment", "Informed-Sport batch tested"];

    const spec: CreativeSpecData = {
      hook: selectedAngle.hook,
      approvedCopy: `${brief.productName}: Formulated for relentless athletes who demand pure bioavailable electrolytes without sugar, fillers, or compromises.`,
      cta: brief.cta,
      productIdentity: `${brief.productName} — Premium High-Osmolality Athletic Hydration`,
      approvedClaims,
      scene: "Dramatic low-key athletic training space, obsidian concrete matte floor, directional high-key rim lighting, dynamic water droplets suspended in mid-air around the product container.",
      palette: ["#0A0A0C", "#22C55E", "#F3F4F6", "#16161A", "#4ADE80"],
      composition: "Central vertical product hero with prominent display typography anchored at top-center, angular green framing accents, and high-contrast call-to-action bar pinned at lower third.",
      typography: "Display: Clash Display Bold / Syne 800; Body: General Sans / Plus Jakarta Sans Medium; High tracking on category subtitles; High contrast white on black.",
      visualTreatment: "Subtle analog film grain (2%), crisp volumetric green rim lights, hyper-sharp metallic highlights on packaging, minimal motion blur, zero AI dreaminess.",
      videoOutline: [
        {
          timeRange: "0-2s",
          beatType: "Opening Hook",
          visualDescription: "Macro close-up cut: Sweat beads on focused athlete's brow, sudden pulse of emerald energy, hook text impacts screen with kinetic punch.",
          onScreenText: selectedAngle.hook,
        },
        {
          timeRange: "2-6s",
          beatType: "Product / Storytelling",
          visualDescription: "Hero reveal: The product container slams down in zero gravity with effervescent water splash freeze. Mineral breakdown callout rings expand dynamically.",
          onScreenText: "PURE HYDRATION. ZERO EXCUSES.",
        },
        {
          timeRange: "6-8s",
          beatType: "Brand Ending & CTA",
          visualDescription: "BeastLife emblem locks into focus with emerald glow pulse. CTA button animates with high-contrast border sheen.",
          onScreenText: `${brief.cta} — BEASTLIFE.COM`,
        },
      ],
    };

    return CreativeSpecSchema.parse(spec);
  }

  private async generateWithGemini(
    brief: CampaignBriefInput,
    research: ResearchOutput,
    selectedAngle: CreativeAngleData
  ): Promise<CreativeSpecData> {
    const prompt = `You are the Lead Creative Architect at BeastLife Studio.
Translate this approved brief, research, and selected angle into ONE unified master CreativeSpec.
This spec will directly guide the 1080x1080 Square Ad, the 1080x1920 Story Ad, and the 8-second vertical video.

Product Brief:
- Product: ${brief.productName}
- Description: ${brief.productDescription}
- Audience: ${brief.targetAudience}
- Objective: ${brief.campaignObjective}
- Tone: ${brief.tone}
- CTA: ${brief.cta}
- Verified Claims: ${brief.verifiedClaims || "None provided"}

Selected Creative Angle:
- Angle Name: ${selectedAngle.name}
- Hook: ${selectedAngle.hook}
- Audience Insight: ${selectedAngle.audienceInsight}
- Visual Direction: ${selectedAngle.visualDirection}
- Rationale: ${selectedAngle.rationale}

CLAIM SAFETY RULES:
- Only include approved claims from the brief facts.
- Do NOT invent certifications, guarantees, clinical trials, or discounts.
- The 3 video beats MUST follow: 0-2s Hook, 2-6s Story/Product, 6-8s CTA.

Output strictly valid JSON matching this schema:
{
  "hook": "${selectedAngle.hook}",
  "approvedCopy": "Punchy 1-2 sentence approved copy",
  "cta": "${brief.cta}",
  "productIdentity": "Crisp product identity line",
  "approvedClaims": ["claim 1", "claim 2"],
  "scene": "Detailed lighting, studio setup, and atmosphere",
  "palette": ["#0A0A0C", "#22C55E", "#F3F4F6", "#16161A", "#4ADE80"],
  "composition": "Framing, focal point, typography layout",
  "typography": "Font hierarchy and treatment rules",
  "visualTreatment": "Grading, grain, texture, lighting contrast",
  "videoOutline": [
    { "timeRange": "0-2s", "beatType": "Hook", "visualDescription": "...", "onScreenText": "..." },
    { "timeRange": "2-6s", "beatType": "Story / Product", "visualDescription": "...", "onScreenText": "..." },
    { "timeRange": "6-8s", "beatType": "CTA", "visualDescription": "...", "onScreenText": "..." }
  ]
}`;

    const text = await geminiProvider.generateContent(prompt, {
      model: "gemini-3.8-flash",
      responseMimeType: "application/json",
    });

    const data = geminiProvider.parseJsonResponse<any>(text, "Creative spec");
    return CreativeSpecSchema.parse(data);
  }
}
