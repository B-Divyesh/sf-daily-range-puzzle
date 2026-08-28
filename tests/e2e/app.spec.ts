import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('daily puzzle works on mobile and has one main heading', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?day=2026-08-28');
  await expect(page).toHaveTitle(/Daily Range/);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('group', { name: /Daily 7 column/ })).toBeVisible();
  await expect(page.locator('[data-cell]')).toHaveCount(35);
  const tile = await page.locator('[data-cell="0,0"]').boundingBox();
  expect(tile?.width).toBeGreaterThanOrEqual(44);
  expect(tile?.height).toBeGreaterThanOrEqual(44);
  expect(errors).toEqual([]);
});

test('first move creates a cooperative share action', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?day=2026-08-28');
  const open = page.locator('.hex:not([aria-disabled="true"])').first();
  await open.click();
  await expect(page.getByRole('button', { name: 'Send first move' })).toBeVisible();
});

test('a valid two-relay chain completes end to end', async ({ page }) => {
  await page.goto('/?day=2026-08-28');
  await page.locator('[data-cell="2,1"]').click();
  await page.locator('[data-cell="4,2"]').click();
  await expect(page.locator('#game-status')).toContainText('Signal linked');
  await expect(page.getByRole('button', { name: 'Share result' })).toBeVisible();
});

test('privacy route explains local-only storage', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nothing leaves');
  await expect(page.getByText('no accounts, analytics', { exact: false })).toBeVisible();
});

test('has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/?day=2026-08-28');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
