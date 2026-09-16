import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { CreativeSpecData } from "../../schemas";
import { GeneratedImageResult, ImageProvider } from "./imageProvider";

export class FixtureImageProvider implements ImageProvider {
  name: "fixture" = "fixture";

  private assetsDir = path.join(process.cwd(), "public", "generated");

  private async ensureDir() {
    await fs.mkdir(this.assetsDir, { recursive: true });
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  async generateSquareAd(
    spec: CreativeSpecData,
    productName: string,
    campaignId: string
  ): Promise<GeneratedImageResult> {
    await this.ensureDir();
    const fileName = `square_${campaignId}_${Date.now()}.png`;
    const outPath = path.join(this.assetsDir, fileName);

    const hookLines = this.wrapText(spec.hook, 24).slice(0, 3);
    const copyLines = this.wrapText(spec.approvedCopy, 38).slice(0, 2);
    const claims = spec.approvedClaims.slice(0, 3);

    const hookSvg = hookLines
      .map(
        (line, idx) =>
          `<text x="90" y="${280 + idx * 64}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="54" fill="#FFFFFF" letter-spacing="-1">${this.escapeXml(
            line
          )}</text>`
      )
      .join("\n");

    const copySvg = copyLines
      .map(
        (line, idx) =>
          `<text x="90" y="${490 + idx * 36}" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="24" fill="#9CA3AF">${this.escapeXml(
            line
          )}</text>`
      )
      .join("\n");

    const claimsSvg = claims
      .map(
        (claim, idx) => `
        <g transform="translate(90, ${580 + idx * 60})">
          <rect width="400" height="44" rx="8" fill="#16161A" stroke="#26262E" stroke-width="1.5" />
          <circle cx="24" cy="22" r="5" fill="#22C55E" />
          <text x="42" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#F3F4F6" letter-spacing="0.5">${this.escapeXml(
            claim.toUpperCase()
          )}</text>
        </g>
      `
      )
      .join("\n");

    const svg = `
    <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#08080A" />
          <stop offset="50%" stop-color="#0F0F13" />
          <stop offset="100%" stop-color="#14141A" />
        </linearGradient>
        <radialGradient id="greenGlow" cx="80%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#22C55E" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#22C55E" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#22C55E" />
          <stop offset="100%" stop-color="#10B981" stop-opacity="0.2" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="1080" height="1080" fill="url(#bg)" />
      <circle cx="850" cy="450" r="450" fill="url(#greenGlow)" />

      <!-- Minimal grid lines -->
      <line x1="90" y1="90" x2="990" y2="90" stroke="#1F1F26" stroke-width="1" />
      <line x1="90" y1="990" x2="990" y2="990" stroke="#1F1F26" stroke-width="1" />

      <!-- BeastLife Top Branding Bar -->
      <g transform="translate(90, 130)">
        <rect width="180" height="34" rx="6" fill="#22C55E" fill-opacity="0.15" stroke="#22C55E" stroke-width="1" />
        <text x="16" y="22" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#22C55E" letter-spacing="1.5">BEASTLIFE // AI</text>
        <text x="210" y="22" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" fill="#6B7280" letter-spacing="1">ATHLETIC CREATIVE LAB</text>
      </g>

      <!-- Hook & Copy -->
      ${hookSvg}
      ${copySvg}
      ${claimsSvg}

      <!-- Stylized Product Hero Silhouette / Render on Right -->
      <g transform="translate(560, 260)">
        <!-- Outer energy rings -->
        <circle cx="230" cy="280" r="220" fill="none" stroke="#22C55E" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="12 8" />
        <circle cx="230" cy="280" r="170" fill="#141419" stroke="#2A2A35" stroke-width="2" />
        
        <!-- Athletic canister shape -->
        <rect x="130" y="110" width="200" height="340" rx="28" fill="#181820" stroke="#22C55E" stroke-width="3" />
        <!-- Lid -->
        <rect x="150" y="70" width="160" height="40" rx="8" fill="#0C0C10" stroke="#3A3A46" stroke-width="2" />
        <line x1="150" y1="90" x2="310" y2="90" stroke="#22C55E" stroke-width="2" />
        
        <!-- Canister Label Artwork -->
        <rect x="145" y="150" width="170" height="230" rx="8" fill="#0E0E12" />
        <text x="230" y="200" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#22C55E" letter-spacing="2">BEASTLIFE</text>
        <line x1="170" y1="215" x2="290" y2="215" stroke="#22C55E" stroke-width="2" />
        <text x="230" y="250" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF" letter-spacing="1">${this.escapeXml(
          productName.slice(0, 16).toUpperCase()
        )}</text>
        <text x="230" y="275" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#9CA3AF">HYPER-OSMOLAR FORMULA</text>
        <text x="230" y="340" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" fill="#22C55E">100% VERIFIED</text>
      </g>

      <!-- Bottom Bar with CTA -->
      <g transform="translate(90, 840)">
        <rect width="900" height="100" rx="16" fill="#121217" stroke="#262633" stroke-width="1.5" />
        <text x="40" y="58" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#E5E7EB">${this.escapeXml(
          spec.productIdentity.slice(0, 42)
        )}</text>
        
        <!-- CTA Button -->
        <g transform="translate(640, 20)">
          <rect width="220" height="60" rx="10" fill="#22C55E" />
          <text x="110" y="37" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#000000" letter-spacing="1">${this.escapeXml(
            spec.cta.toUpperCase()
          )}</text>
        </g>
      </g>
    </svg>
    `;

    await sharp(Buffer.from(svg)).png().toFile(outPath);

    return {
      filePath: `/generated/${fileName}`,
      width: 1080,
      height: 1080,
      format: "PNG",
      provider: "fixture",
    };
  }

  async generateVerticalAd(
    spec: CreativeSpecData,
    productName: string,
    campaignId: string
  ): Promise<GeneratedImageResult> {
    await this.ensureDir();
    const fileName = `vertical_${campaignId}_${Date.now()}.png`;
    const outPath = path.join(this.assetsDir, fileName);

    const hookLines = this.wrapText(spec.hook, 20).slice(0, 4);
    const copyLines = this.wrapText(spec.approvedCopy, 32).slice(0, 3);
    const claims = spec.approvedClaims.slice(0, 4);

    const hookSvg = hookLines
      .map(
        (line, idx) =>
          `<text x="90" y="${380 + idx * 72}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" fill="#FFFFFF" letter-spacing="-1">${this.escapeXml(
            line
          )}</text>`
      )
      .join("\n");

    const copySvg = copyLines
      .map(
        (line, idx) =>
          `<text x="90" y="${680 + idx * 40}" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="26" fill="#9CA3AF">${this.escapeXml(
            line
          )}</text>`
      )
      .join("\n");

    const claimsSvg = claims
      .map(
        (claim, idx) => `
        <g transform="translate(90, ${1280 + idx * 76})">
          <rect width="900" height="56" rx="10" fill="#131318" stroke="#24242F" stroke-width="1.5" />
          <circle cx="36" cy="28" r="6" fill="#22C55E" />
          <text x="64" y="35" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="18" fill="#F3F4F6" letter-spacing="0.5">${this.escapeXml(
            claim.toUpperCase()
          )}</text>
        </g>
      `
      )
      .join("\n");

    const svg = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#08080A" />
          <stop offset="40%" stop-color="#0E0E12" />
          <stop offset="100%" stop-color="#14141A" />
        </linearGradient>
        <radialGradient id="greenGlowV" cx="50%" cy="52%" r="45%">
          <stop offset="0%" stop-color="#22C55E" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#22C55E" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="1080" height="1920" fill="url(#bgV)" />
      <circle cx="540" cy="1000" r="600" fill="url(#greenGlowV)" />

      <!-- Top Story Header -->
      <g transform="translate(90, 160)">
        <rect width="180" height="38" rx="8" fill="#22C55E" fill-opacity="0.15" stroke="#22C55E" stroke-width="1.5" />
        <text x="16" y="24" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="15" fill="#22C55E" letter-spacing="1.5">BEASTLIFE // STORY</text>
        <text x="210" y="24" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="15" fill="#9CA3AF" letter-spacing="1">1080 × 1920 VERTICAL AD</text>
      </g>

      <!-- Hook & Copy -->
      ${hookSvg}
      ${copySvg}

      <!-- Center Vertical Canister Presentation -->
      <g transform="translate(420, 810)">
        <ellipse cx="120" cy="380" rx="160" ry="30" fill="#050508" fill-opacity="0.7" />
        <!-- Canister Body -->
        <rect x="20" y="40" width="200" height="320" rx="26" fill="#14141B" stroke="#22C55E" stroke-width="3.5" />
        <!-- Lid -->
        <rect x="40" y="0" width="160" height="42" rx="8" fill="#0A0A0E" stroke="#32323D" stroke-width="2" />
        <line x1="40" y1="20" x2="200" y2="20" stroke="#22C55E" stroke-width="2" />
        
        <!-- Canister Badge -->
        <rect x="35" y="80" width="170" height="230" rx="8" fill="#0B0B0F" />
        <text x="120" y="130" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#22C55E" letter-spacing="2">BEASTLIFE</text>
        <line x1="60" y1="145" x2="180" y2="145" stroke="#22C55E" stroke-width="2" />
        <text x="120" y="180" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">${this.escapeXml(
          productName.slice(0, 16).toUpperCase()
        )}</text>
        <text x="120" y="208" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="11" fill="#9CA3AF">CLINICAL HYDRATION</text>
        <circle cx="120" cy="255" r="18" fill="#22C55E" fill-opacity="0.2" stroke="#22C55E" stroke-width="1.5" />
        <text x="120" y="261" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="13" fill="#22C55E">✓</text>
      </g>

      <!-- Verified Claims List -->
      ${claimsSvg}

      <!-- Bottom Swipe-Up CTA Bar -->
      <g transform="translate(90, 1680)">
        <rect width="900" height="96" rx="14" fill="#22C55E" />
        <text x="450" y="58" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="#000000" letter-spacing="1.5">${this.escapeXml(
          spec.cta.toUpperCase()
        )}</text>
      </g>
    </svg>
    `;

    await sharp(Buffer.from(svg)).png().toFile(outPath);

    return {
      filePath: `/generated/${fileName}`,
      width: 1080,
      height: 1920,
      format: "PNG",
      provider: "fixture",
    };
  }
}
