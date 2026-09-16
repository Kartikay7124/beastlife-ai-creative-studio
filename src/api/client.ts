import { Campaign, CreativeAngle, CreativeSpec, ActivityEvent } from "../types";
import { clientEngine } from "./clientEngine";

/**
 * Base API URL configurable via VITE_API_BASE_URL.
 * When unset or empty, defaults to same-origin relative paths (e.g. "/api/..."),
 * which works in local dev, unified container deployments, and Vercel serverless rewrites.
 * When deployed separately (e.g. static frontend on Vercel/AI Studio pointing to Cloud Run/Railway),
 * setting VITE_API_BASE_URL routes all API traffic to the backend server.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

let isStaticEngineActive = false;

/**
 * Returns true if the client has switched to the built-in Client Engine
 * because the remote server returned HTML (static SPA hosting) or was unreachable.
 */
export function isUsingClientEngine(): boolean {
  return isStaticEngineActive;
}

/**
 * Builds a fully qualified or relative URL with the configured API_BASE_URL.
 */
export function buildUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
}

/**
 * Resolves an asset file path (e.g. "/generated/...", "/uploads/...", data: URL, or external URL).
 */
export function resolveAssetUrl(filePath: string | null | undefined): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("data:") || filePath.startsWith("blob:")) {
    return filePath;
  }
  return buildUrl(filePath);
}

/**
 * Custom error class indicating the server responded with an HTML document
 * rather than the expected JSON API response (typical of static SPA hosts or missing proxy).
 */
export class ServerHtmlResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerHtmlResponseError";
  }
}

/**
 * Defensively inspects HTTP status, Content-Type, and raw text body
 * before parsing JSON to catch HTML document returns before throwing uncaught parse errors.
 */
async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const rawText = await res.text();

  const isHtml =
    contentType.includes("text/html") ||
    rawText.trim().toLowerCase().startsWith("<!doctype") ||
    rawText.includes("<html");

  if (!res.ok) {
    if (isHtml) {
      throw new ServerHtmlResponseError(
        `Server returned an HTML document (status ${res.status}) instead of API JSON.`
      );
    }

    let errorDetail = "";
    if (contentType.includes("application/json")) {
      try {
        const errorJson = JSON.parse(rawText);
        errorDetail = errorJson.error || errorJson.message || "";
      } catch {
        // Fallback to raw text below
      }
    }

    if (!errorDetail && rawText.length > 0) {
      errorDetail = rawText.slice(0, 300);
    }

    throw new Error(errorDetail || `${fallbackMessage} (Status ${res.status})`);
  }

  // Defend against HTML returned with HTTP 200 (e.g. static SPA fallback rewriting /api/* to index.html)
  if (isHtml) {
    throw new ServerHtmlResponseError(
      `${fallbackMessage}: Expected JSON from server, but received an HTML document (${rawText.slice(0, 80)}...). Check API route definition or configure VITE_API_BASE_URL.`
    );
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (err: any) {
    throw new Error(
      `${fallbackMessage}: Server response is not valid JSON (${err.message}). Preview: ${rawText.slice(0, 150)}`
    );
  }
}

/**
 * Transparently wraps backend API calls with automated Client Engine fallback.
 * If the remote server returns an HTML document (static hosting / missing serverless backend / redirect)
 * or experiences a network disconnection, the operation is fulfilled seamlessly by the in-browser engine.
 */
async function withFallback<T>(
  remoteFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  if (isStaticEngineActive) {
    return fallbackFn();
  }

  try {
    return await remoteFn();
  } catch (err: any) {
    const isHtmlError =
      err instanceof ServerHtmlResponseError ||
      err.name === "ServerHtmlResponseError" ||
      err.message?.includes("HTML document") ||
      err.message?.includes("Expected JSON from server") ||
      err.message?.includes("Failed to fetch") ||
      err.message?.includes("NetworkError");

    if (isHtmlError) {
      if (!isStaticEngineActive) {
        console.info(
          "[BeastLife Studio] Remote endpoint returned HTML or is unreachable. Seamlessly activating built-in Client Engine mode.",
          err.message
        );
        isStaticEngineActive = true;
      }
      return fallbackFn();
    }

    throw err;
  }
}

