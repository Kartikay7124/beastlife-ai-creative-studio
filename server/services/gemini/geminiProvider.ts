import { GoogleGenAI } from "@google/genai";

export interface GeminiRequestOptions {
  model?: string;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}

export class GeminiProvider {
  private ai: GoogleGenAI | null = null;
  private readonly defaultTextModel = "gemini-3.8-flash";
  private readonly defaultImageModel = "gemini-3.1-flash-image";

  /**
   * Initializes the GoogleGenAI client lazily and securely on the server.
   * Never exposes GEMINI_API_KEY to frontend code.
   */
  public getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is missing or not configured.");
    }

    if (!this.ai) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }

    return this.ai;
  }

  /**
   * Checks if Gemini is configured and available.
   */
  public isConfigured(): boolean {
    const apiKey = process.env.GEMINI_API_KEY;
    return Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 0);
  }

  /**
   * Safely extracts and cleans JSON from a Gemini text response.
   * Defends against markdown codeblock wrappers and HTML error documents.
   */
  public parseJsonResponse<T>(rawText: string | undefined | null, contextDescription = "Gemini response"): T {
    if (!rawText || typeof rawText !== "string") {
      throw new Error(`Empty or non-string response received from Gemini for ${contextDescription}.`);
    }

    const trimmed = rawText.trim();

    // Check if the response accidentally returned an HTML document (e.g. error page or proxy fallback)
    if (trimmed.toLowerCase().startsWith("<!doctype") || trimmed.toLowerCase().startsWith("<html")) {
      throw new Error(
        `Gemini integration received an HTML page instead of JSON (${trimmed.slice(0, 120)}...). Check endpoint and network configuration.`
      );
    }

    // Strip markdown code fences if present (```json ... ``` or ``` ...)
    let cleaned = trimmed;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch (parseError: any) {
      throw new Error(
        `Failed to parse ${contextDescription} as JSON: ${parseError.message}. Preview: ${trimmed.slice(0, 200)}`
      );
    }
  }

  /**
   * Generates structured text/JSON from Gemini using the official SDK.
   * Includes automated exponential backoff and fallback models to gracefully handle
   * upstream 503 ("This model is currently experiencing high demand") and 429 rate limit spikes.
   */
  public async generateContent(prompt: string, options: GeminiRequestOptions = {}): Promise<string> {
    const client = this.getClient();
    const primaryModel = options.model || this.defaultTextModel;

    // Ordered list of candidate models in case of transient capacity / 503 unavailability
    const candidateModels = [
      primaryModel,
      ...(primaryModel !== "gemini-3.1-flash-lite" ? ["gemini-3.1-flash-lite"] : []),
      ...(primaryModel !== "gemini-2.5-flash" ? ["gemini-2.5-flash"] : []),
    ];

    let lastError: any;

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const model = candidateModels[mIdx];
      const maxAttempts = mIdx === 0 ? 3 : 2; // Up to 3 attempts on primary, 2 on fallbacks

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const response = await client.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: options.systemInstruction,
              responseMimeType: options.responseMimeType,
              temperature: options.temperature,
            },
          });

          const text = response.text?.trim();
          if (!text) {
            throw new Error(`Gemini model '${model}' returned an empty response.`);
          }

          if (mIdx > 0 || attempt > 1) {
            console.log(`[GeminiProvider] Succeeded with model '${model}' (attempt ${attempt})`);
          }

          return text;
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          const isTransient =
            msg.includes("503") ||
            msg.includes("UNAVAILABLE") ||
            msg.includes("high demand") ||
            msg.includes("429") ||
            msg.includes("RESOURCE_EXHAUSTED");

          console.warn(
            `[GeminiProvider] Attempt ${attempt}/${maxAttempts} with model '${model}' failed: ${msg.slice(0, 140)}`
          );

          if (!isTransient) {
            // Not a capacity or rate issue, try next candidate model or rethrow
            break;
          }

          if (attempt < maxAttempts) {
            // Exponential backoff with small jitter: 600ms, 1400ms
            const delay = 600 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    throw lastError || new Error("Gemini generation failed across all available models.");
  }

  /**
   * Direct REST-based call with strict defensive checking.
   * Used for diagnostic endpoint verification and strict Content-Type inspection.
   */
  public async generateContentRest(
    prompt: string,
    model = this.defaultTextModel
  ): Promise<{ text: string; status: number; contentType: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    // Official Google Gemini REST endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "aistudio-build",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    const rawBody = await response.text();

    if (!response.ok) {
      if (rawBody.toLowerCase().includes("<!doctype") || rawBody.toLowerCase().includes("<html")) {
        throw new Error(
          `Gemini API HTTP ${response.status} returned an HTML document instead of JSON: ${rawBody.slice(0, 300)}`
        );
      }
      throw new Error(
        `Gemini API request failed with status ${response.status}: ${rawBody.slice(0, 500)}`
      );
    }

    if (!contentType.includes("application/json")) {
      throw new Error(
        `Gemini API returned unexpected Content-Type '${contentType}' instead of application/json. Body: ${rawBody.slice(0, 300)}`
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch (err: any) {
      throw new Error(`Gemini REST response could not be parsed as JSON: ${err.message}. Raw: ${rawBody.slice(0, 200)}`);
    }

    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text, status: response.status, contentType };
  }
}

export const geminiProvider = new GeminiProvider();
