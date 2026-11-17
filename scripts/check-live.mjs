import { mkdir, writeFile } from 'node:fs/promises';

// Aşama 0 statik HTTP smoke testi. Canlı sunucu, API veya kullanıcı verisi kullanılmaz.
const base = 'https://son-kayit-0417.onrender.com/';
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response;
}
let html;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    html = await (await get(base)).text();
    if (!html.includes('SON KAYIT')) throw new Error('Oyun başlığı eksik');
    break;
  } catch (err) {
    if (attempt === 2) throw err;
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}
const links = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m => new URL(m[1], base).href);
if (!links.some(x => x.endsWith('.js')) || !links.some(x => x.endsWith('.css'))) {
  throw new Error('Derlenmiş JS/CSS bağlantıları HTML içinde bulunamadı.');
}
const assets = [];
for (const url of links) {
  const response = await get(url);
  assets.push({ url, status: response.status, contentType: response.headers.get('content-type') });
}
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/live-http-smoke.json', JSON.stringify({ base, status: 200, assets }, null, 2));
console.log('Render canlı site HTTP 200; JS/CSS assetleri 200:', assets.length);
