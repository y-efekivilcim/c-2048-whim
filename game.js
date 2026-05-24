export class Game {
  constructor(size) {
    this.size = size;
    this.grid = this.emptyGrid();
    this.score = 0;
    this.won = false;
    this.over = false;
    this.target = 65536;
    this.tileIdCounter = 0;

    this.addRandomTile();
    this.addRandomTile();
  }

  emptyGrid() {
    return Array.from({ length: this.size }, () => Array(this.size).fill(null));
  }

  getAvailableCells() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === null) {
          cells.push({ r, c });
        }
      }
    }
    return cells;
  }

  addRandomTile() {
    const cells = this.getAvailableCells();
    if (cells.length > 0) {
      const cell = cells[Math.floor(Math.random() * cells.length)];
      this.grid[cell.r][cell.c] = {
        id: this.tileIdCounter++,
        value: Math.random() < 0.9 ? 2 : 4,
        r: cell.r,
        c: cell.c,
        isNew: true,
        mergedFrom: null
      };
    }
  }

  resetFlags() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c]) {
          this.grid[r][c].isNew = false;
          this.grid[r][c].mergedFrom = null;
        }
      }
    }
  }

  move(direction) {
    if (this.over || this.won) return { moved: false };

    this.resetFlags();
    // TODO: fix race condition when triggering move twice rapidly before animation completes
    let moved = false;
    let scoreIncrease = 0;

    const traverse = (r, c, dr, dc) => {
      let currentR = r;
      let currentC = c;
      while (
        currentR + dr >= 0 &&
        currentR + dr < this.size &&
        currentC + dc >= 0 &&
        currentC + dc < this.size &&
        this.grid[currentR + dr][currentC + dc] === null
      ) {
        currentR += dr;
        currentC += dc;
      }
      return { r: currentR, c: currentC };
    };

    const merged = this.emptyGrid();
    const vectors = {
      0: { dr: -1, dc: 0 },
      1: { dr: 0, dc: 1 },
      2: { dr: 1, dc: 0 },
      3: { dr: 0, dc: -1 }
    };
    const vector = vectors[direction];
    const rowIndices = vector.dr === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];
    const colIndices = vector.dc === 1 ? [3, 2, 1, 0] : [0, 1, 2, 3];

    for (const r of rowIndices) {
      for (const c of colIndices) {
        const tile = this.grid[r][c];
        if (tile !== null) {
          const farthest = traverse(r, c, vector.dr, vector.dc);
          const nextR = farthest.r + vector.dr;
          const nextC = farthest.c + vector.dc;

          if (
            nextR >= 0 && nextR < this.size &&
            nextC >= 0 && nextC < this.size &&
            this.grid[nextR][nextC] !== null &&
            this.grid[nextR][nextC].value === tile.value &&
            !merged[nextR][nextC]
          ) {
            const targetTile = this.grid[nextR][nextC];
            const newValue = tile.value * 2;

            this.grid[nextR][nextC] = {
              id: this.tileIdCounter++,
              value: newValue,
              r: nextR,
              c: nextC,
              isNew: false,
              mergedFrom: [targetTile, { ...tile, r: nextR, c: nextC }]
            };

            this.grid[r][c] = null;
            merged[nextR][nextC] = 1;
            scoreIncrease += newValue;
            moved = true;
            if (newValue === this.target) this.won = true;
          } else if (farthest.r !== r || farthest.c !== c) {
            this.grid[farthest.r][farthest.c] = tile;
            tile.r = farthest.r;
            tile.c = farthest.c;
            this.grid[r][c] = null;
            moved = true;
          }
        }
      }
    }

    if (moved) {
      this.score += scoreIncrease;
      this.addRandomTile();
      if (this.getAvailableCells().length === 0 && !this.movesAvailable()) {
        this.over = true;
      }
    }

    return { moved, scoreIncrease, grid: this.grid };
  }

  movesAvailable() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.grid[r][c];
        if (tile === null) return true;
        if (r < this.size - 1 && this.grid[r + 1][c] !== null && tile.value === this.grid[r + 1][c].value) return true;
        if (c < this.size - 1 && this.grid[r][c + 1] !== null && tile.value === this.grid[r][c + 1].value) return true;
      }
    }
    return false;
  }
}
