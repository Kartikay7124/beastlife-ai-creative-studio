import { CreativeSpecData } from "../../schemas";
import { GeneratedImageResult, ImageProvider } from "./imageProvider";
import { FixtureImageProvider } from "./fixtureImageProvider";
import { geminiProvider } from "../gemini/geminiProvider";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

export class GeminiImageProvider implements ImageProvider {
  name: "gemini" = "gemini";
  private fixtureFallback = new FixtureImageProvider();
  private assetsDir = path.join(process.cwd(), "public", "generated");

  async generateSquareAd(
    spec: CreativeSpecData,
    productName: string,
    campaignId: string,
    userImage?: string | null
  ): Promise<GeneratedImageResult> {
    if (!geminiProvider.isConfigured()) {
      return this.fixtureFallback.generateSquareAd(spec, productName, campaignId);
    }

    try {
      const ai = geminiProvider.getClient();

      const prompt = `A hyper-realistic commercial ad photography for ${productName}.
Visual direction: ${spec.scene}.
Style: ${spec.visualTreatment}.
Palette: ${spec.palette.join(", ")}.
Ultra-clean athletic studio setup, dark graphite obsidian background with vivid emerald green rim lighting.`;

      const res = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        },
      });

      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          await fs.mkdir(this.assetsDir, { recursive: true });
          const rawBuffer = Buffer.from(part.inlineData.data, "base64");
          const fileName = `square_gemini_${campaignId}_${Date.now()}.png`;
          const outPath = path.join(this.assetsDir, fileName);

          // Overlay readable typography onto generated image
          const overlaySvg = `
          <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="860" width="1080" height="220" fill="black" fill-opacity="0.75" />
            <text x="80" y="930" font-family="sans-serif" font-weight="900" font-size="44" fill="#FFFFFF">${spec.hook.slice(0, 36)}</text>
            <rect x="800" y="890" width="200" height="56" rx="8" fill="#22C55E" />
            <text x="900" y="926" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="18" fill="#000000">${spec.cta}</text>
          </svg>`;

          await sharp(rawBuffer)
            .resize(1080, 1080)
            .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
            .png()
            .toFile(outPath);

          return {
            filePath: `/generated/${fileName}`,
            width: 1080,
            height: 1080,
            format: "PNG",
            provider: "gemini",
          };
        }
      }
      throw new Error("No image data in Gemini response");
    } catch (err: any) {
      console.warn("[GeminiImageProvider] Square ad generation failed:", err?.message || err);
      // Clean fallback to fixture mode
      return this.fixtureFallback.generateSquareAd(spec, productName, campaignId);
    }
  }

  async generateVerticalAd(
    spec: CreativeSpecData,
    productName: string,
    campaignId: string,
    userImage?: string | null
  ): Promise<GeneratedImageResult> {
    if (!geminiProvider.isConfigured()) {
      return this.fixtureFallback.generateVerticalAd(spec, productName, campaignId);
    }

    try {
      const ai = geminiProvider.getClient();

      const prompt = `Vertical 9:16 mobile story advertisement photography for ${productName}.
Scene: ${spec.scene}.
Composition: ${spec.composition}.
Palette: ${spec.palette.join(", ")}.
Dark athletic luxury aesthetic, vibrant green backlight, crisp focus.`;

      const res = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16",
            imageSize: "1K",
          },
        },
      });

      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          await fs.mkdir(this.assetsDir, { recursive: true });
          const rawBuffer = Buffer.from(part.inlineData.data, "base64");
          const fileName = `vertical_gemini_${campaignId}_${Date.now()}.png`;
          const outPath = path.join(this.assetsDir, fileName);

          const overlaySvg = `
          <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="1600" width="1080" height="320" fill="black" fill-opacity="0.8" />
            <text x="90" y="1680" font-family="sans-serif" font-weight="900" font-size="52" fill="#FFFFFF">${spec.hook.slice(0, 32)}</text>
            <rect x="90" y="1740" width="900" height="80" rx="12" fill="#22C55E" />
            <text x="540" y="1790" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="24" fill="#000000">${spec.cta}</text>
          </svg>`;

          await sharp(rawBuffer)
            .resize(1080, 1920)
            .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
            .png()
            .toFile(outPath);

          return {
            filePath: `/generated/${fileName}`,
            width: 1080,
            height: 1920,
            format: "PNG",
            provider: "gemini",
          };
        }
      }
      throw new Error("No image data in Gemini response");
    } catch (err: any) {
      console.warn("[GeminiImageProvider] Vertical ad generation failed:", err?.message || err);
      return this.fixtureFallback.generateVerticalAd(spec, productName, campaignId);
    }
  }
}

