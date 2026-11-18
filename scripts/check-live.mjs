import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Verify the Stage 4 Render preview serves the live HTML, GLB and asset bundles.
const base = (process.env.GAME_LIVE_URL ?? 'https://son-kayit-0417-asama4.onrender.com/').replace(/\/?$/, '/');
const expectedStage = process.env.GAME_STAGE ?? 'AŞAMA 04';
const expectedGlb = await readFile('public/content/l01/geometry.glb');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedHash = hash(expectedGlb);

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'follow', headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response;
}
let html = '';
let latest = false;
let failure = '';
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    html = await (await get(base + '?stage4=' + attempt)).text();
    if (!html.includes('SON KAYIT') || !html.includes(expectedStage)) {
      throw new Error('Live HTML is not yet ' + expectedStage);
    }
    const liveGlb = Buffer.from(await (await get(new URL('content/l01/geometry.glb?stage4=' + attempt, base))).arrayBuffer());
    if (hash(liveGlb) !== expectedHash) {
      throw new Error(`Live GLB checksum mismatch (expected ${expectedGlb.length}, got ${liveGlb.length} bytes)`);
    }
    latest = true;
    break;
  } catch (err) {
    failure = String(err);
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 3_000));
  }
}
if (!latest) throw new Error('Render did not serve ' + expectedStage + ': ' + failure);

const links = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m => new URL(m[1], base).href);
if (!links.some(x => x.endsWith('.js')) || !links.some(x => x.endsWith('.css'))) {
  throw new Error('Bundled JS/CSS references not found in live HTML.');
}
const assets = [];
for (const url of links) {
  const response = await get(url);
  assets.push({ url, status: response.status, contentType: response.headers.get('content-type') });
}
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/live-http-smoke.json', JSON.stringify({
  base, stage: expectedStage, status: 200, modelBytes: expectedGlb.length, modelSha256: expectedHash, assets,
}, null, 2));
console.log('Render serves Stage 4 HTML, exact navigation GLB and JS/CSS:', expectedGlb.length, assets.length);