export const api = {
  // Health
  async checkHealth(): Promise<{ ok: boolean }> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl("/api/health"));
        return handleResponse<{ ok: boolean }>(res, "Health check failed");
      },
      async () => ({ ok: true })
    );
  },

  async checkHealthz(): Promise<{ ok: boolean }> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl("/api/healthz"));
        return handleResponse<{ ok: boolean }>(res, "Healthz check failed");
      },
      async () => ({ ok: true })
    );
  },

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl("/api/campaigns"));
        return handleResponse<Campaign[]>(res, "Failed to load campaigns");
      },
      () => clientEngine.getCampaigns()
    );
  },

  async getCampaign(id: string): Promise<Campaign> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${id}`));
        return handleResponse<Campaign>(res, `Failed to load campaign ${id}`);
      },
      () => clientEngine.getCampaign(id)
    );
  },

  async createCampaign(formData: FormData): Promise<Campaign> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl("/api/campaigns"), {
          method: "POST",
          body: formData,
        });
        return handleResponse<Campaign>(res, "Failed to create campaign");
      },
      () => clientEngine.createCampaign(formData)
    );
  },

  async loadSampleCampaign(): Promise<Campaign> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl("/api/campaigns/sample"), { method: "POST" });
        return handleResponse<Campaign>(res, "Failed to load sample campaign");
      },
      () => clientEngine.loadSampleCampaign()
    );
  },

  // Research
  async runResearch(id: string): Promise<{ campaign: Campaign; research: any; meta: any }> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${id}/research`), { method: "POST" });
        return handleResponse<{ campaign: Campaign; research: any; meta: any }>(res, "Research couldn't be completed");
      },
      () => clientEngine.runResearch(id)
    );
  },

  // Angles
  async getAngles(id: string): Promise<CreativeAngle[]> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${id}/angles`));
        return handleResponse<CreativeAngle[]>(res, "Failed to load creative directions");
      },
      () => clientEngine.getAngles(id)
    );
  },

  async selectAngle(campaignId: string, angleId: string): Promise<{ campaign: Campaign; selectedAngle: CreativeAngle }> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/select-angle`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ angleId }),
        });
        return handleResponse<{ campaign: Campaign; selectedAngle: CreativeAngle }>(res, "Failed to select angle");
      },
      () => clientEngine.selectAngle(campaignId, angleId)
    );
  },

  // Creative Spec
  async generateSpec(campaignId: string): Promise<CreativeSpec> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/spec`), { method: "POST" });
        return handleResponse<CreativeSpec>(res, "Failed to generate Creative Blueprint");
      },
      () => clientEngine.generateSpec(campaignId)
    );
  },

  async getSpec(campaignId: string): Promise<CreativeSpec> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/spec`));
        return handleResponse<CreativeSpec>(res, "Failed to load Creative Blueprint");
      },
      () => clientEngine.getSpec(campaignId)
    );
  },

  // Asset Generation & Retry
  async generateAssets(campaignId: string, failStage?: string): Promise<Campaign> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/generate`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ failStage }),
        });
        return handleResponse<Campaign>(res, "Asset generation failed");
      },
      () => clientEngine.generateAssets(campaignId, failStage)
    );
  },

  async retryStage(campaignId: string, stage: string): Promise<Campaign> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/stages/${stage}/retry`), {
          method: "POST",
        });
        return handleResponse<Campaign>(res, `Retry for ${stage} failed`);
      },
      () => clientEngine.retryStage(campaignId, stage)
    );
  },

  // Events & Trace
  async getEvents(campaignId: string): Promise<ActivityEvent[]> {
    return withFallback(
      async () => {
        const res = await fetch(buildUrl(`/api/campaigns/${campaignId}/events`));
        if (!res.ok) return [];
        try {
          const text = await res.text();
          return JSON.parse(text);
        } catch {
          return [];
        }
      },
      () => clientEngine.getEvents(campaignId)
    );
  },

  // Helper
  resolveAssetUrl,
  isUsingClientEngine,
};
