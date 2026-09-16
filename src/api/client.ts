import { Campaign, CreativeAngle, CreativeSpec, ActivityEvent } from "../types";

/**
 * Base API URL configurable via VITE_API_BASE_URL.
 * When unset or empty, defaults to same-origin relative paths (e.g. "/api/..."),
 * which works in local dev, unified container deployments, and Vercel serverless rewrites.
 * When deployed separately (e.g. static frontend on Vercel/AI Studio pointing to Cloud Run/Railway),
 * setting VITE_API_BASE_URL routes all API traffic to the backend server.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/**
 * Builds a fully qualified or relative URL with the configured API_BASE_URL.
 */
export function buildUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
}

/**
 * Resolves an asset file path (e.g. "/generated/...", "/uploads/...", or full URL).
 */
export function resolveAssetUrl(filePath: string | null | undefined): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("data:")) {
    return filePath;
  }
  return buildUrl(filePath);
}

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
      errorDetail = `Server returned an HTML document (status ${res.status}). Verify that the backend API server is running and reachable (VITE_API_BASE_URL: '${API_BASE_URL || "same-origin"}').`;
    }

    if (!errorDetail && rawText.length > 0) {
      errorDetail = rawText.slice(0, 300);
    }

    throw new Error(errorDetail || `${fallbackMessage} (Status ${res.status})`);
  }

  // Defend against HTML returned with HTTP 200 (e.g. static SPA fallback rewriting /api/*)
  if (!contentType.includes("application/json")) {
    if (rawText.trim().toLowerCase().startsWith("<!doctype") || rawText.includes("<html")) {
      throw new Error(
        `${fallbackMessage}: Expected JSON from server, but received an HTML document (${rawText.slice(0, 80)}...). Check API route definition or configure VITE_API_BASE_URL.`
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
  // Health
  async checkHealth(): Promise<{ ok: boolean }> {
    const res = await fetch(buildUrl("/api/health"));
    return handleResponse<{ ok: boolean }>(res, "Health check failed");
  },

  async checkHealthz(): Promise<{ ok: boolean }> {
    const res = await fetch(buildUrl("/api/healthz"));
    return handleResponse<{ ok: boolean }>(res, "Healthz check failed");
  },

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    const res = await fetch(buildUrl("/api/campaigns"));
    return handleResponse<Campaign[]>(res, "Failed to load campaigns");
  },

  async getCampaign(id: string): Promise<Campaign> {
    const res = await fetch(buildUrl(`/api/campaigns/${id}`));
    return handleResponse<Campaign>(res, `Failed to load campaign ${id}`);
  },

  async createCampaign(formData: FormData): Promise<Campaign> {
    const res = await fetch(buildUrl("/api/campaigns"), {
      method: "POST",
      body: formData,
    });
    return handleResponse<Campaign>(res, "Failed to create campaign");
  },

  async loadSampleCampaign(): Promise<Campaign> {
    const res = await fetch(buildUrl("/api/campaigns/sample"), { method: "POST" });
    return handleResponse<Campaign>(res, "Failed to load sample campaign");
  },

  // Research
  async runResearch(id: string): Promise<{ campaign: Campaign; research: any; meta: any }> {
    const res = await fetch(buildUrl(`/api/campaigns/${id}/research`), { method: "POST" });
    return handleResponse<{ campaign: Campaign; research: any; meta: any }>(res, "Research couldn't be completed");
  },

  // Angles
  async getAngles(id: string): Promise<CreativeAngle[]> {
    const res = await fetch(buildUrl(`/api/campaigns/${id}/angles`));
    return handleResponse<CreativeAngle[]>(res, "Failed to load creative directions");
  },

  async selectAngle(campaignId: string, angleId: string): Promise<{ campaign: Campaign; selectedAngle: CreativeAngle }> {
    const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/select-angle`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ angleId }),
    });
    return handleResponse<{ campaign: Campaign; selectedAngle: CreativeAngle }>(res, "Failed to select angle");
  },

  // Creative Spec
  async generateSpec(campaignId: string): Promise<CreativeSpec> {
    const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/spec`), { method: "POST" });
    return handleResponse<CreativeSpec>(res, "Failed to generate Creative Blueprint");
  },

  async getSpec(campaignId: string): Promise<CreativeSpec> {
    const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/spec`));
    return handleResponse<CreativeSpec>(res, "Failed to load Creative Blueprint");
  },

  // Asset Generation & Retry
  async generateAssets(campaignId: string, failStage?: string): Promise<Campaign> {
    const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/generate`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ failStage }),
    });
    return handleResponse<Campaign>(res, "Asset generation failed");
  },

  async retryStage(campaignId: string, stage: string): Promise<Campaign> {
    const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/stages/${stage}/retry`), {
      method: "POST",
    });
    return handleResponse<Campaign>(res, `Retry for ${stage} failed`);
  },

  // Events & Trace
  async getEvents(campaignId: string): Promise<ActivityEvent[]> {
    const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/events`));
    if (!res.ok) return [];
    try {
      const text = await res.text();
      return JSON.parse(text);
    } catch {
      return [];
    }
  },

  // Helper
  resolveAssetUrl,
};
