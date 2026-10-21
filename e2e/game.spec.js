import { test, expect } from '@playwright/test';

const KEY = 'little-moments-2048-v1';
const freshBoard = () => Array.from({ length: 4 }, () => [0,0,0,0]);

async function seed(page, board, overrides = {}, best = 0) {
  await page.evaluate(({ key, board, overrides, best }) => {
    localStorage.setItem(key, JSON.stringify({ version: 1, state: { board, score: 0, moves: 0, continued: false, ...overrides }, best }));
  }, { key: KEY, board, overrides, best });
  await page.reload();
}

async function saved(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/');
});

test('starts with two tiles, zero score, clear instructions and no horizontal overflow', async ({ page }) => {
  await expect(page.locator('.tile')).toHaveCount(2);
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.getByRole('heading', { name: '怎么玩' })).toBeVisible();
  const size = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, screen: innerWidth }));
  expect(size.content).toBeLessThanOrEqual(size.screen);
});

test('a real keyboard move merges, scores and saves; invalid moves leave the save unchanged', async ({ page }) => {
  const board = freshBoard(); board[0] = [2,2,4,0];
  await seed(page, board);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#score')).toHaveText('4');
  await expect.poll(async () => (await saved(page)).state.moves).toBe(1);
  expect((await saved(page)).state.board[0]).toEqual([4,4,2,0]);
  await expect(page.locator('.tile')).toHaveCount(3);

  const fixed = freshBoard(); fixed[0] = [2,4,8,16];
  await seed(page, fixed, { score: 12, moves: 3 });
  const before = await saved(page);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#score')).toHaveText('12');
  expect(await saved(page)).toEqual(before);
});

test('WASD and direction buttons share controls; reload restores and restart preserves best', async ({ page }) => {
  const board = freshBoard(); board[0] = [2,2,0,0];
  await seed(page, board, { score: 8, moves: 2 }, 40);
  await page.keyboard.press('a');
  await expect(page.locator('#score')).toHaveText('12');
  await page.reload();
  await expect(page.locator('#score')).toHaveText('12');
  await expect(page.locator('#moves')).toHaveText('3');
  await page.getByRole('button', { name: '向下移动', exact: true }).click();
  await expect(page.locator('#moves')).toHaveText('4');
  await page.getByRole('button', { name: '新游戏', exact: true }).click();
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('#moves')).toHaveText('0');
  await expect(page.locator('#best')).toHaveText('40');
  await expect(page.locator('.tile')).toHaveCount(2);
});

test('winning can continue without showing the win dialog again', async ({ page }) => {
  const board = freshBoard(); board[0] = [1024,1024,0,0];
  await seed(page, board);
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: '合成 2048！' })).toBeVisible();
  await expect(page.locator('#score')).toHaveText('2048');
  await page.getByRole('button', { name: '继续挑战' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#moves')).toHaveText('2');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.reload();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a blocked board shows game over and offers a working restart', async ({ page }) => {
  const board = [[2,4,2,4], [4,2,4,2], [2,4,2,4], [4,2,4,2]];
  await seed(page, board, { score: 100, moves: 24 }, 200);
  await expect(page.getByRole('heading', { name: '这一局，很精彩' })).toBeVisible();
  await page.getByRole('button', { name: '再来一局' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.tile')).toHaveCount(2);
  await expect(page.locator('#best')).toHaveText('200');
});

test('continuing a full winning board focuses the game-over restart', async ({ page }) => {
  const board = [[2048,4,2,4], [4,2,4,2], [2,4,2,4], [4,2,4,2]];
  await seed(page, board, { score: 20000, moves: 400 });
  await expect(page.getByRole('heading', { name: '合成 2048！' })).toBeVisible();
  await page.getByRole('button', { name: '继续挑战' }).click();
  await expect(page.getByRole('heading', { name: '这一局，很精彩' })).toBeVisible();
  await expect(page.getByRole('button', { name: '再来一局' })).toBeFocused();
});

test('a native mobile touch gesture merges tiles', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'Native touch uses the mobile context.');
  const board = freshBoard(); board[0] = [2,2,0,0];
  await seed(page, board);
  const bounds = await page.locator('#board').boundingBox();
  const x = Math.round(bounds.x + bounds.width * 0.75);
  const y = Math.round(bounds.y + bounds.height / 2);
  const client = await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 110, y }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#score')).toHaveText('4');
  await client.detach();
});

test('the entire board fits on a laptop screen', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Laptop viewport is checked in the desktop project.');
  await page.setViewportSize({ width: 1366, height: 768 });
  const bounds = await page.locator('#board').boundingBox();
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(768);
});

test('a 320px screen with reduced motion remains playable without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const board = freshBoard(); board[0] = [2,2,0,0];
  await seed(page, board);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#score')).toHaveText('4');
  const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, screen: innerWidth }));
  expect(size.width).toBeLessThanOrEqual(size.screen);
});

test('touch swipe moves the board without scrolling it', async ({ page }) => {
  const board = freshBoard(); board[0] = [2,2,0,0];
  await seed(page, board);
  await page.locator('#board').evaluate(element => {
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: rect.left + 200, clientY: rect.top + 100 }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: rect.left + 80, clientY: rect.top + 100 }));
  });
  await expect(page.locator('#score')).toHaveText('4');
  expect((await saved(page)).state.board[0]).toEqual([4,2,0,0]);
});

test('rapid repeated input merges only once and restart cancels pending animation', async ({ page }) => {
  const board = freshBoard(); board[0] = [2,2,2,2];
  await seed(page, board);
  await page.evaluate(() => {
    for (let i = 0; i < 12; i++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  });
  await expect(page.locator('#score')).toHaveText('8');
  await expect(page.locator('#moves')).toHaveText('1');
  await expect(page.locator('.tile')).toHaveCount(3);
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    document.querySelector('#new-game').click();
  });
  await expect(page.locator('#score')).toHaveText('0');
  await expect(page.locator('.tile')).toHaveCount(2);
  await page.waitForTimeout(250);
  await expect(page.locator('.tile')).toHaveCount(2);
  expect((await saved(page)).state.moves).toBe(0);
});

test('a corrupt save or blocked storage still starts a playable game', async ({ page }) => {
  await page.evaluate(key => localStorage.setItem(key, '{broken'), KEY);
  await page.reload();
  await expect(page.locator('.tile')).toHaveCount(2);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
  });
  await page.reload();
  await expect(page.locator('.tile')).toHaveCount(2);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#score')).toHaveText('4');
  await expect(page.locator('#save-status')).toContainText('无法保存');
});
