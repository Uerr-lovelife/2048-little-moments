import test from 'node:test';
import assert from 'node:assert/strict';
import { moveBoard, spawnTile, newGame, playTurn, getStatus } from '../src/game.js';

const empty = () => Array.from({ length: 4 }, () => [0, 0, 0, 0]);

test('left merges pairs once, scores merged values, and preserves input', () => {
  const board = [[2,2,2,2], [2,0,2,4], [4,4,4,0], [2,4,8,16]];
  const before = structuredClone(board);
  const result = moveBoard(board, 'left');
  assert.deepEqual(result.board, [[4,4,0,0], [4,4,0,0], [8,4,0,0], [2,4,8,16]]);
  assert.equal(result.score, 20);
  assert.equal(result.changed, true);
  assert.deepEqual(board, before);
  assert.equal(result.motions.length, 14);
  assert.deepEqual(result.mergedPositions, [[0,0], [0,1], [1,0], [2,0]]);
});

test('right prioritizes the leading pair in the direction of movement', () => {
  const board = empty(); board[0] = [2,2,2,0];
  const result = moveBoard(board, 'right');
  assert.deepEqual(result.board[0], [0,0,2,4]);
  assert.equal(result.score, 4);
});

test('up merges vertical pairs without merging a new tile twice', () => {
  const board = [[2,0,0,0], [2,0,0,0], [4,0,0,0], [4,0,0,0]];
  assert.deepEqual(moveBoard(board, 'up').board, [[4,0,0,0], [8,0,0,0], [0,0,0,0], [0,0,0,0]]);
});

test('down compresses and merges from the bottom', () => {
  const board = [[2,0,0,0], [0,0,0,0], [2,0,0,0], [2,0,0,0]];
  assert.deepEqual(moveBoard(board, 'down').board, [[0,0,0,0], [0,0,0,0], [2,0,0,0], [4,0,0,0]]);
});

test('an immovable direction reports no change and zero score', () => {
  const board = empty(); board[0] = [2,4,8,16];
  const result = moveBoard(board, 'left');
  assert.equal(result.changed, false);
  assert.equal(result.score, 0);
  assert.deepEqual(result.board, board);
});

test('spawning chooses an empty cell and produces 2 below the 90% threshold', () => {
  const board = [[2,4,8,16], [32,64,128,256], [512,1024,2,4], [8,16,0,32]];
  const before = structuredClone(board);
  const values = [0.75, 0.89];
  const result = spawnTile(board, () => values.shift());
  assert.deepEqual(result.position, [3,2]);
  assert.equal(result.board[3][2], 2);
  assert.deepEqual(board, before);
});

test('spawning produces 4 at the 90% threshold', () => {
  const values = [0, 0.9];
  assert.equal(spawnTile(empty(), () => values.shift()).board[0][0], 4);
});

test('a full board does not spawn or consume randomness', () => {
  const board = Array.from({ length: 4 }, () => [2,4,8,16]);
  const result = spawnTile(board, () => { throw new Error('must not run'); });
  assert.equal(result.position, null);
  assert.deepEqual(result.board, board);
});

test('a new game has two tiles, no score and no moves', () => {
  const state = newGame(() => 0);
  assert.deepEqual(state.board, [[2,2,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]]);
  assert.equal(state.score, 0);
  assert.equal(state.moves, 0);
  assert.equal(state.continued, false);
});

test('an invalid turn does not spawn, consume randomness, or count a move', () => {
  const board = empty(); board[0] = [2,4,8,16];
  const state = { board, score: 12, moves: 3, continued: false };
  const result = playTurn(state, 'left', () => { throw new Error('must not run'); });
  assert.deepEqual(result.state, state);
  assert.equal(result.changed, false);
  assert.equal(result.spawned, null);
});

test('a valid turn updates score, counts one move and spawns exactly one tile', () => {
  const board = empty(); board[0] = [2,2,0,0];
  const state = { board, score: 8, moves: 2, continued: false };
  const result = playTurn(state, 'left', () => 0);
  assert.deepEqual(result.state.board, [[4,2,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]]);
  assert.equal(result.state.score, 12);
  assert.equal(result.state.moves, 3);
  assert.deepEqual(result.spawned, [0,1]);
  assert.equal(state.board[0][0], 2);
});

test('a blocked full board is over, but horizontal or vertical matches permit play', () => {
  const board = [[2,4,2,4], [4,2,4,2], [2,4,2,4], [4,2,4,2]];
  const state = { board, continued: false };
  assert.equal(getStatus(state), 'over');
  const horizontal = structuredClone(board); horizontal[0][1] = 2;
  assert.equal(getStatus({ ...state, board: horizontal }), 'playing');
  const vertical = structuredClone(board); vertical[1][0] = 2;
  assert.equal(getStatus({ ...state, board: vertical }), 'playing');
  const space = structuredClone(board); space[0][0] = 0;
  assert.equal(getStatus({ ...state, board: space }), 'playing');
});

test('reaching 2048 wins once, and continuing permits more moves', () => {
  const board = empty(); board[0][0] = 2048;
  assert.equal(getStatus({ board, continued: false }), 'won');
  assert.equal(getStatus({ board, continued: true }), 'playing');
});
