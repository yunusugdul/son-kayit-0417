import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Verify the live Render site serves Stage 1 HTML and the exact current Blender GLB.
const base = 'https://son-kayit-0417.onrender.com/';
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
    html = await (await get(base + '?stage1=' + attempt)).text();
    if (!html.includes('SON KAYIT') || !html.includes('AŞAMA 01')) {
      throw new Error('Live HTML is not yet Stage 1.');
    }
    const liveGlb = Buffer.from(await (await get(new URL('content/l01/geometry.glb?stage1=' + attempt, base))).arrayBuffer());
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
if (!latest) throw new Error('Render did not serve this Stage 1 revision: ' + failure);

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
  base, stage: '01', status: 200, modelBytes: expectedGlb.length, modelSha256: expectedHash, assets,
}, null, 2));
console.log('Render serves Stage 1 HTML, exact Blender GLB and JS/CSS:', expectedGlb.length, assets.length);
