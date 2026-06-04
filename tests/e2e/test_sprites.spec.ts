import { test, expect } from '@playwright/test';

test('debug sprite loading', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  await page.goto('/');
  await page.waitForTimeout(8000);

  // Start a game to get entities rendered
  await page.evaluate(async () => {
    const getBtn = (text: string) => Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(text));
    const genesis = getBtn('CALIBRATE COGNITION');
    if (genesis) genesis.click();
    await new Promise(r => setTimeout(r, 1000));
    const start = getBtn('Materialize Seeding Matrix') || getBtn('Materialize Sector');
    if (start) start.click();
    await new Promise(r => setTimeout(r, 3000));
  });

  const spriteInfo = await page.evaluate(() => {
    // Access the renderer through the global app
    const anyWin = window as any;
    const renderer = anyWin.__renderer;
    if (!renderer) return { noRenderer: true };

    return {
      initialized: renderer.initialized,
      sheetCount: renderer.loadedSheets ? renderer.loadedSheets.size : -1,
      sheetKeys: renderer.loadedSheets ? Array.from(renderer.loadedSheets.keys()) : [],
      entityCount: renderer.entitySprites ? renderer.entitySprites.size : -1,
      firstEntityTexture: (() => {
        const first = renderer.entitySprites?.values().next().value;
        if (!first) return null;
        const sprite = first.children?.[2];
        if (!sprite) return null;
        return {
          hasTexture: !!sprite.texture,
          textureSource: sprite.texture ? !!sprite.texture.source : false,
          textureWidth: sprite.texture ? sprite.texture.width : 0,
          textureHeight: sprite.texture ? sprite.texture.height : 0,
        };
      })()
    };
  });

  console.log('SPRITE INFO:', JSON.stringify(spriteInfo, null, 2));

  await page.screenshot({ path: 'test-results/debug-sprites.png', fullPage: true });
});
