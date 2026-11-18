import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

type Snapshot = {
  phase: string; secondsRemaining: number; traversable: boolean; visualProgress: number;
};
declare global {
  interface Window {
    __stage2?: {
      echo(): Snapshot;
      position(): [number, number, number];
      project(x: number, y: number, z: number): [number, number];
      doorEnabled(): boolean;
      entryLatched(): boolean;
      cassette(): string;
      paused(): boolean;
    };
  }
}

async function ready(page: Page): Promise<void> {
  await page.goto('/?debug=1');
  await expect(page.locator('#game-view canvas')).toBeVisible();
  await page.waitForFunction(() => !!window.__stage2);
}
async function clickWorld(page: Page, x: number, z: number): Promise<void> {
  const [px, py] = await page.evaluate(([a, b]) => window.__stage2!.project(a, 0, b), [x, z]);
  await page.mouse.click(px, py);
}
async function approachA(page: Page): Promise<void> {
  await clickWorld(page, 0.5, 0.5);
  await page.waitForFunction(() => {
    const [x, , z] = window.__stage2!.position();
    return Math.hypot(x - 1, z + 0.5) <= 1.55;
  }, null, { timeout: 12000 });
}

test('selected bell cassette needs proximity; repeated Space does not renew active echo', async ({ page }) => {
  await ready(page);
  expect(await page.evaluate(() => window.__stage2!.cassette())).toContain('bell');
  expect(await page.evaluate(() => window.__stage2!.doorEnabled())).toBe(false);
  await page.keyboard.press('Space');
  await expect(page.locator('#feedback')).toContainText('yaklaş');
  await approachA(page);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__stage2?.echo().phase === 'active');
  expect(await page.evaluate(() => window.__stage2!.doorEnabled())).toBe(true);
  await page.waitForTimeout(600);
  const before = await page.evaluate(() => window.__stage2!.echo().secondsRemaining);
  await page.keyboard.press('Space');
  const after = await page.evaluate(() => window.__stage2!.echo().secondsRemaining);
  expect(after).toBeLessThanOrEqual(before);
  await expect(page.locator('#feedback')).toContainText('süre yenilenmedi');
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/stage2-echo-active.png', fullPage: true });
});

test('echo opens navigation to post office; permanent escape remains when it expires', async ({ page }) => {
  await ready(page);
  await approachA(page);
  await page.locator('#echo-control').click();
  await page.waitForFunction(() => window.__stage2?.doorEnabled());
  await clickWorld(page, 2.5, -0.5);
  await page.waitForFunction(() => window.__stage2?.entryLatched(), null, { timeout: 9000 });
  const inside = await page.evaluate(() => window.__stage2!.position());
  expect(inside[0]).toBeGreaterThan(2.28);
  await page.waitForFunction(() => window.__stage2?.echo().phase === 'inactive', null, { timeout: 20000 });
  expect(await page.evaluate(() => window.__stage2!.doorEnabled())).toBe(true);
  await expect(page.locator('#echo-state')).toContainText('kalıcı olarak güvenli');
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/stage2-safe-exit.png', fullPage: true });
});

test('visibilitychange freezes active echo remaining time and resumes without time skip', async ({ page }) => {
  await ready(page);
  await approachA(page);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__stage2?.echo().phase === 'active');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const held = await page.evaluate(() => window.__stage2!.echo().secondsRemaining);
  await page.waitForTimeout(650);
  expect(await page.evaluate(() => window.__stage2!.echo().secondsRemaining)).toBe(held);
  expect(await page.evaluate(() => window.__stage2!.paused())).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(160);
  const resumed = await page.evaluate(() => window.__stage2!.echo().secondsRemaining);
  expect(held - resumed).toBeLessThan(0.35);
});
