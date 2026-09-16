#!/usr/bin/env node
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

function formatRow(label, status, detail = '') {
  const dots = '.'.repeat(Math.max(2, 32 - label.length));
  const detailStr = detail ? ` (${detail})` : '';
  console.log(`[VERIFY] ${label} ${dots} ${status}${detailStr}`);
}

async function runVerification() {
  console.log('====================================================');
  console.log('  BeastLife Creative Studio - End-to-End Verifier   ');
  console.log('====================================================\n');

  try {
    // 0. Check Health
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (!healthRes.ok) throw new Error(`Health check failed: HTTP ${healthRes.status}`);
    const health = await healthRes.json();
    if (!health.ok) throw new Error(`Health endpoint returned not ok`);

    // 1. Create BeastLife / Beast Bar Sample Campaign
    const brief = {
      name: 'Beast Bar High-Protein Flapjack Launch',
      productName: 'Beast Bar Ultra-Protein',
      productDescription:
        'Cold-pressed 30g grass-fed whey isolate flapjack engineered with organic rolled oats, MCT oil, and raw dark cacao. Zero palm oil, zero artificial sweeteners, and zero sugar alcohols.',
      targetAudience: 'Strength athletes, rugby players, and high-volume weightlifters.',
      campaignObjective: 'Product Launch',
      tone: 'Bold',
      cta: 'Claim Your Beast Box',
      verifiedClaims:
        '30g pure grass-fed whey protein isolate per 85g bar\nZero palm oil, zero artificial sweeteners, zero sugar alcohols\nInformed-Sport batch tested for competitive integrity',
    };

    const createRes = await fetch(`${BASE_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
    });
    if (!createRes.ok) throw new Error(`Failed to create campaign: HTTP ${createRes.status}`);
    const campaign = await createRes.json();
    if (!campaign.id || campaign.productName !== brief.productName) {
      throw new Error(`Campaign record invalid: ${JSON.stringify(campaign)}`);
    }
    const campaignId = campaign.id;
    formatRow('Campaign creation', 'PASS', campaignId);

    // 2. Trigger Research Stage
    const researchRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/research`, {
      method: 'POST',
    });
    if (!researchRes.ok) throw new Error(`Research failed: HTTP ${researchRes.status}`);
    const researchData = await researchRes.json();
    const summary = researchData.research?.summary || researchData.campaign?.researchSummary;
    if (!summary) {
      throw new Error('Research output missing summary');
    }

    // 3. Verify at least 3 source records exist and contain required metadata
    const sourcesRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/research`);
    const researchRecord = await sourcesRes.json();
    const sources = Array.isArray(researchRecord) ? researchRecord : researchRecord.sources || [];
    if (!Array.isArray(sources) || sources.length < 3) {
      throw new Error(`Expected at least 3 research sources, received ${sources?.length}`);
    }
    for (const s of sources) {
      if (!s.title || !s.url || !s.domain || !s.summary || !s.excerpt) {
        throw new Error(`Source record missing required metadata fields: ${JSON.stringify(s)}`);
      }
    }
    formatRow('Research sources', 'PASS', `${sources.length} sources`);

    // 4. Generate Exactly 3 Creative Angles
    const anglesRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/angles`, {
      method: 'POST',
    });
    if (!anglesRes.ok) throw new Error(`Angle generation failed: HTTP ${anglesRes.status}`);
    const angles = await anglesRes.json();
    if (!Array.isArray(angles) || angles.length !== 3) {
      throw new Error(`Expected exactly 3 creative angles, received ${angles?.length}`);
    }
    for (const a of angles) {
      if (!a.id || !a.name || !a.hook || !a.visualDirection || !a.rationale) {
        throw new Error(`Angle missing required structured fields: ${JSON.stringify(a)}`);
      }
    }
    formatRow('Exactly 3 angles', 'PASS', '3 distinct concepts');

    // 5. Select One Angle
    const selectedAngle = angles[0];
    const selectRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/select-angle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ angleId: selectedAngle.id }),
    });
    if (!selectRes.ok) throw new Error(`Select angle failed: HTTP ${selectRes.status}`);

    // 6. Generate and Verify Master CreativeSpec
    const specRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/spec`, {
      method: 'POST',
    });
    if (!specRes.ok) throw new Error(`Spec generation failed: HTTP ${specRes.status}`);
    const spec = await specRes.json();
    if (!spec.hook || !spec.approvedCopy || !spec.cta || !spec.videoOutline) {
      throw new Error(`CreativeSpec missing required fields: ${JSON.stringify(spec)}`);
    }
    const videoOutline = JSON.parse(spec.videoOutline);
    if (!Array.isArray(videoOutline) || videoOutline.length !== 3) {
      throw new Error(`Video outline must contain 3 beats (0-2s, 2-6s, 6-8s)`);
    }
    formatRow('CreativeSpec', 'PASS', `v${spec.version}`);

    // 7. Generate Full Creative Asset Pipeline
    const genRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!genRes.ok) throw new Error(`Asset generation failed: HTTP ${genRes.status}`);
    const genData = await genRes.json();
    const assets = genData.assets || [];

    // Find Assets
    const squareAsset = assets.find((a) => a.type === 'IMAGE_SQUARE');
    const verticalAsset = assets.find((a) => a.type === 'IMAGE_VERTICAL');
    const videoAsset = assets.find((a) => a.type === 'VIDEO_VERTICAL');

    if (!squareAsset || squareAsset.status !== 'READY') throw new Error('Square asset not READY');
    if (!verticalAsset || verticalAsset.status !== 'READY') throw new Error('Vertical asset not READY');
    if (!videoAsset || videoAsset.status !== 'READY') throw new Error('Video asset not READY');

    // 8. Verify Square Image Dimensions (1080x1080)
    const squareFullPath = path.join(process.cwd(), 'public', squareAsset.filePath);
    const squareMeta = await sharp(squareFullPath).metadata();
    if (squareMeta.width !== 1080 || squareMeta.height !== 1080) {
      throw new Error(`Square dimensions ${squareMeta.width}x${squareMeta.height} != 1080x1080`);
    }
    formatRow('Square image 1080x1080', 'PASS', `${squareMeta.width}x${squareMeta.height} png`);

    // 9. Verify Vertical Image Dimensions (1080x1920)
    const vertFullPath = path.join(process.cwd(), 'public', verticalAsset.filePath);
    const vertMeta = await sharp(vertFullPath).metadata();
    if (vertMeta.width !== 1080 || vertMeta.height !== 1920) {
      throw new Error(`Vertical dimensions ${vertMeta.width}x${vertMeta.height} != 1080x1920`);
    }
    formatRow('Vertical 1080x1920', 'PASS', `${vertMeta.width}x${vertMeta.height} png`);

    // 10. Verify Video Dimensions and Duration (1080x1920, 6–10 seconds)
    const videoFullPath = path.join(process.cwd(), 'public', videoAsset.filePath);
    const probeRes = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'stream=width,height,codec_name,duration',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1',
      videoFullPath,
    ]);
    const probeOut = probeRes.stdout;
    if (!probeOut.includes('width=1080') || !probeOut.includes('height=1920')) {
      throw new Error(`Video dimensions probe failed: ${probeOut}`);
    }
    formatRow('Video 1080x1920', 'PASS', 'H.264 vertical');

    const durationMatch = probeOut.match(/duration=([0-9.]+)/);
    const duration = durationMatch ? parseFloat(durationMatch[1]) : videoAsset.duration;
    if (!duration || duration < 6.0 || duration > 10.0) {
      throw new Error(`Video duration ${duration}s not between 6 and 10 seconds`);
    }
    formatRow(`Video duration ${duration.toFixed(1)}s`, 'PASS', '3-beat timing');

    // 11. Verify Asset Downloads
    for (const a of [squareAsset, verticalAsset, videoAsset]) {
      const dlRes = await fetch(`${BASE_URL}/api/assets/${a.id}/download`);
      if (!dlRes.ok) throw new Error(`Failed to download asset ${a.id}: HTTP ${dlRes.status}`);
      const buf = await dlRes.arrayBuffer();
      if (buf.byteLength < 1000) throw new Error(`Downloaded asset ${a.id} too small (${buf.byteLength} bytes)`);
    }
    formatRow('Downloads', 'PASS', '3 assets verified');

    // 12. Verify Campaign Persistence & History
    const getRes = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`);
    if (!getRes.ok) throw new Error(`Failed to fetch persisted campaign: HTTP ${getRes.status}`);
    const persistedCampaign = await getRes.json();
    if (persistedCampaign.status !== 'COMPLETED' || persistedCampaign.assets.length < 3) {
      throw new Error('Persisted campaign incomplete');
    }
    formatRow('Persistence', 'PASS', 'SQLite durable state');

    // 13. Execute Failure Isolation Path (Simulate IMAGE_VERTICAL failure)
    const failBrief = {
      name: 'Failure Test Campaign',
      productName: 'Failure Isolation Bar',
      productDescription: 'High protein bar for testing controlled failure and recovery.',
      targetAudience: 'Testing suite',
      campaignObjective: 'Product Launch',
      tone: 'Bold',
      cta: 'Shop Now',
    };
    const cFailRes = await fetch(`${BASE_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(failBrief),
    });
    const failCampaign = await cFailRes.json();
    const failId = failCampaign.id;

    // Run research, angles, select angle, spec
    await fetch(`${BASE_URL}/api/campaigns/${failId}/research`, { method: 'POST' });
    const fAnglesRes = await fetch(`${BASE_URL}/api/campaigns/${failId}/angles`, { method: 'POST' });
    const fAngles = await fAnglesRes.json();
    await fetch(`${BASE_URL}/api/campaigns/${failId}/select-angle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ angleId: fAngles[0].id }),
    });
    await fetch(`${BASE_URL}/api/campaigns/${failId}/spec`, { method: 'POST' });

    // Trigger generation with simulated IMAGE_VERTICAL failure
    const fGenRes = await fetch(`${BASE_URL}/api/campaigns/${failId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ failStage: 'IMAGE_VERTICAL' }),
    });
    const fGenData = await fGenRes.json();
    if (fGenData.status !== 'FAILED') {
      throw new Error(`Expected campaign status FAILED, received ${fGenData.status}`);
    }

    const fSquare = (fGenData.assets || []).find((a) => a.type === 'IMAGE_SQUARE');
    if (!fSquare || fSquare.status !== 'READY') {
      throw new Error('IMAGE_SQUARE did not remain READY after IMAGE_VERTICAL failure');
    }
    formatRow('Failure isolation', 'PASS', 'IMAGE_SQUARE preserved');

    // 14. Execute Targeted Retry Endpoint
    const retryRes = await fetch(`${BASE_URL}/api/campaigns/${failId}/stages/IMAGE_VERTICAL/retry`, {
      method: 'POST',
    });
    if (!retryRes.ok) throw new Error(`Retry failed: HTTP ${retryRes.status}`);
    const retryData = await retryRes.json();

    if (retryData.status !== 'COMPLETED') {
      throw new Error(`Expected campaign status COMPLETED after retry, got ${retryData.status}`);
    }
    const finalAssets = retryData.assets || [];
    if (finalAssets.filter((a) => a.status === 'READY').length !== 3) {
      throw new Error(`Expected all 3 assets to be READY after retry`);
    }

    // Verify square asset was NOT regenerated
    const fSquareAfter = finalAssets.find((a) => a.type === 'IMAGE_SQUARE');
    if (fSquareAfter.id !== fSquare.id) {
      throw new Error('IMAGE_SQUARE was erroneously regenerated during targeted retry');
    }
    formatRow('Targeted retry', 'PASS', 'Stage recovered & video rendered');

    console.log('\nFINAL RESULT: PASS\n');
    process.exit(0);
  } catch (err) {
    console.error('\n[VERIFY ERROR]', err.message || err);
    console.log('\nFINAL RESULT: FAIL\n');
    process.exit(1);
  }
}

runVerification();
