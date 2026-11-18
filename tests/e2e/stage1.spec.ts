import { expect, test } from '@playwright/test';

type Debug = {
  position(): [number, number, number];
  route(): string[];
  cell(): string | null;
  eventIds(): string[];
  meshIds(): string[];
  doorEnabled(): boolean;
  targetActive(): boolean;
  project(x: number, y: number, z: number): [number, number];
};
declare global { interface Window { __stage1?: Debug } }

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/?debug=1');
  await expect(page.locator('#game-view canvas')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__stage1));
}
async function clickWorld(page: import('@playwright/test').Page, x: number, y: number, z: number) {
  const [px, py] = await page.evaluate(([a, b, c]) => window.__stage1!.project(a, b, c), [x, y, z]);
  await page.mouse.click(px, py);
}

test('GLB loads with correct mesh IDs; closed door blocks access to inside', async ({ page }) => {
  await ready(page);
  const ids = await page.evaluate(() => window.__stage1!.meshIds());
  for (const id of ['l01_mailbox', 'l01_door_main', 'l01_fence', 'l01_wall_east']) expect(ids).toContain(id);
  expect(await page.evaluate(() => window.__stage1!.doorEnabled())).toBe(false);
  await clickWorld(page, 2.5, 0, -1.5); // visible floor inside closed post office
  await expect(page.locator('#feedback')).toContainText('yol yok');
  await page.waitForTimeout(350);
  const pos = await page.evaluate(() => window.__stage1!.position());
  expect(pos[0]).toBeLessThan(2);
});

test('far object click plans a route; approaches safely and emits interact event', async ({ page }) => {
  await ready(page);
  await clickWorld(page, -2.5, 0.8, 0.5);
  await page.waitForFunction(() => window.__stage1?.eventIds().includes('l01_mailbox'), { timeout: 10000 });
  const [x, , z] = await page.evaluate(() => window.__stage1!.position());
  expect(Math.hypot(x + 2.5, z - 0.5)).toBeLessThan(1.6);
});

test('hover highlight and E key send event only when near; no silent teleport', async ({ page }) => {
  await ready(page);
  await page.keyboard.press('e');
  await expect(page.locator('#feedback')).toContainText('Yakında');
  expect(await page.evaluate(() => window.__stage1!.eventIds())).toHaveLength(0);
  const [px, py] = await page.evaluate(() => window.__stage1!.project(-2.5, 0.8, 0.5));
  await page.mouse.move(px, py);
  await expect(page.locator('#interaction-prompt')).toContainText('Posta kutusu');
});

test('50 click targets and wall collision never place Ada inside the closed post office', async ({ page }) => {
  await ready(page);
  for (let i = 0; i < 50; i++) {
    const x = (i * 7 % 10) - 4.5;
    const z = (i * 3 % 10) - 4.5;
    await clickWorld(page, x, 0, z);
    await page.waitForTimeout(25);
    const [px, , pz] = await page.evaluate(() => window.__stage1!.position());
    expect(Math.abs(px)).toBeLessThan(4.75);
    expect(Math.abs(pz)).toBeLessThan(4.75);
    expect(px > 2.20 && px < 3.80 && pz > -2.80 && pz < .80).toBe(false);
  }
});
