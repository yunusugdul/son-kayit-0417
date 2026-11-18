import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

declare global {
  interface Window {
    __stage4?: {
      artQuality(): 'auto' | 'high' | 'low';
      triangles(): number;
      drawCalls(): number;
      gpuMemory(): [number, number];
      viewport(): [number, number];
      cassette(): string;
    };
  }
}
async function ready(page: Page) {
  await page.goto('/?debug=1');
  await expect(page.locator('#game-view canvas')).toBeVisible();
  await page.waitForFunction(() => !!window.__stage4);
  await page.waitForFunction(() => window.__stage4!.drawCalls() > 0);
}
test('L01 art renders with low-poly budget; desktop and mobile screenshots', async ({ page }) => {
  await ready(page);
  const metrics = await page.evaluate(() => ({
    triangles: window.__stage4!.triangles(),
    calls: window.__stage4!.drawCalls(),
  }));
  expect(metrics.triangles).toBeGreaterThan(100);
  expect(metrics.triangles).toBeLessThan(100_000);
  expect(metrics.calls).toBeLessThanOrEqual(100);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/stage4-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await expect(page.locator('#echo-control')).toBeVisible();
  await expect(page.locator('#pause-control')).toBeVisible();
  await page.screenshot({ path: 'artifacts/stage4-mobile-390.png', fullPage: true });
});
test('quality and ambience controls are accessible and survive a reload', async ({ page }) => {
  await ready(page);
  await page.locator('#pause-control').click();
  await page.locator('#quality-control').selectOption('low');
  await page.locator('#ambience-control').uncheck();
  expect(await page.evaluate(() => window.__stage4!.artQuality())).toBe('low');
  await page.reload();
  await expect(page.locator('#game-view canvas')).toBeVisible();
  await page.locator('#pause-control').click();
  await expect(page.locator('#quality-control')).toHaveValue('low');
  await expect(page.locator('#ambience-control')).not.toBeChecked();
});
test('re-entering L01 five times does not create new GPU geometry or textures', async ({ page }) => {
  await ready(page);
  const baseline = await page.evaluate(() => window.__stage4!.gpuMemory());
  for (let i = 0; i < 5; i++) {
    await page.locator('#pause-control').click();
    await page.locator('#menu-control').click();
    await page.locator('#menu-new').click();
    await page.waitForTimeout(130);
  }
  const after = await page.evaluate(() => window.__stage4!.gpuMemory());
  expect(after).toEqual(baseline);
});
