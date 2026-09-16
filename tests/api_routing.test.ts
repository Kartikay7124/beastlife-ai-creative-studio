import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { createApp } from "../server/app";
import { prisma } from "../server/db";

// Force deterministic fixture mode
process.env.AI_PROVIDER = "fixture";
process.env.RESEARCH_PROVIDER = "fixture";
process.env.IMAGE_PROVIDER = "fixture";

describe("API Routing & JSON Contract Verification", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  });

  it("1. GET /api/health returns application/json with { ok: true }", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });

  it("2. GET /api/healthz returns application/json with { ok: true }", async () => {
    const res = await fetch(`${baseUrl}/api/healthz`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });

  it("3. GET /health and /healthz (root container health checks) return JSON", async () => {
    const resRoot = await fetch(`${baseUrl}/health`);
    expect(resRoot.status).toBe(200);
    expect(await resRoot.json()).toEqual({ ok: true });

    const resRootZ = await fetch(`${baseUrl}/healthz`);
    expect(resRootZ.status).toBe(200);
    expect(await resRootZ.json()).toEqual({ ok: true });
  });

  it("4. POST /api/campaigns with valid brief returns JSON 201 with campaign details", async () => {
    const validBrief = {
      productName: "Nitro Electrolyte Fuel",
      productDescription: "Rapid hydration matrix with 1000mg sodium and pink Himalayan rock salt.",
      targetAudience: "Ultra-marathoners and hybrid athletes",
      campaignObjective: "Product Launch",
      tone: "Bold",
      cta: "Dominate The Distance",
      verifiedClaims: "Zero sugar. Batch tested by Informed-Sport.",
    };

    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBrief),
    });

    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = await res.json();
    expect(data).toHaveProperty("id");
    expect(data.productName).toBe("Nitro Electrolyte Fuel");
    expect(data.status).toBe("DRAFT");
  });

  it("5. POST /api/campaigns with invalid payload returns JSON 400 error (NEVER HTML)", async () => {
    const invalidBrief = {
      // missing required productName
      productDescription: "Missing product name",
    };

    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidBrief),
    });

    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain("application/json");

    const rawText = await res.text();
    expect(rawText.startsWith("<!doctype")).toBe(false);
    expect(rawText.includes("<html")).toBe(false);

    const json = JSON.parse(rawText);
    expect(json).toHaveProperty("error");
  });

  it("6. Unknown /api routes return JSON 404 (NEVER index.html or <!doctype)", async () => {
    const routesToTest = [
      { method: "GET", path: "/api/unknown-endpoint" },
      { method: "POST", path: "/api/campaigns/nonexistent-action" },
      { method: "GET", path: "/api" },
      { method: "DELETE", path: "/api/assets/99999/invalid" },
    ];

    for (const route of routesToTest) {
      const res = await fetch(`${baseUrl}${route.path}`, { method: route.method });
      expect(res.status).toBe(404);
      expect(res.headers.get("content-type")).toContain("application/json");

      const raw = await res.text();
      expect(raw.startsWith("<!doctype")).toBe(false);
      expect(raw.includes("<html")).toBe(false);

      const json = JSON.parse(raw);
      expect(json).toHaveProperty("error");
      expect(json.status).toBe(404);
    }
  });

  it("7. CORS preflight OPTIONS /api/campaigns returns 204 with permissive headers", async () => {
    const res = await fetch(`${baseUrl}/api/campaigns`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://ais-pre-3qdmoqj3muz7rjlitxpons-636662863916.asia-southeast1.run.app",
        "Access-Control-Request-Method": "POST",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("8. clientEngine handles campaign creation and full workflow gracefully when server returns HTML", async () => {
    const { clientEngine } = await import("../src/api/clientEngine");
    const formData = new FormData();
    formData.append("productName", "Fallback Hydro");
    formData.append("productDescription", "Offline and static hosting compatible athletic formula.");
    formData.append("targetAudience", "Endurance athletes");
    formData.append("campaignObjective", "Product Launch");
    formData.append("tone", "Bold");
    formData.append("cta", "Order Now");

    const campaign = await clientEngine.createCampaign(formData);
    expect(campaign).toHaveProperty("id");
    expect(campaign.productName).toBe("Fallback Hydro");
    expect(campaign.status).toBe("DRAFT");

    // Test research
    const resRes = await clientEngine.runResearch(campaign.id);
    expect(resRes.campaign.status).toBe("RESEARCH_READY");
    expect(resRes.research.sources.length).toBeGreaterThanOrEqual(3);

    // Test angles
    const angles = await clientEngine.getAngles(campaign.id);
    expect(angles.length).toBe(3);

    // Select angle
    const sel = await clientEngine.selectAngle(campaign.id, angles[0].id);
    expect(sel.campaign.status).toBe("ANGLE_SELECTED");

    // Spec
    const spec = await clientEngine.generateSpec(campaign.id);
    expect(spec.version).toBe(1);

    // Asset generation
    const assetsCamp = await clientEngine.generateAssets(campaign.id);
    expect(assetsCamp.status).toBe("COMPLETED");
    expect(assetsCamp.assets?.length).toBe(3);
  });
});
