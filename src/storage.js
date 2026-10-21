export const STORAGE_KEY = 'little-moments-2048-v1';

const nonnegativeInteger = value => Number.isSafeInteger(value) && value >= 0;

function validState(state) {
  return state && Array.isArray(state.board) && state.board.length === 4
    && state.board.every(row => Array.isArray(row) && row.length === 4
      && row.every(value => value === 0 || (Number.isSafeInteger(value) && value >= 2 && Number.isInteger(Math.log2(value)))))
    && state.board.some(row => row.some(value => value !== 0))
    && nonnegativeInteger(state.score) && nonnegativeInteger(state.moves)
    && typeof state.continued === 'boolean';
}

export function loadGame(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return { state: null, best: 0 };
    const state = saved.version === 1 && validState(saved.state) ? saved.state : null;
    const best = Math.max(nonnegativeInteger(saved.best) ? saved.best : 0, state?.score ?? 0);
    return { state, best };
  } catch {
    return { state: null, best: 0 };
  }
}

export function saveGame(storage, state, best) {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state, best: Math.max(best, state.score) }));
    return true;
  } catch {
    return false;
  }
}
