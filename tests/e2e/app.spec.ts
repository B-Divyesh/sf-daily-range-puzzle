import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function finishSample(page: import('@playwright/test').Page) {
  await page.locator('[data-cell="4,2"]').click();
  await expect(page.locator('#game-status')).toContainText('Route complete');
}

test('daily puzzle works on mobile and has one main heading', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?day=2026-08-28');
  await expect(page).toHaveTitle('Daily Range — solve a daily relay map');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('group', { name: /Daily 7 column/ })).toBeVisible();
  await expect(page.locator('[data-cell]')).toHaveCount(35);
  const tile = await page.locator('[data-cell="0,0"]').boundingBox();
  expect(tile?.width).toBeGreaterThanOrEqual(44);
  expect(tile?.height).toBeGreaterThanOrEqual(44);
  expect(errors).toEqual([]);
});

test('@claim:demo-sandbox opens a populated sample without changing real game storage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('daily-range:2026-08-28', 'real-game-state'));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByLabel('Demo status')).toContainText('sample data');
  await expect(page.getByText('A sample player started this route.')).toBeVisible();
  await finishSample(page);
  const storage = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])));
  expect(storage['daily-range:2026-08-28']).toBe('real-game-state');
  expect(Object.keys(storage).some((key) => key.startsWith('demo:daily-range:'))).toBe(true);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('A sample player started this route.')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('demo:daily-range:')))).toBe(false);
});

test('@claim:keyboard-play finishes the sample route with the keyboard', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('[data-cell="4,2"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#game-status')).toContainText('Route complete');
});

test('@claim:offline-reload reloads the sample after its first visit while offline', async ({ page, context }) => {
  await page.goto('/demo');
  await page.waitForFunction(() => (window as Window & { __dailyRangeOfflineReady?: boolean }).__dailyRangeOfflineReady === true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel('Demo status')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Finish this sample');
  await context.setOffline(false);
});

test('@claim:privacy-local keeps a demo game local and uses no third-party requests', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await finishSample(page);
  expect(requests.every((request) => new URL(request).origin === 'http://127.0.0.1:4173')).toBe(true);
  expect(await context.cookies()).toEqual([]);
  const keys = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
  expect(keys.session).toEqual([]);
  expect(keys.local.every((key) => key.startsWith('demo:daily-range:'))).toBe(true);
});

test('@claim:free-to-play completes a sample without sign-in or payment', async ({ page }) => {
  await page.goto('/demo');
  await finishSample(page);
  await expect(page.getByRole('button', { name: 'Share result' })).toBeVisible();
  expect(await page.locator('a[href*="checkout"], a[href*="billing"], a[href*="login"]').count()).toBe(0);
});

test('@claim:share-finishable only offers first-move sharing when a recipient can finish', async ({ page }) => {
  await page.goto('/demo?starter=1');
  await page.locator('[data-cell="4,2"]').click();
  await expect(page.locator('#game-status')).toContainText('cannot complete');
  await expect(page.getByRole('button', { name: /finishable first move/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo last relay' }).click();
  await page.locator('[data-cell="2,1"]').click();
  await expect(page.getByRole('button', { name: /finishable first move/i })).toBeVisible();
  await page.goto('/demo?relay=4%2C2');
  await expect(page.getByText('This shared first move cannot be finished.')).toBeVisible();
  await expect(page.locator('[data-cell="4,2"]')).toHaveAttribute('aria-pressed', 'false');
});

test('@claim:spoiler-safe-results copies a result without relay coordinates', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/demo');
  await finishSample(page);
  await page.getByRole('button', { name: 'Copy result' }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('No map spoilers');
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain('2,1');
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toContain('4,2');
});

test('@claim:share-link-privacy creates a first-move link with only map state', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?day=2026-08-28');
  await page.locator('[data-cell="2,1"]').click();
  await page.getByRole('button', { name: /finishable first move/i }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('relay=2%2C1');
  const shareUrl = new URL((await page.evaluate(() => navigator.clipboard.readText())).split('\n').at(-1)!);
  expect([...shareUrl.searchParams.keys()].sort()).toEqual(['day', 'relay']);
});

test('a valid two-relay chain completes end to end', async ({ page }) => {
  await page.goto('/?day=2026-08-28');
  await page.locator('[data-cell="2,1"]').click();
  await page.locator('[data-cell="4,2"]').click();
  await expect(page.locator('#game-status')).toContainText('Route complete');
  await expect(page.getByRole('button', { name: 'Share result' })).toBeVisible();
});

test('a friend can finish a valid shared first move', async ({ page }) => {
  await page.goto('/?day=2026-08-28&relay=2%2C1');
  await expect(page.getByText('A friend started this route.')).toBeVisible();
  await expect(page.locator('[data-cell="2,1"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-cell="4,2"]').click();
  await expect(page.locator('#game-status')).toContainText('Route complete');
});

test('an impossible shared first move is rejected with a recovery path', async ({ page }) => {
  await page.goto('/?day=2026-08-28&relay=4%2C2');
  await expect(page.getByText('This shared first move cannot be finished.')).toBeVisible();
  await expect(page.locator('[data-cell="4,2"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#game-status')).toContainText('Choose relay 1');
});

test('clipboard denial shows a selectable sharing fallback without page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) } });
  });
  await page.goto('/?day=2026-08-28');
  await page.locator('[data-cell="2,1"]').click();
  await page.getByRole('button', { name: /finishable first move/i }).click();
  await expect(page.getByRole('heading', { name: 'Copy this message yourself' })).toBeVisible();
  await expect(page.getByLabel('Message to copy manually')).toContainText('relay=2%2C1');
  expect(errors).toEqual([]);
});

test('invalid calendar dates explain recovery instead of normalizing', async ({ page }) => {
  await page.goto('/?day=2026-02-31');
  await expect(page.getByText('That date is not available.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Today’s map' })).toBeVisible();
  await expect(page.getByText('March 3, 2026')).toHaveCount(0);
});

test('primary content reflows at 200% text size and all mobile links meet target size', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  const dimensions = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  const heading = await page.getByRole('heading', { level: 1 }).boundingBox();
  const action = await page.getByRole('link', { name: 'Try it with sample data' }).boundingBox();
  expect((heading?.x ?? 0) + (heading?.width ?? 0)).toBeLessThanOrEqual(390);
  expect((action?.x ?? 0) + (action?.width ?? 0)).toBeLessThanOrEqual(390);
  for (const locator of [page.getByLabel('Daily Range home'), page.getByText('Privacy', { exact: true }).last(), page.getByText('Terms', { exact: true })]) {
    const box = await locator.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('privacy and terms routes set their titles and explain local storage', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).toHaveTitle('Privacy — Daily Range');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('How Daily Range stores');
  await expect(page.getByText('separate demo storage', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Terms' }).click();
  await expect(page).toHaveTitle('Terms — Daily Range');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Terms for playing');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('the designed 404 page has a route back to the game', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Daily Range');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Open today’s relay map');
  await expect(page.getByRole('link', { name: 'Open today’s map' })).toHaveAttribute('href', '/');
});

test('has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/demo');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
