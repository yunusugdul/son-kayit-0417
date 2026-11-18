import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window { __stage3?: {
    position(): [number,number,number];
    project(x:number,y:number,z:number): [number,number];
    flags(): string[];
    checkpoint(): string;
    floorIndex(): number;
    cassette(): string;
    echo(): { phase:string; groupId:string|null; secondsRemaining:number };
    completed(): boolean;
    entryLatched(): boolean;
  } }
}
async function ready(page:Page):Promise<void> {
  await page.goto('/?debug=1');
  await expect(page.locator('#game-view canvas')).toBeVisible();
  await page.waitForFunction(()=>!!window.__stage3);
}
async function clickAt(page:Page,x:number,y:number,z:number):Promise<void> {
  const [px,py] = await page.evaluate(([a,b,c])=>window.__stage3!.project(a,b,c),[x,y,z]);
  await page.mouse.click(px,py);
}
async function getTape(page:Page):Promise<void> {
  await clickAt(page,-2.5,0.8,0.5);
  await page.waitForFunction(()=>window.__stage3?.flags().includes('l01_tape_found'),null,{timeout:10000});
}
async function inside(page:Page):Promise<void> {
  await getTape(page);
  await clickAt(page,0.5,0,0.5);
  await page.waitForFunction(()=>{
    const [x,,z]=window.__stage3!.position();
    return Math.hypot(x-1,z+.5)<1.55;
  },null,{timeout:15000});
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.__stage3?.echo().phase==='active');
  await clickAt(page,2.5,0,-0.5);
  await page.waitForFunction(()=>window.__stage3?.checkpoint()==='cp_l01_interior',null,{timeout:9000});
  await page.waitForFunction(()=>{
    const [x,,z]=window.__stage3!.position();
    return x>2.45 && Math.abs(z+.5)<0.15;
  },null,{timeout:4000});
}
test('main menu starts a new game and collected bell is saved', async({page})=>{
  await page.goto('/');
  await expect(page.locator('#menu-overlay')).toBeVisible();
  await page.locator('#menu-new').click();
  await expect(page.locator('#menu-overlay')).toBeHidden();
  await expect(page.locator('#tape-name')).toContainText('henüz');
  await page.reload();
  await expect(page.locator('#menu-continue')).toBeEnabled();
  await page.locator('#menu-continue').click();
  await expect(page.locator('#game-view canvas')).toBeVisible();
});
test('L01 A echo, interior note, B echo, upper shelf and Efe completion',async({page})=>{
  test.setTimeout(50_000);
  await ready(page);
  await inside(page);
  await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>window.__stage3?.flags().includes('l01_note_read'),null,{timeout:6000});
  // Stage 2 permits one active echo group. A must fade/cool down before B can start.
  await page.waitForFunction(()=>window.__stage3?.echo().phase==='inactive',null,{timeout:20000});
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.__stage3?.echo().groupId==='l01_stairs' && window.__stage3?.echo().phase==='active',null,{timeout:3000});
  await clickAt(page,3.5,1.57,-1.5);
  await page.waitForFunction(()=>window.__stage3?.completed(),null,{timeout:9000});
  expect(await page.evaluate(()=>window.__stage3!.flags())).toContain('l01_record_found');
  await expect(page.locator('#subtitle-box')).toContainText('Ada, beni hatırla');
  await page.locator('#subtitle-dismiss').click();
  await expect(page.locator('#completion-overlay')).toBeVisible();
  await expect(page.locator('#completion-overlay')).toContainText('L02');
});
test('reload restores interior checkpoint, bell and the second-anchor note',async({page})=>{
  await ready(page);
  await inside(page);
  await page.keyboard.press('KeyE');
  await page.waitForFunction(()=>window.__stage3?.flags().includes('l01_note_read'),null,{timeout:6000});
  await page.goto('/?debug=1&continue=1');
  await page.waitForFunction(()=>!!window.__stage3);
  expect(await page.evaluate(()=>window.__stage3!.checkpoint())).toBe('cp_l01_interior');
  expect(await page.evaluate(()=>window.__stage3!.flags())).toContain('l01_note_read');
  expect(await page.evaluate(()=>window.__stage3!.entryLatched())).toBe(true);
  expect(await page.evaluate(()=>window.__stage3!.cassette())).toContain('bell');
});
test('pause and tab hidden preserve echo time',async({page})=>{
  await ready(page);
  await getTape(page);
  await clickAt(page,0.5,0,0.5);
  await page.waitForFunction(()=>{
    const [x,,z]=window.__stage3!.position();
    return Math.hypot(x-1,z+.5)<1.55;
  },null,{timeout:15000});
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.__stage3?.echo().phase==='active');
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-overlay')).toBeVisible();
  const before=await page.evaluate(()=>window.__stage3!.echo().secondsRemaining);
  await page.waitForTimeout(550);
  expect(await page.evaluate(()=>window.__stage3!.echo().secondsRemaining)).toBe(before);
  await page.locator('#resume-control').click();
  await expect(page.locator('#pause-overlay')).toBeHidden();
});
