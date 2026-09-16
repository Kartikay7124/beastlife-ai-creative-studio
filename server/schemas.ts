import { z } from "zod";

export const CampaignObjectiveEnum = z.enum([
  "Awareness",
  "Product Launch",
  "Consideration",
  "Conversion",
  "Retention",
]);

export const CampaignToneEnum = z.enum([
  "Bold",
  "Premium",
  "Energetic",
  "Minimal",
  "Trustworthy",
]);

export const CampaignBriefSchema = z.object({
  name: z.string().optional(),
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  productDescription: z
    .string()
    .min(10, "Product description must contain factual information (at least 10 characters)"),
  targetAudience: z.string().min(3, "Target audience is required"),
  campaignObjective: CampaignObjectiveEnum,
  tone: CampaignToneEnum,
  cta: z.string().min(2, "CTA is required"),
  verifiedClaims: z.string().optional().nullable(),
  productImagePath: z.string().optional().nullable(),
});

export const ResearchSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  domain: z.string().min(1),
  summary: z.string().min(1),
  excerpt: z.string().min(1),
});

export const ResearchOutputSchema = z.object({
  summary: z.string().min(10),
  audienceObservations: z.array(z.string()).min(1),
  productObservations: z.array(z.string()).min(1),
  creativeInterpretation: z.string().min(10),
  sources: z.array(ResearchSourceSchema).min(3, "Research must produce at least 3 sources"),
});

export const CreativeAngleSchema = z.object({
  angleNumber: z.number().int().min(1).max(3),
  name: z.string().min(2),
  audienceInsight: z.string().min(10),
  hook: z.string().min(3),
  visualDirection: z.string().min(10),
  rationale: z.string().min(10),
  sourceIds: z.array(z.string()),
});

export const CreativeAnglesListSchema = z
  .array(CreativeAngleSchema)
  .length(3, "Must generate exactly 3 creative angles");

export const VideoOutlineBeatSchema = z.object({
  timeRange: z.string(), // e.g. "0-2s", "2-6s", "6-8s"
  beatType: z.string(), // "Hook", "Story / Product", "CTA"
  visualDescription: z.string(),
  onScreenText: z.string(),
});

export const CreativeSpecSchema = z.object({
  hook: z.string().min(3),
  approvedCopy: z.string().min(5),
  cta: z.string().min(2),
  productIdentity: z.string().min(3),
  approvedClaims: z.array(z.string()),
  scene: z.string().min(5),
  palette: z.array(z.string()).min(2),
  composition: z.string().min(5),
  typography: z.string().min(3),
  visualTreatment: z.string().min(5),
  videoOutline: z.array(VideoOutlineBeatSchema).min(3),
});

export type CampaignBriefInput = z.infer<typeof CampaignBriefSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;
export type CreativeAngleData = z.infer<typeof CreativeAngleSchema>;
export type CreativeSpecData = z.infer<typeof CreativeSpecSchema>;
