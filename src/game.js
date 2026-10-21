const SIZE = 4;

export const emptyBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

export function spawnTile(board, random = Math.random) {
  const spaces = [];
  board.forEach((row, r) => row.forEach((value, c) => { if (!value) spaces.push([r, c]); }));
  if (!spaces.length) return { board, position: null };
  const position = spaces[Math.floor(random() * spaces.length)];
  const next = board.map(row => [...row]);
  next[position[0]][position[1]] = random() < 0.9 ? 2 : 4;
  return { board: next, position };
}

export function newGame(random = Math.random) {
  const first = spawnTile(emptyBoard(), random);
  const second = spawnTile(first.board, random);
  return { board: second.board, score: 0, moves: 0, continued: false };
}

export function playTurn(state, direction, random = Math.random) {
  const result = moveBoard(state.board, direction);
  if (!result.changed) return { ...result, state, spawned: null };
  const spawned = spawnTile(result.board, random);
  return {
    ...result,
    state: { ...state, board: spawned.board, score: state.score + result.score, moves: state.moves + 1 },
    spawned: spawned.position,
  };
}

export function getStatus(state) {
  if (!state.continued && state.board.some(row => row.some(value => value >= 2048))) return 'won';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = state.board[r][c];
      if (!value || state.board[r][c + 1] === value || state.board[r + 1]?.[c] === value) return 'playing';
    }
  }
  return 'over';
}

/** A pure move: no spawning, storage, or DOM changes. */
export function moveBoard(board, direction) {
  const next = emptyBoard();
  const motions = [];
  const mergedPositions = [];
  let score = 0;

  for (let line = 0; line < SIZE; line++) {
    const positions = Array.from({ length: SIZE }, (_, offset) => {
      if (direction === 'left') return [line, offset];
      if (direction === 'right') return [line, SIZE - 1 - offset];
      if (direction === 'up') return [offset, line];
      return [SIZE - 1 - offset, line];
    });
    const tiles = positions
      .map(([row, col]) => ({ from: [row, col], value: board[row][col] }))
      .filter(tile => tile.value !== 0);

    let destination = 0;
    for (let index = 0; index < tiles.length; index++) {
      const first = tiles[index];
      const to = positions[destination++];
      const pair = tiles[index + 1]?.value === first.value;
      const value = pair ? first.value * 2 : first.value;
      next[to[0]][to[1]] = value;
      motions.push({ from: first.from, to, value: first.value, merged: pair });
      if (pair) {
        motions.push({ from: tiles[++index].from, to, value: first.value, merged: true });
        mergedPositions.push(to);
        score += value;
      }
    }
  }

  const changed = next.some((row, r) => row.some((value, c) => value !== board[r][c]));
  return { board: next, score, changed, motions, mergedPositions };
}
