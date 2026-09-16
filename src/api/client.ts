import { Campaign, CreativeAngle, CreativeSpec, ActivityEvent } from "../types";

/**
 * Defensively inspects HTTP status, Content-Type, and raw text body
 * before parsing JSON to prevent "Unexpected token '<', '<!doctype ...'" errors.
 */
async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const rawText = await res.text();

  if (!res.ok) {
    let errorDetail = "";
    if (contentType.includes("application/json")) {
      try {
        const errorJson = JSON.parse(rawText);
        errorDetail = errorJson.error || errorJson.message || "";
      } catch {
        // use rawText snippet below
      }
    } else if (rawText.trim().toLowerCase().startsWith("<!doctype") || rawText.includes("<html")) {
      errorDetail = `Server returned an HTML document (status ${res.status}). Check server routing and endpoint availability.`;
    }

    if (!errorDetail && rawText.length > 0) {
      errorDetail = rawText.slice(0, 300);
    }

    throw new Error(errorDetail || `${fallbackMessage} (Status ${res.status})`);
  }

  // Defend against HTML returned with HTTP 200 (e.g. Vite SPA fallback)
  if (!contentType.includes("application/json")) {
    if (rawText.trim().toLowerCase().startsWith("<!doctype") || rawText.includes("<html")) {
      throw new Error(
        `${fallbackMessage}: Expected JSON from server, but received an HTML document (${rawText.slice(0, 80)}...). Check API route definition.`
      );
    }
    throw new Error(`${fallbackMessage}: Expected application/json, but got '${contentType}'.`);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (err: any) {
    throw new Error(
      `${fallbackMessage}: Server response is not valid JSON (${err.message}). Preview: ${rawText.slice(0, 150)}`
    );
  }
}

export const api = {
  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const res = await fetch("/api/campaigns");
    return handleResponse<Campaign[]>(res, "Failed to load campaigns");
  },

  async getCampaign(id: string): Promise<Campaign> {
    const res = await fetch(`/api/campaigns/${id}`);
    return handleResponse<Campaign>(res, `Failed to load campaign ${id}`);
  },

  async createCampaign(formData: FormData): Promise<Campaign> {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      body: formData,
    });
    return handleResponse<Campaign>(res, "Failed to create campaign");
  },

  async loadSampleCampaign(): Promise<Campaign> {
    const res = await fetch("/api/campaigns/sample", { method: "POST" });
    return handleResponse<Campaign>(res, "Failed to load sample campaign");
  },

  // Research
  async runResearch(id: string): Promise<{ campaign: Campaign; research: any; meta: any }> {
    const res = await fetch(`/api/campaigns/${id}/research`, { method: "POST" });
    return handleResponse<{ campaign: Campaign; research: any; meta: any }>(res, "Research couldn't be completed");
  },

  // Angles
  async getAngles(id: string): Promise<CreativeAngle[]> {
    const res = await fetch(`/api/campaigns/${id}/angles`);
    return handleResponse<CreativeAngle[]>(res, "Failed to load creative directions");
  },

  async selectAngle(campaignId: string, angleId: string): Promise<{ campaign: Campaign; selectedAngle: CreativeAngle }> {
    const res = await fetch(`/api/campaigns/${campaignId}/select-angle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ angleId }),
    });
    return handleResponse<{ campaign: Campaign; selectedAngle: CreativeAngle }>(res, "Failed to select angle");
  },

  // Creative Spec
  async generateSpec(campaignId: string): Promise<CreativeSpec> {
    const res = await fetch(`/api/campaigns/${campaignId}/spec`, { method: "POST" });
    return handleResponse<CreativeSpec>(res, "Failed to generate Creative Blueprint");
  },

  async getSpec(campaignId: string): Promise<CreativeSpec> {
    const res = await fetch(`/api/campaigns/${campaignId}/spec`);
    return handleResponse<CreativeSpec>(res, "Failed to load Creative Blueprint");
  },

  // Asset Generation & Retry
  async generateAssets(campaignId: string, failStage?: string): Promise<Campaign> {
    const res = await fetch(`/api/campaigns/${campaignId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ failStage }),
    });
    return handleResponse<Campaign>(res, "Asset generation failed");
  },

  async retryStage(campaignId: string, stage: string): Promise<Campaign> {
    const res = await fetch(`/api/campaigns/${campaignId}/stages/${stage}/retry`, {
      method: "POST",
    });
    return handleResponse<Campaign>(res, `Retry for ${stage} failed`);
  },

  // Events & Trace
  async getEvents(campaignId: string): Promise<ActivityEvent[]> {
    const res = await fetch(`/api/campaigns/${campaignId}/events`);
    if (!res.ok) return [];
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch {
      return [];
    }
  },
};

