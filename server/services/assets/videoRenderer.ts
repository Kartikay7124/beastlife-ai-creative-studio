import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { execFile } from "child_process";
import { promisify } from "util";
import { CreativeSpecData } from "../../schemas";

const execFileAsync = promisify(execFile);

export interface VideoRenderResult {
  filePath: string;
  width: number;
  height: number;
  duration: number;
  format: "MP4";
  provider: "ffmpeg";
}

export class VideoRenderer {
  private assetsDir = path.join(process.cwd(), "public", "generated");
  private tempDir = path.join(process.cwd(), "storage", "temp");

  private async ensureDirs() {
    await fs.mkdir(this.assetsDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
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

  async render(
    spec: CreativeSpecData,
    productName: string,
    campaignId: string
  ): Promise<VideoRenderResult> {
    await this.ensureDirs();

    const timestamp = Date.now();
    const beat1File = path.join(this.tempDir, `vbeat1_${campaignId}_${timestamp}.png`);
    const beat2File = path.join(this.tempDir, `vbeat2_${campaignId}_${timestamp}.png`);
    const beat3File = path.join(this.tempDir, `vbeat3_${campaignId}_${timestamp}.png`);
    const outputFileName = `video_${campaignId}_${timestamp}.mp4`;
    const outputPath = path.join(this.assetsDir, outputFileName);

    // Beat 1: 0-2s Strong Opening Hook
    const hookLines = this.wrapText(spec.hook, 16).slice(0, 4);
    const hookSvgLines = hookLines
      .map(
        (line, idx) =>
          `<text x="540" y="${880 + idx * 80}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="76" fill="#FFFFFF" letter-spacing="-1">${this.escapeXml(
            line
          )}</text>`
      )
      .join("\n");

    const svgBeat1 = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#22C55E" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#08080A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="#08080A" />
      <circle cx="540" cy="960" r="650" fill="url(#hglow)" />
      
      <!-- Top Beat Indicator -->
      <g transform="translate(90, 160)">
        <rect width="160" height="36" rx="6" fill="#22C55E" />
        <text x="80" y="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="14" fill="#000000" letter-spacing="2">01 // THE HOOK</text>
        <text x="190" y="24" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#6B7280">BEASTLIFE PROTOCOL</text>
      </g>

      <!-- Center Dynamic Graphic & Hook -->
      <g transform="translate(540, 600)">
        <circle cx="0" cy="0" r="140" fill="none" stroke="#22C55E" stroke-width="3" stroke-dasharray="16 8" />
        <circle cx="0" cy="0" r="110" fill="#121218" stroke="#262633" stroke-width="2" />
        <text x="0" y="16" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#22C55E">⚡</text>
      </g>
      ${hookSvgLines}
      <text x="540" y="1380" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22" fill="#22C55E" letter-spacing="2">FOCUS. INTENSITY. RECOVERY.</text>
    </svg>
    `;

    // Beat 2: 2-6s Product / Storytelling
    const claims = spec.approvedClaims.slice(0, 3);
    const claimsBeat2Svg = claims
      .map(
        (c, idx) => `
      <g transform="translate(140, ${1280 + idx * 80})">
        <rect width="800" height="60" rx="10" fill="#121217" stroke="#262633" stroke-width="1.5" />
        <circle cx="36" cy="30" r="6" fill="#22C55E" />
        <text x="64" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#F3F4F6">${this.escapeXml(
          c.toUpperCase()
        )}</text>
      </g>`
      )
      .join("\n");

    const svgBeat2 = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pglow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#22C55E" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#08080A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="#0A0A0E" />
      <circle cx="540" cy="780" r="600" fill="url(#pglow)" />

      <!-- Top Indicator -->
      <g transform="translate(90, 160)">
        <rect width="200" height="36" rx="6" fill="#161620" stroke="#262635" stroke-width="1.5" />
        <text x="100" y="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#22C55E" letter-spacing="1.5">02 // THE FORMULA</text>
      </g>

      <text x="540" y="360" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#FFFFFF">${this.escapeXml(
        productName.toUpperCase()
      )}</text>
      <text x="540" y="415" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="22" fill="#9CA3AF">${this.escapeXml(
        spec.productIdentity.slice(0, 48)
      )}</text>

      <!-- Center Product Artwork -->
      <g transform="translate(420, 520)">
        <rect x="20" y="40" width="200" height="340" rx="26" fill="#14141B" stroke="#22C55E" stroke-width="3" />
        <rect x="40" y="0" width="160" height="42" rx="8" fill="#0A0A0E" stroke="#32323D" stroke-width="2" />
        <rect x="35" y="80" width="170" height="250" rx="8" fill="#0B0B0F" />
        <text x="120" y="140" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#22C55E" letter-spacing="2">BEASTLIFE</text>
        <line x1="60" y1="155" x2="180" y2="155" stroke="#22C55E" stroke-width="2" />
        <text x="120" y="195" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="15" fill="#FFFFFF">${this.escapeXml(
          productName.slice(0, 16).toUpperCase()
        )}</text>
        <text x="120" y="225" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="12" fill="#9CA3AF">CLINICAL PRECISION</text>
        <rect x="50" y="270" width="140" height="32" rx="6" fill="#22C55E" fill-opacity="0.2" stroke="#22C55E" stroke-width="1" />
        <text x="120" y="291" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" fill="#22C55E">BATCH TESTED</text>
      </g>

      ${claimsBeat2Svg}

      <text x="540" y="1600" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="20" fill="#9CA3AF">${this.escapeXml(
        spec.approvedCopy.slice(0, 60)
      )}</text>
    </svg>
    `;

    // Beat 3: 6-8s Brand Ending & CTA
    const svgBeat3 = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cglow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="#22C55E" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#08080A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1080" height="1920" fill="#08080A" />
      <circle cx="540" cy="960" r="700" fill="url(#cglow)" />

      <!-- Top Indicator -->
      <g transform="translate(90, 160)">
        <rect width="200" height="36" rx="6" fill="#22C55E" />
        <text x="100" y="24" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="14" fill="#000000" letter-spacing="1.5">03 // GO BEAST MODE</text>
      </g>

      <g transform="translate(540, 700)">
        <!-- Emblem -->
        <rect x="-90" y="-90" width="180" height="180" rx="36" fill="#14141C" stroke="#22C55E" stroke-width="3" />
        <text x="0" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" fill="#22C55E">⚡</text>
      </g>

      <text x="540" y="960" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="60" fill="#FFFFFF" letter-spacing="2">BEASTLIFE</text>
      <text x="540" y="1020" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="24" fill="#22C55E" letter-spacing="4">UNLEASH THE ATHLETE</text>

      <!-- Bottom High-Impact CTA Button -->
      <g transform="translate(140, 1400)">
        <rect width="800" height="100" rx="18" fill="#22C55E" />
        <text x="400" y="62" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#000000" letter-spacing="2">${this.escapeXml(
          spec.cta.toUpperCase()
        )}</text>
      </g>
      <text x="540" y="1560" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="18" fill="#6B7280" letter-spacing="1.5">OFFICIAL BEASTLIFE CREATIVE ASSET</text>
    </svg>
    `;

    // Render 3 frame slates with Sharp
    await sharp(Buffer.from(svgBeat1)).png().toFile(beat1File);
    await sharp(Buffer.from(svgBeat2)).png().toFile(beat2File);
    await sharp(Buffer.from(svgBeat3)).png().toFile(beat3File);

    // Stitch into 8-second 1080x1920 MP4 via FFmpeg
    // Beat 1: 2 seconds (0-2s)
    // Beat 2: 4 seconds (2-6s)
    // Beat 3: 2 seconds (6-8s)
    // Total = exactly 8.00 seconds!
    const ffmpegArgs = [
      "-y",
      "-loop", "1", "-t", "2", "-i", beat1File,
      "-loop", "1", "-t", "4", "-i", beat2File,
      "-loop", "1", "-t", "2", "-i", beat3File,
      "-f", "lavfi", "-t", "8", "-i", "anullsrc=r=44100:cl=stereo",
      "-filter_complex",
      "[0:v]fade=t=out:st=1.75:d=0.25[v0];[1:v]fade=t=in:st=0:d=0.25,fade=t=out:st=3.75:d=0.25[v1];[2:v]fade=t=in:st=0:d=0.25[v2];[v0][v1][v2]concat=n=3:v=1:a=0[v]",
      "-map", "[v]",
      "-map", "3:a",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-r", "30",
      "-c:a", "aac",
      "-shortest",
      outputPath,
    ];

    await execFileAsync("/usr/bin/ffmpeg", ffmpegArgs);

    // Clean up temporary PNGs
    await Promise.all([
      fs.unlink(beat1File).catch(() => {}),
      fs.unlink(beat2File).catch(() => {}),
      fs.unlink(beat3File).catch(() => {}),
    ]);

    return {
      filePath: `/generated/${outputFileName}`,
      width: 1080,
      height: 1920,
      duration: 8.0,
      format: "MP4",
      provider: "ffmpeg",
    };
  }
}
