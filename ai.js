export class AI {
  constructor(game) {
    this.game = game;
    this.nodes = 0;
    this.tt = new Map();
    this.startTime = 0;
    this.timeLimit = 50;

    this.LINES = {
      0: [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]],
      1: [[3, 2, 1, 0], [7, 6, 5, 4], [11, 10, 9, 8], [15, 14, 13, 12]],
      2: [[12, 8, 4, 0], [13, 9, 5, 1], [14, 10, 6, 2], [15, 11, 7, 3]],
      3: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]],
    };

    const baseSnake = [
      2 ** 1, 2 ** 2, 2 ** 3, 2 ** 4,
      2 ** 8, 2 ** 7, 2 ** 6, 2 ** 5,
      2 ** 9, 2 ** 10, 2 ** 11, 2 ** 12,
      2 ** 16, 2 ** 15, 2 ** 14, 2 ** 13
    ];
    this.snakePatterns = this.generateRotationsAndReflections(baseSnake);
  }

  generateRotationsAndReflections(flatMatrix) {
    const patterns = [];
    const matrix = [
      flatMatrix.slice(0, 4),
      flatMatrix.slice(4, 8),
      flatMatrix.slice(8, 12),
      flatMatrix.slice(12, 16)
    ];

    let current = matrix;
    for (let i = 0; i < 4; i++) {
      patterns.push(this.flatten(current));
      patterns.push(this.flatten(this.reflect(current)));
      current = this.rotate(current);
    }
    return patterns;
  }

  flatten(matrix) {
    const result = new Float64Array(16);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        result[r * 4 + c] = matrix[r][c];
      }
    }
    return result;
  }

  rotate(matrix) {
    const result = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        result[c][3 - r] = matrix[r][c];
      }
    }
    return result;
  }

  reflect(matrix) {
    const result = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        result[r][3 - c] = matrix[r][c];
      }
    }
    return result;
  }

  hash(grid) {
    let str = '';
    for (let i = 0; i < 16; i++) {
      if (grid[i] > 0) str += i + ':' + grid[i] + ',';
    }
    return str;
  }

  evaluate(grid) {
    let empty = 0;
    let maxSnake = 0;

    for (let i = 0; i < 16; i++) {
      if (grid[i] === 0) empty++;
    }

    for (let p = 0; p < this.snakePatterns.length; p++) {
      const pattern = this.snakePatterns[p];
      let score = 0;
      for (let i = 0; i < 16; i++) {
        if (grid[i] !== 0) {
          score += grid[i] * pattern[i];
        }
      }
      if (score > maxSnake) maxSnake = score;
    }

    let mono = 0;
    for (let r = 0; r < 4; r++) {
      let rmono1 = 0, rmono2 = 0;
      for (let c = 0; c < 3; c++) {
        if (grid[r * 4 + c] >= grid[r * 4 + c + 1]) rmono1++;
        if (grid[r * 4 + c] <= grid[r * 4 + c + 1]) rmono2++;
      }
      mono += Math.max(rmono1, rmono2);
    }
    for (let c = 0; c < 4; c++) {
      let cmono1 = 0, cmono2 = 0;
      for (let r = 0; r < 3; r++) {
        if (grid[r * 4 + c] >= grid[(r + 1) * 4 + c]) cmono1++;
        if (grid[r * 4 + c] <= grid[(r + 1) * 4 + c]) cmono2++;
      }
      mono += Math.max(cmono1, cmono2);
    }

    return maxSnake + (empty * 10000000) + (mono * 500000);
  }

  simulateMove(grid, direction) {
    let moved = false;
    const nextGrid = new Int32Array(16);
    const lines = this.LINES[direction];

    for (let i = 0; i < 4; i++) {
      const line = lines[i];
      let writeIdx = 0;
      let lastVal = 0;

      for (let j = 0; j < 4; j++) {
        const val = grid[line[j]];
        if (val !== 0) {
          if (lastVal === 0) {
            lastVal = val;
          } else if (lastVal === val) {
            nextGrid[line[writeIdx++]] = val * 2;
            lastVal = 0;
          } else {
            nextGrid[line[writeIdx++]] = lastVal;
            lastVal = val;
          }
        }
      }
      if (lastVal !== 0) {
        nextGrid[line[writeIdx++]] = lastVal;
      }
    }

    for (let i = 0; i < 16; i++) {
      if (grid[i] !== nextGrid[i]) {
        moved = true;
        break;
      }
    }

    return { moved, grid: nextGrid };
  }

  search(grid, depth, isRoot = false) {
    if (performance.now() - this.startTime > this.timeLimit) throw 'TIMEOUT';
    this.nodes++;

    const hashKey = this.hash(grid);
    if (!isRoot && this.tt.has(hashKey)) {
      const cached = this.tt.get(hashKey);
      if (cached.depth >= depth) return { score: cached.score };
    }

    if (depth === 0) {
      const score = this.evaluate(grid);
      this.tt.set(hashKey, { depth, score });
      return { score };
    }

    let bestScore = -Infinity;
    let bestMove = -1;
    let evals = [null, null, null, null];

    for (let dir = 0; dir < 4; dir++) {
      const { moved, grid: nextGrid } = this.simulateMove(grid, dir);
      if (moved) {
        let minScore = Infinity;

        const emptyCells = [];
        for (let i = 0; i < 16; i++) {
          if (nextGrid[i] === 0) emptyCells.push(i);
        }

        if (emptyCells.length === 0) {
          minScore = this.search(nextGrid, depth - 1).score;
        } else {
          for (let i = 0; i < emptyCells.length; i++) {
            const cell = emptyCells[i];
            nextGrid[cell] = 2;
            const childResult = this.search(nextGrid, depth - 1);
            const moveScore = childResult.score;
            nextGrid[cell] = 0;
            if (moveScore < minScore) minScore = moveScore;
          }
        }

        evals[dir] = minScore;
        if (minScore > bestScore) {
          bestScore = minScore;
          bestMove = dir;
        }
      }
    }

    if (bestMove === -1) {
      bestScore = this.evaluate(grid);
    }

    if (!isRoot) {
      this.tt.set(hashKey, { depth, score: bestScore });
    }

    return { move: bestMove, score: bestScore, evals };
  }

  getBestMove() {
    this.nodes = 0;
    this.tt.clear();
    this.startTime = performance.now();

    const intGrid = new Int32Array(16);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.game.grid[r][c] !== null) {
          intGrid[r * 4 + c] = this.game.grid[r][c].value;
        }
      }
    }

    let bestMove = -1;
    let bestEvals = [null, null, null, null];
    let reachedDepth = 0;

    for (let depth = 1; depth <= 20; depth++) {
      try {
        const result = this.search(intGrid, depth, true);
        if (result.move !== -1) {
          bestMove = result.move;
          bestEvals = result.evals;
        }
        reachedDepth = depth;
      } catch (e) {
        if (e === 'TIMEOUT') break;
        throw e;
      }
    }

    return { move: bestMove, evals: bestEvals, depth: reachedDepth, nodes: this.nodes };
  }
}
