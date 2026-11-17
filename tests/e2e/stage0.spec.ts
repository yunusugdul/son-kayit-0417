import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

type Debug = {
  position(): [number, number, number];
  paused(): boolean;
  drawCalls(): number;
  fps(): number;
  targetActive(): boolean;
  viewport(): [number, number];
};

declare global {
  interface Window { __stage0?: Debug; }
}

const coordinate = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.__stage0?.position() ?? null);

const prepare = async (page: import('@playwright/test').Page) => {
  await page.goto('/?debug=1');
  await expect(page.locator('#fallback')).toBeHidden();
  await expect(page.locator('#game-view canvas')).toBeVisible();
  await page.waitForFunction(() => (window.__stage0?.drawCalls() ?? 0) > 0);
};

test('gerçek 3D sahne, WASD, ok tuşu, pointer, resize ve debug çalışır', async ({ page }) => {
  const transfers: Array<{ name: string; bytes: number }> = [];
  page.on('response', async (response) => {
    try {
      if (response.url().startsWith('http://127.0.0.1:4173/')) {
        const bytes = (await response.body()).byteLength;
        transfers.push({ name: new URL(response.url()).pathname, bytes });
      }
    } catch { /* redirect/empty body: ölçüm dışında */ }
  });

  await prepare(page);
  await expect(page.locator('#debug-panel')).toContainText('Draw calls:');
  const start = await coordinate(page);
  expect(start).not.toBeNull();

  await page.keyboard.down('w');
  await page.waitForTimeout(280);
  await page.keyboard.up('w');
  const afterW = await coordinate(page);
  expect(Math.hypot((afterW![0] - start![0]), (afterW![2] - start![2]))).toBeGreaterThan(0.25);

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  const afterArrow = await coordinate(page);
  expect(Math.hypot(afterArrow![0] - afterW![0], afterArrow![2] - afterW![2])).toBeGreaterThan(0.20);

  const canvas = page.locator('#game-view canvas');
  const rect = await canvas.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.click(rect!.x + rect!.width * 0.67, rect!.y + rect!.height * 0.57);
  await page.waitForTimeout(200);
  const afterClick = await coordinate(page);
  expect(Math.hypot(afterClick![0] - afterArrow![0], afterClick![2] - afterArrow![2])).toBeGreaterThan(0.1);

  await page.setViewportSize({ width: 1080, height: 720 });
  await page.waitForTimeout(150);
  const viewport = await page.evaluate(() => window.__stage0?.viewport());
  expect(viewport?.[0]).toBeGreaterThanOrEqual(1080);
  expect(viewport?.[1]).toBeGreaterThanOrEqual(720);
  expect(viewport?.[0]).toBeLessThanOrEqual(1080 * 1.5 + 1);

  await page.waitForTimeout(700);
  const fps = await page.evaluate(() => window.__stage0?.fps() ?? 0);
  const drawCalls = await page.evaluate(() => window.__stage0?.drawCalls() ?? 0);
  expect(drawCalls).toBeGreaterThan(0);
  expect(fps).toBeGreaterThan(0);

  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/stage0-desktop.png', fullPage: true });
  await writeFile('artifacts/browser-metrics.json', JSON.stringify({
    environment: 'GitHub Actions headless Chrome, software WebGL (not physical-device FPS)',
    viewport: [1080, 720], fpsSample: fps, drawCalls,
    servedBodyBytes: transfers.reduce((sum, request) => sum + request.bytes, 0),
    requests: transfers,
  }, null, 2));
});

test('arka plan görünürlüğünde oyun durur ve yeniden başlar', async ({ page }) => {
  await prepare(page);
  await page.keyboard.down('KeyW');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const stationary = await coordinate(page);
  await page.waitForTimeout(330);
  expect(await coordinate(page)).toEqual(stationary);
  expect(await page.evaluate(() => window.__stage0?.paused())).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => window.__stage0?.paused())).toBe(false);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(130);
  const afterResume = await coordinate(page);
  expect(Math.hypot(afterResume![0] - stationary![0], afterResume![2] - stationary![2])).toBeLessThan(0.25);
});

test('WebGL2 yokken anlaşılır hata ekranı görülür', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof getContext>) {
      if (args[0] === 'webgl2') return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(page.locator('#fallback')).toBeVisible();
  await expect(page.locator('#fallback')).toContainText('WebGL2');
  await expect(page.locator('#game-view canvas')).toHaveCount(0);
});

test('dar mobil görünüm ve dokunma hedefi çalışır', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const start = await coordinate(page);
  const canvas = page.locator('#game-view canvas');
  const bounds = await canvas.boundingBox();
  await page.mouse.click(bounds!.x + bounds!.width * 0.63, bounds!.y + bounds!.height * 0.52);
  await page.waitForTimeout(260);
  const end = await coordinate(page);
  expect(Math.hypot(end![0] - start![0], end![2] - start![2])).toBeGreaterThan(0.1);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/stage0-mobile.png', fullPage: true });
});
