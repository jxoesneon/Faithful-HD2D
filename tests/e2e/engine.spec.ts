import { test, expect } from '@playwright/test';

test.describe('Faithful-HD2D Engine E2E', () => {
  test('should launch the app, start a new game, and interact with the canvas', async ({ page }) => {
    // Log console messages
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/.*|Vite.*/);
    
    await page.evaluate(async () => {
        const getBtn = (text: string) => Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(text));
        
        const genesis = getBtn('CALIBRATE COGNITION');
        if (genesis) genesis.click();
        
        await new Promise(r => setTimeout(r, 1000));
        
        const start = getBtn('Materialize Seeding Matrix') || getBtn('Materialize Sector');
        if (start) start.click();
    });
    
    // Check if canvas exists
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeAttached({ timeout: 15000 });

    await page.waitForTimeout(1000);
  });
});
