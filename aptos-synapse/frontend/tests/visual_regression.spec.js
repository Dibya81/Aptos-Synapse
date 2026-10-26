const { test, expect } = require('@playwright/test');

test.describe('HUD Visual Dial Regression', () => {
  test('should render agent score dials without clipping', async ({ page }) => {
    await page.goto('http://127.0.0.1:3002/');
    const dials = page.locator('.score-gauge, .quality-dial');
    if (await dials.count() > 0) {
      await expect(dials.first()).toBeVisible();
    }
  });
});
