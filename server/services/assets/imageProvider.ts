import { CreativeSpecData } from "../../schemas";

export interface GeneratedImageResult {
  filePath: string;
  width: number;
  height: number;
  format: "PNG";
  provider: "fixture" | "gemini";
}

export interface ImageProvider {
  name: "fixture" | "gemini";
  generateSquareAd(
    spec: CreativeSpecData,
    productName: string,
    campaignId: string,
    userImage?: string | null
  ): Promise<GeneratedImageResult>;
  generateVerticalAd(
    spec: CreativeSpecData,
    productName: string,
    campaignId: string,
    userImage?: string | null
  ): Promise<GeneratedImageResult>;
}
