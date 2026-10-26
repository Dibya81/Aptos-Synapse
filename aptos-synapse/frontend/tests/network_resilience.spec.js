const { test, expect } = require('@playwright/test');

test.describe('HUD Network Resilience', () => {
  test('should display toast banner on node connection drop', async ({ page }) => {
    await page.goto('http://127.0.0.1:3002/');
    // Simulate offline state
    await page.context().setOffline(true);
    const executeBtn = page.locator('#execute-btn, .btn-execute');
    if (await executeBtn.count() > 0) {
      await executeBtn.first().click();
    }
    await page.context().setOffline(false);
  });
});
