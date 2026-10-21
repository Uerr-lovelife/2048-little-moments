import './style.css';
import { newGame, playTurn, getStatus } from './game.js';
import { loadGame, saveGame } from './storage.js';

const $ = selector => document.querySelector(selector);
const boardElement = $('#board');
const tileLayer = $('#tiles');
const dialog = $('#game-dialog');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let storage = null;
try { storage = window.localStorage; } catch { /* Play normally when storage is blocked. */ }
const loaded = loadGame(storage);
let state = loaded.state ?? newGame();
let best = loaded.best;
let busy = false;
let generation = 0;
let gesture = null;
let savedSuccessfully = false;

const cells = Array.from({ length: 16 }, (_, index) => {
  const element = document.createElement('div');
  element.className = 'cell';
  element.setAttribute('role', 'gridcell');
  element.setAttribute('aria-rowindex', String(Math.floor(index / 4) + 1));
  element.setAttribute('aria-colindex', String(index % 4 + 1));
  $('#cells').append(element);
  return element;
});

function persist() {
  best = Math.max(best, state.score);
  savedSuccessfully = saveGame(storage, state, best);
  $('#save-status').textContent = savedSuccessfully ? '✓ 进度自动保存' : '本次无法保存，仍可正常游玩';
  $('#save-status').classList.toggle('save-unavailable', !savedSuccessfully);
}

function createTile(value, row, col, animation = '') {
  const tile = document.createElement('div');
  tile.className = `tile ${animation}`;
  tile.dataset.value = String(value);
  tile.dataset.row = String(row);
  tile.dataset.col = String(col);
  tile.dataset.level = String(Math.min(Math.log2(value), 12));
  tile.style.setProperty('--row', row);
  tile.style.setProperty('--col', col);
  tile.textContent = String(value);
  if (value >= 1024) tile.classList.add('small-number');
  if (value >= 16384) tile.classList.add('tiny-number');
  tileLayer.append(tile);
  return tile;
}

function renderTiles(spawned = null, merged = []) {
  tileLayer.replaceChildren();
  const mergedKeys = new Set(merged.map(position => position.join(',')));
  state.board.forEach((row, r) => row.forEach((value, c) => {
    cells[r * 4 + c].setAttribute('aria-label', `第 ${r + 1} 行，第 ${c + 1} 列，${value || '空'}`);
    if (!value) return;
    const animation = spawned?.[0] === r && spawned?.[1] === c ? 'tile-new'
      : mergedKeys.has(`${r},${c}`) ? 'tile-merged' : '';
    createTile(value, r, c, animation);
  }));
}

function renderStats(gain = 0) {
  $('#score').textContent = String(state.score);
  $('#best').textContent = String(best);
  $('#moves').textContent = String(state.moves);
  $('#largest').textContent = String(Math.max(...state.board.flat()));
  const scoreGain = $('#score-gain');
  scoreGain.classList.remove('show-gain');
  if (gain) {
    scoreGain.textContent = `+${gain}`;
    void scoreGain.offsetWidth;
    scoreGain.classList.add('show-gain');
  } else {
    scoreGain.textContent = '';
  }
}

function renderDialog() {
  const status = getStatus(state);
  const wasOpen = !dialog.hidden;
  dialog.hidden = status === 'playing';
  boardElement.inert = status !== 'playing';
  if (status === 'playing') return;
  const won = status === 'won';
  $('#dialog-symbol').textContent = won ? '✦' : '↗';
  $('#dialog-title').textContent = won ? '合成 2048！' : '这一局，很精彩';
  $('#dialog-description').textContent = won ? '小小的坚持，合成了大大的快乐。要继续挑战更大的数字吗？' : `你走了 ${state.moves} 步，获得 ${state.score} 分。休息一下，再出发。`;
  $('#continue-game').hidden = !won;
  $('#dialog-restart').classList.toggle('button-quiet', won);
  if (!wasOpen || !dialog.contains(document.activeElement) || document.activeElement.hidden) {
    (won ? $('#continue-game') : $('#dialog-restart')).focus({ preventScroll: true });
  }
}

function render(spawned = null, merged = [], gain = 0) {
  renderTiles(spawned, merged);
  renderStats(gain);
  renderDialog();
}

async function move(direction) {
  if (busy || getStatus(state) !== 'playing') return;
  const result = playTurn(state, direction);
  if (!result.changed) return;
  busy = true;
  const ticket = generation;
  state = result.state;
  persist();

  // Two tiles may travel to one destination. Replace them with the merged
  // value only after their movement ends, so animation never alters rules.
  if (!reduceMotion.matches) {
    tileLayer.replaceChildren();
    const movingTiles = result.motions.map(motion => ({
      tile: createTile(motion.value, ...motion.from), motion,
    }));
    void tileLayer.offsetWidth;
    movingTiles.forEach(({ tile, motion }) => {
      tile.style.setProperty('--row', motion.to[0]);
      tile.style.setProperty('--col', motion.to[1]);
      if (motion.merged) tile.style.zIndex = '2';
    });
    await new Promise(resolve => window.setTimeout(resolve, 150));
  } else {
    // Keep the input lock for this event turn even with motion disabled.
    await Promise.resolve();
  }
  if (ticket !== generation) return;
  render(result.spawned, result.mergedPositions, result.score);
  busy = false;
  $('#announcement').textContent = `第 ${state.moves} 步，得分 ${state.score}，最大方块 ${Math.max(...state.board.flat())}。`;
}

function restart() {
  generation++;
  busy = false;
  gesture = null;
  state = newGame();
  persist();
  render();
  $('#announcement').textContent = '新游戏已开始。';
  boardElement.focus({ preventScroll: true });
}

$('#new-game').addEventListener('click', restart);
$('#dialog-restart').addEventListener('click', restart);
$('#continue-game').addEventListener('click', () => {
  state = { ...state, continued: true };
  persist();
  renderDialog();
  if (dialog.hidden) boardElement.focus({ preventScroll: true });
});

const keys = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
};

document.addEventListener('keydown', event => {
  if (!dialog.hidden && event.key === 'Tab') {
    const buttons = [...dialog.querySelectorAll('button')].filter(button => !button.hidden);
    const first = buttons[0]; const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing
      || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  const direction = keys[event.key] ?? keys[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault();
  if (!event.repeat) void move(direction);
});

document.querySelectorAll('[data-direction]').forEach(button => {
  button.addEventListener('click', () => void move(button.dataset.direction));
});

boardElement.addEventListener('pointerdown', event => {
  if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  if (boardElement.hasPointerCapture(event.pointerId) || event.isTrusted) {
    boardElement.setPointerCapture(event.pointerId);
  }
});

boardElement.addEventListener('pointerup', event => {
  if (!gesture || gesture.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  gesture = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  void move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
});
boardElement.addEventListener('pointercancel', () => { gesture = null; });
boardElement.addEventListener('lostpointercapture', () => { gesture = null; });

persist();
render();
