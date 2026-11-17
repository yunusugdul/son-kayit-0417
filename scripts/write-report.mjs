import { readFile, writeFile } from 'node:fs/promises';
const bytes = (amount) => `${(amount / 1024).toFixed(1)} KiB`;
const sizes = JSON.parse(await readFile('artifacts/size-report.json', 'utf8'));
const metrics = JSON.parse(await readFile('artifacts/browser-metrics.json', 'utf8'));
const date = new Date().toISOString().slice(0, 10);
const report = `# Aşama 0 — otomatik ölçüm raporu\n\n` +
  `**Çalıştırma:** ${date}, GitHub Actions / Linux / headless Chromium (SwiftShader)\n\n` +
  `| Ölçüm | Sonuç | Not |\n|---|---:|---|\n` +
  `| Üretim çıktısı (ham) | ${bytes(sizes.rawBytes)} | Vite dist/ |\n` +
  `| Üretim çıktısı (tahmini gzip) | ${bytes(sizes.gzipBytes)} | Dosya dosya gzip, gerçek CDN transferi değil |\n` +
  `| Local preview yanıt gövdeleri | ${bytes(metrics.servedBodyBytes)} | Headless tarayıcı, sıkıştırılmamış |\n` +
  `| FPS örneği | ${metrics.fpsSample} | Gerçek cihaz / GPU performansı olarak yorumlanamaz |\n` +
  `| Draw call | ${metrics.drawCalls} | renderer.info.render.calls |\n` +
  `| Ekran | ${metrics.viewport.join(' × ')} | Masaüstü örnek, mobil 390 × 844 |\n\n` +
  `**Ekran görüntüleri:** GitHub Actions çalışma artifact'ında ` +
  '`stage0-evidence/stage0-desktop.png` ve `stage0-evidence/stage0-mobile.png`.\n\n' +
  `**Sınır:** Bu rapor tarayıcı otomasyonunun teknik kanıtıdır. Gerçek Chrome/Firefox/Safari, Android/iPhone, ağ 4G ve mobil FPS testi ayrıca yapılmalıdır.\n`;
await writeFile('docs/stage0-measurements.md', report);
console.log(report);
