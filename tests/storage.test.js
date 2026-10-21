import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, saveGame, STORAGE_KEY } from '../src/storage.js';

const state = { board: [[2,4,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]], score: 24, moves: 7, continued: false };
function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('a saved game survives JSON round-trip and keeps the highest score', () => {
  const storage = memoryStorage();
  assert.equal(saveGame(storage, state, 100), true);
  assert.deepEqual(loadGame(storage), { state, best: 100 });
  saveGame(storage, { ...state, score: 120 }, 100);
  assert.equal(loadGame(storage).best, 120);
});

test('an empty or malformed saved value safely falls back to a new game', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadGame(storage), { state: null, best: 0 });
  storage.setItem(STORAGE_KEY, '{oops');
  assert.deepEqual(loadGame(storage), { state: null, best: 0 });
});

test('invalid boards, scores and flags are rejected while a valid best score survives', () => {
  const storage = memoryStorage();
  const invalidStates = [
    { ...state, board: [[2,4]] },
    { ...state, board: [[3,0,0,0], ...state.board.slice(1)] },
    { ...state, board: [[-2,0,0,0], ...state.board.slice(1)] },
    { ...state, board: [[2 ** 54,0,0,0], ...state.board.slice(1)] },
    { ...state, board: Array.from({ length: 4 }, () => [0,0,0,0]) },
    { ...state, score: -1 }, { ...state, score: '24' },
    { ...state, moves: 1.5 }, { ...state, continued: 'false' },
  ];
  for (const invalid of invalidStates) {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state: invalid, best: 200 }));
    assert.deepEqual(loadGame(storage), { state: null, best: 200 });
  }
});

test('unavailable or quota-limited storage never prevents playing', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.deepEqual(loadGame(storage), { state: null, best: 0 });
  assert.equal(saveGame(storage, state, 0), false);
  assert.deepEqual(loadGame(null), { state: null, best: 0 });
  assert.equal(saveGame(null, state, 0), false);
});

test('unsupported save versions and invalid best scores use safe defaults', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, state, best: 200 }));
  assert.equal(loadGame(storage).state, null);
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state, best: -10 }));
  assert.deepEqual(loadGame(storage), { state, best: 24 });
});
