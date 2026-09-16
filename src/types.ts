export type CampaignStatus =
  | "DRAFT"
  | "RESEARCHING"
  | "RESEARCH_READY"
  | "ANGLE_SELECTED"
  | "SPEC_GENERATING"
  | "SPEC_READY"
  | "ASSETS_GENERATING"
  | "VIDEO_RENDERING"
  | "COMPLETED"
  | "FAILED";

export interface ResearchSource {
  id: string;
  campaignId: string;
  title: string;
  url: string;
  domain: string;
  accessedAt: string;
  summary: string;
  excerpt: string;
}

export interface CreativeAngle {
  id: string;
  campaignId: string;
  angleNumber: number;
  name: string;
  audienceInsight: string;
  hook: string;
  visualDirection: string;
  rationale: string;
  sourceIds: string; // JSON array of string URLs
  createdAt: string;
}

export interface VideoBeat {
  timeRange: string;
  beatType: string;
  visualDescription: string;
  onScreenText: string;
}

export interface CreativeSpec {
  id: string;
  campaignId: string;
  version: number;
  hook: string;
  approvedCopy: string;
  cta: string;
  productIdentity: string;
  approvedClaims: string; // JSON array
  scene: string;
  palette: string; // JSON array
  composition: string;
  typography: string;
  visualTreatment: string;
  videoOutline: string; // JSON array of VideoBeat
  createdAt: string;
}

export interface Asset {
  id: string;
  campaignId: string;
  type: "IMAGE_SQUARE" | "IMAGE_VERTICAL" | "VIDEO_VERTICAL";
  format: "PNG" | "MP4";
  width: number;
  height: number;
  duration?: number | null;
  filePath: string;
  provider: "fixture" | "gemini" | "ffmpeg";
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  error?: string | null;
  createdAt: string;
}

export interface WorkflowStage {
  id: string;
  campaignId: string;
  stage: "RESEARCH" | "ANGLES" | "SPEC" | "IMAGE_SQUARE" | "IMAGE_VERTICAL" | "VIDEO_VERTICAL";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt?: string | null;
  completedAt?: string | null;
  retryCount: number;
  error?: string | null;
  metadata?: string | null;
}

export interface ActivityEvent {
  id: string;
  campaignId: string;
  eventType: string;
  message: string;
  stage?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  productName: string;
  productDescription: string;
  targetAudience: string;
  campaignObjective: string;
  tone: string;
  cta: string;
  verifiedClaims?: string | null;
  productImagePath?: string | null;
  status: CampaignStatus;
  selectedAngleId?: string | null;
  researchSummary?: string | null;
  creativeNotes?: string | null;
  createdAt: string;
  updatedAt: string;

  researchSources?: ResearchSource[];
  angles?: CreativeAngle[];
  creativeSpecs?: CreativeSpec[];
  assets?: Asset[];
  workflowStages?: WorkflowStage[];
  activityEvents?: ActivityEvent[];
}
